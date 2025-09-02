/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI } from "@google/genai";

/**
 * Removes a solid color background from an image using a canvas by sampling a corner pixel.
 * This client-side "chroma key" operation is highly reliable.
 * @param imageBase64 The base64 data URL of the image with a solid background.
 * @returns A promise that resolves to the base64 data URL of the image with a transparent background.
 */
const removeGreenScreenClientSide = (imageBase64: string): Promise<string> => {
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
            // This makes the function robust to the AI choosing slightly different shades.
            const keyPixelData = ctx.getImageData(1, 1, 1, 1).data;
            const keyR = keyPixelData[0];
            const keyG = keyPixelData[1];
            const keyB = keyPixelData[2];

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // A threshold for color distance. A higher value is more tolerant to variations.
            const colorDistanceThreshold = 100;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                
                // Calculate the Euclidean distance between the current pixel color and the key color.
                const distance = Math.sqrt(
                    Math.pow(r - keyR, 2) +
                    Math.pow(g - keyG, 2) +
                    Math.pow(b - keyB, 2)
                );

                // If the color is close to our key color, make it transparent.
                if (distance < colorDistanceThreshold) {
                    data[i + 3] = 0; // Set alpha to 0
                }
            }

            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => {
            reject(new Error('Failed to load image for client-side background removal.'));
        };
        img.src = imageBase64;
    });
};


/**
 * Generates T-shirt artwork using a hybrid AI and client-side process.
 * @param prompt The user's description of the design.
 * @param style The selected style for the artwork.
 * @param onProgress A callback to update the loading message during the process.
 * @returns A promise that resolves to the base64 data URL of the generated image with a transparent background.
 */
export const generateTshirtArtwork = async (
    prompt: string,
    style: string,
    onProgress: (message: string) => void,
): Promise<string> => {
    // Lấy API key từ localStorage, nếu không có thì sử dụng API key từ biến môi trường
    const apiKey = localStorage.getItem('gemini-api-key') || process.env.API_KEY!;
    const ai = new GoogleGenAI({ apiKey });
    
    // Step 1: Generate the initial artwork on a solid green screen background.
    onProgress('Step 1/2: Generating initial artwork...');
    const fullPrompt = `Create a high-resolution, vector-style graphic suitable for printing on apparel. The subject is: '${prompt}'. The style is '${style}'. The final image must feature ONLY the subject, isolated on a solid, plain, bright green background suitable for chroma keying (green screen). Do NOT include a T-shirt or any other apparel in the image itself. The background must be a single, uniform color with no shadows or gradients. The main subject should be centered.`;

    console.log(`Generating artwork with prompt: ${fullPrompt}`);
    
    let generationResponse;
    try {
        generationResponse = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: fullPrompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: '1:1',
            },
        });
    } catch (error) {
        console.error('Error generating image:', error);
        
        // Kiểm tra lỗi liên quan đến tài khoản không có thanh toán
        if (error instanceof Error && error.message) {
            if (error.message.includes('billed users')) {
                throw new Error('Imagen API chỉ có thể truy cập được cho người dùng có thanh toán. Bạn có thể:\n\n1. Sử dụng Google AI Studio miễn phí (https://aistudio.google.com/) để tạo hình ảnh và tải về, sau đó tải lên ứng dụng này.\n\n2. Hoặc kích hoạt thanh toán cho Google Cloud:\n   - Truy cập Google Cloud Console\n   - Chọn/tạo dự án và kích hoạt Billing\n   - Kích hoạt Vertex AI API trong API Library\n   - Tạo API key mới từ Credentials\n\nLưu ý: Imagen API được tích hợp trong Vertex AI API và yêu cầu tài khoản có thanh toán.');
            } else if (error.message.includes('permission') || error.message.includes('Permission') || error.message.includes('access')) {
                throw new Error(`Lỗi quyền truy cập API: ${error.message}\n\nVui lòng kiểm tra:\n1. API key của bạn có hợp lệ không\n2. Dự án Google Cloud đã kích hoạt Vertex AI API\n3. Dự án đã kích hoạt Imagen API\n4. Dự án đã kích hoạt thanh toán`);
            } else {
                throw new Error(`Lỗi khi tạo hình ảnh: ${error.message}\n\nVui lòng kiểm tra cài đặt API của bạn trong Google Cloud Console.`);
            }
        } else {
            throw error;
        }
    }
    
    console.log('Received response from image generation model.', generationResponse);

    if (!generationResponse.generatedImages || generationResponse.generatedImages.length === 0) {
        console.error('Image generation failed or returned no images.', generationResponse);
        
        // Kiểm tra lỗi liên quan đến tài khoản không có thanh toán
        if (generationResponse.error && generationResponse.error.message && generationResponse.error.message.includes('billed users')) {
            throw new Error('Imagen API chỉ có thể truy cập được cho người dùng có thanh toán. Bạn có thể:\n\n1. Sử dụng Google AI Studio miễn phí (https://aistudio.google.com/) để tạo hình ảnh và tải về, sau đó tải lên ứng dụng này.\n\n2. Hoặc đảm bảo tài khoản Google Cloud của bạn đã được kích hoạt thanh toán và API key có quyền truy cập vào Imagen API.');
        }
        
        throw new Error('The AI model did not return an initial image. This might be due to safety filters or a complex request. Please try a different prompt.');
    }
    
    const initialImageBase64 = `data:image/png;base64,${generationResponse.generatedImages[0].image.imageBytes}`;

    // Step 2: Remove the green screen background using client-side canvas manipulation.
    onProgress('Step 2/2: Finalizing image transparency...');
    console.log('Starting client-side background removal.');
    try {
        const finalImageBase64 = await removeGreenScreenClientSide(initialImageBase64);
        console.log('Client-side background removal successful.');
        return finalImageBase64;
    } catch (error) {
         console.error('Client-side background removal failed.', error);
         throw new Error('Failed to process the generated image to remove the background.');
    }
};

