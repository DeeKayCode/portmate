import React, { useState } from 'react';
import { PortCall, OverlapSummary } from '../types';
import { OverlapTimeline } from '../components/OverlapTimeline';
import { Calendar, Anchor, ChevronRight, X, Users, Compass, AlertCircle } from 'lucide-react';
import { EmptyState } from '../components/UIState';

interface ItineraryViewProps {
  portCalls: PortCall[];
  onSendPoke: (overlapId: string) => Promise<void>;
  onNavigateToContracts?: () => void;
}

export const ItineraryView: React.FC<ItineraryViewProps> = ({
  portCalls,
  onSendPoke,
  onNavigateToContracts,
}) => {
  const [selectedPort, setSelectedPort] = useState<PortCall | null>(null);
  const [pokeError, setPokeError] = useState<string | null>(null);

  const formatPortDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return iso;
    }
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  const getPillStyle = (type: OverlapSummary['type']) => {
    switch (type) {
      case 'same-ship':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'same-port':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'nearby-port':
        return 'bg-amber-100 text-amber-800 border-amber-300';
    }
  };

  const handlePoke = async (overlapId: string) => {
    setPokeError(null);
    try {
      await onSendPoke(overlapId);
      // Update selectedPort with updated pokeStatus
      if (selectedPort?.overlaps) {
        const updatedOverlaps = selectedPort.overlaps.map((ov) =>
          ov.id === overlapId ? { ...ov, pokeStatus: 'poked' as const } : ov
        );
        setSelectedPort({ ...selectedPort, overlaps: updatedOverlaps });
      }
    } catch (err: unknown) {
      setPokeError(err instanceof Error ? err.message : 'Failed to send meeting intent');
    }
  };

  return (
    <div className="space-y-4 p-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">My Itinerary</h1>
          <p className="text-xs text-slate-500">Scheduled ports & friend crossings</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-slate-600 border border-slate-200 shadow-sm">
          <Calendar className="h-3.5 w-3.5 text-brand" />
          <span>{portCalls.length} Port Calls</span>
        </div>
      </div>

      {portCalls.length === 0 ? (
        <EmptyState
          icon={<Compass className="h-8 w-8 text-brand" />}
          title="No Scheduled Port Stops"
          description="Add your current or upcoming ship contract in 'My Contracts' to view your day-by-day itinerary and crossings."
          actionText="Go to My Contracts"
          onAction={onNavigateToContracts}
        />
      ) : (
        /* Port Calls List */
        <div className="space-y-3">
          {portCalls.map((port) => {
            const hasOverlaps = port.overlaps && port.overlaps.length > 0;

            return (
              <div
                key={port.id}
                onClick={() => { setPokeError(null); setSelectedPort(port); }}
                className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-brand/40 hover:shadow active:scale-[0.99]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand">
                      {formatPortDate(port.arrivalDate)}
                    </span>
                    <h2 className="text-base font-bold text-slate-900">{port.portName}</h2>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Anchor className="h-3 w-3 text-slate-400" />
                        {port.shipName}
                      </span>
                      <span>•</span>
                      <span>{formatTime(port.arrivalDate)} – {formatTime(port.departureDate)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-slate-400">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                </div>

                {/* Overlap Summary Badges */}
                {hasOverlaps ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                    <div className="flex -space-x-2 overflow-hidden">
                      {port.overlaps!.map((ov) => (
                        <img
                          key={ov.id}
                          src={ov.mate.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${ov.mate.username}`}
                          alt={ov.mate.displayName}
                          className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover"
                        />
                      ))}
                    </div>

                    {port.overlaps!.map((ov) => (
                      <span
                        key={ov.id}
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getPillStyle(ov.type)}`}
                      >
                        {ov.type === 'same-ship' && `Same Ship: ${ov.mate.displayName}`}
                        {ov.type === 'same-port' && `Same Port: ${ov.mate.displayName}`}
                        {ov.type === 'nearby-port' && `Nearby (${ov.distanceKm}km): ${ov.mate.displayName}`}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-2.5 text-[11px] text-slate-400">
                    <Users className="h-3 w-3" />
                    <span>No PortMates currently scheduled at this port</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Port Overlap Detail Sheet */}
      {selectedPort && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 sm:items-center sm:p-4 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-mobile overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-slate-50 p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedPort.portName}</h3>
                <div className="text-xs text-slate-500">
                  {selectedPort.shipName} • {formatPortDate(selectedPort.arrivalDate)}
                </div>
              </div>
              <button
                onClick={() => setSelectedPort(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {pokeError && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{pokeError}</span>
              </div>
            )}

            <div className="mt-4 space-y-4">
              {selectedPort.overlaps && selectedPort.overlaps.length > 0 ? (
                selectedPort.overlaps.map((overlap) => (
                  <OverlapTimeline
                    key={overlap.id}
                    overlap={overlap}
                    portName={selectedPort.portName}
                    onSendPoke={handlePoke}
                  />
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No overlapping PortMates docked at this stop.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
