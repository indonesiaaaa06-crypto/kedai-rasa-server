import React, { useState, useMemo } from 'react';
import { usePOS } from '../context/POSContext';
import { MenuItem, OrderItem, Order, OrderType } from '../types/pos';
import { formatRupiah } from '../utils/format';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  Receipt, 
  Flame, 
  Utensils, 
  Phone, 
  User, 
  Percent, 
  ChevronRight,
  Printer,
  Sparkles
} from 'lucide-react';

export const CashierView: React.FC = () => {
  const { menuItems, createOrder, orders } = usePOS();

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart state
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedTable, setSelectedTable] = useState('Meja 01');
  const [orderType, setOrderType] = useState<OrderType>('DINE_IN');
  const [customerName, setCustomerName] = useState('Pelanggan Meja 1');
  const [customerPhone, setCustomerPhone] = useState('081288991234');
  const [discountAmount, setDiscountAmount] = useState(0);

  // Modals state
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [selectedSpiciness, setSelectedSpiciness] = useState<string>('Sedang');
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [customNotes, setCustomNotes] = useState('');

  const [activePaymentOrder, setActivePaymentOrder] = useState<Order | null>(null);
  const [printedReceiptOrder, setPrintedReceiptOrder] = useState<Order | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const categories = ['Semua', 'Makanan Utama', 'Minuman', 'Camilan', 'Paket Hemat'];

  const filteredMenu = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCat = selectedCategory === 'Semua' || item.category === selectedCategory;
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  const handleItemClick = (item: MenuItem) => {
    if (!item.isAvailable) return;

    if ((item.spicinessLevels && item.spicinessLevels.length > 0) || (item.variants && item.variants.length > 0)) {
      setCustomizingItem(item);
      setSelectedSpiciness(item.spicinessLevels ? item.spicinessLevels[0] : '');
      setSelectedVariant(item.variants && item.variants.length > 0 ? item.variants[0].name : '');
      setCustomNotes('');
    } else {
      addToCartDirect(item);
    }
  };

  const addToCartDirect = (item: MenuItem, spiciness?: string, variantName?: string, notes?: string) => {
    let extraPrice = 0;
    if (variantName && item.variants) {
      const v = item.variants.find(va => va.name === variantName);
      if (v) extraPrice = v.extraPrice;
    }

    const unitPrice = item.price + extraPrice;
    const cartItemId = `${item.id}-${spiciness || ''}-${variantName || ''}-${notes || ''}`;

    setCart((prev) => {
      const existing = prev.find(i => i.id === cartItemId);
      if (existing) {
        return prev.map(i => i.id === cartItemId ? {
          ...i,
          quantity: i.quantity + 1,
          subtotal: (i.quantity + 1) * unitPrice
        } : i);
      }
      return [
        ...prev,
        {
          id: cartItemId,
          menuId: item.id,
          name: item.name,
          price: unitPrice,
          costPrice: item.costPrice,
          quantity: 1,
          spiciness,
          variant: variantName,
          notes,
          subtotal: unitPrice
        }
      ];
    });
  };

  const handleConfirmCustomization = () => {
    if (!customizingItem) return;
    addToCartDirect(customizingItem, selectedSpiciness, selectedVariant, customNotes);
    setCustomizingItem(null);
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map(i => {
          if (i.id === itemId) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty, subtotal: newQty * i.price } : null;
          }
          return i;
        })
        .filter(Boolean) as OrderItem[];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = Math.round((subtotal - discountAmount) * 0.1); // PB1 10%
  const total = Math.max(0, subtotal - discountAmount + tax);
  const totalCost = cart.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);

  const handleCheckoutNow = async () => {
    if (cart.length === 0) return;

    const newOrder = await createOrder({
      tableNumber: orderType === 'DINE_IN' ? selectedTable : 'Takeaway',
      customerName: customerName || 'Pelanggan',
      customerPhone,
      orderType,
      items: cart,
      subtotal,
      discount: discountAmount,
      tax,
      serviceFee: 0,
      total,
      totalCost,
      status: 'MENUNGGU',
      paymentStatus: 'PENDING'
    });

    if (newOrder) {
      setCart([]);
      setActivePaymentOrder(newOrder);
    }
  };

  const handleSendToKitchenFirst = async () => {
    if (cart.length === 0) return;

    const newOrder = await createOrder({
      tableNumber: orderType === 'DINE_IN' ? selectedTable : 'Takeaway',
      customerName: customerName || 'Pelanggan',
      customerPhone,
      orderType,
      items: cart,
      subtotal,
      discount: discountAmount,
      tax,
      serviceFee: 0,
      total,
      totalCost,
      status: 'MENUNGGU',
      paymentStatus: 'PENDING'
    });

    if (newOrder) {
      setCart([]);
      alert(`Pesanan ${newOrder.orderNumber} berhasil dikirim ke KDS Dapur via WebSocket!`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6">
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-neutral-950 border border-neutral-800 rounded-2xl p-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Terminal Kasir POS</span>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-mono">
              SHIFT AKTIF
            </span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Pencatatan pesanan instan, pembayaran digital/tunai, dan cetak struk
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-2 py-2 px-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 border border-neutral-700 transition-colors"
          >
            <Receipt className="w-4 h-4 text-amber-400" />
            <span>Riwayat Pesanan ({orders.length})</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Menu Grid (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search & Category Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari menu makanan, minuman, camilan..."
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                      : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredMenu.map((item) => {
              const isAvailable = item.isAvailable;
              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`group relative rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col ${
                    isAvailable
                      ? 'bg-neutral-950/80 border-neutral-800 hover:border-amber-500/60 hover:shadow-lg hover:shadow-amber-500/5 cursor-pointer'
                      : 'bg-neutral-950/30 border-neutral-800/40 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="relative aspect-4/3 bg-neutral-900 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {!isAvailable && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <span className="text-[11px] font-bold text-red-400 bg-red-950/80 border border-red-800 px-2.5 py-1 rounded-md">
                          HABIS
                        </span>
                      </div>
                    )}
                    <span className="absolute top-2 left-2 text-[10px] bg-black/60 backdrop-blur-md text-neutral-300 px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-xs text-white line-clamp-1 group-hover:text-amber-400 transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-neutral-800/80 flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-amber-400">
                        {formatRupiah(item.price)}
                      </span>
                      {isAvailable && (
                        <div className="w-6 h-6 rounded-lg bg-amber-500 text-neutral-950 flex items-center justify-center opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all">
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Active Cart Drawer (5 cols) */}
        <div className="lg:col-span-5 bg-neutral-950 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-500" />
              <h2 className="font-bold text-white text-base">Keranjang Pesanan</h2>
            </div>
            <span className="text-xs font-mono text-neutral-400">
              {cart.reduce((s, i) => s + i.quantity, 0)} item
            </span>
          </div>

          {/* Dine-In vs Takeaway Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-900 rounded-xl border border-neutral-800">
            <button
              onClick={() => setOrderType('DINE_IN')}
              className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                orderType === 'DINE_IN'
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Makan di Tempat (Dine-In)
            </button>
            <button
              onClick={() => setOrderType('TAKEAWAY')}
              className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                orderType === 'TAKEAWAY'
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Bungkus (Takeaway)
            </button>
          </div>

          {/* Order Details: Table & Customer */}
          <div className="grid grid-cols-2 gap-2.5">
            {orderType === 'DINE_IN' && (
              <div>
                <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                  Nomor Meja:
                </label>
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {Array.from({ length: 12 }, (_, i) => `Meja ${String(i + 1).padStart(2, '0')}`).map((tbl) => (
                    <option key={tbl} value={tbl}>
                      {tbl}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className={orderType === 'TAKEAWAY' ? 'col-span-2' : ''}>
              <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                Nama Pelanggan:
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama Pelanggan"
                  className="w-full pl-8 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                No. WhatsApp (Notifikasi Otomatis Siap Diambil):
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0812xxxxxxx"
                  className="w-full pl-8 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="border-t border-b border-neutral-800 py-3 max-h-60 overflow-y-auto space-y-2.5">
            {cart.length === 0 ? (
              <div className="py-8 text-center text-neutral-500 space-y-1">
                <Utensils className="w-8 h-8 mx-auto opacity-30" />
                <p className="text-xs">Keranjang masih kosong</p>
                <p className="text-[11px]">Pilih menu di sebelah kiri untuk menambah</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-white truncate">{item.name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-neutral-400 mt-0.5">
                      <span>{formatRupiah(item.price)}</span>
                      {item.spiciness && <span className="text-amber-400">· {item.spiciness}</span>}
                      {item.variant && <span className="text-neutral-300">· {item.variant}</span>}
                    </div>
                    {item.notes && (
                      <p className="text-[10px] text-amber-500/90 italic truncate">Note: {item.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 bg-neutral-950 rounded-lg p-1 border border-neutral-800">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-5 h-5 rounded flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-mono font-bold text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-5 h-5 rounded flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pricing Summary */}
          <div className="space-y-1.5 text-xs text-neutral-400">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-mono text-white">{formatRupiah(subtotal)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span>Diskon:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={discountAmount || ''}
                  onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-20 bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5 text-right font-mono text-xs text-white"
                />
              </div>
            </div>

            <div className="flex justify-between">
              <span>Pajak Restoran PB1 (10%):</span>
              <span className="font-mono text-white">{formatRupiah(tax)}</span>
            </div>

            <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-neutral-800">
              <span>Total Tagihan:</span>
              <span className="font-mono text-amber-400 text-base">{formatRupiah(total)}</span>
            </div>
          </div>

          {/* Checkout Buttons */}
          <div className="space-y-2 pt-2">
            <button
              disabled={cart.length === 0}
              onClick={handleCheckoutNow}
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <span>Bayar Sekarang ({formatRupiah(total)})</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              disabled={cart.length === 0}
              onClick={handleSendToKitchenFirst}
              className="w-full py-2.5 px-4 rounded-xl border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-xs font-semibold text-neutral-300 transition-colors flex items-center justify-center gap-2"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Kirim ke Dapur Dulu (Bayar Nanti)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Item Customization Modal */}
      {customizingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl text-neutral-100 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs text-amber-400 font-semibold">{customizingItem.category}</span>
                <h3 className="font-bold text-white text-base">{customizingItem.name}</h3>
                <p className="text-xs text-neutral-400">{formatRupiah(customizingItem.price)}</p>
              </div>
              <button
                onClick={() => setCustomizingItem(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Spiciness Level */}
            {customizingItem.spicinessLevels && customizingItem.spicinessLevels.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-2 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-red-400" />
                  <span>Tingkat Kepedasan:</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {customizingItem.spicinessLevels.map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSelectedSpiciness(lvl)}
                      className={`p-2 rounded-xl text-xs font-semibold border transition-all text-left ${
                        selectedSpiciness === lvl
                          ? 'bg-red-500/20 border-red-500 text-red-300'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Variants */}
            {customizingItem.variants && customizingItem.variants.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-2">
                  Pilihan Varian / Tambahan:
                </label>
                <div className="space-y-1.5">
                  {customizingItem.variants.map((v) => (
                    <button
                      key={v.name}
                      type="button"
                      onClick={() => setSelectedVariant(v.name)}
                      className={`w-full p-2.5 rounded-xl text-xs font-semibold border transition-all flex justify-between items-center ${
                        selectedVariant === v.name
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span>{v.name}</span>
                      <span>+{formatRupiah(v.extraPrice)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Notes */}
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                Catatan Khusus (Misal: Jangan pakai bawang):
              </label>
              <input
                type="text"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Contoh: Kuah dipisah, tidak pakai daun bawang"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setCustomizingItem(null)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmCustomization}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold"
              >
                Tambahkan ke Keranjang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Processing Modal */}
      {activePaymentOrder && (
        <PaymentModal
          order={activePaymentOrder}
          onClose={() => setActivePaymentOrder(null)}
          onPaymentSuccess={(paidOrder) => {
            setActivePaymentOrder(null);
            setPrintedReceiptOrder(paidOrder);
          }}
        />
      )}

      {/* Printable Receipt Modal */}
      {printedReceiptOrder && (
        <ReceiptModal
          order={printedReceiptOrder}
          onClose={() => setPrintedReceiptOrder(null)}
        />
      )}

      {/* History of Today's Orders Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-3xl p-6 shadow-2xl text-neutral-100 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
              <div>
                <h3 className="font-bold text-white text-base">Riwayat Transaksi Hari Ini</h3>
                <p className="text-xs text-neutral-400">Total {orders.length} pesanan terdaftar di sistem</p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-neutral-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto my-4 space-y-2.5">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{ord.orderNumber}</span>
                      <span className="text-xs text-neutral-400">({ord.tableNumber})</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          ord.paymentStatus === 'LUNAS'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {ord.paymentStatus}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400">
                      {ord.customerName} · {ord.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-mono text-sm font-bold text-amber-400">
                        {formatRupiah(ord.total)}
                      </p>
                      <p className="text-[10px] text-neutral-500">{ord.paymentMethod || 'Belum Dibayar'}</p>
                    </div>

                    {ord.paymentStatus === 'PENDING' && (
                      <button
                        onClick={() => {
                          setShowHistoryModal(false);
                          setActivePaymentOrder(ord);
                        }}
                        className="py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold"
                      >
                        Bayar
                      </button>
                    )}

                    <button
                      onClick={() => setPrintedReceiptOrder(ord)}
                      className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                      title="Cetak Ulang Struk"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="py-2 px-5 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
