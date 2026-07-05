import React, { useState } from 'react';
import { ShieldCheck, ArrowLeft, Monitor } from 'lucide-react';

const QRDisplay = () => {
  const [activeZone, setActiveZone] = useState('ZONE_CIRCULATION_FULAFIA');

  const zones = [
    {
      token: 'ZONE_CIRCULATION_FULAFIA',
      name: 'Circulation Unit',
      location: 'Entrance Desk / Registry Counter',
      color: '#00361C'
    },
    {
      token: 'ZONE_REFERENCE_FULAFIA',
      name: 'Reference Section',
      location: 'Main Entry Security Gate',
      color: '#00361C'
    },
    {
      token: 'ZONE_ELIBRARY_FULAFIA',
      name: 'e-Library Section',
      location: 'Digital Labs Entrance Gate',
      color: '#00361C'
    }
  ];

  const currentZone = zones.find(z => z.token === activeZone);

  // Generate QR URL using a free, high-speed QR generator API
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(activeZone)}`;

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', paddingBottom: '3.5rem' }}>
      <div className="section-header-row" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1>Library Digital QR Signs</h1>
          <p style={{ color: 'var(--text-muted)' }}>Display these QR codes on dedicated screens at entrance points</p>
        </div>
      </div>

      {/* Tabs Row */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {zones.map((zone) => (
          <button
            key={zone.token}
            type="button"
            className={`btn ${activeZone === zone.token ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveZone(zone.token)}
            style={{ 
              flex: 1, 
              minWidth: '180px',
              padding: '0.75rem', 
              fontWeight: 600,
              border: activeZone === zone.token ? 'none' : '1px solid var(--border-color)' 
            }}
          >
            {zone.name}
          </button>
        ))}
      </div>

      {/* Sign Card Design */}
      <div 
        className="section-panel"
        style={{
          border: '2px solid var(--border-color)',
          borderTop: `12px solid var(--primary-color)`,
          padding: '3rem 2rem',
          textAlign: 'center',
          backgroundColor: '#FFFFFF',
          borderRadius: '4px',
          boxShadow: 'none'
        }}
      >
        {/* Sign Header */}
        <div style={{ marginBottom: '2rem' }}>
          <img 
            src="/logo.png" 
            alt="FULafia Logo" 
            style={{ height: '80px', width: 'auto', display: 'block', margin: '0 auto 1rem auto' }} 
          />
          <h2 style={{ fontSize: '1.8rem', color: 'var(--primary-color)', margin: 0, fontWeight: 700 }}>
            FEDERAL UNIVERSITY OF LAFIA
          </h2>
          <p style={{ fontSize: '0.9rem', letterSpacing: '2px', fontWeight: 600, color: 'var(--text-muted)', marginTop: '0.25rem', textTransform: 'uppercase' }}>
            Library Attendance System
          </p>
        </div>

        {/* Highlight Banner */}
        <div 
          style={{ 
            backgroundColor: 'var(--bg-tint)', 
            borderLeft: `4px solid var(--secondary-color)`, 
            padding: '1rem',
            margin: '1.5rem auto',
            maxWidth: '500px',
            textAlign: 'left'
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary-color)' }}>
            {currentZone.name}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Location: {currentZone.location}
          </div>
        </div>

        {/* QR Code Container */}
        <div 
          style={{ 
            display: 'inline-block', 
            padding: '1.5rem', 
            border: '2px solid var(--border-color)', 
            borderRadius: '4px',
            backgroundColor: '#FFFFFF',
            margin: '1rem auto'
          }}
        >
          <img 
            src={qrUrl} 
            alt={`${currentZone.name} QR Code`} 
            style={{ width: '280px', height: '280px', display: 'block' }} 
          />
        </div>

        {/* Instructions */}
        <div style={{ marginTop: '2rem', maxWidth: '480px', margin: '2rem auto 0 auto', textAlign: 'left' }}>
          <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-color)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Scan Check-In / Check-Out Instructions
          </h4>
          <ol style={{ fontSize: '0.85rem', color: 'var(--text-muted)', paddingLeft: '1.25rem', lineHeight: '1.6' }}>
            <li style={{ marginBottom: '0.5rem' }}>Open the <strong>FULafia Library Tracker</strong> application on your mobile device.</li>
            <li style={{ marginBottom: '0.5rem' }}>Select the <strong>Scan QR</strong> action from the navigation header.</li>
            <li style={{ marginBottom: '0.5rem' }}>Align this QR code within your camera viewfinder window.</li>
            <li>Your session will instantly log (Checking you in or checking you out).</li>
          </ol>
        </div>

        {/* Footer Integrity Shield */}
        <div 
          style={{ 
            marginTop: '3rem', 
            display: 'flex', 
            alignItems: 'center', 
            justify: 'center', 
            gap: '0.5rem', 
            fontSize: '0.8rem', 
            color: 'var(--text-light)' 
          }}
        >
          <ShieldCheck size={16} />
          <span>Secured Attendance Gateway • Integrity, Innovation, and Excellence</span>
        </div>
      </div>


    </div>
  );
};

export default QRDisplay;
