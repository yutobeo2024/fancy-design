/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { XIcon } from './icons';

interface CollectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
}

const collectionTshirts = [
    { name: 'White Crewneck', url: 'https://purepng.com/public/uploads/large/white-tshirt-n0j.png' },
    { name: 'Black Crewneck', url: 'https://purepng.com/public/uploads/large/purepng.com-black-t-shirtclothingblack-t-shirtfashion-dress-shirt-black-cloth-tshirt-631522326884bzr0p.png' },
    { name: 'Cream Crewneck', url: 'https://vestirio.com/cdn/shop/files/05.webp?v=1715426368&width=1080' },
    { name: 'Navy Crewneck', url: 'https://pangaia.com/cdn/shop/files/DNA_Oversized_T-Shirt_-Navy-1_4f3ee273-627c-40d8-8fe2-b979dba13183.png?crop=center&height=1999&v=1755252513&width=1500' },
    { name: 'Black Polo', url: 'https://files.ekmcdn.com/fa1a33/images/back-to-basics-work-wear-1150-plain-pique-polo-black-9.99-colour-black-black-size-4xl-8531-p.jpg'},
    { name: 'White Polo', url: 'https://i.guim.co.uk/img/media/613cb975a91769f5597a902974b9d3b03f2b3cbc/0_0_2600_1561/master/2600.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=fca3c2f204181b40315702839c644c71' },
    { name: 'Navy Polo', url: 'https://cdn2.propercloth.com/pic_shirt_gallery_photos/e2d48b81239db82ebb9ec8024bf90a4d_large.jpg'},
];

const CollectionModal: React.FC<CollectionModalProps> = ({ isOpen, onClose, onSelect }) => {
    const [selectedTshirtUrl, setSelectedTshirtUrl] = useState<string | null>(null);

    if (!isOpen) return null;
    
    const handleSelect = () => {
        if(selectedTshirtUrl) {
            onSelect(selectedTshirtUrl);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onMouseDown={onClose}>
            <div 
              className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl"
              onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-xl font-bold">Choose a T-Shirt from our Collection</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {collectionTshirts.map((tshirt) => (
                            <button
                                key={tshirt.name}
                                onClick={() => setSelectedTshirtUrl(tshirt.url)}
                                className={`group flex flex-col gap-2 rounded-lg p-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 ${selectedTshirtUrl === tshirt.url ? 'bg-blue-500/20' : 'hover:bg-white/10'}`}
                            >
                                <div className={`w-full aspect-[4/5] rounded-md overflow-hidden bg-gray-700/50 flex items-center justify-center ring-1 transition-all ${selectedTshirtUrl === tshirt.url ? 'ring-2 ring-blue-500' : 'ring-gray-600 group-hover:ring-blue-500'}`}>
                                    <img 
                                        src={tshirt.url} 
                                        alt={tshirt.name} 
                                        className="w-full h-full object-contain"
                                        loading="lazy"
                                    />
                                </div>
                                <p className="text-sm font-medium text-center text-gray-300 truncate group-hover:text-white">{tshirt.name}</p>
                            </button>
                        ))}
                    </div>
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
                      disabled={!selectedTshirtUrl}
                      className="bg-blue-600 text-white font-bold py-2 px-5 rounded-md transition-all shadow-lg hover:shadow-xl hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        Use this T-Shirt
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CollectionModal;