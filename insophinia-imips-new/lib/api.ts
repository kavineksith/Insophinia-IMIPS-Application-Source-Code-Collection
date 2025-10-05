

// FIX: Added missing type imports
import { InventoryItem, User, CustomerInquiry, Order, Discount, Email, OrderStatus, InventoryMovement, UserSession, PaginatedResponse, SecurityLog, BlockedIP, Newsletter, InquiryResponse, InquiryStatus, InventoryMovementType, Role, DiscountType, OrderItem } from '../types';
import { logger } from './logger';
import {
  mockUsers, mockInventory, mockInquiries, mockOrders, mockDiscounts, mockEmails, mockUserSessions,
  mockSecurityLogs, mockBlockedIPs, mockNewsletters, mockInquiryResponses, mockInventoryMovements,
  // FIX: Import setters for mock data arrays
  setMockUsers, setMockInventory, setMockInquiries, setMockOrders, setMockDiscounts, setMockEmails, setMockBlockedIPs
} from './mockData';
// FIX: Added missing import for subDays
import { subDays } from 'date-fns';

// --- Configuration & Helpers ---
const MOCK_API_DELAY = 200; // Simulate network latency (in ms)
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
const uuid = () => crypto.randomUUID();

let currentUserId: string | null = null;
let currentUserRole: Role | null = null;
let currentSessionId: string | null = null;

const checkAuth = (requiredRole?: Role) => {
    if (!currentUserId) throw new Error("Not authenticated");
    if (requiredRole && currentUserRole !== requiredRole && currentUserRole !== Role.Admin) {
        throw new Error("Access Denied");
    }
};

// --- CSRF Token Management ---
export const getCsrfToken = async (): Promise<string> => {
    await delay(50);
    logger.info('Mock CSRF token generated');
    return 'mock-csrf-token-12345';
};

export const setCsrfToken = (token: string) => {
    // In mock API, this does nothing but we keep it for compatibility
};


// --- Auth ---
export const apiLogin = async (email: string, password: string): Promise<{ user: User, accessToken: string }> => {
  await delay(MOCK_API_DELAY);
  const user = mockUsers.find(u => u.email === email && u.password === password && !u.isDeleted);
  if (user) {
    currentUserId = user.id;
    currentUserRole = user.role;
    currentSessionId = uuid();

    mockUserSessions.push({
      id: currentSessionId,
      userId: user.id,
      loginTime: new Date().toISOString(),
      last_activity: new Date().toISOString(),
      ip_address: '127.0.0.1',
      user_agent: 'MockBrowser/1.0',
      isCurrent: true,
    });
    
    logger.info(`Mock login successful for ${email}`);
    return { user, accessToken: `mock-token-${user.id}` };
  }
  logger.warn(`Mock login failed for ${email}`);
  throw { response: { data: { message: 'Invalid credentials' } } };
};

export const getMe = async (): Promise<User> => {
    await delay(50);
    if (currentUserId) {
        const user = mockUsers.find(u => u.id === currentUserId);
        if (user) return user;
    }
    throw new Error("No active session");
};

export const apiLogout = async (): Promise<void> => {
  await delay(100);
  const session = mockUserSessions.find(s => s.id === currentSessionId);
  if(session) {
      session.logoutTime = new Date().toISOString();
      session.isCurrent = false;
  }
  logger.info(`Mock logout for user ID ${currentUserId}`);
  currentUserId = null;
  currentUserRole = null;
  currentSessionId = null;
};

export const apiLogoutAll = async (): Promise<void> => {
    await delay(200);
    mockUserSessions.forEach(s => {
        if(s.userId === currentUserId) {
            s.logoutTime = new Date().toISOString();
            s.isCurrent = false;
        }
    });
    currentUserId = null;
    currentUserRole = null;
    currentSessionId = null;
}

export const apiPasswordResetRequest = async (email: string) => {
    await delay(MOCK_API_DELAY);
    const user = mockUsers.find(u => u.email === email);
    if(user) {
        logger.info(`Mock password reset requested for ${email}`);
        return { message: 'If a user with that email exists, a reset token has been sent.' };
    }
    return { message: 'If a user with that email exists, a reset token has been sent.' };
};

