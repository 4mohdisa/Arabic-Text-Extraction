# Arabic Text Extraction

<div align="center">

![Arabic Text Extraction](https://img.shields.io/badge/Arabic-Text%20Extraction-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15.1.0-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-green?style=for-the-badge&logo=openai)

A powerful, modern web application for extracting Arabic text from images and documents using advanced OCR technology and AI vision models.

</div>

## 🌟 Overview

Arabic Text Extraction is a sophisticated Next.js application that leverages multiple OCR engines and AI vision models to accurately extract Arabic text from uploaded images and documents. The application features advanced image preprocessing, multiple extraction methods, and a modern, responsive user interface optimized for Arabic text handling.

## ✨ Key Features

### 🔍 **Multiple OCR Engines**
- **GPT-4o Vision API**: Primary extraction using OpenAI's advanced vision model with specialized Arabic prompts
- **Tesseract OCR**: Fallback OCR engine with Arabic language support and optimized parameters
- **Hybrid Approach**: Automatic fallback between engines for maximum extraction success

### 🖼️ **Advanced Image Processing**
- **Document Detection**: Automatic detection and cropping of document pages from complex backgrounds
- **Image Enhancement**: Intelligent preprocessing including:
  - Brightness and contrast adjustment
  - Noise reduction and sharpening
  - Automatic rotation correction
  - Adaptive thresholding
  - Background removal

### 🎨 **Modern User Interface**
- **Drag & Drop Upload**: Intuitive file upload with visual feedback
- **Real-time Preview**: Live image preview with processing status
- **Tabbed Interface**: Seamless switching between extracted text and image preview
- **Responsive Design**: Optimized for desktop and mobile devices
- **Arabic Typography**: Specialized Arabic fonts (Noto Sans Arabic, Amiri)

### 📚 **Content Management**
- **Extraction History**: Local storage of recent extractions (up to 10 items)
- **Text Operations**: Copy to clipboard, download as text file, clear content
- **Source Tracking**: Maintains original filename and extraction metadata
- **Processing Indicators**: Real-time status updates during extraction

### ⚡ **Performance & Reliability**
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Retry Logic**: Automatic retry mechanism for API failures
- **Fallback Systems**: Multiple extraction methods ensure high success rates
- **Optimized Processing**: Intelligent image analysis for optimal preprocessing

## 🛠️ Technology Stack

### **Frontend**
- **Next.js 15.1.0** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Modern styling framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icons

### **Backend & Processing**
- **OpenAI API** - GPT-4o Vision for AI-powered text extraction
- **Tesseract.js** - OCR engine for Arabic text recognition
- **Sharp** - High-performance image processing
- **Server Actions** - Modern server-side processing

### **UI Components**
- **Shadcn/ui** - Modern, accessible component library
- **React Hook Form** - Form handling
- **Toast Notifications** - User feedback system

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/arabic-text-extraction.git
   cd arabic-text-extraction
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 📖 Usage Guide

### **Basic Text Extraction**

1. **Upload an Image**
   - Drag and drop an image file onto the upload area
   - Or click the upload area to select a file
   - Supported formats: JPG, PNG, JPEG, WebP, PDF

2. **Preview and Process**
   - Image preview appears in the right panel
   - Click "Extract Text" to begin processing
   - Monitor real-time status updates

3. **View Results**
   - Extracted Arabic text appears in the text panel
   - Use copy, download, or clear buttons as needed
   - View extraction metadata (OCR engine used, timestamp)

### **Advanced Features**

- **History Navigation**: Access previous extractions from the history panel
- **Multiple Implementations**: Test different extraction methods via `/fixed` page
- **Batch Processing**: Process multiple images sequentially

## 🏗️ Project Structure

```
Arabic-TextExtraction/
├── app/
│   ├── actions/                    # Server actions
│   │   ├── openai.action.ts       # OpenAI GPT-4o integration
│   │   ├── tesseract.action.ts    # Tesseract OCR implementation
│   │   ├── document-detection.ts  # Document cropping logic
│   │   ├── simple-extract.ts      # Simple extraction for testing
│   │   ├── fixed-extract.ts       # Alternative implementation
│   │   └── minimal-action.ts      # Minimal test action
│   ├── api/
│   │   └── extract/
│   │       └── route.ts           # API endpoint for extraction
│   ├── fixed/                     # Alternative implementation page
│   ├── globals.css                # Global styles
│   ├── layout.tsx                 # Root layout with Arabic fonts
│   └── page.tsx                   # Main application page
├── components/
│   ├── ui/                        # Reusable UI components
│   ├── image-upload.tsx           # File upload component
│   └── test-action.tsx            # Testing component
├── types/
│   └── index.ts                   # TypeScript type definitions
├── lib/
│   └── utils.ts                   # Utility functions
└── hooks/
    └── use-toast.ts               # Toast notification hook
```

## 🔧 Configuration

### **Image Processing Parameters**

The application uses adaptive image processing based on image characteristics:

- **High Contrast Mode**: For dark or low-contrast images
- **Document Mode**: For scanned documents and bright images
- **Standard Mode**: Default processing for typical photographs
- **Adaptive Mode**: Dynamic adjustment based on image analysis

### **OCR Engine Selection**

1. **Primary**: OpenAI GPT-4o Vision API
   - Superior accuracy for complex layouts
   - Context-aware text extraction
   - Handles handwritten and printed text

2. **Fallback**: Tesseract OCR
   - Reliable for standard printed text
   - Optimized for Arabic language
   - Offline processing capability

## 📊 Supported File Types

| Format | Support | Max Size | Notes |
|--------|---------|----------|-------|
| JPG/JPEG | ✅ | 10MB | Recommended for photos |
| PNG | ✅ | 10MB | Best for screenshots |
| WebP | ✅ | 10MB | Modern format support |
| PDF | ✅ | 10MB | Single page extraction |

## 🎯 Features in Detail

### **Document Detection**
- Automatic page boundary detection
- Background removal for handheld photos
- Perspective correction for angled shots
- Smart cropping to focus on text content

### **Arabic Text Optimization**
- Specialized Arabic language models
- Right-to-left text handling
- Diacritical mark preservation
- Multiple Arabic script styles support

### **User Experience**
- Progressive loading indicators
- Contextual error messages
- Keyboard shortcuts for common actions
- Accessibility features compliance

## 🔍 API Reference

### **Extraction Endpoint**

```typescript
POST /api/extract
Content-Type: application/json

{
  "base64Image": "data:image/jpeg;base64,..."
}
```

**Response:**
```typescript
{
  "success": boolean,
  "data": {
    "content": string,
    "sourceFile": string,
    "extractedAt": string,
    "ocrEngine": "gpt4o" | "tesseract",
    "previewUrl"?: string
  },
  "error": string
}
```

## 🚀 Deployment

### **Vercel (Recommended)**
```bash
npm run build
vercel --prod
```

### **Docker**
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

### **Environment Variables**
```env
OPENAI_API_KEY=your_api_key
NODE_ENV=production
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Development Guidelines**
- Follow TypeScript best practices
- Maintain component modularity
- Add appropriate error handling
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for the powerful GPT-4o Vision API
- **Tesseract.js** for open-source OCR capabilities
- **Vercel** for seamless deployment platform
- **Radix UI** for accessible component primitives
- **Tailwind CSS** for modern styling framework

## 📞 Support

For support, questions, or suggestions:
- Open an issue on GitHub
- Check the documentation
- Review existing discussions

---

<div align="center">

**Made with ❤️ for the Arabic text processing community**

</div> 