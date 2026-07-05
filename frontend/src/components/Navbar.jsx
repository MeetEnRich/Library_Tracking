import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LogOut, 
  BarChart3, 
  Scan, 
  Users, 
  LayoutDashboard, 
  Monitor, 
  ChevronLeft,
  Menu 
} from 'lucide-react';

const Navbar = ({ currentPage, setCurrentPage, isCollapsed = true, setIsCollapsed }) => {
  const { user, logout } = useAuth();

  const handleLinkClick = (page) => {
    setCurrentPage(page);
    // On mobile, automatically collapse menu after link click
    if (window.innerWidth < 768 && setIsCollapsed) {
      setIsCollapsed(true);
    }
  };

  if (!user) {
    // Guest navbar (simple clean top bar for login/register pages)
    return (
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <img src="/logo.png" alt="FULafia Logo" style={{ height: '32px', width: 'auto' }} />
            FULafia <span>Library Tracker</span>
          </div>
          <ul className="navbar-links">
            <li>
              <button
                onClick={() => handleLinkClick('login')}
                className={`navbar-link btn-link ${currentPage === 'login' ? 'active' : ''}`}
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
        </div>
      </nav>
    );
  }

  // Admin and Student menu items
  const menuItems = user.role === 'admin' ? [
    { page: 'admin-dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { page: 'reports', label: 'Reports', icon: <BarChart3 size={20} /> },
    { page: 'admin-qr', label: 'QR Signs', icon: <Monitor size={20} /> },
    { page: 'students', label: 'Students', icon: <Users size={20} /> }
  ] : [
    { page: 'student-dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { page: 'scan-qr', label: 'Scan QR', icon: <Scan size={20} /> }
  ];

  return (
    <nav className={`sidebar ${isCollapsed ? 'collapsed' : 'expanded'}`}>
      
      {/* Sidebar Header / Brand */}
      <div className="sidebar-brand-wrapper">
        <div className="sidebar-brand">
          <img src="/logo.png" alt="FULafia Logo" className="sidebar-logo" />
          {!isCollapsed && (
            <div className="sidebar-title">
              FULafia <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 400, color: '#FFFFFF' }}>Library Tracker</span>
            </div>
          )}
        </div>
        
        {/* Toggle Button */}
        <button 
          type="button" 
          className="sidebar-toggle-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand Navigation" : "Collapse Navigation"}
        >
          {isCollapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation List */}
      <ul className="sidebar-menu">
        {menuItems.map((item) => {
          const isActive = currentPage === item.page;
          return (
            <li key={item.page}>
              <button
                type="button"
                onClick={() => handleLinkClick(item.page)}
                className={`sidebar-menu-item ${isActive ? 'active' : ''}`}
                data-tooltip={item.label} // Custom styled tooltip trigger
              >
                <span className="sidebar-item-icon">{item.icon}</span>
                {!isCollapsed && <span className="sidebar-item-label">{item.label}</span>}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Logout Button at the bottom */}
      <div className="sidebar-footer">
        <button
          type="button"
          onClick={logout}
          className="sidebar-menu-item logout-item"
          data-tooltip="Logout" // Custom styled tooltip trigger
        >
          <span className="sidebar-item-icon"><LogOut size={20} /></span>
          {!isCollapsed && <span className="sidebar-item-label">Logout</span>}
        </button>
      </div>

    </nav>
  );
};

export default Navbar;
