import { useContext } from 'react';
import { ChaosContext } from '../context/ChaosContext';

export function useChaos() {
  return useContext(ChaosContext);
}
