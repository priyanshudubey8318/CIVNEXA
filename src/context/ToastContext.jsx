import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { toastVariants } from '../animations/motionVariants';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ title, message, type = 'info', duration = 4000 }) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast = { id, title, message, type };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
      return id;
    },
    [removeToast]
  );

  const toast = {
    show: addToast,
    success: (message, title = 'Success') => addToast({ message, title, type: 'success' }),
    error: (message, title = 'Error') => addToast({ message, title, type: 'danger' }),
    warning: (message, title = 'Warning') => addToast({ message, title, type: 'warning' }),
    info: (message, title = 'Notification') => addToast({ message, title, type: 'info' }),
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} className="text-emerald-500" style={{ color: 'var(--cx-success)' }} />;
      case 'warning':
        return <AlertTriangle size={18} className="text-amber-500" style={{ color: 'var(--cx-warning)' }} />;
      case 'danger':
        return <AlertCircle size={18} className="text-rose-500" style={{ color: 'var(--cx-danger)' }} />;
      default:
        return <Info size={18} className="text-blue-500" style={{ color: 'var(--cx-info)' }} />;
    }
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="cx-toast-container" aria-live="polite" aria-atomic="true">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              className="cx-toast"
              variants={toastVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              layout
              role="alert"
            >
              <div className="flex-shrink-0 mt-0.5">{getIcon(t.type)}</div>
              <div className="flex-grow-1" style={{ minWidth: '200px' }}>
                {t.title && (
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--cx-navy-900)', marginBottom: '0.15rem' }}>
                    {t.title}
                  </div>
                )}
                <div style={{ fontSize: '0.8125rem', color: 'var(--cx-slate-600)' }}>{t.message}</div>
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="btn-close ms-2"
                style={{ fontSize: '0.75rem', opacity: 0.6 }}
                aria-label="Close"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;
