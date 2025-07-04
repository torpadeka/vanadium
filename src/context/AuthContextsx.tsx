import { AuthClient } from "@dfinity/auth-client";
import { createActor, canisterId } from "@/declarations/user_service";
import { HttpAgent, ActorSubclass } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { _SERVICE, User } from "@/declarations/user_service/user_service.did";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

const network = process.env.DFX_NETWORK || "local";
const identityProvider =
  network === "ic"
    ? "https://identity.ic0.app"
    : "http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:4943";
const wslIp = "127.0.0.1";

/* ---------- Auth logic ---------- */

export interface AuthState {
  actor: ActorSubclass<_SERVICE>;
  authClient: AuthClient;
  isAuthenticated: boolean;
  principal: string;
}

export const initAuthClient = async (): Promise<AuthState> => {
  const authClient = await AuthClient.create();
  const identity = authClient.getIdentity();

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

  const isAuthenticated = await authClient.isAuthenticated();
  const principal = identity.getPrincipal().toText();

  return {
    actor,
    authClient,
    isAuthenticated,
    principal,
  };
};

export const login = async (
  authClient: AuthClient,
  actor: ActorSubclass<_SERVICE>,
  principal: Principal,
  setUser: (user: User | null) => void
): Promise<void> => {
  await authClient.login({
    identityProvider,
    onSuccess: async () => {
      try {
        const user = await getUser(actor, principal);
        if (!user || user.username === "") {
          window.location.href = "/register";
        } else {
          setUser(user);
        }
      } catch (err) {
        console.error("Error during login user fetch:", err);
        window.location.href = "/register";
      }
    },
  });
};

export const logout = async (
  authClient: AuthClient,
  onSuccess: () => void
): Promise<void> => {
  await authClient.logout();
  onSuccess();
};

export const whoami = async (
  actor: ActorSubclass<_SERVICE>
): Promise<string> => {
  const result = await actor.whoami(); // Optional: remove if not needed
  return result.toString();
};

export const getUser = async (
  actor: ActorSubclass<_SERVICE>,
  principal: Principal
): Promise<User | null> => {
  const result = await actor.getUser(principal);
  if ("ok" in result) {
    return result.ok.length > 0 ? (result.ok[0] ?? null) : null;
  }
  return null;
};

export const createUser = async (
  actor: ActorSubclass<_SERVICE>,
  username: string,
  email: string
): Promise<User> => {
  const result = await actor.createUser(username, email);
  if ("ok" in result) {
    return result.ok;
  } else {
    throw new Error(result.err);
  }
};

/* ---------- UserContext ---------- */

interface UserContextType {
  user: User | null; // The user object itself, or null if not logged in
  setUser: React.Dispatch<React.SetStateAction<User | null>>; // The function to update the user state
}

// 3. Create the Context
// Now that UserContextType is defined, createContext knows what type to expect.
const UserContext = createContext<UserContextType | undefined>(undefined);

// 4. Create the UserProvider component
export const UserProvider = ({ children }: { children: ReactNode }) => {
  // useState also needs to know what 'User' is.
  const [user, setUser] = useState<User | null>(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};
