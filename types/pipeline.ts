export interface PipelineNode {
  id: string;
  type: string;
  data: {
    label: string;
    config: Record<string, any>;
  };
  position: { x: number; y: number };
}

export interface PipelineEdge {
  id: string;
  source: string;
  target: string;
}

export interface PipelineConfig {
  name: string;
  stack: string;
  cloud: string;
  scope: string;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
}

export interface NodeConfig {
  [key: string]: any;
}

export interface PipelineStep {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: 'source' | 'build' | 'test' | 'deploy' | 'notification';
  defaultConfig: NodeConfig;
} 