import React, { useState } from "react";
import Badge from "../components/Badge";
import { useToast } from "../context/ToastContext";
import { products as initialProducts } from "../data/adminData";

function StockBar({ stock }) {
  const max = 100;
  const pct = Math.min(Math.round((stock / max) * 100), 100);
  const color = stock < 20 ? "bg-red-500" : stock < 40 ? "bg-amber-400" : "bg-emerald-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-300`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-stone-600 w-10 text-right">{stock}</span>
    </div>
  );
}

export default function Inventory() {
  const { addToast } = useToast();
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | low | medium | high
  const [editing, setEditing] = useState({}); // { [id]: newStockValue }

  const getStockLevel = (stock) => {
    if (stock < 20) return "low";
    if (stock < 40) return "medium";
    return "high";
  };

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || getStockLevel(p.stock) === filter;
    return matchSearch && matchFilter;
  });

  const startEdit = (id, currentStock) => {
    setEditing((prev) => ({ ...prev, [id]: currentStock }));
  };

  const saveStock = (id) => {
    const newStock = parseInt(editing[id]);
    if (isNaN(newStock) || newStock < 0) return addToast("Please enter a valid stock quantity.", "error");
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock: newStock } : p))
    );
    setEditing((prev) => { const copy = { ...prev }; delete copy[id]; return copy; });
    addToast("Stock updated successfully.", "success");
  };

  const cancelEdit = (id) => {
    setEditing((prev) => { const copy = { ...prev }; delete copy[id]; return copy; });
  };

  const lowCount = products.filter((p) => getStockLevel(p.stock) === "low").length;

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {lowCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 flex items-center gap-3 text-sm text-red-700">
          <span className="text-xl">⚠️</span>
          <span><strong>{lowCount} product{lowCount !== 1 ? "s" : ""}</strong> {lowCount !== 1 ? "are" : "is"} running low on stock (fewer than 20 units). Update quantities below.</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…"
          className="px-4 py-2 text-sm border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 w-72"
        />
        <div className="flex gap-2">
          {["all", "low", "medium", "high"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border capitalize transition-colors ${filter === f ? "bg-stone-900 text-white border-stone-900" : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"}`}
            >
              {f === "high" ? "In Stock" : f === "all" ? "All" : f === "low" ? "Low Stock" : "Medium"}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-extrabold text-stone-900 tracking-tight">Stock Levels</h3>
          <span className="text-xs text-stone-500 font-medium">{filtered.length} products</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100 text-left">
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Product</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Category</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500 w-48">Stock Level</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Status</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Quick Update</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const isEditing = editing[p.id] !== undefined;
                return (
                  <tr key={p.id} className={`border-b border-stone-50 hover:bg-stone-50 transition-colors ${i % 2 !== 0 ? "bg-stone-50/40" : ""}`}>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-stone-100 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-stone-900 leading-tight">{p.name}</p>
                          <p className="text-xs text-stone-400">{p.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-stone-600 capitalize">{p.category}</td>
                    <td className="px-4 py-3">
                      <StockBar stock={p.stock} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge type={getStockLevel(p.stock)} />
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={editing[p.id]}
                            onChange={(e) => setEditing((prev) => ({ ...prev, [p.id]: e.target.value }))}
                            className="w-20 px-2 py-1 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                          />
                          <button onClick={() => saveStock(p.id)} className="text-xs font-bold text-emerald-700 hover:text-emerald-900 border border-emerald-200 px-2 py-1 rounded-lg hover:bg-emerald-50 transition-colors">Save</button>
                          <button onClick={() => cancelEdit(p.id)} className="text-xs font-semibold text-stone-400 hover:text-stone-700">✕</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(p.id, p.stock)}
                          className="text-xs font-semibold text-stone-600 hover:text-stone-900 border border-stone-200 px-2.5 py-1 rounded-lg hover:bg-stone-50 transition-colors"
                        >
                          Edit Stock
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-stone-400 text-sm">No products found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
