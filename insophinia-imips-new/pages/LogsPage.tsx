import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';
import { Role, LogEntry, User } from '../types';
import Card from '../components/common/Card';
import { logger } from '../lib/logger';
import { CommandLineIcon, TrashIcon, InformationCircleIcon, ExclamationTriangleIcon, XCircleIcon, ArrowDownTrayIcon } from '@heroicons/react/24/solid';
import ConfirmationModal from '../components/common/ConfirmationModal';
import DataTable, { type Column } from '../components/common/DataTable';
import PageHeader from '../components/common/PageHeader';

const LogLevelIndicator: React.FC<{ level: LogEntry['level'] }> = ({ level }) => {
    const levelStyles = {
        INFO: {
            icon: InformationCircleIcon,
            color: 'text-blue-500',
            bg: 'bg-blue-100',
        },
        WARN: {
            icon: ExclamationTriangleIcon,
            color: 'text-yellow-500',
            bg: 'bg-yellow-100',
        },
        ERROR: {
            icon: XCircleIcon,
            color: 'text-red-500',
            bg: 'bg-red-100',
        },
    };
    const { icon: Icon, color, bg } = levelStyles[level];

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${color}`}>
            <Icon className={`-ml-0.5 mr-1.5 h-4 w-4`} />
            {level}
        </span>
    );
};


const LogsPage: React.FC = () => {
    const { user } = useAuth();
    const { users } = useData();
    const [logs, setLogs] = useState<LogEntry[]>(logger.getLogs());
    const [isClearLogsModalOpen, setIsClearLogsModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string>('all');

    useEffect(() => {
        const unsubscribe = logger.subscribe(setLogs);
        return () => unsubscribe();
    }, []);

    const handleConfirmClearLogs = () => {
        logger.clearLogs();
        setIsClearLogsModalOpen(false);
    };

    const handleExport = () => {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(filteredLogs, null, 2)
        )}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = `imips-logs-${selectedUserId}-${new Date().toISOString()}.json`;
        link.click();
    };

    const filteredLogs = useMemo(() => {
        if (selectedUserId === 'all') {
            return logs;
        }
        if (selectedUserId === 'system') {
            return logs.filter(log => !log.userId);
        }
        return logs.filter(log => log.userId === selectedUserId);
    }, [logs, selectedUserId]);
    
    const columns: Column<LogEntry>[] = useMemo(() => [
        { header: 'Timestamp', accessor: 'timestamp', cell: (log: LogEntry) => <span className="font-mono text-sm text-gray-600 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</span> },
        { header: 'Level', accessor: 'level', cell: (log: LogEntry) => <LogLevelIndicator level={log.level} /> },
        { 
            header: 'User', 
            accessor: 'userId', 
            cell: (log: LogEntry) => {
                if (!log.userId) return <span className="text-gray-500 italic">System</span>;
                const logUser = users.find(u => u.id === log.userId);
                return logUser ? logUser.name : <span className="text-gray-500 italic">Unknown User</span>;
            }
        },
        { 
            header: 'Message', 
            accessor: 'message',
            cell: (log: LogEntry) => (
                <div className="max-w-xl">
                    <p className="truncate">{log.message}</p>
                    {log.context && (
                        <details className="mt-2 text-xs">
                            <summary className="cursor-pointer text-gray-500">View Context</summary>
                            <pre className="bg-gray-800 text-white rounded p-2 mt-1 overflow-auto max-h-60">
                                {JSON.stringify(log.context, null, 2)}
                            </pre>
                        </details>
                    )}
                </div>
            )
        },
    ], [users]);
    
    if (user?.role !== Role.Admin) {
        return <Card><p className="text-red-500 font-bold">Access Denied. You must be an Administrator to view logs.</p></Card>
    }

    return (
        <div>
            <PageHeader 
                title="Frontend Activity Logs"
                icon={CommandLineIcon}
                buttonText="Clear Logs"
                onButtonClick={() => setIsClearLogsModalOpen(true)}
                buttonVariant="destructive"
            />
            
            <Card>
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                     <div>
                        <label htmlFor="userFilter" className="block text-sm font-medium text-gray-700 mb-1">Filter by User</label>
                        <select
                            id="userFilter"
                            value={selectedUserId}
                            onChange={e => setSelectedUserId(e.target.value)}
                            className="py-2 pl-3 pr-8 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent bg-white w-full md:w-auto"
                        >
                            <option value="all">All Users</option>
                            <option value="system">System (No User)</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                    <button onClick={handleExport} className="self-end flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg shadow hover:bg-gray-700 transition-colors">
                        <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                        Export View
                    </button>
                </div>

                <DataTable
                    data={filteredLogs}
                    columns={columns}
                    isLoading={false}
                    searchableColumns={['message']}
                    filterableColumn={{ accessor: 'level', header: 'Level', options: ['INFO', 'WARN', 'ERROR']}}
                />
            </Card>

            <ConfirmationModal
                isOpen={isClearLogsModalOpen}
                onClose={() => setIsClearLogsModalOpen(false)}
                onConfirm={handleConfirmClearLogs}
                title="Clear Logs"
                message="Are you sure you want to clear all logs? This action cannot be undone."
                variant="destructive"
            />
        </div>
    );
};

export default LogsPage;