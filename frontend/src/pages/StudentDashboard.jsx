import React, { useState, useEffect } from 'react';
import { api, getSocket } from '../api/client';
import OccupancyGauge from '../components/OccupancyGauge';
import { Calendar, Clock, MapPin, AlertCircle, RefreshCw } from 'lucide-react';

const StudentDashboard = () => {
  const [zones, setZones] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setError('');
      // Fetch zones (which includes live seat counts)
      const zonesData = await api.get('/zones');
      setZones(zonesData);

      // Fetch personal history
      const historyData = await api.get('/students/me/history');
      setHistory(historyData);
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

      {/* Active Visit Banner */}
      {activeVisit && (
        <div className="info-banner" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle size={20} />
          <div>
            <strong>Status Check:</strong> You are currently checked in to the{' '}
            <strong>{activeVisit.zone.name}</strong>. Remember to scan the QR code to check out when leaving.
            <div style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>
              Checked in at: {formatDateTime(activeVisit.entryTime)} (Duration: {calculateDuration(activeVisit.entryTime, null)})
            </div>
          </div>
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
                {history.map((log) => (
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
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
