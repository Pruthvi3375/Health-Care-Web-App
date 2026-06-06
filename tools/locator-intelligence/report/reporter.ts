import { CONFIG } from '../config.ts';
import type {
  BindingResult,
  DriftReport,
  ExecutionResults,
  ParsedFeatures,
  PomLifecycleReport,
  SelectorManifest,
  SelectorRegistry,
} from '../types.ts';
import { readJson, relativeToRepo, writeJson, writeText, log } from '../util.ts';

interface Coverage {
  selectors: { used: number; total: number; percent: number; unused: string[] };
  steps: { mapped: number; total: number; percent: number };
  scenarios: { covered: number; total: number; percent: number };
}

export interface FullReport {
  generatedAt: string;
  app: string;
  coverage: Coverage;
  execution: { mode: string; total: number; passed: number; failed: number; skipped: number };
  failures: { spec: string; title: string; error?: string }[];
  unmappedSteps: BindingResult['unmappedSteps'];
  pom: {
    pages: PomLifecycleReport['pages'];
    generated: number;
    updated: number;
    unchanged: number;
    custom: number;
  };
  drift: { total: number; added: number; removed: number; changed: number; records: DriftReport['records'] };
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 1000) / 10;
}

function buildReport(): FullReport {
  const manifest = readJson<SelectorManifest>(CONFIG.selectorManifestFile, {
    schemaVersion: 1, repoRoot: '', framework: '', scannedAt: '', filesScanned: 0, selectors: [],
  });
  const registry = readJson<SelectorRegistry>(CONFIG.registryFile, { schemaVersion: 1, updatedAt: '', entries: [] });
  const drift = readJson<DriftReport>(CONFIG.driftReportFile, { generatedAt: '', total: 0, added: 0, removed: 0, changed: 0, records: [] });
  const parsed = readJson<ParsedFeatures>(CONFIG.parsedFeaturesFile, { parsedAt: '', features: [] });
  const binding = readJson<BindingResult>(CONFIG.bindingsFile, {
    boundAt: '', steps: [], mappedCount: 0, unmappedCount: 0, unmappedSteps: [], requiredMethods: [],
  });
  const pom = readJson<PomLifecycleReport>(CONFIG.pomReportFile, { generatedAt: '', pages: [], methods: [] });
  const execution = readJson<ExecutionResults>(CONFIG.executionResultsFile, {
    ranAt: '', mode: 'skipped', total: 0, passed: 0, failed: 0, skipped: 0, results: [],
  });

  const activeKeys = registry.entries.filter((e) => e.status === 'active').map((e) => e.key);
  const usedKeys = new Set<string>();
  for (const mth of binding.requiredMethods) for (const k of mth.selectorKeys) usedKeys.add(k);
  const unused = activeKeys.filter((k) => !usedKeys.has(k));

  const totalSteps = binding.steps.length;
  const totalScenarios = parsed.features.reduce((n, f) => n + f.scenarios.length, 0);
  const unmappedScenarios = new Set(binding.unmappedSteps.map((u) => `${u.feature}::${u.scenario}`));
  const coveredScenarios = totalScenarios - unmappedScenarios.size;

  return {
    generatedAt: new Date().toISOString(),
    app: 'HealthCore EMS',
    coverage: {
      selectors: { used: usedKeys.size, total: activeKeys.length, percent: pct(usedKeys.size, activeKeys.length), unused },
      steps: { mapped: binding.mappedCount, total: totalSteps, percent: pct(binding.mappedCount, totalSteps) },
      scenarios: { covered: coveredScenarios, total: totalScenarios, percent: pct(coveredScenarios, totalScenarios) },
    },
    execution: { mode: execution.mode, total: execution.total, passed: execution.passed, failed: execution.failed, skipped: execution.skipped },
    failures: execution.results
      .filter((r) => r.status === 'failed' || r.status === 'timedOut')
      .map((r) => ({ spec: r.spec, title: r.title, error: r.error })),
    unmappedSteps: binding.unmappedSteps,
    pom: {
      pages: pom.pages,
      generated: pom.methods.filter((m) => m.change === 'generated').length,
      updated: pom.methods.filter((m) => m.change === 'updated').length,
      unchanged: pom.methods.filter((m) => m.change === 'unchanged').length,
      custom: pom.methods.filter((m) => m.kind === 'custom').length,
    },
    drift: { total: drift.total, added: drift.added, removed: drift.removed, changed: drift.changed, records: drift.records },
  };
}

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function bar(percent: number): string {
  const color = percent >= 80 ? '#16a34a' : percent >= 50 ? '#d97706' : '#dc2626';
  return `<div class="bar"><div class="fill" style="width:${percent}%;background:${color}"></div><span>${percent}%</span></div>`;
}

