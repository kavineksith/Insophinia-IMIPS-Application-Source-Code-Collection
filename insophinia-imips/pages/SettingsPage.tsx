import React, { useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';
import { Role } from '../types';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, ShieldCheckIcon, CloudArrowUpIcon, Cog6ToothIcon, ServerStackIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { useToast } from '../hooks/useToast';

const SettingsPage: React.FC = () => {
    const { user, logout } = useAuth();
    const { getBackupData, restoreData, backupSettings, updateBackupSettings } = useData();
    const { showToast } = useToast();
    const restoreInputRef = useRef<HTMLInputElement>(null);
    const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
    const [backupFile, setBackupFile] = useState<File | null>(null);
    
    if (user?.role !== Role.Admin) {
        return (
            <Card className="text-center">
                <ShieldCheckIcon className="h-12 w-12 mx-auto text-status-red" />
                <h2 className="mt-4 text-xl font-bold text-gray-800">Access Denied</h2>
                <p className="mt-2 text-gray-600">You must be an Administrator to access the settings page.</p>
            </Card>
        );
    }

    const handleBackup = async () => {
        showToast('Creating server backup...', 'info');
        await getBackupData();
    };

    const handleRestoreFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            setBackupFile(null);
            return;
        };

        if (file.type !== 'application/json') {
            showToast('Invalid file type. Please select a .json backup file.', 'error');
            setBackupFile(null);
            if(restoreInputRef.current) restoreInputRef.current.value = '';
            return;
        }

        setBackupFile(file);
    };

    const handleRestoreConfirm = async () => {
        if (!backupFile) {
            showToast('No backup file selected.', 'error');
            return;
        }
        const result = await restoreData(backupFile);
        if (result.success) {
            showToast('Restore successful! You will be logged out to apply changes.', 'success');
            setTimeout(() => {
                logout();
            }, 3000);
        } else {
            showToast(`Restore failed: ${result.message}`, 'error');
        }
        setIsRestoreModalOpen(false);
        setBackupFile(null);
        if(restoreInputRef.current) restoreInputRef.current.value = '';
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
                            {backupFile && <p className="text-sm text-gray-700 mt-2 font-medium">Selected file: {backupFile.name}</p>}
                        </div>
                        <div className="flex items-center mt-4 md:mt-0 md:ml-4 space-x-2">
                             <input type="file" ref={restoreInputRef} onChange={handleRestoreFileSelect} accept=".json" className="hidden" id="restore-file-input"/>
                             <label htmlFor="restore-file-input" className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 transition-colors cursor-pointer">
                                <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
                                Select File
                            </label>
                            <button onClick={() => setIsRestoreModalOpen(true)} disabled={!backupFile} className="flex items-center px-4 py-2 bg-status-red text-white rounded-lg shadow hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">
                                Restore Data
                            </button>
                        </div>
                    </div>
                </div>
            </Card>

            <Card>
                <h2 className="text-xl font-semibold text-gray-700 border-b pb-4 mb-4 flex items-center"><CloudArrowUpIcon className="h-6 w-6 mr-3 text-brand-secondary"/>Automated Backup</h2>
                <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                             <h3 className="font-bold text-gray-800">Enable Automated Cloud Backup (Simulated)</h3>
                             <p className="text-sm text-gray-600 mt-1">Periodically saves a snapshot of the system data to the browser's local storage.</p>
                        </div>
                        <label htmlFor="toggle" className="flex items-center cursor-pointer">
                            <div className="relative">
                                <input type="checkbox" id="toggle" className="sr-only" checked={backupSettings.enabled} onChange={(e) => updateBackupSettings({ enabled: e.target.checked })} />
                                <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
                                <div className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition"></div>
                            </div>
                        </label>
                    </div>
                    {backupSettings.enabled && (
                        <div className="mt-6 border-t pt-4">
                            <h4 className="font-semibold text-gray-700 mb-2">Backup Frequency</h4>
                            <div className="flex space-x-6">
                                {['daily', 'weekly', 'monthly'].map(freq => (
                                    <label key={freq} className="flex items-center">
                                        <input type="radio" name="frequency" value={freq} checked={backupSettings.frequency === freq} onChange={handleFrequencyChange} className="h-4 w-4 text-brand-primary focus:ring-brand-accent"/>
                                        <span className="ml-2 capitalize">{freq}</span>
                                    </label>
                                ))}
                            </div>
                             <p className="text-sm text-gray-500 mt-4">
                                Last backup performed: {backupSettings.lastBackupTimestamp ? new Date(backupSettings.lastBackupTimestamp).toLocaleString() : 'Never'}
                            </p>
                        </div>
                    )}
                </div>
            </Card>

            <Modal isOpen={isRestoreModalOpen} onClose={() => setIsRestoreModalOpen(false)} title="Confirm Data Restoration" icon={ExclamationTriangleIcon}>
                <div>
                    <p className="text-lg font-semibold text-status-red">Warning!</p>
                    <p className="text-gray-700 mt-2">You are about to restore data from the file: <span className="font-medium">{backupFile?.name}</span>.</p>
                    <p className="text-gray-700 mt-2">This will <span className="font-bold">completely overwrite all existing data</span> in the application. This action cannot be undone.</p>
                    <p className="text-gray-700 mt-4">Are you sure you want to proceed?</p>
                    <div className="flex justify-end space-x-2 pt-4 mt-4">
                        <button onClick={() => setIsRestoreModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
                        <button onClick={handleRestoreConfirm} className="px-4 py-2 bg-status-red text-white rounded hover:bg-red-700">Confirm Restore</button>
                    </div>
                </div>
            </Modal>
            <style>{`
                input:checked ~ .dot {
                    transform: translateX(100%);
                    background-color: #1565C0;
                }
            `}</style>
        </div>
    );
};

export default SettingsPage;
