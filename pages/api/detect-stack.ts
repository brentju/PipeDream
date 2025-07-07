import { NextApiRequest, NextApiResponse } from "next";
import { detectStackFromGitHub } from "../../lib/stack-detector";
import { validateGitHubUrl } from "../../lib/utils";

interface DetectStackRequest {
  repoUrl: string;
}

interface DetectStackResponse {
  stack: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<DetectStackResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      stack: '', 
      error: 'Method not allowed' 
    });
  }

  try {
    const { repoUrl }: DetectStackRequest = req.body;

    if (!repoUrl || !validateGitHubUrl(repoUrl)) {
      return res.status(400).json({ 
        stack: '', 
        error: 'Invalid GitHub repository URL' 
      });
    }

    const detectedStack = await detectStackFromGitHub(repoUrl);

    res.status(200).json({
      stack: detectedStack,
    });
  } catch (error) {
    console.error('Error detecting stack:', error);
    res.status(500).json({ 
      stack: '', 
      error: 'Internal server error' 
    });
  }
} 