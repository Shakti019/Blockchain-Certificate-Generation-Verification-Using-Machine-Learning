import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './Dashboard.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from "framer-motion";
import BulkUpload from './Components/BulkUpload';

// Add these animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 20 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

const Dashboard = () => {
  const [certificates, setCertificates] = useState([]);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [stats, setStats] = useState({
    total: 0,
    issued: 0,
    pending: 0,
    revoked: 0
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [verificationInProgress, setVerificationInProgress] = useState(false);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  // Disable body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isModalOpen]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch certificates with all required fields
        const certResponse = await fetch('http://localhost:5000/certificates', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // Fetch stats
        const statsResponse = await fetch('http://localhost:5000/certificates/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!certResponse.ok || !statsResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const certData = await certResponse.json();
        const statsData = await statsResponse.json();
        
        // Ensure all required fields are present with default values if missing
        const processedCertData = certData.map(cert => ({
          ...cert,
          major: cert.major || 'N/A',
          cgpa: cert.cgpa || 'N/A',
          issued_at: cert.issued_at || new Date().toISOString(),
          honors: cert.honors || '',
          university_name: cert.university_name || 'University Name',
          certificate_title: cert.certificate_title || 'Certificate of Achievement',
          degree_program: cert.degree_program || 'N/A',
          university_id: cert.university_id || 'N/A',
          issuer: cert.issuer || 'University Authority'
        }));

        setCertificates(processedCertData);
        setStats({
          total: statsData.total || 12,
          issued: statsData.issued || 12,
          pending: statsData.pending || 0,
          revoked: statsData.revoked || 0
        });

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDownloadPDF = () => {
    const input = document.getElementById('certificate-preview');
    if (!input) {
      console.error('Certificate preview element not found');
      return;
    }

    html2canvas(input, { 
      scale: 2,
      backgroundColor: '#ffffff', // Add white background
      logging: false,
      useCORS: true,
      allowTaint: true // Allow loading of cross-origin images
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('landscape');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${selectedCertificate.student_name}_certificate.pdf`);
    }).catch(err => {
      console.error('Error generating PDF:', err);
    });
  };

  const handleVerify = async (certificateId) => {
    try {
      setVerificationInProgress(true);
      navigate(`/verify/${certificateId}`); // Navigate to verify component
    } catch (err) {
      setError(err.message);
    } finally {
      setVerificationInProgress(false);
    }
  };

  const handlePreview = (cert) => {
    setSelectedCertificate(cert);
  };

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = cert.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cert.certificate_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || cert.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const renderStats = () => (
    <motion.div 
      className="dashboard-stats"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="stat-card total" variants={cardVariants}>
        <h3>Total Certificates</h3>
        <motion.p
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {stats.total}
        </motion.p>
        <div className="stat-icon">📊</div>
      </motion.div>
      <motion.div className="stat-card issued" variants={cardVariants}>
        <h3>Issued</h3>
        <motion.p
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {stats.issued}
        </motion.p>
        <div className="stat-icon">✅</div>
      </motion.div>
      <motion.div className="stat-card pending" variants={cardVariants}>
        <h3>Pending</h3>
        <motion.p
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {stats.pending}
        </motion.p>
        <div className="stat-icon">⏳</div>
      </motion.div>
      <motion.div className="stat-card revoked" variants={cardVariants}>
        <h3>Revoked</h3>
        <motion.p
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {stats.revoked}
        </motion.p>
        <div className="stat-icon">❌</div>
      </motion.div>
    </motion.div>
  );

  // Modified certificate card component
  const CertificateCard = ({ cert }) => (
    <motion.div
      className="certificate-card"
      variants={cardVariants}
      whileHover={{ 
        y: -5,
        transition: { type: "spring", stiffness: 300 }
      }}
    >
      <div className="card-header">
        <div className="card-header-content">
          <div className="university-info">
            <span className="university-name">{cert.university_name || 'University Name'}</span>
          </div>
          <h3 title={cert.student_name}>{cert.student_name}</h3>
        </div>
        <span className={`status-badge ${cert.status}`}>
          {cert.status}
        </span>
      </div>
      <div className="card-body">
        <div className="info-grid">
          <div className="info-item">
            <label>University ID</label>
            <span>{cert.university_id || 'N/A'}</span>
          </div>
          <div className="info-item">
            <label>Certificate ID</label>
            <span>{cert.certificate_id}</span>
          </div>
          <div className="info-item">
            <label>Program</label>
            <span>{cert.degree_program}</span>
          </div>
          <div className="info-item">
            <label>Issue Date</label>
            <span>{formatDate(cert.issued_at)}</span>
          </div>
        </div>
      </div>
      <div className="card-footer">
        <motion.button
          className="preview-btn"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handlePreview(cert)}
        >
          <span>👁️</span> Preview
        </motion.button>
        {cert.status === 'issued' && (
          <motion.button
            className="verify-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleVerify(cert.id)}
            disabled={verificationInProgress}
          >
            <span>✓</span> Verify
          </motion.button>
        )}
      </div>
    </motion.div>
  );

  // Modified certificate preview component
  const CertificatePreview = ({ certificate, onClose }) => {
    if (!certificate) return null;

    return (
      <motion.div
        className="certificate-preview-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="preview-header">
          <motion.button
            className="close-preview-btn"
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            ✕
          </motion.button>
        </div>
        
        <div className="preview-content side-by-side">
          <div className="certificate-side">
            <div className="certificate-container">
              <div id="certificate-preview" className="elegant-certificate">
                <div className="certificate-inner">
                  <div className="certificate-header">
                    <div className="university-branding">
                      <div className="logo-container">
                        <img 
                          src="/university-logo.png" 
                          alt="University Logo"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                      <h1>{certificate.university_name}</h1>
                    </div>
                    
                    <div className="certificate-title">
                      <h2>{certificate.certificate_title || 'CERTIFICATE OF ACHIEVEMENT'}</h2>
                      <div className="ornament">❦</div>
                    </div>
                  </div>

                  <div className="certificate-content">
                    <div className="student-details">
                      <div className="student-photo">
                        {certificate.image_path && (
                          <img
                            src={`http://localhost:5000/uploads/${certificate.image_path}`}
                            alt={certificate.student_name}
                            onError={(e) => e.target.src = '/default-student.jpg'}
                          />
                        )}
                      </div>
                      
                      <div className="main-text">
                        <p>This is to certify that</p>
                        <h3 className="student-name">{certificate.student_name}</h3>
                        <p className="student-id">University ID: {certificate.university_id}</p>
                        <p>has successfully completed the requirements for</p>
                        <div className="degree-info">
                          <h4>{certificate.degree_program}</h4>
                          {certificate.major && certificate.major !== 'N/A' && (
                            <h4>Major in {certificate.major}</h4>
                          )}
                        </div>
                        {certificate.cgpa && certificate.cgpa !== 'N/A' && (
                          <p className="gpa-info">with a Cumulative GPA of {certificate.cgpa}</p>
                        )}
                        {certificate.honors && (
                          <p className="honors-text">with {certificate.honors} honors</p>
                        )}
                        <p className="issue-date">Issued on: {formatDate(certificate.issued_at)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="certificate-footer">
                    <div className="signature-area">
                      <div className="signature">
                        <img src="/signature.png" alt="Signature" />
                        <div className="signature-line"></div>
                        <p>{certificate.issuer}</p>
                        <small>Authorized Signatory</small>
                      </div>
                      
                      <div className="seal">
                        <img src="/seal.png" alt="University Seal" />
                      </div>
                    </div>
                    
                    <div className="verification-info">
                      <div className="qr-code">
                        {/* Add QR code for certificate verification */}
                      </div>
                      <p className="verify-text">Verify this certificate at: verify.university.edu</p>
                      <p className="blockchain-hash">
                        Blockchain Hash: {certificate.blockchain_hash?.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="details-side">
            <div className="certificate-details">
              <div className="details-section">
                <h3>Student Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Full Name</label>
                    <p>{certificate.student_name}</p>
                  </div>
                  <div className="info-item">
                    <label>University ID</label>
                    <p>{certificate.university_id}</p>
                  </div>
                  <div className="info-item">
                    <label>Program</label>
                    <p>{certificate.degree_program}</p>
                  </div>
                  <div className="info-item">
                    <label>Major</label>
                    <p>{certificate.major || 'N/A'}</p>
                  </div>
                  <div className="info-item">
                    <label>CGPA</label>
                    <p>{certificate.cgpa}</p>
                  </div>
                  <div className="info-item">
                    <label>Honors</label>
                    <p>{certificate.honors || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="details-section">
                <h3>Certificate Status</h3>
                <div className="status-info">
                  <div className={`status-indicator ${certificate.status}`}>
                    {certificate.status.toUpperCase()}
                  </div>
                  <p>Issue Date: {formatDate(certificate.issued_at)}</p>
                  <p>Last Verified: {formatDate(certificate.last_verified) || 'Never'}</p>
                  <p>Verification Count: {certificate.verification_count || 0}</p>
                </div>
              </div>

              <div className="action-buttons">
                <motion.button
                  className="action-btn download"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDownloadPDF}
                >
                  <span>📥</span> Download PDF
                </motion.button>
                {certificate.status === 'issued' && (
                  <motion.button
                    className="action-btn verify"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleVerify(certificate.id)}
                    disabled={verificationInProgress}
                  >
                    <span>✓</span> Verify Certificate
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <motion.div
          className="spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.p
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ repeat: Infinity, repeatType: "reverse", duration: 1 }}
        >
          Loading certificates...
        </motion.p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <motion.div 
          className="error-alert"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <span>⚠️</span>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Certificate Management Dashboard
        </motion.h1>
        <div className="header-buttons">
          <motion.button 
            className="create-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/create-certificate')}
          >
            <span className="button-icon">📜</span>
            <span>Create New Certificate</span>
          </motion.button>
          <motion.button 
            className="bulk-upload-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowBulkUpload(!showBulkUpload)}
          >
            <span className="button-icon">📥</span>
            <span>Bulk Upload</span>
          </motion.button>
        </div>
      </div>

      {showBulkUpload ? (
        <BulkUpload />
      ) : (
        <>
          {renderStats()}

          <div className="dashboard-controls">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search certificates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="search-icon">🔍</span>
            </div>
            <div className="filter-dropdown">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="issued">Issued</option>
                <option value="pending">Pending</option>
                <option value="revoked">Revoked</option>
              </select>
            </div>
          </div>

          {filteredCertificates.length === 0 ? (
            <motion.div 
              className="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <img src="/empty-certificates.svg" alt="No certificates" />
              <h3>No certificates found</h3>
              <p>Create your first certificate or adjust your search filters</p>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/create-certificate')}
              >
                Create Certificate
              </motion.button>
            </motion.div>
          ) : (
            <AnimatePresence>
              <motion.div 
                className="certificate-grid"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {filteredCertificates.map((cert) => (
                  <CertificateCard key={cert.id} cert={cert} />
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {selectedCertificate && (
            <CertificatePreview 
              certificate={selectedCertificate}
              onClose={() => setSelectedCertificate(null)}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;