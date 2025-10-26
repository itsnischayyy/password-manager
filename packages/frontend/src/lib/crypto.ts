import { Buffer } from 'buffer';

declare global {
  interface Window {
    Buffer: typeof Buffer;
  }
}

// Polyfill Buffer for browser environments where it's not globally available.
if (typeof window !== 'undefined' && typeof window.Buffer === 'undefined') {
  window.Buffer = Buffer;
}

// --- Cryptographic Parameters ---
// Using PBKDF2 with SHA-512 as it's native to Web Crypto API
// These parameters offer strong security for web clients

export const PBKDF2_PARAMS = {
  iterations: 600000,  // OWASP recommendation (2023) for PBKDF2-SHA512
  hashAlgorithm: 'SHA-512',
  keyLength: 256,      // 256 bits for AES-256 keys
  saltLen: 16,         // 16 bytes (128 bits) for salt
};

export const AES_GCM_PARAMS = {
  name: 'AES-GCM',
  length: 256,         // Key length in bits
  iv_length_bytes: 12, // 96-bit IV, recommended for GCM for performance and security
};

// --- Utility Functions ---

export const generateRandomBytes = (byteLength: number): Uint8Array =>
  window.crypto.getRandomValues(new Uint8Array(byteLength));

export const bytesToBase64 = (bytes: Uint8Array): string =>
  Buffer.from(bytes).toString('base64');

export const base64ToBytes = (b64: string): Uint8Array =>
  new Uint8Array(Buffer.from(b64, 'base64'));

export const textToBytes = (text: string): Uint8Array =>
  new TextEncoder().encode(text);

export const bytesToText = (bytes: Uint8Array): string =>
  new TextDecoder().decode(bytes);

// --- Core Cryptographic Functions ---

/**
 * Derives a 256-bit key from a password and salt using PBKDF2.
 * This is used to create the Key-Encryption-Key (KEK) from the user's master password.
 * The KEK is only held in memory and never stored.
 */
export async function deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<Uint8Array> {
  // Import the password as a CryptoKey
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    textToBytes(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // Derive the key using PBKDF2
  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_PARAMS.iterations,
      hash: PBKDF2_PARAMS.hashAlgorithm,
    },
    passwordKey,
    PBKDF2_PARAMS.keyLength
  );

  return new Uint8Array(derivedBits);
}

/**
 * Creates a PBKDF2 hash for password verification on the server.
 * This uses a *different* salt from the key derivation process for cryptographic separation.
 */
export async function createPasswordVerifier(password: string) {
  const salt = generateRandomBytes(PBKDF2_PARAMS.saltLen);
  
  // Derive a hash using PBKDF2
  const hash = await deriveKeyFromPassword(password, salt);
  
  // Encode the hash in a standard format: algorithm$iterations$salt$hash
  const pbkdf2Hash = `pbkdf2_sha512$${PBKDF2_PARAMS.iterations}$${bytesToBase64(salt)}$${bytesToBase64(hash)}`;

  return {
    pbkdf2Hash,
    pbkdf2Salt: bytesToBase64(salt),
    pbkdf2Params: {
      iterations: PBKDF2_PARAMS.iterations,
      algorithm: PBKDF2_PARAMS.hashAlgorithm,
    },
  };
}

/**
 * Generates a new 256-bit AES-GCM key using the Web Crypto API.
 * This is used to create the main Vault Key (VK).
 */
export const generateAESKey = (): Promise<CryptoKey> =>
  window.crypto.subtle.generateKey(
    { name: AES_GCM_PARAMS.name, length: AES_GCM_PARAMS.length },
    true, // extractable
    ['encrypt', 'decrypt']
  );

/**
 * Encrypts data using AES-256-GCM.
 * Associated data can be included to bind the ciphertext to a specific context (e.g., user ID, item ID),
 * preventing certain types of attacks.
 */
