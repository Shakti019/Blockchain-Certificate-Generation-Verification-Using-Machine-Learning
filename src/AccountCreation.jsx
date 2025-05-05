import React, { useState, useEffect } from "react";
import CreateAccount from './Components/CreateAccount';
import './AccountCreation.css';

const Register = () => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentLine, setCurrentLine] = useState(0);

  const welcomeMessages = [
    "The Future of Credentials",
     "- Tamper-Proof Certificates with Smart Validation",
     "- Blockchain-Based Verification",
     "- AI-Powered Security",
     "- Decentralized Storage",
     "- Transparent and Immutable"
  ];

  useEffect(() => {
    const typingInterval = setInterval(() => {
      if (currentIndex < welcomeMessages[currentLine].length) {
        setDisplayText(prev => prev + welcomeMessages[currentLine].charAt(currentIndex));
        setCurrentIndex(prev => prev + 1);
      } else {
        clearInterval(typingInterval);
        setTimeout(() => {
          setDisplayText("");
          setCurrentIndex(0);
          setCurrentLine((prev) => (prev + 1) % welcomeMessages.length);
        }, 2000);
      }
    }, 100);

    return () => clearInterval(typingInterval);
  }, [currentIndex, currentLine, welcomeMessages]);

  return (
    <div className="register-page">
      <div className="animation-section">
        <div className="typing-container">
          <h1 className="typing-text">{displayText}</h1>
          <span className="typing-cursor">|</span>
        </div>

        <div className="benefits-animation">
          <div className="benefit-item">
            <div className="benefit-icon">🚀</div>
            <div className="benefit-text">Fast Transactions</div>
            <div className="underline"></div>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">🌐</div>
            <div className="benefit-text">Global Network</div>
            <div className="underline"></div>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">🔒</div>
            <div className="benefit-text">Secure Platform</div>
            <div className="underline"></div>
          </div>
        </div>
      </div>
      <div className="form-section">
        <CreateAccount />
      </div>
    </div>
  );
};

export default Register;