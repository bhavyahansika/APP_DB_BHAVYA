import React, { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function DeleteModal({ isOpen, onClose, onConfirm, student }) {
  const [deleting, setDeleting] = useState(false);

  if (!isOpen || !student) return null;

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await onConfirm(student.id);
      onClose();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={20} color="var(--danger)" />
            <span>Confirm Deletion</span>
          </h3>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
            Are you sure you want to delete student{' '}
            <strong>{student.name}</strong> (Register No:{' '}
            <code style={{ fontFamily: 'var(--font-mono)' }}>{student.register_no}</code>)?
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            This action cannot be undone and will permanently remove the record from your database.
          </p>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="secondary-btn"
            onClick={onClose}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="danger-btn"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Loader2 size={16} className="spinner" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete Record</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

