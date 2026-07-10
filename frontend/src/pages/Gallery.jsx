import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Vault, Database, HardDrive, Cpu, ImageOff, Plus, Search, Filter, ArrowUpDown, X, FileType, Calendar, CheckSquare, Trash2, Folder, Settings, Wrench, LogOut, Edit2, Map } from 'lucide-react';
import { formatBytes } from '../lib/formatters';
import api from '../lib/api';
import Uploader from '../components/Uploader';
import MediaGrid from '../components/MediaGrid';
import VideoPlayer from '../components/VideoPlayer';
import Lightbox from '../components/Lightbox';
import SettingsView from '../components/Settings';
import Admin from '../components/Admin';
import AlbumCard from '../components/AlbumCard';
import AlbumModal from '../components/AlbumModal';
import ConfirmModal from '../components/ConfirmModal';
import MapView from '../components/Map';
import SmartFilters from '../components/SmartFilters';

export default function Gallery() {
  const [mediaList, setMediaList] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const [activeMediaIndex, setActiveMediaIndex] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);
  const [activeInfoMedia, setActiveInfoMedia] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeSort, setActiveSort] = useState('newest');
  
  const [showFilters, setShowFilters] = useState(false);
  const [smartFilters, setSmartFilters] = useState({ make: '', model: '', start_date: '', end_date: '' });

  const [currentView, setCurrentView] = useState('Photos');
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  
  const [pendingDelete, setPendingDelete] = useState(null);
  const timeoutRef = useRef(null);

  const [stats, setStats] = useState({ total_files: 0, total_size: 0, processing_count: 0 });

  const [albums, setAlbums] = useState([]);
  const [currentAlbumId, setCurrentAlbumId] = useState(null);
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [albumMedia, setAlbumMedia] = useState([]);
  const [albumToDelete, setAlbumToDelete] = useState(null);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/media/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  }, []);

  const fetchAlbums = useCallback(async () => {
    try {
      const res = await api.get('/albums');
      setAlbums(res.data);
    } catch (err) {
      console.error('Failed to fetch albums', err);
    }
  }, []);

  const fetchAlbumMedia = async (albumId) => {
    setLoading(true);
    try {
      const res = await api.get(`/albums/${albumId}`);
      setAlbumMedia(res.data.media);
    } catch (err) {
      console.error('Failed to fetch album media', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAlbumClick = (album) => {
    setCurrentAlbumId(album.id);
    fetchAlbumMedia(album.id);
  };

  const handleDeleteAlbum = (album) => {
    setAlbumToDelete(album);
  };

  const confirmDeleteAlbum = async () => {
    if (!albumToDelete) return;
    try {
      await api.delete(`/albums/${albumToDelete.id}`);
      fetchAlbums();
    } catch (err) {
      console.error('Failed to delete album', err);
    }
  };

  const fetchMedia = async (pageNum = 1, append = false, sortParam = activeSort, search = searchQuery, filters = smartFilters, filterType = activeFilter) => {
    if (pageNum === 1) setMediaList([]); 
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pageNum,
        limit: 20,
        sort: sortParam,
      });
      
      if (search) queryParams.append('q', search);
      if (filters.make) queryParams.append('make', filters.make);
      if (filters.model) queryParams.append('model', filters.model);
      if (filters.start_date) queryParams.append('start_date', filters.start_date);
      if (filters.end_date) queryParams.append('end_date', filters.end_date);
      if (filterType !== 'All') queryParams.append('media_type', filterType);

      const res = await api.get(`/media?${queryParams.toString()}`);
      if (append) {
        setMediaList(prev => {
          // Prevent duplicates by checking ids
          const existingIds = new Set(prev.map(m => m.id));
          const newItems = res.data.media.filter(m => !existingIds.has(m.id));
          return [...prev, ...newItems];
        });
      } else {
        setMediaList(res.data.media);
      }
      setHasMore(res.data.media.length === 20);
    } catch (err) {
      console.error('Failed to fetch media', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      setPage(1);
      fetchMedia(1, false, activeSort, searchQuery, smartFilters, activeFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [activeSort, searchQuery, smartFilters, activeFilter]);

  useEffect(() => {
    if (currentView === 'Albums' && currentAlbumId === null) {
      fetchAlbums();
    }
  }, [currentView, currentAlbumId, fetchAlbums]);

  useEffect(() => {
    fetchStats();

    const socket = io('http://localhost:3000');
    socket.on('connect', () => {
      if (user) socket.emit('join-room', user.id);
    });

    socket.on('transcoding-ready', async (data) => {
      fetchStats(); // Update stats
      try {
        const res = await api.get(`/media/${data.mediaId}`);
        const updatedMedia = res.data;
        setMediaList(prevList => 
          prevList.map(m => m.id === data.mediaId ? updatedMedia : m)
        );
      } catch (err) {
        console.error('Failed to fetch updated media', err);
      }
    });

    return () => socket.disconnect();
  }, [user?.id, fetchStats]);

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMedia(nextPage, true, activeSort, searchQuery, smartFilters, activeFilter);
    }
  };

  // Optimistic Handlers
  const handleUploadStart = (optimisticMedia) => {
    setMediaList(prev => [...optimisticMedia, ...prev]);
  };

  const handleUploadComplete = async (tempIds, realMediaArray) => {
    // Re-fetch the latest state for processing items in case fast-transcoding finished during the UI delay
    const finalMediaArray = await Promise.all(realMediaArray.map(async m => {
      if (m.status === 'processing') {
        try {
          const res = await api.get(`/media/${m.id}`);
          return res.data;
        } catch (e) {
          return m;
        }
      }
      return m;
    }));

    setMediaList(prev => {
      let newList = prev.filter(m => !tempIds.includes(m.id));
      return [...finalMediaArray, ...newList];
    });
    fetchStats();
  };

  const handleUploadError = (tempIds) => {
    setMediaList(prev => prev.filter(m => !tempIds.includes(m.id)));
    fetchStats();
  };

  const executeDelete = async (itemsToDelete) => {
    try {
      const idsToDelete = itemsToDelete.map(m => m.id);
      if (idsToDelete.length === 1) {
        await api.delete(`/media/${idsToDelete[0]}`);
      } else {
        await api.delete('/media/bulk', { data: { ids: idsToDelete } });
      }
      fetchStats();
    } catch (err) {
      console.error('Delete failed', err);
      // Restore on failure
      setMediaList(prev => [...prev, ...itemsToDelete].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)));
      alert('Failed to delete media items.');
    } finally {
      setPendingDelete(prev => {
        if (prev?.items === itemsToDelete) return null;
        return prev;
      });
    }
  };

  const scheduleDelete = (itemsToDelete) => {
    if (pendingDelete) {
      clearTimeout(timeoutRef.current);
      executeDelete(pendingDelete.items);
    }

    setMediaList(prev => prev.filter(m => !itemsToDelete.some(i => i.id === m.id)));
    setPendingDelete({ items: itemsToDelete });

    timeoutRef.current = setTimeout(() => {
      executeDelete(itemsToDelete);
    }, 5000);
  };

  const undoDelete = () => {
    if (!pendingDelete) return;
    clearTimeout(timeoutRef.current);
    
    setMediaList(prev => [...prev, ...pendingDelete.items].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)));
    setPendingDelete(null);
  };

  const handleDelete = (id) => {
    const item = mediaList.find(m => m.id === id);
    if (item) scheduleDelete([item]);
  };

  const handleToggleFavorite = async (id, is_favorite) => {
    setMediaList(prev => prev.map(m => m.id === id ? { ...m, is_favorite } : m));
    try {
      await api.post(`/media/${id}/favorite`, { is_favorite });
      fetchStats();
    } catch (err) {
      console.error('Failed to toggle favorite', err);
      // Revert on failure
      setMediaList(prev => prev.map(m => m.id === id ? { ...m, is_favorite: !is_favorite } : m));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    const itemsToDelete = mediaList.filter(m => selectedIds.has(m.id));
    
    setSelectedIds(new Set());
    setIsSelectionMode(false);
    
    scheduleDelete(itemsToDelete);
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedIds(new Set()); // Clear on exit
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getMediaUrl = (filename) => {
    return `http://localhost:3000/uploads/user_${user?.id}/${filename}`;
  };

  const handleMediaClick = (media) => {
    if ((media.file_type || '').startsWith('video')) {
      setActiveVideo(media);
    } else {
      const index = filteredMediaList.findIndex(m => m.id === media.id);
      setActiveMediaIndex(index);
    }
  };

  const handleLightboxNavigate = (direction) => {
    if (activeMediaIndex === null || filteredMediaList.length === 0) return;
    let newIndex = activeMediaIndex;
    
    // Skip videos when navigating in lightbox
    if (direction === 'next') {
      do {
        newIndex = (newIndex + 1) % filteredMediaList.length;
      } while ((filteredMediaList[newIndex].file_type || '').startsWith('video') && newIndex !== activeMediaIndex);
    } else {
      do {
        newIndex = (newIndex - 1 + filteredMediaList.length) % filteredMediaList.length;
      } while ((filteredMediaList[newIndex].file_type || '').startsWith('video') && newIndex !== activeMediaIndex);
    }
    
    setActiveMediaIndex(newIndex);
  };

  const baseMediaList = currentAlbumId ? albumMedia : mediaList;

  const filteredMediaList = currentAlbumId ? baseMediaList.filter(media => {
    // Client-side search only applies to Albums view now
    const originalName = media.original_name || '';
    const fileType = media.file_type || '';
    
    const matchesSearch = originalName.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesFilter = true;
    if (activeFilter === 'Photos') {
      matchesFilter = fileType.startsWith('image');
    } else if (activeFilter === 'Videos') {
      matchesFilter = fileType.startsWith('video');
    } else if (activeFilter === 'Processing') {
      matchesFilter = media.status === 'processing' || media.status === 'uploading';
    }

    return matchesSearch && matchesFilter;
  }) : baseMediaList; // Main gallery is already filtered by backend

  const sizeMB = (stats.total_size / (1024 * 1024)).toFixed(1);
  // Assume a 5GB arbitrary quota for the minibar
  const quotaMB = 5000; 
  const storagePercentage = Math.min((parseFloat(sizeMB) / quotaMB) * 100, 100);

  return (
    <div className="flex h-screen bg-background text-white font-sans overflow-hidden">
      
      {/* 1. Fixed Left Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-[#050505] flex flex-col shrink-0">
        {/* Logo */}
        <div className="h-16 px-6 flex items-center space-x-3 border-b border-white/5 shrink-0">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <Vault className="w-4 h-4 text-black" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            KinVault
          </h1>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          <button 
            onClick={() => setCurrentView('Photos')}
            className={`w-full flex items-center px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${currentView === 'Photos' ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
          >
            <ImageOff className="w-4 h-4 mr-3 text-white/70" /> Photos
          </button>
          <button 
            onClick={() => {
              setCurrentView('Photos');
              document.getElementById('global-search-input')?.focus();
            }}
            className="w-full flex items-center px-3 py-2.5 text-white/60 hover:bg-white/5 hover:text-white rounded-lg font-medium text-sm transition-colors"
          >
            <Search className="w-4 h-4 mr-3 text-white/40" /> Explore
          </button>
          <button 
            onClick={() => setCurrentView('Map')}
            className={`w-full flex items-center px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${currentView === 'Map' ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
          >
            <Map className="w-4 h-4 mr-3 text-white/70" /> Map View
          </button>
          
          <div className="pt-6 pb-2 px-3">
            <p className="text-xs font-bold uppercase tracking-widest text-white/40">Library</p>
          </div>
          <button 
            onClick={() => setCurrentView('Favorites')}
            className={`w-full flex items-center px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${currentView === 'Favorites' ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
          >
            <CheckSquare className="w-4 h-4 mr-3 text-white/40" /> Favorites
          </button>
          <button 
            onClick={() => setCurrentView('Albums')}
            className={`w-full flex items-center px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${currentView === 'Albums' ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
          >
            <Folder className="w-4 h-4 mr-3 text-white/40" /> Albums
          </button>
          <button 
            onClick={() => setCurrentView('Trash')}
            className={`w-full flex items-center px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${currentView === 'Trash' ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
          >
            <Trash2 className="w-4 h-4 mr-3 text-white/40" /> Trash
          </button>
        </nav>

        {/* Bottom Storage Stats */}
        <div className="p-4 border-t border-white/5 shrink-0">
          <div className="bg-surface/50 border border-white/5 rounded-xl p-4">
            <p className="text-xs font-bold text-white mb-1">Storage space</p>
            <p className="text-[11px] text-white/60 mb-3">{sizeMB} MB of {quotaMB} MB used</p>
            
            <div className="w-full bg-black h-1.5 rounded-full overflow-hidden flex items-center">
              <div className="bg-primary h-full" style={{ width: `${storagePercentage}%` }} />
            </div>

            <div className="mt-4 flex items-center justify-between text-[10px] text-white/40 uppercase tracking-widest font-heading">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Server Online
              </div>
              <span>v1.0.0</span>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Top App Bar */}
        <header className="h-16 px-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-background/80 backdrop-blur-md z-40">
          {/* Centered Search */}
          <div className="flex-1 max-w-2xl mx-auto px-4">
            <div className="flex gap-2 relative">
              <div className="relative group flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary transition-colors" />
                <input 
                  id="global-search-input"
                  type="text" 
                  placeholder="Search your library by filename, camera make, or model..." 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (currentView !== 'Photos') setCurrentView('Photos');
                  }}
                  className="w-full bg-surface border border-white/10 rounded-full pl-11 pr-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center justify-center px-4 rounded-full border transition-colors ${
                  showFilters || smartFilters.make || smartFilters.start_date
                    ? 'bg-primary border-primary text-black'
                    : 'bg-surface border-white/10 text-white hover:border-white/30'
                }`}
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Right Actions (Upload & Profile) */}
          <div className="flex items-center space-x-4 shrink-0 pl-4">
            <Uploader 
              onUploadStart={handleUploadStart}
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
            />
            <div className="flex items-center pl-4 border-l border-white/10 relative">
              <button 
                onClick={() => setShowAccountMenu(!showAccountMenu)}
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-orange-400 flex items-center justify-center text-black font-bold text-sm focus:outline-none hover:ring-2 hover:ring-primary/50 transition-all"
              >
                {user?.email?.[0].toUpperCase() || 'U'}
              </button>

              {showAccountMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowAccountMenu(false)} />
                  <div className="absolute right-0 top-12 w-72 bg-[#2c2c2c] rounded-3xl border border-white/5 shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 pb-4">
                    <div className="p-6 flex flex-col items-center">
                      <div className="relative mb-4">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-orange-400 flex items-center justify-center text-black font-bold text-3xl shadow-lg">
                          {user?.email?.[0].toUpperCase() || 'U'}
                        </div>
                        <div 
                          className="absolute bottom-0 right-0 w-7 h-7 bg-blue-200 hover:bg-blue-300 cursor-pointer rounded-full flex items-center justify-center border-[3px] border-[#2c2c2c] transition-colors"
                          onClick={() => alert("Profile picture upload feature coming soon!")}
                        >
                          <Edit2 className="w-3 h-3 text-black" />
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-white mb-0.5 capitalize">
                        {user?.email?.split('@')[0] || 'User'}
                      </h3>
                      <p className="text-sm text-white/60 mb-6">
                        {user?.email || 'demo@immich.app'}
                      </p>

                      <div className="w-full space-y-2 mb-6">
                        <button 
                          onClick={() => { setCurrentView('Settings'); setShowAccountMenu(false); }}
                          className="w-full bg-white/10 hover:bg-white/20 text-white py-2.5 px-4 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold transition-colors shadow-sm"
                        >
                          <Settings className="w-4 h-4" /> Account Settings
                        </button>
                        <button 
                          onClick={() => { setCurrentView('Admin'); setShowAccountMenu(false); }}
                          className="w-full bg-white/10 hover:bg-white/20 text-white py-2.5 px-4 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold transition-colors shadow-sm"
                        >
                          <Wrench className="w-4 h-4" /> Administration
                        </button>
                      </div>

                      <div className="w-full h-px bg-black/40 mb-2" />
                      
                      <button 
                        onClick={() => {
                          setShowAccountMenu(false);
                          handleLogout();
                        }}
                        className="w-full text-white/90 hover:text-white hover:bg-white/5 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>

                      <div className="mt-4">
                        <a href="#" className="text-[13px] font-medium text-blue-300 hover:text-blue-200 transition-colors underline-offset-4 hover:underline">
                          Support & Feedback
                        </a>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {showFilters && (
          <SmartFilters 
            filters={smartFilters} 
            setFilters={setSmartFilters}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            onClose={() => setShowFilters(false)} 
          />
        )}

        {/* Scrollable Timeline View */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          
          {/* Filter & Selection Controls (Only visible in Photos view) */}
          {currentView === 'Photos' && (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                {['All', 'Photos', 'Videos', 'Processing'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                      activeFilter === filter 
                        ? 'bg-white text-black' 
                        : 'bg-surface border border-white/10 text-white/60 hover:text-white hover:border-white/30'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <div className="flex items-center">
                {/* Sort Dropdown */}
                <div className="relative flex items-center border-l border-white/10 pl-4">
                  <ArrowUpDown className="w-3 h-3 text-white/40 mr-2" />
                  <select
                    value={activeSort}
                    onChange={(e) => setActiveSort(e.target.value)}
                    className="bg-transparent text-xs font-medium text-white/70 hover:text-white focus:outline-none cursor-pointer appearance-none pr-4"
                  >
                    <option value="newest" className="bg-surface text-white">Newest First</option>
                    <option value="oldest" className="bg-surface text-white">Oldest First</option>
                    <option value="largest" className="bg-surface text-white">Largest Size</option>
                    <option value="smallest" className="bg-surface text-white">Smallest Size</option>
                  </select>
                </div>
                
                {/* Select Mode Toggle */}
                <div className="ml-2 pl-4 border-l border-white/10">
                  <button
                    onClick={toggleSelectionMode}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                      isSelectionMode
                        ? 'bg-primary text-black'
                        : 'bg-surface border border-white/10 text-white/60 hover:text-white hover:border-white/30'
                    }`}
                  >
                    <CheckSquare className="w-4 h-4" />
                    {isSelectionMode ? 'Cancel' : 'Select'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Grid or Placeholder */}
          {['Photos', 'Favorites'].includes(currentView) ? (
            <MediaGrid 
              mediaList={currentView === 'Favorites' ? filteredMediaList.filter(m => m.is_favorite) : filteredMediaList} 
              user={user} 
              onDelete={handleDelete} 
              onMediaClick={handleMediaClick}
              onShowInfo={(media) => setActiveInfoMedia(media)}
              hasMore={currentView === 'Photos' && hasMore && searchQuery === '' && activeFilter === 'All'}
              loadMore={loadMore}
              loading={loading}
              isSelectionMode={isSelectionMode}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelection}
              activeSort={activeSort}
              onToggleFavorite={handleToggleFavorite}
              emptyTitle={currentView === 'Favorites' ? 'No Favorites Yet' : 'Your Vault is Empty'}
              emptyMessage={currentView === 'Favorites' ? 'You haven\'t marked any assets as favorites yet. Click the heart icon on any photo or video to add it here.' : 'Upload some photos and videos to start building your secure personal timeline. Click the Upload button in the top right!'}
            />
          ) : currentView === 'Map' ? (
            <MapView user={user} onMediaClick={(media) => {
              if (media.file_type?.startsWith('video')) {
                setActiveVideo(media);
              } else {
                setActiveMediaIndex(mediaList.findIndex(m => m.id === media.id) || 0); // Open full view, fallback if not in regular list
                // If it's not in the main mediaList, Lightbox might break, so we might need a single image view, 
                // but Lightbox supports passing a single image if we hack it, or we just pass the full list.
                // Actually, passing the whole map media is better but activeMediaIndex expects an index in filteredMediaList.
                // Let's just set activeInfoMedia for now or implement a better fix.
                // Wait, Lightbox takes images={filteredMediaList}.
                // If the map item is in filteredMediaList, it works.
                const idx = filteredMediaList.findIndex(m => m.id === media.id);
                if (idx !== -1) {
                  setActiveMediaIndex(idx);
                } else {
                  setActiveInfoMedia(media); // Fallback to info modal if not found in current loaded list
                }
              }
            }} />
          ) : currentView === 'Settings' ? (
            <SettingsView user={user} />
          ) : currentView === 'Admin' ? (
            <Admin user={user} />
          ) : currentView === 'Albums' ? (
            currentAlbumId ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setCurrentAlbumId(null)}
                    className="p-2 bg-surface hover:bg-white/5 rounded-full border border-white/5 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                  <h2 className="text-2xl font-bold text-white">
                    {albums.find(a => a.id === currentAlbumId)?.name || 'Album'}
                  </h2>
                </div>
                <MediaGrid 
                  mediaList={filteredMediaList} 
                  user={user} 
                  onDelete={(id) => {
                    // For now, delete from album just removes it from album
                    api.delete(`/albums/${currentAlbumId}/media/${id}`).then(() => fetchAlbumMedia(currentAlbumId));
                  }} 
                  onMediaClick={handleMediaClick}
                  onShowInfo={(media) => setActiveInfoMedia(media)}
                  hasMore={false}
                  loadMore={() => {}}
                  loading={loading}
                  isSelectionMode={isSelectionMode}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelection}
                  activeSort={activeSort}
                  onToggleFavorite={handleToggleFavorite}
                  emptyTitle="Album is Empty"
                  emptyMessage="You haven't added any media to this album yet."
                />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Your Albums</h2>
                  <button 
                    onClick={() => setShowAlbumModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-black rounded-full font-bold transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Create Album
                  </button>
                </div>
                {albums.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                    {albums.map(album => (
                      <AlbumCard 
                        key={album.id}
                        album={album}
                        user={user}
                        onClick={handleAlbumClick}
                        onDelete={handleDeleteAlbum}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="h-[40vh] flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-surface border border-white/5 rounded-full flex items-center justify-center mb-6 shadow-2xl">
                      <Folder className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">No Albums Created</h2>
                    <p className="text-white/50 max-w-sm mb-6">Group your favorite memories into customized collections.</p>
                    <button 
                      onClick={() => setShowAlbumModal(true)}
                      className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors"
                    >
                      Create Your First Album
                    </button>
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-surface border border-white/5 rounded-full flex items-center justify-center mb-6 shadow-2xl">
                {currentView === 'Trash' && <Trash2 className="w-8 h-8 text-primary" />}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {currentView === 'Trash' && 'Trash is Empty'}
              </h2>
              <p className="text-white/50 max-w-sm">
                {currentView === 'Trash' && 'There are no deleted items here. Remember, assets are permanently deleted after 5 seconds.'}
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Floating Action Bar */}
      {isSelectionMode && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="bg-surface border border-white/10 shadow-2xl rounded-full px-6 py-3 flex items-center gap-6">
            <span className="text-sm font-medium text-white">
              {selectedIds.size} selected
            </span>
            <div className="w-px h-4 bg-white/20" />
            <button
              onClick={() => setShowAlbumModal(true)}
              disabled={selectedIds.size === 0}
              className="flex items-center gap-2 text-white hover:text-primary disabled:opacity-50 transition-colors text-sm font-medium"
            >
              <Folder className="w-4 h-4" />
              Add to Album
            </button>
            <div className="w-px h-4 bg-white/20" />
            <button
              onClick={handleBulkDelete}
              disabled={selectedIds.size === 0}
              className="flex items-center gap-2 text-red-400 hover:text-red-300 disabled:opacity-50 disabled:hover:text-red-400 transition-colors text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* 8. Video Player Modal */}
      {activeVideo && (
        <VideoPlayer 
          media={activeVideo}
          url={getMediaUrl(activeVideo.filename)} 
          onClose={() => setActiveVideo(null)} 
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {/* File Details Modal */}
      {activeInfoMedia && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#161616] border border-white/10 rounded-2xl shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#161616] border-b border-white/5 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">File Details</h3>
              <button 
                onClick={() => setActiveInfoMedia(null)}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">

              {/* Filename */}
              <div>
                <p className="text-xs uppercase font-bold tracking-widest text-white/40 mb-1">Filename</p>
                <p className="text-white font-medium break-all">{activeInfoMedia.original_name}</p>
              </div>

              {/* Basic File Info */}
              <div>
                <p className="text-xs uppercase font-bold tracking-widest text-white/40 mb-3">File Info</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-xs text-white/50 mb-1">Size</p>
                    <p className="text-sm font-bold text-white">{formatBytes(activeInfoMedia.size)}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-xs text-white/50 mb-1">Type</p>
                    <p className="text-sm font-bold text-white">{activeInfoMedia.file_type?.split('/')[1]?.toUpperCase() || 'Unknown'}</p>
                  </div>
                  {(activeInfoMedia.exif_width && activeInfoMedia.exif_height) && (
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-xs text-white/50 mb-1">Dimensions</p>
                      <p className="text-sm font-bold text-white">{activeInfoMedia.exif_width} × {activeInfoMedia.exif_height}</p>
                    </div>
                  )}
                  {activeInfoMedia.duration && (
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-xs text-white/50 mb-1">Duration</p>
                      <p className="text-sm font-bold text-white">
                        {Math.floor(activeInfoMedia.duration / 60)}:{(Math.floor(activeInfoMedia.duration % 60)).toString().padStart(2, '0')}
                      </p>
                    </div>
                  )}
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-xs text-white/50 mb-1">Uploaded</p>
                    <p className="text-sm font-bold text-white">{new Date(activeInfoMedia.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
              </div>

              {/* Capture Info — show if any EXIF/Video metadata exists */}
              {(activeInfoMedia.exif_make || activeInfoMedia.exif_model || activeInfoMedia.exif_iso || activeInfoMedia.exif_aperture || activeInfoMedia.exif_date_taken) && (
                <div>
                  <p className="text-xs uppercase font-bold tracking-widest text-white/40 mb-3">Capture Info</p>
                  <div className="bg-white/5 rounded-xl p-4 space-y-3">
                    {(activeInfoMedia.exif_make || activeInfoMedia.exif_model) && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-white/50">Device</span>
                        <span className="text-sm font-medium text-white">{[activeInfoMedia.exif_make, activeInfoMedia.exif_model].filter(Boolean).join(' ')}</span>
                      </div>
                    )}
                    {activeInfoMedia.exif_date_taken && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-white/50">Date Taken</span>
                        <span className="text-sm font-medium text-white">
                          {new Date(activeInfoMedia.exif_date_taken).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                    {activeInfoMedia.exif_focal_length && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-white/50">Focal Length</span>
                        <span className="text-sm font-medium text-white">{activeInfoMedia.exif_focal_length}mm</span>
                      </div>
                    )}
                    {activeInfoMedia.exif_aperture && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-white/50">Aperture</span>
                        <span className="text-sm font-medium text-white">ƒ/{activeInfoMedia.exif_aperture}</span>
                      </div>
                    )}
                    {activeInfoMedia.exif_shutter_speed && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-white/50">Shutter Speed</span>
                        <span className="text-sm font-medium text-white">{activeInfoMedia.exif_shutter_speed}s</span>
                      </div>
                    )}
                    {activeInfoMedia.exif_iso && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-white/50">ISO</span>
                        <span className="text-sm font-medium text-white">{activeInfoMedia.exif_iso}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* GPS Location — only if coordinates exist */}
              {(activeInfoMedia.exif_latitude && activeInfoMedia.exif_longitude) && (
                <div>
                  <p className="text-xs uppercase font-bold tracking-widest text-white/40 mb-3">Location</p>
                  <div className="bg-white/5 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white/50">Latitude</span>
                      <span className="text-sm font-medium text-white font-mono">{activeInfoMedia.exif_latitude.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white/50">Longitude</span>
                      <span className="text-sm font-medium text-white font-mono">{activeInfoMedia.exif_longitude.toFixed(6)}</span>
                    </div>
                    <a 
                      href={`https://www.google.com/maps?q=${activeInfoMedia.exif_latitude},${activeInfoMedia.exif_longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full mt-2 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-bold py-2.5 rounded-lg transition-colors"
                    >
                      View on Google Maps →
                    </a>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      
      {/* 5. Lightbox for full image view */}
      <Lightbox 
        images={filteredMediaList}
        currentIndex={activeMediaIndex}
        onClose={() => setActiveMediaIndex(null)}
        onNavigate={handleLightboxNavigate}
        onToggleFavorite={handleToggleFavorite}
      />
      {/* Undo Toast Notification */}
      {pendingDelete && (
        <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-right fade-in duration-300">
          <div className="bg-surface border border-white/10 shadow-2xl rounded-xl p-4 flex items-center gap-6">
            <div>
              <p className="text-sm font-bold text-white">Success!</p>
              <p className="text-xs text-white/60">Trashed {pendingDelete.items.length} asset{pendingDelete.items.length > 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={undoDelete}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Undo
            </button>
          </div>
        </div>
      )}

      {/* Album Modal */}
      <AlbumModal 
        isOpen={showAlbumModal}
        onClose={() => setShowAlbumModal(false)}
        selectedMediaIds={isSelectionMode ? Array.from(selectedIds) : []}
        onAlbumUpdated={() => {
          fetchAlbums();
          if (isSelectionMode) toggleSelectionMode(); // exit selection mode
        }}
      />

      {/* Delete Album Confirm Modal */}
      <ConfirmModal
        isOpen={!!albumToDelete}
        onClose={() => setAlbumToDelete(null)}
        onConfirm={confirmDeleteAlbum}
        title="Confirm"
        message={
          <>
            Are you sure you want to delete the album <strong>{albumToDelete?.name}</strong>?<br/>
            If this album is shared, other users will not be able to access it anymore.
          </>
        }
      />
    </div>
  );
}
