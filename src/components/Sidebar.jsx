import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

const NAV_ITEMS = [
  { to: "/",            label: "Dashboard",   icon: "📊" },
  { to: "/products",    label: "Products",    icon: "👕" },
  { to: "/orders",      label: "Orders",      icon: "📦" },
  { to: "/customers",   label: "Customers",   icon: "👥" },
  { to: "/inventory",   label: "Inventory",   icon: "🏭" },
  { to: "/promo-codes", label: "Promo Codes", icon: "🏷️" },
  { to: "/settings",    label: "Settings",    icon: "⚙️" },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full z-30 bg-stone-900 text-white flex flex-col transition-all duration-300 ease-in-out
          ${collapsed ? "-translate-x-full lg:translate-x-0 lg:w-16" : "translate-x-0 w-64"}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-stone-700 min-h-[65px]">
          <div className="flex-shrink-0 w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-stone-900 font-black text-sm">SF</span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="font-extrabold tracking-tight text-white leading-none">ShopForge</p>
              <p className="text-xs text-stone-400 font-medium tracking-wider uppercase mt-0.5">Admin Panel</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-0.5 px-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
                    ${isActive
                      ? "bg-white text-stone-900"
                      : "text-stone-300 hover:bg-stone-800 hover:text-white"
                    }`
                  }
                >
                  <span className="text-base flex-shrink-0 w-5 text-center">{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Admin user + logout */}
        <div className="border-t border-stone-700 p-3">
          {!collapsed ? (
            <div className="flex items-center gap-2 px-1 mb-2">
              <img
                src={admin?.avatar}
                alt={admin?.name}
                className="w-8 h-8 rounded-full flex-shrink-0 bg-stone-700"
              />
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">{admin?.name}</p>
                <p className="text-xs text-stone-400 truncate">{admin?.role}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-2">
              <img src={admin?.avatar} alt="" className="w-8 h-8 rounded-full bg-stone-700" />
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-stone-400 hover:bg-stone-800 hover:text-white text-sm font-medium transition-colors"
          >
            <span className="flex-shrink-0">🚪</span>
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
