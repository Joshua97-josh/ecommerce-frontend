// ============================================================
//  pages/Checkout.jsx  —  3-step checkout with Razorpay
//  Step 1: Address  →  Step 2: Payment  →  Step 3: Review & Pay
// ============================================================
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { cartAPI, orderAPI } from "../services/api";
import { loadRazorpayScript, openRazorpayModal } from "../services/paymentService";
import api from "../services/api";

const PAYMENT_METHODS = [
  { id: "COD",      label: "Cash on Delivery",                    icon: "💵", sub: "Pay when your order arrives" },
  { id: "RAZORPAY", label: "Razorpay — UPI / Card / Net Banking", icon: "💳", sub: "Secure payment via Razorpay" },
];

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Delhi","Jammu & Kashmir","Ladakh","Puducherry",
];

export default function Checkout() {
  const { currentUser }           = useAuth();
  const { cartItems, setCart,
          cartTotal, clearCart }  = useCart();
  const navigate                  = useNavigate();

  const [step,     setStep]    = useState(1);
  const [loading,  setLoading] = useState(true);
  const [placing,  setPlacing] = useState(false);
  const [error,    setError]   = useState("");

  const [address, setAddress] = useState({
    fullName: currentUser?.name || "",
    phone: "", addressLine: "", city: "", state: "", pincode: "",
  });
  const [payment, setPayment] = useState("COD");

  // Load cart if navigated directly
  useEffect(() => {
    if (cartItems.length === 0) {
      cartAPI.getCart(currentUser.userId)
        .then((res) => {
          const items = res.data.map((item) => ({
            id: item.cartId,
            product: { id: item.productId, title: item.title,
              imageUrl: item.imageUrl, price: item.price, stock: item.stock },
            quantity: item.quantity,
          }));
          setCart(items);
          if (items.length === 0) navigate("/cart");
        })
        .catch(() => navigate("/cart"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Derived totals
  const deliveryFee = cartTotal >= 999 ? 0 : 79;
  const discount    = Math.round(cartTotal * 0.05);
  const finalTotal  = cartTotal - discount + deliveryFee;

  const handleAddressChange = (e) =>
    setAddress((p) => ({ ...p, [e.target.name]: e.target.value }));

  const validateAddress = () => {
    const { fullName, phone, addressLine, city, state, pincode } = address;
    if (!fullName || !phone || !addressLine || !city || !state || !pincode)
      return "Please fill in all required fields";
    if (!/^\d{10}$/.test(phone)) return "Enter a valid 10-digit phone number";
    if (!/^\d{6}$/.test(pincode)) return "Enter a valid 6-digit pincode";
    return "";
  };

  // ── Place order: COD path ─────────────────────────────────
  const placeCODOrder = async () => {
    setPlacing(true);
    try {
      const res = await orderAPI.placeOrder({
        userId: currentUser.userId, ...address,
        paymentMethod: "COD", paymentId: null,
      });
      clearCart();
      navigate("/orders", { state: { newOrderId: res.data.orderId, success: true } });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to place order");
    } finally { setPlacing(false); }
  };

  // ── Place order: Razorpay path ────────────────────────────
  const placeRazorpayOrder = async () => {
    setPlacing(true);
    setError("");

    // 1. Load Razorpay script
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setError("Failed to load payment gateway. Check your internet connection.");
      setPlacing(false); return;
    }

    try {
      // 2. Create Razorpay order on backend
      const createRes = await api.post("/api/payment/razorpay/create-order", {
        userId:   currentUser.userId,
        amount:   Math.round(finalTotal),   // INR — backend converts to paise
        currency: "INR",
      });
      const { id: razorpayOrderId, amount, keyId } = createRes.data;

      // 3. Open Razorpay modal
      openRazorpayModal({
        keyId,
        orderId:      razorpayOrderId,
        amount,
        prefillName:  address.fullName,
        prefillEmail: currentUser.email,
        prefillPhone: address.phone,

        // 4a. Payment succeeded → verify + place order
        onSuccess: async ({ razorpayPaymentId, razorpayOrderId: rpOrderId, razorpaySignature }) => {
          try {
            const verifyRes = await api.post("/api/payment/razorpay/verify", {
              razorpayOrderId:   rpOrderId,
              razorpayPaymentId,
              razorpaySignature,
              orderRequest: {
                userId: currentUser.userId, ...address,
                paymentMethod: "RAZORPAY",
                paymentId:     razorpayPaymentId,
              },
            });
            clearCart();
            navigate("/orders", { state: { newOrderId: verifyRes.data.orderId, success: true } });
          } catch (err) {
            setError("Payment verified but order failed. Contact support with payment ID: " + razorpayPaymentId);
          } finally { setPlacing(false); }
        },

        // 4b. Payment failed / cancelled
        onFailure: (msg) => {
          setError(msg);
          setPlacing(false);
        },
      });

    } catch (err) {
      setError(err.response?.data?.message || "Could not initiate payment");
      setPlacing(false);
    }
  };

  const handlePlaceOrder = () => {
    const err = validateAddress();
    if (err) { setError(err); return; }
    setError("");
    if (payment === "COD") placeCODOrder();
    else placeRazorpayOrder();
  };

  if (loading) return (
    <div style={{ padding:"80px 0", textAlign:"center" }}>
      <div className="spinner" style={{ width:40,height:40,margin:"0 auto",
        borderWidth:3,borderColor:"var(--border)",borderTopColor:"var(--accent)" }} />
    </div>
  );

  return (
    <div className="checkout-page">
      <div className="container">
        <h1 className="section-title" style={{ marginBottom:32 }}>Checkout</h1>

        {/* Step indicator */}
        <div className="steps-bar">
          {["Shipping","Payment","Review"].map((s, i) => (
            <div key={s} className={`step ${step===i+1?"active":""} ${step>i+1?"done":""}`}>
              <div className="step-circle">{step>i+1?"✓":i+1}</div>
              <span className="step-label">{s}</span>
              {i < 2 && <div className="step-line" />}
            </div>
          ))}
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom:24 }}>{error}</div>}

        <div className="checkout-layout">
          {/* ── Left: Steps ──────────────────────────────── */}
          <div className="checkout-form-col">

            {/* STEP 1 — Address */}
            {step === 1 && (
              <div className="checkout-card">
                <h2 className="checkout-card-title">📍 Shipping Address</h2>
                <div className="address-grid">
                  <div className="form-group span-2">
                    <label>Full Name *</label>
                    <input name="fullName" value={address.fullName}
                      onChange={handleAddressChange} placeholder="As on ID" />
                  </div>
                  <div className="form-group">
                    <label>Phone *</label>
                    <input name="phone" value={address.phone}
                      onChange={handleAddressChange} placeholder="10-digit mobile" maxLength={10} />
                  </div>
                  <div className="form-group">
                    <label>Pincode *</label>
                    <input name="pincode" value={address.pincode}
                      onChange={handleAddressChange} placeholder="6-digit" maxLength={6} />
                  </div>
                  <div className="form-group span-2">
                    <label>Address *</label>
                    <input name="addressLine" value={address.addressLine}
                      onChange={handleAddressChange} placeholder="House/Flat, Street, Landmark" />
                  </div>
                  <div className="form-group">
                    <label>City *</label>
                    <input name="city" value={address.city}
                      onChange={handleAddressChange} placeholder="City" />
                  </div>
                  <div className="form-group">
                    <label>State *</label>
                    <select name="state" value={address.state} onChange={handleAddressChange}>
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <button className="btn-primary" style={{ marginTop:24 }}
                  onClick={() => {
                    const e = validateAddress();
                    if (e) { setError(e); return; }
                    setError(""); setStep(2);
                  }}>
                  Continue to Payment →
                </button>
              </div>
            )}

            {/* STEP 2 — Payment */}
            {step === 2 && (
              <div className="checkout-card">
                <h2 className="checkout-card-title">💳 Payment Method</h2>
                <div className="payment-options">
                  {PAYMENT_METHODS.map((m) => (
                    <label key={m.id} className={`payment-option ${payment===m.id?"selected":""}`}>
                      <input type="radio" name="payment" value={m.id}
                        checked={payment===m.id} onChange={()=>setPayment(m.id)} />
                      <span className="payment-icon">{m.icon}</span>
                      <div style={{ flex:1 }}>
                        <p className="payment-label">{m.label}</p>
                        <p style={{ fontSize:".78rem",color:"var(--text-muted)",marginTop:2 }}>{m.sub}</p>
                      </div>
                      {payment===m.id && <span className="payment-check">✓</span>}
                    </label>
                  ))}
                </div>

                {/* Razorpay accepted logos */}
                {payment === "RAZORPAY" && (
                  <div className="razorpay-info">
                    <p style={{ fontSize:".82rem",fontWeight:600,marginBottom:8 }}>
                      🔒 Accepted payment methods:
                    </p>
                    <div className="payment-logos">
                      {["UPI","VISA","Mastercard","RuPay","Net Banking","Wallets"].map(l=>(
                        <span key={l} className="payment-logo-chip">{l}</span>
                      ))}
                    </div>
                    <p style={{ fontSize:".75rem",color:"var(--text-muted)",marginTop:10 }}>
                      Your payment is encrypted and processed by Razorpay.
                      ShopEase never stores your card details.
                    </p>
                  </div>
                )}

                <div style={{ display:"flex",gap:12,marginTop:24 }}>
                  <button className="btn-outline" onClick={()=>setStep(1)}>← Back</button>
                  <button className="btn-primary" onClick={()=>{setError("");setStep(3);}}>
                    Review Order →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 — Review */}
            {step === 3 && (
              <div className="checkout-card">
                <h2 className="checkout-card-title">📋 Review & Place Order</h2>

                {/* Address summary */}
                <div className="review-section">
                  <div className="review-section-header">
                    <span>📍 Delivery Address</span>
                    <button className="edit-btn" onClick={()=>setStep(1)}>Edit</button>
                  </div>
                  <p className="review-address">
                    <strong>{address.fullName}</strong> · {address.phone}<br />
                    {address.addressLine}, {address.city}, {address.state} — {address.pincode}
                  </p>
                </div>

                {/* Payment summary */}
                <div className="review-section">
                  <div className="review-section-header">
                    <span>💳 Payment</span>
                    <button className="edit-btn" onClick={()=>setStep(2)}>Edit</button>
                  </div>
                  <p style={{ fontSize:".88rem" }}>
                    {PAYMENT_METHODS.find(m=>m.id===payment)?.icon}{" "}
                    {PAYMENT_METHODS.find(m=>m.id===payment)?.label}
                  </p>
                </div>

                {/* Items */}
                <div className="review-section">
                  <p style={{ fontWeight:600,marginBottom:12 }}>🛒 Items ({cartItems.length})</p>
                  {cartItems.map((item) => (
                    <div key={item.id} className="review-item">
                      <img src={item.product.imageUrl} alt={item.product.title} className="review-item-img" />
                      <div className="review-item-info">
                        <p className="review-item-title">{item.product.title}</p>
                        <p className="review-item-meta">Qty: {item.quantity}</p>
                      </div>
                      <span className="price">
                        ₹{(item.product.price * item.quantity).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ display:"flex",gap:12,marginTop:24 }}>
                  <button className="btn-outline" onClick={()=>setStep(2)}>← Back</button>
                  <button
                    className="btn-primary" style={{ flex:1 }}
                    onClick={handlePlaceOrder}
                    disabled={placing}
                  >
                    {placing
                      ? <><span className="spinner" /> Processing…</>
                      : payment === "RAZORPAY"
                        ? `💳 Pay ₹${finalTotal.toLocaleString("en-IN")} via Razorpay`
                        : `🎉 Place Order · ₹${finalTotal.toLocaleString("en-IN")}`
                    }
                  </button>
                </div>

                {payment === "RAZORPAY" && (
                  <p style={{ fontSize:".73rem",color:"var(--text-muted)",textAlign:"center",marginTop:12 }}>
                    🔒 You will be redirected to Razorpay's secure payment page
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Right: Order Summary ─────────────────────── */}
          <aside className="checkout-summary">
            <h3 className="summary-title">Order Summary</h3>
            <div className="summary-rows">
              {cartItems.map((item) => (
                <div key={item.id} className="summary-row">
                  <span style={{ fontSize:".82rem" }}>
                    {item.product.title.slice(0,26)}{item.product.title.length>26?"…":""} ×{item.quantity}
                  </span>
                  <span style={{ fontSize:".82rem",fontWeight:500 }}>
                    ₹{(item.product.price * item.quantity).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
            <div className="divider" />
            <div className="summary-rows">
              <div className="summary-row">
                <span>Subtotal</span><span>₹{cartTotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="summary-row" style={{ color:"var(--success)",fontWeight:500 }}>
                <span>Discount (5%)</span><span>− ₹{discount.toLocaleString("en-IN")}</span>
              </div>
              <div className="summary-row">
                <span>Delivery</span>
                <span>
                  {deliveryFee===0
                    ? <span style={{ color:"var(--success)",fontWeight:600 }}>FREE</span>
                    : `₹${deliveryFee}`}
                </span>
              </div>
            </div>
            <div className="divider" />
            <div className="summary-total">
              <span>Total</span>
              <span className="total-amount">₹{finalTotal.toLocaleString("en-IN")}</span>
            </div>
            <p style={{ fontSize:".73rem",color:"var(--text-muted)",textAlign:"center",marginTop:12 }}>
              🔒 Secure encrypted checkout
            </p>
          </aside>
        </div>
      </div>

      <style>{`
        .checkout-page { padding:40px 0 80px; }
        .steps-bar { display:flex; align-items:center; margin-bottom:40px; }
        .step { display:flex; align-items:center; gap:10px; flex:1; }
        .step-circle {
          width:36px; height:36px; border-radius:50%;
          display:flex; align-items:center; justify-content:center;
          font-weight:700; font-size:.88rem; flex-shrink:0;
          background:var(--surface-2); color:var(--text-muted);
          border:2px solid var(--border); transition:all .3s;
        }
        .step.active .step-circle { background:var(--accent); color:#fff; border-color:var(--accent); }
        .step.done  .step-circle  { background:var(--success);color:#fff; border-color:var(--success); }
        .step-label { font-size:.82rem; font-weight:500; color:var(--text-muted); white-space:nowrap; }
        .step.active .step-label { color:var(--accent); font-weight:600; }
        .step.done  .step-label  { color:var(--success); }
        .step-line { flex:1; height:2px; background:var(--border); margin:0 12px; min-width:16px; }

        .checkout-layout {
          display:grid; grid-template-columns:1fr 300px;
          gap:28px; align-items:start;
        }
        .checkout-card {
          background:var(--surface); border:1px solid var(--border);
          border-radius:var(--radius); padding:28px;
        }
        .checkout-card-title {
          font-family:var(--font-display); font-weight:700;
          font-size:1.1rem; margin-bottom:22px;
        }
        .address-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        .address-grid .span-2 { grid-column:span 2; }

        .payment-options { display:flex; flex-direction:column; gap:12px; }
        .payment-option {
          display:flex; align-items:center; gap:14px;
          padding:16px 20px; border:2px solid var(--border);
          border-radius:var(--radius); cursor:pointer; transition:all .2s; position:relative;
        }
        .payment-option:hover { border-color:var(--accent); background:var(--accent-light); }
        .payment-option.selected { border-color:var(--accent); background:var(--accent-light); }
        .payment-option input { display:none; }
        .payment-icon { font-size:1.5rem; flex-shrink:0; }
        .payment-label { font-weight:600; font-size:.9rem; }
        .payment-check {
          position:absolute; right:14px;
          background:var(--accent); color:#fff;
          width:22px; height:22px; border-radius:50%;
          display:flex; align-items:center; justify-content:center;
          font-size:.72rem; font-weight:700;
        }

        .razorpay-info {
          margin-top:16px; padding:14px 16px;
          background:var(--surface-2); border-radius:var(--radius);
        }
        .payment-logos { display:flex; flex-wrap:wrap; gap:8px; }
        .payment-logo-chip {
          background:#fff; border:1px solid var(--border);
          padding:4px 12px; border-radius:6px;
          font-size:.73rem; font-weight:600; color:var(--text-muted);
        }

        .review-section { padding:16px 0; border-bottom:1px solid var(--border); }
        .review-section:last-of-type { border-bottom:none; }
        .review-section-header {
          display:flex; justify-content:space-between;
          align-items:center; margin-bottom:8px;
          font-weight:600; font-size:.88rem;
        }
        .edit-btn { color:var(--accent); font-size:.8rem; font-weight:600; }
        .edit-btn:hover { text-decoration:underline; }
        .review-address { font-size:.85rem; color:var(--text-muted); line-height:1.7; }
        .review-item { display:flex; align-items:center; gap:12px; margin-bottom:10px; }
        .review-item-img { width:48px; height:48px; object-fit:cover; border-radius:8px; flex-shrink:0; }
        .review-item-info { flex:1; }
        .review-item-title { font-size:.83rem; font-weight:500; }
        .review-item-meta  { font-size:.75rem; color:var(--text-muted); margin-top:2px; }

        .checkout-summary {
          background:var(--surface); border:1px solid var(--border);
          border-radius:var(--radius); padding:22px;
          position:sticky; top:90px;
        }
        .summary-title { font-family:var(--font-display); font-weight:700; font-size:1rem; margin-bottom:16px; }
        .summary-rows  { display:flex; flex-direction:column; gap:10px; }
        .summary-row   { display:flex; justify-content:space-between; align-items:center; font-size:.87rem; }
        .summary-total { display:flex; justify-content:space-between; font-weight:700; }
        .total-amount  { font-family:var(--font-display); font-size:1.25rem; color:var(--accent); }

        @media (max-width:900px) {
          .checkout-layout { grid-template-columns:1fr; }
          .checkout-summary { position:static; }
          .step-label { display:none; }
        }
        @media (max-width:520px) {
          .address-grid { grid-template-columns:1fr; }
          .address-grid .span-2 { grid-column:span 1; }
          .checkout-card { padding:18px; }
        }
      `}</style>
    </div>
  );
}
