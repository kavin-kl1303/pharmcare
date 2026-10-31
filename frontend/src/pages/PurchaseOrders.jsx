import React, { useState, useEffect } from 'react';
import {
  getPurchaseOrdersApi,
  createPurchaseOrderApi,
  receiveStockApi,
  getSuppliersApi,
  getMedicinesApi,
} from '../services/api';
import Modal from '../components/Modal';

const PurchaseOrders = () => {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Create PO Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poExpectedDate, setPoExpectedDate] = useState('');
  const [poNotes, setPoNotes] = useState('');
  const [poItems, setPoItems] = useState([
    { medicineId: '', orderedQuantity: 50, unitCost: 100 },
  ]);

  // Receive Stock Modal
  const [selectedPO, setSelectedPO] = useState(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [receiveItems, setReceiveItems] = useState([]);
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [orderRes, supRes, medRes] = await Promise.all([
        getPurchaseOrdersApi({ status: statusFilter !== 'ALL' ? statusFilter : undefined }),
        getSuppliersApi({ limit: 50 }),
        getMedicinesApi({ limit: 100 }),
      ]);
      if (orderRes.data.success) setOrders(orderRes.data.data);
      if (supRes.data.success) {
        setSuppliers(supRes.data.data);
        if (supRes.data.data[0]) setPoSupplierId(supRes.data.data[0]._id);
      }
      if (medRes.data.success) {
        setMedicines(medRes.data.data);
        if (medRes.data.data[0]) {
          setPoItems([{ medicineId: medRes.data.data[0]._id, orderedQuantity: 50, unitCost: 100 }]);
        }
      }
    } catch (e) {
      console.error('Failed to load orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleAddPOItem = () => {
    if (medicines.length > 0) {
      setPoItems([
        ...poItems,
        { medicineId: medicines[0]._id, orderedQuantity: 50, unitCost: 100 },
      ]);
    }
  };

  const handleRemovePOItem = (index) => {
    const updated = [...poItems];
    updated.splice(index, 1);
    setPoItems(updated);
  };

  const handleCreatePO = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const res = await createPurchaseOrderApi({
        supplierId: poSupplierId,
        expectedDeliveryDate: poExpectedDate || undefined,
        notes: poNotes,
        items: poItems,
      });

      if (res.data.success) {
        setShowCreateModal(false);
        loadData();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to create PO');
    }
  };

  const openReceiveModal = (po) => {
    setSelectedPO(po);
    setInvoiceNumber(`INV-SUP-${Math.floor(1000 + Math.random() * 9000)}`);
    // Pre-populate items
    const items = po.items.map((item) => {
      const remaining = item.orderedQuantity - item.receivedQuantity;
      const today = new Date();
      const exp = new Date();
      exp.setDate(today.getDate() + 365);

      return {
        purchaseOrderItemId: item._id,
        medicineId: item.medicine?._id || item.medicine,
        medicineName: item.medicine?.name || 'Medicine',
        batchNumber: `BT-${Math.floor(100 + Math.random() * 900)}`,
        manufacturingDate: today.toISOString().split('T')[0],
        expiryDate: exp.toISOString().split('T')[0],
        quantityReceived: remaining > 0 ? remaining : 0,
        purchasePrice: item.unitCost,
        mrp: parseFloat((item.unitCost * 1.35).toFixed(2)),
        sellingPrice: parseFloat((item.unitCost * 1.25).toFixed(2)),
      };
    });
    setReceiveItems(items);
    setFormError('');
  };

  const handleReceiveSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const res = await receiveStockApi(selectedPO._id, {
        supplierInvoiceNumber: invoiceNumber,
        items: receiveItems,
      });

      if (res.data.success) {
        setSelectedPO(null);
        loadData();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to receive stock');
    }
  };

  return (
    <div className="flex flex-col w-full gap-space-lg">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-primary-container text-on-primary-container font-mono-data text-[11px] font-semibold uppercase">
              Procurement Desk
            </span>
            <span className="text-outline font-mono">•</span>
            <span className="text-tertiary font-semibold text-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> Goods Receipt Note (GRN) Enabled
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mt-1 font-bold">
            Purchase Orders & Stock Receipts
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Create replenishment purchase orders, validate delivery against order items, and ingest new batches into MongoDB.
          </p>
        </div>

        <button
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md shadow-md transition-all active:scale-95 cursor-pointer"
          onClick={() => setShowCreateModal(true)}
        >
          <span className="material-symbols-outlined text-lg">note_add</span>
          <span>+ Create Purchase Order</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-surface-container-low p-1 rounded-xl w-fit">
        {[
          { id: 'ALL', label: 'All Orders' },
          { id: 'PENDING', label: 'Pending Receipt' },
          { id: 'PARTIALLY_RECEIVED', label: 'Partially Received' },
          { id: 'RECEIVED', label: 'Completely Received' },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === tab.id
                ? 'bg-surface-container-lowest text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            onClick={() => setStatusFilter(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body-sm">
            <thead>
              <tr className="border-b border-surface-container text-outline text-[11px] uppercase tracking-wider font-semibold bg-surface-container-low/40">
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-4">Supplier Agency</th>
                <th className="py-3 px-3">Order Date</th>
                <th className="py-3 px-3">Ordered Items</th>
                <th className="py-3 px-3 text-right">Total Amount</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Stock Ingestion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {orders.length > 0 ? (
                orders.map((po) => (
                  <tr key={po._id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-primary text-sm">{po.orderNumber}</td>
                    <td className="py-3.5 px-4 font-bold text-on-surface text-sm">
                      {po.supplier?.companyName}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-xs text-outline">
                      {new Date(po.orderDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3.5 px-3 text-xs text-on-surface-variant">
                      {po.items?.length || 0} formulation lines
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold tabular-nums">
                      ₹ {po.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          po.status === 'RECEIVED'
                            ? 'bg-tertiary-container/15 text-tertiary'
                            : po.status === 'PARTIALLY_RECEIVED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-primary-container/20 text-primary'
                        }`}
                      >
                        {po.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {po.status !== 'RECEIVED' ? (
                        <button
                          className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold shadow-sm hover:bg-primary-container flex items-center justify-center gap-1 mx-auto"
                          onClick={() => openReceiveModal(po)}
                        >
                          <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                          <span>Receive Stock</span>
                        </button>
                      ) : (
                        <span className="text-outline font-mono text-xs">GRN Completed</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-outline text-sm">
                    {loading ? 'Loading orders from MongoDB...' : 'No purchase orders found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create PO */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Replenishment Purchase Order">
        <form onSubmit={handleCreatePO} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-error-container text-on-error-container text-sm">{formError}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-outline block mb-1">Select Supplier Wholesaler *</label>
              <select
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40"
                value={poSupplierId}
                onChange={(e) => setPoSupplierId(e.target.value)}
                required
              >
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.companyName} ({s.city})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-outline block mb-1">Expected Delivery Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40"
                value={poExpectedDate}
                onChange={(e) => setPoExpectedDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-outline uppercase tracking-wider">
                Order Items & Costs
              </label>
              <button
                type="button"
                className="text-xs text-primary font-bold hover:underline"
                onClick={handleAddPOItem}
              >
                + Add Another Formulation
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {poItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 p-2 rounded-lg bg-surface-container-low">
                  <div className="col-span-6">
                    <select
                      className="w-full px-2 py-1.5 text-xs rounded bg-surface-container-lowest border border-outline-variant/40"
                      value={item.medicineId}
                      onChange={(e) => {
                        const updated = [...poItems];
                        updated[index].medicineId = e.target.value;
                        setPoItems(updated);
                      }}
                    >
                      {medicines.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.name} ({m.dosageForm})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      min="1"
                      className="w-full px-2 py-1.5 text-xs rounded bg-surface-container-lowest border border-outline-variant/40"
                      placeholder="Qty"
                      value={item.orderedQuantity}
                      onChange={(e) => {
                        const updated = [...poItems];
                        updated[index].orderedQuantity = Number(e.target.value);
                        setPoItems(updated);
                      }}
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-2 py-1.5 text-xs rounded bg-surface-container-lowest border border-outline-variant/40"
                      placeholder="Cost (₹)"
                      value={item.unitCost}
                      onChange={(e) => {
                        const updated = [...poItems];
                        updated[index].unitCost = Number(e.target.value);
                        setPoItems(updated);
                      }}
                    />
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    {poItems.length > 1 && (
                      <button
                        type="button"
                        className="text-error"
                        onClick={() => handleRemovePOItem(index)}
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-outline block mb-1">Order Notes / Delivery Instructions</label>
            <input
              className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40"
              placeholder="e.g. Ensure cold chain packs for biologicals"
              value={poNotes}
              onChange={(e) => setPoNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-surface-container">
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-surface-container text-on-surface font-semibold text-sm"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-primary text-on-primary font-semibold text-sm shadow-md hover:bg-primary-container"
            >
              Place Purchase Order
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Receive Stock (GRN) */}
      <Modal
        isOpen={!!selectedPO}
        onClose={() => setSelectedPO(null)}
        title={`Goods Receipt (GRN): ${selectedPO?.orderNumber}`}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleReceiveSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-error-container text-on-error-container text-sm">{formError}</div>
          )}

          <div className="p-3 rounded-lg bg-surface-container-low text-xs flex justify-between">
            <span>Supplier: <strong>{selectedPO?.supplier?.companyName}</strong></span>
            <span>Total PO Cost: <strong>₹{selectedPO?.totalAmount.toFixed(2)}</strong></span>
          </div>

          <div>
            <label className="text-xs font-semibold text-outline block mb-1">Supplier Invoice / DC Number *</label>
            <input
              className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40 font-mono"
              placeholder="e.g. INV-APOLLO-9921"
              required
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-outline uppercase tracking-wider block">
              Batch Verification & Pricing Details for Ingested Stock
            </label>

            {receiveItems.map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-surface-container-low/60 border border-surface-container space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-on-surface">{item.medicineName}</span>
                  <span className="text-primary font-mono font-semibold">Line #{idx + 1}</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-outline block">Batch Number *</label>
                    <input
                      className="w-full px-2 py-1 text-xs rounded bg-surface-container-lowest border border-outline-variant/40 font-mono"
                      required
                      value={item.batchNumber}
                      onChange={(e) => {
                        const updated = [...receiveItems];
                        updated[idx].batchNumber = e.target.value;
                        setReceiveItems(updated);
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-outline block">Expiry Date *</label>
                    <input
                      type="date"
                      required
                      className="w-full px-2 py-1 text-xs rounded bg-surface-container-lowest border border-outline-variant/40"
                      value={item.expiryDate}
                      onChange={(e) => {
                        const updated = [...receiveItems];
                        updated[idx].expiryDate = e.target.value;
                        setReceiveItems(updated);
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-outline block">Qty Received *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      className="w-full px-2 py-1 text-xs rounded bg-surface-container-lowest border border-outline-variant/40 font-bold"
                      value={item.quantityReceived}
                      onChange={(e) => {
                        const updated = [...receiveItems];
                        updated[idx].quantityReceived = Number(e.target.value);
                        setReceiveItems(updated);
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-outline block">Selling Price (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="w-full px-2 py-1 text-xs rounded bg-surface-container-lowest border border-outline-variant/40 font-mono"
                      value={item.sellingPrice}
                      onChange={(e) => {
                        const updated = [...receiveItems];
                        updated[idx].sellingPrice = Number(e.target.value);
                        setReceiveItems(updated);
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-surface-container">
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-surface-container text-on-surface font-semibold text-sm"
              onClick={() => setSelectedPO(null)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-primary text-on-primary font-semibold text-sm shadow-md hover:bg-primary-container"
            >
              Ingest Stock & Create Batches
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PurchaseOrders;
