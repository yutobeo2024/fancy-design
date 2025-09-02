const { GoogleGenerativeAI } = require('@google/generative-ai');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageData, mimeType } = req.body;
    
    if (!imageData || !mimeType) {
      return res.status(400).json({ error: 'Image data and mime type are required' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Analyze this image and create a detailed prompt for generating a similar t-shirt design. Focus on:
1. Main visual elements and their arrangement
2. Color scheme and style
3. Text content if any
4. Overall aesthetic and mood

Provide a concise but detailed description that could be used to recreate a similar design.`;

    const imagePart = {
      inlineData: {
        data: imageData,
        mimeType: mimeType
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const generatedPrompt = response.text();

    return res.status(200).json({
      success: true,
      generatedPrompt: generatedPrompt
    });

  } catch (error) {
    console.error('Image Analysis Error:', error);
    
    if (error.message.includes('billed users')) {
      return res.status(403).json({
        error: 'Vision API chỉ dành cho người dùng đã kích hoạt billing',
        code: 'BILLING_REQUIRED'
      });
    }

    return res.status(500).json({
      error: 'Lỗi phân tích hình ảnh',
      code: 'ANALYSIS_ERROR',
      message: error.message
    });
  }
}