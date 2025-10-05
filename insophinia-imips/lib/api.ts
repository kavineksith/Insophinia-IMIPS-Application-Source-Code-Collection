import axios from 'axios';
import { InventoryItem, User, CustomerInquiry, Order, Discount, Email, CartItem, OrderStatus } from '../types';
import { logger } from './logger';

// --- Axios Instance Configuration ---

// A single, universal Axios instance for all API calls
const api = axios.create({
  // The baseURL will be set dynamically by the interceptor below
  withCredentials: true,
});

// This interceptor is the single source of truth for request configuration.
api.interceptors.request.use((config) => {
    // 1. Attach the authentication token to every request
    const token = localStorage.getItem('authToken');
    if (token) {
        const cleanToken = token.replace(/^"|"$/g, '');
        config.headers.Authorization = `Bearer ${cleanToken}`;
    }

    // 2. Dynamically set the baseURL based on the request URL
    if (config.url && (config.url.startsWith('/uploads/') || config.url.startsWith('/images/'))) {
        // For media requests, we want to hit the proxy directly (e.g., /uploads/image.png)
        config.baseURL = ''; 
    } else {
        // For all other data requests, they must be prefixed with /api (e.g., /api/inventory)
        config.baseURL = '/api';
    }

    logger.info(`API Request: ${config.method?.toUpperCase()} ${config.baseURL || ''}${config.url}`, {
        params: config.params,
    });
    return config;
});

// A single, universal error handler for all responses
api.interceptors.response.use(
  (response) => response,
  (error: any) => {
    const { config, response } = error;
    // Use the final computed URL from the config after the interceptor has run
    const finalUrl = `${config.baseURL || ''}${config.url}`;
    const errorMessage = response?.data?.message || error.message;
    logger.error(`API Error: ${response?.status || 'Network Error'} ${config.method?.toUpperCase()} ${finalUrl}`, error, {
        errorMessage,
        responseData: response?.data
    });
    return Promise.reject(error);
  }
);

// --- Auth ---
export const apiLogin = async (email: string, password: string) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data; // { user, accessToken, refreshToken }
};

// --- Inventory ---
export const fetchInventory = async (): Promise<InventoryItem[]> => {
  const res = await api.get('/inventory');
  return res.data;
};

export const addInventoryItem = async (item: Omit<InventoryItem, 'id'>, file?: File): Promise<InventoryItem> => {
  const formData = new FormData();
  Object.entries(item).forEach(([key, value]) => formData.append(key, value as any));
  if (file) formData.append('image', file);
  const res = await api.post('/inventory', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data;
};

export const updateInventoryItem = async (item: InventoryItem, file?: File): Promise<InventoryItem> => {
  const formData = new FormData();
  Object.entries(item).forEach(([key, value]) => formData.append(key, value as any));
  if (file) formData.append('image', file);
  const res = await api.put(`/inventory/${item.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data;
};

export const deleteInventoryItem = async (id: string) => {
  const res = await api.delete(`/inventory/${id}`);
  return res.data;
};

// --- Users ---
export const fetchUsers = async (): Promise<User[]> => {
  const res = await api.get('/users');
  return res.data;
};

export const addUser = async (user: Omit<User, 'id'>): Promise<User> => {
  const res = await api.post('/auth/register', {
    name: user.name,
    email: user.email,
    password: user.password,
    role: user.role,
  });
  return res.data.user; // Backend returns { user, accessToken, refreshToken }
};

export const updateUser = async (user: User, file?: File): Promise<User> => {
  const formData = new FormData();
  Object.entries(user).forEach(([key, value]) => formData.append(key, value as any));
  if (file) formData.append('profilePicture', file);
  const res = await api.put(`/users/${user.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data;
};

export const deleteUser = async (id: string) => {
  const res = await api.delete(`/users/${id}`);
  return res.data;
};

// --- Inquiries ---
export const fetchInquiries = async (): Promise<CustomerInquiry[]> => {
  const res = await api.get('/inquiries');
  return res.data;
};

export const addInquiry = async (inquiry: Omit<CustomerInquiry, 'id' | 'createdAt'>): Promise<CustomerInquiry> => {
  const res = await api.post('/inquiries', inquiry);
  return res.data;
};

export const updateInquiry = async (inquiry: CustomerInquiry): Promise<CustomerInquiry[]> => {
  const res = await api.put(`/inquiries/${inquiry.id}`, inquiry);
  return res.data; // Backend returns full list
};

export const deleteInquiry = async (id: string) => {
  const res = await api.delete(`/inquiries/${id}`);
  return res.data;
};

// --- Orders ---
export const fetchOrders = async (): Promise<Order[]> => {
  const res = await api.get('/orders');
  return res.data;
};

export const checkout = async (
  customerDetails: { customerName: string; customerContact: string; customerAddress: string; customerEmail: string },
  userId: string,
  cartItems: CartItem[],
  discountPercentage: number | null
): Promise<Order> => {
  const res = await api.post('/orders', {
      customer: customerDetails,
      cart: cartItems,
      discount: discountPercentage,
      createdBy: userId
  });
  return res.data;
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<Order[]> => {
  const res = await api.put(`/orders/${orderId}/status`, { status });
  return res.data; // Backend returns full list
};

// --- Discounts ---
export const fetchDiscounts = async (): Promise<Discount[]> => {
  const res = await api.get('/discounts');
  return res.data;
};

export const createDiscount = async (discount: Omit<Discount, 'id' | 'createdAt' | 'usedCount'>): Promise<Discount> => {
  const res = await api.post('/discounts', discount);
  return res.data;
};

export const updateDiscount = async (id: string, discount: Partial<Discount>): Promise<Discount> => {
  const res = await api.put(`/discounts/${id}`, discount);
  return res.data;
};

export const deleteDiscount = async (id: string): Promise<void> => {
  await api.delete(`/discounts/${id}`);
};

export const validateDiscount = async (code: string, cartTotal: number, itemCount: number): Promise<{ isValid: boolean; discount?: Discount; message?: string }> => {
  const res = await api.post('/discounts/validate', { code, cartTotal, itemCount });
  return res.data;
};

// --- Emails ---
export const fetchEmails = async (): Promise<Email[]> => {
  const res = await api.get('/emails');
  return res.data;
};

export const addEmail = async (email: Omit<Email, 'id' | 'sentAt' | 'attachment'>): Promise<{ message: string }> => {
  const res = await api.post('/emails/send', email);
  return res.data;
};

// --- Backup / Restore ---
export const getBackupData = async (): Promise<{ message: string; file: string }> => {
  const res = await api.post('/backup/create');
  return res.data;
};

export const restoreData = async (backupFile: File) => {
  const formData = new FormData();
  formData.append('file', backupFile);
  const res = await api.post('/backup/restore', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

// --- Password Management ---
export const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<{ message: string }> => {
  const res = await api.post(`/users/${userId}/change-password`, {
    currentPassword,
    newPassword
  });
  return res.data;
};

export const resetPassword = async (userId: string, newPassword: string): Promise<{ message: string }> => {
  const res = await api.post(`/users/${userId}/reset-password`, {
    newPassword
  });
  return res.data;
};

export default api;