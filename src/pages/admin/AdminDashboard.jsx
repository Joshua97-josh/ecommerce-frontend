// ============================================================
//  pages/admin/AdminDashboard.jsx
//  Admin panel — Stats, Product CRUD, Order management
// ============================================================
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { adminAPI, productAPI } from "../../services/api";

const STATUS_OPTIONS = ["PENDING","CONFIRMED","SHIPPED","DELIVERED","CANCELLED"];
const STATUS_COLORS  = {
  PENDING:"#f59e0b", CONFIRMED:"#3b82f6",
  SHIPPED:"#8b5cf6", DELIVERED:"#22c55e", CANCELLED:"#ef4444"
};

export default function AdminDashboard() {
  const { isAdmin } = useAuth();
  const navigate    = useNavigate();

  const [tab,      setTab]      = useState("products");
  const [stats,    setStats]    = useState(null);
  const [products, setProducts] = useState([]);
  const [orders,   setOrders]   = useState([]);
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");

  // Product form state
  const EMPTY_PRODUCT = { title:"", description:"", price:"", stock:"", imageUrl:"", category:"" };
  const [showForm,    setShowForm]    = useState(false);
  const [editingId,   setEditingId]   = useState(null);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [saving,      setSaving]      = useState(false);
  const [formError,   setFormError]   = useState("");

  // Delete
  const [deletingId, setDeletingId] = useState(null);

  // Guard — redirect if not admin
  useEffect(() => {
    if (!isAdmin()) navigate("/");
  }, []);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [statsRes, productsRes, ordersRes, usersRes] = await Promise.all([
        adminAPI.getAllOrders().then(() => adminAPI.getAllOrders()),   // trigger below
        productAPI.getAll({}),
        adminAPI.getAllOrders(),
        adminAPI.getAllUsers(),
      ]);
      // stats via dedicated endpoint
      const statsData = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      }).then(r => r.json()).catch(() => ({}));

      setStats(statsData);
      setProducts(productsRes.data);
      setOrders(ordersRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Product CRUD ──────────────────────────────────────────
  const openAdd = () => {
    setEditingId(null); setProductForm(EMPTY_PRODUCT);
    setFormError(""); setShowForm(true);
  };
  const openEdit = (p) => {
    setEditingId(p.id);
    setProductForm({ title:p.title, description:p.description,
      price:p.price, stock:p.stock, imageUrl:p.imageUrl, category:p.category });
    setFormError(""); setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingId(null); setProductForm(EMPTY_PRODUCT); };

  const handleSaveProduct = async () => {
    const { title, price, stock, category } = productForm;
    if (!title || !price || !stock || !category) {
      setFormError("Title, Price, Stock and Category are required"); return;
    }
    setSaving(true); setFormError("");
    try {
      const payload = { ...productForm, price: parseFloat(price), stock: parseInt(stock) };
      if (editingId) {
        await adminAPI.updateProduct(editingId, payload);
      } else {
        await adminAPI.addProduct(payload);
      }
      await loadAll();
      closeForm();
    } catch (err) {
      setFormError(err.response?.data?.message || "Save failed");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await adminAPI.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    } finally { setDeletingId(null); }
  };

  // ── Order status update ───────────────────────────────────
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      setOrders(prev => prev.map(o => o.orderId === orderId ? {...o, status: newStatus} : o));
    } catch { alert("Failed to update status"); }
  };

  // ── Filtered data ─────────────────────────────────────────
  const filteredProducts = products.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredOrders = orders.filter(o =>
    String(o.orderId).includes(search) ||
    o.status?.toLowerCase().includes(search.toLowerCase()) ||
    o.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div style={{ padding:"60px 24px", textAlign:"center" }}>
      <div className="spinner" style={{ width:40,height:40,borderWidth:3,
        borderColor:"var(--border)",borderTopColor:"var(--accent)",margin:"0 auto"}} />
      <p style={{ marginTop:16, color:"var(--text-muted)" }}>Loading Admin Panel…</p>
    </div>
  );

  return (
    <div className="admin-page">

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className="admin-sidebar">
        <div className="admin-brand">⚙️ Admin Panel</div>
        <nav className="admin-nav">
          {[
            { key:"products", icon:"📦", label:"Products" },
            { key:"orders",   icon:"🧾", label:"Orders"   },
            { key:"users",    icon:"👥", label:"Users"     },
          ].map(t => (
            <button key={t.key}
              className={`admin-nav-item ${tab===t.key?"active":""}`}
              onClick={() => { setTab(t.key); setSearch(""); }}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main content ────────────────────────────────── */}
      <main className="admin-main">

        {/* Stats cards */}
        {stats && (
          <div className="stats-grid">
            {[
              { label:"Total Revenue",  value:`₹${Number(stats.totalRevenue||0).toLocaleString("en-IN")}`, icon:"💰", color:"#f97316" },
              { label:"Total Orders",   value:stats.totalOrders   ?? orders.length,   icon:"🧾", color:"#3b82f6" },
              { label:"Total Products", value:stats.totalProducts ?? products.length, icon:"📦", color:"#8b5cf6" },
              { label:"Total Users",    value:stats.totalUsers    ?? users.length,    icon:"👥", color:"#22c55e" },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-icon" style={{ background:`${s.color}18`, color:s.color }}>{s.icon}</div>
                <div>
                  <p className="stat-value">{s.value}</p>
                  <p className="stat-label">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab header */}
        <div className="admin-tab-header">
          <h2 className="admin-tab-title">
            {tab==="products" ? "📦 Products" : tab==="orders" ? "🧾 Orders" : "👥 Users"}
          </h2>
          <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
            <input className="admin-search" placeholder={`Search ${tab}…`}
              value={search} onChange={e=>setSearch(e.target.value)} />
            {tab==="products" && (
              <button className="btn-primary" onClick={openAdd}>+ Add Product</button>
            )}
          </div>
        </div>

        {/* ── PRODUCTS TAB ─────────────────────────────── */}
        {tab==="products" && (
          <>
            {showForm && (
              <div className="admin-form-card">
                <h3 className="form-card-title">{editingId ? "✏️ Edit Product" : "➕ Add New Product"}</h3>
                {formError && <div className="alert alert-error">{formError}</div>}
                <div className="product-form-grid">
                  <div className="form-group span-2">
                    <label>Product Title *</label>
                    <input value={productForm.title}
                      onChange={e=>setProductForm(p=>({...p,title:e.target.value}))}
                      placeholder="e.g. Wireless Noise-Cancelling Headphones" />
                  </div>
                  <div className="form-group">
                    <label>Price (₹) *</label>
                    <input type="number" value={productForm.price} min="0"
                      onChange={e=>setProductForm(p=>({...p,price:e.target.value}))}
                      placeholder="2999" />
                  </div>
                  <div className="form-group">
                    <label>Stock *</label>
                    <input type="number" value={productForm.stock} min="0"
                      onChange={e=>setProductForm(p=>({...p,stock:e.target.value}))}
                      placeholder="50" />
                  </div>
                  <div className="form-group">
                    <label>Category *</label>
                    <input value={productForm.category}
                      onChange={e=>setProductForm(p=>({...p,category:e.target.value}))}
                      placeholder="Electronics" />
                  </div>
                  <div className="form-group">
                    <label>Image URL</label>
                    <input value={productForm.imageUrl}
                      onChange={e=>setProductForm(p=>({...p,imageUrl:e.target.value}))}
                      placeholder="https://…" />
                  </div>
                  <div className="form-group span-2">
                    <label>Description</label>
                    <textarea rows={3} value={productForm.description}
                      onChange={e=>setProductForm(p=>({...p,description:e.target.value}))}
                      placeholder="Product details…" />
                  </div>
                </div>
                {productForm.imageUrl && (
                  <img src={productForm.imageUrl} alt="preview"
                    style={{ width:100,height:80,objectFit:"cover",borderRadius:8,marginTop:8 }} />
                )}
                <div style={{ display:"flex",gap:12,marginTop:20 }}>
                  <button className="btn-primary" onClick={handleSaveProduct} disabled={saving}>
                    {saving ? <><span className="spinner"/>Saving…</> : editingId ? "💾 Update Product" : "✅ Create Product"}
                  </button>
                  <button className="btn-outline" onClick={closeForm}>Cancel</button>
                </div>
              </div>
            )}

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Image</th><th>Title</th><th>Category</th>
                    <th>Price</th><th>Stock</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr><td colSpan={6} style={{textAlign:"center",padding:40,color:"var(--text-muted)"}}>
                      No products found
                    </td></tr>
                  ) : filteredProducts.map(p => (
                    <tr key={p.id}>
                      <td>
                        <img src={p.imageUrl||"https://via.placeholder.com/50"}
                          alt={p.title} className="table-product-img" />
                      </td>
                      <td>
                        <p className="table-product-title">{p.title}</p>
                        <p style={{fontSize:".75rem",color:"var(--text-muted)"}}>ID: {p.id}</p>
                      </td>
                      <td><span className="table-badge">{p.category}</span></td>
                      <td><strong>₹{p.price?.toLocaleString("en-IN")}</strong></td>
                      <td>
                        <span style={{color: p.stock>10?"var(--success)":p.stock>0?"var(--warning)":"var(--error)",
                          fontWeight:600}}>
                          {p.stock > 0 ? p.stock : "Out of stock"}
                        </span>
                      </td>
                      <td>
                        <div style={{display:"flex",gap:8}}>
                          <button className="table-btn edit" onClick={()=>openEdit(p)}>✏️ Edit</button>
                          <button className="table-btn delete" onClick={()=>handleDelete(p.id)}
                            disabled={deletingId===p.id}>
                            {deletingId===p.id?"…":"🗑️"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── ORDERS TAB ───────────────────────────────── */}
        {tab==="orders" && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th><th>Customer</th><th>Items</th>
                  <th>Total</th><th>Date</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan={6} style={{textAlign:"center",padding:40,color:"var(--text-muted)"}}>
                    No orders found
                  </td></tr>
                ) : filteredOrders.map(o => (
                  <tr key={o.orderId}>
                    <td><strong>#{o.orderId}</strong></td>
                    <td>
                      <p style={{fontWeight:500,fontSize:".88rem"}}>{o.fullName}</p>
                      <p style={{fontSize:".75rem",color:"var(--text-muted)"}}>{o.phone}</p>
                    </td>
                    <td>
                      <div style={{display:"flex",gap:4}}>
                        {o.items?.slice(0,2).map((item,i)=>(
                          <img key={i} src={item.imageUrl} alt={item.title}
                            style={{width:32,height:32,borderRadius:6,objectFit:"cover",border:"1px solid var(--border)"}}
                            title={item.title} />
                        ))}
                        {o.items?.length > 2 && (
                          <div style={{width:32,height:32,borderRadius:6,background:"var(--surface-2)",
                            display:"flex",alignItems:"center",justifyContent:"center",fontSize:".7rem",
                            fontWeight:700,color:"var(--text-muted)"}}>
                            +{o.items.length-2}
                          </div>
                        )}
                      </div>
                      <p style={{fontSize:".72rem",color:"var(--text-muted)",marginTop:3}}>
                        {o.items?.length} item{o.items?.length!==1?"s":""}
                      </p>
                    </td>
                    <td><strong>₹{o.total?.toLocaleString("en-IN")}</strong></td>
                    <td style={{fontSize:".78rem",color:"var(--text-muted)"}}>
                      {new Date(o.createdAt).toLocaleDateString("en-IN",
                        {day:"numeric",month:"short",year:"numeric"})}
                    </td>
                    <td>
                      <select
                        className="status-select"
                        value={o.status}
                        style={{ borderColor: STATUS_COLORS[o.status] || "var(--border)",
                          color: STATUS_COLORS[o.status] || "var(--text)" }}
                        onChange={e=>handleStatusChange(o.orderId, e.target.value)}
                      >
                        {STATUS_OPTIONS.map(s=>(
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── USERS TAB ────────────────────────────────── */}
        {tab==="users" && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th></tr>
              </thead>
              <tbody>
                {users
                  .filter(u =>
                    u.name?.toLowerCase().includes(search.toLowerCase()) ||
                    u.email?.toLowerCase().includes(search.toLowerCase())
                  )
                  .map(u => (
                    <tr key={u.id}>
                      <td style={{color:"var(--text-muted)",fontSize:".82rem"}}>{u.id}</td>
                      <td>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <div className="user-avatar">{u.name?.[0]?.toUpperCase()}</div>
                          <span style={{fontWeight:500}}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{color:"var(--text-muted)",fontSize:".88rem"}}>{u.email}</td>
                      <td>
                        <span className={`role-badge ${u.role==="ADMIN"?"admin":"user"}`}>
                          {u.role}
                        </span>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}
      </main>

      <style>{`
        .admin-page {
          display: flex;
          min-height: calc(100vh - var(--navbar-h));
          background: var(--bg);
        }

        /* Sidebar */
        .admin-sidebar {
          width: 220px; flex-shrink: 0;
          background: var(--primary);
          padding: 28px 0;
          position: sticky; top: var(--navbar-h);
          height: calc(100vh - var(--navbar-h));
          overflow-y: auto;
        }
        .admin-brand {
          color: #fff; font-family: var(--font-display);
          font-weight: 800; font-size: 1rem;
          padding: 0 20px 24px;
          border-bottom: 1px solid rgba(255,255,255,.1);
          margin-bottom: 16px;
        }
        .admin-nav { display: flex; flex-direction: column; }
        .admin-nav-item {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 20px;
          color: rgba(255,255,255,.7);
          font-weight: 500; font-size: .9rem;
          transition: all .15s; text-align: left;
          border-left: 3px solid transparent;
        }
        .admin-nav-item:hover { background: rgba(255,255,255,.08); color: #fff; }
        .admin-nav-item.active {
          background: rgba(249,115,22,.15);
          color: var(--accent);
          border-left-color: var(--accent);
        }

        /* Main */
        .admin-main { flex: 1; padding: 32px; overflow-x: hidden; }

        /* Stats */
        .stats-grid {
          display: grid; grid-template-columns: repeat(4,1fr);
          gap: 16px; margin-bottom: 32px;
        }
        .stat-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 20px; display: flex;
          align-items: center; gap: 16px;
        }
        .stat-icon {
          width: 48px; height: 48px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.4rem; flex-shrink: 0;
        }
        .stat-value {
          font-family: var(--font-display); font-weight: 800;
          font-size: 1.4rem;
        }
        .stat-label { font-size: .78rem; color: var(--text-muted); margin-top: 2px; }

        /* Tab header */
        .admin-tab-header {
          display: flex; justify-content: space-between;
          align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
        }
        .admin-tab-title {
          font-family: var(--font-display); font-weight: 700; font-size: 1.2rem;
        }
        .admin-search {
          padding: 9px 16px;
          border: 2px solid var(--border);
          border-radius: var(--radius); font-family: var(--font-body);
          font-size: .88rem; outline: none; min-width: 220px;
          transition: border-color .2s;
        }
        .admin-search:focus { border-color: var(--accent); }

        /* Form card */
        .admin-form-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 28px; margin-bottom: 24px;
        }
        .form-card-title {
          font-family: var(--font-display); font-weight: 700;
          font-size: 1rem; margin-bottom: 20px;
        }
        .product-form-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
        }
        .product-form-grid .span-2 { grid-column: span 2; }
        .product-form-grid textarea {
          resize: vertical; min-height: 80px;
          padding: 10px 14px; border: 2px solid var(--border);
          border-radius: var(--radius); font-family: var(--font-body);
          font-size: .9rem; outline: none; transition: border-color .2s;
        }
        .product-form-grid textarea:focus { border-color: var(--accent); }

        /* Table */
        .admin-table-wrap {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
        }
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th {
          background: var(--surface-2);
          padding: 13px 16px; text-align: left;
          font-size: .78rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: .06em;
          color: var(--text-muted);
          border-bottom: 1px solid var(--border);
        }
        .admin-table td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--border);
          font-size: .88rem; vertical-align: middle;
        }
        .admin-table tr:last-child td { border-bottom: none; }
        .admin-table tr:hover td { background: var(--surface-2); }

        .table-product-img {
          width: 48px; height: 48px; border-radius: 8px;
          object-fit: cover; border: 1px solid var(--border);
        }
        .table-product-title {
          font-weight: 500; font-size: .88rem; line-height: 1.3;
          max-width: 220px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .table-badge {
          background: var(--surface-2); padding: 3px 10px;
          border-radius: 999px; font-size: .72rem;
          font-weight: 600; color: var(--text-muted);
        }
        .table-btn {
          padding: 6px 12px; border-radius: 8px;
          font-size: .78rem; font-weight: 600; cursor: pointer;
          border: none; transition: opacity .15s;
        }
        .table-btn.edit {
          background: #dbeafe; color: #1d4ed8;
        }
        .table-btn.edit:hover { opacity:.8; }
        .table-btn.delete {
          background: #fee2e2; color: #b91c1c;
        }
        .table-btn.delete:hover { opacity:.8; }

        /* Status select */
        .status-select {
          padding: 6px 10px; border-radius: 8px;
          border: 2px solid; font-weight: 600;
          font-size: .8rem; background: #fff;
          cursor: pointer; outline: none;
        }

        /* Users */
        .user-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: var(--accent); color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: .85rem; flex-shrink: 0;
        }
        .role-badge {
          padding: 4px 12px; border-radius: 999px;
          font-size: .72rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: .06em;
        }
        .role-badge.admin { background: #fef3c7; color: #92400e; }
        .role-badge.user  { background: #dbeafe; color: #1d4ed8; }

        /* Responsive */
        @media (max-width: 1100px) {
          .stats-grid { grid-template-columns: repeat(2,1fr); }
        }
        @media (max-width: 800px) {
          .admin-sidebar { display: none; }
          .admin-main { padding: 20px 16px; }
          .stats-grid { grid-template-columns: 1fr 1fr; }
          .product-form-grid { grid-template-columns: 1fr; }
          .product-form-grid .span-2 { grid-column: span 1; }
          .admin-table { font-size: .78rem; }
          .admin-table th, .admin-table td { padding: 10px 10px; }
        }
        @media (max-width:520px) {
          .stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
