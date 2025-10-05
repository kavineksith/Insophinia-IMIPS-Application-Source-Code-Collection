import React from 'react';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import { InquiryStatus, Page, Role, OrderStatus, User } from '../types';
import Card from '../components/common/Card';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import { ArchiveBoxIcon, UsersIcon, ChatBubbleLeftRightIcon, ClipboardDocumentListIcon, CurrencyDollarIcon, ArrowUturnLeftIcon, HomeIcon, TrophyIcon, ExclamationTriangleIcon, UserGroupIcon, ClockIcon, TicketIcon } from '@heroicons/react/24/solid';
import AuthenticatedImage from '../components/common/AuthenticatedImage';
import { subDays, format, parseISO } from 'date-fns';

interface DashboardPageProps {
  setCurrentPage: (page: Page) => void;
}

const StatCard: React.FC<{ icon: React.ElementType; title: string; value: string | number; color: string; }> = ({ icon: Icon, title, value, color }) => (
    <Card className="flex items-center h-full">
        <div className={`p-3 rounded-full mr-4 ${color}`}>
            <Icon className="h-8 w-8 text-white" />
        </div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </Card>
);

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2 }).format(amount);
}

const formatFullCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

const DashboardPage: React.FC<DashboardPageProps> = ({ setCurrentPage }) => {
    const { inventory, inquiries, users, orders, discounts, isLoading } = useData();
    const { user } = useAuth();

    if (isLoading) {
        return <div className="text-center py-10">Loading dashboard data...</div>;
    }
    
    // --- Data Processing ---
    const lowStockItems = inventory.filter(item => item.quantity <= item.threshold);
    const pendingInquiries = inquiries.filter(inq => inq.status === InquiryStatus.Pending);
    const totalRevenue = orders.reduce((acc, order) => acc + order.total, 0);
    const ongoingOrders = orders.filter(o => o.status === OrderStatus.Processing || o.status === OrderStatus.Shipped);
    const refundTotal = orders.filter(o => o.status === OrderStatus.Refunded).reduce((acc, order) => acc + order.total, 0);
    const activeDiscounts = discounts.filter(d => d.isActive);

    // Sales in the last 30 days
    const last30Days = subDays(new Date(), 30);
    const salesLast30Days = orders.filter(o => parseISO(o.createdAt) >= last30Days);

    const salesByDay = salesLast30Days.reduce((acc, order) => {
        const day = format(parseISO(order.createdAt), 'MMM dd');
        acc[day] = (acc[day] || 0) + order.total;
        return acc;
    }, {} as Record<string, number>);

    const salesTrendData = Object.keys(salesByDay).map(day => ({
        date: day,
        revenue: salesByDay[day],
    })).sort((a,b) => (new Date(a.date) as any) - (new Date(b.date) as any));
    
    // Top selling products by revenue
    // FIX: Correctly access properties on the 'OrderItem' type.
    const productSales = orders.flatMap(order => order.items).reduce((acc, item) => {
      acc[item.name] = (acc[item.name] || { quantity: 0, revenue: 0, imageUrl: item.image_url });
      acc[item.name].quantity += item.quantity;
      acc[item.name].revenue += item.quantity * item.price_at_purchase;
      return acc;
    }, {} as Record<string, { quantity: number; revenue: number; imageUrl?: string; }>);

    const topSellingProducts = Object.entries(productSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Staff Leaderboard
    const staffPerformance = orders.reduce((acc, order) => {
        if (order.createdBy) {
            acc[order.createdBy] = (acc[order.createdBy] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const staffLeaderboard = Object.entries(staffPerformance)
        .map(([userId, orderCount]) => {
            const staffUser = users.find(u => u.id === userId);
            return {
                name: staffUser?.name || 'Unknown User',
                profilePictureUrl: staffUser?.profilePictureUrl,
                orderCount,
            };
        })
        .sort((a, b) => b.orderCount - a.orderCount)
        .slice(0, 5);
        
    const recentOrders = [...orders].sort((a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime()).slice(0, 5);

    const handleCardClick = (page: Page) => {
        if (page === Page.Users && user?.role !== Role.Admin) {
            return;
        }
        setCurrentPage(page);
    };
    
    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
                <HomeIcon className="h-8 w-8 mr-3 text-brand-primary" />
                Welcome back, {user?.name?.split(' ')[0]}!
            </h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                 <div onClick={() => handleCardClick(Page.Orders)} className="cursor-pointer transition-transform transform hover:scale-105">
                    <StatCard icon={CurrencyDollarIcon} title="Total Revenue" value={formatCurrency(totalRevenue)} color="bg-green-500" />
                </div>
                 <div onClick={() => handleCardClick(Page.Orders)} className="cursor-pointer transition-transform transform hover:scale-105">
                    <StatCard icon={ClipboardDocumentListIcon} title="Total Orders" value={orders.length} color="bg-indigo-500" />
                </div>
                 <div onClick={() => handleCardClick(Page.Orders)} className="cursor-pointer transition-transform transform hover:scale-105">
                    <StatCard icon={ClockIcon} title="Ongoing Orders" value={ongoingOrders.length} color="bg-cyan-500" />
                </div>
                <div onClick={() => handleCardClick(Page.Orders)} className="cursor-pointer transition-transform transform hover:scale-105">
                    <StatCard icon={ArrowUturnLeftIcon} title="Total Refunds" value={formatCurrency(refundTotal)} color="bg-gray-500" />
                </div>
                <div onClick={() => handleCardClick(Page.Inquiries)} className="cursor-pointer transition-transform transform hover:scale-105">
                     <StatCard icon={ChatBubbleLeftRightIcon} title="Pending Inquiries" value={pendingInquiries.length} color="bg-blue-500" />
                </div>
                <div onClick={() => handleCardClick(Page.Inventory)} className="cursor-pointer transition-transform transform hover:scale-105">
                    <StatCard icon={ExclamationTriangleIcon} title="Low Stock Items" value={lowStockItems.length} color="bg-yellow-500" />
                </div>
                 <div onClick={() => handleCardClick(Page.Discounts)} className="cursor-pointer transition-transform transform hover:scale-105">
                    <StatCard icon={TicketIcon} title="Active Discounts" value={activeDiscounts.length} color="bg-pink-500" />
                </div>
                {user?.role === Role.Admin && (
                    <div onClick={() => handleCardClick(Page.Users)} className="cursor-pointer transition-transform transform hover:scale-105">
                        <StatCard icon={UsersIcon} title="Total Users" value={users.length} color="bg-purple-500" />
                    </div>
                )}
                <div onClick={() => handleCardClick(Page.Inventory)} className="cursor-pointer transition-transform transform hover:scale-105">
                    <StatCard icon={ArchiveBoxIcon} title="Inventory Items" value={inventory.length} color="bg-orange-500" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-3">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Sales Trend (Last 30 Days)</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={salesTrendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis tickFormatter={(value) => formatCurrency(value as number)} />
                            <Tooltip formatter={(value) => formatFullCurrency(value as number)} />
                            <Legend />
                            <Line type="monotone" dataKey="revenue" stroke="#0D47A1" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }}/>
                        </LineChart>
                    </ResponsiveContainer>
                </Card>

                <Card className="lg:col-span-2">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
                        <TrophyIcon className="h-6 w-6 mr-2 text-gray-400" />
                        Top Selling Products
                    </h2>
                    <div className="overflow-x-auto">
                         <table className="w-full text-left">
                            <tbody>
                                {topSellingProducts.map(product => (
                                    <tr key={product.name} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="p-3 flex items-center">
                                             <AuthenticatedImage type="product" src={product.imageUrl} alt={product.name} className="h-10 w-10 rounded-md object-cover mr-4"/>
                                             <span className="font-medium">{product.name}</span>
                                        </td>
                                        <td className="p-3 text-right">
                                            <p className="font-semibold">{formatFullCurrency(product.revenue)}</p>
                                            <p className="text-sm text-gray-500">{product.quantity} units sold</p>
                                        </td>
                                    </tr>
                                ))}
                                 {topSellingProducts.length === 0 && (
                                    <tr>
                                        <td colSpan={2} className="text-center p-4 text-gray-500">No sales data available yet.</td>
                                    </tr>
                                 )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                <Card>
                    <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
                        <UserGroupIcon className="h-6 w-6 mr-2 text-gray-400" />
                        Staff Leaderboard
                    </h2>
                    <ul className="space-y-4">
                        {staffLeaderboard.map((staff, index) => (
                            <li key={staff.name} className="flex items-center">
                                <span className="font-bold text-lg text-gray-400 w-6">{index + 1}.</span>
                                <AuthenticatedImage type="user" src={staff.profilePictureUrl} alt={staff.name} className="h-10 w-10 rounded-full object-cover mr-3"/>
                                <div>
                                    <p className="font-semibold">{staff.name}</p>
                                    <p className="text-sm text-gray-500">{staff.orderCount} orders</p>
                                </div>
                            </li>
                        ))}
                        {staffLeaderboard.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No staff sales data yet.</p>}
                    </ul>
                </Card>
                
                <Card className="lg:col-span-2">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
                        <ClockIcon className="h-6 w-6 mr-2 text-gray-400" />
                        Recent Orders
                    </h2>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <tbody>
                                {recentOrders.map(order => (
                                    <tr key={order.id} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="p-3">
                                            <p className="font-semibold">{order.customerName}</p>
                                            <p className="text-sm text-gray-500 font-mono">{order.id}</p>
                                        </td>
                                        <td className="p-3 text-right">
                                            <p className="font-semibold">{formatFullCurrency(order.total)}</p>
                                            <p className="text-sm text-gray-500">{format(parseISO(order.createdAt), 'MMM dd, yyyy')}</p>
                                        </td>
                                    </tr>
                                ))}
                                {recentOrders.length === 0 && <tr><td colSpan={2} className="text-center p-4 text-gray-500">No orders placed yet.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </Card>

                <Card>
                    <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
                        <ExclamationTriangleIcon className="h-6 w-6 mr-2 text-gray-400" />
                        Urgent Alerts
                    </h2>
                    <ul className="space-y-2">
                        {lowStockItems.slice(0, 3).map(item => (
                            <li key={item.id} onClick={() => handleCardClick(Page.Inventory)} className="flex items-center p-2 -mx-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                                <span className="h-3 w-3 rounded-full mr-3 flex-shrink-0 bg-status-yellow"></span>
                                <div>
                                    <p className="font-medium text-gray-800">{item.name}</p>
                                    <p className="text-sm text-gray-500">Qty: {item.quantity} (Threshold: {item.threshold})</p>
                                </div>
                            </li>
                        ))}
                         {pendingInquiries.slice(0, 2).map(inquiry => (
                            <li key={inquiry.id} onClick={() => handleCardClick(Page.Inquiries)} className="flex items-center p-2 -mx-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                                <span className="h-3 w-3 rounded-full mr-3 flex-shrink-0 bg-status-blue"></span>
                                <div>
                                    <p className="font-medium text-gray-800">New Inquiry</p>
                                    <p className="text-sm text-gray-500">From: {inquiry.customerName}</p>
                                </div>
                            </li>
                        ))}
                         {lowStockItems.length === 0 && pendingInquiries.length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-4">No urgent alerts. Great job!</p>
                         )}
                    </ul>
                </Card>
            </div>
        </div>
    );
};

export default DashboardPage;