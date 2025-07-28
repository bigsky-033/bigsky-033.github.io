import { useState, useCallback } from 'react';
import {
  generateBulkUuids,
  formatUuid,
  parseUuid,
  getUuidVersionInfo,
  UUID_NAMESPACES,
  type UuidVersion,
  type UuidFormat
} from '../../../utils/uuid';
import CopyButton from '../../common/CopyButton';

const UuidGenerator = () => {
  const [version, setVersion] = useState<UuidVersion>('v4');
  const [format, setFormat] = useState<UuidFormat>('standard');
  const [count, setCount] = useState(1);
  const [namespace, setNamespace] = useState(UUID_NAMESPACES.DNS);
  const [name, setName] = useState('');
  const [generatedUuids, setGeneratedUuids] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  
  // UUID validation section
  const [validationInput, setValidationInput] = useState('');
  const [validationResult, setValidationResult] = useState<ReturnType<typeof parseUuid> | null>(null);

  const generateUuids = useCallback(async () => {
    if (version === 'v5' && (!namespace.trim() || !name.trim())) {
      setError('v5 UUIDs require both namespace and name');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const uuids = await generateBulkUuids(
        count,
        version,
        version === 'v5' ? namespace.trim() : undefined,
        version === 'v5' ? name.trim() : undefined
      );

      const formattedUuids = uuids.map(uuid => formatUuid(uuid, format));
      setGeneratedUuids(formattedUuids);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate UUIDs');
      setGeneratedUuids([]);
    } finally {
      setIsGenerating(false);
    }
  }, [version, format, count, namespace, name]);

  const handleValidateUuid = useCallback(() => {
    if (!validationInput.trim()) {
      setValidationResult(null);
      return;
    }

    const result = parseUuid(validationInput.trim());
    setValidationResult(result);
  }, [validationInput]);

  const handleClear = () => {
    setGeneratedUuids([]);
    setError('');
    setValidationInput('');
    setValidationResult(null);
  };

  const handleCopyAll = () => {
    const text = generatedUuids.join('\n');
    navigator.clipboard.writeText(text);
  };

  const versionInfo = getUuidVersionInfo(version);
  const hasGeneratedUuids = generatedUuids.length > 0;

  return (
    <div className="flex flex-col h-[calc(100vh-81px)]">
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-white">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          UUID Generator
        </h1>
        <p className="text-sm text-gray-600">
          Generate UUIDs in various formats (v1, v4, v5) with bulk generation and validation features.
        </p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Configuration Section */}
        <div className="flex-1 flex flex-col border-r border-gray-200 bg-white">
          <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">
                  Generator Settings
                </label>
              </div>

              {/* Version Selection */}
              <div className="flex items-center space-x-4">
                <label className="text-sm text-gray-600 min-w-[80px]">Version:</label>
                <select
                  value={version}
                  onChange={(e) => setVersion(e.target.value as UuidVersion)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white text-gray-900 shadow-sm"
                >
                  <option value="v1">Version 1 (Time-based)</option>
                  <option value="v4">Version 4 (Random)</option>
                  <option value="v5">Version 5 (Namespace)</option>
                </select>
              </div>

              {/* Format Selection */}
              <div className="flex items-center space-x-4">
                <label className="text-sm text-gray-600 min-w-[80px]">Format:</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as UuidFormat)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white text-gray-900 shadow-sm"
                >
                  <option value="standard">Standard (with dashes)</option>
                  <option value="no-dashes">No dashes</option>
                  <option value="uppercase">Uppercase</option>
                  <option value="uppercase-no-dashes">Uppercase no dashes</option>
                </select>
              </div>

              {/* Count Selection */}
              <div className="flex items-center space-x-4">
                <label className="text-sm text-gray-600 min-w-[80px]">Count:</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={count}
                  onChange={(e) => setCount(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))}
                  className="w-20 text-sm border border-gray-300 rounded-md px-3 py-1 bg-white text-gray-900 shadow-sm"
                />
                <span className="text-xs text-gray-500">(1-1000)</span>
              </div>

              {/* v5 UUID specific inputs */}
              {version === 'v5' && (
                <div className="space-y-3 p-3 bg-blue-50 rounded-md border border-blue-200">
                  <div className="text-sm font-medium text-blue-800">v5 UUID Parameters</div>
                  
                  <div className="flex items-center space-x-4">
                    <label className="text-sm text-gray-600 min-w-[80px]">Namespace:</label>
                    <select
                      value={namespace}
                      onChange={(e) => setNamespace(e.target.value)}
                      className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-1 bg-white text-gray-900 shadow-sm"
                    >
                      <option value={UUID_NAMESPACES.DNS}>DNS ({UUID_NAMESPACES.DNS})</option>
                      <option value={UUID_NAMESPACES.URL}>URL ({UUID_NAMESPACES.URL})</option>
                      <option value={UUID_NAMESPACES.OID}>OID ({UUID_NAMESPACES.OID})</option>
                      <option value={UUID_NAMESPACES.X500}>X500 ({UUID_NAMESPACES.X500})</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <label className="text-sm text-gray-600 min-w-[80px]">Name:</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter name for v5 UUID generation"
                      className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-1 bg-white text-gray-900 shadow-sm"
                    />
                  </div>
                  
                  <div className="text-xs text-blue-600">
                    v5 UUIDs are deterministic - same namespace and name always produce the same UUID
                  </div>
                </div>
              )}

              {/* Version Info */}
              <div className="p-3 bg-gray-50 rounded-md border">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">{versionInfo.name}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    versionInfo.secure 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {versionInfo.secure ? 'Secure' : 'Legacy'}
                  </span>
                </div>
                <div className="text-xs text-gray-600 mb-1">{versionInfo.description}</div>
                <div className="text-xs text-gray-500">{versionInfo.note}</div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={generateUuids}
                  disabled={isGenerating || (version === 'v5' && (!namespace.trim() || !name.trim()))}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm font-medium"
                >
                  {isGenerating ? 'Generating...' : 'Generate UUIDs'}
                </button>
                <button
                  onClick={handleClear}
                  className="px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-all duration-200 shadow-sm font-medium"
                >
                  Clear
                </button>
                {hasGeneratedUuids && (
                  <button
                    onClick={handleCopyAll}
                    className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-all duration-200 shadow-sm font-medium"
                  >
                    Copy All
                  </button>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-md border border-red-200">
                  ❌ {error}
                </div>
              )}

              {/* Success Display */}
              {hasGeneratedUuids && !error && !isGenerating && (
                <div className="text-green-600 text-sm bg-green-50 px-3 py-2 rounded-md border border-green-200">
                  ✅ Generated {generatedUuids.length} UUID{generatedUuids.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>

          {/* UUID Validation Section */}
          <div className="flex-1 p-6">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">UUID Validation</h3>
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="text"
                  value={validationInput}
                  onChange={(e) => setValidationInput(e.target.value)}
                  onBlur={handleValidateUuid}
                  placeholder="Enter UUID to validate..."
                  className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-2 bg-white font-mono"
                />
                <button
                  onClick={handleValidateUuid}
                  className="px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-all duration-200 shadow-sm font-medium"
                >
                  Validate
                </button>
              </div>

              {validationResult && (
                <div className={`p-3 rounded-md border text-sm ${
                  validationResult.isValid
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  {validationResult.isValid ? (
                    <div className="space-y-1">
                      <div>✅ Valid UUID</div>
                      <div>Version: {validationResult.version}</div>
                      <div>Variant: {validationResult.variant}</div>
                      {validationResult.timestamp && (
                        <div>Timestamp: {validationResult.timestamp.toLocaleString()}</div>
                      )}
                    </div>
                  ) : (
                    <div>❌ Invalid UUID format</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Generated UUIDs Section */}
        <div className="flex-1 flex flex-col bg-white">
          <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700">
                Generated UUIDs {hasGeneratedUuids && `(${generatedUuids.length})`}
              </label>
              {hasGeneratedUuids && (
                <CopyButton text={generatedUuids.join('\n')} />
              )}
            </div>
          </div>

          <div className="flex-1 p-6 overflow-auto">
            {hasGeneratedUuids ? (
              <div className="space-y-2">
                {generatedUuids.map((uuid, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border font-mono text-sm">
                    <span className="flex-1 break-all">{uuid}</span>
                    <CopyButton text={uuid} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <div className="text-4xl mb-4">🆔</div>
                  <div className="text-lg mb-2">No UUIDs Generated</div>
                  <div className="text-sm">Configure settings and click "Generate UUIDs" to start</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UuidGenerator;