// Xóa dòng import GoogleGenerativeAI
// const { GoogleGenerativeAI } = require('@google/generative-ai'); // ← XÓA DÒNG NÀY

// Chuyển từ Google AI Studio sang OpenRouter với nano banana
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export default async function handler(req, res) {
  // Chỉ cho phép POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'OpenRouter API key not configured' });
    }

    // Sử dụng nano banana (Gemini 2.5 Flash Image Preview)
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Title': 'AI T-shirt Designer',
        'HTTP-Referer': 'https://your-app.vercel.app', // Thay bằng domain thực
        'X-OpenRouter-Source': 'ai-tshirt-designer'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview', // nano banana!
        messages: [{
          role: 'user',
          content: `Create a detailed and creative t-shirt design concept: ${prompt}. 
          
          Requirements:
          - Suitable for screen printing or DTG printing
          - Clear visual elements with good contrast
          - Creative and eye-catching design
          - Consider color schemes and composition
          - Provide both visual description and design concept
          
          Generate a comprehensive design description that could be used to create the actual t-shirt artwork.`
        }],
        max_tokens: 1500,
        temperature: 0.8 // Tăng creativity
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
      imageDescription: data.choices[0].message.content,
      prompt: prompt,
      model: 'nano-banana',
      usage: data.usage // Để tracking cost
    });

  } catch (error) {
    console.error('Nano Banana API Error:', error);
    
    // Xử lý các loại lỗi khác nhau
    if (error.message.includes('insufficient_quota')) {
      return res.status(403).json({
        error: 'Hết quota OpenRouter',
        code: 'QUOTA_EXCEEDED',
        message: 'Vui lòng nạp thêm credits vào tài khoản OpenRouter'
      });
    }
    
    if (error.message.includes('invalid_api_key')) {
      return res.status(401).json({
        error: 'API key không hợp lệ',
        code: 'INVALID_API_KEY',
        message: 'Vui lòng kiểm tra OPENROUTER_API_KEY'
      });
    }

    if (error.message.includes('model_not_found')) {
      return res.status(404).json({
        error: 'Model nano banana không khả dụng',
        code: 'MODEL_NOT_FOUND',
        message: 'Gemini 2.5 Flash Image Preview chưa sẵn sàng'
      });
    }

    return res.status(500).json({
      error: 'Lỗi server khi tạo design với nano banana',
      code: 'INTERNAL_ERROR',
      message: error.message
    });
  }
}

// Xóa dòng import GoogleGenerativeAI
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'OpenRouter API key not configured' });
    }

    // Sử dụng DALL-E 3 để tạo hình ảnh thực tế
    const response = await fetch('https://openrouter.ai/api/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Title': 'AI T-shirt Designer',
        'HTTP-Referer': 'https://your-app.vercel.app',
        'X-OpenRouter-Source': 'ai-tshirt-designer'
      },
      body: JSON.stringify({
        model: 'openai/dall-e-3',
        prompt: `Create a high-quality t-shirt design: ${prompt}. 
        
        Requirements:
        - Clean, professional design suitable for screen printing
        - High contrast and clear visual elements
        - Creative and eye-catching
        - Suitable for t-shirt placement
        - Modern and appealing aesthetic`,
        size: '1024x1024',
        quality: 'standard',
        n: 1
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.data || !data.data[0] || !data.data[0].url) {
      throw new Error('Invalid response format from OpenRouter');
    }

    return res.status(200).json({
      success: true,
      imageUrl: data.data[0].url, // URL hình ảnh thực tế
      prompt: prompt,
      model: 'dall-e-3',
      usage: data.usage
    });

  } catch (error) {
    console.error('DALL-E API Error:', error);
    
    if (error.message.includes('insufficient_quota')) {
      return res.status(403).json({
        error: 'Hết quota OpenRouter',
        code: 'QUOTA_EXCEEDED',
        message: 'Vui lòng nạp thêm credits vào tài khoản OpenRouter'
      });
    }
    
    return res.status(500).json({
      error: 'Lỗi server khi tạo hình ảnh',
      code: 'INTERNAL_ERROR',
      message: error.message
    });
  }
}