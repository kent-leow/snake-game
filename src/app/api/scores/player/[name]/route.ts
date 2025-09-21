import { NextRequest, NextResponse } from 'next/server';
import { ScoreService } from '../../../../../lib/api/scoreService';
import { handleApiError } from '../../../../../lib/api/errorHandler';

/**
 * GET /api/scores/player/[name] - Get scores for a specific player
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        {
          error: 'Invalid player name',
          message: 'Player name is required and must be a string',
        },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 50) {
      return NextResponse.json(
        {
          error: 'Invalid limit',
          message: 'Limit must be between 1 and 50',
        },
        { status: 400 }
      );
    }

    const decodedName = decodeURIComponent(name);
    const scoreService = new ScoreService();
    const scores = await scoreService.getPlayerScores(decodedName, limit);

    return NextResponse.json({
      success: true,
      data: {
        playerName: decodedName,
        scores,
        bestScore: scores[0]?.score || 0,
        totalGames: scores.length,
        averageScore: scores.length > 0 
          ? Math.round(scores.reduce((sum: number, score: any) => sum + score.score, 0) / scores.length)
          : 0,
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