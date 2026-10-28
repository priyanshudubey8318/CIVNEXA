import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, Trash2, AlertCircle } from 'lucide-react';

/**
 * FileUploader Component
 * Drag-and-drop evidence / document upload control with preview and client validation
 */
export const FileUploader = ({
  onFilesSelected,
  maxFiles = 5,
  maxSizeMB = 15,
  acceptedTypes = '.pdf,.jpg,.jpeg,.png,.docx',
  className = '',
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const processFiles = (newFileList) => {
    setError(null);
    if (files.length + newFileList.length > maxFiles) {
      setError(`Maximum limit is ${maxFiles} attachments.`);
      return;
    }

    const validatedFiles = [];
    for (const file of newFileList) {
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > maxSizeMB) {
        setError(`File "${file.name}" exceeds the ${maxSizeMB}MB limit.`);
        return;
      }
      validatedFiles.push({
        id: `${Date.now()}-${file.name}`,
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: file.type || 'Document',
        raw: file,
      });
    }

    const updated = [...files, ...validatedFiles];
    setFiles(updated);
    if (onFilesSelected) {
      onFilesSelected(updated);
    }
  };

  const removeFile = (id) => {
    const updated = files.filter((f) => f.id !== id);
    setFiles(updated);
    if (onFilesSelected) {
      onFilesSelected(updated);
    }
  };

  return (
    <div className={`cx-file-uploader ${className}`}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className="p-4 text-center cursor-pointer transition-all"
        style={{
          border: `2px dashed ${dragOver ? 'var(--cx-teal-500)' : 'var(--cx-slate-300)'}`,
          backgroundColor: dragOver ? 'var(--cx-teal-50)' : 'var(--cx-slate-50)',
          borderRadius: 'var(--cx-border-radius-lg)',
          cursor: 'pointer',
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            inputRef.current?.click();
          }
        }}
        aria-label="Upload evidence or attachments"
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={acceptedTypes}
          onChange={(e) => {
            if (e.target.files) {
              processFiles(Array.from(e.target.files));
            }
          }}
          className="d-none"
        />
        <div
          className="d-inline-flex align-items-center justify-content-center p-3 mb-2 rounded-circle"
          style={{
            backgroundColor: dragOver ? 'var(--cx-teal-100)' : 'var(--cx-slate-200)',
            color: dragOver ? 'var(--cx-teal-700)' : 'var(--cx-slate-600)',
          }}
        >
          <UploadCloud size={24} />
        </div>
        <div style={{ fontWeight: 600, color: 'var(--cx-navy-900)', fontSize: '0.9rem' }}>
          Click to upload or drag files here
        </div>
        <div className="text-muted small mt-1">
          Supports PDF, JPG, PNG, DOCX up to {maxSizeMB}MB
        </div>
      </div>

      {error && (
        <div className="d-flex align-items-center gap-1.5 text-danger small mt-2">
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-3 d-flex flex-column gap-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="d-flex align-items-center justify-content-between p-2.5 px-3 bg-white border rounded-2"
              style={{ borderColor: 'var(--cx-slate-200)' }}
            >
              <div className="d-flex align-items-center gap-2.5 overflow-hidden">
                <FileText size={18} style={{ color: 'var(--cx-teal-600)', flexShrink: 0 }} />
                <div className="text-truncate">
                  <div className="small fw-semibold text-dark text-truncate">{file.name}</div>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                    {file.size}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(file.id);
                }}
                className="btn btn-link text-danger p-1"
                aria-label={`Remove file ${file.name}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploader;
