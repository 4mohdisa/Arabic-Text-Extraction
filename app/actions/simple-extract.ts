'use server';

import { ExtractedText } from '@/types';

/**
 * Simple extraction function to test server actions
 */
export async function simpleExtract(base64Image: string): Promise<{
  success: boolean;
  data: ExtractedText | null;
  error: string;
}> {
  try {
    console.log('Simple extraction called with image length:', base64Image.length);
    
    // Create a simple mock result
    const extractedText: ExtractedText = {
      content: 'هذا نص عربي بسيط للاختبار',
      sourceFile: '',
      extractedAt: new Date().toISOString(),
      ocrEngine: 'gpt4o' // Using a valid ocrEngine type
    };
    
    return {
      success: true,
      data: extractedText,
      error: ''
    };
  } catch (error) {
    console.error('Simple extraction error:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Simple extraction failed'
    };
  }
}
