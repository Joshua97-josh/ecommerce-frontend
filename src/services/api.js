// ============================================================
//  services/api.js  —  Central Axios instance
// ============================================================
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post("/api/auth/register", data),
  login:    (data) => api.post("/api/auth/login", data),
};

export const productAPI = {
  getAll:  (params) => api.get("/api/products", { params }),
  getById: (id)     => api.get(`/api/products/${id}`),
  create:  (data)   => api.post("/api/products", data),
  update:  (id, d)  => api.put(`/api/products/${id}`, d),
  delete:  (id)     => api.delete(`/api/products/${id}`),
};

export const cartAPI = {
  getCart:    (userId)     => api.get(`/api/cart/${userId}`),
  addToCart:  (data)       => api.post("/api/cart/add", data),
  removeItem: (id)         => api.delete(`/api/cart/remove/${id}`),
  updateQty:  (id, qty)    => api.put(`/api/cart/update/${id}`, { quantity: qty }),
};

export const orderAPI = {
  placeOrder:    (data)   => api.post("/api/orders", data),
  getUserOrders: (userId) => api.get(`/api/orders/user/${userId}`),
  cancelOrder:   (id)     => api.put(`/api/orders/${id}/cancel`),
};

export const adminAPI = {
  addProduct:    (data)    => api.post("/api/admin/product", data),
  updateProduct: (id, d)   => api.put(`/api/admin/product/${id}`, d),
  deleteProduct: (id)      => api.delete(`/api/admin/product/${id}`),
  getAllOrders:  ()         => api.get("/api/admin/orders"),
  getAllUsers:   ()         => api.get("/api/admin/users"),
};

export default api;
