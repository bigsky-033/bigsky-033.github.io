import { useState, useRef, useEffect } from 'react';
import { decodeJWT, formatJWTMetadata, isJWTExpired } from '../../../utils/converters';
import { isJWT } from '../../../utils/validators';
import CopyButton from '../../common/CopyButton';

const JwtDecoder = () => {
  const [input, setInput] = useState('');
  const [decodedData, setDecodedData] = useState<{
    header: Record<string, unknown>;
    payload: Record<string, unknown>;
    signature: string;
  } | null>(null);
  const [error, setError] = useState('');
  const [metadata, setMetadata] = useState<Record<string, string | number | boolean>>({});
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = (textarea: HTMLTextAreaElement | null) => {
    if (textarea) {
      textarea.style.height = 'auto';
      const minHeight = 100;
      const maxHeight = 300;
      const scrollHeight = Math.max(minHeight, Math.min(maxHeight, textarea.scrollHeight));
      textarea.style.height = `${scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight(inputRef.current);
  }, [input]);

  const handleDecode = () => {
    if (!input.trim()) {
      setError('Please enter a JWT token');
      setDecodedData(null);
      setMetadata({});
      return;
    }

    if (!isJWT(input.trim())) {
      setError('Invalid JWT format - must have 3 parts separated by dots');
      setDecodedData(null);
      setMetadata({});
      return;
    }

    try {
      const decoded = decodeJWT(input.trim());
      const jwtMetadata = formatJWTMetadata(decoded.payload);
      
      setDecodedData(decoded);
      setMetadata(jwtMetadata);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decode JWT token');
      setDecodedData(null);
      setMetadata({});
    }
  };

  const handleClear = () => {
    setInput('');
    setDecodedData(null);
    setError('');
    setMetadata({});
  };

  const isExpired = decodedData ? isJWTExpired(decodedData.payload) : false;
  const algorithm = decodedData?.header?.alg ? String(decodedData.header.alg) : 'Unknown';

  // Auto-decode when valid JWT is pasted
  useEffect(() => {
    if (input.trim() && isJWT(input.trim())) {
      handleDecode();
    } else if (!input.trim()) {
      setDecodedData(null);
      setError('');
      setMetadata({});
    } else if (input.trim()) {
      // Invalid JWT format
      setError('Invalid JWT format - must have 3 parts separated by dots');
      setDecodedData(null);
      setMetadata({});
    }
  }, [input]);

  return (
    <div className="flex flex-col h-[calc(100vh-81px)]">
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-white">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          JWT Token Decoder
        </h1>
        <p className="text-sm text-gray-600">
          Decode and display JWT token header, payload, and signature with metadata
        </p>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Input Section */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-semibold text-gray-700">
              JWT Token Input
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleClear}
                className="px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-all duration-200 shadow-sm font-medium"
              >
                Clear
              </button>
            </div>
          </div>
          
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your JWT token here..."
            className="w-full p-4 font-mono text-sm border border-gray-300 rounded-lg bg-white text-gray-900 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 overflow-auto shadow-sm"
            style={{ minHeight: '100px' }}
          />

          {error && (
            <div className="text-red-600 text-sm mt-3 bg-red-50 px-3 py-2 rounded-md border border-red-200">
              ❌ {error}
            </div>
          )}

          {decodedData && !error && (
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-green-600 text-sm bg-green-50 px-3 py-2 rounded-md border border-green-200">
                  ✅ Valid JWT Token
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Algorithm:</span> {algorithm}
                </div>
                {isExpired && (
                  <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-md border border-red-200">
                    ⚠️ Token Expired
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Output Section */}
        {decodedData && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
            {/* Header */}
            <div className="border-r border-gray-200 bg-white">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700">
                    Header
                  </label>
                  <CopyButton text={JSON.stringify(decodedData.header, null, 2)} />
                </div>
              </div>
              <div className="p-6 h-full overflow-auto">
                <pre className="font-mono text-sm text-gray-900 whitespace-pre-wrap">
                  {JSON.stringify(decodedData.header, null, 2)}
                </pre>
              </div>
            </div>

            {/* Payload */}
            <div className="border-r border-gray-200 bg-white">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700">
                    Payload
                  </label>
                  <CopyButton text={JSON.stringify(decodedData.payload, null, 2)} />
                </div>
              </div>
              <div className="p-6 h-full overflow-auto">
                <pre className="font-mono text-sm text-gray-900 whitespace-pre-wrap">
                  {JSON.stringify(decodedData.payload, null, 2)}
                </pre>
              </div>
            </div>

            {/* Signature & Metadata */}
            <div className="bg-white">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <label className="text-sm font-semibold text-gray-700">
                  Signature & Metadata
                </label>
              </div>
              <div className="p-6 h-full overflow-auto space-y-6">
                {/* Signature */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700">Signature</h3>
                    <CopyButton text={decodedData.signature} />
                  </div>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <code className="font-mono text-sm text-gray-900 break-all">
                      {decodedData.signature}
                    </code>
                  </div>
                </div>

                {/* Metadata */}
                {Object.keys(metadata).length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Token Metadata</h3>
                    <div className="space-y-2">
                      {Object.entries(metadata).map(([key, value]) => (
                        <div key={key} className="flex flex-col">
                          <span className="text-xs text-gray-500 mb-1">{key}</span>
                          <span className="text-sm text-gray-900 font-mono p-2 bg-gray-50 rounded border">
                            {String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!decodedData && !error && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-8">
              <div className="text-6xl mb-4">🔐</div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">JWT Token Decoder</h2>
              <p className="text-gray-500 mb-4">Paste a JWT token above to decode and analyze it</p>
              <div className="text-sm text-gray-400">
                <p>• View header, payload, and signature separately</p>
                <p>• See token metadata and expiration status</p>
                <p>• Copy individual sections</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JwtDecoder;