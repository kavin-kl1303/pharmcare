import axios from 'axios';

const defaultBackendUrl = 'https://pharmcare-udkm.onrender.com/api';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? defaultBackendUrl : '/api'),
  withCredentials: true,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('pharmacare_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('pharmacare_token');
        localStorage.removeItem('pharmacare_user');
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const loginApi = (data) => API.post('/auth/login', data);
export const registerApi = (data) => API.post('/auth/register', data);
export const getMeApi = () => API.get('/auth/me');
export const logoutApi = () => API.post('/auth/logout');

// Dashboard
export const getDashboardStatsApi = (params) => API.get('/dashboard/stats', { params });

// Medicines
export const getMedicinesApi = (params) => API.get('/medicines', { params });
export const getMedicineByIdApi = (id) => API.get(`/medicines/${id}`);
export const createMedicineApi = (data) => API.post('/medicines', data);
export const updateMedicineApi = (id, data) => API.put(`/medicines/${id}`, data);
export const deleteMedicineApi = (id) => API.delete(`/medicines/${id}`);
export const getCategoriesApi = () => API.get('/medicines/categories');

// Batches & Inventory
export const getBatchesApi = (params) => API.get('/batches', { params });
export const createBatchApi = (data) => API.post('/batches', data);
export const adjustStockApi = (id, data) => API.post(`/batches/${id}/adjust`, data);
export const getMovementsApi = (params) => API.get('/inventory/movements', { params });
export const getInventorySummaryApi = () => API.get('/inventory/summary');

// Suppliers
export const getSuppliersApi = (params) => API.get('/suppliers', { params });
export const createSupplierApi = (data) => API.post('/suppliers', data);
export const updateSupplierApi = (id, data) => API.put(`/suppliers/${id}`, data);

// Customers
export const getCustomersApi = (params) => API.get('/customers', { params });
export const createCustomerApi = (data) => API.post('/customers', data);
export const updateCustomerApi = (id, data) => API.put(`/customers/${id}`, data);

// Prescriptions
export const getPrescriptionsApi = (params) => API.get('/prescriptions', { params });
export const getPrescriptionByIdApi = (id) => API.get(`/prescriptions/${id}`);
export const createPrescriptionApi = (data) => API.post('/prescriptions', data);
export const verifyPrescriptionApi = (id) => API.put(`/prescriptions/${id}/verify`);

// Sales & POS Billing
export const createSaleApi = (data) => API.post('/sales', data);
export const getSalesApi = (params) => API.get('/sales', { params });
export const getSaleByIdApi = (id) => API.get(`/sales/${id}`);

// Purchases & Goods Receipts
export const getPurchaseOrdersApi = (params) => API.get('/purchases', { params });
export const getPurchaseOrderByIdApi = (id) => API.get(`/purchases/${id}`);
export const createPurchaseOrderApi = (data) => API.post('/purchases', data);
export const receiveStockApi = (id, data) => API.post(`/purchases/${id}/receipts`, data);

// Reports
export const getSalesReportApi = (params) => API.get('/reports/sales', { params });
export const getMedicineWiseReportApi = (params) => API.get('/reports/medicines', { params });
export const getCategoryWiseReportApi = () => API.get('/reports/categories');
export const exportSalesCSVUrl = '/api/reports/export/csv';

// Notifications
export const getNotificationsApi = () => API.get('/notifications');
export const markNotificationReadApi = (id) => API.put(`/notifications/${id}/read`);
export const markAllNotificationsReadApi = () => API.put('/notifications/read-all');

// Users & Roles
export const getUsersApi = () => API.get('/users');
export const getRolesApi = () => API.get('/users/roles');
export const createUserApi = (data) => API.post('/users', data);
export const updateUserApi = (id, data) => API.put(`/users/${id}`, data);

export default API;
