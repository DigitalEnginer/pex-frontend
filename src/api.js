import axios from 'axios';

const api = axios.create({
  // URL твоего бэкенда на Render (строго без слэша на конце)
  baseURL: 'https://pex-backend-vtex.onrender.com'
});

// Автоматически прикрепляем токен к каждому запросу (если юзер залогинен)
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;