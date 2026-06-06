import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/** Repository root (two levels up from tools/locator-intelligence). */
export const REPO_ROOT = path.resolve(here, '..', '..');

const p = (...segments: string[]) => path.join(REPO_ROOT, ...segments);

/**
 * Central path + behaviour configuration for the Locator Intelligence pipeline.
 * Everything the toolkit reads or writes is declared here so the stages stay
 * decoupled and the output layout is easy to reason about.
 */
export const CONFIG = {
  repoRoot: REPO_ROOT,

  /** Source tree that gets scanned for selectors. */
  sourceDir: p('src'),
  testIdsFile: p('src', 'testids', 'index.ts'),
  routeManifestFile: p('src', 'automation', 'manifest.ts'),

  /** Where the running application is served for execution. */
  baseUrl: process.env.LI_BASE_URL ?? 'http://localhost:5173',

  /** All durable pipeline artifacts live under this directory. */
  dataDir: p('.locator-intelligence'),
  selectorManifestFile: p('.locator-intelligence', 'selector-manifest.json'),
  registryFile: p('.locator-intelligence', 'registry.json'),
  parsedFeaturesFile: p('.locator-intelligence', 'parsed-features.json'),
  bindingsFile: p('.locator-intelligence', 'bindings.json'),
  pomReportFile: p('.locator-intelligence', 'pom-lifecycle.json'),
  executionResultsFile: p('.locator-intelligence', 'execution-results.json'),
  reportsDir: p('.locator-intelligence', 'reports'),
  reportJsonFile: p('.locator-intelligence', 'reports', 'report.json'),
  reportHtmlFile: p('.locator-intelligence', 'reports', 'report.html'),
  driftReportFile: p('.locator-intelligence', 'reports', 'drift.json'),

  /** Human-authored Gherkin specs. */
  featuresDir: p('features'),

  /** Generated Playwright artifacts. */
  testsDir: p('tests'),
  pagesDir: p('tests', 'pages'),
  generatedSpecsDir: p('tests', 'generated'),
  playwrightConfigFile: p('playwright.config.ts'),

  scanGlobs: ['.tsx'],
} as const;

export type Config = typeof CONFIG;
