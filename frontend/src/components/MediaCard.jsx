import React, { memo } from 'react';
import { Play, Trash2, Eye, Image as ImageIcon, Film, Loader2, MoreVertical, CheckCircle2, Heart } from 'lucide-react';
import { formatBytes } from '../lib/formatters';

const MediaCard = function MediaCard({ media, user, onDelete, onClick, onShowInfo, isSelectionMode, isSelected, onToggleSelect, onToggleFavorite }) {
  const isVideo = (media.file_type || '').startsWith('video');
  const isProcessing = media.status === 'processing' || media.status === 'uploading';
  
  const getMediaUrl = (filename) => {
    // Append the file size or updated time as a cache buster so edited images show immediately
    const updated = media.size || new Date(media.created_at).getTime();
    return `http://localhost:3000/uploads/user_${user.id}/${filename}?v=${updated}`;
  };

  const uploadDate = media.created_at 
    ? new Date(media.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Just now';
    
  const uploadTime = media.created_at
    ? new Date(media.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : '';
    
  const formattedSize = formatBytes(media.size);

  if (isProcessing) {
    return (
      <div className="aspect-square bg-surface relative overflow-hidden rounded-xl border border-white/5 group">
        <div className="absolute inset-0 skeleton" />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-10">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
          <p className="text-xs font-heading uppercase tracking-widest text-primary font-medium drop-shadow-md">
            {media.status === 'uploading' ? 'Uploading...' : 'Transcoding...'}
          </p>
        </div>
        
        {/* Delete Button (visible on hover even while processing) */}
        {media.status !== 'uploading' && (
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(media.id); }}
            className="absolute top-4 left-4 z-20 p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  const handleClick = (e) => {
    if (isSelectionMode) {
      e.stopPropagation();
      onToggleSelect(media.id);
    } else {
      onClick(media);
    }
  };

  return (
    <div 
      className={`group relative aspect-square bg-surface rounded-xl overflow-hidden cursor-pointer transition-all duration-500 shadow-lg hover:shadow-2xl ${isSelected ? 'ring-4 ring-primary scale-[0.98]' : ''}`}
      onClick={handleClick}
    >
      {/* Background Image with Hover Scale */}
      <img 
        src={media.thumbnail ? getMediaUrl(media.thumbnail) : getMediaUrl(media.filename)} 
        alt={media.original_name}
        className={`w-full h-full object-cover transition-transform duration-700 ${!isSelectionMode && 'group-hover:scale-105'}`}
      />
      
      {/* Selection Overlay Tint */}
      {isSelected && (
        <div className="absolute inset-0 bg-primary/20 z-10 mix-blend-overlay" />
      )}

      {/* Persistent Badges */}
      <div className="absolute top-3 right-3 z-20 transition-opacity duration-300 group-hover:opacity-0 flex flex-col gap-2 items-end">
        <div className="bg-black/60 backdrop-blur-md p-1.5 rounded-md border border-white/10">
          {isVideo ? <Film className="w-4 h-4 text-white" /> : <ImageIcon className="w-4 h-4 text-white" />}
        </div>
        
        {/* Heart Icon (Persistent if favorited) */}
        {media.is_favorite && (
          <div className="bg-black/60 backdrop-blur-md p-1.5 rounded-md border border-white/10 shadow-sm">
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
          </div>
        )}
      </div>
      
      <div className="absolute bottom-3 left-3 z-20 transition-opacity duration-300 group-hover:opacity-0">
        <span className="bg-black/60 backdrop-blur-md px-2 py-1 rounded-md border border-white/10 text-[10px] font-heading uppercase tracking-widest text-white/90">
          {formattedSize}
        </span>
      </div>

      <div className="absolute bottom-3 right-3 z-20 transition-opacity duration-300 group-hover:opacity-0">
        <span className="bg-black/60 backdrop-blur-md px-2 py-1 rounded-md border border-white/10 text-[10px] font-heading uppercase tracking-widest text-white/90">
          {uploadDate}
        </span>
      </div>

      {/* Hover Overlay Background */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />

      {/* Selection Indicator Checkbox */}
      {isSelectionMode && (
        <div className="absolute top-3 left-3 z-30">
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shadow-lg ${
            isSelected 
              ? 'bg-primary border-primary text-black' 
              : 'bg-black/40 border-white/40 text-transparent hover:border-white'
          }`}>
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Hover Actions & Title (Hidden in Selection Mode) */}
      {!isSelectionMode && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 flex flex-col items-center justify-center p-4">
          {/* Top Left Delete Button */}
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(media.id); }}
            className="absolute top-3 left-3 p-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors shadow-lg"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>

        {/* Top Right Heart/Favorite Button */}
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(media.id, !media.is_favorite); }}
          className="absolute top-3 right-3 p-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors shadow-lg"
          title={media.is_favorite ? "Unfavorite" : "Favorite"}
        >
          <Heart className={`w-4 h-4 transition-colors ${media.is_favorite ? 'text-red-500 fill-red-500' : 'text-white'}`} />
        </button>

        {/* Center View/Play Button */}
        <button 
          onClick={() => onClick(media)}
          className="w-14 h-14 bg-primary text-black rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-110 transition-transform"
        >
          {isVideo ? <Play className="w-6 h-6 ml-1" /> : <Eye className="w-6 h-6" />}
        </button>

        {/* Filename sliding up from bottom */}
        <div className="absolute bottom-6 w-full px-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex justify-between items-center">
          <p className="text-sm text-white font-medium truncate text-center w-full pr-8">
            {media.original_name}
          </p>
          <button 
            onClick={(e) => { e.stopPropagation(); onShowInfo(media); }}
            className="p-2 -mr-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors shadow-lg"
            title="Info"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
        </div>
      )}
    </div>
  );
};

export default memo(MediaCard, (prevProps, nextProps) => {
  return (
    prevProps.media === nextProps.media &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isSelectionMode === nextProps.isSelectionMode
  );
});
