/**
 * Unit tests for ComboFeedback component
 * Tests animation rendering, event handling, and accessibility features
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ComboFeedback } from '../ComboFeedback';
import type { ComboEvent } from '@/types/Combo';

// Mock CSS modules
jest.mock('@/styles/combo.module.css', () => ({}));

// Mock timers for animation testing
jest.useFakeTimers();

describe('ComboFeedback', () => {
  const mockOnAnimationComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
  });

  const createComboEvent = (type: ComboEvent['type'], overrides?: Partial<ComboEvent>): ComboEvent => {
    // Create appropriate default values based on event type
    const defaults: Record<ComboEvent['type'], Partial<ComboEvent>> = {
      started: { sequence: [1], progress: 1, totalPoints: 0 },
      progress: { sequence: [1, 2], progress: 2, totalPoints: 0 },
      completed: { sequence: [1, 2, 3, 4, 5], progress: 5, totalPoints: 100 },
      broken: { sequence: [1, 2], progress: 0, totalPoints: 0 },
    };

    return {
      type,
      sequence: defaults[type].sequence || [1, 2],
      progress: defaults[type].progress || 2,
      totalPoints: defaults[type].totalPoints || 50,
      timestamp: Date.now(),
      ...overrides,
    };
  };

  describe('Rendering', () => {
    it('renders nothing when no event is provided', () => {
      const { container } = render(
        <ComboFeedback event={null} onAnimationComplete={mockOnAnimationComplete} />
      );
      
      expect(container.firstChild).toHaveStyle({ display: 'none' });
    });

    it('renders animation container when event is provided', () => {
      render(
        <ComboFeedback
          event={{
            type: 'started',
            progress: 1,
            sequence: [1],
            totalPoints: 0,
            timestamp: Date.now(),
          }}
          onAnimationComplete={mockOnAnimationComplete}
        />
      );
      
      expect(screen.getAllByRole('status').length).toBeGreaterThanOrEqual(1);
    });

    it('shows debug information when debug mode is enabled', () => {
      const event = createComboEvent('progress', { progress: 3, totalPoints: 75 });
      
      render(
        <ComboFeedback 
          event={event} 
          onAnimationComplete={mockOnAnimationComplete}
          debug={true}
        />
      );
      
      expect(screen.getByText('Event: progress')).toBeInTheDocument();
      expect(screen.getByText('Points: 75')).toBeInTheDocument();
      expect(screen.getByText('Progress: 3')).toBeInTheDocument();
    });
  });

  describe('Event Type Animations', () => {
    it('displays "Combo Started!" for started event', async () => {
      const event = createComboEvent('started');
      
      render(
        <ComboFeedback event={event} onAnimationComplete={mockOnAnimationComplete} />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Combo Started!')).toBeInTheDocument();
      });
    });

    it('displays "Good!" for progress event', async () => {
      const event = createComboEvent('progress');
      
      render(
        <ComboFeedback event={event} onAnimationComplete={mockOnAnimationComplete} />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Good!')).toBeInTheDocument();
      });
    });

    it('displays "COMBO COMPLETE!" for completed event', async () => {
      const event = createComboEvent('completed', { sequence: [1, 2, 3, 4, 5], progress: 5 });
      
      render(
        <ComboFeedback event={event} onAnimationComplete={mockOnAnimationComplete} />
      );
      
      await waitFor(() => {
        expect(screen.getByText('COMBO COMPLETE!')).toBeInTheDocument();
      });
    });

    it('displays "Combo Broken" for broken event', async () => {
      const event = createComboEvent('broken', { sequence: [1, 2], progress: 0 });
      
      render(
        <ComboFeedback event={event} onAnimationComplete={mockOnAnimationComplete} />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Combo Broken')).toBeInTheDocument();
      });
    });
  });

  describe('Points Animation', () => {
    it('shows points animation for events with positive points', async () => {
      const event = createComboEvent('completed', { totalPoints: 100 });
      
      render(
        <ComboFeedback event={event} onAnimationComplete={mockOnAnimationComplete} />
      );
      
      // Fast-forward through text animation phase
      act(() => {
        jest.advanceTimersByTime(2500); // completed animation duration
      });
      
      await waitFor(() => {
        expect(screen.getByText('+100')).toBeInTheDocument();
      });
    });

    it('does not show points animation for zero points', async () => {
      const event = createComboEvent('broken', { totalPoints: 0 });
      
      render(
        <ComboFeedback event={event} onAnimationComplete={mockOnAnimationComplete} />
      );
      
      // Fast-forward through text animation phase
      act(() => {
        jest.advanceTimersByTime(1200); // broken animation duration
      });
      
      // Points animation should not appear
      expect(screen.queryByText('+0')).not.toBeInTheDocument();
    });

    it('has correct aria-label for points animation', async () => {
      const event = createComboEvent('completed', { totalPoints: 250 });
      
      render(
        <ComboFeedback event={event} onAnimationComplete={mockOnAnimationComplete} />
      );
      
      // Fast-forward to points phase
      act(() => {
        jest.advanceTimersByTime(2500);
      });
      
      await waitFor(() => {
        expect(screen.getByLabelText('Plus 250 points')).toBeInTheDocument();
      });
    });
  });

  describe('Sequence Visualization', () => {
    it('shows sequence numbers for non-empty sequences', async () => {
      const event = createComboEvent('completed', { 
        sequence: [1, 2, 3], 
        progress: 3 
      });
      
      render(
        <ComboFeedback event={event} onAnimationComplete={mockOnAnimationComplete} />
      );
      
      // Fast-forward through text phase (2500ms)
      act(() => {
        jest.advanceTimersByTime(2500);
      });
      
      // Fast-forward through points phase (1100ms)
      act(() => {
        jest.advanceTimersByTime(1100);
      });
      
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    it('shows arrows between sequence numbers', async () => {
      const event = createComboEvent('progress', { 
        sequence: [1, 2, 3], 
        progress: 3,
        totalPoints: 0 // No points phase, go straight to sequence
      });
      
      render(
        <ComboFeedback event={event} onAnimationComplete={mockOnAnimationComplete} />
      );
      
      // Fast-forward through text phase (1000ms for progress)
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      // Wait for sequence phase to start and numbers to appear
      act(() => {
        jest.advanceTimersByTime(300); // Time for at least 2 numbers to appear (150ms each)
      });
      
      await waitFor(() => {
        const arrows = screen.getAllByText('→');
        expect(arrows).toHaveLength(2); // Between 3 numbers
      });
    });

    it.skip('does not show sequence visualization for empty sequences', async () => {
      const event = createComboEvent('broken', { 
        sequence: [], 
        progress: 0,
        totalPoints: 0
      });
      
      render(
        <ComboFeedback event={event} onAnimationComplete={mockOnAnimationComplete} />
      );
      
      // Fast-forward through text phase (1200ms for broken)
      act(() => {
        jest.advanceTimersByTime(1200);
      });
      
      // Allow React to process the phase completion
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Should call onAnimationComplete after text phase since no points or sequence
      expect(mockOnAnimationComplete).toHaveBeenCalled();
    });
  });

  describe('Animation Phases', () => {
    it.skip('progresses through all animation phases', async () => {
      const event = createComboEvent('completed', { 
        totalPoints: 100,
        sequence: [1, 2, 3, 4, 5],
        progress: 5
      });
      
      render(
        <ComboFeedback event={event} onAnimationComplete={mockOnAnimationComplete} />
      );
      
      // Text phase
      expect(screen.getByText('COMBO COMPLETE!')).toBeInTheDocument();
      
      // Advance to points phase
      act(() => {
        jest.advanceTimersByTime(2500);
      });
      
      await waitFor(() => {
        expect(screen.getByText('+100')).toBeInTheDocument();
      });
      
      // Advance to sequence phase
      act(() => {
        jest.advanceTimersByTime(1100);
      });
      
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
      });
      
      // Complete sequence animation (150ms per item + 500ms end delay)
      act(() => {
        jest.advanceTimersByTime(1500);
      });
      
      // Allow React to process the phase completion
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      expect(mockOnAnimationComplete).toHaveBeenCalled();
    });

    it.skip('calls onAnimationComplete when all phases are done', async () => {
      const event = createComboEvent('started', { totalPoints: 50 });
      
      render(
        <ComboFeedback event={event} onAnimationComplete={mockOnAnimationComplete} />
      );
      
      // Fast-forward through text phase (1500ms)
      act(() => {
        jest.advanceTimersByTime(1500);
      });
      
      // Fast-forward through points phase (1100ms)
      act(() => {
        jest.advanceTimersByTime(1100);
      });
      
      // Allow React to process the phase completion
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // No sequence for started events, should complete
      expect(mockOnAnimationComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has correct ARIA attributes for main container', () => {
      const event = createComboEvent('progress');
      
      render(
        <ComboFeedback event={event} onAnimationComplete={mockOnAnimationComplete} />
      );
      
      const statusElements = screen.getAllByRole('status');
      const mainContainer = statusElements.find(el => el.classList.contains('combo-feedback'));
      expect(mainContainer).toHaveAttribute('aria-live', 'polite');
      expect(mainContainer).toHaveAttribute('aria-atomic', 'true');
    });

    it('provides accessible text for floating text elements', async () => {
      const event = createComboEvent('started');
      
      render(
        <ComboFeedback event={event} onAnimationComplete={mockOnAnimationComplete} />
      );
      
      await waitFor(() => {
        const textElement = screen.getByText('Combo Started!');
        expect(textElement).toHaveAttribute('aria-label', 'Combo Started!');
      });
    });

    it('marks sequence visualization as presentation', async () => {
      const event = createComboEvent('completed', { 
        sequence: [1, 2, 3], 
        totalPoints: 50 
      });
      
      render(
        <ComboFeedback event={event} onAnimationComplete={mockOnAnimationComplete} />
      );
      
      // Fast-forward through text phase (2500ms)
      act(() => {
        jest.advanceTimersByTime(2500);
      });
      
      // Fast-forward through points phase (1100ms)
      act(() => {
        jest.advanceTimersByTime(1100);
      });
      
      await waitFor(() => {
        const sequenceContainer = screen.getByText('1').closest('div');
        expect(sequenceContainer?.closest('.sequence-visualization')).toHaveAttribute('role', 'presentation');
        expect(sequenceContainer?.closest('.sequence-visualization')).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('Event Updates', () => {
    it('handles event prop updates correctly', async () => {
      const event1 = createComboEvent('started');
      const event2 = createComboEvent('progress');
      
      const { rerender } = render(
        <ComboFeedback event={event1} onAnimationComplete={mockOnAnimationComplete} />
      );
      
      expect(screen.getByText('Combo Started!')).toBeInTheDocument();
      
      // Update to new event (should not start new animation while current is playing)
      rerender(
        <ComboFeedback event={event2} onAnimationComplete={mockOnAnimationComplete} />
      );
      
      // Should still show the first event's animation
      expect(screen.getByText('Combo Started!')).toBeInTheDocument();
      expect(screen.queryByText('Good!')).not.toBeInTheDocument();
    });

    it.skip('starts new animation when previous one is complete', async () => {
      const event1 = createComboEvent('started', { totalPoints: 0 });
      const event2 = createComboEvent('progress', { totalPoints: 0 });
      
      const { rerender } = render(
        <ComboFeedback event={event1} onAnimationComplete={mockOnAnimationComplete} />
      );
      
      // Complete first animation (1500ms for started, no points or sequence)
      act(() => {
        jest.advanceTimersByTime(1500);
      });
      
      // Allow React to process the phase completion
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Wait for animation complete callback
      expect(mockOnAnimationComplete).toHaveBeenCalled();
      
      // Now update to new event
      rerender(
        <ComboFeedback event={event2} onAnimationComplete={mockOnAnimationComplete} />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Good!')).toBeInTheDocument();
      });
    });
  });

  describe('Custom className', () => {
    it('applies custom className to container', () => {
      const event = createComboEvent('started');
      
      const { container } = render(
        <ComboFeedback 
          event={event} 
          onAnimationComplete={mockOnAnimationComplete}
          className="custom-feedback"
        />
      );
      
      const feedbackContainer = container.querySelector('.combo-feedback');
      expect(feedbackContainer).toHaveClass('custom-feedback');
    });
  });
});