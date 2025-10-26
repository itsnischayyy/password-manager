import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserPublicProfile } from '@/types';

interface AuthState {
  accessToken: string | null;
  user: UserPublicProfile | null;
  vaultKey: CryptoKey | null; // SECURITY: Stored in memory only, not persisted.
  setAuth: (token: string, user: UserPublicProfile, vk: CryptoKey) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      vaultKey: null, // Initial value is null
      setAuth: (token, user, vk) => set({ accessToken: token, user, vaultKey: vk }),
      logout: () => {
        set({ accessToken: null, user: null, vaultKey: null });
        // Optionally, clear other stores as well
        // useVaultStore.getState().clearVault();
      },
    }),
    {
      name: 'auth-storage', // name of the item in storage (localStorage by default)
      storage: createJSONStorage(() => sessionStorage), // Use sessionStorage for better security
      // SECURITY: Explicitly exclude the vaultKey from being persisted to storage.
      // This is the most critical part of the state management security model.
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
      }),
    }
  )
);