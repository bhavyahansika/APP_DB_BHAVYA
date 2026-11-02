import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, isConfigured } from '../supabaseClient';
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
  Database,
  CheckCircle2,
} from 'lucide-react';

export default function StudentDatabaseScreen() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);

  // Fetch all students directly from Supabase
  const fetchStudents = useCallback(async () => {
    if (!isConfigured) {
      setErrorMessage(
        'Supabase is not configured yet. Please check your VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.'
      );
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');

      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setStudents(data || []);
    } catch (err) {
      console.error('Error fetching students:', err);
      if (err.message && err.message.includes('relation "public.students" does not exist')) {
        setErrorMessage(
          'The "students" table has not been created yet in your Supabase project. Please execute the SQL in supabase/schema.sql using Supabase SQL Editor.'
        );
      } else {
        setErrorMessage(err.message || 'Could not fetch student records.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Set up real-time subscription & initial fetch
  useEffect(() => {
    fetchStudents();

    if (!isConfigured) return;

    // Subscribe to real-time changes on the students table
    const channel = supabase
      .channel('realtime:students')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students',
        },
        () => {
          fetchStudents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStudents]);

  // Filter students based on Register Number or Name
  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (student) =>
        student.register_no?.toLowerCase().includes(q) ||
        student.name?.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  // Handle Create or Update Student
  const handleSaveStudent = async (formData) => {
    if (studentToEdit) {
      // UPDATE
      const { error } = await supabase
        .from('students')
        .update({
          register_no: formData.register_no,
          name: formData.name,
          department: formData.department,
          year: formData.year,
          email: formData.email,
        })
        .eq('id', studentToEdit.id);

      if (error) throw error;
    } else {
      // INSERT
      const { error } = await supabase.from('students').insert([
        {
          register_no: formData.register_no,
          name: formData.name,
          department: formData.department,
          year: formData.year,
          email: formData.email,
        },
      ]);

      if (error) throw error;
    }

    await fetchStudents();
  };

  // Handle Delete Student
  const handleDeleteStudent = async (id) => {
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) throw error;
    await fetchStudents();
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
              <span>End-to-End PostgreSQL Web System</span>
            </div>
          </div>

          <div className="nav-actions">
            <div className="teacher-badge" title="Supabase Database Status">
              <span className="teacher-indicator" />
              <span>Database Active</span>
            </div>
            <button
              type="button"
              className="icon-action-btn"
              onClick={fetchStudents}
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
              <p>Add, search, update, and manage all student database records in real time</p>
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
                placeholder="Search by Register No or Name..."
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
              <span>Loading student records...</span>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-box">
                <Users size={24} />
              </div>
              <h3>
                {searchQuery
                  ? `No students found matching "${searchQuery}"`
                  : 'No student records yet'}
              </h3>
              <p>
                {searchQuery
                  ? 'Check your register number or name query, or click clear to show all students.'
                  : 'Get started by creating your first student record in the database.'}
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
