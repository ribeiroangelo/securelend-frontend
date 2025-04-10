<!-- src/components/RegisterPage.vue -->
<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <img src="../assets/logo.png" alt="SecureLend" />
        <h1>SecureLend Financial</h1>
      </div>
      
      <form @submit.prevent="register" class="login-form">
        <h2>Create Account</h2>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <div v-if="success" class="success-message">
          {{ success }}
        </div>
        
        <div class="form-group">
          <label for="email">Email Address</label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            placeholder="Enter your email address"
            required
            :disabled="isLoading"
          />
        </div>
        
        <div class="form-group">
          <label for="username">Username</label>
          <input 
            type="text" 
            id="username" 
            v-model="username" 
            placeholder="Choose a username"
            required
            :disabled="isLoading"
          />
        </div>
        
        <div class="form-group">
          <label for="password">Password</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            placeholder="Create a password"
            required
            :disabled="isLoading"
          />
          <div class="password-strength" v-if="password">
            <div class="strength-meter">
              <div 
                class="strength-meter-fill" 
                :style="{ width: passwordStrength.score * 25 + '%' }"
                :class="passwordStrengthClass"
              ></div>
            </div>
            <div class="password-feedback">
              {{ passwordStrength.feedback }}
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input 
            type="password" 
            id="confirmPassword" 
            v-model="confirmPassword" 
            placeholder="Confirm your password"
            required
            :disabled="isLoading"
          />
          <div class="password-match" v-if="confirmPassword">
            <span v-if="passwordsMatch" class="match-success">Passwords match</span>
            <span v-else class="match-error">Passwords do not match</span>
          </div>
        </div>
        
        <div class="form-group checkbox-group">
          <input 
            type="checkbox" 
            id="termsAgreement" 
            v-model="termsAgreed"
            required
            :disabled="isLoading"
          />
          <label for="termsAgreement">
            I agree to the <a href="#" @click.prevent="showTerms">Terms & Conditions</a> and <a href="#" @click.prevent="showPrivacyPolicy">Privacy Policy</a>
          </label>
        </div>
        
        <button type="submit" class="login-button" :disabled="isLoading || !canSubmit">
          <span v-if="isLoading">Processing...</span>
          <span v-else>Create Account</span>
        </button>
        
        <div class="login-footer register-footer">
          <div>
            Already have an account? <a href="#" @click.prevent="goToLogin">Sign in</a>
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
  name: 'RegisterPage',
  data() {
    return {
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      termsAgreed: false,
      error: '',
      success: '',
      isLoading: false
    }
  },
  computed: {
    passwordsMatch() {
      return this.password && this.confirmPassword && this.password === this.confirmPassword;
    },
    passwordStrength() {
      if (!this.password) {
        return { score: 0, feedback: '' };
      }
      
      // Simple password strength calculator
      let score = 0;
      let feedback = '';
      
      // Length check
      if (this.password.length < 8) {
        feedback = 'Password is too short';
      } else {
        score += 1;
      }
      
      // Complexity checks
      if (/[A-Z]/.test(this.password)) score += 1;
      if (/[0-9]/.test(this.password)) score += 1;
      if (/[^A-Za-z0-9]/.test(this.password)) score += 1;
      
      // Feedback based on score
      if (score === 4) {
        feedback = 'Strong password';
      } else if (score === 3) {
        feedback = 'Good password';
      } else if (score === 2) {
        feedback = 'Moderate password';
      } else if (score === 1) {
        feedback = 'Weak password';
      }
      
      return { score, feedback };
    },
    passwordStrengthClass() {
      const score = this.passwordStrength.score;
      if (score >= 4) return 'strength-strong';
      if (score === 3) return 'strength-good';
      if (score === 2) return 'strength-moderate';
      return 'strength-weak';
    },
    canSubmit() {
      return this.email && 
             this.username && 
             this.password && 
             this.passwordsMatch && 
             this.passwordStrength.score >= 2 && 
             this.termsAgreed;
    }
  },
  methods: {
    async register() {
      if (!this.canSubmit) {
        return;
      }
      
      this.isLoading = true;
      this.error = '';
      this.success = '';
      
      try {
        // Use the API service for registration
        await ApiService.register({
          email: this.email,
          username: this.username,
          password: this.password
        });
        
        // Display success message
        this.success = 'Registration successful! You can now log in with your credentials.';
        
        // Reset form after successful registration
        this.resetForm();
        
        // Optionally redirect to login after a delay
        setTimeout(() => {
          this.goToLogin();
        }, 3000);
        
      } catch (error) {
        // Handle error response
        if (error.response) {
          if (error.response.status === 429) {
            this.error = 'Too many registration attempts. Please try again later.';
          } else {
            this.error = error.response.data.message || 
                        error.response.data.error || 
                        error.response.data || 
                        'Registration failed. Please try again.';
          }
        } else if (error.request) {
          this.error = 'Unable to connect to the server. Please check your internet connection and try again.';
        } else {
          this.error = 'An error occurred during registration. Please try again.';
        }
      } finally {
        this.isLoading = false;
      }
    },
    
    resetForm() {
      this.email = '';
      this.username = '';
      this.password = '';
      this.confirmPassword = '';
      this.termsAgreed = false;
    },
    
    goToLogin() {
      this.$router.push('/login');
    },
    
    showTerms() {
      alert('Terms & Conditions would be displayed here.');
      // In a real app, you might open a modal or navigate to a terms page
    },
    
    showPrivacyPolicy() {
      alert('Privacy Policy would be displayed here.');
      // In a real app, you might open a modal or navigate to a privacy policy page
    }
  }
}
</script>

<style>
@import '../assets/styles/login.css';
@import '../assets/styles/register.css';
</style>