

import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import { Discount, DiscountType, Role } from '../types';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { useToast } from '../hooks/useToast';
import { PencilIcon, TrashIcon, PlusCircleIcon, TicketIcon, EyeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import ValidatedInput from '../components/common/ValidatedInput';
import { validate, VALIDATION_RULES } from '../lib/validation';
import DataTable, { type Column } from '../components/common/DataTable';
import PageHeader from '../components/common/PageHeader';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const DiscountForm: React.FC<{ discount?: Discount; onSave: (discount: any) => void; onCancel: () => void; }> = ({ discount, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        code: discount?.code || '',
        description: discount?.description || '',
        type: discount?.type || DiscountType.Percentage,
        value: discount?.value || 0,
        min_spend: discount?.min_spend || 0,
        min_items: discount?.min_items || 0,
        isActive: discount?.isActive === false ? false : true,
    });
    const [errors, setErrors] = useState({ code: null, description: null } as Record<string, string | null>);
    const [isFormValid, setIsFormValid] = useState(false);

    useEffect(() => {
        const codeError = validate(formData.code, [VALIDATION_RULES.required, VALIDATION_RULES.discountCode]);
        const descriptionError = validate(formData.description, [VALIDATION_RULES.required]);
        setErrors({ code: codeError, description: descriptionError });
        setIsFormValid(!codeError && !descriptionError && formData.value > 0);
    }, [formData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
             setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
             setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value.toUpperCase() }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;
        const discountData = { ...discount, ...formData };
        onSave(discountData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <ValidatedInput label="Discount Code (e.g., SUMMER10)" name="code" value={formData.code} onChange={handleChange} error={errors.code} required />
            <ValidatedInput label="Description (e.g., 10% off for Summer Sale)" name="description" value={formData.description} onChange={handleChange} error={errors.description} required />
            <div className="flex gap-4">
                <ValidatedInput label="Type" as="select" name="type" value={formData.type} onChange={handleChange} error={null} className="w-1/2 bg-white">
                    <option value={DiscountType.Percentage}>Percentage (%)</option>
                    <option value={DiscountType.FixedAmount}>Fixed Amount ($)</option>
                </ValidatedInput>
                <ValidatedInput label="Value" name="value" type="number" min="0" value={formData.value} onChange={handleChange} error={null} required className="w-1/2" />
            </div>
            <div className="border-t pt-4 mt-4">
                 <h3 className="font-medium text-gray-700">Conditions (optional)</h3>
                 <div className="flex gap-4 mt-2">
                     <ValidatedInput label="Minimum Spend ($)" name="min_spend" type="number" min="0" value={formData.min_spend} onChange={handleChange} error={null} className="w-1/2" />
                     <ValidatedInput label="Minimum Items" name="min_items" type="number" min="0" value={formData.min_items} onChange={handleChange} error={null} className="w-1/2" />
                </div>
            </div>
            <div className="flex items-center">
                <input id="isActive" name="isActive" type="checkbox" checked={formData.isActive} onChange={handleChange} className="h-4 w-4 text-brand-primary focus:ring-brand-accent border-gray-300 rounded"/>
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">Activate this discount code</label>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-brand-secondary disabled:bg-gray-400" disabled={!isFormValid}>Save Discount</button>
            </div>
        </form>
    );
};

const ViewDiscountModal: React.FC<{ discount: Discount; onClose: () => void; }> = ({ discount, onClose }) => {
    return (
        <Modal isOpen={true} onClose={onClose} title="Discount Details" icon={TicketIcon}>
            <div className="space-y-2 text-sm">
                <p><strong>Code:</strong> <span className="font-mono bg-gray-100 px-2 py-1 rounded">{discount.code}</span></p>
                <p><strong>Description:</strong> {discount.description}</p>
                <p><strong>Type:</strong> {discount.type}</p>
                <p><strong>Value:</strong> {discount.type === DiscountType.Percentage ? `${discount.value}%` : formatCurrency(discount.value)}</p>
                <p><strong>Status:</strong> {discount.isActive ? 'Active' : 'Inactive'}</p>
                <p><strong>Times Used:</strong> {discount.usedCount || 0}</p>
                <div className="border-t pt-2 mt-2">
                    <p className="font-semibold">Conditions:</p>
                    <p><strong>Minimum Spend:</strong> {discount.min_spend ? formatCurrency(discount.min_spend) : 'None'}</p>
                    <p><strong>Minimum Items:</strong> {discount.min_items ? `${discount.min_items} items` : 'None'}</p>
                </div>
            </div>
        </Modal>
    );
};

const DeleteModal: React.FC<{
  discount: Discount;
  onClose: () => void;
  onArchive: () => void;
  onPermanentDelete: () => Promise<void>;
  reauthenticate: (password: string) => Promise<boolean>;
  isAdmin: boolean;
}> = ({ discount, onClose, onArchive, onPermanentDelete, reauthenticate, isAdmin }) => {
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
        <Modal isOpen={true} onClose={onClose} title={`Delete Discount ${discount.code}`} icon={ExclamationTriangleIcon}>
            {!isPermanentConfirm ? (
                <div>
                    <p>Are you sure you want to archive this discount? It will be hidden from view but can be restored later.</p>
                    <div className="flex justify-end items-center space-x-2 pt-4 mt-4">
                        {isAdmin && (
                            <button onClick={() => setPermanentConfirm(true)} className="text-sm text-red-600 hover:text-red-800 font-medium">
                                Permanently Delete Instead
                            </button>
                        )}
                        <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
                        <button onClick={onArchive} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Archive Discount</button>
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


const DiscountsPage: React.FC = () => {
    const { discounts, addDiscount, updateDiscount, deleteDiscount, hardDeleteDiscount, isLoading, refreshData } = useData();
    const { user, reauthenticate } = useAuth();
    const { showToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedDiscount, setSelectedDiscount] = useState<Discount | undefined>(undefined);
    const [discountToDelete, setDiscountToDelete] = useState<Discount | null>(null);

    const handleSave = async (discount: Discount) => {
        const isUpdating = !!discount.id;
        if (isUpdating) {
            await updateDiscount(discount);
        } else {
            if (user) {
                await addDiscount({ ...discount, createdBy: user.id });
            }
        }
        showToast(isUpdating ? 'Discount updated successfully!' : 'Discount added successfully!', 'success');
        setIsModalOpen(false);
        setSelectedDiscount(undefined);
    };

    const handleView = (discount: Discount) => {
        setSelectedDiscount(discount);
        setIsViewModalOpen(true);
    };
    
    const handleEdit = (discount: Discount) => {
        setSelectedDiscount(discount);
        setIsModalOpen(true);
    };

    const openDeleteModal = (discount: Discount) => {
        setDiscountToDelete(discount);
        setIsDeleteModalOpen(true);
    };

    const handleArchive = () => {
        if (discountToDelete) {
            deleteDiscount(discountToDelete.id);
            showToast(`Discount "${discountToDelete.code}" archived.`, 'success');
        }
        setIsDeleteModalOpen(false);
        setDiscountToDelete(null);
    };

    const handlePermanentDelete = async () => {
        if (discountToDelete) {
            await hardDeleteDiscount(discountToDelete.id);
            showToast(`Discount "${discountToDelete.code}" permanently deleted.`, 'success');
        }
        setIsDeleteModalOpen(false);
        setDiscountToDelete(null);
    };

    const columns: Column<Discount>[] = useMemo(() => [
        { header: 'Code', accessor: 'code', cell: (d: Discount) => <span className="font-mono text-sm text-gray-700">{d.code}</span> },
        { header: 'Description', accessor: 'description' },
        { header: 'Value', accessor: 'value', cell: (d: Discount) => <span className="font-medium">{d.type === DiscountType.Percentage ? `${d.value}%` : formatCurrency(d.value)}</span> },
        {
            header: 'Status',
            accessor: 'isActive',
            cell: (d: Discount) => (
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${d.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                    {d.isActive ? 'Active' : 'Inactive'}
                </span>
            )
        },
        { header: 'Usage', accessor: 'usedCount', cell: (d: Discount) => d.usedCount || 0 },
        {
            header: 'Actions',
            accessor: 'actions',
            cell: (d: Discount) => (
                <div className="flex items-center space-x-1">
                    <button onClick={() => handleView(d)} className="p-2 text-gray-600 hover:text-gray-800" title="View Details"><EyeIcon className="h-5 w-5" /></button>
                    <button onClick={() => handleEdit(d)} className="p-2 text-blue-600 hover:text-blue-800" title="Edit Discount"><PencilIcon className="h-5 w-5" /></button>
                    <button onClick={() => openDeleteModal(d)} className="p-2 text-red-600 hover:text-red-800" title="Delete Discount"><TrashIcon className="h-5 w-5" /></button>
                </div>
            )
        }
    ], []);


    if (user?.role !== Role.Admin && user?.role !== Role.Manager) {
        return <Card><p className="text-red-500 font-bold">Access Denied. You do not have permission to view this page.</p></Card>;
    }
    
    return (
        <div>
            <PageHeader 
                title="Discount Management"
                icon={TicketIcon}
                buttonText="Add New Discount"
                onButtonClick={() => { setSelectedDiscount(undefined); setIsModalOpen(true); }}
                onRefresh={refreshData}
            />
            
            <Card>
                <DataTable
                    data={discounts}
                    columns={columns}
                    isLoading={isLoading}
                    searchableColumns={['code', 'description']}
                />
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedDiscount ? 'Edit Discount' : 'Add New Discount'}
                icon={TicketIcon}
            >
                <DiscountForm discount={selectedDiscount} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
            </Modal>

            {isViewModalOpen && selectedDiscount && (
                <ViewDiscountModal discount={selectedDiscount} onClose={() => { setIsViewModalOpen(false); setSelectedDiscount(undefined); }} />
            )}

            {isDeleteModalOpen && discountToDelete && (
                <DeleteModal
                    discount={discountToDelete}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onArchive={handleArchive}
                    onPermanentDelete={handlePermanentDelete}
                    reauthenticate={reauthenticate}
                    isAdmin={user?.role === Role.Admin}
                />
            )}
        </div>
    );
};

export default DiscountsPage;
