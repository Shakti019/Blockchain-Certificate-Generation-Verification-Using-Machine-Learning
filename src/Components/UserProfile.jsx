import { useState, useEffect, useRef } from 'react';
import './UserProfile.css';

const UserProfile = ({ isOpen, onClose }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const profileRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch('http://localhost:5000/user/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch user information');
        }
        
        const data = await response.json();
        setUserInfo(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    if (isOpen) {
      setIsAnimating(true);
      fetchUserInfo();
    }
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className={`profile-overlay ${isAnimating ? 'fade-in' : 'fade-out'}`}>
      <div className={`profile-modal ${isAnimating ? 'slide-in' : 'slide-out'}`} ref={profileRef}>
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading profile...</p>
          </div>
        ) : error ? (
          <div className="error">
            <div className="error-icon">⚠️</div>
            <h3>Error Loading Profile</h3>
            <p>{error}</p>
            <button className="retry-button" onClick={() => window.location.reload()}>Try Again</button>
          </div>
        ) : (
          <div className="profile-content">
            <button className="close-button" onClick={handleClose}>&times;</button>
            <div className="profile-header">
              <div className="profile-avatar">
                {userInfo.name.split(' ').map(n => n[0]).join('')}
              </div>
              <h2>{userInfo.name}</h2>
              <p className="user-role">{userInfo.role}</p>
            </div>
            <div className="profile-details">
              <div className="info-row">
                <label>Email:</label>
                <span>{userInfo.email}</span>
              </div>
              <div className="info-row">
                <label>Organization:</label>
                <span>{userInfo.organization}</span>
              </div>
              <div className="info-row">
                <label>Phone:</label>
                <span>{userInfo.phone || 'Not provided'}</span>
              </div>
              <div className="info-row">
                <label>Address:</label>
                <span>{userInfo.address || 'Not provided'}</span>
              </div>
              <div className="info-row">
                <label>Country:</label>
                <span>{userInfo.country || 'Not provided'}</span>
              </div>
              <div className="info-row">
                <label>University ID:</label>
                <span>{userInfo.university_id || 'Not provided'}</span>
              </div>
            </div>
            <div className="profile-footer">
              <button className="edit-button">Edit Profile</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;