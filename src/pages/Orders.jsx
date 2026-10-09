import React, { useState } from "react";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import { useToast } from "../context/ToastContext";
import { orders as initialOrders } from "../data/adminData";

const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

export default function Orders() {
  const { addToast } = useToast();
  const [orders, setOrders] = useState(initialOrders);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [viewOrder, setViewOrder] = useState(null);

  const filtered = orders.filter((o) => {
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const matchSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const updateStatus = (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    addToast(`Order ${orderId} status updated to "${newStatus}".`, "success");
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order ID or customer…"
          className="px-4 py-2 text-sm border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 flex-1 max-w-xs"
        />
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${statusFilter === "all" ? "bg-stone-900 text-white border-stone-900" : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"}`}
          >
            All
          </button>
          {ORDER_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors capitalize ${statusFilter === s ? "bg-stone-900 text-white border-stone-900" : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-extrabold text-stone-900 tracking-tight">Orders</h3>
          <span className="text-xs text-stone-500 font-medium">{filtered.length} orders</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100 text-left">
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Order ID</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Customer</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Date</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Items</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Total</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Status</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order, i) => (
                <tr key={order.id} className={`border-b border-stone-50 hover:bg-stone-50 transition-colors ${i % 2 !== 0 ? "bg-stone-50/40" : ""}`}>
                  <td className="px-6 py-3 font-semibold text-stone-900">{order.id}</td>
                  <td className="px-4 py-3 text-stone-700">{order.customerName}</td>
                  <td className="px-4 py-3 text-stone-500 text-xs">{order.date}</td>
                  <td className="px-4 py-3 text-stone-600">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</td>
                  <td className="px-4 py-3 font-bold text-stone-900">${order.total.toFixed(2)}</td>
                  <td className="px-4 py-3"><Badge type={order.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setViewOrder(order)}
                        className="text-xs font-semibold text-stone-600 hover:text-stone-900 border border-stone-200 px-2.5 py-1 rounded-lg hover:bg-stone-50 transition-colors"
                      >
                        View
                      </button>
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className="text-xs border border-stone-200 rounded-lg px-2 py-1 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-900 capitalize"
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s} className="capitalize">{s}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-stone-400 text-sm">No orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      <Modal open={!!viewOrder} onClose={() => setViewOrder(null)} title={`Order ${viewOrder?.id}`} size="md">
        {viewOrder && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Customer</p>
                <p className="font-semibold text-stone-900 mt-1">{viewOrder.customerName}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Date</p>
                <p className="font-semibold text-stone-900 mt-1">{viewOrder.date}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Payment</p>
                <p className="font-semibold text-stone-900 mt-1">{viewOrder.paymentMethod}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Status</p>
                <div className="mt-1"><Badge type={viewOrder.status} /></div>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Items</p>
              <div className="border border-stone-100 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-100">
                      <th className="text-left px-4 py-2 text-xs font-bold text-stone-500 uppercase">Product</th>
                      <th className="text-right px-4 py-2 text-xs font-bold text-stone-500 uppercase">Qty</th>
                      <th className="text-right px-4 py-2 text-xs font-bold text-stone-500 uppercase">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewOrder.items.map((item, i) => (
                      <tr key={i} className="border-b border-stone-50 last:border-0">
                        <td className="px-4 py-2.5 text-stone-700">{item.name}</td>
                        <td className="px-4 py-2.5 text-right text-stone-600">{item.qty}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-stone-900">${(item.price * item.qty).toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="bg-stone-50">
                      <td colSpan={2} className="px-4 py-2.5 text-right font-bold text-stone-900 text-xs uppercase tracking-wider">Total</td>
                      <td className="px-4 py-2.5 text-right font-extrabold text-stone-900">${viewOrder.total.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Update Status</p>
              <div className="flex gap-2 flex-wrap">
                {ORDER_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => { updateStatus(viewOrder.id, s); setViewOrder((prev) => ({ ...prev, status: s })); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border capitalize transition-colors ${viewOrder.status === s ? "bg-stone-900 text-white border-stone-900" : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
