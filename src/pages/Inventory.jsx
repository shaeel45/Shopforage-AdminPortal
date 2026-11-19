import React, { useCallback, useEffect, useMemo, useState } from "react";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import { useToast } from "../context/ToastContext";
import { useAdminAuth } from "../context/AdminAuthContext";
import {
  adjustStock,
  createInventory,
  deleteInventory,
  fetchInventory,
  fetchInventoryTransactions,
  fetchProducts,
  reconcileStock,
  resolveProductImage,
} from "../api";

const PAGE_SIZES = [10, 20, 50];

const TXN_TYPES = [
  { value: "RESTOCK", label: "Restock (+)", sign: 1 },
  { value: "SALE", label: "Sale (−)", sign: -1 },
  { value: "RETURN", label: "Return (+)", sign: 1 },
  { value: "DAMAGE", label: "Damage (−)", sign: -1 },
  { value: "ADJUSTMENT", label: "Manual adjustment (±)", sign: 0 },
];

const TXN_BADGE = {
  RESTOCK: "bg-emerald-50 text-emerald-700 border-emerald-200",
  SALE: "bg-blue-50 text-blue-700 border-blue-200",
  RETURN: "bg-violet-50 text-violet-700 border-violet-200",
  DAMAGE: "bg-red-50 text-red-700 border-red-200",
  ADJUSTMENT: "bg-amber-50 text-amber-700 border-amber-200",
};

const fieldClass =
  "w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 bg-stone-50";

const labelClass =
  "block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5";

function stockLevel(quantity, threshold) {
  if (quantity <= 0) return "out";
  if (quantity <= threshold) return "low";
  if (quantity < Math.max(threshold * 4, 1)) return "medium";
  return "high";
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function StockBar({ quantity, threshold }) {
  const ceiling = Math.max(threshold * 4, 1);
  const pct = Math.max(0, Math.min(100, Math.round((quantity / ceiling) * 100)));
  const color =
    quantity <= 0
      ? "bg-stone-900"
      : quantity <= threshold
      ? "bg-red-500"
      : quantity < ceiling
      ? "bg-amber-400"
      : "bg-emerald-500";

  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-stone-600 w-12 text-right">
        {quantity}
      </span>
    </div>
  );
}

