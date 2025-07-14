import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Zap,
  Code,
  Shield,
  Sparkles,
  ArrowRight,
  Play,
  Database,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Console } from "console";
import { useUser } from "@/context/AuthContext";

type Tab = "home" | "features" | "pricing" | "about" | "login" | "logout";

const LandingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const { user } = useUser();
  const navigate = useNavigate();

  const renderTabContent = () => {
    switch (activeTab) {
      case "features":
        return (
          <div className="max-w-6xl mx-auto px-6 py-20">
            <h2 className="text-4xl font-bold text-center mb-16">
              Powerful Features for Modern Development
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Zap className="w-8 h-8" />}
                title="AI-Powered Generation"
                description="Generate complete React components and applications with natural language prompts using our advanced Z9 AI."
              />
              <FeatureCard
                icon={<Shield className="w-8 h-8" />}
                title="Blockchain Security"
                description="Built on Internet Computer Protocol (ICP) for enhanced security, decentralization, and data integrity."
              />
              <FeatureCard
                icon={<Code className="w-8 h-8" />}
                title="Monaco Editor"
                description="Professional code editing experience with the same editor that powers Visual Studio Code."
              />
              <FeatureCard
                icon={<Layers className="w-8 h-8" />}
                title="Real-time Preview"
                description="See your changes instantly with live preview and hot module replacement."
              />
              <FeatureCard
                icon={<Database className="w-8 h-8" />}
                title="Project Management"
                description="Organize multiple projects with intelligent chat-based project separation and version control."
              />
              <FeatureCard
                icon={<Sparkles className="w-8 h-8" />}
                title="Modern Stack"
                description="Built with Vite, React, TypeScript, and Tailwind CSS for optimal developer experience."
              />
            </div>
          </div>
        );

      case "pricing":
        return (
          <div className="max-w-4xl mx-auto px-6 py-20">
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
        return (
          <div className="max-w-4xl mx-auto px-6 py-20">
            <h2 className="text-4xl font-bold text-center mb-16">
              About vanadium
            </h2>
            <div className="prose prose-invert max-w-none">
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Our Mission</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 leading-relaxed">
                    vanadium revolutionizes web development by combining the
                    power of AI with blockchain technology. We believe that
                    creating beautiful, functional React applications should be
                    as simple as describing what you want to build.
                  </p>
                </CardContent>
              </Card>
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Technology Stack</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    Built on cutting-edge technologies to ensure security,
                    performance, and scalability:
                  </p>
                  <ul className="text-gray-300 space-y-2">
                    <li>
                      • <strong>Frontend:</strong> Vite + React + TypeScript +
                      Tailwind CSS
                    </li>
                    <li>
                      • <strong>Backend:</strong> Internet Computer Protocol
                      (ICP) + Motoko
                    </li>
                    <li>
                      • <strong>AI Engine:</strong> Advanced language models
                      optimized for code generation
                    </li>
                    <li>
                      • <strong>Security:</strong> Blockchain-based
                      authentication and data storage
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case "login":
        return (
          <div className="">
            {/* {!isAuthenticated && (
              <button
                onClick={login}
                className="flex items-center px-6 py-3 rounded-lg text-lg font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all duration-200 shadow-lg"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M11 16l-4-4m0 0l4-4m-4 4h14"
                  />
                </svg>
                Get Started with Internet Identity
              </button>
            )} */}
          </div>
        );

      default:
        return (
          <div className="relative">
            {/* Hero Section */}
            <div className="max-w-6xl mx-auto px-6 py-20 text-center">
              <div className="mb-8">
                <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-purple-glow to-purple-600 bg-clip-text text-transparent">
                  vanadium
                </h1>
                <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                  Create stunning React applications with the power of AI. Built
                  on blockchain technology for enhanced security and
                  decentralization.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" className="group">
                    <Link to="/z9">
                      Start Building
                      <Play className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button className="text-black" variant="outline" size="lg">
                    Watch Demo
                  </Button>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="max-w-6xl mx-auto px-6 py-20">
              <h2 className="text-4xl font-bold text-center mb-16">
                Why Choose vanadium?
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                <FeatureCard
                  icon={<Zap className="w-8 h-8" />}
                  title="AI-Powered"
                  description="Generate complete React applications using natural language prompts with our advanced Z9 AI engine."
                />
                <FeatureCard
                  icon={<Shield className="w-8 h-8" />}
                  title="Blockchain Security"
                  description="Built on Internet Computer Protocol (ICP) for enhanced security and decentralized data storage."
                />
                <FeatureCard
                  icon={<Code className="w-8 h-8" />}
                  title="Professional Tools"
                  description="Monaco editor, real-time preview, and modern development workflow out of the box."
                />
              </div>
            </div>
          </div>
        );
    }
  };
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 backdrop-blur-sm bg-black/80 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="w-8 h-8 text-purple-glow" />
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-purple-glow to-purple-600 bg-clip-text text-transparent">
                vanadium
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <div className="margin-2">{user?.username}</div>
              <NavItem
                label="Home"
                active={activeTab === "home"}
                onClick={() => setActiveTab("home")}
              />
              <NavItem
                label="Features"
                active={activeTab === "features"}
                onClick={() => setActiveTab("features")}
              />
              <NavItem
                label="Pricing"
                active={activeTab === "pricing"}
                onClick={() => setActiveTab("pricing")}
              />
              <NavItem
                label="About"
                active={activeTab === "about"}
                onClick={() => setActiveTab("about")}
              />
              <NavItem
                label="Login"
                active={activeTab === "login"}
                onClick={() => (window.location.href = "login")}
              />
              {/* <Button onClick={() => handleLogout()} size="sm">
                Logout
              </Button> */}
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main>{renderTabContent()}</main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12">
        <div className="max-w-6xl mx-auto px-6 text-center text-gray-400">
          <p>&copy; 2024 vanadium. Built with ❤️ for developers.</p>
        </div>
      </footer>
    </div>
  );
};

interface NavItemProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`font-medium transition-colors ${
      active ? "text-purple-glow" : "text-gray-300 hover:text-white"
    }`}
  >
    {label}
  </button>
);

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
