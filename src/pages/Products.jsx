import React, { useCallback, useEffect, useState } from "react";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import { useToast } from "../context/ToastContext";
import { categories } from "../data/adminData";
import {
  createProduct,
  deleteProduct,
  fetchProducts,
  resolveProductImage,
  updateProduct,
  uploadProductImage,
} from "../api";

const EMPTY_FORM = {
  name: "",
  category: "shirts",
  price: "",
  originalPrice: "",
  stock: "",
  colors: "",
  sizes: "",
  description: "",
  isNew: false,
  isTrending: false,
  isFeatured: false,
};

const splitValues = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  return value.split(",").map((item) => item.trim()).filter(Boolean);
};

function normalizeProduct(product) {
  const imageURL = product.imageURL || product.image || "";
  return {
    ...product,
    id: product.id,
    name: product.name || "",
    category: product.category || "",
    price: Number(product.price) || 0,
    originalPrice: Number(product.original_price ?? product.originalPrice ?? product.price) || 0,
    stock: Number(product.stock) || 0,
    colors: splitValues(product.colors),
    sizes: splitValues(product.sizes),
    imageURL,
    image: resolveProductImage(imageURL),
    isNew: Boolean(product.isNew),
    isTrending: Boolean(product.isTrending),
    isFeatured: Boolean(product.isFeatured ?? product.featured),
  };
}

const fieldClass =
  "w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 bg-stone-50";

