import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize2 } from 'lucide-react';
import api from '../lib/api';

// Create a custom icon generator for thumbnails
const createThumbnailIcon = (media, user) => {
  const getMediaUrl = (filename) => `http://localhost:3000/uploads/user_${user.id}/${filename}`;
  const imgUrl = media.thumbnail ? getMediaUrl(media.thumbnail) : getMediaUrl(media.filename);
  
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div style="
        width: 48px; 
        height: 48px; 
        border-radius: 8px; 
        overflow: hidden; 
        border: 2px solid white; 
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        background-color: #1a1a1a;
      ">
        <img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -48]
  });
};

// Component to adjust bounds to fit all markers
const MapBounds = ({ markers }) => {
  const map = useMap();
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.exif_latitude, m.exif_longitude]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [markers, map]);
  return null;
};

export default function MapView({ user, onMediaClick }) {
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMapMedia = async () => {
      try {
        const response = await api.get('/media/map');
        setMediaItems(response.data);
      } catch (err) {
        console.error("Failed to load map media:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMapMedia();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Default center (can be somewhere nice like Paris or just 0,0 if no markers)
  const defaultCenter = mediaItems.length > 0 
    ? [mediaItems[0].exif_latitude, mediaItems[0].exif_longitude]
    : [48.8566, 2.3522];

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-white/5 relative z-0">
      <MapContainer 
        center={defaultCenter} 
        zoom={3} 
        className="w-full h-full bg-[#0a0a0a]"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          // We can use a dark theme tile layer for better aesthetics (CartoDB Dark Matter)
          // url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        <MapBounds markers={mediaItems} />

        {mediaItems.map(media => (
          <Marker 
            key={media.id} 
            position={[media.exif_latitude, media.exif_longitude]}
            icon={createThumbnailIcon(media, user)}
          >
            <Popup className="custom-popup">
              <div className="p-1 flex flex-col gap-2">
                <div 
                  className="w-40 h-40 rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => {
                    // Open the specific media in full screen
                    onMediaClick(media);
                  }}
                >
                  <img 
                    src={`http://localhost:3000/uploads/user_${user.id}/${media.thumbnail || media.filename}`} 
                    className="w-full h-full object-cover"
                    alt="Preview"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Global CSS for Leaflet tweaks in dark mode */}
      <style>{`
        .leaflet-container {
          background: #0a0a0a !important;
          font-family: inherit;
        }
        .leaflet-popup-content-wrapper {
          background: #1a1a1a;
          color: white;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
        }
        .leaflet-popup-tip {
          background: #1a1a1a;
        }
        .leaflet-popup-close-button {
          color: white !important;
          padding: 8px !important;
        }
      `}</style>
    </div>
  );
}
