import React, { useState, useRef, useEffect } from 'react';
import { X, Check, RotateCcw, RotateCw, FlipHorizontal, FlipVertical, Undo2, Loader2, Save } from 'lucide-react';

export default function ImageEditor({ media, url, onClose, onSave }) {
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(1);
  const [flipV, setFlipV] = useState(1);
  
  const [isSaving, setIsSaving] = useState(false);
  const imageRef = useRef(null);
  
  const handleReset = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setRotation(0);
    setFlipH(1);
    setFlipV(1);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const img = imageRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Calculate canvas size based on rotation
      const isRotated = Math.abs(rotation) % 180 === 90;
      canvas.width = isRotated ? img.naturalHeight : img.naturalWidth;
      canvas.height = isRotated ? img.naturalWidth : img.naturalHeight;
      
      // Translate to center
      ctx.translate(canvas.width / 2, canvas.height / 2);
      
      // Apply rotation
      ctx.rotate((rotation * Math.PI) / 180);
      
      // Apply flips
      ctx.scale(flipH, flipV);
      
      // Apply filters
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      
      // Draw image centered
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      
      // Extract Blob
      canvas.toBlob((blob) => {
        onSave(blob);
      }, media.file_type || 'image/jpeg', 0.95);
    } catch (err) {
      console.error('Failed to save edited image:', err);
      setIsSaving(false);
    }
  };

  const filterStyle = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
  const transformStyle = `rotate(${rotation}deg) scaleX(${flipH}) scaleY(${flipV})`;

  return (
    <div className="absolute inset-0 z-[200] bg-black/95 flex flex-col md:flex-row pointer-events-auto">
      {/* Main Image Preview Area */}
      <div className="flex-1 h-full p-8 flex items-center justify-center relative">
        <button 
          onClick={onClose}
          disabled={isSaving}
          className="absolute top-6 left-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50 disabled:opacity-50"
        >
          <X className="w-6 h-6" />
        </button>
        
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="absolute top-6 right-6 px-4 py-2 bg-primary hover:bg-primary/90 text-black font-bold rounded-lg flex items-center gap-2 transition-colors z-50 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {isSaving ? 'Saving...' : 'Save'}
        </button>

        <img
          ref={imageRef}
          src={url}
          crossOrigin="anonymous"
          alt="Edit Preview"
          style={{ filter: filterStyle, transform: transformStyle }}
          className="max-w-full max-h-full object-contain transition-transform duration-200"
        />
      </div>

      {/* Editor Controls Sidebar */}
      <div className="w-full md:w-80 bg-[#161616] border-l border-white/10 p-6 flex flex-col gap-8 h-1/3 md:h-full overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Edit Image</h2>
          <button 
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs font-bold text-white/50 hover:text-white uppercase tracking-wider"
          >
            <Undo2 className="w-3.5 h-3.5" /> Reset
          </button>
        </div>

        {/* Adjustments */}
        <div className="space-y-6">
          <h3 className="text-xs uppercase font-bold tracking-widest text-white/40">Adjustments</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <label className="text-white/80">Brightness</label>
              <span className="text-white/50">{brightness}%</span>
            </div>
            <input 
              type="range" min="0" max="200" value={brightness}
              onChange={(e) => setBrightness(e.target.value)}
              className="w-full accent-primary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <label className="text-white/80">Contrast</label>
              <span className="text-white/50">{contrast}%</span>
            </div>
            <input 
              type="range" min="0" max="200" value={contrast}
              onChange={(e) => setContrast(e.target.value)}
              className="w-full accent-primary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <label className="text-white/80">Saturation</label>
              <span className="text-white/50">{saturation}%</span>
            </div>
            <input 
              type="range" min="0" max="200" value={saturation}
              onChange={(e) => setSaturation(e.target.value)}
              className="w-full accent-primary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Transforms */}
        <div className="space-y-4">
          <h3 className="text-xs uppercase font-bold tracking-widest text-white/40">Transform</h3>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setRotation(r => r - 90)}
              className="flex flex-col items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              <span className="text-xs font-medium">Rotate Left</span>
            </button>
            <button 
              onClick={() => setRotation(r => r + 90)}
              className="flex flex-col items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-colors"
            >
              <RotateCw className="w-5 h-5" />
              <span className="text-xs font-medium">Rotate Right</span>
            </button>
            <button 
              onClick={() => setFlipH(f => f * -1)}
              className="flex flex-col items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-colors"
            >
              <FlipHorizontal className="w-5 h-5" />
              <span className="text-xs font-medium">Flip Horizontal</span>
            </button>
            <button 
              onClick={() => setFlipV(f => f * -1)}
              className="flex flex-col items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-colors"
            >
              <FlipVertical className="w-5 h-5" />
              <span className="text-xs font-medium">Flip Vertical</span>
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
