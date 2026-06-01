import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useChaos } from '../../hooks/useChaos';
import { TEST_IDS } from '../../testids';
import { chaosLabel } from '../../utils/testId';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import usersSeed from '../../data/seed/users.json';
import type { User } from '../../types';

const schema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { chaos } = useChaos();
  const activeChaos = chaos.enabled ? chaos : undefined;
  const [error, setError] = useState('');
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, navigate, from]);

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed.');
    }
  };

  const fillDemo = (email: string) => {
    const u = (usersSeed as User[]).find((x) => x.email === email);
    if (u) {
      setValue('email', u.email);
      setValue('password', u.password);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-md p-8" testId="login-page">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          {chaosLabel('HealthCore EMS', 'CarePortal Access', activeChaos)}
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          Sign in to the automation validation environment
        </p>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Input
            testId={TEST_IDS.auth.email}
            label={chaosLabel('Email', 'User ID', activeChaos)}
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            testId={TEST_IDS.auth.password}
            label={chaosLabel('Password', 'Passcode', activeChaos)}
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <Select
            testId={TEST_IDS.auth.roleSelect}
            label="Quick fill demo account"
            options={[
              { value: '', label: 'Select demo user...' },
              { value: 'admin@healthcore.demo', label: 'Admin' },
              { value: 'scheduler@healthcore.demo', label: 'Scheduler' },
              { value: 'billing@healthcore.demo', label: 'Billing' },
            ]}
            onChange={(e) => e.target.value && fillDemo(e.target.value)}
          />
          {error && (
            <p
              className="text-sm text-red-600 mb-4"
              data-testid={TEST_IDS.auth.error}
              role="alert"
            >
              {error}
            </p>
          )}
          <Button
            testId={TEST_IDS.auth.loginSubmit}
            variant="primary"
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {chaosLabel('Sign in', 'Log in', activeChaos)}
          </Button>
        </form>
        <p className="text-xs text-slate-500 mt-6">
          Demo: admin@healthcore.demo / Admin123!
        </p>
      </Card>
    </div>
  );
}
