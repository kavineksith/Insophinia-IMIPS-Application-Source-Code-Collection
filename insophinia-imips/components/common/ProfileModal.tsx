import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import { useToast } from '../../hooks/useToast';
import { User } from '../../types';
import { UserCircleIcon, KeyIcon } from '@heroicons/react/24/solid';
import { changePassword } from '../../lib/api';
import AuthenticatedImage from './AuthenticatedImage';
import ValidatedInput from './ValidatedInput';
import { validate, VALIDATION_RULES } from '../../lib/validation';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
    const { user, updateAuthenticatedUser } = useAuth();
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

    useEffect(() => {
        if (user) {
            setProfileData({ name: user.name, email: user.email });
            setImagePreview(user.profilePictureUrl || '');
            setImageFile(null); // Reset file on open
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); // Reset password fields
            setActiveTab('profile'); // Default to profile tab
        }
    }, [user, isOpen]);

    useEffect(() => {
        const nameError = validate(profileData.name, [VALIDATION_RULES.required, VALIDATION_RULES.name]);
        const emailError = validate(profileData.email, [VALIDATION_RULES.required, VALIDATION_RULES.email]);
        setProfileErrors({ name: nameError, email: emailError });
        setIsProfileFormValid(!nameError && !emailError);
    }, [profileData]);
    
    useEffect(() => {
        const newPasswordError = validate(passwordData.newPassword, [VALIDATION_RULES.password]);
        let confirmPasswordError = null;
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            confirmPasswordError = "Passwords do not match.";
        }
        setPasswordErrors({ newPassword: newPasswordError, confirmPassword: confirmPasswordError });
        setIsPasswordFormValid(!!passwordData.currentPassword && !newPasswordError && !confirmPasswordError);
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

    if (!user) return null;

    const renderProfileTab = () => (
        <form onSubmit={handleProfileSave} className="space-y-4 pt-6" noValidate>
            <div className="flex flex-col items-center space-y-4">
                <AuthenticatedImage src={imagePreview} alt="Profile" className="h-24 w-24 rounded-full object-cover border-4 border-gray-200" />
                <label className="cursor-pointer mt-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                   <input type="file" accept="image/*" onChange={handleImageChange} className="sr-only"/>
                   <span>Change Picture</span>
               </label>
            </div>
            <ValidatedInput label="Full Name" name="name" value={profileData.name} onChange={handleProfileChange} error={profileErrors.name} required />
            <ValidatedInput label="Email Address" name="email" type="email" value={profileData.email} onChange={handleProfileChange} error={profileErrors.email} required />
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
            <ValidatedInput label="New Password" name="newPassword" type="password" value={passwordData.newPassword} onChange={handlePasswordChange} error={passwordErrors.newPassword} required />
            <ValidatedInput label="Confirm New Password" name="confirmPassword" type="password" value={passwordData.confirmPassword} onChange={handlePasswordChange} error={passwordErrors.confirmPassword} required />
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" disabled={isSaving}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-brand-secondary disabled:bg-gray-400" disabled={isSaving || !isPasswordFormValid}>
                    {isSaving ? 'Updating...' : 'Update Password'}
                </button>
            </div>
        </form>
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
                    </nav>
                </div>
                {activeTab === 'profile' ? renderProfileTab() : renderSecurityTab()}
            </div>
        </Modal>
    );
};

export default ProfileModal;
