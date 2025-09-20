/**
 * Score Formatter Utilities
 * 
 * Utility functions for formatting score data for display in the high score pa  // Basic sanitization - remove any potentially problematic characters
  // This removes HTML tags and dangerous characters
  formatted = formatted.replace(/<[^>]*>/g, '').replace(/[<>"'&]/g, '');
 */

/**
 * Format a numeric score for display with appropriate thousand separators
 */
export function formatScore(score: number): string {
  if (typeof score !== 'number' || isNaN(score)) {
    return '0';
  }

  // Handle negative scores (shouldn't happen but defensive programming)
  if (score < 0) {
    return '0';
  }

  // Round to nearest integer and format with thousand separators
  return Math.round(score).toLocaleString('en-US');
}

/**
 * Format a timestamp for display with relative and absolute options
 */
export function formatTimestamp(
  timestamp: Date | string,
  format: 'short' | 'long' | 'relative' = 'relative'
): string {
  try {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    
    // Validate date
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return 'Unknown';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    // Handle future dates
    if (diffMs < 0) {
      return formatTimestamp(date, 'short');
    }
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    switch (format) {
      case 'relative':
        // Return relative time for recent scores
        if (diffMinutes < 1) {
          return 'Just now';
        } else if (diffMinutes < 60) {
          return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
        } else if (diffHours < 24) {
          return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
        } else if (diffDays < 7) {
          return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
        } else {
          // Fall back to short format for older dates
          return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
          });
        }

      case 'short':
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        });

      case 'long':
        return date.toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

      default:
        return date.toLocaleDateString('en-US');
    }
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return 'Unknown';
  }
}

/**
 * Format a player name for display with length limits and sanitization
 */
export function formatPlayerName(name: string, maxLength: number = 20): string {
  if (typeof name !== 'string') {
    return 'Anonymous';
  }

  // Trim whitespace
  let formatted = name.trim();

  // Handle empty or whitespace-only names
  if (formatted.length === 0) {
    return 'Anonymous';
  }

  // Truncate if too long
  if (formatted.length > maxLength) {
    formatted = formatted.substring(0, maxLength - 3) + '...';
  }

  // Basic sanitization - remove any potentially problematic characters
  formatted = formatted.replace(/[<>\"'&]/g, '');

  // Return formatted name or fallback
  return formatted.length > 0 ? formatted : 'Anonymous';
}

/**
 * Format game time duration in seconds to human-readable format
 */
export function formatGameTime(seconds: number): string {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
    return '0:00';
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (minutes > 0) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `0:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

/**
 * Format combo count for display
 */
export function formatComboCount(count: number): string {
  if (typeof count !== 'number' || isNaN(count) || count < 0) {
    return '0';
  }

  return count.toString();
}

/**
 * Format combo efficiency as a percentage
 */
export function formatComboEfficiency(efficiency: number): string {
  if (typeof efficiency !== 'number' || isNaN(efficiency)) {
    return '0.0%';
  }

  // Clamp between 0 and 100
  const clamped = Math.max(0, Math.min(100, efficiency));
  
  // Round to 1 decimal place for percentages
  return `${clamped.toFixed(1)}%`;
}

/**
 * Format rank for display with ordinal suffixes
 */
export function formatRank(rank: number): string {
  if (typeof rank !== 'number' || isNaN(rank) || rank < 1) {
    return '#1st';
  }

  const suffix = getRankSuffix(rank);
  return `#${rank}${suffix}`;
}

/**
 * Get the ordinal suffix for a rank number
 */
function getRankSuffix(rank: number): string {
  const lastDigit = rank % 10;
  const lastTwoDigits = rank % 100;

  // Special cases for 11th, 12th, 13th
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return 'th';
  }

  switch (lastDigit) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

/**
 * Format food count for display
 */
export function formatFoodCount(count: number): string {
  if (typeof count !== 'number' || isNaN(count) || count < 0) {
    return '0';
  }

  return count.toString();
}

/**
 * Abbreviate large numbers for compact display
 */
export function abbreviateNumber(num: number): string {
  if (typeof num !== 'number' || isNaN(num)) {
    return '0';
  }

  const absNum = Math.abs(num);
  
  if (absNum >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (absNum >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  } else {
    return num.toString();
  }
}

/**
 * Format a complete score entry with all relevant data
 */
export interface FormattedScoreEntry {
  playerName: string;
  score: string;
  rank: string;
  timestamp: string;
  gameTime: string;
  foodCount: string;
  longestCombo: string;
  comboEfficiency: string;
}

export function formatScoreEntry(
  scoreData: {
    playerName: string;
    score: number;
    timestamp: Date | string;
    gameMetrics: {
      gameTimeSeconds: number;
      totalFood: number;
      longestCombo: number;
    };
    comboStats: {
      comboEfficiency: number;
    };
  },
  rank: number,
  timestampFormat: 'short' | 'long' | 'relative' = 'relative'
): FormattedScoreEntry {
  return {
    playerName: formatPlayerName(scoreData.playerName),
    score: formatScore(scoreData.score),
    rank: formatRank(rank),
    timestamp: formatTimestamp(scoreData.timestamp, timestampFormat),
    gameTime: formatGameTime(scoreData.gameMetrics.gameTimeSeconds),
    foodCount: formatFoodCount(scoreData.gameMetrics.totalFood),
    longestCombo: formatComboCount(scoreData.gameMetrics.longestCombo),
    comboEfficiency: formatComboEfficiency(scoreData.comboStats.comboEfficiency),
  };
}