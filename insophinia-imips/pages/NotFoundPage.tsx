import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';

const NotFoundPage: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-700">
            <ExclamationTriangleIcon className="h-24 w-24 text-status-yellow mb-4" />
            <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
            <p className="mt-4 text-lg">The page you are looking for does not exist.</p>
        </div>
    );
};
export default NotFoundPage;
