import { useState } from 'react';
import './VerificationCertificate.css';

const VerificationComponent = () => {
  const [searchMethod, setSearchMethod] = useState('certificateId');
  const [formData, setFormData] = useState({
    certificateId: '',
    universityId: '',
    studentName: ''
  });
  const [addressData, setAddressData] = useState({
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
    country: ''
  });
  const [addressValidation, setAddressValidation] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateAddress = async (address) => {
    try {
      const response = await fetch('http://localhost:5000/certificates/validate-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(address)
      });

      const data = await response.json();
      setAddressValidation(data);
      return data;
    } catch (err) {
      console.error('Address validation error:', err);
      return { valid: false, error: err.message };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setVerificationResult(null);

    try {
      let addressValidationResult = null;
      if (searchMethod === 'address') {
        addressValidationResult = await validateAddress(addressData);
        if (addressValidationResult.error) {
          setError(addressValidationResult.error);
          setIsLoading(false);
          return;
        }
        
        setVerificationResult({
          addressValidation: addressValidationResult
        });
      } else {
        let response;
        if (searchMethod === 'certificateId') {
          response = await fetch(`http://localhost:5000/certificates/verify?certificateId=${formData.certificateId}`);
        } else if (searchMethod === 'details') {
          response = await fetch('http://localhost:5000/certificates/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              universityId: formData.universityId,
              studentName: formData.studentName
            })
          });
        }

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Verification failed');
        }

        setVerificationResult({
          ...data,
          addressValidation: addressValidationResult
        });
      }

      const response = await validateAddress(addressData);
      if (response.source === 'platform_generated') {
        // Address is from our platform's certificates
        // Show as valid with high confidence
      } else {
        // External address
        // Show validation result with confidence score
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskLevel = (score) => {
    if (score < 0.3) return 'Low Risk';
    if (score < 0.7) return 'Medium Risk';
    return 'High Risk';
  };

  const getRiskColor = (score) => {
    if (score < 0.3) return '#4CAF50'; // Green
    if (score < 0.7) return '#FFC107'; // Yellow
    return '#F44336'; // Red
  };

  const renderProgressCircle = (value, max = 4.0) => {
    const percentage = (value / max) * 100;
    return (
      <div className="progress-circle">
        <svg width="80" height="80" viewBox="0 0 36 36" className="circular-chart">
          <path className="circle-bg"
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path className="circle-fill"
            strokeDasharray={`${percentage}, 100`}
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <text x="18" y="20.5" className="percentage">{value.toFixed(2)}</text>
          {max !== 100 && <text x="18" y="25.5" className="max-value">/ {max}</text>}
        </svg>
      </div>
    );
  };

  const renderVerificationBadge = (verified) => {
    return (
      <span className={`verification-badge ${verified ? 'verified' : 'not-verified'}`}>
        {verified ? '✓ Verified' : '✗ Not Verified'}
      </span>
    );
  };

  return (
    <div className="verification-container">
      <h2>Verify Certificate</h2>

      <div className="verification-methods">
        <button
          className={`method-btn ${searchMethod === 'certificateId' ? 'active' : ''}`}
          onClick={() => setSearchMethod('certificateId')}
        >
          By Certificate ID
        </button>
        <button
          className={`method-btn ${searchMethod === 'details' ? 'active' : ''}`}
          onClick={() => setSearchMethod('details')}
        >
          By Student Details
        </button>
        <button
          className={`method-btn ${searchMethod === 'address' ? 'active' : ''}`}
          onClick={() => setSearchMethod('address')}
        >
          By Address
        </button>
      </div>

      <form onSubmit={handleSubmit} className="verification-form">
        {searchMethod === 'certificateId' && (
          <div className="form-group">
            <label>Certificate ID</label>
            <input
              type="text"
              name="certificateId"
              value={formData.certificateId}
              onChange={handleChange}
              placeholder="Enter certificate ID"
              required
            />
          </div>
        )}

        {searchMethod === 'details' && (
          <>
            <div className="form-group">
              <label>University ID</label>
              <input
                type="text"
                name="universityId"
                value={formData.universityId}
                onChange={handleChange}
                placeholder="Enter university ID"
                required
              />
            </div>
            <div className="form-group">
              <label>Student Name</label>
              <input
                type="text"
                name="studentName"
                value={formData.studentName}
                onChange={handleChange}
                placeholder="Enter student name"
                required
              />
            </div>
          </>
        )}

        {searchMethod === 'address' && (
          <div className="address-section">
            <h3>Address Verification</h3>
            <div className="form-group">
              <label>Street Address</label>
              <input
                type="text"
                name="streetAddress"
                value={addressData.streetAddress}
                onChange={(e) => setAddressData(prev => ({...prev, streetAddress: e.target.value}))}
                placeholder="Enter street address"
                required
              />
            </div>
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                name="city"
                value={addressData.city}
                onChange={(e) => setAddressData(prev => ({...prev, city: e.target.value}))}
                placeholder="Enter city"
                required
              />
            </div>
            <div className="form-group">
              <label>State</label>
              <input
                type="text"
                name="state"
                value={addressData.state}
                onChange={(e) => setAddressData(prev => ({...prev, state: e.target.value}))}
                placeholder="Enter state"
                required
              />
            </div>
            <div className="form-group">
              <label>Postal Code</label>
              <input
                type="text"
                name="postalCode"
                value={addressData.postalCode}
                onChange={(e) => setAddressData(prev => ({...prev, postalCode: e.target.value}))}
                placeholder="Enter postal code"
                required
              />
            </div>
            <div className="form-group">
              <label>Country</label>
              <input
                type="text"
                name="country"
                value={addressData.country}
                onChange={(e) => setAddressData(prev => ({...prev, country: e.target.value}))}
                placeholder="Enter country"
                required
              />
            </div>
          </div>
        )}

        <button type="submit" className="verify-btn" disabled={isLoading}>
          {isLoading ? 'Verifying...' : 'Verify'}
        </button>
      </form>

      {error && (
        <div className="verification-result error">
          <h3>Verification Failed</h3>
          <p>{error}</p>
        </div>
      )}

      {verificationResult && (
        <div className={`verification-result ${
          verificationResult.valid || (searchMethod === 'address' && verificationResult.addressValidation?.valid) 
            ? 'valid' 
            : 'invalid'
        }`}>
          {verificationResult.valid && (
            <>
              <div className="certificate-header">
                <div className="header-left">
                  <h2>{verificationResult.certificate.certificateTitle}</h2>
                  <p>Issued to: {verificationResult.certificate.studentName}</p>
                </div>
                <div className="header-right">
                  {renderVerificationBadge(verificationResult.valid)}
                  <p>ID: {verificationResult.certificate.id}</p>
                </div>
              </div>

              <div className="certificate-details-grid">
                <div className="detail-card">
                  <h4>University Information</h4>
                  <div className="detail-item">
                    <span className="detail-label">University:</span>
                    <span className="detail-value">{verificationResult.certificate.universityName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">University ID:</span>
                    <span className="detail-value">{verificationResult.certificate.universityId}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Issuer:</span>
                    <span className="detail-value">{verificationResult.certificate.issuer}</span>
                  </div>
                </div>

                <div className="detail-card">
                  <h4>Academic Information</h4>
                  <div className="detail-item">
                    <span className="detail-label">Degree Program:</span>
                    <span className="detail-value">{verificationResult.certificate.degreeProgram}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Major:</span>
                    <span className="detail-value">{verificationResult.certificate.major}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Graduation Date:</span>
                    <span className="detail-value">
                      {new Date(verificationResult.certificate.graduationDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="detail-card performance-card">
                  <h4>Academic Performance</h4>
                  <div className="performance-metrics">
                    {renderProgressCircle(verificationResult.certificate.cgpa)}
                    <div className="performance-details">
                      <div className="detail-item">
                        <span className="detail-label">CGPA:</span>
                        <span className="detail-value">{verificationResult.certificate.cgpa.toFixed(2)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Honors:</span>
                        <span className="detail-value">
                          {verificationResult.certificate.honors || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="detail-card">
                  <h4>Certificate Details</h4>
                  <div className="detail-item">
                    <span className="detail-label">Issued On:</span>
                    <span className="detail-value">
                      {new Date(verificationResult.certificate.issuedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status:</span>
                    <span className={`detail-value status-${verificationResult.certificate.status.toLowerCase()}`}>
                      {verificationResult.certificate.status}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Times Verified:</span>
                    <span className="detail-value">
                      {verificationResult.certificate.verificationCount}
                    </span>
                  </div>
                  {verificationResult.certificate.lastVerified && (
                    <div className="detail-item">
                      <span className="detail-label">Last Verified:</span>
                      <span className="detail-value">
                        {new Date(verificationResult.certificate.lastVerified).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="ai-verification-section">
                <h4>AI Verification Analysis</h4>
                <div className="risk-meter-container">
                  <div className="risk-meter">
                    <div className="risk-level" style={{
                      backgroundColor: getRiskColor(verificationResult.aiVerification.suspicionScore),
                      width: `${verificationResult.aiVerification.suspicionScore * 100}%`
                    }}>
                      {getRiskLevel(verificationResult.aiVerification.suspicionScore)}
                    </div>
                  </div>
                  <div className="risk-score">
                    Suspicion Score: {(verificationResult.aiVerification.suspicionScore * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="confidence-indicator">
                  {renderProgressCircle(verificationResult.aiVerification.confidence * 100, 100)}
                  <div className="confidence-details">
                    <h5>Confidence Level</h5>
                    <p>{(verificationResult.aiVerification.confidence * 100).toFixed(1)}% confidence in authenticity</p>
                  </div>
                </div>

                {verificationResult.aiVerification.isSuspicious && (
                  <div className="suspicious-warning">
                    ⚠️ This certificate shows patterns consistent with potential fraud
                  </div>
                )}

                <div className="risk-factors">
                  {/* <h5>Top Risk Factors:</h5>
                  <ul>
                    {verificationResult.aiVerification.riskFactors.map((factor, index) => (
                      <li key={index}>
                        <strong>{factor.feature}:</strong> {factor.value}
                        <span className="importance">(importance: {(factor.importance * 100).toFixed(1)}%)</span>
                      </li>
                    ))}
                  </ul> */}
                </div>
              </div>
            </>
          )}

          {verificationResult && verificationResult.addressValidation && (
            <div className="address-validation-result">
              <h4>Address Validation Results</h4>
              <div className="validation-details">
                <div className="confidence-meter">
                  <div className="confidence-bar" style={{
                    width: `${verificationResult.addressValidation.confidence * 100}%`,
                    backgroundColor: verificationResult.addressValidation.valid ? '#4CAF50' : '#F44336'
                  }}></div>
                </div>
                <p>
                  <strong>Status:</strong> {verificationResult.addressValidation.valid ? 'Valid Address' : 'Invalid Address'}
                </p>
                <p>
                  <strong>Confidence:</strong> {(verificationResult.addressValidation.confidence * 100).toFixed(1)}%
                </p>
                {verificationResult.addressValidation.coordinates && (
                  <div className="coordinates">
                    <p><strong>Latitude:</strong> {verificationResult.addressValidation.coordinates.latitude}</p>
                    <p><strong>Longitude:</strong> {verificationResult.addressValidation.coordinates.longitude}</p>
                  </div>
                )}
                {verificationResult.addressValidation.error && (
                  <div className="validation-error">
                    <p><strong>Error:</strong> {verificationResult.addressValidation.error}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VerificationComponent;