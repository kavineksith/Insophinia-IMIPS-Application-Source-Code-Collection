

import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import { Email, Role } from '../types';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { EnvelopeIcon, EyeIcon, PaperClipIcon, ArrowDownCircleIcon, PencilSquareIcon, EnvelopeOpenIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { useToast } from '../hooks/useToast';
import ValidatedInput from '../components/common/ValidatedInput';
import { validate, VALIDATION_RULES } from '../lib/validation';
import DataTable, { Column } from '../components/common/DataTable';
import PageHeader from '../components/common/PageHeader';

// Compose Email Form Component
const EmailComposeForm: React.FC<{ onSend: (email: Omit<Email, 'id' | 'sentAt' | 'attachment_path'>, file: File | null) => void; onCancel: () => void; }> = ({ onSend, onCancel }) => {
    const [formData, setFormData] = useState({
        recipient: '',
        subject: '',
        body: '',
    });
    const [attachment, setAttachment] = useState<File | null>(null);
    const [errors, setErrors] = useState({ recipient: null, subject: null, body: null } as Record<string, string | null>);
    const [isFormValid, setIsFormValid] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        const recipientError = validate(formData.recipient, [VALIDATION_RULES.required, VALIDATION_RULES.email]);
        const subjectError = validate(formData.subject, [VALIDATION_RULES.required]);
        const bodyError = validate(formData.body, [VALIDATION_RULES.required]);

        setErrors({ recipient: recipientError, subject: subjectError, body: bodyError });
        setIsFormValid(!recipientError && !subjectError && !bodyError);
    }, [formData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            setAttachment(null);
            return;
        }

        const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
        
        if (file.size > MAX_FILE_SIZE) {
            showToast('File size cannot exceed 5MB.', 'error');
            e.target.value = '';
            setAttachment(null);
            return;
        }

        setAttachment(file);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;
        onSend(formData, attachment);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <ValidatedInput label="Recipient Email" type="email" name="recipient" value={formData.recipient} onChange={handleChange} error={errors.recipient} required />
            <ValidatedInput label="Subject" type="text" name="subject" value={formData.subject} onChange={handleChange} error={errors.subject} required />
            <ValidatedInput label="Email Body" as="textarea" name="body" value={formData.body} onChange={handleChange} error={errors.body} rows={8} required />
            
            <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Attachment (1 file, max 5MB)</label>
                 <input type="file" onChange={handleFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-brand-primary hover:file:bg-blue-100"/>
                 {attachment && (
                    <div className="mt-2 text-sm text-gray-600 flex items-center">
                        <PaperClipIcon className="h-4 w-4 mr-2"/>
                        <span>{attachment.name} ({(attachment.size / 1024).toFixed(2)} KB)</span>
                    </div>
                 )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-brand-secondary disabled:bg-gray-400" disabled={!isFormValid}>Send Email</button>
            </div>
        </form>
    );
};

// View Email Component
const EmailView: React.FC<{ email: Email; }> = ({ email }) => {
    // Check if the body is likely HTML
    const isHtmlBody = /<[a-z][\s\S]*>/i.test(email.body);
    const attachmentName = email.attachment_path ? email.attachment_path.split('/').pop() : '';

    return (
        <div className="space-y-4">
            <div>
                <label className="font-semibold text-gray-600">To:</label>
                <p className="p-2 bg-gray-100 rounded mt-1">{email.recipient}</p>
            </div>
            <div>
                <label className="font-semibold text-gray-600">Subject:</label>
                <p className="p-2 bg-gray-100 rounded mt-1">{email.subject}</p>
            </div>
             {email.attachment_path && (
                <div>
                    <label className="font-semibold text-gray-600">Attachment:</label>
                    <div className="p-2 bg-gray-100 rounded mt-1 flex justify-between items-center">
                       <div className="flex items-center">
                            <PaperClipIcon className="h-5 w-5 mr-2 text-gray-600"/>
                            <span>{attachmentName}</span>
                       </div>
                       <a href={email.attachment_path} download={attachmentName} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-gray-200 transition-colors" aria-label="Download attachment">
                            <ArrowDownCircleIcon className="h-6 w-6 text-brand-primary"/>
                       </a>
                    </div>
                </div>
            )}
            <div>
                <label className="font-semibold text-gray-600">Body:</label>
                {isHtmlBody ? (
                    <div className="p-2 border rounded mt-1 overflow-auto" style={{maxHeight: '40vh'}}>
                       <iframe srcDoc={email.body} title="Email Content" className="w-full h-full border-0" style={{minHeight: '300px'}}/>
                    </div>
                ) : (
                    <pre className="p-2 bg-gray-100 rounded mt-1 whitespace-pre-wrap font-sans text-sm">{email.body}</pre>
                )}
            </div>
             <div>
                <label className="font-semibold text-gray-600">Sent:</label>
                <p className="text-sm text-gray-500 mt-1">{new Date(email.sentAt).toLocaleString()}</p>
            </div>
        </div>
    );
};

const DeleteModal: React.FC<{
  email: Email;
  onClose: () => void;
  onArchive: () => void;
  onPermanentDelete: () => Promise<void>;
  reauthenticate: (password: string) => Promise<boolean>;
  isAdmin: boolean;
}> = ({ email, onClose, onArchive, onPermanentDelete, reauthenticate, isAdmin }) => {
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
        <Modal isOpen={true} onClose={onClose} title={`Delete Email`} icon={ExclamationTriangleIcon}>
            {!isPermanentConfirm ? (
                <div>
                    <p>Are you sure you want to archive this email to "{email.recipient}"? It will be hidden from view.</p>
                    <div className="flex justify-end items-center space-x-2 pt-4 mt-4">
                        {isAdmin && (
                            <button onClick={() => setPermanentConfirm(true)} className="text-sm text-red-600 hover:text-red-800 font-medium">
                                Permanently Delete Instead
                            </button>
                        )}
                        <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
                        <button onClick={onArchive} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Archive Email</button>
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

// Main Page Component
const EmailPage: React.FC = () => {
    const { emails, addEmail, deleteEmail, hardDeleteEmail, isLoading, refreshData } = useData();
    const { user, reauthenticate } = useAuth();
    const { showToast } = useToast();
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [emailToDelete, setEmailToDelete] = useState<Email | null>(null);
    
    if (user?.role !== Role.Admin && user?.role !== Role.Manager) {
        return <Card><p className="text-red-500 font-bold">Access Denied. You do not have permission to view this page.</p></Card>
    }

    const handleSendEmail = async (email: Omit<Email, 'id' | 'sentAt' | 'attachment_path'>, file: File | null) => {
        await addEmail(email, file ?? undefined);
        showToast(`Email successfully sent to ${email.recipient}`, 'success');
        setIsComposeOpen(false);
    };

    const handleViewEmail = (email: Email) => {
        setSelectedEmail(email);
        setIsViewOpen(true);
    };

    const handleArchive = () => {
        if (emailToDelete) {
            deleteEmail(emailToDelete.id);
            showToast(`Email to "${emailToDelete.recipient}" archived successfully.`, 'success');
        }
        setEmailToDelete(null);
    };
    
    const handlePermanentDelete = async () => {
        if (emailToDelete) {
            await hardDeleteEmail(emailToDelete.id);
            showToast(`Email to "${emailToDelete.recipient}" permanently deleted.`, 'success');
        }
        setEmailToDelete(null);
    };

    const columns: Column<Email>[] = useMemo(() => [
        { 
            header: 'Recipient',
            accessor: 'recipient',
            cell: (email: Email) => (
                 <div className="flex items-center">
                    <span>{email.recipient}</span>
                    {email.attachment_path && <PaperClipIcon className="h-4 w-4 ml-2 text-gray-500" title="This email has an attachment"/>}
                </div>
            )
        },
        { header: 'Subject', accessor: 'subject' },
        { header: 'Date Sent', accessor: 'sentAt', cell: (email: Email) => new Date(email.sentAt).toLocaleString() },
        { 
            header: 'Actions',
            accessor: 'actions',
            cell: (email: Email) => (
                <div className="flex items-center space-x-1">
                    <button onClick={() => handleViewEmail(email)} className="p-2 text-blue-600 hover:text-blue-800" aria-label="View Email">
                        <EyeIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => setEmailToDelete(email)} className="p-2 text-red-600 hover:text-red-800" title="Delete Email">
                        <TrashIcon className="h-5 w-5" />
                    </button>
                </div>
            )
        }
    ], []);

    return (
        <div>
            <PageHeader
                title="Email Center"
                icon={EnvelopeIcon}
                buttonText="Compose Email"
                onButtonClick={() => setIsComposeOpen(true)}
                onRefresh={refreshData}
            />

            <Card>
                <DataTable
                    data={emails}
                    columns={columns}
                    isLoading={isLoading}
                    searchableColumns={['recipient', 'subject']}
                />
            </Card>

            <Modal isOpen={isComposeOpen} onClose={() => setIsComposeOpen(false)} title="Compose New Email" icon={PencilSquareIcon}>
                <EmailComposeForm onSend={handleSendEmail} onCancel={() => setIsComposeOpen(false)} />
            </Modal>
            
            <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="View Email" icon={EnvelopeOpenIcon}>
                {selectedEmail && <EmailView email={selectedEmail} />}
            </Modal>

            {emailToDelete && (
                <DeleteModal
                    email={emailToDelete}
                    onClose={() => setEmailToDelete(null)}
                    onArchive={handleArchive}
                    onPermanentDelete={handlePermanentDelete}
                    reauthenticate={reauthenticate}
                    isAdmin={user?.role === Role.Admin}
                />
            )}

        </div>
    );
};

export default EmailPage;
