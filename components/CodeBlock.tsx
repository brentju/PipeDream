import { useState } from 'react';
import { copyToClipboard, downloadFile } from '../lib/utils';

interface CodeBlockProps {
  title: string;
  code: string;
  filename: string;
  language?: string;
}

export default function CodeBlock({ title, code, filename, language = 'yaml' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    downloadFile(code, filename);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex space-x-2">
          <button
            onClick={handleCopy}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              copied 
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
            }`}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-md hover:bg-gray-200 transition-colors"
          >
            Download
          </button>
        </div>
      </div>
      <div className="relative">
        <pre className="p-4 text-sm text-gray-800 bg-gray-50 overflow-x-auto">
          <code className={`language-${language}`}>{code}</code>
        </pre>
      </div>
    </div>
  );
} 