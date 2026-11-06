import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { 
  MenuItem, 
  Order, 
  RawIngredient, 
  CashShift, 
  Role, 
  StaffUser, 
  WSMessage, 
  OrderStatus, 
  PaymentMethod 
} from '../types/pos';
import { playNewOrderChime, playOrderReadyChime } from '../utils/audio';

export const STAFF_USERS: StaffUser[] = [
  { id: 'staff-1', name: 'Budi Santoso', role: 'kasir', pin: '1234', avatar: '👨‍💼' },
  { id: 'staff-2', name: 'Chef Joko & Siti', role: 'dapur', pin: '0000', avatar: '👨‍🍳' },
  { id: 'staff-3', name: 'Hj. Rahmat (Pemilik)', role: 'pemilik', pin: '9999', avatar: '👑' },
  { id: 'staff-4', name: 'Pelanggan Meja (Self-Order)', role: 'pelanggan', pin: '', avatar: '📱' }
];

interface POSContextType {
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  currentUser: StaffUser;
  setCurrentUser: (user: StaffUser) => void;
  isWsConnected: boolean;
  menuItems: MenuItem[];
  orders: Order[];
  rawIngredients: RawIngredient[];
  activeShift: CashShift | null;
  activeOrderNotification: Order | null;
  clearOrderNotification: () => void;
  waModalOrder: Order | null;
  setWaModalOrder: (order: Order | null) => void;
  
  // Actions
  addNewMenu: (menuData: Partial<MenuItem>) => Promise<boolean>;
  updateMenu: (id: string, menuData: Partial<MenuItem>) => Promise<boolean>;
  deleteMenu: (id: string) => Promise<boolean>;
  toggleMenuStock: (id: string) => Promise<boolean>;
  
  createOrder: (orderData: Partial<Order>) => Promise<Order | null>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<boolean>;
  processPayment: (id: string, paymentMethod: PaymentMethod, cashPaid?: number, cashChange?: number) => Promise<boolean>;
  simulateQrisPayment: (orderId: string) => Promise<boolean>;
  
  updateIngredientStock: (id: string, stock: number) => Promise<boolean>;
  closeCashShift: (actualCash: number, notes?: string) => Promise<boolean>;
  
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<Role>('kasir');
  const [currentUser, setCurrentUser] = useState<StaffUser>(STAFF_USERS[0]);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [rawIngredients, setRawIngredients] = useState<RawIngredient[]>([]);
  const [activeShift, setActiveShift] = useState<CashShift | null>(null);
  const [activeOrderNotification, setActiveOrderNotification] = useState<Order | null>(null);
  const [waModalOrder, setWaModalOrder] = useState<Order | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync role and user when currentRole changes
  const switchRole = useCallback((newRole: Role) => {
    setCurrentRole(newRole);
    const matched = STAFF_USERS.find(u => u.role === newRole);
    if (matched) setCurrentUser(matched);
  }, []);

