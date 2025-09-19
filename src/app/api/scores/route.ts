import { NextRequest, NextResponse } from 'next/server';
import { ScoreService } from '@/lib/api/scoreService';
import { handleApiError } from '@/lib/api/errorHandler';

/**
 * GET /api/scores - Retrieve scores with pagination and filtering
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const sortBy = searchParams.get('sortBy') || 'score';
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc';

    // Validate parameters
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          error: 'Invalid limit',
          message: 'Limit must be between 1 and 100',
        },
        { status: 400 }
      );
    }

    if (offset < 0) {
      return NextResponse.json(
        {
          error: 'Invalid offset',
          message: 'Offset must be non-negative',
        },
        { status: 400 }
      );
    }

    const scoreService = new ScoreService();
    const result = await scoreService.getScores({
      limit,
      offset,
      sortBy,
      order,
    });

    return NextResponse.json({
      success: true,
      data: result.scores,
      pagination: {
        total: result.total,
        limit,
        offset,
        hasMore: result.total > offset + limit,
      },
    });
  } catch (error) {
    return handleApiError(error, NextResponse);
  }
}

/**
 * POST /api/scores - Create a new score record
 */
export async function POST(request: NextRequest) {
  try {
    const scoreData = await request.json();

    // Rate limiting check
    const clientId = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    if (await ScoreService.isRateLimited(clientId)) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Please wait before submitting another score',
        },
        { status: 429 }
      );
    }

    const scoreService = new ScoreService();
    const result = await scoreService.createScore(scoreData);

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: 'Score saved successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, NextResponse);
  }
}

/**
 * Handle unsupported methods
 */
export async function PUT() {
  return NextResponse.json(
    {
      error: 'Method not allowed',
      allowedMethods: ['GET', 'POST'],
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      error: 'Method not allowed',
      allowedMethods: ['GET', 'POST'],
    },
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    {
      error: 'Method not allowed',
      allowedMethods: ['GET', 'POST'],
    },
    { status: 405 }
  );
}