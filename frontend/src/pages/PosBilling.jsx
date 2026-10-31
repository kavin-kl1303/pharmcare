import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMedicinesApi, getCustomersApi, createSaleApi } from '../services/api';

const PosBilling = ({ initialMedicine = null }) => {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Cart state
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorMci, setDoctorMci] = useState('');
  const [customers, setCustomers] = useState([]);

  // Invoice / Print State
  const [completedSale, setCompletedSale] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch medicines
  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const res = await getMedicinesApi({ search, limit: 100 });
      if (res.data.success) {
        setMedicines(res.data.data);
      }
    } catch (e) {
      console.error('Failed to load medicines:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
    // Load customers for quick pick
    getCustomersApi({ limit: 10 }).then((res) => {
      if (res.data.success) setCustomers(res.data.data);
    });
  }, [search]);

  // If passed an initial medicine from dashboard quick sale
  useEffect(() => {
    if (initialMedicine) {
      addToCart(initialMedicine);
    }
  }, [initialMedicine]);

  const addToCart = (med) => {
    setErrorMsg('');
    const availableBatch = med.primaryBatch || (med.batches && med.batches[0]);
    if (!availableBatch || availableBatch.quantity <= 0) {
      setErrorMsg(`No stock available for ${med.name}`);
      return;
    }

    // Check if expired
    if (new Date(availableBatch.expiryDate) <= new Date()) {
      setErrorMsg(`Batch ${availableBatch.batchNumber} of ${med.name} is expired! Blocked from sales.`);
      return;
    }

    const existingIndex = cart.findIndex((item) => item.medicineId === med._id && item.batchId === availableBatch._id);

    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty + 1 > availableBatch.quantity) {
        setErrorMsg(`Only ${availableBatch.quantity} units available in batch ${availableBatch.batchNumber}`);
        return;
      }
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          medicineId: med._id,
          medicineName: med.name,
          genericName: med.genericName,
          schedule: med.schedule,
          prescriptionRequired: med.prescriptionRequired,
          batchId: availableBatch._id,
          batchNumber: availableBatch.batchNumber,
          expiryDate: availableBatch.expiryDate,
          sellingPrice: availableBatch.sellingPrice,
          purchasePrice: availableBatch.purchasePrice,
          mrp: availableBatch.mrp,
          gstRate: med.gstRate || 12,
          quantity: 1,
          maxStock: availableBatch.quantity,
        },
      ]);
    }
  };

  const updateQuantity = (index, delta) => {
    const updated = [...cart];
    const item = updated[index];
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      updated.splice(index, 1);
    } else if (newQty > item.maxStock) {
      setErrorMsg(`Cannot add more than ${item.maxStock} units for batch ${item.batchNumber}`);
      return;
    } else {
      item.quantity = newQty;
    }
    setCart(updated);
  };

  const removeFromCart = (index) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  const taxTotal = cart.reduce((sum, item) => sum + ((item.sellingPrice * item.quantity * item.gstRate) / 100), 0);
  const totalAmount = Math.max(0, subtotal + taxTotal - Number(discount || 0));

  const hasScheduleH = cart.some((i) => i.prescriptionRequired || i.schedule?.includes('Schedule H'));

  // Checkout submission
  const handleCheckout = async () => {
    if (cart.length === 0) {
      setErrorMsg('Cart is empty. Please add items to checkout.');
      return;
    }

    if (hasScheduleH && !doctorName.trim()) {
      setErrorMsg('Prescribing Doctor Name is required for Schedule H/H1 medications.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim(),
        doctorName: doctorName.trim(),
        doctorMciNumber: doctorMci.trim(),
        discountAmount: Number(discount || 0),
        paymentMethod,
        terminalId: 'POS-01',
        items: cart.map((i) => ({
          medicineId: i.medicineId,
          batchId: i.batchId,
          medicineName: i.medicineName,
          quantity: i.quantity,
        })),
      };

      const res = await createSaleApi(payload);
      if (res.data.success) {
        setCompletedSale(res.data.data);
        setCart([]);
        setDiscount(0);
        // Refresh medicines stock
        fetchMedicines();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to complete sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Tablet count
  const tabletCount = medicines.filter(
    (m) => m.dosageForm?.toLowerCase() === 'tablet' || m.name?.toLowerCase().includes('tablet')
  ).length;

  // Filter medicines by category or dosage form
  const filteredMedicines = selectedCategory === 'ALL'
    ? medicines
    : selectedCategory === 'Tablets'
    ? medicines.filter((m) => m.dosageForm?.toLowerCase() === 'tablet' || m.name?.toLowerCase().includes('tablet'))
    : medicines.filter((m) => {
        const catName = m.category?.name || '';
        return catName.toLowerCase().includes(selectedCategory.toLowerCase());
      });

  return (
    <div className="flex flex-col w-full gap-space-md">
      {/* Top Utility Bar: Terminal Status & Shortcuts */}
      <div className="flex flex-wrap items-center justify-between gap-space-sm bg-surface-container-lowest px-space-lg py-2.5 rounded-xl shadow-sm border border-outline-variant/30">
        <div className="flex items-center gap-space-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-tertiary animate-pulse"></span>
            <span className="font-headline-sm text-headline-sm text-on-surface font-bold">Terminal POS-01</span>
          </div>
          <span className="text-outline-variant font-mono-data text-body-sm">•</span>
          <div className="flex items-center gap-1.5 text-on-surface-variant font-body-sm text-body-sm">
            <span className="material-symbols-outlined text-[18px] text-primary">badge</span>
            <span>
              Dispensing Pharmacist:{' '}
              <strong className="text-on-surface font-semibold">{user?.name || 'Dr. Priya Sharma'}</strong> (
              {user?.licenseNumber || 'REG-64821'})
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-tertiary-container/15 text-tertiary font-label-sm text-label-sm uppercase tracking-wider font-semibold">
            Online Sync OK
          </span>
        </div>

        {/* Shortcuts */}
        <div className="hidden md:flex items-center gap-space-xs text-on-surface-variant font-mono-data text-[11px]">
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-surface-container-low">
            <kbd className="px-1 py-0.5 rounded bg-surface-container-high text-on-surface font-bold text-[10px]">F2</kbd>
            <span>Search</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-surface-container-low">
            <kbd className="px-1 py-0.5 rounded bg-surface-container-high text-on-surface font-bold text-[10px]">F8</kbd>
            <span>Checkout</span>
          </div>
        </div>
      </div>

      {/* Main POS Split Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter items-start">
        {/* LEFT PANEL (7 cols): Catalog, Fast Search & Stock Picker */}
        <section className="xl:col-span-7 flex flex-col gap-space-md">
          {/* Search Deck */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/30 flex flex-col gap-space-sm">
            <div className="relative w-full flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-primary text-[24px]">
                barcode_scanner
              </span>
              <input
                autoFocus
                className="w-full pl-12 pr-28 py-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all border border-outline-variant/40"
                id="medicine-search-input"
                placeholder="Scan barcode or type to search medicines, molecules, rack locations..."
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="absolute right-3 flex items-center gap-1.5">
                <span className="px-2 py-1 rounded bg-primary text-on-primary font-mono-data text-[11px] font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">sensors</span> LASER READY
                </span>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5">
              {[
                { id: 'ALL', label: `All Items (${medicines.length})` },
                { id: 'Tablets', label: `💊 Tablets (${tabletCount})` },
                { id: 'Pain Relief', label: 'Pain Relief' },
                { id: 'Antibiotics', label: 'Antibiotics' },
                { id: 'Antidiabetics', label: 'Antidiabetics' },
                { id: 'Cardiac', label: 'Cardiac' },
                { id: 'GI', label: 'Gastrointestinal' },
                { id: 'Vitamins', label: 'Vitamins & Supplements' },
                { id: 'OTC', label: 'OTC & Wellness' },
                { id: 'Respiratory', label: 'Inhalers & Respiratory' },
              ].map((c) => (
                <button
                  key={c.id}
                  className={`px-3 py-1.5 rounded-lg font-label-md text-label-md whitespace-nowrap transition-all ${
                    selectedCategory === c.id
                      ? 'bg-primary text-on-primary shadow-sm font-semibold'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                  onClick={() => setSelectedCategory(c.id)}
                  type="button"
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Compliance Notice */}
          <div className="bg-secondary-fixed/30 rounded-xl p-space-sm flex items-center justify-between text-on-secondary-fixed-variant border border-secondary-fixed">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-secondary">verified_user</span>
              <span className="font-body-sm text-body-sm">
                CDSCO Schedule H/H1 Verification active • Prescriber details prompted on cart addition
              </span>
            </div>
            <span className="font-mono-data text-[11px] text-secondary font-semibold">G.S.R. 598(E)</span>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-error-container text-on-error-container text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">warning</span>
                <span>{errorMsg}</span>
              </div>
              <button onClick={() => setErrorMsg('')} className="text-xs font-semibold hover:underline">
                Dismiss
              </button>
            </div>
          )}

          {/* Medicines Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm">
            {filteredMedicines.map((med) => {
              const batch = med.primaryBatch || (med.batches && med.batches[0]);
              const inStock = batch ? batch.quantity : 0;
              const isLow = inStock <= med.reorderLevel;
              const isTablet = med.dosageForm?.toLowerCase() === 'tablet' || med.name?.toLowerCase().includes('tablet');

              return (
                <div
                  key={med._id}
                  className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/30 flex flex-col justify-between hover:shadow-md hover:border-primary/40 transition-all group"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                          {isTablet ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono-data bg-primary/10 text-primary font-bold">
                              💊 TABLET
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono-data bg-surface-container text-on-surface-variant font-semibold uppercase">
                              {med.dosageForm || 'MEDICINE'}
                            </span>
                          )}
                          {med.strength && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono-data bg-surface-container-low text-on-surface-variant">
                              {med.strength}
                            </span>
                          )}
                        </div>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold leading-tight">
                          {med.name}
                        </h3>
                        <span className="font-body-sm text-body-sm text-outline">
                          {med.genericName} • {med.manufacturer}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded font-label-sm text-label-sm whitespace-nowrap ${
                          med.prescriptionRequired
                            ? 'bg-error-container/40 text-error font-semibold'
                            : 'bg-tertiary-container/15 text-tertiary font-semibold'
                        }`}
                      >
                        {med.schedule}
                      </span>
                    </div>

                    {batch && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-on-surface-variant font-mono-data text-mono-data text-xs">
                        <span className="px-2 py-0.5 rounded bg-surface-container-low">Batch: {batch.batchNumber}</span>
                        <span className="px-2 py-0.5 rounded bg-surface-container-low text-tertiary">
                          Exp: {new Date(batch.expiryDate).toLocaleDateString('en-IN', { month: '2-digit', year: 'numeric' })}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-surface-container-low">Rack: {med.rackLocation}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 flex items-center justify-between bg-surface-container-low/50 px-2 py-1.5 rounded-lg border border-surface-container">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-outline">
                        Stock:{' '}
                        <strong className={`font-semibold font-mono-data ${isLow ? 'text-amber-600' : 'text-on-surface'}`}>
                          {inStock} units
                        </strong>
                      </span>
                      <span className="font-headline-sm text-headline-sm text-primary font-bold font-mono-data">
                        ₹ {batch ? batch.sellingPrice.toFixed(2) : '0.00'}
                      </span>
                    </div>

                    <button
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md transition-transform active:scale-95 shadow-sm disabled:opacity-40"
                      disabled={inStock <= 0}
                      onClick={() => addToCart(med)}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                      <span>Add +</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* RIGHT PANEL (5 cols): Cart, Customer & Checkout Tender */}
        <section className="xl:col-span-5 flex flex-col gap-space-md">
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/30 flex flex-col gap-4">
            {/* Cart Header */}
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">shopping_cart</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Dispensing Cart ({cart.length})
                </h3>
              </div>
              {cart.length > 0 && (
                <button
                  className="text-xs text-error hover:underline cursor-pointer"
                  onClick={() => setCart([])}
                >
                  Clear Cart
                </button>
              )}
            </div>

            {/* Customer & Prescriber Details */}
            <div className="space-y-2.5 p-3 rounded-lg bg-surface-container-low/60 border border-surface-container">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-outline uppercase tracking-wider block mb-1">
                    Customer Name
                  </label>
                  <input
                    className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-container-lowest border border-outline-variant/40 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Walk-in Customer"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-outline uppercase tracking-wider block mb-1">
                    Customer Phone
                  </label>
                  <input
                    className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-container-lowest border border-outline-variant/40 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="10-digit mobile"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
              </div>

              {hasScheduleH && (
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-surface-container">
                  <div>
                    <label className="text-[11px] font-semibold text-error uppercase tracking-wider block mb-1">
                      Doctor Name *
                    </label>
                    <input
                      className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-container-lowest border border-error/40 text-on-surface focus:outline-none focus:ring-1 focus:ring-error"
                      placeholder="Dr. Prescriber"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-outline uppercase tracking-wider block mb-1">
                      MCI / Reg No
                    </label>
                    <input
                      className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-container-lowest border border-outline-variant/40 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="e.g. KMC-64821"
                      value={doctorMci}
                      onChange={(e) => setDoctorMci(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Cart Items List */}
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto divide-y divide-surface-container">
              {cart.length > 0 ? (
                cart.map((item, idx) => (
                  <div key={idx} className="pt-2 flex items-center justify-between text-xs">
                    <div className="flex flex-col flex-1 pr-2">
                      <span className="font-semibold text-on-surface text-sm leading-tight">{item.medicineName}</span>
                      <span className="text-outline font-mono text-[11px]">
                        Batch: {item.batchNumber} • ₹{item.sellingPrice.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-outline-variant/40 rounded-lg bg-surface-container-lowest overflow-hidden">
                        <button
                          className="px-2 py-1 hover:bg-surface-container transition-colors"
                          onClick={() => updateQuantity(idx, -1)}
                        >
                          -
                        </button>
                        <span className="px-2.5 font-mono font-bold text-on-surface">{item.quantity}</span>
                        <button
                          className="px-2 py-1 hover:bg-surface-container transition-colors"
                          onClick={() => updateQuantity(idx, 1)}
                        >
                          +
                        </button>
                      </div>

                      <div className="w-16 text-right font-mono font-bold text-sm text-primary">
                        ₹{(item.sellingPrice * item.quantity).toFixed(2)}
                      </div>

                      <button
                        className="text-outline hover:text-error transition-colors p-1"
                        onClick={() => removeFromCart(idx)}
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-outline text-sm">
                  Cart is empty. Select medicines from the catalog on the left.
                </div>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 pt-3 border-t border-surface-container text-xs">
              <div className="flex justify-between text-on-surface-variant">
                <span>Subtotal (Net Items):</span>
                <span className="font-mono font-semibold">₹ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>GST (Tax):</span>
                <span className="font-mono font-semibold">₹ {taxTotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-on-surface-variant">
                <span>Discount (₹):</span>
                <input
                  type="number"
                  min="0"
                  className="w-20 px-2 py-0.5 text-right font-mono rounded bg-surface-container-low border border-outline-variant/40 text-xs"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </div>
              <div className="flex justify-between pt-2 border-t border-surface-container font-headline-sm text-headline-sm font-bold text-on-surface">
                <span>Total Amount:</span>
                <span className="text-primary font-mono tabular-nums">₹ {totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5 pt-2">
              <label className="text-[11px] font-semibold text-outline uppercase tracking-wider block">
                Tender Payment Method
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'CASH', icon: 'payments', label: 'Cash' },
                  { id: 'UPI', icon: 'qr_code_2', label: 'UPI' },
                  { id: 'CARD', icon: 'credit_card', label: 'Card' },
                  { id: 'NET_BANKING', icon: 'account_balance', label: 'NetBank' },
                ].map((pm) => (
                  <button
                    key={pm.id}
                    className={`py-2 px-1 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      paymentMethod === pm.id
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                    }`}
                    onClick={() => setPaymentMethod(pm.id)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">{pm.icon}</span>
                    <span>{pm.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Complete Checkout Button */}
            <button
              className="w-full py-3 rounded-xl bg-primary text-on-primary hover:bg-primary-container font-headline-sm text-headline-sm font-bold shadow-md transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={cart.length === 0 || isSubmitting}
              onClick={handleCheckout}
              type="button"
            >
              {isSubmitting ? (
                <span>Validating & Dispensing...</span>
              ) : (
                <>
                  <span className="material-symbols-outlined">receipt</span>
                  <span>Confirm Dispense & Bill (F8)</span>
                </>
              )}
            </button>
          </div>
        </section>
      </div>

      {/* Invoice Modal for Printing */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-sm">
          <div className="bg-surface-container-lowest max-w-lg w-full rounded-2xl shadow-2xl p-6 border border-outline-variant/40 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div className="flex items-center gap-2 text-tertiary">
                <span className="material-symbols-outlined text-2xl">check_circle</span>
                <span className="font-bold text-lg">Sale Dispensed Successfully!</span>
              </div>
              <button
                className="text-outline hover:text-on-surface"
                onClick={() => setCompletedSale(null)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Printable Invoice Container */}
            <div id="printable-invoice" className="bg-white p-4 rounded-lg border border-dashed border-outline-variant text-xs space-y-3 font-mono text-gray-800">
              <div className="text-center space-y-0.5 border-b border-gray-200 pb-2">
                <h2 className="font-bold text-base text-gray-900">PHARMACARE DISPENSARY</h2>
                <p>Apollo Branch #104, Indiranagar, Bengaluru</p>
                <p>GSTIN: 29AAAAA0000A1Z5 • DL: KA-BLR-64821</p>
              </div>

              <div className="flex justify-between border-b border-gray-200 pb-2">
                <div>
                  <p><strong>Invoice:</strong> {completedSale.invoiceNumber}</p>
                  <p><strong>Date:</strong> {new Date(completedSale.createdAt).toLocaleString('en-IN')}</p>
                  <p><strong>Customer:</strong> {completedSale.customerName}</p>
                </div>
                <div className="text-right">
                  <p><strong>Terminal:</strong> POS-01</p>
                  <p><strong>Pharmacist:</strong> {completedSale.dispensedBy?.name}</p>
                  {completedSale.doctorName && <p><strong>Dr:</strong> {completedSale.doctorName}</p>}
                </div>
              </div>

              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-1">Item</th>
                    <th className="py-1 text-center">Batch</th>
                    <th className="py-1 text-center">Qty</th>
                    <th className="py-1 text-right">Price</th>
                    <th className="py-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {completedSale.items?.map((item, i) => (
                    <tr key={i}>
                      <td className="py-1">{item.medicineName}</td>
                      <td className="py-1 text-center">{item.batchNumber}</td>
                      <td className="py-1 text-center">{item.quantity}</td>
                      <td className="py-1 text-right">₹{item.unitPrice.toFixed(2)}</td>
                      <td className="py-1 text-right">₹{item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-gray-200 pt-2 space-y-1 text-right">
                <p>Subtotal: ₹{completedSale.subtotal.toFixed(2)}</p>
                <p>GST Tax: ₹{completedSale.taxAmount.toFixed(2)}</p>
                {completedSale.discountAmount > 0 && <p>Discount: -₹{completedSale.discountAmount.toFixed(2)}</p>}
                <p className="font-bold text-sm text-gray-900">
                  GRAND TOTAL: ₹{completedSale.totalAmount.toFixed(2)}
                </p>
                <p className="text-[10px] text-gray-500">Paid via {completedSale.payment?.paymentMethod || 'CASH'}</p>
              </div>

              <div className="text-center pt-2 text-[10px] text-gray-500 border-t border-gray-200">
                Thank you for choosing PharmaCare. Wish you a speedy recovery!
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                className="flex-1 py-2.5 rounded-lg bg-primary text-on-primary font-bold flex items-center justify-center gap-1.5 shadow-sm hover:bg-primary-container"
                onClick={handlePrint}
              >
                <span className="material-symbols-outlined text-lg">print</span>
                Print Thermal Invoice
              </button>
              <button
                className="px-4 py-2.5 rounded-lg bg-surface-container text-on-surface font-semibold hover:bg-surface-container-high"
                onClick={() => setCompletedSale(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PosBilling;
