export interface ExtractedText {
  content: string
  sourceFile: string
  extractedAt: string
  previewUrl?: string
  ocrEngine?: 'gpt4o' | 'tesseract' | 'trocr'
}
