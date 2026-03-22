/**
 * AES-256-GCM vault encryption using native Web Crypto API.
 * Key is derived from user password + user_id via PBKDF2.
 * Keys NEVER leave the client — only encrypted blobs go to Supabase.
 */

const PBKDF2_ITERATIONS = 100_000
const KEY_LENGTH = 256

/** Derive a CryptoKey from password + userId (as salt) */
export async function deriveKey(password: string, userId: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(userId),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

/** Encrypt a plain JSON object → { blob: string, iv: string } */
export async function encryptEntry(data: object, key: CryptoKey): Promise<{ blob: string; iv: string }> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(JSON.stringify(data))

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  )

  return {
    blob: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
    iv: btoa(String.fromCharCode(...iv)),
  }
}

/** Decrypt a { blob, iv } pair back to the original object */
export async function decryptEntry<T = unknown>(blob: string, iv: string, key: CryptoKey): Promise<T> {
  const ciphertext = Uint8Array.from(atob(blob), (c) => c.charCodeAt(0))
  const ivBytes = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0))

  const plaintext = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes },
    key,
    ciphertext
  )

  return JSON.parse(new TextDecoder().decode(plaintext)) as T
}
