import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchStudentsApi,
  createStudentApi,
  updateStudentApi,
  deleteStudentApi,
} from '../api';
import StudentModal from './StudentModal';
import DeleteModal from './DeleteModal';
import {
  GraduationCap,
  Plus,
  Search,
  X,
  Edit2,
  Trash2,
  Users,
  AlertCircle,
  RefreshCw,
  Server,
} from 'lucide-react';

export default function StudentDatabaseScreen() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [backendOnline, setBackendOnline] = useState(true);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);

  // Fetch all students directly from Java Backend
  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const data = await fetchStudentsApi();
      setStudents(data || []);
      setBackendOnline(true);
    } catch (err) {
      console.error('Error fetching students:', err);
      setBackendOnline(false);
      setErrorMessage(
        'Unable to reach Java Backend server at http://localhost:8080. Please ensure "java StudentServer.java" is running.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // Filter students based on Register Number or Name
  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (student) =>
        student.register_no?.toLowerCase().includes(q) ||
        student.name?.toLowerCase().includes(q) ||
        student.department?.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  // Handle Create or Update Student
  const handleSaveStudent = async (formData) => {
    if (studentToEdit) {
      // UPDATE
      await updateStudentApi(studentToEdit.id, formData);
    } else {
      // CREATE
      await createStudentApi(formData);
    }
    await loadStudents();
  };

  // Handle Delete Student
  const handleDeleteStudent = async (id) => {
    await deleteStudentApi(id);
    await loadStudents();
  };

  return (
    <div className="portal-layout">
      {/* Top Navigation Bar */}
      <nav className="top-navbar">
        <div className="nav-container">
          <div className="nav-brand">
            <div className="nav-logo-badge">
              <GraduationCap size={18} />
            </div>
            <div className="brand-details">
              <h1>Student Database Management</h1>
              <span>Java REST Backend & React Frontend</span>
            </div>
          </div>

          <div className="nav-actions">
            <div
              className="teacher-badge"
              title="Java Backend Status"
              style={{
                borderColor: backendOnline ? 'var(--border-medium)' : 'var(--danger-border)',
                background: backendOnline ? 'var(--bg-secondary)' : 'var(--danger-bg)',
              }}
            >
              <span
                className="teacher-indicator"
                style={{ backgroundColor: backendOnline ? 'var(--success)' : 'var(--danger)' }}
              />
              <span>{backendOnline ? 'Java Server (8080) Online' : 'Java Server Offline'}</span>
            </div>
            <button
              type="button"
              className="icon-action-btn"
              onClick={loadStudents}
              title="Refresh Data"
              style={{ width: 34, height: 34 }}
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        <div className="dashboard-header">
          <div className="header-top">
            <div className="title-section">
              <h2>Student Records Management</h2>
              <p>Add, search, update, and manage all student database records via Java REST API</p>
            </div>

            <button
              type="button"
              className="primary-btn"
              onClick={() => {
                setStudentToEdit(null);
                setIsFormOpen(true);
              }}
            >
              <Plus size={16} />
              <span>Add Student</span>
            </button>
          </div>

          {/* Search & Stats Bar */}
          <div className="toolbar-bar">
            <div className="search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search by Register No, Name, or Dept..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="stats-badges">
              <span className="stat-pill">
                Total Records: <strong>{students.length}</strong>
              </span>
              {searchQuery && (
                <span className="stat-pill">
                  Matching: <strong>{filteredStudents.length}</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="error-banner" style={{ marginBottom: '1.25rem' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Student Records Table */}
        <div className="table-card">
          {loading ? (
            <div className="loading-container">
              <div className="spinner" />
              <span>Loading student records from Java Backend...</span>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-box">
                <Users size={24} />
              </div>
              <h3>
                {searchQuery
                  ? `No students found matching "${searchQuery}"`
                  : 'No student records in database'}
              </h3>
              <p>
                {searchQuery
                  ? 'Check your search query or clear the filter to view all records.'
                  : 'Get started by creating your first student record in the Java database.'}
              </p>
              {searchQuery ? (
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setSearchQuery('')}
                >
                  Clear Search Filter
                </button>
              ) : (
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => {
                    setStudentToEdit(null);
                    setIsFormOpen(true);
                  }}
                  style={{ marginTop: '0.5rem' }}
                >
                  <Plus size={16} />
                  <span>Add First Student</span>
                </button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>Register No</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Year</th>
                    <th>Email</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td className="mono-cell">{student.register_no}</td>
                      <td style={{ fontWeight: 600 }}>{student.name}</td>
                      <td>
                        <span className="dept-pill">{student.department}</span>
                      </td>
                      <td>
                        <span className="year-pill">Year {student.year}</span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {student.email}
                      </td>
                      <td>
                        <div
                          className="action-buttons"
                          style={{ justifyContent: 'flex-end' }}
                        >
                          <button
                            type="button"
                            className="icon-action-btn"
                            onClick={() => {
                              setStudentToEdit(student);
                              setIsFormOpen(true);
                            }}
                            title="Edit student"
                            aria-label={`Edit ${student.name}`}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            className="icon-action-btn delete-btn"
                            onClick={() => setStudentToDelete(student)}
                            title="Delete student"
                            aria-label={`Delete ${student.name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add / Edit Student Modal */}
      <StudentModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setStudentToEdit(null);
        }}
        onSave={handleSaveStudent}
        studentToEdit={studentToEdit}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={Boolean(studentToDelete)}
        onClose={() => setStudentToDelete(null)}
        onConfirm={handleDeleteStudent}
        student={studentToDelete}
      />
    </div>
  );
}
