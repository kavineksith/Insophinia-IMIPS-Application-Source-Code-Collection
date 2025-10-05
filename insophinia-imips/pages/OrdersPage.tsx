import React, { useState } from 'react';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import { Order, OrderStatus, Role } from '../types';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { MagnifyingGlassIcon, PrinterIcon, EyeIcon, PencilSquareIcon, ClipboardDocumentListIcon, ClipboardDocumentIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { generateReceipt } from '../lib/generateReceipt';
import { useToast } from '../hooks/useToast';
import ConfirmationModal from '../components/common/ConfirmationModal';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const OrderDetailsModal: React.FC<{ order: Order; onClose: () => void; }> = ({ order, onClose }) => {
    const calculatedDiscountPercentage = (order.subtotal > 0 && order.discountAmount > 0)
        ? ((order.discountAmount / order.subtotal) * 100).toFixed(0)
        : order.discountApplied;
    
    return (
        <Modal isOpen={true} onClose={onClose} title={`Order Details - ${order.id}`} icon={ClipboardDocumentIcon}>
            <div className="space-y-4">
                <p><strong>Customer:</strong> {order.customerName}</p>
                <p><strong>Contact:</strong> {order.customerContact}</p>
                <p><strong>Address:</strong> {order.customerAddress}</p>
                <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}</p>
                <p><strong>Status:</strong> <span className="font-semibold">{order.status}</span></p>
                <h3 className="font-bold mt-4 border-t pt-2">Items Purchased</h3>
                <ul className="list-disc pl-5">
                    {order.items.map(item => (
                        <li key={item.id}>{item.cartQuantity}x {item.name} @ {formatCurrency(item.price)} each</li>
                    ))}
                </ul>
                 <div className="border-t pt-4 mt-4 space-y-1 text-right">
                    <p><strong>Subtotal:</strong> {formatCurrency(order.subtotal)}</p>
                    {order.discountAmount > 0 && (
                        <p className="text-green-600">
                            <strong>Discount ({calculatedDiscountPercentage}%):</strong> -{formatCurrency(order.discountAmount)}
                        </p>
                    )}
                    <p className="text-lg font-bold"><strong>Total:</strong> {formatCurrency(order.total)}</p>
                </div>
                <div className="flex justify-end pt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Close</button>
                </div>
            </div>
        </Modal>
    );
};

