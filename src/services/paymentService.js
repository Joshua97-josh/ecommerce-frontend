// ============================================================
//  services/paymentService.js
//  Razorpay frontend integration helpers
//
//  Usage:
//    import { loadRazorpayScript, openRazorpayModal } from "./paymentService";
// ============================================================

/**
 * Dynamically loads the Razorpay checkout script.
 * Must be called before opening the payment modal.
 *
 * @returns {Promise<boolean>} true if script loaded successfully
 */
export function loadRazorpayScript() {
  return new Promise((resolve) => {
    // Don't load twice
    if (window.Razorpay) { resolve(true); return; }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Opens the Razorpay payment modal.
 *
 * @param {Object} options
 * @param {string} options.keyId         - Razorpay key ID (from backend)
 * @param {string} options.orderId       - Razorpay order ID (from backend)
 * @param {number} options.amount        - Amount in paise
 * @param {string} options.name          - Store name shown in modal
 * @param {string} options.description   - Payment description
 * @param {string} options.prefillName   - User's name
 * @param {string} options.prefillEmail  - User's email
 * @param {string} options.prefillPhone  - User's phone
 * @param {Function} options.onSuccess   - Called with { razorpayPaymentId, razorpayOrderId, razorpaySignature }
 * @param {Function} options.onFailure   - Called with error message
 */
export function openRazorpayModal({
  keyId,
  orderId,
  amount,
  name         = "ShopEase",
  description  = "Payment for your order",
  prefillName  = "",
  prefillEmail = "",
  prefillPhone = "",
  onSuccess,
  onFailure,
}) {
  const options = {
    key:         keyId,
    amount:      amount,          // paise
    currency:    "INR",
    name:        name,
    description: description,
    image:       "https://via.placeholder.com/60x60/f97316/ffffff?text=SE",
    order_id:    orderId,

    // Called when payment succeeds
    handler: function (response) {
      onSuccess({
        razorpayPaymentId: response.razorpay_payment_id,
        razorpayOrderId:   response.razorpay_order_id,
        razorpaySignature: response.razorpay_signature,
      });
    },

    // Pre-fill user info in modal
    prefill: {
      name:    prefillName,
      email:   prefillEmail,
      contact: prefillPhone,
    },

    // Theme
    theme: { color: "#f97316" },

    // Called when user closes modal without paying
    modal: {
      ondismiss: () => {
        onFailure("Payment cancelled. Please try again.");
      },
    },
  };

  const razorpay = new window.Razorpay(options);

  // Called when payment fails
  razorpay.on("payment.failed", (response) => {
    onFailure(response.error?.description || "Payment failed. Please try again.");
  });

  razorpay.open();
}
