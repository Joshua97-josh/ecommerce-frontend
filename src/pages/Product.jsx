// ============================================================
//  pages/Product.jsx  —  Product detail page
//  Shows full info, image, quantity picker, add to cart
// ============================================================
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { productAPI, cartAPI } from "../services/api";

export default function Product() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { currentUser, isLoggedIn } = useAuth();
  const { addItem }  = useCart();

  const [product,  setProduct]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [qty,      setQty]      = useState(1);
  const [adding,   setAdding]   = useState(false);
  const [added,    setAdded]    = useState(false);
  const [related,  setRelated]  = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await productAPI.getById(id);
      setProduct(res.data);
      // Load related products from same category
      const relRes = await productAPI.getAll({ category: res.data.category });
      setRelated(relRes.data.filter((p) => p.id !== res.data.id).slice(0, 4));
    } catch {
      setError("Product not found.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isLoggedIn()) { navigate("/login"); return; }
    setAdding(true);
    try {
      await cartAPI.addToCart({
        userId:    currentUser.userId,
        productId: product.id,
        quantity:  qty,
      });
      addItem(product, qty);
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isLoggedIn()) { navigate("/login"); return; }
    await handleAddToCart();
    navigate("/checkout");
  };

  // ── Loading skeleton ────────────────────────────────────
  if (loading) return (
    <div className="container" style={{ padding: "60px 24px" }}>
      <div className="product-detail-grid">
        <div className="skeleton" style={{ height: 440, borderRadius: 16 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="skeleton" style={{ height: 32, width: "70%" }} />
          <div className="skeleton" style={{ height: 20, width: "40%" }} />
          <div className="skeleton" style={{ height: 80 }} />
          <div className="skeleton" style={{ height: 48, width: "50%" }} />
          <div className="skeleton" style={{ height: 52 }} />
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="container empty-state" style={{ paddingTop: 80 }}>
      <div className="empty-icon">😕</div>
      <h3>{error}</h3>
      <Link to="/" className="btn-primary" style={{ display:"inline-block", marginTop:16 }}>
        Back to Home
      </Link>
    </div>
  );

  const inStock = product.stock > 0;

  return (
    <div className="product-detail-page">
      <div className="container">

        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to={`/?category=${product.category}`}>{product.category}</Link>
          <span>/</span>
          <span className="breadcrumb-current">{product.title}</span>
        </nav>

        {/* Main detail grid */}
        <div className="product-detail-grid">

          {/* Left — Image */}
          <div className="product-img-panel">
            <img
              src={product.imageUrl || "https://via.placeholder.com/500"}
              alt={product.title}
              className="product-main-img"
            />
            {!inStock && (
              <div className="detail-out-badge">Out of Stock</div>
            )}
          </div>

          {/* Right — Info */}
          <div className="product-info-panel">
            <span className="detail-category-tag">{product.category}</span>
            <h1 className="detail-title">{product.title}</h1>

            {/* Price */}
            <div className="detail-price-row">
              <span className="detail-price">₹{product.price.toLocaleString("en-IN")}</span>
              <span className="detail-orig-price">
                ₹{(product.price * 1.2).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
              <span className="detail-discount">20% off</span>
            </div>

            {/* Stock indicator */}
            <div className={`stock-indicator ${inStock ? "in-stock" : "no-stock"}`}>
              {inStock
                ? `✓ In Stock (${product.stock} available)`
                : "✗ Out of Stock"}
            </div>

            {/* Description */}
            <p className="detail-desc">{product.description}</p>

            <div className="divider" />

            {/* Quantity picker */}
            {inStock && (
              <div className="qty-row">
                <span className="qty-label">Quantity</span>
                <div className="qty-control">
                  <button
                    className="qty-btn"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                  >−</button>
                  <span className="qty-val">{qty}</span>
                  <button
                    className="qty-btn"
                    onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                  >+</button>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="detail-actions">
              <button
                className={`btn-primary btn-lg ${added ? "btn-success" : ""}`}
                onClick={handleAddToCart}
                disabled={adding || !inStock}
              >
                {adding ? <span className="spinner" />
                  : added ? "✓ Added to Cart"
                  : "🛒 Add to Cart"}
              </button>
              <button
                className="btn-outline btn-lg"
                onClick={handleBuyNow}
                disabled={!inStock}
              >
                Buy Now
              </button>
            </div>

            {/* Perks */}
            <div className="detail-perks">
              {[
                ["🚚", "Free delivery on orders above ₹999"],
                ["🔄", "30-day hassle-free returns"],
                ["🔒", "Secure payment guaranteed"],
              ].map(([icon, text]) => (
                <div key={text} className="perk-item">
                  <span>{icon}</span><span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <section className="related-section">
            <h2 className="section-title">More from {product.category}</h2>
            <div className="related-grid">
              {related.map((p) => (
                <Link key={p.id} to={`/product/${p.id}`} className="related-card">
                  <img src={p.imageUrl} alt={p.title} className="related-img" />
                  <div className="related-info">
                    <p className="related-title">{p.title}</p>
                    <p className="price">₹{p.price.toLocaleString("en-IN")}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <style>{`
        .product-detail-page { padding: 32px 0 80px; }
        .breadcrumb {
          display: flex; align-items: center; gap: 8px;
          font-size: .85rem; color: var(--text-muted);
          margin-bottom: 32px;
        }
        .breadcrumb a { color: var(--text-muted); transition: color .15s; }
        .breadcrumb a:hover { color: var(--accent); }
        .breadcrumb-current { color: var(--text); font-weight: 500; }

        .product-detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 56px;
          align-items: start;
          margin-bottom: 64px;
        }

        /* Image panel */
        .product-img-panel { position: relative; }
        .product-main-img {
          width: 100%; border-radius: var(--radius-lg);
          object-fit: cover; max-height: 480px;
          box-shadow: var(--shadow);
        }
        .detail-out-badge {
          position: absolute; top: 16px; left: 16px;
          background: var(--error); color: #fff;
          padding: 6px 16px; border-radius: 999px;
          font-weight: 700; font-size: .85rem;
        }

        /* Info panel */
        .product-info-panel { display: flex; flex-direction: column; gap: 16px; }
        .detail-category-tag {
          display: inline-block;
          background: var(--accent-light); color: var(--accent);
          padding: 4px 14px; border-radius: 999px;
          font-size: .78rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: .06em;
          width: fit-content;
        }
        .detail-title {
          font-family: var(--font-display);
          font-size: 1.75rem; font-weight: 700;
          line-height: 1.25;
        }

        .detail-price-row { display: flex; align-items: baseline; gap: 14px; }
        .detail-price {
          font-family: var(--font-display);
          font-size: 2rem; font-weight: 800; color: var(--accent);
        }
        .detail-orig-price {
          font-size: 1.1rem; color: var(--text-muted);
          text-decoration: line-through;
        }
        .detail-discount {
          background: #dcfce7; color: #166534;
          padding: 2px 10px; border-radius: 999px;
          font-size: .78rem; font-weight: 700;
        }

        .stock-indicator {
          font-weight: 600; font-size: .88rem;
          padding: 6px 14px; border-radius: 8px;
          width: fit-content;
        }
        .in-stock { background: #dcfce7; color: #166534; }
        .no-stock  { background: #fee2e2; color: #b91c1c; }

        .detail-desc { color: var(--text-muted); line-height: 1.75; font-size: .95rem; }

        .qty-row { display: flex; align-items: center; gap: 20px; }
        .qty-label { font-weight: 600; font-size: .9rem; }

        .detail-actions { display: flex; gap: 14px; flex-wrap: wrap; }
        .btn-lg { padding: 14px 32px; font-size: 1rem; }
        .btn-success { background: var(--success) !important; }

        .detail-perks {
          display: flex; flex-direction: column; gap: 10px;
          padding: 16px; background: var(--surface-2);
          border-radius: var(--radius); margin-top: 4px;
        }
        .perk-item {
          display: flex; align-items: center; gap: 10px;
          font-size: .85rem; color: var(--text-muted);
        }

        /* Related */
        .related-section { margin-top: 16px; }
        .related-grid {
          display: grid;
          grid-template-columns: repeat(4,1fr);
          gap: 20px; margin-top: 20px;
        }
        .related-card {
          background: var(--surface); border-radius: var(--radius);
          border: 1px solid var(--border); overflow: hidden;
          transition: transform .2s, box-shadow .2s;
        }
        .related-card:hover { transform: translateY(-3px); box-shadow: var(--shadow); }
        .related-img { width:100%; height:150px; object-fit:cover; }
        .related-info { padding: 12px; }
        .related-title {
          font-size: .85rem; font-weight: 500;
          margin-bottom: 6px;
          display:-webkit-box; -webkit-line-clamp:2;
          -webkit-box-orient:vertical; overflow:hidden;
        }

        @media (max-width: 900px) {
          .product-detail-grid { grid-template-columns: 1fr; gap: 32px; }
          .related-grid { grid-template-columns: repeat(2,1fr); }
        }
        @media (max-width: 480px) {
          .detail-title { font-size: 1.4rem; }
          .detail-price { font-size: 1.6rem; }
          .detail-actions { flex-direction: column; }
          .btn-lg { width: 100%; }
          .related-grid { grid-template-columns: repeat(2,1fr); }
        }
      `}</style>
    </div>
  );
}
