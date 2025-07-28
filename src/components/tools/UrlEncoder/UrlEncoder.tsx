import { useState, useRef, useEffect } from 'react';
import { encodeURL, decodeURL, encodeURIFull, decodeURIFull, parseQueryString, buildQueryString, isValidURL, detectURLEncoding } from '../../../utils/converters';
import CopyButton from '../../common/CopyButton';

type OperationMode = 'encode' | 'decode';
type EncodingType = 'component' | 'full';

const UrlEncoder = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<OperationMode>('encode');
  const [encodingType, setEncodingType] = useState<EncodingType>('component');
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});
  const [showQueryParams, setShowQueryParams] = useState(false);
  const [autoDetectedType, setAutoDetectedType] = useState<'encoded' | 'decoded' | 'unknown' | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const outputRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = (textarea: HTMLTextAreaElement | null) => {
    if (textarea) {
      textarea.style.height = 'auto';
      const minHeight = 200;
      const maxHeight = 600;
      const scrollHeight = Math.max(minHeight, Math.min(maxHeight, textarea.scrollHeight));
      textarea.style.height = `${scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight(inputRef.current);
  }, [input]);

  useEffect(() => {
    adjustTextareaHeight(outputRef.current);
  }, [output]);

  // Auto-detect URL encoding when in decode mode
  useEffect(() => {
    if (mode === 'decode' && input.trim()) {
      const detectedType = detectURLEncoding(input.trim());
      setAutoDetectedType(detectedType);
    } else {
      setAutoDetectedType(null);
    }
  }, [input, mode]);

  // Parse query parameters when URL is detected
  useEffect(() => {
    if (input.trim()) {
      try {
        const url = new URL(input.trim());
        if (url.search) {
          const params = parseQueryString(url.search);
          setQueryParams(params);
          setShowQueryParams(Object.keys(params).length > 0);
        } else {
          setQueryParams({});
          setShowQueryParams(false);
        }
      } catch {
        // Try to parse as query string only
        if (input.includes('=') && (input.includes('&') || input.includes('?'))) {
          try {
            const params = parseQueryString(input.trim());
            setQueryParams(params);
            setShowQueryParams(Object.keys(params).length > 0);
          } catch {
            setQueryParams({});
            setShowQueryParams(false);
          }
        } else {
          setQueryParams({});
          setShowQueryParams(false);
        }
      }
    } else {
      setQueryParams({});
      setShowQueryParams(false);
    }
  }, [input]);

  const handleProcess = () => {
    if (!input.trim()) {
      setError('Please enter some text or URL');
      setOutput('');
      return;
    }

    try {
      let result: string;
      
      if (mode === 'encode') {
        if (encodingType === 'full') {
          result = encodeURIFull(input.trim());
        } else {
          result = encodeURL(input.trim());
        }
      } else {
        // Decode mode
        if (encodingType === 'full') {
          result = decodeURIFull(input.trim());
        } else {
          result = decodeURL(input.trim());
        }
      }
      
      setOutput(result);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${mode} URL`);
      setOutput('');
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError('');
    setAutoDetectedType(null);
    setQueryParams({});
    setShowQueryParams(false);
  };

  const handleSwap = () => {
    if (output) {
      setInput(output);
      setOutput('');
      setMode(mode === 'encode' ? 'decode' : 'encode');
      setError('');
    }
  };

  const handleQueryParamChange = (key: string, value: string, oldKey?: string) => {
    const newParams = { ...queryParams };
    
    if (oldKey && oldKey !== key) {
      delete newParams[oldKey];
    }
    
    if (key.trim()) {
      newParams[key] = value;
    }
    
    setQueryParams(newParams);
    
    // Update input with new query string
    try {
      const url = new URL(input.trim());
      url.search = buildQueryString(newParams);
      setInput(url.toString());
    } catch {
      // If not a valid URL, just update with query string
      setInput(buildQueryString(newParams));
    }
  };

  const addQueryParam = () => {
    const newParams = { ...queryParams, '': '' };
    setQueryParams(newParams);
  };

  const removeQueryParam = (key: string) => {
    const newParams = { ...queryParams };
    delete newParams[key];
    setQueryParams(newParams);
    
    // Update input
    try {
      const url = new URL(input.trim());
      url.search = buildQueryString(newParams);
      setInput(url.toString());
    } catch {
      setInput(buildQueryString(newParams));
    }
  };

  // Auto-process when input changes
  useEffect(() => {
    if (input.trim()) {
      handleProcess();
    } else {
      setOutput('');
      setError('');
    }
  }, [input, mode, encodingType]);

  const inputLabel = mode === 'encode' ? 'Text/URL Input' : 'Encoded URL Input';
  const outputLabel = mode === 'encode' ? 'Encoded Output' : 'Decoded Output';
  const inputPlaceholder = mode === 'encode' 
    ? 'Enter text or URL to encode...' 
    : 'Paste URL encoded text to decode...';
  const outputPlaceholder = mode === 'encode' 
    ? 'Encoded result will appear here...' 
    : 'Decoded text will appear here...';

  const isValidInputURL = input.trim() && isValidURL(input.trim());

  return (
    <div className="flex flex-col h-[calc(100vh-81px)]">
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-white">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          URL Encoder/Decoder
        </h1>
        <p className="text-sm text-gray-600">
          Encode/decode URLs and URL components with support for query parameters
        </p>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <div className="flex-1 flex flex-col border-r border-gray-200 bg-white">
            <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-semibold text-gray-700">
                  {inputLabel}
                </label>
                <div className="flex items-center space-x-3">
                  <label className="text-sm text-gray-600">
                    Mode:
                  </label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as OperationMode)}
                    className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white text-gray-900 shadow-sm"
                  >
                    <option value="encode">Encode</option>
                    <option value="decode">Decode</option>
                  </select>
                  <label className="text-sm text-gray-600">
                    Type:
                  </label>
                  <select
                    value={encodingType}
                    onChange={(e) => setEncodingType(e.target.value as EncodingType)}
                    className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white text-gray-900 shadow-sm"
                  >
                    <option value="component">Component</option>
                    <option value="full">Full URI</option>
                  </select>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  onClick={handleSwap}
                  disabled={!output}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm font-medium"
                >
                  ↔ Swap
                </button>
                <button
                  onClick={handleClear}
                  className="px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-all duration-200 shadow-sm font-medium"
                >
                  Clear
                </button>
              </div>

              {autoDetectedType && mode === 'decode' && (
                <div className="mb-3">
                  {autoDetectedType === 'encoded' ? (
                    <div className="text-blue-600 text-sm bg-blue-50 px-3 py-2 rounded-md border border-blue-200">
                      🔍 Detected URL encoded text
                    </div>
                  ) : autoDetectedType === 'decoded' ? (
                    <div className="text-orange-600 text-sm bg-orange-50 px-3 py-2 rounded-md border border-orange-200">
                      ℹ️ Text appears to be already decoded
                    </div>
                  ) : null}
                </div>
              )}

              {isValidInputURL && (
                <div className="mb-3">
                  <div className="text-green-600 text-sm bg-green-50 px-3 py-2 rounded-md border border-green-200">
                    ✅ Valid URL detected
                  </div>
                </div>
              )}

              {error && (
                <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-md border border-red-200">
                  ❌ {error}
                </div>
              )}
              
              {!error && input && output && (
                <div className="text-green-600 text-sm bg-green-50 px-3 py-2 rounded-md border border-green-200">
                  ✅ {mode === 'encode' ? 'Encoded' : 'Decoded'} successfully ({encodingType === 'full' ? 'Full URI' : 'Component'})
                </div>
              )}
            </div>
            
            <div className="flex-1 p-6">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={inputPlaceholder}
                className="w-full h-full p-4 font-mono text-sm border border-gray-300 rounded-lg bg-white text-gray-900 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 overflow-auto shadow-sm"
                style={{ minHeight: '200px' }}
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col bg-white">
            <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">
                  {outputLabel}
                </label>
                {output && <CopyButton text={output} />}
              </div>
            </div>
            
            <div className="flex-1 p-6">
              <textarea
                ref={outputRef}
                value={output}
                readOnly
                placeholder={outputPlaceholder}
                className="w-full h-full p-4 font-mono text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-900 resize-none overflow-auto shadow-sm"
                style={{ minHeight: '200px' }}
              />
            </div>
          </div>
        </div>

        {/* Query Parameters Section */}
        {showQueryParams && (
          <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-gray-700">
                  Query Parameters
                </label>
                <button
                  onClick={addQueryParam}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition-all duration-200 shadow-sm font-medium"
                >
                  + Add
                </button>
              </div>
              
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {Object.entries(queryParams).map(([key, value], index) => (
                  <div key={`${key}-${index}`} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={key}
                      onChange={(e) => handleQueryParamChange(e.target.value, value, key)}
                      placeholder="Key"
                      className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 bg-white text-gray-900 font-mono"
                    />
                    <span className="text-gray-500">=</span>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleQueryParamChange(key, e.target.value)}
                      placeholder="Value"
                      className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 bg-white text-gray-900 font-mono"
                    />
                    <button
                      onClick={() => removeQueryParam(key)}
                      className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-all duration-200"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UrlEncoder;