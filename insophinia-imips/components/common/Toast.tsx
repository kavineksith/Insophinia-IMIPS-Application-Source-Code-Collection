
import React from 'react';
import { useToast } from '../../hooks/useToast';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/react/24/solid';

type ToastType = 'success' | 'error' | 'info';

const Toast: React.FC<{ message: string; type: ToastType }> = ({ message, type }) => {
  const icons = {
    success: <CheckCircleIcon className="h-6 w-6 text-green-500" />,
    error: <XCircleIcon className="h-6 w-6 text-red-500" />,
    info: <InformationCircleIcon className="h-6 w-6 text-blue-500" />,
  };

  const colors = {
    success: 'bg-white border-green-400',
    error: 'bg-white border-red-400',
    info: 'bg-white border-blue-400',
  }

  return (
    <div className={`flex items-center p-4 mb-4 rounded-lg shadow-xl border-l-4 ${colors[type]}`} role="alert">
      <div className="mr-3">{icons[type]}</div>
      <div className="text-sm font-medium text-gray-800">{message}</div>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts } = useToast();

  return (
    <div className="fixed top-5 right-5 z-[100] w-full max-w-xs">
      {toasts.map(toast => (
        <Toast key={toast.id} message={toast.message} type={toast.type} />
      ))}
    </div>
  );
};
