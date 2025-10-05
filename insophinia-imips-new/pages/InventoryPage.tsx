

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import { InventoryItem, Role, InventoryMovement } from '../types';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { PencilIcon, TrashIcon, PlusCircleIcon, ArchiveBoxIcon, PencilSquareIcon, ExclamationTriangleIcon, EyeIcon, ClockIcon } from '@heroicons/react/24/solid';
import { useToast } from '../hooks/useToast';
import AuthenticatedImage from '../components/common/AuthenticatedImage';
import ValidatedInput from '../components/common/ValidatedInput';
import { validate, VALIDATION_RULES } from '../lib/validation';
import DataTable, { type Column } from '../components/common/DataTable';
import PageHeader from '../components/common/PageHeader';
import { fetchInventoryMovements } from '../lib/api';
import { format } from 'date-fns';

const InventoryForm: React.FC<{ item?: InventoryItem; onSave: (item: any, file: File | null) => void; onCancel: () => void; }> = ({ item, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: item?.name || '',
        sku: item?.sku || '',
        quantity: item?.quantity || 0,
        threshold: item?.threshold || 0,
        category: item?.category || '',
        price: item?.price || 0,
        warranty_period_months: item?.warrantyPeriod || 0,
    });
    const [errors, setErrors] = useState({ name: null, sku: null, category: null } as Record<string, string | null>);
    const [isFormValid, setIsFormValid] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(item?.imageUrl || null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    
    useEffect(() => {
        const nameError = validate(formData.name, [VALIDATION_RULES.required, VALIDATION_RULES.name]);
        const skuError = validate(formData.sku, [VALIDATION_RULES.required, VALIDATION_RULES.sku]);
        const categoryError = validate(formData.category, [VALIDATION_RULES.required]);

        setErrors({ name: nameError, sku: skuError, category: categoryError });
        setIsFormValid(!nameError && !skuError && !categoryError);
    }, [formData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;
        onSave({ ...item, ...formData }, imageFile);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <ValidatedInput label="Item Name" name="name" value={formData.name} onChange={handleChange} error={errors.name} required />
            <ValidatedInput label="SKU" name="sku" value={formData.sku} onChange={handleChange} error={errors.sku} required />
            <ValidatedInput label="Category" name="category" value={formData.category} onChange={handleChange} error={errors.category} required />
            <div className="flex space-x-4">
                <ValidatedInput label="Quantity" name="quantity" type="number" min="0" value={formData.quantity} onChange={handleChange} error={null} required className="w-1/2" />
                <ValidatedInput label="Low Stock Threshold" name="threshold" type="number" min="0" value={formData.threshold} onChange={handleChange} error={null} required className="w-1/2" />
            </div>
            <div className="flex space-x-4">
                 <ValidatedInput label="Price" name="price" type="number" min="0" step="0.01" value={formData.price} onChange={handleChange} error={null} required className="w-1/2" />
                 <ValidatedInput label="Warranty (months)" name="warranty_period_months" type="number" min="0" value={formData.warranty_period_months} onChange={handleChange} error={null} className="w-1/2" />
            </div>

            <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Item Image</label>
                 <input type="file" accept="image/*" onChange={handleImageChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-brand-primary hover:file:bg-blue-100"/>
                 {imagePreview && <AuthenticatedImage type="product" src={imagePreview} alt="Preview" className="mt-4 h-32 w-32 object-cover rounded"/>}
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-brand-secondary disabled:bg-gray-400" disabled={!isFormValid}>Save Item</button>
            </div>
        </form>
    );
};

const ViewItemModal: React.FC<{ item: InventoryItem; onClose: () => void; }> = ({ item, onClose }) => {
    const getStockStatusColor = (item: InventoryItem) => {
        if (item.quantity === 0) return 'bg-red-100 text-red-800';
        if (item.quantity <= item.threshold) return 'bg-yellow-100 text-yellow-800';
        return 'bg-green-100 text-green-800';
    };
    
    const getStockStatusText = (item: InventoryItem) => {
        if (item.quantity === 0) return 'Out of Stock';
        if (item.quantity <= item.threshold) return 'Low Stock';
        return 'In Stock';
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={item.name} icon={ArchiveBoxIcon}>
            <div className="space-y-4">
                <AuthenticatedImage type="product" src={item.imageUrl} alt={item.name} className="w-full h-48 object-cover rounded-lg mb-4" />
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong className="block text-gray-500">SKU</strong> {item.sku}</div>
                    <div><strong className="block text-gray-500">Category</strong> {item.category}</div>
                    <div><strong className="block text-gray-500">Price</strong> {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.price)}</div>
                    <div><strong className="block text-gray-500">Warranty</strong> {Number(item.warrantyPeriod) || 0} months</div>
                    <div><strong className="block text-gray-500">Quantity</strong> {item.quantity} units</div>
                    <div><strong className="block text-gray-500">Threshold</strong> {item.threshold} units</div>
                </div>
                 <div className="mt-4">
                    <strong className="block text-gray-500 text-sm">Status</strong>
                     <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStockStatusColor(item)}`}>
                        {getStockStatusText(item)}
                    </span>
                 </div>
            </div>
        </Modal>
    );
};

const MovementHistoryModal: React.FC<{ item: InventoryItem; onClose: () => void; }> = ({ item, onClose }) => {
    const [movements, setMovements] = useState<InventoryMovement[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadMovements = async () => {
            try {
                const data = await fetchInventoryMovements(item.id);
                setMovements(data);
            } catch (error) {
                console.error("Failed to load movement history", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadMovements();
    }, [item.id]);

    return (
        <Modal isOpen={true} onClose={onClose} title={`Movement History for ${item.name}`} icon={ClockIcon}>
            <div className="max-h-[60vh] overflow-y-auto">
                {isLoading ? <p>Loading history...</p> : movements.length > 0 ? (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-2 font-semibold">Date</th>
                                <th className="p-2 font-semibold">Type</th>
                                <th className="p-2 font-semibold">Change</th>
                                <th className="p-2 font-semibold">User</th>
                                <th className="p-2 font-semibold">Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {movements.map(m => (
                                <tr key={m.id} className="border-b">
                                    <td className="p-2 whitespace-nowrap">{format(new Date(m.timestamp), 'MMM dd, yyyy, hh:mm a')}</td>
                                    <td className="p-2">{m.type}</td>
                                    <td className={`p-2 font-bold ${m.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {m.quantityChange > 0 ? '+' : ''}{m.quantityChange}
                                    </td>
                                    <td className="p-2">{m.user_name}</td>
                                    <td className="p-2">{m.reason}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <p className="text-center text-gray-500 py-4">No movement history found.</p>}
            </div>
        </Modal>
    );
};

