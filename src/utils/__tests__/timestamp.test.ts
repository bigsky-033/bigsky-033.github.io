import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  timestampToDate,
  dateToTimestamp,
  formatDate,
  getCurrentTimestamp,
  parseDate,
  getRelativeTime,
  isValidTimestamp,
  detectTimestampUnit,
  convertTimestampUnit,
  getTimezoneInfo,
  COMMON_TIMEZONES,
  batchConvertTimestamps
} from '../timestamp';

describe('Timestamp Utilities', () => {
  // Mock Date.now for consistent testing
  const mockNow = new Date('2024-01-01T12:00:00.000Z').getTime();
  
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('timestampToDate', () => {
    it('should convert seconds timestamp to Date', () => {
      const timestamp = 1640995200; // 2022-01-01 00:00:00 UTC
      const date = timestampToDate(timestamp, 'seconds');
      expect(date.getTime()).toBe(1640995200000);
    });

    it('should convert milliseconds timestamp to Date', () => {
      const timestamp = 1640995200000; // 2022-01-01 00:00:00 UTC
      const date = timestampToDate(timestamp, 'milliseconds');
      expect(date.getTime()).toBe(1640995200000);
    });

    it('should default to seconds when unit not specified', () => {
      const timestamp = 1640995200;
      const date = timestampToDate(timestamp);
      expect(date.getTime()).toBe(1640995200000);
    });
  });

  describe('dateToTimestamp', () => {
    it('should convert Date to seconds timestamp', () => {
      const date = new Date('2022-01-01T00:00:00.000Z');
      const timestamp = dateToTimestamp(date, 'seconds');
      expect(timestamp).toBe(1640995200);
    });

    it('should convert Date to milliseconds timestamp', () => {
      const date = new Date('2022-01-01T00:00:00.000Z');
      const timestamp = dateToTimestamp(date, 'milliseconds');
      expect(timestamp).toBe(1640995200000);
    });

    it('should default to seconds when unit not specified', () => {
      const date = new Date('2022-01-01T00:00:00.000Z');
      const timestamp = dateToTimestamp(date);
      expect(timestamp).toBe(1640995200);
    });

    it('should handle dates with milliseconds precision', () => {
      const date = new Date('2022-01-01T00:00:00.123Z');
      const timestampSeconds = dateToTimestamp(date, 'seconds');
      const timestampMs = dateToTimestamp(date, 'milliseconds');
      
      expect(timestampSeconds).toBe(1640995200); // Floored to seconds
      expect(timestampMs).toBe(1640995200123); // Exact milliseconds
    });
  });

  describe('formatDate', () => {
    const testDate = new Date('2022-01-01T12:30:45.000Z');

    it('should format date with local timezone by default', () => {
      const formatted = formatDate(testDate);
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2}/);
    });

    it('should format date with UTC timezone', () => {
      const formatted = formatDate(testDate, 'utc');
      expect(formatted).toContain('01/01/2022, 12:30:45');
    });

    it('should format date without time when specified', () => {
      const formatted = formatDate(testDate, 'utc', false);
      expect(formatted).toBe('01/01/2022');
    });

    it('should handle invalid timezone gracefully', () => {
      const formatted = formatDate(testDate, 'invalid/timezone');
      expect(formatted).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO fallback
    });

    it('should format with specific timezone', () => {
      const formatted = formatDate(testDate, 'America/New_York');
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });
  });

  describe('getCurrentTimestamp', () => {
    it('should return current timestamp in seconds by default', () => {
      const timestamp = getCurrentTimestamp();
      expect(timestamp).toBe(Math.floor(mockNow / 1000));
    });

    it('should return current timestamp in milliseconds', () => {
      const timestamp = getCurrentTimestamp('milliseconds');
      expect(timestamp).toBe(mockNow);
    });

    it('should return current timestamp in seconds when specified', () => {
      const timestamp = getCurrentTimestamp('seconds');
      expect(timestamp).toBe(Math.floor(mockNow / 1000));
    });
  });

  describe('parseDate', () => {
    it('should parse ISO date string to seconds timestamp', () => {
      const dateString = '2022-01-01T00:00:00.000Z';
      const timestamp = parseDate(dateString, 'seconds');
      expect(timestamp).toBe(1640995200);
    });

    it('should parse ISO date string to milliseconds timestamp', () => {
      const dateString = '2022-01-01T00:00:00.000Z';
      const timestamp = parseDate(dateString, 'milliseconds');
      expect(timestamp).toBe(1640995200000);
    });

    it('should parse various date formats', () => {
      const formats = [
        '2022-01-01',
        'Jan 1, 2022',
        'January 1, 2022',
        '2022/01/01'
      ];

      formats.forEach(format => {
        expect(() => parseDate(format)).not.toThrow();
      });
    });

    it('should throw error for invalid date string', () => {
      expect(() => parseDate('invalid date')).toThrow('Invalid date format');
      expect(() => parseDate('')).toThrow('Invalid date format');
      expect(() => parseDate('not a date')).toThrow('Invalid date format');
    });

    it('should default to seconds when unit not specified', () => {
      const dateString = '2022-01-01T00:00:00.000Z';
      const timestamp = parseDate(dateString);
      expect(timestamp).toBe(1640995200);
    });
  });

  describe('getRelativeTime', () => {
    const currentTimestamp = Math.floor(mockNow / 1000); // 2024-01-01 12:00:00

    it('should return "just now" for very recent timestamps', () => {
      const timestamp = currentTimestamp - 0.5; // 0.5 seconds ago
      expect(getRelativeTime(timestamp, 'seconds')).toBe('just now');
    });

    it('should return relative time for past timestamps', () => {
      expect(getRelativeTime(currentTimestamp - 60, 'seconds')).toBe('1 minute ago');
      expect(getRelativeTime(currentTimestamp - 120, 'seconds')).toBe('2 minutes ago');
      expect(getRelativeTime(currentTimestamp - 3600, 'seconds')).toBe('1 hour ago');
      expect(getRelativeTime(currentTimestamp - 7200, 'seconds')).toBe('2 hours ago');
      expect(getRelativeTime(currentTimestamp - 86400, 'seconds')).toBe('1 day ago');
    });

    it('should return relative time for future timestamps', () => {
      expect(getRelativeTime(currentTimestamp + 60, 'seconds')).toBe('in 1 minute');
      expect(getRelativeTime(currentTimestamp + 3600, 'seconds')).toBe('in 1 hour');
      expect(getRelativeTime(currentTimestamp + 86400, 'seconds')).toBe('in 1 day');
    });

    it('should handle milliseconds timestamps', () => {
      const currentMs = mockNow;
      expect(getRelativeTime(currentMs - 60000, 'milliseconds')).toBe('1 minute ago');
      expect(getRelativeTime(currentMs + 60000, 'milliseconds')).toBe('in 1 minute');
    });

    it('should handle large time differences', () => {
      const yearAgo = currentTimestamp - (365 * 24 * 3600);
      expect(getRelativeTime(yearAgo, 'seconds')).toBe('1 year ago');
      
      const monthAgo = currentTimestamp - (35 * 24 * 3600); // Use 35 days to ensure it's over the month threshold
      expect(getRelativeTime(monthAgo, 'seconds')).toBe('1 month ago');
    });
  });

  describe('isValidTimestamp', () => {
    it('should validate reasonable timestamps in seconds', () => {
      expect(isValidTimestamp(0, 'seconds')).toBe(true); // Unix epoch
      expect(isValidTimestamp(1640995200, 'seconds')).toBe(true); // 2022-01-01
      expect(isValidTimestamp(2147483647, 'seconds')).toBe(true); // Year 2038 problem
    });

    it('should validate reasonable timestamps in milliseconds', () => {
      expect(isValidTimestamp(0, 'milliseconds')).toBe(true); // Unix epoch
      expect(isValidTimestamp(1640995200000, 'milliseconds')).toBe(true); // 2022-01-01
    });

    it('should reject negative timestamps', () => {
      expect(isValidTimestamp(-1, 'seconds')).toBe(false);
      expect(isValidTimestamp(-1000, 'milliseconds')).toBe(false);
    });

    it('should reject non-integer timestamps', () => {
      expect(isValidTimestamp(1.5, 'seconds')).toBe(false);
      expect(isValidTimestamp(NaN, 'seconds')).toBe(false);
      expect(isValidTimestamp(Infinity, 'seconds')).toBe(false);
    });

    it('should reject timestamps outside reasonable bounds', () => {
      // Very far future (year 3000+)
      const farFuture = new Date('3001-01-01').getTime() / 1000;
      expect(isValidTimestamp(farFuture, 'seconds')).toBe(false);
      
      // Before Unix epoch (before 1970)
      const preEpoch = new Date('1969-12-31').getTime() / 1000;
      expect(isValidTimestamp(preEpoch, 'seconds')).toBe(false);
    });
  });

  describe('detectTimestampUnit', () => {
    it('should detect seconds for small numbers', () => {
      expect(detectTimestampUnit(1640995200)).toBe('seconds');
      expect(detectTimestampUnit(0)).toBe('seconds');
      expect(detectTimestampUnit(999999999)).toBe('seconds');
    });

    it('should detect milliseconds for large numbers', () => {
      expect(detectTimestampUnit(1640995200000)).toBe('milliseconds');
      expect(detectTimestampUnit(1000000000000)).toBe('milliseconds');
    });

    it('should handle edge cases around the threshold', () => {
      const threshold = 1000000000000;
      expect(detectTimestampUnit(threshold - 1)).toBe('seconds');
      expect(detectTimestampUnit(threshold)).toBe('milliseconds');
      expect(detectTimestampUnit(threshold + 1)).toBe('milliseconds');
    });
  });

  describe('convertTimestampUnit', () => {
    it('should convert seconds to milliseconds', () => {
      const result = convertTimestampUnit(1640995200, 'seconds', 'milliseconds');
      expect(result).toBe(1640995200000);
    });

    it('should convert milliseconds to seconds', () => {
      const result = convertTimestampUnit(1640995200000, 'milliseconds', 'seconds');
      expect(result).toBe(1640995200);
    });

    it('should return same value when units are the same', () => {
      expect(convertTimestampUnit(1640995200, 'seconds', 'seconds')).toBe(1640995200);
      expect(convertTimestampUnit(1640995200000, 'milliseconds', 'milliseconds')).toBe(1640995200000);
    });

    it('should floor milliseconds when converting to seconds', () => {
      const result = convertTimestampUnit(1640995200123, 'milliseconds', 'seconds');
      expect(result).toBe(1640995200);
    });
  });

  describe('getTimezoneInfo', () => {
    it('should return local timezone info', () => {
      const info = getTimezoneInfo('local');
      expect(info).toHaveProperty('name');
      expect(info).toHaveProperty('abbreviation');
      expect(info).toHaveProperty('offset');
      expect(info.name).toBe('Local Time');
    });

    it('should return UTC timezone info', () => {
      const info = getTimezoneInfo('utc');
      expect(info).toEqual({
        name: 'Coordinated Universal Time',
        abbreviation: 'UTC',
        offset: 'UTC+00:00'
      });
    });

    it('should return info for specific timezones', () => {
      const info = getTimezoneInfo('America/New_York');
      expect(info).toHaveProperty('name');
      expect(info).toHaveProperty('abbreviation');
      expect(info).toHaveProperty('offset');
      expect(info.abbreviation).toBe('America/New_York');
    });

    it('should handle invalid timezones gracefully', () => {
      const info = getTimezoneInfo('Invalid/Timezone');
      expect(info).toEqual({
        name: 'Unknown Timezone',
        abbreviation: 'Invalid/Timezone',
        offset: 'Unknown'
      });
    });
  });

  describe('COMMON_TIMEZONES', () => {
    it('should contain expected timezone entries', () => {
      expect(COMMON_TIMEZONES).toBeInstanceOf(Array);
      expect(COMMON_TIMEZONES.length).toBeGreaterThan(0);
      
      // Check required properties
      COMMON_TIMEZONES.forEach(tz => {
        expect(tz).toHaveProperty('value');
        expect(tz).toHaveProperty('label');
        expect(typeof tz.value).toBe('string');
        expect(typeof tz.label).toBe('string');
      });
    });

    it('should include common timezones', () => {
      const values = COMMON_TIMEZONES.map(tz => tz.value);
      expect(values).toContain('local');
      expect(values).toContain('utc');
      expect(values).toContain('America/New_York');
      expect(values).toContain('Europe/London');
      expect(values).toContain('Asia/Tokyo');
    });
  });

  describe('batchConvertTimestamps', () => {
    it('should convert multiple valid timestamps', () => {
      const timestamps = [1640995200, 1641081600, 1641168000]; // 3 consecutive days
      const results = batchConvertTimestamps(timestamps, 'seconds', 'utc');
      
      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.timestamp).toBe(timestamps[index]);
        expect(result.isValid).toBe(true);
        expect(result.date).toBeInstanceOf(Date);
        expect(result.formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
        expect(result.relative).toBeTruthy();
      });
    });

    it('should handle invalid timestamps', () => {
      const timestamps = [1640995200, -1, NaN, Infinity];
      const results = batchConvertTimestamps(timestamps);
      
      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(false);
      expect(results[2].isValid).toBe(false);
      expect(results[3].isValid).toBe(false);
      
      // Invalid entries should have default values
      expect(results[1].formatted).toBe('Invalid timestamp');
      expect(results[1].relative).toBe('Invalid');
    });

    it('should handle mixed valid and invalid timestamps', () => {
      const timestamps = [1640995200, -1, 1641081600];
      const results = batchConvertTimestamps(timestamps);
      
      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(false);
      expect(results[2].isValid).toBe(true);
    });

    it('should work with milliseconds unit', () => {
      const timestamps = [1640995200000, 1641081600000];
      const results = batchConvertTimestamps(timestamps, 'milliseconds');
      
      results.forEach(result => {
        expect(result.isValid).toBe(true);
        expect(result.date).toBeInstanceOf(Date);
      });
    });

    it('should respect timezone parameter', () => {
      const timestamps = [1640995200];
      const utcResults = batchConvertTimestamps(timestamps, 'seconds', 'utc');
      const localResults = batchConvertTimestamps(timestamps, 'seconds', 'local');
      
      expect(utcResults[0].formatted).toBeTruthy();
      expect(localResults[0].formatted).toBeTruthy();
      // Results might be different due to timezone differences
    });

    it('should handle empty array', () => {
      const results = batchConvertTimestamps([]);
      expect(results).toEqual([]);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle year 2038 problem timestamp', () => {
      const y2038 = 2147483647; // Max 32-bit signed integer
      expect(isValidTimestamp(y2038, 'seconds')).toBe(true);
      
      const date = timestampToDate(y2038, 'seconds');
      expect(date.getFullYear()).toBe(2038);
    });

    it('should handle Unix epoch (timestamp 0)', () => {
      expect(isValidTimestamp(0, 'seconds')).toBe(true);
      
      const date = timestampToDate(0, 'seconds');
      expect(date.getTime()).toBe(0);
      expect(date.getFullYear()).toBe(1970);
    });

    it('should handle leap year dates', () => {
      const leapYearDate = '2024-02-29T12:00:00.000Z';
      expect(() => parseDate(leapYearDate)).not.toThrow();
      
      const timestamp = parseDate(leapYearDate, 'seconds');
      const converted = timestampToDate(timestamp, 'seconds');
      expect(converted.getMonth()).toBe(1); // February (0-indexed)
      expect(converted.getDate()).toBe(29);
    });

    it('should handle daylight saving time transitions', () => {
      // Test around DST transitions - just ensure no errors
      const dstDates = [
        '2024-03-10T07:00:00.000Z', // Spring forward
        '2024-11-03T06:00:00.000Z'  // Fall back
      ];
      
      dstDates.forEach(dateStr => {
        expect(() => parseDate(dateStr)).not.toThrow();
        const timestamp = parseDate(dateStr);
        expect(isValidTimestamp(timestamp)).toBe(true);
      });
    });
  });

  describe('Performance and limits', () => {
    it('should handle large batch conversions efficiently', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => 1640995200 + i * 86400);
      
      const start = performance.now();
      const results = batchConvertTimestamps(largeArray);
      const end = performance.now();
      
      expect(results).toHaveLength(1000);
      expect(end - start).toBeLessThan(1000); // Should complete within 1 second
      
      // All should be valid
      results.forEach(result => {
        expect(result.isValid).toBe(true);
      });
    });
  });
});