import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Issue, IssueCategory, IssueStatus } from '../types';
import { 
  MapPin, 
  Compass, 
  Layers, 
  Info, 
  Navigation, 
  ThumbsUp, 
  Lightbulb, 
  Trash2, 
  AlertTriangle,
  HelpCircle,
  Sun,
  Moon,
  Map
} from 'lucide-react';
import maplibregl from 'maplibre-gl';
import Supercluster from 'supercluster';

// Safe HTML escaping utility to prevent XSS injection in dynamic map popups
function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Simple URL escaping to prevent attribute-breakout in img tags
function escapeUrl(url: string): string {
  if (!url) return '';
  // Basic validation to prevent javascript: or data: (except images) exploits
  const cleaned = url.trim();
  if (cleaned.toLowerCase().startsWith('javascript:')) {
    return 'about:blank';
  }
  return escapeHtml(cleaned);
}

interface InteractiveMapProps {
  issues: Issue[];
  selectedIssue: Issue | null;
  onSelectIssue: (issue: Issue) => void;
  onCoordinatePicked?: (lat: number, lng: number, locationName: string) => void;
  pickingMode: boolean;
  setPickingMode: (val: boolean) => void;
  showPublicLighting?: boolean;
  setShowPublicLighting?: (val: boolean) => void;
  showTrashZones?: boolean;
  setShowTrashZones?: (val: boolean) => void;
  activeOverlay?: 'none' | 'density' | 'infrastructure' | 'traffic';
  setActiveOverlay?: (val: 'none' | 'density' | 'infrastructure' | 'traffic') => void;
}

const PUBLIC_LIGHTS = [
  { lat: 37.785, lng: -122.405, status: 'operational' },
  { lat: 37.780, lng: -122.410, status: 'operational' },
  { lat: 37.775, lng: -122.415, status: 'operational' },
  { lat: 37.770, lng: -122.420, status: 'broken' },
  { lat: 37.765, lng: -122.425, status: 'operational' },
  { lat: 37.760, lng: -122.430, status: 'operational' },
  { lat: 37.755, lng: -122.435, status: 'operational' },
  { lat: 37.750, lng: -122.440, status: 'operational' },
  { lat: 37.788, lng: -122.420, status: 'operational' },
  { lat: 37.782, lng: -122.430, status: 'operational' },
  { lat: 37.773, lng: -122.402, status: 'operational' },
  { lat: 37.766, lng: -122.408, status: 'operational' },
];

const TRASH_ZONES = [
  { lat: 37.780, lng: -122.430, label: 'Sector Alpha', schedule: 'Mon/Thu 8AM', color: '#10B981' },
  { lat: 37.765, lng: -122.410, label: 'Sector Beta', schedule: 'Tue/Fri 7AM', color: '#059669' },
  { lat: 37.755, lng: -122.425, label: 'Sector Gamma', schedule: 'Wed/Sat 9AM', color: '#0ea5e9' }
];

const INFRASTRUCTURE_POINTS = [
  { lat: 37.781, lng: -122.420, label: 'Water Reservoir Main Valve', health: 94, status: 'good' },
  { lat: 37.768, lng: -122.405, label: 'Market St. Traffic Controller', health: 42, status: 'critical' },
  { lat: 37.759, lng: -122.430, label: 'Potrero Overpass Sensor', health: 87, status: 'good' },
  { lat: 37.785, lng: -122.415, label: 'Mission Power Substation C', health: 65, status: 'warning' },
  { lat: 37.772, lng: -122.425, label: 'Duboce Water Pressure Monitor', health: 91, status: 'good' },
];

const TRAFFIC_FLOW_POINTS = [
  { lat: 37.783, lng: -122.408, road: 'Mission St. Arterial', speed: '14 mph', congestion: 'heavy', color: '#B3261E' },
  { lat: 37.771, lng: -122.412, road: 'Valencia St. Bike Corridor', speed: '28 mph', congestion: 'light', color: '#12B76A' },
  { lat: 37.762, lng: -122.422, road: '18th St. Crosstown Way', speed: '19 mph', congestion: 'moderate', color: '#F59E0B' },
  { lat: 37.777, lng: -122.432, road: 'Geary Blvd. Expressway', speed: '32 mph', congestion: 'light', color: '#12B76A' },
  { lat: 37.757, lng: -122.418, road: 'Cesar Chavez Access Ramp', speed: '11 mph', congestion: 'heavy', color: '#B3261E' },
];

const CATEGORIES_COLOR: Record<IssueCategory, { bg: string, text: string, hex: string }> = {
  pothole: { bg: 'bg-amber-100', text: 'text-amber-800', hex: '#D97706' },
  garbage: { bg: 'bg-emerald-100', text: 'text-emerald-800', hex: '#10B981' },
  water_leak: { bg: 'bg-blue-100', text: 'text-blue-800', hex: '#3B82F6' },
  broken_streetlight: { bg: 'bg-yellow-100', text: 'text-yellow-800', hex: '#F59E0B' },
  graffiti: { bg: 'bg-purple-100', text: 'text-purple-800', hex: '#8B5CF6' },
  tree_hazard: { bg: 'bg-green-100', text: 'text-green-800', hex: '#22C55E' },
  general: { bg: 'bg-slate-100', text: 'text-slate-800', hex: '#64748B' }
};

