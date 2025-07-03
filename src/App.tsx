import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import { AuthProvider, useUser } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import Z9Page from "./pages/Z9Page";
import RegisterPage from "./pages/RegisterPage";
import TestAPIPage from "./pages/TestAPIPage";

const App: React.FC = () => {
  const { isAuthenticated, user, actor, principal, login, logout } = useUser();
  console.log("isAuthenticated:", isAuthenticated);
  console.log("user?.username:", user?.username);
  console.log(principal);

  // if (user?.username == null && isAuthenticated) {
  //   window.location.href = "/register";
  // }

  return (
    <Router>
      <div className="min-h-screen bg-black text-white font-inter">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/z9"
            element={
              isAuthenticated && user?.username ? (
                <Z9Page />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/register"
            element={
              // isAuthenticated && user?.username == null ? (
              <RegisterPage />
              // ) : (
              //   <Navigate to={user?.username ? "/z9" : "/"} />
              // )
            }
          />
          <Route path="/test" element={<TestAPIPage />} />
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
