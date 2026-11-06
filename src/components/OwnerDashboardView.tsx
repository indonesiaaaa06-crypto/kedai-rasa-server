import React, { useState, useEffect, useMemo } from 'react';
import { usePOS } from '../context/POSContext';
import { MenuItem, RawIngredient } from '../types/pos';
import { formatRupiah, formatTanggalIndo } from '../utils/format';
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingBag, 
  Receipt, 
  Package, 
  BarChart3, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  Printer, 
  Flame, 
  Clock, 
  Layers, 
  ArrowUpRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export const OwnerDashboardView: React.FC = () => {
  const { 
    menuItems, 
    orders, 
    rawIngredients, 
    activeShift, 
    addNewMenu, 
    updateMenu, 
    deleteMenu, 
    toggleMenuStock, 
    updateIngredientStock,
    closeCashShift 
  } = usePOS();

  const [activeTab, setActiveTab] = useState<'FINANCE' | 'BEST_SELLERS' | 'INVENTORY' | 'MENU_MGMT'>('FINANCE');

  // New Menu Form state
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<'Makanan Utama' | 'Minuman' | 'Camilan' | 'Paket Hemat'>('Makanan Utama');
  const [formPrice, setFormPrice] = useState<number>(25000);
  const [formCostPrice, setFormCostPrice] = useState<number>(12000);
  const [formDesc, setFormDesc] = useState('');
  const [formPrepTime, setFormPrepTime] = useState<number>(10);
  const [formImage, setFormImage] = useState('/src/assets/images/nasi_goreng_spesial_1793383141568.jpg');
  const [selectedIngredients, setSelectedIngredients] = useState<Array<{ ingredientId: string; amount: number; unit: string }>>([
    { ingredientId: 'ing-1', amount: 0.2, unit: 'kg' }
  ]);

  // Restock Modal state
  const [restockingItem, setRestockingItem] = useState<RawIngredient | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(10);

  // Closing Shift Modal state
  const [showClosingModal, setShowClosingModal] = useState(false);
  const [closingActualCash, setClosingActualCash] = useState<number>(0);
  const [closingNotes, setClosingNotes] = useState('');

  // Financial Calculations
  const paidOrders = useMemo(() => orders.filter(o => o.paymentStatus === 'LUNAS'), [orders]);
  const grossRevenue = useMemo(() => paidOrders.reduce((sum, o) => sum + o.total, 0), [paidOrders]);
  const totalCost = useMemo(() => paidOrders.reduce((sum, o) => sum + o.totalCost, 0), [paidOrders]);
  const netProfit = grossRevenue - totalCost;
  const totalTransactions = paidOrders.length;
  const averageOrderValue = totalTransactions > 0 ? Math.round(grossRevenue / totalTransactions) : 0;
  const profitMarginPercent = grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 100) : 0;

  // Payment Breakdown
  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const o of paidOrders) {
      const m = o.paymentMethod || 'TUNAI';
      map[m] = (map[m] || 0) + o.total;
    }
    return map;
  }, [paidOrders]);

  // Best Sellers Calculation
  const bestSellers = useMemo(() => {
    const map: Record<string, { id: string; name: string; category: string; quantity: number; revenue: number; profit: number }> = {};
    for (const o of paidOrders) {
      for (const item of o.items) {
        if (!map[item.menuId]) {
          const menuItem = menuItems.find(m => m.id === item.menuId);
          map[item.menuId] = {
            id: item.menuId,
            name: item.name,
            category: menuItem?.category || 'Makanan',
            quantity: 0,
            revenue: 0,
            profit: 0
          };
        }
        map[item.menuId].quantity += item.quantity;
        map[item.menuId].revenue += item.subtotal;
        map[item.menuId].profit += (item.price - item.costPrice) * item.quantity;
      }
    }
    return Object.values(map).sort((a, b) => b.quantity - a.quantity);
  }, [paidOrders, menuItems]);

  // Hourly Sales Trend
  const hourlySales = useMemo(() => {
    const hours = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
    const map: Record<string, number> = {};
    hours.forEach(h => map[h] = 0);
    for (const o of paidOrders) {
      const hour = new Date(o.createdAt).getHours();
      const rounded = `${Math.floor(hour / 2) * 2}:00`.padStart(5, '0');
      if (map[rounded] !== undefined) map[rounded] += o.total;
      else map['12:00'] += o.total;
    }
    return hours.map(h => ({ hour: h, total: map[h] || 0 }));
  }, [paidOrders]);

  // Handle Save Menu
  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMenuItem) {
      await updateMenu(editingMenuItem.id, {
        name: formName,
        category: formCategory,
        price: formPrice,
        costPrice: formCostPrice,
        description: formDesc,
        prepTimeMinutes: formPrepTime,
        image: formImage,
        ingredients: selectedIngredients
      });
      setEditingMenuItem(null);
    } else {
      await addNewMenu({
        name: formName,
        category: formCategory,
        price: formPrice,
        costPrice: formCostPrice,
        description: formDesc,
        prepTimeMinutes: formPrepTime,
        image: formImage,
        ingredients: selectedIngredients,
        isAvailable: true
      });
    }
    setShowAddMenuModal(false);
    resetForm();
  };

  const openEditMenu = (item: MenuItem) => {
    setEditingMenuItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormPrice(item.price);
    setFormCostPrice(item.costPrice);
    setFormDesc(item.description);
    setFormPrepTime(item.prepTimeMinutes);
    setFormImage(item.image);
    setSelectedIngredients(item.ingredients || []);
    setShowAddMenuModal(true);
  };

  const resetForm = () => {
    setEditingMenuItem(null);
    setFormName('');
    setFormPrice(25000);
    setFormCostPrice(12000);
    setFormDesc('');
    setFormPrepTime(10);
    setFormImage('/src/assets/images/nasi_goreng_spesial_1793383141568.jpg');
    setSelectedIngredients([{ ingredientId: 'ing-1', amount: 0.2, unit: 'kg' }]);
  };

  const handleRestockSubmit = async () => {
    if (!restockingItem) return;
    const newStock = restockingItem.stock + restockAmount;
    await updateIngredientStock(restockingItem.id, newStock);
    setRestockingItem(null);
  };

  const handleClosingSubmit = async () => {
    await closeCashShift(closingActualCash, closingNotes);
    setShowClosingModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-950 border border-neutral-800 rounded-2xl p-4">
        <div>
          <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
            Portal Manajemen Pemilik Kedai
          </span>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Dashboard Eksekutif & Laporan Harian
          </h1>
          <p className="text-xs text-neutral-400">
            Pemantauan omzet real-time, analitik menu terlaris, perkiraan stok bahan baku, dan update menu
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 py-2 px-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 border border-neutral-700 transition-colors"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Cetak Rekap Keuangan</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-neutral-800 scrollbar-none">
        <button
          onClick={() => setActiveTab('FINANCE')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'FINANCE'
              ? 'bg-amber-500 text-neutral-950 font-bold shadow-md'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Laporan Keuangan Harian</span>
        </button>

        <button
          onClick={() => setActiveTab('BEST_SELLERS')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'BEST_SELLERS'
              ? 'bg-amber-500 text-neutral-950 font-bold shadow-md'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Performa Menu Terlaris</span>
        </button>

        <button
          onClick={() => setActiveTab('INVENTORY')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'INVENTORY'
              ? 'bg-amber-500 text-neutral-950 font-bold shadow-md'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Optimasi Stok Bahan Baku</span>
        </button>

        <button
          onClick={() => setActiveTab('MENU_MGMT')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'MENU_MGMT'
              ? 'bg-amber-500 text-neutral-950 font-bold shadow-md'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Kelola Menu Realtime</span>
        </button>
      </div>

      {/* TAB 1: LAPORAN KEUANGAN HARIAN */}
      {activeTab === 'FINANCE' && (
        <div className="space-y-6">
          {/* Key KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
              <span className="text-xs text-neutral-400 font-medium">Omzet Kotor (Hari Ini)</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-white tracking-tight">
                  {formatRupiah(grossRevenue)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Realtime terverifikasi POS</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
              <span className="text-xs text-neutral-400 font-medium">Estimasi Laba Bersih</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-emerald-400 tracking-tight">
                  {formatRupiah(netProfit)}
                </span>
              </div>
              <div className="text-[11px] text-neutral-400">
                Margin Keuntungan: <span className="font-bold text-white">{profitMarginPercent}%</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
              <span className="text-xs text-neutral-400 font-medium">Total Transaksi Lunas</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-amber-400 tracking-tight">
                  {totalTransactions}
                </span>
                <span className="text-xs text-neutral-500 font-medium">struk</span>
              </div>
              <div className="text-[11px] text-neutral-400">
                Rata-rata Order: <span className="text-white font-mono">{formatRupiah(averageOrderValue)}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
              <span className="text-xs text-neutral-400 font-medium">Status Shift Kasir</span>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-bold text-white">
                  {activeShift?.cashierName || 'Kasir 1'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  activeShift?.isClosed ? 'bg-neutral-800 text-neutral-400' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                }`}>
                  {activeShift?.isClosed ? 'DITUTUP' : 'OPEN'}
                </span>
              </div>
              <button
                onClick={() => {
                  setClosingActualCash(activeShift?.expectedCash || 0);
                  setShowClosingModal(true);
                }}
                className="w-full mt-1 py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 text-[11px] font-semibold text-amber-300 rounded-lg transition-colors"
              >
                Tutup Kasir / Rekonsiliasi
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Payment Method Breakdown (5 cols) */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4">
              <h3 className="font-bold text-white text-sm">Metode Pembayaran (Share Omzet)</h3>
              <div className="space-y-3">
                {Object.entries(paymentBreakdown).map(([method, total]) => {
                  const pct = grossRevenue > 0 ? Math.round((total / grossRevenue) * 100) : 0;
                  return (
                    <div key={method} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-neutral-300">{method}</span>
                        <span className="font-mono text-white font-bold">{formatRupiah(total)} ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hourly Sales Trend (7 cols) */}
            <div className="lg:col-span-7 p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-white text-sm">Grafik Penjualan Per Jam</h3>
                <span className="text-[11px] text-neutral-400 font-mono">Hari Ini</span>
              </div>

              <div className="h-44 flex items-end justify-between gap-2 pt-4 px-2">
                {hourlySales.map((item) => {
                  const maxVal = Math.max(...hourlySales.map(h => h.total), 1);
                  const heightPercent = Math.min(100, Math.max(10, Math.round((item.total / maxVal) * 100)));
                  return (
                    <div key={item.hour} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                      <span className="text-[9px] font-mono text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {formatRupiah(item.total).replace('Rp ', '')}
                      </span>
                      <div
                        className="w-full bg-amber-500/80 group-hover:bg-amber-400 rounded-t transition-all"
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span className="text-[10px] font-mono text-neutral-400">{item.hour}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ANALITIK MENU TERLARIS */}
      {activeTab === 'BEST_SELLERS' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
            <h3 className="font-bold text-white text-sm mb-1">Peringkat Menu Terlaris & Margin Keuntungan</h3>
            <p className="text-xs text-neutral-400">
              Gunakan data ini untuk menentukan porsi produksi harian dan optimasi pembelian bahan baku.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-950">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-900/60 text-neutral-400 border-b border-neutral-800 font-semibold">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Nama Menu</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4 text-right">Terjual (Porsi)</th>
                  <th className="py-3 px-4 text-right">Total Omzet</th>
                  <th className="py-3 px-4 text-right">HPP Modal</th>
                  <th className="py-3 px-4 text-right">Estimasi Profit</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {bestSellers.map((item, idx) => {
                  const isTop3 = idx < 3;
                  return (
                    <tr key={item.id} className="hover:bg-neutral-900/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold">
                        <span className={`w-6 h-6 rounded-lg inline-flex items-center justify-center ${
                          idx === 0 ? 'bg-amber-500 text-neutral-950' : idx === 1 ? 'bg-neutral-300 text-neutral-950' : idx === 2 ? 'bg-amber-700 text-white' : 'text-neutral-400'
                        }`}>
                          #{idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        {item.name}
                      </td>
                      <td className="py-3 px-4 text-neutral-400">
                        {item.category}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-white">
                        {item.quantity} porsi
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-amber-400 font-bold">
                        {formatRupiah(item.revenue)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-neutral-400">
                        {formatRupiah(item.revenue - item.profit)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-400 font-bold">
                        +{formatRupiah(item.profit)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          isTop3 ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-neutral-900 text-neutral-400'
                        }`}>
                          {isTop3 ? '⭐ Best Seller' : 'Reguler'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: OPTIMASI STOK BAHAN BAKU */}
      {activeTab === 'INVENTORY' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-white text-sm">Monitoring & Optimasi Stok Bahan Baku</h3>
              <p className="text-xs text-neutral-400">
                Stok otomatis berkurang secara real-time saat pesanan dibuat di kasir / self-order.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Aman
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Menipis
              </span>
              <span className="flex items-center gap-1.5 text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500"></span> Kritis Restok
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rawIngredients.map((ing) => {
              const isCritical = ing.stock <= ing.minThreshold * 0.5;
              const isWarning = ing.stock <= ing.minThreshold && !isCritical;
              const statusColor = isCritical
                ? 'border-red-500/60 bg-red-950/20'
                : isWarning
                ? 'border-amber-500/60 bg-amber-950/20'
                : 'border-neutral-800 bg-neutral-950';

              return (
                <div
                  key={ing.id}
                  className={`p-4 rounded-2xl border transition-all ${statusColor} space-y-3`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-white">{ing.name}</h4>
                      <p className="text-[11px] text-neutral-400">Supplier: {ing.supplier}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      isCritical
                        ? 'bg-red-500 text-white'
                        : isWarning
                        ? 'bg-amber-500 text-neutral-950'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}>
                      {isCritical ? 'KRITIS' : isWarning ? 'MENIPIS' : 'AMAN'}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <span className="text-2xl font-extrabold font-mono text-white">
                        {ing.stock}
                      </span>
                      <span className="text-xs text-neutral-400 ml-1">{ing.unit}</span>
                    </div>
                    <span className="text-xs text-neutral-400 font-mono">
                      Batas Aman: {ing.minThreshold} {ing.unit}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, (ing.stock / (ing.minThreshold * 2.5)) * 100)}%` }}
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-neutral-800/80">
                    <span className="text-[11px] text-neutral-400">
                      Biaya: {formatRupiah(ing.costPerUnit)}/{ing.unit}
                    </span>
                    <button
                      onClick={() => {
                        setRestockingItem(ing);
                        setRestockAmount(10);
                      }}
                      className="py-1 px-3 bg-neutral-800 hover:bg-neutral-700 text-amber-400 text-xs font-semibold rounded-lg transition-colors"
                    >
                      + Tambah Stok
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: KELOLA MENU REALTIME */}
      {activeTab === 'MENU_MGMT' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
            <div>
              <h3 className="font-bold text-white text-sm">Kelola Menu & Sinkronisasi WebSocket Realtime</h3>
              <p className="text-xs text-neutral-400">
                Setiap penambahan atau perubahan status langsung terkirim ke Kasir dan KDS Dapur tanpa refresh.
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowAddMenuModal(true);
              }}
              className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Menu Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-neutral-800 bg-neutral-950 overflow-hidden flex flex-col justify-between"
              >
                <div className="relative aspect-16/9 bg-neutral-900 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => toggleMenuStock(item.id)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all ${
                        item.isAvailable
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-red-600 text-white'
                      }`}
                    >
                      {item.isAvailable ? 'Tersedia' : 'Habis'}
                    </button>
                  </div>
                  <span className="absolute bottom-2 left-2 text-[10px] bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-neutral-200">
                    {item.category}
                  </span>
                </div>

                <div className="p-4 space-y-2 flex-1">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-sm text-white line-clamp-1">{item.name}</h4>
                  </div>
                  <p className="text-xs text-neutral-400 line-clamp-2">{item.description}</p>
                  
                  <div className="flex items-center justify-between text-xs pt-1 font-mono">
                    <span className="font-bold text-amber-400">{formatRupiah(item.price)}</span>
                    <span className="text-neutral-500">HPP: {formatRupiah(item.costPrice)}</span>
                  </div>
                </div>

                <div className="p-3 bg-neutral-900/60 border-t border-neutral-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => openEditMenu(item)}
                    className="flex-1 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Yakin ingin menghapus menu "${item.name}"?`)) {
                        deleteMenu(item.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-800"
                    title="Hapus Menu"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Menu Modal */}
      {showAddMenuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-neutral-100 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
              <h3 className="font-bold text-white text-base">
                {editingMenuItem ? 'Edit Menu Kedai' : 'Tambah Menu Baru (Realtime WS)'}
              </h3>
              <button
                onClick={() => setShowAddMenuModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMenu} className="flex-1 overflow-y-auto space-y-3 py-3 text-xs">
              <div>
                <label className="block text-neutral-300 font-medium mb-1">Nama Menu:</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Misal: Rendang Daging Sapi Spesial"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Kategori:</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Makanan Utama">Makanan Utama</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Camilan">Camilan</option>
                    <option value="Paket Hemat">Paket Hemat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Waktu Masak (Menit):</label>
                  <input
                    type="number"
                    value={formPrepTime}
                    onChange={(e) => setFormPrepTime(Number(e.target.value) || 10)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Harga Jual (Rp):</label>
                  <input
                    type="number"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value) || 0)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5 text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">HPP Modal (Rp):</label>
                  <input
                    type="number"
                    required
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(Number(e.target.value) || 0)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Deskripsi Singkat:</label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Kelezatan rempah dan penyajian hidangan..."
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Pilih Foto Hidangan:</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Nasi Goreng', path: '/assets/images/nasi_goreng_spesial_1793383141568.jpg' },
                    { label: 'Ayam Bakar', path: '/assets/images/ayam_bakar_madu_1793383142731.jpg' },
                    { label: 'Soto Betawi', path: '/assets/images/soto_betawi_daging_1793383143126.jpg' },
                    { label: 'Kopi Susu', path: '/assets/images/kopi_susu_gula_aren_1793383143052.jpg' }
                  ].map((img) => (
                    <div
                      key={img.path}
                      onClick={() => setFormImage(img.path)}
                      className={`relative aspect-4/3 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                        formImage === img.path ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-neutral-800 opacity-60'
                      }`}
                    >
                      <img src={img.path} alt={img.label} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[9px] text-center text-white py-0.5">
                        {img.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddMenuModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold"
                >
                  {editingMenuItem ? 'Perbarui Menu' : 'Simpan & Siarkan Realtime'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {restockingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center space-y-3">
            <h3 className="font-bold text-white text-base">Restok {restockingItem.name}</h3>
            <p className="text-xs text-neutral-400">
              Stok saat ini: <span className="text-white font-mono font-bold">{restockingItem.stock} {restockingItem.unit}</span>
            </p>

            <div className="py-2">
              <label className="text-xs text-neutral-400 block mb-1">Jumlah Masuk ({restockingItem.unit}):</label>
              <input
                type="number"
                value={restockAmount}
                onChange={(e) => setRestockAmount(Number(e.target.value) || 0)}
                className="w-32 mx-auto text-center font-mono text-xl py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setRestockingItem(null)}
                className="flex-1 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleRestockSubmit}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                Simpan Stok Masuk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cash Register Shift Closing Modal */}
      {showClosingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
              <h3 className="font-bold text-white text-base">Tutup Kasir / Rekonsiliasi Shift</h3>
              <button onClick={() => setShowClosingModal(false)} className="text-neutral-400">✕</button>
            </div>

            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-400">
                <span>Kas Awal:</span>
                <span className="font-mono text-white">{formatRupiah(activeShift?.initialCash || 0)}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Penerimaan Tunai:</span>
                <span className="font-mono text-emerald-400 font-bold">+{formatRupiah(activeShift?.totalCashIn || 0)}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Pengeluaran Kas:</span>
                <span className="font-mono text-red-400">-{formatRupiah(activeShift?.totalCashOut || 0)}</span>
              </div>
              <div className="flex justify-between text-white font-bold pt-2 border-t border-neutral-800">
                <span>Ekspektasi Kas di Laci:</span>
                <span className="font-mono text-amber-400 text-sm">{formatRupiah(activeShift?.expectedCash || 0)}</span>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-neutral-300 font-medium block">Hitungan Uang Fisik Aktual (Rp):</label>
              <input
                type="number"
                value={closingActualCash}
                onChange={(e) => setClosingActualCash(Number(e.target.value) || 0)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5 text-white font-mono text-base font-bold"
              />
              <div className="flex justify-between text-[11px] pt-1">
                <span className="text-neutral-400">Selisih Kas:</span>
                <span className={`font-mono font-bold ${
                  closingActualCash - (activeShift?.expectedCash || 0) === 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {formatRupiah(closingActualCash - (activeShift?.expectedCash || 0))}
                </span>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-neutral-300 font-medium block">Catatan Penutupan:</label>
              <input
                type="text"
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                placeholder="Semua uang tunai telah disetor ke brankas..."
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2 text-white"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowClosingModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleClosingSubmit}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold"
              >
                Konfirmasi Tutup Kasir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
