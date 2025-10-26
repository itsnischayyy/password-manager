// Types matching the Backend API responses

export interface UserPublicProfile {
  id: string;
  email: string;
  displayName?: string;
  createdAt: Date;
}

export interface WrappedKey {
  cipher: string;
  iv: string;
  tag: string;
}

export interface LoginResponse {
  accessToken: string;
  user: UserPublicProfile;
  wrappedVK: WrappedKey;
  saltForKEK: string;
}

// Types for Vault Items

export interface VaultItem {
  id: string;
  userId: string;
  encryptedBlob: string;
  iv: string;
  tag: string;
  meta?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface VaultItemDecryptedData {
    title: string;
    username: string;
    password: string;
    url?: string;
    notes?: string;
    category?: string;
    favorite?: boolean;
}

// A VaultItem after it has been decrypted on the client
export interface DecryptedVaultItem extends VaultItem {
    decryptedData: VaultItemDecryptedData;
    decryptionError?: boolean;
}
