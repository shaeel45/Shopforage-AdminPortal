const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/+$/, "");

async function request(path, options = {}) {
  const token = localStorage.getItem("shopforge_access_token");
  const headers = new Headers(options.headers);

  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });
  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new Event("shopforge:admin:logout"));
    }
    const message = Array.isArray(data?.message)
      ? data.message.join(", ")
      : data?.message || data || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

export function loginAdmin(email, password) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, role: "ADMIN" }),
  });
}

export async function fetchProducts(params = {}) {
  const search = new URLSearchParams({ all: "true", ...params }).toString();
  const res = await request(`/products${search ? `?${search}` : ""}`);
  return Array.isArray(res) ? res : res?.data || [];
}

export function createProduct(product) {
  return request("/products", {
    method: "POST",
    body: JSON.stringify(product),
  });
}

export function updateProduct(id, product) {
  return request(`/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(product),
  });
}

export function uploadProductImage(id, file) {
  const body = new FormData();
  body.append("image", file);
  return request(`/products/${id}/image`, {
    method: "POST",
    body,
  });
}

export function deleteProduct(id) {
  return request(`/products/${id}`, { method: "DELETE" });
}

/**
 * Compare every product's stock cache with the inventory service and
 * optionally repair drift. payload: { fix: true }
 */
export function reconcileStock(payload = { fix: true }) {
  return request("/products/reconcile-stock", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchInventory(params = {}) {
  const search = new URLSearchParams(params).toString();
  const res = await request(`/inventory${search ? `?${search}` : ""}`);
  return Array.isArray(res) ? res : res?.data || [];
}

export function createInventory(data) {
  return request("/inventory", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateInventory(id, data) {
  return request(`/inventory/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * Atomic stock adjustment with audit trail.
 * payload: { productId, changeAmount, type, performedBy, reason, referenceId }
 */
export function adjustStock(payload) {
  return request("/inventory/adjust-stock", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function reserveStock(payload) {
  return request("/inventory/reserve", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function releaseStock(payload) {
  return request("/inventory/release", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchInventoryTransactions(id, params = {}) {
  const search = new URLSearchParams(params).toString();
  const res = await request(
    `/inventory/${id}/transactions${search ? `?${search}` : ""}`
  );
  if (Array.isArray(res)) {
    return { data: res, total: res.length, page: 1, limit: res.length, totalPages: 1 };
  }
  return res || { data: [], total: 0, page: 1, limit: 20, totalPages: 1 };
}

export function deleteInventory(id) {
  return request(`/inventory/${id}`, { method: "DELETE" });
}

export async function fetchPromoCodes(params = {}) {
  const search = new URLSearchParams(params).toString();
  const res = await request(`/promocodes${search ? `?${search}` : ""}`);
  if (Array.isArray(res)) {
    return {
      data: res,
      total: res.length,
      page: 1,
      limit: res.length,
      totalPages: 1,
      stats: { total: res.length, active: 0, inactive: 0 },
    };
  }
  return (
    res || {
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1,
      stats: { total: 0, active: 0, inactive: 0 },
    }
  );
}

export function createPromoCode(data) {
  return request("/promocodes", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updatePromoCode(id, data) {
  return request(`/promocodes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function setPromoCodeActive(id, active) {
  return request(`/promocodes/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ active }),
  });
}

export function deletePromoCode(id) {
  return request(`/promocodes/${id}`, { method: "DELETE" });
}

export async function fetchPromoCodeRedemptions(id, params = {}) {
  const search = new URLSearchParams(params).toString();
  const res = await request(
    `/promocodes/${id}/redemptions${search ? `?${search}` : ""}`
  );
  return (
    res || { data: [], total: 0, page: 1, limit: 20, totalPages: 1 }
  );
}

const EMPTY_ORDER_STATS = {
  total: 0,
  pending: 0,
  processing: 0,
  shipped: 0,
  delivered: 0,
  cancelled: 0,
  revenue: 0,
};

export async function fetchOrders(params = {}) {
  const search = new URLSearchParams(params).toString();
  const res = await request(`/orders${search ? `?${search}` : ""}`);
  if (Array.isArray(res)) {
    return {
      data: res,
      total: res.length,
      page: 1,
      limit: res.length,
      totalPages: 1,
      stats: { ...EMPTY_ORDER_STATS, total: res.length },
    };
  }
  return (
    res || {
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1,
      stats: EMPTY_ORDER_STATS,
    }
  );
}

export function fetchOrder(id) {
  return request(`/orders/${id}`);
}

export function updateOrderStatus(id, status, note) {
  return request(`/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(note ? { status, note } : { status }),
  });
}

export function fetchOrderEvents(id) {
  return request(`/orders/${id}/events`);
}

export function resolveProductImage(imageURL) {
  if (!imageURL) return "";
  if (/^https?:\/\//i.test(imageURL)) return imageURL;
  return `${API_URL}${imageURL.startsWith("/") ? "" : "/"}${imageURL}`;
}

export async function fetchCustomers() {
  const data = await request("/users");
  return Array.isArray(data) ? data : data?.data || [];
}

export function onAdminLogout(callback) {
  window.addEventListener("shopforge:admin:logout", callback);
  return () => window.removeEventListener("shopforge:admin:logout", callback);
}
