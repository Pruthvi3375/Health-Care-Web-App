import { AuthProvider } from '../context/AuthContext';
import { ChaosProvider } from '../context/ChaosContext';
import { ToastProvider } from '../context/ToastContext';
import { AppRouter } from './router';

export default function App() {
  return (
    <ChaosProvider>
      <AuthProvider>
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </AuthProvider>
    </ChaosProvider>
  );
}
