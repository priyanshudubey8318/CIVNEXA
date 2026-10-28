import React, { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import LoadingSkeleton from '../feedback/LoadingSkeleton';
import EmptyState from '../feedback/EmptyState';

/**
 * DataTable Component
 * High-performance, accessible enterprise table with sorting, loading skeletons, and interactive rows
 */
export const DataTable = ({
  columns = [],
  data = [],
  isLoading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items to display.',
  emptyAction,
  onRowClick,
  className = '',
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (columnKey) => {
    let direction = 'asc';
    if (sortConfig.key === columnKey && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key: columnKey, direction });
  };

  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      return sortConfig.direction === 'asc' ? 1 : -1;
    });
  }, [data, sortConfig]);

  if (isLoading) {
    return <LoadingSkeleton type="table" count={5} />;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div className={`cx-table-container ${className}`}>
      <table className="cx-table" role="table">
        <thead>
          <tr>
            {columns.map((col) => {
              const isSorted = sortConfig.key === col.key;
              return (
                <th
                  key={col.key}
                  style={{ width: col.width || 'auto' }}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  className={col.sortable ? 'cursor-pointer select-none' : ''}
                  aria-sort={
                    isSorted
                      ? sortConfig.direction === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  <div className="d-flex align-items-center gap-1.5">
                    <span>{col.title}</span>
                    {col.sortable && (
                      <span className="text-muted" style={{ opacity: isSorted ? 1 : 0.4 }}>
                        {isSorted ? (
                          sortConfig.direction === 'asc' ? (
                            <ArrowUp size={13} style={{ color: 'var(--cx-teal-600)' }} />
                          ) : (
                            <ArrowDown size={13} style={{ color: 'var(--cx-teal-600)' }} />
                          )
                        ) : (
                          <ArrowUpDown size={13} />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, rowIndex) => (
            <tr
              key={row.id || rowIndex}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={(e) => {
                if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onRowClick(row);
                }
              }}
            >
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
