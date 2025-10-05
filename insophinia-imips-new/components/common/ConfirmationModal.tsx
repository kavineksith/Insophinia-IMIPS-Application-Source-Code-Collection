import React from 'react';
import Modal from './Modal';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  variant?: 'default' | 'destructive';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  variant = 'default',
}) => {
  const confirmButtonClasses =
    variant === 'destructive'
      ? 'bg-status-red text-white hover:bg-red-700'
      : 'bg-brand-primary text-white hover:bg-brand-secondary';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} icon={ExclamationTriangleIcon}>
      <div>
        <p className="text-gray-700">{message}</p>
        <div className="flex justify-end space-x-2 pt-4 mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
            Cancel
          </button>
          <button onClick={onConfirm} className={`px-4 py-2 rounded ${confirmButtonClasses}`}>
            Confirm
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
