export type Role = 'kasir' | 'dapur' | 'pemilik' | 'pelanggan';

export interface StaffUser {
  id: string;
  name: string;
  role: Role;
  pin: string;
  avatar: string;
}

export interface IngredientUsage {
  ingredientId: string;
  amount: number;
  unit: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: 'Makanan Utama' | 'Minuman' | 'Camilan' | 'Paket Hemat';
  price: number;
  costPrice: number; // HPP (Harga Pokok Penjualan)
  description: string;
  image: string;
  isAvailable: boolean;
  prepTimeMinutes: number;
  ingredients: IngredientUsage[];
  spicinessLevels?: string[];
  variants?: { name: string; extraPrice: number }[];
}

export interface RawIngredient {
  id: string;
  name: string;
  stock: number;
  unit: string;
  minThreshold: number;
  costPerUnit: number;
  supplier: string;
  lastRestocked: string;
}

export interface OrderItem {
  id: string;
  menuId: string;
  name: string;
  price: number;
  costPrice: number;
  quantity: number;
  notes?: string;
  variant?: string;
  spiciness?: string;
  subtotal: number;
}

export type OrderStatus = 'MENUNGGU' | 'DIMASAK' | 'SIAP_DIAMBIL' | 'SELESAI' | 'DIBATALKAN';
export type PaymentMethod = 'TUNAI' | 'QRIS' | 'GOPAY' | 'OVO' | 'DANA' | 'SHOPEEPAY' | 'TRANSFER_BCA' | 'KARTU_DEBIT';
export type PaymentStatus = 'PENDING' | 'LUNAS' | 'GAGAL';
export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';

export interface WANotificationLog {
  sentAt: string;
  phone: string;
  message: string;
  status: 'DELIVERED' | 'FAILED';
  waLink: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  tableNumber: string;
  customerName: string;
  customerPhone: string;
  orderType: OrderType;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  serviceFee: number;
  total: number;
  totalCost: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  cashPaid?: number;
  cashChange?: number;
  createdAt: string;
  updatedAt: string;
  kitchenStartedAt?: string;
  readyAt?: string;
  completedAt?: string;
  waNotificationSent?: boolean;
  waNotificationLog?: WANotificationLog;
}

export interface CashShift {
  id: string;
  cashierName: string;
  startTime: string;
  endTime?: string;
  initialCash: number;
  totalCashIn: number;
  totalCashOut: number;
  expectedCash: number;
  actualCash?: number;
  difference?: number;
  notes?: string;
  isClosed: boolean;
}

export interface WSMessage<T = any> {
  type: 
    | 'INIT_STATE'
    | 'MENU_ADD'
    | 'MENU_UPDATE'
    | 'MENU_DELETE'
    | 'MENU_STOCK_TOGGLE'
    | 'ORDER_CREATE'
    | 'ORDER_STATUS_UPDATE'
    | 'ORDER_PAYMENT'
    | 'INGREDIENT_UPDATE'
    | 'SHIFT_UPDATE'
    | 'HEARTBEAT';
  payload: T;
}
