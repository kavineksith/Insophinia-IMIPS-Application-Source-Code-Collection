import React, { useState, useEffect } from 'react';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import { Discount, DiscountType, Role } from '../types';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { useToast } from '../hooks/useToast';
import { PencilIcon, TrashIcon, PlusCircleIcon, MagnifyingGlassIcon, TicketIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import ValidatedInput from '../components/common/ValidatedInput';
import { validate, VALIDATION_RULES } from '../lib/validation';
import ConfirmationModal from '../components/common/ConfirmationModal';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const DiscountForm: React.FC<{ discount?: Discount; onSave: (discount: any) => void; onCancel: () => void; }> = ({ discount, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        code: discount?.code || '',
        description: discount?.description || '',
        type: discount?.type || DiscountType.Percentage,
        value: discount?.value || 0,
        minSpend: discount?.condition.minSpend || 0,
        minItems: discount?.condition.minItems || 0,
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
             setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;
        const discountData = {
            ...discount,
            ...formData,
            condition: {
                minSpend: formData.minSpend,
                minItems: formData.minItems,
            }
        };
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
                     <ValidatedInput label="Minimum Spend ($)" name="minSpend" type="number" min="0" value={formData.minSpend} onChange={handleChange} error={null} className="w-1/2" />
                     <ValidatedInput label="Minimum Items" name="minItems" type="number" min="0" value={formData.minItems} onChange={handleChange} error={null} className="w-1/2" />
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

const DiscountsPage: React.FC = () => {
    const { discounts, addDiscount, updateDiscount, deleteDiscount, isLoading } = useData();
    const { user } = useAuth();
    const { showToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedDiscount, setSelectedDiscount] = useState<Discount | undefined>(undefined);
    const [discountToDelete, setDiscountToDelete] = useState<Discount | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

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
    
    const handleEdit = (discount: Discount) => {
        setSelectedDiscount(discount);
        setIsModalOpen(true);
    };

    const openDeleteModal = (discount: Discount) => {
        setDiscountToDelete(discount);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (discountToDelete) {
            await deleteDiscount(discountToDelete.id);
            showToast(`Discount "${discountToDelete.code}" deleted.`, 'success');
        }
        setIsDeleteModalOpen(false);
        setDiscountToDelete(null);
    };

    const filteredDiscounts = discounts.filter(d => 
        d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (user?.role !== Role.Admin && user?.role !== Role.Manager) {
        return <Card><p className="text-red-500 font-bold">Access Denied. You do not have permission to view this page.</p></Card>;
    }
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                    <TicketIcon className="h-8 w-8 mr-3 text-brand-primary" />
                    Discount Management
                </h1>
                 <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                        <input type="text" placeholder="Search codes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent"/>
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute top-1/2 left-3 transform -translate-y-1/2" />
                    </div>
                    <button onClick={() => { setSelectedDiscount(undefined); setIsModalOpen(true); }} className="flex items-center px-4 py-2 bg-brand-primary text-white rounded-lg shadow hover:bg-brand-secondary transition-colors">
                        <PlusCircleIcon className="h-5 w-5 mr-2" />
                        Add New Discount
                    </button>
                </div>
            </div>
            <Card>
                {isLoading ? <div className="text-center py-10">Loading discounts...</div> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b">
                                    <th className="p-4 font-semibold">Code</th>
                                    <th className="p-4 font-semibold">Description</th>
                                    <th className="p-4 font-semibold">Value</th>
                                    <th className="p-4 font-semibold">Status</th>
                                    <th className="p-4 font-semibold">Usage</th>
                                    <th className="p-4 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDiscounts.map(d => (
                                    <tr key={d.id} className="border-b hover:bg-gray-50">
                                        <td className="p-4 font-mono text-sm text-gray-700">{d.code}</td>
                                        <td className="p-4">{d.description}</td>
                                        <td className="p-4 font-medium">
                                            {d.type === DiscountType.Percentage ? `${d.value}%` : formatCurrency(d.value)}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${d.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                                                {d.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="p-4">{d.usedCount || 0}</td>
                                        <td className="p-4">
                                            <button onClick={() => handleEdit(d)} className="p-2 text-blue-600 hover:text-blue-800"><PencilIcon className="h-5 w-5" /></button>
                                            <button onClick={() => openDeleteModal(d)} className="p-2 text-red-600 hover:text-red-800"><TrashIcon className="h-5 w-5" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredDiscounts.length === 0 && (
                            <p className="text-center text-gray-500 py-8">No discounts found.</p>
                        )}
                    </div>
                )}
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedDiscount ? 'Edit Discount' : 'Add New Discount'}
                icon={TicketIcon}
            >
                <DiscountForm discount={selectedDiscount} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
            </Modal>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Confirm Deletion"
                message={`Are you sure you want to delete the discount "${discountToDelete?.code}"?`}
                variant="destructive"
            />

        </div>
    );
};

export default DiscountsPage;