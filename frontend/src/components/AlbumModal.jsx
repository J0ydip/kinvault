import { useState, useEffect } from 'react';
import { X, Plus, Folder, Loader2 } from 'lucide-react';
import api from '../lib/api';

export default function AlbumModal({ isOpen, onClose, selectedMediaIds, onAlbumUpdated }) {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumDescription, setNewAlbumDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchAlbums();
      setIsCreating(false);
      setNewAlbumName('');
      setNewAlbumDescription('');
    }
  }, [isOpen]);

  const fetchAlbums = async () => {
    try {
      setLoading(true);
      const res = await api.get('/albums');
      setAlbums(res.data);
    } catch (err) {
      console.error('Failed to fetch albums', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    if (!newAlbumName.trim()) return;
    
    try {
      setLoading(true);
      const res = await api.post('/albums', {
        name: newAlbumName.trim(),
        description: newAlbumDescription.trim()
      });
      
      const newAlbum = res.data;
      
      // If we have selected media, add them right away
      if (selectedMediaIds && selectedMediaIds.length > 0) {
        await api.post(`/albums/${newAlbum.id}/media`, { mediaIds: selectedMediaIds });
      }
      
      onAlbumUpdated();
      onClose();
    } catch (err) {
      console.error('Failed to create album', err);
      setLoading(false);
    }
  };

  const handleAddToAlbum = async (albumId) => {
    if (!selectedMediaIds || selectedMediaIds.length === 0) return;
    
    try {
      setLoading(true);
      await api.post(`/albums/${albumId}/media`, { mediaIds: selectedMediaIds });
      onAlbumUpdated();
      onClose();
    } catch (err) {
      console.error('Failed to add to album', err);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#161616] border border-white/10 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#161616] border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">
            {selectedMediaIds?.length > 0 ? `Add ${selectedMediaIds.length} item(s) to Album` : 'Create New Album'}
          </h3>
          <button 
            onClick={onClose}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {/* Create Form */}
          {isCreating || albums.length === 0 || !selectedMediaIds?.length ? (
            <form onSubmit={handleCreateAlbum} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Album Name</label>
                <input
                  type="text"
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                  placeholder="e.g. Summer Vacation 2024"
                  className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Description (Optional)</label>
                <textarea
                  value={newAlbumDescription}
                  onChange={(e) => setNewAlbumDescription(e.target.value)}
                  placeholder="A few words about this album..."
                  rows={3}
                  className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all resize-none"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                {albums.length > 0 && selectedMediaIds?.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading || !newAlbumName.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary/90 text-black rounded-xl font-bold transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  Create Album
                </button>
              </div>
            </form>
          ) : (
            /* Select Existing Album */
            <div className="space-y-4">
              <button
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/10 border-dashed rounded-xl text-white transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span className="font-bold">Create New Album</span>
              </button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-2 bg-[#161616] text-xs font-medium text-white/40 uppercase tracking-widest">Or select existing</span>
                </div>
              </div>

              <div className="space-y-2">
                {albums.map(album => (
                  <button
                    key={album.id}
                    onClick={() => handleAddToAlbum(album.id)}
                    disabled={loading}
                    className="w-full flex items-center gap-4 p-3 bg-surface hover:bg-white/5 border border-white/5 rounded-xl text-left transition-colors group disabled:opacity-50"
                  >
                    <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                      <Folder className="w-6 h-6 text-white/40 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-bold truncate">{album.name}</h4>
                      <p className="text-white/40 text-xs truncate">{album.media_count} items</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