const DeleteModal: React.FC<{
  item: InventoryItem;
  onClose: () => void;
  onArchive: () => void;
  onPermanentDelete: () => Promise<void>;
  reauthenticate: (password: string) => Promise<boolean>;
  isAdmin: boolean;
}> = ({ item, onClose, onArchive, onPermanentDelete, reauthenticate, isAdmin }) => {
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
        <Modal isOpen={true} onClose={onClose} title={`Delete ${item.name}`} icon={ExclamationTriangleIcon}>
            {!isPermanentConfirm ? (
                <div>
                    <p>Are you sure you want to archive this item? It will be hidden from view but can be restored later.</p>
                    <div className="flex justify-end items-center space-x-2 pt-4 mt-4">
                        {isAdmin && (
                            <button onClick={() => setPermanentConfirm(true)} className="text-sm text-red-600 hover:text-red-800 font-medium">
                                Permanently Delete Instead
                            </button>
                        )}
                        <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
                        <button onClick={onArchive} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Archive Item</button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-lg font-medium text-status-red">Permanent Deletion</p>
                    <p>This action is <span className="font-bold">irreversible</span> and will permanently remove the item from the database. Please enter your password to confirm.</p>
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


const InventoryPage: React.FC = () => {
    const { inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, hardDeleteInventoryItem, isLoading, refreshData } = useData();
    const { user, reauthenticate } = useAuth();
    const { showToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | undefined>(undefined);
    const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

    const handleSave = async (item: InventoryItem, file: File | null) => {
        const isUpdating = !!item.id;
        if (file) {
            delete (item as Partial<InventoryItem>).imageUrl;
        }

        if (isUpdating) {
            await updateInventoryItem(item, file ?? undefined);
        } else {
            await addInventoryItem(item, file ?? undefined);
        }
        showToast(isUpdating ? 'Item updated successfully!' : 'Item added successfully!', 'success');
        setIsModalOpen(false);
        setSelectedItem(undefined);
    };

    const handleView = (item: InventoryItem) => {
        setSelectedItem(item);
        setIsViewModalOpen(true);
    };
    
    const handleViewMovements = (item: InventoryItem) => {
        setSelectedItem(item);
        setIsMovementModalOpen(true);
    };

    const handleEdit = (item: InventoryItem) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };
    
    const openDeleteModal = (item: InventoryItem) => {
        setItemToDelete(item);
        setIsDeleteModalOpen(true);
    };
    
    const handleArchive = () => {
        if (itemToDelete) {
            deleteInventoryItem(itemToDelete.id);
            showToast(`Item "${itemToDelete.name}" archived successfully.`, 'success');
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
        }
    };
    
    const handlePermanentDelete = async () => {
        if (itemToDelete) {
            await hardDeleteInventoryItem(itemToDelete.id);
            showToast(`Item "${itemToDelete.name}" has been permanently deleted.`, 'success');
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }
    
    const columns: Column<InventoryItem>[] = useMemo(() => [
        {
            header: 'Item',
            accessor: 'name',
            cell: (item: InventoryItem) => (
                <div className="flex items-center">
                    <AuthenticatedImage type="product" src={item.imageUrl} alt={item.name} className="h-12 w-12 rounded-md object-cover mr-4"/>
                    <span className="font-medium">{item.name}</span>
                </div>
            )
        },
        { header: 'SKU', accessor: 'sku' },
        { header: 'Category', accessor: 'category' },
        { header: 'Price', accessor: 'price', cell: (item: InventoryItem) => formatCurrency(item.price) },
        { header: 'Quantity', accessor: 'quantity' },
        {
            header: 'Status',
            accessor: 'threshold',
            cell: (item: InventoryItem) => {
                const getStockStatusColor = () => {
                    if (item.quantity === 0) return 'text-status-red';
                    if (item.quantity <= item.threshold) return 'text-status-yellow';
                    return 'text-status-green';
                };
                const getStockStatusText = () => {
                    if (item.quantity === 0) return 'Out of Stock';
                    if (item.quantity <= item.threshold) return 'Low Stock';
                    return 'In Stock';
                };
                return <span className={`font-bold ${getStockStatusColor()}`}>{getStockStatusText()}</span>
            }
        },
        {
            header: 'Actions',
            accessor: 'actions',
            cell: (item: InventoryItem) => (
                <div className="flex items-center space-x-1">
                    <button onClick={() => handleView(item)} className="p-2 text-gray-600 hover:text-gray-800" title="View Details"><EyeIcon className="h-5 w-5" /></button>
                    <button onClick={() => handleViewMovements(item)} className="p-2 text-gray-600 hover:text-gray-800" title="View History"><ClockIcon className="h-5 w-5" /></button>
                    <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 hover:text-blue-800" title="Edit Item"><PencilIcon className="h-5 w-5" /></button>
                    {(user?.role === Role.Admin || user?.role === Role.Manager) && (
                        <button onClick={() => openDeleteModal(item)} className="p-2 text-red-600 hover:text-red-800" title="Delete Item"><TrashIcon className="h-5 w-5" /></button>
                    )}
                </div>
            )
        }
    ], [user]);

    return (
        <div>
            <PageHeader 
                title="Inventory Management"
                icon={ArchiveBoxIcon}
                buttonText="Add New Item"
                onButtonClick={() => { setSelectedItem(undefined); setIsModalOpen(true); }}
                onRefresh={refreshData}
            />

            <Card>
                <DataTable
                    data={inventory}
                    columns={columns}
                    isLoading={isLoading}
                    searchableColumns={['name', 'sku', 'category']}
                    filterableColumn={{ accessor: 'category', header: 'Category' }}
                />
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedItem ? 'Edit Item' : 'Add New Item'}
                icon={selectedItem ? PencilSquareIcon : PlusCircleIcon}
            >
                <InventoryForm item={selectedItem} onSave={handleSave} onCancel={() => { setIsModalOpen(false); setSelectedItem(undefined); }} />
            </Modal>
            
            {isDeleteModalOpen && itemToDelete && (
                <DeleteModal
                    item={itemToDelete}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onArchive={handleArchive}
                    onPermanentDelete={handlePermanentDelete}
                    reauthenticate={reauthenticate}
                    isAdmin={user?.role === Role.Admin}
                />
            )}

            {isViewModalOpen && selectedItem && (
                <ViewItemModal item={selectedItem} onClose={() => { setIsViewModalOpen(false); setSelectedItem(undefined); }} />
            )}
            
            {isMovementModalOpen && selectedItem && (
                <MovementHistoryModal item={selectedItem} onClose={() => { setIsMovementModalOpen(false); setSelectedItem(undefined); }} />
            )}
        </div>
    );
};

export default InventoryPage;
