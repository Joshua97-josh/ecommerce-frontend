// ============================================================
//  components/Navbar.jsx  —  Top navigation bar
// ============================================================
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { currentUser, logout, isAdmin } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        {/* Brand */}
        <Link to="/" className="nav-brand">
          <span>🛍️</span>
          <span className="nav-brand-text">ShopEase</span>
        </Link>

        {/* Desktop links */}
        <div className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          {currentUser && <Link to="/orders" className="nav-link">My Orders</Link>}
          {isAdmin()   && <Link to="/admin"  className="nav-link nav-admin">⚙️ Admin</Link>}
        </div>

        {/* Right section */}
        <div className="nav-actions">
          {currentUser ? (
            <>
              <Link to="/cart" className="cart-btn" aria-label="Cart">
                🛒
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>
              <div className="nav-user">
                <span className="user-name">{currentUser.name.split(" ")[0]}</span>
                <button onClick={handleLogout} className="btn-logout">Logout</button>
              </div>
            </>
          ) : (
            <div className="nav-auth">
              <Link to="/login"  className="btn-outline btn-sm">Sign In</Link>
              <Link to="/signup" className="btn-primary btn-sm">Sign Up</Link>
            </div>
          )}

          {/* Hamburger */}
          <button
            className="hamburger"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="mobile-menu">
          <Link to="/"       onClick={() => setMenuOpen(false)}>Home</Link>
          {currentUser && <Link to="/orders"   onClick={() => setMenuOpen(false)}>My Orders</Link>}
          {currentUser && <Link to="/cart"     onClick={() => setMenuOpen(false)}>Cart ({cartCount})</Link>}
          {isAdmin()   && <Link to="/admin"    onClick={() => setMenuOpen(false)}>Admin Panel</Link>}
          {currentUser
            ? <button onClick={handleLogout}>Logout</button>
            : <>
                <Link to="/login"  onClick={() => setMenuOpen(false)}>Sign In</Link>
                <Link to="/signup" onClick={() => setMenuOpen(false)}>Sign Up</Link>
              </>
          }
        </div>
      )}

      <style>{`
        .navbar {
          position: sticky; top: 0; z-index: 100;
          background: var(--primary);
          box-shadow: 0 2px 12px rgba(0,0,0,.25);
          height: var(--navbar-h);
        }
        .navbar-inner {
          display: flex; align-items: center;
          justify-content: space-between;
          height: 100%;
        }
        .nav-brand {
          display: flex; align-items: center; gap: 10px;
          font-family: var(--font-display); font-weight: 800;
          font-size: 1.3rem; color: #fff;
        }
        .nav-links { display: flex; gap: 8px; }
        .nav-link {
          color: rgba(255,255,255,.8); padding: 6px 14px;
          border-radius: 8px; font-weight: 500;
          transition: background .15s, color .15s;
        }
        .nav-link:hover { background: rgba(255,255,255,.1); color: #fff; }
        .nav-admin { color: var(--accent) !important; }
        .nav-actions { display: flex; align-items: center; gap: 16px; }
        .cart-btn {
          position: relative; font-size: 1.4rem;
          color: #fff; padding: 4px;
        }
        .cart-badge {
          position: absolute; top: -6px; right: -6px;
          background: var(--accent); color: #fff;
          width: 18px; height: 18px; border-radius: 50%;
          font-size: .68rem; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
        }
        .nav-user { display: flex; align-items: center; gap: 12px; }
        .user-name { color: rgba(255,255,255,.9); font-weight: 500; }
        .btn-logout {
          background: rgba(255,255,255,.1); color: rgba(255,255,255,.85);
          padding: 6px 14px; border-radius: 8px;
          font-family: var(--font-body); font-weight: 500;
          transition: background .15s;
        }
        .btn-logout:hover { background: rgba(255,255,255,.2); }
        .nav-auth { display: flex; gap: 10px; }
        .btn-sm { padding: 8px 18px; font-size: .85rem; }
        .hamburger {
          display: none; color: #fff; font-size: 1.4rem;
          padding: 4px 8px;
        }
        .mobile-menu {
          display: none;
          flex-direction: column;
          background: var(--primary-light);
          padding: 16px 24px;
          gap: 4px;
        }
        .mobile-menu a, .mobile-menu button {
          color: rgba(255,255,255,.85);
          padding: 10px 0;
          border-bottom: 1px solid rgba(255,255,255,.08);
          font-size: .95rem; font-weight: 500;
          text-align: left;
        }
        @media (max-width: 768px) {
          .nav-links { display: none; }
          .nav-auth, .nav-user { display: none; }
          .cart-btn { display: none; }
          .hamburger { display: block; }
          .mobile-menu { display: flex; }
          .navbar { height: auto; min-height: var(--navbar-h); }
          .navbar-inner { height: var(--navbar-h); }
        }
      `}</style>
    </nav>
  );
}
