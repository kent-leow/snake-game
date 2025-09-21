import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GameOverModal } from '../game/GameOverModal';
import type { GameStatistics } from '../../lib/game/gameOverState';

describe('GameOverModal', () => {
  const mockOnRestart = jest.fn();
  const mockOnMainMenu = jest.fn();

  const defaultProps = {
    isVisible: true,
    finalScore: 1000,
    cause: 'boundary' as const,
    onRestart: mockOnRestart,
    onMainMenu: mockOnMainMenu,
  };

  const mockGameStats: GameStatistics = {
    duration: 120, // 2 minutes
    foodConsumed: 15,
    maxSnakeLength: 20,
    averageSpeed: 2.5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when not visible', () => {
      render(<GameOverModal {...defaultProps} isVisible={false} />);
      
      expect(screen.queryByText('Game Over!')).not.toBeInTheDocument();
    });

    it('should render when visible', () => {
      render(<GameOverModal {...defaultProps} />);
      
      expect(screen.getByText('Game Over!')).toBeInTheDocument();
      expect(screen.getByText('You hit the wall!')).toBeInTheDocument();
      expect(screen.getByText('1,000')).toBeInTheDocument();
      expect(screen.getByText('Play Again')).toBeInTheDocument();
      expect(screen.getByText('Main Menu')).toBeInTheDocument();
    });

    it('should display correct cause message for boundary collision', () => {
      render(<GameOverModal {...defaultProps} cause="boundary" />);
      
      expect(screen.getByText('You hit the wall!')).toBeInTheDocument();
    });

    it('should display correct cause message for self collision', () => {
      render(<GameOverModal {...defaultProps} cause="self" />);
      
      expect(screen.getByText('You hit yourself!')).toBeInTheDocument();
    });

    it('should display default message for null cause', () => {
      render(<GameOverModal {...defaultProps} cause={null} />);
      
      // Check the specific title element
      expect(screen.getByRole('heading', { name: 'Game Over!' })).toBeInTheDocument();
    });

    it('should format score with thousands separator', () => {
      render(<GameOverModal {...defaultProps} finalScore={123456} />);
      
      expect(screen.getByText('123,456')).toBeInTheDocument();
    });
  });

  describe('Game Statistics', () => {
    it('should not render stats section when gameStats is undefined', () => {
      render(<GameOverModal {...defaultProps} />);
      
      expect(screen.queryByText('Duration')).not.toBeInTheDocument();
      expect(screen.queryByText('Food Eaten')).not.toBeInTheDocument();
      expect(screen.queryByText('Max Length')).not.toBeInTheDocument();
    });

    it('should render game statistics when provided', () => {
      render(<GameOverModal {...defaultProps} gameStats={mockGameStats} />);
      
      expect(screen.getByText('Duration')).toBeInTheDocument();
      expect(screen.getByText('2:00')).toBeInTheDocument(); // 120 seconds = 2:00
      expect(screen.getByText('Food Eaten')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('Max Length')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
    });

    it('should format duration correctly for various times', () => {
      const { rerender } = render(
        <GameOverModal {...defaultProps} gameStats={{ ...mockGameStats, duration: 65 }} />
      );
      expect(screen.getByText('1:05')).toBeInTheDocument(); // 65 seconds = 1:05

      rerender(
        <GameOverModal {...defaultProps} gameStats={{ ...mockGameStats, duration: 5 }} />
      );
      expect(screen.getByText('0:05')).toBeInTheDocument(); // 5 seconds = 0:05
    });
  });

  describe('User Interactions', () => {
    it('should call onRestart when Play Again button is clicked', async () => {
      render(<GameOverModal {...defaultProps} />);
      
      const playAgainButton = screen.getByText('Play Again');
      fireEvent.click(playAgainButton);
      
      // Wait for the animation delay
      await waitFor(() => {
        expect(mockOnRestart).toHaveBeenCalledTimes(1);
      }, { timeout: 200 });
    });

    it('should call onMainMenu when Main Menu button is clicked', async () => {
      render(<GameOverModal {...defaultProps} />);
      
      const mainMenuButton = screen.getByText('Main Menu');
      fireEvent.click(mainMenuButton);
      
      // Wait for the animation delay
      await waitFor(() => {
        expect(mockOnMainMenu).toHaveBeenCalledTimes(1);
      }, { timeout: 200 });
    });

    it('should have Play Again button focused by default', () => {
      render(<GameOverModal {...defaultProps} />);
      
      const playAgainButton = screen.getByText('Play Again');
      expect(playAgainButton).toHaveFocus();
    });
  });

  describe('Styling and Animation', () => {
    it('should apply animate-in class when visible', () => {
      render(<GameOverModal {...defaultProps} />);
      
      const overlay = document.querySelector('.game-over-overlay');
      expect(overlay).toHaveClass('animate-in');
    });

    it('should apply custom className when provided', () => {
      const customClass = 'custom-modal-class';
      render(<GameOverModal {...defaultProps} className={customClass} />);
      
      const modal = document.querySelector('.game-over-modal');
      expect(modal).toHaveClass(customClass);
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles and focus management', () => {
      render(<GameOverModal {...defaultProps} />);
      
      const playAgainButton = screen.getByRole('button', { name: /play again/i });
      const mainMenuButton = screen.getByRole('button', { name: /main menu/i });
      
      expect(playAgainButton).toBeInTheDocument();
      expect(mainMenuButton).toBeInTheDocument();
      expect(playAgainButton).toHaveFocus();
    });

    it('should have appropriate text content for screen readers', () => {
      render(<GameOverModal {...defaultProps} gameStats={mockGameStats} />);
      
      expect(screen.getByText('Final Score')).toBeInTheDocument();
      expect(screen.getByText('Duration')).toBeInTheDocument();
      expect(screen.getByText('Food Eaten')).toBeInTheDocument();
      expect(screen.getByText('Max Length')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero score', () => {
      render(<GameOverModal {...defaultProps} finalScore={0} />);
      
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle very large scores', () => {
      render(<GameOverModal {...defaultProps} finalScore={999999999} />);
      
      expect(screen.getByText('999,999,999')).toBeInTheDocument();
    });

    it('should handle game stats with zero values', () => {
      const zeroStats: GameStatistics = {
        duration: 0,
        foodConsumed: 0,
        maxSnakeLength: 1,
        averageSpeed: 0,
      };
      
      render(<GameOverModal {...defaultProps} gameStats={zeroStats} />);
      
      expect(screen.getByText('0:00')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });
});