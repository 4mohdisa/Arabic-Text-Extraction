'use server';

import OpenAI from 'openai';
import 'server-only';
import sharp from 'sharp';
import { ChatCompletion } from 'openai/resources';
import { ExtractedText } from '@/types';
import { extractTextWithTesseract } from './tesseract.action';
import { detectAndCropDocument } from './document-detection';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 60000, // Increased timeout for complex documents
});

/**
 * Universal OCR prompt optimized for any language and document type
 */
const UNIVERSAL_OCR_PROMPT = `You are an expert OCR (Optical Character Recognition) system with exceptional accuracy. Your task is to extract ALL text from the provided image with perfect precision.

CRITICAL INSTRUCTIONS:
1. Extract EVERY piece of text visible in the image, regardless of language
2. Preserve the EXACT original formatting:
   - Maintain paragraph breaks and spacing
   - Keep bullet points, numbering, and list structures
   - Preserve headings, subheadings, and hierarchy
   - Maintain table structures using appropriate spacing
   - Keep any special characters, symbols, or punctuation
3. Handle multiple languages seamlessly - detect and extract text in ANY language (English, Arabic, Chinese, Japanese, Korean, Hindi, Russian, etc.)
4. For RTL languages (Arabic, Hebrew, etc.), preserve the correct reading direction
5. For mixed-language documents, extract all languages present
6. Preserve special formatting:
   - Mathematical formulas and equations
   - Code snippets (maintain indentation)
   - Dates, times, and numbers in their original format
   - Currency symbols and units
7. If text is partially obscured or unclear, make your best interpretation and extract what's visible
8. Do NOT:
   - Add explanations or comments
   - Translate any text
   - Summarize or paraphrase
   - Skip any visible text
   - Add text that isn't in the image

OUTPUT FORMAT:
- Return ONLY the extracted text
- Use appropriate line breaks to match the document structure
- Use double line breaks (\\n\\n) between distinct sections or paragraphs
- Use single line breaks (\\n) for line breaks within paragraphs

Extract all text now:`;

/**
 * Fetch with retry logic and exponential backoff
 */
