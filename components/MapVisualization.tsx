import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Vehicle, VehicleStatus, VehicleType } from '../types';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { 
  Map as MapIcon, 
  Globe, 
  AlertTriangle, 
  Truck, 
  Car, 
  Box, 
  Navigation, 
  Clock, 
  WifiOff 
} from 'lucide-react';

interface MapVisualizationProps {
  vehicles: Vehicle[];
  selectedVehicleId: string | null;
  onSelectVehicle: (id: string) => void;
}

const DARK_MODE_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
];

const SF_CENTER = { lat: 37.7749, lng: -122.4194 };
const VIEW_RANGE = 0.08; // Degrees ~8km
const MAPS_API_KEY = 'AIzaSyDQiKUv6ymiLhB3JW2x-gtL4tVQUFShNY0'; 

// --- Marker Helpers ---
const getVehicleTypeIcon = (type: VehicleType) => {
  switch (type) {
    case VehicleType.Truck: return <Truck className="w-4 h-4" />;
    case VehicleType.Van: return <Box className="w-4 h-4" />;
    case VehicleType.Car: return <Car className="w-4 h-4" />;
    default: return <Car className="w-4 h-4" />;
  }
};

const getStatusConfig = (status: VehicleStatus, heading: number = 0) => {
  switch(status) {
    case VehicleStatus.Moving:
      return {
        bg: 'bg-emerald-500',
        border: 'border-emerald-600',
        shadow: 'shadow-[0_0_10px_rgba(16,185,129,0.5)]',
        icon: <Navigation className="w-2.5 h-2.5 text-white" style={{ transform: `rotate(${heading}deg)` }} />
      };
    case VehicleStatus.Idle:
      return {
        bg: 'bg-amber-500',
        border: 'border-amber-600',
        shadow: 'shadow-none',
        icon: <Clock className="w-2.5 h-2.5 text-white" />
      };
    case VehicleStatus.Alert:
      return {
        bg: 'bg-red-500',
        border: 'border-red-600',
        shadow: 'shadow-[0_0_10px_rgba(239,68,68,0.6)]',
        icon: <AlertTriangle className="w-2.5 h-2.5 text-white" />
      };
    case VehicleStatus.Offline:
      return {
        bg: 'bg-slate-500',
        border: 'border-slate-600',
        shadow: 'shadow-none',
        icon: <WifiOff className="w-2.5 h-2.5 text-white" />
      };
    default:
      return {
        bg: 'bg-blue-500',
        border: 'border-blue-600',
        shadow: 'shadow-none',
        icon: <div className="w-1.5 h-1.5 bg-white rounded-full" />
      };
  }
};

