import { CONFIG } from '../config.ts';
import type {
  DriftReport,
  DriftRecord,
  RegistryEntry,
  ScannedSelector,
  SelectorManifest,
  SelectorRegistry,
} from '../types.ts';
import { readJson, relativeToRepo, writeJson, log } from '../util.ts';

const EMPTY_REGISTRY: SelectorRegistry = {
  schemaVersion: 1,
  updatedAt: '',
  entries: [],
};

/** Logical identity used to track a selector across scans. */
export function entryKey(s: Pick<ScannedSelector, 'registryPath' | 'kind' | 'value' | 'module'>): string {
  return s.registryPath ?? `${s.kind}:${s.value}@${s.module}`;
}

export function loadRegistry(): SelectorRegistry {
  return readJson<SelectorRegistry>(CONFIG.registryFile, EMPTY_REGISTRY);
}

/**
 * Reconcile the freshly scanned manifest against the persisted registry.
 *
 * Produces an updated registry (with per-selector version history) and a drift
 * report describing what was added, removed, or had its locator value change.
 */
export function store(manifest: SelectorManifest): { registry: SelectorRegistry; drift: DriftReport } {
  log.step('Store — reconciling selector registry');
  const prev = loadRegistry();
  const now = new Date().toISOString();
  const isBaseline = prev.entries.length === 0;

  const byKey = new Map<string, RegistryEntry>();
  for (const e of prev.entries) byKey.set(e.key, { ...e, history: [...e.history] });

  const drift: DriftRecord[] = [];
  const currentKeys = new Set<string>();

  for (const sel of manifest.selectors) {
    const key = entryKey(sel);
    currentKeys.add(key);
    const existing = byKey.get(key);

    if (!existing) {
      const entry: RegistryEntry = {
        key,
        kind: sel.kind,
        strategy: sel.strategy,
        value: sel.value,
        templated: sel.templated,
        version: 1,
        firstSeen: now,
        lastSeen: now,
        source: sel.source,
        status: 'active',
        history: [
          {
            version: 1,
            value: sel.value,
            strategy: sel.strategy,
            kind: sel.kind,
            source: sel.source,
            recordedAt: now,
          },
        ],
      };
      byKey.set(key, entry);
      if (!isBaseline) {
        drift.push({ key, type: 'added', currentValue: sel.value, toVersion: 1, source: sel.source });
      }
      continue;
    }

    existing.lastSeen = now;
    existing.status = 'active';
    existing.source = sel.source;
    existing.strategy = sel.strategy;
    existing.kind = sel.kind;

    if (existing.value !== sel.value) {
      const nextVersion = existing.version + 1;
      drift.push({
        key,
        type: 'changed',
        previousValue: existing.value,
        currentValue: sel.value,
        fromVersion: existing.version,
        toVersion: nextVersion,
        source: sel.source,
      });
      existing.value = sel.value;
      existing.templated = sel.templated;
      existing.version = nextVersion;
      existing.history.push({
        version: nextVersion,
        value: sel.value,
        strategy: sel.strategy,
        kind: sel.kind,
        source: sel.source,
        recordedAt: now,
      });
    }
  }

  // Anything previously active but missing from this scan is now removed.
  for (const entry of byKey.values()) {
    if (!currentKeys.has(entry.key) && entry.status === 'active') {
      entry.status = 'removed';
      entry.lastSeen = entry.lastSeen || now;
      drift.push({ key: entry.key, type: 'removed', previousValue: entry.value, fromVersion: entry.version });
    }
  }

  const registry: SelectorRegistry = {
    schemaVersion: 1,
    updatedAt: now,
    entries: [...byKey.values()].sort((a, b) => a.key.localeCompare(b.key)),
  };

  const driftReport: DriftReport = {
    generatedAt: now,
    total: drift.length,
    added: drift.filter((d) => d.type === 'added').length,
    removed: drift.filter((d) => d.type === 'removed').length,
    changed: drift.filter((d) => d.type === 'changed').length,
    records: drift,
  };

  writeJson(CONFIG.registryFile, registry);
  writeJson(CONFIG.driftReportFile, driftReport);

  const active = registry.entries.filter((e) => e.status === 'active').length;
  log.ok(`Registry persisted: ${active} active selectors (${registry.entries.length} tracked)`);
  if (isBaseline) {
    log.info('Baseline scan — no drift recorded for initial population');
  } else if (driftReport.total > 0) {
    log.warn(
      `Drift: ${driftReport.changed} changed, ${driftReport.added} added, ${driftReport.removed} removed`
    );
  } else {
    log.info('No selector drift detected since last scan');
  }
  log.info(`Registry → ${relativeToRepo(CONFIG.registryFile)}`);
  return { registry, drift: driftReport };
}
