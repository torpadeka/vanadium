import React, { createContext, useState, useEffect, useCallback } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { ActorSubclass } from "@dfinity/agent";
import { createActor, canisterId } from "@/declarations/backend";
import { _SERVICE } from "@/declarations/backend/backend.did";

// Define the network and identity provider
const network: string = process.env.DFX_NETWORK || "local";
const identityProvider: string =
  network === "ic"
    ? "https://identity.ic0.app"
    : "http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:4943";

// Define types for user data
interface UserData {
  username: string;
  email: string;
  createdAt: bigint;
}

// Define the AuthContext value type
interface AuthContextType {
  isAuthenticated: boolean;
  principal: string | null;
  username: string | null;
  email: string | null;
  actor: ActorSubclass<_SERVICE> | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  registerUser: (username: string, email: string) => Promise<void>;
  getUserData: () => Promise<UserData | null>;
}

// Create the AuthContext
export const AuthContext = createContext<AuthContextType | null>(null);

// AuthProvider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [actor, setActor] = useState<ActorSubclass<_SERVICE> | null>(null);
  const [principal, setPrincipal] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  // Initialize authentication
  const initializeAuth = useCallback(async () => {
    try {
      const client = await AuthClient.create();
      const isAuth = await client.isAuthenticated();
      setAuthClient(client);

      if (isAuth) {
        const identity = client.getIdentity();
        const principal = identity.getPrincipal().toText();
        const newActor = createActor(canisterId, {
          agentOptions: { identity },
        });
        setActor(newActor);
        setPrincipal(principal);
        setIsAuthenticated(true);

        const userData = await newActor.getUser(principal);
        if ("ok" in userData && userData.ok[0]) {
          setUsername(userData.ok[0].username);
          setEmail(userData.ok[0].email);
        }
      }
    } catch (error) {
      console.error("Auth initialization failed:", error);
    }
  }, []);

  // Login function
  const login = useCallback(async () => {
    try {
      if (!authClient) throw new Error("Auth client not initialized");
      await authClient.login({
        identityProvider,
        onSuccess: async () => {
          const identity = authClient.getIdentity();
          const principal = identity.getPrincipal().toText();
          const newActor = createActor(canisterId, {
            agentOptions: { identity },
          });
          setActor(newActor);
          setPrincipal(principal);
          setIsAuthenticated(true);
          const userData = await newActor.getUser(principal);
          if ("ok" in userData && userData.ok[0]) {
            setUsername(userData.ok[0].username);
            setEmail(userData.ok[0].email);
          }
        },
      });
    } catch (error) {
      console.error("Login failed:", error);
      throw new Error("Login failed. Please try again.");
    }
  }, [authClient]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      if (!authClient) throw new Error("Auth client not initialized");
      await authClient.logout();
      setIsAuthenticated(false);
      setActor(null);
      setPrincipal(null);
      setUsername(null);
      setEmail(null);
    } catch (error) {
      console.error("Logout failed:", error);
      throw new Error("Logout failed.");
    }
  }, [authClient]);

  // Register user with username and email
  const registerUser = useCallback(
    async (username: string, email: string) => {
      if (!username.trim()) throw new Error("Please enter a username");
      if (!email.trim()) throw new Error("Please enter an email");
      try {
        if (!actor) throw new Error("Actor not initialized");
        const result = await actor.registerUser(username, email);
        if ("err" in result) throw new Error(result.err);
        setUsername(username);
        setEmail(email);
      } catch (error) {
        console.error("Registration failed:", error);
        throw error;
      }
    },
    [actor]
  );

  // Fetch user data
  const getUserData = useCallback(async (): Promise<UserData | null> => {
    if (!actor || !principal) return null;
    try {
      const userData = await actor.getUser(principal);
      return "ok" in userData && userData.ok[0] ? userData.ok[0] : null;
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      return null;
    }
  }, [actor, principal]);

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const value: AuthContextType = {
    isAuthenticated,
    principal,
    username,
    email,
    actor,
    login,
    logout,
    registerUser,
    getUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useUser = (): AuthContextType => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useUser must be used within an AuthProvider");
  }
  return context;
};
