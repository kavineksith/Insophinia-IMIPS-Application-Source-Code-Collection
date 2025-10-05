
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { SecurityLog, BlockedIP } from '../types';

const SecurityPage: React.FC = () => {
    const [logs, setLogs] = useState<SecurityLog[]>([]);
    const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(true);
    const [isLoadingIPs, setIsLoadingIPs] = useState(true);

    const fetchLogs = useCallback(async () => {
        try {
            setIsLoadingLogs(true);
            const data = await api.get<{ logs: SecurityLog[] }>('/security/security-logs?limit=100');
            setLogs(data.logs);
        } catch (error) {
            console.error("Failed to fetch security logs", error);
        } finally {
            setIsLoadingLogs(false);
        }
    }, []);

    const fetchBlockedIPs = useCallback(async () => {
        try {
            setIsLoadingIPs(true);
            const data = await api.get<{ blocked: BlockedIP[] }>('/security/blocked-ips');
            setBlockedIPs(data.blocked);
        } catch (error) {
            console.error("Failed to fetch blocked IPs", error);
        } finally {
            setIsLoadingIPs(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
        fetchBlockedIPs();
    }, [fetchLogs, fetchBlockedIPs]);

    const handleUnblock = async (ip: string) => {
        if(window.confirm(`Are you sure you want to unblock ${ip}?`)) {
            try {
                await api.delete(`/security/blocked-ips/${ip}`);
                fetchBlockedIPs();
            } catch (error) {
                console.error(`Failed to unblock IP ${ip}`, error);
            }
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Security Center</h1>
            
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Blocked IPs</h2>
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                        <div className="overflow-y-auto max-h-96">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">IP</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Expires</th>
                                        <th className="relative px-4 py-3"><span className="sr-only">Unblock</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {isLoadingIPs ? <tr><td colSpan={3} className="text-center py-4">Loading...</td></tr> : 
                                     blockedIPs.map(ip => (
                                        <tr key={ip.ip}>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-600 dark:text-gray-300">{ip.ip}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(ip.expiresAt).toLocaleString()}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                                                <button onClick={() => handleUnblock(ip.ip)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 font-medium">Unblock</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Security Logs</h2>
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                        <div className="overflow-y-auto max-h-96">
                            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                {isLoadingLogs ? <li className="text-center py-4">Loading...</li> : 
                                 logs.map(log => (
                                    <li key={log.id} className="p-4">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{log.event_type}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            <span className="font-mono">{log.ip_address}</span> on {new Date(log.created_at).toLocaleString()}
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{log.url}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecurityPage;
