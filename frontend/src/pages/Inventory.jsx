import React, { useState, useEffect } from 'react';
import { getMovementsApi, getInventorySummaryApi } from '../services/api';

const Inventory = () => {
  const [summary, setSummary] = useState(null);
  const [movements, setMovements] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, movRes] = await Promise.all([
        getInventorySummaryApi(),
        getMovementsApi({ type: typeFilter || undefined, limit: 100 }),
      ]);
      if (sumRes.data.success) setSummary(sumRes.data.data);
      if (movRes.data.success) setMovements(movRes.data.data);
    } catch (e) {
      console.error('Failed to load inventory data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [typeFilter]);

  return (
    <div className="flex flex-col w-full gap-space-lg">
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-primary-container text-on-primary-container font-mono-data text-[11px] font-semibold uppercase">
            Audit Ledger
          </span>
          <span className="text-outline font-mono">•</span>
          <span className="text-tertiary font-semibold text-xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> Double-Entry Stock Journal
          </span>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface mt-1 font-bold">
          Warehouse Inventory & Stock Movements
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Complete audit trail of every receipt, sale dispense, stock adjustment, and quarantine disposal.
        </p>
      </div>

      {/* Valuation Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/30">
          <span className="font-label-sm text-outline uppercase tracking-wider font-semibold">Total Stock Units</span>
          <div className="font-headline-xl font-bold text-on-surface mt-1 tabular-nums">
            {summary?.totalUnits || 0}
          </div>
          <span className="text-xs text-outline font-mono">Physical Units in Racks</span>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/30">
          <span className="font-label-sm text-outline uppercase tracking-wider font-semibold">Cost Valuation</span>
          <div className="font-headline-xl font-bold text-on-surface mt-1 tabular-nums">
            ₹ {(summary?.totalPurchaseCost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-outline font-mono">Wholesale Purchase Basis</span>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/30">
          <span className="font-label-sm text-outline uppercase tracking-wider font-semibold">MRP Valuation</span>
          <div className="font-headline-xl font-bold text-primary mt-1 tabular-nums">
            ₹ {(summary?.totalMrpValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-outline font-mono">Gross Retail Realization</span>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/30">
          <span className="font-label-sm text-outline uppercase tracking-wider font-semibold">Expected Margin</span>
          <div className="font-headline-xl font-bold text-tertiary mt-1 tabular-nums">
            ₹ {((summary?.totalMrpValue || 0) - (summary?.totalPurchaseCost || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-outline font-mono">Potential Gross Margin</span>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="p-4 border-b border-surface-container flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-headline-sm font-semibold text-on-surface">Stock Movement Journal</h3>
          <div className="flex items-center gap-2">
            <select
              className="py-1.5 px-3 rounded-lg bg-surface-container-low text-xs border border-outline-variant/40"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Movement Types</option>
              <option value="PURCHASE_RECEIPT">Purchase Receipt (GRN)</option>
              <option value="SALE_DISPENSE">Sale Dispense (POS)</option>
              <option value="ADJUSTMENT_ADD">Adjustment Add (+)</option>
              <option value="ADJUSTMENT_DEDUCT">Adjustment Deduct (-)</option>
              <option value="EXPIRED_DISCARD">Expired Discard</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-body-sm">
            <thead>
              <tr className="border-b border-surface-container text-outline text-[11px] uppercase tracking-wider font-semibold bg-surface-container-low/40">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Medicine & Formulation</th>
                <th className="py-3 px-3">Batch #</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3 text-right">Delta Qty</th>
                <th className="py-3 px-3 text-right">Stock (Before &gt; After)</th>
                <th className="py-3 px-3">Reference / Reason</th>
                <th className="py-3 px-4">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {movements.length > 0 ? (
                movements.map((mov) => {
                  const isPositive = mov.quantity > 0;
                  return (
                    <tr key={mov._id} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-outline">
                        {new Date(mov.createdAt).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 font-bold text-on-surface text-sm">
                        {mov.medicine?.name || 'Unknown'}
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-primary text-xs">
                        {mov.batch?.batchNumber || 'N/A'}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            mov.type === 'PURCHASE_RECEIPT'
                              ? 'bg-tertiary-container/15 text-tertiary'
                              : mov.type === 'SALE_DISPENSE'
                              ? 'bg-primary-container/20 text-primary'
                              : mov.type === 'EXPIRED_DISCARD'
                              ? 'bg-error-container text-on-error-container'
                              : 'bg-surface-container text-on-surface-variant'
                          }`}
                        >
                          {mov.type}
                        </span>
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-mono font-bold tabular-nums text-sm ${
                          isPositive ? 'text-tertiary' : 'text-error'
                        }`}
                      >
                        {isPositive ? `+${mov.quantity}` : mov.quantity}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-xs text-outline tabular-nums">
                        {mov.previousStock} → <strong className="text-on-surface">{mov.newStock}</strong>
                      </td>
                      <td className="py-3 px-3 text-xs text-on-surface-variant">
                        <div>{mov.reason || 'Routine operation'}</div>
                        {mov.referenceId && (
                          <span className="font-mono text-[10px] text-outline">Ref: {mov.referenceId}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-on-surface">
                        {mov.performedBy?.name || 'Pharmacist'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-outline text-sm">
                    {loading ? 'Loading movements...' : 'No stock movements recorded yet.'}
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

export default Inventory;
