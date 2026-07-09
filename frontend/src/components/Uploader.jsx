import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, CheckCircle, File, Loader2, ImageOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';

export default function Uploader({ onUploadStart, onUploadComplete, onUploadError, isCompact }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({}); 
  const [status, setStatus] = useState({}); 

  const onDrop = useCallback((acceptedFiles) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'video/mp4': ['.mp4'],
      'video/x-msvideo': ['.avi'],
      'video/x-matroska': ['.mkv'],
      'video/quicktime': ['.mov']
    },
    maxSize: 1024 * 1024 * 1024
  });

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    
    const tempIds = files.map((_, i) => `temp-${Date.now()}-${i}`);
    
    onUploadStart(files.map((file, i) => ({
      id: tempIds[i],
      original_name: file.name,
      size: file.size,
      status: 'uploading',
      file_type: file.type || 'unknown'
    })));

    const currentFiles = [...files];
    const successfulUploads = [];
    
    for (let i = 0; i < currentFiles.length; i++) {
      const file = currentFiles[i];
      const formData = new FormData();
      formData.append('files', file);

      try {
        const response = await api.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(prev => ({ ...prev, [file.name]: percentCompleted }));
          }
        });
        
        setStatus(prev => ({ ...prev, [file.name]: 'success' }));
        successfulUploads.push(response.data.media[0]); 
        
      } catch (error) {
        console.error('Upload failed for', file.name, error);
        setStatus(prev => ({ ...prev, [file.name]: 'error' }));
        onUploadError([tempIds[i]]);
      }
    }

    setTimeout(() => {
      setFiles([]);
      setProgress({});
      setStatus({});
      setUploading(false);
      onUploadComplete(tempIds, successfulUploads);
    }, 1000);
  };

  return (
    <div className="relative z-50">
      <div 
        {...getRootProps()} 
        className={`flex items-center gap-2 px-4 py-2 hover:bg-white/20 text-white rounded-full font-medium text-sm transition-colors cursor-pointer border
          ${isDragActive ? 'bg-white/20 border-primary shadow-lg' : 'bg-white/10 border-transparent'}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex items-center gap-2 relative z-10 pointer-events-none">
          <Upload className="w-4 h-4" />
          <span className={`font-medium transition-colors ${isDragActive ? 'text-primary' : ''}`}>
            {isDragActive ? 'Release...' : 'Upload'}
          </span>
        </div>
      </div>

      <div className="absolute right-0 top-12 w-[400px]">
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 w-full bg-surface rounded-xl border border-white/10 overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
                <span className="text-sm font-medium text-white/70">{files.length} items ready</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleUpload(); }} 
                  disabled={uploading}
                  className="bg-primary hover:bg-white text-black font-medium text-sm py-2 px-6 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? 'Processing...' : 'Upload All'}
                </button>
              </div>
              
              <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3 bg-surface">
                {files.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="flex flex-col gap-2 p-3 bg-black/40 rounded-lg border border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <File className="w-4 h-4 text-white/40 shrink-0" />
                        <span className="text-sm font-medium truncate text-white/90">{file.name}</span>
                        <span className="text-xs text-white/40">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                      </div>
                      
                      {!uploading && (
                        <button onClick={(e) => { e.stopPropagation(); removeFile(index); }} className="text-white/40 hover:text-red-500 transition-colors shrink-0">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      
                      {status[file.name] === 'success' && <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />}
                      {status[file.name] === 'error' && <X className="w-5 h-5 text-red-500 shrink-0" />}
                    </div>
                    
                    {progress[file.name] !== undefined && status[file.name] !== 'success' && status[file.name] !== 'error' && (
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-1">
                        <div 
                          className="bg-primary h-full transition-all duration-300 ease-out" 
                          style={{ width: `${progress[file.name]}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
