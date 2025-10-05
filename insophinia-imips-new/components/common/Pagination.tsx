import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onNext: () => void;
    onPrev: () => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange, onNext, onPrev }) => {
    const getPageNumbers = () => {
        if (totalPages <= 5) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        if (currentPage <= 3) {
            return [1, 2, 3, '...', totalPages];
        }
        if (currentPage >= totalPages - 2) {
            return [1, '...', totalPages - 2, totalPages - 1, totalPages];
        }
        return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
    };

    const pages = getPageNumbers();

    return (
        <nav className="flex items-center justify-center" aria-label="Pagination">
            <button
                onClick={onPrev}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
                <ChevronLeftIcon className="h-5 w-5" />
            </button>

            {pages.map((page, index) =>
                typeof page === 'number' ? (
                    <button
                        key={index}
                        onClick={() => onPageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                            currentPage === page
                                ? 'z-10 bg-brand-accent border-brand-primary text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        {page}
                    </button>
                ) : (
                    <span key={index} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        ...
                    </span>
                )
            )}

            <button
                onClick={onNext}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
                <ChevronRightIcon className="h-5 w-5" />
            </button>
        </nav>
    );
};

export default Pagination;
