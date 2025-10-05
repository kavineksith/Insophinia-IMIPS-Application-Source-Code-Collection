

import { User, Role, InventoryItem, CustomerInquiry, InquiryStatus, Order, OrderStatus, OrderItem, Discount, DiscountType, Email, UserSession, SecurityLog, BlockedIP, Newsletter, InquiryResponse, InventoryMovement, InventoryMovementType } from '../types';

const uuid = () => crypto.randomUUID();
const now = new Date();
const subDays = (d: Date, days: number) => new Date(d.getTime() - (days * 24 * 60 * 60 * 1000));

// --- USERS ---
export let mockUsers: User[] = [
  { id: 'user-admin-01', name: 'Admin User', email: 'admin@imips.com', role: Role.Admin, password: 'admin123', profilePictureUrl: '/images/avatars/avatar1.png', lastActivity: new Date().toISOString() },
  { id: 'user-manager-01', name: 'Manager User', email: 'manager@imips.com', role: Role.Manager, password: 'manager123', profilePictureUrl: '/images/avatars/avatar2.png', lastActivity: subDays(now, 1).toISOString() },
  { id: 'user-staff-01', name: 'Staff User', email: 'staff@imips.com', role: Role.Staff, password: 'staff123', profilePictureUrl: '/images/avatars/avatar3.png', lastActivity: subDays(now, 2).toISOString() },
];
export const setMockUsers = (data: User[]) => { mockUsers = data; };

// --- INVENTORY ---
export let mockInventory: InventoryItem[] = [
  { id: uuid(), name: 'Ergo-Comfort Office Chair', sku: 'CHR-ERG-001', quantity: 25, threshold: 10, category: 'Furniture', price: 349.99, imageUrl: '/images/products/chair1.jpg', warrantyPeriod: 24 },
  { id: uuid(), name: 'Executive Leather Chair', sku: 'CHR-EXE-002', quantity: 8, threshold: 5, category: 'Furniture', price: 599.99, imageUrl: '/images/products/chair2.jpg', warrantyPeriod: 36 },
  { id: uuid(), name: 'Mesh-Back Task Chair', sku: 'CHR-TSK-003', quantity: 50, threshold: 15, category: 'Furniture', price: 199.99, imageUrl: '/images/products/chair3.jpg', warrantyPeriod: 12 },
  { id: uuid(), name: 'Standing Desk Converter', sku: 'DSK-STD-001', quantity: 15, threshold: 5, category: 'Desks', price: 299.00, imageUrl: '/images/products/desk1.jpg', warrantyPeriod: 12 },
  { id: uuid(), name: 'Electric Height-Adjustable Desk', sku: 'DSK-ELC-002', quantity: 12, threshold: 5, category: 'Desks', price: 799.00, imageUrl: '/images/products/desk2.jpg', warrantyPeriod: 60 },
  { id: uuid(), name: '27-inch 4K Monitor', sku: 'MON-4K-027', quantity: 30, threshold: 10, category: 'Electronics', price: 449.50, imageUrl: '/images/products/monitor1.jpg', warrantyPeriod: 36 },
  { id: uuid(), name: 'Wireless Ergonomic Keyboard', sku: 'KBD-WRL-001', quantity: 40, threshold: 20, category: 'Peripherals', price: 89.99, imageUrl: '/images/products/keyboard1.jpg', warrantyPeriod: 24 },
  { id: uuid(), name: 'Vertical Ergonomic Mouse', sku: 'MSE-VRT-002', quantity: 0, threshold: 20, category: 'Peripherals', price: 49.99, imageUrl: '/images/products/mouse1.jpg', warrantyPeriod: 24 },
  { id: uuid(), name: 'LED Desk Lamp with USB Charging', sku: 'LMP-LED-001', quantity: 60, threshold: 25, category: 'Accessories', price: 39.99, imageUrl: '/images/products/lamp1.jpg', warrantyPeriod: 12 },
  { id: uuid(), name: '3-Drawer Filing Cabinet', sku: 'CAB-FIL-003', quantity: 22, threshold: 10, category: 'Storage', price: 179.00, imageUrl: '/images/products/cabinet1.jpg', warrantyPeriod: 12 },
];
export const setMockInventory = (data: InventoryItem[]) => { mockInventory = data; };

