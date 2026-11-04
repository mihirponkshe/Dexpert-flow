/**
 * Dexpert Flow — Unit tests for geo.ts
 */

import { describe, it, expect } from 'vitest';
import {
  haversineDistance,
  pathLength,
  positionAlongPath,
  greatCircleArc,
  bearing,
  estimateProgress,
  findClosestFraction,
  getEffectivePath,
} from '../lib/geo';

describe('haversineDistance', () => {
  it('returns 0 for same point', () => {
    expect(haversineDistance([0, 0], [0, 0])).toBe(0);
  });

  it('computes rough distance London → Paris (~340 km)', () => {
    const d = haversineDistance([-0.1278, 51.5074], [2.3522, 48.8566]);
    expect(d).toBeGreaterThan(330);
    expect(d).toBeLessThan(350);
  });

  it('computes rough distance Mumbai → Delhi (~1150 km)', () => {
    const d = haversineDistance([72.8777, 19.076], [77.1025, 28.5562]);
    expect(d).toBeGreaterThan(1100);
    expect(d).toBeLessThan(1200);
  });
});

describe('pathLength', () => {
  it('returns 0 for empty path', () => {
    expect(pathLength([])).toBe(0);
  });

  it('returns 0 for single point', () => {
    expect(pathLength([[0, 0]])).toBe(0);
  });

  it('returns same as haversineDistance for two-point path', () => {
    const a: [number, number] = [0, 0];
    const b: [number, number] = [1, 1];
    expect(pathLength([a, b])).toBeCloseTo(haversineDistance(a, b), 5);
  });
});

describe('positionAlongPath', () => {
  const path: [number, number][] = [[0, 0], [10, 0], [20, 0]];

  it('returns start for fraction 0', () => {
    expect(positionAlongPath(path, 0)).toEqual([0, 0]);
  });

  it('returns end for fraction 1', () => {
    expect(positionAlongPath(path, 1)).toEqual([20, 0]);
  });

  it('clamps below 0 to start', () => {
    expect(positionAlongPath(path, -0.5)).toEqual([0, 0]);
  });

  it('clamps above 1 to end', () => {
    expect(positionAlongPath(path, 1.5)).toEqual([20, 0]);
  });

  it('returns midpoint for fraction 0.5', () => {
    const pos = positionAlongPath(path, 0.5);
    expect(pos[0]).toBeCloseTo(10, 0);
    expect(pos[1]).toBeCloseTo(0, 1);
  });

  it('handles empty path', () => {
    expect(positionAlongPath([], 0.5)).toEqual([0, 0]);
  });

  it('handles single-point path', () => {
    expect(positionAlongPath([[5, 10]], 0.5)).toEqual([5, 10]);
  });
});

describe('greatCircleArc', () => {
  it('returns correct number of points', () => {
    const arc = greatCircleArc([0, 0], [10, 10], 10);
    expect(arc.length).toBe(11);
  });

  it('starts at start point and ends at end point', () => {
    const arc = greatCircleArc([0, 0], [10, 10]);
    expect(arc[0][0]).toBeCloseTo(0, 5);
    expect(arc[0][1]).toBeCloseTo(0, 5);
    expect(arc[arc.length - 1][0]).toBeCloseTo(10, 5);
    expect(arc[arc.length - 1][1]).toBeCloseTo(10, 5);
  });
});

describe('bearing', () => {
  it('returns ~0 for due north', () => {
    const b = bearing([0, 0], [0, 10]);
    expect(b).toBeCloseTo(0, 0);
  });

  it('returns ~90 for due east', () => {
    const b = bearing([0, 0], [10, 0]);
    expect(b).toBeCloseTo(90, 0);
  });

  it('returns ~180 for due south', () => {
    const b = bearing([0, 10], [0, 0]);
    expect(b).toBeCloseTo(180, 0);
  });
});

describe('findClosestFraction', () => {
  const path: [number, number][] = [[0, 0], [10, 0], [20, 0]];

  it('returns 0 for start point', () => {
    expect(findClosestFraction(path, [0, 0])).toBeCloseTo(0, 1);
  });

  it('returns ~1 for end point', () => {
    expect(findClosestFraction(path, [20, 0])).toBeCloseTo(1, 1);
  });

  it('returns ~0.5 for midpoint', () => {
    expect(findClosestFraction(path, [10, 0])).toBeCloseTo(0.5, 1);
  });
});

describe('estimateProgress', () => {
  const path: [number, number][] = [[0, 0], [10, 0]];

  it('returns lastKnown fraction when no time has passed', () => {
    const now = new Date();
    const frac = estimateProgress(path, [0, 0], now, now, 100);
    expect(frac).toBeCloseTo(0, 1);
  });

  it('never exceeds 1', () => {
    const start = new Date(Date.now() - 1000 * 3600 * 24 * 365);
    const frac = estimateProgress(path, [0, 0], start, new Date(), 800);
    expect(frac).toBeLessThanOrEqual(1);
  });
});

describe('getEffectivePath', () => {
  it('returns route when provided', () => {
    const route: [number, number][] = [[0, 0], [5, 5], [10, 10]];
    expect(getEffectivePath([0, 0], [10, 10], route)).toBe(route);
  });

  it('generates great-circle arc when no route', () => {
    const path = getEffectivePath([0, 0], [10, 10]);
    expect(path.length).toBeGreaterThan(2);
    expect(path[0][0]).toBeCloseTo(0, 5);
    expect(path[path.length - 1][0]).toBeCloseTo(10, 5);
  });

  it('generates great-circle arc when route has less than 2 points', () => {
    const path = getEffectivePath([0, 0], [10, 10], [[5, 5]]);
    expect(path.length).toBeGreaterThan(2);
  });
});
