// tests/unit/LoginPage.spec.js
import { shallowMount, createLocalVue } from '@vue/test-utils'
import VueRouter from 'vue-router'
import LoginPage from '@/components/LoginPage.vue'
import ApiService from '@/services/api'

// Mock the API service
jest.mock('@/services/api', () => ({
  login: jest.fn()
}))

const localVue = createLocalVue()
localVue.use(VueRouter)
const router = new VueRouter()

describe('LoginPage.vue', () => {
  let wrapper
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    
    // Create localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn()
      },
      writable: true
    })
  })
  
  it('renders the login form correctly', () => {
    wrapper = shallowMount(LoginPage, {
      localVue,
      router
    })
    
    // Should have a form with username and password inputs
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })
  
  it('handles successful login and redirects to dashboard', async () => {
    // Mock successful API response
    ApiService.login.mockResolvedValueOnce({
      data: 'jwt-token-here'
    })
    
    // Spy on router push
    const routerPushSpy = jest.spyOn(router, 'push')
    
    wrapper = shallowMount(LoginPage, {
      localVue,
      router
    })
    
    // Set form values
    await wrapper.find('input[type="text"]').setValue('testuser')
    await wrapper.find('input[type="password"]').setValue('password123')
    
    // Submit the form
    await wrapper.find('form').trigger('submit.prevent')
    
    // API should be called with the credentials
    expect(ApiService.login).toHaveBeenCalledWith({
      username: 'testuser',
      password: 'password123'
    })
    
    // Wait for promises to resolve
    await wrapper.vm.$nextTick()
    
    // Should store token in localStorage
    expect(window.localStorage.setItem).toHaveBeenCalledWith('authToken', 'jwt-token-here')
    expect(window.localStorage.setItem).toHaveBeenCalledWith('isLoggedIn', 'true')
    
    // Should redirect to dashboard
    expect(routerPushSpy).toHaveBeenCalledWith('/dashboard')
  })
  
  it('shows error message for invalid credentials', async () => {
    // Mock API failure for invalid credentials
    ApiService.login.mockRejectedValueOnce({
      response: {
        data: 'Invalid username or password'
      }
    })
    
    wrapper = shallowMount(LoginPage, {
      localVue,
      router
    })
    
    // Set form values
    await wrapper.find('input[type="text"]').setValue('wronguser')
    await wrapper.find('input[type="password"]').setValue('wrongpass')
    
    // Submit the form
    await wrapper.find('form').trigger('submit.prevent')
    
    // Wait for promises to resolve
    await wrapper.vm.$nextTick()
    
    // Should show error message
    expect(wrapper.vm.error).toBe('Invalid username or password')
    expect(wrapper.vm.isLoading).toBe(false)
  })
  
  it('shows rate limit error and disables form when too many attempts', async () => {
    // Mock API failure with 429 status (too many requests)
    ApiService.login.mockRejectedValueOnce({
      response: {
        status: 429,
        data: 'Too many failed attempts. Please try again later.'
      }
    })
    
    wrapper = shallowMount(LoginPage, {
      localVue,
      router
    })
    
    // Set form values
    await wrapper.find('input[type="text"]').setValue('testuser')
    await wrapper.find('input[type="password"]').setValue('wrongpassword')
    
    // Submit the form
    await wrapper.find('form').trigger('submit.prevent')
    
    // Wait for promises to resolve
    await wrapper.vm.$nextTick()
    
    // Should show rate limit error
    expect(wrapper.vm.error).toContain('Too many failed attempts')
    expect(wrapper.vm.isRateLimited).toBe(true)
    
    // Form should be disabled
    expect(wrapper.find('input[type="text"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('input[type="password"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
    
    // Button text should indicate rate limiting
    expect(wrapper.find('button[type="submit"]').text()).toContain('Login temporarily disabled')
  })
  
  it('shows connection error when server is unreachable', async () => {
    // Mock network error
    ApiService.login.mockRejectedValueOnce({
      request: {} // Request exists but no response
    })
    
    wrapper = shallowMount(LoginPage, {
      localVue,
      router
    })
    
    // Set form values
    await wrapper.find('input[type="text"]').setValue('testuser')
    await wrapper.find('input[type="password"]').setValue('password123')
    
    // Submit the form
    await wrapper.find('form').trigger('submit.prevent')
    
    // Wait for promises to resolve
    await wrapper.vm.$nextTick()
    
    // Should show connection error
    expect(wrapper.vm.error).toContain('Unable to connect to the server')
    expect(wrapper.vm.isLoading).toBe(false)
  })

  it('disables form during submission', async () => {
    // Create a promise that we can resolve manually
    let resolvePromise
    const apiPromise = new Promise(resolve => {
      resolvePromise = resolve
    })
    
    // Mock API call that doesn't resolve immediately
    ApiService.login.mockReturnValueOnce(apiPromise)
    
    wrapper = shallowMount(LoginPage, {
      localVue,
      router
    })
    
    // Set form values
    await wrapper.find('input[type="text"]').setValue('testuser')
    await wrapper.find('input[type="password"]').setValue('password123')
    
    // Submit the form
    await wrapper.find('form').trigger('submit.prevent')
    
    // Form should be in loading state
    expect(wrapper.vm.isLoading).toBe(true)
    
    // Inputs should be disabled
    expect(wrapper.find('input[type="text"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('input[type="password"]').attributes('disabled')).toBeDefined()
    
    // Button should be disabled and show loading text
    const button = wrapper.find('button[type="submit"]')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.text()).toContain('Signing in')
    
    // Resolve the API call
    resolvePromise({ data: 'token' })
    
    // Wait for promises to resolve
    await wrapper.vm.$nextTick()
    
    // Form should no longer be in loading state
    expect(wrapper.vm.isLoading).toBe(false)
  })
  
  it('navigates to register page when create account link is clicked', async () => {
    // Spy on router push
    const routerPushSpy = jest.spyOn(router, 'push')
    
    wrapper = shallowMount(LoginPage, {
      localVue,
      router
    })
    
    // Find and click the register link
    const registerLink = wrapper.find('.login-footer a[href="#"]')
    await registerLink.trigger('click')
    
    // Should navigate to register page
    expect(routerPushSpy).toHaveBeenCalledWith('/register')
  })
  
  it('clears timers when component is destroyed', () => {
    // Mock clearInterval
    global.clearInterval = jest.fn()
    
    wrapper = shallowMount(LoginPage, {
      localVue,
      router
    })
    
    // Set a fake timer
    wrapper.vm.rateLimitTimer = 123
    
    // Destroy the component
    wrapper.destroy()
    
    // Should clear the timer
    expect(global.clearInterval).toHaveBeenCalledWith(123)
  })
})