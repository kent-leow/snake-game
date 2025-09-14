import { renderHook, act } from '@testing-library/react';
import { useKeyboardInput } from '../useKeyboardInput';

describe('useKeyboardInput', () => {
  let mockOnDirectionChange: jest.Mock;

  beforeEach(() => {
    mockOnDirectionChange = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('keyboard event handling', () => {
    it('should handle arrow key inputs correctly', () => {
      renderHook(() =>
        useKeyboardInput({
          onDirectionChange: mockOnDirectionChange,
          enabled: true,
        })
      );

      // Test arrow keys
      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
        window.dispatchEvent(event);
      });
      expect(mockOnDirectionChange).toHaveBeenCalledWith('UP');

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
        window.dispatchEvent(event);
      });
      expect(mockOnDirectionChange).toHaveBeenCalledWith('DOWN');

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
        window.dispatchEvent(event);
      });
      expect(mockOnDirectionChange).toHaveBeenCalledWith('LEFT');

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
        window.dispatchEvent(event);
      });
      expect(mockOnDirectionChange).toHaveBeenCalledWith('RIGHT');
    });

    it('should handle WASD key inputs correctly', () => {
      renderHook(() =>
        useKeyboardInput({
          onDirectionChange: mockOnDirectionChange,
          enabled: true,
        })
      );

      // Test WASD keys (lowercase)
      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'w' });
        window.dispatchEvent(event);
      });
      expect(mockOnDirectionChange).toHaveBeenCalledWith('UP');

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 's' });
        window.dispatchEvent(event);
      });
      expect(mockOnDirectionChange).toHaveBeenCalledWith('DOWN');

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'a' });
        window.dispatchEvent(event);
      });
      expect(mockOnDirectionChange).toHaveBeenCalledWith('LEFT');

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'd' });
        window.dispatchEvent(event);
      });
      expect(mockOnDirectionChange).toHaveBeenCalledWith('RIGHT');
    });

    it('should handle uppercase WASD key inputs correctly', () => {
      renderHook(() =>
        useKeyboardInput({
          onDirectionChange: mockOnDirectionChange,
          enabled: true,
        })
      );

      // Test WASD keys (uppercase)
      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'W' });
        window.dispatchEvent(event);
      });
      expect(mockOnDirectionChange).toHaveBeenCalledWith('UP');

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'S' });
        window.dispatchEvent(event);
      });
      expect(mockOnDirectionChange).toHaveBeenCalledWith('DOWN');

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'A' });
        window.dispatchEvent(event);
      });
      expect(mockOnDirectionChange).toHaveBeenCalledWith('LEFT');

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'D' });
        window.dispatchEvent(event);
      });
      expect(mockOnDirectionChange).toHaveBeenCalledWith('RIGHT');
    });

    it('should ignore invalid keys', () => {
      renderHook(() =>
        useKeyboardInput({
          onDirectionChange: mockOnDirectionChange,
          enabled: true,
        })
      );

      // Test invalid keys
      const invalidKeys = ['Space', 'Enter', 'Escape', 'Tab', 'q', 'e', 'r'];
      
      invalidKeys.forEach((key) => {
        act(() => {
          const event = new KeyboardEvent('keydown', { key });
          window.dispatchEvent(event);
        });
      });

      expect(mockOnDirectionChange).not.toHaveBeenCalled();
    });

    it('should not handle inputs when disabled', () => {
      renderHook(() =>
        useKeyboardInput({
          onDirectionChange: mockOnDirectionChange,
          enabled: false,
        })
      );

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
        window.dispatchEvent(event);
      });

      expect(mockOnDirectionChange).not.toHaveBeenCalled();
    });

    it('should prevent default behavior for valid game keys when enabled', () => {
      renderHook(() =>
        useKeyboardInput({
          onDirectionChange: mockOnDirectionChange,
          enabled: true,
          preventDefaultKeys: true,
        })
      );

      const mockPreventDefault = jest.fn();
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      Object.defineProperty(event, 'preventDefault', {
        value: mockPreventDefault,
      });

      act(() => {
        window.dispatchEvent(event);
      });

      expect(mockPreventDefault).toHaveBeenCalled();
    });

    it('should not prevent default behavior when preventDefaultKeys is false', () => {
      renderHook(() =>
        useKeyboardInput({
          onDirectionChange: mockOnDirectionChange,
          enabled: true,
          preventDefaultKeys: false,
        })
      );

      const mockPreventDefault = jest.fn();
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      Object.defineProperty(event, 'preventDefault', {
        value: mockPreventDefault,
      });

      act(() => {
        window.dispatchEvent(event);
      });

      expect(mockPreventDefault).not.toHaveBeenCalled();
    });
  });

  describe('utility functions', () => {
    it('should correctly identify valid game keys', () => {
      const { result } = renderHook(() =>
        useKeyboardInput({
          onDirectionChange: mockOnDirectionChange,
          enabled: true,
        })
      );

      const { isValidGameKey } = result.current;

      // Valid keys
      expect(isValidGameKey('ArrowUp')).toBe(true);
      expect(isValidGameKey('ArrowDown')).toBe(true);
      expect(isValidGameKey('ArrowLeft')).toBe(true);
      expect(isValidGameKey('ArrowRight')).toBe(true);
      expect(isValidGameKey('w')).toBe(true);
      expect(isValidGameKey('a')).toBe(true);
      expect(isValidGameKey('s')).toBe(true);
      expect(isValidGameKey('d')).toBe(true);
      expect(isValidGameKey('W')).toBe(true);
      expect(isValidGameKey('A')).toBe(true);
      expect(isValidGameKey('S')).toBe(true);
      expect(isValidGameKey('D')).toBe(true);

      // Invalid keys
      expect(isValidGameKey('Space')).toBe(false);
      expect(isValidGameKey('Enter')).toBe(false);
      expect(isValidGameKey('q')).toBe(false);
      expect(isValidGameKey('e')).toBe(false);
    });

    it('should correctly convert keys to directions', () => {
      const { result } = renderHook(() =>
        useKeyboardInput({
          onDirectionChange: mockOnDirectionChange,
          enabled: true,
        })
      );

      const { getDirectionFromKey } = result.current;

      // Arrow keys
      expect(getDirectionFromKey('ArrowUp')).toBe('UP');
      expect(getDirectionFromKey('ArrowDown')).toBe('DOWN');
      expect(getDirectionFromKey('ArrowLeft')).toBe('LEFT');
      expect(getDirectionFromKey('ArrowRight')).toBe('RIGHT');

      // WASD (lowercase)
      expect(getDirectionFromKey('w')).toBe('UP');
      expect(getDirectionFromKey('s')).toBe('DOWN');
      expect(getDirectionFromKey('a')).toBe('LEFT');
      expect(getDirectionFromKey('d')).toBe('RIGHT');

      // WASD (uppercase)
      expect(getDirectionFromKey('W')).toBe('UP');
      expect(getDirectionFromKey('S')).toBe('DOWN');
      expect(getDirectionFromKey('A')).toBe('LEFT');
      expect(getDirectionFromKey('D')).toBe('RIGHT');

      // Invalid keys
      expect(getDirectionFromKey('Space')).toBe(null);
      expect(getDirectionFromKey('q')).toBe(null);
      expect(getDirectionFromKey('')).toBe(null);
    });
  });

  describe('event listener cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() =>
        useKeyboardInput({
          onDirectionChange: mockOnDirectionChange,
          enabled: true,
        })
      );

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('should update event listeners when enabled state changes', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { rerender } = renderHook(
        ({ enabled }) =>
          useKeyboardInput({
            onDirectionChange: mockOnDirectionChange,
            enabled,
          }),
        { initialProps: { enabled: true } }
      );

      expect(addEventListenerSpy).toHaveBeenCalledTimes(1);

      // Disable input
      rerender({ enabled: false });

      expect(removeEventListenerSpy).toHaveBeenCalledTimes(1);

      // Re-enable input
      rerender({ enabled: true });

      expect(addEventListenerSpy).toHaveBeenCalledTimes(2);

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });
});