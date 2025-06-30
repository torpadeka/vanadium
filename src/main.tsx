import { ActorProvider, AgentProvider } from "@ic-reactor/react";
import React from "react";
import ReactDOM from "react-dom/client";
import { canisterId, idlFactory } from "./declarations/backend";
import "./index.css";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <AgentProvider withProcessEnv>
            <ActorProvider idlFactory={idlFactory} canisterId={canisterId}>
                <App />
            </ActorProvider>
        </AgentProvider>
    </React.StrictMode>
);
