

export enum Role {
  Admin = 'Admin',
  Manager = 'Manager',
  Staff = 'Staff',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  password?: string;
  profilePictureUrl?: string;
  isDeleted?: boolean;
  lastActivity?: string;
}

export interface InventoryItem {
  id:string;
  name: string;
  sku: string;
  quantity: number;
  threshold: number;
  category: string;
  price: number;
  imageUrl?: string;
  warrantyPeriod?: number; // in months
  isDeleted?: boolean;
}

export enum InquiryStatus {
  Pending = 'Pending',
  InProgress = 'In Progress',
  Completed = 'Completed',
}

export interface CustomerInquiry {
  id: string;
  customerName: string;
  customerEmail: string;
  inquiryDetails: string;
  status: InquiryStatus;
  assignedStaffId?: string;
  createdAt: string;
  isDeleted?: boolean;
}

export interface InquiryResponse {
  id: string;
  inquiry_id: string;
  response_message: string;
  responded_by_user_id: string;
  responded_by_name: string;
  has_attachments: boolean;
  created_at: string;
}


export interface Attachment {
  name: string;
  type: string;
  size: number;
  data: string; // base64 encoded data
}

export interface Email {
  id: string;
  recipient: string;
  subject: string;
  body: string; // Can be plain text or HTML
  sentAt: string;
  attachment_path?: string;
}

export enum Page {
    Dashboard = 'Dashboard',
    Inventory = 'Inventory',
    Users = 'Users',
    Inquiries = 'Inquiries',
    Email = 'Email',
    Catalog = 'Catalog',
    Orders = 'Orders',
    Settings = 'Settings',
    Reports = 'Reports',
    Logs = 'Logs',
    Discounts = 'Discounts',
    ActivityLog = 'Activity Log',
    Newsletters = 'Newsletters',
    Security = 'Security',
}

export interface Notification {
  id: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface CartItem extends InventoryItem {
  cartQuantity: number;
}

export enum DiscountType {
    Percentage = 'Percentage',
    FixedAmount = 'FixedAmount'
}

export interface Discount {
    id: string;
    code: string;
    description: string;
    type: DiscountType;
    value: number; // e.g., 10 for 10% or 10 for $10
    min_spend?: number;
    min_items?: number;
    isActive: boolean;
    createdAt?: string;
    usedCount?: number;
    createdBy?: string;
    isDeleted?: boolean;
}

export enum OrderStatus {
    Processing = 'Processing',
    Shipped = 'Shipped',
    Delivered = 'Delivered',
    Cancelled = 'Cancelled',
    Refunded = 'Refunded',
}

export interface OrderItem {
  id: string;
  order_id: string;
  inventory_item_id: string;
  quantity: number;
  price_at_purchase: number;
  name: string;
  sku: string;
  image_url?: string;
}

export interface Order {
    id: string;
    customerName: string;
    customerContact: string;
    customerAddress: string;
    customerEmail: string;
    items: OrderItem[];
    subtotal: number;
    applied_discount_id: string | null;
    discountAmount: number;
    total: number;
    createdAt: string;
    createdBy: string; // User ID
    status: OrderStatus;
    isDeleted?: boolean;
}

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  context?: any;
  userId?: string;
}

export enum InventoryMovementType {
  StockIn = 'StockIn', // New stock arrival
  StockOut = 'StockOut', // Sale
  AdjustmentIn = 'AdjustmentIn', // Manual correction, found items
  AdjustmentOut = 'AdjustmentOut', // Manual correction, lost items
  Damage = 'Damage',
  Expired = 'Expired',
  Return = 'Return', // Customer return
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  type: InventoryMovementType;
  quantityChange: number; // positive for in, negative for out
  reason?: string;
  relatedOrderId?: string;
  timestamp: string;
  userId: string;
  user_name: string;
}

export interface UserSession {
  id: string;
  userId: string;
  loginTime: string;
  logoutTime?: string;
  duration?: number; // in minutes
  ip_address?: string;
  user_agent?: string;
  last_activity?: string;
  isCurrent?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SecurityLog {
  id: number;
  event_type: string;
  ip_address: string;
  user_agent: string;
  url: string;
  user_id: string;
  details: string;
  created_at: string;
}

export interface BlockedIP {
  ip: string;
  blockedAt: string;
  expiresAt: string;
  reason: string;
  pathsAttempted: number;
}

export interface Newsletter {
  id: string;
  subject: string;
  html_content: string;
  recipient_group: 'all_customers' | 'recent_customers' | 'inquiry_customers' | 'custom';
  total_recipients: number;
  success_count: number;
  fail_count: number;
  status: 'sending' | 'completed' | 'failed';
  sent_by_user_id: string;
  sent_by_name: string;
  created_at: string;
  completed_at?: string;
}
