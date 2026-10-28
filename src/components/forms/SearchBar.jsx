import React from 'react';
import { Search, X } from 'lucide-react';

/**
 * SearchBar Component
 * Search input with search icon, clear button, and accessible labeling
 */
export const SearchBar = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search by case ID, student, keyword...',
  className = '',
}) => {
  return (
    <div className={`cx-search-bar position-relative ${className}`} style={{ minWidth: '260px' }}>
      <div
        className="position-absolute top-50 start-0 translate-middle-y ms-3 d-flex align-items-center pointer-events-none text-muted"
        style={{ pointerEvents: 'none' }}
      >
        <Search size={16} />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="cx-input ps-5 pe-5 py-2"
        style={{ fontSize: '0.875rem' }}
        aria-label="Search cases and records"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            if (onClear) onClear();
            else onChange('');
          }}
          className="position-absolute top-50 end-0 translate-middle-y me-2.5 btn btn-link p-0 text-muted"
          style={{ opacity: 0.7 }}
          aria-label="Clear search input"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
