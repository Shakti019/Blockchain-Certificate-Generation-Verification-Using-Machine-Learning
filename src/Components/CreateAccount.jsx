import { useState } from "react";
import './CreateAccount.css';
import { useNavigate } from "react-router-dom";

const Register_API = "http://127.0.0.1:5000/register";

function CreateAccount() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        contactNumber: "",
        universityName: "",
        universityId: "",
        location: "",
        country: "",
        state: "",
        region: "",
        category: "",
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);

    // Define the handleChange function
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");
        setSuccess("");

        try {
            // Password confirmation check
            if (formData.password !== formData.confirmPassword) {
                throw new Error("Passwords don't match");
            }

            const response = await fetch(Register_API, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData),
                mode: "cors",
            });

            const data = await response.json();
            console.log("Server Response:", data);

            if (!response.ok) {
                throw new Error(data.error || "Registration failed");
            }

            setSuccess("Registration successful!");
            if (data.access_token) {
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Navigate to dashboard after 1 second
            setTimeout(() => {
                    navigate('/dashboard');
                }, 1000);
            }

            // Reset form after successful submission
            setFormData({
                name: "",
                email: "",
                password: "",
                confirmPassword: "",
                contactNumber: "",
                universityName: "",
                universityId: "",
                location: "",
                country: "",
                state: "",
                region: "",
                category: "",
            });

            // Navigate to login page after 2 seconds (to show success message)


        } catch (error) {
            console.error("Error:", error);
            setError(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const nextStep = () => {
        // Basic validation before proceeding
        if (currentStep === 1 && (!formData.name || !formData.email || !formData.password || !formData.confirmPassword)) {
            setError("Please fill all personal details");
            return;
        }
        if (currentStep === 2 && (!formData.contactNumber || !formData.universityName || !formData.universityId)) {
            setError("Please fill all university details");
            return;
        }
        setError("");
        setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
        setError("");
        setCurrentStep(currentStep - 1);
    };

    // Animation class based on step direction
    const getAnimationClass = () => {
        return currentStep === 1 ? "slide-in" : currentStep === 2 ? "slide-in-right" : "slide-in-top";
    };

    return (
        <div className="registration-container">
            <div className="registration-card">
                <h2 className="registration-title">Create Account</h2>

                <div className="progress-bar">
                    <div className={`progress-step ${currentStep >= 1 ? 'active' : ''}`}>1</div>
                    <div className={`progress-line ${currentStep >= 2 ? 'active' : ''}`}></div>
                    <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>2</div>
                    <div className={`progress-line ${currentStep >= 3 ? 'active' : ''}`}></div>
                    <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>3</div>
                </div>

                {error && <div className="alert error">{error}</div>}
                {success && <div className="alert success">{success}</div>}

                <form onSubmit={handleSubmit} className={`registration-form ${getAnimationClass()}`}>
                    {currentStep === 1 && (
                        <div className="form-step">
                            <h3>Personal Information</h3>
                            <div className="form-group">
                                <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn next" onClick={nextStep}>Next</button>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="form-step">
                            <h3>University Details</h3>
                            <div className="form-group">
                                <input type="tel" name="contactNumber" placeholder="Contact Number" value={formData.contactNumber} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <input type="text" name="universityName" placeholder="University Name" value={formData.universityName} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <input type="text" name="universityId" placeholder="University ID" value={formData.universityId} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <input type="text" name="location" placeholder="University Address" value={formData.location} onChange={handleChange} required />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn prev" onClick={prevStep}>Previous</button>
                                <button type="button" className="btn next" onClick={nextStep}>Next</button>
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="form-step">
                            <h3>Location Information</h3>
                            <div className="form-group">
                                <input type="text" name="country" placeholder="Country" value={formData.country} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <input type="text" name="state" placeholder="State" value={formData.state} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <select name="region" value={formData.region} onChange={handleChange} required>
                                    <option value="">Select Region</option>
                                    <option value="North">North</option>
                                    <option value="South">South</option>
                                    <option value="East">East</option>
                                    <option value="West">West</option>
                                    <option value="Central">Central</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <select name="category" value={formData.category} onChange={handleChange} required>
                                    <option value="">Select Institution Type</option>
                                    <option value="Private">Private</option>
                                    <option value="Government">Government</option>
                                    <option value="Public">Public</option>
                                    <option value="Autonomous">Autonomous</option>
                                </select>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn prev" onClick={prevStep}>Previous</button>
                                <button type="submit" className="btn submit" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <span className="spinner"></span> Submitting...
                                        </>
                                    ) : "Create Account"}
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

export default CreateAccount;