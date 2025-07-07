interface StackSignature {
  name: string;
  files: string[];
  packageFiles?: {
    [key: string]: string[];
  };
  directories?: string[];
  extensions?: string[];
  priority: number; // Higher priority wins in case of conflicts
}

const stackSignatures: StackSignature[] = [
  {
    name: 'Next.js',
    files: ['next.config.js', 'next.config.ts', 'next.config.mjs'],
    packageFiles: {
      'package.json': ['next']
    },
    priority: 10
  },
  {
    name: 'React',
    packageFiles: {
      'package.json': ['react', 'react-dom']
    },
    files: ['src/App.jsx', 'src/App.tsx', 'public/index.html'],
    priority: 8
  },
  {
    name: 'Vue.js',
    files: ['vue.config.js', 'nuxt.config.js', 'nuxt.config.ts'],
    packageFiles: {
      'package.json': ['vue', '@vue/cli']
    },
    priority: 9
  },
  {
    name: 'Angular',
    files: ['angular.json', 'ng.json'],
    packageFiles: {
      'package.json': ['@angular/core', '@angular/cli']
    },
    priority: 9
  },
  {
    name: 'Node.js',
    files: ['server.js', 'app.js', 'index.js'],
    packageFiles: {
      'package.json': ['express', 'fastify', 'koa', 'hapi']
    },
    priority: 6
  },
  {
    name: 'Python (Django/Flask)',
    files: ['manage.py', 'wsgi.py', 'asgi.py', 'app.py', 'main.py'],
    packageFiles: {
      'requirements.txt': ['django', 'flask', 'fastapi'],
      'pyproject.toml': ['django', 'flask', 'fastapi'],
      'Pipfile': ['django', 'flask', 'fastapi']
    },
    priority: 8
  },
  {
    name: 'Java (Spring)',
    files: ['pom.xml', 'build.gradle', 'build.gradle.kts'],
    packageFiles: {
      'pom.xml': ['spring-boot', 'spring-framework'],
      'build.gradle': ['spring-boot', 'springframework']
    },
    priority: 8
  },
  {
    name: 'Go',
    files: ['go.mod', 'go.sum', 'main.go'],
    extensions: ['.go'],
    priority: 9
  },
  {
    name: 'Rust',
    files: ['Cargo.toml', 'Cargo.lock'],
    extensions: ['.rs'],
    priority: 9
  },
  {
    name: '.NET',
    files: ['*.csproj', '*.fsproj', '*.vbproj', 'Program.cs', 'Startup.cs'],
    extensions: ['.cs', '.fs', '.vb'],
    priority: 8
  },
  {
    name: 'PHP (Laravel)',
    files: ['artisan', 'composer.json', 'index.php'],
    packageFiles: {
      'composer.json': ['laravel/framework', 'symfony/symfony']
    },
    extensions: ['.php'],
    priority: 7
  },
  {
    name: 'Ruby (Rails)',
    files: ['Gemfile', 'Rakefile', 'config.ru', 'app/controllers/application_controller.rb'],
    packageFiles: {
      'Gemfile': ['rails', 'sinatra']
    },
    extensions: ['.rb'],
    priority: 8
  }
];

export async function detectStackFromGitHub(repoUrl: string): Promise<string> {
  try {
    const { owner, repo } = extractRepoInfo(repoUrl);
    if (!owner || !repo) {
      return 'Unknown';
    }

    // Get repository contents from GitHub API
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const contents = await response.json();
    const files = contents.map((item: any) => item.name);
    
    // Score each stack based on detected files
    const stackScores = new Map<string, number>();
    
    for (const signature of stackSignatures) {
      let score = 0;
      
      // Check for specific files
      if (signature.files) {
        for (const file of signature.files) {
          if (files.some(f => matchesPattern(f, file))) {
            score += signature.priority;
          }
        }
      }
      
      // Check for file extensions
      if (signature.extensions) {
        for (const ext of signature.extensions) {
          if (files.some(f => f.endsWith(ext))) {
            score += signature.priority * 0.5;
          }
        }
      }
      
      // Check package files content
      if (signature.packageFiles) {
        for (const [packageFile, dependencies] of Object.entries(signature.packageFiles)) {
          if (files.includes(packageFile)) {
            try {
              const fileContent = await fetchFileContent(owner, repo, packageFile);
              if (fileContent && dependencies.some(dep => fileContent.includes(dep))) {
                score += signature.priority * 1.5;
              }
            } catch (error) {
              // If we can't fetch file content, just give partial credit for file existence
              score += signature.priority * 0.3;
            }
          }
        }
      }
      
      if (score > 0) {
        stackScores.set(signature.name, score);
      }
    }
    
    // Return the stack with the highest score
    if (stackScores.size > 0) {
      const topStack = Array.from(stackScores.entries())
        .sort(([,a], [,b]) => b - a)[0];
      return topStack[0];
    }
    
    return 'Unknown';
  } catch (error) {
    console.error('Error detecting stack:', error);
    return 'Unknown';
  }
}

async function fetchFileContent(owner: string, repo: string, filePath: string): Promise<string | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.content && data.encoding === 'base64') {
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }
    return null;
  } catch (error) {
    return null;
  }
}

function matchesPattern(filename: string, pattern: string): boolean {
  // Handle glob patterns like *.csproj
  if (pattern.includes('*')) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(filename);
  }
  return filename === pattern;
}

function extractRepoInfo(url: string): { owner: string; repo: string } {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(part => part);
    if (pathParts.length >= 2) {
      return {
        owner: pathParts[0],
        repo: pathParts[1].replace('.git', '')
      };
    }
  } catch (error) {
    console.error('Error parsing repo URL:', error);
  }
  return { owner: '', repo: '' };
}

export function detectStackFromFiles(files: string[]): string {
  const stackScores = new Map<string, number>();
  
  for (const signature of stackSignatures) {
    let score = 0;
    
    // Check for specific files
    if (signature.files) {
      for (const file of signature.files) {
        if (files.some(f => matchesPattern(f, file))) {
          score += signature.priority;
        }
      }
    }
    
    // Check for file extensions
    if (signature.extensions) {
      for (const ext of signature.extensions) {
        if (files.some(f => f.endsWith(ext))) {
          score += signature.priority * 0.5;
        }
      }
    }
    
    if (score > 0) {
      stackScores.set(signature.name, score);
    }
  }
  
  // Return the stack with the highest score
  if (stackScores.size > 0) {
    const topStack = Array.from(stackScores.entries())
      .sort(([,a], [,b]) => b - a)[0];
    return topStack[0];
  }
  
  return 'Unknown';
} 