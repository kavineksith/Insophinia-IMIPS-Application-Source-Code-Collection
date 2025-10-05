
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import { User, Role } from '../types';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { useToast } from '../hooks/useToast';
import { PencilIcon, TrashIcon, PlusCircleIcon, ArrowRightOnRectangleIcon, UsersIcon, UserPlusIcon, PencilSquareIcon, KeyIcon, EyeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { resetPassword } from '../lib/api';
import AuthenticatedImage from '../components/common/AuthenticatedImage';
import ValidatedInput from '../components/common/ValidatedInput';
import { validate, VALIDATION_RULES } from '../lib/validation';
import DataTable, { type Column } from '../components/common/DataTable';
import PageHeader from '../components/common/PageHeader';

const UserForm: React.FC<{ user?: User; onSave: (user: any, file: File | null) => void; onCancel: () => void; }> = ({ user, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        role: user?.role || Role.Staff,
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState({ name: null, email: null, password: null, confirmPassword: null } as Record<string, string | null>);
    const [isFormValid, setIsFormValid] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(user?.profilePictureUrl || null);
    
    useEffect(() => {
        const nameError = validate(formData.name, [VALIDATION_RULES.required, VALIDATION_RULES.name]);
        const emailError = validate(formData.email, [VALIDATION_RULES.required, VALIDATION_RULES.email]);
        let passwordError = null;
        let confirmPasswordError = null;

        if (!user) { // Password validation only for new users
            passwordError = validate(formData.password, [VALIDATION_RULES.required, VALIDATION_RULES.password]);
            if (formData.password !== formData.confirmPassword) {
                confirmPasswordError = "Passwords do not match.";
            } else {
                confirmPasswordError = validate(formData.confirmPassword, [VALIDATION_RULES.required]);
            }
        }
        
        setErrors({ name: nameError, email: emailError, password: passwordError, confirmPassword: confirmPasswordError });
        setIsFormValid(!nameError && !emailError && !passwordError && !confirmPasswordError);
    }, [formData, user]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;
        onSave({ ...user, ...formData }, imageFile);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <ValidatedInput label="Full Name" name="name" value={formData.name} onChange={handleChange} error={errors.name} required />
            <ValidatedInput label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} required />
            <ValidatedInput label="Role" name="role" as="select" value={formData.role} onChange={handleChange} error={null} required>
                {Object.values(Role).map(role => <option key={role} value={role}>{role}</option>)}
            </ValidatedInput>

            {!user && (
                 <div className="space-y-4 pt-2 border-t mt-4">
                    <p className="text-sm font-medium text-gray-700">Set Initial Password</p>
                    <ValidatedInput label="Password" name="password" type="password" value={formData.password} onChange={handleChange} error={errors.password} required={!user} />
                    <ValidatedInput label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} required={!user} />
                 </div>
            )}
            
            {!!user && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-brand-primary hover:file:bg-blue-100"/>
                    {imagePreview && <AuthenticatedImage type="user" src={imagePreview} alt="Preview" className="mt-4 h-32 w-32 object-cover rounded-full"/>}
                </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-brand-secondary disabled:bg-gray-400" disabled={!isFormValid}>Save User</button>
            </div>
        </form>
    );
};

const ViewUserModal: React.FC<{ user: User; onClose: () => void; }> = ({ user, onClose }) => {
    return (
        <Modal isOpen={true} onClose={onClose} title="User Details" icon={UsersIcon}>
            <div className="flex flex-col items-center text-center">
                <AuthenticatedImage type="user" src={user.profilePictureUrl} alt={user.name} className="h-32 w-32 rounded-full object-cover border-4 border-gray-200 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
                <p className="text-gray-500">{user.email}</p>
                <span className="mt-4 px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">{user.role}</span>
            </div>
        </Modal>
    );
};

const ResetPasswordModal: React.FC<{ user: User; onSave: (newPassword: string) => Promise<void>; onCancel: () => void; }> = ({ user, onSave, onCancel }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            showToast('Passwords do not match.', 'error');
            return;
        }
        if (password.length < 8) {
            showToast('New password must be at least 8 characters long.', 'error');
            return;
        }
        setIsSaving(true);
        await onSave(password);
        setIsSaving(false);
    };

    return (
        <Modal isOpen={true} onClose={onCancel} title={`Reset Password for ${user.name}`} icon={KeyIcon}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-gray-600">Enter a new password for the user. They will be able to log in with this new password immediately.</p>
                <div>
                    <label className="block text-sm font-medium text-gray-700">New Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full p-2 border rounded" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 w-full p-2 border rounded" required />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                    <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" disabled={isSaving}>Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-brand-secondary disabled:bg-gray-400" disabled={isSaving}>
                        {isSaving ? 'Resetting...' : 'Reset Password'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

const DeleteModal: React.FC<{
  userToDelete: User;
  onClose: () => void;
  onArchive: () => void;
  onPermanentDelete: () => Promise<void>;
  reauthenticate: (password: string) => Promise<boolean>;
  isAdmin: boolean;
}> = ({ userToDelete, onClose, onArchive, onPermanentDelete, reauthenticate, isAdmin }) => {
    const [isPermanentConfirm, setPermanentConfirm] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePermanentDelete = async () => {
        setIsProcessing(true);
        setError('');
        if (await reauthenticate(password)) {
            await onPermanentDelete();
            onClose();
        } else {
            setError('Incorrect password. Deletion failed.');
        }
        setIsProcessing(false);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Delete ${userToDelete.name}`} icon={ExclamationTriangleIcon}>
            {!isPermanentConfirm ? (
                <div>
                    <p>Are you sure you want to archive this user? Their account will be deactivated.</p>
                    <div className="flex justify-end items-center space-x-2 pt-4 mt-4">
                        {isAdmin && (
                            <button onClick={() => setPermanentConfirm(true)} className="text-sm text-red-600 hover:text-red-800 font-medium">
                                Permanently Delete Instead
                            </button>
                        )}
                        <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
                        <button onClick={onArchive} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Archive User</button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-lg font-medium text-status-red">Permanent Deletion</p>
                    <p>This action is <span className="font-bold">irreversible</span> and will permanently remove the user and all their associated data. Please enter your password to confirm.</p>
                     <ValidatedInput
                        label="Your Password"
                        name="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
                        error={error}
                    />
                    <div className="flex justify-end space-x-2 pt-4">
                        <button onClick={() => setPermanentConfirm(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" disabled={isProcessing}>Back</button>
                        <button onClick={handlePermanentDelete} className="px-4 py-2 bg-status-red text-white rounded hover:bg-red-700 disabled:bg-red-300" disabled={isProcessing || !password}>
                            {isProcessing ? 'Deleting...' : 'Confirm Permanent Delete'}
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
};


const UsersPage: React.FC = () => {
    const { users, addUser, updateUser, deleteUser, hardDeleteUser, isLoading, refreshData } = useData();
    const { user: currentUser, forceLogoutUser, reauthenticate } = useAuth();
    const { showToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [userToResetPassword, setUserToResetPassword] = useState<User | null>(null);

    const handleSave = async (user: User, file: File | null) => {
        const isUpdating = !!user.id;
        
        if (isUpdating) {
            const userDataToUpdate = { ...user };
            if (file) delete (userDataToUpdate as Partial<User>).profilePictureUrl;
            delete (userDataToUpdate as any).password;
            delete (userDataToUpdate as any).confirmPassword;
            await updateUser(userDataToUpdate, file ?? undefined);
        } else {
            await addUser(user);
        }
        showToast(isUpdating ? 'User updated successfully!' : 'User added successfully!', 'success');
        setIsModalOpen(false);
        setSelectedUser(undefined);
    };
    
    const handleView = (user: User) => {
        setSelectedUser(user);
        setIsViewModalOpen(true);
    };

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const openDeleteModal = (user: User) => {
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const handleArchive = () => {
        if (userToDelete) {
            deleteUser(userToDelete.id);
            showToast(`User "${userToDelete.name}" archived successfully.`, 'success');
        }
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
    };

    const handlePermanentDelete = async () => {
        if (userToDelete) {
            await hardDeleteUser(userToDelete.id);
            showToast(`User "${userToDelete.name}" permanently deleted.`, 'success');
        }
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
    };

    const handleForceLogout = (userToLogout: User) => {
        forceLogoutUser(userToLogout.id);
        showToast(`Session for ${userToLogout.name} has been invalidated. They will be logged out shortly.`, 'info');
    };

    const handleResetPasswordSave = async (newPassword: string) => {
        if (!userToResetPassword) return;
        try {
            const result = await resetPassword(userToResetPassword.id, newPassword);
            showToast(result.message, 'success');
            setUserToResetPassword(null);
        } catch (error: any) {
            const message = error.response?.data?.message || "Failed to reset password.";
            showToast(message, 'error');
        }
    };

    const columns: Column<User>[] = useMemo(() => [
        {
            header: 'User',
            accessor: 'name',
            cell: (user: User) => (
                <div className="flex items-center">
                    <AuthenticatedImage type="user" src={user.profilePictureUrl} alt={user.name} className="h-10 w-10 rounded-full object-cover mr-4" />
                    <span className="font-medium">{user.name}</span>
                </div>
            )
        },
        { header: 'Email', accessor: 'email' },
        { 
            header: 'Role',
            accessor: 'role',
            cell: (user: User) => <span className="px-2 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">{user.role}</span>
        },
        {
            header: 'Actions',
            accessor: 'actions',
            cell: (user: User) => (
                <div className="flex items-center space-x-1">
                    <button onClick={() => handleView(user)} className="p-2 text-gray-600 hover:text-gray-800" title="View User"><EyeIcon className="h-5 w-5" /></button>
                    <button onClick={() => handleEdit(user)} className="p-2 text-blue-600 hover:text-blue-800" title="Edit User"><PencilIcon className="h-5 w-5" /></button>
                    {currentUser?.id !== user.id && <>
                        <button onClick={() => openDeleteModal(user)} className="p-2 text-red-600 hover:text-red-800" title="Delete User"><TrashIcon className="h-5 w-5" /></button>
                        <button onClick={() => handleForceLogout(user)} className="p-2 text-yellow-600 hover:text-yellow-800" title="Force Logout"><ArrowRightOnRectangleIcon className="h-5 w-5" /></button>
                        <button onClick={() => setUserToResetPassword(user)} className="p-2 text-green-600 hover:text-green-800" title="Reset Password"><KeyIcon className="h-5 w-5" /></button>
                    </>}
                </div>
            )
        }
    ], [currentUser]);
    
    if (currentUser?.role !== Role.Admin) {
        return <Card><p className="text-red-500 font-bold">Access Denied. You must be an Administrator to view this page.</p></Card>
    }

    return (
        <div>
            <PageHeader 
                title="User Management"
                icon={UsersIcon}
                buttonText="Add New User"
                onButtonClick={() => { setSelectedUser(undefined); setIsModalOpen(true); }}
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

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedUser ? 'Edit User' : 'Add New User'}
                icon={selectedUser ? PencilSquareIcon : UserPlusIcon}
            >
                <UserForm user={selectedUser} onSave={handleSave} onCancel={() => { setIsModalOpen(false); setSelectedUser(undefined); }} />
            </Modal>
            
            {isDeleteModalOpen && userToDelete && (
                 <DeleteModal
                    userToDelete={userToDelete}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onArchive={handleArchive}
                    onPermanentDelete={handlePermanentDelete}
                    reauthenticate={reauthenticate}
                    isAdmin={currentUser?.role === Role.Admin}
                />
            )}
            
            {isViewModalOpen && selectedUser && (
                <ViewUserModal user={selectedUser} onClose={() => { setIsViewModalOpen(false); setSelectedUser(undefined); }} />
            )}

            {userToResetPassword && (
                <ResetPasswordModal 
                    user={userToResetPassword} 
                    onSave={handleResetPasswordSave}
                    onCancel={() => setUserToResetPassword(null)}
                />
            )}
        </div>
    );
};

export default UsersPage;
