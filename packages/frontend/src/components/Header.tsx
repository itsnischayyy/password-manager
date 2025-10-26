// src/components/Header.tsx

import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/state/authStore';
import { useVaultStore } from '@/state/vaultStore';
import { Button } from './ui/button';
import { LogOut, Shield, User as UserIcon, Zap } from 'lucide-react';

export function Header() {
  const { user, logout } = useAuthStore();
  const clearVault = useVaultStore(state => state.clearVault);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    clearVault();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/50 backdrop-blur-xl bg-slate-950/80 bg-sidebar">
      <div className="container mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                SecureVault
              </h1>
              <p className="text-xs text-gray-400 hidden sm:block">Your encrypted password manager</p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-gray-300">256-bit AES Encryption</span>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-xl">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </Button>
                <Button onClick={handleLogout} variant="destructive" size="sm" className="rounded-xl">
                  <LogOut className="mr-0 sm:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}