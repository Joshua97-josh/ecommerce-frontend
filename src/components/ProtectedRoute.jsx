// ============================================================
//  ProtectedRoute.jsx — Route guard for authenticated pages
//  Location: src/components/ProtectedRoute.jsx
//
//  Usage in App.jsx:
//    <Route element={<ProtectedRoute />}>
//      <Route path="/cart" element={<Cart />} />
//    </Route>
//
//    <Route element={<ProtectedRoute adminOnly />}>
//      <Route path="/admin" element={<AdminDashboard />} />
//    </Route>
// ============================================================

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute — Wraps routes that require authentication.
 *
 * @param {boolean} adminOnly  If true, only ADMIN users can access
 */
export default function ProtectedRoute({ adminOnly = false }) {
  const { isLoggedIn, isAdmin } = useAuth();
  const location = useLocation();

  // Not logged in → redirect to login, preserving the attempted URL
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but not admin → redirect to home
  if (adminOnly && !isAdmin()) {
    return <Navigate to="/" replace />;
  }

  // Authorised — render the nested route
  return <Outlet />;
}
