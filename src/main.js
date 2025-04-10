// main.js
import Vue from 'vue'
import VueRouter from 'vue-router'
import App from './App.vue'
import LoginPage from './components/LoginPage.vue'
import RegisterPage from './components/RegisterPage.vue'
import DashboardPage from './components/DashboardPage.vue'

Vue.use(VueRouter)

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginPage },
  { path: '/register', component: RegisterPage },
  { path: '/dashboard', component: DashboardPage }
]

const router = new VueRouter({
  routes
})

// Navigation guard to check authentication
router.beforeEach((to, from, next) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn')
  
  if (to.path === '/dashboard' && !isLoggedIn) {
    // Redirect to login page if not authenticated and trying to access dashboard
    next('/login')
  } else if ((to.path === '/login') && isLoggedIn) {
    // Redirect to dashboard if already logged in and trying to access login
    next('/dashboard')
  } else {
    // Always allow access to register page and other routes
    next()
  }
})

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')