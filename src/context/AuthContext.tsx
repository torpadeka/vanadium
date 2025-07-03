import React, { createContext, useState, useEffect, useContext } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { ActorSubclass, HttpAgent } from "@dfinity/agent";
import { createActor, canisterId } from "@/declarations/user_service";
import { _SERVICE, User } from "@/declarations/user_service/user_service.did";
import { Principal } from "@ic-reactor/react/dist/types";

interface AuthContextType {
  isAuthenticated: boolean;
  principal: string | null;
  user: User | null;
  actor: ActorSubclass<_SERVICE> | null;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  register: (username: string, email: string) => Promise<void>;
  // updateUser: (username?: string, email?: string) => Promise<void>;
  deleteUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const network: string = process.env.DFX_NETWORK || "local";
const identityProvider: string =
  network === "ic"
    ? "https://identity.ic0.app"
    : "http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:4943";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [actor, setActor] = useState<ActorSubclass<_SERVICE> | null>(null);
  const [principal, setPrincipal] = useState<Principal | null>();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    initializeAuth();
  }, []);
  const wslIp = "127.0.0.1";
  async function initializeAuth(): Promise<void> {
    try {
      setIsLoading(true);
      const client = await AuthClient.create();
      // console.log("AuthClient created:", client);
      const isAuth = await client.isAuthenticated();
      setAuthClient(client);
      if (isAuth) {
        const identity = client.getIdentity();
        const principal = identity.getPrincipal();
        const agent = new HttpAgent({
          host:
            network === "local" ? `http://${wslIp}:4943` : "https://ic0.app",
        });
        if (network === "local") {
          await agent.fetchRootKey().catch((err) => {
            console.warn("Unable to fetch root key for local replica:", err);
          });
        }
        const newActor = createActor(canisterId, {
          agentOptions: { identity, host: agent.host.toString() },
        });
        // console.log(newActor);
        // console.log("Principal:", principal);
        setActor(newActor);
        setPrincipal(principal);
        setIsAuthenticated(true);
        await fetchUser(principal, newActor);
      }
    } catch (error) {
      console.error("Initialization failed:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchUser(
    principal: Principal,
    actorToUse: ActorSubclass<_SERVICE>
  ): Promise<void> {
    try {
      const result = await actorToUse.getUser(principal);
      // console.log("getUser result:", result);
      if ("ok" in result) {
        const fetchedUser = result.ok.length > 0 ? result.ok[0] : null;
        // Check if username or email is empty
        if (result.ok.length === 0) {
          setUser(null); // Trigger registration if username or email is empty
          // window.location.href = "/register"; // Redirect to registration page
        } else {
          setUser(fetchedUser || null);
        }
      } else {
        console.error("Failed to fetch user:", result.err);
        setUser(null);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser(null);
    }
  }

  async function login(): Promise<void> {
    try {
      await authClient!.login({
        identityProvider,
        onSuccess: async () => {
          const identity = authClient!.getIdentity();
          const principal = identity.getPrincipal();
          const newActor = createActor(canisterId, {
            agentOptions: { identity },
          });
          setActor(newActor);
          setPrincipal(principal);
          setIsAuthenticated(true);
          await fetchUser(principal, newActor);
        },
      });
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed. Please try again.");
    }
  }

  async function logout(): Promise<void> {
    try {
      await authClient!.logout();
      setIsAuthenticated(false);
      setActor(null);
      setPrincipal(null);
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Logout failed. Please try again.");
    }
  }

  async function register(username: string, email: string): Promise<void> {
    if (!username || !email) {
      alert("Username and email are required");
      return;
    }
    try {
      const result = await actor!.createUser(username, email);
      if ("ok" in result) {
        setUser(result.ok);
      } else {
        alert(`Registration failed: ${result.err}`);
      }
    } catch (error) {
      console.error("Registration failed:", error);
      alert(`Registration failed: ${(error as Error).message}`);
    }
  }

  // async function updateUser(username?: string, email?: string): Promise<void> {
  //   try {
  //     const result = await actor!.updateUser(username ?? null, email ?? null);
  //     if ("ok" in result) {
  //       setUser(result.ok);
  //     } else {
  //       alert(`Update failed: ${result.err}`);
  //     }
  //   } catch (error) {
  //     console.error("Update failed:", error);
  //     alert(`Update failed: ${(error as Error).message}`);
  //   }
  // }

  async function deleteUser(): Promise<void> {
    try {
      const result = await actor!.deleteUser();
      if ("ok" in result) {
        setUser(null);
        setIsAuthenticated(false);
        setActor(null);
        setPrincipal(null);
      } else {
        alert(`Delete failed: ${result.err}`);
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert(`Delete failed: ${(error as Error).message}`);
    }
  }

  const value: AuthContextType = {
    isAuthenticated,
    principal: principal ? principal.toString() : null,
    user,
    actor,
    isLoading,
    login,
    logout,
    register,
    // updateUser,
    deleteUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useUser = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
