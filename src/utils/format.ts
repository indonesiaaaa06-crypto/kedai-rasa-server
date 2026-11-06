export function formatRupiah(amount: number): string {
  return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
}

export function formatWaktu(isoString?: string): string {
  if (!isoString) return '-';
  const d = new Date(isoString);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export function formatTanggalIndo(isoString?: string): string {
  if (!isoString) return '-';
  const d = new Date(isoString);
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export function getElapsedTimeMinutes(isoString?: string): number {
  if (!isoString) return 0;
  const start = new Date(isoString).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - start) / 60000));
}

export function generateWhatsAppMessage(
  customerName: string,
  orderNumber: string,
  tableNumber: string,
  orderType: string
): string {
  const typeText = orderType === 'DINE_IN' ? `Meja ${tableNumber}` : 'Bawa Pulang (Takeaway)';
  return `Halo Kak ${customerName}! 🍽️

Kabar gembira! Pesanan Anda di *Kedai Rasa Nusantara*:
🧾 *No. Pesanan:* ${orderNumber}
📍 *Tipe:* ${typeText}

Saat ini *SUDAH SIAP DIAMBIL* di konter kasir. Silakan menunjukkan nomor pesanan ini kepada kru kami.

Terima kasih atas kunjungannya, selamat menikmati hidangan hangat Nusantara! 🙏`;
}
