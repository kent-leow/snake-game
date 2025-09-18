import { ScoreInput, ScoreValidationResult, GameMetrics, ComboStats } from '../types/Database';

/**
 * Comprehensive score data validation utility
 * Validates score data before database insertion
 */
export function validateScoreData(scoreData: Partial<ScoreInput>): ScoreValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic validation
  if (!scoreData.playerName || typeof scoreData.playerName !== 'string') {
    errors.push('Player name is required and must be a string');
  } else {
    // Player name format validation
    if (scoreData.playerName.trim().length === 0) {
      errors.push('Player name cannot be empty');
    } else if (scoreData.playerName.length > 20) {
      errors.push('Player name cannot exceed 20 characters');
    } else if (!/^[a-zA-Z0-9\s\-_]+$/.test(scoreData.playerName)) {
      errors.push('Player name can only contain letters, numbers, spaces, hyphens, and underscores');
    }
  }

  // Score validation
  if (typeof scoreData.score !== 'number') {
    errors.push('Score must be a number');
  } else {
    if (scoreData.score < 0) {
      errors.push('Score cannot be negative');
    } else if (!Number.isInteger(scoreData.score)) {
      errors.push('Score must be an integer');
    }
    
    if (scoreData.score > 1000000) {
      warnings.push('Score is unusually high - please verify');
    }
  }

  // Game metrics validation
  if (!scoreData.gameMetrics) {
    errors.push('Game metrics are required');
  } else {
    const metricsErrors = validateGameMetrics(scoreData.gameMetrics);
    errors.push(...metricsErrors);

    // Cross-validation with score
    if (typeof scoreData.score === 'number' && scoreData.gameMetrics.totalFood) {
      const expectedMinScore = scoreData.gameMetrics.totalFood * 10; // Base points only
      if (scoreData.score < expectedMinScore) {
        errors.push('Score too low for amount of food consumed');
      }

      // Combo validation
      if (scoreData.gameMetrics.totalCombos > scoreData.gameMetrics.totalFood / 3) {
        warnings.push('High combo rate - please verify legitimacy');
      }
    }
  }

  // Combo stats validation
  if (!scoreData.comboStats) {
    errors.push('Combo statistics are required');
  } else {
    const comboErrors = validateComboStats(scoreData.comboStats);
    errors.push(...comboErrors);

    // Cross-validation between combo stats and score
    if (typeof scoreData.score === 'number' && scoreData.comboStats) {
      const totalCalculatedPoints = scoreData.comboStats.basePoints + scoreData.comboStats.totalComboPoints;
      if (scoreData.score > totalCalculatedPoints * 1.2) { // Allow 20% variance
        warnings.push('Score significantly higher than calculated points');
      }
    }
  }

  // Metadata validation (optional but validate if present)
  if (scoreData.metadata) {
    const metadataErrors = validateMetadata(scoreData.metadata as Record<string, unknown>);
    errors.push(...metadataErrors);
  }

  const result: ScoreValidationResult = {
    isValid: errors.length === 0,
    errors,
  };

  if (warnings.length > 0) {
    result.warnings = warnings;
  }

  return result;
}

/**
 * Validate game metrics object
 */
function validateGameMetrics(metrics: Partial<GameMetrics>): string[] {
  const errors: string[] = [];

  // Total food validation
  if (typeof metrics.totalFood !== 'number') {
    errors.push('Total food must be a number');
  } else if (metrics.totalFood < 0) {
    errors.push('Total food cannot be negative');
  } else if (!Number.isInteger(metrics.totalFood)) {
    errors.push('Total food must be an integer');
  }

  // Total combos validation
  if (typeof metrics.totalCombos !== 'number') {
    errors.push('Total combos must be a number');
  } else if (metrics.totalCombos < 0) {
    errors.push('Total combos cannot be negative');
  } else if (!Number.isInteger(metrics.totalCombos)) {
    errors.push('Total combos must be an integer');
  }

  // Longest combo validation
  if (typeof metrics.longestCombo !== 'number') {
    errors.push('Longest combo must be a number');
  } else if (metrics.longestCombo < 0) {
    errors.push('Longest combo cannot be negative');
  } else if (!Number.isInteger(metrics.longestCombo)) {
    errors.push('Longest combo must be an integer');
  } else if (metrics.longestCombo > 100) {
    errors.push('Longest combo seems unrealistically high');
  }

  // Max speed level validation
  if (typeof metrics.maxSpeedLevel !== 'number') {
    errors.push('Max speed level must be a number');
  } else if (metrics.maxSpeedLevel < 0) {
    errors.push('Max speed level cannot be negative');
  } else if (!Number.isInteger(metrics.maxSpeedLevel)) {
    errors.push('Max speed level must be an integer');
  } else if (metrics.maxSpeedLevel > 50) {
    errors.push('Max speed level seems unrealistically high');
  }

  // Game time validation
  if (typeof metrics.gameTimeSeconds !== 'number') {
    errors.push('Game time must be a number');
  } else if (metrics.gameTimeSeconds < 1) {
    errors.push('Game time must be at least 1 second');
  } else if (metrics.gameTimeSeconds > 7200) {
    errors.push('Game time cannot exceed 2 hours');
  } else if (!Number.isFinite(metrics.gameTimeSeconds)) {
    errors.push('Game time must be a finite number');
  }

  // Final snake length validation
  if (typeof metrics.finalSnakeLength !== 'number') {
    errors.push('Final snake length must be a number');
  } else if (metrics.finalSnakeLength < 1) {
    errors.push('Snake length must be at least 1');
  } else if (!Number.isInteger(metrics.finalSnakeLength)) {
    errors.push('Snake length must be an integer');
  } else if (metrics.finalSnakeLength > 10000) {
    errors.push('Snake length seems unrealistically high');
  }

  // Cross-field validations
  if (
    typeof metrics.totalCombos === 'number' &&
    typeof metrics.totalFood === 'number' &&
    metrics.totalCombos > metrics.totalFood
  ) {
    errors.push('Cannot have more combos than total food consumed');
  }

  if (
    typeof metrics.longestCombo === 'number' &&
    typeof metrics.totalFood === 'number' &&
    metrics.longestCombo > metrics.totalFood
  ) {
    errors.push('Longest combo cannot exceed total food consumed');
  }

  return errors;
}

