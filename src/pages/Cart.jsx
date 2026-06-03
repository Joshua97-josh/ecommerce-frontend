// ============================================================
//  pages/Cart.jsx  —  Full shopping cart page
//  Features: item list, qty controls, remove, summary, checkout
// ============================================================
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { cartAPI } from "../services/api";

export default function Cart() {
  const { currentUser }                           = useAuth();
  const { cartItems, setCart, removeItem,
          updateQuantity, cartTotal, cartCount }  = useCart();
  const navigate                                  = useNavigate();

  const [loading,  setLoading]  = useState(true);
  const [removing, setRemoving] = useState(null);  // cartId being removed
  const [error,    setError]    = useState("");

  // Load cart from API on mount
  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await cartAPI.getCart(currentUser.userId);
      // Map API response to context shape
      const items = res.data.map((item) => ({
        id:       item.cartId,
        product: {
          id:       item.productId,
          title:    item.title,
          imageUrl: item.imageUrl,
          price:    item.price,
          stock:    item.stock,
        },
        quantity: item.quantity,
      }));
      setCart(items);
    } catch (err) {
      setError("Failed to load cart. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  // ── Quantity update ────────────────────────────────────────
  const handleQtyChange = async (cartId, newQty) => {
    if (newQty < 1) return;
    updateQuantity(cartId, newQty);   // optimistic
    try {
      await cartAPI.updateQty(cartId, newQty);
    } catch {
      fetchCart();   // revert on error
    }
  };

  // ── Remove item ────────────────────────────────────────────
  const handleRemove = async (cartId) => {
    setRemoving(cartId);
    try {
      await cartAPI.removeItem(cartId);
      removeItem(cartId);
    } catch {
      setError("Failed to remove item.");
    } finally {
      setRemoving(null);
    }
  };

  // ── Derived values ─────────────────────────────────────────
  const deliveryFee  = cartTotal >= 999 ? 0 : 79;
  const discount     = Math.round(cartTotal * 0.05);   // 5% discount simulation
  const finalTotal   = cartTotal - discount + deliveryFee;

  // ── Loading ────────────────────────────────────────────────
  if (loading) return (
    <div className="container" style={{ padding: "60px 0" }}>
      <h1 className="section-title" style={{ marginBottom: 32 }}>Your Cart</h1>
      <div style={{ display: "flex", gap: 32 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          {[1,2,3].map(i => (
            <div key={i} className="skeleton" style={{ height: 120, borderRadius: 12 }} />
          ))}
        </div>
        <div className="skeleton" style={{ width: 320, height: 320, borderRadius: 12, flexShrink: 0 }} />
      </div>
    </div>
  );

  // ── Empty cart ─────────────────────────────────────────────
  if (!loading && cartItems.length === 0) return (
    <div className="container empty-state" style={{ paddingTop: 80 }}>
      <div className="empty-icon">🛒</div>
      <h3>Your cart is empty</h3>
      <p>Looks like you haven't added anything yet. Start shopping!</p>
      <Link to="/" className="btn-primary">Browse Products</Link>
    </div>
  );

  return (
    <div className="cart-page">
      <div className="container">

        {/* Header */}
        <div className="cart-header">
          <h1 className="section-title">
            Your Cart <span className="cart-count-badge">{cartCount}</span>
          </h1>
          <Link to="/" className="btn-outline btn-sm">← Continue Shopping</Link>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="cart-layout">

          {/* ── Left: Cart Items ─────────────────────────── */}
          <div className="cart-items-col">
            {cartItems.map((item) => (
              <div key={item.id} className="cart-item">

                {/* Product image */}
                <Link to={`/product/${item.product.id}`} className="cart-item-img-wrap">
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.title}
                    className="cart-item-img"
                  />
                </Link>

                {/* Product info */}
                <div className="cart-item-info">
                  <Link to={`/product/${item.product.id}`} className="cart-item-title">
                    {item.product.title}
                  </Link>
                  <p className="cart-item-price">
                    ₹{item.product.price.toLocaleString("en-IN")} / unit
                  </p>

                  <div className="cart-item-controls">
                    {/* Quantity control */}
                    <div className="qty-control">
                      <button
                        className="qty-btn"
                        onClick={() => handleQtyChange(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >−</button>
                      <span className="qty-val">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => handleQtyChange(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                      >+</button>
                    </div>

                    {/* Remove button */}
                    <button
                      className="btn-danger"
                      onClick={() => handleRemove(item.id)}
                      disabled={removing === item.id}
                    >
                      {removing === item.id ? "Removing…" : "🗑 Remove"}
                    </button>
                  </div>
                </div>

                {/* Line total */}
                <div className="cart-item-subtotal">
                  <span className="price">
                    ₹{(item.product.price * item.quantity).toLocaleString("en-IN")}
                  </span>
                  {item.quantity > 1 && (
                    <span className="subtotal-units">{item.quantity} units</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ── Right: Order Summary ─────────────────────── */}
          <aside className="cart-summary">
            <h2 className="summary-title">Order Summary</h2>

            <div className="summary-rows">
              <div className="summary-row">
                <span>Subtotal ({cartCount} items)</span>
                <span>₹{cartTotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="summary-row discount">
                <span>🎉 Discount (5%)</span>
                <span>− ₹{discount.toLocaleString("en-IN")}</span>
              </div>
              <div className="summary-row">
                <span>Delivery Fee</span>
                <span>
                  {deliveryFee === 0
                    ? <span className="free-tag">FREE</span>
                    : `₹${deliveryFee}`}
                </span>
              </div>
              {deliveryFee > 0 && (
                <p className="free-delivery-hint">
                  Add ₹{(999 - cartTotal).toFixed(0)} more for free delivery
                </p>
              )}
            </div>

            <div className="divider" />

            <div className="summary-total">
              <span>Total</span>
              <span className="total-amount">₹{finalTotal.toLocaleString("en-IN")}</span>
            </div>

            <p className="summary-savings">
              You save ₹{discount.toLocaleString("en-IN")} on this order 🎉
            </p>

            <button
              className="btn-primary btn-full checkout-btn"
              onClick={() => navigate("/checkout")}
            >
              Proceed to Checkout →
            </button>

            {/* Trust badges */}
            <div className="trust-badges">
              <span>🔒 Secure Checkout</span>
              <span>🚚 Fast Delivery</span>
              <span>🔄 Easy Returns</span>
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        .cart-page { padding: 40px 0 80px; }

        .cart-header {
          display: flex; align-items: center;
          justify-content: space-between;
          margin-bottom: 32px; flex-wrap: wrap; gap: 12px;
        }
        .cart-count-badge {
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--accent); color: #fff;
          width: 28px; height: 28px; border-radius: 50%;
          font-size: .85rem; font-weight: 700;
          font-family: var(--font-body);
          vertical-align: middle; margin-left: 8px;
        }

        /* Layout */
        .cart-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 32px;
          align-items: start;
        }

        /* Cart items */
        .cart-items-col { display: flex; flex-direction: column; gap: 16px; }

        .cart-item {
          display: flex;
          align-items: center;
          gap: 20px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 20px;
          transition: box-shadow .2s;
        }
        .cart-item:hover { box-shadow: var(--shadow-sm); }

        .cart-item-img-wrap {
          flex-shrink: 0;
          width: 100px; height: 100px;
          border-radius: 10px; overflow: hidden;
          background: var(--surface-2);
        }
        .cart-item-img {
          width: 100%; height: 100%;
          object-fit: cover;
          transition: transform .3s;
        }
        .cart-item-img-wrap:hover .cart-item-img { transform: scale(1.05); }

        .cart-item-info { flex: 1; display: flex; flex-direction: column; gap: 8px; }
        .cart-item-title {
          font-family: var(--font-display); font-weight: 600;
          font-size: .95rem; color: var(--text);
          transition: color .15s; line-height: 1.3;
        }
        .cart-item-title:hover { color: var(--accent); }
        .cart-item-price { font-size: .82rem; color: var(--text-muted); }

        .cart-item-controls { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

        .cart-item-subtotal {
          flex-shrink: 0;
          text-align: right;
          display: flex; flex-direction: column; align-items: flex-end; gap: 4px;
        }
        .cart-item-subtotal .price { font-size: 1.1rem; }
        .subtotal-units { font-size: .75rem; color: var(--text-muted); }

        /* Order Summary */
        .cart-summary {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 28px;
          position: sticky; top: 90px;
        }
        .summary-title {
          font-family: var(--font-display); font-weight: 700;
          font-size: 1.15rem; margin-bottom: 20px;
        }
        .summary-rows { display: flex; flex-direction: column; gap: 14px; }
        .summary-row {
          display: flex; justify-content: space-between;
          align-items: center; font-size: .9rem;
        }
        .summary-row.discount { color: var(--success); font-weight: 500; }
        .free-tag {
          background: #dcfce7; color: #166534;
          padding: 2px 10px; border-radius: 999px;
          font-size: .75rem; font-weight: 700;
        }
        .free-delivery-hint {
          font-size: .78rem; color: var(--accent);
          font-weight: 500; text-align: center;
          background: var(--accent-light);
          padding: 8px 12px; border-radius: 8px;
          margin-top: -4px;
        }
        .summary-total {
          display: flex; justify-content: space-between;
          align-items: center; font-weight: 700;
          font-size: 1rem; margin-bottom: 6px;
        }
        .total-amount {
          font-family: var(--font-display); font-size: 1.4rem;
          color: var(--accent);
        }
        .summary-savings {
          font-size: .8rem; color: var(--success);
          font-weight: 500; text-align: center;
          margin-bottom: 20px;
        }
        .checkout-btn { font-size: 1rem; padding: 14px; margin-top: 4px; }
        .trust-badges {
          display: flex; justify-content: space-between;
          margin-top: 16px; padding-top: 16px;
          border-top: 1px solid var(--border);
          font-size: .73rem; color: var(--text-muted);
          flex-wrap: wrap; gap: 6px;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .cart-layout { grid-template-columns: 1fr; }
          .cart-summary { position: static; }
        }
        @media (max-width: 600px) {
          .cart-item { flex-wrap: wrap; }
          .cart-item-img-wrap { width: 80px; height: 80px; }
          .cart-item-subtotal { width: 100%; flex-direction: row; justify-content: space-between; }
        }
      `}</style>
    </div>
  );
}
