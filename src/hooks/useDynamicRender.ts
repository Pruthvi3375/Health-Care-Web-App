import { useEffect, useState } from 'react';
import { useChaos } from './useChaos';

export function useDynamicRender(defaultReady = true) {
  const { chaos } = useChaos();
  const [ready, setReady] = useState(defaultReady);

  useEffect(() => {
    if (chaos.enabled && chaos.dynamicRender) {
      setReady(false);
      const timer = setTimeout(() => setReady(true), 800);
      return () => clearTimeout(timer);
    }
    setReady(true);
  }, [chaos.enabled, chaos.dynamicRender]);

  return ready;
}
