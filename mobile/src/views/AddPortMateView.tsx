import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { User, Connection } from '../types';
import { store } from '../api/store';
import { QrCode, Camera, Copy, Check, Share2, UserX, Sparkles, AlertCircle, RefreshCw, Loader2, Users } from 'lucide-react';
import { EmptyState } from '../components/UIState';

interface AddPortMateViewProps {
  user: User;
  connections: Connection[];
  onClaimToken: (token: string) => Promise<void>;
  onRemoveConnection: (connectionId: string) => Promise<void>;
  onBlockUser: (userId: string) => Promise<void>;
}

export const AddPortMateView: React.FC<AddPortMateViewProps> = ({
  user,
  connections,
  onClaimToken,
  onRemoveConnection,
  onBlockUser,
}) => {
  const [mode, setMode] = useState<'qr' | 'scanner' | 'list'>('qr');
  const [tokenData, setTokenData] = useState<{ token: string; expiresAt: string } | null>(null);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [loadingToken, setLoadingToken] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Manual token input or scan
  const [claimInput, setClaimInput] = useState<string>('');
  const [claiming, setClaiming] = useState<boolean>(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Fetch real one-time scoped QR token from backend
  const fetchNewToken = async () => {
    setLoadingToken(true);
    setClaimError(null);
    try {
      const res = await store.createQrToken();
      setTokenData(res);
      const payload = `portmate://connect?token=${res.token}`;
      const url = await QRCode.toDataURL(payload, {
        width: 260,
        margin: 2,
        color: {
          dark: '#0F4C81',
          light: '#FFFFFF',
        },
      });
      setQrUrl(url);
    } catch (err: unknown) {
      setClaimError(err instanceof Error ? err.message : 'Failed to generate connection token');
    } finally {
      setLoadingToken(false);
    }
  };

  useEffect(() => {
    fetchNewToken();
  }, []);

  const handleCopyLink = () => {
    if (!tokenData?.token) return;
    const link = `https://portmate.app/c/${tokenData.token}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleNativeShare = () => {
    if (!tokenData?.token) return;
    const link = `https://portmate.app/c/${tokenData.token}`;
    if (navigator.share) {
      navigator.share({
        title: 'Connect with me on PortMate',
        text: `Let's cross paths! Connect with @${user.username} on PortMate:`,
        url: link,
      }).catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  const parseToken = (input: string): string => {
    const raw = input.trim();
    if (raw.startsWith('portmate://connect?token=')) {
      return raw.split('portmate://connect?token=')[1].split('&')[0];
    }
    if (raw.includes('/c/')) {
      return raw.split('/c/')[1].split('?')[0].split('#')[0];
    }
    return raw;
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaimError(null);
    const token = parseToken(claimInput);

    if (!token) {
      setClaimError('Please enter a valid connection token or link.');
      return;
    }

    setClaiming(true);
    try {
      await onClaimToken(token);
      setSuccessToast('Successfully connected! Your itineraries and overlaps are now synced.');
      setClaimInput('');
      setMode('list');
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err: unknown) {
      setClaimError(err instanceof Error ? err.message : 'Failed to claim connection token');
    } finally {
      setClaiming(false);
    }
  };

  const handleRemove = async (conn: Connection) => {
    if (confirm(`Remove connection with ${conn.mate.displayName}?`)) {
      try {
        await onRemoveConnection(conn.id);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Failed to remove connection');
      }
    }
  };

  const handleBlock = async (conn: Connection) => {
    if (confirm(`Block ${conn.mate.displayName}? They will no longer see your itinerary or overlap events.`)) {
      try {
        await onBlockUser(conn.mate.id);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Failed to block user');
      }
    }
  };

  return (
    <div className="space-y-4 p-4 pb-24">
      {/* Toast Banner for Successful Pairing */}
      {successToast && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500 p-3.5 text-xs font-semibold text-white shadow-lg animate-bounce">
          <Sparkles className="h-5 w-5 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header and Mode Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Add PortMate</h1>
          <p className="text-xs text-slate-500">Instant in-person connection</p>
        </div>

        {/* Mode Switcher */}
        <div className="flex rounded-xl bg-slate-200/70 p-1">
          <button
            onClick={() => { setClaimError(null); setMode('qr'); }}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
              mode === 'qr' ? 'bg-white text-brand shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="h-4 w-4" />
            <span>My QR</span>
          </button>
          <button
            onClick={() => { setClaimError(null); setMode('scanner'); }}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
              mode === 'scanner' ? 'bg-white text-brand shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="h-4 w-4" />
            <span>Connect</span>
          </button>
          <button
            onClick={() => { setClaimError(null); setMode('list'); }}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
              mode === 'list' ? 'bg-white text-brand shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Mates ({connections.length})</span>
          </button>
        </div>
      </div>

      {claimError && (
        <div className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{claimError}</span>
        </div>
      )}

      {mode === 'qr' && (
        /* View A: Server-Minted QR Code & Share */
        <div className="space-y-4">
          <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center">
            <div className="relative mb-2 flex h-14 w-14 items-center justify-center rounded-full border-2 border-brand/20 bg-slate-100 shadow">
              <img
                src={user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                alt={user.displayName}
                className="h-full w-full rounded-full object-cover"
              />
            </div>
            <h2 className="text-base font-bold text-slate-900">{user.displayName}</h2>
            <div className="text-xs text-slate-500">@{user.username}</div>

            {/* Rendered QR Code */}
            <div className="my-4 flex items-center justify-center rounded-xl border border-slate-100 bg-white p-3 shadow-inner min-h-[240px]">
              {loadingToken ? (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <Loader2 className="h-8 w-8 animate-spin text-brand" />
                  <span className="text-xs">Minting secure connection token...</span>
                </div>
              ) : qrUrl ? (
                <img src={qrUrl} alt="PortMate QR Code" className="h-56 w-56 rounded-lg" />
              ) : (
                <div className="text-xs text-slate-400">Failed to render QR</div>
              )}
            </div>

            {tokenData?.expiresAt && (
              <div className="text-[11px] text-slate-400 mb-2">
                One-time token valid until {new Date(tokenData.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}

            <p className="text-xs text-slate-500 max-w-xs">
              Show this code to a colleague or fellow cruiser. Scanning establishes the connection instantly!
            </p>

            {/* Actions */}
            <div className="mt-4 flex w-full gap-2">
              <button
                onClick={handleCopyLink}
                disabled={!tokenData}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 active:scale-98 disabled:opacity-50"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-slate-500" />}
                <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
              </button>

              <button
                onClick={handleNativeShare}
                disabled={!tokenData}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand py-2.5 text-xs font-semibold text-white shadow hover:bg-brand-dark active:scale-98 disabled:opacity-50"
              >
                <Share2 className="h-4 w-4" />
                <span>Share Code</span>
              </button>
            </div>

            <button
              onClick={fetchNewToken}
              disabled={loadingToken}
              className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-brand hover:underline disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingToken ? 'animate-spin' : ''}`} />
              <span>Generate New Token</span>
            </button>
          </div>
        </div>
      )}

      {mode === 'scanner' && (
        /* View B: Connect via Scanned/Pasted Token */
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-1">Claim Connection</h2>
            <p className="text-xs text-slate-500 mb-4">
              Enter the connection token or link shared by your friend to link itineraries.
            </p>

            <form onSubmit={handleClaim} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Connection Token or Link</label>
                <input
                  type="text"
                  required
                  value={claimInput}
                  onChange={(e) => setClaimInput(e.target.value)}
                  placeholder="Paste portmate://connect?token=... or token string"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <button
                type="submit"
                disabled={claiming}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-xs font-bold text-white shadow hover:bg-brand-dark disabled:opacity-50 active:scale-98"
              >
                {claiming && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{claiming ? 'Connecting...' : 'Connect PortMate'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {mode === 'list' && (
        /* View C: List of Connections with Remove & Block */
        <div className="space-y-3">
          {connections.length === 0 ? (
            <EmptyState
              icon={<Users className="h-8 w-8 text-brand" />}
              title="No PortMates Connected Yet"
              description="Share your QR code or scan a friend's code to automatically detect when you are in the same cruise ports."
              actionText="Show My QR Code"
              onAction={() => setMode('qr')}
            />
          ) : (
            connections.map((conn) => (
              <div
                key={conn.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={conn.mate.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${conn.mate.username}`}
                    alt={conn.mate.displayName}
                    className="h-10 w-10 rounded-full border border-slate-200 object-cover"
                  />
                  <div>
                    <div className="font-bold text-sm text-slate-900">{conn.mate.displayName}</div>
                    <div className="text-xs text-slate-500">@{conn.mate.username}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Connected {new Date(conn.connectedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleRemove(conn)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    title="Remove Connection"
                  >
                    <UserX className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleBlock(conn)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                    title="Block User"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                      Block
                    </span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