const VehicleMarkerContent = ({ vehicle, isSelected }: { vehicle: Vehicle, isSelected: boolean }) => {
  const statusConfig = getStatusConfig(vehicle.status, vehicle.coordinates.heading);
  
  return (
    <div className="relative group cursor-pointer transition-transform duration-200" 
         style={{ transform: isSelected ? 'scale(1.1)' : 'scale(1)' }}>
      
      {/* Label (Hover or Selected) */}
      <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-0.5 bg-slate-900/90 text-[10px] font-medium text-white rounded border border-slate-700 whitespace-nowrap z-20 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity pointer-events-none shadow-xl`}>
        {vehicle.name}
      </div>

      {/* Heading Cone (Only for moving) */}
      {vehicle.status === VehicleStatus.Moving && (
          <div 
              className="absolute top-1/2 left-1/2 w-16 h-16 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-t from-emerald-500/20 to-transparent rounded-[100%] z-0 pointer-events-none"
              style={{ 
                  transform: `translate(-50%, -50%) rotate(${vehicle.coordinates.heading}deg)`,
                  clipPath: 'polygon(50% 50%, 0 0, 100% 0)'
              }}
          />
      )}
      
      {/* Main Marker Body */}
      <div className={`relative z-10 w-9 h-9 rounded-full bg-slate-800 border-2 ${isSelected ? 'border-indigo-400' : 'border-white'} shadow-lg flex items-center justify-center text-slate-200`}>
         {getVehicleTypeIcon(vehicle.type)}
      </div>

      {/* Status Badge */}
      <div className={`absolute -top-1 -right-1 z-20 w-5 h-5 rounded-full flex items-center justify-center border-[1.5px] border-slate-900 ${statusConfig.bg} ${statusConfig.shadow}`}>
         {statusConfig.icon}
      </div>
    </div>
  );
};

// --- Sub-component to handle map context and clustering ---
const ClusteredVehicles: React.FC<{
    vehicles: Vehicle[], 
    selectedVehicleId: string | null, 
    onSelectVehicle: (id: string) => void 
}> = ({ vehicles, selectedVehicleId, onSelectVehicle }) => {
    const map = useMap();
    const clusterer = useRef<MarkerClusterer | null>(null);
    const markersRef = useRef<{[key: string]: any}>({});

    // Initialize Clusterer
    useEffect(() => {
        if (!map) return;
        
        if (!clusterer.current) {
            clusterer.current = new MarkerClusterer({ map });
        }
    }, [map]);

    // Update Clusterer when vehicles change (positions update)
    useEffect(() => {
        if (!clusterer.current) return;
        
        // Clear and re-add markers to ensure clusters update with movement
        // In a highly optimized app, we might check for significant distance changes,
        // but for <100 vehicles, this is performant enough.
        clusterer.current.clearMarkers();
        
        // Filter out markers that might have been removed from data
        const currentMarkers = vehicles
            .map(v => markersRef.current[v.id])
            .filter(m => m !== undefined);
            
        clusterer.current.addMarkers(currentMarkers);
    }, [vehicles]); // Re-run when vehicle data (positions) updates

    const setMarkerRef = (marker: any | null, id: string) => {
        if (marker) {
            markersRef.current[id] = marker;
        } else {
            delete markersRef.current[id];
        }
    };

    return (
        <>
            {vehicles.map((vehicle) => (
                <AdvancedMarker
                    ref={(marker) => setMarkerRef(marker, vehicle.id)}
                    key={vehicle.id}
                    position={{ lat: vehicle.coordinates.lat, lng: vehicle.coordinates.lng }}
                    onClick={() => onSelectVehicle(vehicle.id)}
                    zIndex={selectedVehicleId === vehicle.id ? 50 : 1}
                >
                    <VehicleMarkerContent vehicle={vehicle} isSelected={selectedVehicleId === vehicle.id} />
                </AdvancedMarker>
            ))}
        </>
    );
};

const MapVisualization: React.FC<MapVisualizationProps> = ({ vehicles, selectedVehicleId, onSelectVehicle }) => {
  const [viewMode, setViewMode] = useState<'tactical' | 'satellite'>('satellite');

  // --- Tactical View (SVG) Helpers ---
  const projectToSVG = (lat: number, lng: number) => {
    const x = ((lng - (SF_CENTER.lng - VIEW_RANGE)) / (VIEW_RANGE * 2)) * 100;
    const y = 100 - ((lat - (SF_CENTER.lat - VIEW_RANGE)) / (VIEW_RANGE * 2)) * 100;
    return { x, y };
  };

  const gridLines = useMemo(() => {
    const lines = [];
    for(let i=1; i<20; i++) {
        lines.push(<line key={`v-${i}`} x1={`${i*5}%`} y1="0" x2={`${i*5}%`} y2="100%" stroke="#1e293b" strokeWidth="1" />);
        lines.push(<line key={`h-${i}`} x1="0" y1={`${i*5}%`} x2="100%" y2={`${i*5}%`} stroke="#1e293b" strokeWidth="1" />);
    }
    return lines;
  }, []);

  return (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden rounded-xl border border-slate-700 shadow-2xl">
      
      {/* View Toggle */}
      <div className="absolute top-4 right-4 z-20 flex bg-slate-800 rounded-lg p-1 border border-slate-700 shadow-lg">
        <button
            onClick={() => setViewMode('tactical')}
            className={`px-3 py-1.5 rounded flex items-center gap-2 text-xs font-medium transition-colors ${viewMode === 'tactical' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
            <MapIcon className="w-3 h-3" /> Tactical
        </button>
        <button
            onClick={() => setViewMode('satellite')}
            className={`px-3 py-1.5 rounded flex items-center gap-2 text-xs font-medium transition-colors ${viewMode === 'satellite' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
            <Globe className="w-3 h-3" /> Satellite
        </button>
      </div>

      {viewMode === 'satellite' ? (
        // --- GOOGLE MAPS VIEW ---
        <div className="w-full h-full relative">
             <div className="absolute inset-0 flex items-center justify-center bg-slate-900 -z-10">
                <span className="text-slate-500 animate-pulse">Initializing Satellite Uplink...</span>
             </div>
             <APIProvider apiKey={MAPS_API_KEY}>
                <Map
                defaultCenter={SF_CENTER}
                defaultZoom={12}
                mapId="4504f8b37365c3d0"
                styles={DARK_MODE_STYLES}
                disableDefaultUI={true}
                gestureHandling={'greedy'}
                className="w-full h-full"
                >
                    <ClusteredVehicles 
                        vehicles={vehicles}
                        selectedVehicleId={selectedVehicleId}
                        onSelectVehicle={onSelectVehicle}
                    />
                </Map>
            </APIProvider>
        </div>
      ) : (
        // --- TACTICAL SVG VIEW ---
        <div className="relative w-full h-full">
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <rect width="100%" height="100%" fill="#0f172a" />
                {gridLines}
                <path d="M70% 0% Q 65% 30% 80% 50% T 90% 100%" stroke="#334155" strokeWidth="2" fill="none" opacity="0.3" />
                <path d="M0% 30% Q 30% 35% 40% 60% T 20% 100%" stroke="#334155" strokeWidth="2" fill="none" opacity="0.3" />
                <circle cx="50%" cy="50%" r="30%" stroke="#334155" strokeWidth="1" fill="rgba(51, 65, 85, 0.1)" strokeDasharray="5,5" />
            </svg>

            {vehicles.map((vehicle) => {
                const pos = projectToSVG(vehicle.coordinates.lat, vehicle.coordinates.lng);
                const safeX = Math.max(2, Math.min(98, pos.x));
                const safeY = Math.max(2, Math.min(98, pos.y));

                return (
                <div
                    key={vehicle.id}
                    onClick={() => onSelectVehicle(vehicle.id)}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-10`}
                    style={{ left: `${safeX}%`, top: `${safeY}%` }}
                >
                    <VehicleMarkerContent vehicle={vehicle} isSelected={selectedVehicleId === vehicle.id} />
                </div>
            )})}
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-10 bg-slate-800/90 backdrop-blur border border-slate-700 p-3 rounded-lg shadow-lg text-xs space-y-2 pointer-events-none">
        <div className="font-semibold text-slate-300">Fleet Status</div>
        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Moving</div>
        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Idle</div>
        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> Alert</div>
      </div>
    </div>
  );
};

export default MapVisualization;