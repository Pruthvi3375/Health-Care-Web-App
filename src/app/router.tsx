import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { AppShell } from '../components/layout/AppShell';
import { LoginPage } from '../features/auth/LoginPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { PatientsPage } from '../features/patients/PatientsPage';
import { ProvidersPage } from '../features/providers/ProvidersPage';
import { AppointmentsPage } from '../features/appointments/AppointmentsPage';
import { ClaimsPage } from '../features/claims/ClaimsPage';
import { UploadsPage } from '../features/uploads/UploadsPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route
            path="patients"
            element={
              <ProtectedRoute roles={['admin', 'scheduler']}>
                <PatientsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="providers"
            element={
              <ProtectedRoute roles={['admin', 'scheduler']}>
                <ProvidersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="appointments"
            element={
              <ProtectedRoute roles={['admin', 'scheduler']}>
                <AppointmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="claims"
            element={
              <ProtectedRoute roles={['billing', 'admin']}>
                <ClaimsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="uploads"
            element={
              <ProtectedRoute roles={['billing', 'admin']}>
                <UploadsPage />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
