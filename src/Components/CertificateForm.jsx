import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CertificateForm.css';

const CertificateForm = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const formRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);

  const [formData, setFormData] = useState({
    studentName: '',
    universityId: '',
    degreeProgram: '',
    major: '',
    graduationDate: '',
    cgpa: '',
    honors: '',
    certificateTitle: '',
    description: '',
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    studentImage: null,
    termsAccepted: false,
    privacyPolicyAccepted: false,
    mobileNumber: ''
  });

  const steps = [
    { id: 1, title: 'Student Information' },
    { id: 2, title: 'Academic Details' },
    { id: 3, title: 'Certificate Details' },
    { id: 4, title: 'Address Information' },
    { id: 5, title: 'Student Image' },
    { id: 6, title: 'Agreements' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setFormData(prev => ({ ...prev, studentImage: file }));
      };
      reader.readAsDataURL(file);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToStep = (step) => {
    if (completedSteps.includes(step - 1) || step === 1) {
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'studentImage') {
          formDataToSend.append(key, value);
        }
      });
      
      if (formData.studentImage) {
        formDataToSend.append('studentImage', formData.studentImage);
      }

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/certificates/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate certificate');

      setSuccess('Certificate generated successfully!');
      setCompletedSteps([...steps.map(step => step.id)]);
      
      // Show success animation
      setTimeout(() => {
        navigate(`/certificates/${data.certificateId}`);
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="certificate-form-container">
      <div className="progress-steps">
        {steps.map((step) => (
          <div 
            key={step.id}
            className={`step ${currentStep === step.id ? 'active' : ''} ${
              completedSteps.includes(step.id) ? 'completed' : ''
            }`}
            onClick={() => goToStep(step.id)}
          >
            <div className="step-number">
              {completedSteps.includes(step.id) ? (
                <div className="checkmark">✓</div>
              ) : (
                step.id
              )}
            </div>
            <div className="step-title">{step.title}</div>
            {step.id < steps.length && <div className="step-connector"></div>}
          </div>
        ))}
      </div>

      {error && (
        <div className="alert error animate__animated animate__shakeX">
          {error}
        </div>
      )}
      {success && (
        <div className="alert success animate__animated animate__fadeIn">
          <div className="success-checkmark">
            <div className="check-icon">
              <span className="icon-line line-tip"></span>
              <span className="icon-line line-long"></span>
              <div className="icon-circle"></div>
              <div className="icon-fix"></div>
            </div>
          </div>
          {success}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="animate__animated animate__fadeIn">
        {/* Step 1: Student Information */}
        {currentStep === 1 && (
          <div className="form-section">
            <h3>Student Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>University ID</label>
                <input
                  type="text"
                  name="universityId"
                  value={formData.universityId}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Degree Program</label>
                <select
                  name="degreeProgram"
                  value={formData.degreeProgram}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Degree</option>
                  <option value="Bachelors">Bachelor's</option>
                  <option value="Masters">Master's</option>
                  <option value="PhD">PhD</option>
                </select>
              </div>
              <div className="form-group">
                <label>Major/Department</label>
                <input
                  type="text"
                  name="major"
                  value={formData.major}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Mobile Number</label>
                <input
                  type="tel"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  placeholder="+1234567890"
                  pattern="[+][0-9]{10,}"
                  required
                />
              </div>
            </div>

            <div className="form-navigation">
              <button type="button" className="next-btn" onClick={nextStep}>
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Academic Details */}
        {currentStep === 2 && (
          <div className="form-section">
            <h3>Academic Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Graduation Date</label>
                <input
                  type="date"
                  name="graduationDate"
                  value={formData.graduationDate}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>CGPA</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4"
                  name="cgpa"
                  value={formData.cgpa}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Honors/Distinctions</label>
              <input
                type="text"
                name="honors"
                value={formData.honors}
                onChange={handleChange}
                placeholder="Summa Cum Laude, etc."
              />
            </div>

            <div className="form-navigation">
              <button type="button" className="prev-btn" onClick={prevStep}>
                Back
              </button>
              <button type="button" className="next-btn" onClick={nextStep}>
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Certificate Details */}
        {currentStep === 3 && (
          <div className="form-section">
            <h3>Certificate Details</h3>
            <div className="form-group">
              <label>Certificate Title</label>
              <input
                type="text"
                name="certificateTitle"
                value={formData.certificateTitle}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
              />
            </div>

            <div className="form-navigation">
              <button type="button" className="prev-btn" onClick={prevStep}>
                Back
              </button>
              <button type="button" className="next-btn" onClick={nextStep}>
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Address Information */}
        {currentStep === 4 && (
          <div className="form-section">
            <h3>Address Information</h3>
            <div className="form-group">
              <label>Street Address</label>
              <input
                type="text"
                name="streetAddress"
                value={formData.streetAddress}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>State/Province</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Postal Code</label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-navigation">
              <button type="button" className="prev-btn" onClick={prevStep}>
                Back
              </button>
              <button type="button" className="next-btn" onClick={nextStep}>
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Student Image */}
        {currentStep === 5 && (
          <div className="form-section">
            <h3>Student Image</h3>
            <div className="image-upload-container">
              <div className="image-preview">
                {previewImage ? (
                  <img src={previewImage} alt="Student Preview" />
                ) : (
                  <div className="placeholder">No image selected</div>
                )}
              </div>
              <button
                type="button"
                className="upload-btn"
                onClick={() => fileInputRef.current.click()}
              >
                {previewImage ? 'Change Image' : 'Upload Image'}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                style={{ display: 'none' }}
                required
              />
            </div>

            <div className="form-navigation">
              <button type="button" className="prev-btn" onClick={prevStep}>
                Back
              </button>
              <button type="button" className="next-btn" onClick={nextStep}>
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Agreements */}
        {currentStep === 6 && (
          <div className="form-section">
            <h3>Agreements</h3>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                  required
                />
                I accept the Terms of Service
              </label>
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="privacyPolicyAccepted"
                  checked={formData.privacyPolicyAccepted}
                  onChange={handleChange}
                  required
                />
                I accept the Privacy Policy
              </label>
            </div>

            <div className="form-navigation">
              <button type="button" className="prev-btn" onClick={prevStep}>
                Back
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={isLoading || !formData.termsAccepted || !formData.privacyPolicyAccepted}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span> Generating...
                  </>
                ) : (
                  'Generate Certificate'
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default CertificateForm;