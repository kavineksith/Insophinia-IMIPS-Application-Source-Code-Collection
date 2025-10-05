import React from 'react';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import { InquiryStatus, InventoryItem, Page, Role, OrderStatus } from '../types';
import Card from '../components/common/Card';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { ArchiveBoxIcon, UsersIcon, ChatBubbleLeftRightIcon, ClipboardDocumentListIcon, CurrencyDollarIcon, ArrowUturnLeftIcon, HomeIcon, ChartBarIcon, PresentationChartLineIcon, TrophyIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import AuthenticatedImage from '../components/common/AuthenticatedImage';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface DashboardPageProps {
  setCurrentPage: (page: Page) => void;
}

interface ProductSale {
    name: string;
    quantity: number;
    revenue: number;
    imageUrl?: string;
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


const DashboardPage: React.FC<DashboardPageProps> = ({ setCurrentPage }) => {
    const { inventory, inquiries, users, orders, isLoading } = useData();
    const { user } = useAuth();

    if (isLoading) {
        return <div className="text-center py-10">Loading dashboard data...</div>;
    }
    
    const lowStockItems = inventory.filter(item => item.quantity <= item.threshold);
    const pendingInquiries = inquiries.filter(inq => inq.status === InquiryStatus.Pending);
    const totalRevenue = orders.reduce((acc, order) => acc + order.total, 0);
    const totalRefunds = orders.filter(o => o.status === OrderStatus.Refunded).reduce((acc, order) => acc + order.total, 0);

    const getStatusIndicator = (item: InventoryItem) => {
        if (item.quantity <= item.threshold * 0.5) return 'bg-status-red';
        if (item.quantity <= item.threshold) return 'bg-status-yellow';
        return 'bg-status-green';
    }

    const inventoryByCategory = inventory.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + item.quantity;
        return acc;
    }, {} as Record<string, number>);

    const inventoryChartData = {
        labels: Object.keys(inventoryByCategory),
        datasets: [
            {
                label: 'Quantity',
                data: Object.values(inventoryByCategory),
                backgroundColor: '#1565C0',
            },
        ],
    };

    const orderStatusCounts = Object.values(OrderStatus).reduce((acc, status) => {
        acc[status] = orders.filter(o => o.status === status).length;
        return acc;
    }, {} as Record<OrderStatus, number>);
    
    const PIE_COLORS: { [key in OrderStatus]: string } = {
        [OrderStatus.Processing]: '#0277BD',
        [OrderStatus.Shipped]: '#1565C0',
        [OrderStatus.Delivered]: '#2E7D32',
        [OrderStatus.Cancelled]: '#C62828',
        [OrderStatus.Refunded]: '#F9A825',
    };
    
    const orderStatusData = {
        labels: Object.keys(orderStatusCounts).filter(status => orderStatusCounts[status as OrderStatus] > 0),
        datasets: [{
            data: Object.values(orderStatusCounts).filter(count => count > 0),
            backgroundColor: Object.keys(orderStatusCounts)
                .filter(status => orderStatusCounts[status as OrderStatus] > 0)
                .map(status => PIE_COLORS[status as OrderStatus]),
            borderColor: '#FFFFFF',
            borderWidth: 2,
        }],
    };
    
    const productSales: Record<string, ProductSale> = orders.flatMap(order => order.items).reduce((acc, item) => {
      if (!acc[item.id]) {
        acc[item.id] = { name: item.name, quantity: 0, revenue: 0, imageUrl: item.imageUrl };
      }
      acc[item.id].quantity += item.cartQuantity;
      acc[item.id].revenue += item.cartQuantity * item.price;
      return acc;
    }, {} as Record<string, ProductSale>);

    const topSellingProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);


    const handleCardClick = (page: Page) => {
        if (page === Page.Users && user?.role !== Role.Admin) {
            return;
        }
        setCurrentPage(page);
    };
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2 }).format(amount);
    }
    
    const formatFullCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: false,
            },
        },
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
                <div onClick={() => handleCardClick(Page.Inventory)} className="cursor-pointer transition-transform transform hover:scale-105">
                    <StatCard icon={ArchiveBoxIcon} title="Inventory Items" value={inventory.length} color="bg-blue-500" />
                </div>
                <div onClick={() => handleCardClick(Page.Users)} className={user?.role === Role.Admin ? "cursor-pointer transition-transform transform hover:scale-105" : "cursor-not-allowed"}>
                    <StatCard icon={UsersIcon} title="Total Users" value={users.length} color="bg-purple-500" />
                </div>
                 <div onClick={() => handleCardClick(Page.Orders)} className="cursor-pointer transition-transform transform hover:scale-105">
                    <StatCard icon={ArrowUturnLeftIcon} title="Total Refunds" value={formatCurrency(totalRefunds)} color="bg-amber-500" />
                </div>
                <div onClick={() => handleCardClick(Page.Inquiries)} className="cursor-pointer transition-transform transform hover:scale-105">
                     <StatCard icon={ChatBubbleLeftRightIcon} title="Pending Inquiries" value={pendingInquiries.length} color="bg-red-500" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
                        <ChartBarIcon className="h-6 w-6 mr-2 text-gray-400" />
                        Inventory by Category
                    </h2>
                     <div className="h-[300px]">
                        <Bar options={chartOptions} data={inventoryChartData} />
                     </div>
                </Card>
                
                <Card>
                    <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
                        <PresentationChartLineIcon className="h-6 w-6 mr-2 text-gray-400" />
                        Order Status Distribution
                    </h2>
                    <div className="h-[300px] flex justify-center items-center">
                        <Pie data={orderStatusData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                </Card>

                <Card className="lg:col-span-2">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
                        <TrophyIcon className="h-6 w-6 mr-2 text-gray-400" />
                        Top Selling Products by Revenue
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b">
                                    <th className="p-3 font-semibold">Product</th>
                                    <th className="p-3 font-semibold">Units Sold</th>
                                    <th className="p-3 font-semibold">Total Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topSellingProducts.map(product => (
                                    <tr key={product.name} className="border-b hover:bg-gray-50">
                                        <td className="p-3 flex items-center">
                                             <AuthenticatedImage src={product.imageUrl} alt={product.name} className="h-10 w-10 rounded-md object-cover mr-4"/>
                                             <span className="font-medium">{product.name}</span>
                                        </td>
                                        <td className="p-3">{product.quantity}</td>
                                        <td className="p-3">{formatFullCurrency(product.revenue)}</td>
                                    </tr>
                                ))}
                                 {topSellingProducts.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="text-center p-4 text-gray-500">No sales data available yet.</td>
                                    </tr>
                                 )}
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
                                <span className={`h-3 w-3 rounded-full mr-3 flex-shrink-0 ${getStatusIndicator(item)}`}></span>
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