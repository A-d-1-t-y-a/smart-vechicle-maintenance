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
  getAll: () => api.get("/products"),
  get: (productId) => api.get(`/products/${productId}`),
  getByCategory: (categoryId) => api.get(`/products/category/${categoryId}`),
  create: (data) => api.post("/products", data),
  update: (productId, data) => api.put(`/products/${productId}`, data),
  delete: (productId) => api.delete(`/products/${productId}`),
};

export const categoryService = {
  getAll: () => api.get("/categories"),
  get: (categoryId) => api.get(`/categories/${categoryId}`),
  create: (data) => api.post("/categories", data),
};

export const inventoryService = {
  getAll: (locationId) => {
    const params = locationId ? { params: { locationId } } : {};
    return api.get("/inventory", params);
  },
  getByProduct: (productId) => api.get(`/inventory/product/${productId}`),
  update: (productId, data) => api.put(`/inventory/${productId}`, data),
};

export const orderService = {
  getAll: () => api.get("/orders"),
  get: (orderId) => api.get(`/orders/${orderId}`),
  create: (data) => api.post("/orders", data),
};

export default api;
