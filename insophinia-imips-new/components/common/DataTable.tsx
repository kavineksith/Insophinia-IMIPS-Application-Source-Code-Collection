
import React, { useState, useMemo } from 'react';
import { MagnifyingGlassIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/solid';
import Pagination from './Pagination';

export interface Column<T> {
    header: string;
    accessor: keyof T | 'actions';
    cell?: (item: T) => React.ReactNode;
    sortable?: boolean;
}

interface ServerPagination {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (limit: number) => void;
}

interface DataTableProps<T extends Record<string, any>> {
    data: T[];
    columns: Column<T>[];
    isLoading: boolean;
    searchableColumns?: (keyof T)[];
    filterableColumn?: {
        accessor: keyof T;
        header: string;
        options?: string[];
    };
    pagination?: ServerPagination;
}

const DataTable = <T extends Record<string, any>>({
    data,
    columns,
    isLoading,
    searchableColumns = [],
    filterableColumn,
    pagination,
}: DataTableProps<T>) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterValue, setFilterValue] = useState('All');

    // Client-side filtering if no server pagination is provided
    const filteredData = useMemo(() => {
        if (pagination) return data; // Data is already filtered/paginated server-side

        return data.filter(item => {
            const matchesSearch = searchableColumns.length > 0
                ? searchableColumns.some(col => 
                    String(item[col]).toLowerCase().includes(searchTerm.toLowerCase())
                  )
                : true;

            const matchesFilter = filterableColumn
                ? filterValue === 'All' || item[filterableColumn.accessor] === filterValue
                : true;
            
            return matchesSearch && matchesFilter;
        });
    }, [data, searchTerm, filterValue, searchableColumns, filterableColumn, pagination]);

    
    const filterOptions = useMemo(() => {
        if (!filterableColumn) return [];
        if (filterableColumn.options) return filterableColumn.options;
        return [...new Set(data.map(item => item[filterableColumn.accessor]))];
    }, [data, filterableColumn]);
    
    const startIndex = pagination ? (pagination.currentPage - 1) * pagination.itemsPerPage + 1 : 1;
    const endIndex = pagination ? startIndex + data.length - 1 : data.length;
    const totalItems = pagination ? pagination.totalItems : data.length;

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <div className="relative w-full md:w-auto">
                    {searchableColumns.length > 0 && (
                        <>
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent w-full md:w-64"
                            />
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute top-1/2 left-3 transform -translate-y-1/2" />
                        </>
                    )}
                </div>
                {filterableColumn && (
                     <select
                        value={filterValue}
                        onChange={(e) => setFilterValue(e.target.value)}
                        className="py-2 pl-3 pr-8 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent bg-white w-full md:w-auto"
                        aria-label={`Filter by ${filterableColumn.header}`}
                    >
                        <option value="All">All {filterableColumn.header}s</option>
                        {filterOptions.map(opt => <option key={String(opt)} value={String(opt)}>{String(opt)}</option>)}
                    </select>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 border-b">
                            {columns.map(col => (
                                <th key={col.header} className="p-4 font-semibold">
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={columns.length} className="text-center p-8">Loading data...</td></tr>
                        ) : filteredData.length > 0 ? (
                            filteredData.map((item, index) => (
                                <tr key={item.id || index} className="border-b hover:bg-gray-50">
                                    {columns.map(col => (
                                        <td key={col.header} className="p-4 align-top">
                                            {col.cell ? col.cell(item) : String(item[col.accessor])}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                             <tr><td colSpan={columns.length} className="text-center p-8 text-gray-500">No data available.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            {pagination && (
                <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>Rows per page:</span>
                        <select value={pagination.itemsPerPage} onChange={e => pagination.onItemsPerPageChange(Number(e.target.value))} className="p-1 border rounded-md">
                            {[10, 20, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
                        </select>
                        <span>Showing {startIndex} - {endIndex} of {totalItems}</span>
                    </div>
                    {pagination.totalPages > 1 && (
                        <Pagination 
                            currentPage={pagination.currentPage}
                            totalPages={pagination.totalPages}
                            onPageChange={pagination.onPageChange}
                            onNext={() => pagination.onPageChange(pagination.currentPage + 1)}
                            onPrev={() => pagination.onPageChange(pagination.currentPage - 1)}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default DataTable;
