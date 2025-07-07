# 🚀 PipeDream

Generate working CI/CD pipeline configs and IAM policies from a simple UI, exportable by the user.

## ✨ Features

- **Tech Stack Detection**: Automatically detect technology stack from GitHub repository URLs (no LLM required!)
- **Manual Stack Selection**: Choose from popular frameworks and languages
- **GitHub Actions Generation**: Creates ready-to-use CI/CD workflow files
- **AWS IAM Policies**: Generates least-privilege IAM policies
- **Copy & Download**: Easy export of generated configurations
- **Beautiful UI**: Modern, responsive interface built with Next.js and TailwindCSS
- **Works Without AI**: Uses curated templates when OpenAI API is not available

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: TailwindCSS
- **Stack Detection**: File-based analysis (GitHub API)
- **AI (Optional)**: OpenAI GPT-4 API for enhanced generation
- **Deployment**: Ready for Vercel/Railway

## 🚀 Quick Start

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

4. **Optional - Add OpenAI for enhanced generation**:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Add your OpenAI API key to `.env.local`:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

## 📋 How to Use

1. **Enter GitHub Repository URL** (optional): Paste your repo URL for automatic stack detection
2. **Select Technology Stack**: Choose manually or use auto-detection
3. **Choose Cloud Provider**: Currently supports AWS
4. **Select IAM Scope**: Pick from read-only, deploy-only, or full-access
5. **Generate**: Click to create your configurations
6. **Copy/Download**: Export the generated files

## 🎯 How It Works

### Stack Detection (No LLM Required!)
PipeDream analyzes repository files and patterns to detect technology stacks:

- **Package Files**: `package.json`, `requirements.txt`, `pom.xml`, `Cargo.toml`, etc.
- **Config Files**: `next.config.js`, `angular.json`, `vue.config.js`, etc.
- **Framework Files**: `manage.py`, `artisan`, `go.mod`, etc.
- **File Extensions**: `.go`, `.rs`, `.cs`, `.php`, etc.

### Content Generation
- **With OpenAI API**: Custom, context-aware configurations
- **Without OpenAI API**: Curated, production-ready templates

The app works perfectly in both modes!

## 🎯 Supported Tech Stacks

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

## 📁 Project Structure

```
/
├── components/
│   └── CodeBlock.tsx           # Reusable code viewer with copy/download
├── lib/
│   ├── prompts.ts             # OpenAI prompt templates (optional)
│   ├── stack-detector.ts      # File-based stack detection
│   └── utils.ts               # Utility functions
├── pages/
│   ├── api/
│   │   ├── generate.ts        # Main generation API (with fallbacks)
│   │   └── detect-stack.ts    # File-based stack detection API
│   ├── index.tsx              # Input form page
│   ├── result.tsx             # Output preview page
│   └── _app.tsx               # Next.js app wrapper
├── styles/
│   └── globals.css            # Global styles with TailwindCSS
└── ...config files
```

## 🔧 API Endpoints

### POST `/api/detect-stack`
Detect technology stack from GitHub repository (file-based analysis).

**Body**:
```json
{
  "repoUrl": "https://github.com/username/repo"
}
```

**Response**:
```json
{
  "stack": "Next.js"
}
```

### POST `/api/generate`
Generate CI/CD configs and IAM policies.

**Body**:
```json
{
  "stack": "Next.js",
  "cloud": "AWS", 
  "scope": "deploy-only"
}
```

**Response**:
```json
{
  "ci": "# GitHub Actions YAML...",
  "iam": "{ IAM Policy JSON... }",
  "isAiGenerated": true
}
```

## 🚀 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect to Vercel
3. Optionally add `OPENAI_API_KEY` environment variable for AI generation
4. Deploy!

### Railway
1. Connect GitHub repository
2. Optionally add `OPENAI_API_KEY` environment variable for AI generation
3. Deploy!

## 🧪 Testing the MVP

Manual test checklist:
- [x] Works without OpenAI API key
- [x] Paste a GitHub repo URL - detects stack via file analysis
- [x] Can choose stack manually
- [x] Generates working CI pipeline and IAM policy templates
- [x] Copy/Download buttons work
- [x] Handles common stacks (Node, Python, Java, etc.)
- [ ] With OpenAI API: Enhanced AI-generated configurations

## 🛡️ Environment Variables

**Optional** - Create a `.env.local` file with:

```env
# Optional: For AI-enhanced generation
OPENAI_API_KEY=your_openai_api_key_here
```

**Note**: The app works perfectly without the OpenAI API key using curated templates!

## 📝 License

MIT License - feel free to use this project for your own needs!

## 🤝 Contributing

This is an MVP! Contributions welcome:
- Additional cloud providers (GCP, Azure)
- More tech stack support
- Enhanced templates
- UI/UX improvements
- Better error handling

## 📞 Feedback

Built this tool and looking for feedback! Would you use this for your projects?

## 🆚 AI vs Templates

| Feature | With OpenAI API | Without OpenAI API |
|---------|----------------|-------------------|
| Stack Detection | ✅ File-based | ✅ File-based |
| CI/CD Generation | 🤖 AI-customized | 📋 Curated templates |
| IAM Policies | 🤖 AI-customized | 📋 Curated templates |
| Speed | ~3-5 seconds | ⚡ Instant |
| Cost | Requires API key | 🆓 Free |
| Quality | Contextual | Production-ready | 