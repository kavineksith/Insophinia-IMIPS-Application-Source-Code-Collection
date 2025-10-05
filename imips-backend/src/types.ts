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
    profilePictureUrl?: string;
}

export interface InventoryItem {
    id: string;
    name: string;
    sku: string;
    quantity: number;
    threshold: number;
    category: string;
    price: number;
    imageUrl?: string;
    warrantyPeriod?: number;
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
    data: string;
}

export interface Email {
    id: string;
    recipient: string;
    subject: string;
    body: string;
    sentAt: string;
    attachment?: Attachment;
}

export interface CartItem extends InventoryItem {
    cartQuantity: number;
}

export interface Discount {
    code: string;
    value: number;
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
    discountApplied: number;
    total: number;
    createdAt: string;
    createdBy: string;
    status: OrderStatus;
}

export enum DiscountType {
    Percentage = 'Percentage',
    FixedAmount = 'FixedAmount'
}

export interface DiscountCondition {
    minSpend?: number;
    minItems?: number;
    validCategories?: string[];
    maxUsage?: number;
    validUntil?: string;
}

export interface Discount {
    id: string;
    code: string;
    description: string;
    type: DiscountType;
    value: number;
    condition: DiscountCondition;
    isActive: boolean;
    usedCount: number;
    createdAt: string;
    createdBy: string;
}