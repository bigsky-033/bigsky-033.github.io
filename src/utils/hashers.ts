// Hash generation utilities using Web Crypto API and crypto-js for MD5
import CryptoJS from 'crypto-js';

export type HashAlgorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-512';
export type HashFormat = 'uppercase' | 'lowercase';

/**
 * Generate MD5 hash using crypto-js (since Web Crypto API doesn't support MD5)
 */
export const generateMD5 = async (input: string | ArrayBuffer): Promise<string> => {
  if (input instanceof ArrayBuffer) {
    const uint8Array = new Uint8Array(input);
    const wordArray = CryptoJS.lib.WordArray.create(uint8Array);
    return CryptoJS.MD5(wordArray).toString();
  }
  return CryptoJS.MD5(input).toString();
};

/**
 * Generate hash using Web Crypto API for SHA algorithms
 */
export const generateSHAHash = async (
  algorithm: 'SHA-1' | 'SHA-256' | 'SHA-512',
  input: string | ArrayBuffer
): Promise<string> => {
  let data: ArrayBuffer;
  
  if (input instanceof ArrayBuffer) {
    data = input;
  } else {
    data = new TextEncoder().encode(input);
  }

  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Generate hash for any supported algorithm
 */
export const generateHash = async (
  algorithm: HashAlgorithm,
  input: string | ArrayBuffer,
  format: HashFormat = 'lowercase'
): Promise<string> => {
  let hash: string;

  switch (algorithm) {
    case 'MD5':
      hash = await generateMD5(input);
      break;
    case 'SHA-1':
    case 'SHA-256':
    case 'SHA-512':
      hash = await generateSHAHash(algorithm, input);
      break;
    default:
      throw new Error(`Unsupported hash algorithm: ${algorithm}`);
  }

  return format === 'uppercase' ? hash.toUpperCase() : hash.toLowerCase();
};

/**
 * Generate hashes for all supported algorithms
 */
export const generateAllHashes = async (
  input: string | ArrayBuffer,
  format: HashFormat = 'lowercase'
): Promise<Record<HashAlgorithm, string>> => {
  const algorithms: HashAlgorithm[] = ['MD5', 'SHA-1', 'SHA-256', 'SHA-512'];
  const results: Record<HashAlgorithm, string> = {} as Record<HashAlgorithm, string>;

  for (const algorithm of algorithms) {
    results[algorithm] = await generateHash(algorithm, input, format);
  }

  return results;
};

/**
 * Read file as ArrayBuffer for hash generation
 */
export const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Compare two hashes (case-insensitive)
 */
export const compareHashes = (hash1: string, hash2: string): boolean => {
  return hash1.toLowerCase() === hash2.toLowerCase();
};

/**
 * Validate hash format for a specific algorithm
 */
export const validateHashFormat = (hash: string, algorithm: HashAlgorithm): boolean => {
  const lengths: Record<HashAlgorithm, number> = {
    'MD5': 32,
    'SHA-1': 40,
    'SHA-256': 64,
    'SHA-512': 128
  };

  const expectedLength = lengths[algorithm];
  return hash.length === expectedLength && /^[a-fA-F0-9]+$/.test(hash);
};

/**
 * Get hash algorithm info
 */
export const getHashAlgorithmInfo = (algorithm: HashAlgorithm) => {
  const info = {
    'MD5': {
      name: 'MD5',
      description: 'Message Digest Algorithm 5',
      length: 32,
      secure: false,
      note: 'Not cryptographically secure, use for checksums only'
    },
    'SHA-1': {
      name: 'SHA-1',
      description: 'Secure Hash Algorithm 1',
      length: 40,
      secure: false,
      note: 'Deprecated for cryptographic use, but still used for git commits'
    },
    'SHA-256': {
      name: 'SHA-256',
      description: 'Secure Hash Algorithm 256-bit',
      length: 64,
      secure: true,
      note: 'Cryptographically secure, widely used'
    },
    'SHA-512': {
      name: 'SHA-512',
      description: 'Secure Hash Algorithm 512-bit',
      length: 128,
      secure: true,
      note: 'Cryptographically secure, strongest option'
    }
  };

  return info[algorithm];
};