  // Connect to WebSocket
  useEffect(() => {
    let isMounted = true;

    function connectWebSocket() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMounted) return;
        setIsWsConnected(true);
        console.log('Connected to Kedai Makan WebSocket Server');
      };

      ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);
          
          switch (msg.type) {
            case 'INIT_STATE':
              setMenuItems(msg.payload.menuItems || []);
              setOrders(msg.payload.orders || []);
              setRawIngredients(msg.payload.rawIngredients || []);
              setActiveShift(msg.payload.activeShift || null);
              break;

            case 'MENU_ADD':
              setMenuItems(prev => {
                if (prev.some(m => m.id === msg.payload.id)) return prev;
                return [msg.payload, ...prev];
              });
              break;

            case 'MENU_UPDATE':
              setMenuItems(prev => prev.map(m => m.id === msg.payload.id ? msg.payload : m));
              break;

            case 'MENU_DELETE':
              setMenuItems(prev => prev.filter(m => m.id !== msg.payload.id));
              break;

            case 'MENU_STOCK_TOGGLE':
              setMenuItems(prev => prev.map(m => 
                m.id === msg.payload.id ? { ...m, isAvailable: msg.payload.isAvailable } : m
              ));
              break;

            case 'ORDER_CREATE': {
              const newOrder: Order = msg.payload;
              setOrders(prev => {
                if (prev.some(o => o.id === newOrder.id)) return prev;
                return [newOrder, ...prev];
              });
              // Trigger notification for kitchen and cashier
              setActiveOrderNotification(newOrder);
              if (soundEnabled) {
                playNewOrderChime();
              }
              break;
            }

            case 'ORDER_STATUS_UPDATE': {
              const updatedOrder: Order = msg.payload;
              setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));

              // If order is ready for pickup, trigger celebratory chime and WhatsApp prompt
              if (updatedOrder.status === 'SIAP_DIAMBIL') {
                if (soundEnabled) {
                  playOrderReadyChime();
                }
                setWaModalOrder(updatedOrder);
              }
              break;
            }

            case 'ORDER_PAYMENT': {
              const paidOrder: Order = msg.payload;
              setOrders(prev => prev.map(o => o.id === paidOrder.id ? paidOrder : o));
              break;
            }

            case 'INGREDIENT_UPDATE': {
              const updatedIng: RawIngredient = msg.payload;
              setRawIngredients(prev => prev.map(r => r.id === updatedIng.id ? updatedIng : r));
              break;
            }

            case 'SHIFT_UPDATE':
              setActiveShift(msg.payload);
              break;

            default:
              break;
          }
        } catch (err) {
          console.error('Error handling WS message:', err);
        }
      };

      ws.onclose = () => {
        if (!isMounted) return;
        setIsWsConnected(false);
        console.warn('WebSocket closed, attempting reconnect in 2s...');
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 2000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket encountered error:', err);
        ws.close();
      };
    }

    connectWebSocket();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [soundEnabled]);

  const clearOrderNotification = () => {
    setActiveOrderNotification(null);
  };

  // Actions implementations
  const addNewMenu = async (menuData: Partial<MenuItem>): Promise<boolean> => {
    try {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menuData)
      });
      return res.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const updateMenu = async (id: string, menuData: Partial<MenuItem>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/menu/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menuData)
      });
      return res.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const deleteMenu = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/menu/${id}`, { method: 'DELETE' });
      return res.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const toggleMenuStock = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/menu/${id}/toggle-stock`, { method: 'PATCH' });
      return res.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const createOrder = async (orderData: Partial<Order>): Promise<Order | null> => {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const updateOrderStatus = async (id: string, status: OrderStatus): Promise<boolean> => {
    try {
      // Send optimistic WS message if connected
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'ORDER_STATUS_UPDATE',
          payload: { id, status }
        }));
      }

      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      return res.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const processPayment = async (
    id: string,
    paymentMethod: PaymentMethod,
    cashPaid?: number,
    cashChange?: number
  ): Promise<boolean> => {
    try {
      const res = await fetch(`/api/orders/${id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod, cashPaid, cashChange })
      });
      return res.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const simulateQrisPayment = async (orderId: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/payment/simulate-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, paymentMethod: 'QRIS' })
      });
      return res.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const updateIngredientStock = async (id: string, stock: number): Promise<boolean> => {
    try {
      const res = await fetch(`/api/ingredients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock })
      });
      return res.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const closeCashShift = async (actualCash: number, notes?: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/shift/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actualCash, notes })
      });
      return res.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  return (
    <POSContext.Provider
      value={{
        currentRole,
        setCurrentRole: switchRole,
        currentUser,
        setCurrentUser,
        isWsConnected,
        menuItems,
        orders,
        rawIngredients,
        activeShift,
        activeOrderNotification,
        clearOrderNotification,
        waModalOrder,
        setWaModalOrder,
        addNewMenu,
        updateMenu,
        deleteMenu,
        toggleMenuStock,
        createOrder,
        updateOrderStatus,
        processPayment,
        simulateQrisPayment,
        updateIngredientStock,
        closeCashShift,
        soundEnabled,
        setSoundEnabled
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export function usePOS() {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
}
