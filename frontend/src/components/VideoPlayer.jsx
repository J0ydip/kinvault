import { X, Heart } from 'lucide-react';

export default function VideoPlayer({ url, media, onClose, onToggleFavorite }) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl flex justify-between items-center mb-4 px-2">
        <h3 className="text-white font-medium text-lg truncate pr-4">{media?.original_name}</h3>
        <div className="flex items-center gap-4">
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(media.id, !media.is_favorite); }}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors shrink-0"
            title={media?.is_favorite ? "Unfavorite" : "Favorite"}
          >
            <Heart className={`w-6 h-6 transition-colors ${media?.is_favorite ? 'text-red-500 fill-red-500' : 'text-white'}`} />
          </button>
          <button 
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors shrink-0"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>
      <div className="w-full max-w-5xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl border border-white/10">
        <video 
          src={url} 
          controls 
          playsInline
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
}
