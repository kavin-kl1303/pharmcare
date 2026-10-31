import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Header = ({ onOpenQuickSale, onOpenAddMedicine, onSearch, activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
      setCurrentTime(now.toLocaleDateString('en-IN', options));
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="fixed top-0 left-72 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 z-40 flex items-center justify-between px-6 shadow-xs">
      {/* Search Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
            search
          </span>
          <input
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-100/80 text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all border border-transparent"
            placeholder="Search medicines, batches, customers..."
            type="text"
            onChange={(e) => onSearch && onSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Date, Actions, and User Profile */}
      <div className="flex items-center gap-4">
        {/* Simple Date Chip */}
        <div className="hidden lg:flex items-center gap-2 text-slate-600 text-xs font-medium bg-slate-100 px-3 py-1.5 rounded-lg whitespace-nowrap">
          <span className="material-symbols-outlined text-[16px] text-teal-600">calendar_today</span>
          <span>{currentTime || 'Today'}</span>
        </div>

        {/* Quick Sale Action */}
        <button
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-700 text-white hover:bg-teal-800 text-xs font-semibold transition-all shadow-xs active:scale-95 whitespace-nowrap cursor-pointer"
          onClick={onOpenQuickSale}
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">point_of_sale</span>
          <span>+ Quick Sale (POS)</span>
        </button>

        {/* Add Medicine Action */}
        <button
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold border border-slate-300 transition-all shadow-xs active:scale-95 whitespace-nowrap cursor-pointer"
          onClick={onOpenAddMedicine}
          type="button"
        >
          <span className="material-symbols-outlined text-[18px] text-teal-700">add_circle</span>
          <span>+ Add Medicine</span>
        </button>

        <div className="h-6 w-px bg-slate-200"></div>

        {/* Notifications Icon */}
        <button
          aria-label="Notifications"
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors relative cursor-pointer"
          onClick={() => setActiveTab('notifications')}
          type="button"
        >
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500"></span>
        </button>

        {/* User Profile */}
        <div className="relative">
          <div
            className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-100 p-1.5 rounded-lg transition-colors select-none"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm">
              {user?.name ? user.name.charAt(0) : 'P'}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 leading-tight">
                {user?.name || 'Dr. Priya Sharma'}
              </span>
              <span className="text-[10px] text-slate-500 leading-tight">
                {user?.roleCode || 'ADMIN'}
              </span>
            </div>
            <span className="material-symbols-outlined text-slate-400 text-[18px]">expand_more</span>
          </div>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-[11px] text-slate-400">Signed in as</p>
                <p className="font-semibold text-xs text-slate-800 truncate">{user?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium rounded bg-teal-50 text-teal-700">
                  Role: {user?.roleCode}
                </span>
              </div>
              <button
                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                onClick={() => {
                  setActiveTab('staff-roles');
                  setShowProfileMenu(false);
                }}
              >
                <span className="material-symbols-outlined text-base text-slate-500">admin_panel_settings</span>
                User Management
              </button>
              <button
                className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100 mt-1 cursor-pointer"
                onClick={logout}
              >
                <span className="material-symbols-outlined text-base">logout</span>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
