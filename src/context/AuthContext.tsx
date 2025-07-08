import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { AuthClient } from "@dfinity/auth-client";
import { ActorSubclass, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { createActor, canisterId } from "@/declarations/user_service";
import { _SERVICE, User } from "@/declarations/user_service/user_service.did";

const network = process.env.DFX_NETWORK || "local";
const identityProvider =
  network === "ic"
    ? "https://identity.ic0.app"
    : "http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:4943";
const wslIp = "127.0.0.1";

interface UserContextType {
  user: User | null;
  actor: ActorSubclass<_SERVICE> | null;
  principal: Principal | null;
  authClient: AuthClient | null;
  isAuthenticated: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  login: () => Promise<void>;
  logout: (onSuccess: () => void) => Promise<void>;
  whoami: () => Promise<string>;
  getUser: (principal: Principal) => Promise<User | null>;
  createUser: (username: string, email: string) => Promise<User>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [actor, setActor] = useState<ActorSubclass<_SERVICE> | null>(null);
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const init = async () => {
      const client = await AuthClient.create();
      setAuthClient(client);

      const identity = client.getIdentity();
      const principal = identity.getPrincipal();
      const agent = new HttpAgent({
        host: network === "local" ? `http://${wslIp}:4943` : "https://ic0.app",
        identity,
      });

      if (network === "local") {
        try {
          await agent.fetchRootKey();
        } catch (err) {
          console.warn("Failed to fetch root key:", err);
        }
      }

      const actor = createActor(canisterId, {
        agentOptions: { identity },
      });

      setActor(actor);
      setPrincipal(principal);
      setIsAuthenticated(await client.isAuthenticated());

      // if (await client.isAuthenticated()) {
      //   try {
      //     const fetchedUser = await getUser(principal);
      //     console.log(fetchedUser);
      //     if (fetchedUser?.username) {
      //       setUser(fetchedUser);
      //     } else {
      //       // window.location.href = "/register";
      //     }
      //   } catch (err) {
      //     console.error("Error fetching user on init:", err);
      //     // window.location.href = "/register";
      //   }
      // }
    };

    init();
  }, []);

  const login = async (): Promise<void> => {
    if (!authClient || !actor || !principal) return;
    await authClient.login({
      identityProvider,
      onSuccess: async () => {
        try {
          const fetchedUser = await getUser(principal);
          if (!fetchedUser || fetchedUser.username === "") {
            window.location.href = "/register";
          } else {
            setUser(fetchedUser);
            setIsAuthenticated(true);
          }
        } catch (err) {
          console.error("Error during login user fetch:", err);
          window.location.href = "/register";
        }
      },
    });
  };

  const logout = async (onSuccess: () => void): Promise<void> => {
    if (!authClient) return;
    await authClient.logout();
    setUser(null);
    setIsAuthenticated(false);
    onSuccess();
  };

  const whoami = async (): Promise<string> => {
    if (!actor) throw new Error("Actor not initialized");
    const result = await actor.whoami();
    return result.toString();
  };

  const getUser = async (principal: Principal): Promise<User | null> => {
    if (!actor) return null;
    const result = await actor.getUser(principal);
    if ("ok" in result) {
      return result.ok.length > 0 ? (result.ok[0] ?? null) : null;
    }
    return null;
  };

  const createUser = async (username: string, email: string): Promise<User> => {
    if (!actor) throw new Error("Actor not initialized");
    const result = await actor.createUser(username, email);
    if ("ok" in result) {
      return result.ok;
    } else {
      throw new Error(result.err);
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        actor,
        principal,
        authClient,
        isAuthenticated,
        setUser,
        login,
        logout,
        whoami,
        getUser,
        createUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
