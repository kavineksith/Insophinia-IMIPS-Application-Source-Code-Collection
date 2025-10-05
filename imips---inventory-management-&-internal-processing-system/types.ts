
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Staff';
  profile_picture_url?: string;
  last_activity?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  threshold: number;
  category: string;
  price: number;
  image_url?: string;
  warranty_period_months?: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
    inventory_item_id: string;
    quantity: number;
    price_at_purchase: number;
    name: string;
    sku: string;
    image_url?: string;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_contact: string;
  customer_address: string;
  customer_email: string;
  subtotal: number;
  discount_amount: number;
  total: number;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Refunded';
  created_by_user_id: string;
  created_by_name?: string;
  applied_discount_id?: string;
  discount_code?: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface Inquiry {
  id: string;
  customer_name: string;
  customer_email: string;
  inquiry_details: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  assigned_user_id?: string;
  assigned_user_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Discount {
  id: string;
  code: string;
  description: string;
  type: 'Percentage' | 'FixedAmount';
  value: number;
  min_spend?: number;
  min_items?: number;
  is_active: boolean;
  used_count: number;
  created_by_user_id: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
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
