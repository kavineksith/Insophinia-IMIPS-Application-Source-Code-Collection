
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { Order } from '../types';

const OrdersPage: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const fetchOrders = useCallback(async () => {
        try {
            setIsLoading(true);
            const endpoint = filter === 'all' ? '/orders' : `/orders?status=${filter}`;
            const data = await api.get<{ orders: Order[] }>(endpoint);
            setOrders(data.orders);
        } catch (error) {
            console.error("Failed to fetch orders", error);
        } finally {
            setIsLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    
    const getStatusColor = (status: Order['status']) => {
        switch(status) {
            case 'Processing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
            case 'Shipped': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
            case 'Delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
            case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
            case 'Refunded': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700';
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Orders</h1>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    Create New Order
                </button>
            </div>
             <div className="mt-4 border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {['all', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`${filter === tab ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="mt-8 flex flex-col">
                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                        <div className="shadow overflow-hidden border-b border-gray-200 dark:border-gray-700 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Order ID</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">View</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {isLoading ? (
                                        <tr><td colSpan={6} className="text-center py-4">Loading orders...</td></tr>
                                    ) : orders.map((order) => (
                                        <tr key={order.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500 dark:text-gray-400">{order.id.substring(0, 8)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{order.customer_name}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">{order.customer_email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Date(order.created_at).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(order.total)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <a href="#" className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">View</a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrdersPage;
