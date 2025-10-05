
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import { useToast } from '../../hooks/useToast';
import { User, UserSession } from '../../types';
import { UserCircleIcon, KeyIcon, ComputerDesktopIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/solid';
import { changePassword, apiLogoutAll, fetchMySessions, revokeSession } from '../../lib/api';
import AuthenticatedImage from './AuthenticatedImage';
import ValidatedInput from './ValidatedInput';
import { validate, VALIDATION_RULES } from '../../lib/validation';
import { format } from 'date-fns';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
    const { user, updateAuthenticatedUser, logout } = useAuth();
    const { updateUser } = useData();
    const { showToast } = useToast();
    
    const [activeTab, setActiveTab] = useState('profile');
    const [isSaving, setIsSaving] = useState(false);

    // Profile state
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [profileData, setProfileData] = useState({ name: '', email: '' });
    const [profileErrors, setProfileErrors] = useState({ name: null, email: null } as Record<string, string | null>);
    const [isProfileFormValid, setIsProfileFormValid] = useState(false);
    
    // Password state
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordErrors, setPasswordErrors] = useState({ newPassword: null, confirmPassword: null } as Record<string, string | null>);
    const [isPasswordFormValid, setIsPasswordFormValid] = useState(false);

    // Session state
    const [sessions, setSessions] = useState<UserSession[]>([]);

    useEffect(() => {
        if (user && isOpen) {
            setProfileData({ name: user.name, email: user.email });
            setImagePreview(user.profilePictureUrl || '');
            setImageFile(null); // Reset file on open
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); // Reset password fields
            setActiveTab('profile'); // Default to profile tab

            if(activeTab === 'sessions') {
                loadSessions();
            }
        }
    }, [user, isOpen]);

     useEffect(() => {
        if (isOpen && activeTab === 'sessions') {
            loadSessions();
        }
    }, [isOpen, activeTab]);

    const loadSessions = async () => {
        try {
            const mySessions = await fetchMySessions();
            setSessions(mySessions);
        } catch (error) {
            showToast('Could not load session data.', 'error');
        }
    };

    useEffect(() => {
        const nameError = validate(profileData.name, [VALIDATION_RULES.required, VALIDATION_RULES.name]);
        const emailError = validate(profileData.email, [VALIDATION_RULES.required, VALIDATION_RULES.email]);
        setProfileErrors({ name: nameError, email: emailError });
        setIsProfileFormValid(!nameError && !emailError);
    }, [profileData]);
    
    useEffect(() => {
        if (!passwordData.currentPassword && !passwordData.newPassword && !passwordData.confirmPassword) {
            setPasswordErrors({ newPassword: null, confirmPassword: null });
            setIsPasswordFormValid(false);
            return;
        }
        const newPasswordError = validate(passwordData.newPassword, [VALIDATION_RULES.password]);
        let confirmPasswordError = null;
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            confirmPasswordError = "Passwords do not match.";
        }
        setPasswordErrors({ newPassword: newPasswordError, confirmPassword: confirmPasswordError });
        setIsPasswordFormValid(!!passwordData.currentPassword && !newPasswordError && !confirmPasswordError && !!passwordData.newPassword);
    }, [passwordData]);


    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => { setImagePreview(reader.result as string); };
            reader.readAsDataURL(file);
        }
    };

    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !isProfileFormValid) return;
        setIsSaving(true);
        const updatedUser: User = { ...user, ...profileData };
        const returnedUser = await updateUser(updatedUser, imageFile ?? undefined);
        
        if (returnedUser) {
            updateAuthenticatedUser(returnedUser);
            showToast('Profile updated successfully!', 'success');
            onClose();
        } else {
            showToast('Profile update failed.', 'error');
        }
        setIsSaving(false);
    };
    
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handlePasswordSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !isPasswordFormValid) return;

        setIsSaving(true);
        try {
            const result = await changePassword(user.id, passwordData.currentPassword, passwordData.newPassword);
            showToast(result.message, 'success');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            onClose();
        } catch (error: any) {
            const message = error.response?.data?.message || "Failed to change password. Please check your current password.";
            showToast(message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

     const handleRevokeSession = async (sessionId: string) => {
        try {
            await revokeSession(sessionId);
            showToast('Session revoked successfully.', 'success');
            loadSessions(); // Refresh list
        } catch (error) {
            showToast('Failed to revoke session.', 'error');
        }
    };

    const handleLogoutAll = async () => {
        try {
            await apiLogoutAll();
            showToast('Successfully logged out of all devices. You will be logged out here shortly.', 'success');
            setTimeout(() => {
                logout();
            }, 2000);
        } catch (error) {
            showToast('Failed to log out of all devices.', 'error');
        }
    };

    if (!user) return null;

    const renderProfileTab = () => (
        <form onSubmit={handleProfileSave} className="space-y-4 pt-6" noValidate>
            <div className="flex flex-col items-center space-y-4">
                <AuthenticatedImage type="user" key={user.profilePictureUrl} src={imagePreview} alt="Profile" className="h-24 w-24 rounded-full object-cover border-4 border-gray-200" />
                <label className="cursor-pointer mt-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                   <input type="file" accept="image/*" onChange={handleImageChange} className="sr-only"/>
                   <span>Change Picture</span>
               </label>
            </div>
            <ValidatedInput label="Full Name" name="name" value={profileData.name} onChange={handleProfileChange} error={profileErrors.name} required />
            <ValidatedInput label="Email Address" name="email" type="email" value={profileData.email} onChange={handleProfileChange} error={profileErrors.email} required disabled />
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" disabled={isSaving}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-brand-secondary disabled:bg-gray-400" disabled={isSaving || !isProfileFormValid}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
    );

    const renderSecurityTab = () => (
        <form onSubmit={handlePasswordSave} className="space-y-4 pt-6" noValidate>
            <p className="text-sm text-gray-600">For security, please provide your current password to make changes.</p>
            <ValidatedInput label="Current Password" name="currentPassword" type="password" value={passwordData.currentPassword} onChange={handlePasswordChange} error={null} required />
            <ValidatedInput label="New Password" name="newPassword" type="password" value={passwordData.newPassword} onChange={handlePasswordChange} error={passwordErrors.newPassword} />
            <ValidatedInput label="Confirm New Password" name="confirmPassword" type="password" value={passwordData.confirmPassword} onChange={handlePasswordChange} error={passwordErrors.confirmPassword} />
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" disabled={isSaving}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-brand-secondary disabled:bg-gray-400" disabled={isSaving || !isPasswordFormValid}>
                    {isSaving ? 'Updating...' : 'Update Password'}
                </button>
            </div>
        </form>
    );

     const renderSessionsTab = () => (
        <div className="pt-6">
            <p className="text-sm text-gray-600 mb-4">Here are all the active sessions for your account. You can revoke any session you don't recognize.</p>
            <ul className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {sessions.map(session => (
                    <li key={session.id} className="p-3 bg-gray-50 rounded-lg flex items-start justify-between">
                        <div>
                            <p className="font-semibold text-gray-800">{session.ip_address} {session.isCurrent && <span className="text-xs font-bold text-green-600">(Current Session)</span>}</p>
                            <p className="text-xs text-gray-500 truncate max-w-xs">{session.user_agent}</p>
                            <p className="text-xs text-gray-500">Last active: {format(new Date(session.last_activity!), 'Pp')}</p>
                        </div>
                        {!session.isCurrent && (
                             <button onClick={() => handleRevokeSession(session.id)} className="ml-4 text-sm text-red-600 hover:text-red-800 font-medium whitespace-nowrap">Revoke</button>
                        )}
                    </li>
                ))}
            </ul>
            <div className="mt-6 border-t pt-4">
                <button onClick={handleLogoutAll} className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-status-red hover:bg-red-700">
                    <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                    Logout From All Devices
                </button>
            </div>
        </div>
    );


    const tabStyles = "flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm cursor-pointer";
    const activeTabStyles = "border-brand-primary text-brand-primary";
    const inactiveTabStyles = "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="My Profile" icon={UserCircleIcon}>
            <div>
                <div className="border-b border-gray-200">
                     <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button className={`${tabStyles} ${activeTab === 'profile' ? activeTabStyles : inactiveTabStyles}`} onClick={() => setActiveTab('profile')}>
                            <UserCircleIcon className="h-5 w-5 mr-2" />
                            Edit Profile
                        </button>
                        <button className={`${tabStyles} ${activeTab === 'security' ? activeTabStyles : inactiveTabStyles}`} onClick={() => setActiveTab('security')}>
                            <KeyIcon className="h-5 w-5 mr-2" />
                            Security
                        </button>
                        <button className={`${tabStyles} ${activeTab === 'sessions' ? activeTabStyles : inactiveTabStyles}`} onClick={() => setActiveTab('sessions')}>
                            <ComputerDesktopIcon className="h-5 w-5 mr-2" />
                            Active Sessions
                        </button>
                    </nav>
                </div>
                {activeTab === 'profile' && renderProfileTab()}
                {activeTab === 'security' && renderSecurityTab()}
                {activeTab === 'sessions' && renderSessionsTab()}
            </div>
        </Modal>
    );
};

export default ProfileModal;
