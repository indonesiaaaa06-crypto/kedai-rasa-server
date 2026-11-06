import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import QRCode from 'qrcode';
import { createServer as createViteServer } from 'vite';
import { 
  MenuItem, 
  RawIngredient, 
  Order, 
  CashShift, 
  WSMessage, 
  OrderStatus, 
  PaymentMethod 
} from './src/types/pos';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(express.json());

// In-memory Authoritative Database
let menuItems: MenuItem[] = [
  {
    id: 'menu-1',
    name: 'Nasi Goreng Spesial Nusantara',
    category: 'Makanan Utama',
    price: 28000,
    costPrice: 13000,
    description: 'Nasi goreng harum bumbu rempah tradisional dengan telur mata sapi, sate ayam gurih, acar, dan kerupuk renyah.',
    image: '/src/assets/images/nasi_goreng_spesial_1793383141568.jpg',
    isAvailable: true,
    prepTimeMinutes: 10,
    spicinessLevels: ['Tidak Pedas', 'Sedang', 'Pedas Mantap', 'Super Pedas'],
    variants: [
      { name: 'Porsi Jumbo', extraPrice: 6000 },
      { name: 'Tambah Telur Dadar', extraPrice: 4000 }
    ],
    ingredients: [
      { ingredientId: 'ing-1', amount: 0.25, unit: 'kg' }, // Beras
      { ingredientId: 'ing-4', amount: 1, unit: 'butir' }, // Telur
      { ingredientId: 'ing-2', amount: 0.1, unit: 'kg' }, // Ayam
      { ingredientId: 'ing-6', amount: 0.03, unit: 'liter' }, // Minyak
      { ingredientId: 'ing-5', amount: 0.02, unit: 'kg' } // Cabai
    ]
  },
  {
    id: 'menu-2',
    name: 'Ayam Bakar Madu Sambal Terasi',
    category: 'Makanan Utama',
    price: 32000,
    costPrice: 16000,
    description: 'Ayam bakar legit berkaramel madu alami dengan aroma arang harum, lalapan segar melimpah, dan sambal terasi ulek dadakan.',
    image: '/src/assets/images/ayam_bakar_madu_1793383142731.jpg',
    isAvailable: true,
    prepTimeMinutes: 15,
    spicinessLevels: ['Sedang', 'Pedas Terasi Gurih', 'Ekstra Pedas'],
    variants: [
      { name: 'Tambah Nasi Putih Pulen', extraPrice: 5000 },
      { name: 'Tambah Tahu Tempe Goreng', extraPrice: 4000 }
    ],
    ingredients: [
      { ingredientId: 'ing-2', amount: 0.35, unit: 'kg' }, // Ayam
      { ingredientId: 'ing-5', amount: 0.03, unit: 'kg' }, // Cabai
      { ingredientId: 'ing-6', amount: 0.02, unit: 'liter' } // Minyak
    ]
  },
  {
    id: 'menu-3',
    name: 'Soto Betawi Daging Kuah Susu',
    category: 'Makanan Utama',
    price: 38000,
    costPrice: 19000,
    description: 'Potongan daging sapi empuk dalam kuah gurih santan campur susu murni aromatik, taburan emping melinjo renyah, kentang, dan tomat.',
    image: '/src/assets/images/soto_betawi_daging_1793383143126.jpg',
    isAvailable: true,
    prepTimeMinutes: 12,
    variants: [
      { name: 'Tambah Nasi Putih', extraPrice: 5000 },
      { name: 'Ekstra Daging Sapi', extraPrice: 12000 }
    ],
    ingredients: [
      { ingredientId: 'ing-3', amount: 0.2, unit: 'kg' }, // Daging Sapi
      { ingredientId: 'ing-8', amount: 0.15, unit: 'liter' }, // Susu
      { ingredientId: 'ing-1', amount: 0.2, unit: 'kg' } // Beras
    ]
  },
  {
    id: 'menu-4',
    name: 'Kopi Susu Gula Aren Asli',
    category: 'Minuman',
    price: 18000,
    costPrice: 7000,
    description: 'Espresso double shot biji kopi Arabika Nusantara dipadu susu segar murni dan sirup gula aren organik legit khas Jawa.',
    image: '/src/assets/images/kopi_susu_gula_aren_1793383143052.jpg',
    isAvailable: true,
    prepTimeMinutes: 5,
    variants: [
      { name: 'Less Sugar 50%', extraPrice: 0 },
      { name: 'Extra Shot Espresso', extraPrice: 4000 },
      { name: 'Ukuran Large', extraPrice: 4000 }
    ],
    ingredients: [
      { ingredientId: 'ing-7', amount: 0.02, unit: 'kg' }, // Kopi
      { ingredientId: 'ing-8', amount: 0.18, unit: 'liter' }, // Susu
      { ingredientId: 'ing-9', amount: 0.03, unit: 'kg' } // Gula Aren
    ]
  },
  {
    id: 'menu-5',
    name: 'Es Teh Manis Melati Solo',
    category: 'Minuman',
    price: 6000,
    costPrice: 18000 / 10,
    description: 'Seduhan daun teh melati pilihan wangi otentik disajikan dingin menyegarkan pelepas dahaga.',
    image: '/src/assets/images/nasi_goreng_spesial_1793383141568.jpg',
    isAvailable: true,
    prepTimeMinutes: 3,
    variants: [
      { name: 'Manis Pas', extraPrice: 0 },
      { name: 'Tawar (No Sugar)', extraPrice: 0 },
      { name: 'Jumbo Cup 22oz', extraPrice: 3000 }
    ],
    ingredients: [
      { ingredientId: 'ing-10', amount: 0.05, unit: 'pack' },
      { ingredientId: 'ing-9', amount: 0.02, unit: 'kg' }
    ]
  },
  {
    id: 'menu-6',
    name: 'Tempe Mendoan Banyumas (4 Pcs)',
    category: 'Camilan',
    price: 15000,
    costPrice: 6000,
    description: 'Tempe berbalut adonan tepung daun bawang renyah lembut khas Banyumas dengan cocolan sambal kecap rawit pedas.',
    image: '/src/assets/images/ayam_bakar_madu_1793383142731.jpg',
    isAvailable: true,
    prepTimeMinutes: 8,
    ingredients: [
      { ingredientId: 'ing-6', amount: 0.05, unit: 'liter' },
      { ingredientId: 'ing-5', amount: 0.02, unit: 'kg' }
    ]
  },
  {
    id: 'menu-7',
    name: 'Sate Ayam Madura Bumbu Kacang',
    category: 'Makanan Utama',
    price: 26000,
    costPrice: 13000,
    description: '10 tusuk sate ayam daging tebal dipanggang kecokelatan dengan siraman bumbu kacang gurih legit dan taburan bawang merah.',
    image: '/src/assets/images/ayam_bakar_madu_1793383142731.jpg',
    isAvailable: true,
    prepTimeMinutes: 12,
    variants: [
      { name: 'Tambah Lontong Daun', extraPrice: 4000 }
    ],
    ingredients: [
      { ingredientId: 'ing-2', amount: 0.3, unit: 'kg' },
      { ingredientId: 'ing-5', amount: 0.02, unit: 'kg' }
    ]
  },
  {
    id: 'menu-8',
    name: 'Paket Hemat Kenyang Berdua',
    category: 'Paket Hemat',
    price: 59000,
    costPrice: 28000,
    description: 'Paket hemat: 2 Nasi Goreng Spesial + 2 Es Teh Manis Melati + 1 Porsi Tempe Mendoan.',
    image: '/src/assets/images/nasi_goreng_spesial_1793383141568.jpg',
    isAvailable: true,
    prepTimeMinutes: 15,
    ingredients: [
      { ingredientId: 'ing-1', amount: 0.5, unit: 'kg' },
      { ingredientId: 'ing-4', amount: 2, unit: 'butir' },
      { ingredientId: 'ing-2', amount: 0.2, unit: 'kg' },
      { ingredientId: 'ing-10', amount: 0.1, unit: 'pack' }
    ]
  }
];

