import type { ChaosConfig } from '../chaos/types';

export function tid(id: string, chaos?: ChaosConfig): Record<string, string> {
  if (chaos?.missingTestIds) return {};
  if (chaos?.locatorChanges && chaos.locatorMap[id]) {
    return { 'data-testid': chaos.locatorMap[id] };
  }
  return { 'data-testid': id };
}

export function chaosLabel(
  defaultLabel: string,
  altLabel: string,
  chaos?: ChaosConfig
): string {
  if (chaos?.labelChanges) return altLabel;
  return defaultLabel;
}
