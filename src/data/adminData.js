// ─────────────────────────────────────────────
// ShopForge Admin – Mock Data
// ─────────────────────────────────────────────

// ── Products (same catalog as the frontend) ──
export const products = [
  // SHIRTS
  { id: "sh-1",       name: "Classic Oxford Cotton Button-Down",    category: "shirts",      price: 68.0,  originalPrice: 85.0,  rating: 4.8, reviewCount: 142, image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=200&q=80",  sizes: ["S","M","L","XL","XXL"], colors: ["Sky Blue","Crisp White","Navy Blue"],    isNew: true,  isTrending: true,  featured: true,  stock: 45 },
  { id: "sh-2",       name: "Heavyweight Linen Camp Collar Shirt",   category: "shirts",      price: 74.0,  originalPrice: 92.0,  rating: 4.6, reviewCount: 98,  image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=200&q=80",  sizes: ["S","M","L","XL"],       colors: ["Olive Green","Sand Beige","Charcoal"], isNew: false, isTrending: true,  featured: true,  stock: 28 },
  { id: "sh-3",       name: "Supima Minimalist Crewneck Tee",        category: "shirts",      price: 38.0,  originalPrice: 45.0,  rating: 4.9, reviewCount: 310, image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=200&q=80",  sizes: ["XS","S","M","L","XL","XXL"], colors: ["Matte Black","Off White","Heather Grey"], isNew: false, isTrending: false, featured: true,  stock: 80 },
  { id: "sh-4",       name: "Brushed Flannel Overshirt",             category: "shirts",      price: 89.0,  originalPrice: 110.0, rating: 4.7, reviewCount: 76,  image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=200&q=80",  sizes: ["S","M","L","XL"],       colors: ["Forest Plaid","Burgundy Plaid","Earth Ochre"], isNew: true, isTrending: false, featured: false, stock: 19 },
  { id: "sh-5",       name: "Textured Knit Polo Shirt",              category: "shirts",      price: 59.0,  originalPrice: 75.0,  rating: 4.7, reviewCount: 112, image: "https://images.unsplash.com/photo-1625910513413-7e189d20c572?auto=format&fit=crop&w=200&q=80",  sizes: ["S","M","L","XL"],       colors: ["Ecrù Cream","Sage Green","Midnight Blue"], isNew: false, isTrending: true, featured: false, stock: 35 },
  // PANTS
  { id: "pa-1",       name: "Tailored Slim Chino Trousers",          category: "pants",       price: 78.0,  originalPrice: 95.0,  rating: 4.8, reviewCount: 215, image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=200&q=80",  sizes: ["30x30","32x32","34x32","36x34"], colors: ["Khaki Tan","Navy","Charcoal Grey"], isNew: true,  isTrending: true,  featured: true,  stock: 52 },
  { id: "pa-2",       name: "Japanese Selvedge Denim Jeans",         category: "pants",       price: 135.0, originalPrice: 165.0, rating: 4.9, reviewCount: 184, image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=200&q=80",  sizes: ["30x32","32x32","34x32","36x32"], colors: ["Deep Raw Indigo","Washed Slate"], isNew: false, isTrending: true, featured: true, stock: 24 },
  { id: "pa-3",       name: "Relaxed Utility Cargo Pants",           category: "pants",       price: 85.0,  originalPrice: 105.0, rating: 4.7, reviewCount: 129, image: "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=200&q=80",  sizes: ["S","M","L","XL"],       colors: ["Olive Drab","Desert Sand","Matte Black"], isNew: true, isTrending: false, featured: false, stock: 31 },
  { id: "pa-4",       name: "Pleated Wool-Blend Dress Trousers",     category: "pants",       price: 110.0, originalPrice: 140.0, rating: 4.8, reviewCount: 65,  image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=200&q=80",  sizes: ["30","32","34","36"],     colors: ["Charcoal Melange","Warm Taupe"], isNew: false, isTrending: false, featured: false, stock: 18 },
  { id: "pa-5",       name: "Essential French Terry Joggers",         category: "pants",       price: 62.0,  originalPrice: 75.0,  rating: 4.9, reviewCount: 240, image: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=200&q=80",  sizes: ["S","M","L","XL","XXL"], colors: ["Heather Grey","Black","Forest Green"], isNew: false, isTrending: true, featured: false, stock: 65 },
  // SHOES
  { id: "sh-shoe-1",  name: "Artisan Leather Derby Shoes",           category: "shoes",       price: 165.0, originalPrice: 210.0, rating: 4.9, reviewCount: 164, image: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=200&q=80",  sizes: ["8","9","10","11","12"],  colors: ["Rich Cognac","Polished Black","Dark Espresso"], isNew: true, isTrending: true, featured: true, stock: 22 },
  { id: "sh-shoe-2",  name: "Minimalist Low-Top Leather Sneakers",   category: "shoes",       price: 120.0, originalPrice: 150.0, rating: 4.8, reviewCount: 388, image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=200&q=80",  sizes: ["7","8","9","10","11","12","13"], colors: ["Triple White","White / Gum","Triple Black"], isNew: false, isTrending: true, featured: true, stock: 74 },
  { id: "sh-shoe-3",  name: "Heritage Suede Chelsea Boots",          category: "shoes",       price: 185.0, originalPrice: 230.0, rating: 4.9, reviewCount: 142, image: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=200&q=80",  sizes: ["8","9","10","11","12"],  colors: ["Snuff Tobacco","Ash Charcoal"], isNew: true, isTrending: false, featured: true, stock: 16 },
  { id: "sh-shoe-4",  name: "Classic Penny Loafers",                 category: "shoes",       price: 145.0, originalPrice: 180.0, rating: 4.7, reviewCount: 92,  image: "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=200&q=80",  sizes: ["8","9","10","11","12"],  colors: ["Oxblood Cordovan","Black Onyx"], isNew: false, isTrending: false, featured: false, stock: 25 },
  { id: "sh-shoe-5",  name: "Trail Performance Running Sneaker",     category: "shoes",       price: 130.0, originalPrice: 160.0, rating: 4.6, reviewCount: 118, image: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=200&q=80",  sizes: ["8","8.5","9","9.5","10","11","12"], colors: ["Storm Grey","Neon Coral / Black"], isNew: false, isTrending: true, featured: false, stock: 40 },
  // ACCESSORIES
  { id: "acc-1",      name: "Full-Grain Leather Everyday Bifold",    category: "accessories", price: 45.0,  originalPrice: 58.0,  rating: 4.9, reviewCount: 210, image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=200&q=80",  sizes: ["One Size"],             colors: ["Caramel Tan","Midnight Black"], isNew: false, isTrending: true, featured: true, stock: 60 },
  { id: "acc-2",      name: "Minimalist Chronograph Wristwatch",     category: "accessories", price: 195.0, originalPrice: 250.0, rating: 4.8, reviewCount: 88,  image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=200&q=80",  sizes: ["40mm"],                 colors: ["Silver / White","Rose Gold / Black"], isNew: true, isTrending: true, featured: true, stock: 15 },
  { id: "acc-3",      name: "Waxed Canvas Weekender Duffle Bag",     category: "accessories", price: 140.0, originalPrice: 175.0, rating: 4.9, reviewCount: 104, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=200&q=80",  sizes: ["42L"],                  colors: ["Field Tan","Navy","Charcoal"], isNew: true, isTrending: false, featured: false, stock: 20 },
];

// ── Categories ──
export const categories = [
  { id: "all",         name: "All Products" },
  { id: "shirts",      name: "Shirts & Tops" },
  { id: "pants",       name: "Pants & Trousers" },
  { id: "shoes",       name: "Footwear & Shoes" },
  { id: "accessories", name: "Accessories" },
];

// ── Mock Customers ──
export const customers = [
  { id: "c-001", name: "Alexander Mitchell", email: "alex.m@email.com",   avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",    joinedDate: "Jan 2026", orderCount: 5,  totalSpent: 612.50 },
  { id: "c-002", name: "Elena Rostova",       email: "e.rostova@email.com", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=elena",   joinedDate: "Feb 2026", orderCount: 3,  totalSpent: 385.00 },
  { id: "c-003", name: "Marcus Chen",         email: "m.chen@email.com",    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=marcus",  joinedDate: "Jan 2026", orderCount: 8,  totalSpent: 1240.00 },
  { id: "c-004", name: "Sarah Williams",      email: "s.will@email.com",    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",   joinedDate: "Mar 2026", orderCount: 2,  totalSpent: 218.00 },
  { id: "c-005", name: "James O'Brien",       email: "j.obrien@email.com",  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=james",   joinedDate: "Mar 2026", orderCount: 4,  totalSpent: 530.00 },
  { id: "c-006", name: "Priya Kapoor",        email: "p.kapoor@email.com",  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=priya",   joinedDate: "Apr 2026", orderCount: 6,  totalSpent: 890.00 },
  { id: "c-007", name: "David Larsson",       email: "d.larsson@email.com", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=david",   joinedDate: "Apr 2026", orderCount: 1,  totalSpent: 165.00 },
  { id: "c-008", name: "Aisha Nkomo",         email: "a.nkomo@email.com",   avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=aisha",   joinedDate: "May 2026", orderCount: 3,  totalSpent: 412.00 },
  { id: "c-009", name: "Carlos Mendez",       email: "c.mendez@email.com",  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=carlos",  joinedDate: "May 2026", orderCount: 2,  totalSpent: 245.00 },
  { id: "c-010", name: "Yuki Tanaka",         email: "y.tanaka@email.com",  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=yuki",    joinedDate: "Jun 2026", orderCount: 7,  totalSpent: 985.00 },
];

// ── Mock Orders ──
export const orders = [
  { id: "ORD-10041", customerId: "c-003", customerName: "Marcus Chen",        date: "2026-09-14", items: [{ productId: "pa-2", name: "Japanese Selvedge Denim Jeans",   qty: 1, price: 135.0 }, { productId: "sh-1", name: "Classic Oxford Button-Down", qty: 2, price: 68.0 }], total: 271.0,  status: "delivered",   paymentMethod: "Visa •••• 4242" },
  { id: "ORD-10040", customerId: "c-010", customerName: "Yuki Tanaka",         date: "2026-09-13", items: [{ productId: "sh-shoe-3", name: "Heritage Suede Chelsea Boots", qty: 1, price: 185.0 }], total: 185.0,  status: "shipped",     paymentMethod: "Mastercard •••• 8801" },
  { id: "ORD-10039", customerId: "c-001", customerName: "Alexander Mitchell",  date: "2026-09-13", items: [{ productId: "acc-2", name: "Minimalist Chronograph Wristwatch", qty: 1, price: 195.0 }, { productId: "acc-1", name: "Full-Grain Leather Bifold", qty: 1, price: 45.0 }], total: 240.0,  status: "processing",  paymentMethod: "Amex •••• 3737" },
  { id: "ORD-10038", customerId: "c-006", customerName: "Priya Kapoor",        date: "2026-09-12", items: [{ productId: "sh-3",    name: "Supima Minimalist Crewneck Tee",   qty: 3, price: 38.0 }], total: 114.0,  status: "delivered",   paymentMethod: "Visa •••• 1234" },
  { id: "ORD-10037", customerId: "c-002", customerName: "Elena Rostova",       date: "2026-09-11", items: [{ productId: "sh-shoe-2", name: "Minimalist Low-Top Leather Sneakers", qty: 1, price: 120.0 }, { productId: "pa-5", name: "Essential French Terry Joggers", qty: 1, price: 62.0 }], total: 182.0, status: "delivered",  paymentMethod: "PayPal" },
  { id: "ORD-10036", customerId: "c-004", customerName: "Sarah Williams",      date: "2026-09-10", items: [{ productId: "sh-2",    name: "Heavyweight Linen Camp Collar Shirt", qty: 1, price: 74.0 }], total: 74.0,   status: "cancelled",   paymentMethod: "Visa •••• 9090" },
  { id: "ORD-10035", customerId: "c-005", customerName: "James O'Brien",       date: "2026-09-09", items: [{ productId: "pa-1",    name: "Tailored Slim Chino Trousers",    qty: 2, price: 78.0 }], total: 156.0,  status: "delivered",   paymentMethod: "Mastercard •••• 5566" },
  { id: "ORD-10034", customerId: "c-008", customerName: "Aisha Nkomo",         date: "2026-09-08", items: [{ productId: "sh-4",    name: "Brushed Flannel Overshirt",       qty: 1, price: 89.0 }, { productId: "sh-shoe-4", name: "Classic Penny Loafers", qty: 1, price: 145.0 }], total: 234.0, status: "shipped",   paymentMethod: "Visa •••• 7711" },
  { id: "ORD-10033", customerId: "c-009", customerName: "Carlos Mendez",       date: "2026-09-07", items: [{ productId: "sh-shoe-5", name: "Trail Performance Running Sneaker", qty: 1, price: 130.0 }], total: 130.0, status: "processing", paymentMethod: "PayPal" },
  { id: "ORD-10032", customerId: "c-007", customerName: "David Larsson",       date: "2026-09-06", items: [{ productId: "sh-shoe-1", name: "Artisan Leather Derby Shoes",   qty: 1, price: 165.0 }], total: 165.0,  status: "pending",     paymentMethod: "Amex •••• 6001" },
  { id: "ORD-10031", customerId: "c-010", customerName: "Yuki Tanaka",         date: "2026-09-05", items: [{ productId: "acc-3",   name: "Waxed Canvas Weekender Duffle Bag", qty: 1, price: 140.0 }, { productId: "pa-4", name: "Pleated Wool-Blend Dress Trousers", qty: 1, price: 110.0 }], total: 250.0, status: "delivered", paymentMethod: "Visa •••• 4242" },
  { id: "ORD-10030", customerId: "c-003", customerName: "Marcus Chen",         date: "2026-09-04", items: [{ productId: "sh-5",    name: "Textured Knit Polo Shirt",        qty: 2, price: 59.0 }], total: 118.0,  status: "delivered",   paymentMethod: "Mastercard •••• 8801" },
];

// ── Promo Codes ──
export const promoCodes = [
  { id: "promo-1", code: "SHOPFORGE10", discountPercent: 10, description: "10% off entire order",           active: true,  usageCount: 142 },
  { id: "promo-2", code: "SAVE20",      discountPercent: 20, description: "20% seasonal clearance discount", active: true,  usageCount: 87  },
  { id: "promo-3", code: "WELCOME15",   discountPercent: 15, description: "15% off first purchase",          active: true,  usageCount: 63  },
  { id: "promo-4", code: "FALL25",      discountPercent: 25, description: "Fall season sale",                active: false, usageCount: 29  },
  { id: "promo-5", code: "VIP30",       discountPercent: 30, description: "VIP customer discount",           active: false, usageCount: 11  },
];

// ── Analytics (for Dashboard) ──
export const analytics = {
  totalRevenue: 41850.00,
  revenueGrowth: 12.4,   // % vs last month
  totalOrders: 312,
  ordersGrowth: 8.7,
  totalProducts: products.length,
  totalCustomers: customers.length,
  customersGrowth: 22.1,
  avgOrderValue: 134.14,
  salesByCategory: [
    { category: "Shirts & Tops",     revenue: 9840,  orders: 128 },
    { category: "Pants & Trousers",  revenue: 11200, orders: 92  },
    { category: "Footwear & Shoes",  revenue: 14600, orders: 61  },
    { category: "Accessories",       revenue: 6210,  orders: 31  },
  ],
  monthlySales: [
    { month: "Apr", revenue: 3200 },
    { month: "May", revenue: 4100 },
    { month: "Jun", revenue: 3850 },
    { month: "Jul", revenue: 5200 },
    { month: "Aug", revenue: 4800 },
    { month: "Sep", revenue: 6700 },
  ],
};

// ── Default Store Settings ──
export const defaultSettings = {
  storeName: "ShopForge",
  tagline: "Modern Wardrobe Essentials",
  bannerText: "✨ Spring Season: Use code SHOPFORGE10 for 10% off | Free Shipping on orders over $75",
  freeShippingThreshold: 75,
  currency: "USD",
  supportEmail: "support@shopforge.com",
};
