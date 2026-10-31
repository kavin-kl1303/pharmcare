import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import PosBilling from './pages/PosBilling';
import Medicines from './pages/Medicines';
import Inventory from './pages/Inventory';
import BatchesExpiry from './pages/BatchesExpiry';
import Prescriptions from './pages/Prescriptions';
import Suppliers from './pages/Suppliers';
import Customers from './pages/Customers';
import PurchaseOrders from './pages/PurchaseOrders';
import Reports from './pages/Reports';
import StaffRoles from './pages/StaffRoles';
import Notifications from './pages/Notifications';

const MainShell = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [addMedicineTrigger, setAddMedicineTrigger] = useState(false);
  const [posInitialMedicine, setPosInitialMedicine] = useState(null);

  const handleOpenAddMedicine = () => {
    setActiveTab('medicines');
    setAddMedicineTrigger(true);
  };

  const handleOpenQuickSale = () => {
    setActiveTab('sales-pos-billing');
  };

  const handleDispensePrescription = (rx) => {
    setActiveTab('sales-pos-billing');
  };

  return (
    <div className="bg-background min-h-screen text-on-surface antialiased flex flex-col font-sans">
      {/* Sidebar (72 = 18rem width) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddMedicine={handleOpenAddMedicine}
        onOpenQuickSale={handleOpenQuickSale}
      />

      {/* Main Content Area (pl-72) */}
      <div className="pl-72 flex flex-col min-h-screen">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenAddMedicine={handleOpenAddMedicine}
          onOpenQuickSale={handleOpenQuickSale}
        />

        <main className="relative pt-16 bg-background w-full flex-1 px-gutter py-margin">
          {activeTab === 'dashboard' && (
            <Dashboard
              setActiveTab={setActiveTab}
              onOpenAddMedicine={handleOpenAddMedicine}
              onOpenQuickSale={handleOpenQuickSale}
            />
          )}

          {activeTab === 'sales-pos-billing' && (
            <PosBilling initialMedicine={posInitialMedicine} />
          )}

          {activeTab === 'medicines' && (
            <Medicines
              onAddMedicineTrigger={addMedicineTrigger}
              resetTrigger={() => setAddMedicineTrigger(false)}
            />
          )}

          {activeTab === 'inventory' && <Inventory />}

          {activeTab === 'batches-expiry' && <BatchesExpiry />}

          {activeTab === 'prescriptions' && (
            <Prescriptions onDispenseQuickSale={handleDispensePrescription} />
          )}

          {activeTab === 'suppliers' && <Suppliers />}

          {activeTab === 'customers' && <Customers />}

          {activeTab === 'purchase-orders' && <PurchaseOrders />}

          {activeTab === 'reports-analytics' && <Reports />}

          {activeTab === 'staff-roles' && <StaffRoles />}

          {activeTab === 'notifications' && <Notifications />}
        </main>
      </div>
    </div>
  );
};

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="font-mono text-xs text-outline font-semibold">
            Connecting to PharmaCare Dispensary OS...
          </span>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <MainShell /> : <Login />;
}

export default App;
