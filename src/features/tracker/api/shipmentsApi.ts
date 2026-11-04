/**
 * Dexpert Flow — Mock API layer
 *
 * Simulates API calls with realistic delays.
 * In production, replace these with actual fetch() calls.
 */

import { Shipment } from '../types';
import { MOCK_SHIPMENTS } from '../data/shipments.mock';
import { positionAlongPath, getEffectivePath, estimateProgress } from '../lib/geo';
import { AVG_SPEED_KMH } from '../constants';

/** Simulate network delay */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch all shipments. In production, this would be a GET /api/shipments call.
 */
export async function mockFetchShipments(): Promise<Shipment[]> {
  await delay(400 + Math.random() * 300);
  // Return a deep copy so mutations don't affect the original
  return JSON.parse(JSON.stringify(MOCK_SHIPMENTS));
}

/**
 * Refresh a single shipment's live status.
 *
 * Simulates an RPA/carrier API call that takes 1.2–2s.
 * Moves lastKnown forward along the route to the current time-based estimate.
 * ~20% chance the status changes to 'delayed'.
 */
export async function mockRefreshShipment(id: string): Promise<Shipment> {
  await delay(1200 + Math.random() * 800);

  const original = MOCK_SHIPMENTS.find((s) => s.id === id);
  if (!original) {
    throw new Error(`Shipment ${id} not found`);
  }

  const shipment: Shipment = JSON.parse(JSON.stringify(original));
  const now = new Date();

  // Compute estimated current position
  const path = getEffectivePath(
    [shipment.origin.lng, shipment.origin.lat],
    [shipment.destination.lng, shipment.destination.lat],
    shipment.route
  );

  const speedKmh = shipment.lastKnown?.speedKts
    ? shipment.lastKnown.speedKts * 1.852
    : AVG_SPEED_KMH[shipment.medium] ?? 100;

  let fraction = 0.5; // Default if no lastKnown
  if (shipment.lastKnown) {
    fraction = estimateProgress(
      path,
      [shipment.lastKnown.lng, shipment.lastKnown.lat],
      new Date(shipment.lastKnown.at),
      now,
      speedKmh
    );
  }

  // Clamp and compute new position
  fraction = Math.min(fraction, 0.95); // Don't arrive fully in mock
  const [lng, lat] = positionAlongPath(path, fraction);

  shipment.lastKnown = {
    lng,
    lat,
    at: now.toISOString(),
    speedKts: shipment.lastKnown?.speedKts,
  };

  // ~20% chance status changes to delayed
  if (Math.random() < 0.2 && shipment.status === 'on_time') {
    shipment.status = 'delayed';
  }

  return shipment;
}
