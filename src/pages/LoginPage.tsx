import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthStateContext";
import { login, logout, useUserContext, whoami } from "@/context/AuthContextsx";

export default function LoginPage() {
  const { actor, principal, authClient, isAuthenticated } = useAuth();
  const { user, setUser } = useUserContext();
  const [whoamiResult, setWhoamiResult] = useState<string>("Loading...");

  useEffect(() => {
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

  const handleLogin = async () => {
    if (!authClient || !actor || !principal) return;
    await login(authClient, actor, principal, setUser);
  };

  const handleLogout = async () => {
    if (!authClient) return;
    await logout(authClient, () => {
      setUser(null);
      window.location.reload();
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800 p-4 text-white font-inter">
      <div className="w-full max-w-lg bg-gray-900 border border-gray-700 rounded-xl shadow-lg p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">User Dashboard</h1>
          <p className="text-sm text-gray-400">
            Check your Internet Identity and session state
          </p>
        </div>

        <div className="space-y-2">
          <div>
            <span className="font-semibold text-gray-300">Principal:</span>
            <p className="text-sm break-all text-blue-400">
              {principal?.toString() ?? "Not logged in"}
            </p>
          </div>

          <div>
            <span className="font-semibold text-gray-300">
              Canister whoami():
            </span>
            <p className="text-sm text-purple-400">{whoamiResult}</p>
          </div>

          {user && (
            <div className="mt-4 bg-gray-800 border border-gray-700 p-4 rounded-lg">
              <p className="text-green-400 font-semibold">✅ Logged in as:</p>
              <p className="text-sm text-gray-300">
                {user.username} — {user.email}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-center space-x-4 pt-4">
          {!isAuthenticated ? (
            <button
              onClick={handleLogin}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold transition"
            >
              Login
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-semibold transition"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
