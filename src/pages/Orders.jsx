import { useCallback, useEffect, useState } from "react";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import { useToast } from "../context/ToastContext";
import { fetchOrder, fetchOrders, updateOrderStatus } from "../api";

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];
const PAGE_SIZES = [10, 20, 50];

// Mirrors the backend state machine so the UI only offers legal moves.
const NEXT_STATUSES = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

const EMPTY_STATS = {
  total: 0,
  pending: 0,
  processing: 0,
  shipped: 0,
  delivered: 0,
  cancelled: 0,
  revenue: 0,
};

// React forbids calling setState synchronously inside an effect body, so data
// loading is deferred by one microtask before it touches state.
const runAfterEffect = (task) => Promise.resolve().then(task);

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(value) {
  return `$${(Number(value) || 0).toFixed(2)}`;
}

const fieldClass =
  "px-4 py-2 text-sm border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-stone-900";

export default function Orders() {
  const { addToast } = useToast();

  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [total, setTotal] = useState(0);
  const [serverTotalPages, setServerTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [detail, setDetail] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  // Debounce the search box before hitting the API.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize, sortBy };
      if (search) params.search = search;
      if (statusFilter !== "all") params.status = statusFilter;

      const result = await fetchOrders(params);
      setRows(Array.isArray(result?.data) ? result.data : []);
      setTotal(Number(result?.total) || 0);
      setServerTotalPages(Number(result?.totalPages) || 1);
      setStats(result?.stats || EMPTY_STATS);
      setLoadError("");
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, sortBy, statusFilter]);

  useEffect(() => {
    let cancelled = false;

    runAfterEffect(async () => {
      if (cancelled) return;
      await loadData();
    });

    return () => {
      cancelled = true;
    };
  }, [loadData]);

  const totalPages = Math.max(1, serverTotalPages);
  const safePage = Math.min(page, totalPages);

  const openDetail = async (order) => {
    setDetail({ ...order, items: [], events: [] });
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const full = await fetchOrder(order.id);
      setDetail(full);
    } catch (error) {
      addToast(error.message, "error");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const changeStatus = async (order, status) => {
    if (!status || status === order.status) return;

    setBusyId(order.id);
    try {
      const updated = await updateOrderStatus(order.id, status);
      addToast(
        `Order ${updated.orderNumber} marked ${status.toLowerCase()}.`,
        "success"
      );
      setDetail((prev) =>
        prev && prev.id === updated.id ? updated : prev
      );
      await loadData();
    } catch (error) {
      addToast(error.message, "error");
    } finally {
      setBusyId(null);
    }
  };

  const nextStatuses = detail ? NEXT_STATUSES[detail.status] || [] : [];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3">
        {[
          ["Total", stats.total, "text-stone-900"],
          ["Pending", stats.pending, "text-amber-700"],
          ["Processing", stats.processing, "text-blue-700"],
          ["Shipped", stats.shipped, "text-violet-700"],
          ["Delivered", stats.delivered, "text-emerald-700"],
          ["Cancelled", stats.cancelled, "text-red-700"],
        ].map(([label, value, tone]) => (
          <div
            key={label}
            className="bg-white border border-stone-200 rounded-2xl px-4 py-3"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              {label}
            </p>
            <p className={`text-xl font-extrabold ${tone}`}>{value}</p>
          </div>
        ))}
        <div className="bg-stone-900 border border-stone-900 rounded-2xl px-4 py-3 col-span-2 sm:col-span-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
            Revenue
          </p>
          <p className="text-xl font-extrabold text-white">
            {formatMoney(stats.revenue)}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search order #, customer, email or phone…"
          className={`${fieldClass} flex-1 max-w-sm`}
        />
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => {
              setStatusFilter("all");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              statusFilter === "all"
                ? "bg-stone-900 text-white border-stone-900"
                : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
            }`}
          >
            All
          </button>
          {STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors capitalize ${
                statusFilter === status
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={(event) => {
            setSortBy(event.target.value);
            setPage(1);
          }}
          className="text-xs border border-stone-200 rounded-lg px-2 py-1.5 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-900"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="total_desc">Highest total</option>
          <option value="total_asc">Lowest total</option>
        </select>
      </div>

      {loadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl px-4 py-3">
          {loadError}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-extrabold text-stone-900 tracking-tight">Orders</h3>
          <span className="text-xs text-stone-500 font-medium">
            {total} order{total !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100 text-left">
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Order</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Customer</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Date</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Items</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Total</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Status</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-stone-400 text-sm">
                    Loading orders…
                  </td>
                </tr>
              )}
              {rows.map((order, index) => {
                const options = NEXT_STATUSES[order.status] || [];
                return (
                  <tr
                    key={order.id}
                    className={`border-b border-stone-50 hover:bg-stone-50 transition-colors ${
                      index % 2 !== 0 ? "bg-stone-50/40" : ""
                    }`}
                  >
                    <td className="px-6 py-3">
                      <p className="font-mono font-semibold text-stone-900">
                        {order.orderNumber}
                      </p>
                      {order.promoCode && (
                        <p className="text-[10px] text-stone-400 font-mono">
                          {order.promoCode}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-stone-800 font-medium">{order.customerName}</p>
                      <p className="text-[11px] text-stone-400">{order.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-stone-500 text-xs">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-stone-600">{order.itemCount ?? 0}</td>
                    <td className="px-4 py-3 font-bold text-stone-900">
                      {formatMoney(order.total)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge type={String(order.status).toLowerCase()} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() => openDetail(order)}
                          className="text-xs font-semibold text-stone-600 hover:text-stone-900 border border-stone-200 px-2.5 py-1 rounded-lg hover:bg-stone-50 transition-colors"
                        >
                          View
                        </button>
                        {options.length > 0 ? (
                          <select
                            value=""
                            disabled={busyId === order.id}
                            onChange={(event) => changeStatus(order, event.target.value)}
                            className="text-xs border border-stone-200 rounded-lg px-2 py-1 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-900 disabled:opacity-50"
                          >
                            <option value="">Update…</option>
                            {options.map((status) => (
                              <option key={status} value={status}>
                                {status.toLowerCase()}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[11px] text-stone-300 font-semibold">
                            final
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-stone-400 text-sm">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span>Rows per page</span>
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="border border-stone-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-stone-900"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={safePage <= 1 || loading}
              className="px-3 py-1.5 rounded-lg border border-stone-200 font-semibold text-stone-600 disabled:opacity-40 hover:bg-stone-50"
            >
              Previous
            </button>
            <span className="text-stone-500 font-medium">
              Page {safePage} of {totalPages}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={safePage >= totalPages || loading}
              className="px-3 py-1.5 rounded-lg border border-stone-200 font-semibold text-stone-600 disabled:opacity-40 hover:bg-stone-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={detail ? `Order ${detail.orderNumber}` : "Order"}
        size="lg"
      >
        {detail && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Customer</p>
                <p className="font-semibold text-stone-900 mt-1">{detail.customerName}</p>
                <p className="text-xs text-stone-500">{detail.customerEmail}</p>
                {detail.customerPhone && (
                  <p className="text-xs text-stone-500">{detail.customerPhone}</p>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Placed</p>
                <p className="font-semibold text-stone-900 mt-1">
                  {formatDateTime(detail.createdAt)}
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  {detail.paymentMethod}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Status</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge type={String(detail.status).toLowerCase()} />
                  {detail.trackingNumber && (
                    <span className="text-[11px] font-mono text-stone-400">
                      {detail.trackingNumber}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Delivery</p>
                <p className="font-semibold text-stone-900 mt-1">{detail.shippingMethod}</p>
                {detail.promoCode && (
                  <p className="text-xs text-stone-500 font-mono">{detail.promoCode}</p>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Ship To</p>
              <div className="bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-xs text-stone-600 leading-relaxed">
                <p className="font-semibold text-stone-900">{detail.shippingFullName}</p>
                <p>{detail.shippingStreet}</p>
                <p>
                  {detail.shippingCity}, {detail.shippingState} {detail.shippingPostalCode}
                </p>
                <p>{detail.shippingCountry}</p>
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
                      <th className="text-right px-4 py-2 text-xs font-bold text-stone-500 uppercase">Line total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailLoading && detail.items.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-6 text-center text-xs text-stone-400">
                          Loading items…
                        </td>
                      </tr>
                    )}
                    {detail.items.map((item) => (
                      <tr key={item.id} className="border-b border-stone-50 last:border-0">
                        <td className="px-4 py-2.5 text-stone-700">
                          {item.productName}
                          {(item.size || item.color) && (
                            <span className="block text-[10px] text-stone-400">
                              {[item.size, item.color].filter(Boolean).join(" · ")}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right text-stone-600">{item.quantity}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-stone-900">
                          {formatMoney(item.lineTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-stone-50 rounded-xl px-4 py-3 text-xs space-y-1.5">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span>{formatMoney(detail.subtotal)}</span>
              </div>
              {Number(detail.discount) > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount</span>
                  <span>-{formatMoney(detail.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-600">
                <span>Shipping</span>
                <span>{formatMoney(detail.shippingFee)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Tax</span>
                <span>{formatMoney(detail.tax)}</span>
              </div>
              <div className="flex justify-between text-stone-900 font-extrabold text-sm pt-1.5 border-t border-stone-200">
                <span>Total</span>
                <span>{formatMoney(detail.total)}</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                Status History
              </p>
              <ol className="space-y-3">
                {(detail.events || []).map((event) => (
                  <li key={event.id} className="flex gap-3">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-stone-900 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-stone-900">
                        {event.fromStatus
                          ? `${event.fromStatus} → ${event.toStatus}`
                          : `Order placed (${event.toStatus})`}
                      </p>
                      <p className="text-[11px] text-stone-500">
                        {formatDateTime(event.createdAt)}
                        {event.note ? ` · ${event.note}` : ""}
                        {event.performedBy ? ` · ${event.performedBy}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
                {detail.events?.length === 0 && (
                  <li className="text-xs text-stone-400">No status events yet.</li>
                )}
              </ol>
            </div>

            <div>
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                Update Status
              </p>
              {nextStatuses.length === 0 ? (
                <p className="text-xs text-stone-400">
                  This order is {String(detail.status).toLowerCase()} — no further changes
                  are allowed.
                </p>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  {nextStatuses.map((status) => (
                    <button
                      key={status}
                      disabled={busyId === detail.id}
                      onClick={() => changeStatus(detail, status)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold border capitalize bg-white text-stone-600 border-stone-200 hover:bg-stone-50 disabled:opacity-40 transition-colors"
                    >
                      Mark {status.toLowerCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
