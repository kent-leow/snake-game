import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ScoreDisplay, CompactScoreDisplay } from '../game/ScoreDisplay';

// Mock the canvas utilities since they're not needed for component testing
jest.mock('@/lib/utils/canvas', () => ({
  clearCanvas: jest.fn(),
  drawGrid: jest.fn(),
  drawSnakeSegment: jest.fn(),
  drawBorder: jest.fn(),
}));

describe('ScoreDisplay', () => {
  describe('Basic Rendering', () => {
    it('should render score display with default props', () => {
      render(<ScoreDisplay score={1234} />);
      
      expect(screen.getByText('SCORE')).toBeInTheDocument();
      expect(screen.getByText('1,234')).toBeInTheDocument();
    });

    it('should format large scores with commas', () => {
      render(<ScoreDisplay score={1234567} />);
      
      expect(screen.getByText('1,234,567')).toBeInTheDocument();
    });

    it('should render zero score', () => {
      render(<ScoreDisplay score={0} />);
      
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <ScoreDisplay score={100} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Size Variants', () => {
    it('should apply small size classes', () => {
      const { container } = render(<ScoreDisplay score={100} size="small" />);
      
      expect(container.firstChild).toHaveClass('text-lg');
    });

    it('should apply medium size classes (default)', () => {
      const { container } = render(<ScoreDisplay score={100} size="medium" />);
      
      expect(container.firstChild).toHaveClass('text-2xl');
    });

    it('should apply large size classes', () => {
      const { container } = render(<ScoreDisplay score={100} size="large" />);
      
      expect(container.firstChild).toHaveClass('text-4xl');
    });
  });

  describe('Theme Variants', () => {
    it('should apply game theme classes (default)', () => {
      const { container } = render(<ScoreDisplay score={100} theme="game" />);
      
      expect(container.firstChild).toHaveClass('text-green-400', 'bg-gray-900', 'border-green-500');
    });

    it('should apply light theme classes', () => {
      const { container } = render(<ScoreDisplay score={100} theme="light" />);
      
      expect(container.firstChild).toHaveClass('text-gray-800', 'bg-white', 'border-gray-300');
    });

    it('should apply dark theme classes', () => {
      const { container } = render(<ScoreDisplay score={100} theme="dark" />);
      
      expect(container.firstChild).toHaveClass('text-white', 'bg-gray-800', 'border-gray-600');
    });
  });

  describe('Score Animation', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should animate score changes when showAnimation is true', async () => {
      const { rerender } = render(
        <ScoreDisplay score={100} showAnimation={true} />
      );
      
      // Initial score should be displayed
      expect(screen.getByText('100')).toBeInTheDocument();

      // Change score
      rerender(<ScoreDisplay score={200} showAnimation={true} />);

      // Should start animation
      const scoreElement = screen.getByText(/\d+/);
      expect(scoreElement.closest('.score-display')).toHaveClass('scale-105');
    });

    it('should not animate when showAnimation is false', () => {
      const { rerender } = render(
        <ScoreDisplay score={100} showAnimation={false} />
      );
      
      expect(screen.getByText('100')).toBeInTheDocument();

      rerender(<ScoreDisplay score={200} showAnimation={false} />);
      
      // Should immediately show new score
      expect(screen.getByText('200')).toBeInTheDocument();
    });

    it('should apply animation classes during score change', async () => {
      const { rerender } = render(
        <ScoreDisplay score={100} showAnimation={true} />
      );

      rerender(<ScoreDisplay score={150} showAnimation={true} />);

      // Check for animation classes
      const displayElement = screen.getByText(/\d+/).closest('.score-display');
      expect(displayElement).toHaveClass('scale-105');

      // Wait for animation to complete
      jest.advanceTimersByTime(500);
      
      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should be accessible with proper structure', () => {
      render(<ScoreDisplay score={1234} />);
      
      const scoreLabel = screen.getByText('SCORE');
      const scoreValue = screen.getByText('1,234');
      
      expect(scoreLabel).toBeInTheDocument();
      expect(scoreValue).toBeInTheDocument();
    });
  });
});

describe('CompactScoreDisplay', () => {
  describe('Basic Rendering', () => {
    it('should render compact score display', () => {
      render(<CompactScoreDisplay score={1234} />);
      
      expect(screen.getByText('SCORE:')).toBeInTheDocument();
      expect(screen.getByText('1,234')).toBeInTheDocument();
    });

    it('should format scores with commas', () => {
      render(<CompactScoreDisplay score={999999} />);
      
      expect(screen.getByText('999,999')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <CompactScoreDisplay score={100} className="test-class" />
      );
      
      expect(container.firstChild).toHaveClass('test-class');
    });

    it('should have compact styling', () => {
      const { container } = render(<CompactScoreDisplay score={100} />);
      
      expect(container.firstChild).toHaveClass(
        'inline-flex',
        'bg-black',
        'bg-opacity-75',
        'text-green-400'
      );
    });
  });

  describe('Score Formatting', () => {
    it('should handle zero score', () => {
      render(<CompactScoreDisplay score={0} />);
      
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle negative scores', () => {
      render(<CompactScoreDisplay score={-100} />);
      
      expect(screen.getByText('-100')).toBeInTheDocument();
    });

    it('should handle very large scores', () => {
      render(<CompactScoreDisplay score={1000000000} />);
      
      expect(screen.getByText('1,000,000,000')).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('should use tabular numbers for consistent spacing', () => {
      const { container } = render(<CompactScoreDisplay score={123} />);
      
      const scoreValue = container.querySelector('.tabular-nums');
      expect(scoreValue).toBeInTheDocument();
    });

    it('should have appropriate spacing between label and value', () => {
      const { container } = render(<CompactScoreDisplay score={123} />);
      
      expect(container.firstChild).toHaveClass('space-x-2');
    });
  });
});

describe('Score Display Integration', () => {
  it('should update display when score prop changes', () => {
    const { rerender } = render(<ScoreDisplay score={100} />);
    
    expect(screen.getByText('100')).toBeInTheDocument();

    rerender(<ScoreDisplay score={250} />);
    
    // Eventually should show the new score
    waitFor(() => {
      expect(screen.getByText('250')).toBeInTheDocument();
    });
  });

  it('should maintain consistent formatting across re-renders', () => {
    const { rerender } = render(<ScoreDisplay score={1000} />);
    
    expect(screen.getByText('1,000')).toBeInTheDocument();

    rerender(<ScoreDisplay score={2000} />);
    
    waitFor(() => {
      expect(screen.getByText('2,000')).toBeInTheDocument();
    });
  });

  it('should handle rapid score changes gracefully', () => {
    const { rerender } = render(<ScoreDisplay score={100} showAnimation={false} />);
    
    // Rapid changes
    rerender(<ScoreDisplay score={200} showAnimation={false} />);
    rerender(<ScoreDisplay score={300} showAnimation={false} />);
    rerender(<ScoreDisplay score={400} showAnimation={false} />);
    
    expect(screen.getByText('400')).toBeInTheDocument();
  });
});