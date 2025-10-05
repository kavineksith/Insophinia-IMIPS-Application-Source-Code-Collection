import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import { User, Role } from '../types';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { useToast } from '../hooks/useToast';
import { PencilIcon, TrashIcon, PlusCircleIcon, MagnifyingGlassIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, ArrowRightOnRectangleIcon, UsersIcon, UserPlusIcon, PencilSquareIcon, ExclamationTriangleIcon, KeyIcon, EyeIcon } from '@heroicons/react/24/solid';
import { resetPassword } from '../lib/api';
import AuthenticatedImage from '../components/common/AuthenticatedImage';
import ValidatedInput from '../components/common/ValidatedInput';
import { validate, VALIDATION_RULES } from '../lib/validation';
import ConfirmationModal from '../components/common/ConfirmationModal';

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
                    {imagePreview && <AuthenticatedImage src={imagePreview} alt="Preview" className="mt-4 h-32 w-32 object-cover rounded-full"/>}
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
                <AuthenticatedImage src={user.profilePictureUrl} alt={user.name} className="h-32 w-32 rounded-full object-cover border-4 border-gray-200 mb-4" />
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


const UsersPage: React.FC = () => {
    const { users, addUser, updateUser, deleteUser, isLoading } = useData();
    const { user: currentUser, forceLogoutUser } = useAuth();
    const { showToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [userToResetPassword, setUserToResetPassword] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<Role | 'All'>('All');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSave = async (user: User, file: File | null) => {
        const isUpdating = !!user.id;
        
        if (isUpdating) {
            const userDataToUpdate = { ...user };
            if (file) delete (userDataToUpdate as Partial<User>).profilePictureUrl;
            // Explicitly remove password fields for updates to prevent API errors.
            // Password changes are handled separately via the Reset Password feature.
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

    const handleDelete = async () => {
        if (userToDelete) {
            await deleteUser(userToDelete.id);
            showToast(`User "${userToDelete.name}" deleted successfully.`, 'success');
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

    const handleExport = () => {
        const jsonString = JSON.stringify(users, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'users-export.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Users data exported successfully!', 'success');
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        showToast('Import is disabled in API mode.', 'info');
        if(event.target) event.target.value = '';
    };

    const filteredUsers = users.filter(user =>
        (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (roleFilter === 'All' || user.role === roleFilter)
    );
    
    if (currentUser?.role !== Role.Admin) {
        return <Card><p className="text-red-500 font-bold">Access Denied. You must be an Administrator to view this page.</p></Card>
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                    <UsersIcon className="h-8 w-8 mr-3 text-brand-primary" />
                    User Management
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                        <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent"/>
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute top-1/2 left-3 transform -translate-y-1/2" />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value as Role | 'All')}
                        className="py-2 pl-3 pr-8 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent bg-white"
                        aria-label="Filter by role"
                    >
                        <option value="All">All Roles</option>
                        {Object.values(Role).map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept=".json" />
                    <button onClick={handleImportClick} className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg shadow hover:bg-gray-700 transition-colors">
                        <ArrowUpTrayIcon className="h-5 w-5 mr-2" /> Import
                    </button>
                    <button onClick={handleExport} className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg shadow hover:bg-gray-700 transition-colors">
                        <ArrowDownTrayIcon className="h-5 w-5 mr-2" /> Export
                    </button>
                    <button onClick={() => { setSelectedUser(undefined); setIsModalOpen(true); }} className="flex items-center px-4 py-2 bg-brand-primary text-white rounded-lg shadow hover:bg-brand-secondary transition-colors">
                        <PlusCircleIcon className="h-5 w-5 mr-2" />
                        Add New User
                    </button>
                </div>
            </div>
            <Card>
                {isLoading ? <div className="text-center py-10">Loading users...</div> : (
                    <>
                    {/* Desktop Table View */}
                    <div className="overflow-x-auto hidden md:block">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b">
                                    <th className="p-4 font-semibold">User</th>
                                    <th className="p-4 font-semibold">Email</th>
                                    <th className="p-4 font-semibold">Role</th>
                                    <th className="p-4 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className="border-b hover:bg-gray-50">
                                        <td className="p-4 flex items-center">
                                            <AuthenticatedImage src={user.profilePictureUrl} alt={user.name} className="h-10 w-10 rounded-full object-cover mr-4" />
                                            <span className="font-medium">{user.name}</span>
                                        </td>
                                        <td className="p-4">{user.email}</td>
                                        <td className="p-4"><span className="px-2 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">{user.role}</span></td>
                                        <td className="p-4">
                                            <button onClick={() => handleView(user)} className="p-2 text-gray-600 hover:text-gray-800" title="View User" aria-label="View User"><EyeIcon className="h-5 w-5" /></button>
                                            <button onClick={() => handleEdit(user)} className="p-2 text-blue-600 hover:text-blue-800" title="Edit User" aria-label="Edit User"><PencilIcon className="h-5 w-5" /></button>
                                            <button onClick={() => openDeleteModal(user)} className="p-2 text-red-600 hover:text-red-800" title="Delete User" aria-label="Delete User"><TrashIcon className="h-5 w-5" /></button>
                                            {currentUser?.id !== user.id && (
                                                <>
                                                    <button 
                                                        onClick={() => handleForceLogout(user)} 
                                                        className="p-2 text-yellow-600 hover:text-yellow-800"
                                                        title="Force Logout"
                                                        aria-label="Force Logout User"
                                                    >
                                                        <ArrowRightOnRectangleIcon className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setUserToResetPassword(user)}
                                                        className="p-2 text-green-600 hover:text-green-800"
                                                        title="Reset Password"
                                                        aria-label="Reset User Password"
                                                    >
                                                        <KeyIcon className="h-5 w-5" />
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                        {filteredUsers.map(user => (
                            <div key={user.id} className="p-4 border rounded-lg shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center">
                                        <AuthenticatedImage src={user.profilePictureUrl} alt={user.name} className="h-12 w-12 rounded-full object-cover mr-4" />
                                        <div>
                                            <p className="font-bold text-gray-800">{user.name}</p>
                                            <p className="text-sm text-gray-500">{user.email}</p>
                                        </div>
                                    </div>
                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 flex-shrink-0">{user.role}</span>
                                </div>
                                <div className="mt-3 flex justify-end items-center border-t pt-2">
                                    <button onClick={() => handleView(user)} className="p-2 text-gray-600 hover:text-gray-800" title="View User" aria-label="View User"><EyeIcon className="h-5 w-5" /></button>
                                    <button onClick={() => handleEdit(user)} className="p-2 text-blue-600 hover:text-blue-800" title="Edit User" aria-label="Edit User"><PencilIcon className="h-5 w-5" /></button>
                                    <button onClick={() => openDeleteModal(user)} className="p-2 text-red-600 hover:text-red-800" title="Delete User" aria-label="Delete User"><TrashIcon className="h-5 w-5" /></button>
                                    {currentUser?.id !== user.id && (
                                        <>
                                            <button onClick={() => handleForceLogout(user)} className="p-2 text-yellow-600 hover:text-yellow-800" title="Force Logout" aria-label="Force Logout User">
                                                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                                            </button>
                                            <button onClick={() => setUserToResetPassword(user)} className="p-2 text-green-600 hover:text-green-800" title="Reset Password" aria-label="Reset User Password">
                                                <KeyIcon className="h-5 w-5" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    </>
                )}
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedUser ? 'Edit User' : 'Add New User'}
                icon={selectedUser ? PencilSquareIcon : UserPlusIcon}
            >
                <UserForm user={selectedUser} onSave={handleSave} onCancel={() => { setIsModalOpen(false); setSelectedUser(undefined); }} />
            </Modal>
            
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Confirm Deletion"
                message={`Are you sure you want to delete the user "${userToDelete?.name}"?`}
                variant="destructive"
            />
            
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