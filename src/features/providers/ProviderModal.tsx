import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Provider } from '../../types';
import { TEST_IDS } from '../../testids';
import { Modal } from '../../components/modals/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const schema = z.object({
  npi: z.string().length(10, 'NPI must be 10 digits.'),
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  specialty: z.string().min(1, 'Specialty is required.'),
  email: z.string().email('Enter a valid email.'),
  phone: z.string().min(7, 'Phone is required.'),
  active: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export function ProviderModal({
  open,
  provider,
  onClose,
  onSave,
}: {
  open: boolean;
  provider?: Provider | null;
  onClose: () => void;
  onSave: (data: FormData) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open) {
      reset(
        provider
          ? { ...provider, active: provider.active }
          : {
              npi: '',
              firstName: '',
              lastName: '',
              specialty: '',
              email: '',
              phone: '',
              active: true,
            }
      );
    }
  }, [open, provider, reset]);

  return (
    <Modal
      testId={TEST_IDS.providers.modal}
      title={provider ? 'Edit Provider' : 'Add Provider'}
      open={open}
      onClose={onClose}
      footer={
        <>
          <Button testId={TEST_IDS.providers.formCancel} variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            testId={TEST_IDS.providers.formSubmit}
            type="submit"
            form="provider-form"
            disabled={isSubmitting}
          >
            Save
          </Button>
        </>
      }
    >
      <form
        id="provider-form"
        onSubmit={handleSubmit(async (data) => {
          try {
            await onSave(data);
            onClose();
          } catch (e) {
            setError('root', {
              message: e instanceof Error ? e.message : 'Save failed.',
            });
          }
        })}
      >
        <Input testId="provider-form-npi" label="NPI" error={errors.npi?.message} {...register('npi')} />
        <Input testId="provider-form-first-name" label="First Name" error={errors.firstName?.message} {...register('firstName')} />
        <Input testId="provider-form-last-name" label="Last Name" error={errors.lastName?.message} {...register('lastName')} />
        <Input testId="provider-form-specialty" label="Specialty" error={errors.specialty?.message} {...register('specialty')} />
        <Input testId="provider-form-email" label="Email" type="email" error={errors.email?.message} {...register('email')} />
        <Input testId="provider-form-phone" label="Phone" error={errors.phone?.message} {...register('phone')} />
        <label className="flex items-center gap-2 text-sm mb-4">
          <input type="checkbox" data-testid="provider-form-active" {...register('active')} />
          Active provider
        </label>
      </form>
    </Modal>
  );
}
