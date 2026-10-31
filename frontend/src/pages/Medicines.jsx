import React, { useState, useEffect } from 'react';
import {
  getMedicinesApi,
  createMedicineApi,
  updateMedicineApi,
  deleteMedicineApi,
  createBatchApi,
  getCategoriesApi,
} from '../services/api';
import Modal from '../components/Modal';

const Medicines = ({ onAddMedicineTrigger, resetTrigger }) => {
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDosageForm, setSelectedDosageForm] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState('ALL');
  const [stockStatus, setStockStatus] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedMedForBatch, setSelectedMedForBatch] = useState(null);

  // Form State for New Medicine
  const [newMed, setNewMed] = useState({
    name: '',
    genericName: '',
    categoryId: '',
    manufacturer: '',
    dosageForm: 'Tablet',
    strength: '',
    schedule: 'OTC',
    prescriptionRequired: false,
    barcode: '',
    hsnCode: '300490',
    gstRate: 12,
    reorderLevel: 20,
    rackLocation: 'A-01',
    batchNumber: '',
    expiryDate: '',
    purchasePrice: '',
    mrp: '',
    sellingPrice: '',
    quantity: '',
  });

  // Form State for Add Batch
  const [newBatch, setNewBatch] = useState({
    batchNumber: '',
    expiryDate: '',
    purchasePrice: '',
    mrp: '',
    sellingPrice: '',
    quantity: '',
  });

  const [formError, setFormError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [medRes, catRes] = await Promise.all([
        getMedicinesApi({
          search,
          category: selectedCategory || undefined,
          dosageForm: selectedDosageForm || undefined,
          schedule: selectedSchedule !== 'ALL' ? selectedSchedule : undefined,
          stockStatus: stockStatus || undefined,
          limit: 100,
        }),
        getCategoriesApi(),
      ]);

      if (medRes.data.success) setMedicines(medRes.data.data);
      if (catRes.data.success) setCategories(catRes.data.data);
    } catch (e) {
      console.error('Failed to load medicines:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedCategory, selectedDosageForm, selectedSchedule, stockStatus]);

  useEffect(() => {
    if (onAddMedicineTrigger) {
      setShowAddModal(true);
      if (resetTrigger) resetTrigger();
    }
  }, [onAddMedicineTrigger]);

  const handleCreateMedicine = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const payload = {
        name: newMed.name,
        genericName: newMed.genericName,
        categoryId: newMed.categoryId || (categories[0] ? categories[0]._id : undefined),
        manufacturer: newMed.manufacturer,
        dosageForm: newMed.dosageForm,
        strength: newMed.strength,
        schedule: newMed.schedule,
        prescriptionRequired: newMed.schedule.includes('Schedule H') || newMed.prescriptionRequired,
        barcode: newMed.barcode || undefined,
        hsnCode: newMed.hsnCode,
        gstRate: Number(newMed.gstRate || 12),
        reorderLevel: Number(newMed.reorderLevel || 20),
        rackLocation: newMed.rackLocation,
      };

      if (newMed.batchNumber && newMed.quantity) {
        payload.initialBatch = {
          batchNumber: newMed.batchNumber,
          expiryDate: newMed.expiryDate,
          purchasePrice: Number(newMed.purchasePrice || 0),
          mrp: Number(newMed.mrp || 0),
          sellingPrice: Number(newMed.sellingPrice || 0),
          quantity: Number(newMed.quantity || 0),
        };
      }

      const res = await createMedicineApi(payload);
      if (res.data.success) {
        setShowAddModal(false);
        setNewMed({
          name: '',
          genericName: '',
          categoryId: '',
          manufacturer: '',
          dosageForm: 'Tablet',
          strength: '',
          schedule: 'OTC',
          prescriptionRequired: false,
          barcode: '',
          hsnCode: '300490',
          gstRate: 12,
          reorderLevel: 20,
          rackLocation: 'A-01',
          batchNumber: '',
          expiryDate: '',
          purchasePrice: '',
          mrp: '',
          sellingPrice: '',
          quantity: '',
        });
        loadData();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to add medicine');
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const res = await createBatchApi({
        medicineId: selectedMedForBatch._id,
        batchNumber: newBatch.batchNumber,
        expiryDate: newBatch.expiryDate,
        purchasePrice: Number(newBatch.purchasePrice),
        mrp: Number(newBatch.mrp),
        sellingPrice: Number(newBatch.sellingPrice),
        quantity: Number(newBatch.quantity),
      });

      if (res.data.success) {
        setShowBatchModal(false);
        setNewBatch({
          batchNumber: '',
          expiryDate: '',
          purchasePrice: '',
          mrp: '',
          sellingPrice: '',
          quantity: '',
        });
        loadData();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to add batch');
    }
  };

  const handleDeleteMedicine = async (id, name) => {
    if (window.confirm(`Are you sure you want to deactivate "${name}"?`)) {
      try {
        await deleteMedicineApi(id);
        loadData();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to deactivate medicine');
      }
    }
  };

  // Summary Metrics
  const totalFormulations = medicines.length;
  const scheduleHCount = medicines.filter((m) => m.schedule?.includes('Schedule H')).length;
  const underReorderCount = medicines.filter((m) => m.totalStock <= m.reorderLevel).length;

  return (
    <div className="flex flex-col w-full gap-space-lg">
      {/* Top Header & Metrics Strip */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-xs">
            <span className="px-2 py-0.5 rounded bg-primary-container text-on-primary-container font-mono-data text-[11px] font-semibold tracking-wide uppercase">
              Catalog Registry
            </span>
            <span className="font-mono-data text-label-sm text-outline">•</span>
            <span className="font-mono-data text-label-sm text-tertiary font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span> MongoDB Sync Active
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mt-1 font-bold">
            Medicine Master Catalog & Drug Index
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Manage active pharmaceutical formulations, schedules, reorder points, and batch pricing structures.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md transition-all shadow-md active:scale-95 cursor-pointer"
            onClick={() => setShowAddModal(true)}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>+ Add New Medicine</span>
          </button>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/30 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">
              Formulations
            </span>
            <span className="font-headline-md text-headline-md text-on-surface mt-0.5 font-bold tabular-nums">
              {totalFormulations}
            </span>
            <span className="font-mono-data text-[11px] text-tertiary flex items-center gap-1 mt-1">
              Active Formulations
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[22px]">medication</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/30 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">
              Schedule H / H1
            </span>
            <span className="font-headline-md text-headline-md text-on-surface mt-0.5 font-bold tabular-nums">
              {scheduleHCount}
            </span>
            <span className="font-mono-data text-[11px] text-error flex items-center gap-1 mt-1">
              Rx Prescriber Mandatory
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-error-container/40 flex items-center justify-center text-error">
            <span className="material-symbols-outlined text-[22px]">warning</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/30 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">
              Under Reorder Point
            </span>
            <span className="font-headline-md text-headline-md text-secondary mt-0.5 font-bold tabular-nums">
              {underReorderCount}
            </span>
            <span className="font-mono-data text-[11px] text-secondary flex items-center gap-1 mt-1">
              POs Needed
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-[22px]">inventory_2</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/30 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">
              Categories
            </span>
            <span className="font-headline-md text-headline-md text-on-surface mt-0.5 font-bold tabular-nums">
              {categories.length}
            </span>
            <span className="font-mono-data text-[11px] text-tertiary flex items-center gap-1 mt-1">
              Therapeutic Groups
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface">
            <span className="material-symbols-outlined text-[22px]">category</span>
          </div>
        </div>
      </div>

      {/* Search & Multi-Filter Control Strip */}
      <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/30 flex flex-col gap-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">
              search
            </span>
            <input
              className="w-full pl-10 pr-24 py-2.5 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest border border-outline-variant/40 transition-all"
              placeholder="Search by Brand name, Generic formulation, HSN code or Barcode..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category Dropdown */}
          <div className="w-full lg:w-44">
            <select
              className="w-full py-2.5 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-sm border border-outline-variant/40 focus:outline-none"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dosage Form Dropdown */}
          <div className="w-full lg:w-40">
            <select
              className="w-full py-2.5 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-sm border border-outline-variant/40 focus:outline-none"
              value={selectedDosageForm}
              onChange={(e) => setSelectedDosageForm(e.target.value)}
            >
              <option value="">All Forms</option>
              <option value="Tablet">💊 Tablets</option>
              <option value="Capsule">Capsules</option>
              <option value="Inhaler">Inhalers</option>
              <option value="Suspension">Suspensions</option>
              <option value="Gel">Gels</option>
            </select>
          </div>

          {/* Schedule Dropdown */}
          <div className="w-full lg:w-44">
            <select
              className="w-full py-2.5 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-sm border border-outline-variant/40 focus:outline-none"
              value={selectedSchedule}
              onChange={(e) => setSelectedSchedule(e.target.value)}
            >
              <option value="ALL">All Schedules</option>
              <option value="OTC">OTC (Over the Counter)</option>
              <option value="Schedule H">Schedule H</option>
              <option value="Schedule H1">Schedule H1</option>
            </select>
          </div>

          {/* Stock Filter */}
          <div className="w-full lg:w-40">
            <select
              className="w-full py-2.5 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-sm border border-outline-variant/40 focus:outline-none"
              value={stockStatus}
              onChange={(e) => setStockStatus(e.target.value)}
            >
              <option value="">All Stock</option>
              <option value="low">Under Reorder Point</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Medicines Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body-sm">
            <thead>
              <tr className="border-b border-surface-container text-outline text-[11px] uppercase tracking-wider font-semibold bg-surface-container-low/40">
                <th className="py-3 px-4">Brand / Molecule</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-3">Schedule</th>
                <th className="py-3 px-3">Rack</th>
                <th className="py-3 px-3">Active Batch</th>
                <th className="py-3 px-3 text-right">Selling Price</th>
                <th className="py-3 px-3 text-right">Stock</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {medicines.length > 0 ? (
                medicines.map((med) => {
                  const batch = med.primaryBatch || (med.batches && med.batches[0]);
                  const isLow = med.totalStock <= med.reorderLevel;

                  return (
                    <tr key={med._id} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-on-surface text-sm">{med.name}</div>
                        <div className="text-xs text-outline font-mono">
                          {med.genericName} • {med.dosageForm} ({med.strength})
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-on-surface-variant font-medium">
                        {med.category?.name || 'General'}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            med.schedule?.includes('Schedule H')
                              ? 'bg-error-container/40 text-error'
                              : 'bg-tertiary-container/15 text-tertiary'
                          }`}
                        >
                          {med.schedule}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-xs">{med.rackLocation || 'A-01'}</td>
                      <td className="py-3.5 px-3">
                        {batch ? (
                          <div>
                            <span className="font-mono text-xs font-semibold text-primary">{batch.batchNumber}</span>
                            <div className="text-[10px] text-outline font-mono">
                              Exp: {new Date(batch.expiryDate).toLocaleDateString('en-IN', { month: '2-digit', year: 'numeric' })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-outline text-xs">No batches</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-on-surface tabular-nums">
                        ₹ {batch ? batch.sellingPrice.toFixed(2) : '0.00'}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <span
                          className={`font-mono font-bold text-sm tabular-nums ${
                            isLow ? 'text-amber-600 bg-amber-50 px-2 py-0.5 rounded' : 'text-on-surface'
                          }`}
                        >
                          {med.totalStock}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            className="px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high text-primary text-xs font-semibold"
                            onClick={() => {
                              setSelectedMedForBatch(med);
                              setShowBatchModal(true);
                            }}
                            title="Add Batch"
                          >
                            + Batch
                          </button>
                          <button
                            className="p-1 rounded text-outline hover:text-error hover:bg-error-container/30 transition-colors"
                            onClick={() => handleDeleteMedicine(med._id, med.name)}
                            title="Deactivate"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-outline text-sm">
                    {loading ? 'Loading catalog from MongoDB...' : 'No medicines matched the filter criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New Medicine */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Medicine Formulation">
        <form onSubmit={handleCreateMedicine} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-error-container text-on-error-container text-sm">{formError}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-outline block mb-1">Brand Name *</label>
              <input
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g. Dolo 650mg Tablet"
                required
                value={newMed.name}
                onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-outline block mb-1">Generic / Molecule Name *</label>
              <input
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g. Paracetamol IP"
                required
                value={newMed.genericName}
                onChange={(e) => setNewMed({ ...newMed, genericName: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-outline block mb-1">Category</label>
              <select
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40 focus:outline-none"
                value={newMed.categoryId}
                onChange={(e) => setNewMed({ ...newMed, categoryId: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-outline block mb-1">Dosage Form</label>
              <select
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40 focus:outline-none"
                value={newMed.dosageForm}
                onChange={(e) => setNewMed({ ...newMed, dosageForm: e.target.value })}
              >
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Syrup">Syrup</option>
                <option value="Inhaler">Inhaler</option>
                <option value="Injection">Injection</option>
                <option value="Gel">Gel</option>
                <option value="Drops">Drops</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-outline block mb-1">Strength</label>
              <input
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40 focus:outline-none"
                placeholder="e.g. 650mg"
                value={newMed.strength}
                onChange={(e) => setNewMed({ ...newMed, strength: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-outline block mb-1">Schedule</label>
              <select
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40 focus:outline-none"
                value={newMed.schedule}
                onChange={(e) => setNewMed({ ...newMed, schedule: e.target.value })}
              >
                <option value="OTC">OTC</option>
                <option value="Schedule H">Schedule H</option>
                <option value="Schedule H1">Schedule H1</option>
                <option value="Schedule X">Schedule X</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-outline block mb-1">Manufacturer *</label>
              <input
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40 focus:outline-none"
                placeholder="e.g. Micro Labs Ltd"
                required
                value={newMed.manufacturer}
                onChange={(e) => setNewMed({ ...newMed, manufacturer: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-outline block mb-1">Rack Location</label>
              <input
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40 focus:outline-none"
                placeholder="e.g. A-14"
                value={newMed.rackLocation}
                onChange={(e) => setNewMed({ ...newMed, rackLocation: e.target.value })}
              />
            </div>
          </div>

          {/* Initial Opening Batch */}
          <div className="p-3 rounded-xl bg-surface-container-low/50 border border-surface-container space-y-3">
            <h4 className="font-semibold text-xs text-primary uppercase tracking-wider">
              Initial Stock Batch (Optional)
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-outline block mb-1">Batch Number</label>
                <input
                  className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-container-lowest border border-outline-variant/40"
                  placeholder="e.g. DL-884"
                  value={newMed.batchNumber}
                  onChange={(e) => setNewMed({ ...newMed, batchNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[11px] text-outline block mb-1">Expiry Date</label>
                <input
                  type="date"
                  className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-container-lowest border border-outline-variant/40"
                  value={newMed.expiryDate}
                  onChange={(e) => setNewMed({ ...newMed, expiryDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[11px] text-outline block mb-1">Initial Quantity</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-container-lowest border border-outline-variant/40"
                  placeholder="e.g. 50"
                  value={newMed.quantity}
                  onChange={(e) => setNewMed({ ...newMed, quantity: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-outline block mb-1">Purchase Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-container-lowest border border-outline-variant/40"
                  placeholder="22.00"
                  value={newMed.purchasePrice}
                  onChange={(e) => setNewMed({ ...newMed, purchasePrice: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[11px] text-outline block mb-1">MRP (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-container-lowest border border-outline-variant/40"
                  placeholder="33.00"
                  value={newMed.mrp}
                  onChange={(e) => setNewMed({ ...newMed, mrp: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[11px] text-outline block mb-1">Selling Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-container-lowest border border-outline-variant/40"
                  placeholder="30.50"
                  value={newMed.sellingPrice}
                  onChange={(e) => setNewMed({ ...newMed, sellingPrice: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-surface-container">
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-surface-container text-on-surface font-semibold text-sm"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-primary text-on-primary font-semibold text-sm shadow-md hover:bg-primary-container"
            >
              Save Medicine
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Batch */}
      <Modal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        title={`Add Batch for: ${selectedMedForBatch?.name}`}
      >
        <form onSubmit={handleCreateBatch} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-error-container text-on-error-container text-sm">{formError}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-outline block mb-1">Batch Number *</label>
              <input
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40 focus:outline-none"
                placeholder="e.g. BT-991"
                required
                value={newBatch.batchNumber}
                onChange={(e) => setNewBatch({ ...newBatch, batchNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-outline block mb-1">Expiry Date *</label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40 focus:outline-none"
                value={newBatch.expiryDate}
                onChange={(e) => setNewBatch({ ...newBatch, expiryDate: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-outline block mb-1">Quantity *</label>
              <input
                type="number"
                min="1"
                required
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40 focus:outline-none"
                placeholder="e.g. 100"
                value={newBatch.quantity}
                onChange={(e) => setNewBatch({ ...newBatch, quantity: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-outline block mb-1">Purchase Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40 focus:outline-none"
                placeholder="80.00"
                value={newBatch.purchasePrice}
                onChange={(e) => setNewBatch({ ...newBatch, purchasePrice: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-outline block mb-1">Selling Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40 focus:outline-none"
                placeholder="110.00"
                value={newBatch.sellingPrice}
                onChange={(e) => setNewBatch({ ...newBatch, sellingPrice: e.target.value, mrp: newBatch.mrp || e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-surface-container">
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-surface-container text-on-surface font-semibold text-sm"
              onClick={() => setShowBatchModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-primary text-on-primary font-semibold text-sm shadow-md hover:bg-primary-container"
            >
              Add Batch to Stock
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Medicines;
