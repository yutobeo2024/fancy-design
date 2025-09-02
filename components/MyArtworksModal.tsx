/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { XIcon, TrashIcon } from './icons';

interface SavedArtwork {
    id: string;
    url: string;
    contentWidthRatio: number;
    contentHeightRatio: number;
    savedAt: number;
}

interface MyArtworksModalProps {
    isOpen: boolean;
    artworks: SavedArtwork[];
    onClose: () => void;
    onSelect: (artwork: SavedArtwork) => void;
    onDelete: (artworkId: string) => void;
}

const MyArtworksModal: React.FC<MyArtworksModalProps> = ({ isOpen, artworks, onClose, onSelect, onDelete }) => {
    const [selectedArtwork, setSelectedArtwork] = useState<SavedArtwork | null>(null);

    if (!isOpen) return null;
    
    const handleSelect = () => {
        if(selectedArtwork) {
            onSelect(selectedArtwork);
        }
    };

    const sortedArtworks = [...artworks].sort((a, b) => b.savedAt - a.savedAt);

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onMouseDown={onClose}>
            <div 
              className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl"
              onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-xl font-bold">My Artworks</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    {sortedArtworks.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {sortedArtworks.map((artwork) => (
                                <div key={artwork.id} className="relative group">
                                    <button
                                        onClick={() => setSelectedArtwork(artwork)}
                                        className={`w-full flex flex-col gap-2 rounded-lg p-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 ${selectedArtwork?.id === artwork.id ? 'bg-blue-500/20' : 'hover:bg-white/10'}`}
                                    >
                                        <div className={`w-full aspect-square rounded-md overflow-hidden bg-gray-700/50 flex items-center justify-center ring-1 transition-all ${selectedArtwork?.id === artwork.id ? 'ring-2 ring-blue-500' : 'ring-gray-600 group-hover:ring-blue-500'}`}>
                                            <img 
                                                src={artwork.url} 
                                                alt="Saved artwork" 
                                                className="w-full h-full object-contain"
                                                loading="lazy"
                                            />
                                        </div>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(artwork.id);
                                            if (selectedArtwork?.id === artwork.id) {
                                                setSelectedArtwork(null);
                                            }
                                        }}
                                        className="absolute top-0 right-0 m-1 p-1.5 bg-red-600/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                        aria-label="Delete artwork"
                                        title="Delete artwork"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 py-12">
                            <h3 className="text-2xl font-semibold">Your collection is empty.</h3>
                            <p className="mt-2">Generate some artwork and click "Save Artwork to Collection" to add it here.</p>
                        </div>
                    )}
                </div>
                
                <div className="flex items-center justify-end p-4 border-t border-gray-700 gap-4 flex-shrink-0">
                    <button 
                      onClick={onClose} 
                      className="bg-white/10 border border-white/20 text-gray-200 font-semibold py-2 px-5 rounded-md transition-all hover:bg-white/20"
                    >
                        Cancel
                    </button>
                    <button 
                      onClick={handleSelect}
                      disabled={!selectedArtwork}
                      className="bg-blue-600 text-white font-bold py-2 px-5 rounded-md transition-all shadow-lg hover:shadow-xl hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        Use this Artwork
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MyArtworksModal;