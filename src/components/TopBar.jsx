import React from "react";
import { useLocation } from "react-router-dom";

const PAGE_TITLES = {
  "/":            "Dashboard",
  "/products":    "Products",
  "/orders":      "Orders",
  "/customers":   "Customers",
  "/inventory":   "Inventory",
  "/promo-codes": "Promo Codes",
  "/settings":    "Settings",
};

export default function TopBar({ onMenuToggle }) {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] ?? "Admin";
  const now = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-stone-200 h-16 flex items-center justify-between px-4 sm:px-6 gap-4">
      {/* Left: hamburger + page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors"
          aria-label="Toggle sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-stone-900 leading-none">{title}</h1>
          <p className="text-xs text-stone-400 mt-0.5 hidden sm:block">{now}</p>
        </div>
      </div>

      {/* Right: quick actions */}
      <div className="flex items-center gap-2">
        <span className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
          Store Online
        </span>
        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-stone-600 hover:text-stone-900 border border-stone-200 rounded-lg px-3 py-1.5 hover:bg-stone-50 transition-colors flex items-center gap-1"
        >
          <span>🛍️</span>
          <span className="hidden sm:inline">View Store</span>
        </a>
      </div>
    </header>
  );
}
