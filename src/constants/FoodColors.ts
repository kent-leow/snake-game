/**
 * Color definitions for numbered food blocks with accessibility considerations
 * Colors are chosen for high contrast and colorblind accessibility
 */

/**
 * Color definitions for each numbered food block (1-5)
 * Colors provide good contrast and are distinguishable for colorblind users
 */
export const FOOD_COLORS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: '#FF6B6B', // Red - High energy, high priority
  2: '#4ECDC4', // Teal - Cool, balanced
  3: '#45B7D1', // Blue - Trust, stability  
  4: '#96CEB4', // Green - Growth, success
  5: '#FECA57', // Yellow - Attention, high value
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
 * Food styling configuration
 */
export const FOOD_STYLE = {
  borderWidth: 2,
  borderColor: '#2C3E50',
  fontFamily: 'Arial, sans-serif',
  fontWeight: 'bold' as const,
  textAlign: 'center' as const,
  textBaseline: 'middle' as const,
  textColor: '#FFFFFF',
  shadowColor: 'rgba(0, 0, 0, 0.5)',
  shadowOffset: 1,
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
 * Get border color that contrasts well with the food color
 */
export function getBorderColor(foodColor: string): string {
  return hasGoodContrast(foodColor) ? '#FFFFFF' : '#000000';
}