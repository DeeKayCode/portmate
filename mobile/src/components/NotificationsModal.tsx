import React from 'react';
import { X, Check, ThumbsUp, ThumbsDown, Calendar, CheckCheck } from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationsModalProps {
  notifications: NotificationItem[];
  isOpen: boolean;
  onClose: () => void;
  onMarkAllRead: () => void;
  onRespondPoke: (notificationId: string, response: 'INTERESTED' | 'NOT_INTERESTED') => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  notifications,
  isOpen,
  onClose,
  onMarkAllRead,
  onRespondPoke,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4 backdrop-blur-sm transition-opacity">
      <div className="flex max-h-[85vh] w-full max-w-mobile flex-col rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-800">Notifications</h2>
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                {notifications.filter(n => !n.read).length} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onMarkAllRead}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              title="Mark all as read"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Read all</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content List */}
        <div className="overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Check className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <div className="text-sm font-semibold">You're all caught up!</div>
              <div className="text-xs">No pending meeting intents or alerts.</div>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`rounded-xl border p-3.5 transition-colors ${
                  notif.read ? 'border-slate-100 bg-white' : 'border-sky-200 bg-sky-50/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 font-semibold text-xs text-slate-800">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand/10 text-brand">
                      <Calendar className="h-3 w-3" />
                    </span>
                    <span>{notif.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  {notif.body}
                </p>

                {/* If it's a POKE_RECEIVED that hasn't been answered, offer Interested / Not Interested */}
                {notif.type === 'POKE_RECEIVED' && !notif.read && (
                  <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-2.5">
                    <button
                      onClick={() => onRespondPoke(notif.id, 'INTERESTED')}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-dark active:scale-95"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                      <span>Interested</span>
                    </button>
                    <button
                      onClick={() => onRespondPoke(notif.id, 'NOT_INTERESTED')}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 active:scale-95"
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                      <span>Not Interested</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
