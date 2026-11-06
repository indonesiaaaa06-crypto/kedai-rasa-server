import React from 'react';
import { POSProvider, usePOS } from './context/POSContext';
import { HeaderNav } from './components/HeaderNav';
import { CashierView } from './components/CashierView';
import { KitchenView } from './components/KitchenView';
import { OwnerDashboardView } from './components/OwnerDashboardView';
import { CustomerSelfOrderView } from './components/CustomerSelfOrderView';
import { WhatsAppModal } from './components/WhatsAppModal';

function POSAppContent() {
  const { currentRole } = usePOS();

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex flex-col">
      <HeaderNav />

      <main className="flex-1 pb-16">
        {currentRole === 'kasir' && <CashierView />}
        {currentRole === 'dapur' && <KitchenView />}
        {currentRole === 'pemilik' && <OwnerDashboardView />}
        {currentRole === 'pelanggan' && <CustomerSelfOrderView />}
      </main>

      {/* Global WhatsApp Alert and Dispatch Modal */}
      <WhatsAppModal />

      {/* Subtle Footer */}
      <footer className="border-t border-neutral-800/80 py-4 px-6 text-center text-xs text-neutral-500">
        <p>Kedai Rasa Nusantara · Sistem POS Kasir & KDS Dapur Terintegrasi WebSocket Realtime</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <POSProvider>
      <POSAppContent />
    </POSProvider>
  );
}