let rawIngredients: RawIngredient[] = [
  {
    id: 'ing-1',
    name: 'Beras Ramos Premium',
    stock: 42.5,
    unit: 'kg',
    minThreshold: 15,
    costPerUnit: 14000,
    supplier: 'UD Tani Makmur Beras',
    lastRestocked: '2026-10-29'
  },
  {
    id: 'ing-2',
    name: 'Daging Ayam Fillet Segar',
    stock: 19.8,
    unit: 'kg',
    minThreshold: 8,
    costPerUnit: 38000,
    supplier: 'RPH Unggas Berkah',
    lastRestocked: '2026-10-30'
  },
  {
    id: 'ing-3',
    name: 'Daging Sapi Sandung Lamur',
    stock: 11.2,
    unit: 'kg',
    minThreshold: 5,
    costPerUnit: 125000,
    supplier: 'Meat Supplier Jaya',
    lastRestocked: '2026-10-28'
  },
  {
    id: 'ing-4',
    name: 'Telur Ayam Negeri',
    stock: 145,
    unit: 'butir',
    minThreshold: 50,
    costPerUnit: 2000,
    supplier: 'Peternakan Sumber Telur',
    lastRestocked: '2026-10-30'
  },
  {
    id: 'ing-5',
    name: 'Cabai Rawit Merah Segar',
    stock: 5.4,
    unit: 'kg',
    minThreshold: 3,
    costPerUnit: 65000,
    supplier: 'Pasar Induk Kramat Jati',
    lastRestocked: '2026-10-30'
  },
  {
    id: 'ing-6',
    name: 'Minyak Goreng Sawit',
    stock: 28.5,
    unit: 'liter',
    minThreshold: 10,
    costPerUnit: 17500,
    supplier: 'Agen Sembako Makmur',
    lastRestocked: '2026-10-27'
  },
  {
    id: 'ing-7',
    name: 'Biji Kopi Arabika House Blend',
    stock: 8.5,
    unit: 'kg',
    minThreshold: 4,
    costPerUnit: 180000,
    supplier: 'Roastery Kopi Nusantara',
    lastRestocked: '2026-10-25'
  },
  {
    id: 'ing-8',
    name: 'Susu Segar Murni Full Cream',
    stock: 21.0,
    unit: 'liter',
    minThreshold: 10,
    costPerUnit: 18000,
    supplier: 'Koperasi Susu Mandiri',
    lastRestocked: '2026-10-30'
  },
  {
    id: 'ing-9',
    name: 'Gula Aren Organik Asli',
    stock: 12.0,
    unit: 'kg',
    minThreshold: 5,
    costPerUnit: 26000,
    supplier: 'Petani Aren Banten',
    lastRestocked: '2026-10-26'
  },
  {
    id: 'ing-10',
    name: 'Daun Teh Melati Tubruk',
    stock: 16.0,
    unit: 'pack',
    minThreshold: 6,
    costPerUnit: 8000,
    supplier: 'Perkebunan Teh Wangi',
    lastRestocked: '2026-10-28'
  }
];

