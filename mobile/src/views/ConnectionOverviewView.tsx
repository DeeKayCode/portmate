import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { Connection, PortCall, ConnectionType } from '../types';
import { X, Info, Compass } from 'lucide-react';
import { EmptyState } from '../components/UIState';

interface ConnectionOverviewViewProps {
  connections: Connection[];
  portCalls: PortCall[];
  onNavigateToContracts?: () => void;
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
  connections: _connections,
  portCalls,
  onNavigateToContracts,
}) => {
  const [filter, setFilter] = useState<'all' | 'current' | 'future'>('all');
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  // Derive map locations strictly from real portCalls and their associated overlaps
  const mapLocations: MapLocation[] = [];
  for (const pc of portCalls) {
    if (pc.overlaps && pc.overlaps.length > 0) {
      for (const ov of pc.overlaps) {
        const isCurrent = ov.lifecycle === 'current';
        mapLocations.push({
          id: `${pc.id}_${ov.id}`,
          title: pc.portName,
          city: pc.portCity,
          country: pc.country,
          lat: pc.latitude,
          lng: pc.longitude,
          type: isCurrent ? 'current' : 'future',
          connectionType: ov.type,
          mateName: ov.mate.displayName,
          mateShip: pc.shipName,
          dateOrStatus: isCurrent
            ? 'Currently docked'
            : `Crossing: ${new Date(ov.sharedStart).toLocaleDateString([], { month: 'short', day: 'numeric' })}`,
          avatarUrl: ov.mate.avatarUrl,
        });
      }
    }
  }

  const filteredLocations = mapLocations.filter((loc) => {
    if (filter === 'current') return loc.type === 'current';
    if (filter === 'future') return loc.type === 'future';
    return true;
  });

  // Initialize or re-render Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Base center
      const initialCenter: [number, number] = mapLocations.length > 0
        ? [mapLocations[0].lat, mapLocations[0].lng]
        : [25.7743, -80.1937]; // Miami fallback

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView(initialCenter, 4);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      markersRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    // Refresh markers
    if (markersRef.current && mapInstanceRef.current) {
      markersRef.current.clearLayers();

      filteredLocations.forEach((loc) => {
        const color =
          loc.connectionType === 'same-ship'
            ? '#059669' // emerald
            : loc.connectionType === 'same-port'
            ? '#0284c7' // sky
            : '#d97706'; // amber

        const customIcon = L.divIcon({
          className: 'custom-map-marker',
          html: `
            <div style="
              background-color: ${color};
              width: 32px;
              height: 32px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              cursor: pointer;
            ">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([loc.lat, loc.lng], { icon: customIcon });
        marker.on('click', () => setSelectedLocation(loc));
        markersRef.current?.addLayer(marker);
      });

      if (filteredLocations.length > 0) {
        const bounds = L.latLngBounds(filteredLocations.map((l) => [l.lat, l.lng]));
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
      }
    }
  }, [filteredLocations]);

  return (
    <div className="relative flex h-[calc(100vh-120px)] flex-col bg-slate-100">
      {/* Map Control Overlay */}
      <div className="absolute left-3 right-3 top-3 z-20 flex flex-col gap-2">
        <div className="flex items-center justify-between rounded-xl bg-white/95 p-3 shadow-md backdrop-blur border border-slate-200">
          <div>
            <h1 className="text-sm font-bold text-slate-900">Connection Map</h1>
            <p className="text-[11px] text-slate-500">Crossings & overlapping ports</p>
          </div>

          {/* Filter Pills */}
          <div className="flex rounded-lg bg-slate-100 p-0.5 text-[11px] font-semibold">
            {(['all', 'current', 'future'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilter(mode)}
                className={`rounded-md px-2.5 py-1 capitalize transition-all ${
                  filter === mode ? 'bg-brand text-white shadow' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Informational Banner */}
        <div className="flex items-center gap-1.5 rounded-lg bg-sky-500/90 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm backdrop-blur">
          <Info className="h-3.5 w-3.5 shrink-0" />
          <span>Locations derived strictly from verified cruise itineraries (Zero live GPS).</span>
        </div>
      </div>

      {mapLocations.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center p-6 text-center">
          <EmptyState
            icon={<Compass className="h-10 w-10 text-brand" />}
            title="No Mapped Crossings Yet"
            description="Add your ship sailing contracts and connect with friends via QR to discover and map upcoming port meetings."
            actionText="Go to My Contracts"
            onAction={onNavigateToContracts}
          />
        </div>
      ) : (
        /* Leaflet Container */
        <div ref={mapContainerRef} className="h-full w-full" />
      )}

      {/* Selected Location Bottom Sheet Card */}
      {selectedLocation && (
        <div className="absolute bottom-4 left-4 right-4 z-20 rounded-2xl bg-white p-4 shadow-xl border border-slate-200 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <img
                src={selectedLocation.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedLocation.mateName}`}
                alt={selectedLocation.mateName}
                className="h-10 w-10 rounded-full border border-slate-200 object-cover"
              />
              <div>
                <h3 className="text-sm font-bold text-slate-900">{selectedLocation.title}</h3>
                <div className="text-xs text-slate-500">{selectedLocation.city}, {selectedLocation.country}</div>
              </div>
            </div>

            <button
              onClick={() => setSelectedLocation(null)}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
            <div>
              <span className="font-semibold text-slate-700">{selectedLocation.mateName}</span>
              <span className="text-slate-400 text-[11px] ml-1">({selectedLocation.mateShip})</span>
            </div>
            <div className="font-medium text-brand text-[11px]">
              {selectedLocation.dateOrStatus}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
