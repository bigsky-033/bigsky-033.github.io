import { describe, it, expect } from 'vitest';
import { decodeJWT, formatJWTMetadata, isJWTExpired, encodeBase64, decodeBase64, encodeBase64UrlSafe, decodeBase64UrlSafe, detectBase64Type, encodeURL, decodeURL, encodeURIFull, decodeURIFull, parseQueryString, buildQueryString, isValidURL, detectURLEncoding } from '../converters';

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

  describe('Base64 Functions', () => {
    describe('encodeBase64', () => {
      it('should encode text to Base64', () => {
        expect(encodeBase64('Hello World!')).toBe('SGVsbG8gV29ybGQh');
        expect(encodeBase64('test')).toBe('dGVzdA==');
      });

      it('should handle Unicode characters', () => {
        expect(encodeBase64('🌟 Hello 世界! 🚀')).toBeTruthy();
        // Verify roundtrip
        const encoded = encodeBase64('🌟 Hello 世界! 🚀');
        expect(decodeBase64(encoded)).toBe('🌟 Hello 世界! 🚀');
      });

      it('should handle empty string', () => {
        expect(encodeBase64('')).toBe('');
      });
    });

    describe('decodeBase64', () => {
      it('should decode Base64 to text', () => {
        expect(decodeBase64('SGVsbG8gV29ybGQh')).toBe('Hello World!');
        expect(decodeBase64('dGVzdA==')).toBe('test');
      });

      it('should throw error for invalid Base64', () => {
        expect(() => decodeBase64('invalid-base64!@#')).toThrow('Invalid Base64 string');
      });

      it('should handle empty string', () => {
        expect(decodeBase64('')).toBe('');
      });
    });

    describe('encodeBase64UrlSafe', () => {
      it('should encode text to URL-safe Base64', () => {
        const text = 'Hello>World?';
        const encoded = encodeBase64UrlSafe(text);
        expect(encoded).toBe('SGVsbG8-V29ybGQ_');
        expect(encoded).not.toContain('+');
        expect(encoded).not.toContain('/');
        expect(encoded).not.toContain('=');
      });

      it('should handle text that produces standard Base64 with padding', () => {
        const encoded = encodeBase64UrlSafe('test');
        expect(encoded).toBe('dGVzdA'); // No padding
      });
    });

    describe('decodeBase64UrlSafe', () => {
      it('should decode URL-safe Base64 to text', () => {
        expect(decodeBase64UrlSafe('SGVsbG8-V29ybGQ_')).toBe('Hello>World?');
        expect(decodeBase64UrlSafe('dGVzdA')).toBe('test');
      });

      it('should throw error for invalid URL-safe Base64', () => {
        expect(() => decodeBase64UrlSafe('invalid+base64=')).toThrow('Invalid URL-safe Base64 string');
      });

      it('should handle empty string', () => {
        expect(decodeBase64UrlSafe('')).toBe('');
      });
    });

    describe('detectBase64Type', () => {
      it('should detect standard Base64', () => {
        expect(detectBase64Type('SGVsbG8gV29ybGQh')).toBe('standard');
        expect(detectBase64Type('dGVzdA==')).toBe('standard');
        expect(detectBase64Type('YWJjZGVmZw==')).toBe('standard');
      });

      it('should detect URL-safe Base64', () => {
        expect(detectBase64Type('SGVsbG8-V29ybGQ_')).toBe('url-safe');
        expect(detectBase64Type('dGVzdA')).toBe('standard'); // No special chars, defaults to standard
      });

      it('should detect invalid Base64', () => {
        expect(detectBase64Type('invalid-base64!@#')).toBe('invalid');
        expect(detectBase64Type('hello world')).toBe('invalid');
        expect(detectBase64Type('')).toBe('invalid');
      });

      it('should handle edge cases', () => {
        // Valid characters but invalid Base64
        expect(detectBase64Type('SGVs')).toBe('standard'); // Valid 4-char Base64
        expect(detectBase64Type('A')).toBe('invalid'); // Single character
        expect(detectBase64Type('AB')).toBe('invalid'); // Too short
        expect(detectBase64Type('ABC')).toBe('invalid'); // Too short
      });
    });

    describe('Base64 roundtrip tests', () => {
      it('should maintain data integrity through encode/decode cycles', () => {
        const testStrings = [
          'Hello World!',
          'Test with spaces and symbols: !@#$%^&*()',
          '🌟 Unicode test 世界 🚀',
          '',
          'a',
          'abcdefghijklmnopqrstuvwxyz',
          'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        ];

        testStrings.forEach(text => {
          // Standard Base64 roundtrip
          const standardEncoded = encodeBase64(text);
          expect(decodeBase64(standardEncoded)).toBe(text);

          // URL-safe Base64 roundtrip
          const urlSafeEncoded = encodeBase64UrlSafe(text);
          expect(decodeBase64UrlSafe(urlSafeEncoded)).toBe(text);
        });
      });
    });
  });

  describe('URL Functions', () => {
    describe('encodeURL', () => {
      it('should encode URL components', () => {
        expect(encodeURL('Hello World!')).toBe('Hello%20World!');
        expect(encodeURL('test@example.com')).toBe('test%40example.com');
        expect(encodeURL('special chars: &=?/')).toBe('special%20chars%3A%20%26%3D%3F%2F');
      });

      it('should handle empty string', () => {
        expect(encodeURL('')).toBe('');
      });

      it('should handle Unicode characters', () => {
        expect(encodeURL('Hello 世界!')).toBeTruthy();
        // Verify roundtrip
        const encoded = encodeURL('Hello 世界!');
        expect(decodeURL(encoded)).toBe('Hello 世界!');
      });
    });

    describe('decodeURL', () => {
      it('should decode URL components', () => {
        expect(decodeURL('Hello%20World!')).toBe('Hello World!');
        expect(decodeURL('test%40example.com')).toBe('test@example.com');
        expect(decodeURL('special%20chars%3A%20%26%3D%3F%2F')).toBe('special chars: &=?/');
      });

      it('should throw error for invalid URL encoding', () => {
        expect(() => decodeURL('%ZZ')).toThrow('Invalid URL encoded string');
      });

      it('should handle empty string', () => {
        expect(decodeURL('')).toBe('');
      });
    });

    describe('encodeURIFull', () => {
      it('should encode full URIs', () => {
        expect(encodeURIFull('https://example.com/path with spaces')).toBe('https://example.com/path%20with%20spaces');
        expect(encodeURIFull('https://example.com/path?query=hello world')).toBe('https://example.com/path?query=hello%20world');
      });

      it('should preserve URI structure', () => {
        const uri = 'https://example.com:8080/path?query=value#fragment';
        const encoded = encodeURIFull(uri);
        expect(encoded).toContain('https://');
        expect(encoded).toContain('example.com:8080');
        expect(encoded).toContain('?query=value');
        expect(encoded).toContain('#fragment');
      });
    });

    describe('decodeURIFull', () => {
      it('should decode full URIs', () => {
        expect(decodeURIFull('https://example.com/path%20with%20spaces')).toBe('https://example.com/path with spaces');
        expect(decodeURIFull('https://example.com/path?query=hello%20world')).toBe('https://example.com/path?query=hello world');
      });

      it('should throw error for invalid URI encoding', () => {
        expect(() => decodeURIFull('https://example.com/%ZZ')).toThrow('Invalid URI encoded string');
      });
    });

    describe('parseQueryString', () => {
      it('should parse query string with leading ?', () => {
        const result = parseQueryString('?name=John&age=30');
        expect(result).toEqual({ name: 'John', age: '30' });
      });

      it('should parse query string without leading ?', () => {
        const result = parseQueryString('name=John&age=30');
        expect(result).toEqual({ name: 'John', age: '30' });
      });

      it('should handle URL encoded parameters', () => {
        const result = parseQueryString('name=John%20Doe&city=New%20York');
        expect(result).toEqual({ name: 'John Doe', city: 'New York' });
      });

      it('should handle parameters without values', () => {
        const result = parseQueryString('flag&name=John');
        expect(result).toEqual({ flag: '', name: 'John' });
      });

      it('should handle empty query string', () => {
        expect(parseQueryString('')).toEqual({});
        expect(parseQueryString('?')).toEqual({});
      });

      it('should handle malformed encoding gracefully', () => {
        const result = parseQueryString('name=John%ZZ&valid=test');
        expect(result).toEqual({ 'name': 'John%ZZ', valid: 'test' });
      });
    });

    describe('buildQueryString', () => {
      it('should build query string from object', () => {
        const params = { name: 'John', age: '30' };
        const result = buildQueryString(params);
        expect(result).toBe('?name=John&age=30');
      });

      it('should URL encode parameter values', () => {
        const params = { name: 'John Doe', city: 'New York' };
        const result = buildQueryString(params);
        expect(result).toBe('?name=John%20Doe&city=New%20York');
      });

      it('should handle empty values', () => {
        const params = { flag: '', name: 'John' };
        const result = buildQueryString(params);
        expect(result).toBe('?flag=&name=John');
      });

      it('should filter out empty keys but keep space keys', () => {
        const params = { '': 'value', name: 'John', ' ': 'spaces' };
        const result = buildQueryString(params);
        expect(result).not.toContain('=value'); // Empty key should be filtered out
        expect(result).toContain('name=John');
        expect(result).toContain('%20=spaces'); // Space key gets encoded
      });

      it('should return empty string for empty object', () => {
        expect(buildQueryString({})).toBe('');
      });
    });

    describe('isValidURL', () => {
      it('should validate correct URLs', () => {
        expect(isValidURL('https://example.com')).toBe(true);
        expect(isValidURL('http://example.com:8080/path')).toBe(true);
        expect(isValidURL('https://example.com/path?query=value#fragment')).toBe(true);
        expect(isValidURL('ftp://files.example.com')).toBe(true);
      });

      it('should reject invalid URLs', () => {
        expect(isValidURL('not a url')).toBe(false);
        expect(isValidURL('example.com')).toBe(false); // Missing protocol
        expect(isValidURL('https://')).toBe(false); // Incomplete
        expect(isValidURL('')).toBe(false);
      });
    });

    describe('detectURLEncoding', () => {
      it('should detect encoded URLs', () => {
        expect(detectURLEncoding('Hello%20World')).toBe('encoded');
        expect(detectURLEncoding('test%40example.com')).toBe('encoded');
        expect(detectURLEncoding('%3C%3E')).toBe('encoded');
      });

      it('should detect decoded URLs', () => {
        expect(detectURLEncoding('Hello World')).toBe('decoded');
        expect(detectURLEncoding('test@example.com')).toBe('decoded');
        expect(detectURLEncoding('<script>')).toBe('decoded');
        expect(detectURLEncoding('query=value&other=test')).toBe('decoded');
      });

      it('should return unknown for ambiguous text', () => {
        expect(detectURLEncoding('HelloWorld')).toBe('unknown');
        expect(detectURLEncoding('test123')).toBe('unknown');
        expect(detectURLEncoding('abc-def_ghi')).toBe('unknown');
      });

      it('should handle empty string', () => {
        expect(detectURLEncoding('')).toBe('unknown');
      });
    });

    describe('URL roundtrip tests', () => {
      it('should maintain data integrity through encode/decode cycles', () => {
        const testStrings = [
          'Hello World!',
          'test@example.com',
          'Special chars: &=?/#[]{}',
          'Unicode: 世界 🌍',
          'Mixed: Hello 世界! @#$%',
          '',
          'a',
          'query=value&other=test'
        ];

        testStrings.forEach(text => {
          // Component encoding roundtrip
          const componentEncoded = encodeURL(text);
          expect(decodeURL(componentEncoded)).toBe(text);

          // Full URI encoding roundtrip (for appropriate strings)
          if (!text.includes('://')) {
            const fullEncoded = encodeURIFull(text);
            expect(decodeURIFull(fullEncoded)).toBe(text);
          }
        });
      });

      it('should handle query string roundtrip', () => {
        const originalParams = {
          name: 'John Doe',
          city: 'New York',
          country: 'USA',
          flag: ''
        };

        const queryString = buildQueryString(originalParams);
        const parsedParams = parseQueryString(queryString);

        expect(parsedParams).toEqual(originalParams);
      });
    });
  });
});