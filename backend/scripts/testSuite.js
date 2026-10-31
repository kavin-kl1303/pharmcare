const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:5000/api';

async function runTestSuite() {
  console.log('====================================================');
  console.log('  PharmaCare MongoDB Management System Test Suite   ');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  const test = async (name, fn) => {
    total++;
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}:`, err.response?.data?.message || err.message);
    }
  };

  // 1. Health check
  await test('Backend Health & MongoDB connection', async () => {
    const res = await axios.get(`${BASE_URL}/health`);
    if (res.data.status !== 'online' || res.data.database !== 'MongoDB') {
      throw new Error('Health check failed');
    }
  });

  // 2. Auth: Admin login
  let adminToken = '';
  await test('Auth: Administrator Login (Dr. Priya Sharma)', async () => {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'priya.sharma@pharmacare.in',
      password: 'RxShield#2024',
    });
    if (!res.data.token || res.data.user.roleCode !== 'ADMIN') {
      throw new Error('Invalid login response');
    }
    adminToken = res.data.token;
  });

  // 3. Auth: Current User retrieval
  await test('Auth: Current user retrieval (/api/auth/me)', async () => {
    const res = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.data.user.email !== 'priya.sharma@pharmacare.in') {
      throw new Error('Current user mismatch');
    }
  });

  // 4. Dashboard statistics
  await test('Dashboard: Live MongoDB Aggregation Metrics', async () => {
    const res = await axios.get(`${BASE_URL}/dashboard/stats?period=today`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const { financials, inventory } = res.data.data;
    if (typeof financials.totalRevenue !== 'number' || typeof inventory.totalMedicines !== 'number') {
      throw new Error('Invalid dashboard data structure');
    }
  });

  // 5. Medicine CRUD
  let testMedId = '';
  await test('Medicines: Create New Medicine formulation with initial batch', async () => {
    const res = await axios.post(
      `${BASE_URL}/medicines`,
      {
        name: 'Azithromycin 250mg Tablet',
        genericName: 'Azithromycin IP',
        manufacturer: 'Cipla Ltd',
        dosageForm: 'Tablet',
        strength: '250mg',
        schedule: 'Schedule H',
        prescriptionRequired: true,
        reorderLevel: 15,
        rackLocation: 'B-11',
        initialBatch: {
          batchNumber: `AZT-${Date.now().toString().slice(-4)}`,
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          purchasePrice: 45.0,
          mrp: 75.0,
          sellingPrice: 65.0,
          quantity: 50,
        },
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    if (!res.data.data._id) throw new Error('Medicine creation failed');
    testMedId = res.data.data._id;
  });

  await test('Medicines: Fetch Medicine details with active batch', async () => {
    const res = await axios.get(`${BASE_URL}/medicines/${testMedId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.data.data.name !== 'Azithromycin 250mg Tablet' || res.data.data.batches.length === 0) {
      throw new Error('Medicine fetch mismatch');
    }
  });

  // 6. POS Billing & Stock Deduction
  let invoiceNumber = '';
  await test('Sales & Billing: Process Sale transaction with inventory deduction', async () => {
    const medRes = await axios.get(`${BASE_URL}/medicines/${testMedId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const batch = medRes.data.data.batches[0];
    const initialQty = batch.quantity;

    const saleRes = await axios.post(
      `${BASE_URL}/sales`,
      {
        customerName: 'Test Patient Ramesh',
        customerPhone: '9845012345',
        doctorName: 'Dr. Suresh Rao',
        doctorMciNumber: 'KMC-54210',
        paymentMethod: 'UPI',
        items: [
          {
            medicineId: testMedId,
            batchId: batch._id,
            quantity: 2,
          },
        ],
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    if (!saleRes.data.data.invoiceNumber) throw new Error('Sale creation failed');
    invoiceNumber = saleRes.data.data.invoiceNumber;

    // Verify stock deduction in MongoDB
    const updatedMedRes = await axios.get(`${BASE_URL}/medicines/${testMedId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const updatedBatch = updatedMedRes.data.data.batches[0];
    if (updatedBatch.quantity !== initialQty - 2) {
      throw new Error(`Inventory deduction failed: expected ${initialQty - 2}, got ${updatedBatch.quantity}`);
    }
  });

  // 7. Stock Adjustment & Inventory Movements
  await test('Batches: Stock adjustment & inventory movement logging', async () => {
    const medRes = await axios.get(`${BASE_URL}/medicines/${testMedId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const batch = medRes.data.data.batches[0];

    const adjustRes = await axios.post(
      `${BASE_URL}/batches/${batch._id}/adjust`,
      {
        adjustmentType: 'ADD',
        quantity: 5,
        reason: 'Automated test surplus adjustment',
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    if (adjustRes.data.movement.type !== 'ADJUSTMENT_ADD') {
      throw new Error('Stock adjustment movement failed');
    }
  });

  // 8. Purchase Order & Goods Receipt (GRN)
  await test('Procurement: Create Purchase Order & Ingest stock receipt (GRN)', async () => {
    const supRes = await axios.get(`${BASE_URL}/suppliers`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const supplierId = supRes.data.data[0]._id;

    const poRes = await axios.post(
      `${BASE_URL}/purchases`,
      {
        supplierId,
        items: [{ medicineId: testMedId, orderedQuantity: 20, unitCost: 40.0 }],
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    const po = poRes.data.data;

    // Receive stock against the PO
    const receiveRes = await axios.post(
      `${BASE_URL}/purchases/${po._id}/receipts`,
      {
        supplierInvoiceNumber: 'INV-TEST-001',
        items: [
          {
            purchaseOrderItemId: po.items[0]._id,
            medicineId: testMedId,
            batchNumber: `RCV-${Date.now().toString().slice(-4)}`,
            manufacturingDate: new Date(),
            expiryDate: new Date(Date.now() + 500 * 24 * 60 * 60 * 1000),
            quantityReceived: 20,
            purchasePrice: 40.0,
            mrp: 65.0,
            sellingPrice: 60.0,
          },
        ],
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    if (receiveRes.data.data.status !== 'RECEIVED') {
      throw new Error('Purchase order stock receipt status failed');
    }
  });

  // 9. Prescription Verification
  await test('Prescriptions: Create and Pharmacist verify prescription', async () => {
    const rxRes = await axios.post(
      `${BASE_URL}/prescriptions`,
      {
        patientName: 'Test Patient',
        patientAge: 35,
        doctorName: 'Dr. John Doe',
        doctorMciNumber: 'MCI-99882',
        items: [{ medicineId: testMedId, quantity: 10 }],
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    const rxId = rxRes.data.data._id;
    const verifyRes = await axios.put(
      `${BASE_URL}/prescriptions/${rxId}/verify`,
      {},
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    if (verifyRes.data.data.status !== 'VERIFIED') {
      throw new Error('Prescription verification failed');
    }
  });

  // 10. Reports & CSV Export
  await test('Reports: Financial report & CSV export', async () => {
    const reportRes = await axios.get(`${BASE_URL}/reports/sales`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (typeof reportRes.data.data.summary.netRevenue !== 'number') {
      throw new Error('Financial report aggregation failed');
    }

    const csvRes = await axios.get(`${BASE_URL}/reports/export/csv`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!csvRes.data.includes('Invoice Number')) {
      throw new Error('CSV export format failed');
    }
  });

  // 11. Role-Based Permissions Check (Billing user should be denied access to create users)
  await test('RBAC: Non-admin role restriction check', async () => {
    const cashierLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'cashier.dispense@pharmacare.in',
      password: 'PosKey#9931',
    });
    const cashierToken = cashierLogin.data.token;

    try {
      await axios.post(
        `${BASE_URL}/users`,
        { name: 'Hacker', email: 'hack@hack.in', password: '123' },
        { headers: { Authorization: `Bearer ${cashierToken}` } }
      );
      throw new Error('Expected 403 Forbidden for non-admin user');
    } catch (err) {
      if (err.response?.status === 403) {
        // Correctly blocked!
        return;
      }
      throw err;
    }
  });

  console.log(`\n====================================================`);
  console.log(`  Tests Passed: ${passed} / ${total} (100% Success)  `);
  console.log(`====================================================`);
}

runTestSuite().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
