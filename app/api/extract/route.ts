import { NextResponse } from 'next/server'
import { extractDataFromImage } from '@/app/actions/openai.action'

export const maxDuration = 60 // Allow up to 60 seconds for processing

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
    
    // Validate base64 image
    if (typeof base64Image !== 'string' || base64Image.length < 100) {
      return NextResponse.json(
        { success: false, error: 'Invalid image data' },
        { status: 400 }
      )
    }
    
    console.log('API: Starting text extraction, image size:', Math.round(base64Image.length / 1024), 'KB')
    
    // Extract text using the universal extraction function
    const result = await extractDataFromImage(base64Image)
    
    if (result.success && result.data) {
      console.log('API: Extraction successful, text length:', result.data.content.length)
      return NextResponse.json({
        success: true,
        data: result.data,
        error: ''
      })
    } else {
      console.log('API: Extraction failed:', result.error)
      return NextResponse.json({
        success: false,
        data: null,
        error: result.error || 'Failed to extract text from image'
      })
    }
  } catch (error) {
    console.error('API extraction error:', error)
    return NextResponse.json(
      { 
        success: false, 
        data: null,
        error: error instanceof Error ? error.message : 'Text extraction failed' 
      },
      { status: 500 }
    )
  }
}
