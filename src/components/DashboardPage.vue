<template>
  <div :class="$style.dashboard">
    <header :class="$style.header">
      <h1>Dashboard</h1>
      <button :class="$style.button" @click="logout">Logout</button>
    </header>
    <div :class="$style['dashboard-content']">
      <h2>Welcome to your dashboard!</h2>
      <p>You have successfully logged in.</p>
      <!-- Dashboard content would go here -->
    </div>
  </div>
</template>

<script>
export default {
  name: 'DashboardPage',
  created() {
    // Check if user is logged in
    if (!localStorage.getItem('isLoggedIn')) {
      // Redirect to login if not authenticated
      this.$router.push('/login')
    }
  },
  methods: {
    logout() {
      // Remove login state
      localStorage.removeItem('isLoggedIn')
      
      // Redirect to login page
      this.$router.push('/login')
    }
  }
}
</script>

<style module>
@import '../assets/styles/dashboard.css';
</style>