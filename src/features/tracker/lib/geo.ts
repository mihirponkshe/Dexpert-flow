/**
 * Dexpert Flow — Geographic utility functions
 *
 * Pure functions for path interpolation, great-circle calculations,
 * bearing computation, and distance measurement.
 */

/** Convert degrees to radians */
export function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Convert radians to degrees */
export function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/** Earth radius in km */
const R = 6371;

/**
 * Haversine distance between two [lng, lat] points in km.
 */
export function haversineDistance(
  a: [number, number],
  b: [number, number]
): number {
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Compute the total length of a polyline path in km.
 */
export function pathLength(path: [number, number][]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    total += haversineDistance(path[i - 1], path[i]);
  }
  return total;
}

/**
 * Interpolate a position along a polyline path at a given fraction (0–1).
 * Returns [lng, lat]. Clamps fraction to [0, 1].
 */
export function positionAlongPath(
  path: [number, number][],
  fraction: number
): [number, number] {
  if (path.length === 0) return [0, 0];
  if (path.length === 1 || fraction <= 0) return path[0];
  if (fraction >= 1) return path[path.length - 1];

  const totalLen = pathLength(path);
  const targetDist = totalLen * fraction;

  let accumulated = 0;
  for (let i = 1; i < path.length; i++) {
    const segLen = haversineDistance(path[i - 1], path[i]);
    if (accumulated + segLen >= targetDist) {
      const segFrac = (targetDist - accumulated) / segLen;
      return interpolatePoint(path[i - 1], path[i], segFrac);
    }
    accumulated += segLen;
  }

  return path[path.length - 1];
}

/**
 * Linear interpolation between two [lng, lat] points.
 */
export function interpolatePoint(
  a: [number, number],
  b: [number, number],
  t: number
): [number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/**
 * Generate a great-circle arc between two points as an array of [lng, lat].
 * @param numPoints Number of intermediate points (default 64)
 */
export function greatCircleArc(
  start: [number, number],
  end: [number, number],
  numPoints = 64
): [number, number][] {
  const lat1 = toRad(start[1]);
  const lng1 = toRad(start[0]);
  const lat2 = toRad(end[1]);
  const lng2 = toRad(end[0]);

  const d = 2 * Math.asin(
    Math.sqrt(
      Math.pow(Math.sin((lat1 - lat2) / 2), 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lng1 - lng2) / 2), 2)
    )
  );

  if (d === 0) return [start, end];

  const points: [number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    const f = i / numPoints;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2);
    const y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);
    const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
    const lng = Math.atan2(y, x);
    points.push([toDeg(lng), toDeg(lat)]);
  }
  return points;
}

/**
 * Compute bearing from point A to point B in degrees (0–360).
 */
export function bearing(
  a: [number, number],
  b: [number, number]
): number {
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const dLng = toRad(b[0] - a[0]);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
}

/**
 * Estimate how far along a route a shipment has traveled, given:
 * - the path
 * - the lastKnown position + timestamp
 * - the current time
 * - average speed in km/h
 *
 * Returns a fraction (0–1) clamped to [lastKnownFraction, 1].
 */
export function estimateProgress(
  path: [number, number][],
  lastKnownPos: [number, number],
  lastKnownTime: Date,
  now: Date,
  speedKmh: number
): number {
  const total = pathLength(path);
  if (total === 0) return 1;

  // Find fraction of lastKnown position along the path
  const lastKnownFrac = findClosestFraction(path, lastKnownPos);

  const elapsedHours = (now.getTime() - lastKnownTime.getTime()) / 3_600_000;
  const distanceTraveled = speedKmh * elapsedHours;
  const additionalFrac = distanceTraveled / total;

  return Math.min(1, lastKnownFrac + additionalFrac);
}

/**
 * Find the fraction (0–1) along a path that is closest to a given point.
 */
export function findClosestFraction(
  path: [number, number][],
  point: [number, number]
): number {
  if (path.length <= 1) return 0;

  const total = pathLength(path);
  if (total === 0) return 0;

  let minDist = Infinity;
  let bestAccum = 0;
  let accumulated = 0;

  for (let i = 0; i < path.length; i++) {
    const d = haversineDistance(path[i], point);
    if (d < minDist) {
      minDist = d;
      bestAccum = accumulated;
    }
    if (i < path.length - 1) {
      accumulated += haversineDistance(path[i], path[i + 1]);
    }
  }

  return bestAccum / total;
}

/**
 * Get an effective path for a shipment:
 * - If route is provided, use it
 * - Otherwise, generate a great-circle arc from origin to destination
 */
export function getEffectivePath(
  origin: [number, number],
  destination: [number, number],
  route?: [number, number][]
): [number, number][] {
  if (route && route.length >= 2) return route;
  return greatCircleArc(origin, destination);
}
