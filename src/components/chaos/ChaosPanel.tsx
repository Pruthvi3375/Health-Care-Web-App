import { useChaos } from '../../hooks/useChaos';
import { TEST_IDS } from '../../testids';
import { Button } from '../ui/Button';

export function ChaosPanel() {
  const { chaos, setChaos, toggleChaos, resetChaos } = useChaos();

  return (
    <div className="relative">
      <Button
        testId={TEST_IDS.chaos.toggle}
        variant={chaos.enabled ? 'danger' : 'ghost'}
        onClick={toggleChaos}
        aria-expanded={chaos.enabled}
      >
        {chaos.enabled ? 'Chaos ON' : 'Chaos Mode'}
      </Button>
      {chaos.enabled && (
        <div
          className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-lg p-4 z-50"
          data-testid={TEST_IDS.chaos.panel}
          role="region"
          aria-label="Enterprise chaos mode controls"
        >
          <p className="text-xs font-semibold text-slate-700 mb-3">
            Enterprise Chaos Mode
          </p>
          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={chaos.locatorChanges}
                onChange={(e) => setChaos({ locatorChanges: e.target.checked })}
                data-testid={TEST_IDS.chaos.locatorChanges}
              />
              Locator remapping
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={chaos.labelChanges}
                onChange={(e) => setChaos({ labelChanges: e.target.checked })}
                data-testid={TEST_IDS.chaos.labelChanges}
              />
              Label changes
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={chaos.domRestructure}
                onChange={(e) => setChaos({ domRestructure: e.target.checked })}
                data-testid={TEST_IDS.chaos.domRestructure}
              />
              DOM restructuring
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={chaos.missingTestIds}
                onChange={(e) => setChaos({ missingTestIds: e.target.checked })}
                data-testid={TEST_IDS.chaos.missingTestIds}
              />
              Missing test IDs
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={chaos.dynamicRender}
                onChange={(e) => setChaos({ dynamicRender: e.target.checked })}
                data-testid={TEST_IDS.chaos.dynamicRender}
              />
              Dynamic rendering delay
            </label>
          </div>
          <button
            type="button"
            className="mt-3 text-xs text-blue-600 hover:underline"
            data-testid="chaos-reset"
            onClick={resetChaos}
          >
            Reset chaos settings
          </button>
        </div>
      )}
    </div>
  );
}
