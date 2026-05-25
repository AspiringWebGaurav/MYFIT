export interface ProcessedImage {
  blob: Blob;
  width: number;
  height: number;
  type: string;
}

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0 to 1
  convertToWebp?: boolean;
}

export async function processGalleryImage(
  file: File,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImage> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.8,
    convertToWebp = true,
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      
      // Calculate new dimensions maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Could not get 2d context for canvas"));
        return;
      }

      // Preserve transparency for PNG if not converting to webp (though WebP supports transparency)
      // Usually, WebP is great for everything including transparent images.
      ctx.drawImage(img, 0, 0, width, height);

      // Determine output type
      // If user uploaded a transparent PNG, WebP will preserve it.
      let outputType = file.type;
      if (convertToWebp) {
        outputType = 'image/webp';
      }

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas to Blob conversion failed"));
            return;
          }
          resolve({
            blob,
            width,
            height,
            type: outputType,
          });
        },
        outputType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };

    img.src = objectUrl;
  });
}
