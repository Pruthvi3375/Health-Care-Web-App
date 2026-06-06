import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { CONFIG } from './config.ts';

export const log = {
  step(title: string): void {
    console.log(`\n\x1b[1m\x1b[36m▶ ${title}\x1b[0m`);
  },
  info(msg: string): void {
    console.log(`  ${msg}`);
  },
  ok(msg: string): void {
    console.log(`  \x1b[32m✓\x1b[0m ${msg}`);
  },
  warn(msg: string): void {
    console.log(`  \x1b[33m!\x1b[0m ${msg}`);
  },
  err(msg: string): void {
    console.log(`  \x1b[31m✗\x1b[0m ${msg}`);
  },
};

export function shortHash(...parts: string[]): string {
  return createHash('sha1').update(parts.join('::')).digest('hex').slice(0, 16);
}

export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

export function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(file: string, data: unknown): void {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export function writeText(file: string, text: string): void {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, text, 'utf8');
}

export function relativeToRepo(absPath: string): string {
  return path.relative(CONFIG.repoRoot, absPath).split(path.sep).join('/');
}

/** Recursively collect files under `dir` whose extension matches one in `exts`. */
export function walkFiles(dir: string, exts: string[]): string[] {
  const out: string[] = [];
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || !fs.existsSync(current)) continue;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
        stack.push(full);
      } else if (exts.some((e) => entry.name.endsWith(e))) {
        out.push(full);
      }
    }
  }
  return out.sort();
}

/** Convert a 0-based character offset into a 1-based line/column. */
export function offsetToLineCol(text: string, offset: number): { line: number; column: number } {
  let line = 1;
  let last = 0;
  for (let i = 0; i < offset && i < text.length; i++) {
    if (text[i] === '\n') {
      line++;
      last = i + 1;
    }
  }
  return { line, column: offset - last + 1 };
}

/**
 * Load and flatten the app's TEST_IDS registry into a lookup map.
 *
 * We evaluate the object literal directly (rather than importing the module)
 * so the toolkit has zero coupling to the app's module resolution. Dynamic id
 * factories such as `(id) => ` + "`patient-row-${id}`" are invoked with a
 * `:id` placeholder to produce a templated value like `patient-row-:id`.
 *
 * @returns map of dotted path (`patients.addBtn`) -> { value, templated }
 */
export function loadTestIdRegistry(): Map<string, { value: string; templated: boolean }> {
  const map = new Map<string, { value: string; templated: boolean }>();
  let raw: string;
  try {
    raw = fs.readFileSync(CONFIG.testIdsFile, 'utf8');
  } catch {
    return map;
  }

  const start = raw.indexOf('{');
  const asConst = raw.lastIndexOf('}');
  if (start === -1 || asConst === -1) return map;
  const literal = raw.slice(start, asConst + 1);

  let obj: Record<string, unknown>;
  try {
    // The literal is plain JS (string values + arrow factories) once we drop
    // the `as const`. Evaluating in a function scope keeps it self-contained.
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    obj = new Function(`return (${literal});`)() as Record<string, unknown>;
  } catch {
    return map;
  }

  const flatten = (value: unknown, prefix: string): void => {
    if (typeof value === 'string') {
      map.set(prefix, { value, templated: false });
    } else if (typeof value === 'function') {
      try {
        const produced = (value as (...a: unknown[]) => string)(':id', ':id', ':id');
        map.set(prefix, { value: produced, templated: true });
      } catch {
        /* skip un-callable factories */
      }
    } else if (value && typeof value === 'object') {
      for (const [k, v] of Object.entries(value)) {
        flatten(v, prefix ? `${prefix}.${k}` : k);
      }
    }
  };

  flatten(obj, '');
  return map;
}
