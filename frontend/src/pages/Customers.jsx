import React, { useState, useEffect } from 'react';
import { getCustomersApi, createCustomerApi } from '../services/api';
import Modal from '../components/Modal';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    age: '',
    gender: 'Male',
    address: '',
  });
  const [formError, setFormError] = useState('');

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await getCustomersApi({ search, limit: 100 });
      if (res.data.success) setCustomers(res.data.data);
    } catch (e) {
      console.error('Failed to load customers:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const res = await createCustomerApi(formData);
      if (res.data.success) {
        setShowAddModal(false);
        setFormData({
          name: '',
          phone: '',
          email: '',
          age: '',
          gender: 'Male',
          address: '',
        });
        loadCustomers();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to add customer');
    }
  };

  return (
    <div className="flex flex-col w-full gap-space-lg">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-primary-container text-on-primary-container font-mono-data text-[11px] font-semibold uppercase">
              Patient Profiles
            </span>
            <span className="text-outline font-mono">•</span>
            <span className="text-tertiary font-semibold text-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> Active Customer Directory
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mt-1 font-bold">
            Customers & Patient Database
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Patient history, repeat dispensing records, contact information, and total spending ledger.
          </p>
        </div>

        <button
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md shadow-md transition-all active:scale-95 cursor-pointer"
          onClick={() => setShowAddModal(true)}
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          <span>+ Add Customer</span>
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="p-4 border-b border-surface-container">
          <input
            className="w-72 px-3 py-2 text-xs rounded-lg bg-surface-container-low border border-outline-variant/40 focus:outline-none"
            placeholder="Search customer name or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-body-sm">
            <thead>
              <tr className="border-b border-surface-container text-outline text-[11px] uppercase tracking-wider font-semibold bg-surface-container-low/40">
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Mobile Number</th>
                <th className="py-3 px-3">Age / Gender</th>
                <th className="py-3 px-3">Email</th>
                <th className="py-3 px-3 text-right">Total Visits</th>
                <th className="py-3 px-4 text-right">Total Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {customers.map((c) => (
                <tr key={c._id} className="hover:bg-surface-container-low transition-colors">
                  <td className="py-3.5 px-4 font-bold text-on-surface text-sm">{c.name}</td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-primary text-xs">{c.phone}</td>
                  <td className="py-3.5 px-3 text-xs text-on-surface-variant">
                    {c.age ? `${c.age} yrs` : 'N/A'} • {c.gender}
                  </td>
                  <td className="py-3.5 px-3 text-xs text-outline">{c.email || 'N/A'}</td>
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-sm tabular-nums">
                    {c.totalVisits}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-tertiary tabular-nums">
                    ₹ {c.totalSpent.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Register Customer / Patient">
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-error-container text-on-error-container text-sm">{formError}</div>
          )}

          <div>
            <label className="text-xs font-semibold text-outline block mb-1">Full Name *</label>
            <input
              className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40"
              placeholder="e.g. Ramesh Kumar"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-outline block mb-1">Mobile Phone *</label>
              <input
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40"
                placeholder="10-digit mobile"
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
                placeholder="patient@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-outline block mb-1">Age</label>
              <input
                type="number"
                min="0"
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40"
                placeholder="e.g. 45"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-outline block mb-1">Gender</label>
              <select
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-outline block mb-1">Address / Landmark</label>
            <input
              className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40"
              placeholder="e.g. Indiranagar, Bengaluru"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
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
              Save Customer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Customers;
