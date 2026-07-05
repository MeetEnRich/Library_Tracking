import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import ScanQR from './pages/ScanQR';
import AdminDashboard from './pages/AdminDashboard';
import Reports from './pages/Reports';
import Students from './pages/Students';
import QRDisplay from './pages/QRDisplay';

function App() {
  const getPageFromPath = () => {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
    return path || 'login';
  };

  const [currentPage, setCurrentPage] = useState(getPageFromPath);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  // Sync state changes to browser URL path
  useEffect(() => {
    const targetPath = currentPage === 'login' ? '/' : `/${currentPage}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  }, [currentPage]);

  // Listen to browser backward/forward navigation (popstate)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(getPageFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const { user, loading } = useAuth();

  // Simple client-side page routing guard based on authentication status
  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Guest users
      if (currentPage !== 'login' && currentPage !== 'register') {
        setCurrentPage('login');
      }
    } else {
      // Authenticated users
      if (user.role === 'admin') {
        if (
          currentPage !== 'admin-dashboard' &&
          currentPage !== 'reports' &&
          currentPage !== 'students' &&
          currentPage !== 'admin-qr'
        ) {
          setCurrentPage('admin-dashboard');
        }
      } else if (user.role === 'student') {
        if (
          currentPage !== 'student-dashboard' &&
          currentPage !== 'scan-qr'
        ) {
          setCurrentPage('student-dashboard');
        }
      }
    }
  }, [user, loading, currentPage]);

  const renderPage = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', fontWeight: 600 }}>
          Verifying session credentials...
        </div>
      );
    }

    switch (currentPage) {
      case 'login':
        return <Login setCurrentPage={setCurrentPage} />;
      case 'register':
        return <Register setCurrentPage={setCurrentPage} />;
      case 'student-dashboard':
        return <StudentDashboard />;
      case 'scan-qr':
        return <ScanQR />;
      case 'admin-dashboard':
        return <AdminDashboard />;
      case 'admin-qr':
        return <QRDisplay />;
      case 'reports':
        return <Reports />;
      case 'students':
        return <Students />;
      default:
        return <Login setCurrentPage={setCurrentPage} />;
    }
  };

  // Conditional layouts based on user authentication status
  if (user) {
    return (
      <div className={`app-layout-has-sidebar ${isSidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
        <Navbar 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage} 
          isCollapsed={isSidebarCollapsed} 
          setIsCollapsed={setIsSidebarCollapsed} 
        />
        <div className="app-content-wrapper">
          <main className="main-content">
            {renderPage()}
          </main>
          <footer 
            style={{ 
              textAlign: 'center', 
              padding: '1.5rem', 
              borderTop: '1px solid var(--border-color)', 
              fontSize: '0.85rem', 
              color: 'var(--text-muted)',
              backgroundColor: 'var(--bg-tint)',
              marginTop: 'auto'
            }}
          >
            <div>Federal University of Lafia Library Complex</div>
            <div style={{ marginTop: '0.25rem', fontWeight: 600 }}>
              Integrity, Innovation, and Excellence
            </div>
          </footer>
        </div>
      </div>
    );
  }

  // Guest layout
  return (
    <div className="app-layout-guest">
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="main-content">
        {renderPage()}
      </main>
      <footer 
        style={{ 
          textAlign: 'center', 
          padding: '1.5rem', 
          borderTop: '1px solid var(--border-color)', 
          fontSize: '0.85rem', 
          color: 'var(--text-muted)',
          backgroundColor: 'var(--bg-tint)',
          marginTop: 'auto'
        }}
      >
        <div>Federal University of Lafia Library Complex</div>
        <div style={{ marginTop: '0.25rem', fontWeight: 600 }}>
          Integrity, Innovation, and Excellence
        </div>
      </footer>
    </div>
  );
}

export default App;
