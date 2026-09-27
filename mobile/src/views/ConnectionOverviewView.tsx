import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { Connection, PortCall, ConnectionType } from '../types';
import { MapPin, X, Info } from 'lucide-react';

interface ConnectionOverviewViewProps {
  connections: Connection[];
  portCalls: PortCall[];
  onSelectPortCall?: (portId: string) => void;
}

interface MapLocation {
  id: string;
  title: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  type: 'current' | 'future';
  connectionType?: ConnectionType;
  mateName: string;
  mateShip: string;
  dateOrStatus: string;
  avatarUrl?: string;
}

export const ConnectionOverviewView: React.FC<ConnectionOverviewViewProps> = ({
  connections,
  portCalls: _portCalls,
}) => {
  const [filter, setFilter] = useState<'all' | 'current' | 'future'>('all');
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  // Derived markers from active contracts & port itineraries (No live GPS)
  const mapLocations: MapLocation[] = [
    {
      id: 'loc_1',
      title: 'Port of Miami',
      city: 'Miami',
      country: 'USA',
      lat: 25.7743,
      lng: -80.1937,
      type: 'current',
      connectionType: 'same-ship',
      mateName: 'Alex Rivers',
      mateShip: 'Wonder of the Seas',
      dateOrStatus: 'Currently in port (Docked)',
      avatarUrl: connections[0]?.mate.avatarUrl,
    },
    {
      id: 'loc_2',
      title: 'Prince George Wharf',
      city: 'Nassau',
      country: 'Bahamas',
      lat: 25.0784,
      lng: -77.3392,
      type: 'future',
      connectionType: 'same-port',
      mateName: 'Maria Garcia',
      mateShip: 'Symphony of the Seas',
      dateOrStatus: 'Upcoming Overlap: Oct 14',
      avatarUrl: connections[1]?.mate.avatarUrl,
    },
    {
      id: 'loc_3',
      title: 'Punta Langosta Pier',
      city: 'Cozumel',
      country: 'Mexico',
      lat: 20.5083,
      lng: -86.9535,
      type: 'future',
      connectionType: 'nearby-port',
      mateName: 'Carlos Vega',
      mateShip: 'Carnival Celebration',
      dateOrStatus: 'Nearby Port (18km): Oct 16',
      avatarUrl: connections[2]?.mate.avatarUrl,
    },
    {
      id: 'loc_4',
      title: 'San Juan Cruise Terminal',
      city: 'San Juan',
      country: 'Puerto Rico',
      lat: 18.4655,
      lng: -66.1057,
      type: 'current',
      connectionType: 'same-port',
      mateName: 'Elena Rostova',
      mateShip: 'Celebrity Beyond',
      dateOrStatus: 'Docked at Pier 4',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=elena',
    }
  ];

  const filteredLocations = mapLocations.filter((loc) => {
    if (filter === 'current') return loc.type === 'current';
    if (filter === 'future') return loc.type === 'future';
    return true;
  });

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default centered on Caribbean/Atlantic cruise basin
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([22.5, -75.0], 5);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
      }).addTo(map);

      markersRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const markers = markersRef.current;
    if (markers) {
      markers.clearLayers();

      filteredLocations.forEach((loc) => {
        const markerColor =
          loc.connectionType === 'same-ship'
            ? '#059669'
            : loc.connectionType === 'same-port'
            ? '#0284C7'
            : '#D97706';

        const customIcon = L.divIcon({
          className: 'custom-map-pin',
          html: `<div style="background-color: ${markerColor}; width: 28px; height: 28px; border-radius: 9999px; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: bold;">
            ${loc.type === 'future' ? '★' : '⚓'}
          </div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([loc.lat, loc.lng], { icon: customIcon });
        marker.on('click', () => {
          setSelectedLocation(loc);
          map.setView([loc.lat, loc.lng], 7, { animate: true });
        });
        marker.addTo(markers);
      });
    }
  }, [filteredLocations]);

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col pb-16">
      {/* Top Header & Filter Bar */}
      <div className="z-20 border-b border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Connection Overview</h1>
            <p className="text-xs text-slate-500">Mates' itinerary locations & future crossings</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-brand text-white shadow-sm'
                : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Crossings ({mapLocations.length})
          </button>
          <button
            onClick={() => setFilter('current')}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              filter === 'current'
                ? 'bg-brand text-white shadow-sm'
                : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>⚓ Current Ports</span>
          </button>
          <button
            onClick={() => setFilter('future')}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              filter === 'future'
                ? 'bg-brand text-white shadow-sm'
                : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>★ Future Overlaps</span>
          </button>
        </div>
      </div>

      {/* Map View */}
      <div className="relative flex-1 bg-slate-100">
        <div ref={mapContainerRef} className="h-full w-full"></div>

        {/* Privacy Note Badge */}
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 rounded-lg bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-slate-600 shadow backdrop-blur border border-slate-200">
          <Info className="h-3.5 w-3.5 text-brand" />
          <span>Itinerary-derived positions (No live GPS)</span>
        </div>

        {/* Bottom Peek Sheet when a Location is Selected */}
        {selectedLocation && (
          <div className="absolute bottom-4 left-3 right-3 z-30 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl backdrop-blur">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={selectedLocation.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedLocation.mateName}`}
                  alt={selectedLocation.mateName}
                  className="h-10 w-10 rounded-full border border-slate-200 object-cover"
                />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{selectedLocation.mateName}</h3>
                  <div className="text-xs text-slate-500">{selectedLocation.mateShip}</div>
                </div>
              </div>

              <button
                onClick={() => setSelectedLocation(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 rounded-xl bg-slate-50 p-2.5 text-xs border border-slate-100 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <MapPin className="h-3.5 w-3.5 text-brand" />
                <span>{selectedLocation.city}, {selectedLocation.country} ({selectedLocation.title})</span>
              </div>
              <div className="text-slate-600 font-medium">
                {selectedLocation.dateOrStatus}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
