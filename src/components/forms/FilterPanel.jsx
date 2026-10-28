import React, { useState } from 'react';
import { Filter, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { CASE_CATEGORIES, CASE_STATUSES } from '../../constants/caseConfig';

/**
 * FilterPanel Component
 * Provides clean filter controls for categories, statuses, and priorities
 */
export const FilterPanel = ({
  selectedCategory = 'ALL',
  selectedStatus = 'ALL',
  selectedPriority = 'ALL',
  onCategoryChange,
  onStatusChange,
  onPriorityChange,
  onReset,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeFiltersCount =
    (selectedCategory !== 'ALL' ? 1 : 0) +
    (selectedStatus !== 'ALL' ? 1 : 0) +
    (selectedPriority !== 'ALL' ? 1 : 0);

  const priorities = [
    { key: 'ALL', label: 'All Priorities' },
    { key: 'CRITICAL', label: 'Critical' },
    { key: 'HIGH', label: 'High' },
    { key: 'MEDIUM', label: 'Medium' },
    { key: 'LOW', label: 'Low' },
  ];

  return (
    <div className={`cx-filter-panel ${className}`}>
      <div className="d-flex align-items-center gap-2 flex-wrap">
        {/* Category Selector */}
        <div style={{ minWidth: '180px' }}>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="cx-select py-1.5"
            style={{ fontSize: '0.8125rem' }}
            aria-label="Filter by case category"
          >
            {CASE_CATEGORIES.map((cat) => (
              <option key={cat.key} value={cat.key}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status Selector */}
        <div style={{ minWidth: '160px' }}>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="cx-select py-1.5"
            style={{ fontSize: '0.8125rem' }}
            aria-label="Filter by case status"
          >
            {CASE_STATUSES.map((st) => (
              <option key={st.key} value={st.key}>
                {st.label}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Selector */}
        <div style={{ minWidth: '150px' }}>
          <select
            value={selectedPriority}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="cx-select py-1.5"
            style={{ fontSize: '0.8125rem' }}
            aria-label="Filter by case priority"
          >
            {priorities.map((pr) => (
              <option key={pr.key} value={pr.key}>
                {pr.label}
              </option>
            ))}
          </select>
        </div>

        {/* Reset button when filters active */}
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="cx-btn cx-btn-ghost cx-btn-sm text-danger"
            style={{ fontSize: '0.75rem' }}
            title="Reset active filters"
          >
            <RotateCcw size={13} />
            <span>Reset ({activeFiltersCount})</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterPanel;
