import { GestureDetector } from '../GestureDetector';

describe('GestureDetector', () => {
  let detector: GestureDetector;

  beforeEach(() => {
    detector = new GestureDetector(50, 30);
  });

  it('initializes with default sensitivity and minimum distance', () => {
    expect(detector.getSensitivity()).toBe(50);
    expect(detector.isTrackingGesture()).toBe(false);
  });

  it('starts tracking gesture correctly', () => {
    detector.startTracking(100, 100);

    expect(detector.isTrackingGesture()).toBe(true);
    expect(detector.getTrackingPosition()).toEqual({ x: 100, y: 100 });
  });

  it('detects horizontal right swipe', () => {
    detector.startTracking(100, 100);
    const direction = detector.endTracking(200, 100);

    expect(direction).toBe('RIGHT');
    expect(detector.isTrackingGesture()).toBe(false);
  });

  it('detects horizontal left swipe', () => {
    detector.startTracking(200, 100);
    const direction = detector.endTracking(100, 100);

    expect(direction).toBe('LEFT');
  });

  it('detects vertical up swipe', () => {
    detector.startTracking(100, 200);
    const direction = detector.endTracking(100, 100);

    expect(direction).toBe('UP');
  });

  it('detects vertical down swipe', () => {
    detector.startTracking(100, 100);
    const direction = detector.endTracking(100, 200);

    expect(direction).toBe('DOWN');
  });

  it('returns null for gestures below minimum distance', () => {
    detector.startTracking(100, 100);
    const direction = detector.endTracking(110, 110); // Only 14px distance

    expect(direction).toBeNull();
  });

  it('returns null for gestures below sensitivity threshold', () => {
    const lowSensitivityDetector = new GestureDetector(100, 30);
    lowSensitivityDetector.startTracking(100, 100);
    const direction = lowSensitivityDetector.endTracking(140, 100); // 40px < 100px sensitivity

    expect(direction).toBeNull();
  });

  it('prioritizes horizontal movement over vertical', () => {
    detector.startTracking(100, 100);
    const direction = detector.endTracking(180, 130); // More horizontal than vertical

    expect(direction).toBe('RIGHT');
  });

  it('prioritizes vertical movement when greater than horizontal', () => {
    detector.startTracking(100, 100);
    const direction = detector.endTracking(130, 180); // More vertical than horizontal

    expect(direction).toBe('DOWN');
  });

  it('handles equal horizontal and vertical movement (chooses horizontal)', () => {
    detector.startTracking(100, 100);
    const direction = detector.endTracking(170, 170); // Equal movement

    expect(direction).toBe('RIGHT'); // Should choose horizontal by default
  });

  it('cancels tracking correctly', () => {
    detector.startTracking(100, 100);
    detector.cancelTracking();

    expect(detector.isTrackingGesture()).toBe(false);
    expect(detector.getTrackingPosition()).toBeNull();
  });

  it('returns null when ending tracking without starting', () => {
    const direction = detector.endTracking(200, 100);

    expect(direction).toBeNull();
  });

  it('allows sensitivity updates', () => {
    detector.setSensitivity(75);

    expect(detector.getSensitivity()).toBe(75);
  });

  it('enforces minimum sensitivity of 10', () => {
    detector.setSensitivity(5);

    expect(detector.getSensitivity()).toBe(10);
  });

  it('resets tracking state after ending', () => {
    detector.startTracking(100, 100);
    detector.endTracking(200, 100);

    expect(detector.isTrackingGesture()).toBe(false);
    expect(detector.getTrackingPosition()).toBeNull();
  });

  it('handles multiple tracking attempts correctly', () => {
    // First gesture
    detector.startTracking(100, 100);
    let direction = detector.endTracking(200, 100);
    expect(direction).toBe('RIGHT');

    // Second gesture
    detector.startTracking(150, 150);
    direction = detector.endTracking(150, 250);
    expect(direction).toBe('DOWN');
  });

  it('initializes with custom parameters', () => {
    const customDetector = new GestureDetector(80, 40);

    expect(customDetector.getSensitivity()).toBe(80);
  });

  it('handles zero movement correctly', () => {
    detector.startTracking(100, 100);
    const direction = detector.endTracking(100, 100);

    expect(direction).toBeNull();
  });

  it('handles negative coordinates correctly', () => {
    detector.startTracking(-50, -50);
    const direction = detector.endTracking(50, -50);

    expect(direction).toBe('RIGHT');
  });

  it('calculates distance using Euclidean formula', () => {
    detector.startTracking(0, 0);
    // 3-4-5 triangle: should be 50px distance, deltaX=30, deltaY=40, so more vertical
    const direction = detector.endTracking(30, 40);

    // Distance is 50px, deltaY(40) > deltaX(30), so should be DOWN
    expect(direction).toBe('DOWN');
  });
});