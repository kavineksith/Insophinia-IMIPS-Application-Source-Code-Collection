
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import type { Order, Inquiry, InventoryItem } from '../types';

interface OrderStats {
    total_orders: number;
    total_revenue: number;
    average_order_value: number;
    completed_orders: number;
    processing_orders: number;
}

interface InquiryStats {
    total_inquiries: number;
    pending_inquiries: number;
    in_progress_inquiries: number;
    completed_inquiries: number;
}


const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
        <div className="p-5">
            <div className="flex items-center">
                <div className="flex-shrink-0">
                    {icon}
                </div>
                <div className="ml-5 w-0 flex-1">
                    <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</dt>
                        <dd className="text-3xl font-semibold text-gray-900 dark:text-white">{value}</dd>
                    </dl>
                </div>
            </div>
        </div>
    </div>
);

const DashboardPage: React.FC = () => {
    const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
    const [inquiryStats, setInquiryStats] = useState<InquiryStats | null>(null);
    const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [inquiriesByDay, setInquiriesByDay] = useState<{date: string, count: number}[]>([]);
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                // FIX: Removed `inquiriesByDayRes` from destructuring as it was attempting to access a 5th element from a 4-element array, causing an out-of-bounds error.
                const [orderStatsRes, inquiryStatsRes, lowStockRes, recentOrdersRes] = await Promise.all([
                    api.get<{overview: OrderStats}>('/orders/stats/overview'),
                    api.get<{overview: InquiryStats, inquiriesByDay: {date: string, count: number}[]}>('/inquiries/stats/overview'),
                    api.get<InventoryItem[]>('/inventory/alerts/low-stock'),
                    api.get<{orders: Order[]}>('/orders?limit=5'),
                ]);
                
                setOrderStats(orderStatsRes.overview);
                setInquiryStats(inquiryStatsRes.overview);
                setInquiriesByDay(inquiryStatsRes.inquiriesByDay.map(d => ({...d, date: new Date(d.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})})));
                setLowStockItems(lowStockRes);
                setRecentOrders(recentOrdersRes.orders);

            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            }
        };

        fetchData();
    }, []);

    const formatCurrency = (value: number | undefined) => {
        if (value === undefined || value === null) return '$0.00';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    }

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
            
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Revenue" value={formatCurrency(orderStats?.total_revenue)} icon={<DollarIcon />} />
                <StatCard title="Total Orders" value={orderStats?.total_orders || 0} icon={<ShoppingCartIcon />} />
                <StatCard title="Pending Inquiries" value={inquiryStats?.pending_inquiries || 0} icon={<ChatAlt2Icon />} />
                <StatCard title="Low Stock Items" value={lowStockItems.length} icon={<ExclamationIcon />} />
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Inquiries this month</h3>
                    <div className="mt-4 h-80">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={inquiriesByDay} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                                <XAxis dataKey="date" className="text-xs" />
                                <YAxis allowDecimals={false} className="text-xs" />
                                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem' }} />
                                <Legend />
                                <Bar dataKey="count" fill="#4f46e5" name="Inquiries" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Low Stock Items</h3>
                    <ul className="mt-4 space-y-3 max-h-80 overflow-y-auto">
                        {lowStockItems.length > 0 ? lowStockItems.map(item => (
                             <li key={item.id} className="p-3 rounded-md bg-yellow-50 dark:bg-yellow-900/20 flex justify-between items-center">
                                 <div>
                                     <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</p>
                                     <p className="text-xs text-gray-500 dark:text-gray-400">{item.sku}</p>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">{item.quantity}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">in stock</p>
                                 </div>
                             </li>
                        )) : <p className="text-sm text-gray-500 dark:text-gray-400">No low stock items. Great job!</p>}
                    </ul>
                </div>
            </div>

            <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Orders</h3>
                 <div className="overflow-x-auto mt-4">
                     <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Order ID</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {recentOrders.map(order => (
                                <tr key={order.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{order.id.substring(0, 8)}...</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{order.customer_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatCurrency(order.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                     </table>
                 </div>
            </div>

        </div>
    );
};


const DollarIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8v1m0 6v1m6-4H6m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ShoppingCartIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const ChatAlt2Icon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const ExclamationIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;

export default DashboardPage;
