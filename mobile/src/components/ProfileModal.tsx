import React, { useState } from 'react';
import { X, LogOut, Sliders, Shield } from 'lucide-react';
import { User } from '../types';

interface ProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (partial: Partial<User>) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onUpdateUser,
}) => {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio || '');
  const [radius, setRadius] = useState(user.nearbyRadiusKm || 50);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      displayName,
      bio,
      nearbyRadiusKm: radius,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4 backdrop-blur-sm transition-opacity">
      <div className="flex max-h-[90vh] w-full max-w-mobile flex-col rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-bold text-slate-800">Profile & Settings</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-5 space-y-6">
          {/* User Card */}
          <div className="flex items-center gap-4">
            <img
              src={user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
              alt={user.displayName}
              className="h-16 w-16 rounded-full border-2 border-brand/20 object-cover shadow"
            />
            <div>
              <div className="text-lg font-bold text-slate-900">{user.displayName}</div>
              <div className="text-sm font-medium text-slate-500">@{user.username}</div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                <span className="inline-block h-2 w-2 rounded-full bg-slate-400"></span>
                <span>{user.lastActiveAt}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Display Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-semibold text-slate-700">Bio / Ship Role</label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. Stage Manager @ Royal Caribbean"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            {/* Nearby Radius Setting */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Sliders className="h-4 w-4 text-brand" />
                  Nearby Port Match Radius
                </span>
                <span className="text-xs font-bold text-brand">{radius} km</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full accent-brand"
              />
              <p className="text-[11px] text-slate-500">
                Ports within this distance are classified as "Nearby" overlaps.
              </p>
            </div>

            {/* Privacy notice */}
            <div className="flex items-start gap-2 rounded-xl bg-sky-50/60 p-3 text-[11px] text-sky-900 border border-sky-100">
              <Shield className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
              <span>
                <strong>Privacy Guaranteed:</strong> PortMate never accesses your continuous GPS. All locations are derived strictly from published vessel itineraries.
              </span>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-brand py-2.5 text-sm font-semibold text-white shadow transition-all hover:bg-brand-dark active:scale-98"
            >
              {saved ? 'Changes Saved!' : 'Save Preferences'}
            </button>
          </form>

          {/* Logout Section */}
          <div className="border-t border-slate-100 pt-4">
            <button
              onClick={() => alert('Logged out. Your data is securely cached locally.')}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 active:scale-98"
            >
              <LogOut className="h-4 w-4" />
              <span>Log Out of PortMate</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