function renderHtml(r: FullReport): string {
  const driftRows = r.drift.records
    .map(
      (d) =>
        `<tr><td><span class="tag tag-${d.type}">${d.type}</span></td><td>${esc(d.key)}</td><td>${esc(d.previousValue ?? '')}</td><td>${esc(d.currentValue ?? '')}</td><td>${d.fromVersion ?? ''}${d.toVersion ? ` → ${d.toVersion}` : ''}</td></tr>`
    )
    .join('') || '<tr><td colspan="5" class="muted">No drift recorded.</td></tr>';

  const unmappedRows = r.unmappedSteps
    .map((u) => `<tr><td>${esc(u.feature)}</td><td>${esc(u.scenario)}</td><td><code>${esc(u.text)}</code></td><td>${u.line}</td></tr>`)
    .join('') || '<tr><td colspan="4" class="muted">All steps mapped.</td></tr>';

  const failureRows = r.failures
    .map((f) => `<tr><td>${esc(f.title)}</td><td><code>${esc(f.spec)}</code></td><td>${esc(f.error ?? '')}</td></tr>`)
    .join('') || '<tr><td colspan="3" class="muted">No failures recorded.</td></tr>';

  const pomRows = r.pom.pages
    .map(
      (p) =>
        `<tr><td>${esc(p.pageObject)}</td><td><code>${esc(p.file)}</code></td><td>${p.created ? 'yes' : 'no'}</td><td>${p.generatedMethods}</td><td>${p.updatedMethods}</td><td>${p.customMethods}</td></tr>`
    )
    .join('') || '<tr><td colspan="6" class="muted">No page objects generated.</td></tr>';

  const unusedList = r.coverage.selectors.unused.length
    ? r.coverage.selectors.unused.map((k) => `<code>${esc(k)}</code>`).join(' ')
    : '<span class="muted">All registered selectors are exercised.</span>';

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Locator Intelligence Report — ${esc(r.app)}</title>
<style>
  :root { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
  body { margin: 0; background: #f1f5f9; color: #0f172a; }
  header { background: #0f172a; color: #fff; padding: 24px 32px; }
  header h1 { margin: 0 0 4px; font-size: 20px; }
  header p { margin: 0; color: #94a3b8; font-size: 13px; }
  main { max-width: 1100px; margin: 0 auto; padding: 24px 32px 64px; }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px,1fr)); gap: 16px; margin-bottom: 28px; }
  .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; }
  .card h3 { margin: 0 0 10px; font-size: 12px; text-transform: uppercase; letter-spacing: .05em; color: #64748b; }
  .metric { font-size: 26px; font-weight: 700; }
  .bar { position: relative; height: 18px; background: #e2e8f0; border-radius: 9px; overflow: hidden; margin-top: 10px; }
  .bar .fill { position: absolute; inset: 0 auto 0 0; height: 100%; }
  .bar span { position: absolute; right: 8px; top: 0; font-size: 11px; line-height: 18px; color: #0f172a; font-weight: 600; }
  section { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
  section h2 { margin: 0 0 14px; font-size: 15px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
  th { color: #64748b; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; }
  code { background: #f1f5f9; padding: 1px 6px; border-radius: 5px; font-size: 12px; }
  .muted { color: #94a3b8; }
  .pill { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
  .pill.ok { background: #dcfce7; color: #166534; }
  .pill.warn { background: #fef9c3; color: #854d0e; }
  .tag { padding: 1px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
  .tag-added { background: #dcfce7; color: #166534; }
  .tag-changed { background: #fef9c3; color: #854d0e; }
  .tag-removed { background: #fee2e2; color: #991b1b; }
  .grid2 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .stat { background: #f8fafc; border-radius: 10px; padding: 12px; text-align: center; }
  .stat b { display: block; font-size: 22px; }
  .stat span { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: .04em; }
</style></head>
<body>
<header>
  <h1>Locator Intelligence — ${esc(r.app)}</h1>
  <p>Generated ${esc(r.generatedAt)} • Execution mode: <strong>${esc(r.execution.mode)}</strong></p>
</header>
<main>
  <div class="cards">
    <div class="card"><h3>Selector coverage</h3><div class="metric">${r.coverage.selectors.used}/${r.coverage.selectors.total}</div>${bar(r.coverage.selectors.percent)}</div>
    <div class="card"><h3>Step coverage</h3><div class="metric">${r.coverage.steps.mapped}/${r.coverage.steps.total}</div>${bar(r.coverage.steps.percent)}</div>
    <div class="card"><h3>Scenario coverage</h3><div class="metric">${r.coverage.scenarios.covered}/${r.coverage.scenarios.total}</div>${bar(r.coverage.scenarios.percent)}</div>
    <div class="card"><h3>Selector drift</h3><div class="metric">${r.drift.total}</div><p class="muted" style="margin:6px 0 0">${r.drift.changed} changed · ${r.drift.added} added · ${r.drift.removed} removed</p></div>
  </div>

  <section>
    <h2>Execution</h2>
    <div class="grid2">
      <div class="stat"><b>${r.execution.total}</b><span>Total</span></div>
      <div class="stat"><b style="color:#16a34a">${r.execution.passed}</b><span>Passed</span></div>
      <div class="stat"><b style="color:#dc2626">${r.execution.failed}</b><span>Failed</span></div>
      <div class="stat"><b style="color:#64748b">${r.execution.skipped}</b><span>Skipped</span></div>
    </div>
  </section>

  <section>
    <h2>Failures</h2>
    <table><thead><tr><th>Test</th><th>Spec</th><th>Error</th></tr></thead><tbody>${failureRows}</tbody></table>
  </section>

  <section>
    <h2>Unmapped steps</h2>
    <table><thead><tr><th>Feature</th><th>Scenario</th><th>Step</th><th>Line</th></tr></thead><tbody>${unmappedRows}</tbody></table>
  </section>

  <section>
    <h2>Generated POM usage</h2>
    <p><span class="pill ok">${r.pom.generated} generated</span> <span class="pill warn">${r.pom.updated} updated</span> <span class="pill">${r.pom.unchanged} unchanged</span> <span class="pill">${r.pom.custom} custom preserved</span></p>
    <table><thead><tr><th>Page object</th><th>File</th><th>Created</th><th>Generated</th><th>Updated</th><th>Custom</th></tr></thead><tbody>${pomRows}</tbody></table>
  </section>

  <section>
    <h2>Selector drift</h2>
    <table><thead><tr><th>Type</th><th>Key</th><th>Previous</th><th>Current</th><th>Version</th></tr></thead><tbody>${driftRows}</tbody></table>
  </section>

  <section>
    <h2>Unused registered selectors</h2>
    <p>${unusedList}</p>
  </section>
</main>
</body></html>`;
}

/** Aggregate every artifact into a JSON + HTML report. */
export function report(): FullReport {
  log.step('Report — aggregating coverage, failures, POM usage, drift');
  const full = buildReport();
  writeJson(CONFIG.reportJsonFile, full);
  writeText(CONFIG.reportHtmlFile, renderHtml(full));

  log.ok(
    `Coverage — selectors ${full.coverage.selectors.percent}%, steps ${full.coverage.steps.percent}%, scenarios ${full.coverage.scenarios.percent}%`
  );
  log.info(`POM — ${full.pom.generated} generated, ${full.pom.updated} updated, ${full.pom.custom} custom preserved`);
  if (full.drift.total > 0) log.warn(`Drift — ${full.drift.changed} changed, ${full.drift.added} added, ${full.drift.removed} removed`);
  if (full.failures.length > 0) log.err(`${full.failures.length} failing test(s)`);
  log.info(`HTML report → ${relativeToRepo(CONFIG.reportHtmlFile)}`);
  log.info(`JSON report → ${relativeToRepo(CONFIG.reportJsonFile)}`);
  return full;
}
