// src/components/AuthLayout.tsx

import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/state/authStore';
import { Shield } from 'lucide-react';
import { AnimatedBackground } from './AnimatedBackground'; // New component

export function AuthLayout() {
  const isAuthenticated = useAuthStore((state) => !!state.accessToken);
  const vaultKey = useAuthStore((state) => state.vaultKey);
  const location = useLocation();
  
  // Only redirect if fully authenticated (both token AND vault key)
  if (isAuthenticated && vaultKey) {
    const from = (location.state as any)?.from || '/';
    return <Navigate to={from} replace />;
  }
  
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-4">
      <AnimatedBackground />
      <div className="relative z-10 flex flex-col items-center justify-center w-full">
         <div className="flex items-center mb-8 gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              SecureVault
            </h1>
            <p className="text-xs text-gray-400 text-center">Your encrypted password manager</p>
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
}