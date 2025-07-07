import React from 'react';
import { useDrag } from 'react-dnd';
import { 
  GitBranch, 
  Settings, 
  Download, 
  TestTube, 
  Hammer, 
  Upload,
  Bell,
  CheckCircle
} from 'lucide-react';

interface PipelineStep {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  category: string;
}

const pipelineSteps: PipelineStep[] = [
  {
    id: 'checkout',
    name: 'Checkout',
    icon: GitBranch,
    description: 'Get source code from repository',
    category: 'source'
  },
  {
    id: 'setup',
    name: 'Setup Runtime',
    icon: Settings,
    description: 'Setup Node.js, Python, etc.',
    category: 'build'
  },
  {
    id: 'install',
    name: 'Install Dependencies',
    icon: Download,
    description: 'Install project dependencies',
    category: 'build'
  },
  {
    id: 'test',
    name: 'Run Tests',
    icon: TestTube,
    description: 'Execute test suite',
    category: 'test'
  },
  {
    id: 'build',
    name: 'Build',
    icon: Hammer,
    description: 'Build the application',
    category: 'build'
  },
  {
    id: 'deploy',
    name: 'Deploy',
    icon: Upload,
    description: 'Deploy to cloud provider',
    category: 'deploy'
  },
  {
    id: 'notify',
    name: 'Notify',
    icon: Bell,
    description: 'Send notifications',
    category: 'notification'
  }
];

interface DraggableStepProps {
  step: PipelineStep;
  onAddNode: (type: string, position: { x: number; y: number }) => void;
}

const DraggableStep: React.FC<DraggableStepProps> = ({ step, onAddNode }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'pipeline-step',
    item: { type: step.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult();
      if (item && dropResult) {
        onAddNode(step.id, { x: 100, y: 100 });
      }
    },
  });

  const Icon = step.icon;

  return (
    <div
      ref={drag}
      className={`bg-white rounded-lg p-3 border-2 border-gray-200 cursor-grab hover:border-blue-300 hover:shadow-md transition-all ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <Icon className="w-5 h-5 text-gray-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {step.name}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {step.description}
          </p>
        </div>
      </div>
    </div>
  );
};

interface PipelineSidebarProps {
  onAddNode: (type: string, position: { x: number; y: number }) => void;
}

const PipelineSidebar: React.FC<PipelineSidebarProps> = ({ onAddNode }) => {
  const categories = Array.from(new Set(pipelineSteps.map(step => step.category)));

  const handleStepClick = (stepId: string) => {
    const randomX = Math.random() * 300 + 50;
    const randomY = Math.random() * 300 + 50;
    onAddNode(stepId, { x: randomX, y: randomY });
  };

  return (
    <div className="w-80 bg-white rounded-lg shadow-lg p-4 overflow-y-auto">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Pipeline Components
        </h3>
        <p className="text-sm text-gray-500">
          Drag components to the canvas or click to add them
        </p>
      </div>

      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category}>
            <h4 className="text-sm font-medium text-gray-700 mb-2 capitalize">
              {category}
            </h4>
            <div className="space-y-2">
              {pipelineSteps
                .filter((step) => step.category === category)
                .map((step) => (
                  <div key={step.id} onClick={() => handleStepClick(step.id)}>
                    <DraggableStep step={step} onAddNode={onAddNode} />
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-start space-x-2">
          <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-blue-900">
              Pro Tip
            </p>
            <p className="text-xs text-blue-700">
              Connect components by dragging from one to another to define the execution order.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PipelineSidebar; 