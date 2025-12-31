// Face detection and auto-crop utility for passport photos

interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Check if FaceDetector API is available
const isFaceDetectorSupported = () => {
  return 'FaceDetector' in window;
};

// Detect face using browser's FaceDetector API
export const detectFace = async (imageElement: HTMLImageElement): Promise<FaceBox | null> => {
  if (!isFaceDetectorSupported()) {
    console.log('FaceDetector API not supported, using fallback');
    return fallbackFaceDetection(imageElement);
  }

  try {
    // @ts-ignore - FaceDetector is not in TypeScript types yet
    const faceDetector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
    const faces = await faceDetector.detect(imageElement);
    
    if (faces.length > 0) {
      const face = faces[0].boundingBox;
      return {
        x: face.x,
        y: face.y,
        width: face.width,
        height: face.height
      };
    }
    return null;
  } catch (error) {
    console.error('Face detection error:', error);
    return fallbackFaceDetection(imageElement);
  }
};

// Fallback: assume face is in center-upper portion of image
const fallbackFaceDetection = (imageElement: HTMLImageElement): FaceBox => {
  const width = imageElement.naturalWidth;
  const height = imageElement.naturalHeight;
  
  // Estimate face in upper-center portion
  const faceWidth = width * 0.4;
  const faceHeight = height * 0.35;
  const faceX = (width - faceWidth) / 2;
  const faceY = height * 0.1;
  
  return {
    x: faceX,
    y: faceY,
    width: faceWidth,
    height: faceHeight
  };
};

// Crop image to passport dimensions with face centered
export const cropToPassport = async (
  imageElement: HTMLImageElement,
  targetAspectRatio: number = 3.5 / 4.5 // Default passport ratio (width/height)
): Promise<string> => {
  const face = await detectFace(imageElement);
  
  if (!face) {
    throw new Error('Could not detect face in the image');
  }

  const imgWidth = imageElement.naturalWidth;
  const imgHeight = imageElement.naturalHeight;

  // Calculate crop area based on face position
  // Face should be in upper 60-70% of passport photo
  const faceHeightRatio = 0.5; // Face takes ~50% of photo height
  const faceTopMargin = 0.15; // 15% margin from top to face

  // Calculate crop dimensions
  const cropHeight = face.height / faceHeightRatio;
  const cropWidth = cropHeight * targetAspectRatio;

  // Center horizontally on face
  const faceCenterX = face.x + face.width / 2;
  let cropX = faceCenterX - cropWidth / 2;

  // Position face with proper top margin
  const faceCenterY = face.y + face.height / 2;
  const targetFaceCenterY = cropHeight * (faceTopMargin + faceHeightRatio / 2);
  let cropY = faceCenterY - targetFaceCenterY;

  // Ensure crop stays within image bounds
  cropX = Math.max(0, Math.min(cropX, imgWidth - cropWidth));
  cropY = Math.max(0, Math.min(cropY, imgHeight - cropHeight));

  // If crop is larger than image, scale down
  let finalCropWidth = cropWidth;
  let finalCropHeight = cropHeight;
  
  if (cropWidth > imgWidth) {
    finalCropWidth = imgWidth;
    finalCropHeight = imgWidth / targetAspectRatio;
    cropX = 0;
  }
  
  if (finalCropHeight > imgHeight) {
    finalCropHeight = imgHeight;
    finalCropWidth = imgHeight * targetAspectRatio;
    cropY = 0;
    cropX = Math.max(0, (imgWidth - finalCropWidth) / 2);
  }

  // Create canvas and crop
  const canvas = document.createElement('canvas');
  const outputWidth = 600; // High quality output
  const outputHeight = outputWidth / targetAspectRatio;
  
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Draw cropped portion
  ctx.drawImage(
    imageElement,
    cropX, cropY, finalCropWidth, finalCropHeight,
    0, 0, outputWidth, outputHeight
  );

  return canvas.toDataURL('image/png', 1.0);
};

export const loadImageElement = (dataUrl: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
};
