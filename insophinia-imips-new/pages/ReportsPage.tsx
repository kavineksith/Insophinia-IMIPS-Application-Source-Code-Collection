
import React, { useState, useMemo } from 'react';
import { useData } from '../hooks/useData';
import Card from '../components/common/Card';
import { DocumentChartBarIcon, CurrencyDollarIcon, ClipboardDocumentListIcon, ChartBarIcon, ArrowDownTrayIcon, TrophyIcon, UserGroupIcon, TagIcon, ArchiveBoxIcon } from '@heroicons/react/24/solid';
import { subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format, parseISO, isWithinInterval } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import AuthenticatedImage from '../components/common/AuthenticatedImage';

const ReportsPage: React.FC = () => {
    // FIX: Destructure `inventory` to look up item categories.
    const { orders, isLoading, users, inventory } = useData();
    const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'ytd' | 'custom'>('30d');
    const [customRange, setCustomRange] = useState<{ start: Date, end: Date }>({
        start: subDays(new Date(), 30),
        end: new Date(),
    });

    const handleDateRangeChange = (range: typeof dateRange) => {
        setDateRange(range);
        const now = new Date();
        let start = now;
        if (range === '7d') start = subDays(now, 7);
        if (range === '30d') start = subDays(now, 30);
        if (range === '90d') start = subDays(now, 90);
        if (range === 'ytd') start = startOfYear(now);
        
        if (range !== 'custom') {
            setCustomRange({ start, end: now });
        }
    };

    const filteredOrders = useMemo(() => {
        return orders.filter(order => isWithinInterval(parseISO(order.createdAt), { start: customRange.start, end: customRange.end }));
    }, [orders, customRange]);

    // --- KPIs ---
    const totalRevenue = filteredOrders.reduce((acc, order) => acc + order.total, 0);
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalDiscounts = filteredOrders.reduce((acc, order) => acc + order.discountAmount, 0);
    // FIX: Property 'cartQuantity' does not exist on type 'OrderItem'. Use 'quantity'.
    const totalItemsSold = filteredOrders.reduce((acc, order) => acc + order.items.reduce((itemAcc, item) => itemAcc + item.quantity, 0), 0);

    // --- Chart Data ---
    const salesByDay = filteredOrders.reduce((acc, order) => {
        const day = format(parseISO(order.createdAt), 'yyyy-MM-dd');
        acc[day] = (acc[day] || 0) + order.total;
        return acc;
    }, {} as Record<string, number>);

    const salesTrendData = Object.keys(salesByDay).map(day => ({
        date: day,
        revenue: salesByDay[day],
    })).sort((a,b) => (new Date(a.date) as any) - (new Date(b.date) as any));

    // --- Top Products ---
    const productSales = filteredOrders.flatMap(order => order.items).reduce((acc, item) => {
      acc[item.name] = (acc[item.name] || { quantity: 0, revenue: 0, imageUrl: item.image_url });
      acc[item.name].quantity += item.quantity;
      acc[item.name].revenue += item.quantity * item.price_at_purchase;
      return acc;
    }, {} as Record<string, { quantity: number; revenue: number; imageUrl?: string; }>);

    const topSellingProducts = Object.entries(productSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // --- Category & Staff Data ---
    // FIX: Correctly access properties on the 'OrderItem' type and look up category from inventory.
    const salesByCategory = filteredOrders.flatMap(o => o.items).reduce((acc, item) => {
        const inventoryItem = inventory.find(i => i.id === item.inventory_item_id);
        const category = inventoryItem?.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + (item.price_at_purchase * item.quantity);
        return acc;
    }, {} as Record<string, number>);
    const categoryChartData = Object.entries(salesByCategory).map(([name, value]) => ({ name, value }));
    const CATEGORY_COLORS = ['#0D47A1', '#1976D2', '#42A5F5', '#90CAF9', '#1E88E5', '#64B5F6'];

    const salesByStaff = filteredOrders.reduce((acc, order) => {
        if (order.createdBy) {
            const staffName = users.find(u => u.id === order.createdBy)?.name || 'Unknown';
            acc[staffName] = (acc[staffName] || 0) + order.total;
        }
        return acc;
    }, {} as Record<string, number>);
    const staffChartData = Object.entries(salesByStaff).map(([name, revenue]) => ({ name, revenue })).sort((a,b) => b.revenue - a.revenue).slice(0, 10);

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    
    const handleExport = () => {
        const headers = ['Product Name', 'Units Sold', 'Total Revenue'];
        const csvContent = [
            headers.join(','),
            ...topSellingProducts.map(p => [p.name.replace(/,/g, ''), p.quantity, p.revenue].join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'sales_report.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const StatCard: React.FC<{ icon: React.ElementType; title: string; value: string | number; }> = ({ icon: Icon, title, value }) => (
        <Card className="flex items-center">
            <div className="p-3 rounded-full mr-4 bg-brand-accent text-white">
                <Icon className="h-7 w-7" />
            </div>
            <div>
                <p className="text-sm text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
        </Card>
    );

    const rangeButtons = [
        { key: '7d', label: 'Last 7 Days' },
        { key: '30d', label: 'Last 30 Days' },
        { key: '90d', label: 'Last 90 Days' },
        { key: 'ytd', label: 'Year to Date' },
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                    <DocumentChartBarIcon className="h-8 w-8 mr-3 text-brand-primary" />
                    Sales Reports
                </h1>
                <button onClick={handleExport} className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg shadow hover:bg-gray-700 transition-colors">
                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" /> Export CSV
                </button>
            </div>

            <Card className="mb-6">
                <div className="flex flex-wrap items-center gap-4">
                    {rangeButtons.map(btn => (
                        <button key={btn.key} onClick={() => handleDateRangeChange(btn.key as any)} className={`px-4 py-2 rounded-lg font-semibold transition-colors ${dateRange === btn.key ? 'bg-brand-primary text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>
                            {btn.label}
                        </button>
                    ))}
                    <div className="flex items-center gap-2">
                        <input type="date" value={format(customRange.start, 'yyyy-MM-dd')} onChange={e => { setDateRange('custom'); setCustomRange(p => ({ ...p, start: new Date(e.target.value) }))}} className="p-2 border rounded-lg"/>
                        <span>to</span>
                        <input type="date" value={format(customRange.end, 'yyyy-MM-dd')} onChange={e => { setDateRange('custom'); setCustomRange(p => ({ ...p, end: new Date(e.target.value) }))}} className="p-2 border rounded-lg"/>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-6">
                <StatCard icon={CurrencyDollarIcon} title="Total Revenue" value={formatCurrency(totalRevenue)} />
                <StatCard icon={ClipboardDocumentListIcon} title="Total Orders" value={totalOrders} />
                <StatCard icon={ChartBarIcon} title="Avg. Order Value" value={formatCurrency(avgOrderValue)} />
                <StatCard icon={TagIcon} title="Total Discounts" value={formatCurrency(totalDiscounts)} />
                <StatCard icon={ArchiveBoxIcon} title="Items Sold" value={totalItemsSold} />
            </div>

            <Card className="mb-6">
                 <h2 className="text-xl font-semibold mb-4 text-gray-700">Revenue Trend</h2>
                 {isLoading ? <div className="text-center py-10">Loading chart data...</div> : (
                 <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={salesTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickFormatter={dateStr => format(new Date(dateStr), 'MMM dd')} />
                        <YAxis tickFormatter={(value) => `$${(value as number / 1000)}k`} />
                        <Tooltip formatter={(value) => formatCurrency(value as number)}/>
                        <Legend />
                        <Bar dataKey="revenue" fill="#1565C0" />
                    </BarChart>
                 </ResponsiveContainer>
                 )}
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
                <Card className="lg:col-span-2">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Sales by Category</h2>
                    {isLoading ? <div className="text-center py-10">Loading chart...</div> : categoryChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={categoryChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                                    {categoryChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : <p className="text-center text-gray-500 py-8">No category data available for this period.</p>}
                </Card>
                <Card className="lg:col-span-3">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Top Performing Staff</h2>
                    {isLoading ? <div className="text-center py-10">Loading chart...</div> : staffChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={staffChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" tickFormatter={(value) => formatCurrency(value as number)} />
                                <YAxis type="category" dataKey="name" width={80} />
                                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                <Legend />
                                <Bar dataKey="revenue" fill="#1565C0" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <p className="text-center text-gray-500 py-8">No staff performance data available for this period.</p>}
                </Card>
            </div>
            
            <Card>
                <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
                    <TrophyIcon className="h-6 w-6 mr-2 text-gray-400" />
                    Top Selling Products
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b">
                                <th className="p-3 font-semibold">Product</th>
                                <th className="p-3 font-semibold text-right">Units Sold</th>
                                <th className="p-3 font-semibold text-right">Total Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topSellingProducts.map(p => (
                                <tr key={p.name} className="border-b hover:bg-gray-50">
                                    <td className="p-3 flex items-center">
                                        <AuthenticatedImage type="product" src={p.imageUrl} alt={p.name} className="h-10 w-10 rounded-md object-cover mr-4"/>
                                        <span className="font-medium">{p.name}</span>
                                    </td>
                                    <td className="p-3 font-medium text-right">{p.quantity}</td>
                                    <td className="p-3 font-semibold text-right">{formatCurrency(p.revenue)}</td>
                                </tr>
                            ))}
                             {topSellingProducts.length === 0 && !isLoading && <td colSpan={3} className="text-center text-gray-500 py-8">No sales data in this period.</td>}
                             {isLoading && <td colSpan={3} className="text-center text-gray-500 py-8">Loading products...</td>}
                        </tbody>
                    </table>
                </div>
            </Card>

        </div>
    );
};

export default ReportsPage;
