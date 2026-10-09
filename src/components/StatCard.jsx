import React from "react";

export default function StatCard({ label, value, change, icon, prefix = "", suffix = "" }) {
  const isPositive = change >= 0;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-stone-500">{label}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div>
        <p className="text-3xl font-extrabold tracking-tight text-stone-900">
          {prefix}{typeof value === "number" ? value.toLocaleString() : value}{suffix}
        </p>
        {change !== undefined && (
          <p className={`text-xs font-medium mt-1 flex items-center gap-1 ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
            <span>{isPositive ? "▲" : "▼"}</span>
            <span>{Math.abs(change)}% vs last month</span>
          </p>
        )}
      </div>
    </div>
  );
}
