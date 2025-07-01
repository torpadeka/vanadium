import { useUser } from "@/context/AuthContext";
import { useState } from "react";

// Register Page Component
export default function RegisterPage() {
  const { registerUser } = useUser();
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  const handleRegister = async () => {
    try {
      await registerUser(username, email);
    } catch (error: any) {
      alert(`Failed to register: ${error.message}`);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white font-inter">
      <div className="relative bg-gray-800 p-6 rounded-xl shadow-md border border-gray-700">
        <div className="absolute top-0 left-0 w-full h-2 rounded-t-xl bg-gradient-to-r from-blue-500 to-purple-500"></div>
        <h1 className="text-2xl font-bold mb-6">Register</h1>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium mb-1"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full p-3 border border-gray-600 rounded-lg bg-gray-900 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full p-3 border border-gray-600 rounded-lg bg-gray-900 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>
        </div>
        <button
          onClick={handleRegister}
          className="mt-4 flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-all duration-200"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
          Register
        </button>
      </div>
    </div>
  );
}
