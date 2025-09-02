// Xóa dòng import GoogleGenerativeAI
// const { GoogleGenerativeAI } = require('@google/generative-ai'); // ← XÓA DÒNG NÀY

// Chuyển sang OpenRouter cho image analysis
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageData, mimeType } = req.body;
    
    if (!imageData || !mimeType) {
      return res.status(400).json({ error: 'Image data and mime type are required' });
    }

    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'OpenRouter API key not configured' });
    }

    // Sử dụng Gemini vision model qua OpenRouter
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Title': 'AI T-shirt Designer - Image Analysis',
        'HTTP-Referer': 'https://your-app.vercel.app',
        'X-OpenRouter-Source': 'ai-tshirt-designer'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp', // Vision model
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this image and create a detailed prompt for generating a similar t-shirt design. Focus on:
              
              1. Main visual elements and their arrangement
              2. Color scheme and style (specific colors, gradients, etc.)
              3. Text content if any (fonts, positioning, effects)
              4. Overall aesthetic and mood (vintage, modern, minimalist, etc.)
              5. Design techniques (illustrations, photography, typography, etc.)
              6. Target audience and style category
              
              Provide a comprehensive and detailed description that could be used to recreate a similar design concept for t-shirt printing.`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${imageData}`
              }
            }
          ]
        }],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenRouter');
    }

    return res.status(200).json({
      success: true,
      generatedPrompt: data.choices[0].message.content,
      model: 'gemini-2.0-flash-exp',
      usage: data.usage
    });

  } catch (error) {
    console.error('Image Analysis Error:', error);
    
    if (error.message.includes('insufficient_quota')) {
      return res.status(403).json({
        error: 'Hết quota OpenRouter cho image analysis',
        code: 'QUOTA_EXCEEDED'
      });
    }

    if (error.message.includes('invalid_api_key')) {
      return res.status(401).json({
        error: 'API key không hợp lệ',
        code: 'INVALID_API_KEY'
      });
    }

    return res.status(500).json({
      error: 'Lỗi phân tích hình ảnh',
      code: 'ANALYSIS_ERROR',
      message: error.message
    });
  }
}