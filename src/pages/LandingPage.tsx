"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Zap,
  Code,
  Shield,
  Sparkles,
  Play,
  Database,
  Layers,
  Rocket,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUser } from "@/context/AuthContext";
import Aurora from "@/components/backgrounds/Aurora/Aurora";
import GradientText from "@/components/text/GradientText/GradientText";
import { MenuBar } from "@/components/MenuBar";
import MagicBento from "@/components/component/MagicBento/MagicBento";

type Tab = "home" | "features" | "pricing" | "about" | "login" | "logout";

const LandingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const navigate = useNavigate();
  const getYear = new Date().getFullYear();

  const navigateToZ9 = () => {
    window.location.href = "/z9";
  };

  const {
    user,
    actor,
    principal,
    authClient,
    isAuthenticated,
    login,
    logout,
    whoami,
    setUser,
  } = useUser();
  const [whoamiResult, setWhoamiResult] = useState<string>("Loading...");

  useEffect(() => {
    const fetchWhoami = async () => {
      if (!actor) return setWhoamiResult("Actor not available");
      try {
        const result = await whoami();
        setWhoamiResult(result);
      } catch (error) {
        console.error("Whoami call failed:", error);
        setWhoamiResult("Failed to fetch whoami");
      }
    };

    fetchWhoami();
  }, [actor, whoami]);

  const handleLogin = async () => {
    await login();
  };

  const handleLogout = async () => {
    await logout(() => {
      window.location.reload();
    });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "features":
        return (
          <div className="w-full mx-auto px-6 flex items-center justify-center flex-col">
            <h2 className="text-4xl pt-6 font-bold text-center mb-16">
              Powerful Features for Modern Development
            </h2>
            <MagicBento
              textAutoHide={true}
              enableStars={true}
              enableSpotlight={true}
              enableBorderGlow={true}
              enableTilt={true}
              enableMagnetism={true}
              clickEffect={true}
              spotlightRadius={300}
              particleCount={12}
              glowColor="132, 0, 255"
            />
          </div>
        );
      case "pricing":
        return (
          <div className="w-full mx-auto px-6 flex items-center justify-center flex-col">
            <h2 className="text-4xl font-bold text-center mb-16">
              Simple, Transparent Pricing
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <PricingCard
                title="Free"
                price="$0"
                period="forever"
                features={[
                  "5 projects per month",
                  "Basic AI assistance",
                  "Standard templates",
                  "Community support",
                ]}
                buttonText="Get Started"
                popular={false}
              />
              <PricingCard
                title="Pro"
                price="$29"
                period="per month"
                features={[
                  "Unlimited projects",
                  "Advanced AI capabilities",
                  "Premium templates",
                  "Priority support",
                  "Team collaboration",
                  "Advanced security features",
                ]}
                buttonText="Start Free Trial"
                popular={true}
              />
            </div>
          </div>
        );
      case "about":
        const techStack = [
          {
            icon: <Code className="w-5 h-5 text-purple-400" />,
            category: "Frontend",
            tools: "Vite + React + TypeScript + Tailwind CSS",
          },
          {
            icon: <Database className="w-5 h-5 text-purple-400" />,
            category: "Backend",
            tools: "Internet Computer Protocol (ICP) + Motoko",
          },
          {
            icon: <Sparkles className="w-5 h-5 text-purple-400" />,
            category: "AI Engine",
            tools: "Advanced language models for code generation",
          },
          {
            icon: <Shield className="w-5 h-5 text-purple-400" />,
            category: "Security",
            tools: "Blockchain-based authentication and data storage",
          },
        ];

        return (
          <div className="w-full max-w-6xl mx-auto px-6 flex items-center justify-center flex-col">
            {/* Grid for About Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
              {/* Vision Card (spans full width) */}
              <Card className="md:col-span-2 bg-white/5 border-purple-500/20 hover:border-purple-500/50 transition-colors duration-300">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 rounded-lg">
                      <Eye className="w-6 h-6 text-gray-200" />
                    </div>
                    <CardTitle className="text-2xl text-gray-200">
                      Our Vision
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 leading-relaxed text-lg">
                    To empower developers and businesses to build secure,
                    scalable, and intelligent applications faster than ever
                    before, moving from an idea to a full-stack dApp in minutes,
                    not months.
                  </p>
                </CardContent>
              </Card>

              {/* Mission Card */}
              <Card className="bg-white/5 border-purple-500/20 hover:border-purple-500/50 transition-colors duration-300">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 rounded-lg">
                      <Rocket className="w-6 h-6 text-gray-200" />
                    </div>
                    <CardTitle className="text-2xl text-gray-200">
                      Our Mission
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 leading-relaxed">
                    Vanadium revolutionizes web development by combining the
                    power of AI with blockchain technology. We believe that
                    creating beautiful, functional React applications should be
                    as simple as describing what you want to build.
                  </p>
                </CardContent>
              </Card>

              {/* Technology Stack Card */}
              <Card className="bg-white/5 border-purple-500/20 hover:border-purple-500/50 transition-colors duration-300">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 rounded-lg">
                      <Layers className="w-6 h-6 text-gray-200" />
                    </div>
                    <CardTitle className="text-2xl text-gray-200">
                      Technology Stack
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 leading-relaxed mb-6">
                    Built on cutting-edge technologies to ensure security,
                    performance, and an unparalleled developer experience:
                  </p>
                  <ul className="space-y-4">
                    {techStack.map((item) => (
                      <li
                        key={item.category}
                        className="flex items-start gap-4"
                      >
                        <div className="mt-1 flex-shrink-0">{item.icon}</div>
                        <div>
                          <h4 className="font-semibold text-white">
                            {item.category}
                          </h4>
                          <p className="text-gray-400 text-sm">{item.tools}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case "login":
        return (
          <div className="w-full max-w-6xl mx-auto px-6 flex items-center justify-center flex-col">
            <div className="w-full max-w-lg bg-gray-900 border border-gray-700 rounded-xl shadow-lg p-8 space-y-6">
              <div className="text-center">
                <h1 className="text-3xl font-bold mb-2">User Dashboard</h1>
                <p className="text-sm text-gray-400">
                  Check your Internet Identity and session state
                </p>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="font-semibold text-gray-300">
                    Principal:
                  </span>
                  <p className="text-sm break-all text-blue-400">
                    {principal?.toString() === "2vxsx-fae"
                      ? "You are not logged in yet"
                      : (principal?.toString() ?? "Not logged in")}
                  </p>
                </div>

                {/* <div>
                  <span className="font-semibold text-gray-300">
                    Canister whoami():
                  </span>
                  <p className="text-sm text-purple-400">
                    {whoamiResult === "2vxsx-fae"
                      ? "You are not logged in yet"
                      : whoamiResult}
                  </p>
                </div> */}

                {user && (
                  <div className="mt-4 bg-gray-800 border border-gray-700 p-4 rounded-lg">
                    <p className="text-green-400 font-semibold">
                      ✅ Logged in as:
                    </p>
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
                    className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 w-full rounded-lg font-semibold transition cursor-pointer"
                  >
                    Login
                  </button>
                ) : (
                  <button
                    onClick={handleLogout}
                    className="bg-red-700 hover:bg-red-800 text-white px-5 py-2 w-full rounded-lg font-semibold transition cursor-pointer"
                  >
                    Logout
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="relative">
            {/* Hero Section */}
            <div className="max-w-6xl mx-auto px-6 py-20 text-center">
              <div className="mb-8">
                <GradientText
                  colors={["#3A29FF", "#FF94B4", "#FF3232"]}
                  animationSpeed={100}
                  showBorder={false}
                  className="custom-class text-7xl md:text-9xl lexend-200 font-bold mb-6 bg-clip-text text-transparent"
                >
                  vanadium.
                </GradientText>
                <p className="text-xl md:text-xl host-grotesk-300 text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                  Create stunning React applications with the power of <b>AI</b>
                  . Built on <b>blockchain technology</b> for enhanced security
                  and decentralization.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center host-grotesk-300">
                  <Button asChild size="lg" className="group">
                    <a
                      onClick={() => {
                        window.location.href = "/z9";
                      }}
                    >
                      Start Building
                      <Play className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </Button>
                  <Button
                    className="text-gray-900 bg-gray-200 cursor-pointer"
                    variant="outline"
                    size="lg"
                  >
                    <Link to="https://youtube.com">Watch Demo</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex items-center justify-start flex-col h-screen relative text-white">
      <div className="absolute min-h-screen bottom-0 z-0">
        <Aurora
          colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
          blend={0.5}
          amplitude={1.0}
          speed={0.5}
        />
      </div>
      {/* Navigation */}
      <nav className="backdrop-blur-sm sticky top-0 z-50 py-4">
        <div className="flex align-middle justify-center">
          <MenuBar
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab as Tab)}
            user={user}
            isAuthenticated={isAuthenticated}
          />
        </div>
      </nav>

      {/* Content */}
      <main className="z-999 host-grotesk-300 w-full h-full flex items-center justify-center">
        {renderTabContent()}
      </main>

      {/* Transparent Footer */}
      <footer className="backdrop-blur-sm bg-black/20 border-t border-gray-800/50 py-12">
        <div className="max-w-6xl mx-auto px-6 text-center text-gray-400">
          <p className="host-grotesk-300">
            &copy; {getYear} Vanadium. Built with ❤️ for developers.
          </p>
        </div>
      </footer>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
}) => (
  <Card>
    <CardHeader>
      <div className="text-purple-glow mb-4">{icon}</div>
      <CardTitle className="text-xl">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <CardDescription className="leading-relaxed">
        {description}
      </CardDescription>
    </CardContent>
  </Card>
);

interface PricingCardProps {
  title: string;
  price: string;
  period: string;
  features: string[];
  buttonText: string;
  popular: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({
  title,
  price,
  period,
  features,
  buttonText,
  popular,
}) => (
  <Card className={popular ? "border-purple-glow shadow-glow" : ""}>
    <CardHeader>
      {popular && (
        <div className="bg-purple-glow text-white text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4 w-fit">
          Most Popular
        </div>
      )}
      <CardTitle>{title}</CardTitle>
      <div className="mb-6">
        <span className="text-4xl font-bold">{price}</span>
        <span className="text-gray-400">/{period}</span>
      </div>
    </CardHeader>
    <CardContent>
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center text-gray-300">
            <div className="w-2 h-2 bg-purple-glow rounded-full mr-3"></div>
            {feature}
          </li>
        ))}
      </ul>
      <Button className="w-full" variant={popular ? "default" : "outline"}>
        {buttonText}
      </Button>
    </CardContent>
  </Card>
);

export default LandingPage;
