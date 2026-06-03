// ============================================================
//  App.jsx  —  Root component with routing + context providers
// ============================================================
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider }          from "./context/CartContext";

// Pages
import Home           from "./pages/Home";
import Login          from "./pages/Login";
import Signup         from "./pages/Signup";
import Product        from "./pages/Product";
import Cart           from "./pages/Cart";
import Checkout       from "./pages/Checkout";
import Orders         from "./pages/Orders";
import AdminDashboard from "./pages/admin/AdminDashboard";

// Layout
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "./index.css";

// ── Route guards ──────────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { isLoggedIn, isAdmin } = useAuth();
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  if (!isAdmin())    return <Navigate to="/"      replace />;
  return children;
}

// ── App shell ─────────────────────────────────────────────────────────────
function AppShell() {
  return (
    <>
      <Navbar />
      <main className="main-content">
        <Routes>
          {/* Public */}
          <Route path="/"            element={<Home />} />
          <Route path="/login"       element={<Login />} />
          <Route path="/signup"      element={<Signup />} />
          <Route path="/product/:id" element={<Product />} />

          {/* Protected */}
          <Route path="/cart"     element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/orders"   element={<ProtectedRoute><Orders /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <AppShell />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}
