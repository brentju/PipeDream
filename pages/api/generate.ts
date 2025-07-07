import { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import { generateCIPrompt, generateIAMPrompt, generatePipelineCIPrompt } from "../../lib/prompts";

// Fallback templates when OpenAI is not available
const fallbackTemplates = {
  ci: {
    'Next.js': `name: Deploy Next.js App

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1
    
    - name: Deploy to S3
      run: |
        aws s3 sync ./out s3://your-bucket-name --delete
        aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"`,
    
    'React': `name: Deploy React App

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test -- --coverage --passWithNoTests
    
    - name: Build application
      run: npm run build
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1
    
    - name: Deploy to S3
      run: |
        aws s3 sync ./build s3://your-bucket-name --delete
        aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"`
  },
  
  iam: {
    'deploy-only': `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation"
      ],
      "Resource": "*"
    }
  ]
}`,
    
    'read-only': `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    }
  ]
}`,
    
    'full-access': `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:*"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:*"
      ],
      "Resource": "*"
    }
  ]
}`
  }
};

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
}) : null;

interface GenerateRequest {
  stack: string;
  cloud: string;
  scope: string;
  pipeline?: string; // JSON string of pipeline data
}

interface GenerateResponse {
  ci: string;
  iam: string;
  error?: string;
  isAiGenerated?: boolean;
}

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<GenerateResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      ci: '', 
      iam: '', 
      error: 'Method not allowed' 
    });
  }

  try {
    const { stack, cloud, scope, pipeline }: GenerateRequest = req.body;

    if (!stack || !cloud || !scope) {
      return res.status(400).json({ 
        ci: '', 
        iam: '', 
        error: 'Missing required parameters: stack, cloud, scope' 
      });
    }

    let ciContent = '';
    let iamContent = '';
    let isAiGenerated = false;

    // Parse pipeline data if provided
    let pipelineData = null;
    if (pipeline) {
      try {
        pipelineData = JSON.parse(pipeline);
      } catch (error) {
        console.error('Error parsing pipeline data:', error);
      }
    }

    if (openai) {
      // Use OpenAI for generation
      try {
        let ciPrompt;
        if (pipelineData) {
          // Generate CI/CD based on visual pipeline
          ciPrompt = generatePipelineCIPrompt(stack, cloud, pipelineData);
        } else {
          // Use traditional generation
          ciPrompt = generateCIPrompt(stack, cloud);
        }
        
        const iamPrompt = generateIAMPrompt(stack, scope);

        const [ciResponse, iamResponse] = await Promise.all([
          openai.chat.completions.create({ 
            messages: [{ role: "user", content: ciPrompt }], 
            model: "gpt-4",
            temperature: 0.1,
            max_tokens: 3000
          }),
          openai.chat.completions.create({ 
            messages: [{ role: "user", content: iamPrompt }], 
            model: "gpt-4",
            temperature: 0.1,
            max_tokens: 1500
          }),
        ]);

        ciContent = ciResponse.choices[0]?.message?.content || '';
        iamContent = iamResponse.choices[0]?.message?.content || '';
        isAiGenerated = true;
      } catch (error) {
        console.error('OpenAI error, falling back to templates:', error);
        // Fall back to templates if OpenAI fails
        if (pipelineData) {
          ciContent = generatePipelineFallback(pipelineData, stack);
        } else {
          ciContent = getFallbackCI(stack);
        }
        iamContent = getFallbackIAM(scope);
      }
    } else {
      // Use fallback templates
      if (pipelineData) {
        ciContent = generatePipelineFallback(pipelineData, stack);
      } else {
        ciContent = getFallbackCI(stack);
      }
      iamContent = getFallbackIAM(scope);
    }

    res.status(200).json({
      ci: ciContent,
      iam: iamContent,
      isAiGenerated
    });
  } catch (error) {
    console.error('Error generating configs:', error);
    res.status(500).json({ 
      ci: '', 
      iam: '', 
      error: 'Internal server error' 
    });
  }
}

