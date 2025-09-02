/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, PointerEvent, useRef, useEffect } from 'react';
import { generateTshirtArtwork } from './services/geminiService';
import Header from './components/Header';
import Spinner from './components/Spinner';
import StartScreen from './components/StartScreen';
import CollectionModal from './components/CollectionModal';
import MyArtworksModal from './components/MyArtworksModal';
import ApiKeyLogin from './components/ApiKeyLogin';
import { UploadIcon, TextIcon, EyeIcon, PencilIcon, BoldIcon, TextAlignLeftIcon, TextAlignCenterIcon, TextAlignRightIcon, UndoIcon, RedoIcon, CollectionIcon, TrashIcon, BookmarkIcon, FolderIcon } from './components/icons';

interface Artwork {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  contentWidthRatio: number;
  contentHeightRatio: number;
}

interface TextElement {
  id: number;
  content: string;
  x: number;
  y: number;
  width: number;
  fontSize: number;
  color: string;
  fontWeight: 'normal' | 'bold';
  textAlign: 'left' | 'center' | 'right';
  rotation: number;
  fontFamily: string;
  textEffect: 'none' | 'shadow' | 'outline';
}

interface SavedArtwork {
    id: string;
    url: string;
    contentWidthRatio: number;
    contentHeightRatio: number;
    savedAt: number;
}

type DesignState = {
    artwork: Artwork | null;
    textElements: TextElement[];
};

type SelectedElement = { type: 'artwork' } | { type: 'text', id: number } | null;
type Mode = 'editor' | 'preview';

type InteractionState = {
    type: 'drag';
    element: SelectedElement;
    offsetX: number;
    offsetY: number;
} | {
    type: 'resize';
    direction: 'se' | 'e' | 'w' | 's';
    element: SelectedElement;
    elementX: number;
    elementY: number;
    startWidth: number;
    startHeight: number;
    startFontSize?: number;
    aspectRatio: number;
    startPointer: { x: number; y: number };
} | {
    type: 'rotate';
    element: SelectedElement;
    centerX: number;
    centerY: number;
    startAngle: number;
    initialRotation: number;
} | null;

const fonts = [
    { name: 'Roboto', value: "'Roboto', sans-serif" },
    { name: 'Inter', value: "'Inter', sans-serif" },
    { name: 'Poppins', value: "'Poppins', sans-serif" },
    { name: 'Montserrat', value: "'Montserrat', sans-serif" },
    { name: 'Oswald', value: "'Oswald', sans-serif" },
    { name: 'Bebas Neue', value: "'Bebas Neue', sans-serif" },
    { name: 'Anton', value: "'Anton', sans-serif" },
    { name: 'Lobster', value: "'Lobster', cursive" },
    { name: 'Bangers', value: "'Bangers', cursive" },
    { name: 'Pacifico', value: "'Pacifico', cursive" },
    { name: 'Lato', value: "'Lato', sans-serif" },
    { name: 'Raleway', value: "'Raleway', sans-serif" },
    { name: 'Nunito', value: "'Nunito', sans-serif" },
    { name: 'Playfair Display', value: "'Playfair Display', serif" },
    { name: 'Merriweather', value: "'Merriweather', serif" },
    { name: 'Josefin Sans', value: "'Josefin Sans', sans-serif" },
    { name: 'Arvo', value: "'Arvo', serif" },
    { name: 'Ubuntu', value: "'Ubuntu', sans-serif" },
    { name: 'Dancing Script', value: "'Dancing Script', cursive" },
    { name: 'Shadows Into Light', value: "'Shadows Into Light', cursive" },
    { name: 'Caveat', value: "'Caveat', cursive" },
    { name: 'Righteous', value: "'Righteous', sans-serif" },
    { name: 'Comfortaa', value: "'Comfortaa', sans-serif" },
    { name: 'Amatic SC', value: "'Amatic SC', cursive" },
    { name: 'Permanent Marker', value: "'Permanent Marker', cursive" },
];

// Conversion factor for pixels to millimeters based on a standard 300 DPI for printing
const PIXELS_TO_MM = 25.4 / 300;

const getTextEffectStyle = (effect: TextElement['textEffect']) => {
    switch (effect) {
      case 'shadow':
        return { textShadow: '2px 2px 5px rgba(0,0,0,0.5)' };
      case 'outline':
        return { textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' };
      default:
        return {};
    }
};

interface EditableTextProps {
    element: TextElement;
    onUpdate: (props: Partial<TextElement>) => void;
    onCommit: () => void;
    onEndEditing: () => void;
}

const EditableText: React.FC<EditableTextProps> = ({ element, onUpdate, onCommit, onEndEditing }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.select();
            adjustHeight();
        }
    }, []);

    const adjustHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onUpdate({ content: e.target.value });
        requestAnimationFrame(adjustHeight);
    };

    const handleBlur = () => {
        onCommit();
        onEndEditing();
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleBlur();
        }
        if (e.key === 'Escape') {
            handleBlur();
        }
    };

    return (
        <textarea
            ref={textareaRef}
            value={element.content}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="absolute inset-0 w-full h-auto bg-transparent border-none outline-none resize-none p-0 m-0 overflow-hidden"
            style={{
                fontFamily: element.fontFamily,
                fontSize: `${element.fontSize}px`,
                fontWeight: element.fontWeight,
                color: element.color,
                textAlign: element.textAlign,
                lineHeight: 1.1,
                ...getTextEffectStyle(element.textEffect)
            }}
        />
    );
}

/**
 * Calculates the tight bounding box of the non-transparent pixels in an image.
 * @param imageUrl The URL of the image to analyze.
 * @returns A promise that resolves to the width and height ratios of the content relative to the image dimensions.
 */
