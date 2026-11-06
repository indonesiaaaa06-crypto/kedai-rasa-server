import React, { useState, useEffect } from 'react';
import { usePOS } from '../context/POSContext';
import { Order, OrderStatus } from '../types/pos';
import { getElapsedTimeMinutes, formatWaktu } from '../utils/format';
import { playNewOrderChime, playOrderReadyChime } from '../utils/audio';
import { 
  ChefHat, 
  Clock, 
  Flame, 
  CheckCircle2, 
  BellRing, 
  MessageSquare, 
  AlertTriangle, 
  Sparkles, 
  Timer,
  Volume2
} from 'lucide-react';

export const KitchenView: React.FC = () => {
  const { 
    orders, 
    updateOrderStatus, 
    setWaModalOrder, 
    activeOrderNotification, 
    clearOrderNotification 
  } = usePOS();

  const [activeTab, setActiveTab] = useState<'ALL_ACTIVE' | 'MENUNGGU' | 'DIMASAK' | 'SIAP_DIAMBIL'>('ALL_ACTIVE');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [, setTick] = useState(0);

  // Timer tick every 10 seconds to update elapsed minutes
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const toggleItemCheck = (orderId: string, itemIdx: number) => {
    const key = `${orderId}-${itemIdx}`;
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const activeOrders = orders.filter(o => o.status !== 'SELESAI' && o.status !== 'DIBATALKAN');

  const filteredOrders = activeOrders.filter(o => {
    if (activeTab === 'ALL_ACTIVE') return true;
    return o.status === activeTab;
  });

  const waitingCount = orders.filter(o => o.status === 'MENUNGGU').length;
  const cookingCount = orders.filter(o => o.status === 'DIMASAK').length;
  const readyCount = orders.filter(o => o.status === 'SIAP_DIAMBIL').length;

  const handleStatusChange = async (order: Order, newStatus: OrderStatus) => {
    await updateOrderStatus(order.id, newStatus);
    if (newStatus === 'SIAP_DIAMBIL') {
      playOrderReadyChime();
      setWaModalOrder({ ...order, status: newStatus });
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
      {/* Top Banner & Audio Test */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-950 border border-neutral-800 rounded-2xl p-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Kitchen Display System (KDS Dapur)</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-400 font-mono">
                  LIVE WEBSOCKET SYNC
                </span>
              </h1>
              <p className="text-xs text-neutral-400">
                Notifikasi pesanan otomatis masuk, status antrean masak, dan kirim pesan WhatsApp saat matang
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => playNewOrderChime()}
            className="flex items-center gap-2 py-2 px-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 border border-neutral-700 transition-colors"
          >
            <Volume2 className="w-4 h-4 text-amber-400" />
            <span>Tes Bel Dapur</span>
          </button>
        </div>
      </div>

      {/* New Order Realtime Notification Callout */}
      {activeOrderNotification && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/60 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center animate-bounce">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Pesanan Baru Masuk!
              </p>
              <p className="text-sm font-semibold text-white">
                {activeOrderNotification.orderNumber} · {activeOrderNotification.tableNumber} ({activeOrderNotification.customerName})
              </p>
            </div>
          </div>
          <button
            onClick={clearOrderNotification}
            className="py-1.5 px-3 rounded-lg bg-amber-500 text-neutral-950 text-xs font-bold hover:bg-amber-400 transition-colors"
          >
            Tandai Dilihat
          </button>
        </div>
      )}

      {/* Filter Tabs & Queue Status */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
          <button
            onClick={() => setActiveTab('ALL_ACTIVE')}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'ALL_ACTIVE'
                ? 'bg-amber-500 text-neutral-950 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Semua Aktif ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('MENUNGGU')}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'MENUNGGU'
                ? 'bg-red-500 text-white font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Menunggu Dimasak ({waitingCount})
          </button>
          <button
            onClick={() => setActiveTab('DIMASAK')}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'DIMASAK'
                ? 'bg-orange-500 text-white font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Sedang Dimasak ({cookingCount})
          </button>
          <button
            onClick={() => setActiveTab('SIAP_DIAMBIL')}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'SIAP_DIAMBIL'
                ? 'bg-emerald-500 text-neutral-950 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Siap Diambil ({readyCount})
          </button>
        </div>

        <div className="text-xs text-neutral-400 flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>&lt; 10 mnt</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>10-20 mnt</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span>&gt; 20 mnt (Kritis)</span>
          </div>
        </div>
      </div>

      {/* Orders Board */}
      {filteredOrders.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-neutral-950 border border-neutral-800 text-neutral-500 space-y-2">
          <ChefHat className="w-12 h-12 mx-auto opacity-30 text-neutral-400" />
          <h3 className="font-bold text-neutral-300 text-base">Tidak ada antrean pesanan di tab ini</h3>
          <p className="text-xs">Dapur siap menerima pesanan baru secara real-time via WebSocket!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const elapsed = getElapsedTimeMinutes(order.createdAt);
            const isLate = elapsed > 20;
            const isWarning = elapsed >= 10 && elapsed <= 20;

            const timerColor = isLate
              ? 'text-red-400 bg-red-950/60 border-red-800/80'
              : isWarning
              ? 'text-amber-400 bg-amber-950/60 border-amber-800/80'
              : 'text-emerald-400 bg-emerald-950/60 border-emerald-800/80';

            return (
              <div
                key={order.id}
                className={`rounded-2xl border flex flex-col justify-between overflow-hidden shadow-lg transition-all ${
                  order.status === 'SIAP_DIAMBIL'
                    ? 'bg-neutral-950/90 border-emerald-500/50'
                    : order.status === 'DIMASAK'
                    ? 'bg-neutral-950/90 border-orange-500/50'
                    : 'bg-neutral-950 border-neutral-800'
                }`}
              >
                {/* Header Ticket */}
                <div className="p-4 border-b border-neutral-800/80 bg-neutral-900/40">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-base font-extrabold text-white">
                      {order.orderNumber}
                    </span>
                    <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border font-mono text-xs font-bold ${timerColor}`}>
                      <Timer className="w-3.5 h-3.5" />
                      <span>{elapsed} mnt</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-amber-400 text-sm">
                        {order.orderType === 'DINE_IN' ? order.tableNumber : 'Bawa Pulang (Takeaway)'}
                      </span>
                    </div>
                    <span className="text-neutral-400 text-[11px]">
                      Masuk: {formatWaktu(order.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-300 mt-1 font-medium">
                    Pelanggan: <span className="text-white font-semibold">{order.customerName}</span>
                    {order.customerPhone && (
                      <span className="text-neutral-500 font-mono text-[10px] ml-1.5">({order.customerPhone})</span>
                    )}
                  </p>
                </div>

                {/* Items Checklist */}
                <div className="p-4 space-y-3 flex-1">
                  {order.items.map((item, idx) => {
                    const isChecked = checkedItems[`${order.id}-${idx}`] || false;
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleItemCheck(order.id, idx)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                          isChecked
                            ? 'bg-emerald-950/20 border-emerald-900/50 opacity-60 line-through text-neutral-500'
                            : 'bg-neutral-900/60 border-neutral-800 text-neutral-200 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <div className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center shrink-0 ${
                              isChecked ? 'bg-emerald-500 border-emerald-500 text-neutral-950' : 'border-neutral-600'
                            }`}>
                              {isChecked && <CheckCircle2 className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div>
                              <p className="font-bold text-xs text-white">
                                <span className="font-mono text-amber-400 mr-1.5">{item.quantity}x</span>
                                {item.name}
                              </p>
                              <div className="flex flex-wrap gap-2 text-[10px] text-neutral-400 mt-0.5">
                                {item.spiciness && (
                                  <span className="text-red-400 font-semibold flex items-center gap-0.5">
                                    <Flame className="w-3 h-3" />
                                    {item.spiciness}
                                  </span>
                                )}
                                {item.variant && (
                                  <span className="text-amber-300">· {item.variant}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {item.notes && (
                          <p className="mt-1.5 text-[11px] bg-amber-950/40 text-amber-300 px-2 py-1 rounded border border-amber-900/40 font-medium">
                            Catatan: {item.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Action Buttons Footer */}
                <div className="p-3 bg-neutral-900/50 border-t border-neutral-800/80 space-y-2">
                  {order.status === 'MENUNGGU' && (
                    <button
                      onClick={() => handleStatusChange(order, 'DIMASAK')}
                      className="w-full py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-neutral-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20"
                    >
                      <Flame className="w-4 h-4" />
                      <span>Mulai Masak Sekarang</span>
                    </button>
                  )}

                  {order.status === 'DIMASAK' && (
                    <button
                      onClick={() => handleStatusChange(order, 'SIAP_DIAMBIL')}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Pesanan Matang & Siap Diambil</span>
                    </button>
                  )}

                  {order.status === 'SIAP_DIAMBIL' && (
                    <div className="space-y-2">
                      <div className="p-2 rounded-lg bg-emerald-950/50 border border-emerald-800/60 flex items-center justify-between text-xs text-emerald-300">
                        <span>Menunggu Diambil Pelanggan</span>
                        <button
                          onClick={() => setWaModalOrder(order)}
                          className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:underline"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Kirim WA</span>
                        </button>
                      </div>

                      <button
                        onClick={() => handleStatusChange(order, 'SELESAI')}
                        className="w-full py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs transition-colors"
                      >
                        Selesai Diserahkan ke Meja/Pelanggan
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
