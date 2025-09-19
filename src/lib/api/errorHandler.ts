import { NextResponse } from 'next/server';

/**
 * Custom error classes for API handling
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public details: string[]
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityError';
  }
}

export class DatabaseError extends Error {
  constructor(
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Centralized API error handler for Next.js App Router
 */
export function handleApiError(error: unknown, NextResponseClass: typeof NextResponse) {
  console.error('API Error:', error);

  // Handle validation errors
  if (error instanceof ValidationError) {
    return NextResponseClass.json(
      {
        error: 'Validation failed',
        message: error.message,
        details: error.details,
      },
      { status: 400 }
    );
  }

  // Handle security errors
  if (error instanceof SecurityError) {
    return NextResponseClass.json(
      {
        error: 'Security check failed',
        message: error.message,
      },
      { status: 403 }
    );
  }

  // Handle rate limiting errors
  if (error instanceof RateLimitError) {
    return NextResponseClass.json(
      {
        error: 'Rate limit exceeded',
        message: error.message,
      },
      { status: 429 }
    );
  }

  // Handle database errors
  if (error instanceof DatabaseError) {
    return NextResponseClass.json(
      {
        error: 'Database error',
        message: 'A database error occurred',
      },
      { status: 503 }
    );
  }

  // Handle MongoDB-specific errors
  if (error && typeof error === 'object' && 'name' in error) {
    const mongoError = error as { name: string; message?: string };
    
    if (
      mongoError.name === 'MongoNetworkError' ||
      mongoError.name === 'MongoTimeoutError' ||
      mongoError.name === 'MongoServerError'
    ) {
      return NextResponseClass.json(
        {
          error: 'Database temporarily unavailable',
          message: 'Please try again later',
        },
        { status: 503 }
      );
    }

    if (mongoError.name === 'ValidationError') {
      return NextResponseClass.json(
        {
          error: 'Data validation failed',
          message: mongoError.message || 'Invalid data provided',
        },
        { status: 400 }
      );
    }

    if (mongoError.name === 'CastError') {
      return NextResponseClass.json(
        {
          error: 'Invalid data format',
          message: 'One or more fields have invalid data types',
        },
        { status: 400 }
      );
    }
  }

  // Handle JSON parsing errors
  if (error instanceof SyntaxError && error.message.includes('JSON')) {
    return NextResponseClass.json(
      {
        error: 'Invalid JSON',
        message: 'Request body must be valid JSON',
      },
      { status: 400 }
    );
  }

  // Generic server error
  return NextResponseClass.json(
    {
      error: 'Internal server error',
      message: 'An unexpected error occurred',
    },
    { status: 500 }
  );
}

/**
 * Helper function to create standardized error responses
 */
export function createErrorResponse(
  message: string,
  status: number = 500,
  details?: string[]
) {
  const response: {
    error: string;
    message: string;
    details?: string[];
  } = {
    error: getErrorTypeFromStatus(status),
    message,
  };

  if (details && details.length > 0) {
    response.details = details;
  }

  return NextResponse.json(response, { status });
}

/**
 * Map HTTP status codes to error types
 */
function getErrorTypeFromStatus(status: number): string {
  switch (status) {
    case 400:
      return 'Bad Request';
    case 401:
      return 'Unauthorized';
    case 403:
      return 'Forbidden';
    case 404:
      return 'Not Found';
    case 405:
      return 'Method Not Allowed';
    case 409:
      return 'Conflict';
    case 422:
      return 'Unprocessable Entity';
    case 429:
      return 'Too Many Requests';
    case 500:
      return 'Internal Server Error';
    case 503:
      return 'Service Unavailable';
    default:
      return 'Error';
  }
}

/**
 * Helper function to log errors with context
 */
export function logError(error: unknown, context: string = 'API') {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    context,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
  };

  console.error('Error logged:', JSON.stringify(errorInfo, null, 2));
}

/**
 * Validate request method helper
 */
export function validateMethod(
  request: Request,
  allowedMethods: string[]
): NextResponse | null {
  if (!allowedMethods.includes(request.method || '')) {
    return NextResponse.json(
      {
        error: 'Method not allowed',
        message: `Method ${request.method} is not allowed`,
        allowedMethods,
      },
      { status: 405 }
    );
  }
  return null;
}