import { describe, it, expect } from 'vitest';
import { decodeJWT, formatJWTMetadata, isJWTExpired } from '../converters';

// Helper function to create a test JWT using btoa directly for more reliable encoding
const createTestJWT = (header: object, payload: object, signature = 'test-signature') => {
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '');
  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

describe('JWT Functions', () => {
  describe('decodeJWT', () => {
    it('should decode a valid JWT token', () => {
      const header = { alg: 'HS256', typ: 'JWT' };
      const payload = { sub: '1234567890', name: 'John Doe', iat: 1516239022 };
      const jwt = createTestJWT(header, payload);

      const result = decodeJWT(jwt);

      expect(result.header).toEqual(header);
      expect(result.payload).toEqual(payload);
      expect(result.signature).toBe('test-signature');
    });

    it('should handle JWT with padding issues', () => {
      // Create a JWT that might have padding issues
      const header = { alg: 'RS256' };
      const payload = { sub: 'test' };
      const jwt = createTestJWT(header, payload);

      const result = decodeJWT(jwt);

      expect(result.header).toEqual(header);
      expect(result.payload).toEqual(payload);
    });

    it('should throw error for invalid JWT format', () => {
      expect(() => decodeJWT('invalid.jwt')).toThrow('Invalid JWT token - must have 3 parts separated by dots');
      expect(() => decodeJWT('only.one.part.extra')).toThrow('Invalid JWT token - must have 3 parts separated by dots');
      expect(() => decodeJWT('')).toThrow('Invalid JWT token - must have 3 parts separated by dots');
    });

    it('should throw error for invalid base64', () => {
      expect(() => decodeJWT('invalid-base64.invalid-base64.signature')).toThrow('Failed to decode JWT token - invalid base64 or JSON format');
    });
  });

  describe('formatJWTMetadata', () => {
    it('should format standard JWT claims', () => {
      const payload = {
        iss: 'https://example.com',
        sub: 'user123',
        aud: 'my-app',
        exp: 1700000000, // Future timestamp
        nbf: 1600000000, // Past timestamp
        iat: 1650000000, // Past timestamp
        jti: 'jwt-id-123'
      };

      const metadata = formatJWTMetadata(payload);

      expect(metadata['Issuer (iss)']).toBe('https://example.com');
      expect(metadata['Subject (sub)']).toBe('user123');
      expect(metadata['Audience (aud)']).toBe('my-app');
      expect(metadata['JWT ID (jti)']).toBe('jwt-id-123');
      
      // Check date formatting
      expect(metadata['Expires At (exp)']).toBe(new Date(1700000000 * 1000).toISOString());
      expect(metadata['Expires At (readable)']).toBe(new Date(1700000000 * 1000).toLocaleString());
      expect(metadata['Not Before (nbf)']).toBe(new Date(1600000000 * 1000).toISOString());
      expect(metadata['Issued At (iat)']).toBe(new Date(1650000000 * 1000).toISOString());
    });

    it('should handle array audience', () => {
      const payload = {
        aud: ['app1', 'app2', 'app3']
      };

      const metadata = formatJWTMetadata(payload);

      expect(metadata['Audience (aud)']).toBe('app1, app2, app3');
    });

    it('should handle missing claims', () => {
      const payload = {
        custom: 'value'
      };

      const metadata = formatJWTMetadata(payload);

      expect(Object.keys(metadata)).toHaveLength(0);
    });

    it('should handle partial claims', () => {
      const payload = {
        iss: 'test-issuer',
        exp: 1700000000
      };

      const metadata = formatJWTMetadata(payload);

      expect(metadata['Issuer (iss)']).toBe('test-issuer');
      expect(metadata['Expires At (exp)']).toBe(new Date(1700000000 * 1000).toISOString());
      expect(metadata['Subject (sub)']).toBeUndefined();
    });
  });

  describe('isJWTExpired', () => {
    it('should return false for non-expired token', () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour in future
      const payload = { exp: futureTimestamp };

      expect(isJWTExpired(payload)).toBe(false);
    });

    it('should return true for expired token', () => {
      const pastTimestamp = Math.floor(Date.now() / 1000) - 3600; // 1 hour in past
      const payload = { exp: pastTimestamp };

      expect(isJWTExpired(payload)).toBe(true);
    });

    it('should return false when no exp claim', () => {
      const payload = { sub: 'test' };

      expect(isJWTExpired(payload)).toBe(false);
    });

    it('should handle edge case of exactly now', () => {
      const nowTimestamp = Math.floor(Date.now() / 1000);
      const payload = { exp: nowTimestamp };

      // Should be expired since we check >= 
      expect(isJWTExpired(payload)).toBe(true);
    });
  });
});