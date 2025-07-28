import { useState, useRef, useEffect } from 'react';
import { formatJson, minifyJson, sortJsonKeys } from '../../../utils/formatters';
import { validateJson } from '../../../utils/validators';
import CopyButton from '../../common/CopyButton';

const JsonFormatter = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [indent, setIndent] = useState(2);
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

  const handleFormat = () => {
    try {
      const formatted = formatJson(input, indent);
      setOutput(formatted);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON');
      setOutput('');
    }
  };

  const handleMinify = () => {
    try {
      const minified = minifyJson(input);
      setOutput(minified);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON');
      setOutput('');
    }
  };

  const handleSort = () => {
    try {
      const sorted = sortJsonKeys(input, indent);
      setOutput(sorted);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON');
      setOutput('');
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError('');
  };

  const validation = validateJson(input);

  return (
    <div className="flex flex-col h-[calc(100vh-81px)]">
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-white">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          JSON Formatter
        </h1>
        <p className="text-sm text-gray-600">
          Format, validate, and prettify JSON data with customizable indentation
        </p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 flex flex-col border-r border-gray-200 bg-white">
          <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-semibold text-gray-700">
                Input JSON
              </label>
              <div className="flex items-center space-x-3">
                <label className="text-sm text-gray-600">
                  Indent:
                </label>
                <select
                  value={indent}
                  onChange={(e) => setIndent(Number(e.target.value))}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white text-gray-900 shadow-sm"
                >
                  <option value={2}>2 spaces</option>
                  <option value={4}>4 spaces</option>
                  <option value={8}>8 spaces</option>
                </select>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={handleFormat}
                disabled={!validation.isValid}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm font-medium"
              >
                Format
              </button>
              <button
                onClick={handleMinify}
                disabled={!validation.isValid}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm font-medium"
              >
                Minify
              </button>
              <button
                onClick={handleSort}
                disabled={!validation.isValid}
                className="px-4 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm font-medium"
              >
                Sort Keys
              </button>
              <button
                onClick={handleClear}
                className="px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-all duration-200 shadow-sm font-medium"
              >
                Clear
              </button>
            </div>

            {!validation.isValid && input && (
              <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-md border border-red-200">
                ❌ {validation.error}
              </div>
            )}
            
            {validation.isValid && input && (
              <div className="text-green-600 text-sm bg-green-50 px-3 py-2 rounded-md border border-green-200">
                ✅ Valid JSON
              </div>
            )}
          </div>
          
          <div className="flex-1 p-6">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your JSON here..."
              className="w-full h-full p-4 font-mono text-sm border border-gray-300 rounded-lg bg-white text-gray-900 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 overflow-auto shadow-sm"
              style={{ minHeight: '200px' }}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-white">
          <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700">
                Formatted Output
              </label>
              {output && <CopyButton text={output} />}
            </div>
          </div>
          
          <div className="flex-1 p-6">
            <textarea
              ref={outputRef}
              value={output}
              readOnly
              placeholder="Formatted JSON will appear here..."
              className="w-full h-full p-4 font-mono text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-900 resize-none overflow-auto shadow-sm"
              style={{ minHeight: '200px' }}
            />
            
            {error && (
              <div className="text-red-600 text-sm mt-3 bg-red-50 px-3 py-2 rounded-md border border-red-200">
                ❌ {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JsonFormatter;