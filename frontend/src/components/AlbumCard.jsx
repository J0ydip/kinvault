import { Folder, MoreVertical, Trash2 } from 'lucide-react';

export default function AlbumCard({ album, user, onClick, onDelete }) {
  const getMediaUrl = (filename) => {
    return `http://localhost:3000/uploads/user_${user.id}/${filename}`;
  };

  const coverUrl = album.cover_thumbnail || album.cover_filename 
    ? getMediaUrl(album.cover_thumbnail || album.cover_filename)
    : null;

  return (
    <div 
      className="group relative aspect-square bg-surface rounded-xl overflow-hidden cursor-pointer transition-all duration-500 shadow-lg hover:shadow-2xl"
      onClick={() => onClick(album)}
    >
      {coverUrl ? (
        <img 
          src={coverUrl}
          alt={album.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-white/5 group-hover:bg-white/10 transition-colors">
          <Folder className="w-16 h-16 text-white/20" />
        </div>
      )}

      {/* Persistent Badge */}
      <div className="absolute top-3 right-3 z-20">
        <div className="bg-black/60 backdrop-blur-md px-2 py-1.5 rounded-md border border-white/10 flex items-center gap-2">
          <Folder className="w-4 h-4 text-white" />
          <span className="text-xs font-bold text-white">{album.media_count || 0}</span>
        </div>
      </div>

      {/* Hover Overlay Background */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300 z-10" />

      {/* Delete Button (Hover) */}
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(album); }}
        className="absolute top-3 left-3 p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-30 shadow-lg"
        title="Delete Album"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-20 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
        <h3 className="text-white font-bold text-lg truncate drop-shadow-md">{album.name}</h3>
        {album.description && (
          <p className="text-white/70 text-sm truncate drop-shadow-md mt-0.5">{album.description}</p>
        )}
      </div>
    </div>
  );
}
