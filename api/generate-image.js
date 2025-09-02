const { GoogleGenerativeAI } = require('@google/generative-ai');

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

    // Khởi tạo Gemini AI với API key từ environment
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Tạo prompt cho image generation
    const imagePrompt = `Create a detailed description for a t-shirt design: ${prompt}. The design should be suitable for printing on a t-shirt, with clear visual elements and good contrast.`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'text/plain',
          data: imagePrompt
        }
      }
    ]);

    const response = await result.response;
    const generatedText = response.text();

    return res.status(200).json({
      success: true,
      imageDescription: generatedText,
      prompt: prompt
    });

  } catch (error) {
    console.error('API Error:', error);
    
    // Xử lý các loại lỗi khác nhau
    if (error.message.includes('billed users')) {
      return res.status(403).json({
        error: 'Imagen API chỉ dành cho người dùng đã kích hoạt billing',
        code: 'BILLING_REQUIRED',
        message: 'Vui lòng kích hoạt billing trên Google Cloud Console và enable Vertex AI API'
      });
    }
    
    if (error.message.includes('permission') || error.message.includes('access')) {
      return res.status(403).json({
        error: 'Không có quyền truy cập API',
        code: 'PERMISSION_DENIED',
        message: 'Vui lòng kiểm tra API key và quyền truy cập'
      });
    }

    return res.status(500).json({
      error: 'Lỗi server khi tạo hình ảnh',
      code: 'INTERNAL_ERROR',
      message: error.message
    });
  }
}