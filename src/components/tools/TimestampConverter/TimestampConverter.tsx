import { useState, useCallback, useEffect } from 'react';
import {
  timestampToDate,
  formatDate,
  getCurrentTimestamp,
  parseDate,
  getRelativeTime,
  isValidTimestamp,
  detectTimestampUnit,
  convertTimestampUnit,
  getTimezoneInfo,
  COMMON_TIMEZONES,
  type TimestampUnit,
  type TimezoneOption
} from '../../../utils/timestamp';
import CopyButton from '../../common/CopyButton';

const TimestampConverter = () => {
  const [timestampInput, setTimestampInput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [unit, setUnit] = useState<TimestampUnit>('seconds');
  const [timezone, setTimezone] = useState<TimezoneOption>('local');
  const [autoDetectUnit, setAutoDetectUnit] = useState(true);
  const [error, setError] = useState('');
  
  // Real-time current timestamp
  const [currentTimestamp, setCurrentTimestamp] = useState(getCurrentTimestamp('seconds'));
  
  // Conversion results
  const [timestampResult, setTimestampResult] = useState<{
    date: Date | null;
    formatted: string;
    relative: string;
    isValid: boolean;
  }>({
    date: null,
    formatted: '',
    relative: '',
    isValid: false
  });
  
  const [dateResult, setDateResult] = useState<{
    timestamp: number | null;
    timestampMs: number | null;
    isValid: boolean;
  }>({
    timestamp: null,
    timestampMs: null,
    isValid: false
  });

  // Update current timestamp every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimestamp(getCurrentTimestamp('seconds'));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle timestamp to date conversion
  const handleTimestampConversion = useCallback(() => {
    if (!timestampInput.trim()) {
      setTimestampResult({
        date: null,
        formatted: '',
        relative: '',
        isValid: false
      });
      setError('');
      return;
    }

    try {
      const timestamp = parseFloat(timestampInput.trim());
      
      if (isNaN(timestamp)) {
        throw new Error('Invalid timestamp format');
      }

      // Auto-detect unit if enabled
      const detectedUnit = autoDetectUnit ? detectTimestampUnit(timestamp) : unit;
      
      if (!isValidTimestamp(timestamp, detectedUnit)) {
        throw new Error('Timestamp is out of valid range');
      }

      const date = timestampToDate(timestamp, detectedUnit);
      const formatted = formatDate(date, timezone);
      const relative = getRelativeTime(timestamp, detectedUnit);

      setTimestampResult({
        date,
        formatted,
        relative,
        isValid: true
      });
      setError('');
    } catch (err) {
      setTimestampResult({
        date: null,
        formatted: '',
        relative: '',
        isValid: false
      });
      setError(err instanceof Error ? err.message : 'Invalid timestamp');
    }
  }, [timestampInput, unit, timezone, autoDetectUnit]);

  // Handle date to timestamp conversion
  const handleDateConversion = useCallback(() => {
    if (!dateInput.trim()) {
      setDateResult({
        timestamp: null,
        timestampMs: null,
        isValid: false
      });
      return;
    }

    try {
      const timestamp = parseDate(dateInput.trim(), 'seconds');
      const timestampMs = parseDate(dateInput.trim(), 'milliseconds');

      setDateResult({
        timestamp,
        timestampMs,
        isValid: true
      });
    } catch {
      setDateResult({
        timestamp: null,
        timestampMs: null,
        isValid: false
      });
    }
  }, [dateInput]);

  // Effect to handle conversions when inputs change
  useEffect(() => {
    handleTimestampConversion();
  }, [handleTimestampConversion]);

  useEffect(() => {
    handleDateConversion();
  }, [handleDateConversion]);

  const handleCurrentTimestamp = () => {
    const current = getCurrentTimestamp(unit);
    setTimestampInput(current.toString());
  };

  const handleClear = () => {
    setTimestampInput('');
    setDateInput('');
    setError('');
    setTimestampResult({
      date: null,
      formatted: '',
      relative: '',
      isValid: false
    });
    setDateResult({
      timestamp: null,
      timestampMs: null,
      isValid: false
    });
  };

  const handleConvertBetweenUnits = () => {
    if (timestampInput && timestampResult.isValid) {
      const timestamp = parseFloat(timestampInput);
      const currentUnit = autoDetectUnit ? detectTimestampUnit(timestamp) : unit;
      const targetUnit = currentUnit === 'seconds' ? 'milliseconds' : 'seconds';
      const converted = convertTimestampUnit(timestamp, currentUnit, targetUnit);
      setTimestampInput(converted.toString());
      setUnit(targetUnit);
      setAutoDetectUnit(false);
    }
  };

  const timezoneInfo = getTimezoneInfo(timezone);

  return (
    <div className="flex flex-col h-[calc(100vh-81px)]">
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-white">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Unix Timestamp Converter
        </h1>
        <p className="text-sm text-gray-600">
          Convert between Unix timestamps and human-readable dates with timezone and relative time support.
        </p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Configuration Panel */}
        <div className="flex-1 flex flex-col border-r border-gray-200 bg-white">
          <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">
                  Conversion Settings
                </label>
              </div>

              {/* Current Timestamp Display */}
              <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800">Current Timestamp</span>
                  <CopyButton text={currentTimestamp.toString()} />
                </div>
                <div className="font-mono text-lg text-blue-900">{currentTimestamp}</div>
                <div className="text-xs text-blue-600 mt-1">
                  {formatDate(new Date(), timezone)} ({getRelativeTime(currentTimestamp, 'seconds')})
                </div>
              </div>

              {/* Unit Selection */}
              <div className="flex items-center space-x-4">
                <label className="text-sm text-gray-600 min-w-[100px]">Unit:</label>
                <div className="flex items-center space-x-4">
                  <select
                    value={unit}
                    onChange={(e) => {
                      setUnit(e.target.value as TimestampUnit);
                      setAutoDetectUnit(false);
                    }}
                    disabled={autoDetectUnit}
                    className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white text-gray-900 shadow-sm disabled:bg-gray-100"
                  >
                    <option value="seconds">Seconds</option>
                    <option value="milliseconds">Milliseconds</option>
                  </select>
                  <label className="flex items-center text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={autoDetectUnit}
                      onChange={(e) => setAutoDetectUnit(e.target.checked)}
                      className="mr-2"
                    />
                    Auto-detect
                  </label>
                </div>
              </div>

              {/* Timezone Selection */}
              <div className="flex items-center space-x-4">
                <label className="text-sm text-gray-600 min-w-[100px]">Timezone:</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value as TimezoneOption)}
                  className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-1 bg-white text-gray-900 shadow-sm"
                >
                  {COMMON_TIMEZONES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Timezone Info */}
              <div className="p-2 bg-gray-100 rounded text-xs text-gray-600">
                <div><strong>Timezone:</strong> {timezoneInfo.name}</div>
                <div><strong>Offset:</strong> {timezoneInfo.offset}</div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleCurrentTimestamp}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 shadow-sm font-medium"
                >
                  Use Current Time
                </button>
                <button
                  onClick={handleConvertBetweenUnits}
                  disabled={!timestampInput || !timestampResult.isValid}
                  className="px-4 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm font-medium"
                >
                  Convert Units
                </button>
                <button
                  onClick={handleClear}
                  className="px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-all duration-200 shadow-sm font-medium"
                >
                  Clear
                </button>
              </div>

              {/* Error Display */}
              {error && (
                <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-md border border-red-200">
                  ❌ {error}
                </div>
              )}
            </div>
          </div>

          {/* Timestamp to Date Conversion */}
          <div className="flex-1 p-6">
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Timestamp to Date</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Unix Timestamp</label>
                  <input
                    type="text"
                    value={timestampInput}
                    onChange={(e) => setTimestampInput(e.target.value)}
                    placeholder="Enter Unix timestamp (e.g., 1640995200)"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white font-mono"
                  />
                </div>
                
                {timestampInput && (
                  <div className="space-y-2">
                    {timestampResult.isValid ? (
                      <>
                        <div className="p-3 bg-green-50 rounded-md border border-green-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-green-800">Human-readable Date</span>
                            <CopyButton text={timestampResult.formatted} />
                          </div>
                          <div className="font-mono text-sm text-green-900">{timestampResult.formatted}</div>
                        </div>
                        
                        <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-blue-800">Relative Time</span>
                            <CopyButton text={timestampResult.relative} />
                          </div>
                          <div className="text-sm text-blue-900">{timestampResult.relative}</div>
                        </div>
                        
                        {autoDetectUnit && (
                          <div className="text-xs text-gray-500">
                            Detected unit: {detectTimestampUnit(parseFloat(timestampInput))}
                          </div>
                        )}
                      </>
                    ) : error && (
                      <div className="p-3 bg-red-50 rounded-md border border-red-200">
                        <div className="text-xs font-medium text-red-800">Invalid Timestamp</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Date to Timestamp Conversion */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Date to Timestamp</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Human-readable Date</label>
                  <input
                    type="text"
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    placeholder="Enter date (e.g., 2024-01-01 12:00:00, Dec 31, 2023)"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Supports various formats: ISO 8601, RFC 2822, or natural language
                  </div>
                </div>
                
                {dateInput && dateResult.isValid && (
                  <div className="space-y-2">
                    <div className="p-3 bg-green-50 rounded-md border border-green-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-green-800">Unix Timestamp (seconds)</span>
                        <CopyButton text={dateResult.timestamp?.toString() || ''} />
                      </div>
                      <div className="font-mono text-sm text-green-900">{dateResult.timestamp}</div>
                    </div>
                    
                    <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-blue-800">Unix Timestamp (milliseconds)</span>
                        <CopyButton text={dateResult.timestampMs?.toString() || ''} />
                      </div>
                      <div className="font-mono text-sm text-blue-900">{dateResult.timestampMs}</div>
                    </div>
                  </div>
                )}
                
                {dateInput && !dateResult.isValid && (
                  <div className="p-3 bg-red-50 rounded-md border border-red-200">
                    <div className="text-xs font-medium text-red-800">Invalid Date Format</div>
                    <div className="text-xs text-red-600 mt-1">
                      Please enter a valid date format
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Information Panel */}
        <div className="flex-1 flex flex-col bg-white max-w-md">
          <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gray-50">
            <label className="text-sm font-semibold text-gray-700">
              Information & Examples
            </label>
          </div>

          <div className="flex-1 p-6 overflow-auto">
            <div className="space-y-6">
              {/* What is Unix Timestamp */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">What is Unix Timestamp?</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Unix timestamp is the number of seconds (or milliseconds) that have elapsed since 
                  January 1, 1970, 00:00:00 UTC. It's widely used in programming and databases 
                  for storing and comparing dates.
                </p>
              </div>

              {/* Examples */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Examples</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-md text-xs">
                    <div className="font-medium text-gray-700">Seconds</div>
                    <div className="font-mono text-gray-600">1640995200</div>
                    <div className="text-gray-500">= Jan 1, 2022 00:00:00 UTC</div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-md text-xs">
                    <div className="font-medium text-gray-700">Milliseconds</div>
                    <div className="font-mono text-gray-600">1640995200000</div>
                    <div className="text-gray-500">= Jan 1, 2022 00:00:00.000 UTC</div>
                  </div>
                </div>
              </div>

              {/* Supported Date Formats */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Supported Date Formats</h4>
                <div className="space-y-1 text-xs text-gray-600">
                  <div>• ISO 8601: 2024-01-01T12:00:00Z</div>
                  <div>• RFC 2822: Dec 31, 2023 12:00:00</div>
                  <div>• Simple: 2024-01-01 12:00:00</div>
                  <div>• Natural: January 1, 2024</div>
                </div>
              </div>

              {/* Tips */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Tips</h4>
                <div className="space-y-1 text-xs text-gray-600">
                  <div>• Use "Auto-detect" to automatically determine if your timestamp is in seconds or milliseconds</div>
                  <div>• The current timestamp updates every second</div>
                  <div>• Relative time shows how long ago or in the future the timestamp is</div>
                  <div>• All conversions respect the selected timezone</div>
                </div>
              </div>

              {/* Common Timestamps */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Common Timestamps</h4>
                <div className="space-y-2">
                  <div className="p-2 bg-gray-50 rounded text-xs">
                    <div className="font-medium">Unix Epoch</div>
                    <div className="font-mono">0</div>
                    <div className="text-gray-500">Jan 1, 1970 00:00:00 UTC</div>
                  </div>
                  
                  <div className="p-2 bg-gray-50 rounded text-xs">
                    <div className="font-medium">Y2K</div>
                    <div className="font-mono">946684800</div>
                    <div className="text-gray-500">Jan 1, 2000 00:00:00 UTC</div>
                  </div>
                  
                  <div className="p-2 bg-gray-50 rounded text-xs">
                    <div className="font-medium">Year 2038 Problem</div>
                    <div className="font-mono">2147483647</div>
                    <div className="text-gray-500">Jan 19, 2038 03:14:07 UTC</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimestampConverter;