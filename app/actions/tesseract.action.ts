'use server';

import { createWorker, PSM } from 'tesseract.js';
import { ExtractedText } from '@/types';
import { revalidatePath } from 'next/cache';

export async function extractTextWithTesseract(base64Image: string): Promise<{
  success: boolean;
  data: ExtractedText | null;
  error: string;
}> {
  try {
    console.log('Starting Tesseract OCR as fallback...');
    
    // Create a worker with Arabic language support
    const worker = await createWorker('ara');
    
    // Set additional parameters for better Arabic recognition
    await worker.setParameters({
      preserve_interword_spaces: '1',
      tessjs_create_hocr: '0',
      tessjs_create_tsv: '0',
    });
    
    // Set page segmentation mode (6 = Assume a single uniform block of text)
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
    });

    // Convert base64 to image data for Tesseract
    const imageData = `data:image/jpeg;base64,${base64Image}`;
    
    // Recognize text
    const { data } = await worker.recognize(imageData);
    
    // Terminate worker
    await worker.terminate();
    
    // Check if we got meaningful text
    if (!data.text || data.text.trim().length < 5) {
      return {
        success: false,
        data: null,
        error: 'Tesseract OCR could not extract sufficient Arabic text'
      };
    }
    
    console.log('Tesseract OCR extraction successful');
    
    // Return the extracted text
    const extractedText: ExtractedText = {
      content: data.text.trim(),
      sourceFile: '',
      extractedAt: new Date().toISOString(),
      ocrEngine: 'tesseract' // Mark this as coming from Tesseract
    };
    
    return {
      success: true,
      data: extractedText,
      error: '' // Empty string for successful extraction
    };
  } catch (error) {
    console.error('Tesseract OCR error:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to extract text with Tesseract OCR'
    };
  }
}
