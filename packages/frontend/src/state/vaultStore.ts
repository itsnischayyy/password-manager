import { create } from 'zustand';
import type { VaultItem, DecryptedVaultItem } from '@/types';
import * as crypto from '@/lib/crypto';
import { useAuthStore } from './authStore';

interface VaultState {
  encryptedItems: VaultItem[];
  decryptedItems: DecryptedVaultItem[];
  isLoading: boolean;
  error: string | null;
  setEncryptedItems: (items: VaultItem[]) => Promise<void>;
  addEncryptedItem: (item: VaultItem) => Promise<void>;
  updateDecryptedItem: (updatedItem: DecryptedVaultItem) => void;
  removeDecryptedItem: (itemId: string) => void;
  clearVault: () => void;
}

// Helper function to decrypt a single item
const decryptItem = async (item: VaultItem, vaultKey: CryptoKey): Promise<DecryptedVaultItem> => {
  try {
    const plaintextBytes = await crypto.aesGcmDecrypt(vaultKey, item.encryptedBlob, item.iv, item.tag);
    const decryptedData = JSON.parse(crypto.bytesToText(plaintextBytes));
    return { ...item, decryptedData };
  } catch (error) {
    console.error(`Failed to decrypt item ${item.id}:`, error);
    // Return a special object to indicate decryption failure
    return { ...item, decryptedData: { title: "DECRYPTION FAILED", username: "", password: "" }, decryptionError: true };
  }
};

export const useVaultStore = create<VaultState>((set, get) => ({
  encryptedItems: [],
  decryptedItems: [],
  isLoading: false,
  error: null,

  setEncryptedItems: async (items: VaultItem[]) => {
    set({ isLoading: true, error: null, encryptedItems: items, decryptedItems: [] });
    const vaultKey = useAuthStore.getState().vaultKey;
    if (!vaultKey) {
      set({ isLoading: false, error: "Vault key is not available. Please log in again." });
      return;
    }

    try {
      const decryptedItems = await Promise.all(
        items.map(item => decryptItem(item, vaultKey))
      );
      set({ decryptedItems, isLoading: false });
    } catch (err) {
      set({ error: "Failed to decrypt vault items.", isLoading: false });
    }
  },
  
  addEncryptedItem: async (item: VaultItem) => {
    const vaultKey = useAuthStore.getState().vaultKey;
    if (!vaultKey) return;
    const decryptedNewItem = await decryptItem(item, vaultKey);
    set(state => ({
        encryptedItems: [...state.encryptedItems, item],
        decryptedItems: [...state.decryptedItems, decryptedNewItem],
    }));
  },

  updateDecryptedItem: (updatedItem: DecryptedVaultItem) => {
    set(state => ({
        decryptedItems: state.decryptedItems.map(item => item.id === updatedItem.id ? updatedItem : item)
    }));
  },
  
  removeDecryptedItem: (itemId: string) => {
    set(state => ({
        encryptedItems: state.encryptedItems.filter(item => item.id !== itemId),
        decryptedItems: state.decryptedItems.filter(item => item.id !== itemId)
    }));
  },
  
  clearVault: () => set({ encryptedItems: [], decryptedItems: [], isLoading: false, error: null }),
}));