let activeShift: CashShift = {
  id: 'shift-today',
  cashierName: 'Budi Santoso',
  startTime: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  initialCash: 300000,
  totalCashIn: 0,
  totalCashOut: 0,
  expectedCash: 300000,
  isClosed: false
};

// Seed realistic orders for today
let orders: Order[] = [
  {
    id: 'ord-101',
    orderNumber: '#ORD-101',
    tableNumber: 'Meja 03',
    customerName: 'Pak Dimas',
    customerPhone: '081288991234',
    orderType: 'DINE_IN',
    items: [
      {
        id: 'item-1',
        menuId: 'menu-1',
        name: 'Nasi Goreng Spesial Nusantara',
        price: 28000,
        costPrice: 13000,
        quantity: 2,
        spiciness: 'Sedang',
        subtotal: 56000
      },
      {
        id: 'item-2',
        menuId: 'menu-5',
        name: 'Es Teh Manis Melati Solo',
        price: 6000,
        costPrice: 1800,
        quantity: 2,
        subtotal: 12000
      }
    ],
    subtotal: 68000,
    discount: 0,
    tax: 6800,
    serviceFee: 0,
    total: 74800,
    totalCost: 29600,
    status: 'SELESAI',
    paymentStatus: 'LUNAS',
    paymentMethod: 'QRIS',
    createdAt: new Date(Date.now() - 3.5 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3.1 * 3600 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 3.1 * 3600 * 1000).toISOString()
  },
  {
    id: 'ord-102',
    orderNumber: '#ORD-102',
    tableNumber: 'Takeaway',
    customerName: 'Ibu Ratna',
    customerPhone: '081399887766',
    orderType: 'TAKEAWAY',
    items: [
      {
        id: 'item-3',
        menuId: 'menu-2',
        name: 'Ayam Bakar Madu Sambal Terasi',
        price: 32000,
        costPrice: 16000,
        quantity: 2,
        spiciness: 'Pedas Terasi Gurih',
        subtotal: 64000
      },
      {
        id: 'item-4',
        menuId: 'menu-4',
        name: 'Kopi Susu Gula Aren Asli',
        price: 18000,
        costPrice: 7000,
        quantity: 1,
        subtotal: 18000
      }
    ],
    subtotal: 82000,
    discount: 0,
    tax: 8200,
    serviceFee: 0,
    total: 90200,
    totalCost: 39000,
    status: 'SELESAI',
    paymentStatus: 'LUNAS',
    paymentMethod: 'TUNAI',
    cashPaid: 100000,
    cashChange: 9800,
    createdAt: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2.2 * 3600 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 2.2 * 3600 * 1000).toISOString()
  },
  {
    id: 'ord-103',
    orderNumber: '#ORD-103',
    tableNumber: 'Meja 07',
    customerName: 'Hendra & Maya',
    customerPhone: '087811223344',
    orderType: 'DINE_IN',
    items: [
      {
        id: 'item-5',
        menuId: 'menu-3',
        name: 'Soto Betawi Daging Kuah Susu',
        price: 38000,
        costPrice: 19000,
        quantity: 2,
        subtotal: 76000
      },
      {
        id: 'item-6',
        menuId: 'menu-6',
        name: 'Tempe Mendoan Banyumas (4 Pcs)',
        price: 15000,
        costPrice: 6000,
        quantity: 1,
        subtotal: 15000
      },
      {
        id: 'item-7',
        menuId: 'menu-4',
        name: 'Kopi Susu Gula Aren Asli',
        price: 18000,
        costPrice: 7000,
        quantity: 2,
        subtotal: 36000
      }
    ],
    subtotal: 127000,
    discount: 10000,
    tax: 11700,
    serviceFee: 0,
    total: 128700,
    totalCost: 58000,
    status: 'SELESAI',
    paymentStatus: 'LUNAS',
    paymentMethod: 'TRANSFER_BCA',
    createdAt: new Date(Date.now() - 1.2 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 0.9 * 3600 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 0.9 * 3600 * 1000).toISOString()
  },
  {
    id: 'ord-104',
    orderNumber: '#ORD-104',
    tableNumber: 'Meja 02',
    customerName: 'Mas Rizki',
    customerPhone: '085712349988',
    orderType: 'DINE_IN',
    items: [
      {
        id: 'item-8',
        menuId: 'menu-1',
        name: 'Nasi Goreng Spesial Nusantara',
        price: 28000,
        costPrice: 13000,
        quantity: 1,
        spiciness: 'Super Pedas',
        subtotal: 28000
      },
      {
        id: 'item-9',
        menuId: 'menu-4',
        name: 'Kopi Susu Gula Aren Asli',
        price: 18000,
        costPrice: 7000,
        quantity: 1,
        variant: 'Ukuran Large',
        subtotal: 22000
      }
    ],
    subtotal: 50000,
    discount: 0,
    tax: 5000,
    serviceFee: 0,
    total: 55000,
    totalCost: 20000,
    status: 'DIMASAK',
    paymentStatus: 'LUNAS',
    paymentMethod: 'QRIS',
    createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    kitchenStartedAt: new Date(Date.now() - 14 * 60 * 1000).toISOString()
  },
  {
    id: 'ord-105',
    orderNumber: '#ORD-105',
    tableNumber: 'Takeaway',
    customerName: 'Kak Siska',
    customerPhone: '081298765432',
    orderType: 'TAKEAWAY',
    items: [
      {
        id: 'item-10',
        menuId: 'menu-8',
        name: 'Paket Hemat Kenyang Berdua',
        price: 59000,
        costPrice: 28000,
        quantity: 1,
        subtotal: 59000
      }
    ],
    subtotal: 59000,
    discount: 0,
    tax: 5900,
    serviceFee: 0,
    total: 64900,
    totalCost: 28000,
    status: 'MENUNGGU',
    paymentStatus: 'PENDING',
    createdAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 60 * 1000).toISOString()
  }
];

