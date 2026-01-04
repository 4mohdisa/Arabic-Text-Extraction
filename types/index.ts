export interface ExtractedText {
  content: string
  sourceFile: string
  extractedAt: string
  previewUrl?: string
  ocrEngine?: 'gpt4o' | 'tesseract' | 'trocr'
  language?: string
  confidence?: number
}

export interface ExtractionHistoryItem extends ExtractedText {
  id: string
  title: string
}

export interface UploadStatus {
  status: 'idle' | 'uploading' | 'enhancing' | 'processing' | 'success' | 'error'
  message?: string
}

export interface ExtractionResult {
  success: boolean
  data: ExtractedText | null
  error: string
}
