export const generateCIPrompt = (stack: string, cloud: string) => `
Generate a GitHub Actions YAML file for a ${stack} project.
Requirements:
- Run on push to main branch
- Install dependencies
- Run tests if applicable
- Deploy to ${cloud === "AWS" ? "S3 via AWS CLI" : "Google Cloud Storage"}
- Include proper error handling
- Use appropriate caching for dependencies

Respond only with valid YAML. No explanation or markdown formatting.
`;

export const generatePipelineCIPrompt = (stack: string, cloud: string, pipelineData: any) => {
  const { nodes, edges, name } = pipelineData;
  
  const nodesList = nodes.map((node: any) => 
    `${node.type}: ${JSON.stringify(node.data.config)}`
  ).join(', ');
  
  const edgesList = edges.map((edge: any) => 
    `${edge.source} -> ${edge.target}`
  ).join(', ');

  return `
Generate a GitHub Actions YAML file for a ${stack} project based on this visual pipeline:

Pipeline Name: ${name}
Pipeline Steps: ${nodesList}
Step Dependencies: ${edgesList}

Requirements:
- Follow the exact order defined by the visual pipeline connections
- Use the configuration settings specified for each step
- Deploy to ${cloud === "AWS" ? "AWS S3" : "Google Cloud Storage"}
- Include proper error handling and caching where appropriate
- Make sure steps run in the correct sequence based on the connections

Generate a complete, working GitHub Actions workflow file.
Respond only with valid YAML. No explanation or markdown formatting.
`;
};

export const generateIAMPrompt = (stack: string, scope: string) => `
Create an AWS IAM policy in JSON format for a ${stack} project.

Scope: ${scope}
Requirements:
- Follow principle of least privilege
- Include only necessary permissions for the specified scope
- Use appropriate resource ARN patterns
- Include version "2012-10-17"

Output only a valid IAM JSON policy. No explanation or markdown formatting.
`;

export const detectStackPrompt = (repoUrl: string) => `
Analyze this GitHub repository URL and detect the primary technology stack: ${repoUrl}

Look for common indicators like:
- Package files (package.json, requirements.txt, pom.xml, go.mod, etc.)
- Framework-specific files
- Directory structure patterns
- README content

Respond with only one of these technology stacks:
- React
- Next.js
- Vue.js
- Angular
- Node.js
- Python (Django/Flask)
- Java (Spring)
- Go
- Rust
- .NET
- PHP (Laravel)
- Ruby (Rails)

If unable to detect, respond with "Unknown".
`; 