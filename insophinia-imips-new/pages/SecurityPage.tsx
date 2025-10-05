
import React, { useState, useMemo } from 'react';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import { Role, SecurityLog, BlockedIP } from '../types';
import Card from '../components/common/Card';
import { ShieldCheckIcon, NoSymbolIcon } from '@heroicons/react/24/solid';
import DataTable, { Column } from '../components/common/DataTable';
import PageHeader from '../components/common/PageHeader';
import { format } from 'date-fns';
import { useToast } from '../hooks/useToast';
import ConfirmationModal from '../components/common/ConfirmationModal';

const SecurityPage: React.FC = () => {
    const { user } = useAuth();
    const { securityLogs, blockedIPs, unblockIp, isLoading, refreshData } = useData();
    const { showToast } = useToast();
    const [ipToUnblock, setIpToUnblock] = useState<string | null>(null);

    if (user?.role !== Role.Admin) {
        return <Card><p className="text-red-500 font-bold">Access Denied. You must be an Administrator to view this page.</p></Card>;
    }

    const handleUnblock = async () => {
        if (!ipToUnblock) return;
        try {
            await unblockIp(ipToUnblock);
            showToast(`IP ${ipToUnblock} unblocked successfully.`, 'success');
        } catch (error: any) {
            showToast(error.message || 'Failed to unblock IP.', 'error');
        } finally {
            setIpToUnblock(null);
        }
    };
    
    const logColumns: Column<SecurityLog>[] = useMemo(() => [
        { header: 'Timestamp', accessor: 'created_at', cell: (log: SecurityLog) => format(new Date(log.created_at), 'Pp') },
        { header: 'Event Type', accessor: 'event_type' },
        { header: 'IP Address', accessor: 'ip_address' },
        { header: 'User ID', accessor: 'user_id' },
        { header: 'URL', accessor: 'url', cell: (log: SecurityLog) => <span className="font-mono text-xs">{log.url}</span> },
    ], []);

    const ipColumns: Column<BlockedIP>[] = useMemo(() => [
        { header: 'IP Address', accessor: 'ip' },
        { header: 'Reason', accessor: 'reason' },
        { header: 'Blocked At', accessor: 'blockedAt', cell: (ip: BlockedIP) => format(new Date(ip.blockedAt), 'Pp') },
        { header: 'Expires At', accessor: 'expiresAt', cell: (ip: BlockedIP) => format(new Date(ip.expiresAt), 'Pp') },
        {
            header: 'Actions',
            accessor: 'actions',
            cell: (ip: BlockedIP) => (
                <button onClick={() => setIpToUnblock(ip.ip)} className="p-2 text-red-600 hover:text-red-800" title="Unblock IP">
                    <NoSymbolIcon className="h-5 w-5" />
                </button>
            )
        }
    ], []);

    return (
        <div>
            <PageHeader
                title="Security Dashboard"
                icon={ShieldCheckIcon}
                onRefresh={refreshData}
            />

            <Card className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Currently Blocked IPs</h2>
                <DataTable
                    data={blockedIPs}
                    columns={ipColumns}
                    isLoading={isLoading}
                    searchableColumns={['ip', 'reason']}
                />
            </Card>

            <Card>
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Recent Security Events</h2>
                <DataTable
                    data={securityLogs}
                    columns={logColumns}
                    isLoading={isLoading}
                    searchableColumns={['event_type', 'ip_address', 'user_id']}
                />
            </Card>

            <ConfirmationModal
                isOpen={!!ipToUnblock}
                onClose={() => setIpToUnblock(null)}
                onConfirm={handleUnblock}
                title="Unblock IP Address"
                message={`Are you sure you want to unblock ${ipToUnblock}? This will allow them to access the system again immediately.`}
                variant="destructive"
            />
        </div>
    );
};

export default SecurityPage;
