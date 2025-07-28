import { describe, it, expect } from 'vitest';
import {
  generateMD5,
  generateSHAHash,
  generateHash,
  generateAllHashes,
  compareHashes,
  validateHashFormat,
  getHashAlgorithmInfo,
  type HashAlgorithm
} from '../hashers';

describe('Hash Generation Functions', () => {
  const testText = 'Hello, World!';
  const testBuffer = new TextEncoder().encode(testText);

  describe('generateMD5', () => {
    it('should generate MD5 hash from string', async () => {
      const hash = await generateMD5(testText);
      expect(hash).toBe('65a8e27d8879283831b664bd8b7f0ad4');
      expect(hash).toHaveLength(32);
    });

    it('should generate MD5 hash from ArrayBuffer', async () => {
      const hash = await generateMD5(testBuffer);
      expect(hash).toHaveLength(32);
      expect(hash).toMatch(/^[a-f0-9]{32}$/);
    });

    it('should generate consistent hashes for same input', async () => {
      const hash1 = await generateMD5(testText);
      const hash2 = await generateMD5(testText);
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different inputs', async () => {
      const hash1 = await generateMD5('input1');
      const hash2 = await generateMD5('input2');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('generateSHAHash', () => {
    it('should generate SHA-1 hash', async () => {
      const hash = await generateSHAHash('SHA-1', testText);
      expect(hash).toBe('0a0a9f2a6772942557ab5355d76af442f8f65e01');
      expect(hash).toHaveLength(40);
    });

    it('should generate SHA-256 hash', async () => {
      const hash = await generateSHAHash('SHA-256', testText);
      expect(hash).toBe('dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f');
      expect(hash).toHaveLength(64);
    });

    it('should generate SHA-512 hash', async () => {
      const hash = await generateSHAHash('SHA-512', testText);
      expect(hash).toBe('374d794a95cdcfd8b35993185fef9ba368f160d8daf432d08ba9f1ed1e5abe6cc69291e0fa2fe0006a52570ef18c19def4e617c33ce52ef0a6e5fbe318cb0387');
      expect(hash).toHaveLength(128);
    });

    it('should generate hash from ArrayBuffer', async () => {
      const hash = await generateSHAHash('SHA-256', testBuffer);
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate consistent hashes for same input', async () => {
      const hash1 = await generateSHAHash('SHA-256', testText);
      const hash2 = await generateSHAHash('SHA-256', testText);
      expect(hash1).toBe(hash2);
    });
  });

  describe('generateHash', () => {
    it('should generate hash for each supported algorithm', async () => {
      const algorithms: HashAlgorithm[] = ['MD5', 'SHA-1', 'SHA-256', 'SHA-512'];
      
      for (const algorithm of algorithms) {
        const hash = await generateHash(algorithm, testText);
        expect(hash).toBeTruthy();
        expect(typeof hash).toBe('string');
      }
    });

    it('should generate lowercase hash by default', async () => {
      const hash = await generateHash('SHA-256', testText);
      expect(hash).toBe(hash.toLowerCase());
      expect(hash).not.toMatch(/[A-Z]/);
    });

    it('should generate uppercase hash when specified', async () => {
      const hash = await generateHash('SHA-256', testText, 'uppercase');
      expect(hash).toBe(hash.toUpperCase());
      expect(hash).not.toMatch(/[a-z]/);
    });

    it('should generate same hash content regardless of case format', async () => {
      const lowerHash = await generateHash('SHA-256', testText, 'lowercase');
      const upperHash = await generateHash('SHA-256', testText, 'uppercase');
      expect(lowerHash.toLowerCase()).toBe(upperHash.toLowerCase());
    });

    it('should throw error for unsupported algorithm', async () => {
      await expect(generateHash('INVALID' as HashAlgorithm, testText))
        .rejects.toThrow('Unsupported hash algorithm: INVALID');
    });
  });

  describe('generateAllHashes', () => {
    it('should generate all supported hashes', async () => {
      const hashes = await generateAllHashes(testText);
      
      expect(hashes).toHaveProperty('MD5');
      expect(hashes).toHaveProperty('SHA-1');
      expect(hashes).toHaveProperty('SHA-256');
      expect(hashes).toHaveProperty('SHA-512');
      
      expect(hashes.MD5).toHaveLength(32);
      expect(hashes['SHA-1']).toHaveLength(40);
      expect(hashes['SHA-256']).toHaveLength(64);
      expect(hashes['SHA-512']).toHaveLength(128);
    });

    it('should generate all hashes in specified format', async () => {
      const lowerHashes = await generateAllHashes(testText, 'lowercase');
      const upperHashes = await generateAllHashes(testText, 'uppercase');
      
      Object.values(lowerHashes).forEach(hash => {
        expect(hash).toBe(hash.toLowerCase());
      });
      
      Object.values(upperHashes).forEach(hash => {
        expect(hash).toBe(hash.toUpperCase());
      });
    });

    it('should work with ArrayBuffer input', async () => {
      const hashes = await generateAllHashes(testBuffer);
      expect(Object.keys(hashes)).toHaveLength(4);
      Object.values(hashes).forEach(hash => {
        expect(hash).toBeTruthy();
        expect(typeof hash).toBe('string');
      });
    });
  });

  describe('compareHashes', () => {
    it('should return true for identical hashes', () => {
      const hash = 'abc123def456';
      expect(compareHashes(hash, hash)).toBe(true);
    });

    it('should return true for hashes with different cases', () => {
      expect(compareHashes('ABC123DEF456', 'abc123def456')).toBe(true);
      expect(compareHashes('abc123def456', 'ABC123DEF456')).toBe(true);
    });

    it('should return false for different hashes', () => {
      expect(compareHashes('abc123', 'def456')).toBe(false);
      expect(compareHashes('abc123def456', 'abc123def457')).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(compareHashes('', '')).toBe(true);
      expect(compareHashes('abc123', '')).toBe(false);
      expect(compareHashes('', 'abc123')).toBe(false);
    });
  });

  describe('validateHashFormat', () => {
    it('should validate MD5 hash format', () => {
      expect(validateHashFormat('d41d8cd98f00b204e9800998ecf8427e', 'MD5')).toBe(true);
      expect(validateHashFormat('D41D8CD98F00B204E9800998ECF8427E', 'MD5')).toBe(true);
    });

    it('should validate SHA-1 hash format', () => {
      expect(validateHashFormat('da39a3ee5e6b4b0d3255bfef95601890afd80709', 'SHA-1')).toBe(true);
      expect(validateHashFormat('DA39A3EE5E6B4B0D3255BFEF95601890AFD80709', 'SHA-1')).toBe(true);
    });

    it('should validate SHA-256 hash format', () => {
      const validSHA256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
      expect(validateHashFormat(validSHA256, 'SHA-256')).toBe(true);
      expect(validateHashFormat(validSHA256.toUpperCase(), 'SHA-256')).toBe(true);
    });

    it('should validate SHA-512 hash format', () => {
      const validSHA512 = 'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e';
      expect(validateHashFormat(validSHA512, 'SHA-512')).toBe(true);
      expect(validateHashFormat(validSHA512.toUpperCase(), 'SHA-512')).toBe(true);
    });

    it('should reject invalid hash formats', () => {
      // Wrong length
      expect(validateHashFormat('abc123', 'MD5')).toBe(false);
      expect(validateHashFormat('d41d8cd98f00b204e9800998ecf8427e123', 'MD5')).toBe(false);
      
      // Invalid characters
      expect(validateHashFormat('g41d8cd98f00b204e9800998ecf8427e', 'MD5')).toBe(false);
      expect(validateHashFormat('d41d8cd98f00b204e9800998ecf8427z', 'MD5')).toBe(false);
      
      // Empty string
      expect(validateHashFormat('', 'MD5')).toBe(false);
    });
  });

  describe('getHashAlgorithmInfo', () => {
    it('should return correct info for MD5', () => {
      const info = getHashAlgorithmInfo('MD5');
      expect(info.name).toBe('MD5');
      expect(info.length).toBe(32);
      expect(info.secure).toBe(false);
      expect(info.description).toContain('Message Digest');
    });

    it('should return correct info for SHA-1', () => {
      const info = getHashAlgorithmInfo('SHA-1');
      expect(info.name).toBe('SHA-1');
      expect(info.length).toBe(40);
      expect(info.secure).toBe(false);
      expect(info.description).toContain('Secure Hash Algorithm');
    });

    it('should return correct info for SHA-256', () => {
      const info = getHashAlgorithmInfo('SHA-256');
      expect(info.name).toBe('SHA-256');
      expect(info.length).toBe(64);
      expect(info.secure).toBe(true);
      expect(info.description).toContain('256-bit');
    });

    it('should return correct info for SHA-512', () => {
      const info = getHashAlgorithmInfo('SHA-512');
      expect(info.name).toBe('SHA-512');
      expect(info.length).toBe(128);
      expect(info.secure).toBe(true);
      expect(info.description).toContain('512-bit');
    });
  });

  describe('Integration tests', () => {
    it('should generate different hashes for same input with different algorithms', async () => {
      const input = 'test input';
      const hashes = await generateAllHashes(input);
      
      const hashValues = Object.values(hashes);
      const uniqueHashes = new Set(hashValues);
      
      expect(uniqueHashes.size).toBe(hashValues.length);
    });

    it('should maintain consistency across multiple calls', async () => {
      const input = 'consistent test';
      
      const hashes1 = await generateAllHashes(input);
      const hashes2 = await generateAllHashes(input);
      
      expect(hashes1).toEqual(hashes2);
    });

    it('should handle special characters and Unicode', async () => {
      const specialInput = '🌟 Hello 世界! 🚀 Special chars: àáâãäå';
      const hashes = await generateAllHashes(specialInput);
      
      Object.values(hashes).forEach(hash => {
        expect(hash).toBeTruthy();
        expect(typeof hash).toBe('string');
        expect(hash).toMatch(/^[a-f0-9]+$/);
      });
    });

    it('should work with empty input', async () => {
      const hashes = await generateAllHashes('');
      
      // Known hashes for empty string
      expect(hashes.MD5).toBe('d41d8cd98f00b204e9800998ecf8427e');
      expect(hashes['SHA-1']).toBe('da39a3ee5e6b4b0d3255bfef95601890afd80709');
      expect(hashes['SHA-256']).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
      expect(hashes['SHA-512']).toBe('cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e');
    });
  });
});