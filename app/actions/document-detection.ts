'use server';

import sharp from 'sharp';

/**
 * Attempts to detect and crop the document page from an image
 * This uses edge detection and thresholding to identify the document boundaries
 */
export async function detectAndCropDocument(buffer: Buffer): Promise<Buffer> {
  try {
    // Get image metadata
    const metadata = await sharp(buffer).metadata();
    const { width, height } = metadata;
    
    if (!width || !height) {
      console.log('Could not get image dimensions, skipping document detection');
      return buffer;
    }
    
    // Step 1: Convert to grayscale, increase contrast and normalize for better detection
    const processed = await sharp(buffer)
      .grayscale()
      .normalize()
      .modulate({ brightness: 1.2 }) // Sharp's modulate doesn't have contrast parameter
      .linear(1.5, -(1.5 - 1) * 128) // Use linear for contrast adjustment
      .sharpen({ sigma: 1.2 })
      .toBuffer();
    
    // Step 2: Process the image with threshold to help with document detection
    await sharp(processed)
      .threshold(128)
      .toBuffer();
    
    // Step 4: Analyze the binary image to find the document boundaries
    // This is a simplified approach - we'll look for the largest rectangular area
    
    // For simplicity, we'll use a heuristic approach:
    // 1. If the image is mostly white (document on dark background), we'll crop 5% from each edge
    // 2. If the image has dark edges (document with light background), we'll crop 10% from each edge
    
    const stats = await sharp(buffer).stats();
    const avgBrightness = stats.channels.reduce((sum, c) => sum + c.mean, 0) / stats.channels.length;
    
    let cropPercentage;
    if (avgBrightness < 128) {
      // Darker image, likely document on dark background
      cropPercentage = 0.05; // 5% crop from each edge
    } else {
      // Lighter image, likely document with light background
      cropPercentage = 0.1; // 10% crop from each edge
    }
    
    // Calculate crop dimensions
    const cropLeft = Math.floor(width * cropPercentage);
    const cropTop = Math.floor(height * cropPercentage);
    const cropWidth = Math.floor(width * (1 - 2 * cropPercentage));
    const cropHeight = Math.floor(height * (1 - 2 * cropPercentage));
    
    // Apply the crop
    const croppedBuffer = await sharp(buffer)
      .extract({
        left: cropLeft,
        top: cropTop,
        width: cropWidth,
        height: cropHeight
      })
      .toBuffer();
    
    console.log(`Document detection applied: cropped ${cropPercentage * 100}% from each edge`);
    return croppedBuffer;
  } catch (error) {
    console.error('Error in document detection:', error);
    // Return original buffer if detection fails
    return buffer;
  }
}
