/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef } from 'react';
import { MagicWandIcon, ImageIcon } from './icons';
import { generatePromptFromImage } from '../services/geminiService';

interface DesignScreenProps {
  onGenerate: (prompt: string, style: string) => void;
  isLoading: boolean;
}

const designStyles = [
    { name: 'Vintage', style: 'vintage, retro, distressed texture' },
    { name: 'Minimalist', style: 'minimalist, clean lines, simple shapes' },
    { name: 'Cartoon', style: 'cartoon, playful, bold outlines, vibrant colors' },
    { name: 'Graffiti', style: 'graffiti, street art, spray paint effect, urban' },
    { name: 'Geometric', style: 'geometric shapes, abstract, symmetrical' },
    { name: 'Surreal', style: 'surrealism, dream-like, abstract, fantasy' },
    { name: 'Cyberpunk', style: 'cyberpunk, neon lights, futuristic, glitch effect, techwear aesthetic' },
    { name: 'Anime', style: 'anime, manga style, dynamic lines, vibrant, Japanese animation inspired' },
    { name: 'Psychedelic', style: 'psychedelic, trippy, swirling patterns, vibrant colors, abstract' },
    { name: 'Y2K', style: 'Y2K aesthetic, early 2000s style, metallic, futuristic, retro tech' },
];

interface Style {
    name: string;
    style: string;
}

const StartScreen: React.FC<DesignScreenProps> = ({ onGenerate, isLoading }) => {
    const [prompt, setPrompt] = useState('');
    const [selectedStyle, setSelectedStyle] = useState<Style | null>(null);
    const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
    const [promptError, setPromptError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleGenerateClick = () => {
        if (prompt.trim() && selectedStyle && !isLoading) {
            onGenerate(prompt, selectedStyle.style);
        }
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsGeneratingPrompt(true);
        setPromptError(null);
        setPrompt('');

        try {
            const generatedPrompt = await generatePromptFromImage(file);
            setPrompt(generatedPrompt);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Could not generate prompt from image.';
            setPromptError(errorMessage);
            console.error(err);
        } finally {
            setIsGeneratingPrompt(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

  return (
    <div className="w-full max-w-4xl mx-auto text-center p-8">
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-100 sm:text-6xl md:text-7xl">
          Design Your <span className="text-blue-400">Perfect T-Shirt</span>
        </h1>
        <p className="max-w-2xl text-lg text-gray-400 md:text-xl">
          Describe your idea, pick a style, and let our AI create unique, print-ready artwork for your custom apparel.
        </p>

        <div className="w-full mt-6 bg-gray-800/50 border border-gray-700 rounded-lg p-6 flex flex-col gap-5 backdrop-blur-sm">
            <div className="relative">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={isGeneratingPrompt ? 'Analyzing your image...' : 'e.g., A majestic lion wearing a crown'}
                    className="w-full bg-gray-900/70 border border-gray-600 text-gray-200 rounded-lg p-5 pr-14 text-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition h-28 resize-none"
                    disabled={isLoading || isGeneratingPrompt}
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading || isGeneratingPrompt}
                    className="absolute top-1/2 right-4 -translate-y-1/2 p-2 rounded-full text-gray-400 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-wait"
                    aria-label="Generate prompt from image"
                    title="Generate prompt from image"
                >
                    {isGeneratingPrompt ? (
                        <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <ImageIcon className="w-6 h-6" />
                    )}
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                />
            </div>
            
             {promptError && (
                <p className="text-red-400 text-sm text-center -mt-2 animate-fade-in">{promptError}</p>
            )}
            
            <div className="flex flex-col items-center gap-3">
                <p className="font-semibold text-gray-300">Choose a style:</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {designStyles.map(style => (
                        <button
                            key={style.name}
                            onClick={() => setSelectedStyle(style)}
                            disabled={isLoading}
                            className={`px-4 py-2 rounded-md text-base font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 ${
                            selectedStyle?.name === style.name
                            ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/20' 
                            : 'bg-white/10 hover:bg-white/20 text-gray-200'
                            }`}
                        >
                            {style.name}
                        </button>
                    ))}
                </div>
            </div>

            <button 
                onClick={handleGenerateClick}
                disabled={isLoading || isGeneratingPrompt || !prompt.trim() || !selectedStyle}
                className="w-full flex items-center justify-center gap-3 mt-4 bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-5 px-8 text-lg rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner disabled:from-green-800 disabled:to-green-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
            >
                <MagicWandIcon className="w-6 h-6" />
                Generate Artwork
            </button>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;