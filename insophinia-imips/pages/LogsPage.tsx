import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Role, LogEntry } from '../types';
import Card from '../components/common/Card';
import { logger } from '../lib/logger';
import { CommandLineIcon, MagnifyingGlassIcon, TrashIcon, InformationCircleIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import ConfirmationModal from '../components/common/ConfirmationModal';

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
    const [logs, setLogs] = useState<LogEntry[]>(logger.getLogs());
    const [searchTerm, setSearchTerm] = useState('');
    const [levelFilter, setLevelFilter] = useState<'ALL' | LogEntry['level']>('ALL');
    const [expandedLog, setExpandedLog] = useState<string | null>(null);
    const [isClearLogsModalOpen, setIsClearLogsModalOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = logger.subscribe(setLogs);
        return () => unsubscribe();
    }, []);

    const filteredLogs = logs
        .filter(log => levelFilter === 'ALL' || log.level === levelFilter)
        .filter(log =>
            log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
            JSON.stringify(log.context || {}).toLowerCase().includes(searchTerm.toLowerCase())
        );

    const handleConfirmClearLogs = () => {
        logger.clearLogs();
        setIsClearLogsModalOpen(false);
    };
    
    if (user?.role !== Role.Admin) {
        return <Card><p className="text-red-500 font-bold">Access Denied. You must be an Administrator to view logs.</p></Card>
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                    <CommandLineIcon className="h-8 w-8 mr-3 text-brand-primary" />
                    Frontend Activity Logs
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search logs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent w-64"
                        />
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute top-1/2 left-3 transform -translate-y-1/2" />
                    </div>
                     <select
                        value={levelFilter}
                        onChange={(e) => setLevelFilter(e.target.value as any)}
                        className="py-2 pl-3 pr-8 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent bg-white"
                        aria-label="Filter by log level"
                    >
                        <option value="ALL">All Levels</option>
                        <option value="INFO">Info</option>
                        <option value="WARN">Warning</option>
                        <option value="ERROR">Error</option>
                    </select>
                    <button onClick={() => setIsClearLogsModalOpen(true)} className="flex items-center px-4 py-2 bg-status-red text-white rounded-lg shadow hover:bg-red-700 transition-colors">
                        <TrashIcon className="h-5 w-5 mr-2" />
                        Clear Logs
                    </button>
                </div>
            </div>
            
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b">
                                <th className="p-4 font-semibold">Timestamp</th>
                                <th className="p-4 font-semibold">Level</th>
                                <th className="p-4 font-semibold">Message</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map(log => (
                                <React.Fragment key={log.timestamp + log.message}>
                                <tr className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedLog(expandedLog === log.timestamp ? null : log.timestamp)}>
                                    <td className="p-4 font-mono text-sm text-gray-600 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                                    <td className="p-4"><LogLevelIndicator level={log.level} /></td>
                                    <td className="p-4 max-w-lg truncate">{log.message}</td>
                                </tr>
                                {expandedLog === log.timestamp && log.context && (
                                    <tr className="bg-gray-100">
                                        <td colSpan={3} className="p-4">
                                            <h4 className="font-semibold text-gray-700">Context Details:</h4>
                                            <pre className="text-xs bg-gray-800 text-white rounded p-4 mt-2 overflow-auto max-h-80">
                                                {JSON.stringify(log.context, null, 2)}
                                            </pre>
                                        </td>
                                    </tr>
                                )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                     {filteredLogs.length === 0 && (
                        <p className="text-center text-gray-500 py-8">No logs found matching your criteria.</p>
                     )}
                </div>
            </Card>

            <ConfirmationModal
                isOpen={isClearLogsModalOpen}
                onClose={() => setIsClearLogsModalOpen(false)}
                onConfirm={handleConfirmClearLogs}
                title="Clear Logs"
                message="Are you sure you want to clear all logs for this session? This action cannot be undone."
                variant="destructive"
            />
        </div>
    );
};

export default LogsPage;