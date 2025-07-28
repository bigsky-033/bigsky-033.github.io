import { useState, useRef, useEffect, useCallback } from 'react';
import { 
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
} from '../../../utils/converters';
import CopyButton from '../../common/CopyButton';

type ConversionMode = 'text-to-codes' | 'codes-to-text';
type CodeFormat = 'decimal' | 'hex' | 'octal' | 'binary' | 'unicode' | 'escape' | 'html';
type OutputType = 'ascii' | 'unicode' | 'escape' | 'html' | 'analysis' | 'character-info';

const AsciiUnicodeConverter = () => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ConversionMode>('text-to-codes');
  const [codeFormat, setCodeFormat] = useState<CodeFormat>('decimal');
  const [outputType, setOutputType] = useState<OutputType>('ascii');
  const [results, setResults] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [characterFrequency, setCharacterFrequency] = useState<Array<{ char: string; count: number; percentage: number }>>([]);
  const [characterInfo, setCharacterInfo] = useState<Array<{ char: string; name: string; decimal: number; hex: string; octal: string; binary: string; unicode: string; category: string }>>([]);
  const [detectedEncoding, setDetectedEncoding] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = (textarea: HTMLTextAreaElement | null) => {
    if (textarea) {
      textarea.style.height = 'auto';
      const minHeight = 150;
      const maxHeight = 400;
      const scrollHeight = Math.max(minHeight, Math.min(maxHeight, textarea.scrollHeight));
      textarea.style.height = `${scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight(inputRef.current);
  }, [input]);

  const processConversion = useCallback(() => {
    if (!input.trim()) {
      setResults({});
      setError('');
      setCharacterFrequency([]);
      setCharacterInfo([]);
      setDetectedEncoding('');
      return;
    }

    try {
      setError('');
      const newResults: Record<string, string> = {};

      if (mode === 'text-to-codes') {
        // Convert text to various formats
        const text = input.trim();
        
        // ASCII codes in different formats
        newResults.decimal = textToAsciiCodes(text, 'decimal').join(' ');
        newResults.hex = textToAsciiCodes(text, 'hex').join(' ');
        newResults.octal = textToAsciiCodes(text, 'octal').join(' ');
        newResults.binary = textToAsciiCodes(text, 'binary').join(' ');
        
        // Unicode codes
        newResults.unicode = textToUnicodeCodes(text).join(' ');
        
        // Escape sequences
        newResults.escape = textToEscapeSequences(text);
        
        // HTML entities
        newResults.html = textToHtmlEntities(text);
        
        // Character frequency analysis
        const frequency = analyzeCharacterFrequency(text);
        setCharacterFrequency(frequency);
        
        // Character info for each character
        const charInfo = Array.from(text).map(char => getCharacterInfo(char));
        setCharacterInfo(charInfo);
        
        // Detect encoding
        setDetectedEncoding(detectTextEncoding(text));
        
      } else {
        // Convert codes to text
        const codes = input.trim().split(/\s+/).filter(code => code.length > 0);
        
        if (codeFormat === 'unicode') {
          newResults.text = unicodeCodesToText(codes);
        } else if (codeFormat === 'escape') {
          newResults.text = escapeSequencesToText(input.trim());
        } else if (codeFormat === 'html') {
          newResults.text = htmlEntitiesToText(input.trim());
        } else {
          newResults.text = asciiCodesToText(codes, codeFormat as 'decimal' | 'hex' | 'octal' | 'binary');
        }
      }
      
      setResults(newResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
      setResults({});
    }
  }, [input, mode, codeFormat]);

  const handleClear = () => {
    setInput('');
    setResults({});
    setError('');
    setCharacterFrequency([]);
    setCharacterInfo([]);
    setDetectedEncoding('');
  };

  // Auto-process when input changes
  useEffect(() => {
    processConversion();
  }, [input, mode, codeFormat, processConversion]);

  const getOutputContent = () => {
    if (mode === 'codes-to-text') {
      return results.text || '';
    }

    switch (outputType) {
      case 'ascii':
        return results[codeFormat] || '';
      case 'unicode':
        return results.unicode || '';
      case 'escape':
        return results.escape || '';
      case 'html':
        return results.html || '';
      case 'analysis':
        return characterFrequency.length > 0 
          ? characterFrequency.slice(0, 10).map(item => 
              `"${item.char === ' ' ? 'SPACE' : item.char === '\n' ? 'NEWLINE' : item.char === '\t' ? 'TAB' : item.char}": ${item.count} (${item.percentage.toFixed(1)}%)`
            ).join('\n')
          : '';
      case 'character-info':
        return characterInfo.length > 0
          ? characterInfo.map(info => 
              `"${info.char === ' ' ? 'SPACE' : info.char === '\n' ? 'NEWLINE' : info.char === '\t' ? 'TAB' : info.char}": ${info.name} | Dec: ${info.decimal} | Hex: ${info.hex} | ${info.unicode} | ${info.category}`
            ).join('\n')
          : '';
      default:
        return results[codeFormat] || '';
    }
  };

  const getOutputLabel = () => {
    if (mode === 'codes-to-text') {
      return 'Converted Text';
    }

    switch (outputType) {
      case 'ascii':
        return `ASCII Codes (${codeFormat})`;
      case 'unicode':
        return 'Unicode Code Points';
      case 'escape':
        return 'Escape Sequences';
      case 'html':
        return 'HTML Entities';
      case 'analysis':
        return 'Character Frequency Analysis';
      case 'character-info':
        return 'Character Information';
      default:
        return 'Output';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-81px)]">
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-white">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          ASCII/Unicode Converter
        </h1>
        <p className="text-sm text-gray-600">
          Convert between text and various encoding formats including ASCII codes, Unicode, escape sequences, and HTML entities
        </p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 flex flex-col border-r border-gray-200 bg-white">
          <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-semibold text-gray-700">
                {mode === 'text-to-codes' ? 'Text Input' : 'Code Input'}
              </label>
              <div className="flex items-center space-x-3">
                <label className="text-sm text-gray-600">
                  Mode:
                </label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as ConversionMode)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white text-gray-900 shadow-sm"
                >
                  <option value="text-to-codes">Text → Codes</option>
                  <option value="codes-to-text">Codes → Text</option>
                </select>
                {mode === 'codes-to-text' && (
                  <>
                    <label className="text-sm text-gray-600">
                      Format:
                    </label>
                    <select
                      value={codeFormat}
                      onChange={(e) => setCodeFormat(e.target.value as CodeFormat)}
                      className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white text-gray-900 shadow-sm"
                    >
                      <option value="decimal">Decimal</option>
                      <option value="hex">Hexadecimal</option>
                      <option value="octal">Octal</option>
                      <option value="binary">Binary</option>
                      <option value="unicode">Unicode</option>
                      <option value="escape">Escape Seq</option>
                      <option value="html">HTML Entity</option>
                    </select>
                  </>
                )}
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

            {detectedEncoding && mode === 'text-to-codes' && (
              <div className="mb-3">
                <div className="text-blue-600 text-sm bg-blue-50 px-3 py-2 rounded-md border border-blue-200">
                  📊 Detected encoding: {detectedEncoding}
                </div>
              </div>
            )}

            {error && (
              <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-md border border-red-200">
                ❌ {error}
              </div>
            )}
            
            {!error && input && Object.keys(results).length > 0 && (
              <div className="text-green-600 text-sm bg-green-50 px-3 py-2 rounded-md border border-green-200">
                ✅ Conversion successful
              </div>
            )}
          </div>
          
          <div className="flex-1 p-6">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === 'text-to-codes' 
                ? 'Enter text to convert to codes...' 
                : 'Enter codes to convert to text...'}
              className="w-full h-full p-4 font-mono text-sm border border-gray-300 rounded-lg bg-white text-gray-900 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 overflow-auto shadow-sm"
              style={{ minHeight: '150px' }}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-white">
          <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700">
                {getOutputLabel()}
              </label>
              <div className="flex items-center space-x-3">
                {mode === 'text-to-codes' && (
                  <>
                    <label className="text-sm text-gray-600">
                      Show:
                    </label>
                    <select
                      value={outputType}
                      onChange={(e) => setOutputType(e.target.value as OutputType)}
                      className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white text-gray-900 shadow-sm"
                    >
                      <option value="ascii">ASCII ({codeFormat})</option>
                      <option value="unicode">Unicode</option>
                      <option value="escape">Escape Seq</option>
                      <option value="html">HTML Entity</option>
                      <option value="analysis">Frequency</option>
                      <option value="character-info">Char Info</option>
                    </select>
                    <label className="text-sm text-gray-600">
                      Format:
                    </label>
                    <select
                      value={codeFormat}
                      onChange={(e) => setCodeFormat(e.target.value as CodeFormat)}
                      className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white text-gray-900 shadow-sm"
                      disabled={outputType !== 'ascii'}
                    >
                      <option value="decimal">Decimal</option>
                      <option value="hex">Hex</option>
                      <option value="octal">Octal</option>
                      <option value="binary">Binary</option>
                    </select>
                  </>
                )}
                {getOutputContent() && <CopyButton text={getOutputContent()} />}
              </div>
            </div>
          </div>
          
          <div className="flex-1 p-6">
            <textarea
              value={getOutputContent()}
              readOnly
              placeholder="Converted output will appear here..."
              className="w-full h-full p-4 font-mono text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-900 resize-none overflow-auto shadow-sm"
              style={{ minHeight: '150px' }}
            />
          </div>
        </div>
      </div>

      {/* Character Frequency Chart */}
      {mode === 'text-to-codes' && characterFrequency.length > 0 && outputType === 'analysis' && (
        <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50">
          <div className="px-6 py-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Top 10 Most Frequent Characters</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {characterFrequency.slice(0, 10).map((item, index) => (
                <div key={index} className="bg-white p-3 rounded-md border text-center">
                  <div className="text-lg font-mono font-bold text-gray-900">
                    {item.char === ' ' ? '⎵' : item.char === '\n' ? '↵' : item.char === '\t' ? '⇥' : item.char}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {item.count} times ({item.percentage.toFixed(1)}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Character Info Grid */}
      {mode === 'text-to-codes' && characterInfo.length > 0 && outputType === 'character-info' && (
        <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50">
          <div className="px-6 py-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Character Information</h3>
            <div className="max-h-32 overflow-y-auto">
              <div className="grid gap-2">
                {characterInfo.slice(0, 20).map((info, index) => (
                  <div key={index} className="bg-white p-2 rounded border text-xs font-mono">
                    <span className="inline-block w-8 text-center font-bold">
                      {info.char === ' ' ? '⎵' : info.char === '\n' ? '↵' : info.char === '\t' ? '⇥' : info.char}
                    </span>
                    <span className="text-gray-600">
                      {info.name} | Dec: {info.decimal} | Hex: 0x{info.hex} | {info.unicode} | {info.category}
                    </span>
                  </div>
                ))}
                {characterInfo.length > 20 && (
                  <div className="text-xs text-gray-500 text-center py-2">
                    ... and {characterInfo.length - 20} more characters
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AsciiUnicodeConverter;