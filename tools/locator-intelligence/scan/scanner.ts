import fs from 'node:fs';
import { CONFIG } from '../config.ts';
import type {
  PlaywrightStrategy,
  ScannedSelector,
  SelectorKind,
  SelectorManifest,
} from '../types.ts';
import {
  loadTestIdRegistry,
  offsetToLineCol,
  relativeToRepo,
  shortHash,
  walkFiles,
  writeJson,
  log,
} from '../util.ts';

interface RawMatch {
  kind: SelectorKind;
  strategy: PlaywrightStrategy;
  /** Raw attribute/prop expression captured from source. */
  expr: string;
  offset: number;
}

const STRATEGY_BY_KIND: Record<SelectorKind, PlaywrightStrategy> = {
  'data-testid': 'getByTestId',
  role: 'getByRole',
  'aria-label': 'getByLabel',
  label: 'getByLabel',
  text: 'getByText',
  placeholder: 'getByPlaceholder',
};

/**
 * Capture selector-bearing attributes/props. We intentionally lean on the
 * codebase's consistent conventions (`testId` props + `data-testid`,
 * `aria-label`, `role`, `placeholder`) rather than a full TSX parse: it keeps
 * the scanner dependency-free while staying accurate for this repo.
 */
const PATTERNS: { kind: SelectorKind; re: RegExp }[] = [
  // testId / rowTestId / confirmTestId / cancelTestId props (JSX expression form)
  { kind: 'data-testid', re: /\b\w*[tT]estId=\{([^}]+)\}/g },
  // testId="literal" prop
  { kind: 'data-testid', re: /\b\w*[tT]estId="([^"]+)"/g },
  // data-testid attribute, expression or string form
  { kind: 'data-testid', re: /data-testid=\{([^}]+)\}/g },
  { kind: 'data-testid', re: /data-testid="([^"]+)"/g },
  { kind: 'aria-label', re: /aria-label="([^"]+)"/g },
  { kind: 'role', re: /\brole="([^"]+)"/g },
  { kind: 'placeholder', re: /placeholder="([^"]+)"/g },
];

interface FnRange {
  name: string;
  start: number;
  end: number;
}

/** Find component/function declarations so a match can be attributed to one. */
function functionRanges(text: string): FnRange[] {
  const ranges: FnRange[] = [];
  const re = /(?:export\s+)?function\s+([A-Z]\w+)\s*\(/g;
  let m: RegExpExecArray | null;
  const starts: { name: string; start: number }[] = [];
  while ((m = re.exec(text)) !== null) {
    starts.push({ name: m[1], start: m.index });
  }
  for (let i = 0; i < starts.length; i++) {
    ranges.push({
      name: starts[i].name,
      start: starts[i].start,
      end: i + 1 < starts.length ? starts[i + 1].start : text.length,
    });
  }
  return ranges;
}

function componentAt(ranges: FnRange[], offset: number): string | undefined {
  for (const r of ranges) {
    if (offset >= r.start && offset < r.end) return r.name;
  }
  return undefined;
}

function resolve(
  expr: string,
  testIds: Map<string, { value: string; templated: boolean }>
): { value: string; registryPath?: string; templated: boolean } | null {
  const trimmed = expr.trim();

  // TEST_IDS.a.b  or  TEST_IDS.a.b(args)
  const idMatch = trimmed.match(/TEST_IDS\.([\w.]+?)(\s*\()?/);
  if (idMatch) {
    const registryPath = idMatch[1];
    const isCall = Boolean(idMatch[2]);
    const found = testIds.get(registryPath);
    if (found) {
      return { value: found.value, registryPath, templated: found.templated || isCall };
    }
    // Unknown path but clearly a registry reference – keep the path as value.
    return { value: registryPath, registryPath, templated: isCall };
  }

  // Template literal: `${testId}-error`, `dashboard-${x}` ...
  if (trimmed.startsWith('`')) {
    const normalized = trimmed
      .replace(/^`|`$/g, '')
      .replace(/\$\{[^}]+\}/g, ':var');
    return { value: normalized, templated: true };
  }

  // Arrow factory referencing TEST_IDS: (r) => TEST_IDS.patients.row(r.id)
  const arrow = trimmed.match(/=>\s*TEST_IDS\.([\w.]+)/);
  if (arrow) {
    const registryPath = arrow[1];
    const found = testIds.get(registryPath);
    return {
      value: found?.value ?? registryPath,
      registryPath,
      templated: true,
    };
  }

  // Plain string literal captured by the string-form patterns.
  if (!trimmed.includes('{') && !trimmed.includes('(') && !trimmed.includes('=>')) {
    return { value: trimmed.replace(/^["'`]|["'`]$/g, ''), templated: false };
  }

  return null;
}

/** Scan the source tree and produce the selector manifest. */
export function scan(): SelectorManifest {
  log.step('Scan — extracting selectors from source');
  const testIds = loadTestIdRegistry();
  log.info(`Loaded ${testIds.size} entries from TEST_IDS registry`);

  const files = walkFiles(CONFIG.sourceDir, [...CONFIG.scanGlobs]);
  const selectors: ScannedSelector[] = [];
  const seen = new Set<string>();

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const ranges = functionRanges(text);
    const rel = relativeToRepo(file);
    const moduleDir = rel.split('/').slice(0, -1).join('/');

    const matches: RawMatch[] = [];
    for (const { kind, re } of PATTERNS) {
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        matches.push({
          kind,
          strategy: STRATEGY_BY_KIND[kind],
          expr: m[1],
          offset: m.index,
        });
      }
    }

    for (const raw of matches) {
      const resolved = resolve(raw.expr, testIds);
      if (!resolved || !resolved.value) continue;
      // Ignore CSS-ish noise and accessibility values that aren't useful locators.
      if (resolved.value.length < 2) continue;

      const id = shortHash(raw.kind, resolved.value, resolved.registryPath ?? rel);
      const dedupeKey = `${raw.kind}::${resolved.value}::${resolved.registryPath ?? ''}::${rel}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      const pos = offsetToLineCol(text, raw.offset);
      selectors.push({
        id,
        kind: raw.kind,
        value: resolved.value,
        registryPath: resolved.registryPath,
        templated: resolved.templated,
        strategy: raw.strategy,
        source: { filePath: rel, line: pos.line, column: pos.column },
        componentName: componentAt(ranges, raw.offset),
        module: moduleDir,
      });
    }
  }

  selectors.sort((a, b) => (a.registryPath ?? a.value).localeCompare(b.registryPath ?? b.value));

  const manifest: SelectorManifest = {
    schemaVersion: 1,
    repoRoot: CONFIG.repoRoot,
    framework: 'react',
    scannedAt: new Date().toISOString(),
    filesScanned: files.length,
    selectors,
  };

  writeJson(CONFIG.selectorManifestFile, manifest);
  log.ok(`Scanned ${files.length} files, found ${selectors.length} selectors`);
  log.info(`Manifest → ${relativeToRepo(CONFIG.selectorManifestFile)}`);
  return manifest;
}
