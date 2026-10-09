import React, { useState } from "react";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import { useToast } from "../context/ToastContext";
import { promoCodes as initialCodes } from "../data/adminData";

const EMPTY_FORM = { code: "", discountPercent: "", description: "" };

export default function PromoCodes() {
  const { addToast } = useToast();
  const [codes, setCodes] = useState(initialCodes);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const toggleActive = (id) => {
    setCodes((prev) =>
      prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c))
    );
    const code = codes.find((c) => c.id === id);
    addToast(`Code "${code.code}" ${code.active ? "deactivated" : "activated"}.`, "success");
  };

  const deleteCode = (id) => {
    const code = codes.find((c) => c.id === id);
    setCodes((prev) => prev.filter((c) => c.id !== id));
    addToast(`Promo code "${code.code}" deleted.`, "warning");
  };

  const handleAdd = () => {
    if (!form.code.trim() || !form.discountPercent) return addToast("Code and discount % are required.", "error");
    const pct = parseInt(form.discountPercent);
    if (isNaN(pct) || pct < 1 || pct > 100) return addToast("Discount must be between 1–100%.", "error");
    if (codes.find((c) => c.code.toLowerCase() === form.code.trim().toLowerCase())) {
      return addToast("A promo code with that name already exists.", "error");
    }
    setCodes((prev) => [
      {
        id: "promo-" + Date.now(),
        code: form.code.trim().toUpperCase(),
        discountPercent: pct,
        description: form.description,
        active: true,
        usageCount: 0,
      },
      ...prev,
    ]);
    addToast(`Promo code "${form.code.toUpperCase()}" created!`, "success");
    setForm(EMPTY_FORM);
    setModalOpen(false);
  };

  const activeCodes = codes.filter((c) => c.active).length;

  return (
    <div className="space-y-6">
      {/* Header toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-sm text-stone-500">
          <span><strong className="text-stone-900">{codes.length}</strong> total codes</span>
          <span><strong className="text-emerald-700">{activeCodes}</strong> active</span>
          <span><strong className="text-stone-400">{codes.length - activeCodes}</strong> inactive</span>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setModalOpen(true); }}
          className="bg-stone-900 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-stone-700 transition-colors flex items-center gap-2"
        >
          + New Code
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100">
          <h3 className="font-extrabold text-stone-900 tracking-tight">Promo Codes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100 text-left">
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Code</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Discount</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Description</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Usage</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Status</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((c, i) => (
                <tr key={c.id} className={`border-b border-stone-50 hover:bg-stone-50 transition-colors ${i % 2 !== 0 ? "bg-stone-50/40" : ""}`}>
                  <td className="px-6 py-3">
                    <code className="font-black text-stone-900 tracking-widest text-sm bg-stone-100 px-2 py-0.5 rounded-md">{c.code}</code>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-extrabold text-stone-900 text-lg">{c.discountPercent}<span className="text-sm font-bold text-stone-500">%</span></span>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{c.description || "—"}</td>
                  <td className="px-4 py-3 text-stone-700 font-semibold">{c.usageCount.toLocaleString()} uses</td>
                  <td className="px-4 py-3">
                    <Badge type={c.active ? "active" : "inactive"} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleActive(c.id)}
                        className={`text-xs font-bold border px-2.5 py-1 rounded-lg transition-colors ${
                          c.active
                            ? "text-amber-700 border-amber-200 hover:bg-amber-50"
                            : "text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                        }`}
                      >
                        {c.active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => deleteCode(c.id)}
                        className="text-xs font-semibold text-red-500 hover:text-red-700 border border-red-100 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Code Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Promo Code" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">Code *</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="e.g. SUMMER30"
              className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-stone-900 bg-stone-50"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">Discount (%) *</label>
            <input
              type="number"
              min="1"
              max="100"
              value={form.discountPercent}
              onChange={(e) => setForm((f) => ({ ...f, discountPercent: e.target.value }))}
              placeholder="10"
              className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 bg-stone-50"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="e.g. Summer sale — 30% off"
              className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 bg-stone-50"
            />
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={() => setModalOpen(false)} className="text-sm font-semibold text-stone-600 border border-stone-200 px-4 py-2 rounded-xl hover:bg-stone-50 transition-colors">Cancel</button>
          <button onClick={handleAdd} className="text-sm font-bold bg-stone-900 text-white px-5 py-2 rounded-xl hover:bg-stone-700 transition-colors">Create Code</button>
        </div>
      </Modal>
    </div>
  );
}
