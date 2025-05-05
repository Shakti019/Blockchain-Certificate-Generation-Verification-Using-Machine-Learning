import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./login.css";

const Login_API = "http://127.0.0.1:5000/login";

function LoginCredential() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess("");
        setIsLoading(true);

        try {
            const response = await fetch(Login_API, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();
            console.log("Login response:", data);

            if (!response.ok) {
                throw new Error(data.error || "Login failed");
            }

            if (!data.access_token) {
                throw new Error("No access token received");
            }

            // Store tokens and user data
            localStorage.setItem("token", data.access_token);
            if (data.user) {
                localStorage.setItem("user", JSON.stringify(data.user));
            }

            // Set session cookie with secure flags
            const secure = window.location.protocol === 'https:' ? 'Secure;' : '';
            document.cookie = `session=${data.access_token}; path=/; ${secure} SameSite=Strict`;

            setSuccess("Login successful! Redirecting...");

            // Immediate navigation attempt
            try {
                navigate("/dashboard", { replace: true });
            } catch (navError) {
                // Fallback to timeout if immediate navigation fails
                setTimeout(() => {
                    navigate("/dashboard", { replace: true });
                }, 100);
            }

        } catch (error) {
            console.error("Login error:", error);
            setError(error.message || "Invalid credentials. Please try again.");
            // Clear any partial authentication data on error
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="form_container">
            <div className="title_container">
                <p className="title">Connect to Your BlockCert Account</p>
                <span className="subtitle">
                "Immutable Proof of Achievement - Powered by Blockchain & Machine Learning"
                </span>
            </div>
            <br />
            {error && <div className="alert error">{error}</div>}
            {success && <div className="alert success">{success}</div>}

            <form onSubmit={handleSubmit}>
                <div className="input_container">
                    <label className="input_label" htmlFor="email_field">
                        Email
                    </label>
                    <input
                        placeholder="name@mail.com"
                        type="email"
                        className="input_field"
                        id="email_field"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoFocus
                    />
                </div>

                <div className="input_container">
                    <label className="input_label" htmlFor="password_field">
                        Password
                    </label>
                    <input
                        placeholder="Password"
                        type="password"
                        className="input_field"
                        id="password_field"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="sign-in_btn"
                    disabled={isLoading}
                >
                    {isLoading ? "Signing In..." : "Sign In"}
                </button>
            </form>

            <div className="separator">
                <hr className="line" />
                <span>Or</span>
                <hr className="line" />
            </div>

            <p className="note">Terms of use &amp; Conditions</p>
            <div className="signup-link">
                <p>Don't have an account? <Link to="/register" className="create-account-link">Create Account</Link></p>
            </div>
        </div>
    );
}

export default LoginCredential;