import React, { useState, useEffect } from 'react';
import { getBatchesApi, adjustStockApi } from '../services/api';
import Modal from '../components/Modal';

const BatchesExpiry = () => {
  const [batches, setBatches] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Stock Adjustment Modal
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [adjustType, setAdjustType] = useState('ADD');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustError, setAdjustError] = useState('');

  const loadBatches = async () => {
    setLoading(true);
    try {
      const res = await getBatchesApi({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: search || undefined,
        limit: 100,
      });
      if (res.data.success) {
        setBatches(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load batches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, [statusFilter, search]);

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    setAdjustError('');
    try {
      const res = await adjustStockApi(selectedBatch._id, {
        adjustmentType: adjustType,
        quantity: Number(adjustQty),
        reason: adjustReason,
      });
      if (res.data.success) {
        setSelectedBatch(null);
        setAdjustQty('');
        setAdjustReason('');
        loadBatches();
      }
    } catch (err) {
      setAdjustError(err.response?.data?.message || err.message || 'Stock adjustment failed');
    }
  };

  const now = new Date();
  const expiredCount = batches.filter((b) => new Date(b.expiryDate) <= now).length;
  const nearExpiryCount = batches.filter((b) => {
    const exp = new Date(b.expiryDate);
    const ninetyDays = new Date();
    ninetyDays.setDate(now.getDate() + 90);
    return exp > now && exp <= ninetyDays;
  }).length;

  return (
    <div className="flex flex-col w-full gap-space-lg">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-error-container text-on-error-container font-mono-data text-[11px] font-semibold uppercase">
              Triage Control
            </span>
            <span className="text-outline font-mono">•</span>
            <span className="text-error font-semibold text-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping"></span> Expiry Quarantine Active
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mt-1 font-bold">
            Batches & Expiry Safety Console
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Track batch manufacturing dates, FIFO rotation, near-expiry alerts (&lt;90 days), and quarantine expired medicines.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-surface-container-low p-1 rounded-xl">
          {[
            { id: 'ALL', label: 'All Batches' },
            { id: 'NEAR_EXPIRY', label: `Near Expiry (${nearExpiryCount})` },
            { id: 'EXPIRED', label: `Expired (${expiredCount})` },
            { id: 'ACTIVE', label: 'Active Valid' },
          ].map((pill) => (
            <button
              key={pill.id}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === pill.id
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              onClick={() => setStatusFilter(pill.id)}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Safety Alert Banner */}
      {expiredCount > 0 && (
        <div className="p-4 rounded-xl bg-error-container/30 border-l-4 border-error flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-error text-2xl">warning</span>
            <div>
              <h4 className="font-bold text-sm text-on-error-container">
                {expiredCount} Expired Batch(es) Detected in Primary Storage
              </h4>
              <p className="text-xs text-on-error-container/80">
                In accordance with CDSCO Good Pharmacy Practices, expired medications are blocked from the POS checkout register.
              </p>
            </div>
          </div>
          <button
            className="px-3 py-1.5 rounded-lg bg-error text-on-error text-xs font-bold hover:bg-error/90 shadow-sm"
            onClick={() => setStatusFilter('EXPIRED')}
          >
            Quarantine Filter
          </button>
        </div>
      )}

      {/* Batches Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="p-4 border-b border-surface-container flex items-center justify-between">
          <input
            className="w-72 px-3 py-2 text-xs rounded-lg bg-surface-container-low border border-outline-variant/40 focus:outline-none"
            placeholder="Search batch number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="text-xs text-outline font-mono">Showing {batches.length} batches</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-body-sm">
            <thead>
              <tr className="border-b border-surface-container text-outline text-[11px] uppercase tracking-wider font-semibold bg-surface-container-low/40">
                <th className="py-3 px-4">Batch #</th>
                <th className="py-3 px-4">Medicine Name</th>
                <th className="py-3 px-3">Mfg Date</th>
                <th className="py-3 px-3">Expiry Date</th>
                <th className="py-3 px-3 text-right">Cost Price</th>
                <th className="py-3 px-3 text-right">Selling Price</th>
                <th className="py-3 px-3 text-right">Available Qty</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Adjust Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {batches.length > 0 ? (
                batches.map((batch) => {
                  const expDate = new Date(batch.expiryDate);
                  const isExp = expDate <= now;
                  const ninetyDays = new Date();
                  ninetyDays.setDate(now.getDate() + 90);
                  const isNear = expDate > now && expDate <= ninetyDays;

                  return (
                    <tr key={batch._id} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-primary text-sm">
                        {batch.batchNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-on-surface">{batch.medicine?.name}</div>
                        <div className="text-xs text-outline">{batch.medicine?.genericName}</div>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-xs text-outline">
                        {new Date(batch.manufacturingDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-xs font-semibold">
                        <span className={isExp ? 'text-error font-bold' : isNear ? 'text-amber-600' : 'text-on-surface'}>
                          {expDate.toLocaleDateString('en-IN')}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                        ₹{batch.purchasePrice.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold tabular-nums">
                        ₹{batch.sellingPrice.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-sm tabular-nums">
                        {batch.quantity}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            isExp
                              ? 'bg-error text-on-error'
                              : isNear
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-tertiary-container/15 text-tertiary'
                          }`}
                        >
                          {isExp ? 'EXPIRED' : isNear ? 'NEAR EXPIRY' : 'ACTIVE'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          className="px-2.5 py-1 rounded bg-primary/10 text-primary hover:bg-primary hover:text-on-primary text-xs font-semibold transition-all"
                          onClick={() => {
                            setSelectedBatch(batch);
                            setAdjustQty('');
                            setAdjustReason('');
                          }}
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-outline text-sm">
                    {loading ? 'Loading batches from MongoDB...' : 'No batches found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={!!selectedBatch}
        onClose={() => setSelectedBatch(null)}
        title={`Stock Adjustment: Batch ${selectedBatch?.batchNumber} (${selectedBatch?.medicine?.name})`}
      >
        <form onSubmit={handleAdjustStock} className="space-y-4">
          {adjustError && (
            <div className="p-3 rounded-lg bg-error-container text-on-error-container text-sm">{adjustError}</div>
          )}

          <div className="p-3 rounded-lg bg-surface-container-low text-xs space-y-1">
            <p><strong>Current In-Stock:</strong> {selectedBatch?.quantity} units</p>
            <p><strong>Expiry Date:</strong> {new Date(selectedBatch?.expiryDate).toLocaleDateString('en-IN')}</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-outline block mb-1">Adjustment Type *</label>
            <select
              className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40"
              value={adjustType}
              onChange={(e) => setAdjustType(e.target.value)}
            >
              <option value="ADD">+ Add Stock (Found surplus / recount)</option>
              <option value="DEDUCT">- Deduct Stock (Damaged / lost in transit)</option>
              <option value="EXPIRED_DISCARD">Discard Expired (Quarantine removal)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-outline block mb-1">Quantity Units *</label>
            <input
              type="number"
              min="1"
              required
              className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40"
              placeholder="e.g. 10"
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-outline block mb-1">Reason / Reference Note</label>
            <input
              className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40"
              placeholder="e.g. Broken packaging audit"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-surface-container">
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-surface-container text-on-surface font-semibold text-sm"
              onClick={() => setSelectedBatch(null)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-primary text-on-primary font-semibold text-sm shadow-md hover:bg-primary-container"
            >
              Confirm Adjustment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BatchesExpiry;