export const apiPasswordReset = async (token: string, newPassword: string) => {
    await delay(MOCK_API_DELAY);
    // In a real app, you'd validate the token. Here we just assume it's for the first user for demo.
    if(token === "VALIDTOKEN" && mockUsers.length > 0) {
        mockUsers[0].password = newPassword;
        logger.info(`Mock password reset for ${mockUsers[0].email}`);
        return { message: 'Password has been reset successfully.' };
    }
    throw { response: { data: { message: 'Invalid or expired token.' } } };
};

export const fetchMySessions = async (): Promise<UserSession[]> => {
    await delay(100);
    checkAuth();
    return mockUserSessions.filter(s => s.userId === currentUserId);
}

export const revokeSession = async (sessionId: string): Promise<void> => {
    await delay(100);
    checkAuth();
    const sessionIndex = mockUserSessions.findIndex(s => s.id === sessionId && s.userId === currentUserId);
    if (sessionIndex !== -1) {
        mockUserSessions.splice(sessionIndex, 1);
    }
}

// --- Inventory ---
export const fetchInventory = async (): Promise<InventoryItem[]> => {
  await delay(MOCK_API_DELAY);
  return mockInventory.filter(i => !i.isDeleted);
};

export const addInventoryItem = async (item: Omit<InventoryItem, 'id'>, file?: File): Promise<InventoryItem> => {
  await delay(MOCK_API_DELAY);
  const newItem: InventoryItem = {
    ...item,
    id: uuid(),
    imageUrl: file ? URL.createObjectURL(file) : '/images/products/placeholder.png'
  };
  mockInventory.unshift(newItem);
  return newItem;
};

export const updateInventoryItem = async (item: InventoryItem, file?: File): Promise<InventoryItem> => {
  await delay(MOCK_API_DELAY);
  const updatedItem = { ...item };
  if(file) updatedItem.imageUrl = URL.createObjectURL(file);
  // FIX: Use setter to avoid reassigning import.
  setMockInventory(mockInventory.map(i => (i.id === item.id ? updatedItem : i)));
  return updatedItem;
};

export const deleteInventoryItem = async (id: string): Promise<void> => {
  await delay(MOCK_API_DELAY);
  // FIX: Use setter to avoid reassigning import.
  setMockInventory(mockInventory.map(i => i.id === id ? { ...i, isDeleted: true } : i));
};

export const hardDeleteInventoryItem = async (id: string): Promise<void> => {
  await delay(MOCK_API_DELAY);
  // FIX: Use setter to avoid reassigning import.
  setMockInventory(mockInventory.filter(i => i.id !== id));
};

