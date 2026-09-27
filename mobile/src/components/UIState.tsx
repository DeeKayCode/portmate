import React from 'react';
import { WifiOff, AlertCircle } from 'lucide-react';

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-3 p-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 rounded bg-slate-200"></div>
          <div className="h-4 w-16 rounded-full bg-slate-200"></div>
        </div>
        <div className="mt-3 h-3 w-48 rounded bg-slate-100"></div>
        <div className="mt-4 flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-slate-200"></div>
          <div className="h-3 w-24 rounded bg-slate-100"></div>
        </div>
      </div>
    ))}
  </div>
);

export const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}> = ({ icon, title, description, actionText, onAction }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/5 text-brand shadow-inner">
      {icon}
    </div>
    <h3 className="text-base font-bold text-slate-800">{title}</h3>
    <p className="mt-1 max-w-xs text-xs text-slate-500 leading-relaxed">{description}</p>
    {actionText && onAction && (
      <button
        onClick={onAction}
        className="mt-5 rounded-xl bg-brand px-5 py-2.5 text-xs font-semibold text-white shadow transition-all hover:bg-brand-dark active:scale-95"
      >
        {actionText}
      </button>
    )}
  </div>
);

export const OfflineBanner: React.FC = () => (
  <div className="flex items-center justify-center gap-2 bg-amber-500/90 px-3 py-1.5 text-xs font-medium text-white shadow-sm">
    <WifiOff className="h-3.5 w-3.5" />
    <span>Offline Mode – Viewing cached vessel schedules</span>
  </div>
);

export const ErrorState: React.FC<{
  message?: string;
  onRetry: () => void;
}> = ({ message = 'Unable to sync latest port itinerary.', onRetry }) => (
  <div className="m-4 flex flex-col items-center justify-center rounded-xl border border-rose-100 bg-rose-50/50 p-6 text-center">
    <AlertCircle className="h-8 w-8 text-rose-500" />
    <div className="mt-2 text-sm font-semibold text-rose-900">Connection Error</div>
    <p className="mt-1 text-xs text-rose-600">{message}</p>
    <button
      onClick={onRetry}
      className="mt-4 rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 active:scale-95"
    >
      Retry
    </button>
  </div>
);
