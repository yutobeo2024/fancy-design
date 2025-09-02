/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';

interface ApiKeyLoginProps {
  onApiKeySubmit: (apiKey: string) => void;
  isLoading?: boolean;
}

const ApiKeyLogin: React.FC<ApiKeyLoginProps> = ({ onApiKeySubmit, isLoading = false }) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  // Kiểm tra xem có API key trong localStorage không khi component được mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini-api-key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      // Không tự động gửi API key đã lưu khi component mount
      // Để người dùng có thể xem và chỉnh sửa nếu cần
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      setError('Vui lòng nhập API key');
      return;
    }
    
    // Lưu API key vào localStorage
    localStorage.setItem('gemini-api-key', apiKey.trim());
    
    // Gọi callback để thông báo cho component cha
    onApiKeySubmit(apiKey.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-400 mb-2">T-Shirt Designer</h1>
          <p className="text-gray-300">Nhập API key của Google Gemini để tiếp tục</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="api-key" className="block text-sm font-medium text-gray-300 mb-2">
              Google Gemini API Key
            </label>
            <input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setError(null);
              }}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập API key của bạn"
              disabled={isLoading}
            />
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-md transition-colors duration-300 disabled:bg-blue-800 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Đang xử lý...' : 'Tiếp tục'}
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-sm text-gray-400">
          <p className="mb-2">Để lấy API key của Google Gemini:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Truy cập <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google AI Studio</a></li>
            <li>Đăng nhập với tài khoản Google của bạn</li>
            <li>Vào mục "API keys" trong menu</li>
            <li>Tạo API key mới hoặc sử dụng key hiện có</li>
          </ol>
          
          <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-md">
            <p className="font-medium text-yellow-300 mb-1">Lưu ý quan trọng:</p>
            <p>Để sử dụng Imagen API (tạo hình ảnh), bạn có hai lựa chọn:</p>
            <div className="mt-2">
              <p className="font-medium text-green-300">Lựa chọn 1: Sử dụng Google AI Studio miễn phí</p>
              <ul className="list-disc list-inside mt-1 space-y-1 ml-2">
                <li>Truy cập <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google AI Studio</a> và đăng nhập</li>
                <li>Sử dụng trực tiếp tính năng tạo hình ảnh miễn phí (có giới hạn số lượng mỗi ngày)</li>
                <li>Tải hình ảnh về và sử dụng trong ứng dụng này</li>
              </ul>
            </div>
            <div className="mt-3">
              <p className="font-medium text-yellow-300">Lựa chọn 2: Sử dụng API key có thanh toán</p>
              <ul className="list-disc list-inside mt-1 space-y-1 ml-2">
                <li>Tài khoản Google Cloud có kích hoạt thanh toán</li>
                <li>API key được liên kết với dự án có thanh toán</li>
                <li>Đã kích hoạt Vertex AI API trong dự án của bạn</li>
                <li>Đã kích hoạt Imagen API trong dự án của bạn</li>
              </ul>
            </div>
            <div className="mt-3 p-2 bg-blue-900/30 border border-blue-700/50 rounded-md">
              <p className="font-medium text-blue-300 mb-1">Hướng dẫn kích hoạt API chi tiết:</p>
              <ol className="list-decimal list-inside mt-1 space-y-1 ml-2 text-sm">
                <li>Truy cập <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google Cloud Console</a></li>
                <li>Chọn hoặc tạo dự án Google Cloud</li>
                <li>Đảm bảo dự án đã được kích hoạt thanh toán (Billing)</li>
                <li>Vào &quot;APIs &amp; Services&quot; &gt; &quot;Library&quot;</li>
                <li>Tìm kiếm &quot;Vertex AI API&quot; và nhấn &quot;Enable&quot;</li>
                <li>Tạo API key trong &quot;APIs &amp; Services&quot; &gt; &quot;Credentials&quot;</li>
                <li>Sao chép API key và dán vào ô trên</li>
              </ol>
              <p className="mt-2 text-xs text-gray-400">Lưu ý: Imagen API được tích hợp trong Vertex AI API và chỉ khả dụng cho người dùng có thanh toán.</p>
            </div>
            <p className="mt-2">Xem thêm thông tin tại <a href="https://ai.google.dev/tutorials/gemini_api_intro_rest" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">tài liệu chính thức</a>.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyLogin;