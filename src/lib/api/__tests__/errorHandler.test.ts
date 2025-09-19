/**
 * @jest-environment node
 */
import { NextResponse } from 'next/server';
import {
  ValidationError,
  SecurityError,
  DatabaseError,
  RateLimitError,
  handleApiError,
  createErrorResponse,
  validateMethod,
} from '../errorHandler';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      data,
      status: init?.status || 200,
    })),
  },
}));

const MockNextResponse = NextResponse as jest.Mocked<typeof NextResponse>;

describe('Error Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.error to avoid test output noise
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Custom Error Classes', () => {
    it('should create ValidationError with details', () => {
      const error = new ValidationError('Validation failed', ['Field is required']);
      
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Validation failed');
      expect(error.details).toEqual(['Field is required']);
      expect(error instanceof Error).toBe(true);
    });

    it('should create SecurityError', () => {
      const error = new SecurityError('Security check failed');
      
      expect(error.name).toBe('SecurityError');
      expect(error.message).toBe('Security check failed');
      expect(error instanceof Error).toBe(true);
    });

    it('should create DatabaseError with original error', () => {
      const originalError = new Error('Connection failed');
      const error = new DatabaseError('Database error', originalError);
      
      expect(error.name).toBe('DatabaseError');
      expect(error.message).toBe('Database error');
      expect(error.originalError).toBe(originalError);
      expect(error instanceof Error).toBe(true);
    });

    it('should create RateLimitError', () => {
      const error = new RateLimitError('Rate limit exceeded');
      
      expect(error.name).toBe('RateLimitError');
      expect(error.message).toBe('Rate limit exceeded');
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('handleApiError', () => {
    it('should handle ValidationError', () => {
      const error = new ValidationError('Validation failed', ['Field is required', 'Invalid format']);
      
      const response = handleApiError(error, MockNextResponse);
      
      expect(MockNextResponse.json).toHaveBeenCalledWith(
        {
          error: 'Validation failed',
          message: 'Validation failed',
          details: ['Field is required', 'Invalid format'],
        },
        { status: 400 }
      );
    });

    it('should handle SecurityError', () => {
      const error = new SecurityError('Access denied');
      
      const response = handleApiError(error, MockNextResponse);
      
      expect(MockNextResponse.json).toHaveBeenCalledWith(
        {
          error: 'Security check failed',
          message: 'Access denied',
        },
        { status: 403 }
      );
    });

    it('should handle RateLimitError', () => {
      const error = new RateLimitError('Too many requests');
      
      const response = handleApiError(error, MockNextResponse);
      
      expect(MockNextResponse.json).toHaveBeenCalledWith(
        {
          error: 'Rate limit exceeded',
          message: 'Too many requests',
        },
        { status: 429 }
      );
    });

    it('should handle DatabaseError', () => {
      const error = new DatabaseError('Connection failed');
      
      const response = handleApiError(error, MockNextResponse);
      
      expect(MockNextResponse.json).toHaveBeenCalledWith(
        {
          error: 'Database error',
          message: 'A database error occurred',
        },
        { status: 503 }
      );
    });

    it('should handle MongoDB network errors', () => {
      const error = { name: 'MongoNetworkError', message: 'Network timeout' };
      
      const response = handleApiError(error, MockNextResponse);
      
      expect(MockNextResponse.json).toHaveBeenCalledWith(
        {
          error: 'Database temporarily unavailable',
          message: 'Please try again later',
        },
        { status: 503 }
      );
    });

    it('should handle MongoDB validation errors', () => {
      const error = { name: 'ValidationError', message: 'Validation failed' };
      
      const response = handleApiError(error, MockNextResponse);
      
      expect(MockNextResponse.json).toHaveBeenCalledWith(
        {
          error: 'Data validation failed',
          message: 'Validation failed',
        },
        { status: 400 }
      );
    });

    it('should handle MongoDB cast errors', () => {
      const error = { name: 'CastError' };
      
      const response = handleApiError(error, MockNextResponse);
      
      expect(MockNextResponse.json).toHaveBeenCalledWith(
        {
          error: 'Invalid data format',
          message: 'One or more fields have invalid data types',
        },
        { status: 400 }
      );
    });

    it('should handle JSON syntax errors', () => {
      const error = new SyntaxError('Unexpected token in JSON at position 0');
      
      const response = handleApiError(error, MockNextResponse);
      
      expect(MockNextResponse.json).toHaveBeenCalledWith(
        {
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON',
        },
        { status: 400 }
      );
    });

    it('should handle generic errors', () => {
      const error = new Error('Unknown error');
      
      const response = handleApiError(error, MockNextResponse);
      
      expect(MockNextResponse.json).toHaveBeenCalledWith(
        {
          error: 'Internal server error',
          message: 'An unexpected error occurred',
        },
        { status: 500 }
      );
    });

    it('should handle non-Error objects', () => {
      const error = 'String error';
      
      const response = handleApiError(error, MockNextResponse);
      
      expect(MockNextResponse.json).toHaveBeenCalledWith(
        {
          error: 'Internal server error',
          message: 'An unexpected error occurred',
        },
        { status: 500 }
      );
    });
  });

  describe('createErrorResponse', () => {
    it('should create error response with default status', () => {
      const response = createErrorResponse('Something went wrong');
      
      expect(MockNextResponse.json).toHaveBeenCalledWith(
        {
          error: 'Internal Server Error',
          message: 'Something went wrong',
        },
        { status: 500 }
      );
    });

    it('should create error response with custom status', () => {
      const response = createErrorResponse('Not found', 404);
      
      expect(MockNextResponse.json).toHaveBeenCalledWith(
        {
          error: 'Not Found',
          message: 'Not found',
        },
        { status: 404 }
      );
    });

    it('should create error response with details', () => {
      const response = createErrorResponse('Validation failed', 400, ['Name is required']);
      
      expect(MockNextResponse.json).toHaveBeenCalledWith(
        {
          error: 'Bad Request',
          message: 'Validation failed',
          details: ['Name is required'],
        },
        { status: 400 }
      );
    });

    it('should not include empty details array', () => {
      const response = createErrorResponse('Error', 500, []);
      
      expect(MockNextResponse.json).toHaveBeenCalledWith(
        {
          error: 'Internal Server Error',
          message: 'Error',
        },
        { status: 500 }
      );
    });
  });

  describe('validateMethod', () => {
    it('should return null for allowed method', () => {
      const request = { method: 'GET' } as Request;
      const result = validateMethod(request, ['GET', 'POST']);
      
      expect(result).toBeNull();
    });

    it('should return error response for disallowed method', () => {
      const request = { method: 'DELETE' } as Request;
      const result = validateMethod(request, ['GET', 'POST']);
      
      expect(MockNextResponse.json).toHaveBeenCalledWith(
        {
          error: 'Method not allowed',
          message: 'Method DELETE is not allowed',
          allowedMethods: ['GET', 'POST'],
        },
        { status: 405 }
      );
    });

    it('should handle missing method', () => {
      const request = {} as Request;
      const result = validateMethod(request, ['GET', 'POST']);
      
      expect(MockNextResponse.json).toHaveBeenCalledWith(
        {
          error: 'Method not allowed',
          message: 'Method undefined is not allowed',
          allowedMethods: ['GET', 'POST'],
        },
        { status: 405 }
      );
    });
  });

  describe('Error Type Mapping', () => {
    const testCases = [
      { status: 400, expected: 'Bad Request' },
      { status: 401, expected: 'Unauthorized' },
      { status: 403, expected: 'Forbidden' },
      { status: 404, expected: 'Not Found' },
      { status: 405, expected: 'Method Not Allowed' },
      { status: 409, expected: 'Conflict' },
      { status: 422, expected: 'Unprocessable Entity' },
      { status: 429, expected: 'Too Many Requests' },
      { status: 500, expected: 'Internal Server Error' },
      { status: 503, expected: 'Service Unavailable' },
      { status: 999, expected: 'Error' },
    ];

    testCases.forEach(({ status, expected }) => {
      it(`should map status ${status} to "${expected}"`, () => {
        createErrorResponse('Test message', status);
        
        expect(MockNextResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expected,
          }),
          { status }
        );
      });
    });
  });
});