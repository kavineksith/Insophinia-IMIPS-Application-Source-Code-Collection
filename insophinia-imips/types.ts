

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
  attachment?: Attachment;
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

export interface DiscountCondition {
    minSpend?: number;
    minItems?: number;
    maxUsage?: number;
    validUntil?: string; // ISO date string
}

export interface Discount {
    id: string;
    code: string;
    description: string;
    type: DiscountType;
    value: number; // e.g., 10 for 10% or 10 for $10
    condition: DiscountCondition;
    isActive: boolean;
    createdAt?: string;
    usedCount?: number;
    createdBy?: string;
}

export enum OrderStatus {
    Processing = 'Processing',
    Shipped = 'Shipped',
    Delivered = 'Delivered',
    Cancelled = 'Cancelled',
    Refunded = 'Refunded',
}

export interface Order {
    id: string;
    customerName: string;
    customerContact: string;
    customerAddress: string;
    customerEmail: string;
    items: CartItem[];
    subtotal: number;
    discountApplied: number; // This can hold percentage or fixed value, logic depends on context
    discountAmount: number;
    total: number;
    createdAt: string;
    createdBy: string; // User ID
    status: OrderStatus;
}

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  context?: any;
}