import React, { useState, useEffect } from "react";
import LoginCredential from "./Components/login";
import "./Login.css";
import { useNavigate } from "react-router-dom";

const Loginpage = () => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentLine, setCurrentLine] = useState(0);
  const navigate = useNavigate();

  const textLines = [
    "Trust",
     "Verified",
      " Blockchain",
      " &", 
      "AI Securing",
      " Academic Credentials with BlockCert..."
  ];

  useEffect(() => {
    const typingInterval = setInterval(() => {
      if (currentIndex < textLines[currentLine].length) {
        setDisplayText(prev => prev + textLines[currentLine].charAt(currentIndex));
        setCurrentIndex(prev => prev + 1);
      } else {
        clearInterval(typingInterval);
        setTimeout(() => {
          setDisplayText("");
          setCurrentIndex(0);
          setCurrentLine((prev) => (prev + 1) %
           textLines.length);
        }, 2000);
      }
    }, 100);

    return () => clearInterval(typingInterval);
  }, [currentIndex, currentLine, textLines]);

  return (

      <div className="Wrapper">
        <div className="Animation-container">
          <div className="typing-animation">
            <h1>{displayText}</h1>
            <span className="cursor">|</span>
          </div>

          {/* Animated trading icons */}
          <div className="trading-icons">
            <div className="icon-box">
              <div className="icon truck">🚛</div>
              <div className="icon-line"></div>
            </div>
            <div className="icon-box">
              <div className="icon wheat">🌾</div>
              <div className="icon-line"></div>
            </div>
            <div className="icon-box">
              <div className="icon oil">🛢️</div>
              <div className="icon-line"></div>
            </div>
            <div className="icon-box">
              <div className="icon metal">⛓️</div>
              <div className="icon-line"></div>
            </div>
          </div>
        </div>
        <div className="ContainerX">
          <LoginCredential/>
        </div>

      </div>
  );
};

export default Loginpage;