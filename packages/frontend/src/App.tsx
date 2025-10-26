import { Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VaultPage } from './pages/vault/VaultPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthLayout } from './components/AuthLayout';
import { Header } from './components/Header';
import { useAuthStore } from './state/authStore';

function App() {
  const isAuthenticated = useAuthStore(state => !!state.accessToken);
  const vaultKey = useAuthStore(state => state.vaultKey);

  return (
    <div className="min-h-screen bg-gray-900 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {isAuthenticated && vaultKey && <Header />}
      <main className="">
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <VaultPage />
              </ProtectedRoute>
            }
          />
          
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;