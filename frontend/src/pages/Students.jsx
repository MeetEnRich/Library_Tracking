import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Users, Trash2, ShieldAlert, RefreshCw, Calendar, Eye } from 'lucide-react';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Capped at 5 rows per page as requested

  // Modal inspection states
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentLogs, setStudentLogs] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalPage, setModalPage] = useState(1);
  const modalItemsPerPage = 5;

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.get('/admin/students');
      setStudents(data);
      setCurrentPage(1);
    } catch (err) {
      setError('Failed to load registered student lists.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleDelete = async (matricNo, name) => {
    const confirmDelete = window.confirm(`Are you sure you want to permanently delete the profile of ${name} (${matricNo})? This will also remove all their associated check-in logs.`);
    
    if (!confirmDelete) return;

    try {
      setError('');
      setSuccess('');
      await api.delete(`/admin/students/${encodeURIComponent(matricNo)}`);
      setSuccess(`Successfully deleted student profile for ${name}`);
      
      // Update local state
      setStudents((prev) => prev.filter((s) => s.matricNo !== matricNo));
    } catch (err) {
      setError(err.message || 'Failed to delete student record.');
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const viewStudentLogs = async (student) => {
    setSelectedStudent(student);
    setModalLoading(true);
    setModalPage(1);
    try {
      const data = await api.get(`/admin/students/${encodeURIComponent(student.matricNo)}/logs`);
      setStudentLogs(data);
    } catch (err) {
      console.error('Failed to load logs for student:', err);
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <RefreshCw className="animate-spin" size={32} />
        <span style={{ marginLeft: '1rem', fontWeight: 600 }}>Loading Student Directory...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="section-header-row">
        <div>
          <h1>Student Directory</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage registered library users and view individual usage counts</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchStudents}>
          <RefreshCw size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Reload
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      <div className="section-panel">
        <h2>Registered Library Users ({students.length})</h2>
        
        {students.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
            No students are currently registered in the tracking database.
          </p>
        ) : (
          <div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Matric Number</th>
                    <th>Student Name</th>
                    <th>Department</th>
                    <th><div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Calendar size={14} />Date Enrolled</div></th>
                    <th>Visits</th>
                    <th style={{ textAlign: 'center' }}>Management</th>
                  </tr>
                </thead>
                <tbody>
                  {students
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((student) => (
                      <tr key={student.matricNo}>
                        <td style={{ fontWeight: 600 }}>{student.matricNo}</td>
                        <td>{student.name}</td>
                        <td>{student.department}</td>
                        <td>{formatDate(student.createdAt)}</td>
                        <td style={{ fontWeight: 700 }}>{student._count.logs}</td>
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                            <button 
                              className="btn btn-secondary" 
                              onClick={() => viewStudentLogs(student)}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.75rem', fontSize: '0.8rem', fontWeight: 600 }}
                            >
                              <Eye size={12} />
                              View
                            </button>
                            <button 
                              className="btn btn-danger" 
                              onClick={() => handleDelete(student.matricNo, student.name)}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                            >
                              <Trash2 size={12} />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {Math.ceil(students.length / itemsPerPage) > 1 && (
              <div 
                style={{ 
                  display: 'flex', 
                  justify: 'center', 
                  alignItems: 'center', 
                  gap: '1.5rem',
                  marginTop: '1.5rem',
                  paddingTop: '1.25rem',
                  borderTop: '1px solid var(--border-color)'
                }}
              >
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                  disabled={currentPage === 1}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                >
                  Previous
                </button>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Page <strong>{currentPage}</strong> of <strong>{Math.ceil(students.length / itemsPerPage)}</strong> (Total {students.length} students)
                </span>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(students.length / itemsPerPage)))} 
                  disabled={currentPage === Math.ceil(students.length / itemsPerPage)}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', padding: '1rem', backgroundColor: 'var(--bg-tint)', borderLeft: '4px solid var(--primary-color)' }}>
        <ShieldAlert size={18} style={{ flexShrink: 0 }} />
        <span><strong>Administrative Warning:</strong> Deleting a student profile triggers a cascading database action. All logs, check-ins, and analytics snapshots generated by that student will be permanently deleted. This action cannot be undone.</span>
      </div>
      
      {/* Modal Profile / Detailed Usage Sheet */}
      {selectedStudent && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            justify: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => setSelectedStudent(null)}
        >
          <div 
            className="section-panel"
            style={{
              width: '100%',
              maxWidth: '750px',
              backgroundColor: '#FFFFFF',
              borderTop: '8px solid var(--primary-color)',
              padding: '2rem',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', color: 'var(--primary-color)', margin: 0, border: 'none', padding: 0 }}>
                  {selectedStudent.name}
                </h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Matric No: <strong>{selectedStudent.matricNo}</strong> | Department: <strong>{selectedStudent.department}</strong>
                </p>
              </div>
              <button 
                className="btn btn-secondary" 
                onClick={() => setSelectedStudent(null)}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              >
                Close
              </button>
            </div>

            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Usage History Summary</h3>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '150px', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: 'var(--bg-tint)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Recorded Visits</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                  {selectedStudent._count.logs}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: '150px', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: 'var(--bg-tint)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Enrollment Date</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                  {formatDate(selectedStudent.createdAt)}
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Access Logs Feed</h3>
            {modalLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <RefreshCw className="animate-spin" size={24} />
              </div>
            ) : studentLogs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                No library check-in activity found for this student.
              </p>
            ) : (
              <div>
                <div className="table-responsive">
                  <table className="data-table" style={{ fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th>Library Section</th>
                        <th>Check-in Time</th>
                        <th>Check-out Time</th>
                        <th>Duration</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentLogs
                        .slice((modalPage - 1) * modalItemsPerPage, modalPage * modalItemsPerPage)
                        .map((log) => {
                          let durationStr = 'Ongoing';
                          if (log.exitTime) {
                            const mins = Math.floor((new Date(log.exitTime) - new Date(log.entryTime)) / (1000 * 60));
                            durationStr = mins < 60 ? `${mins} mins` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
                          }
                          return (
                            <tr key={log.id}>
                              <td style={{ fontWeight: 600 }}>{log.zone.name}</td>
                              <td>{new Date(log.entryTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                              <td>{log.exitTime ? new Date(log.exitTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '-'}</td>
                              <td>{durationStr}</td>
                              <td>
                                {log.exitTime ? (
                                  <span className="badge badge-danger">Closed</span>
                                ) : (
                                  <span className="badge badge-success">Active</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
                
                {Math.ceil(studentLogs.length / modalItemsPerPage) > 1 && (
                  <div 
                    style={{ 
                      display: 'flex', 
                      justify: 'center', 
                      alignItems: 'center', 
                      gap: '1rem',
                      marginTop: '1rem'
                    }}
                  >
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => setModalPage(p => Math.max(p - 1, 1))} 
                      disabled={modalPage === 1}
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                    >
                      Prev
                    </button>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Page {modalPage} of {Math.ceil(studentLogs.length / modalItemsPerPage)}
                    </span>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => setModalPage(p => Math.min(p + 1, Math.ceil(studentLogs.length / modalItemsPerPage)))} 
                      disabled={modalPage === Math.ceil(studentLogs.length / modalItemsPerPage)}
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
