// Unix timestamp conversion utilities

export type TimestampUnit = 'seconds' | 'milliseconds';
export type TimezoneOption = 'local' | 'utc' | string; // string for specific timezones like 'America/New_York'

/**
 * Convert Unix timestamp to human-readable date
 */
export const timestampToDate = (
  timestamp: number,
  unit: TimestampUnit = 'seconds'
): Date => {
  const ms = unit === 'seconds' ? timestamp * 1000 : timestamp;
  return new Date(ms);
};

/**
 * Convert Date to Unix timestamp
 */
export const dateToTimestamp = (
  date: Date,
  unit: TimestampUnit = 'seconds'
): number => {
  const ms = date.getTime();
  return unit === 'seconds' ? Math.floor(ms / 1000) : ms;
};

/**
 * Format date to human-readable string with timezone support
 */
export const formatDate = (
  date: Date,
  timezone: TimezoneOption = 'local',
  includeTime: boolean = true
): string => {
  try {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      ...(includeTime && {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }),
      timeZone: timezone === 'local' ? undefined : timezone === 'utc' ? 'UTC' : timezone
    };

    return date.toLocaleString('en-US', options);
  } catch {
    // Fallback to ISO string if timezone is invalid
    return includeTime ? date.toISOString() : date.toISOString().split('T')[0];
  }
};

/**
 * Get current Unix timestamp
 */
export const getCurrentTimestamp = (unit: TimestampUnit = 'seconds'): number => {
  const now = Date.now();
  return unit === 'seconds' ? Math.floor(now / 1000) : now;
};

/**
 * Parse human-readable date string to Unix timestamp
 */
export const parseDate = (
  dateString: string,
  unit: TimestampUnit = 'seconds'
): number => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date format');
  }
  return dateToTimestamp(date, unit);
};

/**
 * Get relative time string ("2 hours ago", "in 5 minutes")
 */
export const getRelativeTime = (timestamp: number, unit: TimestampUnit = 'seconds'): string => {
  const now = getCurrentTimestamp(unit);
  const diff = now - timestamp;
  const absDiff = Math.abs(diff);
  const isInPast = diff > 0;

  // Convert to seconds for calculation
  const diffInSeconds = unit === 'milliseconds' ? absDiff / 1000 : absDiff;

  const timeUnits = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2629746 },
    { unit: 'week', seconds: 604800 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 },
    { unit: 'second', seconds: 1 }
  ];

  for (const { unit: timeUnit, seconds } of timeUnits) {
    const count = Math.floor(diffInSeconds / seconds);
    if (count >= 1) {
      const pluralUnit = count === 1 ? timeUnit : `${timeUnit}s`;
      return isInPast ? `${count} ${pluralUnit} ago` : `in ${count} ${pluralUnit}`;
    }
  }

  return 'just now';
};

/**
 * Validate if a number is a valid timestamp
 */
export const isValidTimestamp = (
  timestamp: number,
  unit: TimestampUnit = 'seconds'
): boolean => {
  if (!Number.isInteger(timestamp) || timestamp < 0) {
    return false;
  }

  const ms = unit === 'seconds' ? timestamp * 1000 : timestamp;
  
  // Check if it's within reasonable bounds (1970 to year 3000)
  const minDate = new Date('1970-01-01').getTime();
  const maxDate = new Date('3000-01-01').getTime();
  
  return ms >= minDate && ms <= maxDate;
};

/**
 * Auto-detect timestamp unit based on the number
 */
export const detectTimestampUnit = (timestamp: number): TimestampUnit => {
  // If timestamp is greater than this threshold, it's likely milliseconds
  // This is roughly equivalent to year 2001 in seconds
  const threshold = 1000000000000; // 10^12
  return timestamp >= threshold ? 'milliseconds' : 'seconds';
};

/**
 * Convert timestamp between units
 */
export const convertTimestampUnit = (
  timestamp: number,
  fromUnit: TimestampUnit,
  toUnit: TimestampUnit
): number => {
  if (fromUnit === toUnit) return timestamp;
  
  if (fromUnit === 'seconds' && toUnit === 'milliseconds') {
    return timestamp * 1000;
  }
  
  if (fromUnit === 'milliseconds' && toUnit === 'seconds') {
    return Math.floor(timestamp / 1000);
  }
  
  return timestamp;
};

/**
 * Format timestamp for display
 */
export const formatTimestamp = (timestamp: number, unit: TimestampUnit): string => {
  return unit === 'seconds' 
    ? timestamp.toString()
    : timestamp.toString();
};

/**
 * Get timezone information
 */
export const getTimezoneInfo = (timezone: TimezoneOption = 'local') => {
  const now = new Date();
  
  if (timezone === 'local') {
    const offset = now.getTimezoneOffset();
    const hours = Math.floor(Math.abs(offset) / 60);
    const minutes = Math.abs(offset) % 60;
    const sign = offset <= 0 ? '+' : '-';
    
    return {
      name: 'Local Time',
      abbreviation: Intl.DateTimeFormat().resolvedOptions().timeZone,
      offset: `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    };
  }
  
  if (timezone === 'utc') {
    return {
      name: 'Coordinated Universal Time',
      abbreviation: 'UTC',
      offset: 'UTC+00:00'
    };
  }
  
  // For specific timezones
  try {
    const formatter = new Intl.DateTimeFormat('en', { 
      timeZone: timezone,
      timeZoneName: 'long'
    });
    const parts = formatter.formatToParts(now);
    const timeZoneName = parts.find(part => part.type === 'timeZoneName');
    
    return {
      name: timeZoneName?.value || timezone,
      abbreviation: timezone,
      offset: 'Variable' // Timezone offset can change due to DST
    };
  } catch {
    return {
      name: 'Unknown Timezone',
      abbreviation: timezone,
      offset: 'Unknown'
    };
  }
};

/**
 * Common timezone options for UI
 */
export const COMMON_TIMEZONES = [
  { value: 'local', label: 'Local Time' },
  { value: 'utc', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' }
];

/**
 * Batch convert multiple timestamps
 */
export const batchConvertTimestamps = (
  timestamps: number[],
  unit: TimestampUnit = 'seconds',
  timezone: TimezoneOption = 'local'
): Array<{
  timestamp: number;
  date: Date;
  formatted: string;
  relative: string;
  isValid: boolean;
}> => {
  return timestamps.map(timestamp => {
    const isValid = isValidTimestamp(timestamp, unit);
    
    if (!isValid) {
      return {
        timestamp,
        date: new Date(0),
        formatted: 'Invalid timestamp',
        relative: 'Invalid',
        isValid: false
      };
    }
    
    const date = timestampToDate(timestamp, unit);
    const formatted = formatDate(date, timezone);
    const relative = getRelativeTime(timestamp, unit);
    
    return {
      timestamp,
      date,
      formatted,
      relative,
      isValid: true
    };
  });
};