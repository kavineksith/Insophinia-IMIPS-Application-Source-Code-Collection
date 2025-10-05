import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import { InventoryItem, Role } from '../types';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { PencilIcon, TrashIcon, PlusCircleIcon, MagnifyingGlassIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, ArchiveBoxIcon, PencilSquareIcon, ExclamationTriangleIcon, EyeIcon } from '@heroicons/react/24/solid';
import { useToast } from '../hooks/useToast';
import AuthenticatedImage from '../components/common/AuthenticatedImage';
import ValidatedInput from '../components/common/ValidatedInput';
import { validate, VALIDATION_RULES } from '../lib/validation';

const InventoryForm: React.FC<{ item?: InventoryItem; onSave: (item: any, file: File | null) => void; onCancel: () => void; }> = ({ item, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: item?.name || '',
        sku: item?.sku || '',
        quantity: item?.quantity || 0,
        threshold: item?.threshold || 0,
        category: item?.category || '',
        price: item?.price || 0,
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
            <ValidatedInput label="Price" name="price" type="number" min="0" step="0.01" value={formData.price} onChange={handleChange} error={null} required />

            <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Item Image</label>
                 <input type="file" accept="image/*" onChange={handleImageChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-brand-primary hover:file:bg-blue-100"/>
                 {imagePreview && <AuthenticatedImage src={imagePreview} alt="Preview" className="mt-4 h-32 w-32 object-cover rounded"/>}
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
                <AuthenticatedImage src={item.imageUrl} alt={item.name} className="w-full h-48 object-cover rounded-lg mb-4" />
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong className="block text-gray-500">SKU</strong> {item.sku}</div>
                    <div><strong className="block text-gray-500">Category</strong> {item.category}</div>
                    <div><strong className="block text-gray-500">Price</strong> {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.price)}</div>
                    <div><strong className="block text-gray-500">Warranty</strong> {item.warrantyPeriod || 0} months</div>
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

const DeleteConfirmationModal: React.FC<{ onConfirm: () => void; onCancel: () => void; reauthenticate: (password: string) => Promise<boolean>; }> = ({ onConfirm, onCancel, reauthenticate }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    const handleConfirm = async () => {
        setIsAuthenticating(true);
        setError('');
        if (await reauthenticate(password)) {
            onConfirm();
        } else {
            setError('Incorrect password. Deletion cancelled.');
        }
        setIsAuthenticating(false);
    }

    return (
        <div className="space-y-4">
            <p className="text-lg font-medium">Password Re-authentication Required</p>
            <p>For security, please enter your password to delete this item.</p>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" className="w-full p-2 border rounded" />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex justify-end space-x-2 pt-4">
                <button onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" disabled={isAuthenticating}>Cancel</button>
                <button onClick={handleConfirm} className="px-4 py-2 bg-status-red text-white rounded hover:bg-red-700 disabled:bg-red-300" disabled={isAuthenticating}>
                    {isAuthenticating ? 'Verifying...' : 'Confirm Delete'}
                </button>
            </div>
        </div>
    );
};


const InventoryPage: React.FC = () => {
    const { inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, isLoading } = useData();
    const { user, reauthenticate } = useAuth();
    const { showToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | undefined>(undefined);
    const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSave = async (item: InventoryItem, file: File | null) => {
        const isUpdating = !!item.id;
        // The form passes back the full item object including the old imageUrl. 
        // We can remove it before sending to the backend if a new file is provided.
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

    const handleEdit = (item: InventoryItem) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };
    
    const openDeleteModal = (item: InventoryItem) => {
        setItemToDelete(item);
        setIsDeleteModalOpen(true);
    };
    
    const handleDelete = async () => {
        if (itemToDelete) {
            await deleteInventoryItem(itemToDelete.id);
            showToast(`Item "${itemToDelete.name}" deleted successfully.`, 'success');
        }
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
    };

    const handleExport = () => {
        const jsonString = JSON.stringify(inventory, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'inventory-export.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Inventory data exported successfully!', 'success');
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        showToast('Import is disabled in API mode.', 'info');
        if(event.target) event.target.value = ''; // Reset input
    };

    const getStockStatusColor = (item: InventoryItem) => {
        if (item.quantity <= item.threshold * 0.5) return 'text-status-red';
        if (item.quantity <= item.threshold) return 'text-status-yellow';
        return 'text-status-green';
    }
    
    const categories = ['All', ...new Set(inventory.map(item => item.category))];

    const filteredInventory = inventory.filter(item =>
        (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (categoryFilter === 'All' || item.category === categoryFilter)
    );

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                    <ArchiveBoxIcon className="h-8 w-8 mr-3 text-brand-primary" />
                    Inventory Management
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent"
                        />
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute top-1/2 left-3 transform -translate-y-1/2" />
                    </div>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="py-2 pl-3 pr-8 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent bg-white"
                        aria-label="Filter by category"
                    >
                        {categories.map(cat => <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>)}
                    </select>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept=".json" />
                    <button onClick={handleImportClick} className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg shadow hover:bg-gray-700 transition-colors">
                        <ArrowUpTrayIcon className="h-5 w-5 mr-2" /> Import
                    </button>
                    <button onClick={handleExport} className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg shadow hover:bg-gray-700 transition-colors">
                        <ArrowDownTrayIcon className="h-5 w-5 mr-2" /> Export
                    </button>
                    <button onClick={() => { setSelectedItem(undefined); setIsModalOpen(true); }} className="flex items-center px-4 py-2 bg-brand-primary text-white rounded-lg shadow hover:bg-brand-secondary transition-colors">
                        <PlusCircleIcon className="h-5 w-5 mr-2" />
                        Add New Item
                    </button>
                </div>
            </div>
            <Card>
                {isLoading ? <div className="text-center py-10">Loading inventory...</div> : (
                <>
                {/* Desktop Table View */}
                <div className="overflow-x-auto hidden md:block">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b">
                                <th className="p-4 font-semibold">Item</th>
                                <th className="p-4 font-semibold">SKU</th>
                                <th className="p-4 font-semibold">Price</th>
                                <th className="p-4 font-semibold">Quantity</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInventory.map(item => (
                                <tr key={item.id} className="border-b hover:bg-gray-50">
                                    <td className="p-4 flex items-center">
                                        <AuthenticatedImage src={item.imageUrl} alt={item.name} className="h-12 w-12 rounded-md object-cover mr-4"/>
                                        <span className="font-medium">{item.name}</span>
                                    </td>
                                    <td className="p-4">{item.sku}</td>
                                    <td className="p-4">{formatCurrency(item.price)}</td>
                                    <td className="p-4">{item.quantity}</td>
                                    <td className={`p-4 font-bold ${getStockStatusColor(item)}`}>
                                        {item.quantity <= item.threshold ? 'Low Stock' : 'In Stock'}
                                    </td>
                                    <td className="p-4">
                                        <button onClick={() => handleView(item)} className="p-2 text-gray-600 hover:text-gray-800" title="View Details" aria-label="View Details"><EyeIcon className="h-5 w-5" /></button>
                                        <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 hover:text-blue-800" title="Edit Item" aria-label="Edit Item"><PencilIcon className="h-5 w-5" /></button>
                                        {(user?.role === Role.Admin || user?.role === Role.Manager) && (
                                            <button onClick={() => openDeleteModal(item)} className="p-2 text-red-600 hover:text-red-800" title="Delete Item" aria-label="Delete Item"><TrashIcon className="h-5 w-5" /></button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                    {filteredInventory.map(item => (
                        <div key={item.id} className="p-4 border rounded-lg shadow-sm">
                            <div className="flex items-start space-x-4">
                                <AuthenticatedImage src={item.imageUrl} alt={item.name} className="h-16 w-16 rounded-md object-cover"/>
                                <div className="flex-1">
                                    <p className="font-bold text-gray-800">{item.name}</p>
                                    <p className="text-sm text-gray-500">{item.sku}</p>
                                    <p className="text-lg font-semibold text-brand-primary mt-1">{formatCurrency(item.price)}</p>
                                </div>
                            </div>
                            <div className="mt-4 flex justify-between items-center border-t pt-3">
                                <div className="text-sm">
                                    <p>Quantity: <span className="font-medium">{item.quantity}</span></p>
                                    <p>Status: <span className={`font-bold ${getStockStatusColor(item)}`}>{item.quantity <= item.threshold ? 'Low Stock' : 'In Stock'}</span></p>
                                </div>
                                <div className="flex items-center">
                                    <button onClick={() => handleView(item)} className="p-2 text-gray-600 hover:text-gray-800" title="View Details" aria-label="View Details"><EyeIcon className="h-5 w-5" /></button>
                                    <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 hover:text-blue-800" title="Edit Item" aria-label="Edit Item"><PencilIcon className="h-5 w-5" /></button>
                                    {(user?.role === Role.Admin || user?.role === Role.Manager) && (
                                        <button onClick={() => openDeleteModal(item)} className="p-2 text-red-600 hover:text-red-800" title="Delete Item" aria-label="Delete Item"><TrashIcon className="h-5 w-5" /></button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                </>
                )}
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedItem ? 'Edit Item' : 'Add New Item'}
                icon={selectedItem ? PencilSquareIcon : PlusCircleIcon}
            >
                <InventoryForm item={selectedItem} onSave={handleSave} onCancel={() => { setIsModalOpen(false); setSelectedItem(undefined); }} />
            </Modal>
            
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion" icon={ExclamationTriangleIcon}>
                {itemToDelete && <DeleteConfirmationModal reauthenticate={reauthenticate} onConfirm={handleDelete} onCancel={() => setIsDeleteModalOpen(false)} />}
            </Modal>

            {isViewModalOpen && selectedItem && (
                <ViewItemModal item={selectedItem} onClose={() => { setIsViewModalOpen(false); setSelectedItem(undefined); }} />
            )}
        </div>
    );
};

export default InventoryPage;
