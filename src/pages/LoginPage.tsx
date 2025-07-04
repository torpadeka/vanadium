import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthStateContext";
import { login, logout, useUserContext, whoami } from "@/context/AuthContextsx";

export default function LoginPage() {
  const { actor, principal, authClient, isAuthenticated } = useAuth();
  const { user, setUser } = useUserContext();
  const [whoamiResult, setWhoamiResult] = useState<string>("Loading...");

  // Fetch whoami() result
  useEffect(() => {
    console.log(user);
    const fetchWhoami = async () => {
      if (!actor) return setWhoamiResult("Actor not available");
      try {
        const result = await whoami(actor);
        setWhoamiResult(result);
      } catch (error) {
        console.error("Whoami call failed:", error);
        setWhoamiResult("Failed to fetch whoami");
      }
    };

    fetchWhoami();
  }, [actor]);

  // Handle login
  const handleLogin = async () => {
    if (!authClient || !actor || !principal) return;
    await login(authClient, actor, principal, setUser); // sets global user
  };

  // Handle logout
  const handleLogout = async () => {
    if (!authClient) return;
    await logout(authClient, () => {
      setUser(null); // reset user
      window.location.reload(); // or use navigate('/')
    });
  };

  return (
    <div className="p-8 text-white bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Whoami Page</h1>
      <p>
        <strong>Principal:</strong> {principal?.toString() ?? "Not logged in"}
      </p>
      <p className="mt-2">
        <strong>Canister whoami():</strong> {whoamiResult}
      </p>

      {user && (
        <div className="mt-4 text-green-400">
          <p>
            <strong>User:</strong> {user.username} ({user.email})
          </p>
        </div>
      )}

      <div className="mt-6 space-x-4">
        {!isAuthenticated ? (
          <button
            onClick={handleLogin}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Login
          </button>
        ) : (
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );
}
