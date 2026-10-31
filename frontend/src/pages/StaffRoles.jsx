import React, { useState, useEffect } from 'react';
import { getUsersApi, getRolesApi, createUserApi, updateUserApi } from '../services/api';
import Modal from '../components/Modal';

const StaffRoles = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roleCode: 'PHARMACIST',
    licenseNumber: '',
    phone: '',
  });
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [uRes, rRes] = await Promise.all([getUsersApi(), getRolesApi()]);
      if (uRes.data.success) setUsers(uRes.data.data);
      if (rRes.data.success) setRoles(rRes.data.data);
    } catch (e) {
      console.error('Failed to load users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const res = await createUserApi(formData);
      if (res.data.success) {
        setShowAddModal(false);
        setFormData({
          name: '',
          email: '',
          password: '',
          roleCode: 'PHARMACIST',
          licenseNumber: '',
          phone: '',
        });
        loadData();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to create user');
    }
  };

  const toggleUserActive = async (user) => {
    try {
      await updateUserApi(user._id, { isActive: !user.isActive });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div className="flex flex-col w-full gap-space-lg">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-primary-container text-on-primary-container font-mono-data text-[11px] font-semibold uppercase">
              Security & Access
            </span>
            <span className="text-outline font-mono">•</span>
            <span className="text-tertiary font-semibold text-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> Role-Based Access Control (RBAC)
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mt-1 font-bold">
            Staff Users & Role Permissions
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Manage authorized dispensary accounts, pharmacist registration licenses, and access levels.
          </p>
        </div>

        <button
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md shadow-md transition-all active:scale-95 cursor-pointer"
          onClick={() => setShowAddModal(true)}
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          <span>+ Add Staff Member</span>
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body-sm">
            <thead>
              <tr className="border-b border-surface-container text-outline text-[11px] uppercase tracking-wider font-semibold bg-surface-container-low/40">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">License / Terminal ID</th>
                <th className="py-3 px-3">Mobile</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-surface-container-low transition-colors">
                  <td className="py-3.5 px-4 font-bold text-on-surface text-sm">{u.name}</td>
                  <td className="py-3.5 px-4 font-mono text-xs text-on-surface-variant">{u.email}</td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                        u.roleCode === 'ADMIN'
                          ? 'bg-secondary-fixed text-on-secondary-fixed-variant'
                          : u.roleCode === 'PHARMACIST'
                          ? 'bg-primary-container text-on-primary-container'
                          : 'bg-surface-container text-on-surface'
                      }`}
                    >
                      {u.roleCode}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-mono text-xs text-outline">{u.licenseNumber || 'None'}</td>
                  <td className="py-3.5 px-3 font-mono text-xs">{u.phone || 'N/A'}</td>
                  <td className="py-3.5 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        u.isActive ? 'bg-tertiary-container/15 text-tertiary' : 'bg-error-container text-on-error-container'
                      }`}
                    >
                      {u.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      className={`px-3 py-1 rounded text-xs font-semibold ${
                        u.isActive
                          ? 'bg-surface-container text-error hover:bg-error-container/30'
                          : 'bg-tertiary/10 text-tertiary hover:bg-tertiary-container'
                      }`}
                      onClick={() => toggleUserActive(u)}
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Staff Member">
        <form onSubmit={handleCreateUser} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-error-container text-on-error-container text-sm">{formError}</div>
          )}

          <div>
            <label className="text-xs font-semibold text-outline block mb-1">Full Name *</label>
            <input
              className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40"
              placeholder="e.g. Dr. Rajesh Rao"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-outline block mb-1">Email Address *</label>
              <input
                type="email"
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40"
                placeholder="name@pharmacare.in"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-outline block mb-1">Temporary Password *</label>
              <input
                type="password"
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40"
                placeholder="Secure passphrase"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-outline block mb-1">Access Role *</label>
              <select
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40"
                value={formData.roleCode}
                onChange={(e) => setFormData({ ...formData, roleCode: e.target.value })}
              >
                <option value="ADMIN">Administrator</option>
                <option value="PHARMACIST">Pharmacist</option>
                <option value="INVENTORY_MANAGER">Inventory Manager</option>
                <option value="BILLING">Billing Staff</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-outline block mb-1">License / Terminal ID</label>
              <input
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40"
                placeholder="e.g. REG-98124"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-outline block mb-1">Mobile Phone</label>
            <input
              className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40"
              placeholder="+91 98450 00000"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
              Create Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StaffRoles;
