import fs from 'node:fs';
import { CONFIG } from '../config.ts';
import type {
  GherkinFeature,
  GherkinScenario,
  GherkinStep,
  ParsedFeatures,
  StepKeyword,
} from '../types.ts';
import { relativeToRepo, walkFiles, writeJson, log } from '../util.ts';

const STEP_KEYWORDS: StepKeyword[] = ['Given', 'When', 'Then', 'And', 'But'];

function parseTags(line: string): string[] {
  return line
    .trim()
    .split(/\s+/)
    .filter((t) => t.startsWith('@'))
    .map((t) => t.slice(1));
}

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((c) => c.trim());
}

/**
 * A pragmatic, dependency-free Gherkin parser. It supports the subset this
 * pipeline needs: Feature, Background, Scenario, Scenario Outline + Examples,
 * tags, data tables, and doc strings.
 */
export function parseFeatureFile(filePath: string): GherkinFeature {
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/);

  const feature: GherkinFeature = {
    name: '',
    description: '',
    tags: [],
    filePath: relativeToRepo(filePath),
    background: [],
    scenarios: [],
  };

  let pendingTags: string[] = [];
  let section: 'none' | 'feature' | 'background' | 'scenario' | 'examples' = 'none';
  let current: GherkinScenario | null = null;
  let lastResolved: 'Given' | 'When' | 'Then' = 'Given';
  let inDocString = false;
  let docBuffer: string[] = [];
  const descLines: string[] = [];

  const flushScenario = () => {
    if (current) feature.scenarios.push(current);
    current = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (inDocString) {
      if (line === '"""') {
        const step = lastStep(current, feature, section);
        if (step) step.docString = docBuffer.join('\n');
        docBuffer = [];
        inDocString = false;
      } else {
        docBuffer.push(rawLine);
      }
      continue;
    }

    if (!line || line.startsWith('#')) continue;

    if (line.startsWith('@')) {
      pendingTags = parseTags(line);
      continue;
    }

    if (line.startsWith('Feature:')) {
      feature.name = line.slice('Feature:'.length).trim();
      feature.tags = pendingTags;
      pendingTags = [];
      section = 'feature';
      continue;
    }

    if (line.startsWith('Background:')) {
      flushScenario();
      section = 'background';
      lastResolved = 'Given';
      continue;
    }

    if (line.startsWith('Scenario Outline:') || line.startsWith('Scenario:')) {
      flushScenario();
      const isOutline = line.startsWith('Scenario Outline:');
      const name = line.slice(line.indexOf(':') + 1).trim();
      current = { name, tags: pendingTags, line: i + 1, steps: [], isOutline };
      pendingTags = [];
      section = 'scenario';
      lastResolved = 'Given';
      continue;
    }

    if (line.startsWith('Examples:')) {
      section = 'examples';
      if (current) current.examples = { headers: [], rows: [] };
      continue;
    }

    if (line.startsWith('"""')) {
      inDocString = true;
      docBuffer = [];
      continue;
    }

    if (line.startsWith('|')) {
      const cells = splitTableRow(line);
      if (section === 'examples' && current?.examples) {
        if (current.examples.headers.length === 0) current.examples.headers = cells;
        else current.examples.rows.push(cells);
      } else {
        const step = lastStep(current, feature, section);
        if (step) {
          step.table = step.table ?? [];
          step.table.push(cells);
        }
      }
      continue;
    }

    const keyword = STEP_KEYWORDS.find((k) => line.startsWith(`${k} `));
    if (keyword) {
      const textPart = line.slice(keyword.length).trim();
      let resolved: 'Given' | 'When' | 'Then';
      if (keyword === 'Given' || keyword === 'When' || keyword === 'Then') {
        resolved = keyword;
        lastResolved = keyword;
      } else {
        resolved = lastResolved;
      }
      const step: GherkinStep = { keyword, resolvedKeyword: resolved, text: textPart, line: i + 1 };
      if (section === 'background') feature.background.push(step);
      else if (current) current.steps.push(step);
      continue;
    }

    if (section === 'feature') descLines.push(line);
  }

  flushScenario();
  feature.description = descLines.join(' ').trim();
  return feature;
}

function lastStep(
  current: GherkinScenario | null,
  feature: GherkinFeature,
  section: string
): GherkinStep | undefined {
  if (section === 'background') return feature.background[feature.background.length - 1];
  return current?.steps[current.steps.length - 1];
}

/** Parse every `.feature` file under the features directory. */
export function parse(): ParsedFeatures {
  log.step('Parse — processing Gherkin feature files');
  const files = walkFiles(CONFIG.featuresDir, ['.feature']);
  const features = files.map(parseFeatureFile);

  const parsed: ParsedFeatures = { parsedAt: new Date().toISOString(), features };
  writeJson(CONFIG.parsedFeaturesFile, parsed);

  const scenarioCount = features.reduce((n, f) => n + f.scenarios.length, 0);
  const stepCount = features.reduce(
    (n, f) => n + f.scenarios.reduce((s, sc) => s + sc.steps.length, 0) + f.background.length,
    0
  );
  log.ok(`Parsed ${features.length} feature(s), ${scenarioCount} scenario(s), ${stepCount} step(s)`);
  log.info(`Parsed features → ${relativeToRepo(CONFIG.parsedFeaturesFile)}`);
  return parsed;
}
