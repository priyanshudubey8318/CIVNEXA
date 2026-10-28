import React from 'react';
import { Link } from 'react-router-dom';
import AnimatedPage from '../components/common/AnimatedPage';
import { FileQuestion, Home } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <AnimatedPage>
      <div
        className="d-flex flex-column align-items-center justify-content-center text-center p-5 my-5"
        style={{ minHeight: '50vh' }}
      >
        <div
          className="d-flex align-items-center justify-content-center rounded-circle p-4 mb-3"
          style={{ backgroundColor: 'var(--cx-slate-200)', color: 'var(--cx-slate-600)', width: '80px', height: '80px' }}
        >
          <FileQuestion size={40} />
        </div>
        <h1 className="h3 fw-bold text-dark mb-1">Page Not Found</h1>
        <p className="text-muted small mb-4" style={{ maxWidth: '400px' }}>
          The requested university case management screen or resource does not exist or has been relocated.
        </p>
        <Link to="/" className="cx-btn cx-btn-primary">
          <Home size={16} />
          <span>Return to Institutional Overview</span>
        </Link>
      </div>
    </AnimatedPage>
  );
};

export default NotFoundPage;
