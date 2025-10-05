
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const SettingsPage: React.FC = () => {
    const { user } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match.' });
            return;
        }
        if (!user) return;

        try {
            await api.post(`/users/${user.id}/change-password`, { currentPassword, newPassword });
            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to change password.' });
        }
    };

    if (!user) return <div>Loading...</div>;

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Settings</h1>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">Profile Information</h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Update your account's profile information.</p>
                </div>
                <div className="md:col-span-2">
                    <div className="shadow sm:rounded-md sm:overflow-hidden">
                        <div className="px-4 py-5 bg-white dark:bg-gray-800 space-y-6 sm:p-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                                <input type="text" name="name" id="name" defaultValue={user.name} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                                <input type="email" name="email" id="email" defaultValue={user.email} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-right sm:px-6">
                                <button type="submit" className="bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-indigo-700">Save</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="hidden sm:block" aria-hidden="true"><div className="py-5"><div className="border-t border-gray-200 dark:border-gray-700"></div></div></div>

            <div className="mt-10 sm:mt-0">
                <div className="md:grid md:grid-cols-3 md:gap-6">
                    <div className="md:col-span-1">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Change Password</h2>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Ensure your account is using a long, random password to stay secure.</p>
                    </div>
                    <div className="mt-5 md:mt-0 md:col-span-2">
                        <form onSubmit={handlePasswordChange}>
                            <div className="shadow overflow-hidden sm:rounded-md">
                                <div className="px-4 py-5 bg-white dark:bg-gray-800 sm:p-6 space-y-6">
                                     {message && <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>}
                                    <div>
                                        <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Password</label>
                                        <input type="password" name="current-password" id="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600" />
                                    </div>
                                    <div>
                                        <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                                        <input type="password" name="new-password" id="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600" />
                                    </div>
                                    <div>
                                        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
                                        <input type="password" name="confirm-password" id="confirm-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600" />
                                    </div>
                                </div>
                                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-right sm:px-6">
                                    <button type="submit" className="bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-indigo-700">Save</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
