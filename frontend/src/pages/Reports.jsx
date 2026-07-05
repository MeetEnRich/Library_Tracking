import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Filter, Download, HelpCircle, FileSpreadsheet, RefreshCw } from 'lucide-react';

const Reports = () => {
  const [logs, setLogs] = useState([]);
  const [zones, setZones] = useState([]);
  const [zoneId, setZoneId] = useState('all');
  
  // Default date filter: past 7 days
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartTab, setChartTab] = useState('daily');

  const fetchFiltersAndData = async () => {
    try {
      setLoading(true);
      setError('');
      // Fetch zones to populate select filter
      const zonesData = await api.get('/zones');
      setZones(zonesData);

      // Fetch logs
      const url = `/admin/reports?zoneId=${zoneId}&from=${fromDate}&to=${toDate}`;
      const logsData = await api.get(url);
      setLogs(logsData);
    } catch (err) {
      setError('Failed to fetch report logs.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiltersAndData();
  }, [zoneId, fromDate, toDate]);

  // Statistics Computations
  const totalVisits = logs.length;
  
  const averageDuration = () => {
    if (logs.length === 0) return 0;
    let totalMins = 0;
    let completedCount = 0;

    for (const log of logs) {
      if (log.exitTime) {
        const diffMs = new Date(log.exitTime) - new Date(log.entryTime);
        totalMins += Math.floor(diffMs / (1000 * 60));
        completedCount++;
      }
    }

    return completedCount > 0 ? Math.round(totalMins / completedCount) : 0;
  };

  const peakTrafficHour = () => {
    if (logs.length === 0) return 'N/A';
    const hourCounts = {};

    for (const log of logs) {
      const hr = new Date(log.entryTime).getHours();
      hourCounts[hr] = (hourCounts[hr] || 0) + 1;
    }

    let peakHr = null;
    let maxCount = -1;

    for (const [hr, count] of Object.entries(hourCounts)) {
      if (count > maxCount) {
        maxCount = count;
        peakHr = parseInt(hr, 10);
      }
    }

    if (peakHr === null) return 'N/A';
    const ampm = peakHr >= 12 ? 'PM' : 'AM';
    const displayHr = peakHr % 12 === 0 ? 12 : peakHr % 12;
    return `${displayHr}:00 ${ampm}`;
  };

  // Chart Data: group logs count by date
  const getChartData = () => {
    const dateCounts = {};
    
    // Initialize date counts with all dates in the range to ensure continuous chart line
    const start = new Date(fromDate);
    const end = new Date(toDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dateCounts[dateStr] = 0;
    }

    // Accumulate counts from logs
    for (const log of logs) {
      const dateStr = new Date(log.entryTime).toISOString().split('T')[0];
      if (dateCounts[dateStr] !== undefined) {
        dateCounts[dateStr]++;
      }
    }

    // Format for Recharts
    return Object.entries(dateCounts)
      .map(([date, count]) => {
        const formattedDate = new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' });
        return { date: formattedDate, visitors: count };
      });
  };

  // Chart Data: group logs count by hour of day (0-23)
  const getHourlyChartData = () => {
    const hourCounts = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      visitors: 0
    }));

    for (const log of logs) {
      const hr = new Date(log.entryTime).getHours();
      hourCounts[hr].visitors++;
    }

    return hourCounts.map(({ hour, visitors }) => {
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHr = hour % 12 === 0 ? 12 : hour % 12;
      return {
        time: `${displayHr} ${ampm}`,
        visitors
      };
    });
  };

  // Client-side CSV generation
  const downloadCSV = () => {
    if (logs.length === 0) return;

    const headers = ['Matric No', 'Student Name', 'Department', 'Library Zone', 'Entry Time', 'Exit Time', 'Duration (mins)'];
    
    const rows = logs.map((log) => {
      let duration = '';
      if (log.exitTime) {
        duration = Math.floor((new Date(log.exitTime) - new Date(log.entryTime)) / (1000 * 60));
      }
      return [
        log.matricNo,
        `"${log.student.name.replace(/"/g, '""')}"`,
        `"${log.student.department.replace(/"/g, '""')}"`,
        `"${log.zone.name.replace(/"/g, '""')}"`,
        log.entryTime,
        log.exitTime || 'Active',
        duration
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FULafia_Library_Usage_Report_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="section-header-row">
        <div>
          <h1>Analytics & Reports</h1>
          <p style={{ color: 'var(--text-muted)' }}>Historical facility statistics and spreadsheet exports</p>
        </div>
        <button 
          className="btn btn-secondary" 
          onClick={downloadCSV}
          disabled={logs.length === 0}
          title="Export data to Excel/CSV"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Download size={16} />
            Export CSV
          </div>
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Filters Panel */}
      <div className="section-panel" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--secondary-color)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Filter size={18} />
          Report Query Filters
        </h3>
        
        <div className="filter-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
          
          {/* Inputs Group (Left) */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '180px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }} htmlFor="zone">Library Zone</label>
              <select
                id="zone"
                className="select-filter"
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                style={{ width: '100%', padding: '0.55rem' }}
              >
                <option value="all">All Library Zones</option>
                {zones.map((z) => (
                  <option key={z.zoneId} value={z.zoneId}>{z.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '140px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }} htmlFor="from">Start Date</label>
              <input
                type="date"
                id="from"
                className="date-filter"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '140px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }} htmlFor="to">End Date</label>
              <input
                type="date"
                id="to"
                className="date-filter"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>

            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={fetchFiltersAndData}
              style={{ padding: '0.55rem 1.25rem' }}
            >
              <RefreshCw size={14} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
              Reload
            </button>
          </div>

          {/* Quick Presets Group (Right) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Quick Range Presets</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  const d = new Date();
                  setFromDate(d.toISOString().split('T')[0]);
                  setToDate(d.toISOString().split('T')[0]);
                }}
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
              >
                Today
              </button>
              <button 
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 7);
                  setFromDate(d.toISOString().split('T')[0]);
                  setToDate(new Date().toISOString().split('T')[0]);
                }}
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
              >
                Last 7 Days
              </button>
              <button 
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 30);
                  setFromDate(d.toISOString().split('T')[0]);
                  setToDate(new Date().toISOString().split('T')[0]);
                }}
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
              >
                Last 30 Days
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Analytics Summary */}
      <div className="metrics-row">
        <div className="metric-box">
          <div className="metric-label">Total Visits In Range</div>
          <div className="metric-value">{totalVisits}</div>
        </div>
        <div className="metric-box">
          <div className="metric-label">Average Session Length</div>
          <div className="metric-value">{averageDuration()} mins</div>
        </div>
        <div className="metric-box">
          <div className="metric-label">Peak Traffic Hour</div>
          <div className="metric-value">{peakTrafficHour()}</div>
        </div>
      </div>

      {/* Daily Usage Chart */}
      <div className="dashboard-grid" style={{ marginTop: '2rem' }}>
        <div className="span-8 section-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, border: 'none', padding: 0 }}>Attendance Distribution</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className={`btn ${chartTab === 'daily' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setChartTab('daily')}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 600 }}
              >
                Daily Trends
              </button>
              <button
                type="button"
                className={`btn ${chartTab === 'hourly' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setChartTab('hourly')}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 600 }}
              >
                Peak Hours
              </button>
            </div>
          </div>
          
          <div className="chart-container-box">
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <RefreshCw className="animate-spin" size={24} />
              </div>
            ) : logs.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
                No visitor data for this range.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={chartTab === 'daily' ? getChartData() : getHourlyChartData()} 
                  margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey={chartTab === 'daily' ? 'date' : 'time'} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'var(--bg-tint)' }} />
                  <Bar dataKey="visitors" fill="var(--primary-color)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="span-4 section-panel">
          <h2>Statistical Summary</h2>
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Active Zone:</span>
              <span style={{ fontWeight: 600 }}>
                {zoneId === 'all' ? 'All Units' : zones.find(z => z.zoneId === parseInt(zoneId))?.name || 'Unit'}
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Database Logs:</span>
              <span style={{ fontWeight: 600 }}>{logs.length} entries</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Uncompleted Visits:</span>
              <span style={{ fontWeight: 600 }}>{logs.filter(l => !l.exitTime).length} students</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Report Window:</span>
              <span style={{ fontWeight: 600 }}>{fromDate} to {toDate}</span>
            </div>
          </div>
          
          <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem' }}>
            <HelpCircle size={16} style={{ flexShrink: 0 }} />
            <span>These reports combine only students who checked in using their unique student profiles. Camera counts are not included in log listings.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
