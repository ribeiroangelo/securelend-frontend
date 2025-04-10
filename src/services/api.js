// src/services/api.js
import axios from 'axios'

// Create axios instance with base URL from environment variables
const apiClient = axios.create({
  baseURL: process.env.VUE_APP_API_URL || 'http://localhost:8081/api',
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Add a request interceptor to include auth token
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Add a response interceptor to handle common errors
apiClient.interceptors.response.use(
  response => {
    return response
  },
  error => {
    // Handle token expiration or unauthorized access
    if (error.response && error.response.status === 401) {
      // Clear local storage and redirect to login
      localStorage.removeItem('authToken')
      localStorage.removeItem('isLoggedIn')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default {
  // Auth endpoints
  login(credentials) {
    return apiClient.post('/auth/login', credentials)
  },
  
  register(userData) {
    return apiClient.post('/auth/register', userData)
  },
  
  logout() {
    return apiClient.post('/auth/logout')
  },
  
  // Example API endpoints for the dashboard
  getUserProfile() {
    return apiClient.get('/user/profile')
  },
  
  getAccountSummary() {
    return apiClient.get('/accounts/summary')
  }
}