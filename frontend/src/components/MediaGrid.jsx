import { useEffect, useRef, useCallback } from 'react';
import { ImageOff } from 'lucide-react';
import MediaCard from './MediaCard';

export default function MediaGrid({ 
  mediaList, user, onDelete, onMediaClick, hasMore, loadMore, loading, onShowInfo,
  isSelectionMode, selectedIds, onToggleSelect, activeSort, onToggleFavorite,
  emptyTitle = "Your Vault is Empty", emptyMessage = "Upload some photos and videos to start building your secure personal timeline. Click the Upload button in the top right!"
}) {
  const observer = useRef();

  const lastMediaElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, loadMore]);

  // Empty state is now handled higher up in Gallery.jsx, but we'll leave a fallback here just in case.
  if (mediaList.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in duration-700">
        <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-6 shadow-2xl">
          <ImageOff className="w-10 h-10 text-white/40" />
        </div>
        <h2 className="text-3xl font-heading font-bold text-white mb-3">{emptyTitle}</h2>
        <p className="text-white/50 max-w-sm mx-auto mb-8">
          {emptyMessage}
        </p>
      </div>
    );
  }

  // If we are sorting by size, a flat grid makes more sense than date groups
  const isChronological = activeSort === 'newest' || activeSort === 'oldest';

  let content;

  if (!isChronological) {
    content = (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {mediaList.map((media, index) => {
          const isLast = mediaList.length === index + 1;
          return (
            <div ref={isLast ? lastMediaElementRef : null} key={media.id || index}>
              <MediaCard 
                media={media} 
                user={user} 
                onDelete={onDelete} 
                onClick={onMediaClick} 
                onShowInfo={onShowInfo}
                isSelectionMode={isSelectionMode}
                isSelected={selectedIds?.has(media.id)}
                onToggleSelect={onToggleSelect}
                onToggleFavorite={onToggleFavorite}
              />
            </div>
          );
        })}
      </div>
    );
  } else {
    // Group by Date
    const groups = [];
    let currentGroup = null;

    mediaList.forEach((media, index) => {
      const d = new Date(media.created_at);
      const dateKey = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      
      if (!currentGroup || currentGroup.dateKey !== dateKey) {
        currentGroup = { dateKey, items: [] };
        groups.push(currentGroup);
      }
      currentGroup.items.push({ media, index });
    });

    content = groups.map((group, groupIndex) => (
      <div key={group.dateKey} className="mb-10">
        <h2 className="text-sm font-bold text-white mb-4 tracking-wide">{group.dateKey}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-6 gap-2">
          {group.items.map(({ media, index }) => {
            const isLast = mediaList.length === index + 1;
            return (
              <div ref={isLast ? lastMediaElementRef : null} key={media.id || index}>
                <MediaCard 
                  media={media} 
                  user={user} 
                  onDelete={onDelete} 
                  onClick={onMediaClick} 
                  onShowInfo={onShowInfo}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedIds?.has(media.id)}
                  onToggleSelect={onToggleSelect}
                  onToggleFavorite={onToggleFavorite}
                />
              </div>
            );
          })}
        </div>
      </div>
    ));
  }

  return (
    <div className="w-full">
      {content}
      
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-6 gap-2 mt-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="aspect-square bg-surface relative overflow-hidden rounded-xl border border-white/5">
              <div className="absolute inset-0 skeleton" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
