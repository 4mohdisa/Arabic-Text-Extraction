'use server';

import OpenAI from 'openai';
import 'server-only';
import sharp from 'sharp';
import { ChatCompletion } from 'openai/resources';
import { ExtractedText } from '@/types';

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
Please extract **only** the Arabic text from the following image.
Strictly return the raw Arabic content as it appears, with no translations, no explanations, no formatting notes, and no extra characters.`
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
        const options = await analyzeImage(buffer);
        console.log(`Using preprocessing mode: ${options.mode}`);

        let pipeline = sharp(buffer)
            .rotate() // Auto-orient
            .normalize()
            .modulate({ brightness: options.brightness });

        if (options.gamma) {
            pipeline = pipeline.gamma(options.gamma);
        }

        if (options.contrastFactor) {
            const factor = options.contrastFactor;
            pipeline = pipeline.linear(factor, -(factor - 1) * 128);
        }

        if (options.sharpness) {
            pipeline = pipeline.sharpen({ sigma: options.sharpness });
        }

        if (options.denoise) {
            pipeline = pipeline.median(1);
        }

        pipeline = pipeline
            .grayscale()
            .recomb([
                [1.1, -0.05, -0.05],
                [-0.05, 1.1, -0.05],
                [-0.05, -0.05, 1.1]
            ]);

        if (options.mode === 'document' || options.mode === 'high_contrast') {
            pipeline = pipeline.threshold(options.mode === 'high_contrast' ? 128 : 150);
        }

        const processedImageBuffer = await pipeline
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
        const response = await fetchWithRetry(enhancedImage);
        console.log('Raw API Response:', JSON.stringify(response, null, 2));

        const content = response.choices?.[0]?.message?.content;

        if (!content || !/[ء-ي]/.test(content)) {
            return {
                success: false,
                data: null,
                error: 'Arabic text not detected or empty content'
            };
        }

        const extractedText: ExtractedText = {
            content: content.trim(),
            sourceFile: '',
            extractedAt: new Date().toISOString()
        };

        console.log('Extracted Arabic text:', extractedText.content);
        return { success: true, data: extractedText };
    } catch (error) {
        console.error('Error extracting Arabic text:', error);
        return {
            success: false,
            data: null,
            error: error instanceof Error ? error.message : 'Failed to extract Arabic text from image'
        };
    }
}
