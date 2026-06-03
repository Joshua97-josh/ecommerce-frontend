// ============================================================
//  pages/Home.jsx  —  Landing page
//  Sections: Hero Banner, Categories, Product Grid, Offers
// ============================================================
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { productAPI } from "../services/api";

const CATEGORIES = ["All", "Electronics", "Clothing", "Footwear", "Accessories", "Bags", "Sports", "Kitchen"];

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products,   setProducts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [activeCategory, setActiveCategory] = useState(
    searchParams.get("category") || "All"
  );

  // Fetch products whenever category changes
  useEffect(() => {
    fetchProducts();
  }, [activeCategory]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeCategory !== "All") params.category = activeCategory;
      if (search.trim()) params.search = search.trim();
      const res = await productAPI.getAll(params);
      setProducts(res.data);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleCategory = (cat) => {
    setActiveCategory(cat);
    setSearch("");
    if (cat === "All") setSearchParams({});
    else setSearchParams({ category: cat });
  };

  return (
    <div className="home-page">

      {/* ── Hero Banner ─────────────────────────────────── */}
      <section className="hero">
        <div className="hero-content">
          <span className="hero-eyebrow">🔥 Summer Sale — Up to 50% Off</span>
          <h1 className="hero-title">
            Shop Smarter,<br />
            <span className="hero-accent">Live Better</span>
          </h1>
          <p className="hero-sub">
            Discover thousands of products across Electronics, Fashion, Sports & more.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="hero-search">
            <input
              type="text"
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="hero-search-input"
            />
            <button type="submit" className="hero-search-btn">Search</button>
          </form>
        </div>

        {/* Floating product images (decorative) */}
        <div className="hero-visual">
          <div className="hero-img-stack">
            {[
              "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=220",
              "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=220",
              "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=220",
            ].map((src, i) => (
              <img key={i} src={src} alt="" className={`hero-float-img hero-float-${i}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Offer Banners ────────────────────────────────── */}
      <section className="container offers-row">
        {[
          { icon: "🚚", title: "Free Delivery",  sub: "On orders above ₹999" },
          { icon: "🔄", title: "Easy Returns",   sub: "30-day return policy" },
          { icon: "🔒", title: "Secure Payment", sub: "100% safe checkout" },
          { icon: "🎁", title: "Gift Wrapping",  sub: "Available on request" },
        ].map((b) => (
          <div key={b.title} className="offer-card">
            <span className="offer-icon">{b.icon}</span>
            <div>
              <p className="offer-title">{b.title}</p>
              <p className="offer-sub">{b.sub}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ── Categories ───────────────────────────────────── */}
      <section className="container categories-section">
        <h2 className="section-title">Shop by Category</h2>
        <div className="category-chips">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`category-chip ${activeCategory === cat ? "active" : ""}`}
              onClick={() => handleCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* ── Product Grid ─────────────────────────────────── */}
      <section className="container products-section">
        <div className="products-header">
          <h2 className="section-title">
            {activeCategory === "All" ? "All Products" : activeCategory}
            {!loading && <span className="product-count"> ({products.length})</span>}
          </h2>
        </div>

        {loading ? (
          <div className="grid-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton" style={{ height: 200 }} />
                <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div className="skeleton" style={{ height: 18, width: "80%" }} />
                  <div className="skeleton" style={{ height: 14, width: "60%" }} />
                  <div className="skeleton" style={{ height: 36, marginTop: 8 }} />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No products found</h3>
            <p>Try a different category or search term</p>
            <button className="btn-primary" onClick={() => handleCategory("All")}>
              View All Products
            </button>
          </div>
        ) : (
          <div className="grid-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* ── Promo Banner ─────────────────────────────────── */}
      <section className="promo-banner">
        <div className="container promo-inner">
          <div>
            <h2 className="promo-title">New Arrivals Every Week</h2>
            <p className="promo-sub">Sign up and be the first to know about exclusive deals</p>
          </div>
          <button className="btn-primary">Shop New Arrivals →</button>
        </div>
      </section>

      <style>{`
        /* ── Hero ── */
        .hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
          padding: 80px 80px 80px 80px;
          min-height: 480px;
          overflow: hidden;
          position: relative;
          gap: 40px;
        }
        .hero-content { flex: 1; max-width: 560px; z-index: 1; }
        .hero-eyebrow {
          display: inline-block;
          background: rgba(249,115,22,.15);
          color: var(--accent);
          padding: 6px 16px; border-radius: 999px;
          font-size: .85rem; font-weight: 600;
          margin-bottom: 20px;
          border: 1px solid rgba(249,115,22,.3);
        }
        .hero-title {
          font-family: var(--font-display);
          font-size: clamp(2rem, 4vw, 3.2rem);
          font-weight: 800;
          color: #fff;
          line-height: 1.15;
          margin-bottom: 16px;
        }
        .hero-accent { color: var(--accent); }
        .hero-sub { color: rgba(255,255,255,.7); font-size: 1.05rem; margin-bottom: 32px; line-height: 1.6; }
        .hero-search {
          display: flex; gap: 0;
          background: #fff;
          border-radius: var(--radius);
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,.25);
          max-width: 480px;
        }
        .hero-search-input {
          flex: 1; padding: 14px 20px;
          border: none; outline: none;
          font-size: .95rem; font-family: var(--font-body);
          color: var(--text);
        }
        .hero-search-btn {
          background: var(--accent); color: #fff;
          padding: 14px 24px;
          font-family: var(--font-display); font-weight: 700;
          font-size: .9rem; border: none; cursor: pointer;
          transition: background .2s;
        }
        .hero-search-btn:hover { background: var(--accent-hover); }

        /* ── Hero visual ── */
        .hero-visual { flex-shrink: 0; position: relative; width: 300px; height: 300px; }
        .hero-img-stack { position: relative; width: 100%; height: 100%; }
        .hero-float-img {
          position: absolute;
          border-radius: var(--radius);
          object-fit: cover;
          box-shadow: var(--shadow-lg);
        }
        .hero-float-0 { width:160px;height:160px; top:0;   right:0;   animation: float 4s ease-in-out infinite; }
        .hero-float-1 { width:130px;height:130px; bottom:20px; left:0;  animation: float 4s ease-in-out infinite .8s; }
        .hero-float-2 { width:110px;height:110px; bottom:60px; right:40px; animation: float 4s ease-in-out infinite 1.6s; }
        @keyframes float {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-12px); }
        }

        /* ── Offers ── */
        .offers-row {
          display: grid;
          grid-template-columns: repeat(4,1fr);
          gap: 16px;
          margin: 40px auto;
        }
        .offer-card {
          display: flex; align-items: center; gap: 14px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 18px 20px;
          box-shadow: var(--shadow-sm);
        }
        .offer-icon { font-size: 1.8rem; flex-shrink: 0; }
        .offer-title { font-weight: 600; font-size: .9rem; margin-bottom: 2px; }
        .offer-sub   { font-size: .78rem; color: var(--text-muted); }

        /* ── Categories ── */
        .categories-section { margin-bottom: 40px; }
        .category-chips { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px; }
        .category-chip {
          padding: 8px 20px; border-radius: 999px;
          border: 2px solid var(--border);
          background: var(--surface);
          font-family: var(--font-display); font-weight: 600;
          font-size: .85rem; cursor: pointer;
          transition: all .2s;
        }
        .category-chip:hover { border-color: var(--accent); color: var(--accent); }
        .category-chip.active {
          background: var(--accent); color: #fff;
          border-color: var(--accent);
        }

        /* ── Products ── */
        .products-section { margin-bottom: 60px; }
        .products-header { margin-bottom: 24px; }
        .product-count { color: var(--text-muted); font-size: 1rem; font-weight: 400; }
        .skeleton-card {
          background: var(--surface);
          border-radius: var(--radius);
          border: 1px solid var(--border);
          overflow: hidden;
        }

        /* ── Promo ── */
        .promo-banner {
          background: linear-gradient(135deg, var(--accent) 0%, #f97316cc 100%);
          padding: 60px 0; margin-bottom: 0;
        }
        .promo-inner {
          display: flex; align-items: center;
          justify-content: space-between; gap: 24px;
          flex-wrap: wrap;
        }
        .promo-title {
          font-family: var(--font-display);
          font-size: 1.8rem; font-weight: 800;
          color: #fff; margin-bottom: 6px;
        }
        .promo-sub { color: rgba(255,255,255,.85); font-size: 1rem; }
        .promo-banner .btn-primary {
          background: #fff; color: var(--accent);
          flex-shrink: 0;
          box-shadow: 0 4px 16px rgba(0,0,0,.15);
        }
        .promo-banner .btn-primary:hover { background: #fff3e8; }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .offers-row { grid-template-columns: repeat(2,1fr); }
          .hero { padding: 60px 40px; }
          .hero-visual { width: 220px; height: 220px; }
        }
        @media (max-width: 768px) {
          .hero { flex-direction: column; padding: 48px 24px; text-align: center; }
          .hero-search { max-width: 100%; }
          .hero-visual { display: none; }
          .offers-row { grid-template-columns: 1fr 1fr; }
          .promo-inner { text-align: center; justify-content: center; }
        }
        @media (max-width: 480px) {
          .offers-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
