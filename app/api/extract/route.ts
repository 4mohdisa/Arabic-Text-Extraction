import { NextResponse } from 'next/server'
import type { ExtractedText } from '@/types'

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json()
    const { base64Image } = body
    
    if (!base64Image) {
      return NextResponse.json(
        { success: false, error: 'No image provided' },
        { status: 400 }
      )
    }
    
    console.log('API route received image of length:', base64Image.length)
    
    // Create a mock result for testing
    const extractedText: ExtractedText = {
      content: 'هذا نص عربي بسيط للاختبار - تم استخراجه بنجاح من API',
      sourceFile: '',
      extractedAt: new Date().toISOString(),
      ocrEngine: 'gpt4o' // Using a valid OCR engine type
    }
    
    return NextResponse.json({
      success: true,
      data: extractedText,
      error: ''
    })
  } catch (error) {
    console.error('API extraction error:', error)
    return NextResponse.json(
      { 
        success: false, 
        data: null,
        error: error instanceof Error ? error.message : 'API extraction failed' 
      },
      { status: 500 }
    )
  }
}
