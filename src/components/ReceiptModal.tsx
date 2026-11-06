import React from 'react';
import { Order } from '../types/pos';
import { formatRupiah, formatTanggalIndo, formatWaktu } from '../utils/format';
import { Printer, X } from 'lucide-react';

interface ReceiptModalProps {
  order: Order | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl text-neutral-100 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">Struk Pembayaran</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable thermal receipt view */}
        <div className="flex-1 overflow-y-auto my-4 p-4 bg-white text-neutral-900 rounded-xl shadow-inner font-mono text-xs">
          <div id="printable-receipt" className="space-y-3">
            <div className="text-center border-b border-dashed border-neutral-400 pb-3">
              <h2 className="font-bold text-base tracking-wider">KEDAI RASA NUSANTARA</h2>
              <p className="text-[11px] text-neutral-600">Jl. Sabang No. 45, Jakarta Pusat</p>
              <p className="text-[10px] text-neutral-500">Telp/WA: 0812-8899-0000</p>
            </div>

            <div className="space-y-1 text-[11px] border-b border-dashed border-neutral-300 pb-2">
              <div className="flex justify-between">
                <span>No. Struk:</span>
                <span className="font-bold">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Tanggal:</span>
                <span>{formatTanggalIndo(order.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span>{formatWaktu(order.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tipe / Meja:</span>
                <span>{order.orderType === 'DINE_IN' ? order.tableNumber : 'Takeaway'}</span>
              </div>
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span>{order.customerName}</span>
              </div>
              {order.customerPhone && (
                <div className="flex justify-between">
                  <span>No. HP:</span>
                  <span>{order.customerPhone}</span>
                </div>
              )}
            </div>

            {/* Items list */}
            <div className="space-y-2 border-b border-dashed border-neutral-300 pb-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between font-semibold">
                    <span className="truncate pr-2">{item.name}</span>
                    <span>{formatRupiah(item.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-500 text-[10px]">
                    <span>
                      {item.quantity}x @ {formatRupiah(item.price)}
                      {item.spiciness ? ` · ${item.spiciness}` : ''}
                      {item.variant ? ` · ${item.variant}` : ''}
                    </span>
                  </div>
                  {item.notes && (
                    <p className="text-[10px] text-amber-700 italic">Catatan: {item.notes}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Total calculation */}
            <div className="space-y-1 text-[11px] border-b border-dashed border-neutral-400 pb-3">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal:</span>
                <span>{formatRupiah(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Diskon:</span>
                  <span>-{formatRupiah(order.discount)}</span>
                </div>
              )}
              {order.tax > 0 && (
                <div className="flex justify-between text-neutral-600">
                  <span>PB1 (10%):</span>
                  <span>{formatRupiah(order.tax)}</span>
                </div>
              )}
              {order.serviceFee > 0 && (
                <div className="flex justify-between text-neutral-600">
                  <span>Service:</span>
                  <span>{formatRupiah(order.serviceFee)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-neutral-300">
                <span>TOTAL AKHIR:</span>
                <span>{formatRupiah(order.total)}</span>
              </div>
              <div className="flex justify-between text-neutral-600 pt-1">
                <span>Metode Bayar:</span>
                <span className="font-semibold">{order.paymentMethod || 'TUNAI'}</span>
              </div>
              {order.paymentMethod === 'TUNAI' && order.cashPaid && (
                <>
                  <div className="flex justify-between text-neutral-600">
                    <span>Tunai Diterima:</span>
                    <span>{formatRupiah(order.cashPaid)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-emerald-700">
                    <span>Kembalian:</span>
                    <span>{formatRupiah(order.cashChange || 0)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="text-center text-[10px] text-neutral-500 pt-2 space-y-1">
              <p className="font-semibold text-neutral-700">Terima kasih atas kunjungan Anda!</p>
              <p>Password Wifi: nusantaraenak2026</p>
              <p>Follow IG: @kedairasanusantara</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition-colors"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-colors shadow-lg shadow-amber-500/20"
          >
            <Printer className="w-4 h-4" />
            Cetak Struk Thermal
          </button>
        </div>
      </div>
    </div>
  );
};