export default function Products() {
  const { addToast } = useToast();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    fetchProducts()
      .then((data) => {
        if (!Array.isArray(data)) {
          throw new Error("The products API returned an invalid response.");
        }
        if (active) {
          setProducts(data.map(normalizeProduct));
          setLoadError("");
        }
      })
      .catch((error) => {
        if (active) setLoadError(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchProducts();
      if (!Array.isArray(data)) {
        throw new Error("The products API returned an invalid response.");
      }
      setProducts(data.map(normalizeProduct));
      setLoadError("");
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const filtered = products.filter((product) => {
    const matchCat = catFilter === "all" || product.category === catFilter;
    const matchSearch = product.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setImageFile(null);
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      originalPrice: String(product.originalPrice || ""),
      stock: String(product.stock),
      colors: product.colors.join(", "),
      sizes: product.sizes.join(", "),
      description: product.description ?? "",
      isNew: product.isNew,
      isTrending: product.isTrending,
      isFeatured: product.isFeatured,
    });
    setImageFile(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    const price = Number(form.price);
    const originalPrice = form.originalPrice === "" ? price : Number(form.originalPrice);
    const stock = form.stock === "" ? 0 : Number(form.stock);
    if (!form.name.trim() || form.price === "" || !Number.isFinite(price) || price < 0) {
      addToast("Enter a product name and a valid non-negative price.", "error");
      return;
    }
    if (!Number.isFinite(originalPrice) || originalPrice < 0 || !Number.isInteger(stock) || stock < 0) {
      addToast("Enter a valid original price and whole-number stock quantity.", "error");
      return;
    }

    const payload = {
      name: form.name.trim(),
      category: form.category,
      price,
      original_price: originalPrice,
      stock,
      colors: form.colors.trim(),
      sizes: form.sizes.trim(),
      description: form.description.trim(),
      isNew: form.isNew,
      isTrending: form.isTrending,
      isFeatured: form.isFeatured,
    };

    setSaving(true);
    try {
      const savedProduct = editing
        ? await updateProduct(editing.id, payload)
        : await createProduct(payload);

      if (imageFile) {
        try {
          await uploadProductImage(savedProduct.id, imageFile);
        } catch (error) {
          setModalOpen(false);
          addToast(`Product saved, but the image upload failed: ${error.message}`, "error");
          await loadProducts();
          return;
        }
      }

      setModalOpen(false);
      addToast(`"${payload.name}" ${editing ? "updated" : "added"} successfully.`, "success");
      await loadProducts();
    } catch (error) {
      addToast(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget.id);
      addToast(`"${deleteTarget.name}" deleted.`, "warning");
      setDeleteTarget(null);
      await loadProducts();
    } catch (error) {
      addToast(error.message, "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products…"
            className="px-4 py-2 text-sm border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 w-60"
          />
          <select
            value={catFilter}
            onChange={(event) => setCatFilter(event.target.value)}
            className="px-3 py-2 text-sm border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-stone-900"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={openAdd}
          className="bg-stone-900 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-stone-700 transition-colors flex items-center gap-2"
        >
          + Add Product
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-extrabold text-stone-900 tracking-tight">All Products</h3>
          <span className="text-xs text-stone-500 font-medium">{filtered.length} items</span>
        </div>
        {loadError && (
          <div className="px-6 py-4 text-sm text-red-700 bg-red-50 flex items-center justify-between gap-4">
            <span>Could not load products: {loadError}</span>
            <button onClick={loadProducts} className="font-bold underline">Retry</button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100 text-left">
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Product</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Category</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Price</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Stock</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Tags</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-stone-400 text-sm">Loading products…</td></tr>
              ) : filtered.map((product, index) => (
                <tr key={product.id} className={`border-b border-stone-50 hover:bg-stone-50 transition-colors ${index % 2 !== 0 ? "bg-stone-50/40" : ""}`}>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover bg-stone-100 flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-stone-100 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-semibold text-stone-900 leading-tight">{product.name}</p>
                        <p className="text-xs text-stone-400">{product.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize text-stone-600">{product.category}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-stone-900">${product.price.toFixed(2)}</span>
                    {product.originalPrice > product.price && (
                      <span className="text-xs text-stone-400 line-through ml-1">${product.originalPrice.toFixed(2)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      type={product.stock < 20 ? "low" : product.stock < 40 ? "medium" : "high"}
                      customLabel={`${product.stock} units`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {product.isNew && <Badge type="new" />}
                      {product.isTrending && <Badge type="trending" />}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(product)} className="text-xs font-semibold text-stone-600 hover:text-stone-900 border border-stone-200 px-2.5 py-1 rounded-lg hover:bg-stone-50 transition-colors">Edit</button>
                      <button onClick={() => setDeleteTarget(product)} className="text-xs font-semibold text-red-500 hover:text-red-700 border border-red-100 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-stone-400 text-sm">No products found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => !saving && setModalOpen(false)} title={editing ? "Edit Product" : "Add New Product"} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "Product Name *", key: "name", type: "text", full: true },
            { label: "Price ($) *", key: "price", type: "number" },
            { label: "Original Price ($)", key: "originalPrice", type: "number" },
            { label: "Stock Quantity", key: "stock", type: "number" },
            { label: "Colors (comma-separated)", key: "colors", type: "text" },
            { label: "Sizes (comma-separated)", key: "sizes", type: "text" },
          ].map(({ label, key, type, full }) => (
            <div key={key} className={full ? "sm:col-span-2" : ""}>
              <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">{label}</label>
              <input
                type={type}
                min={type === "number" ? "0" : undefined}
                step={key === "stock" ? "1" : "any"}
                value={form[key]}
                onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                className={fieldClass}
              />
            </div>
          ))}

          <div>
            <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">Category</label>
            <select
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              className={fieldClass}
            >
              {categories.filter((category) => category.id !== "all").map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">Product Image</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={(event) => setImageFile(event.target.files?.[0] || null)}
              className={`${fieldClass} file:mr-3 file:border-0 file:bg-stone-200 file:px-3 file:py-1 file:rounded-lg`}
            />
            <p className="mt-1 text-xs text-stone-400">JPEG, PNG, GIF, or WebP; max 5 MB. Uploads after saving the product.</p>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              rows={3}
              className={`${fieldClass} resize-none`}
            />
          </div>

          <div className="sm:col-span-2 flex gap-6">
            {[
              { key: "isNew", label: "Is New" },
              { key: "isTrending", label: "Is Trending" },
              { key: "isFeatured", label: "Featured" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.checked }))}
                  className="w-4 h-4 rounded border-stone-300 accent-stone-900"
                />
                <span className="text-sm font-medium text-stone-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button disabled={saving} onClick={() => setModalOpen(false)} className="text-sm font-semibold text-stone-600 border border-stone-200 px-4 py-2 rounded-xl hover:bg-stone-50 transition-colors disabled:opacity-50">Cancel</button>
          <button disabled={saving} onClick={handleSave} className="text-sm font-bold bg-stone-900 text-white px-5 py-2 rounded-xl hover:bg-stone-700 transition-colors disabled:opacity-50">
            {saving ? "Saving…" : editing ? "Save Changes" : "Add Product"}
          </button>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)} title="Confirm Delete" size="sm">
        <p className="text-sm text-stone-600">
          Are you sure you want to delete <strong className="text-stone-900">"{deleteTarget?.name}"</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end mt-6">
          <button disabled={deleting} onClick={() => setDeleteTarget(null)} className="text-sm font-semibold text-stone-600 border border-stone-200 px-4 py-2 rounded-xl hover:bg-stone-50 transition-colors disabled:opacity-50">Cancel</button>
          <button disabled={deleting} onClick={handleDelete} className="text-sm font-bold bg-red-600 text-white px-5 py-2 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50">{deleting ? "Deleting…" : "Delete"}</button>
        </div>
      </Modal>
    </div>
  );
}
