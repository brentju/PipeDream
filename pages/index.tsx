import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { 
  validateGitHubUrl, 
  techStacks, 
  cloudProviders, 
  iamScopes 
} from '../lib/utils';

export default function Home() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState('');
  const [selectedStack, setSelectedStack] = useState('');
  const [selectedCloud, setSelectedCloud] = useState('AWS');
  const [selectedScope, setSelectedScope] = useState('deploy-only');
  const [isDetecting, setIsDetecting] = useState(false);
  const [useManualStack, setUseManualStack] = useState(false);
  const [error, setError] = useState('');

  const handleDetectStack = async () => {
    if (!validateGitHubUrl(repoUrl)) {
      setError('Please enter a valid GitHub repository URL');
      return;
    }

    setIsDetecting(true);
    setError('');

    try {
      const response = await fetch('/api/detect-stack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repoUrl }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else if (data.stack && data.stack !== 'Unknown') {
        setSelectedStack(data.stack);
        setUseManualStack(false);
      } else {
        setError('Could not detect technology stack. Please select manually.');
        setUseManualStack(true);
      }
    } catch (err) {
      setError('Failed to detect technology stack. Please try again.');
      setUseManualStack(true);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleGenerate = async () => {
    const stack = useManualStack ? selectedStack : selectedStack;
    
    if (!stack) {
      setError('Please select a technology stack');
      return;
    }

    if (!selectedCloud || !selectedScope) {
      setError('Please select cloud provider and IAM scope');
      return;
    }

    const params = new URLSearchParams({
      stack,
      cloud: selectedCloud,
      scope: selectedScope,
      ...(repoUrl && { repoUrl })
    });

    router.push(`/result?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Head>
        <title>PipeDream - Generate CI/CD Configs & IAM Policies</title>
        <meta name="description" content="Generate working CI/CD pipeline configs and IAM policies from a simple UI" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🚀 PipeDream
            </h1>
            <p className="text-xl text-gray-600">
              Generate working CI/CD pipeline configs and IAM policies from a simple UI
            </p>
          </div>

          {/* Main Form */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Step 1: Repository URL */}
            <div className="mb-8">
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                1. GitHub Repository URL (Optional)
              </label>
              <div className="flex space-x-3">
                <input
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/username/repository"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <button
                  onClick={handleDetectStack}
                  disabled={isDetecting || !repoUrl}
                  className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isDetecting ? 'Detecting...' : 'Detect Stack'}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                We'll try to detect your technology stack automatically
              </p>
            </div>

            {/* Step 2: Technology Stack */}
            <div className="mb-8">
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                2. Technology Stack
              </label>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="stackMethod"
                      checked={!useManualStack}
                      onChange={() => setUseManualStack(false)}
                      className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-900">Auto-detected</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="stackMethod"
                      checked={useManualStack}
                      onChange={() => setUseManualStack(true)}
                      className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-900">Manual selection</span>
                  </label>
                </div>
              </div>
              
              {useManualStack ? (
                <select
                  value={selectedStack}
                  onChange={(e) => setSelectedStack(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select technology stack...</option>
                  {techStacks.map((stack) => (
                    <option key={stack} value={stack}>
                      {stack}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                  {selectedStack || 'No stack detected yet'}
                </div>
              )}
            </div>

            {/* Step 3: Cloud Provider */}
            <div className="mb-8">
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                3. Cloud Provider
              </label>
              <select
                value={selectedCloud}
                onChange={(e) => setSelectedCloud(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {cloudProviders.map((cloud) => (
                  <option key={cloud} value={cloud}>
                    {cloud}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 4: IAM Scope */}
            <div className="mb-8">
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                4. IAM Access Scope
              </label>
              <select
                value={selectedScope}
                onChange={(e) => setSelectedScope(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {iamScopes.map((scope) => (
                  <option key={scope} value={scope}>
                    {scope.charAt(0).toUpperCase() + scope.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Generation Options */}
            <div className="space-y-4">
              {/* Quick Generate */}
              <button
                onClick={handleGenerate}
                className="w-full px-6 py-4 bg-primary-600 text-white font-semibold text-lg rounded-lg hover:bg-primary-700 transition-colors"
              >
                Quick Generate 🚀
              </button>
              
              <div className="text-center">
                <span className="text-gray-400 font-medium">OR</span>
              </div>
              
              {/* Pipeline Builder */}
              <button
                onClick={() => {
                  if (!selectedStack) {
                    setError('Please select a technology stack first');
                    return;
                  }
                  const params = new URLSearchParams({
                    stack: selectedStack,
                    cloud: selectedCloud,
                    scope: selectedScope,
                  });
                  router.push(`/pipeline-builder?${params.toString()}`);
                }}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-lg rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <span>🏗️</span>
                <span>Build Custom Pipeline</span>
              </button>
              
              <p className="text-sm text-gray-500 text-center">
                Use the visual pipeline builder for more control over your CI/CD flow
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="font-semibold text-gray-900 mb-1">Lightning Fast</h3>
              <p className="text-sm text-gray-600">Generate configs in seconds</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🔒</div>
              <h3 className="font-semibold text-gray-900 mb-1">Secure by Default</h3>
              <p className="text-sm text-gray-600">Follows security best practices</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">📋</div>
              <h3 className="font-semibold text-gray-900 mb-1">Copy & Deploy</h3>
              <p className="text-sm text-gray-600">Ready-to-use configurations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 