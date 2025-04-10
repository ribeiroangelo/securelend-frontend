// tests/unit/Dashboard.spec.js
import { shallowMount, createLocalVue } from '@vue/test-utils'
import VueRouter from 'vue-router'
import Dashboard from '@/components/Dashboard.vue'

const localVue = createLocalVue()
localVue.use(VueRouter)
const router = new VueRouter()

describe('Dashboard.vue', () => {
  let wrapper
  
  beforeEach(() => {
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
  
  it('renders the dashboard content correctly', () => {
    // Mock localStorage to return isLoggedIn as true
    window.localStorage.getItem.mockReturnValueOnce('true')
    
    wrapper = shallowMount(Dashboard, {
      localVue,
      router
    })
    
    // Should have dashboard elements
    expect(wrapper.find('.dashboard').exists()).toBe(true)
    expect(wrapper.find('header').exists()).toBe(true)
    expect(wrapper.find('button').exists()).toBe(true)
    expect(wrapper.find('.dashboard-content').exists()).toBe(true)
  })
  
  it('redirects to login page if not logged in', async () => {
    // Mock localStorage to return null (not logged in)
    window.localStorage.getItem.mockReturnValueOnce(null)
    
    // Spy on router push
    const routerPushSpy = jest.spyOn(router, 'push')
    
    wrapper = shallowMount(Dashboard, {
      localVue,
      router
    })
    
    // Should redirect to login
    expect(routerPushSpy).toHaveBeenCalledWith('/login')
  })
  
  it('logs out and redirects when logout button is clicked', async () => {
    // Mock localStorage to return isLoggedIn as true
    window.localStorage.getItem.mockReturnValueOnce('true')
    
    // Spy on router push
    const routerPushSpy = jest.spyOn(router, 'push')
    
    wrapper = shallowMount(Dashboard, {
      localVue,
      router
    })
    
    // Find and click the logout button
    const logoutButton = wrapper.find('button')
    await logoutButton.trigger('click')
    
    // Should remove from localStorage
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('isLoggedIn')
    
    // Should redirect to login
    expect(routerPushSpy).toHaveBeenCalledWith('/login')
  })
})