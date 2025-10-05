

import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import { CustomerInquiry, InquiryStatus, Role, InquiryResponse } from '../types';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { PencilIcon, PlusCircleIcon, TrashIcon, ChatBubbleLeftRightIcon, PencilSquareIcon, EyeIcon, ExclamationTriangleIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { useToast } from '../hooks/useToast';
import ValidatedInput from '../components/common/ValidatedInput';
import { validate, VALIDATION_RULES } from '../lib/validation';
import DataTable, { type Column } from '../components/common/DataTable';
import PageHeader from '../components/common/PageHeader';
import { fetchInquiryResponses, respondToInquiry } from '../lib/api';
import { format } from 'date-fns';

const InquiryForm: React.FC<{ inquiry?: CustomerInquiry; onSave: (inquiry: any) => void; onCancel: () => void; }> = ({ inquiry, onSave, onCancel }) => {
    const { user } = useAuth();
    const { users } = useData();
    const [formData, setFormData] = useState({
        customer_name: inquiry?.customerName || '',
        customer_email: inquiry?.customerEmail || '',
        inquiry_details: inquiry?.inquiryDetails || '',
        status: inquiry?.status || InquiryStatus.Pending,
        assigned_user_id: inquiry?.assignedStaffId || user?.id || ''
    });
    const [errors, setErrors] = useState({ customer_name: null, customer_email: null, inquiry_details: null } as Record<string, string | null>);
    const [isFormValid, setIsFormValid] = useState(false);
    
    useEffect(() => {
        const nameError = validate(formData.customer_name, [VALIDATION_RULES.required, VALIDATION_RULES.name]);
        const emailError = validate(formData.customer_email, [VALIDATION_RULES.required, VALIDATION_RULES.email]);
        const detailsError = validate(formData.inquiry_details, [VALIDATION_RULES.required]);

        setErrors({ customer_name: nameError, customer_email: emailError, inquiry_details: detailsError });
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
            <ValidatedInput label="Customer Name" name="customer_name" value={formData.customer_name} onChange={handleChange} error={errors.customer_name} required />
            <ValidatedInput label="Customer Email" name="customer_email" type="email" value={formData.customer_email} onChange={handleChange} error={errors.customer_email} required />
            <ValidatedInput label="Inquiry Details" name="inquiry_details" as="textarea" value={formData.inquiry_details} onChange={handleChange} error={errors.inquiry_details} rows={4} required />
            <ValidatedInput label="Status" as="select" name="status" value={formData.status} onChange={handleChange} error={null} required>
                {Object.values(InquiryStatus).map(status => <option key={status} value={status}>{status}</option>)}
            </ValidatedInput>
             <ValidatedInput label="Assigned To" as="select" name="assigned_user_id" value={formData.assigned_user_id} onChange={handleChange} error={null}>
                <option value="">Unassigned</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </ValidatedInput>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-brand-secondary disabled:bg-gray-400" disabled={!isFormValid}>Save Inquiry</button>
            </div>
        </form>
    );
};

const RespondModal: React.FC<{ inquiry: CustomerInquiry; onClose: () => void; onSent: () => void; }> = ({ inquiry, onClose, onSent }) => {
    const [message, setMessage] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isSending, setIsSending] = useState(false);
    const { showToast } = useToast();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments(Array.from(e.target.files));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);
        try {
            await respondToInquiry(inquiry.id, message, attachments);
            showToast('Response sent successfully!', 'success');
            onSent();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to send response.', 'error');
        } finally {
            setIsSending(false);
        }
    };
    
    return (
        <Modal isOpen={true} onClose={onClose} title={`Respond to ${inquiry.customerName}`} icon={PaperAirplaneIcon}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <ValidatedInput as="textarea" label="Your Message" value={message} onChange={e => setMessage((e.target as HTMLTextAreaElement).value)} rows={8} required />
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Attachments (optional, max 5)</label>
                    <input type="file" multiple onChange={handleFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-brand-primary hover:file:bg-blue-100"/>
                </div>
                 <div className="flex justify-end space-x-2 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" disabled={isSending}>Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-brand-secondary disabled:bg-gray-400" disabled={isSending || !message}>
                        {isSending ? 'Sending...' : 'Send Response'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

const ViewInquiryModal: React.FC<{ inquiry: CustomerInquiry; onClose: () => void; }> = ({ inquiry, onClose }) => {
    const { users } = useData();
    const [responses, setResponses] = useState<InquiryResponse[]>([]);
    const assignedStaff = users.find(u => u.id === inquiry.assignedStaffId);
    
    useEffect(() => {
        fetchInquiryResponses(inquiry.id).then(setResponses);
    }, [inquiry.id]);

    return (
        <Modal isOpen={true} onClose={onClose} title="Inquiry Details" icon={ChatBubbleLeftRightIcon}>
            <div className="space-y-3 text-sm">
                <p><strong>Customer:</strong> {inquiry.customerName} ({inquiry.customerEmail})</p>
                <p><strong>Received:</strong> {new Date(inquiry.createdAt).toLocaleString()}</p>
                <p><strong>Status:</strong> {inquiry.status}</p>
                <p><strong>Assigned To:</strong> {assignedStaff?.name || 'Unassigned'}</p>
                <div className="border-t pt-3 mt-3">
                    <p className="font-semibold">Details:</p>
                    <p className="mt-1 p-2 bg-gray-50 rounded whitespace-pre-wrap">{inquiry.inquiryDetails}</p>
                </div>

                <div className="border-t pt-3 mt-3">
                    <p className="font-semibold">Response History ({responses.length})</p>
                    <div className="max-h-48 overflow-y-auto space-y-2 mt-2">
                        {responses.length > 0 ? responses.map(res => (
                            <div key={res.id} className="p-2 bg-blue-50 rounded">
                                <p className="whitespace-pre-wrap">{res.response_message}</p>
                                <p className="text-xs text-gray-500 mt-1">Sent by {res.responded_by_name} on {format(new Date(res.created_at), 'Pp')}</p>
                            </div>
                        )) : <p className="text-xs text-gray-500">No responses yet.</p>}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

const DeleteModal: React.FC<{ inquiry: CustomerInquiry; onClose: () => void; onArchive: () => void; onPermanentDelete: () => Promise<void>; reauthenticate: (password: string) => Promise<boolean>; isAdmin: boolean; }> = ({ inquiry, onClose, onArchive, onPermanentDelete, reauthenticate, isAdmin }) => {
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
        <Modal isOpen={true} onClose={onClose} title={`Delete Inquiry from ${inquiry.customerName}`} icon={ExclamationTriangleIcon}>
            {!isPermanentConfirm ? (
                <div>
                    <p>Are you sure you want to archive this inquiry?</p>
                    <div className="flex justify-end items-center space-x-2 pt-4 mt-4">
                        {isAdmin && ( <button onClick={() => setPermanentConfirm(true)} className="text-sm text-red-600 hover:text-red-800 font-medium">Permanently Delete Instead</button> )}
                        <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
                        <button onClick={onArchive} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Archive Inquiry</button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-lg font-medium text-status-red">Permanent Deletion</p>
                    <p>This action is <span className="font-bold">irreversible</span>. Please enter your password to confirm.</p>
                    <ValidatedInput label="Your Password" name="password" type="password" value={password} onChange={(e) => setPassword((e.target as HTMLInputElement).value)} error={error}/>
                    <div className="flex justify-end space-x-2 pt-4">
                        <button onClick={() => setPermanentConfirm(false)} className="px-4 py-2 bg-gray-200 rounded" disabled={isProcessing}>Back</button>
                        <button onClick={handlePermanentDelete} className="px-4 py-2 bg-status-red text-white rounded" disabled={isProcessing || !password}>
                            {isProcessing ? 'Deleting...' : 'Confirm Permanent Delete'}
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

const InquiriesPage: React.FC = () => {
    const { inquiries, addInquiry, updateInquiry, deleteInquiry, hardDeleteInquiry, isLoading, refreshData } = useData();
    const { user, reauthenticate } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isRespondModalOpen, setIsRespondModalOpen] = useState(false);
    const [selectedInquiry, setSelectedInquiry] = useState<CustomerInquiry | undefined>(undefined);
    const [inquiryToDelete, setInquiryToDelete] = useState<CustomerInquiry | null>(null);
    const { showToast } = useToast();

    const handleSave = async (inquiryData: any) => {
        const isUpdating = !!inquiryData.id;
        const inquiryToSave = {
            id: inquiryData.id,
            customerName: inquiryData.customer_name,
            customerEmail: inquiryData.customer_email,
            inquiryDetails: inquiryData.inquiry_details,
            status: inquiryData.status,
            assignedStaffId: inquiryData.assigned_user_id
        } as CustomerInquiry;

        if (isUpdating) {
            await updateInquiry(inquiryToSave);
        } else {
            await addInquiry(inquiryToSave);
        }
        showToast(`Inquiry from ${inquiryData.customer_name} ${isUpdating ? 'updated' : 'created'}.`, 'success');
        setIsModalOpen(false);
        setSelectedInquiry(undefined);
    };

    const handleView = (inquiry: CustomerInquiry) => {
        setSelectedInquiry(inquiry);
        setIsViewModalOpen(true);
    };

    const handleEdit = (inquiry: CustomerInquiry) => {
        setSelectedInquiry(inquiry);
        setIsModalOpen(true);
    };

    const openDeleteModal = (inquiry: CustomerInquiry) => {
        setInquiryToDelete(inquiry);
        setIsDeleteModalOpen(true);
    };
    
    const handleArchive = () => {
        if (inquiryToDelete) {
            deleteInquiry(inquiryToDelete.id);
            showToast(`Inquiry from "${inquiryToDelete.customerName}" archived successfully.`, 'success');
        }
        setIsDeleteModalOpen(false);
        setInquiryToDelete(null);
    };
    
    const handlePermanentDelete = async () => {
        if (inquiryToDelete) {
            await hardDeleteInquiry(inquiryToDelete.id);
            showToast(`Inquiry from "${inquiryToDelete.customerName}" permanently deleted.`, 'success');
        }
        setIsDeleteModalOpen(false);
        setInquiryToDelete(null);
    };
    
    const openRespondModal = (inquiry: CustomerInquiry) => {
        setSelectedInquiry(inquiry);
        setIsRespondModalOpen(true);
    };

    const columns: Column<CustomerInquiry>[] = useMemo(() => {
        const getStatusColor = (status: InquiryStatus) => {
            switch (status) {
                case InquiryStatus.Pending: return 'bg-yellow-100 text-yellow-800';
                case InquiryStatus.InProgress: return 'bg-blue-100 text-blue-800';
                case InquiryStatus.Completed: return 'bg-green-100 text-green-800';
            }
        };

        return [
            { header: 'Customer', accessor: 'customerName', cell: (inquiry: CustomerInquiry) => ( <div><p className="font-medium">{inquiry.customerName}</p><p className="text-sm text-gray-500">{inquiry.customerEmail}</p></div> )},
            { header: 'Details', accessor: 'inquiryDetails', cell: (inquiry: CustomerInquiry) => <p className="max-w-sm truncate">{inquiry.inquiryDetails}</p>},
            { header: 'Date', accessor: 'createdAt', cell: (inquiry: CustomerInquiry) => new Date(inquiry.createdAt).toLocaleDateString() },
            { header: 'Status', accessor: 'status', cell: (inquiry: CustomerInquiry) => ( <span className={`px-2 py-1 text-sm font-semibold rounded-full ${getStatusColor(inquiry.status)}`}>{inquiry.status}</span> ) },
            { header: 'Actions', accessor: 'actions', cell: (inquiry: CustomerInquiry) => (
                    <div className="flex items-center space-x-1">
                        <button onClick={() => handleView(inquiry)} className="p-2 text-gray-600 hover:text-gray-800" title="View Inquiry"><EyeIcon className="h-5 w-5" /></button>
                        <button onClick={() => openRespondModal(inquiry)} className="p-2 text-green-600 hover:text-green-800" title="Respond"><PaperAirplaneIcon className="h-5 w-5" /></button>
                        <button onClick={() => handleEdit(inquiry)} className="p-2 text-blue-600 hover:text-blue-800" title="Edit Inquiry"><PencilIcon className="h-5 w-5" /></button>
                        <button onClick={() => openDeleteModal(inquiry)} className="p-2 text-red-600 hover:text-red-800" title="Delete Inquiry"><TrashIcon className="h-5 w-5" /></button>
                    </div>
                )
            }
        ];
    }, []);

    return (
        <div>
            <PageHeader title="Customer Inquiries" icon={ChatBubbleLeftRightIcon} buttonText="Add New Inquiry" onButtonClick={() => { setSelectedInquiry(undefined); setIsModalOpen(true); }} onRefresh={refreshData}/>
            <Card>
                <DataTable data={inquiries} columns={columns} isLoading={isLoading} searchableColumns={['customerName', 'customerEmail', 'inquiryDetails']} filterableColumn={{ accessor: 'status', header: 'Status', options: Object.values(InquiryStatus) }}/>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedInquiry ? 'Update Inquiry' : 'Add New Inquiry'} icon={selectedInquiry ? PencilSquareIcon : PlusCircleIcon}>
                <InquiryForm inquiry={selectedInquiry} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
            </Modal>

            {isViewModalOpen && selectedInquiry && ( <ViewInquiryModal inquiry={selectedInquiry} onClose={() => { setIsViewModalOpen(false); setSelectedInquiry(undefined); }} /> )}
            
            {isDeleteModalOpen && inquiryToDelete && ( <DeleteModal inquiry={inquiryToDelete} onClose={() => setIsDeleteModalOpen(false)} onArchive={handleArchive} onPermanentDelete={handlePermanentDelete} reauthenticate={reauthenticate} isAdmin={user?.role === Role.Admin} /> )}

            {isRespondModalOpen && selectedInquiry && ( <RespondModal inquiry={selectedInquiry} onClose={() => setIsRespondModalOpen(false)} onSent={() => { setIsRespondModalOpen(false); refreshData(); }}/> )}
        </div>
    );
};

export default InquiriesPage;
