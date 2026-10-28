import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Pagination Component
 * Keyboard-navigable pagination controls with count summary
 */
export const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  className = '',
}) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  if (totalPages <= 1 && totalItems <= pageSize) {
    return (
      <div className={`d-flex align-items-center justify-content-between p-3 border-top bg-light text-muted small ${className}`}>
        <span>Showing {totalItems} of {totalItems} items</span>
      </div>
    );
  }

  return (
    <nav
      aria-label="Table pagination"
      className={`d-flex flex-column flex-sm-row align-items-center justify-content-between p-3 border-top bg-light gap-2 ${className}`}
    >
      <div className="small text-muted">
        Showing <span className="fw-semibold text-dark">{startItem}</span> to{' '}
        <span className="fw-semibold text-dark">{endItem}</span> of{' '}
        <span className="fw-semibold text-dark">{totalItems}</span> records
      </div>

      <div className="d-flex align-items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="cx-btn cx-btn-outline cx-btn-sm px-2"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
          <span className="d-none d-sm-inline ms-1">Prev</span>
        </button>

        {Array.from({ length: totalPages }).map((_, idx) => {
          const pageNum = idx + 1;
          const isCurrent = pageNum === currentPage;
          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={`cx-btn cx-btn-sm ${isCurrent ? 'cx-btn-primary' : 'cx-btn-outline'}`}
              style={{ minWidth: '32px', padding: '0.35rem 0.6rem' }}
              aria-current={isCurrent ? 'page' : undefined}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="cx-btn cx-btn-outline cx-btn-sm px-2"
          aria-label="Next page"
        >
          <span className="d-none d-sm-inline me-1">Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
