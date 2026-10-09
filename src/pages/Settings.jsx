import React, { useState } from "react";
import { useToast } from "../context/ToastContext";
import { defaultSettings } from "../data/adminData";

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export default function Settings() {
  const { addToast } = useToast();
  const [settings, setSettings] = useState(defaultSettings);
  const [dirty, setDirty] = useState(false);

  const update = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    // In a real app this would hit an API
    setDirty(false);
    addToast("Store settings saved successfully!", "success");
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    setDirty(false);
    addToast("Settings reset to defaults.", "info");
  };

  return (
    <div className="max-w-3xl space-y-8">
      <form onSubmit={handleSave} className="space-y-6">
        {/* Store Identity */}
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 bg-stone-50">
            <h3 className="font-extrabold text-stone-900 tracking-tight">🏪 Store Identity</h3>
            <p className="text-xs text-stone-500 mt-0.5">Basic branding information for your store.</p>
          </div>
          <div className="p-6 space-y-5">
            <Field label="Store Name">
              <input
                type="text"
                value={settings.storeName}
                onChange={(e) => update("storeName", e.target.value)}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 bg-stone-50"
              />
            </Field>
            <Field label="Store Tagline">
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => update("tagline", e.target.value)}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 bg-stone-50"
              />
            </Field>
            <Field label="Support Email">
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => update("supportEmail", e.target.value)}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 bg-stone-50"
              />
            </Field>
          </div>
        </div>

        {/* Promotions & Shipping */}
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 bg-stone-50">
            <h3 className="font-extrabold text-stone-900 tracking-tight">🚚 Promotions & Shipping</h3>
            <p className="text-xs text-stone-500 mt-0.5">Configure promotional banners and shipping rules.</p>
          </div>
          <div className="p-6 space-y-5">
            <Field label="Top Banner Text">
              <textarea
                value={settings.bannerText}
                onChange={(e) => update("bannerText", e.target.value)}
                rows={2}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 bg-stone-50 resize-none"
              />
              <p className="text-xs text-stone-400 mt-1">This is displayed in the top banner on the storefront.</p>
            </Field>
            <Field label="Free Shipping Threshold ($)">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-medium text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  value={settings.freeShippingThreshold}
                  onChange={(e) => update("freeShippingThreshold", parseFloat(e.target.value))}
                  className="w-full pl-7 pr-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 bg-stone-50"
                />
              </div>
              <p className="text-xs text-stone-400 mt-1">Orders above this amount qualify for free shipping.</p>
            </Field>
            <Field label="Currency">
              <select
                value={settings.currency}
                onChange={(e) => update("currency", e.target.value)}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 bg-stone-50"
              >
                {["USD", "EUR", "GBP", "CAD", "AUD"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-stone-900 rounded-2xl overflow-hidden">
          <div className="px-6 py-3 border-b border-stone-700">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Banner Preview</p>
          </div>
          <div className="px-6 py-3 text-stone-200 text-xs text-center font-medium">
            {settings.bannerText || <span className="text-stone-500 italic">No banner text set.</span>}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 justify-end">
          <button
            type="button"
            onClick={handleReset}
            className="text-sm font-semibold text-stone-600 border border-stone-200 px-4 py-2 rounded-xl hover:bg-stone-50 transition-colors"
          >
            Reset to Defaults
          </button>
          <button
            type="submit"
            disabled={!dirty}
            className="text-sm font-bold bg-stone-900 text-white px-6 py-2 rounded-xl hover:bg-stone-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {dirty ? "💾 Save Settings" : "✓ Saved"}
          </button>
        </div>
      </form>
    </div>
  );
}
