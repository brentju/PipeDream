import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import PipelineSidebar from '../components/pipeline/PipelineSidebar';
import PipelineCanvas from '../components/pipeline/PipelineCanvas';
import { PipelineNode } from '../types/pipeline';

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export default function PipelineBuilder() {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedStack, setSelectedStack] = useState('');
  const [selectedCloud, setSelectedCloud] = useState('AWS');
  const [selectedScope, setSelectedScope] = useState('deploy-only');
  const [pipelineName, setPipelineName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const { stack, cloud, scope, pipeline, edit } = router.query;

  // Load pipeline state from URL or localStorage
  useEffect(() => {
    if (!router.isReady) return;

    setSelectedStack((stack as string) || '');
    setSelectedCloud((cloud as string) || 'AWS');
    setSelectedScope((scope as string) || 'deploy-only');

    // If editing an existing pipeline, load it
    if (edit && pipeline) {
      try {
        const pipelineData = JSON.parse(decodeURIComponent(pipeline as string));
        setPipelineName(pipelineData.name || '');
        setNodes(pipelineData.nodes || []);
        setEdges(pipelineData.edges || []);
      } catch (error) {
        console.error('Error loading pipeline data:', error);
      }
    } else {
      // Try to restore from localStorage for this stack/cloud/scope combination
      const storageKey = `pipeline_${stack}_${cloud}_${scope}`;
      const savedPipeline = localStorage.getItem(storageKey);
      
      if (savedPipeline) {
        try {
          const pipelineData = JSON.parse(savedPipeline);
          setPipelineName(pipelineData.name || '');
          setNodes(pipelineData.nodes || []);
          setEdges(pipelineData.edges || []);
        } catch (error) {
          console.error('Error loading saved pipeline:', error);
        }
      }
    }
    
    setIsLoading(false);
  }, [router.isReady, stack, cloud, scope, pipeline, edit, setNodes, setEdges]);

  // Auto-save pipeline state to localStorage
  useEffect(() => {
    if (!isLoading && router.isReady && (nodes.length > 0 || pipelineName.trim())) {
      const storageKey = `pipeline_${selectedStack}_${selectedCloud}_${selectedScope}`;
      const pipelineData = {
        name: pipelineName,
        stack: selectedStack,
        cloud: selectedCloud,
        scope: selectedScope,
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type,
          data: node.data,
          position: node.position,
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
        })),
        lastModified: new Date().toISOString(),
      };

      localStorage.setItem(storageKey, JSON.stringify(pipelineData));
    }
  }, [nodes, edges, pipelineName, selectedStack, selectedCloud, selectedScope, isLoading, router.isReady]);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = useCallback(
    (type: string, position: { x: number; y: number }) => {
      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {
          label: type.charAt(0).toUpperCase() + type.slice(1),
          config: getDefaultConfig(type),
        },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes, selectedStack]
  );

  const removeNode = useCallback(
    (nodeId: string) => {
      if (confirm('Are you sure you want to remove this component?')) {
        // Remove the node
        setNodes((nds) => nds.filter((node) => node.id !== nodeId));
        // Remove any connected edges
        setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
      }
    },
    [setNodes, setEdges]
  );

  const getDefaultConfig = (type: string) => {
    switch (type) {
      case 'checkout':
        return { version: 'v3' };
      case 'setup':
        return { runtime: selectedStack === 'Node.js' ? 'node' : 'python', version: '18' };
      case 'install':
        return { command: selectedStack === 'Node.js' ? 'npm ci' : 'pip install -r requirements.txt' };
      case 'test':
        return { command: selectedStack === 'Node.js' ? 'npm test' : 'pytest' };
      case 'build':
        return { command: selectedStack === 'Node.js' ? 'npm run build' : 'python setup.py build' };
      case 'deploy':
        return { target: 'AWS S3', region: 'us-east-1' };
      default:
        return {};
    }
  };

  const clearPipeline = () => {
    if (confirm('Are you sure you want to clear the entire pipeline? This action cannot be undone.')) {
      setNodes([]);
      setEdges([]);
      setPipelineName('');
      
      // Clear from localStorage
      const storageKey = `pipeline_${selectedStack}_${selectedCloud}_${selectedScope}`;
      localStorage.removeItem(storageKey);
    }
  };

  const handleGenerate = async () => {
    if (!selectedStack || nodes.length === 0) {
      alert('Please select a tech stack and add some pipeline steps');
      return;
    }

    if (!pipelineName.trim()) {
      alert('Please enter a pipeline name');
      return;
    }

    const pipelineData = {
      name: pipelineName,
      stack: selectedStack,
      cloud: selectedCloud,
      scope: selectedScope,
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type,
        data: node.data,
        position: node.position,
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
      })),
    };

    const params = new URLSearchParams({
      stack: selectedStack,
      cloud: selectedCloud,
      scope: selectedScope,
      pipeline: encodeURIComponent(JSON.stringify(pipelineData)),
    });

    router.push(`/result?${params.toString()}`);
  };

  // Show loading state while restoring pipeline
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Loading Pipeline Builder...</h2>
          <p className="text-gray-600 mt-2">Restoring your progress</p>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Head>
          <title>Pipeline Builder - PipeDream</title>
          <meta name="description" content="Build your CI/CD pipeline visually" />
        </Head>

        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  🏗️ Pipeline Builder
                  {edit && <span className="text-sm text-purple-600 ml-2">(Editing)</span>}
                </h1>
                <p className="text-gray-600">
                  Drag and drop components to build your CI/CD pipeline
                </p>
                {(nodes.length > 0 || pipelineName.trim()) && (
                  <p className="text-sm text-green-600 mt-1">
                    ✅ Auto-saved - Your progress is preserved
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                {(nodes.length > 0 || pipelineName.trim()) && (
                  <button
                    onClick={clearPipeline}
                    className="px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                  >
                    Clear All
                  </button>
                )}
                <Link
                  href="/"
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  ← Back to Home
                </Link>
              </div>
            </div>

            {/* Pipeline Info */}
            <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pipeline Name
                  </label>
                  <input
                    type="text"
                    value={pipelineName}
                    onChange={(e) => setPipelineName(e.target.value)}
                    placeholder="my-awesome-pipeline"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tech Stack
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded text-gray-700">
                    {selectedStack || 'Not selected'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cloud Provider
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded text-gray-700">
                    {selectedCloud}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IAM Scope
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded text-gray-700">
                    {selectedScope}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex gap-6 h-[600px]">
            {/* Sidebar */}
            <PipelineSidebar onAddNode={addNode} />

            {/* Pipeline Canvas */}
            <PipelineCanvas
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onAddNode={addNode}
              onRemoveNode={removeNode}
            />
          </div>

          {/* Generate Button */}
          <div className="mt-8 text-center">
            <div className="relative inline-block">
              <button
                onClick={handleGenerate}
                disabled={nodes.length === 0 || !pipelineName.trim()}
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors group"
                title={
                  nodes.length === 0 && !pipelineName.trim()
                    ? "Please enter a pipeline name and add some pipeline steps"
                    : nodes.length === 0
                    ? "Please add some pipeline steps to generate code"
                    : !pipelineName.trim()
                    ? "Please enter a pipeline name"
                    : ""
                }
              >
                {edit ? 'Update CI/CD Code' : 'Generate CI/CD Code'}
              </button>
              
              {/* Custom Tooltip for better styling */}
              {(nodes.length === 0 || !pipelineName.trim()) && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                  {nodes.length === 0 && !pipelineName.trim()
                    ? "Please enter a pipeline name and add some pipeline steps"
                    : nodes.length === 0
                    ? "Please add some pipeline steps to generate code"
                    : "Please enter a pipeline name"}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                </div>
              )}
            </div>
            
            <p className="text-sm text-gray-500 mt-2">
              {nodes.length === 0 
                ? "Add some pipeline steps above to generate your code"
                : !pipelineName.trim()
                ? "Enter a pipeline name to continue"
                : edit
                ? "Ready to update your custom CI/CD workflow"
                : "Ready to generate your custom CI/CD workflow"
              }
            </p>
          </div>
        </div>
      </div>
    </DndProvider>
  );
} 