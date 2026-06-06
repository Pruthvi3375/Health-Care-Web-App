import { CONFIG } from '../config.ts';
import type {
  BindingResult,
  BoundAction,
  BoundStep,
  GherkinStep,
  ParsedFeatures,
  PlaywrightStrategy,
  PomMethodSpec,
  SelectorRegistry,
} from '../types.ts';
import { readJson, relativeToRepo, writeJson, log } from '../util.ts';
import { loadRegistry } from '../store/store.ts';
import { AUTH, BUTTON_LABELS, PAGES, ROLE_CREDENTIALS, TOAST_KEY, type PageInfo } from './vocabulary.ts';

interface BindContext {
  registry: Map<string, { value: string; strategy: PlaywrightStrategy }>;
  /** Logical page the user is currently interacting with. */
  page?: PageInfo;
}

/** Build a Playwright locator expression for a logical selector key. */
function locator(ctx: BindContext, key: string): string {
  const entry = ctx.registry.get(key);
  if (!entry) {
    // Selector not in registry — emit a clearly-marked fallback so the gap is
    // visible in the generated code and the coverage report.
    return `this.page.getByTestId('${key}') /* TODO: selector "${key}" missing from registry */`;
  }
  const v = entry.value.replace(/'/g, "\\'");
  switch (entry.strategy) {
    case 'getByRole':
      return `this.page.getByRole('${v}')`;
    case 'getByLabel':
      return `this.page.getByLabel('${v}')`;
    case 'getByText':
      return `this.page.getByText('${v}')`;
    case 'getByPlaceholder':
      return `this.page.getByPlaceholder('${v}')`;
    default:
      return `this.page.getByTestId('${v}')`;
  }
}

function pascalToCamel(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function camelize(label: string): string {
  const parts = label.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ');
  return parts.map((p, i) => (i === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1))).join('');
}

interface MatchOutcome {
  action: BoundAction;
  method?: PomMethodSpec;
  /** Mutates context (e.g. navigation changes the active page). */
  after?: (ctx: BindContext) => void;
}

type StepHandler = (m: RegExpMatchArray, ctx: BindContext) => MatchOutcome | null;

interface StepPattern {
  id: string;
  re: RegExp;
  handle: StepHandler;
}

function method(spec: PomMethodSpec): PomMethodSpec {
  return spec;
}

/**
 * Ordered step patterns. The first pattern whose regex matches a step wins.
 * Each handler returns the bound action plus the POM method it requires.
 */
const PATTERNS: StepPattern[] = [
  {
    id: 'on-login-page',
    re: /^I am on the login page$/i,
    handle: (_m, ctx) => {
      const page = PAGES.login;
      return {
        action: { op: 'navigate', pageObject: page.object, pomMethod: 'goto', selectorKeys: [page.pageKey], args: {}, body: [] },
        method: method({
          pageObject: page.object,
          name: 'goto',
          params: [],
          selectorKeys: [page.pageKey],
          body: [`await this.page.goto('${page.route}');`, `await expect(${locator(ctx, page.pageKey)}).toBeVisible();`],
        }),
        after: (c) => (c.page = page),
      };
    },
  },
  {
    id: 'login-as',
    re: /^I (?:am logged in|log in) as "(\w+)"$/i,
    handle: (m, ctx) => {
      const role = m[1].toLowerCase();
      const page = PAGES.login;
      return {
        action: {
          op: 'workflow',
          pageObject: page.object,
          pomMethod: 'loginAs',
          selectorKeys: [AUTH.email, AUTH.password, AUTH.submit],
          args: { role },
          body: [],
        },
        method: method({
          pageObject: page.object,
          name: 'loginAs',
          params: ['role'],
          selectorKeys: [AUTH.email, AUTH.password, AUTH.submit],
          body: [
            `const table: Record<string, { email: string; password: string }> = ${JSON.stringify(ROLE_CREDENTIALS)};`,
            `const creds = table[role];`,
            `await this.page.goto('${page.route}');`,
            `await ${locator(ctx, AUTH.email)}.fill(creds.email);`,
            `await ${locator(ctx, AUTH.password)}.fill(creds.password);`,
            `await ${locator(ctx, AUTH.submit)}.click();`,
          ],
        }),
        after: (c) => (c.page = PAGES.dashboard),
      };
    },
  },
  {
    id: 'sign-in-creds',
    re: /^I sign in with email "([^"]+)" and password "([^"]+)"$/i,
    handle: (m, ctx) => {
      const page = PAGES.login;
      return {
        action: {
          op: 'workflow',
          pageObject: page.object,
          pomMethod: 'signIn',
          selectorKeys: [AUTH.email, AUTH.password, AUTH.submit],
          args: { email: m[1], password: m[2] },
          body: [],
        },
        method: method({
          pageObject: page.object,
          name: 'signIn',
          params: ['email', 'password'],
          selectorKeys: [AUTH.email, AUTH.password, AUTH.submit],
          body: [
            `await this.page.goto('${page.route}');`,
            `await ${locator(ctx, AUTH.email)}.fill(email);`,
            `await ${locator(ctx, AUTH.password)}.fill(password);`,
            `await ${locator(ctx, AUTH.submit)}.click();`,
          ],
        }),
      };
    },
  },
  {
    id: 'on-dashboard',
    re: /^I should be on the dashboard$/i,
    handle: (_m, ctx) => {
      const page = PAGES.dashboard;
      return {
        action: { op: 'expectVisible', pageObject: page.object, pomMethod: 'expectLoaded', selectorKeys: [page.pageKey], args: {}, body: [] },
        method: method({
          pageObject: page.object,
          name: 'expectLoaded',
          params: [],
          selectorKeys: [page.pageKey],
          body: [`await expect(${locator(ctx, page.pageKey)}).toBeVisible();`],
        }),
        after: (c) => (c.page = page),
      };
    },
  },
  {
    id: 'auth-error',
    re: /^I should see an authentication error$/i,
    handle: (_m, ctx) => {
      const page = PAGES.login;
      return {
        action: { op: 'expectVisible', pageObject: page.object, pomMethod: 'expectError', selectorKeys: [AUTH.error], args: {}, body: [] },
        method: method({
          pageObject: page.object,
          name: 'expectError',
          params: [],
          selectorKeys: [AUTH.error],
          body: [`await expect(${locator(ctx, AUTH.error)}).toBeVisible();`],
        }),
      };
    },
  },
  {
    id: 'on-named-page',
    re: /^I am on the "(\w+)" page$/i,
    handle: (m, ctx) => {
      const page = PAGES[m[1].toLowerCase()];
      if (!page) return null;
      return {
        action: { op: 'navigate', pageObject: page.object, pomMethod: 'goto', selectorKeys: [page.pageKey], args: {}, body: [] },
        method: method({
          pageObject: page.object,
          name: 'goto',
          params: [],
          selectorKeys: [page.pageKey],
          body: [`await this.page.goto('${page.route}');`, `await expect(${locator(ctx, page.pageKey)}).toBeVisible();`],
        }),
        after: (c) => (c.page = page),
      };
    },
  },
  {
    id: 'click-button',
    re: /^I click the "([^"]+)" button$/i,
    handle: (m, ctx) => {
      const label = m[1].toLowerCase();
      const mapped = BUTTON_LABELS[label];
      if (!mapped) return null;
      const page = PAGES[mapped.page];
      const name = camelize(`click ${m[1]}`);
      return {
        action: { op: 'click', pageObject: page.object, pomMethod: name, selectorKeys: [mapped.key], args: {}, body: [] },
        method: method({
          pageObject: page.object,
          name,
          params: [],
          selectorKeys: [mapped.key],
          body: [`await ${locator(ctx, mapped.key)}.click();`],
        }),
      };
    },
  },
  {
    id: 'fill-field',
    re: /^I fill in "([^"]+)" with "([^"]*)"$/i,
    handle: (m, ctx) => {
      const page = ctx.page;
      if (!page?.fields) return null;
      const key = page.fields[m[1].toLowerCase()];
      if (!key) return null;
      const name = camelize(`fill ${m[1]}`);
      return {
        action: { op: 'fill', pageObject: page.object, pomMethod: name, selectorKeys: [key], args: { value: m[2] }, body: [] },
        method: method({
          pageObject: page.object,
          name,
          params: ['value'],
          selectorKeys: [key],
          body: [`await ${locator(ctx, key)}.fill(value);`],
        }),
      };
    },
  },
  {
    id: 'submit-form',
    re: /^I submit the (\w+) form$/i,
    handle: (m, ctx) => {
      const page = PAGES[m[1].toLowerCase()] ?? ctx.page;
      if (!page?.formSubmitKey) return null;
      return {
        action: { op: 'click', pageObject: page.object, pomMethod: 'submitForm', selectorKeys: [page.formSubmitKey], args: {}, body: [] },
        method: method({
          pageObject: page.object,
          name: 'submitForm',
          params: [],
          selectorKeys: [page.formSubmitKey],
          body: [`await ${locator(ctx, page.formSubmitKey)}.click();`],
        }),
      };
    },
  },
  {
    id: 'search',
    re: /^I search for "([^"]+)"$/i,
    handle: (m, ctx) => {
      const page = ctx.page;
      if (!page?.searchKey) return null;
      return {
        action: { op: 'fill', pageObject: page.object, pomMethod: 'search', selectorKeys: [page.searchKey], args: { term: m[1] }, body: [] },
        method: method({
          pageObject: page.object,
          name: 'search',
          params: ['term'],
          selectorKeys: [page.searchKey],
          body: [`await ${locator(ctx, page.searchKey)}.fill(term);`],
        }),
      };
    },
  },
  {
    id: 'filter-status',
    re: /^I filter (\w+) by status "([^"]+)"$/i,
    handle: (m, ctx) => {
      const page = PAGES[m[1].toLowerCase()] ?? ctx.page;
      if (!page?.statusFilterKey) return null;
      return {
        action: { op: 'select', pageObject: page.object, pomMethod: 'filterByStatus', selectorKeys: [page.statusFilterKey], args: { status: m[2] }, body: [] },
        method: method({
          pageObject: page.object,
          name: 'filterByStatus',
          params: ['status'],
          selectorKeys: [page.statusFilterKey],
          body: [`await ${locator(ctx, page.statusFilterKey)}.selectOption(status);`],
        }),
      };
    },
  },
  {
    id: 'table-visible',
    re: /^the "(\w+)" table should be visible$/i,
    handle: (m, ctx) => {
      const page = PAGES[m[1].toLowerCase()];
      if (!page?.tableKey) return null;
      return {
        action: { op: 'expectVisible', pageObject: page.object, pomMethod: 'expectTableVisible', selectorKeys: [page.tableKey], args: {}, body: [] },
        method: method({
          pageObject: page.object,
          name: 'expectTableVisible',
          params: [],
          selectorKeys: [page.tableKey],
          body: [`await expect(${locator(ctx, page.tableKey)}).toBeVisible();`],
        }),
      };
    },
  },
  {
    id: 'success-toast',
    re: /^I should see a success toast$/i,
    handle: (_m, ctx) => {
      const page = ctx.page ?? PAGES.dashboard;
      return {
        action: { op: 'expectVisible', pageObject: page.object, pomMethod: 'expectToast', selectorKeys: [TOAST_KEY], args: {}, body: [] },
        method: method({
          pageObject: page.object,
          name: 'expectToast',
          params: [],
          selectorKeys: [TOAST_KEY],
          body: [`await expect(${locator(ctx, TOAST_KEY)}).toBeVisible();`],
        }),
      };
    },
  },
  {
    id: 'see-text',
    re: /^I should see "([^"]+)"$/i,
    handle: (m, ctx) => {
      const page = ctx.page ?? PAGES.dashboard;
      return {
        action: { op: 'expectText', pageObject: page.object, pomMethod: 'expectText', selectorKeys: [], args: { text: m[1] }, body: [] },
        method: method({
          pageObject: page.object,
          name: 'expectText',
          params: ['text'],
          selectorKeys: [],
          body: [`await expect(this.page.getByText(text, { exact: false }).first()).toBeVisible();`],
        }),
      };
    },
  },
];