function getFallbackCI(stack: string): string {
  const template = fallbackTemplates.ci[stack as keyof typeof fallbackTemplates.ci];
  return template || fallbackTemplates.ci['React']; // Default to React template
}

function getFallbackIAM(scope: string): string {
  const template = fallbackTemplates.iam[scope as keyof typeof fallbackTemplates.iam];
  return template || fallbackTemplates.iam['deploy-only']; // Default to deploy-only
} 

function generatePipelineFallback(pipelineData: any, stack: string): string {
  const { nodes, edges, name } = pipelineData;
  
  // Sort nodes based on connections
  const sortedNodes = topologicalSort(nodes, edges);
  
  let workflow = `name: ${name || 'Deploy Application'}

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  pipeline:
    runs-on: ubuntu-latest
    
    steps:`;

  sortedNodes.forEach((node: any) => {
    const step = generateStepFromNode(node, stack);
    workflow += `\n    ${step}`;
  });

  return workflow;
}

function topologicalSort(nodes: any[], edges: any[]): any[] {
  // Simple topological sort - for a more complex implementation, 
  // you might want to use a proper algorithm
  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  const inDegree = new Map(nodes.map(node => [node.id, 0]));
  
  // Calculate in-degrees
  edges.forEach(edge => {
    const targetDegree = inDegree.get(edge.target) || 0;
    inDegree.set(edge.target, targetDegree + 1);
  });
  
  // Find nodes with no incoming edges
  const queue = nodes.filter(node => inDegree.get(node.id) === 0);
  const result: any[] = [];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);
    
    // Find outgoing edges
    const outgoingEdges = edges.filter(edge => edge.source === current.id);
    outgoingEdges.forEach(edge => {
      const targetNode = nodeMap.get(edge.target);
      if (targetNode) {
        const newDegree = (inDegree.get(edge.target) || 0) - 1;
        inDegree.set(edge.target, newDegree);
        if (newDegree === 0) {
          queue.push(targetNode);
        }
      }
    });
  }
  
  // If result doesn't include all nodes, add remaining ones
  const remainingNodes = nodes.filter(node => !result.includes(node));
  return [...result, ...remainingNodes];
}

function generateStepFromNode(node: any, stack: string): string {
  const { type, data } = node;
  const config = data.config || {};
  
  switch (type) {
    case 'checkout':
      return `- name: Checkout code
      uses: actions/checkout@v3`;
      
    case 'setup':
      const runtime = config.runtime || (stack.includes('Node') ? 'node' : 'python');
      const version = config.version || '18';
      if (runtime === 'node') {
        return `- name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '${version}'
        cache: 'npm'`;
      } else {
        return `- name: Setup Python
      uses: actions/setup-python@v3
      with:
        python-version: '${version}'`;
      }
      
    case 'install':
      const installCmd = config.command || (stack.includes('Node') ? 'npm ci' : 'pip install -r requirements.txt');
      return `- name: Install dependencies
      run: ${installCmd}`;
      
    case 'test':
      const testCmd = config.command || (stack.includes('Node') ? 'npm test' : 'pytest');
      return `- name: Run tests
      run: ${testCmd}`;
      
    case 'build':
      const buildCmd = config.command || (stack.includes('Node') ? 'npm run build' : 'python setup.py build');
      return `- name: Build application
      run: ${buildCmd}`;
      
    case 'deploy':
      return `- name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${config.region || 'us-east-1'}
        
    - name: Deploy to ${config.target || 'AWS S3'}
      run: |
        aws s3 sync ./build s3://your-bucket-name --delete
        aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"`;
        
    case 'notify':
      return `- name: Send notification
      if: always()
      run: echo "Pipeline completed with status: \${{ job.status }}"`;
      
    default:
      return `- name: ${data.label || 'Custom step'}
      run: echo "Executing ${type} step"`;
  }
} 