export async function aesGcmEncrypt(key: CryptoKey, plaintext: Uint8Array, associatedData?: Uint8Array) {
  const iv = generateRandomBytes(AES_GCM_PARAMS.iv_length_bytes);
  
  // Build the algorithm parameters conditionally
  const algorithm: AesGcmParams = { 
    name: AES_GCM_PARAMS.name, 
    iv 
  };
  
  // Only add additionalData if it's provided
  if (associatedData) {
    algorithm.additionalData = associatedData;
  }
  
  const encryptedData = await window.crypto.subtle.encrypt(
    algorithm,
    key,
    plaintext
  );

  // The Web Crypto API returns the ciphertext and auth tag combined. We separate them.
  const ciphertext = encryptedData.slice(0, encryptedData.byteLength - 16);
  const tag = encryptedData.slice(encryptedData.byteLength - 16);

  return {
    cipher: bytesToBase64(new Uint8Array(ciphertext)),
    iv: bytesToBase64(iv),
    tag: bytesToBase64(new Uint8Array(tag)),
  };
}

/**
 * Decrypts data using AES-256-GCM.
 * Will throw an error if the authentication tag is invalid, indicating the data
 * was tampered with or the key is incorrect.
 */
export async function aesGcmDecrypt(key: CryptoKey, ciphertext: string, iv: string, tag: string, associatedData?: Uint8Array): Promise<Uint8Array> {
  const ivBytes = base64ToBytes(iv);
  const cipherBytes = base64ToBytes(ciphertext);
  const tagBytes = base64ToBytes(tag);

  // Re-combine ciphertext and tag for the Web Crypto API
  const fullCiphertext = new Uint8Array(cipherBytes.length + tagBytes.length);
  fullCiphertext.set(cipherBytes);
  fullCiphertext.set(tagBytes, cipherBytes.length);

  // Build the algorithm parameters conditionally
  const algorithm: AesGcmParams = { 
    name: AES_GCM_PARAMS.name, 
    iv: ivBytes 
  };
  
  // Only add additionalData if it's provided
  if (associatedData) {
    algorithm.additionalData = associatedData;
  }

  const decrypted = await window.crypto.subtle.decrypt(
    algorithm,
    key,
    fullCiphertext
  );

  return new Uint8Array(decrypted);
}

/**
 * "Wraps" a CryptoKey (like the VK) by encrypting its raw bytes with another key (the KEK).
 */
export async function wrapKey(wrappingKey: Uint8Array, keyToWrap: CryptoKey) {
  const wrappingCryptoKey = await window.crypto.subtle.importKey(
    'raw',
    wrappingKey,
    { name: AES_GCM_PARAMS.name },
    false,
    ['encrypt']
  );

  const keyBytes = await window.crypto.subtle.exportKey('raw', keyToWrap);
  return aesGcmEncrypt(wrappingCryptoKey, new Uint8Array(keyBytes));
}

/**
 * "Unwraps" a key by decrypting its ciphertext with the KEK, then re-importing
 * the raw bytes back into a usable CryptoKey.
 */
export async function unwrapKey(unwrappingKey: Uint8Array, wrappedKeyData: { cipher: string; iv: string; tag: string }): Promise<CryptoKey> {
    const unwrappingCryptoKey = await window.crypto.subtle.importKey(
        'raw',
        unwrappingKey,
        { name: AES_GCM_PARAMS.name },
        false,
        ['decrypt']
    );

    const decryptedKeyBytes = await aesGcmDecrypt(
        unwrappingCryptoKey,
        wrappedKeyData.cipher,
        wrappedKeyData.iv,
        wrappedKeyData.tag
    );

    return window.crypto.subtle.importKey(
        'raw',
        decryptedKeyBytes,
        { name: AES_GCM_PARAMS.name, length: AES_GCM_PARAMS.length },
        true, // make it extractable
        ['encrypt', 'decrypt']
    );
}