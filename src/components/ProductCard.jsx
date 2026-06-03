// ============================================================
//  components/ProductCard.jsx
//  Reusable product card shown on Home and search results
// ============================================================
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { cartAPI } from "../services/api";
import { useState } from "react";

export default function ProductCard({ product }) {
  const { currentUser, isLoggedIn } = useAuth();
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const [added,  setAdded]  = useState(false);

  const handleAddToCart = async (e) => {
    e.preventDefault(); // prevent Link navigation
    if (!isLoggedIn()) { window.location.href = "/login"; return; }

    setAdding(true);
    try {
      await cartAPI.addToCart({
        userId:    currentUser.userId,
        productId: product.id,
        quantity:  1,
      });
      addItem(product, 1);   // optimistic local update
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error("Add to cart failed:", err);
    } finally {
      setAdding(false);
    }
  };

  const inStock = product.stock > 0;

  return (
    <Link to={`/product/${product.id}`} className="product-card">
      {/* Image */}
      <div className="product-card-img-wrap">
        <img
          src={product.imageUrl || "https://via.placeholder.com/300x220?text=No+Image"}
          alt={product.title}
          className="product-card-img"
          loading="lazy"
        />
        {!inStock && <div className="out-of-stock-overlay">Out of Stock</div>}
        <div className="product-category-tag">{product.category}</div>
      </div>

      {/* Info */}
      <div className="product-card-body">
        <h3 className="product-card-title">{product.title}</h3>
        <p className="product-card-desc">
          {product.description?.slice(0, 72)}
          {product.description?.length > 72 ? "…" : ""}
        </p>

        <div className="product-card-footer">
          <span className="price">₹{product.price.toLocaleString("en-IN")}</span>
          <button
            className={`btn-add-cart ${added ? "btn-added" : ""}`}
            onClick={handleAddToCart}
            disabled={adding || !inStock}
            aria-label="Add to cart"
          >
            {adding ? "…" : added ? "✓ Added" : "+ Cart"}
          </button>
        </div>
      </div>

      <style>{`
        .product-card {
          display: flex; flex-direction: column;
          background: var(--surface);
          border-radius: var(--radius);
          border: 1px solid var(--border);
          overflow: hidden;
          transition: transform .2s, box-shadow .2s;
          cursor: pointer;
          text-decoration: none; color: inherit;
        }
        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow);
        }
        .product-card-img-wrap {
          position: relative;
          height: 200px;
          background: var(--surface-2);
          overflow: hidden;
        }
        .product-card-img {
          width: 100%; height: 100%;
          object-fit: cover;
          transition: transform .35s;
        }
        .product-card:hover .product-card-img { transform: scale(1.06); }
        .out-of-stock-overlay {
          position: absolute; inset: 0;
          background: rgba(0,0,0,.45);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 700; font-size: .9rem;
          letter-spacing: .05em;
        }
        .product-category-tag {
          position: absolute; top: 10px; left: 10px;
          background: var(--primary); color: #fff;
          padding: 3px 10px; border-radius: 999px;
          font-size: .7rem; font-weight: 600;
          text-transform: uppercase; letter-spacing: .06em;
        }
        .product-card-body {
          padding: 16px; display: flex;
          flex-direction: column; gap: 8px; flex: 1;
        }
        .product-card-title {
          font-family: var(--font-display);
          font-weight: 600; font-size: .95rem;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .product-card-desc {
          font-size: .8rem; color: var(--text-muted);
          line-height: 1.5; flex: 1;
        }
        .product-card-footer {
          display: flex; align-items: center;
          justify-content: space-between; margin-top: 4px;
        }
        .btn-add-cart {
          background: var(--accent); color: #fff;
          padding: 7px 14px; border-radius: 8px;
          font-size: .8rem; font-weight: 700;
          font-family: var(--font-display);
          transition: background .2s, transform .15s;
          border: none; cursor: pointer;
        }
        .btn-add-cart:hover:not(:disabled) {
          background: var(--accent-hover); transform: scale(1.05);
        }
        .btn-add-cart:disabled { opacity: .6; cursor: not-allowed; }
        .btn-added { background: var(--success) !important; }
      `}</style>
    </Link>
  );
}
