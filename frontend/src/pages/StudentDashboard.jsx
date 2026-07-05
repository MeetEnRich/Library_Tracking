import React, { useState, useEffect } from 'react';
import { api, getSocket } from '../api/client';
import OccupancyGauge from '../components/OccupancyGauge';
import { Calendar, Clock, MapPin, AlertCircle, RefreshCw, Monitor } from 'lucide-react';

const StudentDashboard = () => {
  const [zones, setZones] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchData = async () => {
    try {
      setError('');
      // Fetch zones (which includes live seat counts)
      const zonesData = await api.get('/zones');
      setZones(zonesData);

      // Fetch personal history
      const historyData = await api.get('/students/me/history');
      setHistory(historyData);
      setCurrentPage(1);
    } catch (err) {
      setError('Failed to fetch dashboard data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen to real-time occupancy updates
    const socket = getSocket();
    socket.on('occupancy:update', (data) => {
      setZones((prevZones) =>
        prevZones.map((z) => {
          if (z.zoneId === data.zoneId) {
            // Update counts based on source
            if (data.source === 'cv') {
              return { ...z, cvOccupied: data.occupied };
            } else if (data.source === 'qr') {
              return { ...z, qrOccupied: data.occupied };
            }
          }
          return z;
        })
      );
    });

    return () => {
      socket.off('occupancy:update');
    };
  }, []);

  // Find if student is currently checked in anywhere (exitTime is null)
  const activeVisit = history.find((log) => log.exitTime === null);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'Active';
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const calculateDuration = (entryStr, exitStr) => {
    const entry = new Date(entryStr);
    const exit = exitStr ? new Date(exitStr) : new Date();
    const diffMs = exit - entry;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins} mins`;
    }
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hrs} hr ${mins} min`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <RefreshCw className="animate-spin" size={32} />
        <span style={{ marginLeft: '1rem', fontWeight: 600 }}>Loading Dashboard...</span>
      </div>
    );
  }

  // Smart Seating Recommendation logic
  const getRecommendation = () => {
    if (zones.length === 0) return null;
    
    const zoneStats = zones.map(z => {
      const occupied = z.qrOccupied || 0;
      const total = z.totalSeats || 50;
      const pct = (occupied / total) * 100;
      const free = total - occupied;
      return { ...z, pct, free };
    });

    const allFull = zoneStats.every(z => z.pct >= 90);
    if (allFull) {
      return {
        type: 'critical',
        message: 'All library units are currently highly occupied. You may experience wait times for seating. Please consult the e-Library desktop labs or check back later.'
      };
    }

    zoneStats.sort((a, b) => a.pct - b.pct);
    const bestZone = zoneStats[0];

    return {
      type: 'recommend',
      message: `The quietest unit is the ${bestZone.name} with ${bestZone.free} open seats (${Math.round(bestZone.pct)}% occupied). This is the best study spot right now!`
    };
  };

  const recommendation = getRecommendation();

  return (
    <div>
      <div className="section-header-row">
        <div>
          <h1>Student Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Real-time library usage tracking</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchData}>
          <RefreshCw size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Refresh
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Smart Seating Suggestion Card */}
      {recommendation && (
        <div 
          className="section-panel" 
          style={{ 
            marginTop: '1rem', 
            marginBottom: '1.5rem', 
            borderLeft: `4px solid ${recommendation.type === 'critical' ? 'var(--danger-color)' : 'var(--primary-color)'}`,
            padding: '1.25rem',
            backgroundColor: 'var(--bg-tint)'
          }}
        >
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', color: 'var(--primary-color)', marginBottom: '0.4rem', marginTop: 0 }}>
            <Monitor size={18} />
            Smart Study Recommendation
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
            {recommendation.message}
          </p>
        </div>
      )}



      {/* Zones Occupancy Section */}
      <h2 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Library Zones Seating</h2>
      <div className="zone-grid">
        {zones.map((zone) => (
          <OccupancyGauge
            key={zone.zoneId}
            name={zone.name}
            occupied={zone.qrOccupied} // Default to QR scanned count for students
            totalSeats={zone.totalSeats}
            source="qr"
          />
        ))}
      </div>

      {/* Visit History Section */}
      <div className="section-panel" style={{ marginTop: '2rem' }}>
        <h2>My Visit History</h2>
        
        {history.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
            No library visits recorded yet. Scans will be logged here.
          </p>
        ) : (
          <div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th><div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><MapPin size={14} />Library Section</div></th>
                    <th><div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Calendar size={14} />Entry Time</div></th>
                    <th><div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={14} />Exit Time</div></th>
                    <th>Duration</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((log) => (
                      <tr key={log.id}>
                        <td style={{ fontWeight: 600 }}>{log.zone.name}</td>
                        <td>{formatDateTime(log.entryTime)}</td>
                        <td>{log.exitTime ? formatDateTime(log.exitTime) : 'Ongoing'}</td>
                        <td>{calculateDuration(log.entryTime, log.exitTime)}</td>
                        <td>
                          {log.exitTime ? (
                            <span className="badge badge-success">Completed</span>
                          ) : (
                            <span className="badge badge-info">Active</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {Math.ceil(history.length / itemsPerPage) > 1 && (
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
                  Page <strong>{currentPage}</strong> of <strong>{Math.ceil(history.length / itemsPerPage)}</strong> (Total {history.length} records)
                </span>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(history.length / itemsPerPage)))} 
                  disabled={currentPage === Math.ceil(history.length / itemsPerPage)}
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
  );
};

export default StudentDashboard;
