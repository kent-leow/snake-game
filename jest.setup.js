// Jest setup file for global test configuration
/* eslint-disable @typescript-eslint/no-require-imports */
require('@testing-library/jest-dom');

// Mock Next.js environment
process.env.NODE_ENV = 'test';

// Mock window.matchMedia (not available in JSDOM) - only if window exists
if (typeof window !== 'undefined') {
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
      dispatchEvent: jest.fn(),
    })),
  });

  // Mock ResizeObserver (not available in JSDOM)
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
}

// Mock Next.js Link component
jest.mock('next/link', () => {
  const React = require('react');
  const MockLink = ({ children, href, className, ...props }) => {
    return React.createElement('a', { href, className, ...props }, children);
  };
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// Global test utilities can be added here
