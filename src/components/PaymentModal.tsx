import React, { useState, useEffect } from 'react';
import { Order, PaymentMethod } from '../types/pos';
import { formatRupiah } from '../utils/format';
import { usePOS } from '../context/POSContext';
import { 
  X, 
  Banknote, 
  QrCode, 
  Smartphone, 
  Building2, 
  CheckCircle2, 
  Loader2, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { playCashierBeep } from '../utils/audio';

interface PaymentModalProps {
  order: Order | null;
  onClose: () => void;
  onPaymentSuccess: (paidOrder: Order) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ order, onClose, onPaymentSuccess }) => {
  const { processPayment, simulateQrisPayment, soundEnabled } = usePOS();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('TUNAI');
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrisData, setQrisData] = useState<{ qrDataUrl: string; transactionId: string } | null>(null);
  const [qrisLoading, setQrisLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (order) {
      setCashGiven(order.total);
    }
  }, [order]);

  // If QRIS selected, generate dynamic QR code
  useEffect(() => {
    if (selectedMethod === 'QRIS' && order && !qrisData) {
      generateDynamicQris();
    }
  }, [selectedMethod, order]);

  if (!order) return null;

  const total = order.total;
  const change = Math.max(0, cashGiven - total);
  const isCashSufficient = cashGiven >= total;

  async function generateDynamicQris() {
    if (!order) return;
    setQrisLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/payment/generate-qris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: order.total,
          orderId: order.id,
          orderNumber: order.orderNumber
        })
      });
      const data = await res.json();
      if (data.success) {
        setQrisData({
          qrDataUrl: data.qrDataUrl,
          transactionId: data.transactionId
        });
      } else {
        setErrorMsg('Gagal membuat kode QRIS');
      }
    } catch (e) {
      setErrorMsg('Koneksi ke gateway pembayaran gagal');
    } finally {
      setQrisLoading(false);
    }
  }

  const handleCashPayment = async () => {
    if (!isCashSufficient) {
      setErrorMsg('Uang yang diterima kurang dari total tagihan!');
      return;
    }
    setIsProcessing(true);
    if (soundEnabled) playCashierBeep();

    const success = await processPayment(order.id, 'TUNAI', cashGiven, change);
    setIsProcessing(false);
    if (success) {
      onPaymentSuccess({
        ...order,
        paymentStatus: 'LUNAS',
        paymentMethod: 'TUNAI',
        cashPaid: cashGiven,
        cashChange: change
      });
    } else {
      setErrorMsg('Gagal memproses pembayaran');
    }
  };

  const handleSimulateDigitalCallback = async (method: PaymentMethod) => {
    setIsProcessing(true);
    if (soundEnabled) playCashierBeep();

    try {
      const res = await fetch('/api/payment/simulate-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, paymentMethod: method })
      });
      const data = await res.json();
      if (data.success) {
        onPaymentSuccess(data.data);
      } else {
        setErrorMsg('Gagal menerima konfirmasi callback');
      }
    } catch (e) {
      setErrorMsg('Kesalahan saat verifikasi gateway');
    } finally {
      setIsProcessing(false);
    }
  };

  const quickAmounts = [
    { label: 'Uang Pas', value: total },
    { label: 'Rp 50.000', value: 50000 },
    { label: 'Rp 100.000', value: 100000 },
    { label: 'Rp 200.000', value: 200000 }
  ].filter(q => q.value >= total || q.label === 'Uang Pas');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl text-neutral-100 flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div>
            <span className="text-xs font-semibold text-amber-400">Kasir · Proses Pembayaran</span>
            <h3 className="font-bold text-white text-lg">
              {order.orderNumber} ({order.tableNumber})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount to pay banner */}
        <div className="my-4 p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-400">Total Tagihan (Termasuk Pajak)</p>
            <p className="text-2xl font-extrabold text-amber-400 font-mono tracking-tight">
              {formatRupiah(total)}
            </p>
          </div>
          <div className="text-right text-xs text-neutral-400">
            <p className="font-semibold text-white">{order.customerName}</p>
            <p>{order.items.reduce((s, i) => s + i.quantity, 0)} item pesanan</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Payment Method Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-neutral-950 rounded-xl mb-4 border border-neutral-800">
          <button
            onClick={() => setSelectedMethod('TUNAI')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              selectedMethod === 'TUNAI'
                ? 'bg-amber-500 text-neutral-950 shadow-md font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Banknote className="w-4 h-4" />
            <span>Tunai (Cash)</span>
          </button>
          <button
            onClick={() => setSelectedMethod('QRIS')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              selectedMethod === 'QRIS'
                ? 'bg-amber-500 text-neutral-950 shadow-md font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>QRIS Dinamis</span>
          </button>
          <button
            onClick={() => setSelectedMethod('GOPAY')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              ['GOPAY', 'OVO', 'DANA', 'SHOPEEPAY', 'TRANSFER_BCA'].includes(selectedMethod)
                ? 'bg-amber-500 text-neutral-950 shadow-md font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>E-Wallet / VA</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {selectedMethod === 'TUNAI' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Nominal Uang Diterima (Rp):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 font-mono text-sm">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={cashGiven || ''}
                    onChange={(e) => setCashGiven(Number(e.target.value) || 0)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl py-2.5 pl-10 pr-4 text-white font-mono text-lg font-bold focus:border-amber-500 focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Quick cash denomination chips */}
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCashGiven(q.value)}
                    className="py-1.5 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 border border-neutral-700 transition-colors"
                  >
                    {q.label}
                  </button>
                ))}
              </div>

              {/* Change calculation */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex justify-between items-center">
                <div>
                  <span className="text-xs text-neutral-400 block">Kembalian:</span>
                  <span className={`text-xl font-mono font-bold ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isCashSufficient ? formatRupiah(change) : 'Uang Kurang!'}
                  </span>
                </div>
                {isCashSufficient && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-800/40">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Siap Cetak Struk</span>
                  </div>
                )}
              </div>

              <button
                disabled={!isCashSufficient || isProcessing}
                onClick={handleCashPayment}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan Pembayaran...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Terima Tunai & Selesaikan Transaksi</span>
                  </>
                )}
              </button>
            </div>
          )}

          {selectedMethod === 'QRIS' && (
            <div className="space-y-4 text-center">
              {qrisLoading ? (
                <div className="p-8 flex flex-col items-center justify-center text-neutral-400 space-y-2">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                  <p className="text-xs">Menghubungkan ke API QRIS Nasional...</p>
                </div>
              ) : qrisData ? (
                <div className="space-y-3">
                  <div className="p-4 bg-white rounded-2xl inline-block shadow-lg mx-auto border-4 border-amber-400">
                    <img
                      src={qrisData.qrDataUrl}
                      alt="QRIS Code"
                      className="w-52 h-52 object-contain mx-auto"
                    />
                    <div className="pt-2 text-neutral-900 border-t border-neutral-200 mt-2">
                      <p className="font-extrabold text-xs tracking-wider">QRIS STANDAR PEMBAYARAN NASIONAL</p>
                      <p className="text-[10px] text-neutral-600">NMID: ID1020023884910 · Kedai Rasa Nusantara</p>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-400">
                    Scan via BCA, Mandiri, BRI, GoPay, OVO, Dana, ShopeePay, atau aplikasi perbankan lainnya.
                  </p>

                  <div className="pt-2">
                    <button
                      disabled={isProcessing}
                      onClick={() => handleSimulateDigitalCallback('QRIS')}
                      className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Memverifikasi Webhook Gateway...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Simulasi Notifikasi Pembayaran Berhasil (Webhook)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={generateDynamicQris}
                  className="py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs font-semibold text-neutral-200"
                >
                  Generate Ulang Kode QRIS
                </button>
              )}
            </div>
          )}

          {['GOPAY', 'OVO', 'DANA', 'SHOPEEPAY', 'TRANSFER_BCA'].includes(selectedMethod) && (
            <div className="space-y-4">
              <label className="block text-xs font-medium text-neutral-300">
                Pilih Kanal Digital Payment:
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'GOPAY', name: 'GoPay', type: 'E-Wallet', color: 'hover:border-sky-500' },
                  { id: 'OVO', name: 'OVO', type: 'E-Wallet', color: 'hover:border-purple-500' },
                  { id: 'DANA', name: 'DANA', type: 'E-Wallet', color: 'hover:border-blue-500' },
                  { id: 'SHOPEEPAY', name: 'ShopeePay', type: 'E-Wallet', color: 'hover:border-orange-500' },
                  { id: 'TRANSFER_BCA', name: 'BCA Virtual Account', type: 'Bank VA', color: 'hover:border-blue-600' },
                  { id: 'KARTU_DEBIT', name: 'Kartu Debit / EDC', type: 'EDC', color: 'hover:border-emerald-500' }
                ].map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => setSelectedMethod(channel.id as PaymentMethod)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedMethod === channel.id
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-neutral-800 bg-neutral-950/60 ' + channel.color
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-xs text-white">{channel.name}</span>
                      <span className="text-[10px] text-neutral-400">{channel.type}</span>
                    </div>
                    <span className="text-[11px] text-neutral-400 font-mono">
                      Nominal: {formatRupiah(total)}
                    </span>
                  </button>
                ))}
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs space-y-1">
                <div className="flex justify-between text-neutral-400">
                  <span>Channel Terpilih:</span>
                  <span className="font-semibold text-white">{selectedMethod}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Status Integrasi:</span>
                  <span className="text-emerald-400 font-semibold">API Gateway Connected (Live)</span>
                </div>
              </div>

              <button
                disabled={isProcessing}
                onClick={() => handleSimulateDigitalCallback(selectedMethod)}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menunggu Respon Gateway...</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    <span>Konfirmasi Pembayaran {selectedMethod}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
