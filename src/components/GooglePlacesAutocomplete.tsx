import React, { useState, useEffect, useRef } from 'react';
import { Navigation, Search, MapPin } from 'lucide-react';

interface GooglePlacesAutocompleteProps {
  lat: number;
  lng: number;
  setLat: (lat: number) => void;
  setLng: (lng: number) => void;
  locationName: string;
  setLocationName: (name: string) => void;
  onEnterPickingMode: () => void;
}

export default function GooglePlacesAutocomplete({
  lat,
  lng,
  setLat,
  setLng,
  locationName,
  setLocationName,
  onEnterPickingMode
}: GooglePlacesAutocompleteProps) {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTextChange = (text: string) => {
    setLocationName(text);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!text.trim() || text.length < 3) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    // Debounce Nominatim API requests to protect rate limits and prevent lag
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        // Search Nominatim with San Francisco bounding box coordinates to focus suggestions locally
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            text
          )}&limit=5&addressdetails=1&viewbox=-122.517,37.832,-122.355,37.693&bounded=1`,
          {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'UrbanMind-CivicPlatform/1.0 (anshdeeep.singh.2006@gmail.com)'
            }
          }
        );
        const data = await response.json();
        setIsSearching(false);

        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((item: any) => {
            const displayName = item.display_name;
            const parts = displayName.split(',');
            const mainText = item.name || parts[0];
            const secondaryText = parts.slice(1).join(',').trim();

            return {
              place_id: item.place_id,
              description: displayName,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
              structured_formatting: {
                main_text: mainText,
                secondary_text: secondaryText
              }
            };
          });
          setPredictions(formatted);
          setShowDropdown(true);
        } else {
          setPredictions([]);
          setShowDropdown(false);
        }
      } catch (err) {
        setIsSearching(false);
        console.error("OpenStreetMap Nominatim search error:", err);
      }
    }, 450); // 450ms debounce
  };

  const handleSelectPrediction = (prediction: any) => {
    setLocationName(prediction.description);
    setLat(prediction.lat);
    setLng(prediction.lng);
    setPredictions([]);
    setShowDropdown(false);
  };

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-neutral-50 rounded-2xl p-4 space-y-3 relative border border-neutral-200/50">
      <div className="flex items-center justify-between">
        <label className="text-xs font-extrabold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
          <Navigation className="w-3.5 h-3.5 text-blue-600" />
          <span>OSM Location Anchor</span>
        </label>
        <button
          type="button"
          onClick={onEnterPickingMode}
          className="text-xs font-bold text-blue-600 hover:text-indigo-600 transition-colors hover:underline cursor-pointer flex items-center gap-1"
        >
          <MapPin className="w-3 h-3" />
          <span>Pick on Map</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Lat */}
        <div className="bg-white px-3 py-2 rounded-xl border border-neutral-200">
          <p className="text-[10px] font-bold text-neutral-400">Latitude coordinate</p>
          <span className="text-xs font-mono font-bold text-neutral-700">
            {Math.round(lat * 100000) / 100000}
          </span>
        </div>
        {/* Lng */}
        <div className="bg-white px-3 py-2 rounded-xl border border-neutral-200">
          <p className="text-[10px] font-bold text-neutral-400">Longitude coordinate</p>
          <span className="text-xs font-mono font-bold text-neutral-700">
            {Math.round(lng * 100000) / 100000}
          </span>
        </div>
      </div>

      {/* Street estimate text input with floating predictions dropdown */}
      <div className="text-left space-y-1 relative">
        <p className="text-[10px] font-bold text-neutral-400">Search Address or Landmark (OpenStreetMap)</p>
        <div className="relative group">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-3.5 h-3.5 text-neutral-400 group-focus-within:text-blue-500 transition-colors" />
          </span>
          <input
            type="text"
            required
            value={locationName}
            onChange={(e) => handleTextChange(e.target.value)}
            onFocus={() => {
              if (predictions.length > 0) {
                setShowDropdown(true);
              }
            }}
            placeholder="Search streets, parks, or neighborhoods..."
            className="w-full text-xs font-semibold bg-white border border-neutral-200 rounded-lg pl-9 pr-8 py-2 text-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
          />
          {isSearching && (
            <span className="absolute right-2.5 top-2.5 flex h-4 w-4">
              <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-blue-500 border-t-transparent" />
            </span>
          )}
        </div>

        {/* Floating Predictions list */}
        {showDropdown && predictions.length > 0 && (
          <>
            <div 
              className="fixed inset-0 z-30 cursor-default" 
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute top-[52px] left-0 right-0 bg-white border border-neutral-200 rounded-xl shadow-xl z-40 max-h-[180px] overflow-y-auto divide-y divide-neutral-100">
              {predictions.map((p) => (
                <button
                  key={p.place_id}
                  type="button"
                  onClick={() => handleSelectPrediction(p)}
                  className="w-full text-left p-3 hover:bg-slate-50 transition-all text-xs text-neutral-700 font-medium flex flex-col gap-0.5 cursor-pointer"
                >
                  <span className="font-bold text-neutral-800">{p.structured_formatting.main_text}</span>
                  <span className="text-[10px] text-neutral-400 truncate">{p.structured_formatting.secondary_text}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
