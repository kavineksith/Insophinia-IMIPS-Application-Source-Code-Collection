import { User, InventoryItem, Order, Inquiry, Discount, SecurityLog, BlockedIP } from '../types';

// --- MOCK DATABASE ---
const MOCK_DB = {
  users: [
    { id: 'user-1', name: 'Jane Doe', email: 'admin@imips.com', role: 'Admin', last_activity: new Date(Date.now() - 86400000 * 1).toISOString() },
    { id: 'user-2', name: 'John Smith', email: 'manager@imips.com', role: 'Manager', last_activity: new Date(Date.now() - 3600000 * 2).toISOString() },
    { id: 'user-3', name: 'Alice Johnson', email: 'staff@imips.com', role: 'Staff', last_activity: new Date(Date.now() - 60000 * 15).toISOString() },
    { id: 'user-4', name: 'Bob Williams', email: 'staff2@imips.com', role: 'Staff', last_activity: new Date(Date.now() - 86400000 * 5).toISOString() },
  ] as User[],
  inventory: [
    { id: 'inv-1', name: 'Quantum Laptop Pro', sku: 'QLP-2024-X1', quantity: 25, threshold: 10, category: 'Electronics', price: 1499.99, image_url: 'https://picsum.photos/seed/laptop/40', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'inv-2', name: 'Ergo-Mechanical Keyboard', sku: 'EMK-RGB-01', quantity: 8, threshold: 15, category: 'Peripherals', price: 129.50, image_url: 'https://picsum.photos/seed/keyboard/40', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'inv-3', name: '4K UltraWide Monitor', sku: 'MTR-UW-4K-34', quantity: 15, threshold: 5, category: 'Displays', price: 799.00, image_url: 'https://picsum.photos/seed/monitor/40', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'inv-4', name: 'Silent Optical Mouse', sku: 'MSE-SL-03', quantity: 50, threshold: 20, category: 'Peripherals', price: 39.99, image_url: 'https://picsum.photos/seed/mouse/40', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'inv-5', name: 'Noise-Cancelling Headphones', sku: 'HDP-NC-PRO-2', quantity: 3, threshold: 5, category: 'Audio', price: 249.99, image_url: 'https://picsum.photos/seed/headphones/40', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'inv-6', name: 'Webcam HD 1080p', sku: 'CAM-HD-1080', quantity: 30, threshold: 10, category: 'Peripherals', price: 89.99, image_url: 'https://picsum.photos/seed/webcam/40', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ] as InventoryItem[],
  orders: [
    { id: 'ord-1', customer_name: 'Tech Solutions Inc.', customer_email: 'purchase@techsolutions.com', customer_contact: '555-1234', customer_address: '123 Tech Park', subtotal: 1499.99, discount_amount: 0, total: 1499.99, status: 'Delivered', created_by_user_id: 'user-3', created_by_name: 'Alice Johnson', created_at: new Date(Date.now() - 86400000 * 5).toISOString(), updated_at: new Date().toISOString(), items: [{ inventory_item_id: 'inv-1', quantity: 1, price_at_purchase: 1499.99, name: 'Quantum Laptop Pro', sku: 'QLP-2024-X1' }] },
    { id: 'ord-2', customer_name: 'Creative Minds Agency', customer_email: 'accounts@creativeminds.com', customer_contact: '555-5678', customer_address: '456 Design Ave', subtotal: 928.50, discount_amount: 92.85, total: 835.65, status: 'Shipped', created_by_user_id: 'user-4', created_by_name: 'Bob Williams', created_at: new Date(Date.now() - 86400000 * 2).toISOString(), updated_at: new Date().toISOString(), items: [{ inventory_item_id: 'inv-3', quantity: 1, price_at_purchase: 799.00, name: '4K UltraWide Monitor', sku: 'MTR-UW-4K-34' }, { inventory_item_id: 'inv-2', quantity: 1, price_at_purchase: 129.50, name: 'Ergo-Mechanical Keyboard', sku: 'EMK-RGB-01' }] },
    { id: 'ord-3', customer_name: 'Global Exports LLC', customer_email: 'logistics@globalexports.com', customer_contact: '555-9012', customer_address: '789 Trade Blvd', subtotal: 199.95, discount_amount: 0, total: 199.95, status: 'Processing', created_by_user_id: 'user-3', created_by_name: 'Alice Johnson', created_at: new Date(Date.now() - 3600000 * 3).toISOString(), updated_at: new Date().toISOString(), items: [{ inventory_item_id: 'inv-4', quantity: 5, price_at_purchase: 39.99, name: 'Silent Optical Mouse', sku: 'MSE-SL-03' }] },
    { id: 'ord-4', customer_name: 'Data Corp', customer_email: 'it@datacorp.com', customer_contact: '555-3456', customer_address: '101 Data Dr', subtotal: 249.99, discount_amount: 0, total: 249.99, status: 'Cancelled', created_by_user_id: 'user-4', created_by_name: 'Bob Williams', created_at: new Date(Date.now() - 86400000 * 10).toISOString(), updated_at: new Date().toISOString(), items: [{ inventory_item_id: 'inv-5', quantity: 1, price_at_purchase: 249.99, name: 'Noise-Cancelling Headphones', sku: 'HDP-NC-PRO-2' }] },
    { id: 'ord-5', customer_name: 'Home Office Setup', customer_email: 'jane.public@email.com', customer_contact: '555-7890', customer_address: '321 Home St', subtotal: 89.99, discount_amount: 0, total: 89.99, status: 'Processing', created_by_user_id: 'user-3', created_by_name: 'Alice Johnson', created_at: new Date(Date.now() - 3600000 * 1).toISOString(), updated_at: new Date().toISOString(), items: [{ inventory_item_id: 'inv-6', quantity: 1, price_at_purchase: 89.99, name: 'Webcam HD 1080p', sku: 'CAM-HD-1080' }] },
  ] as Order[],
  inquiries: [
    { id: 'inq-1', customer_name: 'Michael Scott', customer_email: 'm.scott@dundermifflin.com', inquiry_details: 'I need to order 50 new keyboards for the office. Do you offer bulk discounts?', status: 'Pending', assigned_user_id: undefined, assigned_user_name: undefined, created_at: new Date(Date.now() - 3600000 * 6).toISOString(), updated_at: new Date().toISOString() },
    { id: 'inq-2', customer_name: 'Sarah Connor', customer_email: 'sarah.c@cyberdyne.com', inquiry_details: 'My Quantum Laptop Pro is making strange noises. Can I get it checked under warranty?', status: 'In Progress', assigned_user_id: 'user-3', assigned_user_name: 'Alice Johnson', created_at: new Date(Date.now() - 86400000 * 1).toISOString(), updated_at: new Date().toISOString() },
    { id: 'inq-3', customer_name: 'Peter Parker', customer_email: 'p.parker@dailybugle.com', inquiry_details: 'The webcam I bought has a blurry image. I have cleaned the lens.', status: 'Completed', assigned_user_id: 'user-4', assigned_user_name: 'Bob Williams', created_at: new Date(Date.now() - 86400000 * 3).toISOString(), updated_at: new Date().toISOString() },
  ] as Inquiry[],
  discounts: [
    { id: 'dsc-1', code: 'SUMMER10', description: '10% off all orders over $100', type: 'Percentage', value: 10, min_spend: 100, is_active: true, used_count: 15, created_by_user_id: 'user-2', created_by_name: 'John Smith', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'dsc-2', code: '50OFF', description: '$50 off for orders over $500', type: 'FixedAmount', value: 50, min_spend: 500, is_active: true, used_count: 5, created_by_user_id: 'user-2', created_by_name: 'John Smith', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'dsc-3', code: 'EXPIRED20', description: 'Old 20% discount', type: 'Percentage', value: 20, is_active: false, used_count: 120, created_by_user_id: 'user-1', created_by_name: 'Jane Doe', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ] as Discount[],
  securityLogs: [
    { id: 1, event_type: 'Login Success', ip_address: '192.168.1.1', user_id: 'user-3', url: '/auth/login', details: 'User Alice Johnson logged in.', created_at: new Date(Date.now() - 60000 * 15).toISOString(), user_agent: 'Chrome' },
    { id: 2, event_type: 'Login Failed', ip_address: '10.0.0.5', user_id: 'N/A', url: '/auth/login', details: 'Failed login attempt for user: wrong@email.com', created_at: new Date(Date.now() - 60000 * 30).toISOString(), user_agent: 'Firefox' },
    { id: 3, event_type: 'IP Blocked', ip_address: '203.0.113.10', user_id: 'N/A', url: '/auth/login', details: 'IP blocked after 5 failed login attempts.', created_at: new Date(Date.now() - 60000 * 25).toISOString(), user_agent: 'System' },
    { id: 4, event_type: 'Password Change', ip_address: '192.168.1.1', user_id: 'user-2', url: '/users/user-2/change-password', details: 'User John Smith changed their password.', created_at: new Date(Date.now() - 86400000).toISOString(), user_agent: 'Chrome' },
  ] as SecurityLog[],
  blockedIPs: [
    { ip: '203.0.113.10', blockedAt: new Date(Date.now() - 60000 * 25).toISOString(), expiresAt: new Date(Date.now() + 3600000).toISOString(), reason: 'Too many failed login attempts', pathsAttempted: 5 },
    { ip: '198.51.100.22', blockedAt: new Date(Date.now() - 86400000).toISOString(), expiresAt: new Date(Date.now() + 86400000 * 6).toISOString(), reason: 'Manual block by admin', pathsAttempted: 1 },
  ] as BlockedIP[],
};

// --- MOCK API IMPLEMENTATION ---
const MOCK_API_DELAY = 500;

const getAuthToken = (): string | null => {
  return localStorage.getItem('accessToken');
};

const api = {
  async request<T,>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body as string) : {};
    
    console.log(`[MOCK API] ${method} ${endpoint}`, body);

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          // AUTH
          if (endpoint === '/auth/login' && method === 'POST') {
            const user = MOCK_DB.users.find(u => u.email === body.email);
            if (user && body.password === 'password') {
                localStorage.setItem('accessToken', user.id);
                return resolve({ accessToken: user.id, user } as any);
            }
            return reject(new Error('Invalid credentials'));
          }
          if (endpoint === '/auth/logout' && method === 'POST') {
            localStorage.removeItem('accessToken');
            return resolve(null as any);
          }
          if (endpoint === '/auth/me' && method === 'GET') {
            const userId = getAuthToken();
            const user = MOCK_DB.users.find(u => u.id === userId);
            if (user) return resolve(user as any);
            return reject(new Error('Not authenticated'));
          }

          // DASHBOARD
          if (endpoint === '/orders/stats/overview' && method === 'GET') {
            const deliveredOrders = MOCK_DB.orders.filter(o => o.status === 'Delivered');
            const total_revenue = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
            const overview = {
                total_orders: MOCK_DB.orders.length,
                total_revenue,
                average_order_value: total_revenue / (deliveredOrders.length || 1),
                processing_orders: MOCK_DB.orders.filter(o => o.status === 'Processing').length,
            };
            return resolve({ overview } as any);
          }
          if (endpoint === '/inquiries/stats/overview' && method === 'GET') {
            const inquiriesByDay = [...Array(30)].map((_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (29 - i));
                return { date: date.toISOString().split('T')[0], count: Math.floor(Math.random() * 5) };
            });
            const overview = {
                total_inquiries: MOCK_DB.inquiries.length,
                pending_inquiries: MOCK_DB.inquiries.filter(i => i.status === 'Pending').length,
                in_progress_inquiries: MOCK_DB.inquiries.filter(i => i.status === 'In Progress').length,
                completed_inquiries: MOCK_DB.inquiries.filter(i => i.status === 'Completed').length,
            };
            return resolve({ overview, inquiriesByDay } as any);
          }
          if (endpoint === '/inventory/alerts/low-stock' && method === 'GET') {
              return resolve(MOCK_DB.inventory.filter(i => i.quantity <= i.threshold) as any);
          }
          if (endpoint.startsWith('/orders?limit=5') && method === 'GET') {
              return resolve({ orders: [...MOCK_DB.orders].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5) } as any);
          }
          
          // INVENTORY
          if (endpoint === '/inventory' && method === 'GET') {
            return resolve(MOCK_DB.inventory as any);
          }
          
          // ORDERS
          if (endpoint.startsWith('/orders') && method === 'GET') {
            const url = new URL(endpoint, 'http://localhost');
            const status = url.searchParams.get('status');
            const orders = status ? MOCK_DB.orders.filter(o => o.status === status) : MOCK_DB.orders;
            return resolve({ orders } as any);
          }
          
          // INQUIRIES
          if (endpoint === '/inquiries' && method === 'GET') {
            return resolve({ inquiries: MOCK_DB.inquiries } as any);
          }

          // DISCOUNTS
          if (endpoint === '/discounts' && method === 'GET') {
            return resolve({ discounts: MOCK_DB.discounts } as any);
          }

          // USERS
          if (endpoint === '/users' && method === 'GET') {
            return resolve(MOCK_DB.users as any);
          }
          if (endpoint.includes('/change-password') && method === 'POST') {
              if (body.currentPassword === 'password') {
                  console.log('Password changed successfully (mock)');
                  return resolve({ message: 'Password changed successfully!' } as any);
              }
              return reject(new Error('Incorrect current password.'));
          }

          // SECURITY
          if (endpoint.startsWith('/security/security-logs') && method === 'GET') {
            return resolve({ logs: MOCK_DB.securityLogs } as any);
          }
          if (endpoint === '/security/blocked-ips' && method === 'GET') {
            return resolve({ blocked: MOCK_DB.blockedIPs } as any);
          }
          if (endpoint.startsWith('/security/blocked-ips/') && method === 'DELETE') {
              const ip = endpoint.split('/').pop();
              MOCK_DB.blockedIPs = MOCK_DB.blockedIPs.filter(b => b.ip !== ip);
              return resolve(null as any);
          }

          // Fallback for unhandled endpoints
          reject(new Error(`[MOCK API] Unhandled endpoint: ${method} ${endpoint}`));

        } catch (error) {
          reject(error);
        }
      }, MOCK_API_DELAY);
    });
  },

  get: <T,>(endpoint: string, options?: RequestInit) => {
    return api.request<T>(endpoint, { ...options, method: 'GET' });
  },

  post: <T,>(endpoint: string, body: any, options?: RequestInit) => {
    const isFormData = body instanceof FormData;
    return api.request<T>(endpoint, { 
        ...options, 
        method: 'POST', 
        body: isFormData ? body : JSON.stringify(body) 
    });
  },

  put: <T,>(endpoint: string, body: any, options?: RequestInit) => {
    const isFormData = body instanceof FormData;
    return api.request<T>(endpoint, { 
        ...options, 
        method: 'PUT', 
        body: isFormData ? body : JSON.stringify(body) 
    });
  },

  patch: <T,>(endpoint: string, body: any, options?: RequestInit) => {
    return api.request<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) });
  },

  delete: <T,>(endpoint: string, options?: RequestInit) => {
    return api.request<T>(endpoint, { ...options, method: 'DELETE' });
  },
};

export default api;
