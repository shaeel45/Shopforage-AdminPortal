import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import StatCard from "../components/StatCard";
import Badge from "../components/Badge";
import { analytics, orders } from "../data/adminData";
import { fetchInventory, fetchProducts, resolveProductImage } from "../api";

const maxRevenue = Math.max(...analytics.monthlySales.map((m) => m.revenue));

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [productList, inventoryList] = await Promise.all([
        fetchProducts({ all: "true" }),
        fetchInventory({ all: "true" }),
      ]);
      setProducts(Array.isArray(productList) ? productList : []);
      setInventory(Array.isArray(inventoryList) ? inventoryList : []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchProducts({ all: "true" }),
      fetchInventory({ all: "true" }),
    ])
      .then(([productList, inventoryList]) => {
        if (!active) return;
        setProducts(Array.isArray(productList) ? productList : []);
        setInventory(Array.isArray(inventoryList) ? inventoryList : []);
        setError("");
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const productMap = useMemo(() => {
    const map = {};
    products.forEach((product) => {
      map[String(product.id)] = product;
    });
    return map;
  }, [products]);

  const stockRows = useMemo(
    () =>
      inventory.map((item) => {
        const product = productMap[String(item.productId)];
        const imageURL = product?.imageURL || product?.image || "";
        return {
          id: item.id,
          productId: item.productId,
          name: product?.name || `Product #${item.productId}`,
          category: product?.category || "—",
          image: imageURL ? resolveProductImage(imageURL) : "",
          quantity: Number(item.quantity) || 0,
          threshold: Number(item.lowStockThreshold) || 0,
        };
      }),
    [inventory, productMap]
  );

  const lowStockRows = useMemo(
    () =>
      stockRows
        .filter((row) => row.quantity <= row.threshold)
        .sort((a, b) => a.quantity - b.quantity),
    [stockRows]
  );

  const outCount = useMemo(
    () => stockRows.filter((row) => row.quantity <= 0).length,
    [stockRows]
  );

  const lowCount = lowStockRows.length;
  const recentOrders = [...orders].slice(0, 8);

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={analytics.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          prefix="$"
          change={analytics.revenueGrowth}
          icon="💰"
        />
        <StatCard label="Total Orders" value={analytics.totalOrders} change={analytics.ordersGrowth} icon="📦" />
        <StatCard label="Products" value={products.length} icon="👕" />
        <StatCard
          label="Low Stock"
          value={loading ? "…" : lowCount}
          suffix={loading ? "" : outCount > 0 ? ` · ${outCount} out` : ""}
          icon="⚠️"
        />
      </div>

      {/* Charts + Low Stock row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Revenue Trend</p>
              <h3 className="text-base font-extrabold text-stone-900 tracking-tight mt-0.5">Monthly Sales</h3>
            </div>
            <span className="text-xs text-stone-500 font-medium bg-stone-50 border border-stone-200 px-3 py-1 rounded-full">Last 6 months</span>
          </div>
          <div className="flex items-end gap-3 h-40">
            {analytics.monthlySales.map((m) => {
              const heightPct = Math.round((m.revenue / maxRevenue) * 100);
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-xs font-bold text-stone-600">${(m.revenue / 1000).toFixed(1)}k</span>
                  <div className="w-full rounded-t-lg bg-stone-900 transition-all duration-500" style={{ height: `${heightPct}%` }} />
                  <span className="text-xs text-stone-400 font-medium">{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sales by Category */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Breakdown</p>
            <h3 className="text-base font-extrabold text-stone-900 tracking-tight mt-0.5">By Category</h3>
          </div>
          <div className="space-y-4">
            {analytics.salesByCategory.map((cat, i) => {
              const maxCat = Math.max(...analytics.salesByCategory.map((c) => c.revenue));
              const pct = Math.round((cat.revenue / maxCat) * 100);
              const colors = ["bg-stone-900", "bg-stone-700", "bg-stone-500", "bg-stone-300"];
              return (
                <div key={cat.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-stone-700 truncate pr-2">{cat.category}</span>
                    <span className="text-xs font-bold text-stone-900">${cat.revenue.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${colors[i]} transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Orders + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
            <h3 className="text-base font-extrabold text-stone-900 tracking-tight">Recent Orders</h3>
            <Link to="/orders" className="text-xs font-semibold text-stone-600 hover:text-stone-900 underline underline-offset-2 transition">
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-100">
                  <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Order</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Total</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order, i) => (
                  <tr key={order.id} className={`border-b border-stone-50 hover:bg-stone-50 transition-colors ${i % 2 === 0 ? "" : "bg-stone-50/50"}`}>
                    <td className="px-6 py-3 font-semibold text-stone-900">{order.id}</td>
                    <td className="px-4 py-3 text-stone-600">{order.customerName}</td>
                    <td className="px-4 py-3 font-semibold text-stone-900">${order.total.toFixed(2)}</td>
                    <td className="px-4 py-3"><Badge type={order.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts — live inventory data */}
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
            <div>
              <h3 className="text-base font-extrabold text-stone-900 tracking-tight">⚠️ Low Stock</h3>
              {!loading && !error && (
                <p className="text-xs text-stone-500 mt-0.5">
                  {lowCount} low · {outCount} out of stock
                </p>
              )}
            </div>
            <Link to="/inventory" className="text-xs font-semibold text-stone-600 hover:text-stone-900 underline underline-offset-2 transition">
              Manage →
            </Link>
          </div>

          {error ? (
            <div className="px-6 py-6 text-sm text-red-700 bg-red-50">
              <p>Could not load inventory: {error}</p>
              <button onClick={load} className="mt-2 font-bold underline">Retry</button>
            </div>
          ) : loading ? (
            <div className="px-6 py-10 text-center text-sm text-stone-400">Loading inventory…</div>
          ) : lowStockRows.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-stone-400">
              Every tracked product is above its low-stock threshold.
            </div>
          ) : (
            <div className="divide-y divide-stone-50">
              {lowStockRows.slice(0, 5).map((row) => (
                <div key={row.id} className="flex items-center gap-3 px-6 py-3 hover:bg-stone-50 transition-colors">
                  {row.image ? (
                    <img src={row.image} alt={row.name} className="w-10 h-10 rounded-lg object-cover bg-stone-100 flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-stone-100 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-900 truncate">{row.name}</p>
                    <p className="text-xs text-stone-500 capitalize">{row.category}</p>
                  </div>
                  <Badge
                    type={row.quantity <= 0 ? "out" : "low"}
                    customLabel={`${row.quantity} left`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
