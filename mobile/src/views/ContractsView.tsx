import React, { useState } from 'react';
import { Contract } from '../types';
import { Plus, Ship, Calendar, Trash2, X, CheckCircle2 } from 'lucide-react';
import { EmptyState } from '../components/UIState';

interface ContractsViewProps {
  contracts: Contract[];
  onAddContract: (contract: Omit<Contract, 'id' | 'userId'>) => void;
  onDeleteContract: (id: string) => void;
}

const CRUISE_LINES = [
  'Royal Caribbean International',
  'Celebrity Cruises',
  'Carnival Cruise Line',
  'Norwegian Cruise Line',
  'MSC Cruises',
  'Princess Cruises',
  'Virgin Voyages',
  'Disney Cruise Line',
  'Holland America Line',
];

const POPULAR_SHIPS: Record<string, string[]> = {
  'Royal Caribbean International': ['Wonder of the Seas', 'Icon of the Seas', 'Symphony of the Seas', 'Utopia of the Seas', 'Oasis of the Seas'],
  'Celebrity Cruises': ['Celebrity Apex', 'Celebrity Beyond', 'Celebrity Ascent', 'Celebrity Edge'],
  'Carnival Cruise Line': ['Carnival Celebration', 'Carnival Jubilee', 'Mardi Gras', 'Carnival Horizon'],
  'Norwegian Cruise Line': ['Norwegian Prima', 'Norwegian Viva', 'Norwegian Encore'],
  'MSC Cruises': ['MSC World Europa', 'MSC Grandiosa', 'MSC Seashore'],
  'Virgin Voyages': ['Scarlet Lady', 'Valiant Lady', 'Resilient Lady'],
};

export const ContractsView: React.FC<ContractsViewProps> = ({
  contracts,
  onAddContract,
  onDeleteContract,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cruiseLine, setCruiseLine] = useState(CRUISE_LINES[0]);
  const [shipName, setShipName] = useState(POPULAR_SHIPS[CRUISE_LINES[0]][0]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [role, setRole] = useState('Crew');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      alert('Please select both start and end dates.');
      return;
    }

    onAddContract({
      cruiseLine,
      shipName,
      startDate,
      endDate,
      role,
      status: new Date(startDate) <= new Date() ? 'active' : 'upcoming',
    });

    setIsModalOpen(false);
    setStartDate('');
    setEndDate('');
  };

  const activeContract = contracts.find((c) => c.status === 'active') || contracts[0];

  return (
    <div className="space-y-4 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">My Contracts</h1>
          <p className="text-xs text-slate-500">Ship assignments & sailing dates</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-xs font-semibold text-white shadow transition-all hover:bg-brand-dark active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Add Sailing</span>
        </button>
      </div>

      {contracts.length === 0 ? (
        <EmptyState
          icon={<Ship className="h-8 w-8 text-brand" />}
          title="No Ship Assignments Yet"
          description="Add your current or upcoming ship contract to automatically generate your port calls and discover PortMate crossings."
          actionText="Add First Contract"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {/* Active Contract Showcase Card */}
          {activeContract && (
            <div className="rounded-2xl border-2 border-brand/20 bg-gradient-to-br from-brand/5 via-white to-sky-50/50 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                  <CheckCircle2 className="h-3 w-3" />
                  Active Sailing
                </span>
                <span className="text-xs font-semibold text-slate-500">{activeContract.cruiseLine}</span>
              </div>

              <div className="mt-3">
                <h2 className="text-lg font-black text-slate-900">{activeContract.shipName}</h2>
                <div className="mt-1 text-xs text-slate-600 font-medium">Role: {activeContract.role || 'Crew'}</div>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <Calendar className="h-4 w-4 text-brand" />
                  <span>{activeContract.startDate} → {activeContract.endDate}</span>
                </div>
              </div>
            </div>
          )}

          {/* List of All Contracts */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">All Assignments</h3>
            {contracts.map((contract) => (
              <div
                key={contract.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div>
                  <div className="font-bold text-sm text-slate-900">{contract.shipName}</div>
                  <div className="text-xs text-slate-500">{contract.cruiseLine} • {contract.role || 'Crew'}</div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    {contract.startDate} to {contract.endDate}
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (confirm(`Delete assignment for ${contract.shipName}?`)) {
                      onDeleteContract(contract.id);
                    }
                  }}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                  title="Delete Contract"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Contract Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4 backdrop-blur-sm">
          <div className="w-full max-w-mobile rounded-t-2xl sm:rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Add Ship Assignment</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Cruise Line Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">Cruise Company</label>
                <select
                  value={cruiseLine}
                  onChange={(e) => {
                    setCruiseLine(e.target.value);
                    const ships = POPULAR_SHIPS[e.target.value] || ['Vessel'];
                    setShipName(ships[0]);
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-brand focus:outline-none"
                >
                  {CRUISE_LINES.map((line) => (
                    <option key={line} value={line}>{line}</option>
                  ))}
                </select>
              </div>

              {/* Ship Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">Ship Name</label>
                <select
                  value={shipName}
                  onChange={(e) => setShipName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-brand focus:outline-none"
                >
                  {(POPULAR_SHIPS[cruiseLine] || ['Custom Vessel']).map((ship) => (
                    <option key={ship} value={ship}>{ship}</option>
                  ))}
                </select>
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">Role / Category</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Entertainment, Officer, Guest"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-brand focus:outline-none"
                />
              </div>

              {/* Start & End Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Boarding Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-brand focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Debarkation Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-brand py-2.5 text-xs font-semibold text-white shadow hover:bg-brand-dark active:scale-98"
              >
                Save Assignment & Sync Itinerary
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
