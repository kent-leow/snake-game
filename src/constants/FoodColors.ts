/**
 * Color definitions for numbered food blocks with accessibility considerations
 * Colors are chosen for high contrast and colorblind accessibility
 */

/**
 * Color definitions for each numbered food block (1-5)
 * Enhanced colors with better visual appeal and accessibility
 */
export const FOOD_COLORS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: '#FF4757', // Vibrant Red - High energy, urgency
  2: '#2ED573', // Vibrant Green - Fresh, balanced
  3: '#3742FA', // Electric Blue - Trust, focus
  4: '#FF6348', // Coral Orange - Warmth, creativity
  5: '#FFA502', // Golden Orange - Value, attention
} as const;

/**
 * Alternative high contrast colors for accessibility mode
 */
export const HIGH_CONTRAST_FOOD_COLORS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: '#FF0000', // Pure red
  2: '#00FFFF', // Pure cyan
  3: '#0000FF', // Pure blue
  4: '#00FF00', // Pure green
  5: '#FFFF00', // Pure yellow
} as const;

/**
 * Color scheme optimized for protanopia (red-green colorblind)
 */
export const PROTANOPIA_FOOD_COLORS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: '#1F77B4', // Blue
  2: '#FF7F0E', // Orange
  3: '#2CA02C', // Green
  4: '#D62728', // Red
  5: '#9467BD', // Purple
} as const;

/**
 * Color scheme optimized for deuteranopia (green-red colorblind)
 */
export const DEUTERANOPIA_FOOD_COLORS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: '#1F77B4', // Blue
  2: '#FF7F0E', // Orange
  3: '#2CA02C', // Green
  4: '#D62728', // Red
  5: '#9467BD', // Purple
} as const;

/**
 * Enhanced food styling configuration with modern aesthetics
 */
export const FOOD_STYLE = {
  borderWidth: 3,
  borderColor: '#FFFFFF',
  fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Arial, sans-serif',
  fontWeight: 'bold' as const,
  textAlign: 'center' as const,
  textBaseline: 'middle' as const,
  textColor: '#FFFFFF',
  shadowColor: 'rgba(0, 0, 0, 0.4)',
  shadowOffset: 2,
  cornerRadius: 0.15, // Percentage of size for rounded corners
  glowColor: '#FFD700', // Gold glow for special effects
  comboGlowColor: '#00FF88', // Special glow for combo targets
} as const;

/**
 * Gradient color pairs for enhanced visual effects
 */
export const GRADIENT_COLORS: Record<1 | 2 | 3 | 4 | 5, { start: string; end: string }> = {
  1: { start: '#FF6B9D', end: '#C44569' }, // Pink to deep red gradient
  2: { start: '#26de81', end: '#20bf6b' }, // Light to dark green gradient
  3: { start: '#4834d4', end: '#686de0' }, // Deep to light purple gradient
  4: { start: '#ff9ff3', end: '#f368e0' }, // Light to deep pink gradient
  5: { start: '#feca57', end: '#ff9f43' }, // Light to deep orange gradient
} as const;

/**
 * Combo target enhancement colors
 */
export const COMBO_TARGET_COLORS = {
  primaryGlow: '#FFD700', // Gold
  secondaryGlow: '#FFF700', // Bright yellow
  pulseColor: '#FFEA00', // Electric yellow
  borderHighlight: '#FFFFFF', // White
} as const;

/**
 * Animation color schemes
 */
export const ANIMATION_COLORS = {
  success: '#00FF88',
  warning: '#FFB347',
  error: '#FF6B6B',
  info: '#74B9FF',
  special: '#A29BFE',
} as const;

/**
 * Get the appropriate color scheme based on accessibility needs
 */
export function getFoodColors(
  colorScheme: 'default' | 'high-contrast' | 'protanopia' | 'deuteranopia' = 'default'
): Record<1 | 2 | 3 | 4 | 5, string> {
  switch (colorScheme) {
    case 'high-contrast':
      return HIGH_CONTRAST_FOOD_COLORS;
    case 'protanopia':
      return PROTANOPIA_FOOD_COLORS;
    case 'deuteranopia':
      return DEUTERANOPIA_FOOD_COLORS;
    default:
      return FOOD_COLORS;
  }
}

/**
 * Check if a color has sufficient contrast against white text
 */
export function hasGoodContrast(backgroundColor: string): boolean {
  // This is a simplified contrast check
  // In a production app, you'd want to use a proper contrast ratio calculation
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate relative luminance (simplified)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return true if background is dark enough for white text
  return luminance < 0.6;
}

/**
 * Get gradient colors for a specific food number
 */
export function getGradientColors(number: 1 | 2 | 3 | 4 | 5): { start: string; end: string } {
  return GRADIENT_COLORS[number];
}

/**
 * Get combo target glow color
 */
export function getComboGlowColor(): string {
  return COMBO_TARGET_COLORS.primaryGlow;
}

/**
 * Get enhanced color for combo target
 */
export function getEnhancedColor(baseColor: string, isComboTarget: boolean): string {
  if (!isComboTarget) return baseColor;
  
  // Enhance brightness and saturation for combo targets
  return lightenColor(baseColor, 0.2);
}

/**
 * Lighten a hex color by a percentage
 */
export function lightenColor(color: string, percent: number): string {
  const hex = color.replace('#', '');
  const r = Math.min(255, Math.floor(parseInt(hex.substr(0, 2), 16) * (1 + percent)));
  const g = Math.min(255, Math.floor(parseInt(hex.substr(2, 2), 16) * (1 + percent)));
  const b = Math.min(255, Math.floor(parseInt(hex.substr(4, 2), 16) * (1 + percent)));
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Darken a hex color by a percentage
 */
export function darkenColor(color: string, percent: number): string {
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.floor(parseInt(hex.substr(0, 2), 16) * (1 - percent)));
  const g = Math.max(0, Math.floor(parseInt(hex.substr(2, 2), 16) * (1 - percent)));
  const b = Math.max(0, Math.floor(parseInt(hex.substr(4, 2), 16) * (1 - percent)));
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Get border color that contrasts well with the food color
 */
export function getBorderColor(foodColor: string, isComboTarget: boolean = false): string {
  if (isComboTarget) {
    return COMBO_TARGET_COLORS.borderHighlight;
  }
  return hasGoodContrast(foodColor) ? '#FFFFFF' : '#000000';
}