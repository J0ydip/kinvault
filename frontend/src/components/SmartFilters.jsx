import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { X, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';

function SearchableSelect({ value, onChange, options, placeholder, searchPlaceholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#2a2a2e] hover:bg-[#323236] border border-transparent rounded-xl px-4 py-3 text-sm text-left text-white outline-none focus:border-blue-500 transition-colors cursor-pointer flex items-center justify-between"
      >
        <span className={value ? 'text-white' : 'text-white/50'}>
          {value || placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-white/50" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#1e1e20] border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden flex flex-col max-h-64">
            <div className="p-2 border-b border-white/5 shrink-0 relative">
              <svg className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                type="text"
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={searchPlaceholder || "Search..."}
                className="w-full bg-[#2a2a2e] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-blue-500/50 border border-transparent"
              />
            </div>
            <div className="overflow-y-auto flex-1 p-1">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-3 text-sm text-white/40 text-center">No results found</div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => { onChange(''); setIsOpen(false); setSearch(''); }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${!value ? 'bg-blue-500/20 text-blue-400' : 'text-white hover:bg-white/5'}`}
                  >
                    {placeholder}
                  </button>
                  {filteredOptions.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => { onChange(opt); setIsOpen(false); setSearch(''); }}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${value === opt ? 'bg-blue-500/20 text-blue-400' : 'text-white hover:bg-white/5'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function SmartFilters({ filters, setFilters, searchQuery, setSearchQuery, activeFilter, setActiveFilter, onClose }) {
  const [cameraOptions, setCameraOptions] = useState([]);
  
  // Local state for the modal
  const [localSearch, setLocalSearch] = useState(searchQuery || '');
  const [localMake, setLocalMake] = useState(filters.make || '');
  const [localModel, setLocalModel] = useState(filters.model || '');
  const [localStartDate, setLocalStartDate] = useState(filters.start_date || '');
  const [localEndDate, setLocalEndDate] = useState(filters.end_date || '');
  const [localMediaType, setLocalMediaType] = useState(activeFilter === 'Photos' ? 'Image' : activeFilter === 'Videos' ? 'Video' : 'All');

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const res = await api.get('/media/filters');
        setCameraOptions(res.data.cameras || []);
      } catch (err) {
        console.error('Failed to load filter options', err);
      }
    };
    fetchFilterOptions();
  }, []);

  const handleClear = () => {
    setLocalSearch('');
    setLocalMake('');
    setLocalModel('');
    setLocalStartDate('');
    setLocalEndDate('');
    setLocalMediaType('All');
  };

  const handleSearch = () => {
    setSearchQuery(localSearch);
    setFilters({
      make: localMake,
      model: localModel,
      start_date: localStartDate,
      end_date: localEndDate
    });
    
    let newFilter = 'All';
    if (localMediaType === 'Image') newFilter = 'Photos';
    if (localMediaType === 'Video') newFilter = 'Videos';
    setActiveFilter(newFilter);
    
    onClose();
  };

  // Group models by make for the dropdowns
  const uniqueMakes = [...new Set(cameraOptions.map(c => c.make).filter(Boolean))];
  const availableModels = cameraOptions.filter(c => (!localMake || c.make === localMake) && c.model).map(c => c.model).filter(Boolean);
  // Remove duplicates from models just in case
  const uniqueModels = [...new Set(availableModels)];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-4xl bg-[#1e1e20] rounded-2xl shadow-2xl flex flex-col border border-white/10 max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line>
              <line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line>
              <line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line>
              <line x1="17" y1="16" x2="23" y2="16"></line>
            </svg>
            <h2 className="text-lg font-semibold text-white">Search options</h2>
          </div>
          <button onClick={onClose} className="p-2 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-8 flex-1">
          
          {/* Search Context */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Search</h3>
            <input 
              type="text" 
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              placeholder="Search by filename or camera model..."
              className="w-full bg-[#2a2a2e] border border-transparent hover:border-white/10 focus:border-blue-500 focus:bg-[#323236] rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-all"
            />
          </div>

          {/* Camera */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Camera</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[13px] text-white/50">Make</label>
                <SearchableSelect 
                  value={localMake}
                  onChange={(val) => {
                    setLocalMake(val);
                    setLocalModel('');
                  }}
                  options={uniqueMakes}
                  placeholder="Any make"
                  searchPlaceholder="Search make..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] text-white/50">Model</label>
                <SearchableSelect 
                  value={localModel}
                  onChange={setLocalModel}
                  options={uniqueModels}
                  placeholder="Any model"
                  searchPlaceholder="Search model..."
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-white">Start date</label>
              <div className="relative group">
                <input 
                  type="date"
                  value={localStartDate}
                  onChange={e => setLocalStartDate(e.target.value)}
                  className="w-full bg-[#2a2a2e] hover:bg-[#323236] border border-transparent rounded-xl px-4 py-3 text-sm text-white appearance-none outline-none focus:border-blue-500 transition-colors cursor-pointer [color-scheme:dark] pr-10"
                />
                <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-white">End date</label>
              <div className="relative group">
                <input 
                  type="date"
                  value={localEndDate}
                  onChange={e => setLocalEndDate(e.target.value)}
                  className="w-full bg-[#2a2a2e] hover:bg-[#323236] border border-transparent rounded-xl px-4 py-3 text-sm text-white appearance-none outline-none focus:border-blue-500 transition-colors cursor-pointer [color-scheme:dark] pr-10"
                />
                <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Display & Media Type Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">Media type</h3>
              <div className="flex gap-6">
                {['All', 'Image', 'Video'].map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="mediaType" 
                      checked={localMediaType === type}
                      onChange={() => setLocalMediaType(type)}
                      className="w-4 h-4 text-blue-500 bg-transparent border-white/20 focus:ring-blue-500 focus:ring-offset-gray-900" 
                    />
                    <span className="text-sm text-white/80 group-hover:text-white transition-colors">{type}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/5 flex gap-4">
          <button 
            onClick={handleClear}
            className="flex-1 py-3 bg-[#e8e8e8] hover:bg-white text-black font-semibold rounded-xl transition-colors"
          >
            Clear all
          </button>
          <button 
            onClick={handleSearch}
            className="flex-1 py-3 bg-[#a3c2ff] hover:bg-[#b8d0ff] text-black font-semibold rounded-xl transition-colors"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
}
