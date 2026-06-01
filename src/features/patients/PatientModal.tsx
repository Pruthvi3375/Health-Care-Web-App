import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Patient, Provider } from '../../types';
import { TEST_IDS } from '../../testids';
import { Modal } from '../../components/modals/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';

const schema = z.object({
  mrn: z.string().min(1, 'MRN is required.'),
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  dateOfBirth: z.string().min(1, 'Date of birth is required.'),
  email: z.string().email('Enter a valid email.'),
  phone: z.string().min(7, 'Phone number is required.'),
  status: z.enum(['active', 'inactive', 'pending']),
  primaryProviderId: z.string().min(1, 'Primary provider is required.'),
});

type FormData = z.infer<typeof schema>;

interface PatientModalProps {
  open: boolean;
  patient?: Patient | null;
  providers: Provider[];
  onClose: () => void;
  onSave: (data: FormData) => Promise<void>;
}

export function PatientModal({
  open,
  patient,
  providers,
  onClose,
  onSave,
}: PatientModalProps) {
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
        patient
          ? {
              mrn: patient.mrn,
              firstName: patient.firstName,
              lastName: patient.lastName,
              dateOfBirth: patient.dateOfBirth,
              email: patient.email,
              phone: patient.phone,
              status: patient.status,
              primaryProviderId: patient.primaryProviderId,
            }
          : {
              mrn: '',
              firstName: '',
              lastName: '',
              dateOfBirth: '',
              email: '',
              phone: '',
              status: 'active',
              primaryProviderId: providers[0]?.id ?? '',
            }
      );
    }
  }, [open, patient, providers, reset]);

  const submit = async (data: FormData) => {
    try {
      await onSave(data);
      onClose();
    } catch (e) {
      setError('root', {
        message: e instanceof Error ? e.message : 'Failed to save patient.',
      });
    }
  };

  return (
    <Modal
      testId={TEST_IDS.patients.modal}
      title={patient ? 'Edit Patient' : 'Add Patient'}
      open={open}
      onClose={onClose}
      footer={
        <>
          <Button
            testId={TEST_IDS.patients.formCancel}
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            testId={TEST_IDS.patients.formSubmit}
            variant="primary"
            type="submit"
            form="patient-form"
            disabled={isSubmitting}
          >
            {patient ? 'Save Changes' : 'Create Patient'}
          </Button>
        </>
      }
    >
      <form id="patient-form" onSubmit={handleSubmit(submit)} noValidate>
        {errors.root && (
          <p className="text-sm text-red-600 mb-3" role="alert">
            {errors.root.message}
          </p>
        )}
        <Input
          testId={TEST_IDS.patients.formMrn}
          label="MRN"
          error={errors.mrn?.message}
          {...register('mrn')}
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            testId={TEST_IDS.patients.formFirstName}
            label="First Name"
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <Input
            testId={TEST_IDS.patients.formLastName}
            label="Last Name"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>
        <Input
          testId={TEST_IDS.patients.formDob}
          label="Date of Birth"
          type="date"
          error={errors.dateOfBirth?.message}
          {...register('dateOfBirth')}
        />
        <Input
          testId={TEST_IDS.patients.formEmail}
          label="Email"
          type="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          testId={TEST_IDS.patients.formPhone}
          label="Phone"
          error={errors.phone?.message}
          {...register('phone')}
        />
        <Select
          testId={TEST_IDS.patients.formStatus}
          label="Status"
          error={errors.status?.message}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'pending', label: 'Pending' },
          ]}
          {...register('status')}
        />
        <Select
          testId={TEST_IDS.patients.formProvider}
          label="Primary Provider"
          error={errors.primaryProviderId?.message}
          options={providers.map((p) => ({
            value: p.id,
            label: `Dr. ${p.lastName} (${p.specialty})`,
          }))}
          {...register('primaryProviderId')}
        />
      </form>
    </Modal>
  );
}
