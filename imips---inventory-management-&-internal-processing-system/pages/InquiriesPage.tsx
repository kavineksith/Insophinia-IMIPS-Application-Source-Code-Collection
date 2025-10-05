
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { Inquiry } from '../types';

const InquiriesPage: React.FC = () => {
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchInquiries = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await api.get<{ inquiries: Inquiry[] }>('/inquiries');
            setInquiries(data.inquiries);
        } catch (error) {
            console.error("Failed to fetch inquiries", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInquiries();
    }, [fetchInquiries]);
    
    const getStatusColor = (status: Inquiry['status']) => {
        switch(status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
            case 'In Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
            case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700';
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Customer Inquiries</h1>

            <div className="mt-8 flex flex-col">
                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                        <div className="shadow overflow-hidden border-b border-gray-200 dark:border-gray-700 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Inquiry</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Assigned To</th>
                                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">View</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {isLoading ? (
                                        <tr><td colSpan={6} className="text-center py-4">Loading inquiries...</td></tr>
                                    ) : inquiries.map((inquiry) => (
                                        <tr key={inquiry.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{inquiry.customer_name}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">{inquiry.customer_email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-white truncate max-w-xs">{inquiry.inquiry_details}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Date(inquiry.created_at).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(inquiry.status)}`}>
                                                    {inquiry.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{inquiry.assigned_user_name || 'Unassigned'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <a href="#" className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">View</a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InquiriesPage;
