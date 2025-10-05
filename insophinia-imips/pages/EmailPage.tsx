import React, { useState, useEffect } from 'react';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import { Email, Role } from '../types';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { EnvelopeIcon, MagnifyingGlassIcon, EyeIcon, PaperClipIcon, ArrowDownCircleIcon, PencilSquareIcon, EnvelopeOpenIcon } from '@heroicons/react/24/solid';
import { useToast } from '../hooks/useToast';
import ValidatedInput from '../components/common/ValidatedInput';
import { validate, VALIDATION_RULES } from '../lib/validation';

// Compose Email Form Component
const EmailComposeForm: React.FC<{ onSend: (email: Omit<Email, 'id' | 'sentAt' | 'attachment'>) => void; onCancel: () => void; }> = ({ onSend, onCancel }) => {
    const [formData, setFormData] = useState({
        recipient: '',
        subject: '',
        body: '',
    });
    const [errors, setErrors] = useState({ recipient: null, subject: null, body: null } as Record<string, string | null>);
    const [isFormValid, setIsFormValid] = useState(false);

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;
        onSend(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <ValidatedInput label="Recipient Email" type="email" name="recipient" value={formData.recipient} onChange={handleChange} error={errors.recipient} required />
            <ValidatedInput label="Subject" type="text" name="subject" value={formData.subject} onChange={handleChange} error={errors.subject} required />
            <ValidatedInput label="Email Body" as="textarea" name="body" value={formData.body} onChange={handleChange} error={errors.body} rows={8} required />
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
             {email.attachment && (
                <div>
                    <label className="font-semibold text-gray-600">Attachment:</label>
                    <div className="p-2 bg-gray-100 rounded mt-1 flex justify-between items-center">
                       <div className="flex items-center">
                            <PaperClipIcon className="h-5 w-5 mr-2 text-gray-600"/>
                            <span>{email.attachment.name}</span>
                            <span className="ml-2 text-gray-500 text-sm">({(email.attachment.size / 1024).toFixed(2)} KB)</span>
                       </div>
                       <a href={email.attachment.data} download={email.attachment.name} className="p-2 rounded-full hover:bg-gray-200 transition-colors" aria-label="Download attachment">
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

// Main Page Component
const EmailPage: React.FC = () => {
    const { emails, addEmail, isLoading } = useData();
    const { user } = useAuth();
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    
    if (user?.role !== Role.Admin && user?.role !== Role.Manager) {
        return <Card><p className="text-red-500 font-bold">Access Denied. You do not have permission to view this page.</p></Card>
    }

    const handleSendEmail = async (email: Omit<Email, 'id' | 'sentAt' | 'attachment'>) => {
        await addEmail(email);
        showToast(`Email successfully sent to ${email.recipient}`, 'success');
        setIsComposeOpen(false);
    };

    const handleViewEmail = (email: Email) => {
        setSelectedEmail(email);
        setIsViewOpen(true);
    };

    const filteredEmails = emails.filter(email =>
        email.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                    <EnvelopeIcon className="h-8 w-8 mr-3 text-brand-primary" />
                    Email Management Center
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search by recipient or subject..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent w-64"
                        />
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute top-1/2 left-3 transform -translate-y-1/2" />
                    </div>
                    <button onClick={() => setIsComposeOpen(true)} className="flex items-center px-4 py-2 bg-brand-primary text-white rounded-lg shadow hover:bg-brand-secondary transition-colors">
                        <EnvelopeIcon className="h-5 w-5 mr-2" />
                        Compose Email
                    </button>
                </div>
            </div>

            <Card>
                 {isLoading ? <div className="text-center py-10">Loading emails...</div> : (
                 <>
                {/* Desktop Table View */}
                <div className="overflow-x-auto hidden md:block">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b">
                                <th className="p-4 font-semibold">Recipient</th>
                                <th className="p-4 font-semibold">Subject</th>
                                <th className="p-4 font-semibold">Date Sent</th>
                                <th className="p-4 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmails.map(email => (
                                <tr key={email.id} className="border-b hover:bg-gray-50">
                                    <td className="p-4 font-medium flex items-center">
                                        {email.recipient}
                                        {email.attachment && <PaperClipIcon className="h-4 w-4 ml-2 text-gray-500" title="This email has an attachment"/>}
                                    </td>
                                    <td className="p-4">{email.subject}</td>
                                    <td className="p-4 text-sm text-gray-600">{new Date(email.sentAt).toLocaleString()}</td>
                                    <td className="p-4">
                                        <button onClick={() => handleViewEmail(email)} className="p-2 text-blue-600 hover:text-blue-800" aria-label="View Email">
                                            <EyeIcon className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                 {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                    {filteredEmails.map(email => (
                        <div key={email.id} className="p-4 border rounded-lg shadow-sm">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <p className="font-bold text-gray-800 truncate">{email.subject}</p>
                                    <p className="text-sm text-gray-500">To: {email.recipient}</p>
                                    <p className="text-xs text-gray-400 mt-1">{new Date(email.sentAt).toLocaleString()}</p>
                                </div>
                                <div className="flex items-center">
                                    {email.attachment && <PaperClipIcon className="h-5 w-5 text-gray-500 mr-2" title="Has attachment"/>}
                                    <button onClick={() => handleViewEmail(email)} className="p-2 text-blue-600 hover:text-blue-800" aria-label="View Email">
                                        <EyeIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredEmails.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No emails found.</p>
                )}
                </>
                )}
            </Card>

            <Modal isOpen={isComposeOpen} onClose={() => setIsComposeOpen(false)} title="Compose New Email" icon={PencilSquareIcon}>
                <EmailComposeForm onSend={handleSendEmail} onCancel={() => setIsComposeOpen(false)} />
            </Modal>
            
            <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="View Email" icon={EnvelopeOpenIcon}>
                {selectedEmail && <EmailView email={selectedEmail} />}
            </Modal>

        </div>
    );
};

export default EmailPage;
