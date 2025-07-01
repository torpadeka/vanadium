import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import { AuthProvider, useUser } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import Z9Page from "./pages/Z9Page";
import RegisterPage from "./pages/RegisterPage";

const App: React.FC = () => {
  const { isAuthenticated, username } = useUser();
  console.log("isAuthenticated:", isAuthenticated);
  console.log("username:", username);

  return (
    <Router>
      <div className="min-h-screen bg-black text-white font-inter">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/z9"
            element={
              isAuthenticated && username ? <Z9Page /> : <Navigate to="/" />
            }
          />
          <Route
            path="/register"
            element={
              !isAuthenticated && username == null ? (
                <RegisterPage />
              ) : (
                <Navigate to={username ? "/z9" : "/"} />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

export default () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);