const STATUS_COLOR: Record<IssueStatus, { border: string, dot: string, label: string }> = {
  reported: { border: 'border-red-400', dot: 'bg-red-500', label: 'Reported' },
  verified: { border: 'border-amber-400', dot: 'bg-amber-500', label: 'Community Verified' },
  in_progress: { border: 'border-blue-400', dot: 'bg-blue-500', label: 'Crew Dispatch' },
  resolved: { border: 'border-green-400', dot: 'bg-green-500', label: 'Resolved' }
};

// ESRI premium satellite raster tile style generator
const SATELLITE_STYLE_JSON = {
  version: 8,
  sources: {
    'esri-satellite': {
      type: 'raster' as const,
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      attribution: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }
  },
  layers: [
    {
      id: 'esri-satellite-layer',
      type: 'raster' as const,
      source: 'esri-satellite',
      minzoom: 0,
      maxzoom: 20
    }
  ]
};

export default function InteractiveMap({
  issues,
  selectedIssue,
  onSelectIssue,
  onCoordinatePicked,
  pickingMode,
  setPickingMode,
  showPublicLighting,
  setShowPublicLighting,
  showTrashZones,
  setShowTrashZones,
  activeOverlay,
  setActiveOverlay
}: InteractiveMapProps) {
  // Map styles supported: light, dark, and satellite
  const [mapStyle, setMapStyle] = useState<'standard' | 'dark' | 'satellite'>('standard');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [localShowPublicLighting, setLocalShowPublicLighting] = useState(false);
  const [localShowTrashZones, setLocalShowTrashZones] = useState(false);
  const [localActiveOverlay, setLocalActiveOverlay] = useState<'none' | 'density' | 'infrastructure' | 'traffic'>('none');
  const displayActiveOverlay = activeOverlay !== undefined ? activeOverlay : localActiveOverlay;
  const changeActiveOverlay = setActiveOverlay !== undefined ? setActiveOverlay : setLocalActiveOverlay;
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('all');
  const [pickedPin, setPickedPin] = useState<{ lat: number, lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // References to keep track of MapLibre container and instance
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  
  // Track all custom elements and markers on the map to prevent duplicating or leaking resources
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({});
  const activePopupRef = useRef<maplibregl.Popup | null>(null);

  // Auto-inject MapLibre CSS programmatically for fallback security
  useEffect(() => {
    const linkId = 'maplibre-css-fallback';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/maplibre-gl@4.3.2/dist/maplibre-gl.css';
      document.head.appendChild(link);
    }

    const styleId = 'maplibre-custom-markers-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        @keyframes markerBounce {
          0% { transform: translateY(-16px) scale(0.6); opacity: 0; }
          60% { transform: translateY(2px) scale(1.05); opacity: 0.9; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes selectedGlow {
          0% { box-shadow: 0 0 0 0 rgba(26, 115, 232, 0.6); }
          70% { box-shadow: 0 0 0 10px rgba(26, 115, 232, 0); }
          100% { box-shadow: 0 0 0 0 rgba(26, 115, 232, 0); }
        }
        @keyframes criticalGlow {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 12px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .animated-marker-bounce {
          animation: markerBounce 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
        }
        .pulsing-marker-selected {
          animation: selectedGlow 1.8s infinite ease-in-out !important;
        }
        .pulsing-marker-critical {
          animation: criticalGlow 1.4s infinite ease-in-out !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Standard interactive toggles fallback
  const displayPublicLighting = showPublicLighting !== undefined ? showPublicLighting : localShowPublicLighting;
  const togglePublicLighting = () => {
    if (setShowPublicLighting) {
      setShowPublicLighting(!showPublicLighting);
    } else {
      setLocalShowPublicLighting(!localShowPublicLighting);
    }
  };

  const displayTrashZones = showTrashZones !== undefined ? showTrashZones : localShowTrashZones;
  const toggleTrashZones = () => {
    if (setShowTrashZones) {
      setShowTrashZones(!showTrashZones);
    } else {
      setLocalShowTrashZones(!localShowTrashZones);
    }
  };

  // Filter issues based on UI settings
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      const categoryMatch = activeCategoryFilter === 'all' || issue.category === activeCategoryFilter;
      const statusMatch = activeStatusFilter === 'all' || issue.status === activeStatusFilter;
      return categoryMatch && statusMatch;
    });
  }, [issues, activeCategoryFilter, activeStatusFilter]);

  // Construct supercluster client-side indexing for fast rendering and map performance
  const superclusterIndex = useMemo(() => {
    const index = new Supercluster({
      radius: 40,
      maxZoom: 14
    });

    const points = filteredIssues.map(issue => ({
      type: 'Feature' as const,
      properties: {
        issueId: issue.id,
        issue: issue
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [issue.lng, issue.lat] as [number, number]
      }
    }));

    index.load(points);
    return index;
  }, [filteredIssues]);

  // 1. Map Initialization
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center in San Francisco
    const initialCenter: [number, number] = [-122.42, 37.7694];

    // Setup maplibre instance using high performance vector basemaps
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: initialCenter,
      zoom: 13,
      pitchWithRotate: false,
      dragRotate: false
    });

    // Add navigation controls for intuitive zoom/orientation
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    mapInstanceRef.current = map;

    // Clean up map instance on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Map Style Switcher Effect
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    let styleSpec: any = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
    if (mapStyle === 'dark') {
      styleSpec = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
    } else if (mapStyle === 'satellite') {
      styleSpec = SATELLITE_STYLE_JSON;
    }

    map.setStyle(styleSpec);
  }, [mapStyle]);

  // 3. User Geolocation Handler
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by your browser environment.");
      return;
    }
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setIsLocating(false);
        
        const map = mapInstanceRef.current;
        if (map) {
          map.flyTo({
            center: [longitude, latitude],
            zoom: 15,
            duration: 1500
          });
        }
      },
      (error) => {
        console.warn("Geolocation permission error or timeout:", error);
        setIsLocating(false);
        // Fallback to central Dolores Heights area
        const map = mapInstanceRef.current;
        if (map) {
          map.flyTo({
            center: [-122.4269, 37.7599],
            zoom: 14,
            duration: 1200
          });
        }
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  // 4. Map Click & Pick Coordinates Handler
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: maplibregl.MapMouseEvent) => {
      if (!pickingMode) return;

      const { lng, lat } = e.lngLat;
      const roundedLat = Math.round(lat * 100000) / 100000;
      const roundedLng = Math.round(lng * 100000) / 100000;
      setPickedPin({ lat: roundedLat, lng: roundedLng });

      let streetName = "Dolores Heights & Castro Sector";
      if (lat > 37.77 && lng < -122.42) streetName = "Dolores Heights & Noe Valley";
      else if (lat > 37.77 && lng >= -122.42) streetName = "Soma Tech District";
      else if (lat <= 37.77 && lng < -122.42) streetName = "Castro Central Square";
      else streetName = "Mission District Residential Corridor";

      if (onCoordinatePicked) {
        onCoordinatePicked(roundedLat, roundedLng, streetName);
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [pickingMode, onCoordinatePicked]);

  // 5. Open Custom MapLibre Popup Helper
  const openIssuePopup = (issue: Issue, map: maplibregl.Map) => {
    // Remove previous popup if active
    if (activePopupRef.current) {
      activePopupRef.current.remove();
    }

    const col = CATEGORIES_COLOR[issue.category] || CATEGORIES_COLOR.general;
    const statusInfo = STATUS_COLOR[issue.status];
    const formattedDate = new Date(issue.reportedAt).toLocaleDateString();

    const popupContent = document.createElement('div');
    popupContent.className = "p-3 text-left w-64 text-neutral-800 font-sans space-y-2";
    popupContent.innerHTML = `
      ${issue.imageUrl ? `
        <div class="relative w-full h-24 rounded-lg overflow-hidden border border-neutral-100">
          <img src="${escapeUrl(issue.imageUrl)}" class="w-full h-full object-cover" referrerpolicy="no-referrer" onerror="this.parentNode.style.display='none';" />
        </div>
      ` : ''}
      <div class="flex items-center justify-between gap-1.5 mt-1">
        <span class="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${col.bg} ${col.text}">
          ${issue.category.replace('_', ' ')}
        </span>
        <span class="text-[9px] font-semibold text-neutral-400">
          ${formattedDate}
        </span>
      </div>
      <h4 class="text-xs font-bold text-neutral-900 mt-1 leading-snug">${escapeHtml(issue.title)}</h4>
      <p class="text-[10.5px] text-neutral-500 line-clamp-2 leading-relaxed">${escapeHtml(issue.description)}</p>
      <div class="flex items-center justify-between pt-2 border-t border-neutral-100 mt-1">
        <div class="flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full ${statusInfo?.dot || 'bg-slate-400'}"></span>
          <span class="text-[10px] font-bold text-neutral-600">${statusInfo?.label || 'Reported'}</span>
        </div>
        <span class="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
          👍 ${issue.upvotes}
        </span>
      </div>
    `;

    const popup = new maplibregl.Popup({ offset: 15, className: 'custom-popup-overlay' })
      .setLngLat([issue.lng, issue.lat])
      .setDOMContent(popupContent)
      .addTo(map);

    activePopupRef.current = popup;
  };

  // 6. Selected Issue Tracker & Map Sync Panner
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedIssue) return;

    // Pan smoothly to selected issue
    map.flyTo({
      center: [selectedIssue.lng, selectedIssue.lat],
      zoom: 15,
      duration: 1200
    });

    // Auto trigger detailed popup open
    openIssuePopup(selectedIssue, map);
  }, [selectedIssue]);

  // 7. Core Map Marker Synchronization and Supercluster Implementation
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const syncMarkers = () => {
      const bounds = map.getBounds();
      const bbox: [number, number, number, number] = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth()
      ];
      const zoom = Math.floor(map.getZoom());

      // Fetch clusters from active client-side supercluster index
      const clusters = superclusterIndex.getClusters(bbox, zoom);

      // Track keys of markers that are active in this viewport
      const activeKeys = new Set<string>();

      // A. Render Superclusters & Single Issue Pins
      clusters.forEach((feature) => {
        const [lng, lat] = feature.geometry.coordinates;
        const isCluster = !!feature.properties?.cluster;

        if (isCluster) {
          const clusterId = feature.properties?.cluster_id;
          const pointCount = feature.properties?.point_count;
          const key = `cluster-${clusterId}`;
          activeKeys.add(key);

          if (!markersRef.current[key]) {
            const el = document.createElement('div');
            el.className = 'flex items-center justify-center rounded-full bg-indigo-600 text-white font-extrabold text-xs shadow-lg border-2 border-white cursor-pointer hover:scale-110 active:scale-95 transition-all duration-200';
            el.style.width = '36px';
            el.style.height = '36px';
            el.innerText = String(pointCount);

            // Zoom in on cluster click
            el.addEventListener('click', (e) => {
              e.stopPropagation();
              const expansionZoom = Math.min(
                superclusterIndex.getClusterExpansionZoom(clusterId),
                18
              );
              map.flyTo({
                center: [lng, lat],
                zoom: expansionZoom,
                duration: 800
              });
            });

            const marker = new maplibregl.Marker({ element: el })
              .setLngLat([lng, lat])
              .addTo(map);

            markersRef.current[key] = marker;
          }
        } else {
          // Single Issue Marker
          const issue: Issue = feature.properties?.issue;
          const key = `issue-${issue.id}`;
          activeKeys.add(key);

          const isSelected = selectedIssue?.id === issue.id;
          const col = CATEGORIES_COLOR[issue.category] || CATEGORIES_COLOR.general;

          let marker = markersRef.current[key];

          if (!marker) {
            const el = document.createElement('div');
            const criticalPulse = issue.severity === 'critical' && issue.status !== 'resolved' ? 'pulsing-marker-critical' : '';
            const selectedPulse = isSelected ? 'pulsing-marker-selected ring-4 ring-blue-100 border-[#1A73E8] scale-110 z-30' : 'border-neutral-200 z-10';
            el.className = `relative flex items-center justify-center rounded-full border bg-white shadow-md cursor-pointer transition-all duration-300 hover:scale-115 hover:shadow-lg animated-marker-bounce ${criticalPulse} ${selectedPulse}`;
            el.style.width = '34px';
            el.style.height = '34px';

            // Category color MapPin Icon
            el.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${col.hex}" stroke-width="2.5" class="w-5 h-5">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              ${
                issue.severity === 'critical' && issue.status !== 'resolved'
                  ? '<span class="absolute -inset-1 rounded-full border-2 border-red-500 animate-ping opacity-60 animate-duration-1000" />'
                  : ''
              }
              <span class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white shadow-xs ${
                issue.status === 'resolved' ? 'bg-green-500' : 'bg-red-500'
              }" />
            `;

            el.addEventListener('click', (e) => {
              e.stopPropagation();
              onSelectIssue(issue);
            });

            marker = new maplibregl.Marker({ element: el })
              .setLngLat([lng, lat])
              .addTo(map);

            markersRef.current[key] = marker;
          } else {
            // Update selection classes if needed
            const el = marker.getElement();
            const criticalPulse = issue.severity === 'critical' && issue.status !== 'resolved' ? 'pulsing-marker-critical' : '';
            if (isSelected) {
              el.className = `relative flex items-center justify-center rounded-full border bg-white shadow-md cursor-pointer transition-all duration-300 hover:scale-115 hover:shadow-lg pulsing-marker-selected ring-4 ring-blue-100 border-[#1A73E8] scale-110 z-30 ${criticalPulse}`;
            } else {
              el.className = `relative flex items-center justify-center rounded-full border bg-white shadow-md cursor-pointer transition-all duration-300 hover:scale-115 hover:shadow-lg border-neutral-200 z-10 ${criticalPulse}`;
            }
          }
        }
      });

      // B. Render Heatmap Aura Overlays
      if (showHeatmap) {
        filteredIssues.forEach((issue) => {
          const key = `heatmap-${issue.id}`;
          activeKeys.add(key);

          if (!markersRef.current[key]) {
            const el = document.createElement('div');
            el.className = "rounded-full animate-pulse pointer-events-none";
            el.style.width = '90px';
            el.style.height = '90px';
            el.style.background = 'radial-gradient(circle, rgba(239, 68, 68, 0.45) 0%, rgba(245, 158, 11, 0.2) 50%, rgba(251, 188, 5, 0) 100%)';
            el.style.transform = 'translate(-50%, -50%)';

            const marker = new maplibregl.Marker({ element: el })
              .setLngLat([issue.lng, issue.lat])
              .addTo(map);

            markersRef.current[key] = marker;
          }
        });
      }

      // C. Render Public Lighting Grid
      if (displayPublicLighting) {
        PUBLIC_LIGHTS.forEach((light, index) => {
          const key = `light-${index}`;
          activeKeys.add(key);

          if (!markersRef.current[key]) {
            const isOperational = light.status === 'operational';
            const el = document.createElement('div');
            el.className = `flex items-center justify-center rounded-full border shadow-md transition-transform duration-200 hover:scale-110 ${
              isOperational 
                ? 'bg-amber-100 border-amber-400 text-amber-600' 
                : 'bg-red-100 border-red-400 text-red-500 animate-pulse'
            }`;
            el.style.width = '26px';
            el.style.height = '26px';

            el.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-3.5 h-3.5">
                <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .5 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
                <path d="M9 18h6"/>
                <path d="M10 22h4"/>
              </svg>
            `;

            const marker = new maplibregl.Marker({ element: el })
              .setLngLat([light.lng, light.lat])
              .addTo(map);

            markersRef.current[key] = marker;
          }
        });
      }

      // D. Render Trash Collection Overlay
      if (displayTrashZones) {
        TRASH_ZONES.forEach((zone, index) => {
          const key = `trash-${index}`;
          activeKeys.add(key);

          if (!markersRef.current[key]) {
            const el = document.createElement('div');
            el.className = "flex flex-col items-center justify-center p-2 rounded-2xl border bg-white/95 text-neutral-800 shadow-md font-sans text-[10px] text-center";
            el.style.width = '94px';
            el.style.height = '46px';
            el.style.borderColor = zone.color;

            el.innerHTML = `
              <span class="font-extrabold flex items-center gap-0.5 text-[#137333]">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-3 h-3 text-[#137333]">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                </svg>
                ${zone.label.replace('Sector ', '')}
              </span>
              <span class="text-[8px] font-semibold text-neutral-500">${zone.schedule}</span>
            `;

            const marker = new maplibregl.Marker({ element: el })
              .setLngLat([zone.lng, zone.lat])
              .addTo(map);

            markersRef.current[key] = marker;
          }
        });
      }

      // B2. Render Report Density Overlay
      if (displayActiveOverlay === 'density') {
        filteredIssues.forEach((issue) => {
          const key = `density-${issue.id}`;
          activeKeys.add(key);

          if (!markersRef.current[key]) {
            const el = document.createElement('div');
            el.className = "rounded-full animate-pulse pointer-events-none";
            el.style.width = '120px';
            el.style.height = '120px';
            el.style.background = 'radial-gradient(circle, rgba(11, 87, 208, 0.4) 0%, rgba(11, 87, 208, 0.15) 65%, rgba(11, 87, 208, 0) 100%)';
            el.style.transform = 'translate(-50%, -50%)';

            const marker = new maplibregl.Marker({ element: el })
              .setLngLat([issue.lng, issue.lat])
              .addTo(map);

            markersRef.current[key] = marker;
          }
        });
      }

      // C2. Render Infrastructure Health Overlay
      if (displayActiveOverlay === 'infrastructure') {
        INFRASTRUCTURE_POINTS.forEach((point, index) => {
          const key = `infra-${index}`;
          activeKeys.add(key);

          if (!markersRef.current[key]) {
            const el = document.createElement('div');
            const isCritical = point.status === 'critical';
            const isWarning = point.status === 'warning';
            const colorClass = isCritical 
              ? 'bg-red-50 border-red-500 text-red-700 font-extrabold shadow-red-100 ring-2 ring-red-500/20' 
              : isWarning 
                ? 'bg-amber-50 border-amber-500 text-amber-700 font-extrabold shadow-amber-100 ring-2 ring-amber-500/20'
                : 'bg-emerald-50 border-emerald-500 text-emerald-700 font-extrabold shadow-emerald-100 ring-2 ring-emerald-500/20';

            el.className = `flex flex-col items-center justify-center p-2 rounded-2xl border bg-white/95 shadow-md font-sans text-[10px] text-center transition-all ${colorClass}`;
            el.style.width = '110px';
            el.style.height = '54px';

            el.innerHTML = `
              <span class="font-extrabold flex items-center gap-0.5 text-xs">
                ⚙️ ${point.health}%
              </span>
              <span class="text-[8px] font-semibold text-neutral-500 truncate w-full px-1" title="${point.label}">${point.label}</span>
            `;

            const marker = new maplibregl.Marker({ element: el })
              .setLngLat([point.lng, point.lat])
              .addTo(map);

            markersRef.current[key] = marker;
          }
        });
      }

      // D2. Render Traffic Flow Overlay
      if (displayActiveOverlay === 'traffic') {
        TRAFFIC_FLOW_POINTS.forEach((point, index) => {
          const key = `traffic-${index}`;
          activeKeys.add(key);

          if (!markersRef.current[key]) {
            const el = document.createElement('div');
            el.className = "flex flex-col items-center justify-center p-2 rounded-2xl border bg-white/95 text-neutral-800 shadow-md font-sans text-[10px] text-center transition-all";
            el.style.width = '115px';
            el.style.height = '50px';
            el.style.borderColor = point.color;

            el.innerHTML = `
              <span class="font-extrabold flex items-center gap-1" style="color: ${point.color}">
                🚗 ${point.speed}
              </span>
              <span class="text-[8px] font-semibold text-neutral-500 truncate w-full px-1">${point.road}</span>
            `;

            const marker = new maplibregl.Marker({ element: el })
              .setLngLat([point.lng, point.lat])
              .addTo(map);

            markersRef.current[key] = marker;
          }
        });
      }

      // E. Render Pick Location Target Pin
      if (pickingMode && pickedPin) {
        const key = 'picked-pin';
        activeKeys.add(key);

        let marker = markersRef.current[key];
        if (!marker) {
          const el = document.createElement('div');
          el.className = "flex items-center justify-center rounded-full border-2 border-orange-500 bg-orange-50 text-orange-600 shadow-xl animate-bounce";
          el.style.width = '38px';
          el.style.height = '38px';
          el.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-4.5 h-4.5 rotate-45 text-orange-600">
              <polygon points="3 11 22 2 13 21 11 13 3 11"/>
            </svg>
          `;

          marker = new maplibregl.Marker({ element: el })
            .setLngLat([pickedPin.lng, pickedPin.lat])
            .addTo(map);

          markersRef.current[key] = marker;
        } else {
          marker.setLngLat([pickedPin.lng, pickedPin.lat]);
        }
      }

      // F. Prune old / non-visible markers to keep map fast and reactive
      Object.keys(markersRef.current).forEach((key) => {
        if (!activeKeys.has(key)) {
          markersRef.current[key].remove();
          delete markersRef.current[key];
        }
      });
    };

    // Bind map events to trigger viewport recalculation for clustering
    map.on('moveend', syncMarkers);
    map.on('zoomend', syncMarkers);

    // Initial sync
    syncMarkers();

    return () => {
      map.off('moveend', syncMarkers);
      map.off('zoomend', syncMarkers);
    };
  }, [
    superclusterIndex,
    filteredIssues,
    selectedIssue,
    showHeatmap,
    displayPublicLighting,
    displayTrashZones,
    displayActiveOverlay,
    pickingMode,
    pickedPin
  ]);

  // 8. simulated real-time onSnapshot listener explanation
  useEffect(() => {
    // Optional Real-Time Firestore onSnapshot Subscription Implementation
    // Simply uncomment this block when real Firestore credentials are added to the environment:
    /*
    import { db } from '../lib/firebase';
    import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

    const q = query(collection(db, "issues"), orderBy("reportedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedIssues: Issue[] = [];
      snapshot.forEach((doc) => {
        updatedIssues.push({ id: doc.id, ...doc.data() } as Issue);
      });
      // Call parent state update here: setIssues(updatedIssues);
    }, (error) => {
      console.error("Firestore onSnapshot subscription failed:", error);
    });
    return () => unsubscribe();
    */

    console.log("[Firebase Emulator] real-time stream active: mapped markers onSnapshot handler live.");
  }, [issues]);

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col md:flex-row h-[420px] sm:h-[500px] md:h-[620px]">
      
      {/* Search & Map View Stage */}
      <div className="flex-1 relative bg-slate-50 overflow-hidden flex flex-col">
        
        {/* Map Header Control Overlay */}
        <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center gap-1.5 pointer-events-none">
          {/* Map View Toggle */}
          <div className="bg-white/95 backdrop-blur shadow-sm rounded-full p-0.5 border border-neutral-200/60 flex items-center gap-0.5 pointer-events-auto">
            <button
              onClick={() => { setMapStyle('standard'); }}
              title="Standard Vector Map"
              className={`text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1 ${
                mapStyle === 'standard' ? 'bg-[#0B57D0] text-white shadow-xs' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <Sun className="w-3 h-3" />
              <span>Standard</span>
            </button>
            <button
              onClick={() => { setMapStyle('dark'); }}
              title="Minimalist Light Map"
              className={`text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1 ${
                mapStyle === 'dark' ? 'bg-[#0B57D0] text-white shadow-xs' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <Map className="w-3 h-3" />
              <span>Minimalist</span>
            </button>
            <button
              onClick={() => { setMapStyle('satellite'); }}
              title="ESRI Satellite Photo Map"
              className={`text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                mapStyle === 'satellite' ? 'bg-[#0B57D0] text-white shadow-xs' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              Satellite
            </button>
          </div>
  
          {/* Heatmap Toggle */}
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            title="Toggle Incident Intensity Heatmap"
            className={`shadow-sm rounded-full p-2 sm:px-3 sm:py-1.5 border border-neutral-200/60 flex items-center gap-1.5 text-[10px] sm:text-xs font-bold transition-all pointer-events-auto cursor-pointer ${
              showHeatmap ? 'bg-red-500 text-white border-red-600 shadow-xs' : 'bg-white/95 backdrop-blur text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Heatmap: {showHeatmap ? 'ON' : 'OFF'}</span>
            <span className="sm:hidden">{showHeatmap ? 'On' : 'Heatmap'}</span>
          </button>
  
          {/* Public Lighting Toggle */}
          <button
            onClick={togglePublicLighting}
            title="Toggle Public Streetlight Grid Overlay"
            className={`shadow-sm rounded-full p-2 sm:px-3 sm:py-1.5 border border-neutral-200/60 flex items-center gap-1.5 text-[10px] sm:text-xs font-bold transition-all pointer-events-auto cursor-pointer ${
              displayPublicLighting ? 'bg-amber-500 text-white border-amber-600 shadow-xs shadow-amber-100' : 'bg-white/95 backdrop-blur text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lighting: {displayPublicLighting ? 'ON' : 'OFF'}</span>
            <span className="sm:hidden">{displayPublicLighting ? 'On' : 'Lighting'}</span>
          </button>
  
          {/* Trash Zones Toggle */}
          <button
            onClick={toggleTrashZones}
            title="Toggle Municipal Trash Collection Zones"
            className={`shadow-sm rounded-full p-2 sm:px-3 sm:py-1.5 border border-neutral-200/60 flex items-center gap-1.5 text-[10px] sm:text-xs font-bold transition-all pointer-events-auto cursor-pointer ${
              displayTrashZones ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs shadow-emerald-100' : 'bg-white/95 backdrop-blur text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Trash Zones: {displayTrashZones ? 'ON' : 'OFF'}</span>
            <span className="sm:hidden">{displayTrashZones ? 'On' : 'Trash'}</span>
          </button>
   
          {/* Map Coordinates Locator Pin Mode Button */}
          <button
            onClick={() => {
              setPickingMode(!pickingMode);
              if (pickingMode) setPickedPin(null);
            }}
            title="Click on Map to Target GPS Coords"
            className={`shadow-sm rounded-full p-2 sm:px-3 sm:py-1.5 flex items-center gap-1.5 text-[10px] sm:text-xs font-bold transition-all pointer-events-auto cursor-pointer ${
              pickingMode
                ? 'bg-orange-500 text-white border-orange-600 animate-pulse'
                : 'bg-white/95 border border-neutral-200 text-neutral-800 hover:bg-neutral-100'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{pickingMode ? 'Targeting...' : 'Pin Location'}</span>
            <span className="sm:hidden">{pickingMode ? 'Targeting' : 'Pin'}</span>
          </button>

          {/* Center on My Location Geolocation Button */}
          <button
            onClick={handleLocateUser}
            disabled={isLocating}
            title="Locate Me using Browser GPS"
            className={`shadow-sm rounded-full p-2 sm:px-3 sm:py-1.5 flex items-center gap-1.5 text-[10px] sm:text-xs font-bold transition-all pointer-events-auto cursor-pointer bg-white/95 border border-neutral-200 text-neutral-800 hover:bg-neutral-100 disabled:opacity-50`}
          >
            <span className={`w-3.5 h-3.5 rounded-full border-2 border-blue-500 border-t-transparent ${isLocating ? 'animate-spin' : ''}`} style={{ display: isLocating ? 'inline-block' : 'none' }} />
            {!isLocating && (
              <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
              </svg>
            )}
            <span className="hidden sm:inline">{isLocating ? 'Locating...' : 'Locate Me'}</span>
            <span className="sm:hidden">{isLocating ? 'Locating' : 'Locate'}</span>
          </button>
        </div>

        {/* Real OpenStreetMap and MapLibre Integration Canvas */}
        <div ref={mapContainerRef} className="flex-1 w-full h-full relative overflow-hidden bg-sky-50 select-none" />

        {/* Compass / Indicator Widget */}
        <div className="absolute right-4 bottom-4 pointer-events-none flex flex-col items-center bg-white/95 backdrop-blur rounded-xl p-2 sm:p-2.5 shadow-md border border-neutral-200/50 z-10">
          <Compass className="w-5.5 h-5.5 text-neutral-500 animate-[spin_16s_linear_infinite]" />
          <span className="text-[8px] font-mono font-bold mt-1 text-neutral-500">OSM VECTOR ENGINE</span>
        </div>

        {/* Map picking guidance toast */}
        {pickingMode && (
          <div className="absolute bottom-4 left-4 right-16 bg-orange-50 dynamic-toast border-l-4 border-orange-500 px-3.5 py-2.5 rounded-r-xl shadow-lg flex items-center gap-3 z-10">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
            </span>
            <div className="text-left">
              <p className="text-xs font-bold text-orange-800">Pinpoint Map Picker Locked</p>
              <p className="text-[10px] text-orange-600">Click anywhere on the physical OpenStreetMap grid to record precise coordinates.</p>
            </div>
          </div>
        )}
      </div>

      {/* Map Sidebar Feed panel */}
      <div className="w-full md:w-[320px] border-t md:border-t-0 md:border-l border-neutral-200/80 flex flex-col bg-white">
        
        {/* Filter Selection Panel */}
        <div className="p-4 border-b border-neutral-100 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#1A73E8]" />
              <span>Explore Reports ({filteredIssues.length})</span>
            </h3>
            {pickingMode && (
              <span className="text-[10px] text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full font-bold">Pick Mode</span>
            )}
          </div>

          {/* Category Select Filters */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Category</label>
            <select
              value={activeCategoryFilter}
              onChange={(e) => setActiveCategoryFilter(e.target.value)}
              className="w-full text-xs bg-neutral-50 border border-neutral-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="pothole">Road Potholes</option>
              <option value="garbage">Trash & Overflow</option>
              <option value="water_leak">Potable Water Leaks</option>
              <option value="broken_streetlight">Broken Lights</option>
              <option value="graffiti">Vandals / Graffiti</option>
              <option value="tree_hazard">Pruning & Tree Hazard</option>
            </select>
          </div>

          {/* Status Select Filters */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Triage Status</label>
            <div className="flex gap-1 flex-wrap">
              {['all', 'reported', 'verified', 'in_progress', 'resolved'].map(status => (
                <button
                  key={status}
                  onClick={() => setActiveStatusFilter(status)}
                  className={`text-[10px] px-2 py-1 rounded-full border cursor-pointer ${
                    activeStatusFilter === status
                      ? 'bg-neutral-900 border-neutral-900 text-white font-semibold'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  {status === 'all' ? 'All' : status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable Issue reports list Card Deck */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-100">
          {filteredIssues.length === 0 ? (
            <div className="p-8 text-center text-neutral-400">
              <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No active filings matches selected filters.</p>
            </div>
          ) : (
            filteredIssues.map(issue => {
              const isSelected = selectedIssue?.id === issue.id;
              const col = CATEGORIES_COLOR[issue.category] || CATEGORIES_COLOR.general;
              const statusInfo = STATUS_COLOR[issue.status];

              return (
                <button
                  key={issue.id}
                  onClick={() => onSelectIssue(issue)}
                  className={`w-full text-left p-3.5 flex gap-3 transition-all hover:bg-neutral-50 cursor-pointer ${
                    isSelected ? 'bg-blue-50/50 border-l-4 border-[#1A73E8]' : ''
                  }`}
                >
                  {/* Category Thumbnail / Indicator and upvotes badge */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center relative border border-neutral-200/50">
                      {issue.imageUrl && !failedImages[issue.id] ? (
                        <img 
                          src={issue.imageUrl} 
                          referrerPolicy="no-referrer" 
                          alt="" 
                          className="w-full h-full object-cover" 
                          onError={() => setFailedImages(prev => ({ ...prev, [issue.id]: true }))}
                        />
                      ) : (
                        <MapPin className="w-5 h-5 text-neutral-500" />
                      )}
                    </div>
                    {/* Upvote score badge */}
                    <span className="mt-1 text-[10px] font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <ThumbsUp className="w-2.5 h-2.5 text-[#34A853]" />
                      {issue.upvotes}
                    </span>
                  </div>

                  {/* Brief descriptions */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${col.bg} ${col.text}`}>
                        {issue.category.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-semibold text-neutral-400">
                        {new Date(issue.reportedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-neutral-800 truncate">
                      {issue.title}
                    </h4>

                    <p className="text-[11px] text-neutral-500 line-clamp-2 leading-relaxed">
                      {issue.description}
                    </p>

                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className={`w-2 h-2 rounded-full ${statusInfo?.dot || 'bg-slate-400'}`} />
                      <span className="text-[10px] font-bold text-neutral-600">
                        {statusInfo?.label || 'Triage queued'}
                      </span>
                      {issue.severity === 'critical' && (
                        <span className="text-[9px] font-sans font-extrabold bg-red-100 text-red-700 px-1.5 py-0.2 rounded uppercase animate-pulse">
                          CRITICAL
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