async function fetchWithRetry(
    base64Image: string, 
    attempt: number = 1, 
    maxRetries: number = 3
): Promise<ChatCompletion> {
    try {
        const response: ChatCompletion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are a highly accurate OCR system. Extract text exactly as it appears, preserving all formatting and supporting all languages."
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: UNIVERSAL_OCR_PROMPT
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${base64Image}`,
                                detail: "high" // Use high detail for better accuracy
                            }
                        }
                    ]
                }
            ],
            max_tokens: 4096,
            temperature: 0.0, // Zero temperature for deterministic, accurate output
        });

        return response;
    } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error);
        if (attempt < maxRetries) {
            const wait = 1000 * Math.pow(2, attempt - 1); // Exponential backoff
            console.log(`Retrying in ${wait}ms... Attempt ${attempt + 1}/${maxRetries}`);
            await new Promise(resolve => setTimeout(resolve, wait));
            return fetchWithRetry(base64Image, attempt + 1, maxRetries);
        }
        throw error;
    }
}

type PreprocessingOptions = {
    mode: 'standard' | 'high_contrast' | 'document' | 'photo' | 'screenshot';
    brightness?: number;
    contrastFactor?: number;
    sharpness?: number;
    denoise?: boolean;
    gamma?: number;
    preserveColor?: boolean;
};

/**
 * Analyze image characteristics to determine optimal preprocessing
 */
async function analyzeImage(buffer: Buffer): Promise<PreprocessingOptions> {
    try {
        const stats = await sharp(buffer).stats();
        
        const avgBrightness = stats.channels.reduce((sum, c) => sum + c.mean, 0) / stats.channels.length;
        const avgStdDev = stats.channels.reduce((sum, c) => sum + c.stdev, 0) / stats.channels.length;
        
        // Detect if it's likely a screenshot (high contrast, uniform colors)
        const isLikelyScreenshot = avgStdDev > 60 && avgBrightness > 150;
        
        // Detect if it's a scanned document (high brightness, low variance)
        const isLikelyDocument = avgBrightness > 200 && avgStdDev < 50;
        
        // Detect if it's a photo of a document (medium brightness, higher variance)
        const isLikelyPhoto = avgBrightness > 80 && avgBrightness < 200 && avgStdDev > 40;

        if (isLikelyScreenshot) {
            return {
                mode: 'screenshot',
                brightness: 1.0,
                contrastFactor: 1.1,
                sharpness: 0.8,
                denoise: false,
                gamma: 1.0,
                preserveColor: true // Screenshots often have colored text
            };
        } else if (isLikelyDocument) {
            return {
                mode: 'document',
                brightness: 0.95,
                contrastFactor: 1.4,
                sharpness: 1.2,
                denoise: true,
                gamma: 1.1,
                preserveColor: false
            };
        } else if (isLikelyPhoto) {
            return {
                mode: 'photo',
                brightness: 1.1,
                contrastFactor: 1.3,
                sharpness: 1.4,
                denoise: true,
                gamma: 1.0,
                preserveColor: false
            };
        } else if (avgBrightness < 80) {
            return {
                mode: 'high_contrast',
                brightness: 1.4,
                contrastFactor: 1.5,
                sharpness: 1.5,
                denoise: true,
                gamma: 0.85,
                preserveColor: false
            };
        } else {
            return {
                mode: 'standard',
                brightness: 1.05,
                contrastFactor: 1.2,
                sharpness: 1.1,
                denoise: true,
                gamma: 1.0,
                preserveColor: false
            };
        }
    } catch (error) {
        console.error('Image analysis failed:', error);
        return {
            mode: 'standard',
            brightness: 1.05,
            contrastFactor: 1.2,
            sharpness: 1.1,
            denoise: true,
            gamma: 1.0,
            preserveColor: false
        };
    }
}

/**
 * Preprocess image for optimal OCR results
 */
async function preprocessImage(base64Image: string): Promise<string> {
    try {
        const buffer = Buffer.from(base64Image, 'base64');
        console.log('Analyzing image characteristics...');
        
        // Step 1: Detect and crop document (remove background/hands)
        let croppedBuffer: Buffer;
        try {
            croppedBuffer = await detectAndCropDocument(buffer);
            console.log('Document detection successful');
        } catch {
            console.log('Document detection skipped, using original image');
            croppedBuffer = buffer;
        }
        
        // Step 2: Analyze the image to determine optimal processing
        const options = await analyzeImage(croppedBuffer);
        console.log(`Using preprocessing mode: ${options.mode}`);

        // Step 3: Get metadata for sizing
        const metadata = await sharp(croppedBuffer).metadata();
        const width = metadata.width || 1920;
        const height = metadata.height || 1080;

        // Step 4: Apply preprocessing based on analysis
        let image = sharp(croppedBuffer)
            .rotate(); // Auto-rotate based on EXIF

        // For screenshots, preserve colors; for documents, convert to grayscale
        if (!options.preserveColor) {
            // Normalize and enhance for document/photo
            image = image.normalize();
        }

        // Apply brightness adjustment
        if (options.brightness && options.brightness !== 1.0) {
            image = image.modulate({ brightness: options.brightness });
        }

        // Apply gamma correction
        if (options.gamma && options.gamma !== 1.0) {
            image = image.gamma(options.gamma);
        }

        // Apply contrast enhancement
        if (options.contrastFactor && options.contrastFactor !== 1.0) {
            const factor = options.contrastFactor;
            image = image.linear(factor, -(factor - 1) * 128);
        }

        // Apply sharpening
        if (options.sharpness && options.sharpness > 0) {
            image = image.sharpen({ sigma: options.sharpness });
        }

        // Apply denoising
        if (options.denoise) {
            image = image.median(1);
        }

        // Resize if image is too large (for API limits) while maintaining quality
        const maxDimension = 2048;
        if (width > maxDimension || height > maxDimension) {
            image = image.resize({
                width: maxDimension,
                height: maxDimension,
                fit: 'inside',
                withoutEnlargement: true
            });
        }

        // Output as high-quality JPEG
        const processedImageBuffer = await image
            .jpeg({ quality: 95, mozjpeg: true })
            .toBuffer();

        return processedImageBuffer.toString('base64');
    } catch (error) {
        console.error('Image preprocessing failed:', error);
        return base64Image; // Return original if preprocessing fails
    }
}

/**
 * Detect the primary language(s) in the extracted text
 */
function detectLanguage(text: string): string {
    // Language detection patterns
    const patterns = {
        arabic: /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/,
        chinese: /[\u4E00-\u9FFF\u3400-\u4DBF]/,
        japanese: /[\u3040-\u309F\u30A0-\u30FF]/,
        korean: /[\uAC00-\uD7AF\u1100-\u11FF]/,
        cyrillic: /[\u0400-\u04FF]/,
        hebrew: /[\u0590-\u05FF]/,
        thai: /[\u0E00-\u0E7F]/,
        devanagari: /[\u0900-\u097F]/, // Hindi, Sanskrit, etc.
        latin: /[A-Za-z]/
    };

    const detected: string[] = [];
    
    for (const [lang, pattern] of Object.entries(patterns)) {
        if (pattern.test(text)) {
            detected.push(lang);
        }
    }

    if (detected.length === 0) return 'unknown';
    if (detected.length === 1) return detected[0];
    return detected.join(', '); // Multiple languages detected
}

/**
 * Main extraction function - Universal document text extraction
 */
export async function extractDataFromImage(base64Image: string): Promise<{
    success: boolean;
    data: ExtractedText | null;
    error: string;
}> {
    try {
        console.log('Starting universal text extraction...');
        
        // Step 1: Preprocess image for optimal OCR
        console.log('Preprocessing image...');
        const enhancedImage = await preprocessImage(base64Image);
        
        // Step 2: Try GPT-4o Vision (primary method)
        console.log('Extracting text with GPT-4o Vision...');
        let content = '';
        let gpt4oError = '';
        
        try {
            const response = await fetchWithRetry(enhancedImage);
            content = response.choices?.[0]?.message?.content || '';
            console.log('GPT-4o Vision extraction complete');
        } catch (error) {
            console.error('GPT-4o Vision extraction failed:', error);
            gpt4oError = error instanceof Error ? error.message : 'GPT-4o Vision extraction failed';
        }

        // Step 3: Validate extraction result
        if (content && content.trim().length >= 3) {
            const detectedLanguage = detectLanguage(content);
            console.log(`Detected language(s): ${detectedLanguage}`);
            
            const extractedText: ExtractedText = {
                content: content.trim(),
                sourceFile: '',
                extractedAt: new Date().toISOString(),
                ocrEngine: 'gpt4o',
                language: detectedLanguage
            };

            console.log('Text extraction successful');
            return { success: true, data: extractedText, error: '' };
        }
        
        // Step 4: Fallback to Tesseract OCR if GPT-4o fails
        console.log('GPT-4o returned insufficient text, trying Tesseract fallback...');
        
        try {
            const tesseractResult = await extractTextWithTesseract(enhancedImage);
            
            if (tesseractResult.success && tesseractResult.data && tesseractResult.data.content.trim().length >= 3) {
                const detectedLanguage = detectLanguage(tesseractResult.data.content);
                tesseractResult.data.language = detectedLanguage;
                
                console.log('Tesseract extraction successful');
                return {
                    success: true,
                    data: tesseractResult.data,
                    error: ''
                };
            }
        } catch (error) {
            console.error('Tesseract fallback failed:', error);
        }
        
        // Step 5: Return error if all methods fail
        const errorMessage = !content 
            ? 'No text could be extracted from the image. Please ensure the image contains readable text.'
            : content.trim().length < 3 
            ? 'Insufficient text detected in the image.'
            : gpt4oError || 'Text extraction failed. Please try with a clearer image.';
        
        return {
            success: false,
            data: null,
            error: errorMessage
        };
    } catch (error) {
        console.error('Extraction error:', error);
        return {
            success: false,
            data: null,
            error: error instanceof Error ? error.message : 'Failed to extract text from image'
        };
    }
}
