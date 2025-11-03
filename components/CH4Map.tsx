'use client';

import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import parseGeoraster from 'georaster';
import GeoRasterLayer from 'georaster-layer-for-leaflet';
import 'leaflet/dist/leaflet.css';

export default function CH4Map() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // Check if map container is available
    if (!mapRef.current) return;
    
    // Prevent double initialization
    if (mapInstanceRef.current) return;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (!mapRef.current) return;

      const initMap = async () => {
        try {
          setIsLoading(true);
          setError(null);

          // Initialize map with the ref - focused on India
          const map = L.map(mapRef.current!, {
            center: [20.5937, 78.9629], // Center of India
            zoom: 5,
            zoomControl: true,
            scrollWheelZoom: true,
            worldCopyJump: false,  // Disable jumping to world copies
            minZoom: 2,
            maxZoom: 18
          });
        
          mapInstanceRef.current = map;

          // Add base tile layer
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18,
            noWrap: true  // Prevent the map from wrapping around
          }).addTo(map);

          // Fetch and parse GeoTIFF
          const response = await fetch('/ch4_emissions.tif');
          if (!response.ok) {
            throw new Error('Failed to load GeoTIFF file');
          }
          
          const arrayBuffer = await response.arrayBuffer();
          const georaster = await parseGeoraster(arrayBuffer);

          console.log('GeoRaster loaded:', georaster);

          // Create and add raster layer
          const layer = new GeoRasterLayer({
            georaster,
            opacity: 0.7,
            pixelValuesToColorFn: (values: number[]) => {
              const ch4 = values[0];
              if (ch4 === undefined || ch4 === null) return null;
              if (ch4 < 1800) return 'rgba(0,255,0,0.5)';    // Low - Green
              if (ch4 < 1900) return 'rgba(255,255,0,0.5)';  // Medium - Yellow
              return 'rgba(255,0,0,0.5)';                    // High - Red
            },
            resolution: 256
          });
          
          // Add layer to map
          map.addLayer(layer);
          
          // Force a resize after a short delay to ensure proper rendering
          setTimeout(() => {
            map.invalidateSize();
          }, 100);
          
          setIsLoading(false);
        } catch (err) {
          console.error('Error loading map:', err);
          setError(err instanceof Error ? err.message : 'Failed to load map');
          setIsLoading(false);
        }
      };

      initMap();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-[600px] mt-8 relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
          <p className="text-gray-600">Loading map data...</p>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded-lg z-10">
          <p className="text-red-600">Error: {error}</p>
        </div>
      )}
      <div 
        ref={mapRef}
        className="w-full h-full rounded-lg shadow-lg"
        style={{ minHeight: '600px' }}
      />
    </div>
  );
}
