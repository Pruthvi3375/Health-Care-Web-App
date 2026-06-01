import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_CHAOS, type ChaosConfig } from '../chaos/types';

interface ChaosContextValue {
  chaos: ChaosConfig;
  setChaos: (patch: Partial<ChaosConfig>) => void;
  toggleChaos: () => void;
  resetChaos: () => void;
}

export const ChaosContext = createContext<ChaosContextValue>({
  chaos: DEFAULT_CHAOS,
  setChaos: () => {},
  toggleChaos: () => {},
  resetChaos: () => {},
});

const CHAOS_STORAGE_KEY = 'healthcore-chaos-config';

function loadChaos(): ChaosConfig {
  try {
    const stored = localStorage.getItem(CHAOS_STORAGE_KEY);
    if (stored) return { ...DEFAULT_CHAOS, ...JSON.parse(stored) };
  } catch {
    /* ignore */
  }
  return DEFAULT_CHAOS;
}

export function ChaosProvider({ children }: { children: ReactNode }) {
  const [chaos, setChaosState] = useState<ChaosConfig>(loadChaos);

  const persist = useCallback((config: ChaosConfig) => {
    localStorage.setItem(CHAOS_STORAGE_KEY, JSON.stringify(config));
  }, []);

  const setChaos = useCallback(
    (patch: Partial<ChaosConfig>) => {
      setChaosState((prev) => {
        const next = { ...prev, ...patch };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const toggleChaos = useCallback(() => {
    setChaos({ enabled: !chaos.enabled });
  }, [chaos.enabled, setChaos]);

  const resetChaos = useCallback(() => {
    setChaosState(DEFAULT_CHAOS);
    persist(DEFAULT_CHAOS);
  }, [persist]);

  const value = useMemo(
    () => ({ chaos, setChaos, toggleChaos, resetChaos }),
    [chaos, setChaos, toggleChaos, resetChaos]
  );

  return (
    <ChaosContext.Provider value={value}>{children}</ChaosContext.Provider>
  );
}
