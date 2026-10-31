import React, { useState, useEffect } from 'react';
import { getSuppliersApi, createSupplierApi } from '../services/api';
import Modal from '../components/Modal';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    gstin: '',
    drugLicenseNumber: '',
    address: '',
    city: 'Bengaluru',
  });
  const [formError, setFormError] = useState('');

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const res = await getSuppliersApi({ search });
      if (res.data.success) setSuppliers(res.data.data);
    } catch (e) {
      console.error('Failed to load suppliers:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const res = await createSupplierApi(formData);
      if (res.data.success) {
        setShowAddModal(false);
        setFormData({
          name: '',
          companyName: '',
          email: '',
          phone: '',
          gstin: '',
          drugLicenseNumber: '',
          address: '',
          city: 'Bengaluru',
        });
        loadSuppliers();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to add supplier');
    }
  };

  return (
    <div className="flex flex-col w-full gap-space-lg">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-primary-container text-on-primary-container font-mono-data text-[11px] font-semibold uppercase">
              Supply Chain
            </span>
            <span className="text-outline font-mono">•</span>
            <span className="text-tertiary font-semibold text-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> Verified Wholesaler Directory
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mt-1 font-bold">
            Suppliers & Wholesale Distributors
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Manage pharmaceutical distributor contacts, GSTIN numbers, and wholesale drug licenses.
          </p>
        </div>

        <button
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md shadow-md transition-all active:scale-95 cursor-pointer"
          onClick={() => setShowAddModal(true)}
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          <span>+ Add Supplier</span>
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="p-4 border-b border-surface-container">
          <input
            className="w-72 px-3 py-2 text-xs rounded-lg bg-surface-container-low border border-outline-variant/40 focus:outline-none"
            placeholder="Search company name, GSTIN or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-body-sm">
            <thead>
              <tr className="border-b border-surface-container text-outline text-[11px] uppercase tracking-wider font-semibold bg-surface-container-low/40">
                <th className="py-3 px-4">Distributor Company</th>
                <th className="py-3 px-4">Contact Person</th>
                <th className="py-3 px-3">Phone & Email</th>
                <th className="py-3 px-3">GSTIN</th>
                <th className="py-3 px-3">Drug License #</th>
                <th className="py-3 px-4">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {suppliers.map((sup) => (
                <tr key={sup._id} className="hover:bg-surface-container-low transition-colors">
                  <td className="py-3.5 px-4 font-bold text-on-surface text-sm">{sup.companyName}</td>
                  <td className="py-3.5 px-4 text-on-surface-variant font-medium">{sup.name}</td>
                  <td className="py-3.5 px-3">
                    <div className="font-mono text-xs text-on-surface">{sup.phone}</div>
                    <div className="text-outline text-xs">{sup.email || 'N/A'}</div>
                  </td>
                  <td className="py-3.5 px-3 font-mono text-xs font-semibold text-primary">{sup.gstin || 'N/A'}</td>
                  <td className="py-3.5 px-3 font-mono text-xs text-outline">{sup.drugLicenseNumber || 'N/A'}</td>
                  <td className="py-3.5 px-4 text-xs text-on-surface-variant">{sup.city || 'India'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Register Wholesale Supplier">
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-error-container text-on-error-container text-sm">{formError}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-outline block mb-1">Company / Agency Name *</label>
              <input
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40"
                placeholder="e.g. Apollo Medsource Ltd"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-outline block mb-1">Contact Person Name *</label>
              <input
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40"
                placeholder="e.g. Sunil Mehta"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-outline block mb-1">Phone *</label>
              <input
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40"
                placeholder="+91 80 2554 9901"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-outline block mb-1">Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40"
                placeholder="orders@wholesaler.in"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-outline block mb-1">GSTIN</label>
              <input
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40 font-mono"
                placeholder="29AAAAA0000A1Z5"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-outline block mb-1">Drug License Number</label>
              <input
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40 font-mono"
                placeholder="KA-BLR-2023-0012"
                value={formData.drugLicenseNumber}
                onChange={(e) => setFormData({ ...formData, drugLicenseNumber: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-outline block mb-1">Address</label>
              <input
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40"
                placeholder="Industrial Area, 2nd Phase"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-outline block mb-1">City</label>
              <input
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
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
              Save Supplier
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Suppliers;
