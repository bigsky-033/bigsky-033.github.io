import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  generateAllHashes, 
  readFileAsArrayBuffer, 
  compareHashes, 
  validateHashFormat,
  getHashAlgorithmInfo,
  type HashAlgorithm, 
  type HashFormat 
} from '../../../utils/hashers';
import CopyButton from '../../common/CopyButton';

type InputMode = 'text' | 'file';

const HashGenerator = () => {
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [textInput, setTextInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [hashes, setHashes] = useState<Record<HashAlgorithm, string>>({} as Record<HashAlgorithm, string>);
  const [hashFormat, setHashFormat] = useState<HashFormat>('lowercase');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [compareHash, setCompareHash] = useState('');
  const [compareResult, setCompareResult] = useState<{ algorithm: HashAlgorithm; matches: boolean } | null>(null);
  
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const adjustTextareaHeight = (textarea: HTMLTextAreaElement | null) => {
    if (textarea) {
      textarea.style.height = 'auto';
      const minHeight = 120;
      const maxHeight = 300;
      const scrollHeight = Math.max(minHeight, Math.min(maxHeight, textarea.scrollHeight));
      textarea.style.height = `${scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight(textInputRef.current);
  }, [textInput]);

  const generateHashesFromInput = useCallback(async () => {
    if (inputMode === 'text' && !textInput.trim()) {
      setHashes({} as Record<HashAlgorithm, string>);
      setError('');
      return;
    }

    if (inputMode === 'file' && !selectedFile) {
      setHashes({} as Record<HashAlgorithm, string>);
      setError('');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      let input: string | ArrayBuffer;

      if (inputMode === 'text') {
        input = textInput.trim();
      } else {
        input = await readFileAsArrayBuffer(selectedFile!);
      }

      const generatedHashes = await generateAllHashes(input, hashFormat);
      setHashes(generatedHashes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate hashes');
      setHashes({} as Record<HashAlgorithm, string>);
    } finally {
      setIsGenerating(false);
    }
  }, [inputMode, textInput, selectedFile, hashFormat]);

  useEffect(() => {
    generateHashesFromInput();
  }, [generateHashesFromInput]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleCompareHash = useCallback(() => {
    if (!compareHash.trim()) {
      setCompareResult(null);
      return;
    }

    // Try to match against each generated hash
    const algorithms: HashAlgorithm[] = ['MD5', 'SHA-1', 'SHA-256', 'SHA-512'];
    
    for (const algorithm of algorithms) {
      if (hashes[algorithm] && compareHashes(hashes[algorithm], compareHash.trim())) {
        setCompareResult({ algorithm, matches: true });
        return;
      }
    }

    // Check if the hash format is valid for any algorithm
    const validFormats = algorithms.filter(alg => validateHashFormat(compareHash.trim(), alg));
    
    if (validFormats.length > 0) {
      setCompareResult({ algorithm: validFormats[0], matches: false });
    } else {
      setCompareResult({ algorithm: 'SHA-256', matches: false });
    }
  }, [compareHash, hashes]);

  useEffect(() => {
    handleCompareHash();
  }, [compareHash, hashes, handleCompareHash]);

  const handleClear = () => {
    setTextInput('');
    setSelectedFile(null);
    setCompareHash('');
    setHashes({} as Record<HashAlgorithm, string>);
    setCompareResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const hasAnyHash = Object.values(hashes).some(hash => hash);

  return (
    <div className="flex flex-col h-[calc(100vh-81px)]">
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-white">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Hash Generator
        </h1>
        <p className="text-sm text-gray-600">
          Generate MD5, SHA-1, SHA-256, and SHA-512 hashes from text or files. Compare hashes and verify integrity.
        </p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Input Section */}
        <div className="flex-1 flex flex-col border-r border-gray-200 bg-white">
          <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-semibold text-gray-700">
                Input
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">Mode:</label>
                  <select
                    value={inputMode}
                    onChange={(e) => setInputMode(e.target.value as InputMode)}
                    className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white text-gray-900 shadow-sm"
                  >
                    <option value="text">Text</option>
                    <option value="file">File</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">Format:</label>
                  <select
                    value={hashFormat}
                    onChange={(e) => setHashFormat(e.target.value as HashFormat)}
                    className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white text-gray-900 shadow-sm"
                  >
                    <option value="lowercase">lowercase</option>
                    <option value="uppercase">UPPERCASE</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={handleClear}
                className="px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-all duration-200 shadow-sm font-medium"
              >
                Clear
              </button>
            </div>

            {error && (
              <div className="mb-3">
                <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-md border border-red-200">
                  ❌ {error}
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="mb-3">
                <div className="text-blue-600 text-sm bg-blue-50 px-3 py-2 rounded-md border border-blue-200">
                  ⏳ Generating hashes...
                </div>
              </div>
            )}

            {hasAnyHash && !error && !isGenerating && (
              <div className="mb-3">
                <div className="text-green-600 text-sm bg-green-50 px-3 py-2 rounded-md border border-green-200">
                  ✅ Hashes generated successfully
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 p-6">
            {inputMode === 'text' ? (
              <textarea
                ref={textInputRef}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Enter text to generate hashes..."
                className="w-full h-full p-4 font-mono text-sm border border-gray-300 rounded-lg bg-white text-gray-900 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 overflow-auto shadow-sm"
                style={{ minHeight: '120px' }}
              />
            ) : (
              <div className="h-full flex flex-col">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                  <div className="text-4xl mb-4">📁</div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    className="mb-3 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {selectedFile && (
                    <div className="mt-4 p-3 bg-white rounded-md border text-left">
                      <div className="text-sm font-medium text-gray-900">{selectedFile.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {(selectedFile.size / 1024).toFixed(2)} KB • {selectedFile.type || 'Unknown type'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Output Section */}
        <div className="flex-1 flex flex-col bg-white">
          <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700">
                Generated Hashes
              </label>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-auto">
            <div className="space-y-4">
              {(['MD5', 'SHA-1', 'SHA-256', 'SHA-512'] as HashAlgorithm[]).map((algorithm) => {
                const hash = hashes[algorithm];
                const info = getHashAlgorithmInfo(algorithm);
                
                return (
                  <div key={algorithm} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-semibold text-gray-900">{info.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          info.secure 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {info.secure ? 'Secure' : 'Legacy'}
                        </span>
                      </div>
                      {hash && <CopyButton text={hash} />}
                    </div>
                    
                    <div className="text-xs text-gray-500 mb-2">
                      {info.description} • {info.length} characters • {info.note}
                    </div>
                    
                    <div className="bg-white border rounded p-3 font-mono text-sm break-all">
                      {hash || (
                        <span className="text-gray-400 italic">
                          {inputMode === 'text' ? 'Enter text to generate hash' : 'Select file to generate hash'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Hash Comparison Section */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50">
        <div className="px-6 py-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Hash Comparison</h3>
          <div className="flex items-center space-x-4">
            <input
              type="text"
              value={compareHash}
              onChange={(e) => setCompareHash(e.target.value)}
              placeholder="Enter hash to compare..."
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white font-mono"
            />
            {compareResult && (
              <div className={`px-3 py-2 rounded-md text-sm font-medium ${
                compareResult.matches
                  ? 'bg-green-100 text-green-800'
                  : compareHash.trim()
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {compareResult.matches 
                  ? `✅ Matches ${compareResult.algorithm}` 
                  : compareHash.trim()
                  ? '❌ No match found'
                  : 'Enter hash to compare'
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HashGenerator;