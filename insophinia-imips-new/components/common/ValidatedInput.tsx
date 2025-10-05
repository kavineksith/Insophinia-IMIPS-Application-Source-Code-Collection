import React from 'react';

interface ValidatedInputProps extends React.AllHTMLAttributes<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> {
  label: string;
  error?: string | null;
  as?: 'input' | 'textarea' | 'select';
}

const ValidatedInput: React.FC<ValidatedInputProps> = ({ label, id, error, as = 'input', children, ...props }) => {
  const commonClasses = "w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-brand-accent";
  const errorClasses = "border-red-500 focus:ring-red-400";
  const successClasses = "border-gray-300";

  const InputComponent = as;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <InputComponent
        id={id}
        className={`${commonClasses} ${error ? errorClasses : successClasses}`}
        {...props}
      >
        {children}
      </InputComponent>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default ValidatedInput;