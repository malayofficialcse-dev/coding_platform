import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

// const api = axios.create({
//   baseURL: "https://code-campus-10.onrender.com/api" || "http://localhost:5000/api",
// });




// Add token to headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;