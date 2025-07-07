import React from 'react';
import { Handle, Position } from 'reactflow';
import { 
  GitBranch, 
  Settings, 
  Download, 
  TestTube, 
  Hammer, 
  Upload,
  Bell,
  X
} from 'lucide-react';

interface NodeData {
  label: string;
  config: Record<string, any>;
  onRemove?: (id: string) => void;
}

interface CustomNodeProps {
  data: NodeData;
  id: string;
}

const getNodeIcon = (type: string) => {
  switch (type) {
    case 'checkout': return GitBranch;
    case 'setup': return Settings;
    case 'install': return Download;
    case 'test': return TestTube;
    case 'build': return Hammer;
    case 'deploy': return Upload;
    case 'notify': return Bell;
    default: return Settings;
  }
};

const getNodeColor = (type: string) => {
  switch (type) {
    case 'checkout': return 'bg-green-100 border-green-300 text-green-800';
    case 'setup': return 'bg-blue-100 border-blue-300 text-blue-800';
    case 'install': return 'bg-purple-100 border-purple-300 text-purple-800';
    case 'test': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    case 'build': return 'bg-orange-100 border-orange-300 text-orange-800';
    case 'deploy': return 'bg-red-100 border-red-300 text-red-800';
    case 'notify': return 'bg-gray-100 border-gray-300 text-gray-800';
    default: return 'bg-gray-100 border-gray-300 text-gray-800';
  }
};

const CustomNode: React.FC<CustomNodeProps & { type: string }> = ({ data, id, type }) => {
  const Icon = getNodeIcon(type);
  const colorClass = getNodeColor(type);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onRemove) {
      data.onRemove(id);
    }
  };

  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg border-2 ${colorClass} min-w-[120px] relative group`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      {/* Remove button */}
      <button
        onClick={handleRemove}
        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
        title="Remove component"
      >
        <X className="w-3 h-3" />
      </button>
      
      <div className="flex items-center space-x-2">
        <Icon className="w-4 h-4" />
        <div className="text-sm font-medium truncate">
          {data.label}
        </div>
      </div>
      
      {Object.keys(data.config).length > 0 && (
        <div className="mt-2 text-xs opacity-75">
          {Object.entries(data.config).slice(0, 2).map(([key, value]) => (
            <div key={key} className="truncate">
              {key}: {String(value)}
            </div>
          ))}
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

// Create specific node components for each type
const CheckoutNode = (props: CustomNodeProps) => <CustomNode {...props} type="checkout" />;
const SetupNode = (props: CustomNodeProps) => <CustomNode {...props} type="setup" />;
const InstallNode = (props: CustomNodeProps) => <CustomNode {...props} type="install" />;
const TestNode = (props: CustomNodeProps) => <CustomNode {...props} type="test" />;
const BuildNode = (props: CustomNodeProps) => <CustomNode {...props} type="build" />;
const DeployNode = (props: CustomNodeProps) => <CustomNode {...props} type="deploy" />;
const NotifyNode = (props: CustomNodeProps) => <CustomNode {...props} type="notify" />;

const nodeTypes = {
  checkout: CheckoutNode,
  setup: SetupNode,
  install: InstallNode,
  test: TestNode,
  build: BuildNode,
  deploy: DeployNode,
  notify: NotifyNode,
};

export default nodeTypes; 