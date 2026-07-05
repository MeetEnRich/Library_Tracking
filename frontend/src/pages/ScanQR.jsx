import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { api } from '../api/client';
import { Scan, AlertCircle, CheckCircle2, Monitor } from 'lucide-react';

const ScanQR = () => {
  const [scanResult, setScanResult] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [scanning, setScanning] = useState(true);
  
  // Emulator fields
  const [emulatedZone, setEmulatedZone] = useState('ZONE_CIRCULATION_FULAFIA');

  const scannerRef = useRef(null);

  useEffect(() => {
    // Start scanner on mount
    let html5QrcodeScanner = null;

    if (scanning) {
      html5QrcodeScanner = new Html5QrcodeScanner(
        'reader',
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        /* verbose= */ false
      );

      html5QrcodeScanner.render(onScanSuccess, onScanFailure);
      scannerRef.current = html5QrcodeScanner;
    }

    return () => {
      if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch((error) => {
          console.error('Failed to clear scanner on unmount', error);
        });
      }
    };
  }, [scanning]);

  const onScanSuccess = async (decodedText) => {
    try {
      setErrorMsg('');
      setSuccessMsg('');
      setScanResult(decodedText);
      setScanning(false);

      // Stop camera if scanner exists
      if (scannerRef.current) {
        await scannerRef.current.clear();
      }

      // Send to backend
      const result = await api.post('/qr/scan', { qrToken: decodedText });
      setSuccessMsg(result.message);
    } catch (err) {
      setErrorMsg(err.message || 'QR Scan failed to process.');
      setScanning(true); // Restart scanner
    }
  };

  const onScanFailure = (error) => {
    // Silent failure is normal for scan loops - they keep scanning
  };

  const handleEmulatedScan = async () => {
    try {
      setErrorMsg('');
      setSuccessMsg('');
      
      const result = await api.post('/qr/scan', { qrToken: emulatedZone });
      setSuccessMsg(result.message);
    } catch (err) {
      setErrorMsg(err.message || 'Emulated scan failed.');
    }
  };

  const resetScanner = () => {
    setScanResult('');
    setSuccessMsg('');
    setErrorMsg('');
    setScanning(true);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="section-header-row">
        <div>
          <h1>Scan QR Code</h1>
          <p style={{ color: 'var(--text-muted)' }}>Scan a FULafia Library location tag to check in or out</p>
        </div>
      </div>

      {successMsg && (
        <div className="success-banner" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CheckCircle2 size={20} />
          <div>{successMsg}</div>
        </div>
      )}

      {errorMsg && (
        <div className="error-banner" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle size={20} />
          <div>{errorMsg}</div>
        </div>
      )}

      {/* Main Scanner Container */}
      <div className="section-panel" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        {scanning ? (
          <div>
            <div id="reader" style={{ width: '100%', margin: '0 auto' }}></div>
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Position the QR code inside the camera box to scan
            </p>
          </div>
        ) : (
          <div>
            <div 
              style={{ 
                padding: '2.5rem', 
                background: 'var(--bg-tint)', 
                margin: '1.5rem 0',
                fontWeight: 600,
                fontSize: '1.1rem',
                border: '1px dashed var(--primary-color)'
              }}
            >
              Scanned: {scanResult}
            </div>
            <button className="btn btn-primary" onClick={resetScanner}>
              <Scan size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Scan Again
            </button>
          </div>
        )}
      </div>

      {/* Development Emulator Panel */}
      <div className="section-panel" style={{ borderLeft: '4px solid var(--secondary-color)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Monitor size={18} />
          Development Scan Emulator
        </h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          No camera access? Select a library zone below to simulate scanning a physical location QR tag.
        </p>

        <div className="form-group" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label className="form-label" htmlFor="emulatedZone">Select Zone Token</label>
            <select
              id="emulatedZone"
              className="select-filter"
              value={emulatedZone}
              onChange={(e) => setEmulatedZone(e.target.value)}
              style={{ width: '100%', padding: '0.65rem' }}
            >
              <option value="ZONE_CIRCULATION_FULAFIA">Circulation Unit (ZONE_CIRCULATION_FULAFIA)</option>
              <option value="ZONE_REFERENCE_FULAFIA">Reference Section (ZONE_REFERENCE_FULAFIA)</option>
              <option value="ZONE_ELIBRARY_FULAFIA">e-Library Section (ZONE_ELIBRARY_FULAFIA)</option>
            </select>
          </div>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handleEmulatedScan}
            style={{ padding: '0.65rem 1.5rem' }}
          >
            Emulate Scan
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScanQR;
