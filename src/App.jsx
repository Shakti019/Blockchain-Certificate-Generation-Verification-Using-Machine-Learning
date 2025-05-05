import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import PrivateRoute from "./Components/PrivateRoute";
import Loginpage from "./Login";
import Dashboard from "./Dashboard";
import Register from "./AccountCreation";
import CertificateForm from "./Components/CertificateForm";
import VerificationComponent from "./Components/VerificationCertificate";
import CertificateMap from "./Components/CertificateMap";
import CertificateLogs from "./Components/CertificateLogs";
import Navbar from "./Components/Navbar";

// Animation variants
const pageVariants = {
  initial: {
    opacity: 0,
    x: 100,
  },
  in: {
    opacity: 1,
    x: 0,
  },
  out: {
    opacity: 0,
    x: -100,
  }
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.5
};

const AnimatedRoute = ({ children }) => (
  <motion.div
    initial="initial"
    animate="in"
    exit="out"
    variants={pageVariants}
    transition={pageTransition}
    style={{ 
      width: '100%',
      height: '100%',
      margin: 0,
      padding: 0
    }}
  >
    {children}
  </motion.div>
);

// Add this debug component
const RouteDebug = () => {
  const location = useLocation();
  console.log('Current route:', location.pathname);
  console.log('Auth status:', {
    token: localStorage.getItem('token'),
    user: localStorage.getItem('user')
  });
  return null;
};

function AppContent() {
  const location = useLocation();

  return (
    <div className="app-container" style={{ minHeight: '100vh' }}>
      <RouteDebug />
      
      {/* Show navbar only for authenticated routes */}
      {location.pathname !== "/login" && location.pathname !== "/register" && <Navbar />}

      <main className="main-content" style={{ flex: 1 }}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Public Routes */}
            <Route path="/login" element={
              <AnimatedRoute>
                <Loginpage />
              </AnimatedRoute>
            } />
            <Route path="/register" element={
              <AnimatedRoute>
                <Register />
              </AnimatedRoute>
            } />

            {/* Private Routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={
                <AnimatedRoute>
                  <Dashboard />
                </AnimatedRoute>
              } />
              <Route path="/create-certificate" element={
                <AnimatedRoute>
                  <CertificateForm />
                </AnimatedRoute>
              } />
              <Route path="/verify-certificate" element={
                <AnimatedRoute>
                  <VerificationComponent />
                </AnimatedRoute>
              } />
              <Route path="/map-view" element={
                <AnimatedRoute>
                  <CertificateMap />
                </AnimatedRoute>
              } />
              <Route path="/certificate-logs" element={
                <AnimatedRoute>
                  <CertificateLogs />
                </AnimatedRoute>
              } />
            </Route>

            {/* Redirect root to login if not authenticated */}
            <Route path="/" element={
              localStorage.getItem('token') ? 
                <Navigate to="/dashboard" replace /> : 
                <Navigate to="/login" replace />
            } />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;