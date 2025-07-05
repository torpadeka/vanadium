import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import LandingPage from "./pages/LandingPage";
import Z9Page from "./pages/Z9Page";
import RegisterPage from "./pages/RegisterPage";
import TestAPIPage from "./pages/TestAPIPage";
import WhoamiPage from "./pages/LoginPage";
import { UserProvider, useUserContext } from "./context/AuthContextsx";
import { AuthProvider, useAuth } from "./context/AuthStateContext";
import LoginPage from "./pages/LoginPage";

const App: React.FC = () => {
  const { user, setUser } = useUserContext();
  const { actor, principal } = useAuth();

  useEffect(() => {
    const restoreUser = async () => {
      if (!user && actor && principal) {
        try {
          const { getUser } = await import("./context/AuthContextsx");
          const fetchedUser = await getUser(actor, principal);
          if (fetchedUser) setUser(fetchedUser);
        } catch (err) {
          console.error("Failed to restore user:", err);
        }
      }
    };

    restoreUser();
  }, [user, actor, principal, setUser]);

  return (
    <Router>
      <div className="min-h-screen bg-black text-white font-inter">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/z9" element={<Z9Page />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/test" element={<TestAPIPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default () => (
  <AuthProvider>
    <UserProvider>
      <App />
    </UserProvider>
  </AuthProvider>
);
