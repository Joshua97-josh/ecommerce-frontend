// ============================================================
//  pages/Orders.jsx  —  Order history with status + cancel
// ============================================================
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { orderAPI } from "../services/api";

// Map status → badge class + label
const STATUS_META = {
  PENDING:   { cls: "badge-pending",   label: "Pending",   icon: "🕐" },
  CONFIRMED: { cls: "badge-confirmed", label: "Confirmed", icon: "✅" },
  SHIPPED:   { cls: "badge-shipped",   label: "Shipped",   icon: "🚚" },
  DELIVERED: { cls: "badge-delivered", label: "Delivered", icon: "📦" },
  CANCELLED: { cls: "badge-cancelled", label: "Cancelled", icon: "❌" },
};

export default function Orders() {
  const { currentUser }       = useAuth();
  const location              = useLocation();
  const [orders,   setOrders] = useState([]);
  const [loading,  setLoading]= useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [expanded, setExpanded]     = useState(null);
  const [successMsg, setSuccessMsg] = useState(
    location.state?.success ? "🎉 Order placed successfully!" : ""
  );

  useEffect(() => {
    fetchOrders();
    if (successMsg) setTimeout(() => setSuccessMsg(""), 5000);
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderAPI.getUserOrders(currentUser.userId);
      setOrders(res.data);
      // Auto-expand the newest order if came from checkout
      if (location.state?.newOrderId && res.data.length > 0) {
        setExpanded(location.state.newOrderId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    setCancelling(orderId);
    try {
      const res = await orderAPI.cancelOrder(orderId);
      setOrders((prev) =>
        prev.map((o) => o.orderId === orderId ? { ...o, status: "CANCELLED" } : o)
      );
    } catch (err) {
      alert(err.response?.data?.message || "Could not cancel order");
    } finally {
      setCancelling(null);
    }
  };

  const formatDate = (dt) =>
    new Date(dt).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  // ── Loading ────────────────────────────────────────────────
  if (loading) return (
    <div className="container" style={{ padding: "60px 0" }}>
      <h1 className="section-title" style={{ marginBottom: 32 }}>My Orders</h1>
      {[1,2,3].map(i => (
        <div key={i} className="skeleton" style={{ height: 120, borderRadius: 12, marginBottom: 16 }} />
      ))}
    </div>
  );

  // ── Empty ──────────────────────────────────────────────────
  if (!loading && orders.length === 0) return (
    <div className="container empty-state" style={{ paddingTop: 80 }}>
      <div className="empty-icon">📦</div>
      <h3>No orders yet</h3>
      <p>You haven't placed any orders. Start shopping!</p>
      <Link to="/" className="btn-primary">Browse Products</Link>
    </div>
  );

  return (
    <div className="orders-page">
      <div className="container">

        <div className="orders-header">
          <h1 className="section-title">My Orders</h1>
          <span className="order-total-badge">{orders.length} order{orders.length !== 1 ? "s" : ""}</span>
        </div>

        {successMsg && (
          <div className="alert alert-success" style={{ marginBottom: 24 }}>{successMsg}</div>
        )}

        <div className="orders-list">
          {orders.map((order) => {
            const meta    = STATUS_META[order.status] || STATUS_META.PENDING;
            const isOpen  = expanded === order.orderId;
            const canCancel = ["PENDING","CONFIRMED"].includes(order.status);

            return (
              <div key={order.orderId} className={`order-card ${isOpen ? "open" : ""}`}>

                {/* Order header row */}
                <div className="order-header" onClick={() =>
                  setExpanded(isOpen ? null : order.orderId)}>

                  <div className="order-header-left">
                    <div className="order-id">Order #{order.orderId}</div>
                    <div className="order-date">{formatDate(order.createdAt)}</div>
                  </div>

                  <div className="order-header-center">
                    {/* First item preview */}
                    {order.items.slice(0, 2).map((item, i) => (
                      <img key={i} src={item.imageUrl} alt={item.title}
                        className="order-thumb" title={item.title} />
                    ))}
                    {order.items.length > 2 && (
                      <div className="order-thumb-more">+{order.items.length - 2}</div>
                    )}
                    <span className="order-item-count">
                      {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="order-header-right">
                    <span className={`badge ${meta.cls}`}>{meta.icon} {meta.label}</span>
                    <span className="order-total-val">
                      ₹{order.total.toLocaleString("en-IN")}
                    </span>
                    <span className="expand-arrow">{isOpen ? "▲" : "▼"}</span>
                  </div>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="order-detail">

                    {/* Order items */}
                    <div className="order-items-list">
                      {order.items.map((item, i) => (
                        <div key={i} className="order-item-row">
                          <img src={item.imageUrl} alt={item.title} className="order-item-img" />
                          <div className="order-item-info">
                            <p className="order-item-title">{item.title}</p>
                            <p className="order-item-meta">
                              Qty: {item.quantity} × ₹{item.price.toLocaleString("en-IN")}
                            </p>
                          </div>
                          <span className="price" style={{ fontSize:".95rem" }}>
                            ₹{item.subtotal.toLocaleString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="order-detail-footer">
                      {/* Shipping address */}
                      <div className="order-address-box">
                        <p className="detail-sub-title">📍 Delivered to</p>
                        <p className="order-address-text">
                          <strong>{order.fullName}</strong> · {order.phone}<br />
                          {order.addressLine}, {order.city}, {order.state} — {order.pincode}
                        </p>
                        <p className="order-payment-tag">
                          💳 {order.paymentMethod === "COD" ? "Cash on Delivery" : order.paymentMethod}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="order-actions">
                        <div className="order-total-breakdown">
                          <div className="total-row">
                            <span>Order Total</span>
                            <span className="price" style={{ fontSize:"1.1rem" }}>
                              ₹{order.total.toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                        {canCancel && (
                          <button
                            className="btn-danger"
                            style={{ padding:"10px 20px", fontSize:".88rem" }}
                            onClick={() => handleCancel(order.orderId)}
                            disabled={cancelling === order.orderId}
                          >
                            {cancelling === order.orderId ? "Cancelling…" : "Cancel Order"}
                          </button>
                        )}
                        <Link to={`/?`} className="btn-outline" style={{ padding:"10px 20px", fontSize:".88rem" }}>
                          Buy Again
                        </Link>
                      </div>
                    </div>

                    {/* Status timeline */}
                    <div className="status-timeline">
                      {["CONFIRMED","SHIPPED","DELIVERED"].map((s, i) => {
                        const reached = ["CONFIRMED","SHIPPED","DELIVERED"].indexOf(order.status) >= i;
                        const cancelled = order.status === "CANCELLED";
                        return (
                          <div key={s} className={`timeline-step ${reached && !cancelled ? "reached" : ""} ${cancelled ? "cancelled" : ""}`}>
                            <div className="timeline-dot" />
                            <span className="timeline-label">
                              {s === "CONFIRMED" ? "Order Confirmed" : s === "SHIPPED" ? "Shipped" : "Delivered"}
                            </span>
                            {i < 2 && <div className="timeline-line" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .orders-page { padding: 40px 0 80px; }
        .orders-header {
          display: flex; align-items: center; gap: 14px;
          margin-bottom: 32px;
        }
        .order-total-badge {
          background: var(--surface-2); color: var(--text-muted);
          padding: 4px 14px; border-radius: 999px;
          font-size: .82rem; font-weight: 600;
        }
        .orders-list { display: flex; flex-direction: column; gap: 16px; }

        /* Order card */
        .order-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
          transition: box-shadow .2s;
        }
        .order-card:hover { box-shadow: var(--shadow-sm); }
        .order-card.open  { box-shadow: var(--shadow); border-color: var(--accent); }

        .order-header {
          display: flex; align-items: center;
          padding: 20px 24px; gap: 24px;
          cursor: pointer; flex-wrap: wrap;
        }
        .order-header-left { min-width: 140px; }
        .order-id   { font-family:var(--font-display); font-weight:700; font-size:.95rem; }
        .order-date { font-size:.78rem; color:var(--text-muted); margin-top:3px; }

        .order-header-center {
          display: flex; align-items: center; gap: 8px; flex: 1;
        }
        .order-thumb {
          width: 44px; height: 44px; border-radius: 8px;
          object-fit: cover; border: 2px solid var(--border);
        }
        .order-thumb-more {
          width: 44px; height: 44px; border-radius: 8px;
          background: var(--surface-2); display: flex;
          align-items: center; justify-content: center;
          font-size: .78rem; font-weight: 700; color: var(--text-muted);
          border: 2px solid var(--border);
        }
        .order-item-count { font-size:.82rem; color:var(--text-muted); margin-left:4px; }

        .order-header-right {
          display: flex; align-items: center; gap: 16px;
          flex-shrink: 0;
        }
        .order-total-val {
          font-family: var(--font-display); font-weight: 700; font-size:1rem;
        }
        .expand-arrow { color: var(--text-muted); font-size:.8rem; }

        /* Detail */
        .order-detail {
          border-top: 1px solid var(--border);
          padding: 24px;
        }
        .order-items-list { display: flex; flex-direction: column; gap: 14px; margin-bottom: 24px; }
        .order-item-row {
          display: flex; align-items: center; gap: 14px;
        }
        .order-item-img {
          width: 56px; height: 56px; border-radius: 8px;
          object-fit: cover; flex-shrink: 0;
          background: var(--surface-2);
        }
        .order-item-info { flex: 1; }
        .order-item-title { font-weight:500; font-size:.9rem; line-height:1.3; }
        .order-item-meta  { font-size:.78rem; color:var(--text-muted); margin-top:3px; }

        .order-detail-footer {
          display: flex; justify-content: space-between;
          align-items: flex-start; gap: 24px;
          padding-top: 20px; border-top: 1px solid var(--border);
          flex-wrap: wrap;
        }
        .order-address-box { flex: 1; }
        .detail-sub-title { font-weight:600; font-size:.85rem; margin-bottom:6px; }
        .order-address-text { font-size:.83rem; color:var(--text-muted); line-height:1.7; }
        .order-payment-tag {
          display:inline-block; margin-top:8px;
          background:var(--surface-2); padding:4px 12px;
          border-radius:999px; font-size:.75rem; font-weight:600;
        }
        .order-actions { display:flex; flex-direction:column; gap:10px; align-items:flex-end; }
        .total-row {
          display:flex; justify-content:space-between; gap:24px;
          align-items:center; font-weight:500; font-size:.9rem;
        }

        /* Timeline */
        .status-timeline {
          display: flex; align-items: center;
          margin-top: 24px; padding-top: 20px;
          border-top: 1px solid var(--border);
        }
        .timeline-step {
          display: flex; align-items: center; flex: 1; position: relative;
        }
        .timeline-dot {
          width: 14px; height: 14px; border-radius: 50%;
          background: var(--border); flex-shrink: 0;
          transition: background .3s;
        }
        .timeline-step.reached .timeline-dot { background: var(--success); }
        .timeline-step.cancelled .timeline-dot { background: var(--error); }
        .timeline-label {
          font-size:.72rem; color:var(--text-muted); font-weight:500;
          margin-left:6px; white-space:nowrap;
        }
        .timeline-step.reached .timeline-label { color:var(--success); }
        .timeline-line {
          flex:1; height:2px; background:var(--border); margin:0 8px;
        }
        .timeline-step.reached + .timeline-step .timeline-line { background:var(--success); }

        @media (max-width:700px) {
          .order-header { padding:16px; gap:12px; }
          .order-header-center { display:none; }
          .order-detail-footer { flex-direction:column; }
          .order-actions { align-items:flex-start; width:100%; }
          .status-timeline { display:none; }
        }
      `}</style>
    </div>
  );
}