/**
 * Validate combo statistics object
 */
function validateComboStats(stats: Partial<ComboStats>): string[] {
  const errors: string[] = [];

  // Total combo points validation
  if (typeof stats.totalComboPoints !== 'number') {
    errors.push('Total combo points must be a number');
  } else if (stats.totalComboPoints < 0) {
    errors.push('Total combo points cannot be negative');
  } else if (!Number.isInteger(stats.totalComboPoints)) {
    errors.push('Total combo points must be an integer');
  }

  // Base points validation
  if (typeof stats.basePoints !== 'number') {
    errors.push('Base points must be a number');
  } else if (stats.basePoints < 0) {
    errors.push('Base points cannot be negative');
  } else if (!Number.isInteger(stats.basePoints)) {
    errors.push('Base points must be an integer');
  }

  // Combo efficiency validation
  if (typeof stats.comboEfficiency !== 'number') {
    errors.push('Combo efficiency must be a number');
  } else if (stats.comboEfficiency < 0) {
    errors.push('Combo efficiency cannot be negative');
  } else if (stats.comboEfficiency > 100) {
    errors.push('Combo efficiency cannot exceed 100%');
  } else if (!Number.isFinite(stats.comboEfficiency)) {
    errors.push('Combo efficiency must be a finite number');
  }

  // Average combo length validation
  if (typeof stats.averageComboLength !== 'number') {
    errors.push('Average combo length must be a number');
  } else if (!Number.isFinite(stats.averageComboLength)) {
    errors.push('Average combo length must be a finite number');
  } else if (stats.averageComboLength < 0) {
    errors.push('Average combo length cannot be negative');
  } else if (stats.averageComboLength > 50) {
    errors.push('Average combo length seems unrealistically high');
  }

  return errors;
}

/**
 * Validate optional metadata object
 */
function validateMetadata(metadata: Record<string, unknown>): string[] {
  const errors: string[] = [];

  if (metadata.browserInfo && typeof metadata.browserInfo !== 'string') {
    errors.push('Browser info must be a string');
  } else if (metadata.browserInfo && typeof metadata.browserInfo === 'string' && metadata.browserInfo.length > 200) {
    errors.push('Browser info too long');
  }

  if (metadata.screenResolution) {
    if (typeof metadata.screenResolution !== 'string') {
      errors.push('Screen resolution must be a string');
    } else if (metadata.screenResolution.length > 20) {
      errors.push('Screen resolution string too long');
    } else if (!/^\d+x\d+$/.test(metadata.screenResolution)) {
      errors.push('Screen resolution must be in format "1920x1080"');
    }
  }

  if (metadata.gameVersion && typeof metadata.gameVersion !== 'string') {
    errors.push('Game version must be a string');
  } else if (metadata.gameVersion && typeof metadata.gameVersion === 'string' && metadata.gameVersion.length > 10) {
    errors.push('Game version string too long');
  }

  if (metadata.difficulty) {
    if (typeof metadata.difficulty !== 'string') {
      errors.push('Difficulty must be a string');
    } else if (!['easy', 'normal', 'hard'].includes(metadata.difficulty)) {
      errors.push('Difficulty must be easy, normal, or hard');
    }
  }

  return errors;
}

/**
 * Sanitize player name by removing/replacing invalid characters
 */
export function sanitizePlayerName(name: string): string {
  if (!name || typeof name !== 'string') {
    return '';
  }

  return name
    .trim()
    .slice(0, 20) // Limit length
    .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Remove invalid characters
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

/**
 * Quick validation for API endpoints - returns boolean only
 */
export function isValidScoreData(scoreData: unknown): boolean {
  try {
    const result = validateScoreData(scoreData as Partial<ScoreInput>);
    return result.isValid;
  } catch {
    return false;
  }
}

/**
 * Extract validation error messages for user display
 */
export function getValidationErrorMessage(result: ScoreValidationResult): string {
  if (result.isValid) {
    return '';
  }

  const mainErrors = result.errors.slice(0, 3); // Show first 3 errors
  const message = mainErrors.join('. ');
  
  if (result.errors.length > 3) {
    return message + ` (and ${result.errors.length - 3} more errors)`;
  }
  
  return message;
}