const calculateContentDimensions = (imageUrl: string): Promise<{ contentWidthRatio: number, contentHeightRatio: number }> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            if (!ctx) {
                // Fallback if context is not available, returning full size
                return resolve({ contentWidthRatio: 1, contentHeightRatio: 1 });
            }

            ctx.drawImage(img, 0, 0);

            try {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                let minX = canvas.width, minY = canvas.height, maxX = -1, maxY = -1;

                // Iterate through all pixels to find the bounds of the actual content
                for (let y = 0; y < canvas.height; y++) {
                    for (let x = 0; x < canvas.width; x++) {
                        const alpha = data[(y * canvas.width + x) * 4 + 3];
                        if (alpha > 0) { // Check if pixel is not transparent
                            if (x < minX) minX = x;
                            if (x > maxX) maxX = x;
                            if (y < minY) minY = y;
                            if (y > maxY) maxY = y;
                        }
                    }
                }
                
                if (maxX === -1) { // Image is fully transparent
                    return resolve({ contentWidthRatio: 0, contentHeightRatio: 0 });
                }

                const contentWidth = maxX - minX + 1;
                const contentHeight = maxY - minY + 1;

                resolve({
                    contentWidthRatio: contentWidth / canvas.width,
                    contentHeightRatio: contentHeight / canvas.height,
                });

            } catch (e) {
                console.error("Could not get image data for content dimension calculation, possibly due to CORS. Falling back to full image size.", e);
                // Fallback for tainted canvas, returning full size
                resolve({ contentWidthRatio: 1, contentHeightRatio: 1 });
            }
        };
        img.onerror = (err) => {
            console.error("Failed to load image for dimension calculation.", err);
            reject(new Error('Failed to load image for dimension calculation.'));
        };
        img.src = imageUrl;
    });
};


