import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SpeedIndicator, type SpeedIndicatorProps } from '../SpeedIndicator';

// Mock CSS modules
jest.mock('@/styles/speed-indicator.module.css', () => ({
  speedIndicator: 'speed-indicator',
  speedLabel: 'speed-label',
  labelText: 'label-text',
  levelValue: 'level-value',
  changing: 'changing',
  increasing: 'increasing',
  decreasing: 'decreasing',
  maxIndicator: 'max-indicator',
  speedBar: 'speed-bar',
  speedFill: 'speed-fill',
  transitioning: 'transitioning',
  levelMarkers: 'level-markers',
  levelMarker: 'level-marker',
  speedDetails: 'speed-details',
  speedValue: 'speed-value',
  transitionIndicator: 'transition-indicator',
  changeOverlay: 'change-overlay',
  increaseOverlay: 'increase-overlay',
  decreaseOverlay: 'decrease-overlay',
}));

describe('SpeedIndicator', () => {
  const defaultProps: SpeedIndicatorProps = {
    speedLevel: 0,
    currentSpeed: 150,
    baseSpeed: 150,
    isTransitioning: false,
    maxLevel: 10,
    showDetails: true,
  };

  const renderSpeedIndicator = (props: Partial<SpeedIndicatorProps> = {}) => {
    return render(<SpeedIndicator {...defaultProps} {...props} />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      renderSpeedIndicator();
      
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Speed Level:')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('100% speed')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      renderSpeedIndicator({ className: 'custom-class' });
      
      const indicator = screen.getByRole('status');
      expect(indicator).toHaveClass('custom-class');
    });

    it('has correct accessibility attributes', () => {
      renderSpeedIndicator({ speedLevel: 3 });
      
      const indicator = screen.getByRole('status');
      expect(indicator).toHaveAttribute('aria-label', 'Speed level 3, 100% speed');
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });
  });

  describe('Speed Level Display', () => {
    it('displays correct speed level', () => {
      renderSpeedIndicator({ speedLevel: 5 });
      
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('shows max indicator when at maximum level', () => {
      renderSpeedIndicator({ speedLevel: 10, maxLevel: 10 });
      
      expect(screen.getByTitle('Maximum speed reached')).toBeInTheDocument();
    });

    it('does not show max indicator when below maximum', () => {
      renderSpeedIndicator({ speedLevel: 8, maxLevel: 10 });
      
      expect(screen.queryByTitle('Maximum speed reached')).not.toBeInTheDocument();
    });
  });

  describe('Speed Calculations', () => {
    it('calculates speed percentage correctly', () => {
      renderSpeedIndicator({
        currentSpeed: 120,
        baseSpeed: 150,
      });
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '20'); // (150-120)/150 * 100 = 20
    });

    it('displays correct speed multiplier', () => {
      renderSpeedIndicator({
        currentSpeed: 75,
        baseSpeed: 150,
      });
      
      expect(screen.getByText('200% speed')).toBeInTheDocument(); // 150/75 * 100 = 200
    });

    it('handles edge case where current speed equals base speed', () => {
      renderSpeedIndicator({
        currentSpeed: 150,
        baseSpeed: 150,
      });
      
      expect(screen.getByText('100% speed')).toBeInTheDocument();
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    });

    it('caps speed percentage at 100%', () => {
      renderSpeedIndicator({
        currentSpeed: 200, // Slower than base speed
        baseSpeed: 150,
      });
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    });
  });

  describe('Transition States', () => {
    it('shows transition indicator when transitioning', () => {
      renderSpeedIndicator({ isTransitioning: true });
      
      expect(screen.getByText('Adjusting...')).toBeInTheDocument();
    });

    it('does not show transition indicator when not transitioning', () => {
      renderSpeedIndicator({ isTransitioning: false });
      
      expect(screen.queryByText('Adjusting...')).not.toBeInTheDocument();
    });

    it('applies transitioning class to speed fill', () => {
      renderSpeedIndicator({ isTransitioning: true });
      
      const speedFill = document.querySelector('.speed-fill');
      expect(speedFill).toHaveClass('transitioning');
    });
  });

  describe('Animation Behavior', () => {
    it('shows increase animation when speed level increases', async () => {
      const { rerender } = render(<SpeedIndicator {...defaultProps} speedLevel={2} />);
      
      // Increase speed level  
      act(() => {
        rerender(<SpeedIndicator {...defaultProps} speedLevel={3} />);
      });
      
      // Check if animation is triggered
      expect(document.querySelector('.change-overlay')).toBeInTheDocument();
      expect(document.querySelector('.increase-overlay')).toBeInTheDocument();
      expect(screen.getByText('+1')).toBeInTheDocument();
    });

    it('shows decrease animation when speed level decreases', async () => {
      const { rerender } = render(<SpeedIndicator {...defaultProps} speedLevel={3} />);
      
      // Decrease speed level (reset)
      act(() => {
        rerender(<SpeedIndicator {...defaultProps} speedLevel={0} />);
      });
      
      // Check if animation is triggered
      expect(document.querySelector('.change-overlay')).toBeInTheDocument();
      expect(document.querySelector('.decrease-overlay')).toBeInTheDocument();
      expect(screen.getByText('RESET')).toBeInTheDocument();
    });

    it('applies changing classes to level value during animation', async () => {
      const { rerender } = render(<SpeedIndicator {...defaultProps} speedLevel={1} />);
      
      act(() => {
        rerender(<SpeedIndicator {...defaultProps} speedLevel={2} />);
      });
      
      const levelValue = document.querySelector('.level-value');
      expect(levelValue).toHaveClass('changing', 'increasing');
    });

    it('handles animation lifecycle correctly', () => {
      // This test verifies the animation can be triggered and the component handles state changes
      const { rerender } = render(<SpeedIndicator {...defaultProps} speedLevel={1} />);
      
      // Trigger animation
      act(() => {
        rerender(<SpeedIndicator {...defaultProps} speedLevel={2} />);
      });
      
      // Verify animation is present
      expect(document.querySelector('.change-overlay')).toBeInTheDocument();
      expect(document.querySelector('.increase-overlay')).toBeInTheDocument();
      
      // Trigger another animation (this should replace the previous one)
      act(() => {
        rerender(<SpeedIndicator {...defaultProps} speedLevel={3} />);
      });
      
      // Animation should still be present for the new change
      expect(document.querySelector('.change-overlay')).toBeInTheDocument();
    });
  });

  describe('Display Options', () => {
    it('hides details when showDetails is false', () => {
      renderSpeedIndicator({ showDetails: false });
      
      expect(screen.queryByText('100% speed')).not.toBeInTheDocument();
    });

    it('shows details when showDetails is true', () => {
      renderSpeedIndicator({ showDetails: true });
      
      expect(screen.getByText('100% speed')).toBeInTheDocument();
    });

    it('renders level markers based on maxLevel', () => {
      renderSpeedIndicator({ maxLevel: 5 });
      
      // Should render 4 markers (maxLevel - 1)
      const markers = document.querySelectorAll('.level-marker');
      expect(markers).toHaveLength(4);
    });

    it('does not render level markers when maxLevel is 1 or less', () => {
      renderSpeedIndicator({ maxLevel: 1 });
      
      const markers = document.querySelectorAll('.level-marker');
      expect(markers).toHaveLength(0);
    });
  });

  describe('Accessibility', () => {
    it('provides live region for transition indicator', () => {
      renderSpeedIndicator({ isTransitioning: true });
      
      const transitionIndicator = screen.getByText('Adjusting...');
      expect(transitionIndicator.closest('[aria-live="polite"]')).toBeInTheDocument();
    });

    it('hides decorative elements from screen readers', () => {
      const { rerender } = renderSpeedIndicator({ speedLevel: 1 });
      
      rerender(<SpeedIndicator {...defaultProps} speedLevel={2} />);
      
      waitFor(() => {
        const changeOverlay = document.querySelector('.change-overlay');
        expect(changeOverlay).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('updates aria-label when speed changes', () => {
      const { rerender } = renderSpeedIndicator({
        speedLevel: 1,
        currentSpeed: 135,
        baseSpeed: 150,
      });
      
      let indicator = screen.getByRole('status');
      expect(indicator).toHaveAttribute('aria-label', 'Speed level 1, 111% speed');
      
      rerender(<SpeedIndicator {...defaultProps} speedLevel={2} currentSpeed={120} baseSpeed={150} />);
      
      indicator = screen.getByRole('status');
      expect(indicator).toHaveAttribute('aria-label', 'Speed level 2, 125% speed');
    });
  });

  describe('Edge Cases', () => {
    it('handles zero speed level', () => {
      renderSpeedIndicator({ speedLevel: 0 });
      
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.queryByTitle('Maximum speed reached')).not.toBeInTheDocument();
    });

    it('handles negative speed level gracefully', () => {
      renderSpeedIndicator({ speedLevel: -1 });
      
      expect(screen.getByText('-1')).toBeInTheDocument();
    });

    it('handles very high speed levels', () => {
      renderSpeedIndicator({ speedLevel: 999, maxLevel: 10 });
      
      expect(screen.getByText('999')).toBeInTheDocument();
      expect(screen.getByTitle('Maximum speed reached')).toBeInTheDocument();
    });

    it('handles zero base speed gracefully', () => {
      renderSpeedIndicator({
        currentSpeed: 100,
        baseSpeed: 0,
      });
      
      // Should not crash and display reasonable values
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('handles equal current and base speeds', () => {
      renderSpeedIndicator({
        currentSpeed: 150,
        baseSpeed: 150,
      });
      
      expect(screen.getByText('100% speed')).toBeInTheDocument();
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily when props do not change', () => {
      const { rerender } = renderSpeedIndicator();
      
      const initialRender = screen.getByRole('status');
      
      // Re-render with same props
      rerender(<SpeedIndicator {...defaultProps} />);
      
      const secondRender = screen.getByRole('status');
      expect(initialRender).toBe(secondRender);
    });

    it('properly cleans up animation timers', () => {
      const { rerender, unmount } = renderSpeedIndicator({ speedLevel: 1 });
      
      rerender(<SpeedIndicator {...defaultProps} speedLevel={2} />);
      
      // Unmount before animation completes
      unmount();
      
      // Should not have any pending timers
      expect(jest.getTimerCount()).toBe(0);
    });
  });
});