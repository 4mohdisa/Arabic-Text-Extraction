# Arabic-TextExtraction (OpenAI API)

## 🔍 Objective

Extract Arabic text content from **uploaded images and files** using the **OpenAI Vision API**. Output must be clean, accurate Arabic text for further use in translation, analysis, or indexing.

## ✅ Features to Implement

### 1. File Upload Interface
- Build a simple drag-and-drop or button-based upload UI
- Accept only image formats (`.jpg`, `.png`, `.jpeg`, `.webp`) and PDFs
- Limit file size to 10MB per upload
- Validate Arabic content visually (preview for user)

### 2. OpenAI Vision Integration
- Use `gpt-4o` or `gpt-4-vision-preview` for image inputs
- Pass image content as base64 or `formData` to OpenAI API
- Add prompt: `"Extract only the Arabic text from this image. Do not translate or explain. Return in clean Arabic script."`

### 3. Text Output Display
- Show the extracted Arabic text in a scrollable `textarea` or styled box
- Allow copy-to-clipboard and optional "Download as .txt"

### 4. Multi-File Support (Optional)
- Allow batch extraction (multiple images at once)
- Display text results side-by-side or in expandable sections

### 5. Basic Error Handling
- Show error messages for:
  - Unsupported file types
  - No Arabic text detected
  - API errors (rate limits, failures)

## 🛡 Notes

- Keep all OpenAI API keys secured (use environment variables)
- Do not cache sensitive file content unless encrypted
- Focus is **Arabic text only** – no multilingual OCR needed