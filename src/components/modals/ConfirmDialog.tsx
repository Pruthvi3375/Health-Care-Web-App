import { Modal } from './Modal';
import { Button } from '../ui/Button';

interface ConfirmDialogProps {
  testId: string;
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmTestId: string;
  cancelTestId: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'primary';
}

export function ConfirmDialog({
  testId,
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmTestId,
  cancelTestId,
  onConfirm,
  onCancel,
  variant = 'danger',
}: ConfirmDialogProps) {
  return (
    <Modal
      testId={testId}
      title={title}
      open={open}
      onClose={onCancel}
      footer={
        <>
          <Button testId={cancelTestId} variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            testId={confirmTestId}
            variant={variant}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600" data-testid={`${testId}-message`}>
        {message}
      </p>
    </Modal>
  );
}
