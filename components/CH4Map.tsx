'use client';

import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import parseGeoraster from 'georaster';
import GeoRasterLayer from 'georaster-layer-for-leaflet';
import Papa from 'papaparse';
import 'leaflet/dist/leaflet.css';

interface CoalMine {
  name: string;
  latitude: number;
  longitude: number;
  status: string;
  production: string;
  mineType: string;
  state: string;
  emissions: string;
}

interface CSVRow {
  'Mine Name': string;
  'Latitude': string;
  'Longitude': string;
  'Status': string;
  'Production (Mtpa)': string;
  'Mine Type': string;
  'State, Province': string;
  'GEM Coal Mine Methane Emissions Estimate (M tonnes/yr)': string;
}

// Function to parse CSV data using PapaParse
const parseCSV = (csvText: string): CoalMine[] => {
  const parsed = Papa.parse<CSVRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false
  });
  
  console.log('CSV parsed:', parsed.data.length, 'rows');
  console.log('Sample row:', parsed.data[0]);
  
  const mines: CoalMine[] = [];
  
  parsed.data.forEach((row, index) => {
    const lat = parseFloat(row['Latitude']);
    const lon = parseFloat(row['Longitude']);
    
    if (!isNaN(lat) && !isNaN(lon)) {
      mines.push({
        name: row['Mine Name'] || 'Unknown Mine',
        latitude: lat,
        longitude: lon,
        status: row['Status'] || 'Unknown',
        production: row['Production (Mtpa)'] || 'N/A',
        mineType: row['Mine Type'] || 'Unknown',
        state: row['State, Province'] || 'Unknown',
        emissions: row['GEM Coal Mine Methane Emissions Estimate (M tonnes/yr)'] || 'N/A'
      });
    }
  });
  
  console.log('Parsed', mines.length, 'coal mines');
  return mines;
};

// Function to add coal mine markers
const addCoalMineMarkers = (map: L.Map, mines: CoalMine[]) => {
  // Create custom icon for coal mines
  const coalMineIcon = L.divIcon({
    className: 'coal-mine-marker',
    html: `<div style="
      background-color: #DC2626;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 0 4px rgba(0,0,0,0.5);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });

  mines.forEach(mine => {
    const marker = L.marker([mine.latitude, mine.longitude], {
      icon: coalMineIcon
    });

    // Create popup content
    const popupContent = `
      <div style="font-family: sans-serif; min-width: 200px;">
        <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #1f2937;">
          ${mine.name}
        </h3>
        <div style="font-size: 12px; color: #4b5563;">
          <p style="margin: 4px 0;"><strong>Status:</strong> ${mine.status}</p>
          <p style="margin: 4px 0;"><strong>Type:</strong> ${mine.mineType}</p>
          <p style="margin: 4px 0;"><strong>State:</strong> ${mine.state}</p>
          <p style="margin: 4px 0;"><strong>Production:</strong> ${mine.production} Mtpa</p>
          <p style="margin: 4px 0;"><strong>CH4 Emissions:</strong> ${mine.emissions} M tonnes/yr</p>
        </div>
      </div>
    `;

    marker.bindPopup(popupContent);
    marker.addTo(map);
  });
};

export default function CH4Map() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coalMines, setCoalMines] = useState<CoalMine[]>([]);
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

          // Fetch and parse coal mines CSV data
          try {
            const csvResponse = await fetch('/cleaned_data.csv');
            const csvText = await csvResponse.text();
            console.log('CSV fetched, size:', csvText.length);
            
            const mines = parseCSV(csvText);
            setCoalMines(mines);
            
            console.log('Adding', mines.length, 'coal mine markers to map');
            // Add coal mine markers
            addCoalMineMarkers(map, mines);
          } catch (csvError) {
            console.error('Could not load coal mines data:', csvError);
          }

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
