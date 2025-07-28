import { useState, useRef, useEffect } from 'react';
import { encodeBase64, decodeBase64, encodeBase64UrlSafe, decodeBase64UrlSafe, detectBase64Type } from '../../../utils/converters';
import CopyButton from '../../common/CopyButton';

type OperationMode = 'encode' | 'decode';
type Base64Variant = 'standard' | 'url-safe';

const Base64Tool = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<OperationMode>('encode');
  const [variant, setVariant] = useState<Base64Variant>('standard');
  const [autoDetectedType, setAutoDetectedType] = useState<'standard' | 'url-safe' | 'invalid' | null>(null);
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

  // Auto-detect Base64 type when in decode mode
  useEffect(() => {
    if (mode === 'decode' && input.trim()) {
      const detectedType = detectBase64Type(input.trim());
      setAutoDetectedType(detectedType);
      
      // Auto-suggest variant based on detection
      if (detectedType === 'url-safe' && variant === 'standard') {
        setVariant('url-safe');
      } else if (detectedType === 'standard' && variant === 'url-safe') {
        setVariant('standard');
      }
    } else {
      setAutoDetectedType(null);
    }
  }, [input, mode, variant]);

  const handleProcess = () => {
    if (!input.trim()) {
      setError('Please enter some text');
      setOutput('');
      return;
    }

    try {
      let result: string;
      
      if (mode === 'encode') {
        result = variant === 'url-safe' ? encodeBase64UrlSafe(input) : encodeBase64(input);
      } else {
        // Decode mode
        if (variant === 'url-safe') {
          result = decodeBase64UrlSafe(input.trim());
        } else {
          result = decodeBase64(input.trim());
        }
      }
      
      setOutput(result);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${mode} text`);
      setOutput('');
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError('');
    setAutoDetectedType(null);
  };

  const handleSwap = () => {
    if (output) {
      setInput(output);
      setOutput('');
      setMode(mode === 'encode' ? 'decode' : 'encode');
      setError('');
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
  }, [input, mode, variant]);

  const inputLabel = mode === 'encode' ? 'Plain Text Input' : 'Base64 Input';
  const outputLabel = mode === 'encode' ? 'Base64 Output' : 'Decoded Text Output';
  const inputPlaceholder = mode === 'encode' 
    ? 'Enter text to encode to Base64...' 
    : 'Paste Base64 encoded text to decode...';
  const outputPlaceholder = mode === 'encode' 
    ? 'Base64 encoded result will appear here...' 
    : 'Decoded text will appear here...';

  return (
    <div className="flex flex-col h-[calc(100vh-81px)]">
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-white">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Base64 Encoder/Decoder
        </h1>
        <p className="text-sm text-gray-600">
          Encode text to Base64 or decode Base64 to text with support for standard and URL-safe variants
        </p>
      </div>

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
                  Variant:
                </label>
                <select
                  value={variant}
                  onChange={(e) => setVariant(e.target.value as Base64Variant)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white text-gray-900 shadow-sm"
                >
                  <option value="standard">Standard</option>
                  <option value="url-safe">URL-Safe</option>
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
                {autoDetectedType === 'invalid' ? (
                  <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-md border border-red-200">
                    ⚠️ Input doesn't appear to be valid Base64
                  </div>
                ) : (
                  <div className="text-blue-600 text-sm bg-blue-50 px-3 py-2 rounded-md border border-blue-200">
                    🔍 Detected {autoDetectedType === 'url-safe' ? 'URL-safe' : 'standard'} Base64 format
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-md border border-red-200">
                ❌ {error}
              </div>
            )}
            
            {!error && input && output && (
              <div className="text-green-600 text-sm bg-green-50 px-3 py-2 rounded-md border border-green-200">
                ✅ {mode === 'encode' ? 'Encoded' : 'Decoded'} successfully
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
    </div>
  );
};

export default Base64Tool;