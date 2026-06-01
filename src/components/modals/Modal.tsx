import { useEffect, type ReactNode } from 'react';
import { TEST_IDS } from '../../testids';
import { Button } from '../ui/Button';

interface ModalProps {
  testId: string;
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ testId, title, open, onClose, children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      data-testid={TEST_IDS.modal.overlay(testId.replace('modal-', ''))}
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${testId}-title`}
        data-testid={testId}
        className="relative z-10 w-full max-w-lg bg-white rounded-lg shadow-xl"
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 id={`${testId}-title`} className="text-lg font-semibold text-slate-900">
            {title}
          </h2>
          <Button
            testId={TEST_IDS.modal.close(testId.replace('modal-', ''))}
            variant="ghost"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </Button>
        </div>
        <div className="px-6 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t px-6 py-4">{footer}</div>
        )}
      </div>
    </div>
  );
}
