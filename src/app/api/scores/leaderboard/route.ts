import { NextRequest, NextResponse } from 'next/server';
import { ScoreService } from '@/lib/api/scoreService';
import { handleApiError } from '@/lib/api/errorHandler';

/**
 * GET /api/scores/leaderboard - Get top scores leaderboard
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get('period') || 'all') as 'daily' | 'weekly' | 'monthly' | 'all';
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Validate parameters
    if (!['daily', 'weekly', 'monthly', 'all'].includes(period)) {
      return NextResponse.json(
        {
          error: 'Invalid period',
          message: 'Period must be one of: daily, weekly, monthly, all',
        },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          error: 'Invalid limit',
          message: 'Limit must be between 1 and 100',
        },
        { status: 400 }
      );
    }

    const scoreService = new ScoreService();
    const leaderboard = await scoreService.getLeaderboard({
      period,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: {
        period,
        leaderboard,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error, NextResponse);
  }
}

/**
 * Handle unsupported methods
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'Method not allowed',
      allowedMethods: ['GET'],
    },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    {
      error: 'Method not allowed',
      allowedMethods: ['GET'],
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      error: 'Method not allowed',
      allowedMethods: ['GET'],
    },
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    {
      error: 'Method not allowed',
      allowedMethods: ['GET'],
    },
    { status: 405 }
  );
}