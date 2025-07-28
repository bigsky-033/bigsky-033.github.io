import { describe, it, expect } from 'vitest';
import { formatJson, minifyJson, sortJsonKeys } from '../formatters';

describe('formatters', () => {
  const testJson = '{"name":"test","age":25,"city":"NYC"}';
  const expectedFormatted = `{
  "name": "test",
  "age": 25,
  "city": "NYC"
}`;

  describe('formatJson', () => {
    it('should format JSON with default indentation', () => {
      const result = formatJson(testJson);
      expect(result).toBe(expectedFormatted);
    });

    it('should format JSON with custom indentation', () => {
      const result = formatJson(testJson, 4);
      const expected = `{
    "name": "test",
    "age": 25,
    "city": "NYC"
}`;
      expect(result).toBe(expected);
    });

    it('should throw error for invalid JSON', () => {
      expect(() => formatJson('invalid json')).toThrow('Invalid JSON format');
    });
  });

  describe('minifyJson', () => {
    it('should minify JSON', () => {
      const result = minifyJson(testJson);
      expect(result).toBe('{"name":"test","age":25,"city":"NYC"}');
    });

    it('should throw error for invalid JSON', () => {
      expect(() => minifyJson('invalid json')).toThrow('Invalid JSON format');
    });
  });

  describe('sortJsonKeys', () => {
    it('should sort JSON keys alphabetically', () => {
      const unsortedJson = '{"zoo":"animal","apple":"fruit","banana":"fruit"}';
      const result = sortJsonKeys(unsortedJson);
      const expected = `{
  "apple": "fruit",
  "banana": "fruit",
  "zoo": "animal"
}`;
      expect(result).toBe(expected);
    });

    it('should throw error for invalid JSON', () => {
      expect(() => sortJsonKeys('invalid json')).toThrow('Invalid JSON format');
    });
  });
});