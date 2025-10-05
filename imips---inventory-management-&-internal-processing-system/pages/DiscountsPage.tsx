
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { Discount } from '../types';

const DiscountsPage: React.FC = () => {
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchDiscounts = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await api.get<{ discounts: Discount[] }>('/discounts');
            setDiscounts(data.discounts);
        } catch (error) {
            console.error("Failed to fetch discounts", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDiscounts();
    }, [fetchDiscounts]);

    const formatValue = (type: Discount['type'], value: number) => {
        return type === 'Percentage' ? `${value}%` : `$${value.toFixed(2)}`;
    };

    return (
        <div>
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Discounts</h1>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    Create New Discount
                </button>
            </div>
            
            <div className="mt-8 flex flex-col">
                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                        <div className="shadow overflow-hidden border-b border-gray-200 dark:border-gray-700 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Code</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Value</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Uses</th>
                                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">Edit</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {isLoading ? (
                                        <tr><td colSpan={6} className="text-center py-4">Loading discounts...</td></tr>
                                    ) : discounts.map((discount) => (
                                        <tr key={discount.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-indigo-600 dark:text-indigo-400">{discount.code}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 max-w-sm truncate">{discount.description}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-semibold">{formatValue(discount.type, discount.value)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${discount.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {discount.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{discount.used_count}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <a href="#" className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">Edit</a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DiscountsPage;