export default function Inventory() {
  const { addToast } = useToast();
  const { admin } = useAdminAuth();

  const [items, setItems] = useState([]);
  const [productMap, setProductMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reconciling, setReconciling] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [addOpen, setAddOpen] = useState(false);
  const [addSaving, setAddSaving] = useState(false);
  const [addForm, setAddForm] = useState({
    productId: "",
    quantity: "0",
    warehouse: "default",
    lowStockThreshold: "10",
  });

  const [adjustTarget, setAdjustTarget] = useState(null);
  const [adjusting, setAdjusting] = useState(false);
  const [adjustForm, setAdjustForm] = useState({
    type: "RESTOCK",
    amount: "",
    reason: "",
    referenceId: "",
    performedBy: "",
  });

  const [historyTarget, setHistoryTarget] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyType, setHistoryType] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [history, setHistory] = useState({
    data: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const fetchData = useCallback(async () => {
    const [inventory, products] = await Promise.all([
      fetchInventory({ all: "true" }),
      fetchProducts({ all: "true" }),
    ]);

    const map = {};
    (products || []).forEach((product) => {
      map[String(product.id)] = product;
    });

    return {
      inventory: Array.isArray(inventory) ? inventory : [],
      map,
    };
  }, []);

  const applyData = useCallback(({ inventory, map }) => {
    setProductMap(map);
    setItems(inventory);
    setLoadError("");
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      applyData(await fetchData());
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }, [applyData, fetchData]);

  const runReconcile = async () => {
    const confirmed = window.confirm(
      "Compare every product's stock with the inventory service and fix any drift? Inventory is treated as the source of truth."
    );
    if (!confirmed) return;

    setReconciling(true);
    try {
      const result = await reconcileStock({ fix: true });
      addToast(
        `Checked ${result.checkedProducts} products — fixed ${result.discrepanciesFixed} of ${result.discrepanciesFound} discrepancies.`,
        result.discrepanciesFound > 0 ? "warning" : "success"
      );
      await loadData();
    } catch (error) {
      addToast(error.message, "error");
    } finally {
      setReconciling(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    fetchData()
      .then((result) => {
        if (!cancelled) applyData(result);
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [applyData, fetchData]);

  const rows = useMemo(
    () =>
      items.map((item) => {
        const product = productMap[String(item.productId)];
        const imageURL = product?.imageURL || product?.image || "";
        return {
          ...item,
          productName: product?.name || `Product #${item.productId}`,
          category: product?.category || "—",
          image: imageURL ? resolveProductImage(imageURL) : "",
          available: Math.max(0, item.quantity - item.reservedQuantity),
        };
      }),
    [items, productMap]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchSearch =
        !term ||
        row.productName.toLowerCase().includes(term) ||
        String(row.productId).includes(term);
      if (!matchSearch) return false;

      if (filter === "out") return row.quantity <= 0;
      if (filter === "low")
        return row.quantity > 0 && row.quantity <= row.lowStockThreshold;
      if (filter === "medium")
        return (
          row.quantity > row.lowStockThreshold &&
          row.quantity < Math.max(row.lowStockThreshold * 4, 1)
        );
      if (filter === "high")
        return row.quantity >= Math.max(row.lowStockThreshold * 4, 1);
      return true;
    });
  }, [rows, search, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const stats = useMemo(() => {
    const low = rows.filter(
      (row) => row.quantity > 0 && row.quantity <= row.lowStockThreshold
    ).length;
    const out = rows.filter((row) => row.quantity <= 0).length;
    const reserved = rows.reduce(
      (sum, row) => sum + Number(row.reservedQuantity || 0),
      0
    );
    return { total: rows.length, low, out, reserved };
  }, [rows]);

  const availableProducts = useMemo(() => {
    const used = new Set(items.map((item) => String(item.productId)));
    return Object.values(productMap)
      .filter((product) => !used.has(String(product.id)))
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }, [items, productMap]);

  // --- Add inventory record ---
  const openAdd = () => {
    setAddForm({
      productId: "",
      quantity: "0",
      warehouse: "default",
      lowStockThreshold: "10",
    });
    setAddOpen(true);
  };

  const submitAdd = async () => {
    if (!addForm.productId) {
      addToast("Select a product first.", "error");
      return;
    }

    const quantity = Number(addForm.quantity);
    const threshold = Number(addForm.lowStockThreshold);
    if (!Number.isInteger(quantity) || quantity < 0) {
      addToast("Quantity must be a whole number of 0 or more.", "error");
      return;
    }
    if (!Number.isInteger(threshold) || threshold < 0) {
      addToast("Low stock threshold must be a whole number of 0 or more.", "error");
      return;
    }

    setAddSaving(true);
    try {
      await createInventory({
        productId: Number(addForm.productId),
        quantity,
        warehouse: addForm.warehouse.trim() || "default",
        lowStockThreshold: threshold,
      });
      setAddOpen(false);
      addToast("Inventory record created.", "success");
      await loadData();
    } catch (error) {
      addToast(error.message, "error");
    } finally {
      setAddSaving(false);
    }
  };

  // --- Adjust stock ---
  const openAdjust = (row) => {
    setAdjustTarget(row);
    setAdjustForm({
      type: "RESTOCK",
      amount: "",
      reason: "",
      referenceId: "",
      performedBy: admin?.email || "",
    });
  };

  const closeAdjust = () => {
    if (adjusting) return;
    setAdjustTarget(null);
  };

  const txnMeta = TXN_TYPES.find((t) => t.value === adjustForm.type) ?? TXN_TYPES[0];
  const rawAmount = Number(adjustForm.amount);
  const amountValid =
    adjustForm.amount !== "" &&
    Number.isFinite(rawAmount) &&
    Number.isInteger(rawAmount) &&
    rawAmount !== 0;

  const signedChange = !amountValid
    ? 0
    : adjustForm.type === "ADJUSTMENT"
    ? rawAmount
    : Math.abs(rawAmount) * txnMeta.sign;

  const projectedQuantity = adjustTarget
    ? adjustTarget.quantity + signedChange
    : 0;
  const projectedInvalid =
    adjustTarget &&
    amountValid &&
    (projectedQuantity < 0 ||
      projectedQuantity < Number(adjustTarget.reservedQuantity || 0));

  const submitAdjust = async () => {
    if (!adjustTarget) return;
    if (!amountValid) {
      addToast("Enter a non-zero whole number for the quantity change.", "error");
      return;
    }
    if (projectedInvalid) {
      addToast(
        projectedQuantity < 0
          ? "Adjustment would make on-hand stock negative."
          : `Adjustment would drop on-hand stock below the reserved quantity (${adjustTarget.reservedQuantity}).`,
        "error"
      );
      return;
    }

    setAdjusting(true);
    try {
      await adjustStock({
        productId: adjustTarget.productId,
        changeAmount: signedChange,
        type: adjustForm.type,
        performedBy: adjustForm.performedBy.trim() || undefined,
        reason: adjustForm.reason.trim() || undefined,
        referenceId: adjustForm.referenceId.trim() || undefined,
      });
      setAdjustTarget(null);
      addToast(
        `Stock ${signedChange > 0 ? "increased" : "decreased"} by ${Math.abs(
          signedChange
        )} for ${adjustTarget.productName}.`,
        "success"
      );
      await loadData();
    } catch (error) {
      addToast(error.message, "error");
    } finally {
      setAdjusting(false);
    }
  };

  const removeRecord = async () => {
    if (!adjustTarget) return;
    const confirmed = window.confirm(
      `Remove the inventory record for "${adjustTarget.productName}"? Its transaction history will be deleted too.`
    );
    if (!confirmed) return;

    setAdjusting(true);
    try {
      await deleteInventory(adjustTarget.id);
      setAdjustTarget(null);
      addToast("Inventory record removed.", "warning");
      await loadData();
    } catch (error) {
      addToast(error.message, "error");
    } finally {
      setAdjusting(false);
    }
  };

  // --- History ---
  const loadHistory = useCallback(
    async (row, nextPage = 1, type = "") => {
      if (!row) return;
      setHistoryLoading(true);
      try {
        const result = await fetchInventoryTransactions(row.id, {
          page: nextPage,
          limit: 10,
          ...(type ? { type } : {}),
        });
        setHistory(result);
        setHistoryPage(nextPage);
      } catch (error) {
        addToast(error.message, "error");
      } finally {
        setHistoryLoading(false);
      }
    },
    [addToast]
  );

  const openHistory = (row) => {
    setHistoryTarget(row);
    setHistoryType("");
    setHistory({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
    loadHistory(row, 1, "");
  };

  const changeHistoryType = (type) => {
    setHistoryType(type);
    loadHistory(historyTarget, 1, type);
  };

  const lowAlert = stats.low + stats.out;

  return (
    <div className="space-y-6">
      {lowAlert > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 flex items-center gap-3 text-sm text-red-700">
          <span className="text-xl">⚠️</span>
          <span>
            <strong>{stats.out}</strong> out of stock and <strong>{stats.low}</strong>{" "}
            low on stock (at or below their threshold). Restock or adjust them below.
          </span>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Tracked SKUs", value: stats.total },
          { label: "Low stock", value: stats.low },
          { label: "Out of stock", value: stats.out },
          { label: "Reserved units", value: stats.reserved },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl border border-stone-200 px-5 py-4"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
              {card.label}
            </p>
            <p className="text-2xl font-extrabold text-stone-900 mt-1">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by product name or ID…"
            className="px-4 py-2 text-sm border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 w-full sm:w-72"
          />
          <div className="flex gap-2 flex-wrap">
            {[
              ["all", "All"],
              ["low", "Low"],
              ["medium", "Medium"],
              ["high", "In Stock"],
              ["out", "Out"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => {
                  setFilter(value);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  filter === value
                    ? "bg-stone-900 text-white border-stone-900"
                    : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
            className="px-3 py-2 text-sm border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-stone-900"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
          <button
            onClick={runReconcile}
            disabled={reconciling}
            title="Compare product stock with inventory and repair drift"
            className="bg-white text-stone-700 text-sm font-bold px-4 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors disabled:opacity-50"
          >
            {reconciling ? "Reconciling…" : "Reconcile"}
          </button>
          <button
            onClick={openAdd}
            className="bg-stone-900 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-stone-700 transition-colors"
          >
            + Add Stock Record
          </button>
        </div>
      </div>

      {loadError && (
        <div className="px-6 py-4 text-sm text-red-700 bg-red-50 rounded-xl flex items-center justify-between gap-4">
          <span>Could not load inventory: {loadError}</span>
          <button onClick={loadData} className="font-bold underline">
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-extrabold text-stone-900 tracking-tight">
            Stock Levels
          </h3>
          <span className="text-xs text-stone-500 font-medium">
            {filtered.length} {filtered.length === 1 ? "product" : "products"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100 text-left">
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">
                  Product
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">
                  Category
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">
                  On hand
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">
                  Updated
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-stone-400 text-sm"
                  >
                    Loading inventory…
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-stone-50 hover:bg-stone-50 transition-colors"
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        {row.image ? (
                          <img
                            src={row.image}
                            alt={row.productName}
                            className="w-10 h-10 rounded-lg object-cover bg-stone-100 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-stone-100 flex-shrink-0" />
                        )}
                        <div>
                          <p className="font-semibold text-stone-900 leading-tight">
                            {row.productName}
                          </p>
                          <p className="text-xs text-stone-400">
                            #{row.productId} · {row.warehouse}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-stone-600 capitalize">
                      {row.category}
                    </td>
                    <td className="px-4 py-3">
                      <StockBar
                        quantity={row.quantity}
                        threshold={row.lowStockThreshold}
                      />
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-stone-400">
                        <span>Available: {row.available}</span>
                        {row.reservedQuantity > 0 && (
                          <span className="text-amber-600">
                            Reserved: {row.reservedQuantity}
                          </span>
                        )}
                        <span>Threshold: {row.lowStockThreshold}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        type={stockLevel(row.quantity, row.lowStockThreshold)}
                      />
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-500 whitespace-nowrap">
                      {formatDate(row.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openAdjust(row)}
                          className="text-xs font-bold text-stone-700 border border-stone-200 px-2.5 py-1 rounded-lg hover:bg-stone-100 transition-colors"
                        >
                          Adjust
                        </button>
                        <button
                          onClick={() => openHistory(row)}
                          className="text-xs font-semibold text-stone-600 border border-stone-200 px-2.5 py-1 rounded-lg hover:bg-stone-100 transition-colors"
                        >
                          History
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-sm text-stone-400">
                      {items.length === 0
                        ? "No inventory records yet."
                        : "No products match the current filters."}
                    </p>
                    {items.length === 0 && (
                      <button
                        onClick={openAdd}
                        className="mt-3 text-xs font-bold text-stone-700 underline underline-offset-2"
                      >
                        Add your first stock record
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-stone-500 font-medium">
            {filtered.length === 0
              ? "0 results"
              : `Showing ${(safePage - 1) * pageSize + 1}–${Math.min(
                  safePage * pageSize,
                  filtered.length
                )} of ${filtered.length}`}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={safePage <= 1}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border border-stone-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50"
            >
              Previous
            </button>
            <span className="text-xs font-semibold text-stone-600">
              Page {safePage} / {totalPages}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={safePage >= totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border border-stone-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add inventory record modal */}
      <Modal
        open={addOpen}
        onClose={() => !addSaving && setAddOpen(false)}
        title="Add Stock Record"
      >
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Product</label>
            <select
              value={addForm.productId}
              onChange={(event) =>
                setAddForm((prev) => ({
                  ...prev,
                  productId: event.target.value,
                }))
              }
              className={fieldClass}
            >
              <option value="">Select a product…</option>
              {availableProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} (#{product.id})
                </option>
              ))}
            </select>
            {availableProducts.length === 0 && (
              <p className="mt-2 text-xs text-amber-600">
                Every product already has an inventory record.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Initial quantity</label>
              <input
                type="number"
                min="0"
                step="1"
                value={addForm.quantity}
                onChange={(event) =>
                  setAddForm((prev) => ({
                    ...prev,
                    quantity: event.target.value,
                  }))
                }
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Low stock threshold</label>
              <input
                type="number"
                min="0"
                step="1"
                value={addForm.lowStockThreshold}
                onChange={(event) =>
                  setAddForm((prev) => ({
                    ...prev,
                    lowStockThreshold: event.target.value,
                  }))
                }
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Warehouse</label>
            <input
              value={addForm.warehouse}
              onChange={(event) =>
                setAddForm((prev) => ({
                  ...prev,
                  warehouse: event.target.value,
                }))
              }
              placeholder="default"
              className={fieldClass}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setAddOpen(false)}
              disabled={addSaving}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={submitAdd}
              disabled={addSaving || !addForm.productId}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-stone-900 text-white hover:bg-stone-700 disabled:opacity-50"
            >
              {addSaving ? "Creating…" : "Create record"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Adjust stock modal */}
      <Modal
        open={Boolean(adjustTarget)}
        onClose={closeAdjust}
        title="Adjust Stock"
      >
        {adjustTarget && (
          <div className="space-y-4">
            <div className="bg-stone-50 rounded-xl px-4 py-3 text-sm">
              <p className="font-bold text-stone-900">
                {adjustTarget.productName}
              </p>
              <p className="text-xs text-stone-500 mt-1">
                On hand: <strong>{adjustTarget.quantity}</strong> · Reserved:{" "}
                <strong>{adjustTarget.reservedQuantity}</strong> · Available:{" "}
                <strong>{adjustTarget.available}</strong> · Threshold:{" "}
                <strong>{adjustTarget.lowStockThreshold}</strong>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Transaction type</label>
                <select
                  value={adjustForm.type}
                  onChange={(event) =>
                    setAdjustForm((prev) => ({
                      ...prev,
                      type: event.target.value,
                    }))
                  }
                  className={fieldClass}
                >
                  {TXN_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>
                  Quantity change{" "}
                  {adjustForm.type === "ADJUSTMENT" ? "(signed)" : ""}
                </label>
                <input
                  type="number"
                  step="1"
                  value={adjustForm.amount}
                  onChange={(event) =>
                    setAdjustForm((prev) => ({
                      ...prev,
                      amount: event.target.value,
                    }))
                  }
                  placeholder={
                    adjustForm.type === "ADJUSTMENT" ? "e.g. -5 or 12" : "e.g. 10"
                  }
                  className={fieldClass}
                />
              </div>
            </div>

            {amountValid && (
              <div
                className={`rounded-xl px-4 py-3 text-sm border ${
                  projectedInvalid
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-emerald-50 border-emerald-200 text-emerald-700"
                }`}
              >
                On hand will go from{" "}
                <strong>{adjustTarget.quantity}</strong> to{" "}
                <strong>{projectedQuantity}</strong> (
                {signedChange > 0 ? "+" : ""}
                {signedChange})
                {projectedInvalid && (
                  <span className="block mt-1 text-xs font-semibold">
                    {projectedQuantity < 0
                      ? "On-hand stock cannot be negative."
                      : `Cannot go below the reserved quantity (${adjustTarget.reservedQuantity}).`}
                  </span>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Performed by</label>
                <input
                  value={adjustForm.performedBy}
                  onChange={(event) =>
                    setAdjustForm((prev) => ({
                      ...prev,
                      performedBy: event.target.value,
                    }))
                  }
                  placeholder="admin@shop.com"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className={labelClass}>Reference ID</label>
                <input
                  value={adjustForm.referenceId}
                  onChange={(event) =>
                    setAdjustForm((prev) => ({
                      ...prev,
                      referenceId: event.target.value,
                    }))
                  }
                  placeholder="Order / PO / invoice #"
                  className={fieldClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Reason</label>
              <input
                value={adjustForm.reason}
                onChange={(event) =>
                  setAdjustForm((prev) => ({
                    ...prev,
                    reason: event.target.value,
                  }))
                }
                placeholder="e.g. Supplier delivery PO-1042"
                className={fieldClass}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={removeRecord}
                disabled={adjusting}
                className="text-xs font-semibold text-red-600 hover:text-red-800 underline underline-offset-2 disabled:opacity-50"
              >
                Remove record
              </button>
              <div className="flex gap-2">
                <button
                  onClick={closeAdjust}
                  disabled={adjusting}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitAdjust}
                  disabled={adjusting || !amountValid || projectedInvalid}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-stone-900 text-white hover:bg-stone-700 disabled:opacity-50"
                >
                  {adjusting ? "Applying…" : "Apply adjustment"}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Transaction history modal */}
      <Modal
        open={Boolean(historyTarget)}
        onClose={() => setHistoryTarget(null)}
        title={
          historyTarget
            ? `Transaction History — ${historyTarget.productName}`
            : "Transaction History"
        }
        size="lg"
      >
        {historyTarget && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2 flex-wrap">
                {[
                  ["", "All"],
                  ["RESTOCK", "Restock"],
                  ["SALE", "Sale"],
                  ["RETURN", "Return"],
                  ["DAMAGE", "Damage"],
                  ["ADJUSTMENT", "Adjustment"],
                ].map(([value, label]) => (
                  <button
                    key={value || "all"}
                    onClick={() => changeHistoryType(value)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                      historyType === value
                        ? "bg-stone-900 text-white border-stone-900"
                        : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <span className="text-xs text-stone-500 font-medium">
                {history.total} entries
              </span>
            </div>

            <div className="border border-stone-200 rounded-xl overflow-hidden">
              <div className="max-h-[52vh] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-stone-50 sticky top-0">
                    <tr className="text-left border-b border-stone-100">
                      <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                        Type
                      </th>
                      <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                        Change
                      </th>
                      <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                        Before → After
                      </th>
                      <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                        Details
                      </th>
                      <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                        When
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyLoading ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-10 text-center text-stone-400 text-sm"
                        >
                          Loading history…
                        </td>
                      </tr>
                    ) : (
                      history.data.map((txn) => (
                        <tr
                          key={txn.id}
                          className="border-b border-stone-50 last:border-0"
                        >
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                TXN_BADGE[txn.type] ||
                                "bg-stone-100 text-stone-600 border-stone-200"
                              }`}
                            >
                              {txn.type}
                            </span>
                          </td>
                          <td
                            className={`px-3 py-2 font-bold ${
                              txn.changeAmount > 0
                                ? "text-emerald-600"
                                : "text-red-600"
                            }`}
                          >
                            {txn.changeAmount > 0 ? "+" : ""}
                            {txn.changeAmount}
                          </td>
                          <td className="px-3 py-2 text-stone-600 whitespace-nowrap">
                            {txn.quantityBefore} → {txn.quantityAfter}
                          </td>
                          <td className="px-3 py-2 text-xs text-stone-500">
                            <p className="font-medium text-stone-700">
                              {txn.performedBy || "—"}
                            </p>
                            {txn.reason && <p>{txn.reason}</p>}
                            {txn.referenceId && (
                              <p className="text-stone-400">
                                Ref: {txn.referenceId}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs text-stone-500 whitespace-nowrap">
                            {formatDate(txn.createdAt)}
                          </td>
                        </tr>
                      ))
                    )}
                    {!historyLoading && history.data.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-10 text-center text-stone-400 text-sm"
                        >
                          No transactions recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-500">
                Page {history.page} / {history.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    loadHistory(
                      historyTarget,
                      Math.max(1, historyPage - 1),
                      historyType
                    )
                  }
                  disabled={historyLoading || historyPage <= 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border border-stone-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    loadHistory(
                      historyTarget,
                      Math.min(history.totalPages, historyPage + 1),
                      historyType
                    )
                  }
                  disabled={
                    historyLoading || historyPage >= history.totalPages
                  }
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border border-stone-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
