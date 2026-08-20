import axios from 'axios';

const axiosClient = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Trước khi gửi request, chèn thêm token Bearer (nếu có) vào header Authorization
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Bắt lỗi 401 để tự refresh token, đồng thời trả thẳng response.data cho gọn
axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response) {
      if (error.response.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise(function(resolve, reject) {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return axiosClient(originalRequest);
          }).catch(err => {
            return Promise.reject(err);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          isRefreshing = false;
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }

        return new Promise(function (resolve, reject) {
          // Dùng axios gốc (không phải axiosClient) để tránh interceptor tự gọi lại chính nó
          axios.post('/api/auth/refresh', { refreshToken })
            .then(({ data }) => {
              const newToken = data.data?.token || data.token;
              localStorage.setItem('token', newToken);
              axiosClient.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;
              originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
              processQueue(null, newToken);
              resolve(axiosClient(originalRequest));
            })
            .catch((err) => {
              processQueue(err, null);
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('user');
              if (window.location.pathname !== '/login') {
                window.location.href = '/login';
              }
              reject(err);
            })
            .finally(() => {
              isRefreshing = false;
            });
        });
      }

      const message =
        error.response.data?.message ||
        error.response.data?.error ||
        'Đã xảy ra lỗi. Vui lòng thử lại.';
      return Promise.reject(new Error(message));
    }

    if (error.request) {
      return Promise.reject(new Error('Không thể kết nối đến máy chủ.'));
    }
    
    return Promise.reject(error);
  }
);

export default axiosClient;
