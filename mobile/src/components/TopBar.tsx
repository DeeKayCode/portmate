import React from 'react';
import { Bell, Anchor } from 'lucide-react';
import { User, NotificationItem } from '../types';

interface TopBarProps {
  user: User;
  notifications: NotificationItem[];
  onOpenProfile: () => void;
  onOpenNotifications: () => void;
  isOffline?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  user,
  notifications,
  onOpenProfile,
  onOpenNotifications,
  isOffline = false,
}) => {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md">
      {/* Left: Profile Trigger */}
      <button
        onClick={onOpenProfile}
        className="flex items-center gap-2 rounded-full p-1 transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand/40"
        aria-label="Open profile settings"
      >
        <img
          src={user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
          alt={user.displayName}
          className="h-8 w-8 rounded-full border border-slate-200 object-cover shadow-sm"
        />
        <div className="hidden flex-col text-left sm:flex">
          <span className="text-xs font-semibold text-slate-800">{user.displayName}</span>
          <span className="text-[10px] text-slate-500">@{user.username}</span>
        </div>
      </button>

      {/* Center: Brand Identity */}
      <div className="flex items-center gap-1.5 font-bold tracking-tight text-brand">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-white shadow-sm">
          <Anchor className="h-4 w-4" />
        </div>
        <span className="text-lg font-black tracking-tight">Port<span className="text-brand-accent">Mate</span></span>
        {isOffline && (
          <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
            Offline
          </span>
        )}
      </div>

      {/* Right: Notifications */}
      <button
        onClick={onOpenNotifications}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand/40"
        aria-label="View notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>
    </header>
  );
};
