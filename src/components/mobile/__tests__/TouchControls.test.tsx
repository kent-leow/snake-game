import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TouchControls } from '../TouchControls';

// Mock navigator.vibrate
Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: jest.fn(),
});

describe('TouchControls', () => {
  const mockOnDirectionChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all direction buttons', () => {
    render(
      <TouchControls
        onDirectionChange={mockOnDirectionChange}
        showDirectional={true}
      />
    );

    expect(screen.getByLabelText('Move up')).toBeInTheDocument();
    expect(screen.getByLabelText('Move down')).toBeInTheDocument();
    expect(screen.getByLabelText('Move left')).toBeInTheDocument();
    expect(screen.getByLabelText('Move right')).toBeInTheDocument();
  });

  it('calls onDirectionChange when button is pressed', () => {
    render(
      <TouchControls
        onDirectionChange={mockOnDirectionChange}
        showDirectional={true}
      />
    );

    const upButton = screen.getByLabelText('Move up');
    fireEvent.mouseDown(upButton);

    expect(mockOnDirectionChange).toHaveBeenCalledWith('UP');
  });

  it('handles touch events correctly', () => {
    render(
      <TouchControls
        onDirectionChange={mockOnDirectionChange}
        showDirectional={true}
      />
    );

    const rightButton = screen.getByLabelText('Move right');
    
    // Use fireEvent.touchStart with proper structure
    fireEvent.touchStart(rightButton, {
      touches: [{ clientX: 100, clientY: 100 }],
    });

    expect(mockOnDirectionChange).toHaveBeenCalledWith('RIGHT');
  });

  it('does not call onDirectionChange when disabled', () => {
    render(
      <TouchControls
        onDirectionChange={mockOnDirectionChange}
        disabled={true}
        showDirectional={true}
      />
    );

    const upButton = screen.getByLabelText('Move up');
    fireEvent.mouseDown(upButton);

    expect(mockOnDirectionChange).not.toHaveBeenCalled();
  });

  it('does not render when showDirectional is false', () => {
    render(
      <TouchControls
        onDirectionChange={mockOnDirectionChange}
        showDirectional={false}
      />
    );

    expect(screen.queryByLabelText('Move up')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Move down')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Move left')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Move right')).not.toBeInTheDocument();
  });

  it('applies active state on button press', () => {
    render(
      <TouchControls
        onDirectionChange={mockOnDirectionChange}
        showDirectional={true}
      />
    );

    const leftButton = screen.getByLabelText('Move left');
    fireEvent.mouseDown(leftButton);

    expect(leftButton).toHaveClass('touch-control--active');
  });

  it('removes active state on button release', () => {
    render(
      <TouchControls
        onDirectionChange={mockOnDirectionChange}
        showDirectional={true}
      />
    );

    const downButton = screen.getByLabelText('Move down');
    fireEvent.mouseDown(downButton);
    fireEvent.mouseUp(downButton);

    expect(downButton).not.toHaveClass('touch-control--active');
  });

  it('applies custom className', () => {
    const { container } = render(
      <TouchControls
        onDirectionChange={mockOnDirectionChange}
        className="custom-controls"
        showDirectional={true}
      />
    );

    expect(container.firstChild).toHaveClass('custom-controls');
  });

  it('triggers vibration on direction change', () => {
    render(
      <TouchControls
        onDirectionChange={mockOnDirectionChange}
        showDirectional={true}
      />
    );

    const upButton = screen.getByLabelText('Move up');
    fireEvent.mouseDown(upButton);

    expect(navigator.vibrate).toHaveBeenCalledWith(50);
  });

  it('displays correct icons for each direction', () => {
    render(
      <TouchControls
        onDirectionChange={mockOnDirectionChange}
        showDirectional={true}
      />
    );

    expect(screen.getByLabelText('Move up')).toHaveTextContent('⬆️');
    expect(screen.getByLabelText('Move down')).toHaveTextContent('⬇️');
    expect(screen.getByLabelText('Move left')).toHaveTextContent('⬅️');
    expect(screen.getByLabelText('Move right')).toHaveTextContent('➡️');
  });

  it('handles multiple rapid clicks gracefully', () => {
    render(
      <TouchControls
        onDirectionChange={mockOnDirectionChange}
        showDirectional={true}
      />
    );

    const upButton = screen.getByLabelText('Move up');
    
    // Simulate rapid clicks
    fireEvent.mouseDown(upButton);
    fireEvent.mouseDown(upButton);
    fireEvent.mouseDown(upButton);

    expect(mockOnDirectionChange).toHaveBeenCalledTimes(3);
    expect(mockOnDirectionChange).toHaveBeenCalledWith('UP');
  });
});