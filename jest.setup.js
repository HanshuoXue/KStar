// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Polyfill for Next.js server components
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock Request/Response for Next.js
global.Request = jest.fn()
global.Response = jest.fn()

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock Clerk
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(() => ({
    userId: 'test-user-id',
  })),
}))

// Mock environment variables
process.env = {
  ...process.env,
  DATABASE_URL: 'mongodb://test',
  AWS_ACCESS_KEY_ID: 'test-key',
  AWS_SECRET_ACCESS_KEY: 'test-secret',
  AWS_REGION: 'us-east-1',
  S3_BUCKET_NAME: 'test-bucket',
  CLERK_SECRET_KEY: 'test-clerk-secret',
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'test-clerk-public',
} 