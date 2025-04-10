// tests/unit/RegisterPage.spec.js
import { shallowMount, createLocalVue } from '@vue/test-utils'
import VueRouter from 'vue-router'
import RegisterPage from '@/components/RegisterPage.vue'
import ApiService from '@/services/api'

// Mock the API service
jest.mock('@/services/api', () => ({
  register: jest.fn()
}))

// Mock timers for setTimeout
jest.useFakeTimers()

const localVue = createLocalVue()
localVue.use(VueRouter)
const router = new VueRouter()

describe('RegisterPage.vue', () => {
  let wrapper
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
  })
  
  it('renders the registration form correctly', () => {
    wrapper = shallowMount(RegisterPage, {
      localVue,
      router
    })
    
    // Should have a form with required inputs
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })
  
  it('validates password strength correctly', async () => {
    wrapper = shallowMount(RegisterPage, {
      localVue,
      router
    })
    
    // Short password
    await wrapper.find('#password').setValue('short')
    expect(wrapper.vm.passwordStrength.score).toBe(1)
    expect(wrapper.vm.passwordStrength.feedback).toContain('too short')
    
    // Medium password with lowercase and uppercase
    await wrapper.find('#password').setValue('Password')
    expect(wrapper.vm.passwordStrength.score).toBe(2)
    
    // Strong password with lowercase, uppercase, and number
    await wrapper.find('#password').setValue('Password123')
    expect(wrapper.vm.passwordStrength.score).toBe(3)
    
    // Very strong password with lowercase, uppercase, number, and special char
    await wrapper.find('#password').setValue('Password123!')
    expect(wrapper.vm.passwordStrength.score).toBe(4)
    expect(wrapper.vm.passwordStrength.feedback).toContain('Strong password')
  })
  
  it('validates password match correctly', async () => {
    wrapper = shallowMount(RegisterPage, {
      localVue,
      router
    })
    
    // Set password
    await wrapper.find('#password').setValue('Password123')
    
    // Set non-matching confirmation
    await wrapper.find('#confirmPassword').setValue('Password456')
    expect(wrapper.vm.passwordsMatch).toBe(false)
    
    // Set matching confirmation
    await wrapper.find('#confirmPassword').setValue('Password123')
    expect(wrapper.vm.passwordsMatch).toBe(true)
  })
  
  it('disables submit button when form is invalid', async () => {
    wrapper = shallowMount(RegisterPage, {
      localVue,
      router
    })
    
    // Form should not be submittable initially
    expect(wrapper.vm.canSubmit).toBe(false)
    
    // Fill form partially
    await wrapper.find('#email').setValue('user@example.com')
    await wrapper.find('#username').setValue('testuser')
    expect(wrapper.vm.canSubmit).toBe(false)
    
    // Add weak password
    await wrapper.find('#password').setValue('weak')
    await wrapper.find('#confirmPassword').setValue('weak')
    expect(wrapper.vm.canSubmit).toBe(false)
    
    // Add strong password
    await wrapper.find('#password').setValue('StrongPass123')
    await wrapper.find('#confirmPassword').setValue('StrongPass123')
    expect(wrapper.vm.canSubmit).toBe(false)
    
    // Accept terms
    await wrapper.find('#termsAgreement').setChecked(true)
    expect(wrapper.vm.canSubmit).toBe(true)
  })
  
  it('handles successful registration and redirects to login', async () => {
    // Mock successful API response
    ApiService.register.mockResolvedValueOnce({
      data: 'Registration successful'
    })
    
    // Spy on router push
    const routerPushSpy = jest.spyOn(router, 'push')
    
    wrapper = shallowMount(RegisterPage, {
      localVue,
      router
    })
    
    // Fill the form with valid data
    await wrapper.find('#email').setValue('user@example.com')
    await wrapper.find('#username').setValue('testuser')
    await wrapper.find('#password').setValue('StrongPass123')
    await wrapper.find('#confirmPassword').setValue('StrongPass123')
    await wrapper.find('#termsAgreement').setChecked(true)
    
    // Submit the form
    await wrapper.find('form').trigger('submit.prevent')
    
    // API should be called with the registration data
    expect(ApiService.register).toHaveBeenCalledWith({
      email: 'user@example.com',
      username: 'testuser',
      password: 'StrongPass123'
    })
    
    // Wait for promises to resolve
    await wrapper.vm.$nextTick()
    
    // Should show success message
    expect(wrapper.vm.success).toContain('Registration successful')
    
    // Form should be reset
    expect(wrapper.vm.email).toBe('')
    expect(wrapper.vm.username).toBe('')
    expect(wrapper.vm.password).toBe('')
    
    // Fast-forward timers to trigger redirect
    jest.runAllTimers()
    
    // Should redirect to login
    expect(routerPushSpy).toHaveBeenCalledWith('/login')
  })
  
  it('shows error message on registration failure', async () => {
    // Mock API failure
    ApiService.register.mockRejectedValueOnce({
      response: {
        data: 'Username already exists'
      }
    })
    
    wrapper = shallowMount(RegisterPage, {
      localVue,
      router
    })
    
    // Fill the form with valid data
    await wrapper.find('#email').setValue('user@example.com')
    await wrapper.find('#username').setValue('existinguser')
    await wrapper.find('#password').setValue('StrongPass123')
    await wrapper.find('#confirmPassword').setValue('StrongPass123')
    await wrapper.find('#termsAgreement').setChecked(true)
    
    // Submit the form
    await wrapper.find('form').trigger('submit.prevent')
    
    // Wait for promises to resolve
    await wrapper.vm.$nextTick()
    
    // Should show error message
    expect(wrapper.vm.error).toBe('Username already exists')
    expect(wrapper.vm.success).toBe('')
  })
  
  it('navigates to login when sign in link is clicked', async () => {
    // Spy on router push
    const routerPushSpy = jest.spyOn(router, 'push')
    
    wrapper = shallowMount(RegisterPage, {
      localVue,
      router
    })
    
    // Find and click the login link
    const loginLink = wrapper.find('.login-footer a')
    await loginLink.trigger('click')
    
    // Should navigate to login
    expect(routerPushSpy).toHaveBeenCalledWith('/login')
  })
  
  it('disables form during submission', async () => {
    // Create a promise that we can resolve manually
    let resolvePromise
    const apiPromise = new Promise(resolve => {
      resolvePromise = resolve
    })
    
    // Mock API call that doesn't resolve immediately
    ApiService.register.mockReturnValueOnce(apiPromise)
    
    wrapper = shallowMount(RegisterPage, {
      localVue,
      router
    })
    
    // Fill the form with valid data
    await wrapper.find('#email').setValue('user@example.com')
    await wrapper.find('#username').setValue('testuser')
    await wrapper.find('#password').setValue('StrongPass123')
    await wrapper.find('#confirmPassword').setValue('StrongPass123')
    await wrapper.find('#termsAgreement').setChecked(true)
    
    // Submit the form
    await wrapper.find('form').trigger('submit.prevent')
    
    // Form should be in loading state
    expect(wrapper.vm.isLoading).toBe(true)
    
    // Inputs should be disabled
    expect(wrapper.find('#email').attributes('disabled')).toBeDefined()
    expect(wrapper.find('#username').attributes('disabled')).toBeDefined()
    expect(wrapper.find('#password').attributes('disabled')).toBeDefined()
    
    // Button should be disabled and show loading text
    const button = wrapper.find('button[type="submit"]')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.text()).toContain('Processing')
    
    // Resolve the API call
    resolvePromise({ data: 'Success' })
    
    // Wait for promises to resolve
    await wrapper.vm.$nextTick()
    
    // Form should no longer be in loading state
    expect(wrapper.vm.isLoading).toBe(false)
  })
  
  it('shows terms and conditions when link is clicked', async () => {
    // Mock window.alert
    global.alert = jest.fn()
    
    wrapper = shallowMount(RegisterPage, {
      localVue,
      router
    })
    
    // Find and click the terms link
    const termsLink = wrapper.find('.checkbox-group a')
    await termsLink.trigger('click')
    
    // Should show terms alert
    expect(global.alert).toHaveBeenCalledWith('Terms & Conditions would be displayed here.')
  })
})