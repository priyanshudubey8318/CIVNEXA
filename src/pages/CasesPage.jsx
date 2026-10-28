import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import AnimatedPage from '../components/common/AnimatedPage';
import PageHeader from '../components/common/PageHeader';
import DataTable from '../components/data-display/DataTable';
import Pagination from '../components/data-display/Pagination';
import SearchBar from '../components/forms/SearchBar';
import StatusBadge from '../components/common/StatusBadge';
import PriorityBadge from '../components/common/PriorityBadge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import caseService from '../services/caseService';
import { CASE_CATEGORIES, CASE_STATUSES } from '../constants/caseConfig';
import {
  Eye,
  Plus,
  ShieldAlert,
  CheckCircle2,
  Download,
  RefreshCw,
  Filter,
  X,
  Lock,
  ArrowUpDown,
  Calendar,
  Building2,
  User,
} from 'lucide-react';

export const CasesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, isStudent, isFaculty, isStaff } = useAuth();
  const toast = useToast();

  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'ALL';
  const initialStatus = searchParams.get('status') || 'ALL';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [quickFilter, setQuickFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [casesData, setCasesData] = useState({ items: [], total: 0, page: 1, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const fetchCases = async () => {
    setIsLoading(true);
    try {
      const res = await caseService.getCases({
        search: searchQuery,
        category: categoryFilter,
        status: statusFilter,
        priority: priorityFilter,
        department: departmentFilter,
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
        quickFilter,
        sortBy,
        sortOrder,
        currentUser,
        page: currentPage,
        pageSize,
      });
      setCasesData(res);
    } catch (e) {
      toast.error('Unable to retrieve case listings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [
    searchQuery,
    categoryFilter,
    statusFilter,
    priorityFilter,
    departmentFilter,
    dateFrom,
    dateTo,
    quickFilter,
    sortBy,
    sortOrder,
    currentPage,
    pageSize,
    currentUser,
  ]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('ALL');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setDepartmentFilter('ALL');
    setDateFrom('');
    setDateTo('');
    setQuickFilter('ALL');
    setSortBy(null);
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  // Export current filtered dataset to CSV
  const handleExportCSV = () => {
    if (casesData.items.length === 0) {
      toast.info('No case records to export.');
      return;
    }

    const headers = [
      'Case Number',
      'Title',
      'Category',
      'Student Name',
      'Roll Number',
      'Department',
      'Priority',
      'Status',
      'Incident Date',
      'Location',
      'Confidential',
    ];

    const rows = casesData.items.map((c) => [
      `"${c.caseNumber}"`,
      `"${c.title.replace(/"/g, '""')}"`,
      `"${c.category}"`,
      `"${c.student?.name || ''}"`,
      `"${c.student?.rollNo || ''}"`,
      `"${c.departmentCode || c.department}"`,
      `"${c.priority}"`,
      `"${c.statusLabel || c.status}"`,
      `"${new Date(c.incidentDate || c.reportedAt).toLocaleDateString()}"`,
      `"${c.location || ''}"`,
      `"${c.isConfidential ? 'Yes' : 'No'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `civnexa_cases_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${casesData.items.length} records to CSV.`);
  };

  const activeFiltersCount = [
    categoryFilter !== 'ALL',
    statusFilter !== 'ALL',
    priorityFilter !== 'ALL',
    departmentFilter !== 'ALL',
    dateFrom !== '',
    dateTo !== '',
    quickFilter !== 'ALL',
  ].filter(Boolean).length;

  const quickFilterOptions = [
    { id: 'ALL', label: 'All Cases' },
    { id: 'PENDING_VERIFICATION', label: 'Pending Verification' },
    { id: 'UNDER_INVESTIGATION', label: 'Under Investigation' },
    { id: 'AWAITING_RESPONSE', label: 'Awaiting Response' },
    { id: 'HEARING_SCHEDULED', label: 'Hearing Scheduled' },
    { id: 'RESOLVED', label: 'Resolved' },
    { id: 'CLOSED', label: 'Closed' },
  ];

  return (
    <AnimatedPage>
      <PageHeader
        title="Case Management Registry"
        subtitle="End-to-end management of campus discipline, exams, and student conduct cases."
        breadcrumbs={[{ label: 'Cases' }, { label: 'Registry' }]}
        actions={
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="cx-btn cx-btn-outline"
              title="Download currently filtered case list as CSV"
            >
              <Download size={15} />
              <span>Export CSV</span>
            </button>
            <Link to="/cases/create" className="cx-btn cx-btn-teal text-decoration-none" aria-label="New Incident - Create Case">
              <Plus size={16} />
              <span>New Incident</span>
            </Link>
          </div>
        }
      />

      {/* Quick Filter Chips Bar */}
      <div className="d-flex align-items-center gap-2 mb-3 overflow-x-auto pb-1">
        {quickFilterOptions.map((qf) => {
          const isActive = quickFilter === qf.id;
          return (
            <button
              key={qf.id}
              type="button"
              onClick={() => {
                setQuickFilter(qf.id);
                setCurrentPage(1);
              }}
              className={`cx-btn cx-btn-sm py-1 px-3 text-nowrap rounded-pill ${
                isActive ? 'cx-btn-primary' : 'cx-btn-outline'
              }`}
              style={{ fontSize: '0.8rem' }}
            >
              {qf.label}
            </button>
          );
        })}
      </div>

      <div className="cx-card mb-4">
        {/* Search & Main Filter Row */}
        <div className="p-3 border-bottom bg-light bg-opacity-50 d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center justify-content-between gap-3">
          <div className="flex-grow-1" style={{ maxWidth: '480px' }}>
            <SearchBar
              value={searchQuery}
              onChange={(q) => {
                setSearchQuery(q);
                setCurrentPage(1);
              }}
              onClear={() => setSearchQuery('')}
              placeholder="Search by case reference, student, department..."
            />
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2">
            {/* Category Dropdown */}
            <select
              aria-label="Filter by case category"
              className="cx-input py-1.5 pe-4"
              style={{ width: 'auto', minWidth: '170px' }}
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Categories</option>
              {CASE_CATEGORIES.filter((c) => c.key !== 'ALL').map((cat) => (
                <option key={cat.key} value={cat.key}>
                  {cat.label}
                </option>
              ))}
            </select>

            {/* Status Dropdown */}
            <select
              aria-label="Filter by case status"
              className="cx-input py-1.5 pe-4"
              style={{ width: 'auto', minWidth: '150px' }}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Statuses</option>
              {CASE_STATUSES.filter((s) => s.key !== 'ALL').map((st) => (
                <option key={st.key} value={st.key}>
                  {st.label}
                </option>
              ))}
            </select>

            {/* Toggle Advanced Filters */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`cx-btn cx-btn-sm py-1.5 px-2.5 ${showAdvancedFilters ? 'cx-btn-teal' : 'cx-btn-outline'}`}
            >
              <Filter size={14} />
              <span>Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
            </button>

            {/* Reset Filters */}
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn btn-sm btn-link text-muted p-1 text-decoration-none d-flex align-items-center gap-1"
                title="Reset active filters"
              >
                <X size={14} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Advanced Filters Drawer */}
        {showAdvancedFilters && (
          <div className="p-3 bg-light border-bottom">
            <div className="row g-3">
              <div className="col-12 col-md-3">
                <label className="cx-form-label">Priority Level</label>
                <select
                  className="cx-input py-1.5"
                  value={priorityFilter}
                  onChange={(e) => {
                    setPriorityFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="ALL">All Priorities</option>
                  <option value="CRITICAL">Critical Priority</option>
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="LOW">Low Priority</option>
                </select>
              </div>

              <div className="col-12 col-md-3">
                <label className="cx-form-label">Academic Department</label>
                <select
                  className="cx-input py-1.5"
                  value={departmentFilter}
                  onChange={(e) => {
                    setDepartmentFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="ALL">All Departments</option>
                  <option value="Computer Science & Engineering">CSE</option>
                  <option value="Mechanical Engineering">Mechanical</option>
                  <option value="Electronics & Communication">ECE</option>
                  <option value="Civil Engineering">Civil</option>
                  <option value="Electrical Engineering">Electrical</option>
                  <option value="Biotechnology">Biotech</option>
                </select>
              </div>

              <div className="col-12 col-md-3">
                <label className="cx-form-label">Date From</label>
                <input
                  type="date"
                  className="cx-input py-1.5"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="cx-form-label">Date To</label>
                <input
                  type="date"
                  className="cx-input py-1.5"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Table View */}
        <div className="p-0">
          {isLoading ? (
            <div className="p-5 text-center text-muted">
              <div className="spinner-border text-teal mb-3" role="status" />
              <div>Filtering case records...</div>
            </div>
          ) : casesData.items.length === 0 ? (
            <div className="p-5 text-center text-muted">
              <ShieldAlert size={36} className="text-muted mb-2 mx-auto" />
              <div className="fw-semibold text-dark mb-1">No cases available</div>
              {Boolean(searchQuery || categoryFilter !== 'ALL' || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || departmentFilter !== 'ALL' || dateFrom || dateTo || quickFilter !== 'ALL') ? (
                <>
                  <p className="small text-muted mb-3">No cases match your filter criteria.</p>
                  <button type="button" onClick={handleResetFilters} className="cx-btn cx-btn-outline cx-btn-sm">
                    Reset Filters
                  </button>
                </>
              ) : (
                <div className="mt-2">
                  <Link to="/cases/create" className="cx-btn cx-btn-teal cx-btn-sm text-decoration-none d-inline-flex align-items-center gap-1">
                    <Plus size={14} />
                    <span>Create Case</span>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="cx-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('caseNumber')} className="cursor-pointer" style={{ cursor: 'pointer' }}>
                      <div className="d-flex align-items-center gap-1">
                        <span>Case ID</span>
                        <ArrowUpDown size={12} className="text-muted" />
                      </div>
                    </th>
                    <th onClick={() => handleSort('title')} className="cursor-pointer" style={{ cursor: 'pointer' }}>
                      <div className="d-flex align-items-center gap-1">
                        <span>Incident Title</span>
                        <ArrowUpDown size={12} className="text-muted" />
                      </div>
                    </th>
                    <th>Student Details</th>
                    <th onClick={() => handleSort('priority')} className="cursor-pointer" style={{ cursor: 'pointer' }}>
                      <div className="d-flex align-items-center gap-1">
                        <span>Priority</span>
                        <ArrowUpDown size={12} className="text-muted" />
                      </div>
                    </th>
                    <th onClick={() => handleSort('status')} className="cursor-pointer" style={{ cursor: 'pointer' }}>
                      <div className="d-flex align-items-center gap-1">
                        <span>Status</span>
                        <ArrowUpDown size={12} className="text-muted" />
                      </div>
                    </th>
                    <th>Assigned To</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {casesData.items.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => navigate(`/cases/${row.caseNumber}`)}
                      className="cursor-pointer"
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <Link
                          to={`/cases/${row.caseNumber}`}
                          onClick={(e) => e.stopPropagation()}
                          className="cx-font-mono fw-bold text-decoration-none"
                          style={{ color: 'var(--cx-teal-700)', fontSize: '0.8125rem' }}
                        >
                          {row.caseNumber}
                        </Link>
                        {row.isConfidential && (
                          <div className="small text-purple d-flex align-items-center gap-1 mt-0.5">
                            <Lock size={10} />
                            <span style={{ fontSize: '0.68rem' }}>Confidential</span>
                          </div>
                        )}
                      </td>
                      <td>
                        <div
                          className="fw-semibold text-dark text-truncate"
                          style={{ maxWidth: '300px', fontSize: '0.85rem' }}
                        >
                          {row.title}
                        </div>
                        <div className="text-muted small mt-0.5">
                          {row.category} • <span className="cx-font-mono">{row.departmentCode}</span>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="fw-semibold text-dark small">{row.student?.name}</div>
                          <div className="cx-font-mono text-muted" style={{ fontSize: '0.72rem' }}>
                            {row.student?.rollNo}
                          </div>
                        </div>
                      </td>
                      <td>
                        <PriorityBadge priority={row.priority} />
                      </td>
                      <td>
                        <StatusBadge status={row.status} label={row.statusLabel} />
                      </td>
                      <td>
                        <div className="small text-dark fw-semibold">
                          {row.assignedTo ? row.assignedTo.name : <span className="text-muted fw-normal">Unassigned</span>}
                        </div>
                      </td>
                      <td>
                        <Link
                          to={`/cases/${row.caseNumber}`}
                          onClick={(e) => e.stopPropagation()}
                          className="cx-btn cx-btn-outline cx-btn-sm py-1 px-2.5 text-decoration-none d-inline-flex align-items-center gap-1"
                        >
                          <Eye size={13} />
                          <span>Inspect</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {casesData.total > 0 && (
          <div className="p-3 border-top bg-light bg-opacity-25 d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
            <div className="small text-muted">
              Showing <strong>{(casesData.page - 1) * casesData.pageSize + 1}</strong> to{' '}
              <strong>{Math.min(casesData.page * casesData.pageSize, casesData.total)}</strong> of{' '}
              <strong>{casesData.total}</strong> cases
            </div>

            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center gap-2">
                <span className="small text-muted text-nowrap">Per page:</span>
                <select
                  className="cx-input py-1 px-2 text-center"
                  style={{ width: '68px', fontSize: '0.8rem' }}
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>

              <Pagination
                currentPage={casesData.page}
                totalPages={casesData.totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          </div>
        )}
      </div>
    </AnimatedPage>
  );
};

export default CasesPage;
