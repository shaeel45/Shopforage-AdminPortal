import React, { useState } from "react";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import { customers, orders } from "../data/adminData";

export default function Customers() {
  const [search, setSearch] = useState("");
  const [viewCustomer, setViewCustomer] = useState(null);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  const customerOrders = viewCustomer
    ? orders.filter((o) => o.customerId === viewCustomer.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customers by name or email…"
          className="px-4 py-2 text-sm border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 w-80"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-extrabold text-stone-900 tracking-tight">Customers</h3>
          <span className="text-xs text-stone-500 font-medium">{filtered.length} customers</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100 text-left">
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Customer</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Email</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Joined</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Orders</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Total Spent</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id} className={`border-b border-stone-50 hover:bg-stone-50 transition-colors ${i % 2 !== 0 ? "bg-stone-50/40" : ""}`}>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <img src={c.avatar} alt={c.name} className="w-8 h-8 rounded-full bg-stone-100 flex-shrink-0" />
                      <span className="font-semibold text-stone-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone-500">{c.email}</td>
                  <td className="px-4 py-3 text-stone-500 text-xs">{c.joinedDate}</td>
                  <td className="px-4 py-3 text-stone-700 font-semibold">{c.orderCount}</td>
                  <td className="px-4 py-3 font-bold text-stone-900">${c.totalSpent.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setViewCustomer(c)}
                      className="text-xs font-semibold text-stone-600 hover:text-stone-900 border border-stone-200 px-2.5 py-1 rounded-lg hover:bg-stone-50 transition-colors"
                    >
                      View Orders
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-stone-400 text-sm">No customers found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Order History Modal */}
      <Modal open={!!viewCustomer} onClose={() => setViewCustomer(null)} title={`${viewCustomer?.name}'s Orders`} size="lg">
        {viewCustomer && (
          <div className="space-y-5">
            {/* Customer Summary */}
            <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl border border-stone-100">
              <img src={viewCustomer.avatar} alt={viewCustomer.name} className="w-14 h-14 rounded-full bg-stone-200" />
              <div>
                <p className="font-extrabold text-stone-900">{viewCustomer.name}</p>
                <p className="text-sm text-stone-500">{viewCustomer.email}</p>
                <div className="flex gap-4 mt-1 text-xs text-stone-500">
                  <span>Joined: <strong className="text-stone-700">{viewCustomer.joinedDate}</strong></span>
                  <span>Orders: <strong className="text-stone-700">{viewCustomer.orderCount}</strong></span>
                  <span>Total Spent: <strong className="text-stone-900">${viewCustomer.totalSpent.toFixed(2)}</strong></span>
                </div>
              </div>
            </div>

            {/* Orders Table */}
            {customerOrders.length > 0 ? (
              <div className="border border-stone-100 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-100">
                      <th className="text-left px-4 py-2.5 text-xs font-bold text-stone-500 uppercase">Order ID</th>
                      <th className="text-left px-4 py-2.5 text-xs font-bold text-stone-500 uppercase">Date</th>
                      <th className="text-left px-4 py-2.5 text-xs font-bold text-stone-500 uppercase">Total</th>
                      <th className="text-left px-4 py-2.5 text-xs font-bold text-stone-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerOrders.map((o, i) => (
                      <tr key={o.id} className={`border-b border-stone-50 last:border-0 ${i % 2 !== 0 ? "bg-stone-50/40" : ""}`}>
                        <td className="px-4 py-2.5 font-semibold text-stone-900">{o.id}</td>
                        <td className="px-4 py-2.5 text-stone-500">{o.date}</td>
                        <td className="px-4 py-2.5 font-bold text-stone-900">${o.total.toFixed(2)}</td>
                        <td className="px-4 py-2.5"><Badge type={o.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-stone-400 text-center py-8">No orders found for this customer.</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
