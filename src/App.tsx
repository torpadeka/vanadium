import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router";
import LandingPage from "./pages/LandingPage";
import Z9Page from "./pages/Z9Page";

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-black text-white font-inter">
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/z9" element={<Z9Page />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
