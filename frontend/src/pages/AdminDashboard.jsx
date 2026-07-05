import React, { useState, useEffect } from 'react';
import { api, getSocket } from '../api/client';
import { Users, LogIn, LayoutDashboard, RefreshCw, History, Eye, UserCheck } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchStats = async () => {
    try {
      setError('');
      const data = await api.get('/admin/dashboard');
      setStats(data);
      setCurrentPage(1);
    } catch (err) {
      setError('Failed to fetch dashboard statistics.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    const socket = getSocket();
    socket.on('occupancy:update', (data) => {
      // Trigger a light refresh or update the stats local state directly
      setStats((prevStats) => {
        if (!prevStats) return null;
        
        // Update the specific zone inside liveZones
        const updatedZones = prevStats.liveZones.map((z) => {
          if (z.zoneId === data.zoneId) {
            if (data.source === 'cv') {
              return { ...z, cvOccupied: data.occupied };
            } else if (data.source === 'qr') {
              return { ...z, qrOccupied: data.occupied };
            }
          }
          return z;
        });

        // Recalculate active check-ins (sum of QR counts across zones)
        const activeCheckins = updatedZones.reduce((sum, z) => sum + z.qrOccupied, 0);

        return {
          ...prevStats,
          liveZones: updatedZones,
          metrics: {
            ...prevStats.metrics,
            activeCheckins
          }
        };
      });
      
      // Also fetch stats to update the activity feed and totals properly
      // We throttle this or run it periodically, but simple fetch is fine here
      fetchStats();
    });

    return () => {
      socket.off('occupancy:update');
    };
  }, []);

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getPercentage = (occupied, total) => {
    return Math.min(100, Math.round((occupied / total) * 100));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <RefreshCw className="animate-spin" size={32} />
        <span style={{ marginLeft: '1rem', fontWeight: 600 }}>Loading Admin Panel...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="section-header-row">
        <div>
          <h1>Administrator Portal</h1>
          <p style={{ color: 'var(--text-muted)' }}>FULafia Library Administrative Control & Metrics</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchStats}>
          <RefreshCw size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Refresh
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Metrics Row */}
      {stats && (
        <div className="metrics-row">
          <div className="metric-box" style={{ borderLeftColor: 'var(--primary-color)' }}>
            <div className="metric-label">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Users size={14} /> Registered Students
              </div>
            </div>
            <div className="metric-value">{stats.metrics.totalStudents}</div>
          </div>
          
          <div className="metric-box" style={{ borderLeftColor: 'var(--secondary-color)' }}>
            <div className="metric-label">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <UserCheck size={14} /> Active Check-ins (QR)
              </div>
            </div>
            <div className="metric-value">{stats.metrics.activeCheckins}</div>
          </div>

          <div className="metric-box" style={{ borderLeftColor: 'var(--success-color)' }}>
            <div className="metric-label">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <LogIn size={14} /> Total Visits Today
              </div>
            </div>
            <div className="metric-value">{stats.metrics.checkinsToday}</div>
          </div>
        </div>
      )}

      {/* Verification Matrix (Hybrid Software Verification) */}
      <h2 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Hybrid Occupancy Verification Matrix</h2>
      <div className="zone-grid">
        {stats && stats.liveZones.map((zone) => {
          const qrPercent = getPercentage(zone.qrOccupied, zone.totalSeats);
          const cvPercent = getPercentage(zone.cvOccupied, zone.totalSeats);
          
          return (
            <div key={zone.zoneId} className="zone-panel" style={{ borderTop: '4px solid var(--primary-color)' }}>
              <div className="zone-title-row">
                <h3 style={{ fontSize: '1.2rem' }}>{zone.name}</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cap: {zone.totalSeats} seats</span>
              </div>

              {/* QR Metric Row */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                    <Users size={14} style={{ color: 'var(--primary-color)' }} />
                    QR Code Check-ins (Logs)
                  </span>
                  <span style={{ fontWeight: 700 }}>{zone.qrOccupied} ({qrPercent}%)</span>
                </div>
                <div className="gauge-track" style={{ height: '8px', marginBottom: 0 }}>
                  <div className="gauge-fill" style={{ width: `${qrPercent}%`, backgroundColor: 'var(--primary-color)' }}></div>
                </div>
              </div>

              {/* CV Metric Row */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                    <Eye size={14} style={{ color: 'var(--secondary-color)' }} />
                    YOLO Camera Count (AI)
                  </span>
                  <span style={{ fontWeight: 700 }}>{zone.cvOccupied} ({cvPercent}%)</span>
                </div>
                <div className="gauge-track" style={{ height: '8px', marginBottom: 0 }}>
                  <div className="gauge-fill" style={{ width: `${cvPercent}%`, backgroundColor: 'var(--secondary-color)' }}></div>
                </div>
              </div>

              <div className="zone-comparison-row">
                <span>Discrepancy Variance:</span>
                <span style={{ 
                  fontWeight: 700,
                  color: Math.abs(zone.qrOccupied - zone.cvOccupied) > 5 ? 'var(--danger-color)' : 'var(--success-color)'
                }}>
                  {Math.abs(zone.qrOccupied - zone.cvOccupied)} occupants
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dashboard Layout: Feed */}
      <div className="dashboard-grid">
        <div className="span-12 section-panel">
          <h2 style={{ marginBottom: '1rem', borderBottom: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={20} />
            Live Access Activity Log (Real-time feed)
          </h2>
          
          {stats && stats.recentActivity.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
              No check-in activity recorded today.
            </p>
          ) : (
            <div>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Matric Number</th>
                      <th>Library Section</th>
                      <th>Time</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats && stats.recentActivity
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((log) => (
                        <tr key={log.id}>
                          <td style={{ fontWeight: 600 }}>{log.student.name}</td>
                          <td>{log.matricNo}</td>
                          <td>{log.zone.name}</td>
                          <td>
                            {log.exitTime ? (
                              <span>
                                Checked In {formatTime(log.entryTime)} | Checked Out {formatTime(log.exitTime)}
                              </span>
                            ) : (
                              <span>Checked In {formatTime(log.entryTime)}</span>
                            )}
                          </td>
                          <td>
                            {log.exitTime ? (
                              <span className="badge badge-danger">Checked Out</span>
                            ) : (
                              <span className="badge badge-success">Checked In</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {stats && Math.ceil(stats.recentActivity.length / itemsPerPage) > 1 && (
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
                    Page <strong>{currentPage}</strong> of <strong>{Math.ceil(stats.recentActivity.length / itemsPerPage)}</strong> (Total {stats.recentActivity.length} records)
                  </span>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(stats.recentActivity.length / itemsPerPage)))} 
                    disabled={currentPage === Math.ceil(stats.recentActivity.length / itemsPerPage)}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
