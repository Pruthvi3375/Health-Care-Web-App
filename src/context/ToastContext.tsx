import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { TEST_IDS } from '../testids';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (type: ToastType, message: string) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = `${type}-${++toastCounter}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => dismissToast(id), 5000);
  }, [dismissToast]);

  const value = useMemo(
    () => ({ toasts, showToast, dismissToast }),
    [toasts, showToast, dismissToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm"
        data-testid={TEST_IDS.toast.container}
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            data-testid={TEST_IDS.toast.item(toast.id)}
            role="alert"
            className={`rounded-lg px-4 py-3 shadow-lg text-sm text-white flex justify-between items-start gap-3 ${
              toast.type === 'success'
                ? 'bg-emerald-600'
                : toast.type === 'error'
                  ? 'bg-red-600'
                  : 'bg-blue-600'
            }`}
          >
            <span data-testid={`toast-message-${toast.id}`}>{toast.message}</span>
            <button
              type="button"
              className="text-white/80 hover:text-white text-xs"
              aria-label="Dismiss notification"
              data-testid={`toast-dismiss-${toast.id}`}
              onClick={() => dismissToast(toast.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
