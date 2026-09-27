import React, { useState, useEffect } from 'react';
import { X, LogOut, Sliders, Shield, Bell, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { User } from '../types';
import { store } from '../api/store';

interface ProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onLogout,
}) => {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [radius, setRadius] = useState(user.nearbyRadiusKm || 50);
  const [emailNotifs, setEmailNotifs] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setDisplayName(user.displayName);
    setAvatarUrl(user.avatarUrl || '');
    const currentSettings = store.getSettings();
    if (currentSettings) {
      setRadius(currentSettings.nearbyPortThresholdKm || 50);
      setEmailNotifs(currentSettings.emailNotifications ?? true);
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      // 1. Update Profile
      await store.updateUser({
        displayName: displayName.trim(),
        avatarUrl: avatarUrl.trim() || undefined,
      });

      // 2. Update Settings
      await store.updateSettings({
        nearbyPortThresholdKm: Number(radius),
        emailNotifications: emailNotifs,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to sign out of PortMate?')) {
      onLogout();
      onClose();
    }
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
              {user.lastActiveAt && (
                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
                  <span>{user.lastActiveAt}</span>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Preferences and settings updated!</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            {/* Display Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            {/* Avatar URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Avatar Image URL (Optional)</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
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
                min="1"
                max="500"
                step="5"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full accent-brand"
              />
              <p className="text-[11px] text-slate-500">
                Ports within {radius} km are classified as "Nearby" overlaps.
              </p>
            </div>

            {/* Email Notifications Toggle */}
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-brand" />
                <div>
                  <div className="text-xs font-semibold text-slate-700">Email Notifications</div>
                  <div className="text-[10px] text-slate-400">Receive alerts when friends cross paths</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailNotifs}
                onChange={(e) => setEmailNotifs(e.target.checked)}
                className="h-4 w-4 rounded accent-brand"
              />
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
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-semibold text-white shadow transition-all hover:bg-brand-dark active:scale-98 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
            </button>
          </form>

          {/* Logout Section */}
          <div className="border-t border-slate-100 pt-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 active:scale-98"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out of PortMate</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
