import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import { CustomerInquiry, InquiryStatus } from '../types';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { PencilIcon, PlusCircleIcon, TrashIcon, MagnifyingGlassIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, ChatBubbleLeftRightIcon, PencilSquareIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { useToast } from '../hooks/useToast';
import ValidatedInput from '../components/common/ValidatedInput';
import { validate, VALIDATION_RULES } from '../lib/validation';
import ConfirmationModal from '../components/common/ConfirmationModal';

const InquiryForm: React.FC<{ inquiry?: CustomerInquiry; onSave: (inquiry: any) => void; onCancel: () => void; }> = ({ inquiry, onSave, onCancel }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        customerName: inquiry?.customerName || '',
        customerEmail: inquiry?.customerEmail || '',
        inquiryDetails: inquiry?.inquiryDetails || '',
        status: inquiry?.status || InquiryStatus.Pending,
        assignedStaffId: inquiry?.assignedStaffId || user?.id || ''
    });
    const [errors, setErrors] = useState({ customerName: null, customerEmail: null, inquiryDetails: null } as Record<string, string | null>);
    const [isFormValid, setIsFormValid] = useState(false);
    
    useEffect(() => {
        const nameError = validate(formData.customerName, [VALIDATION_RULES.required, VALIDATION_RULES.name]);
        const emailError = validate(formData.customerEmail, [VALIDATION_RULES.required, VALIDATION_RULES.email]);
        const detailsError = validate(formData.inquiryDetails, [VALIDATION_RULES.required]);

        setErrors({ customerName: nameError, customerEmail: emailError, inquiryDetails: detailsError });
        setIsFormValid(!nameError && !emailError && !detailsError);
    }, [formData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;
        onSave({ ...inquiry, ...formData });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <ValidatedInput label="Customer Name" name="customerName" value={formData.customerName} onChange={handleChange} error={errors.customerName} required />
            <ValidatedInput label="Customer Email" name="customerEmail" type="email" value={formData.customerEmail} onChange={handleChange} error={errors.customerEmail} required />
            <ValidatedInput label="Inquiry Details" name="inquiryDetails" as="textarea" value={formData.inquiryDetails} onChange={handleChange} error={errors.inquiryDetails} rows={4} required />
            <ValidatedInput label="Status" as="select" name="status" value={formData.status} onChange={handleChange} error={null} required>
                {Object.values(InquiryStatus).map(status => <option key={status} value={status}>{status}</option>)}
            </ValidatedInput>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-brand-secondary disabled:bg-gray-400" disabled={!isFormValid}>Save Inquiry</button>
            </div>
        </form>
    );
};

