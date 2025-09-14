/**
 * @jest-environment jsdom
 */

import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  const mockHandlers = {
    onPause: jest.fn(),
    onResume: jest.fn(),
    onRestart: jest.fn(),
    onMenu: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any event listeners
    const listeners = (global as any).__eventListeners || {};
    Object.keys(listeners).forEach(event => {
      if (listeners[event]) {
        listeners[event].forEach((listener: any) => {
          window.removeEventListener(event, listener);
        });
      }
    });
  });

  describe('Hook Initialization', () => {
    it('should initialize without errors when enabled', () => {
      expect(() => {
        renderHook(() =>
          useKeyboardShortcuts({
            enabled: true,
            ...mockHandlers,
          })
        );
      }).not.toThrow();
    });

    it('should initialize without errors when disabled', () => {
      expect(() => {
        renderHook(() =>
          useKeyboardShortcuts({
            enabled: false,
            ...mockHandlers,
          })
        );
      }).not.toThrow();
    });
  });

  describe('Keyboard Event Handling', () => {
    it('should call onPause when spacebar pressed and onPause provided', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          enabled: true,
          onPause: mockHandlers.onPause,
        })
      );

      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      window.dispatchEvent(spaceEvent);

      expect(mockHandlers.onPause).toHaveBeenCalledTimes(1);
    });

    it('should call onResume when spacebar pressed and onResume provided', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          enabled: true,
          onResume: mockHandlers.onResume,
        })
      );

      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      window.dispatchEvent(spaceEvent);

      expect(mockHandlers.onResume).toHaveBeenCalledTimes(1);
    });

    it('should call onRestart when R key pressed', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          enabled: true,
          onRestart: mockHandlers.onRestart,
        })
      );

      const rEvent = new KeyboardEvent('keydown', { key: 'r' });
      window.dispatchEvent(rEvent);

      expect(mockHandlers.onRestart).toHaveBeenCalledTimes(1);
    });

    it('should call onRestart when R key pressed (uppercase)', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          enabled: true,
          onRestart: mockHandlers.onRestart,
        })
      );

      const rEvent = new KeyboardEvent('keydown', { key: 'R' });
      window.dispatchEvent(rEvent);

      expect(mockHandlers.onRestart).toHaveBeenCalledTimes(1);
    });

    it('should call onMenu when Escape key pressed', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          enabled: true,
          onMenu: mockHandlers.onMenu,
        })
      );

      const escEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      window.dispatchEvent(escEvent);

      expect(mockHandlers.onMenu).toHaveBeenCalledTimes(1);
    });
  });

  describe('Event Prevention', () => {
    it('should prevent default for spacebar when handler provided', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          enabled: true,
          onPause: mockHandlers.onPause,
        })
      );

      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      const preventDefaultSpy = jest.spyOn(spaceEvent, 'preventDefault');
      
      window.dispatchEvent(spaceEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should prevent default for R key when handler provided', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          enabled: true,
          onRestart: mockHandlers.onRestart,
        })
      );

      const rEvent = new KeyboardEvent('keydown', { key: 'r' });
      const preventDefaultSpy = jest.spyOn(rEvent, 'preventDefault');
      
      window.dispatchEvent(rEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should prevent default for Escape key when handler provided', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          enabled: true,
          onMenu: mockHandlers.onMenu,
        })
      );

      const escEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      const preventDefaultSpy = jest.spyOn(escEvent, 'preventDefault');
      
      window.dispatchEvent(escEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Input Field Filtering', () => {
    it('should not trigger shortcuts when typing in input field', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          enabled: true,
          onPause: mockHandlers.onPause,
        })
      );

      const input = document.createElement('input');
      document.body.appendChild(input);

      // Create a proper event with the input as target
      Object.defineProperty(input, 'dispatchEvent', {
        value: function(event: Event) {
          Object.defineProperty(event, 'target', {
            value: input,
            configurable: true
          });
          return window.dispatchEvent(event);
        }
      });

      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      input.dispatchEvent(spaceEvent);

      expect(mockHandlers.onPause).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it('should not trigger shortcuts when typing in textarea', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          enabled: true,
          onRestart: mockHandlers.onRestart,
        })
      );

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      // Create a proper event with the textarea as target
      Object.defineProperty(textarea, 'dispatchEvent', {
        value: function(event: Event) {
          Object.defineProperty(event, 'target', {
            value: textarea,
            configurable: true
          });
          return window.dispatchEvent(event);
        }
      });

      const rEvent = new KeyboardEvent('keydown', { key: 'r' });
      textarea.dispatchEvent(rEvent);

      expect(mockHandlers.onRestart).not.toHaveBeenCalled();

      document.body.removeChild(textarea);
    });
  });

  describe('Browser Shortcut Protection', () => {
    it('should not trigger restart when Ctrl+R is pressed', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          enabled: true,
          onRestart: mockHandlers.onRestart,
        })
      );

      const ctrlREvent = new KeyboardEvent('keydown', { 
        key: 'r',
        ctrlKey: true 
      });
      
      window.dispatchEvent(ctrlREvent);

      expect(mockHandlers.onRestart).not.toHaveBeenCalled();
    });

    it('should not trigger restart when Cmd+R is pressed (Mac)', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          enabled: true,
          onRestart: mockHandlers.onRestart,
        })
      );

      const cmdREvent = new KeyboardEvent('keydown', { 
        key: 'r',
        metaKey: true 
      });
      
      window.dispatchEvent(cmdREvent);

      expect(mockHandlers.onRestart).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('should not trigger any shortcuts when disabled', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          enabled: false,
          ...mockHandlers,
        })
      );

      // Test all shortcuts
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(mockHandlers.onPause).not.toHaveBeenCalled();
      expect(mockHandlers.onResume).not.toHaveBeenCalled();
      expect(mockHandlers.onRestart).not.toHaveBeenCalled();
      expect(mockHandlers.onMenu).not.toHaveBeenCalled();
    });
  });

  describe('Handler Priority', () => {
    it('should prioritize onPause over onResume for spacebar', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          enabled: true,
          onPause: mockHandlers.onPause,
          onResume: mockHandlers.onResume,
        })
      );

      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      window.dispatchEvent(spaceEvent);

      expect(mockHandlers.onPause).toHaveBeenCalledTimes(1);
      expect(mockHandlers.onResume).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should clean up event listeners on unmount', () => {
      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({
          enabled: true,
          onPause: mockHandlers.onPause,
        })
      );

      // Unmount the hook
      unmount();

      // Event should not trigger after unmount
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      window.dispatchEvent(spaceEvent);

      expect(mockHandlers.onPause).not.toHaveBeenCalled();
    });

    it('should clean up event listeners when disabled', () => {
      const { rerender } = renderHook(
        ({ enabled }) =>
          useKeyboardShortcuts({
            enabled,
            onPause: mockHandlers.onPause,
          }),
        { initialProps: { enabled: true } }
      );

      // Disable the hook
      rerender({ enabled: false });

      // Event should not trigger after disabling
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      window.dispatchEvent(spaceEvent);

      expect(mockHandlers.onPause).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing handlers gracefully', () => {
      expect(() => {
        renderHook(() =>
          useKeyboardShortcuts({
            enabled: true,
          })
        );

        // Trigger events - should not throw
        window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      }).not.toThrow();
    });

    it('should handle unknown key events gracefully', () => {
      expect(() => {
        renderHook(() =>
          useKeyboardShortcuts({
            enabled: true,
            onPause: mockHandlers.onPause,
          })
        );

        // Trigger unknown key event
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }));
      }).not.toThrow();
    });
  });
});