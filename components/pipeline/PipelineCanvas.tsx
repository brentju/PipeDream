import React, { useCallback, useRef, useMemo } from 'react';
import { useDrop } from 'react-dnd';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

import PipelineNodeTypes from './PipelineNodeTypes';

interface PipelineCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (params: Edge | Connection) => void;
  onAddNode: (type: string, position: { x: number; y: number }) => void;
  onRemoveNode?: (nodeId: string) => void;
}

const PipelineCanvasInner: React.FC<PipelineCanvasProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onAddNode,
  onRemoveNode,
}) => {
  const dropRef = useMemo(() => ({ current: null as HTMLDivElement | null }), []);
  const { project } = useReactFlow();

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'pipeline-step',
    drop: (item: { type: string }, monitor) => {
      const clientOffset = monitor.getClientOffset();
      
      if (clientOffset && dropRef.current) {
        const dropAreaRect = dropRef.current.getBoundingClientRect();
        
        // Calculate position relative to the drop area
        const relativePosition = {
          x: clientOffset.x - dropAreaRect.left,
          y: clientOffset.y - dropAreaRect.top,
        };
        
        // Convert to ReactFlow coordinates
        const reactFlowPosition = project(relativePosition);
        
        onAddNode(item.type, reactFlowPosition);
      }
      
      return { name: 'Canvas' };
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // Combine refs
  const setRefs = useCallback((node: HTMLDivElement | null) => {
    dropRef.current = node;
    drop(node);
  }, [drop]);

  const canvasClassName = `bg-gray-50 ${
    isOver && canDrop ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : ''
  }`;

  // Add onRemove to each node's data
  const nodesWithRemove = nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      onRemove: onRemoveNode,
    },
  }));

  return (
    <div ref={setRefs} className="flex-1 bg-white rounded-lg shadow-lg overflow-hidden relative">
      {isOver && canDrop && (
        <div className="absolute inset-0 bg-blue-100 bg-opacity-50 z-10 flex items-center justify-center">
          <div className="bg-white px-4 py-2 rounded-lg shadow-lg border-2 border-blue-300">
            <span className="text-blue-600 font-medium">Drop here to add component</span>
          </div>
        </div>
      )}
      
      <ReactFlow
        nodes={nodesWithRemove}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={PipelineNodeTypes}
        fitView
        className={canvasClassName}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};

const PipelineCanvas: React.FC<PipelineCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <PipelineCanvasInner {...props} />
    </ReactFlowProvider>
  );
};

export default PipelineCanvas; 