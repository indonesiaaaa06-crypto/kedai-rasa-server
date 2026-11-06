import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { MenuItem, OrderItem, Order } from '../types/pos';
import { formatRupiah } from '../utils/format';
import { 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  Phone, 
  User, 
  CheckCircle2, 
  Clock, 
  ChefHat, 
  Sparkles,
  ArrowRight,
  Flame
} from 'lucide-react';

export const CustomerSelfOrderView: React.FC = () => {
  const { menuItems, createOrder, orders } = usePOS();

  const [tableNumber, setTableNumber] = useState('Meja 05');
  const [customerName, setCustomerName] = useState('Dina');
  const [customerPhone, setCustomerPhone] = useState('081298765432');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [activeCustomerOrder, setActiveCustomerOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  const categories = ['Semua', 'Makanan Utama', 'Minuman', 'Camilan', 'Paket Hemat'];

  const filteredMenu = menuItems.filter(
    item => selectedCategory === 'Semua' || item.category === selectedCategory
  );

  // Sync active order if it exists in state
  const liveOrder = activeCustomerOrder
    ? orders.find(o => o.id === activeCustomerOrder.id) || activeCustomerOrder
    : null;

  const addToCart = (item: MenuItem) => {
    if (!item.isAvailable) return;
    setCart((prev) => {
      const existing = prev.find(i => i.menuId === item.id);
      if (existing) {
        return prev.map(i => i.menuId === item.id ? {
          ...i,
          quantity: i.quantity + 1,
          subtotal: (i.quantity + 1) * i.price
        } : i);
      }
      return [
        ...prev,
        {
          id: `${item.id}-${Date.now()}`,
          menuId: item.id,
          name: item.name,
          price: item.price,
          costPrice: item.costPrice,
          quantity: 1,
          subtotal: item.price
        }
      ];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const q = i.quantity + delta;
        return q > 0 ? { ...i, quantity: q, subtotal: q * i.price } : null;
      }
      return i;
    }).filter(Boolean) as OrderItem[]);
  };

  const subtotal = cart.reduce((s, i) => s + i.subtotal, 0);
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;
  const totalCost = cart.reduce((s, i) => s + (i.costPrice * i.quantity), 0);

  const handleSubmitSelfOrder = async () => {
    if (cart.length === 0 || !customerName) return;
    setIsSubmitting(true);

    const newOrder = await createOrder({
      tableNumber,
      customerName,
      customerPhone,
      orderType: 'DINE_IN',
      items: cart,
      subtotal,
      discount: 0,
      tax,
      serviceFee: 0,
      total,
      totalCost,
      status: 'MENUNGGU',
      paymentStatus: 'PENDING'
    });

    setIsSubmitting(false);
    if (newOrder) {
      setActiveCustomerOrder(newOrder);
      setCart([]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-6 space-y-6">
      {/* Customer Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-neutral-950 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-neutral-900 bg-amber-400 px-2 py-0.5 rounded">
            Pemesanan Mandiri
          </span>
          <h1 className="text-2xl font-extrabold text-white mt-1">
            Selamat Datang di Kedai Rasa Nusantara
          </h1>
          <p className="text-xs text-amber-100 mt-0.5">
            Pesan langsung dari meja Anda tanpa antre. Pesanan akan langsung dimasak di dapur!
          </p>
        </div>

        <div className="bg-neutral-950/20 backdrop-blur-md p-3 rounded-2xl text-white text-xs border border-white/20">
          <p className="font-semibold">Lokasi Meja:</p>
          <p className="text-base font-bold text-amber-300 font-mono">{tableNumber}</p>
        </div>
      </div>

      {/* Live Order Tracker if customer just ordered */}
      {liveOrder && (
        <div className="p-6 rounded-3xl bg-neutral-950 border-2 border-amber-500/50 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-amber-400 font-semibold font-mono">
                PESANAN AKTIF: {liveOrder.orderNumber}
              </span>
              <h2 className="text-lg font-bold text-white">Status Pesanan Anda</h2>
            </div>
            <span className="text-xs bg-neutral-800 text-neutral-300 px-3 py-1 rounded-full font-mono">
              {liveOrder.tableNumber}
            </span>
          </div>

          {/* Stepper */}
          <div className="grid grid-cols-3 gap-2 text-center pt-2">
            <div className={`p-3 rounded-xl border text-xs font-semibold ${
              ['MENUNGGU', 'DIMASAK', 'SIAP_DIAMBIL', 'SELESAI'].includes(liveOrder.status)
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-neutral-900 border-neutral-800 text-neutral-500'
            }`}>
              <Clock className="w-4 h-4 mx-auto mb-1" />
              <span>1. Diterima</span>
            </div>

            <div className={`p-3 rounded-xl border text-xs font-semibold ${
              ['DIMASAK', 'SIAP_DIAMBIL', 'SELESAI'].includes(liveOrder.status)
                ? 'bg-orange-500/20 border-orange-500 text-orange-300 animate-pulse'
                : 'bg-neutral-900 border-neutral-800 text-neutral-500'
            }`}>
              <ChefHat className="w-4 h-4 mx-auto mb-1" />
              <span>2. Dimasak di Dapur</span>
            </div>

            <div className={`p-3 rounded-xl border text-xs font-semibold ${
              ['SIAP_DIAMBIL', 'SELESAI'].includes(liveOrder.status)
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                : 'bg-neutral-900 border-neutral-800 text-neutral-500'
            }`}>
              <CheckCircle2 className="w-4 h-4 mx-auto mb-1" />
              <span>3. Siap Diambil!</span>
            </div>
          </div>

          {liveOrder.status === 'SIAP_DIAMBIL' && (
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs text-center space-y-1">
              <p className="font-bold text-sm">🎉 Makanan Anda Sudah Matang!</p>
              <p>Silakan ambil di konter atau kru kami akan segera mengantarkan ke meja Anda.</p>
              {liveOrder.customerPhone && (
                <p className="text-[11px] text-emerald-400">
                  Notifikasi otomatis WhatsApp telah dikirimkan ke {liveOrder.customerPhone}
                </p>
              )}
            </div>
          )}

          <div className="p-3 bg-neutral-900 rounded-xl text-xs space-y-1">
            <p className="text-neutral-400 font-medium">Ringkasan Item:</p>
            {liveOrder.items.map((it, idx) => (
              <div key={idx} className="flex justify-between text-neutral-300">
                <span>{it.quantity}x {it.name}</span>
                <span className="font-mono">{formatRupiah(it.subtotal)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-white pt-2 border-t border-neutral-800">
              <span>Total Tagihan:</span>
              <span className="font-mono text-amber-400">{formatRupiah(liveOrder.total)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Identity form */}
      <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-neutral-400 block mb-1">Nomor Meja:</label>
          <select
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2 px-3 text-xs text-white"
          >
            {Array.from({ length: 12 }, (_, i) => `Meja ${String(i + 1).padStart(2, '0')}`).map((tbl) => (
              <option key={tbl} value={tbl}>{tbl}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-400 block mb-1">Nama Pemesan:</label>
          <div className="relative">
            <User className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nama Anda"
              className="w-full pl-8 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-400 block mb-1">No. WhatsApp (Untuk Info Matang):</label>
          <div className="relative">
            <Phone className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="0812xxxxxxx"
              className="w-full pl-8 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white font-mono"
            />
          </div>
        </div>
      </div>

      {/* Menu Categories */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`py-1.5 px-3.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-amber-500 text-neutral-950 font-bold'
                : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredMenu.map((item) => (
          <div
            key={item.id}
            className={`rounded-2xl border p-3 flex gap-3 items-center justify-between transition-all ${
              item.isAvailable
                ? 'bg-neutral-950 border-neutral-800'
                : 'bg-neutral-950/40 border-neutral-800/40 opacity-50'
            }`}
          >
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-neutral-900 shrink-0">
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            </div>

            <div className="flex-1 min-w-0 pr-2">
              <h4 className="font-bold text-xs text-white truncate">{item.name}</h4>
              <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">{item.description}</p>
              <p className="font-mono text-xs font-bold text-amber-400 mt-1">
                {formatRupiah(item.price)}
              </p>
            </div>

            <div>
              {item.isAvailable ? (
                <button
                  onClick={() => addToCart(item)}
                  className="py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-transform active:scale-95"
                >
                  + Tambah
                </button>
              ) : (
                <span className="text-[10px] text-red-400 font-bold bg-red-950/60 px-2 py-1 rounded">
                  Habis
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 inset-x-4 max-w-xl mx-auto z-30 p-4 rounded-2xl bg-neutral-900/95 backdrop-blur-md border border-neutral-700 shadow-2xl flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] text-neutral-400">{cart.reduce((s, i) => s + i.quantity, 0)} item pesanan</p>
            <p className="text-base font-bold font-mono text-amber-400">{formatRupiah(total)}</p>
          </div>

          <button
            disabled={isSubmitting}
            onClick={handleSubmitSelfOrder}
            className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
          >
            <span>Kirim Pesanan ke Dapur</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
