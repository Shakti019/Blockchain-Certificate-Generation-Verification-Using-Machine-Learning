import React, { useState, useEffect } from 'react';
import './CertificateLogs.css';

const CertificateLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showXORData, setShowXORData] = useState(false);
  const [selectedXORData, setSelectedXORData] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/certificates/logs', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch logs');
        
        const data = await response.json();
        setLogs(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.certificate_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.university_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const formatEncryptedData = (encryptedData) => {
    if (!encryptedData) return 'Not available';
    try {
      const data = JSON.parse(encryptedData);
      if (data.xor_results) {
        const xorResults = data.xor_results;
        const length = xorResults.length;
        const visibleLength = Math.ceil(length * 0.5); // Show 50% of the data
        return `${xorResults.substring(0, visibleLength)}...`;
      }
      return 'No XOR results';
    } catch (e) {
      return 'Invalid format';
    }
  };

  const handleShowXORData = (encryptedData) => {
    try {
      const data = JSON.parse(encryptedData);
      if (data.xor_results) {
        setSelectedXORData(data.xor_results);
        setShowXORData(true);
      }
    } catch (e) {
      console.error('Invalid XOR data format');
    }
  };

  const handleCloseXORModal = () => {
    setShowXORData(false);
    setSelectedXORData(null);
  };

  const handleLogClick = (log) => {
    setSelectedLog(log);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setTimeout(() => {
      setSelectedLog(null);
    }, 300); // Wait for animation to complete
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading certificate logs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">
          <span>⚠️</span>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="logs-container">
      <div className="logs-header">
        <h2>Certificate Logs</h2>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search certificates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="api-documentation">
        <h3>Public Verification API</h3>
        <p>Use the following endpoints to verify certificates:</p>
        <div className="api-endpoints">
          <div className="api-endpoint">
            <h4>GET /api/verify</h4>
            <p>Query Parameters:</p>
            <ul>
              <li><code>certificateId</code> - Certificate ID</li>
              <li><code>universityId</code> - University ID</li>
              <li><code>studentName</code> - Student Name</li>
            </ul>
            <p>Example: <code>http://localhost:5000/api/verify?certificateId=YOUR_CERT_ID</code></p>
          </div>
          <div className="api-endpoint">
            <h4>POST /api/verify</h4>
            <p>Request Body (JSON):</p>
            <pre>
              {`{
  "universityId": "UNIVERSITY_ID",
  "studentName": "STUDENT_NAME"
}`}
            </pre>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Certificate ID</th>
              <th>Student Name</th>
              <th>University</th>
              <th>Program</th>
              <th>Major</th>
              <th>Graduation Date</th>
              <th>CGPA</th>
              <th>Status</th>
              <th>Issued At</th>
              <th>Verifications</th>
              <th>Encrypted Data</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.certificate_id} onClick={() => handleLogClick(log)}>
                <td>{log.certificate_id}</td>
                <td>{log.student_name}</td>
                <td>{log.university_name}</td>
                <td>{log.degree_program}</td>
                <td>{log.major}</td>
                <td>{formatDate(log.graduation_date)}</td>
                <td>{log.cgpa}</td>
                <td>
                  <span className={`status-badge ${log.status}`}>
                    {log.status}
                  </span>
                </td>
                <td>{formatDate(log.issued_at)}</td>
                <td>{log.verification_count}</td>
                <td className="encrypted-data">
                  {formatEncryptedData(log.encrypted_data)}
                </td>
                <td>
                  <button 
                    className="show-xor-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShowXORData(log.encrypted_data);
                    }}
                  >
                    Show XOR
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedLog && (
        <div className={`log-modal ${showModal ? 'show' : ''}`}>
          <div className="modal-content">
            <button className="close-modal" onClick={handleCloseModal}>×</button>
            <h3>Certificate Details</h3>
            <div className="modal-layout">
              <div className="modal-left-section">
                <div className="modal-section">
                  <h4>Basic Information</h4>
                  <p><strong>Certificate ID:</strong> {selectedLog.certificate_id}</p>
                  <p><strong>Student Name:</strong> {selectedLog.student_name}</p>
                  <p><strong>University:</strong> {selectedLog.university_name}</p>
                  <p><strong>Program:</strong> {selectedLog.degree_program}</p>
                  <p><strong>Major:</strong> {selectedLog.major}</p>
                  <p><strong>Graduation Date:</strong> {formatDate(selectedLog.graduation_date)}</p>
                  <p><strong>CGPA:</strong> {selectedLog.cgpa}</p>
                  <p><strong>Status:</strong> <span className={`status-badge ${selectedLog.status}`}>{selectedLog.status}</span></p>
                </div>

                <div className="modal-section">
                  <h4>Contact Information</h4>
                  <p><strong>Mobile Number:</strong> {selectedLog.mobile_number}</p>
                  <p><strong>Address:</strong> {selectedLog.street_address}, {selectedLog.city}, {selectedLog.state}, {selectedLog.postal_code}, {selectedLog.country}</p>
                </div>
              </div>

              <div className="modal-right-section">
                <div className="modal-section">
                  <h4>Location</h4>
                  {selectedLog.latitude && selectedLog.longitude ? (
                    <div className="map-container">
                      <iframe
                        title="Location Map"
                        width="100%"
                        height="300"
                        frameBorder="0"
                        scrolling="no"
                        marginHeight="0"
                        marginWidth="0"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedLog.longitude-0.01},${selectedLog.latitude-0.01},${selectedLog.longitude+0.01},${selectedLog.latitude+0.01}&layer=mapnik&marker=${selectedLog.latitude},${selectedLog.longitude}`}
                      />
                      <br/>
                      <small>
                        <a href={`https://www.openstreetmap.org/?mlat=${selectedLog.latitude}&mlon=${selectedLog.longitude}#map=15/${selectedLog.latitude}/${selectedLog.longitude}`} target="_blank" rel="noopener noreferrer">
                          View Larger Map
                        </a>
                      </small>
                    </div>
                  ) : (
                    <p>Location not available</p>
                  )}
                </div>

                <div className="modal-section">
                  <h4>Verification History</h4>
                  <p><strong>Total Verifications:</strong> {selectedLog.verification_count}</p>
                  <p><strong>Last Verified:</strong> {formatDate(selectedLog.last_verified)}</p>
                  <p><strong>Blockchain Hash:</strong> {selectedLog.blockchain_hash || 'Not available'}</p>
                  <p><strong>IPFS Hash:</strong> {selectedLog.ipfs_hash || 'Not available'}</p>
                </div>

                <div className="modal-section">
                  <h4>Security Data</h4>
                  <p><strong>Encrypted Data:</strong> {formatEncryptedData(selectedLog.encrypted_data)}</p>
                  <p><strong>Agreement Date:</strong> {formatDate(selectedLog.agreement_date)}</p>
                  <p><strong>Terms Accepted:</strong> {selectedLog.terms_accepted ? 'Yes' : 'No'}</p>
                  <p><strong>Privacy Policy Accepted:</strong> {selectedLog.privacy_policy_accepted ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showXORData && selectedXORData && (
        <div className="xor-modal">
          <div className="xor-modal-content">
            <button className="close-xor-modal" onClick={handleCloseXORModal}>×</button>
            <h3>XOR Encrypted Data</h3>
            <div className="xor-data-container">
              <pre>{selectedXORData}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateLogs; 