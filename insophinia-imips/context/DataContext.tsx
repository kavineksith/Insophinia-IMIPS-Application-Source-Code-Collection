import React, { createContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { InventoryItem, User, CustomerInquiry, Role, InquiryStatus, Notification, Email, CartItem, Order, Discount, OrderStatus, Attachment, DiscountType } from '../types';
import * as api from '../lib/api';
import { generateEmailHtml } from '../lib/emailTemplate';
import { logger } from '../lib/logger';
import { useAuth } from '../hooks/useAuth';

interface BackupSettings {
    enabled: boolean;
    frequency: 'none' | 'daily' | 'weekly' | 'monthly';
    lastBackupTimestamp: number | null;
}

interface DataContextType {
  inventory: InventoryItem[];
  users: User[];
  inquiries: CustomerInquiry[];
  emails: Email[];
  orders: Order[];
  discounts: Discount[];
  cart: CartItem[];
  isLoading: boolean;
  addInventoryItem: (item: Omit<InventoryItem, 'id'>, file?: File) => Promise<void>;
  updateInventoryItem: (item: InventoryItem, file?: File) => Promise<void>;
  deleteInventoryItem: (itemId: string) => Promise<void>;
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (user: User, file?: File) => Promise<User | undefined>;
  deleteUser: (userId: string) => Promise<void>;
  addInquiry: (inquiry: Omit<CustomerInquiry, 'id' | 'createdAt'>) => Promise<void>;
  updateInquiry: (inquiry: CustomerInquiry) => Promise<void>;
  deleteInquiry: (inquiryId: string) => Promise<void>;
  addEmail: (email: Omit<Email, 'id' | 'sentAt' | 'attachment'>) => Promise<void>;
  notifications: Notification[];
  markNotificationsAsRead: () => void;
  importData: (type: 'inventory' | 'users' | 'inquiries', data: any[]) => boolean;
  addToCart: (item: InventoryItem, quantity: number) => boolean;
  updateCartQuantity: (itemId: string, newQuantity: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  checkout: (customerDetails: { customerName: string; customerContact: string; customerAddress: string; customerEmail: string; }, userId: string) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  getBackupData: () => Promise<void>;
  restoreData: (backupFile: File) => Promise<{ success: boolean, message: string }>;
  backupSettings: BackupSettings;
  updateBackupSettings: (newSettings: Partial<BackupSettings>) => void;
  addDiscount: (discount: Omit<Discount, 'id' | 'createdAt' | 'usedCount'>) => Promise<void>;
  updateDiscount: (discount: Discount) => Promise<void>;
  deleteDiscount: (discountId: string) => Promise<void>;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [inquiries, setInquiries] = useState<CustomerInquiry[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [backupSettings, setBackupSettings] = useState<BackupSettings>({
      enabled: false,
      frequency: 'none',
      lastBackupTimestamp: null,
  });
  const [loading, setLoading] = useState({
    inventory: true, users: true, inquiries: true, orders: true, discounts: true, emails: true
  });

  const isLoading = Object.values(loading).some(Boolean);
  
  const addNotification = useCallback((message: string, type: 'info' | 'error' = 'info') => {
    const newNotification: Notification = {
      id: `notif-${Date.now()}`,
      message,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading({ inventory: true, users: true, inquiries: true, orders: true, discounts: true, emails: true });
      logger.info('Fetching initial application data...');
      const [inv, usr, inq, ord, disc, emls] = await Promise.all([
        api.fetchInventory(),
        api.fetchUsers(),
        api.fetchInquiries(),
        api.fetchOrders(),
        api.fetchDiscounts(),
        api.fetchEmails(),
      ]);
      setInventory(inv);
      setUsers(usr);
      setInquiries(inq);
      setOrders(ord);
      setDiscounts(disc);
      setEmails(emls);
      logger.info('Initial data fetched successfully.');
    } catch (error) {
      addNotification("Error: Could not load data from the server.", "error");
      logger.error('Failed to fetch initial data', error);
    } finally {
      setLoading({ inventory: false, users: false, inquiries: false, orders: false, discounts: false, emails: false });
    }
  }, [addNotification]);
  
  useEffect(() => {
    if (user) {
        fetchData();
    } else {
        // Clear all data on logout to prevent showing stale data on next login
        setInventory([]);
        setUsers([]);
        setInquiries([]);
        setOrders([]);
        setDiscounts([]);
        setEmails([]);
        setCart([]);
        setNotifications([]);
    }
  }, [user, fetchData]);
  
  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({...n, read: true})));
  };

  const addEmail = async (email: Omit<Email, 'id' | 'sentAt' | 'attachment'>) => {
    try {
        await api.addEmail(email);
        logger.info('Email sent', { recipient: email.recipient, subject: email.subject });
        // Refetch emails since backend doesn't return the created object
        const updatedEmails = await api.fetchEmails();
        setEmails(updatedEmails);
    } catch(error) {
        addNotification("Error: Could not send email.", "error");
    }
  };

  const addInventoryItem = async (item: Omit<InventoryItem, 'id'>, file?: File) => {
    try {
        const newItem = await api.addInventoryItem(item, file);
        setInventory(prev => [newItem, ...prev]);
        logger.info('Inventory item added', { name: newItem.name, sku: newItem.sku, id: newItem.id });
    } catch (error) {
        addNotification("Error: Could not add inventory item.", "error");
    }
  };

  const updateInventoryItem = async (updatedItem: InventoryItem, file?: File) => {
    try {
        const oldItem = inventory.find(i => i.id === updatedItem.id);
        const returnedItem = await api.updateInventoryItem(updatedItem, file);
        setInventory(prev => prev.map(item => item.id === returnedItem.id ? returnedItem : item));
        logger.info('Inventory item updated', { name: returnedItem.name, id: returnedItem.id });

        if (oldItem && oldItem.quantity > oldItem.threshold && returnedItem.quantity <= returnedItem.threshold) {
            const message = `Low stock alert for ${returnedItem.name}. Current quantity: ${returnedItem.quantity}.`;
            addNotification(message);
            logger.warn(message, { item: returnedItem });
            const managerEmails = users.filter(u => u.role === Role.Manager).map(u => u.email).join(', ');
            if (managerEmails) {
                const subject = `Low Stock Alert: ${returnedItem.name}`;
                const bodyContent = `<p>This is an automated notification. The stock for "<strong>${returnedItem.name}</strong>" (SKU: ${returnedItem.sku}) has fallen to <strong>${returnedItem.quantity}</strong>, which is at or below the threshold of ${returnedItem.threshold}.</p><p>Please take appropriate action to restock this item.</p>`;
                addEmail({
                    recipient: managerEmails,
                    subject,
                    body: generateEmailHtml(subject, bodyContent),
                });
            }
        }
    } catch (error) {
        addNotification("Error: Could not update inventory item.", "error");
    }
  };

  const deleteInventoryItem = async (itemId: string) => {
    try {
        const itemToDelete = inventory.find(i => i.id === itemId);
        await api.deleteInventoryItem(itemId);
        setInventory(prev => prev.filter(item => item.id !== itemId));
        logger.warn('Inventory item deleted', { item: itemToDelete });
    } catch (error) {
        addNotification("Error: Could not delete inventory item.", "error");
    }
  };

  const addUser = async (user: Omit<User, 'id'>) => {
    try {
        const newUser = await api.addUser(user);
        setUsers(prev => [newUser, ...prev]);
        logger.info('User added', { name: newUser.name, email: newUser.email, role: newUser.role });
    } catch (error) {
        addNotification("Error: Could not add user.", "error");
    }
  };

  const updateUser = async (updatedUser: User, file?: File): Promise<User | undefined> => {
    try {
        const returnedUser = await api.updateUser(updatedUser, file);
        setUsers(prev => prev.map(user => user.id === returnedUser.id ? { ...user, ...returnedUser } : user));
        logger.info('User updated', { name: returnedUser.name, id: returnedUser.id });
        return returnedUser;
    } catch (error) {
        addNotification("Error: Could not update user.", "error");
        return undefined;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
        const userToDelete = users.find(u => u.id === userId);
        await api.deleteUser(userId);
        setUsers(prev => prev.filter(user => user.id !== userId));
        logger.warn('User deleted', { user: userToDelete });
    } catch (error) {
        addNotification("Error: Could not delete user.", "error");
    }
  };

  const addInquiry = async (inquiry: Omit<CustomerInquiry, 'id' | 'createdAt'>) => {
    try {
        const newInquiry = await api.addInquiry(inquiry);
        setInquiries(prev => [newInquiry, ...prev]);
        addNotification(`New inquiry from ${inquiry.customerName}.`);
        logger.info('New inquiry added', { customer: newInquiry.customerName, id: newInquiry.id });
    } catch (error) {
        addNotification("Error: Could not add inquiry.", "error");
    }
  };

  const updateInquiry = async (updatedInquiry: CustomerInquiry) => {
    try {
        const returnedInquiries = await api.updateInquiry(updatedInquiry);
        setInquiries(returnedInquiries); // Backend returns the full list
        addNotification(`Inquiry from ${updatedInquiry.customerName} has been updated to "${updatedInquiry.status}".`);
        logger.info('Inquiry status updated', { id: updatedInquiry.id, newStatus: updatedInquiry.status });
        
        const subject = `Update on your Insophinia Inquiry`;
        const bodyContent = `<p>Hello ${updatedInquiry.customerName},</p><p>This is an update regarding your inquiry: "<em>${updatedInquiry.inquiryDetails}</em>".</p><p>The status has been changed to: <strong>${updatedInquiry.status}</strong>.</p><p>Thank you,<br>Insophinia Support Team</p>`;
        addEmail({ recipient: updatedInquiry.customerEmail, subject, body: generateEmailHtml(subject, bodyContent) });
    } catch (error) {
        addNotification("Error: Could not update inquiry.", "error");
    }
  };

  const deleteInquiry = async (inquiryId: string) => {
    try {
        const inquiryToDelete = inquiries.find(i => i.id === inquiryId);
        await api.deleteInquiry(inquiryId);
        setInquiries(prev => prev.filter(inquiry => inquiry.id !== inquiryId));
        logger.warn('Inquiry deleted', { inquiry: inquiryToDelete });
    } catch (error) {
        addNotification("Error: Could not delete inquiry.", "error");
    }
  };
  
  const importData = (type: 'inventory' | 'users' | 'inquiries', data: any[]): boolean => {
      addNotification('Import feature is disabled when connected to a live database.', 'info');
      logger.warn('Data import attempted while in API mode.', { type });
      return false;
  };
  
  const addToCart = (item: InventoryItem, quantity: number): boolean => {
    const existingCartItem = cart.find(ci => ci.id === item.id);
    const availableStock = item.quantity;
    const currentQuantityInCart = existingCartItem?.cartQuantity || 0;
    
    if (currentQuantityInCart + quantity > availableStock) return false;

    if (existingCartItem) {
        setCart(prev => prev.map(ci => ci.id === item.id ? { ...ci, cartQuantity: ci.cartQuantity + quantity } : ci));
    } else {
        setCart(prev => [...prev, { ...item, cartQuantity: quantity }]);
    }
    return true;
  };

  const updateCartQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
        removeFromCart(itemId);
        return;
    }
    const inventoryItem = inventory.find(i => i.id === itemId);
    if (!inventoryItem || newQuantity > inventoryItem.quantity) return;

    setCart(prev => prev.map(ci => ci.id === itemId ? { ...ci, cartQuantity: newQuantity } : ci));
  };

  const removeFromCart = (itemId: string) => setCart(prev => prev.filter(ci => ci.id !== itemId));
  const clearCart = () => setCart([]);

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
        const updatedOrders = await api.updateOrderStatus(orderId, newStatus);
        setOrders(updatedOrders); // Backend returns the full list
        addNotification(`Order #${orderId} has been updated to "${newStatus}".`);
        logger.info('Order status updated', { orderId, newStatus });
    } catch (error) {
        addNotification("Error: Could not update order status.", "error");
    }
  };

  const checkout = async (customerDetails: { customerName: string; customerContact: string; customerAddress: string; customerEmail: string; }, userId: string): Promise<Order | null> => {
    try {
        const subtotal = cart.reduce((acc, item) => acc + item.price * item.cartQuantity, 0);
        const totalItems = cart.reduce((acc, item) => acc + item.cartQuantity, 0);

        // Find the best applicable discount
        let applicableDiscount: Discount | null = null;
        discounts.forEach(disc => {
            if (!disc.isActive) return;
            const meetsMinSpend = !disc.condition.minSpend || subtotal >= disc.condition.minSpend;
            const meetsMinItems = !disc.condition.minItems || totalItems >= disc.condition.minItems;
            if (meetsMinSpend && meetsMinItems) {
                if (!applicableDiscount || disc.value > applicableDiscount.value) { // Simple logic: best discount value wins
                    applicableDiscount = disc;
                }
            }
        });
        
        let discountValueToSend: number | null = null;
        if (applicableDiscount) {
            if (applicableDiscount.type === DiscountType.Percentage) {
                // If it's a percentage, send the value directly
                discountValueToSend = applicableDiscount.value;
            } else if (applicableDiscount.type === DiscountType.FixedAmount) {
                // If it's a fixed amount, the backend only understands percentages.
                // We must calculate the equivalent percentage to send.
                if (subtotal > 0) {
                    discountValueToSend = (applicableDiscount.value / subtotal) * 100;
                } else {
                    discountValueToSend = 0; // Avoid division by zero, no discount on a zero subtotal.
                }
            }
        }

        const newOrder = await api.checkout(customerDetails, userId, cart, discountValueToSend);
        if (newOrder) {
            setOrders(prev => [newOrder, ...prev]);
            const updatedInventory = await api.fetchInventory(); // Re-fetch inventory to get updated quantities
            setInventory(updatedInventory);
            clearCart();
            addNotification(`New order created for ${customerDetails.customerName}.`);
            logger.info('New order created', { orderId: newOrder.id, customer: newOrder.customerName, total: newOrder.total, createdBy: userId });
            addNotification(`Receipt for order #${newOrder.id} is being sent to ${newOrder.customerEmail}.`);
        }
        return newOrder;
    } catch (error: any) {
        const message = error.response?.data?.message || 'Please check item stock levels.';
        addNotification(`Checkout failed: ${message}`, "error");
        return null;
    }
  };
  
  const getBackupData = async (): Promise<void> => {
    try {
        const response = await api.getBackupData();
        addNotification(response.message, 'info');
        updateBackupSettings({ lastBackupTimestamp: Date.now() });
        logger.info('Server backup created successfully', { file: response.file });
    } catch (error) {
        addNotification('Failed to create server backup.', 'error');
    }
  }

  const restoreData = async (backupFile: File): Promise<{ success: boolean, message: string }> => {
    try {
        const result = await api.restoreData(backupFile);
        if (result.success) {
            // Reload all data after restore
            await fetchData();
            setCart([]);
            addNotification("System data successfully restored from backup.");
            logger.warn('System data restored from backup', { fileName: backupFile.name });
        }
        return result;
    } catch (error: any) {
        const message = error.response?.data?.message || "Failed to parse backup file.";
        addNotification(`Data restore failed: ${message}`, 'error');
        logger.error('Data restore failed', error, { message, fileName: backupFile.name });
        return { success: false, message };
    }
  };

  const updateBackupSettings = (newSettings: Partial<BackupSettings>) => {
    setBackupSettings(prev => {
        const updated = { ...prev, ...newSettings };
        localStorage.setItem('backupSettings', JSON.stringify(updated));
        return updated;
    });
  };

  // --- Discount Management ---

  const addDiscount = async (discount: Omit<Discount, 'id' | 'createdAt' | 'usedCount'>) => {
    try {
        const newDiscount = await api.createDiscount(discount);
        setDiscounts(prev => [newDiscount, ...prev]);
        logger.info('Discount added', { code: newDiscount.code, id: newDiscount.id });
    } catch (error) {
        addNotification("Error: Could not add discount.", "error");
    }
  };

  const updateDiscount = async (discount: Discount) => {
    try {
        const updatedDiscount = await api.updateDiscount(discount.id, discount);
        setDiscounts(prev => prev.map(d => d.id === updatedDiscount.id ? updatedDiscount : d));
        logger.info('Discount updated', { code: updatedDiscount.code, id: updatedDiscount.id });
    } catch (error) {
        addNotification("Error: Could not update discount.", "error");
    }
  };
  
  const deleteDiscount = async (discountId: string) => {
    try {
        await api.deleteDiscount(discountId);
        setDiscounts(prev => prev.filter(d => d.id !== discountId));
        logger.warn('Discount deleted', { discountId });
    } catch (error) {
        addNotification("Error: Could not delete discount.", "error");
    }
  };

  return (
    <DataContext.Provider value={{
      inventory, users, inquiries, emails, orders, discounts, cart, isLoading,
      addInventoryItem, updateInventoryItem, deleteInventoryItem,
      addUser, updateUser, deleteUser,
      addInquiry, updateInquiry, deleteInquiry,
      addEmail,
      notifications, markNotificationsAsRead,
      importData,
      addToCart, updateCartQuantity, removeFromCart, clearCart,
      checkout, updateOrderStatus, getBackupData, restoreData,
      backupSettings, updateBackupSettings,
      addDiscount, updateDiscount, deleteDiscount
    }}>
      {children}
    </DataContext.Provider>
  );
};