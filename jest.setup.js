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

  // Mock HTMLCanvasElement.getContext for Canvas tests
  HTMLCanvasElement.prototype.getContext = jest.fn(() => {
    return {
      // Mock 2D context methods
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      strokeRect: jest.fn(),
      arc: jest.fn(),
      beginPath: jest.fn(),
      closePath: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      quadraticCurveTo: jest.fn(),
      bezierCurveTo: jest.fn(),
      scale: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      fillText: jest.fn(),
      strokeText: jest.fn(),
      measureText: jest.fn(() => ({ width: 0 })),
      drawImage: jest.fn(),
      createLinearGradient: jest.fn(() => ({
        addColorStop: jest.fn(),
      })),
      createRadialGradient: jest.fn(() => ({
        addColorStop: jest.fn(),
      })),
      createPattern: jest.fn(),
      setLineDash: jest.fn(),
      getLineDash: jest.fn(() => []),
      clip: jest.fn(),
      // Mock properties
      fillStyle: '#000000',
      strokeStyle: '#000000',
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
      font: '10px sans-serif',
      textAlign: 'start',
      textBaseline: 'alphabetic',
      imageSmoothingEnabled: true,
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      canvas: {},
    };
  });

  // Mock requestAnimationFrame and cancelAnimationFrame
  global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16));
  global.cancelAnimationFrame = jest.fn((id) => clearTimeout(id));
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