export const fetchInventoryMovements = async (itemId: string): Promise<InventoryMovement[]> => {
    await delay(150);
    return mockInventoryMovements.filter(m => m.itemId === itemId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// --- Users ---
export const fetchUsers = async (): Promise<User[]> => {
  await delay(MOCK_API_DELAY);
  return mockUsers.filter(u => !u.isDeleted);
};

export const addUser = async (user: Omit<User, 'id'>): Promise<User> => {
  await delay(MOCK_API_DELAY);
  const newUser: User = { ...user, id: uuid() };
  mockUsers.unshift(newUser);
  return newUser;
};

export const updateUser = async (user: User, file?: File): Promise<User> => {
  await delay(MOCK_API_DELAY);
  const updatedUser = { ...user };
  if(file) updatedUser.profilePictureUrl = URL.createObjectURL(file);
  // FIX: Use setter to avoid reassigning import.
  setMockUsers(mockUsers.map(u => (u.id === user.id ? updatedUser : u)));
  return updatedUser;
};

export const deleteUser = async (id: string): Promise<void> => {
  await delay(MOCK_API_DELAY);
  // FIX: Use setter to avoid reassigning import.
  setMockUsers(mockUsers.map(u => u.id === id ? { ...u, isDeleted: true } : u));
};

export const hardDeleteUser = async (id: string): Promise<void> => {
  await delay(MOCK_API_DELAY);
  // FIX: Use setter to avoid reassigning import.
  setMockUsers(mockUsers.filter(u => u.id !== id));
};

// --- Inquiries ---
export const fetchInquiries = async (): Promise<CustomerInquiry[]> => {
  await delay(MOCK_API_DELAY);
  return mockInquiries.filter(i => !i.isDeleted);
};

export const addInquiry = async (inquiry: Omit<CustomerInquiry, 'id' | 'createdAt'>): Promise<CustomerInquiry> => {
  await delay(MOCK_API_DELAY);
  const newInquiry = { ...inquiry, id: uuid(), createdAt: new Date().toISOString() };
  mockInquiries.unshift(newInquiry);
  return newInquiry;
};

export const updateInquiry = async (inquiry: CustomerInquiry): Promise<CustomerInquiry> => {
  await delay(MOCK_API_DELAY);
  // FIX: Use setter to avoid reassigning import.
  setMockInquiries(mockInquiries.map(i => (i.id === inquiry.id ? inquiry : i)));
  return inquiry;
};

export const deleteInquiry = async (id: string): Promise<void> => {
  await delay(MOCK_API_DELAY);
  // FIX: Use setter to avoid reassigning import.
  setMockInquiries(mockInquiries.map(i => i.id === id ? { ...i, isDeleted: true } : i));
};

export const hardDeleteInquiry = async (id: string): Promise<void> => {
  await delay(MOCK_API_DELAY);
  // FIX: Use setter to avoid reassigning import.
  setMockInquiries(mockInquiries.filter(i => i.id !== id));
};

export const respondToInquiry = async (inquiryId: string, message: string, files?: File[]): Promise<any> => {
    await delay(MOCK_API_DELAY);
    const user = mockUsers.find(u => u.id === currentUserId);
    const newResponse: InquiryResponse = {
        id: uuid(),
        inquiry_id: inquiryId,
        response_message: message,
        responded_by_user_id: currentUserId!,
        responded_by_name: user!.name,
        has_attachments: !!files && files.length > 0,
        created_at: new Date().toISOString()
    };
    mockInquiryResponses.push(newResponse);
    const inquiry = mockInquiries.find(i => i.id === inquiryId);
    if(inquiry && inquiry.status === InquiryStatus.Pending) {
        inquiry.status = InquiryStatus.InProgress;
    }
    return { message: 'Response sent' };
};

export const fetchInquiryResponses = async (inquiryId: string): Promise<InquiryResponse[]> => {
    await delay(150);
    return mockInquiryResponses.filter(r => r.inquiry_id === inquiryId);
};

// --- Orders ---
export const fetchOrders = async (page: number, limit: number): Promise<PaginatedResponse<Order>> => {
  await delay(MOCK_API_DELAY);
  const data = mockOrders.filter(o => !o.isDeleted).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const total = data.length;
  const pages = Math.ceil(total / limit);
  const paginatedData = data.slice((page - 1) * limit, page * limit);
  return {
    data: paginatedData,
    pagination: { page, limit, total, pages },
  };
};

export const checkout = async (
  customerDetails: { customerName: string; customerContact: string; customerAddress: string; customerEmail: string; },
  cartItems: { inventory_item_id: string; quantity: number }[],
  discountId: string | null
): Promise<Order> => {
  await delay(MOCK_API_DELAY * 2);
  checkAuth();

  let subtotal = 0;
  for(const item of cartItems) {
      const inventoryItem = mockInventory.find(i => i.id === item.inventory_item_id);
      if(!inventoryItem || inventoryItem.quantity < item.quantity) {
          throw { response: { data: { message: `Not enough stock for ${inventoryItem?.name || 'item'}.` } } };
      }
      subtotal += inventoryItem.price * item.quantity;
  }

  let discountAmount = 0;
  const discount = mockDiscounts.find(d => d.id === discountId);
  if(discount) {
      if(discount.type === DiscountType.FixedAmount) {
          discountAmount = discount.value;
      } else {
          discountAmount = subtotal * (discount.value / 100);
      }
      discount.usedCount = (discount.usedCount || 0) + 1;
  }
  
  const total = subtotal - discountAmount;
  const orderId = uuid();

  const orderItems: OrderItem[] = cartItems.map(item => {
      const inventoryItem = mockInventory.find(i => i.id === item.inventory_item_id)!;
      // Decrease stock
      inventoryItem.quantity -= item.quantity;
      // Log movement
      mockInventoryMovements.push({ id: uuid(), itemId: inventoryItem.id, type: InventoryMovementType.StockOut, quantityChange: -item.quantity, relatedOrderId: orderId, timestamp: new Date().toISOString(), userId: currentUserId!, user_name: mockUsers.find(u => u.id === currentUserId)!.name, reason: 'Sale' });
      return {
          id: uuid(), order_id: orderId, inventory_item_id: item.inventory_item_id, quantity: item.quantity,
          price_at_purchase: inventoryItem.price, name: inventoryItem.name, sku: inventoryItem.sku, image_url: inventoryItem.imageUrl,
      };
  });
  
  const newOrder: Order = {
    id: orderId,
    customerName: customerDetails.customerName,
    customerContact: customerDetails.customerContact,
    customerAddress: customerDetails.customerAddress,
    customerEmail: customerDetails.customerEmail,
    items: orderItems,
    subtotal,
    applied_discount_id: discountId,
    discountAmount,
    total,
    createdAt: new Date().toISOString(),
    createdBy: currentUserId!,
    status: OrderStatus.Processing,
  };

  mockOrders.unshift(newOrder);
  return newOrder;
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<void> => {
  await delay(MOCK_API_DELAY);
  // FIX: Use setter to avoid reassigning import.
  setMockOrders(mockOrders.map(o => o.id === orderId ? { ...o, status } : o));
};

export const deleteOrder = async (id: string): Promise<void> => {
    await delay(MOCK_API_DELAY);
    // FIX: Use setter to avoid reassigning import.
    setMockOrders(mockOrders.map(o => o.id === id ? { ...o, isDeleted: true } : o));
};

export const hardDeleteOrder = async (id: string): Promise<void> => {
    await delay(MOCK_API_DELAY);
    // FIX: Use setter to avoid reassigning import.
    setMockOrders(mockOrders.filter(o => o.id !== id));
};

// --- Discounts ---
export const fetchDiscounts = async (): Promise<Discount[]> => {
  await delay(MOCK_API_DELAY);
  return mockDiscounts.filter(d => !d.isDeleted);
};

export const validateDiscount = async (code: string, subtotal: number, itemCount: number) => {
    await delay(150);
    const discount = mockDiscounts.find(d => d.code === code);
    if (!discount) throw { response: { data: { message: "Discount code not found." } } };
    if (!discount.isActive) throw { response: { data: { message: "This discount code is not active." } } };
    if (discount.min_spend && subtotal < discount.min_spend) throw { response: { data: { message: `Minimum spend of $${discount.min_spend} not met.` } } };
    if (discount.min_items && itemCount < discount.min_items) throw { response: { data: { message: `A minimum of ${discount.min_items} items is required.` } } };

    let discount_amount = 0;
    if (discount.type === DiscountType.FixedAmount) discount_amount = discount.value;
    else discount_amount = subtotal * (discount.value / 100);

    return { valid: true, discount, discount_amount };
};

export const createDiscount = async (discount: Omit<Discount, 'id' | 'createdAt' | 'usedCount'>): Promise<Discount> => {
  await delay(MOCK_API_DELAY);
  const newDiscount = { ...discount, id: uuid(), createdAt: new Date().toISOString(), usedCount: 0 };
  mockDiscounts.unshift(newDiscount);
  return newDiscount;
};

export const updateDiscount = async (id: string, discount: Partial<Discount>): Promise<Discount> => {
  await delay(MOCK_API_DELAY);
  let updatedDiscount: Discount;
  // FIX: Use setter to avoid reassigning import.
  setMockDiscounts(mockDiscounts.map(d => {
      if(d.id === id) {
          updatedDiscount = { ...d, ...discount };
          return updatedDiscount;
      }
      return d;
  }));
  return updatedDiscount!;
};

export const deleteDiscount = async (id: string): Promise<void> => {
    await delay(MOCK_API_DELAY);
    // FIX: Use setter to avoid reassigning import.
    setMockDiscounts(mockDiscounts.map(d => d.id === id ? { ...d, isDeleted: true } : d));
};

export const hardDeleteDiscount = async (id: string) => {
    await delay(MOCK_API_DELAY);
    // FIX: Use setter to avoid reassigning import.
    setMockDiscounts(mockDiscounts.filter(d => d.id !== id));
};

// --- Emails ---
export const fetchEmails = async (): Promise<Email[]> => {
  await delay(MOCK_API_DELAY);
  return mockEmails;
};

export const addEmail = async (email: Omit<Email, 'id' | 'sentAt' | 'attachment_path'>, file?: File): Promise<{ message: string }> => {
  await delay(MOCK_API_DELAY * 2);
  const newEmail: Email = {
    ...email,
    id: uuid(),
    sentAt: new Date().toISOString(),
    attachment_path: file ? file.name : undefined
  };
  mockEmails.unshift(newEmail);
  return { message: "Email sent successfully" };
};

export const deleteEmail = async (id: string): Promise<void> => {
    await delay(MOCK_API_DELAY);
    // Mock doesn't need soft delete, just remove
    // FIX: Use setter to avoid reassigning import.
    setMockEmails(mockEmails.filter(e => e.id !== id));
};

export const hardDeleteEmail = async (id: string): Promise<void> => {
    await delay(MOCK_API_DELAY);
    // FIX: Use setter to avoid reassigning import.
    setMockEmails(mockEmails.filter(e => e.id !== id));
};


// --- Backup / Restore ---
export const listBackups = async (): Promise<any[]> => {
    await delay(100);
    return [{ filename: 'backup-2024-05-20.json', created_at: subDays(new Date(), 2).toISOString() }];
};

export const createBackup = async (): Promise<{ message: string; filename: string }> => {
  await delay(MOCK_API_DELAY * 3);
  return { message: 'Mock backup created successfully.', filename: `mock-backup-${new Date().toISOString()}.json` };
};

export const restoreData = async (filename: string) => {
  await delay(MOCK_API_DELAY * 4);
  return { success: true, message: 'Mock data restored. You will be logged out.' };
};

// --- Password Management ---
export const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<{ message: string }> => {
  await delay(MOCK_API_DELAY);
  const user = mockUsers.find(u => u.id === userId);
  if (user && user.password === currentPassword) {
    user.password = newPassword;
    return { message: 'Password changed successfully.' };
  }
  throw { response: { data: { message: 'Incorrect current password.' } } };
};

export const resetPassword = async (userId: string, newPassword: string): Promise<{ message: string }> => {
  await delay(MOCK_API_DELAY);
  const user = mockUsers.find(u => u.id === userId);
  if (user) {
    user.password = newPassword;
    return { message: 'Password has been reset.' };
  }
  throw new Error('User not found');
};

// --- User Activity & Sessions ---
export const fetchUserSessions = async (): Promise<UserSession[]> => {
    await delay(150);
    return mockUserSessions;
};

export const updateActivity = async (): Promise<void> => {
    if (currentUserId) {
        const user = mockUsers.find(u => u.id === currentUserId);
        if(user) user.lastActivity = new Date().toISOString();
        const session = mockUserSessions.find(s => s.id === currentSessionId);
        if(session) session.last_activity = new Date().toISOString();
    }
};

// --- Security ---
export const fetchSecurityLogs = async (): Promise<SecurityLog[]> => {
    await delay(150);
    return mockSecurityLogs;
};

export const fetchBlockedIPs = async (): Promise<BlockedIP[]> => {
    await delay(100);
    return mockBlockedIPs;
};

export const unblockIp = async (ip: string): Promise<any> => {
    await delay(100);
    // FIX: Use setter to avoid reassigning import.
    setMockBlockedIPs(mockBlockedIPs.filter(b => b.ip !== ip));
    return { message: 'IP unblocked.' };
};

// --- Newsletters ---
export const fetchNewsletters = async (): Promise<Newsletter[]> => {
    await delay(150);
    return mockNewsletters;
};

export const sendNewsletter = async (subject: string, htmlContent: string, recipientGroup: string): Promise<any> => {
    await delay(MOCK_API_DELAY * 2);
    const user = mockUsers.find(u => u.id === currentUserId);
    const newNewsletter: Newsletter = {
        id: uuid(),
        subject,
        html_content: htmlContent,
        recipient_group: recipientGroup as any,
        total_recipients: 10,
        success_count: 9,
        fail_count: 1,
        status: 'completed',
        sent_by_user_id: currentUserId!,
        sent_by_name: user!.name,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
    };
    mockNewsletters.unshift(newNewsletter);
    return { message: "Newsletter sent." };
};

// Mock axios default export for compatibility if any component imports it directly
const mockApi = {
    // FIX: Implement mock get for blob requests to fix AuthenticatedImage component.
    get: async (url: string, config?: { responseType?: string }): Promise<{ data: any }> => {
        if (config?.responseType === 'blob') {
            await delay(50);
            // The component's onError will handle cases where the blob is empty or invalid.
            return { data: new Blob() };
        }
        return Promise.reject(`Mock API does not support direct get: ${url}`);
    },
    post: (url: string) => Promise.reject(`Mock API does not support direct post: ${url}`),
    // ... add other methods if needed
};
export default mockApi;
