
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';
import { Role } from '../types';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, ShieldCheckIcon, CloudArrowUpIcon, Cog6ToothIcon, ServerStackIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { useToast } from '../hooks/useToast';
import { listBackups } from '../lib/api';
import { format } from 'date-fns';

const SettingsPage: React.FC = () => {
    const { user } = useAuth();
    const { createBackup, restoreData, backupSettings, updateBackupSettings } = useData();
    const { showToast } = useToast();
    const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
    const [availableBackups, setAvailableBackups] = useState<any[]>([]);
    const [selectedBackup, setSelectedBackup] = useState<string>('');
    
    if (user?.role !== Role.Admin) {
        return (
            <Card className="text-center">
                <ShieldCheckIcon className="h-12 w-12 mx-auto text-status-red" />
                <h2 className="mt-4 text-xl font-bold text-gray-800">Access Denied</h2>
                <p className="mt-2 text-gray-600">You must be an Administrator to access the settings page.</p>
            </Card>
        );
    }
    
    useEffect(() => {
        const fetchBackups = async () => {
            try {
                const backups = await listBackups();
                setAvailableBackups(backups);
                if (backups.length > 0) {
                    setSelectedBackup(backups[0].filename);
                }
            } catch (error) {
                showToast('Could not fetch available backups.', 'error');
            }
        };
        fetchBackups();
    }, []);


    const handleBackup = async () => {
        showToast('Creating server backup...', 'info');
        await createBackup();
    };

    const handleRestoreConfirm = async () => {
        if (!selectedBackup) {
            showToast('No backup file selected.', 'error');
            return;
        }
        await restoreData(selectedBackup);
        setIsRestoreModalOpen(false);
    };

    const handleFrequencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const frequency = e.target.value as 'daily' | 'weekly' | 'monthly';
        updateBackupSettings({ frequency });
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
                <Cog6ToothIcon className="h-8 w-8 mr-3 text-brand-primary" />
                System Settings
            </h1>
            
            <Card className="mb-8">
                <h2 className="text-xl font-semibold text-gray-700 border-b pb-4 mb-4 flex items-center">
                    <ServerStackIcon className="h-6 w-6 mr-3 text-gray-400" />
                    Data Management
                </h2>
                <div className="space-y-6">
                    {/* Backup Section */}
                    <div className="flex flex-col md:flex-row justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <div>
                            <h3 className="font-bold text-gray-800">Full System Backup</h3>
                            <p className="text-sm text-gray-600 mt-1">Create a complete JSON snapshot of all system data on the server.</p>
                        </div>
                        <button onClick={handleBackup} className="mt-4 md:mt-0 md:ml-4 flex items-center px-4 py-2 bg-brand-primary text-white rounded-lg shadow hover:bg-brand-secondary transition-colors">
                            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                            Create Server Backup
                        </button>
                    </div>
                    {/* Restore Section */}
                    <div className="flex flex-col md:flex-row justify-between items-center p-4 bg-red-50 rounded-lg border border-red-200">
                        <div>
                            <h3 className="font-bold text-status-red">Restore from Backup</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Overwrite all current system data with a backup file. <span className="font-bold">This action is irreversible.</span>
                            </p>
                        </div>
                        <div className="flex items-center mt-4 md:mt-0 md:ml-4 space-x-2">
                             <select value={selectedBackup} onChange={e => setSelectedBackup(e.target.value)} className="p-2 border rounded-lg bg-white" disabled={availableBackups.length === 0}>
                                 {availableBackups.length > 0 ? (
                                    availableBackups.map(b => <option key={b.filename} value={b.filename}>{format(new Date(b.created_at), 'Pp')}</option>)
                                 ) : (
                                    <option>No backups available</option>
                                 )}
                             </select>
                            <button onClick={() => setIsRestoreModalOpen(true)} disabled={!selectedBackup} className="flex items-center px-4 py-2 bg-status-red text-white rounded-lg shadow hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">
                                Restore Data
                            </button>
                        </div>
                    </div>
                </div>
            </Card>

            <Modal isOpen={isRestoreModalOpen} onClose={() => setIsRestoreModalOpen(false)} title="Confirm Data Restoration" icon={ExclamationTriangleIcon}>
                <div>
                    <p className="text-lg font-semibold text-status-red">Warning!</p>
                    <p className="text-gray-700 mt-2">You are about to restore data from the file: <span className="font-medium">{selectedBackup}</span>.</p>
                    <p className="text-gray-700 mt-2">This will <span className="font-bold">completely overwrite all existing data</span> in the application. This action cannot be undone.</p>
                    <p className="text-gray-700 mt-4">Are you sure you want to proceed?</p>
                    <div className="flex justify-end space-x-2 pt-4 mt-4">
                        <button onClick={() => setIsRestoreModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
                        <button onClick={handleRestoreConfirm} className="px-4 py-2 bg-status-red text-white rounded hover:bg-red-700">Confirm Restore</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default SettingsPage;
