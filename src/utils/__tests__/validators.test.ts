import { describe, it, expect } from 'vitest';
import { validateJson, isBase64, isJWT } from '../validators';

describe('validators', () => {
  describe('validateJson', () => {
    it('should return valid for correct JSON', () => {
      const result = validateJson('{"name":"test"}');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for incorrect JSON', () => {
      const result = validateJson('invalid json');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('isBase64', () => {
    it('should return true for valid Base64', () => {
      const validBase64 = btoa('hello world');
      expect(isBase64(validBase64)).toBe(true);
    });

    it('should return false for invalid Base64', () => {
      expect(isBase64('invalid base64!')).toBe(false);
    });
  });

  describe('isJWT', () => {
    it('should return true for JWT-like format', () => {
      expect(isJWT('header.payload.signature')).toBe(true);
    });

    it('should return false for non-JWT format', () => {
      expect(isJWT('not.a.jwt.token')).toBe(false);
      expect(isJWT('only-two.parts')).toBe(false);
    });
  });
});