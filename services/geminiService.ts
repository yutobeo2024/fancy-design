/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// API base URL
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api'  // Vercel functions
  : 'http://localhost:3000/api';

// Helper function để gọi API
const callAPI = async (endpoint: string, data: any) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || errorData.error || 'API call failed');
  }

  return response.json();
};

/**
 * Generates T-shirt artwork using OpenRouter API with nano banana model
 * @param prompt The user's description of the design.
 * @returns A promise that resolves to the generated image description.
 */
export const generateTshirtArtwork = async (prompt: string): Promise<string> => {
  try {
    const result = await callAPI('/generate-image', { prompt });

    if (result.success) {
      // Trả về URL hình ảnh thực tế
      return result.imageUrl;
    } else {
      throw new Error('Failed to generate artwork');
    }
  } catch (error: any) {
    console.error('Error generating T-shirt artwork:', error);
    throw new Error(`Lỗi tạo thiết kế T-shirt: ${error.message}`);
  }
};

/**
 * Generates a descriptive prompt from an image file using OpenRouter API
 * @param file The image file uploaded by the user.
 * @returns A promise that resolves to the generated text prompt.
 */
export const generatePromptFromImage = async (file: File): Promise<string> => {
  try {
    // Convert file to base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1]; // Remove data:image/...;base64, prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const result = await callAPI('/analyze-image', {
      imageData: base64Data,
      mimeType: file.type
    });

    if (result.success) {
      // FIX: Kiểm tra field đúng từ API response
      return result.analysis || result.imageDescription || result.content;
    } else {
      throw new Error('Failed to analyze image');
    }
  } catch (error: any) {
    console.error('Error analyzing image:', error);

    if (error.message.includes('quota') || error.message.includes('limit')) {
      throw new Error('⚠️ API quota đã hết.\n\n' +
        'Vui lòng thử lại sau hoặc kiểm tra OpenRouter credits.');
    }

    throw new Error(`Lỗi phân tích hình ảnh: ${error.message}`);
  }
};

/**
 * Removes a solid color background from an image using a canvas by sampling a corner pixel.
 * This client-side "chroma key" operation is highly reliable.
 * @param imageBase64 The base64 data URL of the image with a solid background.
 * @returns A promise that resolves to the base64 data URL of the image with a transparent background.
 */
export const removeGreenScreenClientSide = async (imageBase64: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        return reject(new Error('Could not get 2D canvas context'));
      }

      ctx.drawImage(img, 0, 0);

      // Get the color of the top-left pixel [1,1] to use as the key color.
      const keyPixelData = ctx.getImageData(1, 1, 1, 1).data;
      const keyR = keyPixelData[0];
      const keyG = keyPixelData[1];
      const keyB = keyPixelData[2];

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Set tolerance for color matching
      const tolerance = 30;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Check if the pixel color is close to the key color
        if (Math.abs(r - keyR) < tolerance && 
            Math.abs(g - keyG) < tolerance && 
            Math.abs(b - keyB) < tolerance) {
          data[i + 3] = 0; // Set alpha to 0 (transparent)
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageBase64;
  });
};