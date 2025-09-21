/**
 * Unit tests for ComboProgressIndicator component
 * Tests progress visualization, state mapping, and accessibility features
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ComboProgressIndicator, useComboProgressProps } from '../ComboProgressIndicator';
import type { ComboState } from '../../types/Combo';

// Mock CSS modules
jest.mock('@/styles/combo.module.css', () => ({}));

describe('ComboProgressIndicator', () => {
  const defaultProps = {
    currentProgress: 0 as const,
    expectedNext: 1 as const,
    totalCombos: 0,
    isActive: false,
  };

  describe('Rendering', () => {
    it('renders progress indicator with default props', () => {
      render(<ComboProgressIndicator {...defaultProps} />);
      
      expect(screen.getByRole('group', { name: /combo progress indicator/i })).toBeInTheDocument();
      expect(screen.getByRole('progressbar', { name: /combo progress/i })).toBeInTheDocument();
    });

    it('renders all sequence steps (1-5)', () => {
      render(<ComboProgressIndicator {...defaultProps} />);
      
      // Check that all 5 steps are rendered
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('renders arrows between steps', () => {
      render(<ComboProgressIndicator {...defaultProps} />);
      
      // Should have 4 arrows (between 5 steps)
      const arrows = screen.getAllByText('→');
      expect(arrows).toHaveLength(4);
    });

    it('displays correct status when inactive', () => {
      render(<ComboProgressIndicator {...defaultProps} totalCombos={5} />);
      
      expect(screen.getByText('5 combos')).toBeInTheDocument();
      expect(screen.getByText('Start: 1')).toBeInTheDocument();
    });

    it('displays correct status when active', () => {
      render(
        <ComboProgressIndicator 
          {...defaultProps} 
          currentProgress={2}
          expectedNext={3}
          isActive={true}
        />
      );
      
      expect(screen.getByText('Next: 3')).toBeInTheDocument();
      expect(screen.getByText('2/5')).toBeInTheDocument();
    });
  });

  describe('Progress States', () => {
    it('shows completed steps correctly', () => {
      render(
        <ComboProgressIndicator 
          {...defaultProps} 
          currentProgress={2}
          expectedNext={3}
          isActive={true}
        />
      );
      
      const step1 = screen.getByText('1').closest('div');
      const step2 = screen.getByText('2').closest('div');
      const step3 = screen.getByText('3').closest('div');
      
      expect(step1).toHaveAttribute('aria-valuenow', '100'); // completed
      expect(step2).toHaveAttribute('aria-valuenow', '100'); // completed
      expect(step3).toHaveAttribute('aria-valuenow', '50');  // current
    });

    it('shows current step with correct styling', () => {
      render(
        <ComboProgressIndicator 
          {...defaultProps} 
          currentProgress={1}
          expectedNext={2}
          isActive={true}
        />
      );
      
      const currentStep = screen.getByText('2').closest('div');
      expect(currentStep).toHaveAttribute('aria-valuenow', '50');
    });

    it('shows pending steps correctly', () => {
      render(
        <ComboProgressIndicator 
          {...defaultProps} 
          currentProgress={1}
          expectedNext={2}
          isActive={true}
        />
      );
      
      const step4 = screen.getByText('4').closest('div');
      const step5 = screen.getByText('5').closest('div');
      
      expect(step4).toHaveAttribute('aria-valuenow', '0'); // pending
      expect(step5).toHaveAttribute('aria-valuenow', '0'); // pending
    });
  });

  describe('Accessibility', () => {
    it('has correct ARIA attributes', () => {
      render(<ComboProgressIndicator {...defaultProps} currentProgress={2} />);
      
      const progressBar = screen.getByRole('progressbar', { name: /combo progress/i });
      expect(progressBar).toHaveAttribute('aria-valuenow', '40'); // 2/5 * 100
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('has step-level ARIA attributes', () => {
      render(<ComboProgressIndicator {...defaultProps} currentProgress={1} isActive={true} />);
      
      const steps = screen.getAllByRole('progressbar');
      steps.forEach((step) => {
        expect(step).toHaveAttribute('aria-valuemin', '0');
        expect(step).toHaveAttribute('aria-valuemax', '100');
        expect(step).toHaveAttribute('aria-label');
      });
    });

    it('provides descriptive labels for screen readers', () => {
      render(<ComboProgressIndicator {...defaultProps} currentProgress={2} />);
      
      expect(screen.getByLabelText(/Step 1: completed/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Step 2: completed/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Step 3: pending/i)).toBeInTheDocument();
    });
  });

  describe('Visual States', () => {
    it('applies active styling when isActive is true', () => {
      const { container } = render(
        <ComboProgressIndicator {...defaultProps} isActive={true} />
      );
      
      const indicator = container.querySelector('.combo-progress-indicator');
      expect(indicator).toHaveStyle({
        background: 'rgba(33, 150, 243, 0.15)',
        borderColor: 'rgba(33, 150, 243, 0.4)',
      });
    });

    it('applies inactive styling when isActive is false', () => {
      const { container } = render(
        <ComboProgressIndicator {...defaultProps} isActive={false} />
      );
      
      const indicator = container.querySelector('.combo-progress-indicator');
      expect(indicator).toHaveStyle({
        background: 'rgba(0, 0, 0, 0.6)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
      });
    });

    it('shows colored arrows for completed sequence', () => {
      render(
        <ComboProgressIndicator 
          {...defaultProps} 
          currentProgress={3}
          isActive={true}
        />
      );
      
      const arrows = screen.getAllByText('→');
      // Arrows before completed steps should be colored (index < currentProgress)
      expect(arrows[0]).toHaveStyle({ color: '#4caf50' }); // index 0 < 3
      expect(arrows[1]).toHaveStyle({ color: '#4caf50' }); // index 1 < 3
      expect(arrows[2]).toHaveStyle({ color: '#4caf50' }); // index 2 < 3
      // Arrow after current progress should be gray
      expect(arrows[3]).toHaveStyle({ color: '#666' }); // index 3 >= 3
    });
  });

  describe('Props Validation', () => {
    it('handles edge case of completed combo (progress = 5)', () => {
      render(
        <ComboProgressIndicator 
          {...defaultProps} 
          currentProgress={5}
          expectedNext={1}
          isActive={false}
          totalCombos={1}
        />
      );
      
      expect(screen.getByText('1 combos')).toBeInTheDocument();
      
      // All steps should be completed
      const steps = screen.getAllByRole('progressbar');
      const stepProgressBars = steps.filter(step => 
        step.getAttribute('aria-label')?.includes('Step')
      );
      stepProgressBars.forEach(step => {
        expect(step).toHaveAttribute('aria-valuenow', '100');
      });
    });

    it('handles progress = 0 correctly', () => {
      render(<ComboProgressIndicator {...defaultProps} />);
      
      const mainProgressBar = screen.getByRole('progressbar', { name: /combo progress/i });
      expect(mainProgressBar).toHaveAttribute('aria-valuenow', '0');
    });
  });

  describe('Custom className', () => {
    it('applies custom className', () => {
      const { container } = render(
        <ComboProgressIndicator {...defaultProps} className="custom-class" />
      );
      
      const indicator = container.querySelector('.combo-progress-indicator');
      expect(indicator).toHaveClass('custom-class');
    });
  });
});

describe('useComboProgressProps hook', () => {
  // Test helper to render hook
  const TestComponent: React.FC<{ comboState: ComboState }> = ({ comboState }) => {
    const props = useComboProgressProps(comboState);
    return <ComboProgressIndicator {...props} />;
  };

  it('converts ComboState to correct props', () => {
    const comboState: ComboState = {
      currentSequence: [1, 2],
      expectedNext: 3,
      comboProgress: 2,
      totalCombos: 1,
      isComboActive: true,
    };

    render(<TestComponent comboState={comboState} />);
    
    expect(screen.getByText('Next: 3')).toBeInTheDocument();
    expect(screen.getByText('2/5')).toBeInTheDocument();
  });

  it('handles inactive combo state', () => {
    const comboState: ComboState = {
      currentSequence: [],
      expectedNext: 1,
      comboProgress: 0,
      totalCombos: 5,
      isComboActive: false,
    };

    render(<TestComponent comboState={comboState} />);
    
    expect(screen.getByText('5 combos')).toBeInTheDocument();
    expect(screen.getByText('Start: 1')).toBeInTheDocument();
  });

  it('handles completed combo state', () => {
    const comboState: ComboState = {
      currentSequence: [1, 2, 3, 4, 5],
      expectedNext: 1,
      comboProgress: 5,
      totalCombos: 1,
      isComboActive: false,
    };

    render(<TestComponent comboState={comboState} />);
    
    const mainProgressBar = screen.getByRole('progressbar', { name: /combo progress/i });
    expect(mainProgressBar).toHaveAttribute('aria-valuenow', '100');
  });
});