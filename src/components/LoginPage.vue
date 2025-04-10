<!-- src/components/LoginPage.vue -->
<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <img src="../assets/logo.png" alt="SecureLend" />
        <h1>SecureLend Financial</h1>
      </div>
      
      <form @submit.prevent="login" class="login-form">
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <div class="form-group">
          <label for="username">Username</label>
          <input 
            type="text" 
            id="username" 
            v-model="username" 
            placeholder="Enter your username"
            autocomplete="username"
            required
            :disabled="isLoading || isRateLimited"
          />
        </div>
        
        <div class="form-group">
          <label for="password">Password</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            placeholder="Enter your password"
            autocomplete="current-password"
            required
            :disabled="isLoading || isRateLimited"
          />
        </div>
        
        <button type="submit" class="login-button" :disabled="isLoading || isRateLimited">
          <span v-if="isLoading">Signing in...</span>
          <span v-else-if="isRateLimited">Login temporarily disabled</span>
          <span v-else>Sign In</span>
        </button>
        
        <div class="login-footer">
          <div>
            <a href="#">Forgot username?</a> &nbsp;|&nbsp; 
            <a href="#">Forgot password?</a>
          </div>
          
          <div style="margin-top: 10px; text-align: center;">
            Don't have an account? <a href="#" @click.prevent="goToRegister">Create one now</a>
          </div>
          
          <div class="security-notice">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Secure, encrypted connection
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import ApiService from '../services/api'

export default {
  name: 'LoginPage',
  data() {
    return {
      username: '',
      password: '',
      error: '',
      isLoading: false,
      isRateLimited: false,
      rateLimitTimer: null
    }
  },
  methods: {
    async login() {
      // Don't allow login attempts if rate limited
      if (this.isRateLimited) {
        return;
      }
      
      this.isLoading = true;
      this.error = '';
      
      try {
        // Use the API service for login
        const response = await ApiService.login({
          username: this.username,
          password: this.password
        });
        
        // Process successful response
        const token = response.data.token || response.data.access_token || response.data;
        
        // Store the token in localStorage
        localStorage.setItem('authToken', token);
        localStorage.setItem('isLoggedIn', 'true');
        
        // Redirect to dashboard
        this.$router.push('/dashboard');
        
      } catch (error) {
        // Handle rate limiting (429 Too Many Requests)
        if (error.response && error.response.status === 429) {
          this.handleRateLimit(error.response.data);
        }
        // Handle other error responses
        else if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          this.error = error.response.data.message || 
                      error.response.data.error || 
                      error.response.data || 
                      'Invalid username or password. Please try again.';
        } else if (error.request) {
          // The request was made but no response was received
          this.error = 'Unable to connect to the server. Please check your internet connection and try again.';
        } else {
          // Something happened in setting up the request
          this.error = 'An error occurred during login. Please try again.';
        }
      } finally {
        this.isLoading = false;
      }
    },
    
    handleRateLimit(errorMessage) {
      // Set rate limited state
      this.isRateLimited = true;
      
      // Display the error message from the server
      this.error = errorMessage || 'Too many failed attempts. Please try again later.';
      
      // Add rate limit timer UI
      this.startRateLimitCountdown();
      
      // Disable form fields (already done with v-bind:disabled)
    },
    
    startRateLimitCountdown() {
      // Assuming a 60 second lockout - adjust as needed based on your backend
      let remainingTime = 60;
      
      // Clear any existing timer
      if (this.rateLimitTimer) {
        clearInterval(this.rateLimitTimer);
      }
      
      // Update the error message with the countdown
      this.updateRateLimitMessage(remainingTime);
      
      // Start countdown timer
      this.rateLimitTimer = setInterval(() => {
        remainingTime--;
        this.updateRateLimitMessage(remainingTime);
        
        if (remainingTime <= 0) {
          // Reset rate limit state when timer expires
          this.isRateLimited = false;
          this.error = '';
          clearInterval(this.rateLimitTimer);
        }
      }, 1000);
    },
    
    updateRateLimitMessage(seconds) {
      this.error = `Too many failed attempts. Please try again in ${seconds} seconds.`;
    },
    
    goToRegister() {
      this.$router.push('/register');
    }
  },
  
  // Clear any timers when component is destroyed
  beforeUnmount() {
    if (this.rateLimitTimer) {
      clearInterval(this.rateLimitTimer);
    }
  }
}
</script>

<style>
@import '../assets/styles/login.css';

/* Additional styles for loading and rate limit states */
.login-button:disabled {
  background-color: #95a5c6;
  cursor: not-allowed;
}
</style>