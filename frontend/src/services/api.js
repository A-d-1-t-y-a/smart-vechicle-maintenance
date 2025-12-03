import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    const userPool = require('amazon-cognito-identity-js').CognitoUserPool;
    const poolData = {
      UserPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
      ClientId: process.env.REACT_APP_COGNITO_CLIENT_ID
    };
    const pool = new userPool(poolData);
    const cognitoUser = pool.getCurrentUser();
    
    if (cognitoUser) {
      try {
        const session = await new Promise((resolve, reject) => {
          cognitoUser.getSession((err, session) => {
            if (err) reject(err);
            else resolve(session);
          });
        });
        
        if (session && session.isValid()) {
          const token = session.getIdToken().getJwtToken();
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Error getting token:', error);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