const UpdateStatusModal: React.FC<{ order: Order; onSave: (orderId: string, newStatus: OrderStatus) => void; onClose: () => void; }> = ({ order, onSave, onClose }) => {
    const [newStatus, setNewStatus] = useState<OrderStatus>(order.status);

    const handleSave = () => {
        onSave(order.id, newStatus);
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Update Status for Order ${order.id}`} icon={PencilSquareIcon}>
            <div className="space-y-4">
                <p>Select the new status for this order.</p>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as OrderStatus)} className="w-full p-2 border rounded">
                    {Object.values(OrderStatus).map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>
                <div className="flex justify-end space-x-2 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-brand-secondary">Save Status</button>
                </div>
            </div>
        </Modal>
    );
};


const OrdersPage: React.FC = () => {
    const { orders, updateOrderStatus, users, isLoading } = useData();
    const { user } = useAuth();
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'All'>('All');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [orderToUpdate, setOrderToUpdate] = useState<Order | null>(null);
    const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);

    const filteredOrders = orders
        .filter(order =>
            order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .filter(order => statusFilter === 'All' || order.status === statusFilter);

    const handlePrintReceipt = (order: Order) => {
        const creator = users.find(u => u.id === order.createdBy);
        generateReceipt(order, creator?.name || 'Unknown User');
    };

    const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
        await updateOrderStatus(orderId, newStatus);
        showToast(`Order status updated to ${newStatus}`, 'success');
    };

    const handleCancelConfirm = async () => {
        if (orderToCancel) {
            await updateOrderStatus(orderToCancel.id, OrderStatus.Cancelled);
            showToast(`Order #${orderToCancel.id.substring(0,8)}... has been cancelled.`, 'success');
            setOrderToCancel(null);
        }
    };

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.Processing: return 'bg-blue-100 text-blue-800';
            case OrderStatus.Shipped: return 'bg-indigo-100 text-indigo-800';
            case OrderStatus.Delivered: return 'bg-green-100 text-green-800';
            case OrderStatus.Cancelled: return 'bg-red-100 text-red-800';
            case OrderStatus.Refunded: return 'bg-gray-200 text-gray-800';
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                    <ClipboardDocumentListIcon className="h-8 w-8 mr-3 text-brand-primary" />
                    Order History
                </h1>
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search by Order ID or Customer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent w-80"
                        />
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute top-1/2 left-3 transform -translate-y-1/2" />
                    </div>
                     <div>
                        <label htmlFor="status-filter" className="sr-only">Filter by status</label>
                        <select
                            id="status-filter"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'All')}
                            className="py-2 pl-3 pr-8 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent bg-white"
                        >
                            <option value="All">All Statuses</option>
                            {Object.values(OrderStatus).map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
            <Card>
                {isLoading ? <div className="text-center py-10">Loading orders...</div> : (
                <>
                {/* Desktop Table View */}
                <div className="overflow-x-auto hidden md:block">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b">
                                <th className="p-4 font-semibold">Order ID</th>
                                <th className="p-4 font-semibold">Customer</th>
                                <th className="p-4 font-semibold">Date</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold">Total</th>
                                <th className="p-4 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map(order => (
                                <tr key={order.id} className="border-b hover:bg-gray-50">
                                    <td className="p-4 font-mono text-sm text-gray-600">{order.id}</td>
                                    <td className="p-4 font-medium">{order.customerName}</td>
                                    <td className="p-4 text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="p-4 font-semibold">{formatCurrency(order.total)}</td>
                                    <td className="p-4 flex items-center space-x-2">
                                        <button onClick={() => setSelectedOrder(order)} className="p-2 text-blue-600 hover:text-blue-800" title="View Details" aria-label="View Details">
                                            <EyeIcon className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => handlePrintReceipt(order)} className="p-2 text-gray-600 hover:text-gray-800" title="Print Receipt" aria-label="Print Receipt">
                                            <PrinterIcon className="h-5 w-5" />
                                        </button>
                                        {(user?.role === Role.Admin || user?.role === Role.Manager || user?.role === Role.Staff) && (
                                            <button onClick={() => setOrderToUpdate(order)} className="p-2 text-purple-600 hover:text-purple-800" title="Update Status" aria-label="Update Status">
                                                <PencilSquareIcon className="h-5 w-5" />
                                            </button>
                                        )}
                                        {order.status === OrderStatus.Processing && (user?.role === Role.Admin || user?.role === Role.Manager) && (
                                            <button onClick={() => setOrderToCancel(order)} className="p-2 text-red-600 hover:text-red-800" title="Cancel Order" aria-label="Cancel Order">
                                                <XCircleIcon className="h-5 w-5" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                    {filteredOrders.map(order => (
                        <div key={order.id} className="p-4 border rounded-lg shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-gray-800">{order.customerName}</p>
                                    <p className="text-sm text-gray-500 font-mono">{order.id}</p>
                                    <p className="text-xs text-gray-400 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                    {order.status}
                                </span>
                            </div>
                            <div className="mt-4 flex justify-between items-center border-t pt-3">
                                <p className="text-lg font-bold text-brand-primary">{formatCurrency(order.total)}</p>
                                <div className="flex items-center space-x-1">
                                    <button onClick={() => setSelectedOrder(order)} className="p-2 text-blue-600 hover:text-blue-800" aria-label="View Details"><EyeIcon className="h-5 w-5" /></button>
                                    <button onClick={() => handlePrintReceipt(order)} className="p-2 text-gray-600 hover:text-gray-800" aria-label="Print Receipt"><PrinterIcon className="h-5 w-5" /></button>
                                    {(user?.role === Role.Admin || user?.role === Role.Manager || user?.role === Role.Staff) && (
                                        <button onClick={() => setOrderToUpdate(order)} className="p-2 text-purple-600 hover:text-purple-800" aria-label="Update Status"><PencilSquareIcon className="h-5 w-5" /></button>
                                    )}
                                     {order.status === OrderStatus.Processing && (user?.role === Role.Admin || user?.role === Role.Manager) && (
                                        <button onClick={() => setOrderToCancel(order)} className="p-2 text-red-600 hover:text-red-800" title="Cancel Order" aria-label="Cancel Order">
                                            <XCircleIcon className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredOrders.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No orders found.</p>
                )}
                </>
                )}
            </Card>

            {selectedOrder && (
                <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
            )}

            {orderToUpdate && (
                <UpdateStatusModal order={orderToUpdate} onSave={handleStatusUpdate} onClose={() => setOrderToUpdate(null)} />
            )}

            {orderToCancel && (
                 <ConfirmationModal
                    isOpen={!!orderToCancel}
                    onClose={() => setOrderToCancel(null)}
                    onConfirm={handleCancelConfirm}
                    title="Confirm Order Cancellation"
                    message={`Are you sure you want to cancel the order for "${orderToCancel.customerName}"? This action cannot be undone.`}
                    variant="destructive"
                />
            )}
        </div>
    );
};

export default OrdersPage;