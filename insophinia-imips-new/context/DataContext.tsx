

import React, { createContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { InventoryItem, User, CustomerInquiry, Role, InquiryStatus, Notification, Email, CartItem, Order, Discount, OrderStatus, Attachment, DiscountType, InventoryMovementType, UserSession, SecurityLog, BlockedIP, Newsletter } from '../types';
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
  userSessions: UserSession[];
  securityLogs: SecurityLog[];
  blockedIPs: BlockedIP[];
  newsletters: Newsletter[];
  cart: CartItem[];
  isLoading: boolean;
  addInventoryItem: (item: Omit<InventoryItem, 'id'>, file?: File) => Promise<void>;
  updateInventoryItem: (item: InventoryItem, file?: File) => Promise<void>;
  deleteInventoryItem: (itemId: string) => Promise<void>;
  hardDeleteInventoryItem: (itemId: string) => Promise<void>;
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (user: User, file?: File) => Promise<User | undefined>;
  deleteUser: (userId: string) => Promise<void>;
  hardDeleteUser: (userId: string) => Promise<void>;
  addInquiry: (inquiry: Omit<CustomerInquiry, 'id' | 'createdAt'>) => Promise<void>;
  updateInquiry: (inquiry: CustomerInquiry) => Promise<void>;
  deleteInquiry: (inquiryId: string) => Promise<void>;
  hardDeleteInquiry: (inquiryId: string) => Promise<void>;
  addEmail: (email: Omit<Email, 'id' | 'sentAt' | 'attachment_path'>, file?: File) => Promise<void>;
  deleteEmail: (emailId: string) => Promise<void>;
  hardDeleteEmail: (emailId: string) => Promise<void>;
  notifications: Notification[];
  markNotificationsAsRead: () => void;
  addToCart: (item: InventoryItem, quantity: number) => boolean;
  updateCartQuantity: (itemId: string, newQuantity: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  checkout: (customerDetails: { customerName: string; customerContact: string; customerAddress: string; customerEmail: string; }, discountId: string | null) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  hardDeleteOrder: (orderId: string) => Promise<void>;
  createBackup: () => Promise<void>;
  restoreData: (filename: string) => Promise<{ success: boolean, message: string }>;
  backupSettings: BackupSettings;
  updateBackupSettings: (newSettings: Partial<BackupSettings>) => void;
  addDiscount: (discount: Omit<Discount, 'id' | 'createdAt' | 'usedCount'>) => Promise<void>;
  updateDiscount: (discount: Discount) => Promise<void>;
  deleteDiscount: (discountId: string) => Promise<void>;
  hardDeleteDiscount: (discountId: string) => Promise<void>;
  refreshData: () => Promise<void>;
  updateActivity: () => Promise<void>;
  unblockIp: (ip: string) => Promise<void>;
  sendNewsletter: (subject: string, htmlContent: string, recipientGroup: string) => Promise<void>;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [inquiries, setInquiries] = useState<CustomerInquiry[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [userSessions, setUserSessions] = useState<UserSession[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [backupSettings, setBackupSettings] = useState<BackupSettings>({
      enabled: false,
      frequency: 'none',
      lastBackupTimestamp: null,
  });
  const [loading, setLoading] = useState(true);

  const isLoading = loading;
  
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
    if (!user) return;
    try {
      setLoading(true);
      logger.info('Fetching initial application data...');
      
      const promises: Promise<any>[] = [
        api.fetchInventory(),
        api.fetchUsers(),
        api.fetchInquiries(),
        api.fetchOrders(1, 10).then(res => res.data), // Fetch recent 10 for dashboard/reports
        api.fetchDiscounts(),
        api.fetchEmails(),
        api.fetchUserSessions(),
      ];

      if (user.role === Role.Admin) {
        promises.push(api.fetchSecurityLogs());
        promises.push(api.fetchBlockedIPs());
        promises.push(api.fetchNewsletters());
      }
      
      const [inv, usr, inq, ord, disc, emls, sess, secLogs, blocked, news] = await Promise.all(promises);

      setInventory(inv);
      setUsers(usr);
      setInquiries(inq);
      setOrders(ord);
      setDiscounts(disc);
      setEmails(emls);
      setUserSessions(sess);
      if (secLogs) setSecurityLogs(secLogs);
      if (blocked) setBlockedIPs(blocked);
      if (news) setNewsletters(news);

      logger.info('Initial data fetched successfully.');
    } catch (error) {
      addNotification("Error: Could not load data from the server.", "error");
      logger.error('Failed to fetch initial data', error);
    } finally {
      setLoading(false);
    }
  }, [user, addNotification]);
  
  useEffect(() => {
    if (user) {
        fetchData();
    } else {
        // Clear all data on logout
        setInventory([]);
        setUsers([]);
        setInquiries([]);
        setOrders([]);
        setDiscounts([]);
        setEmails([]);
        setUserSessions([]);
        setSecurityLogs([]);
        setBlockedIPs([]);
        setNewsletters([]);
        setCart([]);
        setNotifications([]);
    }
  }, [user, fetchData]);
  
  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({...n, read: true})));
  };

  const addEmail = async (email: Omit<Email, 'id' | 'sentAt' | 'attachment_path'>, file?: File) => {
    try {
        await api.addEmail(email, file);
        logger.info('Email sent', { recipient: email.recipient, subject: email.subject, hasAttachment: !!file });
        await fetchData();
    } catch(error) {
        addNotification("Error: Could not send email.", "error");
    }
  };

  const deleteEmail = async (emailId: string) => {
    try {
        await api.deleteEmail(emailId);
        setEmails(prev => prev.filter(email => email.id !== emailId));
        logger.warn('Email soft-deleted', { emailId });
    } catch (error) {
        addNotification("Error: Could not archive email.", "error");
    }
  };

  const hardDeleteEmail = async (emailId: string) => {
    try {
        await api.hardDeleteEmail(emailId);
        setEmails(prev => prev.filter(email => email.id !== emailId));
        logger.error('Email permanently deleted', { emailId });
    } catch (error) {
        addNotification("Error: Could not permanently delete email.", "error");
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
        const returnedItem = await api.updateInventoryItem(updatedItem, file);
        setInventory(prev => prev.map(item => item.id === returnedItem.id ? returnedItem : item));
        logger.info('Inventory item updated', { name: returnedItem.name, id: returnedItem.id });
    } catch (error) {
        addNotification("Error: Could not update inventory item.", "error");
    }
  };

  const deleteInventoryItem = async (itemId: string) => {
    try {
        await api.deleteInventoryItem(itemId);
        setInventory(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
        addNotification("Error: Could not delete inventory item.", "error");
    }
  };

  const hardDeleteInventoryItem = async (itemId: string) => {
    try {
        await api.hardDeleteInventoryItem(itemId);
        setInventory(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
        addNotification("Error: Could not permanently delete inventory item.", "error");
    }
  };

  const addUser = async (user: Omit<User, 'id'>) => {
    try {
        const newUser = await api.addUser(user);
        setUsers(prev => [newUser, ...prev]);
    } catch (error) {
        addNotification("Error: Could not add user.", "error");
    }
  };

  const updateUser = async (updatedUser: User, file?: File): Promise<User | undefined> => {
    try {
        const returnedUser = await api.updateUser(updatedUser, file);
        setUsers(prev => prev.map(user => user.id === returnedUser.id ? { ...user, ...returnedUser } : user));
        return returnedUser;
    } catch (error) {
        addNotification("Error: Could not update user.", "error");
        return undefined;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
        await api.deleteUser(userId);
        setUsers(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
        addNotification("Error: Could not delete user.", "error");
    }
  };

  const hardDeleteUser = async (userId: string) => {
    try {
        await api.hardDeleteUser(userId);
        setUsers(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
        addNotification("Error: Could not permanently delete user.", "error");
    }
  };

  const addInquiry = async (inquiry: Omit<CustomerInquiry, 'id' | 'createdAt'>) => {
    try {
        const newInquiry = await api.addInquiry(inquiry);
        setInquiries(prev => [newInquiry, ...prev]);
        addNotification(`New inquiry from ${inquiry.customerName}.`);
    } catch (error) {
        addNotification("Error: Could not add inquiry.", "error");
    }
  };

  const updateInquiry = async (updatedInquiry: CustomerInquiry) => {
    try {
        const returnedInquiry = await api.updateInquiry(updatedInquiry);
        setInquiries(prev => prev.map(i => i.id === returnedInquiry.id ? returnedInquiry : i));
        addNotification(`Inquiry from ${updatedInquiry.customerName} has been updated.`);
    } catch (error) {
        addNotification("Error: Could not update inquiry.", "error");
    }
  };

  const deleteInquiry = async (inquiryId: string) => {
    try {
        await api.deleteInquiry(inquiryId);
        setInquiries(prev => prev.filter(inquiry => inquiry.id !== inquiryId));
    } catch (error) {
        addNotification("Error: Could not delete inquiry.", "error");
    }
  };

  const hardDeleteInquiry = async (inquiryId: string) => {
    try {
        await api.hardDeleteInquiry(inquiryId);
        setInquiries(prev => prev.filter(inquiry => inquiry.id !== inquiryId));
    } catch (error) {
        addNotification("Error: Could not permanently delete inquiry.", "error");
    }
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
        await api.updateOrderStatus(orderId, newStatus);
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        addNotification(`Order #${orderId.substring(0,8)}... updated to "${newStatus}".`);
    } catch (error) {
        addNotification("Error: Could not update order status.", "error");
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
        await api.deleteOrder(orderId);
        setOrders(prev => prev.filter(order => order.id !== orderId));
    } catch (error) {
        addNotification("Error: Could not archive order.", "error");
    }
  };

  const hardDeleteOrder = async (orderId: string) => {
    try {
        await api.hardDeleteOrder(orderId);
        setOrders(prev => prev.filter(order => order.id !== orderId));
    } catch (error) {
        addNotification("Error: Could not permanently delete order.", "error");
    }
  };

  const checkout = async (customerDetails: { customerName: string; customerContact: string; customerAddress: string; customerEmail: string; }, discountId: string | null): Promise<Order | null> => {
    try {
        const cartItemsForApi = cart.map(item => ({ inventory_item_id: item.id, quantity: item.cartQuantity }));
        const newOrder = await api.checkout(customerDetails, cartItemsForApi, discountId);
        
        if (newOrder) {
            await fetchData();
            clearCart();
            addNotification(`New order created for ${customerDetails.customerName}.`);
            logger.info('New order created', { orderId: newOrder.id, customer: newOrder.customerName });
            addNotification(`Receipt for order #${newOrder.id} is being sent to ${newOrder.customerEmail}.`);
        }
        return newOrder;
    } catch (error: any) {
        const message = error.response?.data?.message || 'Please check item stock levels.';
        addNotification(`Checkout failed: ${message}`, "error");
        return null;
    }
  };
  
  const createBackup = async (): Promise<void> => {
    try {
        const response = await api.createBackup();
        addNotification(response.message, 'info');
        updateBackupSettings({ lastBackupTimestamp: Date.now() });
        logger.info('Server backup created successfully', { file: response.filename });
    } catch (error) {
        addNotification('Failed to create server backup.', 'error');
    }
  }

  const restoreData = async (filename: string): Promise<{ success: boolean, message: string }> => {
    try {
        const result = await api.restoreData(filename);
        if (result.success) {
            addNotification("System data successfully restored. You will be logged out.", "info");
            logger.warn('System data restored from backup', { filename });
            setTimeout(() => logout(), 3000);
        }
        return { success: true, message: result.message };
    } catch (error: any) {
        const message = error.response?.data?.message || "Failed to restore backup.";
        addNotification(`Data restore failed: ${message}`, 'error');
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

  const addDiscount = async (discount: Omit<Discount, 'id' | 'createdAt' | 'usedCount'>) => {
    try {
        const newDiscount = await api.createDiscount(discount);
        setDiscounts(prev => [newDiscount, ...prev]);
    } catch (error) {
        addNotification("Error: Could not add discount.", "error");
    }
  };

  const updateDiscount = async (discount: Discount) => {
    try {
        const updatedDiscount = await api.updateDiscount(discount.id, discount);
        setDiscounts(prev => prev.map(d => d.id === updatedDiscount.id ? updatedDiscount : d));
    } catch (error) {
        addNotification("Error: Could not update discount.", "error");
    }
  };
  
  const deleteDiscount = async (discountId: string) => {
    try {
        await api.deleteDiscount(discountId);
        setDiscounts(prev => prev.filter(d => d.id !== discountId));
    } catch (error) {
        addNotification("Error: Could not delete discount.", "error");
    }
  };

  const hardDeleteDiscount = async (discountId: string) => {
    try {
        await api.hardDeleteDiscount(discountId);
        setDiscounts(prev => prev.filter(d => d.id !== discountId));
    } catch (error) {
        addNotification("Error: Could not permanently delete discount.", "error");
    }
  };

  const updateActivity = async () => {
    try {
        await api.updateActivity();
    } catch (error) {
        logger.warn('Failed to update user activity', error);
    }
  };

  const unblockIp = async (ip: string) => {
    await api.unblockIp(ip);
    await fetchData();
  };
  
  const sendNewsletter = async (subject: string, htmlContent: string, recipientGroup: string) => {
    await api.sendNewsletter(subject, htmlContent, recipientGroup);
    await fetchData();
  };

  return (
    <DataContext.Provider value={{
      inventory, users, inquiries, emails, orders, discounts, userSessions, securityLogs, blockedIPs, newsletters, cart, isLoading,
      addInventoryItem, updateInventoryItem, deleteInventoryItem, hardDeleteInventoryItem,
      addUser, updateUser, deleteUser, hardDeleteUser,
      addInquiry, updateInquiry, deleteInquiry, hardDeleteInquiry,
      addEmail, deleteEmail, hardDeleteEmail,
      notifications, markNotificationsAsRead,
      addToCart, updateCartQuantity, removeFromCart, clearCart,
      checkout, updateOrderStatus, deleteOrder, hardDeleteOrder, createBackup, restoreData,
      backupSettings, updateBackupSettings,
      addDiscount, updateDiscount, deleteDiscount, hardDeleteDiscount,
      refreshData: fetchData,
      updateActivity,
      unblockIp,
      sendNewsletter,
    }}>
      {children}
    </DataContext.Provider>
  );
};
