import React from 'react';
import { WrenchScrewdriverIcon } from '@heroicons/react/24/solid';
import Card from '../components/common/Card';

const UnderConstructionPage: React.FC = () => {
    return (
        <div className="flex items-center justify-center h-full">
            <Card className="text-center p-10">
                <WrenchScrewdriverIcon className="h-20 w-20 mx-auto text-brand-primary" />
                <h1 className="mt-6 text-3xl font-bold text-gray-800">Page Under Construction</h1>
                <p className="mt-4 text-lg text-gray-600">
                    We're working hard to bring you this feature. Please check back later!
                </p>
            </Card>
        </div>
    );
};

export default UnderConstructionPage;
