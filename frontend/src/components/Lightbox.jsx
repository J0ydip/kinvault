import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ImageEditor from './ImageEditor';
import api from '../lib/api';

export default function Lightbox({ images, currentIndex, onClose, onNavigate, onToggleFavorite, onMediaUpdated }) {
  const [isEditing, setIsEditing] = useState(false);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNavigate('next');
      if (e.key === 'ArrowLeft') onNavigate('prev');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNavigate]);

  if (currentIndex === null || !images[currentIndex]) return null;

  const currentMedia = images[currentIndex];

  const getMediaUrl = (filename) => {
    // Append a version timestamp to bust cache if it was updated recently
    const updated = new Date(currentMedia.updated_at || currentMedia.created_at).getTime();
    return `http://localhost:3000/uploads/user_${currentMedia.user_id}/${filename}?v=${updated}`;
  };

  const handleSaveEdit = async (blob) => {
    try {
      const formData = new FormData();
      formData.append('file', blob, currentMedia.original_name);
      
      const res = await api.post(`/media/${currentMedia.id}/edit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (onMediaUpdated) {
        onMediaUpdated(res.data.media);
      }
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save edit:', err);
      alert('Failed to save edited image.');
    }
  };

  if (isEditing) {
    return (
      <ImageEditor 
        media={currentMedia} 
        url={getMediaUrl(currentMedia.filename)} 
        onClose={() => setIsEditing(false)} 
        onSave={handleSaveEdit} 
      />
    );
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm"
      >
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(currentMedia.id, !currentMedia.is_favorite); }}
          className="absolute top-6 right-24 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50 pointer-events-auto"
          title={currentMedia.is_favorite ? "Unfavorite" : "Favorite"}
        >
          <Heart className={`w-6 h-6 transition-colors ${currentMedia.is_favorite ? 'text-red-500 fill-red-500' : 'text-white'}`} />
        </button>

        {!(currentMedia.file_type || '').startsWith('video') && (
          <button 
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            className="absolute top-6 right-40 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50 pointer-events-auto"
            title="Edit"
          >
            <Edit2 className="w-6 h-6" />
          </button>
        )}

        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50 pointer-events-auto"
        >
          <X className="w-6 h-6" />
        </button>

        {images.length > 1 && (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); onNavigate('prev'); }}
              className="absolute left-6 p-4 bg-white/5 hover:bg-white/20 rounded-full text-white transition-colors z-50 pointer-events-auto"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onNavigate('next'); }}
              className="absolute right-6 p-4 bg-white/5 hover:bg-white/20 rounded-full text-white transition-colors z-50 pointer-events-auto"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </>
        )}

        <div className="w-full h-full p-4 flex flex-col items-center justify-center pointer-events-none">
          <motion.img 
            key={currentMedia.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            src={getMediaUrl(currentMedia.filename)}
            alt={currentMedia.original_name}
            className="max-w-full max-h-[85vh] object-contain shadow-2xl rounded-sm pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="mt-4 text-center">
            <h3 className="text-white font-medium">{currentMedia.original_name}</h3>
            <p className="text-white/50 text-sm">{currentIndex + 1} of {images.length}</p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
