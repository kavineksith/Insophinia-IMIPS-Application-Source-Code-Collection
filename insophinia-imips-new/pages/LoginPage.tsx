
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { BuildingOffice2Icon, ArrowRightOnRectangleIcon, KeyIcon } from '@heroicons/react/24/solid';
import ValidatedInput from '../components/common/ValidatedInput';
import { validate, VALIDATION_RULES } from '../lib/validation';
// FIX: Removed non-existent import 'apiPasswordResetVerify'.
import { apiPasswordResetRequest, apiPasswordReset } from '../lib/api';
import { useToast } from '../hooks/useToast';
import Modal from '../components/common/Modal';

const ForgotPasswordModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(1); // 1: enter email, 2: enter code/password, 3: success
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { showToast } = useToast();

    useEffect(() => {
      if(isOpen) {
        setStep(1);
        setEmail('');
        setToken('');
        setNewPassword('');
        setError('');
        setIsLoading(false);
      }
    }, [isOpen]);

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const res = await apiPasswordResetRequest(email);
            showToast(res.message, 'info');
            setStep(2);
        } catch (err: any) {
            setError(err.response?.data?.message || 'An error occurred.');
        }
        setIsLoading(false);
    };
    
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const res = await apiPasswordReset(token, newPassword);
            showToast(res.message, 'success');
            setStep(3);
        } catch (err: any) => {
            setError(err.response?.data?.message || 'Invalid token or an error occurred.');
        }
        setIsLoading(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Reset Password" icon={KeyIcon}>
            {step === 1 && (
                <form onSubmit={handleRequestReset} className="space-y-4">
                    <p>Enter your email address and we'll send you a link to reset your password.</p>
                    {/* Corrected: Cast e.target to HTMLInputElement to access value property */}
                    <ValidatedInput label="Email" type="email" value={email} onChange={(e) => setEmail((e.target as HTMLInputElement).value)} error={error} required />
                    <div className="flex justify-end pt-2">
                        <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded" disabled={isLoading}>
                            {isLoading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </div>
                </form>
            )}
            {step === 2 && (
                 <form onSubmit={handleResetPassword} className="space-y-4">
                    <p>A password reset token has been sent to <strong>{email}</strong>. Please enter the token and your new password.</p>
                    {/* Corrected: Cast e.target to HTMLInputElement to access value property */}
                    <ValidatedInput label="Reset Token" type="text" value={token} onChange={(e) => setToken((e.target as HTMLInputElement).value)} required />
                    {/* Corrected: Cast e.target to HTMLInputElement to access value property */}
                    <ValidatedInput label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword((e.target as HTMLInputElement).value)} error={validate(newPassword, [VALIDATION_RULES.password])} required/>
                     {error && <p className="text-sm text-red-600">{error}</p>}
                    <div className="flex justify-end pt-2">
                        <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded" disabled={isLoading || !token || !newPassword}>
                           {isLoading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </div>
                </form>
            )}
             {step === 3 && (
                <div className="text-center">
                    <p className="text-lg font-semibold text-green-600">Password Reset Successfully!</p>
                    <p className="mt-2">You can now log in with your new password.</p>
                    <button onClick={onClose} className="mt-4 px-4 py-2 bg-brand-primary text-white rounded">Close</button>
                </div>
            )}
        </Modal>
    );
};


const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({ email: null as string | null, password: null as string | null, form: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isForgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  useEffect(() => {
    const emailError = validate(formData.email, [VALIDATION_RULES.required, VALIDATION_RULES.email]);
    const passwordError = validate(formData.password, [VALIDATION_RULES.required]);
    setErrors(prev => ({ ...prev, email: emailError, password: passwordError }));
    setIsFormValid(!emailError && !passwordError);
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    setErrors(prev => ({ ...prev, form: '' }));
    setIsLoading(true);
    
    const result = await login(formData.email, formData.password);
    
    if (!result.success) {
      setErrors(prev => ({ ...prev, form: result.message || 'Invalid email or password.' }));
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white shadow-xl rounded-lg p-8 space-y-6">
        <div className="flex flex-col items-center">
           <BuildingOffice2Icon className="h-16 w-16 text-brand-primary" />
          <h2 className="mt-4 text-3xl font-extrabold text-center text-gray-900">
            Insophinia IMIPS
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Internal Management System
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin} noValidate>
          <div className="rounded-md shadow-sm space-y-4">
            <ValidatedInput
                id="email"
                label="Email address"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                disabled={isLoading}
              />
            <ValidatedInput
                id="password"
                label="Password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                disabled={isLoading}
              />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
                <button type="button" onClick={() => setForgotPasswordOpen(true)} className="font-medium text-brand-primary hover:text-brand-accent">
                    Forgot your password?
                </button>
            </div>
          </div>


          {errors.form && <p className="text-sm text-red-600 text-center">{errors.form}</p>}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent transition-colors disabled:bg-gray-400"
              disabled={isLoading || !isFormValid}
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
           <div className="text-center text-xs text-gray-500 pt-2">
            <p className="font-semibold">Demo accounts:</p>
            <p>admin@imips.com (Pass: admin123)</p>
            <p>manager@imips.com (Pass: manager123)</p>
            <p>staff@imips.com (Pass: staff123)</p>
          </div>
        </form>
      </div>
      <ForgotPasswordModal isOpen={isForgotPasswordOpen} onClose={() => setForgotPasswordOpen(false)} />
    </div>
  );
};

export default LoginPage;