function buildRegistryMap(registry: SelectorRegistry): BindContext['registry'] {
  const map = new Map<string, { value: string; strategy: PlaywrightStrategy }>();
  for (const e of registry.entries) {
    if (e.status === 'active') map.set(e.key, { value: e.value, strategy: e.strategy });
  }
  return map;
}

/** Resolve every parsed step into selectors / POM methods / workflows. */
export function bind(): BindingResult {
  log.step('Bind — resolving steps to selectors and workflows');
  const parsed = readJson<ParsedFeatures>(CONFIG.parsedFeaturesFile, { parsedAt: '', features: [] });
  const registry = loadRegistry();
  const registryMap = buildRegistryMap(registry);

  const boundSteps: BoundStep[] = [];
  const unmapped: BindingResult['unmappedSteps'] = [];
  const methodsByKey = new Map<string, PomMethodSpec>();

  const bindOne = (
    ctx: BindContext,
    featureName: string,
    scenarioName: string,
    step: GherkinStep
  ): void => {
    for (const pattern of PATTERNS) {
      const m = step.text.match(pattern.re);
      if (!m) continue;
      const outcome = pattern.handle(m, ctx);
      if (!outcome) continue; // matched text but not bindable in this context
      if (outcome.method) {
        methodsByKey.set(`${outcome.method.pageObject}.${outcome.method.name}`, outcome.method);
      }
      outcome.after?.(ctx);
      boundSteps.push({ feature: featureName, scenario: scenarioName, step, matchedPattern: pattern.id, action: outcome.action, mapped: true });
      return;
    }
    boundSteps.push({ feature: featureName, scenario: scenarioName, step, mapped: false });
    unmapped.push({ feature: featureName, scenario: scenarioName, text: step.text, line: step.line });
  };

  for (const feature of parsed.features) {
    for (const scenario of feature.scenarios) {
      // Fresh context per scenario; background establishes the starting state.
      const ctx: BindContext = { registry: registryMap };
      for (const step of [...feature.background, ...scenario.steps]) {
        bindOne(ctx, feature.name, scenario.name, step);
      }
    }
  }

  const result: BindingResult = {
    boundAt: new Date().toISOString(),
    steps: boundSteps,
    mappedCount: boundSteps.filter((s) => s.mapped).length,
    unmappedCount: unmapped.length,
    unmappedSteps: unmapped,
    requiredMethods: [...methodsByKey.values()].sort((a, b) =>
      `${a.pageObject}.${a.name}`.localeCompare(`${b.pageObject}.${b.name}`)
    ),
  };

  writeJson(CONFIG.bindingsFile, result);
  log.ok(`Bound ${result.mappedCount}/${boundSteps.length} steps, ${result.unmappedCount} unmapped`);
  log.info(`Required POM methods: ${result.requiredMethods.length}`);
  if (result.unmappedCount > 0) {
    log.warn(`Unmapped steps: ${[...new Set(unmapped.map((u) => u.text))].slice(0, 5).join(' | ')}`);
  }
  log.info(`Bindings → ${relativeToRepo(CONFIG.bindingsFile)}`);
  return result;
}

export { pascalToCamel };
