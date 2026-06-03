import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: "dashboard" },
  { to: "/history", label: "History", icon: "history" },
  { to: "/quick-scan", label: "Quick Scan", "icon": "mail_lock" },
  { to: "/model", label: "ML Models", icon: "model_training" },
  { to: "/settings", label: "Settings", icon: "settings" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const sidebar = (
    <nav className="fixed left-0 top-0 h-screen flex flex-col p-6 bg-surface/80 backdrop-blur-xl border-r border-outline-variant/50 shadow-2xl w-72 z-40">
      {/* Brand */}
      <div className="mb-12 px-4">
        <h1 className="text-[32px] leading-[1.2] tracking-[-0.01em] font-semibold font-[Geist] text-primary">
          PhishGuard
        </h1>
        <p className="text-[14px] leading-[1.2] tracking-[0.02em] font-medium font-[JetBrains_Mono] text-on-surface-variant mt-1">
          Vigilant Defense
        </p>
      </div>

      {/* Nav Links */}
      <div className="flex-1 space-y-2">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 no-underline ${
                active
                  ? "bg-gradient-to-r from-secondary-container to-primary-container text-on-primary-container shadow-lg shadow-primary/20 scale-95"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30 hover:scale-[1.02]"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className={`text-[14px] leading-[1.2] tracking-[0.02em] font-medium font-[JetBrains_Mono] ${active ? "font-bold" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Bottom Section */}
      <div className="mt-auto space-y-2 pt-4 border-t border-outline-variant/30">
        <div className="px-4 mb-4">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-container-high">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
              {user.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] leading-[1.5] text-on-surface truncate">{user.email}</p>
              <span className={`text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] ${
                user.provider === "google" ? "text-[#4285f4]" : "text-[#0078d4]"
              }`}>
                {user.provider === "google" ? "Google" : "Microsoft"}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-4 px-4 py-3 rounded-xl text-on-surface-variant hover:text-error hover:bg-error/10 transition-all duration-200 w-full text-left"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="text-[14px] leading-[1.2] tracking-[0.02em] font-medium font-[JetBrains_Mono]">
            Sign Out
          </span>
        </button>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile Header */}
      <header className="flex justify-between items-center w-full px-6 py-4 sticky top-0 z-50 bg-background/40 backdrop-blur-md border-b border-outline-variant/30 md:hidden">
        <div className="text-[24px] leading-[1.3] font-semibold font-[Geist] text-primary">
          PhishGuard
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-primary p-1"
        >
          <span className="material-symbols-outlined">
            {mobileOpen ? "close" : "menu"}
          </span>
        </button>
      </header>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex">{sidebar}</div>

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 md:hidden ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        {sidebar}
      </div>
    </>
  );
}
