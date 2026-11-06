import React, { useState } from 'react';
import { usePOS, STAFF_USERS } from '../context/POSContext';
import { Role } from '../types/pos';
import { 
  UtensilsCrossed, 
  Volume2, 
  VolumeX, 
  Wifi, 
  WifiOff, 
  UserCheck, 
  Lock,
  ChevronDown,
  Download
} from 'lucide-react';

export const HeaderNav: React.FC = () => {
  const { 
    currentRole, 
    setCurrentRole, 
    currentUser, 
    setCurrentUser, 
    isWsConnected, 
    soundEnabled, 
    setSoundEnabled 
  } = usePOS();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [pinPromptUser, setPinPromptUser] = useState<typeof STAFF_USERS[0] | null>(null);
  const [inputPin, setInputPin] = useState('');
  const [pinError, setPinError] = useState(false);

  const roleLabels: Record<Role, { title: string; subtitle: string; icon: string }> = {
    kasir: { title: 'Kasir POS', subtitle: 'Pesanan & Bayar', icon: '💳' },
    dapur: { title: 'Dapur (KDS)', subtitle: 'Display Masak', icon: '🍳' },
    pemilik: { title: 'Dashboard Pemilik', subtitle: 'Laporan & Menu', icon: '👑' },
    pelanggan: { title: 'Mode Pelanggan', subtitle: 'Self-Order Meja', icon: '📱' }
  };

  const handleSelectRole = (role: Role) => {
    setShowRoleMenu(false);
    const targetStaff = STAFF_USERS.find(s => s.role === role);
    if (!targetStaff) return;

    // Direct switch for quick workflow, with option to verify PIN
    setCurrentRole(role);
    setCurrentUser(targetStaff);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white tracking-tight whitespace-nowrap">
                  Kedai Rasa Nusantara
                </span>
                <span className="hidden sm:inline-block text-[10px] text-neutral-400 font-medium">
                  v2.4
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 hidden sm:block">
                Sistem Kasir, KDS Realtime WebSocket & Laporan
              </p>
            </div>
          </div>

          {/* Zone 2: Role Selector Buttons */}
          <div className="hidden md:flex items-center gap-1.5 p-1 bg-neutral-950/80 rounded-xl border border-neutral-800">
            {(['kasir', 'dapur', 'pemilik', 'pelanggan'] as Role[]).map((role) => {
              const info = roleLabels[role];
              const isActive = currentRole === role;
              return (
                <button
                  key={role}
                  onClick={() => handleSelectRole(role)}
                  className={`flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-amber-500 text-neutral-950 shadow-sm font-bold'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <span>{info.icon}</span>
                  <span>{info.title}</span>
                </button>
              );
            })}
          </div>

          {/* Zone 3: Connection Status & Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Mobile Role Dropdown */}
            <div className="relative md:hidden">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-neutral-800 border border-neutral-700 text-xs text-white font-medium"
              >
                <span>{roleLabels[currentRole].icon}</span>
                <span className="truncate max-w-[80px]">{roleLabels[currentRole].title}</span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl py-1 z-50">
                  {(['kasir', 'dapur', 'pemilik', 'pelanggan'] as Role[]).map((role) => (
                    <button
                      key={role}
                      onClick={() => handleSelectRole(role)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors ${
                        currentRole === role ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-neutral-300 hover:bg-neutral-800'
                      }`}
                    >
                      <span>{roleLabels[role].icon}</span>
                      <span>{roleLabels[role].title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* WebSocket connection badge */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono border ${
                isWsConnected
                  ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-400'
                  : 'bg-red-950/40 border-red-800/50 text-red-400'
              }`}
              title={isWsConnected ? 'WebSocket Terhubung: Sinkronisasi Realtime Aktif' : 'WebSocket Terputus: Menghubungkan ulang...'}
            >
              {isWsConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isWsConnected ? 'Live Sync' : 'Offline'}</span>
            </div>

            {/* 1-Click ZIP Download Button */}
            <a
              href="/kedai-pos-lengkap.zip"
              download="kedai-pos-lengkap.zip"
              className="hidden sm:flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition-colors"
              title="Unduh seluruh file source code (ZIP)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh ZIP</span>
            </a>

            {/* Sound toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-1.5 rounded-lg border transition-colors ${
                soundEnabled
                  ? 'bg-neutral-800 border-neutral-700 text-amber-400 hover:text-amber-300'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-400'
              }`}
              title={soundEnabled ? 'Suara Notifikasi Dapur Aktif' : 'Suara Dinonaktifkan'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Active user badge */}
            <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-neutral-800 text-xs">
              <span className="text-sm">{currentUser.avatar}</span>
              <div>
                <p className="font-semibold text-white leading-tight">{currentUser.name}</p>
                <p className="text-[10px] text-amber-400 uppercase tracking-wider">{currentUser.role}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Staff PIN confirmation modal if activated */}
      {pinPromptUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base mb-1">Verifikasi Akses Staf</h3>
            <p className="text-xs text-neutral-400 mb-4">
              Masukkan PIN untuk masuk sebagai <span className="font-semibold text-white">{pinPromptUser.name}</span>
            </p>

            <input
              type="password"
              maxLength={4}
              value={inputPin}
              onChange={(e) => {
                setInputPin(e.target.value);
                setPinError(false);
              }}
              placeholder="••••"
              className="w-36 mx-auto text-center font-mono text-2xl tracking-[0.5em] py-2 px-3 bg-neutral-950 border border-neutral-700 rounded-xl text-white focus:border-amber-500 focus:outline-none mb-3"
            />

            {pinError && (
              <p className="text-xs text-red-400 mb-3">PIN salah! Coba lagi.</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setPinPromptUser(null);
                  setInputPin('');
                }}
                className="flex-1 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 font-semibold"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (inputPin === pinPromptUser.pin || !pinPromptUser.pin) {
                    setCurrentRole(pinPromptUser.role);
                    setCurrentUser(pinPromptUser);
                    setPinPromptUser(null);
                    setInputPin('');
                  } else {
                    setPinError(true);
                  }
                }}
                className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold"
              >
                Masuk
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
