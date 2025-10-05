
import React, { useState, useMemo } from 'react';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import { Newsletter, Role } from '../types';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { useToast } from '../hooks/useToast';
import { PaperAirplaneIcon, EyeIcon, ClockIcon } from '@heroicons/react/24/solid';
import ValidatedInput from '../components/common/ValidatedInput';
import DataTable, { Column } from '../components/common/DataTable';
import PageHeader from '../components/common/PageHeader';
import { format } from 'date-fns';

const NewsletterPage: React.FC = () => {
    const { user } = useAuth();
    const { newsletters, sendNewsletter, isLoading, refreshData } = useData();
    const { showToast } = useToast();
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [selectedNewsletter, setSelectedNewsletter] = useState<Newsletter | null>(null);

    const [formData, setFormData] = useState({
        subject: '',
        htmlContent: '',
        recipientGroup: 'all_customers' as Newsletter['recipient_group'],
    });

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await sendNewsletter(formData.subject, formData.htmlContent, formData.recipientGroup);
            showToast('Newsletter is being sent in the background.', 'success');
            setIsComposeOpen(false);
            setFormData({ subject: '', htmlContent: '', recipientGroup: 'all_customers' });
        } catch (error: any) {
            showToast(error.message || 'Failed to send newsletter.', 'error');
        }
    };

    const handleView = (newsletter: Newsletter) => {
        setSelectedNewsletter(newsletter);
        setIsViewOpen(true);
    };

    if (user?.role !== Role.Admin && user?.role !== Role.Manager) {
        return <Card><p className="text-red-500 font-bold">Access Denied.</p></Card>;
    }

    const columns: Column<Newsletter>[] = useMemo(() => [
        { header: 'Subject', accessor: 'subject' },
        { header: 'Recipient Group', accessor: 'recipient_group', cell: (n: Newsletter) => <span className="capitalize">{n.recipient_group.replace('_', ' ')}</span> },
        { header: 'Sent By', accessor: 'sent_by_name' },
        { header: 'Date', accessor: 'created_at', cell: (n: Newsletter) => format(new Date(n.created_at), 'MMM dd, yyyy') },
        {
            header: 'Status',
            accessor: 'status',
            cell: (n: Newsletter) => {
                const colors = {
                    sending: 'bg-blue-100 text-blue-800',
                    completed: 'bg-green-100 text-green-800',
                    failed: 'bg-red-100 text-red-800',
                };
                return <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${colors[n.status]}`}>{n.status}</span>;
            }
        },
        { header: 'Recipients', accessor: 'total_recipients', cell: (n: Newsletter) => `${n.success_count}/${n.total_recipients}` },
        {
            header: 'Actions',
            accessor: 'actions',
            cell: (n: Newsletter) => (
                <button onClick={() => handleView(n)} className="p-2 text-blue-600 hover:text-blue-800" title="View Details"><EyeIcon className="h-5 w-5" /></button>
            )
        }
    ], []);

    return (
        <div>
            <PageHeader
                title="Newsletters"
                icon={PaperAirplaneIcon}
                buttonText="Compose Newsletter"
                onButtonClick={() => setIsComposeOpen(true)}
                onRefresh={refreshData}
            />
            <Card>
                <DataTable
                    data={newsletters}
                    columns={columns}
                    isLoading={isLoading}
                    searchableColumns={['subject', 'sent_by_name']}
                />
            </Card>

            <Modal isOpen={isComposeOpen} onClose={() => setIsComposeOpen(false)} title="Compose Newsletter">
                <form onSubmit={handleSend} className="space-y-4">
                    {/* Corrected: Cast e.target to HTMLInputElement to access value property */}
                    <ValidatedInput label="Subject" name="subject" value={formData.subject} onChange={(e) => setFormData(p => ({ ...p, subject: (e.target as HTMLInputElement).value }))} required />
                    {/* Corrected: Cast e.target to HTMLSelectElement to access value property */}
                    <ValidatedInput label="Recipient Group" as="select" name="recipientGroup" value={formData.recipientGroup} onChange={(e) => setFormData(p => ({ ...p, recipientGroup: (e.target as HTMLSelectElement).value as any }))}>
                        <option value="all_customers">All Customers</option>
                        <option value="recent_customers">Recent Customers (30 days)</option>
                        <option value="inquiry_customers">Inquiry Customers</option>
                    </ValidatedInput>
                    {/* Corrected: Cast e.target to HTMLTextAreaElement to access value property */}
                    <ValidatedInput as="textarea" label="HTML Content" name="htmlContent" value={formData.htmlContent} onChange={(e) => setFormData(p => ({ ...p, htmlContent: (e.target as HTMLTextAreaElement).value }))} rows={10} required />
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setIsComposeOpen(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded">Send</button>
                    </div>
                </form>
            </Modal>
            
            <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Newsletter Details">
                {selectedNewsletter && (
                    <div className="space-y-4">
                        <p><strong>Subject:</strong> {selectedNewsletter.subject}</p>
                        <p><strong>Status:</strong> <span className="capitalize">{selectedNewsletter.status}</span></p>
                        <p><strong>Delivery:</strong> {selectedNewsletter.success_count} / {selectedNewsletter.total_recipients} successful</p>
                        <label className="font-semibold">Content Preview:</label>
                        <iframe srcDoc={selectedNewsletter.html_content} className="w-full h-64 border rounded" title="Preview"/>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default NewsletterPage;