// Recompute active shift cash
activeShift.totalCashIn = orders
  .filter(o => o.paymentMethod === 'TUNAI' && o.paymentStatus === 'LUNAS')
  .reduce((sum, o) => sum + o.total, 0);
activeShift.expectedCash = activeShift.initialCash + activeShift.totalCashIn - activeShift.totalCashOut;

// WebSocket Broadcast utility
function broadcast<T>(msg: WSMessage<T>, excludeWs?: WebSocket) {
  const data = JSON.stringify(msg);
  wss.clients.forEach(client => {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// Handle WebSocket connections
wss.on('connection', (ws: WebSocket) => {
  // Send initial full snapshot on connection
  const initMsg: WSMessage = {
    type: 'INIT_STATE',
    payload: {
      menuItems,
      orders,
      rawIngredients,
      activeShift,
      connectedClients: wss.clients.size
    }
  };
  ws.send(JSON.stringify(initMsg));

  ws.on('message', (rawData: string) => {
    try {
      const msg: WSMessage = JSON.parse(rawData.toString());
      handleClientWSMessage(msg, ws);
    } catch (err) {
      console.error('Failed to parse WS message:', err);
    }
  });

  ws.on('close', () => {
    // client disconnected
  });
});

function handleClientWSMessage(msg: WSMessage, ws: WebSocket) {
  switch (msg.type) {
    case 'ORDER_STATUS_UPDATE': {
      const { id, status } = msg.payload;
      const order = orders.find(o => o.id === id);
      if (order) {
        order.status = status;
        order.updatedAt = new Date().toISOString();
        if (status === 'DIMASAK' && !order.kitchenStartedAt) {
          order.kitchenStartedAt = new Date().toISOString();
        }
        if (status === 'SIAP_DIAMBIL') {
          order.readyAt = new Date().toISOString();
          // Generate automatic WhatsApp message log
          const phone = order.customerPhone.replace(/[^0-9]/g, '');
          const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
          const waMessageText = `Halo ${order.customerName}! 🍽️ Pesanan Anda ${order.orderNumber} (${order.orderType === 'DINE_IN' ? order.tableNumber : 'Takeaway'}) di Kedai Rasa Nusantara sudah SIAP DIAMBIL. Silakan ambil di konter/meja Anda. Selamat menikmati! 🙏`;
          const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessageText)}`;
          
          order.waNotificationSent = true;
          order.waNotificationLog = {
            sentAt: new Date().toISOString(),
            phone: cleanPhone,
            message: waMessageText,
            status: 'DELIVERED',
            waLink: waUrl
          };
        }
        if (status === 'SELESAI') {
          order.completedAt = new Date().toISOString();
        }
        broadcast({
          type: 'ORDER_STATUS_UPDATE',
          payload: order
        });
      }
      break;
    }
    case 'MENU_STOCK_TOGGLE': {
      const { id, isAvailable } = msg.payload;
      const item = menuItems.find(m => m.id === id);
      if (item) {
        item.isAvailable = isAvailable;
        broadcast({
          type: 'MENU_STOCK_TOGGLE',
          payload: { id, isAvailable }
        });
      }
      break;
    }
    case 'HEARTBEAT': {
      ws.send(JSON.stringify({ type: 'HEARTBEAT', payload: { time: Date.now() } }));
      break;
    }
    default:
      break;
  }
}

// Function to deduct raw ingredients when an order is created
function deductIngredientsForOrder(order: Order) {
  for (const item of order.items) {
    const menuItem = menuItems.find(m => m.id === item.menuId);
    if (!menuItem || !menuItem.ingredients) continue;

    for (const ing of menuItem.ingredients) {
      const raw = rawIngredients.find(r => r.id === ing.ingredientId);
      if (raw) {
        const requiredAmount = ing.amount * item.quantity;
        raw.stock = Math.max(0, Math.round((raw.stock - requiredAmount) * 100) / 100);
        broadcast({
          type: 'INGREDIENT_UPDATE',
          payload: raw
        });
      }
    }
  }
}

// REST API Endpoints
// Menu APIs
app.get('/api/menu', (req, res) => {
  res.json({ success: true, data: menuItems });
});

app.post('/api/menu', (req, res) => {
  const newMenu: MenuItem = {
    id: 'menu-' + Date.now(),
    name: req.body.name,
    category: req.body.category || 'Makanan Utama',
    price: Number(req.body.price) || 0,
    costPrice: Number(req.body.costPrice) || Math.round((Number(req.body.price) || 0) * 0.5),
    description: req.body.description || '',
    image: req.body.image || '/src/assets/images/nasi_goreng_spesial_1793383141568.jpg',
    isAvailable: req.body.isAvailable !== false,
    prepTimeMinutes: Number(req.body.prepTimeMinutes) || 10,
    ingredients: req.body.ingredients || [],
    spicinessLevels: req.body.spicinessLevels,
    variants: req.body.variants
  };

  menuItems.push(newMenu);
  broadcast({ type: 'MENU_ADD', payload: newMenu });
  res.status(201).json({ success: true, data: newMenu });
});

app.put('/api/menu/:id', (req, res) => {
  const index = menuItems.findIndex(m => m.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Menu item not found' });
  }
  menuItems[index] = {
    ...menuItems[index],
    ...req.body,
    id: req.params.id
  };
  broadcast({ type: 'MENU_UPDATE', payload: menuItems[index] });
  res.json({ success: true, data: menuItems[index] });
});

app.delete('/api/menu/:id', (req, res) => {
  const id = req.params.id;
  menuItems = menuItems.filter(m => m.id !== id);
  broadcast({ type: 'MENU_DELETE', payload: { id } });
  res.json({ success: true, data: { id } });
});

app.patch('/api/menu/:id/toggle-stock', (req, res) => {
  const item = menuItems.find(m => m.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Menu item not found' });
  }
  item.isAvailable = !item.isAvailable;
  broadcast({
    type: 'MENU_STOCK_TOGGLE',
    payload: { id: item.id, isAvailable: item.isAvailable }
  });
  res.json({ success: true, data: item });
});

// Orders APIs
app.get('/api/orders', (req, res) => {
  res.json({ success: true, data: orders });
});

app.post('/api/orders', (req, res) => {
  const orderCount = orders.length + 101;
  const newOrder: Order = {
    id: 'ord-' + Date.now(),
    orderNumber: `#ORD-${orderCount}`,
    tableNumber: req.body.tableNumber || 'Meja 01',
    customerName: req.body.customerName || 'Pelanggan',
    customerPhone: req.body.customerPhone || '',
    orderType: req.body.orderType || 'DINE_IN',
    items: req.body.items || [],
    subtotal: Number(req.body.subtotal) || 0,
    discount: Number(req.body.discount) || 0,
    tax: Number(req.body.tax) || 0,
    serviceFee: Number(req.body.serviceFee) || 0,
    total: Number(req.body.total) || 0,
    totalCost: Number(req.body.totalCost) || 0,
    status: 'MENUNGGU',
    paymentStatus: req.body.paymentStatus || 'PENDING',
    paymentMethod: req.body.paymentMethod,
    cashPaid: req.body.cashPaid,
    cashChange: req.body.cashChange,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  orders.unshift(newOrder);

  // If cash paid upfront, update shift
  if (newOrder.paymentStatus === 'LUNAS' && newOrder.paymentMethod === 'TUNAI') {
    activeShift.totalCashIn += newOrder.total;
    activeShift.expectedCash = activeShift.initialCash + activeShift.totalCashIn - activeShift.totalCashOut;
    broadcast({ type: 'SHIFT_UPDATE', payload: activeShift });
  }

  // Deduct ingredient stock automatically
  deductIngredientsForOrder(newOrder);

  broadcast({ type: 'ORDER_CREATE', payload: newOrder });
  res.status(201).json({ success: true, data: newOrder });
});

app.patch('/api/orders/:id/status', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const { status } = req.body;
  order.status = status;
  order.updatedAt = new Date().toISOString();

  if (status === 'DIMASAK' && !order.kitchenStartedAt) {
    order.kitchenStartedAt = new Date().toISOString();
  }
  if (status === 'SIAP_DIAMBIL') {
    order.readyAt = new Date().toISOString();
    const phone = (order.customerPhone || '').replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
    const waMessageText = `Halo ${order.customerName}! 🍽️ Pesanan Anda ${order.orderNumber} (${order.orderType === 'DINE_IN' ? order.tableNumber : 'Takeaway'}) di Kedai Rasa Nusantara sudah SIAP DIAMBIL. Silakan ambil di konter. Selamat menikmati! 🙏`;
    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessageText)}` : '';
    
    order.waNotificationSent = true;
    order.waNotificationLog = {
      sentAt: new Date().toISOString(),
      phone: cleanPhone || 'No Phone',
      message: waMessageText,
      status: 'DELIVERED',
      waLink: waUrl
    };
  }
  if (status === 'SELESAI') {
    order.completedAt = new Date().toISOString();
  }

  broadcast({ type: 'ORDER_STATUS_UPDATE', payload: order });
  res.json({ success: true, data: order });
});

// Process Payment API
app.post('/api/orders/:id/pay', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const { paymentMethod, cashPaid, cashChange } = req.body;
  order.paymentStatus = 'LUNAS';
  order.paymentMethod = paymentMethod;
  if (cashPaid !== undefined) order.cashPaid = cashPaid;
  if (cashChange !== undefined) order.cashChange = cashChange;
  order.updatedAt = new Date().toISOString();

  if (paymentMethod === 'TUNAI') {
    activeShift.totalCashIn += order.total;
    activeShift.expectedCash = activeShift.initialCash + activeShift.totalCashIn - activeShift.totalCashOut;
    broadcast({ type: 'SHIFT_UPDATE', payload: activeShift });
  }

  broadcast({ type: 'ORDER_PAYMENT', payload: order });
  res.json({ success: true, data: order });
});

// Digital Payment API: Generate dynamic QRIS
app.post('/api/payment/generate-qris', async (req, res) => {
  const { amount, orderId, orderNumber } = req.body;
  const qrisPayload = `00020101021226670014ID.LINKAJA.WWW01189360091800000000000215KEDAI_NUSANTARA0303UME51440014ID.GO.QRIS.WWW0215ID10200238849100303UME520458125303360540${amount}.005802ID5920Kedai Rasa Nusantara6013Jakarta Pusat62070703A016304ABCD`;

  try {
    const qrDataUrl = await QRCode.toDataURL(qrisPayload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      scale: 8,
      color: {
        dark: '#1e293b',
        light: '#ffffff'
      }
    });

    res.json({
      success: true,
      qrDataUrl,
      qrisPayload,
      transactionId: 'TRX-' + Date.now(),
      amount,
      orderId,
      orderNumber,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate QRIS' });
  }
});

// Digital Payment API: Simulate Webhook / Gateway Instant Callback
app.post('/api/payment/simulate-callback', (req, res) => {
  const { orderId, paymentMethod = 'QRIS' } = req.body;
  const order = orders.find(o => o.id === orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  order.paymentStatus = 'LUNAS';
  order.paymentMethod = paymentMethod;
  order.updatedAt = new Date().toISOString();

  broadcast({ type: 'ORDER_PAYMENT', payload: order });
  res.json({
    success: true,
    message: 'Payment confirmed via simulated digital payment gateway webhook',
    data: order
  });
});

// Raw Ingredients APIs
app.get('/api/ingredients', (req, res) => {
  res.json({ success: true, data: rawIngredients });
});

app.patch('/api/ingredients/:id', (req, res) => {
  const ing = rawIngredients.find(r => r.id === req.params.id);
  if (!ing) {
    return res.status(404).json({ error: 'Ingredient not found' });
  }
  const { stock, costPerUnit, minThreshold } = req.body;
  if (stock !== undefined) ing.stock = Number(stock);
  if (costPerUnit !== undefined) ing.costPerUnit = Number(costPerUnit);
  if (minThreshold !== undefined) ing.minThreshold = Number(minThreshold);
  ing.lastRestocked = new Date().toISOString().split('T')[0];

  broadcast({ type: 'INGREDIENT_UPDATE', payload: ing });
  res.json({ success: true, data: ing });
});

// Daily Financial & Analytics Report API
app.get('/api/reports/daily', (req, res) => {
  const paidOrders = orders.filter(o => o.paymentStatus === 'LUNAS');
  const grossRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const totalCost = paidOrders.reduce((sum, o) => sum + o.totalCost, 0);
  const netProfit = grossRevenue - totalCost;
  const totalTransactions = paidOrders.length;
  const averageOrderValue = totalTransactions > 0 ? Math.round(grossRevenue / totalTransactions) : 0;

  // Breakdown by payment method
  const paymentBreakdown: Record<string, { count: number; total: number }> = {};
  for (const o of paidOrders) {
    const method = o.paymentMethod || 'TUNAI';
    if (!paymentBreakdown[method]) {
      paymentBreakdown[method] = { count: 0, total: 0 };
    }
    paymentBreakdown[method].count += 1;
    paymentBreakdown[method].total += o.total;
  }

  // Breakdown by order type
  const orderTypeBreakdown: Record<string, { count: number; total: number }> = {};
  for (const o of paidOrders) {
    const type = o.orderType;
    if (!orderTypeBreakdown[type]) {
      orderTypeBreakdown[type] = { count: 0, total: 0 };
    }
    orderTypeBreakdown[type].count += 1;
    orderTypeBreakdown[type].total += o.total;
  }

  // Best selling menu items
  const menuSalesMap: Record<string, { name: string; category: string; quantity: number; revenue: number; profit: number }> = {};
  for (const o of paidOrders) {
    for (const item of o.items) {
      if (!menuSalesMap[item.menuId]) {
        menuSalesMap[item.menuId] = {
          name: item.name,
          category: menuItems.find(m => m.id === item.menuId)?.category || 'Makanan',
          quantity: 0,
          revenue: 0,
          profit: 0
        };
      }
      menuSalesMap[item.menuId].quantity += item.quantity;
      menuSalesMap[item.menuId].revenue += item.subtotal;
      menuSalesMap[item.menuId].profit += (item.price - item.costPrice) * item.quantity;
    }
  }

  const bestSellers = Object.values(menuSalesMap).sort((a, b) => b.quantity - a.quantity);

  // Hourly distribution
  const hourlySales: Record<string, number> = {};
  for (let h = 8; h <= 22; h++) {
    const label = `${h.toString().padStart(2, '0')}:00`;
    hourlySales[label] = 0;
  }
  for (const o of paidOrders) {
    const hour = new Date(o.createdAt).getHours();
    const label = `${hour.toString().padStart(2, '0')}:00`;
    if (hourlySales[label] !== undefined) {
      hourlySales[label] += o.total;
    }
  }

  res.json({
    success: true,
    data: {
      grossRevenue,
      netProfit,
      totalCost,
      totalTransactions,
      averageOrderValue,
      profitMarginPercent: grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 100) : 0,
      paymentBreakdown,
      orderTypeBreakdown,
      bestSellers,
      hourlySales,
      activeShift
    }
  });
});

// Cash shift closing endpoint
app.post('/api/shift/close', (req, res) => {
  const { actualCash, notes } = req.body;
  activeShift.isClosed = true;
  activeShift.endTime = new Date().toISOString();
  activeShift.actualCash = Number(actualCash) || 0;
  activeShift.difference = activeShift.actualCash - activeShift.expectedCash;
  activeShift.notes = notes || '';

  broadcast({ type: 'SHIFT_UPDATE', payload: activeShift });
  res.json({ success: true, data: activeShift });
});

// Vite Middleware integration for development
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const port = process.env.PORT || 3000;

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  }

  server.listen(port, () => {
    console.log(`Kedai Rasa Nusantara Server running on http://localhost:${port}`);
    console.log(`WebSocket server active on ws://localhost:${port}/ws`);
  });
}

startServer();
