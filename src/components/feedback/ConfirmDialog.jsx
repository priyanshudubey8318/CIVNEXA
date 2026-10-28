import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

/**
 * ConfirmDialog Component
 * Prompts user for explicit confirmation before irreversible or significant actions
 */
export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this action?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  isLoading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth={460}
      footer={
        <div className="d-flex justify-content-end gap-2 w-100">
          <button
            type="button"
            onClick={onClose}
            className="cx-btn cx-btn-outline"
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`cx-btn ${isDestructive ? 'cx-btn-danger' : 'cx-btn-primary'}`}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      }
    >
      <div className="d-flex gap-3 align-items-start">
        <div
          className="d-flex align-items-center justify-content-center flex-shrink-0"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: isDestructive ? '#FEE2E2' : 'var(--cx-blue-50)',
            color: isDestructive ? 'var(--cx-danger)' : 'var(--cx-blue-600)',
          }}
        >
          <AlertTriangle size={20} />
        </div>
        <div>
          <p className="mb-0" style={{ color: 'var(--cx-slate-700)', fontSize: '0.875rem' }}>
            {message}
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
