/**
 * ==============================================================================
 * Student Database API Client (Java Backend)
 * Base URL: /api/students (Proxied to http://localhost:8080 via Vite)
 * ==============================================================================
 */

const API_BASE = '/api/students';

export async function fetchStudentsApi(searchTerm = '') {
  const url = searchTerm ? `${API_BASE}?search=${encodeURIComponent(searchTerm)}` : API_BASE;
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch students (${res.status})`);
  }
  return res.json();
}

export async function createStudentApi(studentData) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(studentData),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to create student (${res.status})`);
  }
  return res.json();
}

export async function updateStudentApi(id, studentData) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(studentData),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to update student (${res.status})`);
  }
  return res.json();
}

export async function deleteStudentApi(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to delete student (${res.status})`);
  }
  return res.json();
}

export async function checkBackendHealth() {
  try {
    const res = await fetch('/api/health');
    return res.ok;
  } catch {
    return false;
  }
}
