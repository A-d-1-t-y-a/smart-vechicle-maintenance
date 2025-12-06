import axios from "axios";
import { CognitoUserPool } from "amazon-cognito-identity-js";

const API_URL = process.env.REACT_APP_API_URL || "";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

async function getAuthToken() {
  try {
    const poolData = {
      UserPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
      ClientId: process.env.REACT_APP_COGNITO_CLIENT_ID,
    };
    const userPool = new CognitoUserPool(poolData);
    const cognitoUser = userPool.getCurrentUser();

    if (cognitoUser) {
      return new Promise((resolve, reject) => {
        cognitoUser.getSession((err, session) => {
          if (err || !session.isValid()) {
            reject(err || new Error("Invalid session"));
          } else {
            resolve(session.getIdToken().getJwtToken());
          }
        });
      });
    }
    return null;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
}

api.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const productService = {
  getAll: (category) => {
    const params = category ? { params: { category } } : {};
    return api.get("/products", params);
  },
  get: (productId) => api.get(`/products/${productId}`),
  getByCategory: (category) => api.get(`/products/category/${category}`),
  create: (data) => api.post("/products", data),
  update: (productId, data) => api.put(`/products/${productId}`, data),
  delete: (productId) => api.delete(`/products/${productId}`),
};

export const cartService = {
  get: () => api.get("/cart"),
  add: (data) => api.post("/cart", data),
  update: (cartItemId, data) => api.put(`/cart/${cartItemId}`, data),
  remove: (cartItemId) => api.delete(`/cart/${cartItemId}`),
  clear: () => api.delete("/cart"),
};

export const orderService = {
  getAll: () => api.get("/orders"),
  get: (orderId) => api.get(`/orders/${orderId}`),
  create: (data) => api.post("/orders", data),
};

export default api;
