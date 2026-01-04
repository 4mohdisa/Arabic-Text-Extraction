'use server';

import { createWorker, PSM } from 'tesseract.js';
import { ExtractedText } from '@/types';

/**
 * Extract text using Tesseract OCR with multi-language support
 * Supports: English, Arabic, Chinese (Simplified & Traditional), Japanese, Korean, 
 * Hindi, Russian, Spanish, French, German, Portuguese, Italian, and more
 */
export async function extractTextWithTesseract(base64Image: string): Promise<{
  success: boolean;
  data: ExtractedText | null;
  error: string;
}> {
  let worker = null;
  
  try {
    console.log('Starting Tesseract OCR extraction...');
    
    // Create worker with multiple language support
    // eng = English, ara = Arabic, chi_sim = Chinese Simplified, 
    // chi_tra = Chinese Traditional, jpn = Japanese, kor = Korean
    // Note: More languages can be added but increases processing time
    worker = await createWorker('eng+ara+chi_sim+jpn+kor+rus+spa+fra+deu+por+ita+hin');
    
    // Configure Tesseract parameters for better accuracy
    await worker.setParameters({
      preserve_interword_spaces: '1',
      tessjs_create_hocr: '0',
      tessjs_create_tsv: '0',
    });
    
    // Set page segmentation mode
    // PSM.AUTO = Fully automatic page segmentation (best for mixed content)
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
    });

    // Convert base64 to image data URL
    const imageData = `data:image/jpeg;base64,${base64Image}`;
    
    // Perform text recognition
    console.log('Running Tesseract recognition...');
    const { data } = await worker.recognize(imageData);
    
    // Terminate worker to free resources
    await worker.terminate();
    worker = null;
    
    // Validate extraction result
    if (!data.text || data.text.trim().length < 3) {
      return {
        success: false,
        data: null,
        error: 'Tesseract could not extract sufficient text from the image'
      };
    }
    
    console.log(`Tesseract extraction successful. Confidence: ${data.confidence}%`);
    
    // Clean up the extracted text
    const cleanedText = data.text
      .trim()
      .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines
      .replace(/[ \t]+/g, ' '); // Normalize spaces
    
    const extractedText: ExtractedText = {
      content: cleanedText,
      sourceFile: '',
      extractedAt: new Date().toISOString(),
      ocrEngine: 'tesseract',
      confidence: Math.round(data.confidence)
    };
    
    return {
      success: true,
      data: extractedText,
      error: ''
    };
  } catch (error) {
    console.error('Tesseract OCR error:', error);
    
    // Ensure worker is terminated on error
    if (worker) {
      try {
        await worker.terminate();
      } catch (e) {
        console.error('Failed to terminate Tesseract worker:', e);
      }
    }
    
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Tesseract OCR extraction failed'
    };
  }
}
