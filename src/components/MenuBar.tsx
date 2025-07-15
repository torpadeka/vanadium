"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Zap, Sparkles, Database, Code, Shield } from "lucide-react";

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  gradient: string;
  iconColor: string;
}

const itemVariants = {
  initial: { rotateX: 0, opacity: 1 },
  hover: { rotateX: -90, opacity: 0 },
};

const backVariants = {
  initial: { rotateX: 90, opacity: 0 },
  hover: { rotateX: 0, opacity: 1 },
};

const glowVariants = {
  initial: { opacity: 0, scale: 0.8 },
  hover: {
    opacity: 1,
    scale: 2,
    transition: {
      opacity: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
      scale: { duration: 0.5, type: "spring", stiffness: 300, damping: 25 },
    },
  },
};

const navGlowVariants = {
  initial: { opacity: 0 },
  hover: {
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

const sharedTransition = {
  type: "spring",
  stiffness: 100,
  damping: 20,
  duration: 0.5,
};

interface MenuBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  user?: { username: string } | null;
  isAuthenticated: boolean;
}

export function MenuBar({
  activeTab,
  onTabChange,
  user,
  isAuthenticated,
}: MenuBarProps) {
  const isDarkTheme = "dark";

  React.useEffect(() => {
    console.log("Active Tab", activeTab);
  }, [activeTab]);

  const menuItems: MenuItem[] = [
    {
      icon: <Zap className="h-5 w-5" />,
      label: "Home",
      href: "#",
      gradient:
        "radial-gradient(circle, rgba(147,51,234,0.15) 0%, rgba(126,34,206,0.06) 50%, rgba(107,33,168,0) 100%)",
      iconColor: "text-purple-500",
    },
    {
      icon: <Sparkles className="h-5 w-5" />,
      label: "Features",
      href: "#",
      gradient:
        "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.06) 50%, rgba(29,78,216,0) 100%)",
      iconColor: "text-blue-500",
    },
    // {
    //   icon: <Database className="h-5 w-5" />,
    //   label: "Pricing",
    //   href: "#",
    //   gradient:
    //     "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.06) 50%, rgba(21,128,61,0) 100%)",
    //   iconColor: "text-green-500",
    // },
    {
      icon: <Code className="h-5 w-5" />,
      label: "About",
      href: "#",
      gradient:
        "radial-gradient(circle, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.06) 50%, rgba(194,65,12,0) 100%)",
      iconColor: "text-orange-500",
    },
    {
      icon: <Shield className="h-5 w-5" />,
      label: isAuthenticated ? "Account" : "Login",
      href: "#",
      gradient:
        "radial-gradient(circle, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.06) 50%, rgba(185,28,28,0) 100%)",
      iconColor: "text-red-500",
    },
  ];

  return (
    <motion.nav
      className="p-2 rounded-2xl text-white bg-white/10 from-white/50 to-white/20 backdrop-blur-lg border border-white/30 shadow-lg relative overflow-hidden"
      initial="initial"
      whileHover="hover"
    >
      <motion.div
        className={`absolute -inset-2 bg-gradient-radial from-transparent ${
          isDarkTheme
            ? "via-blue-400/30 via-30% via-purple-400/30 via-60% via-red-400/30 via-90%"
            : "via-blue-400/20 via-30% via-purple-400/20 via-60% via-red-400/20 via-90%"
        } to-transparent rounded-3xl z-0 pointer-events-none`}
        variants={navGlowVariants}
      />
      <ul className="flex items-center gap-2 relative z-10">
        {/* {user && (
          <li className="mr-4 text-muted-foreground">{user.username}</li>
        )} */}
        {menuItems.map((item) => (
          <motion.li key={item.label} className="relative">
            <motion.div
              className="block rounded-xl overflow-visible group relative"
              style={{ perspective: "600px" }}
              whileHover="hover"
              initial="initial"
            >
              <motion.div
                className="absolute inset-0 z-0 pointer-events-none"
                variants={glowVariants}
                style={{
                  background: item.gradient,
                  opacity: 0,
                  borderRadius: "16px",
                }}
              />
              {(activeTab === item.label.toLowerCase() ||
                (activeTab === "login"
                  ? item.label.toLowerCase() === "account"
                  : false)) && (
                <motion.div
                  className="absolute inset-0 bg-white/20 rounded-xl z-0"
                  layoutId="activeTab"
                  transition={sharedTransition}
                />
              )}
              <motion.a
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  if (
                    item.label.toLowerCase() === "account" ||
                    item.label.toLowerCase() === "login"
                  ) {
                    onTabChange("login");
                  } else {
                    onTabChange(item.label.toLowerCase());
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 relative z-10 bg-transparent transition-colors rounded-xl ${
                  activeTab === item.label.toLowerCase() ||
                  (activeTab === "login"
                    ? item.label.toLowerCase() === "account"
                    : false)
                    ? "text-foreground"
                    : "text-muted-foreground group-hover:text-foreground"
                }`}
                variants={itemVariants}
                transition={sharedTransition}
                style={{
                  transformStyle: "preserve-3d",
                  transformOrigin: "center bottom",
                }}
              >
                <span
                  className={`transition-colors duration-300 ${
                    activeTab === item.label.toLowerCase() ||
                    (activeTab === "login"
                      ? item.label.toLowerCase() === "account"
                      : false)
                      ? item.iconColor
                      : `group-hover:${item.iconColor} text-foreground`
                  }`}
                >
                  {item.icon}
                </span>
                <span className="text-gray-200 host-grotesk-300">
                  {item.label}
                </span>
              </motion.a>
              <motion.a
                href={item.href}
                className="flex items-center gap-2 px-4 py-2 absolute inset-0 z-10 bg-transparent text-muted-foreground group-hover:text-foreground transition-colors rounded-xl"
                variants={backVariants}
                transition={sharedTransition}
                style={{
                  transformStyle: "preserve-3d",
                  transformOrigin: "center top",
                  rotateX: 90,
                }}
                onClick={(e) => {
                  e.preventDefault();
                  if (
                    item.label.toLowerCase() === "account" ||
                    item.label.toLowerCase() === "login"
                  ) {
                    onTabChange("login");
                  } else {
                    onTabChange(item.label.toLowerCase());
                  }
                }}
              >
                <span
                  className={`transition-colors duration-300 group-hover:${item.iconColor} text-foreground`}
                >
                  {item.icon}
                </span>
                <span className="text-gray-200 host-grotesk-300">
                  {item.label}
                </span>
              </motion.a>
            </motion.div>
          </motion.li>
        ))}
      </ul>
    </motion.nav>
  );
}
