export const validateGitHubUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'github.com' && urlObj.pathname.split('/').length >= 3;
  } catch {
    return false;
  }
};

export const extractRepoInfo = (url: string): { owner: string; repo: string } | null => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(part => part);
    if (pathParts.length >= 2) {
      return {
        owner: pathParts[0],
        repo: pathParts[1].replace('.git', '')
      };
    }
  } catch {
    return null;
  }
  return null;
};

export const downloadFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

export const techStacks = [
  'React',
  'Next.js', 
  'Vue.js',
  'Angular',
  'Node.js',
  'Python (Django/Flask)',
  'Java (Spring)',
  'Go',
  'Rust',
  '.NET',
  'PHP (Laravel)',
  'Ruby (Rails)'
];

export const cloudProviders = [
  'AWS'
];

export const iamScopes = [
  'read-only',
  'deploy-only',
  'full-access'
]; 