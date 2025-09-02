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
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md w-full border border-white/20">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          AI T-Shirt Designer
        </h1>
        
        <div className="text-white/80 mb-6">
          <p className="mb-4">
            🎨 Ứng dụng đã được cấu hình với OpenRouter API.
          </p>
          <p className="mb-4">
            ✨ Sử dụng mô hình Gemini 2.5 Flash Image Preview (nano banana) để tạo thiết kế T-shirt chất lượng cao!
          </p>
          <div className="bg-white/5 rounded-lg p-4 mb-4">
            <h3 className="text-white font-semibold mb-2">🚀 Tính năng:</h3>
            <ul className="text-sm space-y-1">
              <li>• Tạo thiết kế từ mô tả văn bản</li>
              <li>• Phân tích và tái tạo thiết kế từ hình ảnh</li>
              <li>• Mô hình AI tiên tiến nhất của Google</li>
              <li>• Không cần cấu hình API key</li>
            </ul>
          </div>
        </div>
        
        <button
          onClick={() => onApiKeySubmit('openrouter-configured')}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Đang khởi tạo...' : 'Bắt đầu thiết kế 🎨'}
        </button>
        
        <div className="mt-6 text-center">
          <p className="text-white/60 text-sm">
            Powered by OpenRouter & Gemini 2.5 Flash Image Preview
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyLogin;