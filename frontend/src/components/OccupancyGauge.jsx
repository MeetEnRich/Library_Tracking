import React from 'react';

const OccupancyGauge = ({ name, occupied, totalSeats, source }) => {
  const percentage = Math.min(100, Math.round((occupied / totalSeats) * 100));

  let statusClass = '';
  if (percentage >= 90) {
    statusClass = 'danger';
  } else if (percentage >= 70) {
    statusClass = 'warning';
  }

  const getSourceLabel = (src) => {
    if (src === 'cv') return 'Camera (AI)';
    if (src === 'qr') return 'QR Scan (Logs)';
    return 'Hybrid';
  };

  return (
    <div className={`zone-panel ${percentage >= 80 ? 'over-80' : ''}`}>
      <div className="zone-title-row">
        <h3>{name}</h3>
        <div className="zone-seats-counter">
          {occupied} / {totalSeats}
        </div>
      </div>
      
      <div className="gauge-track">
        <div 
          className={`gauge-fill ${statusClass}`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
        <span style={{ fontWeight: 600 }}>{percentage}% Occupied</span>
        <span style={{ color: 'var(--text-muted)' }}>
          Source: {getSourceLabel(source)}
        </span>
      </div>
    </div>
  );
};

export default OccupancyGauge;
