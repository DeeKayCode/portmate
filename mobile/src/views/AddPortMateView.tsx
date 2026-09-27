import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { User, Connection } from '../types';
import { QrCode, Camera, Copy, Check, Share2, UserX, Sparkles } from 'lucide-react';

interface AddPortMateViewProps {
  user: User;
  connections: Connection[];
  onConnectQR: (qrData: string) => { success: boolean; mate?: User; message: string };
  onRemoveConnection: (mateId: string) => void;
  onBlockUser: (mateId: string) => void;
}

export const AddPortMateView: React.FC<AddPortMateViewProps> = ({
  user,
  connections,
  onConnectQR,
  onRemoveConnection,
  onBlockUser,
}) => {
  const [mode, setMode] = useState<'qr' | 'scanner'>('qr');
  const [qrUrl, setQrUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [scanInput, setScanInput] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const sharePayload = `portmate://connect?u=${user.username}&id=${user.id}`;
  const webLink = `https://portmate.app/c/${user.username}`;

  useEffect(() => {
    QRCode.toDataURL(sharePayload, {
      width: 260,
      margin: 2,
      color: {
        dark: '#0F4C81',
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrUrl(url))
      .catch((err) => console.error(err));
  }, [sharePayload]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(webLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Add me on PortMate',
        text: `Let's cross paths! Connect with @${user.username} on PortMate:`,
        url: webLink,
      }).catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  const handleTriggerSimulatedScan = (sampleUsername: string) => {
    const res = onConnectQR(`portmate://connect?u=${sampleUsername}`);
    if (res.success) {
      setSuccessToast(res.message);
      setMode('qr');
      setTimeout(() => setSuccessToast(null), 4000);
    }
  };

  return (
    <div className="space-y-4 p-4 pb-24">
      {/* Toast Banner for Frictionless Instant Pairing */}
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
            onClick={() => setMode('qr')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              mode === 'qr' ? 'bg-white text-brand shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="h-4 w-4" />
            <span>My QR</span>
          </button>
          <button
            onClick={() => setMode('scanner')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              mode === 'scanner' ? 'bg-white text-brand shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="h-4 w-4" />
            <span>Scan Camera</span>
          </button>
        </div>
      </div>

      {mode === 'qr' ? (
        /* View A: QR Code & Share */
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
            <div className="my-4 rounded-xl border border-slate-100 bg-white p-3 shadow-inner">
              {qrUrl ? (
                <img src={qrUrl} alt="PortMate QR Code" className="h-56 w-56 rounded-lg" />
              ) : (
                <canvas ref={canvasRef} className="h-56 w-56"></canvas>
              )}
            </div>

            <p className="text-xs text-slate-500 max-w-xs">
              Show this code to a colleague or fellow traveler. Scanning establishes the connection instantly!
            </p>

            {/* Quick Share Links */}
            <div className="mt-4 flex w-full gap-2">
              <button
                onClick={handleCopyLink}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 active:scale-98"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-slate-500" />}
                <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
              </button>

              <button
                onClick={handleNativeShare}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand py-2.5 text-xs font-semibold text-white shadow hover:bg-brand-dark active:scale-98"
              >
                <Share2 className="h-4 w-4" />
                <span>Share Profile</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* View B: Live Scanner / Camera */
        <div className="space-y-4">
          <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-slate-950 p-6 text-center text-white shadow-lg min-h-[300px]">
            {/* Viewfinder Reticle */}
            <div className="relative h-48 w-48 rounded-2xl border-2 border-brand-accent p-2">
              <div className="absolute top-0 left-0 h-4 w-4 border-t-4 border-l-4 border-white"></div>
              <div className="absolute top-0 right-0 h-4 w-4 border-t-4 border-r-4 border-white"></div>
              <div className="absolute bottom-0 left-0 h-4 w-4 border-b-4 border-l-4 border-white"></div>
              <div className="absolute bottom-0 right-0 h-4 w-4 border-b-4 border-r-4 border-white"></div>

              {/* Scanning animation bar */}
              <div className="h-1 w-full bg-brand-accent/80 shadow-[0_0_8px_#F59E0B] animate-pulse mt-20"></div>
            </div>

            <p className="mt-4 text-xs text-slate-300">
              Align mate's QR code within the frame to connect instantly.
            </p>

            {/* Quick Demo Scan Shortcuts */}
            <div className="mt-6 w-full border-t border-slate-800 pt-4">
              <div className="text-[11px] text-slate-400 mb-2">Simulate real-world camera detection:</div>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => handleTriggerSimulatedScan('elena_dancer')}
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-white/20 active:scale-95"
                >
                  Scan @elena_dancer
                </button>
                <button
                  onClick={() => handleTriggerSimulatedScan('johan_chief')}
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-white/20 active:scale-95"
                >
                  Scan @johan_chief
                </button>
              </div>
            </div>
          </div>

          {/* Manual Handle Input Fallback */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="block text-xs font-semibold text-slate-700">Can't scan? Add by Username / Link</label>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="@username or portmate.app/c/username"
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-brand focus:outline-none"
              />
              <button
                onClick={() => {
                  if (scanInput.trim()) {
                    handleTriggerSimulatedScan(scanInput.trim());
                    setScanInput('');
                  }
                }}
                className="rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-dark"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PortMate Connection Management List */}
      <div className="mt-6 space-y-3">
        <h2 className="text-sm font-bold text-slate-800">Your Connected PortMates ({connections.length})</h2>
        <div className="space-y-2">
          {connections.map((conn) => (
            <div
              key={conn.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <img
                  src={conn.mate.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${conn.mate.username}`}
                  alt={conn.mate.displayName}
                  className="h-10 w-10 rounded-full border border-slate-200 object-cover"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">{conn.mate.displayName}</div>
                  <div className="text-[11px] text-slate-500">
                    @{conn.mate.username} • {conn.currentShip || 'Aboard'}
                  </div>
                  {conn.nextOverlap && (
                    <div className="mt-0.5 text-[10px] font-semibold text-brand">
                      Next: {conn.nextOverlap}
                    </div>
                  )}
                </div>
              </div>

              {/* Overflow Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    if (confirm(`Remove connection with ${conn.mate.displayName}?`)) {
                      onRemoveConnection(conn.mate.id);
                    }
                  }}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  title="Remove PortMate"
                >
                  <UserX className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Block ${conn.mate.displayName}?`)) {
                      onBlockUser(conn.mate.id);
                    }
                  }}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                  title="Block User"
                >
                  <span className="text-[10px] font-bold">🚫</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
