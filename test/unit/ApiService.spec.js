// tests/unit/services/ApiService.spec.js
import axios from 'axios'
import ApiService from '@/services/api'

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn().mockReturnValue({
    post: jest.fn(),
    get: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  })
}))

describe('ApiService', () => {
  let apiClient
  
  beforeEach(() => {
    // Get the mocked axios instance
    apiClient = axios.create()
    
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
    
    // Reset window.location
    delete window.location
    window.location = { href: '' }
  })
  
  it('should be configured with the correct base URL', () => {
    // Check that axios.create was called with right config
    expect(axios.create).toHaveBeenCalledWith(expect.objectContaining({
      baseURL: expect.any(String),
      timeout: expect.any(Number),
      headers: expect.any(Object)
    }))
  })
  
  it('login method should call post with correct endpoint and data', async () => {
    // Arrange
    const credentials = { username: 'testuser', password: 'password123' }
    const expectedResponse = { data: 'token' }
    
    apiClient.post.mockResolvedValueOnce(expectedResponse)
    
    // Act
    const result = await ApiService.login(credentials)
    
    // Assert
    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', credentials)
    expect(result).toEqual(expectedResponse)
  })
  
  it('register method should call post with correct endpoint and data', async () => {
    // Arrange
    const userData = { 
      username: 'newuser', 
      email: 'new@example.com',
      password: 'password123'
    }
    const expectedResponse = { data: 'User registered' }
    
    apiClient.post.mockResolvedValueOnce(expectedResponse)
    
    // Act
    const result = await ApiService.register(userData)
    
    // Assert
    expect(apiClient.post).toHaveBeenCalledWith('/auth/register', userData)
    expect(result).toEqual(expectedResponse)
  })
  
  it('logout method should call post with correct endpoint', async () => {
    // Arrange
    const expectedResponse = { data: 'Logged out' }
    
    apiClient.post.mockResolvedValueOnce(expectedResponse)
    
    // Act
    const result = await ApiService.logout()
    
    // Assert
    expect(apiClient.post).toHaveBeenCalledWith('/auth/logout')
    expect(result).toEqual(expectedResponse)
  })
  
  it('getUserProfile method should call get with correct endpoint', async () => {
    // Arrange
    const expectedResponse = { data: { username: 'testuser' } }
    
    apiClient.get.mockResolvedValueOnce(expectedResponse)
    
    // Act
    const result = await ApiService.getUserProfile()
    
    // Assert
    expect(apiClient.get).toHaveBeenCalledWith('/user/profile')
    expect(result).toEqual(expectedResponse)
  })
  
  it('request interceptor should add auth token to headers if available', () => {
    // Extract the request interceptor function
    const requestInterceptor = apiClient.interceptors.request.use.mock.calls[0][0]
    
    // Mock config object
    const config = { 
      headers: {}
    }
    
    // Test when token exists
    window.localStorage.getItem.mockReturnValueOnce('test-token')
    let result = requestInterceptor(config)
    expect(result.headers['Authorization']).toBe('Bearer test-token')
    
    // Test when token doesn't exist
    window.localStorage.getItem.mockReturnValueOnce(null)
    result = requestInterceptor(config)
    expect(result.headers['Authorization']).toBeUndefined()
  })
  
  it('response interceptor should redirect on 401 error', () => {
    // Extract the response interceptor success and error handlers
    const successHandler = apiClient.interceptors.response.use.mock.calls[0][0]
    const errorHandler = apiClient.interceptors.response.use.mock.calls[0][1]
    
    // Test success case
    const response = { data: 'success' }
    expect(successHandler(response)).toBe(response)
    
    // Test 401 error case
    const error = { 
      response: { 
        status: 401 
      }
    }
    
    // Try-catch because the error handler should throw
    try {
      errorHandler(error)
    } catch (e) {
      // Should have cleared localStorage
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('authToken')
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('isLoggedIn')
      
      // Should have redirected
      expect(window.location.href).toBe('/login')
    }
    
    // Test other error case
    const otherError = { 
      response: { 
        status: 404 
      }
    }
    
    // Should reject with the error
    expect(() => errorHandler(otherError)).rejects.toEqual(otherError)
  })
})