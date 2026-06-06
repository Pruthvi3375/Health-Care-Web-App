import { CONFIG } from '../config.ts';
import type { BindingResult, BoundStep } from '../types.ts';
import { ensureDir, relativeToRepo, writeText, log } from '../util.ts';
import { pascalToCamel } from '../bind/binder.ts';

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function pageFileBase(pageObject: string): string {
  return pageObject.replace(/Page$/, '').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/** Group bound steps by feature, then by scenario, preserving order. */
function group(steps: BoundStep[]): Map<string, Map<string, BoundStep[]>> {
  const byFeature = new Map<string, Map<string, BoundStep[]>>();
  for (const s of steps) {
    const scenarios = byFeature.get(s.feature) ?? new Map<string, BoundStep[]>();
    const list = scenarios.get(s.scenario) ?? [];
    list.push(s);
    scenarios.set(s.scenario, list);
    byFeature.set(s.feature, scenarios);
  }
  return byFeature;
}

/** Generate Playwright spec files from the bound steps. */
export function generateSpecs(binding: BindingResult): { files: string[] } {
  log.step('Generate — emitting Playwright specs');
  ensureDir(CONFIG.generatedSpecsDir);

  // method signature lookup so call-site args are emitted in the right order
  const paramsByMethod = new Map<string, string[]>();
  for (const m of binding.requiredMethods) {
    paramsByMethod.set(`${m.pageObject}.${m.name}`, m.params);
  }

  const grouped = group(binding.steps);
  const files: string[] = [];

  for (const [feature, scenarios] of grouped) {
    const usedPages = new Set<string>();
    for (const scenario of scenarios.values()) {
      for (const s of scenario) if (s.action?.pageObject) usedPages.add(s.action.pageObject);
    }

    const imports = [
      "import { test, expect } from '@playwright/test';",
      ...[...usedPages]
        .sort()
        .map((p) => `import { ${p} } from '../pages/${pageFileBase(p)}.page';`),
    ];

    const lines: string[] = [...imports, '', `test.describe(${JSON.stringify(feature)}, () => {`];

    for (const [scenarioName, steps] of scenarios) {
      const hasUnmapped = steps.some((s) => !s.mapped);
      const testFn = hasUnmapped ? 'test.fixme' : 'test';
      lines.push('');
      lines.push(`  ${testFn}(${JSON.stringify(scenarioName)}, async ({ page }) => {`);

      const pagesHere = new Set<string>();
      for (const s of steps) if (s.action?.pageObject) pagesHere.add(s.action.pageObject);
      for (const p of [...pagesHere].sort()) {
        lines.push(`    const ${pascalToCamel(p)} = new ${p}(page);`);
      }
      if (pagesHere.size > 0) lines.push('');

      for (const s of steps) {
        lines.push(`    // ${s.step.keyword} ${s.step.text}`);
        if (s.mapped && s.action?.pageObject && s.action.pomMethod) {
          const params = paramsByMethod.get(`${s.action.pageObject}.${s.action.pomMethod}`) ?? [];
          const args = params.map((p) => JSON.stringify(s.action!.args[p] ?? '')).join(', ');
          lines.push(`    await ${pascalToCamel(s.action.pageObject)}.${s.action.pomMethod}(${args});`);
        } else {
          lines.push(`    // UNMAPPED — no binding for this step (see report)`);
        }
      }
      lines.push('  });');
    }

    lines.push('});', '');

    const file = `${CONFIG.generatedSpecsDir}/${slug(feature)}.spec.ts`;
    writeText(file, lines.join('\n'));
    files.push(relativeToRepo(file));
    log.ok(`Spec → ${relativeToRepo(file)} (${scenarios.size} scenario(s))`);
  }

  return { files };
}
