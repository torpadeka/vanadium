// context/AuthContext.tsx or context/AuthStateContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { ActorSubclass, HttpAgent } from "@dfinity/agent";
import { createActor, canisterId } from "@/declarations/user_service";
import { _SERVICE } from "@/declarations/user_service/user_service.did";
import { Principal } from "@dfinity/principal";

interface AuthContextType {
  actor: ActorSubclass<_SERVICE> | null;
  principal: Principal | null;
  authClient: AuthClient | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
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
      const agent = new HttpAgent({ identity });

      if (process.env.DFX_NETWORK !== "ic") {
        await agent.fetchRootKey();
      }

      const actor = createActor(canisterId, {
        agentOptions: { identity },
      });

      setActor(actor);
      setPrincipal(principal);
      setIsAuthenticated(await client.isAuthenticated());
    };

    init();
  }, []);

  return (
    <AuthContext.Provider
      value={{ actor, principal, authClient, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
