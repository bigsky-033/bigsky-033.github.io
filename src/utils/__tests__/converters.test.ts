import { describe, it, expect } from 'vitest';
import { 
  decodeJWT, 
  formatJWTMetadata, 
  isJWTExpired, 
  encodeBase64, 
  decodeBase64, 
  encodeBase64UrlSafe, 
  decodeBase64UrlSafe, 
  detectBase64Type, 
  encodeURL, 
  decodeURL, 
  encodeURIFull, 
  decodeURIFull, 
  parseQueryString, 
  buildQueryString, 
  isValidURL, 
  detectURLEncoding,
  textToAsciiCodes,
  asciiCodesToText,
  textToUnicodeCodes,
  unicodeCodesToText,
  textToEscapeSequences,
  escapeSequencesToText,
  textToHtmlEntities,
  htmlEntitiesToText,
  analyzeCharacterFrequency,
  detectTextEncoding,
  getCharacterInfo
} from '../converters';

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

  describe('ASCII/Unicode Functions', () => {
    describe('textToAsciiCodes', () => {
      it('should convert text to decimal ASCII codes', () => {
        expect(textToAsciiCodes('Hello', 'decimal')).toEqual(['72', '101', '108', '108', '111']);
        expect(textToAsciiCodes('A', 'decimal')).toEqual(['65']);
        expect(textToAsciiCodes('!', 'decimal')).toEqual(['33']);
      });

      it('should convert text to hexadecimal ASCII codes', () => {
        expect(textToAsciiCodes('Hello', 'hex')).toEqual(['48', '65', '6C', '6C', '6F']);
        expect(textToAsciiCodes('A', 'hex')).toEqual(['41']);
        expect(textToAsciiCodes('z', 'hex')).toEqual(['7A']);
      });

      it('should convert text to octal ASCII codes', () => {
        expect(textToAsciiCodes('Hello', 'octal')).toEqual(['110', '145', '154', '154', '157']);
        expect(textToAsciiCodes('A', 'octal')).toEqual(['101']);
      });

      it('should convert text to binary ASCII codes', () => {
        expect(textToAsciiCodes('Hi', 'binary')).toEqual(['1001000', '1101001']);
        expect(textToAsciiCodes('A', 'binary')).toEqual(['1000001']);
      });

      it('should handle empty string', () => {
        expect(textToAsciiCodes('', 'decimal')).toEqual([]);
      });

      it('should handle special characters', () => {
        expect(textToAsciiCodes(' ', 'decimal')).toEqual(['32']);
        expect(textToAsciiCodes('\n', 'decimal')).toEqual(['10']);
        expect(textToAsciiCodes('\t', 'decimal')).toEqual(['9']);
      });
    });

    describe('asciiCodesToText', () => {
      it('should convert decimal ASCII codes to text', () => {
        expect(asciiCodesToText(['72', '101', '108', '108', '111'], 'decimal')).toBe('Hello');
        expect(asciiCodesToText(['65'], 'decimal')).toBe('A');
        expect(asciiCodesToText(['33'], 'decimal')).toBe('!');
      });

      it('should convert hexadecimal ASCII codes to text', () => {
        expect(asciiCodesToText(['48', '65', '6C', '6C', '6F'], 'hex')).toBe('Hello');
        expect(asciiCodesToText(['41'], 'hex')).toBe('A');
        expect(asciiCodesToText(['7A'], 'hex')).toBe('z');
      });

      it('should convert octal ASCII codes to text', () => {
        expect(asciiCodesToText(['110', '145', '154', '154', '157'], 'octal')).toBe('Hello');
        expect(asciiCodesToText(['101'], 'octal')).toBe('A');
      });

      it('should convert binary ASCII codes to text', () => {
        expect(asciiCodesToText(['1001000', '1101001'], 'binary')).toBe('Hi');
        expect(asciiCodesToText(['1000001'], 'binary')).toBe('A');
      });

      it('should handle invalid codes gracefully', () => {
        expect(asciiCodesToText(['invalid'], 'decimal')).toBe('');
        expect(asciiCodesToText(['72', 'invalid', '108'], 'decimal')).toBe('Hl');
      });

      it('should handle empty array', () => {
        expect(asciiCodesToText([], 'decimal')).toBe('');
      });
    });

    describe('textToUnicodeCodes', () => {
      it('should convert text to Unicode code points', () => {
        expect(textToUnicodeCodes('Hello')).toEqual(['U+0048', 'U+0065', 'U+006C', 'U+006C', 'U+006F']);
        expect(textToUnicodeCodes('A')).toEqual(['U+0041']);
      });

      it('should handle Unicode characters and emojis', () => {
        expect(textToUnicodeCodes('🌟')).toEqual(['U+1F31F']);
        expect(textToUnicodeCodes('世')).toEqual(['U+4E16']);
        expect(textToUnicodeCodes('界')).toEqual(['U+754C']);
      });

      it('should handle empty string', () => {
        expect(textToUnicodeCodes('')).toEqual([]);
      });

      it('should handle mixed ASCII and Unicode', () => {
        const result = textToUnicodeCodes('A🌟');
        expect(result).toEqual(['U+0041', 'U+1F31F']);
      });
    });

    describe('unicodeCodesToText', () => {
      it('should convert Unicode code points to text', () => {
        expect(unicodeCodesToText(['U+0048', 'U+0065', 'U+006C', 'U+006C', 'U+006F'])).toBe('Hello');
        expect(unicodeCodesToText(['U+0041'])).toBe('A');
      });

      it('should handle Unicode characters and emojis', () => {
        expect(unicodeCodesToText(['U+1F31F'])).toBe('🌟');
        expect(unicodeCodesToText(['U+4E16'])).toBe('世');
        expect(unicodeCodesToText(['U+754C'])).toBe('界');
      });

      it('should handle plain hex numbers without U+ prefix', () => {
        expect(unicodeCodesToText(['41'])).toBe('A');
        expect(unicodeCodesToText(['1F31F'])).toBe('🌟');
      });

      it('should handle mixed formats', () => {
        expect(unicodeCodesToText(['U+0041', '1F31F'])).toBe('A🌟');
      });

      it('should handle invalid codes gracefully', () => {
        expect(unicodeCodesToText(['invalid'])).toBe('');
        expect(unicodeCodesToText(['U+0041', 'invalid', 'U+0042'])).toBe('AB');
      });

      it('should handle empty array', () => {
        expect(unicodeCodesToText([])).toBe('');
      });
    });

    describe('textToEscapeSequences', () => {
      it('should convert text to escape sequences', () => {
        expect(textToEscapeSequences('Hello\nWorld')).toBe('Hello\\nWorld');
        expect(textToEscapeSequences('Tab\tHere')).toBe('Tab\\tHere');
        expect(textToEscapeSequences('Quote"Me')).toBe('Quote\\"Me');
      });

      it('should handle all common escape characters', () => {
        expect(textToEscapeSequences('\n')).toBe('\\n');
        expect(textToEscapeSequences('\r')).toBe('\\r');
        expect(textToEscapeSequences('\t')).toBe('\\t');
        expect(textToEscapeSequences('"')).toBe('\\"');
        expect(textToEscapeSequences("'")).toBe("\\'");
        expect(textToEscapeSequences('\f')).toBe('\\f');
        expect(textToEscapeSequences('\b')).toBe('\\b');
        expect(textToEscapeSequences('\v')).toBe('\\v');
        expect(textToEscapeSequences('\0')).toBe('\\0');
      });

      it('should handle backslashes correctly', () => {
        expect(textToEscapeSequences('\\')).toBe('\\\\');
        expect(textToEscapeSequences('\\n')).toBe('\\\\n');
      });

      it('should handle empty string', () => {
        expect(textToEscapeSequences('')).toBe('');
      });

      it('should handle complex strings', () => {
        expect(textToEscapeSequences('Hello\n\tWorld\r\n"Test"')).toBe('Hello\\n\\tWorld\\r\\n\\"Test\\"');
      });
    });

    describe('escapeSequencesToText', () => {
      it('should convert escape sequences to text', () => {
        expect(escapeSequencesToText('Hello\\nWorld')).toBe('Hello\nWorld');
        expect(escapeSequencesToText('Tab\\tHere')).toBe('Tab\tHere');
        expect(escapeSequencesToText('Quote\\"Me')).toBe('Quote"Me');
      });

      it('should handle all common escape sequences', () => {
        expect(escapeSequencesToText('\\n')).toBe('\n');
        expect(escapeSequencesToText('\\r')).toBe('\r');
        expect(escapeSequencesToText('\\t')).toBe('\t');
        expect(escapeSequencesToText('\\"')).toBe('"');
        expect(escapeSequencesToText("\\'")).toBe("'");
        expect(escapeSequencesToText('\\f')).toBe('\f');
        expect(escapeSequencesToText('\\b')).toBe('\b');
        expect(escapeSequencesToText('\\v')).toBe('\v');
        expect(escapeSequencesToText('\\0')).toBe('\0');
      });

      it('should handle Unicode escape sequences', () => {
        expect(escapeSequencesToText('\\u0041')).toBe('A');
        expect(escapeSequencesToText('\\u1F31F')).toBe('🌟');
        expect(escapeSequencesToText('\\x41')).toBe('A');
        expect(escapeSequencesToText('\\x7A')).toBe('z');
      });

      it('should handle backslashes correctly', () => {
        expect(escapeSequencesToText('\\\\')).toBe('\\');
        expect(escapeSequencesToText('\\\\n')).toBe('\\n');
      });

      it('should handle empty string', () => {
        expect(escapeSequencesToText('')).toBe('');
      });

      it('should handle complex strings', () => {
        expect(escapeSequencesToText('Hello\\n\\tWorld\\r\\n\\"Test\\"')).toBe('Hello\n\tWorld\r\n"Test"');
      });
    });

    describe('textToHtmlEntities', () => {
      it('should convert text to HTML entities', () => {
        expect(textToHtmlEntities('<Hello>')).toBe('&lt;Hello&gt;');
        expect(textToHtmlEntities('A & B')).toBe('A &amp; B');
        expect(textToHtmlEntities('"Quote"')).toBe('&quot;Quote&quot;');
        expect(textToHtmlEntities("'Single'")).toBe('&#39;Single&#39;');
      });

      it('should handle Unicode characters', () => {
        expect(textToHtmlEntities('©')).toBe('&#169;');
        expect(textToHtmlEntities('™')).toBe('&#8482;');
        expect(textToHtmlEntities('世界')).toContain('&#');
      });

      it('should handle empty string', () => {
        expect(textToHtmlEntities('')).toBe('');
      });

      it('should handle complex HTML', () => {
        expect(textToHtmlEntities('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      });
    });

    describe('htmlEntitiesToText', () => {
      it('should convert HTML entities to text', () => {
        expect(htmlEntitiesToText('&lt;Hello&gt;')).toBe('<Hello>');
        expect(htmlEntitiesToText('A &amp; B')).toBe('A & B');
        expect(htmlEntitiesToText('&quot;Quote&quot;')).toBe('"Quote"');
        expect(htmlEntitiesToText('&#39;Single&#39;')).toBe("'Single'");
      });

      it('should handle numeric HTML entities', () => {
        expect(htmlEntitiesToText('&#65;')).toBe('A');
        expect(htmlEntitiesToText('&#169;')).toBe('©');
        expect(htmlEntitiesToText('&#8482;')).toBe('™');
      });

      it('should handle hexadecimal HTML entities', () => {
        expect(htmlEntitiesToText('&#x41;')).toBe('A');
        expect(htmlEntitiesToText('&#xA9;')).toBe('©');
      });

      it('should handle named HTML entities', () => {
        expect(htmlEntitiesToText('&nbsp;')).toBe('\u00A0');
        expect(htmlEntitiesToText('&copy;')).toBe('©');
        expect(htmlEntitiesToText('&reg;')).toBe('®');
        expect(htmlEntitiesToText('&trade;')).toBe('™');
        expect(htmlEntitiesToText('&hellip;')).toBe('…');
        expect(htmlEntitiesToText('&mdash;')).toBe('—');
        expect(htmlEntitiesToText('&ndash;')).toBe('–');
        expect(htmlEntitiesToText('&lsquo;')).toBe('\u2018');
        expect(htmlEntitiesToText('&rsquo;')).toBe('\u2019');
        expect(htmlEntitiesToText('&ldquo;')).toBe('\u201C');
        expect(htmlEntitiesToText('&rdquo;')).toBe('\u201D');
      });

      it('should handle unknown entities gracefully', () => {
        expect(htmlEntitiesToText('&unknown;')).toBe('&unknown;');
      });

      it('should handle empty string', () => {
        expect(htmlEntitiesToText('')).toBe('');
      });

      it('should handle complex HTML', () => {
        expect(htmlEntitiesToText('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;')).toBe('<script>alert("xss")</script>');
      });
    });

    describe('analyzeCharacterFrequency', () => {
      it('should analyze character frequency', () => {
        const result = analyzeCharacterFrequency('hello world');
        expect(result).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ char: 'l', count: 3, percentage: expect.any(Number) }),
            expect.objectContaining({ char: 'o', count: 2, percentage: expect.any(Number) }),
            expect.objectContaining({ char: 'h', count: 1, percentage: expect.any(Number) }),
            expect.objectContaining({ char: 'e', count: 1, percentage: expect.any(Number) }),
            expect.objectContaining({ char: ' ', count: 1, percentage: expect.any(Number) }),
            expect.objectContaining({ char: 'w', count: 1, percentage: expect.any(Number) }),
            expect.objectContaining({ char: 'r', count: 1, percentage: expect.any(Number) }),
            expect.objectContaining({ char: 'd', count: 1, percentage: expect.any(Number) }),
          ])
        );
        
        // Check that results are sorted by count
        expect(result[0].count).toBeGreaterThanOrEqual(result[1].count);
        expect(result[1].count).toBeGreaterThanOrEqual(result[2].count);
      });

      it('should calculate correct percentages', () => {
        const result = analyzeCharacterFrequency('aaa');
        expect(result).toEqual([
          { char: 'a', count: 3, percentage: 100 }
        ]);
      });

      it('should handle empty string', () => {
        const result = analyzeCharacterFrequency('');
        expect(result).toEqual([]);
      });

      it('should handle single character', () => {
        const result = analyzeCharacterFrequency('a');
        expect(result).toEqual([
          { char: 'a', count: 1, percentage: 100 }
        ]);
      });

      it('should handle Unicode characters', () => {
        const result = analyzeCharacterFrequency('🌟🌟A');
        // Emoji takes 2 UTF-16 code units, so total length is 5, not 3
        expect(result).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ char: '🌟', count: 2, percentage: expect.closeTo(40, 1) }),
            expect.objectContaining({ char: 'A', count: 1, percentage: expect.closeTo(20, 1) }),
          ])
        );
      });
    });

    describe('detectTextEncoding', () => {
      it('should detect ASCII encoding', () => {
        expect(detectTextEncoding('Hello World')).toBe('ASCII');
        expect(detectTextEncoding('123456789')).toBe('ASCII');
        expect(detectTextEncoding('!@#$%^&*()')).toBe('ASCII');
      });

      it('should detect Extended ASCII/Latin-1', () => {
        expect(detectTextEncoding('Café')).toBe('Extended ASCII/Latin-1');
        expect(detectTextEncoding('naïve')).toBe('Extended ASCII/Latin-1');
      });

      it('should detect UTF-8/UTF-16 for Unicode characters', () => {
        expect(detectTextEncoding('世界')).toBe('UTF-8/UTF-16 (Unicode)');
        expect(detectTextEncoding('Здравствуй')).toBe('UTF-8/UTF-16 (Unicode)');
      });

      it('should detect UTF-8/UTF-16 for emojis', () => {
        expect(detectTextEncoding('🌟')).toBe('UTF-8/UTF-16 (Unicode)');
        expect(detectTextEncoding('Hello 🌍!')).toBe('UTF-8/UTF-16 (Unicode)');
        expect(detectTextEncoding('⭐ ⚡ ✨')).toBe('UTF-8/UTF-16 (Unicode)');
      });

      it('should handle empty string', () => {
        expect(detectTextEncoding('')).toBe('ASCII');
      });

      it('should prioritize Unicode detection', () => {
        expect(detectTextEncoding('Hello 世界! 🌍')).toBe('UTF-8/UTF-16 (Unicode)');
      });
    });

    describe('getCharacterInfo', () => {
      it('should get info for ASCII printable characters', () => {
        const info = getCharacterInfo('A');
        expect(info).toEqual({
          char: 'A',
          name: 'Character 65',
          decimal: 65,
          hex: '41',
          octal: '101',
          binary: '1000001',
          unicode: 'U+0041',
          category: 'ASCII Printable'
        });
      });

      it('should get info for common named characters', () => {
        const spaceInfo = getCharacterInfo(' ');
        expect(spaceInfo.name).toBe('Space');
        expect(spaceInfo.category).toBe('ASCII Printable');

        const exclamationInfo = getCharacterInfo('!');
        expect(exclamationInfo.name).toBe('Exclamation Mark');

        const tabInfo = getCharacterInfo('\t');
        expect(tabInfo.name).toBe('Tab');
        expect(tabInfo.category).toBe('ASCII Control');

        const newlineInfo = getCharacterInfo('\n');
        expect(newlineInfo.name).toBe('Line Feed');
        expect(newlineInfo.category).toBe('ASCII Control');

        const nullInfo = getCharacterInfo('\0');
        expect(nullInfo.name).toBe('Null');
        expect(nullInfo.category).toBe('ASCII Control');
      });

      it('should get info for Unicode characters', () => {
        const info = getCharacterInfo('世');
        expect(info).toEqual({
          char: '世',
          name: 'Character 19990',
          decimal: 19990,
          hex: '4E16',
          octal: '47026',
          binary: '100111000010110',
          unicode: 'U+4E16',
          category: 'Unicode'
        });
      });

      it('should get info for emojis', () => {
        const info = getCharacterInfo('🌟');
        expect(info.char).toBe('🌟');
        expect(info.decimal).toBe(127775);
        expect(info.hex).toBe('1F31F');
        expect(info.unicode).toBe('U+1F31F');
        expect(info.category).toBe('Unicode');
      });

      it('should categorize ASCII control characters', () => {
        const controlInfo = getCharacterInfo('\x01');
        expect(controlInfo.category).toBe('ASCII Control');
        expect(controlInfo.decimal).toBe(1);
      });

      it('should categorize extended ASCII characters', () => {
        const extendedInfo = getCharacterInfo('€');
        expect(extendedInfo.category).toBe('Unicode'); // Euro sign is actually Unicode, not extended ASCII
      });
    });

    describe('ASCII/Unicode roundtrip tests', () => {
      it('should maintain data integrity through ASCII encode/decode cycles', () => {
        const testStrings = [
          'Hello World!',
          'ASCII test 123',
          'Special chars: !@#$%^&*()',
          'Mixed: ABC123xyz',
          'Single char: A',
          ''
        ];

        testStrings.forEach(text => {
          // Test all ASCII formats
          ['decimal', 'hex', 'octal', 'binary'].forEach(format => {
            const codes = textToAsciiCodes(text, format as 'decimal' | 'hex' | 'octal' | 'binary');
            const decoded = asciiCodesToText(codes, format as 'decimal' | 'hex' | 'octal' | 'binary');
            expect(decoded).toBe(text);
          });
        });
      });

      it('should maintain data integrity through Unicode encode/decode cycles', () => {
        const testStrings = [
          'Hello World!',
          'Unicode: 世界',
          'Emoji: 🌟🚀✨',
          'Mixed: Hello 世界! 🌟',
          'A',
          ''
        ];

        testStrings.forEach(text => {
          const codes = textToUnicodeCodes(text);
          const decoded = unicodeCodesToText(codes);
          expect(decoded).toBe(text);
        });
      });

      it('should maintain data integrity through escape sequence cycles', () => {
        const testStrings = [
          'Hello\nWorld',
          'Tab\tTest',
          'Quote"Test"',
          "Single'Quote",
          'Complex:\n\t"Test"\r\n',
          'Backslash\\Test',
          ''
        ];

        testStrings.forEach(text => {
          const escaped = textToEscapeSequences(text);
          const unescaped = escapeSequencesToText(escaped);
          expect(unescaped).toBe(text);
        });
      });

      it('should maintain data integrity through HTML entity cycles', () => {
        const testStrings = [
          '<Hello>',
          'A & B',
          '"Quote"',
          "'Single'",
          '<script>alert("test")</script>',
          'Mixed: <div>Hello & "World"</div>',
          ''
        ];

        testStrings.forEach(text => {
          const entities = textToHtmlEntities(text);
          const decoded = htmlEntitiesToText(entities);
          expect(decoded).toBe(text);
        });
      });
    });
  });
});