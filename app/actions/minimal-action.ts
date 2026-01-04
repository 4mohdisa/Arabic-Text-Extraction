'use server';

import { ExtractedText } from '@/types';

/**
 * Minimal server action for testing
 */
export async function minimalExtract(): Promise<{
  success: boolean;
  data: ExtractedText | null;
  error: string;
}> {
  try {
    // Create a simple mock result
    const extractedText: ExtractedText = {
      content: 'هذا نص عربي بسيط للاختبار',
      sourceFile: '',
      extractedAt: new Date().toISOString(),
      ocrEngine: 'gpt4o'
    };
    
    return {
      success: true,
      data: extractedText,
      error: ''
    };
  } catch {
    return {
      success: false,
      data: null,
      error: 'Minimal extraction failed'
    };
  }
}
