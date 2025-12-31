import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js to always download models
env.allowLocalModels = false;
env.useBrowserCache = true;

const MAX_IMAGE_DIMENSION = 1024;

function resizeImageIfNeeded(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, image: HTMLImageElement) {
  let width = image.naturalWidth;
  let height = image.naturalHeight;

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
      width = MAX_IMAGE_DIMENSION;
    } else {
      width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
      height = MAX_IMAGE_DIMENSION;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);
    return true;
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0);
  return false;
}

export const removeBackground = async (imageElement: HTMLImageElement): Promise<Blob> => {
  try {
    console.log('Starting background removal process...');
    const segmenter = await pipeline('image-segmentation', 'Xenova/segformer-b0-finetuned-ade-512-512', {
      device: 'webgpu',
    });
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Could not get canvas context');
    
    resizeImageIfNeeded(canvas, ctx, imageElement);
    console.log(`Processing image: ${canvas.width}x${canvas.height}`);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    console.log('Image converted to base64');
    
    console.log('Processing with segmentation model...');
    const result = await segmenter(imageData);
    
    console.log('Segmentation result:', result);
    
    if (!result || !Array.isArray(result) || result.length === 0 || !result[0].mask) {
      throw new Error('Invalid segmentation result');
    }
    
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = canvas.width;
    outputCanvas.height = canvas.height;
    const outputCtx = outputCanvas.getContext('2d');
    
    if (!outputCtx) throw new Error('Could not get output canvas context');
    
    outputCtx.drawImage(canvas, 0, 0);
    
    const outputImageData = outputCtx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
    const data = outputImageData.data;
    
    for (let i = 0; i < result[0].mask.data.length; i++) {
      const alpha = Math.round((1 - result[0].mask.data[i]) * 255);
      data[i * 4 + 3] = alpha;
    }
    
    outputCtx.putImageData(outputImageData, 0, 0);
    console.log('Mask applied successfully');
    
    return new Promise((resolve, reject) => {
      outputCanvas.toBlob(
        (blob) => {
          if (blob) {
            console.log('Successfully created final blob');
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/png',
        1.0
      );
    });
  } catch (error) {
    console.error('Error removing background:', error);
    throw error;
  }
};

export const applyBackgroundColor = async (
  transparentImageBlob: Blob, 
  backgroundColor: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Parse background color to RGB
      const bgColor = hexToRgb(backgroundColor);
      
      // Fill with solid background color
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw the transparent image on top
      ctx.drawImage(img, 0, 0);
      
      // Get image data for edge processing
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const width = canvas.width;
      const height = canvas.height;
      
      // Create a copy to read original alpha values
      const originalData = new Uint8ClampedArray(data);
      
      // Multi-pass edge smoothing for realistic blending
      // Pass 1: Identify edge pixels and apply smooth blending
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const i = (y * width + x) * 4;
          const originalAlpha = originalData[i + 3] / 255;
          
          // Skip fully opaque or fully transparent pixels
          if (originalAlpha >= 0.98 || originalAlpha <= 0.02) continue;
          
          // Calculate average alpha of neighboring pixels for smoother edges
          let neighborAlphaSum = 0;
          let neighborCount = 0;
          
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const ni = ((y + dy) * width + (x + dx)) * 4;
              neighborAlphaSum += originalData[ni + 3] / 255;
              neighborCount++;
            }
          }
          
          const avgNeighborAlpha = neighborAlphaSum / neighborCount;
          
          // Use weighted blend based on original alpha and neighbor context
          // This creates smoother transitions at edges
          const blendAlpha = originalAlpha * 0.7 + avgNeighborAlpha * 0.3;
          const smoothedAlpha = Math.pow(blendAlpha, 0.85); // Gamma correction for smoother falloff
          
          // Blend foreground color with background using smoothed alpha
          data[i] = Math.round(originalData[i] * smoothedAlpha + bgColor.r * (1 - smoothedAlpha));
          data[i + 1] = Math.round(originalData[i + 1] * smoothedAlpha + bgColor.g * (1 - smoothedAlpha));
          data[i + 2] = Math.round(originalData[i + 2] * smoothedAlpha + bgColor.b * (1 - smoothedAlpha));
          data[i + 3] = 255; // Fully opaque after blending
        }
      }
      
      // Pass 2: Color spill removal - reduce background color bleeding into edges
      for (let y = 2; y < height - 2; y++) {
        for (let x = 2; x < width - 2; x++) {
          const i = (y * width + x) * 4;
          const originalAlpha = originalData[i + 3] / 255;
          
          // Only process edge pixels (partial transparency in original)
          if (originalAlpha < 0.15 || originalAlpha > 0.92) continue;
          
          // Detect if pixel color is too close to old background (typically greenish/grayish)
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Check for common background spill colors (green screen, gray, etc.)
          const isGreenish = g > r * 1.1 && g > b * 1.1;
          const isGrayish = Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && Math.abs(r - b) < 20;
          
          if (isGreenish || (isGrayish && originalAlpha < 0.5)) {
            // Replace with a blend more weighted toward the new background
            const spillReduction = 0.6;
            data[i] = Math.round(r * (1 - spillReduction) + bgColor.r * spillReduction);
            data[i + 1] = Math.round(g * (1 - spillReduction) + bgColor.g * spillReduction);
            data[i + 2] = Math.round(b * (1 - spillReduction) + bgColor.b * spillReduction);
          }
        }
      }
      
      // Pass 3: Feather outer edges for natural transition
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          const originalAlpha = originalData[i + 3] / 255;
          
          // Handle very transparent edge pixels
          if (originalAlpha > 0.01 && originalAlpha < 0.12) {
            // These are the outermost fringe pixels - blend heavily with background
            const featherBlend = originalAlpha * 3; // Boost very low alphas slightly
            data[i] = Math.round(originalData[i] * featherBlend + bgColor.r * (1 - featherBlend));
            data[i + 1] = Math.round(originalData[i + 1] * featherBlend + bgColor.g * (1 - featherBlend));
            data[i + 2] = Math.round(originalData[i + 2] * featherBlend + bgColor.b * (1 - featherBlend));
            data[i + 3] = 255;
          }
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      resolve(canvas.toDataURL('image/png', 1.0));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(transparentImageBlob);
  });
};

// Helper function to convert hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    };
  }
  // Default to white if parsing fails
  return { r: 255, g: 255, b: 255 };
}

export const loadImage = (file: Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

export const loadImageFromDataUrl = (dataUrl: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
};
