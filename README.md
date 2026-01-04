# VisionExtract

<div align="center">

![VisionExtract](https://img.shields.io/badge/Vision-Extract-14b8a6?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15.1-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-green?style=for-the-badge&logo=openai)

**AI-Powered Document Text Extraction**

Extract text from any document or image using advanced AI vision models. Support for 50+ languages including Arabic, English, Chinese, and more.

[Get Started](#getting-started) • [Features](#features) • [Documentation](#usage-guide)

</div>

## ✨ Features

### 🤖 AI-Powered OCR
Leverages GPT-4o Vision for unmatched accuracy in text recognition across complex layouts, handwritten content, and mixed-language documents.

### 🌍 Multi-Language Support
Extract text in Arabic, English, Chinese, and 50+ languages with native script preservation and right-to-left text handling.

### 🖼️ Smart Preprocessing
Automatic image enhancement, rotation correction, document boundary detection, and background removal for optimal extraction results.

### ⚡ Lightning Fast
Optimized processing pipeline delivers results in seconds. Intelligent caching and batch processing support.

### 🔒 Privacy First
Your documents are processed securely and never stored on our servers. All processing happens in real-time.

### 📄 Format Flexible
Supports JPG, PNG, WebP, PDF, and more. Handles photos, scans, screenshots, and handwritten notes.

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 15.1 with App Router & Turbopack |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 3.4 + CSS Variables |
| **UI Components** | Shadcn/ui + Radix UI |
| **OCR Primary** | OpenAI GPT-4o Vision API |
| **OCR Fallback** | Tesseract.js 6.0 |
| **Image Processing** | Sharp |
| **Icons** | Lucide React |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/visionextract.git
   cd visionextract
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 📖 Usage Guide

### Basic Text Extraction

1. **Upload** - Drag and drop or click to upload your document
2. **Process** - Click "Extract Text" to begin AI analysis
3. **Review** - View extracted text in the content panel
4. **Export** - Copy to clipboard or download as .txt file

### Supported Formats

| Format | Support | Max Size | Notes |
|--------|---------|----------|-------|
| JPG/JPEG | ✅ | 10MB | Recommended for photos |
| PNG | ✅ | 10MB | Best for screenshots |
| WebP | ✅ | 10MB | Modern format support |
| PDF | ✅ | 10MB | Single page extraction |

## 🎨 Design System

VisionExtract uses a custom **Deep Ocean Teal** color palette:

- **Primary**: Vibrant Teal (`hsl(175, 80%, 45%)`)
- **Accent**: Warm Coral (`hsl(15, 85%, 60%)`)
- **Background**: Deep Slate (`hsl(200, 25%, 3%)`)
- **Success**: Emerald (`hsl(160, 84%, 39%)`)

## 📁 Project Structure

```
visionextract/
├── app/
│   ├── actions/          # Server actions for OCR
│   ├── api/              # API routes
│   ├── page.tsx          # Landing page
│   └── layout.tsx        # Root layout
├── components/
│   ├── ui/               # Shadcn UI components
│   └── image-upload.tsx  # Upload component
├── types/                # TypeScript definitions
├── lib/                  # Utilities
└── hooks/                # React hooks
```

## 🔧 Configuration

### Environment Variables

```env
OPENAI_API_KEY=your_api_key    # Required: OpenAI API key
NODE_ENV=production            # Optional: Environment mode
```

### OCR Engine Selection

1. **Primary**: OpenAI GPT-4o Vision API
   - Superior accuracy for complex layouts
   - Context-aware text extraction
   - Handles handwritten and printed text

2. **Fallback**: Tesseract OCR
   - Reliable for standard printed text
   - Multi-language support
   - Offline processing capability

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm run build
vercel --prod
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">

**Built with ❤️ using Next.js and OpenAI**

</div>
