import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Appointment, Patient, Provider } from '../../types';
import { TEST_IDS } from '../../testids';
import { Modal } from '../../components/modals/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';

const schema = z.object({
  patientId: z.string().min(1, 'Patient is required.'),
  providerId: z.string().min(1, 'Provider is required.'),
  date: z.string().min(1, 'Date is required.'),
  time: z.string().min(1, 'Time is required.'),
  type: z.string().min(1, 'Appointment type is required.'),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'no-show']),
  notes: z.string(),
});

type FormData = z.infer<typeof schema>;

export function AppointmentModal({
  open,
  appointment,
  patients,
  providers,
  onClose,
  onSave,
}: {
  open: boolean;
  appointment?: Appointment | null;
  patients: Patient[];
  providers: Provider[];
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
        appointment ?? {
          patientId: patients[0]?.id ?? '',
          providerId: providers[0]?.id ?? '',
          date: '',
          time: '',
          type: 'Follow-up',
          status: 'scheduled',
          notes: '',
        }
      );
    }
  }, [open, appointment, patients, providers, reset]);

  return (
    <Modal
      testId={TEST_IDS.appointments.modal}
      title={appointment ? 'Edit Appointment' : 'Schedule Appointment'}
      open={open}
      onClose={onClose}
      footer={
        <>
          <Button testId={TEST_IDS.appointments.formCancel} variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            testId={TEST_IDS.appointments.formSubmit}
            type="submit"
            form="appointment-form"
            disabled={isSubmitting}
          >
            Save
          </Button>
        </>
      }
    >
      <form
        id="appointment-form"
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
        {errors.root && (
          <p className="text-sm text-red-600 mb-3" role="alert">
            {errors.root.message}
          </p>
        )}
        <Select
          testId="appointment-form-patient"
          label="Patient"
          options={patients.map((p) => ({
            value: p.id,
            label: `${p.firstName} ${p.lastName} (${p.mrn})`,
          }))}
          error={errors.patientId?.message}
          {...register('patientId')}
        />
        <Select
          testId="appointment-form-provider"
          label="Provider"
          options={providers.filter((p) => p.active).map((p) => ({
            value: p.id,
            label: `Dr. ${p.lastName}`,
          }))}
          error={errors.providerId?.message}
          {...register('providerId')}
        />
        <Input testId="appointment-form-date" label="Date" type="date" error={errors.date?.message} {...register('date')} />
        <Input testId="appointment-form-time" label="Time" type="time" error={errors.time?.message} {...register('time')} />
        <Input testId="appointment-form-type" label="Type" error={errors.type?.message} {...register('type')} />
        <Select
          testId="appointment-form-status"
          label="Status"
          options={[
            { value: 'scheduled', label: 'Scheduled' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' },
            { value: 'no-show', label: 'No Show' },
          ]}
          {...register('status')}
        />
        <Input testId="appointment-form-notes" label="Notes" {...register('notes')} />
      </form>
    </Modal>
  );
}