const InquiriesPage: React.FC = () => {
    const { inquiries, addInquiry, updateInquiry, deleteInquiry, isLoading } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedInquiry, setSelectedInquiry] = useState<CustomerInquiry | undefined>(undefined);
    const [inquiryToDelete, setInquiryToDelete] = useState<CustomerInquiry | null>(null);
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<InquiryStatus | 'All'>('All');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSave = async (inquiry: CustomerInquiry) => {
        const isUpdating = !!inquiry.id;
        if (isUpdating) {
            await updateInquiry(inquiry);
        } else {
            await addInquiry(inquiry);
        }
        
        showToast(`Inquiry from ${inquiry.customerName} ${isUpdating ? 'updated' : 'created'}.`, 'success');

        setIsModalOpen(false);
        setSelectedInquiry(undefined);
    };

    const handleEdit = (inquiry: CustomerInquiry) => {
        setSelectedInquiry(inquiry);
        setIsModalOpen(true);
    };

    const openDeleteModal = (inquiry: CustomerInquiry) => {
        setInquiryToDelete(inquiry);
        setIsDeleteModalOpen(true);
    };
    
    const handleDelete = async () => {
        if (inquiryToDelete) {
            await deleteInquiry(inquiryToDelete.id);
            showToast(`Inquiry from "${inquiryToDelete.customerName}" deleted successfully.`, 'success');
        }
        setIsDeleteModalOpen(false);
        setInquiryToDelete(null);
    };

    const handleExport = () => {
        const jsonString = JSON.stringify(inquiries, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'inquiries-export.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Inquiries data exported successfully!', 'success');
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        showToast('Import is disabled in API mode.', 'info');
        if(event.target) event.target.value = '';
    };

    const getStatusColor = (status: InquiryStatus) => {
        switch (status) {
            case InquiryStatus.Pending: return 'bg-yellow-100 text-yellow-800';
            case InquiryStatus.InProgress: return 'bg-blue-100 text-blue-800';
            case InquiryStatus.Completed: return 'bg-green-100 text-green-800';
        }
    };

    const filteredInquiries = inquiries.filter(inquiry =>
        (inquiry.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.inquiryDetails.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (statusFilter === 'All' || inquiry.status === statusFilter)
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                    <ChatBubbleLeftRightIcon className="h-8 w-8 mr-3 text-brand-primary" />
                    Customer Inquiries
                </h1>
                 <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                        <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent"/>
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute top-1/2 left-3 transform -translate-y-1/2" />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as InquiryStatus | 'All')}
                        className="py-2 pl-3 pr-8 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent bg-white"
                        aria-label="Filter by status"
                    >
                        <option value="All">All Statuses</option>
                        {Object.values(InquiryStatus).map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept=".json" />
                    <button onClick={handleImportClick} className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg shadow hover:bg-gray-700 transition-colors">
                        <ArrowUpTrayIcon className="h-5 w-5 mr-2" /> Import
                    </button>
                    <button onClick={handleExport} className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg shadow hover:bg-gray-700 transition-colors">
                        <ArrowDownTrayIcon className="h-5 w-5 mr-2" /> Export
                    </button>
                    <button onClick={() => { setSelectedInquiry(undefined); setIsModalOpen(true); }} className="flex items-center px-4 py-2 bg-brand-primary text-white rounded-lg shadow hover:bg-brand-secondary transition-colors">
                        <PlusCircleIcon className="h-5 w-5 mr-2" />
                        Add New Inquiry
                    </button>
                </div>
            </div>
            <Card>
                {isLoading ? <div className="text-center py-10">Loading inquiries...</div> : (
                <>
                {/* Desktop Table View */}
                <div className="overflow-x-auto hidden md:block">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b">
                                <th className="p-4 font-semibold">Customer</th>
                                <th className="p-4 font-semibold">Details</th>
                                <th className="p-4 font-semibold">Date</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInquiries.map(inquiry => (
                                <tr key={inquiry.id} className="border-b hover:bg-gray-50">
                                    <td className="p-4">
                                        <p className="font-medium">{inquiry.customerName}</p>
                                        <p className="text-sm text-gray-500">{inquiry.customerEmail}</p>
                                    </td>
                                    <td className="p-4 max-w-sm truncate">{inquiry.inquiryDetails}</td>
                                    <td className="p-4 text-sm text-gray-600">{new Date(inquiry.createdAt).toLocaleDateString()}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-sm font-semibold rounded-full ${getStatusColor(inquiry.status)}`}>
                                            {inquiry.status}
                                        </span>
                                    </td>
                                    <td className="p-4 flex items-center space-x-1">
                                        <button onClick={() => handleEdit(inquiry)} className="p-2 text-blue-600 hover:text-blue-800" aria-label="Edit Inquiry" title="Edit Inquiry"><PencilIcon className="h-5 w-5" /></button>
                                        <button onClick={() => openDeleteModal(inquiry)} className="p-2 text-red-600 hover:text-red-800" aria-label="Delete Inquiry" title="Delete Inquiry"><TrashIcon className="h-5 w-5" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                    {filteredInquiries.map(inquiry => (
                        <div key={inquiry.id} className="p-4 border rounded-lg shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-gray-800">{inquiry.customerName}</p>
                                    <p className="text-sm text-gray-500">{inquiry.customerEmail}</p>
                                    <p className="text-xs text-gray-400 mt-1">{new Date(inquiry.createdAt).toLocaleString()}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(inquiry.status)}`}>
                                    {inquiry.status}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-3">{inquiry.inquiryDetails}</p>
                            <div className="mt-3 flex justify-end items-center border-t pt-2">
                                <button onClick={() => handleEdit(inquiry)} className="p-2 text-blue-600 hover:text-blue-800" aria-label="Edit Inquiry" title="Edit Inquiry"><PencilIcon className="h-5 w-5" /></button>
                                <button onClick={() => openDeleteModal(inquiry)} className="p-2 text-red-600 hover:text-red-800" aria-label="Delete Inquiry" title="Delete Inquiry"><TrashIcon className="h-5 w-5" /></button>
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
                title={selectedInquiry ? 'Update Inquiry' : 'Add New Inquiry'}
                icon={selectedInquiry ? PencilSquareIcon : PlusCircleIcon}
            >
                <InquiryForm inquiry={selectedInquiry} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
            </Modal>
            
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Confirm Deletion"
                message={`Are you sure you want to delete the inquiry from "${inquiryToDelete?.customerName}"?`}
                variant="destructive"
            />
        </div>
    );
};

export default InquiriesPage;