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

  const createComboEvent = (type: ComboEvent['type'], overrides?: Partial<ComboEvent>): ComboEvent => ({
    type,
    sequence: [1, 2],
    progress: 2,
    totalPoints: 50,
    timestamp: Date.now(),
    ...overrides,
  });

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
      
      // Fast-forward through text and points phases
      act(() => {
        jest.advanceTimersByTime(2500 + 1100); // text + points duration
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
        progress: 3 
      });
      
      render(
        <ComboFeedback event={event} onAnimationComplete={mockOnAnimationComplete} />
      );
      
      // Fast-forward to sequence phase
      act(() => {
        jest.advanceTimersByTime(1000 + 1100);
      });
      
      await waitFor(() => {
        const arrows = screen.getAllByText('→');
        expect(arrows).toHaveLength(2); // Between 3 numbers
      });
    });

    it('does not show sequence visualization for empty sequences', async () => {
      const event = createComboEvent('broken', { 
        sequence: [], 
        progress: 0 
      });
      
      render(
        <ComboFeedback event={event} onAnimationComplete={mockOnAnimationComplete} />
      );
      
      // Fast-forward through all animation phases
      act(() => {
        jest.advanceTimersByTime(100); // Enter phase
      });
      
      act(() => {
        jest.advanceTimersByTime(500); // Hold phase  
      });
      
      act(() => {
        jest.advanceTimersByTime(1000); // Exit phase
      });
      
      act(() => {
        jest.advanceTimersByTime(1000); // Complete phase
      });
      
      // Should call onAnimationComplete without showing sequence
      expect(mockOnAnimationComplete).toHaveBeenCalled();
    });
  });

  describe('Animation Phases', () => {
    it('progresses through all animation phases', async () => {
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
      
      // Complete sequence animation
      act(() => {
        jest.advanceTimersByTime(2000); // Estimate for sequence animation
      });
      
      expect(mockOnAnimationComplete).toHaveBeenCalled();
    });

    it('calls onAnimationComplete when all phases are done', async () => {
      const event = createComboEvent('started');
      
      render(
        <ComboFeedback event={event} onAnimationComplete={mockOnAnimationComplete} />
      );
      
      // Fast-forward through all phases
      act(() => {
        jest.advanceTimersByTime(10000); // More than enough time
      });
      
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
      
      // Fast-forward to sequence phase
      act(() => {
        jest.advanceTimersByTime(2500 + 1100);
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

    it('starts new animation when previous one is complete', async () => {
      const event1 = createComboEvent('started');
      const event2 = createComboEvent('progress');
      
      const { rerender } = render(
        <ComboFeedback event={event1} onAnimationComplete={mockOnAnimationComplete} />
      );
      
      // Complete first animation
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      
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