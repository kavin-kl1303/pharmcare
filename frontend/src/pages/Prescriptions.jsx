import React, { useState, useEffect } from 'react';
import { getPrescriptionsApi, verifyPrescriptionApi, createPrescriptionApi, getMedicinesApi } from '../services/api';
import Modal from '../components/Modal';

const Prescriptions = ({ onDispenseQuickSale }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState([]);

  // Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('Male');
  const [doctorName, setDoctorName] = useState('');
  const [doctorMci, setDoctorMci] = useState('');
  const [hospital, setHospital] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [safetyNotes, setSafetyNotes] = useState('');
  const [selectedMedId, setSelectedMedId] = useState('');
  const [medQty, setMedQty] = useState(1);
  const [formError, setFormError] = useState('');

  const loadPrescriptions = async () => {
    setLoading(true);
    try {
      const res = await getPrescriptionsApi({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: search || undefined,
      });
      if (res.data.success) {
        setPrescriptions(res.data.data);
      }
    } catch (e) {
      console.error('Failed to load prescriptions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrescriptions();
    getMedicinesApi({ limit: 50 }).then((res) => {
      if (res.data.success) {
        setMedicines(res.data.data);
        if (res.data.data[0]) setSelectedMedId(res.data.data[0]._id);
      }
    });
  }, [statusFilter, search]);

  const handleVerify = async (id) => {
    try {
      await verifyPrescriptionApi(id);
      loadPrescriptions();
    } catch (err) {
      alert(err.response?.data?.message || 'Verification failed');
    }
  };

  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const res = await createPrescriptionApi({
        patientName,
        patientAge: Number(patientAge),
        patientGender,
        doctorName,
        doctorMciNumber: doctorMci,
        hospitalOrClinic: hospital,
        diagnosis,
        safetyNotes,
        items: [
          {
            medicineId: selectedMedId,
            quantity: Number(medQty),
            dosage: '1-0-1',
            duration: '5 Days',
          },
        ],
      });

      if (res.data.success) {
        setShowNewModal(false);
        setPatientName('');
        setPatientAge('');
        setDoctorName('');
        setDoctorMci('');
        setHospital('');
        setDiagnosis('');
        loadPrescriptions();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Creation failed');
    }
  };

  return (
    <div className="flex flex-col w-full gap-space-lg">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-primary-container text-on-primary-container font-mono-data text-[11px] font-semibold uppercase">
              Clinical Verification
            </span>
            <span className="text-outline font-mono">•</span>
            <span className="text-tertiary font-semibold text-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span> CDSCO Compliance Deck
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mt-1 font-bold">
            Prescription Verification & Dispensing Counter
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Cross-examine medical council prescriber numbers, verify drug interactions, and approve Schedule H/H1 orders.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md shadow-md transition-all active:scale-95"
            onClick={() => setShowNewModal(true)}
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            <span>+ Add Prescription</span>
          </button>
        </div>
      </div>

      {/* Safety Alert Banner */}
      <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-amber-600 text-2xl">verified_user</span>
          <div>
            <h4 className="font-bold text-sm text-on-surface">MCI & State Medical Council Registry Verification</h4>
            <p className="text-xs text-on-surface-variant">
              Every Schedule H/H1 antibiotic, psychotropic, or cardiac order requires validated prescriber identity before sale issuance.
            </p>
          </div>
        </div>
        <span className="font-mono text-xs text-amber-700 font-semibold px-2.5 py-1 rounded bg-amber-100">
          Rule 65(9) Mandated
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-surface-container-low p-1 rounded-xl w-fit">
        {[
          { id: 'ALL', label: 'All Orders' },
          { id: 'PENDING', label: 'Pending Verification' },
          { id: 'VERIFIED', label: 'Verified Ready' },
          { id: 'DISPENSED', label: 'Dispensed' },
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

      {/* Prescription Cards Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
        {prescriptions.map((rx) => (
          <div
            key={rx._id}
            className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-all gap-4"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between border-b border-surface-container pb-3">
                <div>
                  <span className="font-mono font-bold text-primary text-sm">{rx.prescriptionNumber}</span>
                  <h3 className="font-bold text-base text-on-surface mt-0.5">{rx.patientName}</h3>
                  <span className="text-xs text-outline font-mono">
                    {rx.patientAge} yrs • {rx.patientGender} • {new Date(rx.prescriptionDate).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    rx.status === 'VERIFIED'
                      ? 'bg-tertiary-container/15 text-tertiary'
                      : rx.status === 'DISPENSED'
                      ? 'bg-surface-container text-outline'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {rx.status}
                </span>
              </div>

              {/* Prescriber & Clinical Details */}
              <div className="mt-3 space-y-1.5 text-xs text-on-surface-variant bg-surface-container-low/40 p-3 rounded-lg border border-surface-container">
                <div className="flex justify-between">
                  <span>Prescribing Doctor:</span>
                  <strong className="text-on-surface">{rx.doctorName}</strong>
                </div>
                <div className="flex justify-between">
                  <span>MCI / Reg No:</span>
                  <span className="font-mono font-semibold text-secondary">{rx.doctorMciNumber}</span>
                </div>
                {rx.hospitalOrClinic && (
                  <div className="flex justify-between">
                    <span>Clinic / Hospital:</span>
                    <span>{rx.hospitalOrClinic}</span>
                  </div>
                )}
                {rx.diagnosis && (
                  <div className="flex justify-between">
                    <span>Diagnosis:</span>
                    <span className="text-on-surface">{rx.diagnosis}</span>
                  </div>
                )}
              </div>

              {/* Prescribed Items */}
              <div className="mt-3">
                <span className="text-xs font-semibold text-outline uppercase tracking-wider block mb-1.5">
                  Prescribed Formulations
                </span>
                <div className="space-y-1.5">
                  {rx.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-surface-container-low flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[18px]">medication</span>
                        <span className="font-semibold text-on-surface">{item.medicine?.name}</span>
                        <span className="text-outline font-mono">({item.dosage})</span>
                      </div>
                      <span className="font-mono font-bold text-on-surface">{item.quantity} units</span>
                    </div>
                  ))}
                </div>
              </div>

              {rx.safetyNotes && (
                <div className="mt-3 p-2.5 rounded bg-error-container/20 border-l-2 border-error text-xs text-error flex items-start gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  <span>{rx.safetyNotes}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-surface-container flex items-center justify-end gap-2">
              {rx.status === 'PENDING' && (
                <button
                  className="px-4 py-2 rounded-lg bg-tertiary text-on-tertiary text-xs font-bold hover:bg-tertiary-container shadow-sm flex items-center gap-1"
                  onClick={() => handleVerify(rx._id)}
                >
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  <span>Pharmacist Verify</span>
                </button>
              )}
              {rx.status === 'VERIFIED' && (
                <button
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary-container shadow-sm flex items-center gap-1"
                  onClick={() => onDispenseQuickSale && onDispenseQuickSale(rx)}
                >
                  <span className="material-symbols-outlined text-[16px]">point_of_sale</span>
                  <span>Dispense in POS</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal: New Prescription */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="Upload / Log Patient Prescription">
        <form onSubmit={handleCreatePrescription} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-error-container text-on-error-container text-sm">{formError}</div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-outline block mb-1">Patient Name *</label>
              <input
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40 focus:outline-none"
                placeholder="e.g. Ramesh Kumar"
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-outline block mb-1">Age & Gender *</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  className="w-16 px-2 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40"
                  placeholder="Age"
                  required
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                />
                <select
                  className="flex-1 px-2 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40"
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value)}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-outline block mb-1">Doctor Name *</label>
              <input
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40 focus:outline-none"
                placeholder="e.g. Dr. Suresh Rao, MD"
                required
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-outline block mb-1">Doctor MCI / State Reg No *</label>
              <input
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40 focus:outline-none"
                placeholder="e.g. KMC-54210"
                required
                value={doctorMci}
                onChange={(e) => setDoctorMci(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-outline block mb-1">Clinic / Hospital</label>
              <input
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40"
                placeholder="e.g. Fortis Hospital"
                value={hospital}
                onChange={(e) => setHospital(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-outline block mb-1">Diagnosis</label>
              <input
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40"
                placeholder="e.g. Type 2 Diabetes"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-surface-container-low/50 border border-surface-container space-y-2">
            <label className="text-xs font-semibold text-primary block">Select Prescribed Medicine</label>
            <div className="grid grid-cols-3 gap-2">
              <select
                className="col-span-2 px-3 py-2 text-sm rounded-lg bg-surface-container-lowest border border-outline-variant/40"
                value={selectedMedId}
                onChange={(e) => setSelectedMedId(e.target.value)}
              >
                {medicines.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.schedule})
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                className="px-3 py-2 text-sm rounded-lg bg-surface-container-lowest border border-outline-variant/40"
                placeholder="Qty"
                value={medQty}
                onChange={(e) => setMedQty(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-outline block mb-1">Pharmacist Safety / Interaction Notes</label>
            <textarea
              rows="2"
              className="w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40"
              placeholder="e.g. Take with food, avoid alcohol..."
              value={safetyNotes}
              onChange={(e) => setSafetyNotes(e.target.value)}
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-surface-container">
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-surface-container text-on-surface font-semibold text-sm"
              onClick={() => setShowNewModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-primary text-on-primary font-semibold text-sm shadow-md hover:bg-primary-container"
            >
              Save Prescription
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Prescriptions;
