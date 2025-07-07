import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import CodeBlock from '../components/CodeBlock';

interface GeneratedConfigs {
  ci: string;
  iam: string;
  isAiGenerated?: boolean;
}

export default function Result() {
  const router = useRouter();
  const [configs, setConfigs] = useState<GeneratedConfigs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const { stack, cloud, scope, repoUrl, pipeline } = router.query;

  useEffect(() => {
    if (!router.isReady) return;

    if (!stack || !cloud || !scope) {
      router.push('/');
      return;
    }

    generateConfigs();
  }, [router.isReady, stack, cloud, scope, pipeline]);

  const generateConfigs = async () => {
    setIsLoading(true);
    setError('');

    try {
      const requestBody: any = {
        stack,
        cloud,
        scope,
      };

      // Add pipeline data if available
      if (pipeline) {
        requestBody.pipeline = pipeline;
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setConfigs({
          ci: data.ci,
          iam: data.iam,
          isAiGenerated: data.isAiGenerated
        });
      }
    } catch (err) {
      setError('Failed to generate configurations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Parse pipeline data for display
  let pipelineData = null;
  if (pipeline) {
    try {
      pipelineData = JSON.parse(decodeURIComponent(pipeline as string));
    } catch (error) {
      console.error('Error parsing pipeline data:', error);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">
            {pipelineData ? 'Generating pipeline configs...' : 'Generating your configs...'}
          </h2>
          <p className="text-gray-600 mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link 
              href="/"
              className="inline-block px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Try Again
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Head>
        <title>Generated Configs - PipeDream</title>
        <meta name="description" content="Your generated CI/CD pipeline config and IAM policy" />
      </Head>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              🎉 Your Configs Are Ready!
            </h1>
            
            {/* Pipeline Info */}
            {pipelineData ? (
              <div className="bg-white rounded-lg shadow-sm p-4 inline-block mb-4">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span><strong>Pipeline:</strong> {pipelineData.name}</span>
                  <span className="text-gray-300">|</span>
                  <span><strong>Steps:</strong> {pipelineData.nodes.length}</span>
                  <span className="text-gray-300">|</span>
                  <span><strong>Stack:</strong> {stack}</span>
                  <span className="text-gray-300">|</span>
                  <span><strong>Cloud:</strong> {cloud}</span>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-4 inline-block">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span><strong>Stack:</strong> {stack}</span>
                  <span className="text-gray-300">|</span>
                  <span><strong>Cloud:</strong> {cloud}</span>
                  <span className="text-gray-300">|</span>
                  <span><strong>Scope:</strong> {scope}</span>
                  {repoUrl && (
                    <>
                      <span className="text-gray-300">|</span>
                      <span><strong>Repo:</strong> {repoUrl}</span>
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* Generation Method Notice */}
            {pipelineData && (
              <div className="mt-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 inline-block">
                <div className="flex items-center space-x-2 text-purple-700">
                  <span>🏗️</span>
                  <span className="text-sm">
                    <strong>Custom Pipeline:</strong> Generated from your visual pipeline design
                  </span>
                </div>
              </div>
            )}
            
            {/* AI vs Template Notice */}
            {configs?.isAiGenerated === false && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 inline-block">
                <div className="flex items-center space-x-2 text-blue-700">
                  <span>📋</span>
                  <span className="text-sm">
                    <strong>Template Mode:</strong> Using curated templates (OpenAI API not configured)
                  </span>
                </div>
              </div>
            )}
            
            {configs?.isAiGenerated === true && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 inline-block">
                <div className="flex items-center space-x-2 text-green-700">
                  <span>🤖</span>
                  <span className="text-sm">
                    <strong>AI Generated:</strong> Custom configurations created by GPT-4
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Generated Configs */}
          <div className="space-y-8">
            {configs?.ci && (
              <CodeBlock
                title={pipelineData ? `${pipelineData.name} - GitHub Actions Workflow` : "GitHub Actions Workflow"}
                code={configs.ci}
                filename="deploy.yml"
                language="yaml"
              />
            )}

            {configs?.iam && (
              <CodeBlock
                title="AWS IAM Policy"
                code={configs.iam}
                filename="iam-policy.json"
                language="json"
              />
            )}
          </div>

          {/* Instructions */}
          <div className="mt-12 bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📋 Next Steps</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-medium mb-2">1. GitHub Actions Workflow:</h3>
                <p className="text-sm">
                  Save the workflow file as <code className="bg-gray-100 px-2 py-1 rounded">.github/workflows/deploy.yml</code> in your repository root.
                  {pipelineData && (
                    <span className="block mt-1 text-purple-600">
                      This workflow was generated based on your custom pipeline design with {pipelineData.nodes.length} steps.
                    </span>
                  )}
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">2. AWS IAM Policy:</h3>
                <p className="text-sm">
                  Create a new IAM user or role in your AWS console and attach this policy for the appropriate permissions.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">3. Environment Variables:</h3>
                <p className="text-sm">
                  Don't forget to add your AWS credentials as GitHub repository secrets 
                  (<code className="bg-gray-100 px-2 py-1 rounded">AWS_ACCESS_KEY_ID</code>, <code className="bg-gray-100 px-2 py-1 rounded">AWS_SECRET_ACCESS_KEY</code>).
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">4. Customize for Your Project:</h3>
                <p className="text-sm">
                  Replace placeholder values like <code className="bg-gray-100 px-2 py-1 rounded">your-bucket-name</code> and 
                  <code className="bg-gray-100 px-2 py-1 rounded">YOUR_DISTRIBUTION_ID</code> with your actual resource names.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-center space-x-4">
            <Link
              href="/"
              className="px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
            >
              Generate Another
            </Link>
            {pipelineData && (
              <Link
                href={`/pipeline-builder?stack=${stack}&cloud=${cloud}&scope=${scope}&edit=true&pipeline=${encodeURIComponent(JSON.stringify(pipelineData))}`}
                className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                Edit Pipeline
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 