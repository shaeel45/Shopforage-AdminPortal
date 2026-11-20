import React, { useCallback, useEffect, useMemo, useState } from "react";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import { useToast } from "../context/ToastContext";
import {
  createPromoCode,
  deletePromoCode,
  fetchPromoCodeRedemptions,
  fetchPromoCodes,
  setPromoCodeActive,
  updatePromoCode,
} from "../api";

const PAGE_SIZES = [10, 20, 50];

const EMPTY_FORM = {
  code: "",
  discountPercent: "",
  description: "",
  maxUses: "",
  minOrderAmount: "",
  expiresAt: "",
  active: true,
};

const CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{2,31}$/;

// React forbids calling setState synchronously inside an effect body, so data
// loading is deferred by one microtask before it touches state.
const runAfterEffect = (task) => Promise.resolve().then(task);

const fieldClass =
  "w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 bg-stone-50";

const labelClass =
  "block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5";

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

function toDateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function PromoCodes() {
  const { addToast } = useToast();

  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
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

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const [historyTarget, setHistoryTarget] = useState(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState({
    data: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  // Debounce the search box before hitting the API.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const applyData = useCallback((result) => {
    setRows(Array.isArray(result?.data) ? result.data : []);
    setTotal(Number(result?.total) || 0);
    setServerTotalPages(Number(result?.totalPages) || 1);
    setStats(
      result?.stats || { total: 0, active: 0, inactive: 0 }
    );
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize, sortBy };
      if (search) params.search = search;
      if (statusFilter !== "all") {
        params.active = statusFilter === "active";
      }
      applyData(await fetchPromoCodes(params));
      setLoadError("");
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }, [applyData, page, pageSize, sortBy, search, statusFilter]);

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

  // Redemption history for a single promo code.
  useEffect(() => {
    if (!historyTarget) return;

    let cancelled = false;

    runAfterEffect(async () => {
      if (cancelled) return;
      setHistoryLoading(true);
      try {
        const result = await fetchPromoCodeRedemptions(historyTarget.id, {
          page: historyPage,
          limit: 10,
        });
        if (!cancelled) setHistory(result);
      } catch (error) {
        if (!cancelled) addToast(error.message, "error");
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [historyTarget, historyPage, addToast]);

  const totalPages = Math.max(1, serverTotalPages);
  const safePage = Math.min(page, totalPages);
  const usageLabel = useCallback(
    (promo) =>
      promo.maxUses
        ? `${promo.usageCount.toLocaleString()} / ${Number(
            promo.maxUses
          ).toLocaleString()}`
        : promo.usageCount.toLocaleString(),
    []
  );

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (promo) => {
    setEditing(promo);
    setForm({
      code: promo.code,
      discountPercent: String(promo.discountPercent),
      description: promo.description || "",
      maxUses: promo.maxUses ? String(promo.maxUses) : "",
      minOrderAmount:
        promo.minOrderAmount !== undefined && Number(promo.minOrderAmount) > 0
          ? String(promo.minOrderAmount)
          : "",
      expiresAt: toDateInput(promo.expiresAt),
      active: Boolean(promo.active),
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async (event) => {
    event.preventDefault();

    const code = form.code.trim().toUpperCase();
    if (!CODE_PATTERN.test(code)) {
      addToast(
        "Code must be 3–32 characters and contain only letters, numbers, dashes, or underscores.",
        "error"
      );
      return;
    }

    const discountPercent = Number(form.discountPercent);
    if (
      !Number.isInteger(discountPercent) ||
      discountPercent < 1 ||
      discountPercent > 100
    ) {
      addToast("Discount must be a whole number between 1 and 100.", "error");
      return;
    }

    const maxUses =
      form.maxUses === "" ? null : Number(form.maxUses);
    if (
      maxUses !== null &&
      (!Number.isInteger(maxUses) || maxUses < 1)
    ) {
      addToast("Max uses must be a positive whole number.", "error");
      return;
    }

    const minOrderAmount =
      form.minOrderAmount === "" ? 0 : Number(form.minOrderAmount);
    if (Number.isNaN(minOrderAmount) || minOrderAmount < 0) {
      addToast("Minimum order amount must be 0 or more.", "error");
      return;
    }

    const payload = {
      code,
      discountPercent,
      description: form.description.trim(),
      minOrderAmount,
      maxUses,
      expiresAt: form.expiresAt
        ? new Date(`${form.expiresAt}T23:59:59`).toISOString()
        : null,
    };

    setSaving(true);
    try {
      if (editing) {
        await updatePromoCode(editing.id, {
          ...payload,
          active: Boolean(form.active),
        });
        addToast(`Promo code "${code}" updated.`, "success");
      } else {
        await createPromoCode(payload);
        addToast(`Promo code "${code}" created!`, "success");
      }

      closeForm();
      if (safePage === 1) {
        await loadData();
      } else {
        setPage(1);
      }
    } catch (error) {
      addToast(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (promo) => {
    setBusyId(promo.id);
    try {
      await setPromoCodeActive(promo.id, !promo.active);
      addToast(
        `Code "${promo.code}" ${promo.active ? "deactivated" : "activated"}.`,
        "success"
      );
      await loadData();
    } catch (error) {
      addToast(error.message, "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (promo) => {
    const confirmed = window.confirm(
      `Delete promo code "${promo.code}"? Its redemption history will also be removed.`
    );
    if (!confirmed) return;

    setBusyId(promo.id);
    try {
      await deletePromoCode(promo.id);
      addToast(`Promo code "${promo.code}" deleted.`, "warning");
      if (rows.length === 1 && safePage > 1) {
        setPage(safePage - 1);
      } else {
        await loadData();
      }
    } catch (error) {
      addToast(error.message, "error");
    } finally {
      setBusyId(null);
    }
  };

  const openHistory = (promo) => {
    setHistoryTarget(promo);
    setHistoryPage(1);
    setHistory({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  };

  const selectClass =
    "px-3 py-2 border border-stone-200 rounded-xl text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-900";

  const displayStats = useMemo(() => stats, [stats]);

  return (
    <div className="space-y-6">
      {/* Header toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-4 text-sm text-stone-500">
          <span>
            <strong className="text-stone-900">{displayStats.total}</strong>{" "}
            total codes
          </span>
          <span>
            <strong className="text-emerald-700">{displayStats.active}</strong>{" "}
            active
          </span>
          <span>
            <strong className="text-stone-400">
              {displayStats.inactive}
            </strong>{" "}
            inactive
          </span>
        </div>

        <button
          onClick={openCreate}
          className="bg-stone-900 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-stone-700 transition-colors flex items-center gap-2"
        >
          + New Code
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search code or description…"
          className={`${fieldClass} max-w-xs`}
        />
        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setPage(1);
          }}
          className={selectClass}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={sortBy}
          onChange={(event) => {
            setSortBy(event.target.value);
            setPage(1);
          }}
          className={selectClass}
        >
          <option value="newest">Newest first</option>
          <option value="code">Code A–Z</option>
          <option value="discount">Highest discount</option>
          <option value="usage">Most used</option>
        </select>
        {(search || statusFilter !== "all") && (
          <button
            onClick={() => {
              setSearchInput("");
              setSearch("");
              setStatusFilter("all");
              setPage(1);
            }}
            className="text-xs font-semibold text-stone-500 underline underline-offset-2"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-extrabold text-stone-900 tracking-tight">
            Promo Codes
          </h3>
          <span className="text-xs text-stone-500 font-medium">
            {total} {total === 1 ? "code" : "codes"}
          </span>
        </div>

        {loadError ? (
          <div className="px-6 py-6 text-sm text-red-700 bg-red-50">
            <p>Could not load promo codes: {loadError}</p>
            <button
              onClick={loadData}
              className="mt-2 font-bold underline"
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="px-6 py-12 text-center text-sm text-stone-400">
            Loading promo codes…
          </div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-stone-400">
            No promo codes found. Create one with the “+ New Code” button.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-100 text-left">
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">
                    Code
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">
                    Discount
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">
                    Description
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">
                    Usage
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">
                    Expires
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((promo, index) => (
                  <tr
                    key={promo.id}
                    className={`border-b border-stone-50 hover:bg-stone-50 transition-colors ${
                      index % 2 !== 0 ? "bg-stone-50/40" : ""
                    }`}
                  >
                    <td className="px-6 py-3">
                      <code className="font-black text-stone-900 tracking-widest text-sm bg-stone-100 px-2 py-0.5 rounded-md">
                        {promo.code}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-extrabold text-stone-900 text-lg">
                        {promo.discountPercent}
                        <span className="text-sm font-bold text-stone-500">
                          %
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-600 max-w-[220px] truncate">
                      {promo.description || "—"}
                    </td>
                    <td className="px-4 py-3 text-stone-700 font-semibold whitespace-nowrap">
                      {usageLabel(promo)}{" "}
                      <span className="text-stone-400 font-normal">uses</span>
                    </td>
                    <td className="px-4 py-3 text-stone-600 whitespace-nowrap">
                      {formatDate(promo.expiresAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge type={promo.active ? "active" : "inactive"} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => toggleActive(promo)}
                          disabled={busyId === promo.id}
                          className={`text-xs font-bold border px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50 ${
                            promo.active
                              ? "text-amber-700 border-amber-200 hover:bg-amber-50"
                              : "text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                          }`}
                        >
                          {promo.active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => openHistory(promo)}
                          className="text-xs font-bold text-stone-700 border border-stone-200 px-2.5 py-1 rounded-lg hover:bg-stone-50 transition-colors"
                        >
                          History
                        </button>
                        <button
                          onClick={() => openEdit(promo)}
                          className="text-xs font-bold text-stone-700 border border-stone-200 px-2.5 py-1 rounded-lg hover:bg-stone-50 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(promo)}
                          disabled={busyId === promo.id}
                          className="text-xs font-semibold text-red-500 hover:text-red-700 border border-red-100 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
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
        )}

        {/* Pagination */}
        {!loading && !loadError && total > 0 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-stone-100 text-sm">
            <span className="text-stone-500 text-xs">
              Page {safePage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, safePage - 1))}
                disabled={safePage <= 1}
                className="text-xs font-bold border border-stone-200 px-3 py-1.5 rounded-lg disabled:opacity-40 hover:bg-stone-50"
              >
                Previous
              </button>
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
                className={selectClass}
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size} / page
                  </option>
                ))}
              </select>
              <button
                onClick={() => setPage(Math.min(totalPages, safePage + 1))}
                disabled={safePage >= totalPages}
                className="text-xs font-bold border border-stone-200 px-3 py-1.5 rounded-lg disabled:opacity-40 hover:bg-stone-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / edit modal */}
      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? "Edit Promo Code" : "Create Promo Code"}
        size="sm"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className={labelClass}>Code *</label>
            <input
              type="text"
              value={form.code}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  code: event.target.value.toUpperCase(),
                }))
              }
              placeholder="e.g. SUMMER30"
              className={`${fieldClass} font-mono font-bold tracking-widest`}
            />
          </div>

          <div>
            <label className={labelClass}>Discount (%) *</label>
            <input
              type="number"
              min="1"
              max="100"
              value={form.discountPercent}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  discountPercent: event.target.value,
                }))
              }
              placeholder="10"
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="e.g. Summer sale — 30% off"
              className={fieldClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Max uses (optional)</label>
              <input
                type="number"
                min="1"
                value={form.maxUses}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    maxUses: event.target.value,
                  }))
                }
                placeholder="Unlimited"
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Min order ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.minOrderAmount}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    minOrderAmount: event.target.value,
                  }))
                }
                placeholder="0"
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Expires (optional)</label>
            <input
              type="date"
              value={form.expiresAt}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  expiresAt: event.target.value,
                }))
              }
              className={fieldClass}
            />
          </div>

          {editing && (
            <label className="flex items-center gap-2 text-sm font-semibold text-stone-700">
              <input
                type="checkbox"
                checked={Boolean(form.active)}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    active: event.target.checked,
                  }))
                }
                className="rounded border-stone-300"
              />
              Active (can be redeemed)
            </label>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={closeForm}
              className="text-sm font-semibold text-stone-600 border border-stone-200 px-4 py-2 rounded-xl hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="text-sm font-bold bg-stone-900 text-white px-5 py-2 rounded-xl hover:bg-stone-700 transition-colors disabled:opacity-50"
            >
              {saving
                ? "Saving…"
                : editing
                ? "Save Changes"
                : "Create Code"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Redemption history modal */}
      <Modal
        open={Boolean(historyTarget)}
        onClose={() => setHistoryTarget(null)}
        title={
          historyTarget
            ? `Redemption History — ${historyTarget.code}`
            : "Redemption History"
        }
        size="md"
      >
        {historyLoading ? (
          <div className="py-10 text-center text-sm text-stone-400">
            Loading redemptions…
          </div>
        ) : history.data.length === 0 ? (
          <div className="py-10 text-center text-sm text-stone-400">
            This code has not been redeemed yet.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-100 text-left">
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">
                      Order
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">
                      Order Total
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">
                      Discount
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.data.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-stone-50 hover:bg-stone-50"
                    >
                      <td className="px-4 py-3 font-semibold text-stone-900">
                        {row.orderReference || "—"}
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        $
                        {Number(row.orderAmount || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-700">
                        −${Number(row.discountAmount || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-stone-500">
                        {formatDate(row.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {history.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 text-sm">
                <span className="text-stone-500 text-xs">
                  {history.total}{" "}
                  {history.total === 1 ? "redemption" : "redemptions"}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setHistoryPage(Math.max(1, historyPage - 1))
                    }
                    disabled={historyPage <= 1}
                    className="text-xs font-bold border border-stone-200 px-3 py-1.5 rounded-lg disabled:opacity-40 hover:bg-stone-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setHistoryPage(
                        Math.min(history.totalPages, historyPage + 1)
                      )
                    }
                    disabled={historyPage >= history.totalPages}
                    className="text-xs font-bold border border-stone-200 px-3 py-1.5 rounded-lg disabled:opacity-40 hover:bg-stone-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
