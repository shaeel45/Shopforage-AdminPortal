import React from "react";

const STATUS_CONFIG = {
  // Order statuses
  pending:    { label: "Pending",    bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200"  },
  processing: { label: "Processing", bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200"   },
  shipped:    { label: "Shipped",    bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-200" },
  delivered:  { label: "Delivered",  bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200"},
  cancelled:  { label: "Cancelled",  bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200"    },
  // Stock levels
  low:        { label: "Low Stock",  bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200"    },
  medium:     { label: "Medium",     bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200"  },
  high:       { label: "In Stock",   bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200"},
  // Generic
  active:     { label: "Active",     bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200"},
  inactive:   { label: "Inactive",   bg: "bg-stone-100",  text: "text-stone-500",   border: "border-stone-200"  },
  new:        { label: "New",        bg: "bg-stone-900",  text: "text-white",       border: "border-stone-900"  },
  trending:   { label: "Trending",   bg: "bg-stone-100",  text: "text-stone-700",   border: "border-stone-200"  },
};

export default function Badge({ type, customLabel }) {
  const config = STATUS_CONFIG[type] ?? { label: type, bg: "bg-stone-100", text: "text-stone-700", border: "border-stone-200" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}>
      {customLabel ?? config.label}
    </span>
  );
}