/**
 * Converts a File object to a GoogleGenAI.Part object.
 * @param file The file to convert.
 * @returns A promise that resolves to a generative part.
 */
const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type }
    };
};

/**
 * Generates a descriptive prompt from an image file.
 * @param imageFile The image file uploaded by the user.
 * @returns A promise that resolves to the generated text prompt.
 */
export const generatePromptFromImage = async (
    imageFile: File,
): Promise<string> => {
    // Lấy API key từ localStorage, nếu không có thì sử dụng API key từ biến môi trường
    const apiKey = localStorage.getItem('gemini-api-key') || process.env.API_KEY!;
    const ai = new GoogleGenAI({ apiKey });

    try {
        const imagePart = await fileToGenerativePart(imageFile);
        const textPart = {
            text: "Describe this image in a concise and creative way, suitable for generating new T-shirt artwork. Focus on the main subject and key visual elements. The description should be a single sentence or a short phrase."
        };

        console.log('Generating prompt from image...');
        
        let response;
        try {
            response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, textPart] },
            });
        } catch (error) {
            console.error('Error generating prompt from image:', error);
            
            // Kiểm tra lỗi liên quan đến tài khoản không có thanh toán
            if (error instanceof Error && error.message) {
                if (error.message.includes('billed users')) {
                    throw new Error('Gemini API chỉ có thể truy cập được cho người dùng có thanh toán. Bạn có thể:\n\n1. Sử dụng Google AI Studio miễn phí (https://aistudio.google.com/) để tạo mô tả từ hình ảnh.\n\n2. Hoặc kích hoạt thanh toán cho Google Cloud:\n   - Truy cập Google Cloud Console\n   - Chọn/tạo dự án và kích hoạt Billing\n   - Kích hoạt Vertex AI API trong API Library\n   - Tạo API key mới từ Credentials\n\nLưu ý: Gemini API yêu cầu tài khoản có thanh toán để sử dụng đầy đủ tính năng.');
                } else if (error.message.includes('permission') || error.message.includes('Permission') || error.message.includes('access')) {
                    throw new Error(`Lỗi quyền truy cập API: ${error.message}\n\nVui lòng kiểm tra:\n1. API key của bạn có hợp lệ không\n2. Dự án Google Cloud đã kích hoạt Vertex AI API\n3. Dự án đã kích hoạt thanh toán`);
                } else {
                    throw new Error(`Lỗi khi phân tích hình ảnh: ${error.message}\n\nVui lòng kiểm tra cài đặt API của bạn trong Google Cloud Console.`);
                }
            } else {
                throw error;
            }
        }

        const promptText = response.text;
        
        if (!promptText) {
            throw new Error('The AI model did not return a description. Please try a different image.');
        }

        console.log(`Generated prompt: ${promptText}`);
        return promptText.trim();
    } catch (error) {
        console.error('Failed to generate prompt from image.', error);
        throw new Error(error instanceof Error ? error.message : 'An unknown error occurred while analyzing the image.');
    }
};

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

// Cập nhật function generateTshirtArtwork
export const generateTshirtArtwork = async (prompt: string): Promise<string> => {
try {
const result = await callAPI('/generate-image', { prompt });

if (result.success) {
return result.imageDescription;
} else {
throw new Error('Failed to generate artwork');
}
} catch (error: any) {
console.error('Error generating T-shirt artwork:', error);

// Xử lý các loại lỗi từ backend
if (error.message.includes('BILLING_REQUIRED')) {
throw new Error('⚠️ Imagen API chỉ dành cho người dùng đã kích hoạt billing.\n\n' +
'📋 Để sử dụng tính năng này:\n' +
'1. Truy cập Google Cloud Console\n' +
'2. Kích hoạt billing cho project\n' +
'3. Enable Vertex AI API\n' +
'4. Tạo API key mới từ Google Cloud Console\n\n' +
'💡 Hoặc sử dụng Google AI Studio (miễn phí) với model text-only.');
}

if (error.message.includes('PERMISSION_DENIED')) {
throw new Error('❌ Không có quyền truy cập API.\n\n' +
'Vui lòng kiểm tra:\n' +
'• API key có đúng không\n' +
'• API key có quyền truy cập Gemini API\n' +
'• Project có enable các API cần thiết');
}

throw new Error(`Lỗi tạo thiết kế T-shirt: ${error.message}`);
}
};

// Cập nhật function generatePromptFromImage
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
return result.generatedPrompt;
} else {
throw new Error('Failed to analyze image');
}
} catch (error: any) {
console.error('Error analyzing image:', error);

if (error.message.includes('BILLING_REQUIRED')) {
throw new Error('⚠️ Vision API chỉ dành cho người dùng đã kích hoạt billing.\n\n' +
'Vui lòng kích hoạt billing trên Google Cloud Console.');
}

throw new Error(`Lỗi phân tích hình ảnh: ${error.message}`);
}
};

// Remove background function (giữ nguyên client-side)
export const removeGreenScreenClientSide = async (file: File): Promise<string> => {
// ... existing implementation
}

// Helper function (giữ nguyên)
function fileToGenerativePart(file: File): Promise<any> {
const base64EncodedDataPromise = new Promise<string>((resolve) => {
const reader = new FileReader();
reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
reader.readAsDataURL(file);
});
return {
inlineData: { data: await base64EncodedDataPromise, mimeType: file.type }
};
};
