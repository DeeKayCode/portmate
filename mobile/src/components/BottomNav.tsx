import React from 'react';
import { CalendarDays, UserPlus, Map, FileSpreadsheet } from 'lucide-react';

export type NavTab = 'itinerary' | 'add_mate' | 'overview' | 'contracts';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 mx-auto flex h-16 max-w-mobile items-center justify-around border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom,0px)] shadow-lg backdrop-blur-md">
      {/* 1. My Itinerary */}
      <button
        onClick={() => onChangeTab('itinerary')}
        className={`flex flex-1 flex-col items-center justify-center py-1 transition-colors ${
          activeTab === 'itinerary' ? 'text-brand font-semibold' : 'text-slate-500 hover:text-slate-800'
        }`}
        aria-label="My Itinerary"
      >
        <CalendarDays className="h-5 w-5" />
        <span className="mt-1 text-[11px]">Itinerary</span>
      </button>

      {/* 2. Add PortMate (Visually prominent center button) */}
      <div className="-mt-5 flex flex-col items-center">
        <button
          onClick={() => onChangeTab('add_mate')}
          className={`flex h-12 w-12 items-center justify-center rounded-full shadow-md transition-all active:scale-95 ${
            activeTab === 'add_mate'
              ? 'bg-brand text-white ring-4 ring-brand/20'
              : 'bg-brand-light text-white hover:bg-brand'
          }`}
          aria-label="Add PortMate QR"
        >
          <UserPlus className="h-6 w-6" />
        </button>
        <span className={`mt-0.5 text-[10px] font-medium ${
          activeTab === 'add_mate' ? 'text-brand font-semibold' : 'text-slate-500'
        }`}>
          Add Mate
        </span>
      </div>

      {/* 3. Connection Overview (Map) */}
      <button
        onClick={() => onChangeTab('overview')}
        className={`flex flex-1 flex-col items-center justify-center py-1 transition-colors ${
          activeTab === 'overview' ? 'text-brand font-semibold' : 'text-slate-500 hover:text-slate-800'
        }`}
        aria-label="Connection Overview"
      >
        <Map className="h-5 w-5" />
        <span className="mt-1 text-[11px]">Overview</span>
      </button>

      {/* 4. My Contracts */}
      <button
        onClick={() => onChangeTab('contracts')}
        className={`flex flex-1 flex-col items-center justify-center py-1 transition-colors ${
          activeTab === 'contracts' ? 'text-brand font-semibold' : 'text-slate-500 hover:text-slate-800'
        }`}
        aria-label="My Contracts"
      >
        <FileSpreadsheet className="h-5 w-5" />
        <span className="mt-1 text-[11px]">Contracts</span>
      </button>
    </nav>
  );
};
