

import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import { Order, OrderStatus, Role } from '../types';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { PrinterIcon, EyeIcon, PencilSquareIcon, ClipboardDocumentListIcon, ClipboardDocumentIcon, XCircleIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { generateReceipt } from '../lib/generateReceipt';
import { useToast } from '../hooks/useToast';
import ConfirmationModal from '../components/common/ConfirmationModal';
import DataTable, { type Column } from '../components/common/DataTable';
import PageHeader from '../components/common/PageHeader';
import ValidatedInput from '../components/common/ValidatedInput';
import { fetchOrders } from '../lib/api';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const OrderDetailsModal: React.FC<{ order: Order; onClose: () => void; }> = ({ order, onClose }) => {
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
                    {order.items.map((item) => (
                        <li key={item.id}>{item.quantity}x {item.name} @ {formatCurrency(item.price_at_purchase)} each</li>
                    ))}
                </ul>
                 <div className="border-t pt-4 mt-4 space-y-1 text-right">
                    <p><strong>Subtotal:</strong> {formatCurrency(order.subtotal)}</p>
                    {order.discountAmount > 0 && (
                        <p className="text-green-600">
                            <strong>Discount:</strong> -{formatCurrency(order.discountAmount)}
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
        <Modal isOpen={true} onClose={onClose} title={`Update Status for Order ${order.id.substring(0,8)}...`} icon={PencilSquareIcon}>
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

const DeleteModal: React.FC<{
  order: Order;
  onClose: () => void;
  onArchive: () => void;
  onPermanentDelete: () => Promise<void>;
  reauthenticate: (password: string) => Promise<boolean>;
  isAdmin: boolean;
}> = ({ order, onClose, onArchive, onPermanentDelete, reauthenticate, isAdmin }) => {
    const [isPermanentConfirm, setPermanentConfirm] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePermanentDelete = async () => {
        setIsProcessing(true);
        setError('');
        if (await reauthenticate(password)) {
            await onPermanentDelete();
            onClose();
        } else {
            setError('Incorrect password. Deletion failed.');
        }
        setIsProcessing(false);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Delete Order ${order.id.substring(0,8)}...`} icon={ExclamationTriangleIcon}>
            {!isPermanentConfirm ? (
                <div>
                    <p>Are you sure you want to archive this order? It will be hidden from view but can be restored later.</p>
                    <div className="flex justify-end items-center space-x-2 pt-4 mt-4">
                        {isAdmin && (
                            <button onClick={() => setPermanentConfirm(true)} className="text-sm text-red-600 hover:text-red-800 font-medium">
                                Permanently Delete Instead
                            </button>
                        )}
                        <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
                        <button onClick={onArchive} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Archive Order</button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-lg font-medium text-status-red">Permanent Deletion</p>
                    <p>This action is <span className="font-bold">irreversible</span>. Please enter your password to confirm.</p>
                    <ValidatedInput
                        label="Your Password"
                        name="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
                        error={error}
                    />
                    <div className="flex justify-end space-x-2 pt-4">
                        <button onClick={() => setPermanentConfirm(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" disabled={isProcessing}>Back</button>
                        <button onClick={handlePermanentDelete} className="px-4 py-2 bg-status-red text-white rounded hover:bg-red-700 disabled:bg-red-300" disabled={isProcessing || !password}>
                            {isProcessing ? 'Deleting...' : 'Confirm Permanent Delete'}
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
};


const OrdersPage: React.FC = () => {
    const { updateOrderStatus, deleteOrder, hardDeleteOrder, users, refreshData: contextRefresh } = useData();
    const { user, reauthenticate } = useAuth();
    const { showToast } = useToast();
    
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [orderToUpdate, setOrderToUpdate] = useState<Order | null>(null);
    const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
    const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

    const fetchPageData = async (page: number, limit: number) => {
        setIsLoading(true);
        try {
            const response = await fetchOrders(page, limit);
            setOrders(response.data);
            setPagination(response.pagination);
        } catch (error) {
            showToast('Failed to load orders.', 'error');
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchPageData(pagination.page, pagination.limit);
    }, []);

    const handleRefresh = () => {
        contextRefresh(); // Refresh context data as well
        fetchPageData(1, pagination.limit);
    }

    const handlePrintReceipt = (order: Order) => {
        const creator = users.find(u => u.id === order.createdBy);
        generateReceipt(order, creator?.name || 'Unknown User');
    };

    const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
        await updateOrderStatus(orderId, newStatus);
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    };

    const handleCancelConfirm = async () => {
        if (orderToCancel) {
            await updateOrderStatus(orderToCancel.id, OrderStatus.Cancelled);
            showToast(`Order #${orderToCancel.id.substring(0,8)}... has been cancelled.`, 'success');
            setOrders(prev => prev.map(o => o.id === orderToCancel.id ? { ...o, status: OrderStatus.Cancelled } : o));
            setOrderToCancel(null);
        }
    };

    const handleArchive = () => {
        if (orderToDelete) {
            deleteOrder(orderToDelete.id).then(() => {
                showToast(`Order "${orderToDelete.id.substring(0,8)}..." archived successfully.`, 'success');
                fetchPageData(pagination.page, pagination.limit);
            });
            setOrderToDelete(null);
        }
    };
    
    const handlePermanentDelete = async () => {
        if (orderToDelete) {
            await hardDeleteOrder(orderToDelete.id);
            showToast(`Order "${orderToDelete.id.substring(0,8)}..." permanently deleted.`, 'success');
            fetchPageData(pagination.page, pagination.limit);
            setOrderToDelete(null);
        }
    };

    const columns: Column<Order>[] = useMemo(() => {
        const getStatusColor = (status: OrderStatus) => {
            switch (status) {
                case OrderStatus.Processing: return 'bg-blue-100 text-blue-800';
                case OrderStatus.Shipped: return 'bg-indigo-100 text-indigo-800';
                case OrderStatus.Delivered: return 'bg-green-100 text-green-800';
                case OrderStatus.Cancelled: return 'bg-red-100 text-red-800';
                case OrderStatus.Refunded: return 'bg-gray-200 text-gray-800';
            }
        };

        return [
            { header: 'Order ID', accessor: 'id', cell: (order: Order) => <span className="font-mono text-sm text-gray-600">{order.id}</span> },
            { header: 'Customer', accessor: 'customerName' },
            { header: 'Date', accessor: 'createdAt', cell: (order: Order) => new Date(order.createdAt).toLocaleDateString() },
            { 
                header: 'Status', 
                accessor: 'status',
                cell: (order: Order) => <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>{order.status}</span>
            },
            { header: 'Total', accessor: 'total', cell: (order: Order) => <span className="font-semibold">{formatCurrency(order.total)}</span> },
            {
                header: 'Actions',
                accessor: 'actions',
                cell: (order: Order) => (
                    <div className="flex items-center space-x-1">
                        <button onClick={() => setSelectedOrder(order)} className="p-2 text-blue-600 hover:text-blue-800" title="View Details"><EyeIcon className="h-5 w-5" /></button>
                        <button onClick={() => handlePrintReceipt(order)} className="p-2 text-gray-600 hover:text-gray-800" title="Print Receipt"><PrinterIcon className="h-5 w-5" /></button>
                        <button onClick={() => setOrderToUpdate(order)} className="p-2 text-purple-600 hover:text-purple-800" title="Update Status"><PencilSquareIcon className="h-5 w-5" /></button>
                        {order.status === OrderStatus.Processing && (user?.role === Role.Admin || user?.role === Role.Manager) && (
                            <button onClick={() => setOrderToCancel(order)} className="p-2 text-orange-600 hover:text-orange-800" title="Cancel Order"><XCircleIcon className="h-5 w-5" /></button>
                        )}
                         {(user?.role === Role.Admin || user?.role === Role.Manager) && (
                            <button onClick={() => setOrderToDelete(order)} className="p-2 text-red-600 hover:text-red-800" title="Delete Order"><TrashIcon className="h-5 w-5" /></button>
                        )}
                    </div>
                )
            }
        ];
    }, [user, users]);

    return (
        <div>
            <PageHeader 
                title="Order History"
                icon={ClipboardDocumentListIcon}
                onRefresh={handleRefresh}
            />
            
            <Card>
                <DataTable
                    data={orders}
                    columns={columns}
                    isLoading={isLoading}
                    searchableColumns={['id', 'customerName']}
                    filterableColumn={{ accessor: 'status', header: 'Status', options: Object.values(OrderStatus) }}
                    pagination={{
                        currentPage: pagination.page,
                        totalPages: pagination.pages,
                        totalItems: pagination.total,
                        itemsPerPage: pagination.limit,
                        onPageChange: (page) => fetchPageData(page, pagination.limit),
                        onItemsPerPageChange: (limit) => fetchPageData(1, limit),
                    }}
                />
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

            {orderToDelete && (
                <DeleteModal
                    order={orderToDelete}
                    onClose={() => setOrderToDelete(null)}
                    onArchive={handleArchive}
                    onPermanentDelete={handlePermanentDelete}
                    reauthenticate={reauthenticate}
                    isAdmin={user?.role === Role.Admin}
                />
            )}
        </div>
    );
};

export default OrdersPage;
