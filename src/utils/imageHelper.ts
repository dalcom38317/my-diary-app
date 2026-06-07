/**
 * Compresses an image file by resizing it to a maximum dimension
 * and compressing it as JPEG, returning a base64 string.
 */
export const compressImage = (file: File, maxDimension: number = 800, quality: number = 0.6): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Check if the file is an image
    if (!file.type.startsWith('image/')) {
      reject(new Error('Uploaded file is not an image'));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context not available'));
          return;
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to compressed jpeg base64
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = (err) => {
        reject(err);
      };
    };
    reader.onerror = (err) => {
      reject(err);
    };
  });
};

/**
 * Calculates the size of a base64 string in bytes.
 */
export const getBase64Size = (base64String: string): number => {
  // If the base64 string contains the mime-type prefix (e.g. data:image/jpeg;base64,), strip it
  const base64Data = base64String.includes(',') 
    ? base64String.split(',')[1] 
    : base64String;
  
  const padding = (base64Data.match(/=/g) || []).length;
  return Math.floor((base64Data.length * 3) / 4) - padding;
};

/**
 * Formats bytes into a human-readable string.
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
export const getLocalStorageSpaceStatus = () => {
  let totalSize = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      totalSize += (localStorage[key].length + key.length) * 2; // UTF-16 characters are 2 bytes each
    }
  }
  return {
    usedBytes: totalSize,
    limitBytes: 5 * 1024 * 1024, // 5MB approximate limit
    percentage: Math.min(100, parseFloat(((totalSize / (5 * 1024 * 1024)) * 100).toFixed(1)))
  };
};
