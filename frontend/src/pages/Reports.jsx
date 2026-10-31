import React, { useState, useEffect } from 'react';
import {
  getSalesReportApi,
  getMedicineWiseReportApi,
  getCategoryWiseReportApi,
  exportSalesCSVUrl,
} from '../services/api';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [salesReport, setSalesReport] = useState(null);
  const [medicineReport, setMedicineReport] = useState([]);
  const [categoryReport, setCategoryReport] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      if (activeTab === 'sales') {
        const res = await getSalesReportApi(params);
        if (res.data.success) setSalesReport(res.data.data);
      } else if (activeTab === 'medicines') {
        const res = await getMedicineWiseReportApi(params);
        if (res.data.success) setMedicineReport(res.data.data);
      } else if (activeTab === 'categories') {
        const res = await getCategoryWiseReportApi();
        if (res.data.success) setCategoryReport(res.data.data);
      }
    } catch (e) {
      console.error('Failed to load reports:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [activeTab, startDate, endDate]);

  const handleExportCSV = () => {
    let url = exportSalesCSVUrl;
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;
    window.open(url, '_blank');
  };

  const summary = salesReport?.summary || {
    grossRevenue: 0,
    totalTax: 0,
    totalDiscount: 0,
    netRevenue: 0,
    totalCost: 0,
    netProfit: 0,
    profitMargin: 0,
    totalBills: 0,
  };

  return (
    <div className="flex flex-col w-full gap-space-lg">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-primary-container text-on-primary-container font-mono-data text-[11px] font-semibold uppercase">
              Financial Analytics
            </span>
            <span className="text-outline font-mono">•</span>
            <span className="text-tertiary font-semibold text-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> Direct MongoDB Aggregations
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mt-1 font-bold">
            Reports & Clinical Analytics
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Analyze profit margins, sales velocity, category distributions, and export data for GST audits.
          </p>
        </div>

        <button
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md shadow-sm border border-outline-variant/40 transition-all active:scale-95 cursor-pointer"
          onClick={handleExportCSV}
        >
          <span className="material-symbols-outlined text-lg text-primary">file_download</span>
          <span>Export CSV for GST</span>
        </button>
      </div>

      {/* Date Range Filter Strip & Tabs */}
      <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-surface-container-low p-1 rounded-xl">
          {[
            { id: 'sales', label: 'Financial Summary' },
            { id: 'medicines', label: 'Medicine-wise Volume' },
            { id: 'categories', label: 'Therapeutic Categories' },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-outline font-semibold">Date Range:</span>
          <input
            type="date"
            className="px-2.5 py-1.5 rounded bg-surface-container-low border border-outline-variant/40 text-on-surface"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span className="text-outline">to</span>
          <input
            type="date"
            className="px-2.5 py-1.5 rounded bg-surface-container-low border border-outline-variant/40 text-on-surface"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          {(startDate || endDate) && (
            <button
              className="text-xs text-error font-semibold hover:underline"
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Financial Summary View */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
            <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/30">
              <span className="font-label-sm text-outline uppercase tracking-wider font-semibold">Net Revenue</span>
              <div className="font-headline-xl font-bold text-on-surface mt-1 tabular-nums">
                ₹ {summary.netRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-xs text-outline font-mono">{summary.totalBills} Total Invoices</span>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/30">
              <span className="font-label-sm text-outline uppercase tracking-wider font-semibold">Procurement Cost</span>
              <div className="font-headline-xl font-bold text-on-surface mt-1 tabular-nums">
                ₹ {summary.totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-xs text-outline font-mono">Wholesale Cost of Goods</span>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/30">
              <span className="font-label-sm text-outline uppercase tracking-wider font-semibold">Net Profit</span>
              <div className="font-headline-xl font-bold text-tertiary mt-1 tabular-nums">
                ₹ {summary.netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-xs text-tertiary font-semibold">{summary.profitMargin}% Realized Margin</span>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/30">
              <span className="font-label-sm text-outline uppercase tracking-wider font-semibold">Total GST Collected</span>
              <div className="font-headline-xl font-bold text-secondary mt-1 tabular-nums">
                ₹ {summary.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-xs text-outline font-mono">Input Tax Credit Ledger</span>
            </div>
          </div>

          {/* Daily Table */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
            <div className="p-4 border-b border-surface-container font-semibold text-sm">
              Daily Consolidated Breakdown
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body-sm">
                <thead>
                  <tr className="border-b border-surface-container text-outline text-[11px] uppercase tracking-wider font-semibold bg-surface-container-low/40">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-3 text-right">Invoices</th>
                    <th className="py-3 px-4 text-right">Total Sales</th>
                    <th className="py-3 px-4 text-right">Cost Price</th>
                    <th className="py-3 px-4 text-right">GST Tax</th>
                    <th className="py-3 px-4 text-right">Net Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {salesReport?.dailyBreakdown?.map((row) => (
                    <tr key={row._id} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-primary text-sm">{row._id}</td>
                      <td className="py-3.5 px-3 text-right font-mono tabular-nums">{row.invoicesCount}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-on-surface tabular-nums">
                        ₹ {row.totalSales.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-outline tabular-nums">
                        ₹ {row.totalCost.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-secondary tabular-nums">
                        ₹ {row.totalTax.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-tertiary tabular-nums">
                        ₹ {row.totalProfit.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Medicine Wise Report */}
      {activeTab === 'medicines' && (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-sm">
              <thead>
                <tr className="border-b border-surface-container text-outline text-[11px] uppercase tracking-wider font-semibold bg-surface-container-low/40">
                  <th className="py-3 px-4">Medicine Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-3 text-right">Units Sold</th>
                  <th className="py-3 px-4 text-right">Total Revenue</th>
                  <th className="py-3 px-4 text-right">Net Margin</th>
                  <th className="py-3 px-4 text-right">Current Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {medicineReport.map((m, idx) => (
                  <tr key={idx} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3.5 px-4 font-bold text-on-surface text-sm">{m.medicineName}</td>
                    <td className="py-3.5 px-4 text-xs text-on-surface-variant">{m.categoryName}</td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold tabular-nums">
                      {m.totalQuantitySold}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-primary tabular-nums">
                      ₹ {m.totalRevenue.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-tertiary tabular-nums">
                      ₹ {m.totalProfit.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold tabular-nums">
                      {m.currentStock} units
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category Wise Report */}
      {activeTab === 'categories' && (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-sm">
              <thead>
                <tr className="border-b border-surface-container text-outline text-[11px] uppercase tracking-wider font-semibold bg-surface-container-low/40">
                  <th className="py-3 px-4">Therapeutic Group</th>
                  <th className="py-3 px-3 text-right">Total Units Dispensed</th>
                  <th className="py-3 px-4 text-right">Gross Sales (₹)</th>
                  <th className="py-3 px-4 text-right">Contribution Profit (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {categoryReport.map((c, idx) => (
                  <tr key={idx} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3.5 px-4 font-bold text-on-surface text-sm">{c.categoryName}</td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold tabular-nums">{c.totalUnitsSold}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-primary tabular-nums">
                      ₹ {c.totalRevenue.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-tertiary tabular-nums">
                      ₹ {c.totalProfit.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