// --- INQUIRIES ---
export let mockInquiries: CustomerInquiry[] = [
  { id: uuid(), customerName: 'John Doe', customerEmail: 'john.d@example.com', inquiryDetails: 'Do you offer bulk discounts for the Ergo-Comfort Office Chair? We are looking to purchase 50 units.', status: InquiryStatus.Pending, assignedStaffId: 'user-staff-01', createdAt: subDays(now, 1).toISOString() },
  { id: uuid(), customerName: 'Jane Smith', customerEmail: 'jane.s@example.com', inquiryDetails: 'What is the warranty period for the Electric Height-Adjustable Desk?', status: InquiryStatus.Completed, assignedStaffId: 'user-manager-01', createdAt: subDays(now, 3).toISOString() },
  { id: uuid(), customerName: 'Sam Wilson', customerEmail: 'sam.w@example.com', inquiryDetails: 'My 4K monitor has a dead pixel. How do I start a warranty claim?', status: InquiryStatus.InProgress, assignedStaffId: 'user-staff-01', createdAt: subDays(now, 2).toISOString() },
];
export const setMockInquiries = (data: CustomerInquiry[]) => { mockInquiries = data; };

export let mockInquiryResponses: InquiryResponse[] = [
    { id: uuid(), inquiry_id: mockInquiries[1].id, response_message: 'Hi Jane, the warranty for the Electric desk is 60 months (5 years) on the frame and motor. Thanks!', responded_by_user_id: 'user-manager-01', responded_by_name: 'Manager User', has_attachments: false, created_at: subDays(now, 2).toISOString() }
];
export const setMockInquiryResponses = (data: InquiryResponse[]) => { mockInquiryResponses = data; };

// --- ORDERS ---
const createOrderItems = (orderId: string, items: { inventoryId: string; quantity: number }[]): OrderItem[] => {
    return items.map(item => {
        const inventoryItem = mockInventory.find(i => i.id === item.inventoryId)!;
        return {
            id: uuid(),
            order_id: orderId,
            inventory_item_id: inventoryItem.id,
            quantity: item.quantity,
            price_at_purchase: inventoryItem.price,
            name: inventoryItem.name,
            sku: inventoryItem.sku,
            image_url: inventoryItem.imageUrl,
        }
    });
};

const order1Id = uuid();
const order2Id = uuid();
const order3Id = uuid();

const order1Items = createOrderItems(order1Id, [{ inventoryId: mockInventory[0].id, quantity: 2 }, { inventoryId: mockInventory[6].id, quantity: 2 }]);
const order2Items = createOrderItems(order2Id, [{ inventoryId: mockInventory[4].id, quantity: 1 }]);
const order3Items = createOrderItems(order3Id, [{ inventoryId: mockInventory[2].id, quantity: 5 }]);

export let mockOrders: Order[] = [
  { id: order1Id, customerName: 'Alice Johnson', customerContact: '555-1234', customerAddress: '123 Maple St, Springfield', customerEmail: 'alice.j@example.com', items: order1Items, subtotal: 879.96, applied_discount_id: null, discountAmount: 0, total: 879.96, createdAt: subDays(now, 5).toISOString(), createdBy: 'user-staff-01', status: OrderStatus.Delivered },
  { id: order2Id, customerName: 'Bob Williams', customerContact: '555-5678', customerAddress: '456 Oak Ave, Shelbyville', customerEmail: 'bob.w@example.com', items: order2Items, subtotal: 799.00, applied_discount_id: null, discountAmount: 0, total: 799.00, createdAt: subDays(now, 2).toISOString(), createdBy: 'user-staff-01', status: OrderStatus.Shipped },
  { id: order3Id, customerName: 'Charlie Brown', customerContact: '555-9012', customerAddress: '789 Pine Ln, Capital City', customerEmail: 'charlie.b@example.com', items: order3Items, subtotal: 999.95, applied_discount_id: 'discount-01', discountAmount: 99.99, total: 899.96, createdAt: subDays(now, 1).toISOString(), createdBy: 'user-manager-01', status: OrderStatus.Processing },
];
export const setMockOrders = (data: Order[]) => { mockOrders = data; };

// --- DISCOUNTS ---
export let mockDiscounts: Discount[] = [
  { id: 'discount-01', code: 'SUMMER10', description: '10% off for Summer Sale', type: DiscountType.Percentage, value: 10, min_spend: 50, isActive: true, usedCount: 5, createdBy: 'user-admin-01' },
  { id: 'discount-02', code: 'NEW25', description: '$25 off for new customers', type: DiscountType.FixedAmount, value: 25, min_items: 2, isActive: true, usedCount: 1, createdBy: 'user-manager-01' },
  { id: 'discount-03', code: 'EXPIRED', description: 'Expired test code', type: DiscountType.Percentage, value: 50, isActive: false, usedCount: 20, createdBy: 'user-admin-01' },
];
export const setMockDiscounts = (data: Discount[]) => { mockDiscounts = data; };

