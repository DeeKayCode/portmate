import React from 'react';
import { OverlapSummary } from '../types';
import { Clock, Send, Check } from 'lucide-react';

interface OverlapTimelineProps {
  overlap: OverlapSummary;
  portName: string;
  onSendPoke?: (overlapId: string) => void;
}

export const OverlapTimeline: React.FC<OverlapTimelineProps> = ({
  overlap,
  portName,
  onSendPoke,
}) => {
  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  const getBadgeStyle = (type: OverlapSummary['type']) => {
    switch (type) {
      case 'same-ship':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'same-port':
        return 'bg-sky-50 text-sky-800 border-sky-300';
      case 'nearby-port':
        return 'bg-amber-50 text-amber-800 border-amber-300';
    }
  };

  const getLabel = (type: OverlapSummary['type']) => {
    switch (type) {
      case 'same-ship':
        return 'Same Ship';
      case 'same-port':
        return 'Same Port';
      case 'nearby-port':
        return `Nearby Port (${overlap.distanceKm || 20}km)`;
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <img
            src={overlap.mate.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${overlap.mate.username}`}
            alt={overlap.mate.displayName}
            className="h-10 w-10 rounded-full border border-slate-200 object-cover"
          />
          <div>
            <div className="font-semibold text-slate-800">{overlap.mate.displayName}</div>
            <div className="text-xs text-slate-500">@{overlap.mate.username} • {overlap.mate.lastActiveAt}</div>
          </div>
        </div>

        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getBadgeStyle(overlap.type)}`}>
          {getLabel(overlap.type)}
        </span>
      </div>

      {/* Visual Timeline Section */}
      <div className="my-4 space-y-3">
        <div className="text-xs font-medium text-slate-500">Port Berth Hours & Overlap at {portName}:</div>

        {/* Overlap Summary Callout */}
        <div className="flex items-center gap-2 rounded-lg bg-sky-50/70 p-2.5 text-xs text-sky-900 border border-sky-200">
          <Clock className="h-4 w-4 text-sky-600 shrink-0" />
          <span>
            Shared overlap window: <strong>{formatTime(overlap.sharedStart)} – {formatTime(overlap.sharedEnd)}</strong> ({overlap.sharedHours} hours shared)
          </span>
        </div>

        {/* Visual Bar Comparison */}
        <div className="space-y-2 pt-1">
          {/* User Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-600">
              <span className="font-semibold">Your Stay</span>
              <span>{formatTime(overlap.sharedStart)} – {formatTime(overlap.sharedEnd)}</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand" style={{ width: '85%' }}></div>
            </div>
          </div>

          {/* Mate Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-600">
              <span className="font-semibold">{overlap.mate.displayName}'s Stay</span>
              <span>{formatTime(overlap.sharedStart)} – {formatTime(overlap.sharedEnd)}</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand-light" style={{ width: '75%', marginLeft: '10%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Poke / Meeting Intent Button */}
      <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">
        {overlap.pokeStatus === 'interested' ? (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <Check className="h-4 w-4" />
            <span>Both interested in meeting!</span>
          </div>
        ) : overlap.pokeStatus === 'sent' ? (
          <span className="text-xs text-slate-500">Meeting intent sent • Awaiting response</span>
        ) : (
          <button
            onClick={() => onSendPoke && onSendPoke(overlap.id)}
            className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-brand-dark active:scale-95"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Interested in meeting?</span>
          </button>
        )}
      </div>
    </div>
  );
};