const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [showApiKeyScreen, setShowApiKeyScreen] = useState<boolean>(false);
  
  // Kiểm tra xem API key đã được lưu trong localStorage chưa
  useEffect(() => {
    const apiKey = localStorage.getItem('gemini-api-key');
    setHasApiKey(!!apiKey);
    setShowApiKeyScreen(!apiKey); // Hiển thị màn hình API key nếu chưa có key
  }, []);
  const [error, setError] = useState<string | null>(null);
  
  // Live state for rendering and interactions
  const [generatedArtwork, setGeneratedArtwork] = useState<Artwork | null>(null);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [editingTextId, setEditingTextId] = useState<number | null>(null);
  
  // History state for undo/redo
  const [history, setHistory] = useState<DesignState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const [mockupUrl, setMockupUrl] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<SelectedElement>(null);
  const [mode, setMode] = useState<Mode>('editor');
  const [interactionState, setInteractionState] = useState<InteractionState>(null);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState<boolean>(false);
  const [isMyArtworksModalOpen, setIsMyArtworksModalOpen] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const designSurfaceRef = useRef<HTMLDivElement>(null);

  const [myArtworks, setMyArtworks] = useState<SavedArtwork[]>([]);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('ai-tshirt-designer-collection');
            if (saved) {
                setMyArtworks(JSON.parse(saved));
            }
        } catch (error) {
            console.error("Failed to load saved artworks from localStorage:", error);
        }
    }, []);
  
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Sync live state when history changes (undo/redo)
  useEffect(() => {
      const currentState = history[historyIndex];
      if (currentState) {
          setGeneratedArtwork(currentState.artwork);
          setTextElements(currentState.textElements);
      } else {
          setGeneratedArtwork(null);
          setTextElements([]);
      }
  }, [history, historyIndex]);

  // Function to commit changes to history
  const commitToHistory = (newArtwork: Artwork | null, newTextElements: TextElement[]) => {
      const newState: DesignState = { artwork: newArtwork, textElements: newTextElements };
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newState);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
  };
  
  const undo = () => { if (canUndo) setHistoryIndex(historyIndex - 1); };
  const redo = () => { if (canRedo) setHistoryIndex(historyIndex + 1); };

  const getArtworkWithDimensions = (url: string): Promise<Omit<Artwork, 'x' | 'y'>> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const aspectRatio = img.naturalWidth > 0 ? img.naturalWidth / img.naturalHeight : 1;
            const initialWidth = 200;

            calculateContentDimensions(url).then(({ contentWidthRatio, contentHeightRatio }) => {
                resolve({
                    url: url,
                    width: initialWidth,
                    height: initialWidth / aspectRatio,
                    rotation: 0,
                    contentWidthRatio,
                    contentHeightRatio,
                });
            }).catch(reject);
        };
        img.onerror = () => reject(new Error('Failed to load generated artwork image.'));
        img.src = url;
    });
  };

  const handleGenerate = async (prompt: string, style: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const artworkUrl = await generateTshirtArtwork(prompt, style, setLoadingMessage);
      const newArtwork = await getArtworkWithDimensions(artworkUrl);
      const newArtworkWithPosition = { ...newArtwork, x: 150, y: 100 };
      
      setGeneratedArtwork(newArtworkWithPosition);
      setTextElements([]);
      commitToHistory(newArtworkWithPosition, []);

      setSelectedElement({type: 'artwork'});
      setMode('editor');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate artwork. ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleStartOver = () => {
    setHistory([]);
    setHistoryIndex(-1);
    setMockupUrl(null);
    setError(null);
    setMode('editor');
    setSelectedElement(null);
  };
  
  const handleDownloadArtwork = () => {
      if (!generatedArtwork) {
          return;
      }

      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
              setError('Could not create a canvas to process the image for download.');
              return;
          }

          const { rotation } = generatedArtwork;
          const originalWidth = image.naturalWidth;
          const originalHeight = image.naturalHeight;
          const angleRad = rotation * (Math.PI / 180);

          // Calculate the bounding box of the rotated image to set canvas size
          const cos = Math.abs(Math.cos(angleRad));
          const sin = Math.abs(Math.sin(angleRad));
          const newWidth = Math.ceil(originalWidth * cos + originalHeight * sin);
          const newHeight = Math.ceil(originalWidth * sin + originalHeight * cos);

          canvas.width = newWidth;
          canvas.height = newHeight;

          // Move the rotation point to the center of the canvas
          ctx.translate(newWidth / 2, newHeight / 2);
          // Rotate the canvas
          ctx.rotate(angleRad);
          // Draw the image, centered on the new rotation point
          ctx.drawImage(image, -originalWidth / 2, -originalHeight / 2, originalWidth, originalHeight);
          
          const link = document.createElement('a');
          link.download = `t-shirt-design-${Date.now()}.png`;
          link.href = canvas.toDataURL('image/png');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      };
      image.onerror = (err) => {
          console.error("Failed to load artwork for download:", err);
          setError("Could not download the artwork. The image might be unavailable.");
      };
      
      // The generatedArtwork.url contains the full-resolution image data
      image.src = generatedArtwork.url;
  };

    const handleDownloadCompositeImage = async () => {
        if (!mockupUrl || !designSurfaceRef.current) {
            alert("Please select a T-shirt mockup first.");
            return;
        }

        setIsDownloading(true);
        setError(null);

        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Could not create canvas context.');
            }

            const designSurface = designSurfaceRef.current;
            const designSurfaceRect = designSurface.getBoundingClientRect();

            // Load all images first
            const mockupImg = new Image();
            mockupImg.crossOrigin = 'anonymous';
            const mockupPromise = new Promise<HTMLImageElement>((res, rej) => {
                mockupImg.onload = () => res(mockupImg);
                mockupImg.onerror = () => rej(new Error('Failed to load mockup image.'));
                mockupImg.src = mockupUrl;
            });

            let artworkPromise: Promise<HTMLImageElement | null> = Promise.resolve(null);
            if (generatedArtwork) {
                const artworkImg = new Image();
                artworkImg.crossOrigin = 'anonymous';
                artworkPromise = new Promise<HTMLImageElement>((res, rej) => {
                    artworkImg.onload = () => res(artworkImg);
                    artworkImg.onerror = () => rej(new Error('Failed to load artwork image.'));
                    artworkImg.src = generatedArtwork.url;
                });
            }

            const [loadedMockup, loadedArtwork] = await Promise.all([mockupPromise, artworkPromise]);

            canvas.width = loadedMockup.naturalWidth;
            canvas.height = loadedMockup.naturalHeight;

            // --- Calculate Correct Scaling for object-contain ---
            const containerWidth = designSurfaceRect.width;
            const containerHeight = designSurfaceRect.height;
            const containerAspectRatio = containerWidth / containerHeight;

            const imageAspectRatio = loadedMockup.naturalWidth / loadedMockup.naturalHeight;

            let displayWidth, displayHeight;
            if (imageAspectRatio > containerAspectRatio) {
                displayWidth = containerWidth;
                displayHeight = containerWidth / imageAspectRatio;
            } else {
                displayHeight = containerHeight;
                displayWidth = containerHeight * imageAspectRatio;
            }
            
            const scaleX = loadedMockup.naturalWidth / displayWidth;
            const scaleY = loadedMockup.naturalHeight / displayHeight;

            const offsetX = (containerWidth - displayWidth) / 2;
            const offsetY = (containerHeight - displayHeight) / 2;
            
            ctx.drawImage(loadedMockup, 0, 0, canvas.width, canvas.height);

            if (generatedArtwork && loadedArtwork) {
                const art = generatedArtwork;
                const artX_relative = art.x - offsetX;
                const artY_relative = art.y - offsetY;

                const finalCenterX = (artX_relative + art.width / 2) * scaleX;
                const finalCenterY = (artY_relative + art.height / 2) * scaleY;
                const finalWidth = art.width * scaleX;
                const finalHeight = art.height * scaleY;

                ctx.save();
                ctx.translate(finalCenterX, finalCenterY);
                ctx.rotate(art.rotation * Math.PI / 180);
                ctx.drawImage(loadedArtwork, -finalWidth / 2, -finalHeight / 2, finalWidth, finalHeight);
                ctx.restore();
            }

            textElements.forEach(text => {
                ctx.save();
                
                const textX_relative = text.x - offsetX;
                const textY_relative = text.y - offsetY;
                
                const textCenterX = (textX_relative + text.width / 2) * scaleX;
                const textCenterY = (textY_relative + (text.fontSize * 1.1) / 2) * scaleY;

                ctx.translate(textCenterX, textCenterY);
                ctx.rotate(text.rotation * Math.PI / 180);
                ctx.translate(-textCenterX, -textCenterY);

                const scaledFontSize = text.fontSize * scaleY;
                ctx.font = `${text.fontWeight} ${scaledFontSize}px ${text.fontFamily}`;
                ctx.fillStyle = text.color;
                ctx.textAlign = text.textAlign;
                ctx.textBaseline = 'top';

                let finalX = textX_relative * scaleX;
                if (text.textAlign === 'center') {
                    finalX = (textX_relative + text.width / 2) * scaleX;
                } else if (text.textAlign === 'right') {
                    finalX = (textX_relative + text.width) * scaleX;
                }
                const finalY = textY_relative * scaleY;

                if (text.textEffect === 'shadow') {
                    ctx.shadowColor = 'rgba(0,0,0,0.5)';
                    ctx.shadowOffsetX = 2 * scaleX;
                    ctx.shadowOffsetY = 2 * scaleY;
                    ctx.shadowBlur = 5 * Math.min(scaleX, scaleY);
                } else if (text.textEffect === 'outline') {
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2 * Math.min(scaleX, scaleY);
                    ctx.strokeText(text.content, finalX, finalY);
                }
                
                ctx.fillText(text.content, finalX, finalY);
                ctx.restore();
            });

            const link = document.createElement('a');
            link.download = `t-shirt-design-composite-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();

        } catch (error) {
            console.error("Failed to create and download composite image:", error);
            setError(error instanceof Error ? error.message : "Could not download the T-shirt image. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };

  const handleMockupUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setMockupUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSelectFromCollection = (url: string) => {
    setMockupUrl(url);
    setIsCollectionModalOpen(false);
  };

  const handleAddText = () => {
      const newText: TextElement = {
          id: Date.now(),
          content: 'Your Text',
          x: 50,
          y: 50,
          width: 200,
          fontSize: 48,
          color: '#FFFFFF',
          fontWeight: 'normal',
          textAlign: 'left',
          rotation: 0,
          fontFamily: "'Roboto', sans-serif",
          textEffect: 'none',
      };
      const newTextElements = [...textElements, newText];
      setTextElements(newTextElements);
      setSelectedElement({type: 'text', id: newText.id});
      commitToHistory(generatedArtwork, newTextElements);
  };

  const getElementProps = (element: SelectedElement) => {
    if (!element) return null;
    if (element.type === 'artwork' && generatedArtwork) return generatedArtwork;
    if (element.type === 'text') return textElements.find(t => t.id === element.id);
    return null;
  }
  
  const updateElementProps = (element: SelectedElement, props: Partial<Artwork> | Partial<TextElement>) => {
      if (!element) return;
      if (element.type === 'artwork' && generatedArtwork) {
          setGeneratedArtwork({ ...generatedArtwork, ...(props as Partial<Artwork>) });
      } else if (element.type === 'text') {
          setTextElements(prev => prev.map(t => t.id === element.id ? { ...t, ...(props as Partial<TextElement>) } : t));
      }
  };

    const handleDeleteSelectedElement = () => {
        if (!selectedElement) return;
        let newArtwork = generatedArtwork;
        let newTextElements = textElements;

        if (selectedElement.type === 'artwork') {
            newArtwork = null;
        } else if (selectedElement.type === 'text') {
            newTextElements = textElements.filter(t => t.id !== selectedElement.id);
        }
        
        setSelectedElement(null); // Deselect after deleting
        setGeneratedArtwork(newArtwork);
        setTextElements(newTextElements);
        commitToHistory(newArtwork, newTextElements);
    };


  const handleDragPointerDown = (e: PointerEvent<HTMLDivElement>, element: SelectedElement) => {
      if (mode === 'preview') return;
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      const currentElement = getElementProps(element);
      const designSurfaceRect = designSurfaceRef.current?.getBoundingClientRect();
      if (!currentElement || !designSurfaceRect) return;

      setInteractionState({
          type: 'drag',
          element,
          offsetX: (e.clientX - designSurfaceRect.left) - currentElement.x,
          offsetY: (e.clientY - designSurfaceRect.top) - currentElement.y,
      });
      setSelectedElement(element);
  };

  // FIX: The original conditional type was incorrect and resolved to `never`.
  // Replaced with `Extract` to correctly derive the `direction` type from `InteractionState`.
  const handleResizePointerDown = (e: PointerEvent<HTMLDivElement>, element: SelectedElement, direction: Extract<InteractionState, { type: 'resize' }>['direction']) => {
      if (mode === 'preview') return;
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      const currentElement = getElementProps(element);
      if (!currentElement) return;

      const isText = element?.type === 'text';

      setInteractionState({
          type: 'resize',
          direction,
          element,
          elementX: currentElement.x,
          elementY: currentElement.y,
          startWidth: currentElement.width,
          startHeight: 'height' in currentElement ? currentElement.height : 0,
          startFontSize: isText ? (currentElement as TextElement).fontSize : undefined,
          aspectRatio: 'height' in currentElement && currentElement.height > 0 ? currentElement.width / currentElement.height : 1,
          startPointer: { x: e.clientX, y: e.clientY },
      });
  };
  
  const handleRotatePointerDown = (e: PointerEvent<HTMLDivElement>, element: SelectedElement) => {
      if (mode === 'preview') return;
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      const currentElement = getElementProps(element);
      const designSurfaceRect = designSurfaceRef.current?.getBoundingClientRect();
      if (!currentElement || !designSurfaceRect) return;

      const centerX = designSurfaceRect.left + currentElement.x + currentElement.width / 2;
      const centerY = designSurfaceRect.top + currentElement.y + ('height' in currentElement ? currentElement.height / 2 : (currentElement as TextElement).fontSize * 1.1 / 2);

      const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
      
      setInteractionState({
          type: 'rotate',
          element,
          centerX,
          centerY,
          startAngle,
          initialRotation: currentElement.rotation,
      });
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
      if (!interactionState) return;
      e.preventDefault();

      switch (interactionState.type) {
          case 'drag': {
              const designSurfaceRect = designSurfaceRef.current?.getBoundingClientRect();
              if (!designSurfaceRect) return;
              const newX = e.clientX - designSurfaceRect.left - interactionState.offsetX;
              const newY = e.clientY - designSurfaceRect.top - interactionState.offsetY;
              updateElementProps(interactionState.element, { x: newX, y: newY });
              break;
          }
          case 'resize': {
              const dx = e.clientX - interactionState.startPointer.x;
              const dy = e.clientY - interactionState.startPointer.y;

              const elementProps = getElementProps(interactionState.element);
              if (!elementProps) break;

              const rad = elementProps.rotation * Math.PI / 180;
              const cos = Math.cos(rad);
              const sin = Math.sin(rad);

              const dx_local = dx * cos + dy * sin;
              const dy_local = -dx * sin + dy * cos;

              const { element, direction, startWidth, startHeight, elementX, elementY, aspectRatio, startFontSize } = interactionState;

              switch (direction) {
                  case 'se': { // Proportional resize (bottom-right)
                      const newWidth = Math.max(20, startWidth + dx_local);
                      if (element?.type === 'artwork') {
                          const newHeight = newWidth / aspectRatio;
                          updateElementProps(element, { width: newWidth, height: newHeight });
                      } else if (element?.type === 'text' && startFontSize) {
                          const scale = newWidth / startWidth;
                          const newFontSize = Math.max(8, startFontSize * scale);
                          updateElementProps(element, { width: newWidth, fontSize: newFontSize });
                      }
                      break;
                  }
                  case 'e': { // Stretch right
                      const newWidth = Math.max(20, startWidth + dx_local);
                      const dw = newWidth - startWidth;
                      const newX = elementX + (dw / 2) * cos;
                      const newY = elementY + (dw / 2) * sin;
                      updateElementProps(element, { width: newWidth, x: newX, y: newY });
                      break;
                  }
                  case 'w': { // Stretch left
                      const newWidth = Math.max(20, startWidth - dx_local);
                      const dw = newWidth - startWidth;
                      const newX = elementX + (dw / 2) * cos;
                      const newY = elementY + (dw / 2) * sin;
                      updateElementProps(element, { width: newWidth, x: newX, y: newY });
                      break;
                  }
                  case 's': { // Stretch down (artwork only)
                      if (element?.type === 'artwork') {
                          const newHeight = Math.max(20, startHeight + dy_local);
                          const dh = newHeight - startHeight;
                          const newX = elementX + (dh / 2) * -sin;
                          const newY = elementY + (dh / 2) * cos;
                          updateElementProps(element, { height: newHeight, x: newX, y: newY });
                      }
                      break;
                  }
              }
              break;
          }
          case 'rotate': {
              const currentAngle = Math.atan2(e.clientY - interactionState.centerY, e.clientX - interactionState.centerX) * (180 / Math.PI);
              const newRotation = interactionState.initialRotation + (currentAngle - interactionState.startAngle);
              updateElementProps(interactionState.element, { rotation: newRotation });
              break;
          }
      }
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
      if (!interactionState) return;
      // Commit final state after interaction ends
      commitToHistory(generatedArtwork, textElements);
      setInteractionState(null);
  };
  
  const updateSelectedText = (props: Partial<TextElement>) => {
      if (selectedElement?.type !== 'text') return;
      const newTextElements = textElements.map(t => t.id === selectedElement.id ? { ...t, ...props } : t);
      setTextElements(newTextElements);
      commitToHistory(generatedArtwork, newTextElements);
  };

    const handleSaveArtwork = () => {
        if (!generatedArtwork) return;

        const newArtworkToSave: SavedArtwork = {
            id: `${Date.now()}`,
            url: generatedArtwork.url,
            contentWidthRatio: generatedArtwork.contentWidthRatio,
            contentHeightRatio: generatedArtwork.contentHeightRatio,
            savedAt: Date.now(),
        };

        const updatedArtworks = [...myArtworks, newArtworkToSave];
        setMyArtworks(updatedArtworks);
        localStorage.setItem('ai-tshirt-designer-collection', JSON.stringify(updatedArtworks));
    };

    const handleLoadArtwork = (savedArtwork: SavedArtwork) => {
        const aspectRatio = (savedArtwork.contentWidthRatio / savedArtwork.contentHeightRatio) || 1;
        const initialWidth = 200;

        const newArtwork: Artwork = {
            url: savedArtwork.url,
            contentWidthRatio: savedArtwork.contentWidthRatio,
            contentHeightRatio: savedArtwork.contentHeightRatio,
            x: 150,
            y: 100,
            width: initialWidth,
            height: initialWidth / aspectRatio,
            rotation: 0,
        };

        setGeneratedArtwork(newArtwork);
        setTextElements([]);
        commitToHistory(newArtwork, []);
        setSelectedElement({ type: 'artwork' });
        setIsMyArtworksModalOpen(false);
    };

    const handleDeleteArtwork = (artworkId: string) => {
        const updatedArtworks = myArtworks.filter(art => art.id !== artworkId);
        setMyArtworks(updatedArtworks);
        localStorage.setItem('ai-tshirt-designer-collection', JSON.stringify(updatedArtworks));
    };
  
  const renderSelectableElement = (elementType: 'artwork' | 'text', element: Artwork | TextElement) => {
    const isSelected = (selectedElement?.type === 'artwork' && elementType === 'artwork') || (selectedElement?.type === 'text' && elementType === 'text' && 'id' in element && selectedElement.id === element.id);
    const elementIdentifier = elementType === 'artwork' ? { type: 'artwork' as const } : { type: 'text' as const, id: (element as TextElement).id };
    const height = 'height' in element ? element.height : 'auto';
    const isEditing = elementType === 'text' && editingTextId === (element as TextElement).id;
    
    const textElementStyles = 'fontFamily' in element ? {
        fontFamily: element.fontFamily,
        ...getTextEffectStyle(element.textEffect)
    } : {};

    return (
        <div
            key={elementType === 'text' ? (element as TextElement).id : 'artwork'}
            className={`absolute group ${mode === 'editor' && !isEditing ? 'cursor-grab active:cursor-grabbing' : ''} ${mode === 'preview' ? 'pointer-events-none' : ''}`}
            style={{
                left: `${element.x}px`,
                top: `${element.y}px`,
                width: `${element.width}px`,
                height: typeof height === 'number' ? `${height}px` : height,
                transform: `rotate(${element.rotation}deg)`,
                transformOrigin: 'center center',
            }}
            onDoubleClick={() => {
                if(elementType === 'text' && mode === 'editor') {
                    setSelectedElement(elementIdentifier);
                    setEditingTextId((element as TextElement).id);
                }
            }}
        >
            <div
                onPointerDown={(e) => !isEditing && handleDragPointerDown(e, elementIdentifier)}
                className={`w-full h-full p-1 outline-none ${isSelected && !isEditing && mode === 'editor' ? 'outline-2 outline-dashed outline-blue-500' : ''} ${isEditing ? 'outline-2 outline-dashed outline-blue-500' : ''}`}
                style={{
                  textAlign: 'textAlign' in element ? element.textAlign : 'left',
                  fontWeight: 'fontWeight' in element ? element.fontWeight : 'normal',
                  fontSize: 'fontSize' in element ? `${element.fontSize}px` : undefined,
                  color: 'color' in element ? element.color : undefined,
                  lineHeight: 1.1,
                  ...textElementStyles,
                }}
            >
                {elementType === 'artwork' ? (
                    <img src={(element as Artwork).url} alt="Generated Artwork" className="w-full h-full pointer-events-none" draggable="false" />
                ) : isEditing ? (
                    <EditableText
                        element={element as TextElement}
                        onUpdate={(props) => updateElementProps(elementIdentifier, props)}
                        onCommit={() => commitToHistory(generatedArtwork, textElements)}
                        onEndEditing={() => setEditingTextId(null)}
                    />
                ) : (
                    <span className="pointer-events-none select-none">{(element as TextElement).content}</span>
                )}
            </div>
            
            {isSelected && !isEditing && mode === 'editor' && (
                <>
                    {/* Rotation Handle */}
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-px h-3 bg-blue-500 group-hover:bg-blue-300 transition-colors"></div>
                    <div 
                        onPointerDown={(e) => handleRotatePointerDown(e, elementIdentifier)}
                        className="absolute -top-7 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-blue-500 border-2 border-gray-900 cursor-alias group-hover:bg-blue-300 transition-colors"
                    ></div>
                    {/* Resize Handles */}
                    <div 
                        onPointerDown={(e) => handleResizePointerDown(e, elementIdentifier, 'se')}
                        className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-blue-500 border-2 border-gray-900 cursor-se-resize group-hover:bg-blue-300 transition-colors"
                        title="Resize proportionally"
                    ></div>
                    <div 
                        onPointerDown={(e) => handleResizePointerDown(e, elementIdentifier, 'e')}
                        className="absolute top-1/2 -right-2 -translate-y-1/2 w-4 h-4 rounded-full bg-blue-500 border-2 border-gray-900 cursor-ew-resize group-hover:bg-blue-300 transition-colors"
                        title="Resize horizontally"
                    ></div>
                    <div 
                        onPointerDown={(e) => handleResizePointerDown(e, elementIdentifier, 'w')}
                        className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-4 rounded-full bg-blue-500 border-2 border-gray-900 cursor-ew-resize group-hover:bg-blue-300 transition-colors"
                        title="Resize horizontally"
                    ></div>
                    {elementType === 'artwork' && (
                       <div 
                           onPointerDown={(e) => handleResizePointerDown(e, elementIdentifier, 's')}
                           className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-blue-500 border-2 border-gray-900 cursor-ns-resize group-hover:bg-blue-300 transition-colors"
                           title="Resize vertically"
                       ></div>
                    )}
                </>
            )}
        </div>
    );
  };

  const renderContent = () => {
    // Hiển thị trang đăng nhập API key nếu chưa có API key hoặc người dùng muốn thay đổi API key
    if (!hasApiKey || showApiKeyScreen) {
      return (
        <ApiKeyLogin onApiKeySubmit={(apiKey) => {
          localStorage.setItem('gemini-api-key', apiKey);
          setHasApiKey(true);
          setShowApiKeyScreen(false);
        }} />
      );
    }
    
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 animate-fade-in">
            <Spinner />
            <p className="text-gray-300 text-lg">{loadingMessage || 'AI is creating your masterpiece...'}</p>
        </div>
      );
    }
    
    if (error) {
      // Kiểm tra loại lỗi để hiển thị các tùy chọn phù hợp
      const isBilledUserError = error.includes('billed users') || error.includes('Imagen API');
      const isPermissionError = error.includes('permission') || error.includes('Permission') || error.includes('access');
      const isApiConfigError = error.includes('API key') || error.includes('Vertex AI API') || error.includes('Google Cloud');
      
      return (
        <div className="text-center animate-fade-in bg-red-500/10 border border-red-500/20 p-8 rounded-lg max-w-2xl mx-auto flex flex-col items-center gap-4">
          <h2 className="text-2xl font-bold text-red-300">Đã xảy ra lỗi</h2>
          <p className="text-md text-red-400 whitespace-pre-line">{error}</p>
          
          {(isBilledUserError || isPermissionError || isApiConfigError) ? (
            <div className="flex flex-col gap-3 mt-2">
              <a 
                href="https://console.cloud.google.com/apis/library/aiplatform.googleapis.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg text-md transition-colors"
              >
                Kích hoạt Vertex AI API
              </a>
              <a 
                href="https://aistudio.google.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg text-md transition-colors"
              >
                Sử dụng Google AI Studio
              </a>
              <button
                onClick={() => setShowApiKeyScreen(true)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg text-md transition-colors"
              >
                Thay đổi API Key
              </button>
              <button
                onClick={() => { setError(null); handleStartOver(); }}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg text-md transition-colors"
              >
                Bắt đầu lại
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setError(null); handleStartOver(); }}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg text-md transition-colors"
            >
              Bắt đầu lại
            </button>
          )}
        </div>
      );
    }
    
    if (!generatedArtwork) {
      return <StartScreen onGenerate={handleGenerate} isLoading={isLoading} />;
    }

    const isTextSelected = selectedElement?.type === 'text';
    const selectedText = isTextSelected ? textElements.find(t => t.id === selectedElement.id) : null;
    const isCurrentArtworkSaved = generatedArtwork ? myArtworks.some(art => art.url === generatedArtwork.url) : false;

    return (
      <div className="w-full h-full flex flex-col lg:flex-row gap-6 animate-fade-in p-4">
        {/* Mockup Canvas */}
        <div 
          className={`h-[55vh] lg:h-auto lg:flex-1 bg-gray-900/50 rounded-lg flex items-center justify-center relative overflow-hidden transition-all duration-300 ease-in-out lg:self-start ${mode === 'preview' ? 'border-2 border-transparent' : 'border-2 border-dashed border-gray-700'}`}
          onPointerDown={() => {
              if (editingTextId === null) {
                  setSelectedElement(null)
              }
           }}
        >
          <div
            ref={designSurfaceRef}
            className="relative w-full h-full"
            style={{ maxWidth: '500px', aspectRatio: '4 / 5', touchAction: 'none' }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {mockupUrl ? (
              <img src={mockupUrl} alt="T-Shirt Mockup" className="w-full h-full object-contain pointer-events-none" />
            ) : (
              <div className="text-center text-gray-500 w-full h-full flex items-center justify-center bg-gray-800/50 border border-gray-700 rounded-md pointer-events-none">
                  <p>Upload a T-shirt photo or choose one from the collection!</p>
              </div>
            )}
            {generatedArtwork && renderSelectableElement('artwork', generatedArtwork)}
            {textElements.map(text => renderSelectableElement('text', text))}
          </div>
        </div>

        {/* Control Panel */}
        {mode === 'editor' && (
            <div className="w-full lg:w-96 flex-shrink-0 bg-gray-800/80 border border-gray-700 rounded-lg p-4 flex flex-col gap-4 backdrop-blur-sm self-start animate-fade-in flex-1 lg:flex-none min-h-0 overflow-y-auto">
                <h2 className="text-xl font-bold text-center">Customize Your Design</h2>
                
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleStartOver} className="w-full text-center bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-4 rounded-md transition-all hover:bg-white/20 text-sm">New Design</button>
                    <button onClick={handleDownloadArtwork} className="w-full bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-3 px-4 rounded-md transition-all shadow-lg hover:shadow-xl text-sm">Download Art</button>
                </div>
                
                {isCurrentArtworkSaved ? (
                    <button disabled className="w-full flex items-center justify-center gap-2 bg-purple-500/50 text-white font-semibold py-3 px-5 rounded-md transition-all cursor-default">
                        <BookmarkIcon className="w-5 h-5" /> Saved to My Artworks
                    </button>
                ) : (
                    <button onClick={handleSaveArtwork} className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 px-5 rounded-md transition-all shadow-lg hover:shadow-xl">
                        <BookmarkIcon className="w-5 h-5" /> Save Artwork to Collection
                    </button>
                )}

                <button
                    onClick={handleDownloadCompositeImage}
                    disabled={!mockupUrl || isDownloading}
                    className="w-full bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-3 px-5 rounded-md transition-all shadow-lg hover:shadow-xl disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed"
                >
                    {isDownloading ? 'Downloading...' : 'Download T-Shirt & Artwork'}
                </button>

                <div className="w-full h-px bg-gray-600 my-2"></div>

                <div className="grid grid-cols-2 gap-2">
                    <label htmlFor="mockup-upload" className="w-full flex items-center justify-center gap-2 cursor-pointer bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-4 rounded-md transition-all hover:bg-white/20 text-sm">
                      <UploadIcon className="w-5 h-5" /> Upload T-Shirt
                    </label>
                    <button onClick={() => setIsCollectionModalOpen(true)} className="w-full flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-4 rounded-md transition-all hover:bg-white/20 text-sm">
                      <CollectionIcon className="w-5 h-5" /> From Collection
                    </button>
                </div>
                <input id="mockup-upload" type="file" accept="image/*" className="hidden" onChange={handleMockupUpload}/>

                <button onClick={() => setIsMyArtworksModalOpen(true)} className="w-full flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-5 rounded-md transition-all hover:bg-white/20">
                    <FolderIcon className="w-5 h-5" /> My Artworks
                </button>
                
                <button onClick={handleAddText} className="w-full flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-5 rounded-md transition-all hover:bg-white/20">
                    <TextIcon className="w-5 h-5" /> Add Text
                </button>
                
                <div className="w-full h-px bg-gray-600 my-2"></div>
                
                {selectedElement && (
                    <button
                        onClick={handleDeleteSelectedElement}
                        className="w-full flex items-center justify-center gap-2 bg-red-500/20 border border-red-500/30 text-red-300 font-semibold py-3 px-5 rounded-md transition-all hover:bg-red-500/30 animate-fade-in"
                    >
                        <TrashIcon className="w-5 h-5" /> Delete Selected
                    </button>
                )}
                
                {selectedElement?.type === 'artwork' && generatedArtwork && (
                    <div className="flex flex-col gap-3 animate-fade-in pt-2 border-t border-gray-700 mt-3">
                        <h3 className="font-semibold">Artwork Properties</h3>
                        <div className="text-sm text-gray-400 bg-gray-700/50 p-3 rounded-md">
                            <div className="flex justify-between">
                                <span>Width:</span>
                                <span className="font-mono">{(generatedArtwork.width * generatedArtwork.contentWidthRatio * PIXELS_TO_MM).toFixed(0)} mm</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Height:</span>
                                <span className="font-mono">{(generatedArtwork.height * generatedArtwork.contentHeightRatio * PIXELS_TO_MM).toFixed(0)} mm</span>
                            </div>
                        </div>
                         <p className="text-center text-gray-400 text-xs pt-2">
                            Use the handles on the artwork to resize and rotate.
                        </p>
                    </div>
                )}
                
                {isTextSelected && selectedText && (
                    <div className="flex flex-col gap-3 animate-fade-in pt-2">
                        <h3 className="font-semibold">Text Properties</h3>
                        <div className="text-sm text-gray-400 bg-gray-700/50 p-3 rounded-md mb-3">
                            <div className="flex justify-between">
                                <span>Approx. Width:</span>
                                <span className="font-mono">{(selectedText.width * PIXELS_TO_MM).toFixed(0)} mm</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Approx. Height:</span>
                                <span className="font-mono">{(selectedText.fontSize * 1.1 * PIXELS_TO_MM).toFixed(0)} mm</span>
                            </div>
                        </div>

                        <input type="text" value={selectedText.content} onChange={e => updateSelectedText({ content: e.target.value })} className="bg-gray-700 p-2 rounded-md" />
                        
                        <div className="grid grid-cols-2 gap-2">
                            <select value={selectedText.fontFamily} onChange={e => updateSelectedText({ fontFamily: e.target.value })} className="bg-gray-700 p-2 rounded-md appearance-none text-center">
                                {fonts.map(font => <option key={font.name} value={font.value} style={{ fontFamily: font.value }}>{font.name}</option>)}
                            </select>
                            <button onClick={() => updateSelectedText({ fontWeight: selectedText.fontWeight === 'bold' ? 'normal' : 'bold' })} className={`flex items-center justify-center gap-2 p-2 rounded-md transition-colors ${selectedText.fontWeight === 'bold' ? 'bg-blue-500 text-white' : 'bg-gray-700'}`}>
                              <BoldIcon className="w-5 h-5" /> Bold
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-400">Font Size</label>
                            <input type="range" min="12" max="150" value={selectedText.fontSize} onChange={e => updateSelectedText({ fontSize: parseInt(e.target.value) })} className="w-full"/>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-400">Color</label>
                            <input type="color" value={selectedText.color} onChange={e => updateSelectedText({ color: e.target.value })} className="bg-gray-700 w-full h-10 p-1 rounded-md"/>
                        </div>
                        
                        <div className="flex items-center gap-2">
                           <label className="text-sm text-gray-400 mr-2">Align</label>
                           <div className="flex-grow grid grid-cols-3 gap-1 bg-gray-700 p-1 rounded-md">
                              <button onClick={() => updateSelectedText({textAlign: 'left'})} className={`p-1.5 rounded ${selectedText.textAlign === 'left' ? 'bg-blue-500' : 'hover:bg-gray-600'}`}><TextAlignLeftIcon className="w-5 h-5 mx-auto" /></button>
                              <button onClick={() => updateSelectedText({textAlign: 'center'})} className={`p-1.5 rounded ${selectedText.textAlign === 'center' ? 'bg-blue-500' : 'hover:bg-gray-600'}`}><TextAlignCenterIcon className="w-5 h-5 mx-auto" /></button>
                              <button onClick={() => updateSelectedText({textAlign: 'right'})} className={`p-1.5 rounded ${selectedText.textAlign === 'right' ? 'bg-blue-500' : 'hover:bg-gray-600'}`}><TextAlignRightIcon className="w-5 h-5 mx-auto" /></button>
                           </div>
                        </div>
                         <div className="flex items-center gap-2">
                           <label className="text-sm text-gray-400 mr-2">Effect</label>
                           <div className="flex-grow grid grid-cols-3 gap-1 bg-gray-700 p-1 rounded-md text-sm">
                              <button onClick={() => updateSelectedText({textEffect: 'none'})} className={`p-1.5 rounded ${selectedText.textEffect === 'none' ? 'bg-blue-500' : 'hover:bg-gray-600'}`}>None</button>
                              <button onClick={() => updateSelectedText({textEffect: 'shadow'})} className={`p-1.5 rounded ${selectedText.textEffect === 'shadow' ? 'bg-blue-500' : 'hover:bg-gray-600'}`}>Shadow</button>
                              <button onClick={() => updateSelectedText({textEffect: 'outline'})} className={`p-1.5 rounded ${selectedText.textEffect === 'outline' ? 'bg-blue-500' : 'hover:bg-gray-600'}`}>Outline</button>
                           </div>
                        </div>
                    </div>
                )}
                {!selectedElement && <p className="text-center text-gray-400 text-sm pt-2">Click on an element on the mockup to edit its properties.</p>}
            </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="min-h-screen text-gray-100 flex flex-col">
      <Header>
                  {hasApiKey && (
                    <button
                      onClick={() => setShowApiKeyScreen(true)}
                      className="px-3 py-1 text-sm rounded-md bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                    >
                      Change API Key
                    </button>
                  )}
                </Header>
      {generatedArtwork && !isLoading && !error && (
        <div className="flex justify-center py-4 px-4">
            <div className="bg-gray-800/80 border border-gray-700 rounded-full p-1 flex items-center gap-1 backdrop-blur-sm">
                <button
                    onClick={undo}
                    disabled={!canUndo}
                    className="p-2 rounded-full text-gray-300 transition-colors hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    aria-label="Undo"
                >
                    <UndoIcon className="w-5 h-5" />
                </button>
                 <button
                    onClick={redo}
                    disabled={!canRedo}
                    className="p-2 rounded-full text-gray-300 transition-colors hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    aria-label="Redo"
                >
                    <RedoIcon className="w-5 h-5" />
                </button>
                
                <div className="w-px h-6 bg-gray-600 mx-1"></div>
                
                <button
                    onClick={() => setMode('editor')}
                    className={`px-4 sm:px-6 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-2 ${mode === 'editor' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-300 hover:bg-white/10'}`}
                    aria-pressed={mode === 'editor'}
                >
                    <PencilIcon className="w-5 h-5" />
                    Editor
                </button>
                <button
                    onClick={() => setMode('preview')}
                    className={`px-4 sm:px-6 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-2 ${mode === 'preview' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-300 hover:bg-white/10'}`}
                    aria-pressed={mode === 'preview'}
                >
                    <EyeIcon className="w-5 h-5" />
                    Preview
                </button>
            </div>
        </div>
      )}
      <main className={`flex-grow w-full max-w-[1600px] mx-auto ${generatedArtwork ? 'flex' : 'grid place-items-center'}`}>
        {renderContent()}
      </main>
      <CollectionModal 
        isOpen={isCollectionModalOpen}
        onClose={() => setIsCollectionModalOpen(false)}
        onSelect={handleSelectFromCollection}
      />
       <MyArtworksModal
            isOpen={isMyArtworksModalOpen}
            artworks={myArtworks}
            onClose={() => setIsMyArtworksModalOpen(false)}
            onSelect={handleLoadArtwork}
            onDelete={handleDeleteArtwork}
        />
    </div>
  );
};

export default App;