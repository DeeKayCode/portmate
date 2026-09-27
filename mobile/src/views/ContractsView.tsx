import React, { useState, useEffect } from 'react';
import { Contract } from '../types';
import { ApiCompany, ApiShip } from '../api/client';
import { store } from '../api/store';
import { Plus, Ship, Calendar, Trash2, X, CheckCircle2, Edit2, AlertCircle, Loader2 } from 'lucide-react';
import { EmptyState } from '../components/UIState';

interface ContractsViewProps {
  contracts: Contract[];
  onAddContract: (contract: { companyId: string; shipId: string; startDate: string; endDate: string }) => Promise<void>;
  onUpdateContract?: (id: string, contract: { companyId: string; shipId: string; startDate: string; endDate: string }) => Promise<void>;
  onDeleteContract: (id: string) => Promise<void>;
}

export const ContractsView: React.FC<ContractsViewProps> = ({
  contracts,
  onAddContract,
  onUpdateContract,
  onDeleteContract,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [companies, setCompanies] = useState<ApiCompany[]>(store.getCompanies());
  const [ships, setShips] = useState<ApiShip[]>(store.getShips());

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedShipId, setSelectedShipId] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync catalog from store/API
  useEffect(() => {
    const comps = store.getCompanies();
    const shps = store.getShips();
    setCompanies(comps);
    setShips(shps);

    if (comps.length > 0 && !selectedCompanyId) {
      setSelectedCompanyId(comps[0].id);
    }
  }, []);

  // Update ships dropdown when selected company changes
  const availableShips = selectedCompanyId
    ? ships.filter((s) => s.company?.id === selectedCompanyId)
    : ships;

  useEffect(() => {
    if (availableShips.length > 0) {
      if (!availableShips.some((s) => s.id === selectedShipId)) {
        setSelectedShipId(availableShips[0].id);
      }
    } else {
      setSelectedShipId('');
    }
  }, [selectedCompanyId, availableShips, selectedShipId]);

  const openAddModal = () => {
    setEditingId(null);
    setError(null);
    if (companies.length > 0) {
      setSelectedCompanyId(companies[0].id);
    }
    setStartDate('');
    setEndDate('');
    setIsModalOpen(true);
  };

  const openEditModal = (contract: Contract) => {
    setEditingId(contract.id);
    setError(null);
    setSelectedCompanyId(contract.cruiseLine);
    setSelectedShipId(contract.shipName);
    setStartDate(contract.startDate);
    setEndDate(contract.endDate);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedCompanyId || !selectedShipId) {
      setError('Please select both a cruise line and a ship.');
      return;
    }

    if (!startDate || !endDate) {
      setError('Please select both start and end sailing dates.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date cannot be after end date.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId && onUpdateContract) {
        await onUpdateContract(editingId, {
          companyId: selectedCompanyId,
          shipId: selectedShipId,
          startDate,
          endDate,
        });
      } else {
        await onAddContract({
          companyId: selectedCompanyId,
          shipId: selectedShipId,
          startDate,
          endDate,
        });
      }
      setIsModalOpen(false);
      setStartDate('');
      setEndDate('');
      setEditingId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save contract');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (contract: Contract) => {
    const shipName = getShipDisplayName(contract.shipName);
    if (confirm(`Delete assignment for ${shipName}?`)) {
      try {
        await onDeleteContract(contract.id);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Failed to delete assignment');
      }
    }
  };

  const getCompanyDisplayName = (companyId: string) => {
    const found = companies.find((c) => c.id === companyId);
    return found ? found.name : companyId;
  };

  const getShipDisplayName = (shipId: string) => {
    const found = ships.find((s) => s.id === shipId);
    return found ? found.name : shipId;
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
          onClick={openAddModal}
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
          onAction={openAddModal}
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
                <span className="text-xs font-semibold text-slate-500">{getCompanyDisplayName(activeContract.cruiseLine)}</span>
              </div>

              <div className="mt-3">
                <h2 className="text-lg font-black text-slate-900">{getShipDisplayName(activeContract.shipName)}</h2>
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
                  <div className="font-bold text-sm text-slate-900">{getShipDisplayName(contract.shipName)}</div>
                  <div className="text-xs text-slate-500">{getCompanyDisplayName(contract.cruiseLine)}</div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    {contract.startDate} to {contract.endDate}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(contract)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-brand"
                    title="Edit Contract"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(contract)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                    title="Delete Contract"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Contract Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4 backdrop-blur-sm">
          <div className="w-full max-w-mobile rounded-t-2xl sm:rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-800">
                {editingId ? 'Edit Sailing Assignment' : 'Add Sailing Assignment'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Cruise Company Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cruise Company</label>
                <select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ship Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vessel / Ship</label>
                <select
                  value={selectedShipId}
                  onChange={(e) => setSelectedShipId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  {availableShips.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-brand py-2.5 text-xs font-bold text-white shadow hover:bg-brand-dark disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{editingId ? 'Save Changes' : 'Add Contract'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
