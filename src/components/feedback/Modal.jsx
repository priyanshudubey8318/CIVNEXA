import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { modalBackdropVariants, modalDialogVariants } from '../../animations/motionVariants';

/**
 * Modal Component
 * Accessible dialog with animated backdrop, escape key support, and clean layout
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 600,
  ariaLabel = 'Dialog',
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="cx-modal-root" role="dialog" aria-modal="true" aria-label={title || ariaLabel}>
          <motion.div
            className="cx-modal-backdrop"
            variants={modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          >
            <motion.div
              className="cx-modal-dialog"
              variants={modalDialogVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{ maxWidth: `${maxWidth}px` }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="cx-card-header d-flex align-items-center justify-content-between">
                <div>
                  <h2 className="h5 mb-0" style={{ color: 'var(--cx-navy-900)', fontWeight: 700 }}>
                    {title}
                  </h2>
                  {subtitle && (
                    <div style={{ fontSize: '0.8125rem', color: 'var(--cx-slate-500)', marginTop: '2px' }}>
                      {subtitle}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="cx-btn cx-btn-ghost cx-btn-sm p-1 rounded-circle"
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="cx-card-body overflow-auto" style={{ maxHeight: 'calc(80vh - 140px)' }}>
                {children}
              </div>

              {footer && <div className="cx-card-footer">{footer}</div>}
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
