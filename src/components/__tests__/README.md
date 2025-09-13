# Testing Setup Instructions

This directory contains test files for the Snake Game project components. To enable testing, you need to install and configure the testing dependencies.

## Required Dependencies

Install the following packages to enable testing:

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @types/jest jest-environment-jsdom
```

## Jest Configuration

Create a `jest.config.js` file in the project root:

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    // Handle module aliases (this will be automatically configured for you based on your tsconfig.json paths)
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
```

## Jest Setup File

Create a `jest.setup.js` file in the project root:

```javascript
import '@testing-library/jest-dom'
```

## Package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## Current Test Files

Once the setup is complete, the following test files will be ready to run:

- `Layout.test.tsx` - Tests for the Layout component
- `Button.test.tsx` - Tests for the Button component  
- `Navigation.test.tsx` - Tests for the Navigation component

## Running Tests

After setup, run tests with:

```bash
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage report
```