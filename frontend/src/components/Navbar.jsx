import React from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, LogOut, BarChart3, Scan, Users, LayoutDashboard } from 'lucide-react';

const Navbar = ({ currentPage, setCurrentPage }) => {
  const { user, logout } = useAuth();

  const handleLinkClick = (page) => {
    setCurrentPage(page);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <BookOpen size={24} />
          FULafia <span>Library Tracker</span>
        </div>

        {user ? (
          <ul className="navbar-links">
            {user.role === 'admin' ? (
              <>
                <li>
                  <button
                    onClick={() => handleLinkClick('admin-dashboard')}
                    className={`navbar-link btn-link ${currentPage === 'admin-dashboard' ? 'active' : ''}`}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <LayoutDashboard size={16} />
                      Dashboard
                    </div>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleLinkClick('reports')}
                    className={`navbar-link btn-link ${currentPage === 'reports' ? 'active' : ''}`}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <BarChart3 size={16} />
                      Reports
                    </div>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleLinkClick('students')}
                    className={`navbar-link btn-link ${currentPage === 'students' ? 'active' : ''}`}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Users size={16} />
                      Students
                    </div>
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <button
                    onClick={() => handleLinkClick('student-dashboard')}
                    className={`navbar-link btn-link ${currentPage === 'student-dashboard' ? 'active' : ''}`}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <LayoutDashboard size={16} />
                      Dashboard
                    </div>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleLinkClick('scan-qr')}
                    className={`navbar-link btn-link ${currentPage === 'scan-qr' ? 'active' : ''}`}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Scan size={16} />
                      Scan QR
                    </div>
                  </button>
                </li>
              </>
            )}
            
            <li style={{ marginLeft: '1rem' }}>
              <button onClick={logout} className="logout-button" title="Sign Out">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <LogOut size={16} />
                  Logout
                </div>
              </button>
            </li>
          </ul>
        ) : (
          <ul className="navbar-links">
            <li>
              <button
                onClick={() => handleLinkClick('login')}
                className={`navbar-link btn-link ${currentPage === 'login' || currentPage === 'admin-login' ? 'active' : ''}`}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
              >
                Login
              </button>
            </li>
            <li>
              <button
                onClick={() => handleLinkClick('register')}
                className={`navbar-link btn-link ${currentPage === 'register' ? 'active' : ''}`}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
              >
                Register
              </button>
            </li>
          </ul>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
