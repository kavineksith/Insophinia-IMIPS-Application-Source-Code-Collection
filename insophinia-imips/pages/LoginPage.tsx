import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { BuildingOffice2Icon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/solid';
import ValidatedInput from '../components/common/ValidatedInput';
import { validate, VALIDATION_RULES } from '../lib/validation';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({ email: null as string | null, password: null as string | null, form: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

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
    
    const success = await login(formData.email, formData.password);
    
    if (!success) {
      setErrors(prev => ({ ...prev, form: 'Invalid email or password.' }));
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
    </div>
  );
};

export default LoginPage;
