/**
 * @jest-environment jsdom
 */

import { renderHook } from '@testing-library/react';
import { useGameStateLegacy } from '../useGameState';

// Simple integration test for the basic functionality
describe('useGameState Integration Test', () => {
  it('should provide basic legacy compatibility', () => {
    const { result } = renderHook(() => useGameStateLegacy());
    
    // Check that the hook returns the expected structure
    expect(result.current).toHaveProperty('gameState');
    expect(result.current).toHaveProperty('startGame');
    expect(result.current.gameState).toHaveProperty('isPlaying');
    expect(result.current.gameState).toHaveProperty('gameOver');
    expect(typeof result.current.startGame).toBe('function');
  });
});