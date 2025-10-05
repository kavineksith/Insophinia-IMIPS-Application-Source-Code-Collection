import React from 'react';
import { PlusCircleIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

interface PageHeaderProps {
    title: string;
    icon: React.ElementType;
    buttonText?: string;
    onButtonClick?: () => void;
    onRefresh?: () => void;
    buttonVariant?: 'default' | 'destructive';
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, icon: Icon, buttonText, onButtonClick, onRefresh, buttonVariant = 'default' }) => {
    
    const buttonClasses = {
        default: 'bg-brand-primary text-white hover:bg-brand-secondary',
        destructive: 'bg-status-red text-white hover:bg-red-700',
    };
    
    return (
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                <Icon className="h-8 w-8 mr-3 text-brand-primary" />
                {title}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
                {onRefresh && (
                    <button onClick={onRefresh} className="flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                        <ArrowPathIcon className="h-5 w-5 mr-2" />
                        Refresh
                    </button>
                )}
                {buttonText && onButtonClick && (
                    <button onClick={onButtonClick} className={`flex items-center px-4 py-2 rounded-lg shadow transition-colors ${buttonClasses[buttonVariant]}`}>
                        <PlusCircleIcon className="h-5 w-5 mr-2" />
                        {buttonText}
                    </button>
                )}
            </div>
        </div>
    );
};

export default PageHeader;
