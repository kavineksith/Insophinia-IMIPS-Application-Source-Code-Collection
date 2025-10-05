import React, { useMemo, useState } from 'react';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import { User, Role, UserSession } from '../types';
import Card from '../components/common/Card';
import PageHeader from '../components/common/PageHeader';
import { UserGroupIcon, EyeIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/solid';
import DataTable, { Column } from '../components/common/DataTable';
import AuthenticatedImage from '../components/common/AuthenticatedImage';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { useToast } from '../hooks/useToast';
import Modal from '../components/common/Modal';

const ACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

const SessionHistoryModal: React.FC<{ user: User; sessions: UserSession[]; onClose: () => void }> = ({ user, sessions, onClose }) => {
    const userSessions = sessions
        .filter(s => s.userId === user.id)
        .sort((a, b) => parseISO(b.loginTime).getTime() - parseISO(a.loginTime).getTime());

    const calculateDuration = (login: string, logout?: string): string => {
        if (!logout) return 'Active';
        const durationMinutes = (parseISO(logout).getTime() - parseISO(login).getTime()) / 60000;
        if (durationMinutes < 60) return `${Math.round(durationMinutes)} min`;
        return `${(durationMinutes / 60).toFixed(1)} hours`;
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Session History for ${user.name}`} icon={UserGroupIcon}>
            <div className="max-h-[60vh] overflow-y-auto">
                 {userSessions.length > 0 ? (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-2 font-semibold">Login Time</th>
                                <th className="p-2 font-semibold">Logout Time</th>
                                <th className="p-2 font-semibold">Duration</th>
                            </tr>
                        </thead>
                        <tbody>
                            {userSessions.map(session => (
                                <tr key={session.id} className="border-b">
                                    <td className="p-2">{format(parseISO(session.loginTime), 'MMM dd, yyyy, hh:mm a')}</td>
                                    <td className="p-2">{session.logoutTime ? format(parseISO(session.logoutTime), 'hh:mm a') : <span className="text-green-600 font-semibold">Still Active</span>}</td>
                                    <td className="p-2">{calculateDuration(session.loginTime, session.logoutTime)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-center text-gray-500 py-4">No session history found for this user.</p>
                )}
            </div>
        </Modal>
    );
};


const ActivityLogPage: React.FC = () => {
    const { user: currentUser, forceLogoutUser } = useAuth();
    const { users, userSessions, isLoading, refreshData } = useData();
    const { showToast } = useToast();
    const [historyModalUser, setHistoryModalUser] = useState<User | null>(null);

    const isUserOnline = (user: User): boolean => {
        if (!user.lastActivity) return false;
        return (new Date().getTime() - parseISO(user.lastActivity).getTime()) < ACTIVITY_TIMEOUT_MS;
    };
    
    const handleForceLogout = (userToLogout: User) => {
        forceLogoutUser(userToLogout.id);
        showToast(`Session for ${userToLogout.name} has been invalidated. They will be logged out shortly.`, 'info');
    };

    const columns: Column<User>[] = useMemo(() => [
        {
            header: 'User',
            accessor: 'name',
            cell: (user: User) => (
                <div className="flex items-center">
                    <AuthenticatedImage type="user" src={user.profilePictureUrl} alt={user.name} className="h-10 w-10 rounded-full object-cover mr-4" />
                    <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                </div>
            )
        },
        { 
            header: 'Role',
            accessor: 'role',
            cell: (user: User) => <span className="px-2 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">{user.role}</span>
        },
        {
            header: 'Status',
            accessor: 'lastActivity',
            cell: (user: User) => {
                const isOnline = isUserOnline(user);
                return (
                    <div className="flex items-center">
                        <span className={`h-3 w-3 rounded-full mr-2 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        <span>{isOnline ? 'Online' : 'Offline'}</span>
                    </div>
                );
            }
        },
        {
            header: 'Last Seen',
            accessor: 'lastActivity',
            cell: (user: User) => user.lastActivity ? formatDistanceToNow(parseISO(user.lastActivity), { addSuffix: true }) : 'Never'
        },
        {
            header: 'Actions',
            accessor: 'actions',
            cell: (user: User) => (
                <div className="flex items-center space-x-1">
                    <button onClick={() => setHistoryModalUser(user)} className="p-2 text-blue-600 hover:text-blue-800" title="View Session History">
                        <EyeIcon className="h-5 w-5" />
                    </button>
                    {currentUser?.role === Role.Admin && currentUser?.id !== user.id && (
                        <button onClick={() => handleForceLogout(user)} className="p-2 text-yellow-600 hover:text-yellow-800" title="Force Logout">
                            <ArrowRightOnRectangleIcon className="h-5 w-5" />
                        </button>
                    )}
                </div>
            )
        }
    ], [currentUser]);

    if (currentUser?.role !== Role.Admin && currentUser?.role !== Role.Manager) {
        return <Card><p className="text-red-500 font-bold">Access Denied. You do not have permission to view this page.</p></Card>;
    }
    
    return (
        <div>
            <PageHeader
                title="User Activity Log"
                icon={UserGroupIcon}
                onRefresh={refreshData}
            />
            <Card>
                <DataTable
                    data={users}
                    columns={columns}
                    isLoading={isLoading}
                    searchableColumns={['name', 'email']}
                    filterableColumn={{ accessor: 'role', header: 'Role', options: Object.values(Role) }}
                />
            </Card>

            {historyModalUser && (
                <SessionHistoryModal 
                    user={historyModalUser}
                    sessions={userSessions}
                    onClose={() => setHistoryModalUser(null)}
                />
            )}
        </div>
    );
};

export default ActivityLogPage;
