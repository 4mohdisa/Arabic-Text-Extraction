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
    timeout: 30000,
});

async function fetchWithRetry(base64Image: string, attempt: number = 1, maxRetries: number = 3): Promise<ChatCompletion> {
    try {
        const response: ChatCompletion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `You are a specialist in Arabic OCR.

Please extract **only** the Arabic text from the following image, maintaining the original formatting as much as possible.

IMPORTANT INSTRUCTIONS:
1. Preserve the original layout, including paragraph breaks and line spacing
2. Maintain any bullet points, numbering, or list structures
3. Keep the text right-aligned as it appears in the original
4. Preserve any section headings or structural elements
5. Use double line breaks (\n\n) between paragraphs
6. Use single line breaks (\n) for line breaks within paragraphs
7. Do not add any explanations, translations, or comments
8. Do not add any non-Arabic text or characters

Return ONLY the formatted Arabic text content.`
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${base64Image}`,
                                detail: "high"
                            }
                        }
                    ]
                }
            ],
            max_tokens: 4096,
            temperature: 0.0,
        });

        return response;
    } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error);
        if (attempt < maxRetries) {
            const wait = 500 * attempt;
            console.log(`Retrying in ${wait}ms... Attempt ${attempt + 1}/${maxRetries}`);
            await new Promise(resolve => setTimeout(resolve, wait));
            return fetchWithRetry(base64Image, attempt + 1, maxRetries);
        }
        throw error;
    }
}

type PreprocessingOptions = {
    mode: 'standard' | 'high_contrast' | 'document' | 'adaptive';
    brightness?: number;
    contrastFactor?: number;
    sharpness?: number;
    denoise?: boolean;
    gamma?: number;
};

async function analyzeImage(buffer: Buffer): Promise<PreprocessingOptions> {
    try {
        const metadata = await sharp(buffer).stats();
        const avgBrightness = metadata.channels.reduce((sum, c) => sum + c.mean, 0) / metadata.channels.length;
        const avgStdDev = metadata.channels.reduce((sum, c) => sum + c.stdev, 0) / metadata.channels.length;

        if (avgBrightness < 80) {
            return {
                mode: 'high_contrast',
                brightness: 1.4,
                contrastFactor: 1.5,
                sharpness: 1.6,
                denoise: true,
                gamma: 0.9
            };
        } else if (avgBrightness > 200) {
            return {
                mode: 'document',
                brightness: 0.9,
                contrastFactor: 1.6,
                sharpness: 1.4,
                denoise: true,
                gamma: 1.1
            };
        } else if (avgStdDev < 30) {
            return {
                mode: 'high_contrast',
                brightness: 1.15,
                contrastFactor: 1.6,
                sharpness: 1.5,
                denoise: true,
                gamma: 1.0
            };
        } else {
            return {
                mode: 'standard',
                brightness: 1.05,
                contrastFactor: 1.3,
                sharpness: 1.2,
                denoise: true,
                gamma: 1.0
            };
        }
    } catch (error) {
        console.error('Image analysis failed:', error);
        return {
            mode: 'standard',
            brightness: 1.1,
            contrastFactor: 1.3,
            sharpness: 1.2,
            denoise: true,
            gamma: 1.0
        };
    }
}

async function preprocessImage(base64Image: string): Promise<string> {
    try {
        const buffer = Buffer.from(base64Image, 'base64');
        console.log('Analyzing image characteristics...');
        
        // Step 1: Detect and crop document (remove hands/background)
        console.log('Attempting to detect and crop document page...');
        // Use a try-catch block specifically for the document detection to handle any errors
        let croppedBuffer;
        try {
            croppedBuffer = await detectAndCropDocument(buffer);
        } catch (error) {
            console.error('Document detection failed, using original image:', error);
            croppedBuffer = buffer; // Fallback to original image if cropping fails
        }
        
        // Step 2: Analyze the cropped image to determine optimal processing
        const options = await analyzeImage(croppedBuffer);
        console.log(`Using preprocessing mode: ${options.mode}`);

        // Step 3: First pass: auto-rotate and normalize
        let image = sharp(croppedBuffer)
            .rotate() // correct camera rotation
            .normalize()
            .modulate({ brightness: options.brightness });

        if (options.gamma) {
            image = image.gamma(options.gamma);
        }

        if (options.contrastFactor) {
            const factor = options.contrastFactor;
            image = image.linear(factor, -(factor - 1) * 128);
        }

        if (options.sharpness) {
            image = image.sharpen({ sigma: options.sharpness });
        }

        if (options.denoise) {
            image = image.median(1);
        }

        // Step 4: Grayscale
        image = image.grayscale();

        // Step 5: Optional: recomb boost for better text definition
        image = image.recomb([
            [1.1, -0.05, -0.05],
            [-0.05, 1.1, -0.05],
            [-0.05, -0.05, 1.1],
        ]);

        // Step 6: Threshold for strong ink/text definition
        if (options.mode === 'document' || options.mode === 'high_contrast') {
            image = image.threshold(options.mode === 'high_contrast' ? 128 : 150);
        }

        // Extract bounding box (basic cropping of main content)
        const metadata = await image.metadata();
        if (metadata.width && metadata.height) {
            image = image.extract({
                left: 0,
                top: 0,
                width: metadata.width,
                height: metadata.height
            });
        }

        // Resize slightly larger to reduce model clipping
        image = image.resize({
            width: Math.round(metadata.width! * 1.05),
            height: Math.round(metadata.height! * 1.05),
            fit: 'contain',
            background: { r: 255, g: 255, b: 255 }
        });

        // Final JPEG output
        const processedImageBuffer = await image
            .jpeg({ quality: 95 })
            .toBuffer();

        return processedImageBuffer.toString('base64');
    } catch (error) {
        console.error('Image preprocessing failed:', error);
        return base64Image;
    }
}

export async function extractDataFromImage(base64Image: string) {
    try {
        console.log('Preprocessing image to enhance text visibility...');
        const enhancedImage = await preprocessImage(base64Image);
        
        // Step 1: Try with GPT-4o Vision first
        console.log('Attempting extraction with GPT-4o Vision...');
        let gpt4oSuccess = false;
        let content = '';
        let gpt4oError = '';
        
        try {
            const response = await fetchWithRetry(enhancedImage);
            console.log('GPT-4o Vision Response Received');
            content = response.choices?.[0]?.message?.content || '';
        } catch (error) {
            console.error('Error with GPT-4o Vision extraction:', error);
            gpt4oError = error instanceof Error ? error.message : 'GPT-4o Vision extraction failed';
        }

        // More comprehensive Arabic character detection
        // This regex includes more Arabic characters and diacritics
        const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
        
        // Check if GPT-4o returned valid Arabic text
        if (content && arabicRegex.test(content) && content.trim().length >= 5) {
            const extractedText: ExtractedText = {
                content: content.trim(),
                sourceFile: '',
                extractedAt: new Date().toISOString(),
                ocrEngine: 'gpt4o'
            };

            console.log('Successfully extracted Arabic text with GPT-4o Vision');
            return { success: true, data: extractedText };
        }
        
        // Step 2: If GPT-4o fails, try Tesseract OCR as fallback
        console.log('GPT-4o Vision extraction failed or returned insufficient text. Trying Tesseract OCR fallback...');
        
        // Initialize tesseractResult with proper type structure
        let tesseractResult: {
            success: boolean;
            data: ExtractedText | null;
            error: string;
        } = {
            success: false,
            data: null,
            error: ''
        };
        
        try {
            const result = await extractTextWithTesseract(enhancedImage);
            
            // Handle the result with proper type checking
            if (result.success && result.data) {
                console.log('Successfully extracted Arabic text with Tesseract OCR fallback');
                return {
                    success: result.success,
                    data: result.data,
                    error: ''
                };
            }
            
            // Update our tesseractResult with the response data
            tesseractResult = {
                success: result.success,
                data: result.data,
                error: result.error || 'Tesseract OCR extraction failed'
            };
        } catch (error) {
            console.error('Error with Tesseract OCR fallback:', error);
            tesseractResult.error = error instanceof Error ? error.message : 'Tesseract OCR extraction failed';
        }
        
        // Step 3: If both methods fail, return the most informative error
        const errorMessage = !content ? 'Empty content returned from OCR processing' :
                            !arabicRegex.test(content) ? 'No Arabic text detected in the image' :
                            content.trim().length < 5 ? 'Insufficient Arabic text detected in the image' :
                            tesseractResult.error || 'All OCR methods failed to extract Arabic text';
        
        return {
            success: false,
            data: null,
            error: errorMessage
        };
    } catch (error) {
        console.error('Error extracting Arabic text:', error);
        return {
            success: false,
            data: null,
            error: error instanceof Error ? error.message : 'Failed to extract Arabic text from image'
        };
    }
}
