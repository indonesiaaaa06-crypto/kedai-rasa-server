import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { MessageSquare, ExternalLink, Copy, Check, X, Bell } from 'lucide-react';
import { generateWhatsAppMessage } from '../utils/format';

export const WhatsAppModal: React.FC = () => {
  const { waModalOrder, setWaModalOrder } = usePOS();
  const [copied, setCopied] = useState(false);

  if (!waModalOrder) return null;

  const phone = (waModalOrder.customerPhone || '').replace(/[^0-9]/g, '');
  const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
  const messageText = generateWhatsAppMessage(
    waModalOrder.customerName,
    waModalOrder.orderNumber,
    waModalOrder.tableNumber,
    waModalOrder.orderType
  );
  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}` : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-neutral-100 relative">
        <button
          onClick={() => setWaModalOrder(null)}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Notifikasi WhatsApp Pelanggan</h3>
            <p className="text-xs text-neutral-400">
              Pesanan <span className="text-amber-400 font-semibold">{waModalOrder.orderNumber}</span> telah Siap Diambil
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs space-y-1">
            <div className="flex justify-between text-neutral-400">
              <span>Pelanggan:</span>
              <span className="font-semibold text-white">{waModalOrder.customerName}</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>No. WhatsApp:</span>
              <span className="font-mono text-emerald-400">{cleanPhone ? `+${cleanPhone}` : 'Tidak dicantumkan'}</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Lokasi / Meja:</span>
              <span className="text-white">{waModalOrder.orderType === 'DINE_IN' ? waModalOrder.tableNumber : 'Takeaway (Bawa Pulang)'}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-300 block mb-1.5">
              Teks Pesan Otomatis:
            </label>
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 text-xs text-neutral-200 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto font-sans">
              {messageText}
            </div>
          </div>

          <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-3 flex items-start gap-2.5">
            <Bell className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <p className="text-xs text-emerald-200/90 leading-relaxed">
              Sistem telah mencatat log pengiriman notifikasi otomatis. Anda juga dapat langsung membuka WhatsApp Web / Aplikasi via tombol di bawah.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Tersalin' : 'Salin Pesan'}
          </button>

          {cleanPhone ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setWaModalOrder(null)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors shadow-lg shadow-emerald-600/20"
            >
              <ExternalLink className="w-4 h-4" />
              Buka WhatsApp
            </a>
          ) : (
            <button
              onClick={() => setWaModalOrder(null)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-700 hover:bg-neutral-600 text-xs font-bold text-white transition-colors"
            >
              Tutup
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
