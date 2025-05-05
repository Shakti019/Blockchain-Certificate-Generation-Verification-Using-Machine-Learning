import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserProfile from './UserProfile';
import './Navbar.css';

function Navbar() {
  const [activeComponent, setActiveComponent] = useState('dashboard');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavigation = (route) => {
    setActiveComponent(route);
    switch (route) {
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'create-certificate':
        navigate('/create-certificate');
        break;
      case 'verify-certificate':
        navigate('/verify-certificate');
        break;
      case 'map-view':
        navigate('/map-view');
        break;
      case 'certificate-logs':
        navigate('/certificate-logs');
        break;
      default:
        navigate('/dashboard');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    navigate('/login');
  };

  return (
    <div className="navbar-container" style={{ margin: 0, padding: 0 }}>
      {/* Top Bar with Logo and User Area */}
      <div className="top-bar" style={{ margin: 0, padding: '0.5rem 1rem' }}>
        <div className="logo-container">
          <span className="logo">🔗</span>
          <span className="app-name">BlockCert</span>
        </div>
        <div className="user-area">
          <div 
            className="user-avatar" 
            onClick={() => setIsProfileOpen(true)}
            style={{ cursor: 'pointer' }}
          >
            👤
          </div>
          <button 
            className="logout-button" 
            onClick={handleLogout}
            style={{
              marginLeft: '10px',
              padding: '8px 16px',
              backgroundColor: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Navigation Menu with Big Icons */}
      <div className="nav-menu" style={{ margin: 0, padding: '0.5rem' }}>
        <div
          className={`nav-item ${activeComponent === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleNavigation('dashboard')}
        >
          <div className="nav-icon dashboard" style={{ 
            fontSize: '2rem',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>📈</div>
          <span className="nav-text">Dashboard</span>
        </div>

        <div
          className={`nav-item ${activeComponent === 'create-certificate' ? 'active' : ''}`}
          onClick={() => handleNavigation('create-certificate')}
        >
          <div className="nav-icon create" style={{ 
            fontSize: '2rem',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>📜</div>
          <span className="nav-text">Create</span>
        </div>

        <div
          className={`nav-item ${activeComponent === 'verify-certificate' ? 'active' : ''}`}
          onClick={() => handleNavigation('verify-certificate')}
        >
          <div className="nav-icon verify" style={{ 
            fontSize: '2rem',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>🔐</div>
          <span className="nav-text">Verify</span>
        </div>

        <div
          className={`nav-item ${activeComponent === 'map-view' ? 'active' : ''}`}
          onClick={() => handleNavigation('map-view')}
        >
          <div className="nav-icon map" style={{ 
            fontSize: '2rem',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>🌎</div>
          <span className="nav-text">Map View</span>
        </div>

        <div
          className={`nav-item ${activeComponent === 'certificate-logs' ? 'active' : ''}`}
          onClick={() => handleNavigation('certificate-logs')}
        >
          <div className="nav-icon logs" style={{ 
            fontSize: '2rem',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>📋</div>
          <span className="nav-text">Logs</span>
        </div>
      </div>

      <UserProfile 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />
    </div>
  );
}

export default Navbar;