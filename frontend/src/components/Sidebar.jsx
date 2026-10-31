import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getNotificationsApi, getBatchesApi } from '../services/api';

const Sidebar = ({ activeTab, setActiveTab, onOpenAddMedicine, onOpenQuickSale }) => {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [nearExpiryCount, setNearExpiryCount] = useState(0);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const notifRes = await getNotificationsApi();
        if (notifRes.data.success) {
          setUnreadCount(notifRes.data.unreadCount || 0);
        }
        const batchRes = await getBatchesApi({ status: 'NEAR_EXPIRY', limit: 100 });
        if (batchRes.data.success) {
          setNearExpiryCount(batchRes.data.pagination.total || 0);
        }
      } catch (e) {
        // quiet fallback
      }
    };
    fetchBadges();
    const interval = setInterval(fetchBadges, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItemClass = (tabKey) => {
    const isActive = activeTab === tabKey;
    if (isActive) {
      return 'flex items-center gap-space-md px-space-md py-2.5 transition-all bg-primary-container text-on-primary-container font-semibold rounded-lg shadow-sm cursor-pointer';
    }
    return 'flex items-center gap-space-md px-space-md py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all font-body-md text-body-md cursor-pointer';
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-surface-container-lowest z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)] select-none">
      <div className="flex flex-col h-full">
        {/* Brand Header */}
        <div className="h-16 px-space-lg flex items-center justify-between bg-surface-container-low/40">
          <div className="flex items-center gap-space-sm cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary shadow-sm">
              <span className="material-symbols-outlined text-[20px]">local_pharmacy</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-primary tracking-tight font-bold leading-tight">
                PharmaCare<span className="text-secondary font-normal text-xs ml-0.5">Rx</span>
              </span>
              <span className="font-label-sm text-label-sm text-outline tracking-wider uppercase">
                Clinical Dispensary OS
              </span>
            </div>
          </div>
          <span className="px-space-xs py-0.5 rounded bg-primary-container/20 text-primary font-label-sm text-label-sm font-semibold">
            HQ-BLR
          </span>
        </div>

        {/* Scrollable Navigation Tree */}
        <div className="flex-1 overflow-y-auto px-space-md py-space-md space-y-space-md">
          {/* Main Operations */}
          <div className="space-y-1">
            <div className="px-space-sm py-1 font-label-sm text-label-sm text-outline font-semibold tracking-wider uppercase">
              Main Operations
            </div>
            <nav className="space-y-1">
              <div className={navItemClass('dashboard')} onClick={() => setActiveTab('dashboard')}>
                <span className="material-symbols-outlined text-[20px]">grid_view</span>
                <span>Dashboard</span>
              </div>
              <div className={navItemClass('sales-pos-billing')} onClick={() => setActiveTab('sales-pos-billing')}>
                <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                <span>Sales & POS Billing</span>
              </div>
              <div className={navItemClass('medicines')} onClick={() => setActiveTab('medicines')}>
                <span className="material-symbols-outlined text-[20px]">medication</span>
                <span>Medicines</span>
              </div>
              <div className={navItemClass('inventory')} onClick={() => setActiveTab('inventory')}>
                <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                <span>Inventory</span>
              </div>
              <div
                className={`flex items-center justify-between px-space-md py-2.5 rounded-lg transition-all font-body-md text-body-md cursor-pointer ${
                  activeTab === 'batches-expiry'
                    ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
                onClick={() => setActiveTab('batches-expiry')}
              >
                <div className="flex items-center gap-space-md">
                  <span className="material-symbols-outlined text-[20px]">warning</span>
                  <span>Batches & Expiry</span>
                </div>
                {nearExpiryCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-error-container text-on-error-container font-mono-data text-[11px] font-semibold">
                    {nearExpiryCount}
                  </span>
                )}
              </div>
              <div className={navItemClass('prescriptions')} onClick={() => setActiveTab('prescriptions')}>
                <span className="material-symbols-outlined text-[20px]">prescriptions</span>
                <span>Prescriptions</span>
              </div>
            </nav>
          </div>

          {/* Management */}
          <div className="space-y-1">
            <div className="px-space-sm py-1 font-label-sm text-label-sm text-outline font-semibold tracking-wider uppercase">
              Management
            </div>
            <nav className="space-y-1">
              <div className={navItemClass('suppliers')} onClick={() => setActiveTab('suppliers')}>
                <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                <span>Suppliers</span>
              </div>
              <div className={navItemClass('customers')} onClick={() => setActiveTab('customers')}>
                <span className="material-symbols-outlined text-[20px]">group</span>
                <span>Customers</span>
              </div>
              <div className={navItemClass('purchase-orders')} onClick={() => setActiveTab('purchase-orders')}>
                <span className="material-symbols-outlined text-[20px]">note_add</span>
                <span>Purchase Orders</span>
              </div>
              <div className={navItemClass('reports-analytics')} onClick={() => setActiveTab('reports-analytics')}>
                <span className="material-symbols-outlined text-[20px]">monitoring</span>
                <span>Reports & Analytics</span>
              </div>
              <div className={navItemClass('staff-roles')} onClick={() => setActiveTab('staff-roles')}>
                <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                <span>Staff & Roles</span>
              </div>
            </nav>
          </div>

          {/* System */}
          <div className="space-y-1">
            <div className="px-space-sm py-1 font-label-sm text-label-sm text-outline font-semibold tracking-wider uppercase">
              System
            </div>
            <nav className="space-y-1">
              <div
                className={`flex items-center justify-between px-space-md py-2.5 rounded-lg transition-all font-body-md text-body-md cursor-pointer ${
                  activeTab === 'notifications'
                    ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
                onClick={() => setActiveTab('notifications')}
              >
                <div className="flex items-center gap-space-md">
                  <span className="material-symbols-outlined text-[20px]">notifications</span>
                  <span>Notifications</span>
                </div>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-error text-on-error font-mono-data text-[11px] font-semibold">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div
                className="flex items-center gap-space-md px-space-md py-2.5 rounded-lg text-error hover:bg-error-container/30 hover:text-on-error-container transition-all font-body-md text-body-md cursor-pointer"
                onClick={logout}
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
                <span>Logout</span>
              </div>
            </nav>
          </div>
        </div>

        {/* GSTIN Verified Banner */}
        <div className="p-space-md m-space-md rounded-xl bg-surface-container flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-tertiary animate-pulse"></div>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface font-semibold">GSTIN Verified</span>
              <span className="font-mono-data text-[11px] text-outline">29AAAAA0000A1Z5</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-outline text-[18px]">verified</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
