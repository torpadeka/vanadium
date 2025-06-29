import { ActorProvider, AgentProvider } from "@ic-reactor/react";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import { canisterId, idlFactory } from "./declarations/backend";
import "./index.css";
import Home from "./Home";
import Z9 from "./Z9";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <AgentProvider withProcessEnv>
            <ActorProvider idlFactory={idlFactory} canisterId={canisterId}>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/z9" element={<Z9 />} />
                    </Routes>
                </BrowserRouter>
            </ActorProvider>
        </AgentProvider>
    </React.StrictMode>
);
