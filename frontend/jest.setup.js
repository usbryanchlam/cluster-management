// Optional: configure or set up a testing framework before each test
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
})

// Mock window.location
delete window.location
window.location = {
  href: 'http://localhost:3000',
  protocol: 'http:',
  host: 'localhost',
  hostname: 'localhost',
  port: '3000',
  pathname: '/',
  search: '',
  hash: ''
}

// Suppress console warnings during tests (optional)
const originalWarn = console.warn
beforeAll(() => {
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('React Router')
    ) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.warn = originalWarn
})

// Set up environment variables for tests
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3333'

// Polyfill for TextEncoder/TextDecoder for MSW
const { TextEncoder, TextDecoder } = require('util')
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Add fetch and Response for MSW
if (!global.fetch) {
  global.fetch = jest.fn()
}

if (!global.Request) {
  global.Request = class Request {}
}

if (!global.Response) {
  global.Response = class Response {
    constructor(body, init) {
      this.body = body
      this.status = init?.status || 200
      this.statusText = init?.statusText || 'OK'
      this.headers = new Headers(init?.headers)
    }
    
    json() {
      return Promise.resolve(JSON.parse(this.body))
    }
    
    text() {
      return Promise.resolve(this.body)
    }
  }
}

if (!global.Headers) {
  global.Headers = class Headers {
    constructor(init) {
      this._headers = {}
      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this._headers[key.toLowerCase()] = value
        })
      }
    }
    
    get(name) {
      return this._headers[name.toLowerCase()]
    }
    
    set(name, value) {
      this._headers[name.toLowerCase()] = value
    }
  }
}
