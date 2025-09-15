import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SwipeGestureHandler } from '../SwipeGestureHandler';

describe('SwipeGestureHandler', () => {
  const mockOnSwipe = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children correctly', () => {
    render(
      <SwipeGestureHandler onSwipe={mockOnSwipe}>
        <div data-testid="child">Test Content</div>
      </SwipeGestureHandler>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('detects horizontal swipe right', () => {
    const { container } = render(
      <SwipeGestureHandler onSwipe={mockOnSwipe} sensitivity={50}>
        <div>Swipe Area</div>
      </SwipeGestureHandler>
    );

    const handler = container.firstChild as HTMLElement;

    // Simulate swipe right
    fireEvent.touchStart(handler, {
      touches: [{ clientX: 100, clientY: 100 }],
    });

    fireEvent.touchEnd(handler, {
      changedTouches: [{ clientX: 200, clientY: 100 }],
    });

    expect(mockOnSwipe).toHaveBeenCalledWith('RIGHT');
  });

  it('detects horizontal swipe left', () => {
    const { container } = render(
      <SwipeGestureHandler onSwipe={mockOnSwipe} sensitivity={50}>
        <div>Swipe Area</div>
      </SwipeGestureHandler>
    );

    const handler = container.firstChild as HTMLElement;

    // Simulate swipe left
    fireEvent.touchStart(handler, {
      touches: [{ clientX: 200, clientY: 100 }],
    });

    fireEvent.touchEnd(handler, {
      changedTouches: [{ clientX: 100, clientY: 100 }],
    });

    expect(mockOnSwipe).toHaveBeenCalledWith('LEFT');
  });

  it('detects vertical swipe up', () => {
    const { container } = render(
      <SwipeGestureHandler onSwipe={mockOnSwipe} sensitivity={50}>
        <div>Swipe Area</div>
      </SwipeGestureHandler>
    );

    const handler = container.firstChild as HTMLElement;

    // Simulate swipe up
    fireEvent.touchStart(handler, {
      touches: [{ clientX: 100, clientY: 200 }],
    });

    fireEvent.touchEnd(handler, {
      changedTouches: [{ clientX: 100, clientY: 100 }],
    });

    expect(mockOnSwipe).toHaveBeenCalledWith('UP');
  });

  it('detects vertical swipe down', () => {
    const { container } = render(
      <SwipeGestureHandler onSwipe={mockOnSwipe} sensitivity={50}>
        <div>Swipe Area</div>
      </SwipeGestureHandler>
    );

    const handler = container.firstChild as HTMLElement;

    // Simulate swipe down
    fireEvent.touchStart(handler, {
      touches: [{ clientX: 100, clientY: 100 }],
    });

    fireEvent.touchEnd(handler, {
      changedTouches: [{ clientX: 100, clientY: 200 }],
    });

    expect(mockOnSwipe).toHaveBeenCalledWith('DOWN');
  });

  it('ignores swipes below sensitivity threshold', () => {
    const { container } = render(
      <SwipeGestureHandler onSwipe={mockOnSwipe} sensitivity={100}>
        <div>Swipe Area</div>
      </SwipeGestureHandler>
    );

    const handler = container.firstChild as HTMLElement;

    // Simulate small swipe (below threshold)
    fireEvent.touchStart(handler, {
      touches: [{ clientX: 100, clientY: 100 }],
    });

    fireEvent.touchEnd(handler, {
      changedTouches: [{ clientX: 120, clientY: 100 }],
    });

    expect(mockOnSwipe).not.toHaveBeenCalled();
  });

  it('does not detect swipe when disabled', () => {
    const { container } = render(
      <SwipeGestureHandler onSwipe={mockOnSwipe} disabled={true}>
        <div>Swipe Area</div>
      </SwipeGestureHandler>
    );

    const handler = container.firstChild as HTMLElement;

    // Simulate swipe
    fireEvent.touchStart(handler, {
      touches: [{ clientX: 100, clientY: 100 }],
    });

    fireEvent.touchEnd(handler, {
      changedTouches: [{ clientX: 200, clientY: 100 }],
    });

    expect(mockOnSwipe).not.toHaveBeenCalled();
  });

  it('handles multi-touch correctly (ignores)', () => {
    const { container } = render(
      <SwipeGestureHandler onSwipe={mockOnSwipe}>
        <div>Swipe Area</div>
      </SwipeGestureHandler>
    );

    const handler = container.firstChild as HTMLElement;

    // Simulate multi-touch
    fireEvent.touchStart(handler, {
      touches: [
        { clientX: 100, clientY: 100 },
        { clientX: 150, clientY: 150 },
      ],
    });

    fireEvent.touchEnd(handler, {
      changedTouches: [{ clientX: 200, clientY: 100 }],
    });

    expect(mockOnSwipe).not.toHaveBeenCalled();
  });

  it('handles touch move events during tracking', () => {
    const { container } = render(
      <SwipeGestureHandler onSwipe={mockOnSwipe}>
        <div>Swipe Area</div>
      </SwipeGestureHandler>
    );

    const handler = container.firstChild as HTMLElement;

    // Start tracking
    fireEvent.touchStart(handler, {
      touches: [{ clientX: 100, clientY: 100 }],
    });

    // Simulate touch move - should not cause any errors
    fireEvent.touchMove(handler, {
      touches: [{ clientX: 120, clientY: 100 }],
    });

    // Should not crash and tracking should still work
    fireEvent.touchEnd(handler, {
      changedTouches: [{ clientX: 200, clientY: 100 }],
    });

    expect(mockOnSwipe).toHaveBeenCalledWith('RIGHT');
  });

  it('applies custom className', () => {
    const { container } = render(
      <SwipeGestureHandler onSwipe={mockOnSwipe} className="custom-handler">
        <div>Swipe Area</div>
      </SwipeGestureHandler>
    );

    expect(container.firstChild).toHaveClass('custom-handler');
  });

  it('handles touch cancel correctly', () => {
    const { container } = render(
      <SwipeGestureHandler onSwipe={mockOnSwipe}>
        <div>Swipe Area</div>
      </SwipeGestureHandler>
    );

    const handler = container.firstChild as HTMLElement;

    // Start tracking
    fireEvent.touchStart(handler, {
      touches: [{ clientX: 100, clientY: 100 }],
    });

    // Cancel touch
    fireEvent.touchCancel(handler);

    // Try to end touch (should not trigger swipe)
    fireEvent.touchEnd(handler, {
      changedTouches: [{ clientX: 200, clientY: 100 }],
    });

    expect(mockOnSwipe).not.toHaveBeenCalled();
  });

  it('prioritizes horizontal movement over vertical when both occur', () => {
    const { container } = render(
      <SwipeGestureHandler onSwipe={mockOnSwipe} sensitivity={50}>
        <div>Swipe Area</div>
      </SwipeGestureHandler>
    );

    const handler = container.firstChild as HTMLElement;

    // Simulate diagonal swipe with more horizontal movement
    fireEvent.touchStart(handler, {
      touches: [{ clientX: 100, clientY: 100 }],
    });

    fireEvent.touchEnd(handler, {
      changedTouches: [{ clientX: 200, clientY: 130 }], // More horizontal than vertical
    });

    expect(mockOnSwipe).toHaveBeenCalledWith('RIGHT');
  });

  it('prioritizes vertical movement when greater than horizontal', () => {
    const { container } = render(
      <SwipeGestureHandler onSwipe={mockOnSwipe} sensitivity={50}>
        <div>Swipe Area</div>
      </SwipeGestureHandler>
    );

    const handler = container.firstChild as HTMLElement;

    // Simulate diagonal swipe with more vertical movement
    fireEvent.touchStart(handler, {
      touches: [{ clientX: 100, clientY: 100 }],
    });

    fireEvent.touchEnd(handler, {
      changedTouches: [{ clientX: 130, clientY: 200 }], // More vertical than horizontal
    });

    expect(mockOnSwipe).toHaveBeenCalledWith('DOWN');
  });
});