// --- EMAILS ---
export let mockEmails: Email[] = [
  { id: uuid(), recipient: 'jane.s@example.com', subject: 'Re: Warranty Information', body: 'Hi Jane, the warranty for the Electric desk is 60 months (5 years) on the frame and motor. Thanks!', sentAt: subDays(now, 2).toISOString() },
  { id: uuid(), recipient: 'charlie.b@example.com', subject: 'Your Order #... is being processed', body: 'Thank you for your order! We will notify you when it ships.', sentAt: subDays(now, 1).toISOString(), attachment_path: '/receipts/receipt-order-123.pdf' },
];
export const setMockEmails = (data: Email[]) => { mockEmails = data; };

// --- SESSIONS ---
export let mockUserSessions: UserSession[] = [
    { id: uuid(), userId: 'user-admin-01', loginTime: subDays(now, 0).toISOString(), last_activity: new Date().toISOString(), isCurrent: true, ip_address: '192.168.1.10', user_agent: 'Chrome/125.0.0.0' },
    { id: uuid(), userId: 'user-admin-01', loginTime: subDays(now, 2).toISOString(), logoutTime: subDays(now, 2).toISOString(), duration: 120 },
    { id: uuid(), userId: 'user-manager-01', loginTime: subDays(now, 1).toISOString(), last_activity: subDays(now, 1).toISOString(), ip_address: '203.0.113.25', user_agent: 'Firefox/124.0' },
];
export const setMockUserSessions = (data: UserSession[]) => { mockUserSessions = data; };

// --- SECURITY LOGS ---
export let mockSecurityLogs: SecurityLog[] = [
    { id: 1, event_type: 'login_success', ip_address: '192.168.1.10', user_agent: 'Chrome/125.0.0.0', url: '/api/auth/login', user_id: 'user-admin-01', details: 'Successful login', created_at: new Date().toISOString() },
    { id: 2, event_type: 'login_failed', ip_address: '10.0.0.5', user_agent: 'Safari/17.0', url: '/api/auth/login', user_id: 'unknown', details: 'Failed login attempt for email: wrong@imips.com', created_at: subDays(now, 0).toISOString() },
];
export const setMockSecurityLogs = (data: SecurityLog[]) => { mockSecurityLogs = data; };

// --- BLOCKED IPS ---
export let mockBlockedIPs: BlockedIP[] = [
    { ip: '10.0.0.5', reason: 'Too many failed login attempts', blockedAt: new Date().toISOString(), expiresAt: new Date(now.getTime() + 60*60*1000).toISOString(), pathsAttempted: 5 }
];
export const setMockBlockedIPs = (data: BlockedIP[]) => { mockBlockedIPs = data; };

// --- NEWSLETTERS ---
export let mockNewsletters: Newsletter[] = [
    { id: uuid(), subject: 'Summer Sale is Here!', html_content: '<h1>Big Savings!</h1><p>Get 10% off everything.</p>', recipient_group: 'all_customers', total_recipients: 150, success_count: 148, fail_count: 2, status: 'completed', sent_by_user_id: 'user-manager-01', sent_by_name: 'Manager User', created_at: subDays(now, 10).toISOString() }
];
export const setMockNewsletters = (data: Newsletter[]) => { mockNewsletters = data; };

// --- INVENTORY MOVEMENTS ---
export let mockInventoryMovements: InventoryMovement[] = [
    { id: uuid(), itemId: mockInventory[0].id, type: InventoryMovementType.StockOut, quantityChange: -2, relatedOrderId: order1Id, timestamp: subDays(now, 5).toISOString(), userId: 'user-staff-01', user_name: 'Staff User', reason: 'Sale' },
    { id: uuid(), itemId: mockInventory[6].id, type: InventoryMovementType.StockOut, quantityChange: -2, relatedOrderId: order1Id, timestamp: subDays(now, 5).toISOString(), userId: 'user-staff-01', user_name: 'Staff User', reason: 'Sale' },
    { id: uuid(), itemId: mockInventory[0].id, type: InventoryMovementType.StockIn, quantityChange: 20, timestamp: subDays(now, 15).toISOString(), userId: 'user-manager-01', user_name: 'Manager User', reason: 'New shipment received' },
];
export const setMockInventoryMovements = (data: InventoryMovement[]) => { mockInventoryMovements = data; };
