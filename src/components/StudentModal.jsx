import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Information Technology',
  'Artificial Intelligence & Data Science',
  'Electronics & Communication Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
];

export default function StudentModal({ isOpen, onClose, onSave, studentToEdit }) {
  const isEditing = Boolean(studentToEdit);

  const [formData, setFormData] = useState({
    register_no: '',
    name: '',
    department: DEPARTMENTS[0],
    year: 1,
    email: '',
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (studentToEdit) {
      setFormData({
        register_no: studentToEdit.register_no || '',
        name: studentToEdit.name || '',
        department: studentToEdit.department || DEPARTMENTS[0],
        year: studentToEdit.year || 1,
        email: studentToEdit.email || '',
      });
    } else {
      setFormData({
        register_no: '',
        name: '',
        department: DEPARTMENTS[0],
        year: 1,
        email: '',
      });
    }
    setError('');
  }, [studentToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'year' ? parseInt(value, 10) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    const trimmedRegNo = formData.register_no.trim().toUpperCase();
    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim().toLowerCase();
    const yearVal = parseInt(formData.year, 10);

    if (!trimmedRegNo || !trimmedName || !trimmedEmail) {
      setError('All fields are required.');
      return;
    }

    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setError('Please provide a valid email address.');
      return;
    }

    if (isNaN(yearVal) || yearVal < 1 || yearVal > 4) {
      setError('Year must be between 1 and 4.');
      return;
    }

    try {
      setSubmitting(true);
      await onSave({
        ...formData,
        register_no: trimmedRegNo,
        name: trimmedName,
        email: trimmedEmail,
        year: yearVal,
      });
      onClose();
    } catch (err) {
      if (err.message && (err.message.includes('unique') || err.message.includes('duplicate key'))) {
        setError(`A student with Register No '${trimmedRegNo}' already exists in your database.`);
      } else {
        setError(err.message || 'Failed to save student record.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {isEditing ? 'Edit Student Record' : 'Add New Student'}
          </h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="error-banner">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="register_no">
                Register Number
              </label>
              <input
                id="register_no"
                name="register_no"
                type="text"
                className="form-input"
                style={{ paddingLeft: '0.875rem', fontFamily: 'var(--font-mono)' }}
                placeholder="e.g. 21CS101"
                value={formData.register_no}
                onChange={handleChange}
                disabled={submitting}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="name">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className="form-input"
                style={{ paddingLeft: '0.875rem' }}
                placeholder="e.g. Alex Morgan"
                value={formData.name}
                onChange={handleChange}
                disabled={submitting}
                required
              />
            </div>

            <div className="modal-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="department">
                  Department
                </label>
                <select
                  id="department"
                  name="department"
                  className="form-input"
                  value={formData.department}
                  onChange={handleChange}
                  disabled={submitting}
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="year">
                  Year of Study
                </label>
                <select
                  id="year"
                  name="year"
                  className="form-input"
                  value={formData.year}
                  onChange={handleChange}
                  disabled={submitting}
                >
                  <option value={1}>1st Year</option>
                  <option value={2}>2nd Year</option>
                  <option value={3}>3rd Year</option>
                  <option value={4}>4th Year</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Student Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                style={{ paddingLeft: '0.875rem' }}
                placeholder="e.g. alex.m@student.edu"
                value={formData.email}
                onChange={handleChange}
                disabled={submitting}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="secondary-btn"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-btn"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="spinner" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditing ? 'Update Student' : 'Save Student'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
