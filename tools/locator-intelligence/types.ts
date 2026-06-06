/**
 * Shared types for every stage of the Locator Intelligence pipeline.
 *
 *   scan -> store -> parse -> bind -> generate -> execute -> report
 *
 * Each stage reads the artifact produced by the previous stage and writes its
 * own, so the types here double as the on-disk contract between stages.
 */

export type SelectorKind =
  | 'data-testid'
  | 'role'
  | 'aria-label'
  | 'text'
  | 'placeholder'
  | 'label';

export type PlaywrightStrategy =
  | 'getByTestId'
  | 'getByRole'
  | 'getByLabel'
  | 'getByText'
  | 'getByPlaceholder';

export interface SourceLocation {
  filePath: string;
  line: number;
  column: number;
}

/** A single selector discovered by the scanner. */
export interface ScannedSelector {
  /** Stable hash of (kind + value + registryPath). */
  id: string;
  kind: SelectorKind;
  /** The literal selector value, e.g. `patient-add-btn`. */
  value: string;
  /** Dotted path into the TEST_IDS registry when resolvable, e.g. `patients.addBtn`. */
  registryPath?: string;
  /** True when the value comes from a dynamic factory, e.g. `patient-row-:id`. */
  templated: boolean;
  strategy: PlaywrightStrategy;
  source: SourceLocation;
  componentName?: string;
  module: string;
}

export interface SelectorManifest {
  schemaVersion: number;
  repoRoot: string;
  framework: string;
  scannedAt: string;
  filesScanned: number;
  selectors: ScannedSelector[];
}

/** A versioned value in a registry entry's history. */
export interface RegistryVersion {
  version: number;
  value: string;
  strategy: PlaywrightStrategy;
  kind: SelectorKind;
  source: SourceLocation;
  recordedAt: string;
}

/** One logical selector tracked across scans (identity = key). */
export interface RegistryEntry {
  /** Stable logical identity: registryPath when known, else semantic key. */
  key: string;
  kind: SelectorKind;
  strategy: PlaywrightStrategy;
  /** Current selector value. */
  value: string;
  templated: boolean;
  version: number;
  firstSeen: string;
  lastSeen: string;
  source: SourceLocation;
  history: RegistryVersion[];
  status: 'active' | 'removed';
}

export interface SelectorRegistry {
  schemaVersion: number;
  updatedAt: string;
  entries: RegistryEntry[];
}

export type DriftType = 'added' | 'removed' | 'changed';

export interface DriftRecord {
  key: string;
  type: DriftType;
  previousValue?: string;
  currentValue?: string;
  fromVersion?: number;
  toVersion?: number;
  source?: SourceLocation;
}

export interface DriftReport {
  generatedAt: string;
  total: number;
  added: number;
  removed: number;
  changed: number;
  records: DriftRecord[];
}

// ---------------------------------------------------------------------------
// Gherkin
// ---------------------------------------------------------------------------

export type StepKeyword = 'Given' | 'When' | 'Then' | 'And' | 'But';

export interface GherkinStep {
  keyword: StepKeyword;
  /** Keyword resolved through And/But to the controlling Given/When/Then. */
  resolvedKeyword: 'Given' | 'When' | 'Then';
  text: string;
  line: number;
  table?: string[][];
  docString?: string;
}

export interface GherkinScenario {
  name: string;
  tags: string[];
  line: number;
  steps: GherkinStep[];
  isOutline: boolean;
  examples?: { headers: string[]; rows: string[][] };
}

export interface GherkinFeature {
  name: string;
  description: string;
  tags: string[];
  filePath: string;
  background: GherkinStep[];
  scenarios: GherkinScenario[];
}

export interface ParsedFeatures {
  parsedAt: string;
  features: GherkinFeature[];
}

// ---------------------------------------------------------------------------
// Binding
// ---------------------------------------------------------------------------

/** A concrete action the runtime / generator can emit. */
export interface BoundAction {
  /** Logical operation, e.g. `click`, `fill`, `expectVisible`, `workflow`. */
  op: string;
  /** The POM method this step maps to, e.g. `clickAddPatient`. */
  pomMethod?: string;
  /** Page object the method belongs to, e.g. `PatientsPage`. */
  pageObject?: string;
  /** Logical selector keys this action depends on. */
  selectorKeys: string[];
  /** Captured arguments from the step text. */
  args: Record<string, string>;
  /** Free-form code line(s) for the generated method body. */
  body: string[];
}

export interface BoundStep {
  feature: string;
  scenario: string;
  step: GherkinStep;
  matchedPattern?: string;
  action?: BoundAction;
  mapped: boolean;
}

export interface PomMethodSpec {
  pageObject: string;
  name: string;
  /** Parameter names for the method signature. */
  params: string[];
  selectorKeys: string[];
  body: string[];
}

export interface BindingResult {
  boundAt: string;
  steps: BoundStep[];
  mappedCount: number;
  unmappedCount: number;
  unmappedSteps: { feature: string; scenario: string; text: string; line: number }[];
  /** De-duplicated POM methods required by the bound steps. */
  requiredMethods: PomMethodSpec[];
}

// ---------------------------------------------------------------------------
// Execution
// ---------------------------------------------------------------------------

export type TestStatus = 'passed' | 'failed' | 'skipped' | 'timedOut' | 'unknown';

export interface TestResult {
  spec: string;
  title: string;
  status: TestStatus;
  durationMs: number;
  error?: string;
}

export interface ExecutionResults {
  ranAt: string;
  mode: 'playwright' | 'simulated' | 'skipped';
  command?: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  note?: string;
  results: TestResult[];
}

// ---------------------------------------------------------------------------
// POM lifecycle
// ---------------------------------------------------------------------------

export type PomMethodChange = 'generated' | 'updated' | 'preserved' | 'unchanged';

export interface PomMethodReport {
  pageObject: string;
  method: string;
  kind: 'generated' | 'custom';
  change: PomMethodChange;
  selectorKeys: string[];
}

export interface PomLifecycleReport {
  generatedAt: string;
  pages: {
    pageObject: string;
    file: string;
    created: boolean;
    generatedMethods: number;
    updatedMethods: number;
    customMethods: number;
  }[];
  methods: PomMethodReport[];
}
