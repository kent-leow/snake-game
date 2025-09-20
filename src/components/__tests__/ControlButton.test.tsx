/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ControlButton } from '../game/ControlButton';

describe('ControlButton', () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should render with basic text', () => {
      render(<ControlButton onClick={mockOnClick}>Test Button</ControlButton>);
      
      expect(screen.getByRole('button', { name: /test button/i })).toBeInTheDocument();
    });

    it('should call onClick when clicked', () => {
      render(<ControlButton onClick={mockOnClick}>Test Button</ControlButton>);
      
      fireEvent.click(screen.getByRole('button'));
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', () => {
      render(
        <ControlButton onClick={mockOnClick} disabled>
          Test Button
        </ControlButton>
      );
      
      fireEvent.click(screen.getByRole('button'));
      
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('Visual Elements', () => {
    it('should render with icon when provided', () => {
      render(
        <ControlButton onClick={mockOnClick} icon="🎮">
          Test Button
        </ControlButton>
      );
      
      expect(screen.getByText('🎮')).toBeInTheDocument();
    });

    it('should render with shortcut when provided', () => {
      render(
        <ControlButton onClick={mockOnClick} shortcut="Space">
          Test Button
        </ControlButton>
      );
      
      expect(screen.getByText('Space')).toBeInTheDocument();
    });

    it('should include shortcut in aria-label', () => {
      render(
        <ControlButton onClick={mockOnClick} shortcut="Space">
          Pause
        </ControlButton>
      );
      
      expect(screen.getByLabelText('Pause (Space)')).toBeInTheDocument();
    });
  });

  describe('Variants and Sizes', () => {
    it('should apply primary variant class', () => {
      render(
        <ControlButton onClick={mockOnClick} variant="primary">
          Primary Button
        </ControlButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('control-button--primary');
    });

    it('should apply secondary variant class', () => {
      render(
        <ControlButton onClick={mockOnClick} variant="secondary">
          Secondary Button
        </ControlButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('control-button--secondary');
    });

    it('should apply outline variant class', () => {
      render(
        <ControlButton onClick={mockOnClick} variant="outline">
          Outline Button
        </ControlButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('control-button--outline');
    });

    it('should apply large size class', () => {
      render(
        <ControlButton onClick={mockOnClick} size="large">
          Large Button
        </ControlButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('control-button--large');
    });

    it('should apply small size class', () => {
      render(
        <ControlButton onClick={mockOnClick} size="small">
          Small Button
        </ControlButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('control-button--small');
    });
  });

  describe('Keyboard Interaction', () => {
    it('should handle Enter key press', () => {
      render(<ControlButton onClick={mockOnClick}>Test Button</ControlButton>);
      
      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter' });
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should handle Space key press', () => {
      render(<ControlButton onClick={mockOnClick}>Test Button</ControlButton>);
      
      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: ' ' });
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should not handle other key presses', () => {
      render(<ControlButton onClick={mockOnClick}>Test Button</ControlButton>);
      
      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'a' });
      
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('should not handle key presses when disabled', () => {
      render(
        <ControlButton onClick={mockOnClick} disabled>
          Test Button
        </ControlButton>
      );
      
      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter' });
      
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('Visual Feedback', () => {
    it('should apply pressed class temporarily when clicked', async () => {
      jest.useFakeTimers();
      
      render(<ControlButton onClick={mockOnClick}>Test Button</ControlButton>);
      
      const button = screen.getByRole('button');
      
      // Click the button - this should set pressed state
      act(() => {
        fireEvent.click(button);
      });
      
      // Should have pressed class immediately after click
      expect(button).toHaveClass('control-button--pressed');
      
      // Fast forward past the 150ms timeout
      act(() => {
        jest.advanceTimersByTime(151);
      });
      
      // After timeout, pressed class should be removed
      expect(button).not.toHaveClass('control-button--pressed');
      
      jest.useRealTimers();
    });

    it('should apply disabled class when disabled', () => {
      render(
        <ControlButton onClick={mockOnClick} disabled>
          Test Button
        </ControlButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('control-button--disabled');
      expect(button).toBeDisabled();
    });
  });

  describe('Custom Props', () => {
    it('should apply custom className', () => {
      render(
        <ControlButton onClick={mockOnClick} className="custom-class">
          Test Button
        </ControlButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should render all content elements when all props provided', () => {
      render(
        <ControlButton
          onClick={mockOnClick}
          icon="🎮"
          shortcut="Space"
          variant="primary"
          size="large"
          className="custom"
        >
          Full Button
        </ControlButton>
      );
      
      expect(screen.getByText('🎮')).toBeInTheDocument();
      expect(screen.getByText('Full Button')).toBeInTheDocument();
      expect(screen.getByText('Space')).toBeInTheDocument();
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('control-button--primary');
      expect(button).toHaveClass('control-button--large');
      expect(button).toHaveClass('custom');
    });
  });
});