import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDashboardStatsApi } from '../services/api';

const Dashboard = ({ onOpenQuickSale, onOpenAddMedicine, setActiveTab }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('today');

  const fetchStats = async (selectedPeriod) => {
    setLoading(true);
    try {
      const res = await getDashboardStatsApi({ period: selectedPeriod });
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(period);
  }, [period]);

  const financials = stats?.financials || {
    totalRevenue: 0,
    totalProfit: 0,
    profitMargin: 0,
    billCount: 0,
    avgBillValue: 0,
  };

  const inventory = stats?.inventory || {
    totalMedicines: 0,
    totalStockUnits: 0,
    costValuation: 0,
    mrpValuation: 0,
    lowStockMedicines: 0,
    nearExpiryBatchesCount: 0,
    expiredBatchesCount: 0,
  };

  const recentSales = stats?.recentSales || [];
  const dailyTrend = stats?.dailyTrend || [];

  return (
    <div className="flex flex-col w-full gap-6 max-w-7xl mx-auto pb-10">
      {/* 1. Simple Welcome & Period Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            Welcome back, {user?.name || 'Dr. Priya Sharma'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            PharmaCare Dispensary • Daily sales, inventory & active alerts
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: '7days', label: '7 Days' },
            { id: 'month', label: 'This Month' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                period === tab.id
                  ? 'bg-white text-teal-800 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Key Metrics - 4 Simple Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Sales */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Sales
            </span>
            <span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">payments</span>
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              ₹ {financials.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="font-medium text-teal-700">{financials.billCount} bills</span>
              <span>• Avg ₹{financials.avgBillValue.toFixed(0)}/bill</span>
            </div>
          </div>
        </div>

        {/* Card 2: Net Profit */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Net Profit
            </span>
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">trending_up</span>
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-700 tracking-tight">
              ₹ {financials.totalProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-semibold text-[11px]">
                {financials.profitMargin}% margin
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Medicines */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Medicines Catalog
            </span>
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">medication</span>
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {inventory.totalMedicines}{' '}
              <span className="text-sm font-normal text-slate-500">items</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>{inventory.totalStockUnits.toLocaleString()} units in stock</span>
              <button
                onClick={() => setActiveTab('medicines')}
                className="text-teal-700 hover:underline font-semibold cursor-pointer"
              >
                View →
              </button>
            </div>
          </div>
        </div>

        {/* Card 4: Inventory MRP Valuation */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Stock Valuation
            </span>
            <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">inventory_2</span>
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              ₹ {inventory.mrpValuation.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>Cost: ₹{inventory.costValuation.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              <span className="text-[11px] text-slate-400 font-mono">MRP</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Streamlined Inventory Alerts Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          onClick={() => setActiveTab('batches-expiry')}
          className="bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-xl flex items-center justify-between cursor-pointer hover:bg-amber-50 transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-lg">schedule</span>
            </span>
            <div>
              <div className="text-xs font-semibold text-amber-900">
                {inventory.nearExpiryBatchesCount} Near-Expiry Batch
              </div>
              <div className="text-[11px] text-amber-700">Expires within 90 days</div>
            </div>
          </div>
          <span className="text-xs font-semibold text-amber-800">Review →</span>
        </div>

        <div
          onClick={() => setActiveTab('batches-expiry')}
          className="bg-rose-50/70 border border-rose-200/80 p-3.5 rounded-xl flex items-center justify-between cursor-pointer hover:bg-rose-50 transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-lg">block</span>
            </span>
            <div>
              <div className="text-xs font-semibold text-rose-900">
                {inventory.expiredBatchesCount} Expired Batch
              </div>
              <div className="text-[11px] text-rose-700">Blocked from billing</div>
            </div>
          </div>
          <span className="text-xs font-semibold text-rose-800">Clear →</span>
        </div>

        <div
          onClick={() => setActiveTab('medicines')}
          className="bg-blue-50/70 border border-blue-200/80 p-3.5 rounded-xl flex items-center justify-between cursor-pointer hover:bg-blue-50 transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-lg">warning</span>
            </span>
            <div>
              <div className="text-xs font-semibold text-blue-900">
                {inventory.lowStockMedicines} Low Stock Item
              </div>
              <div className="text-[11px] text-blue-700">Below reorder threshold</div>
            </div>
          </div>
          <span className="text-xs font-semibold text-blue-800">Reorder →</span>
        </div>
      </div>

      {/* 4. Sales Trend & Quick Operations Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Sales Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Sales & Profit Trend</h2>
                <p className="text-xs text-slate-500">Performance across the selected period</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-700"></span>
                  <span className="text-slate-600">Revenue</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-600">Profit</span>
                </div>
              </div>
            </div>

            {/* Visual Bar Chart */}
            <div className="h-48 w-full flex items-end gap-3 pt-6 pb-2 border-b border-slate-100">
              {dailyTrend.length > 0 ? (
                dailyTrend.map((d, idx) => {
                  const maxVal = Math.max(...dailyTrend.map((item) => item.revenue), 300);
                  const revHeight = Math.min(100, Math.max(12, (d.revenue / maxVal) * 100));
                  const profHeight = Math.min(100, Math.max(8, (d.profit / maxVal) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                      <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        ₹{d.revenue.toFixed(0)}
                      </div>
                      <div className="w-full flex items-end justify-center gap-1 h-full">
                        <div
                          className="w-1/2 max-w-[28px] bg-teal-700 rounded-t transition-all hover:bg-teal-800"
                          style={{ height: `${revHeight}%` }}
                          title={`Revenue: ₹${d.revenue}`}
                        ></div>
                        <div
                          className="w-1/2 max-w-[28px] bg-emerald-500 rounded-t transition-all hover:bg-emerald-600"
                          style={{ height: `${profHeight}%` }}
                          title={`Profit: ₹${d.profit}`}
                        ></div>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 mt-1">{d._id.substring(5)}</span>
                    </div>
                  );
                })
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                  No sales recorded in this period yet.
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between text-xs text-slate-400">
            <span>Daily totals automatically updated</span>
            <button
              className="text-teal-700 font-semibold hover:underline cursor-pointer"
              onClick={() => setActiveTab('reports-analytics')}
            >
              Full Report →
            </button>
          </div>
        </div>

        {/* Right Column (1 col): Quick Shortcuts */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800 mb-1">Quick Shortcuts</h2>
            <p className="text-xs text-slate-500 mb-4">Frequently used pharmacy actions</p>

            <div className="flex flex-col gap-2.5">
              <button
                className="w-full p-3 rounded-lg bg-teal-700 text-white hover:bg-teal-800 flex items-center justify-between transition-all cursor-pointer shadow-xs active:scale-98"
                onClick={onOpenQuickSale}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-lg">point_of_sale</span>
                  <div className="text-left">
                    <div className="text-xs font-bold">New Sale (POS)</div>
                    <div className="text-[11px] text-teal-100">Dispense medicines & bill</div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>

              <button
                className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-all cursor-pointer"
                onClick={onOpenAddMedicine}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-base text-teal-700">add_circle</span>
                  <div className="text-left text-xs font-semibold">Add Medicine</div>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
              </button>

              <button
                className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-all cursor-pointer"
                onClick={() => setActiveTab('prescriptions')}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-base text-blue-600">prescriptions</span>
                  <div className="text-left text-xs font-semibold">Prescriptions</div>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
              </button>

              <button
                className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-all cursor-pointer"
                onClick={() => setActiveTab('purchase-orders')}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-base text-purple-600">local_shipping</span>
                  <div className="text-left text-xs font-semibold">Goods Receipt (GRN)</div>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Recent Sales Table */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Recent Invoices</h2>
            <p className="text-xs text-slate-500">Latest completed dispensary sales</p>
          </div>
          <button
            className="text-teal-700 text-xs font-semibold hover:underline cursor-pointer"
            onClick={() => setActiveTab('sales-pos-billing')}
          >
            Open POS Register →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-2.5 px-3">Invoice #</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Dispensed By</th>
                <th className="py-2.5 px-3 text-right">Subtotal</th>
                <th className="py-2.5 px-3 text-right">GST</th>
                <th className="py-2.5 px-3 text-right">Total</th>
                <th className="py-2.5 px-3 text-right">Profit</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentSales.length > 0 ? (
                recentSales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-semibold text-teal-700">{sale.invoiceNumber}</td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800">{sale.customerName || 'Walk-in Customer'}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{sale.customerPhone || 'Counter'}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {sale.dispensedBy?.name || 'Pharmacist'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">₹{sale.subtotal.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-400">₹{sale.taxAmount.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      ₹{sale.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-medium text-emerald-700">
                      ₹{sale.profitAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                        PAID
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-6 text-slate-400">
                    No sales recorded yet. Click '+ Quick Sale (POS)' to create an invoice.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
