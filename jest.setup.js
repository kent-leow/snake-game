// Jest setup file for global test configuration
/* eslint-disable @typescript-eslint/no-require-imports */
require('@testing-library/jest-dom');

// Mock Next.js environment
process.env.NODE_ENV = 'test';

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
