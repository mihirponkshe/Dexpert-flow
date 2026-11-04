/**
 * Dexpert Flow — Ghost position estimation hook
 *
 * Computes the estimated current position of a shipment based on:
 * - Its route (or great-circle fallback)
 * - The last known position and timestamp
 * - Average speed per medium
 *
 * Updates approximately once per second via requestAnimationFrame.
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Shipment } from '../types';
import {
  getEffectivePath,
  estimateProgress,
  positionAlongPath,
  bearing,
} from '../lib/geo';
import { AVG_SPEED_KMH, GHOST_UPDATE_INTERVAL } from '../constants';

export interface GhostPosition {
  lng: number;
  lat: number;
  bearing: number;
  fraction: number;
}

/**
 * Compute ghost positions for all shipments that have lastKnown data.
 * Returns a map of shipment ID → GhostPosition.
 */
export function useGhostPositions(shipments: Shipment[]): Map<string, GhostPosition> {
  const [ghosts, setGhosts] = useState<Map<string, GhostPosition>>(new Map());
  const rafRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const computeGhosts = useCallback(() => {
    const now = new Date();
    const map = new Map<string, GhostPosition>();

    for (const shipment of shipments) {
      if (!shipment.lastKnown) continue;

      const path = getEffectivePath(
        [shipment.origin.lng, shipment.origin.lat],
        [shipment.destination.lng, shipment.destination.lat],
        shipment.route
      );

      const speedKmh = shipment.lastKnown.speedKts
        ? shipment.lastKnown.speedKts * 1.852
        : AVG_SPEED_KMH[shipment.medium] ?? 100;

      const fraction = estimateProgress(
        path,
        [shipment.lastKnown.lng, shipment.lastKnown.lat],
        new Date(shipment.lastKnown.at),
        now,
        speedKmh
      );

      const pos = positionAlongPath(path, fraction);

      // Compute bearing from current ghost pos to next point
      const nextFraction = Math.min(fraction + 0.01, 1);
      const nextPos = positionAlongPath(path, nextFraction);
      const brng = bearing(pos, nextPos);

      map.set(shipment.id, {
        lng: pos[0],
        lat: pos[1],
        bearing: brng,
        fraction,
      });
    }

    return map;
  }, [shipments]);

  useEffect(() => {
    // Initial computation
    setGhosts(computeGhosts());

    const tick = (timestamp: number) => {
      if (timestamp - lastUpdateRef.current >= GHOST_UPDATE_INTERVAL) {
        lastUpdateRef.current = timestamp;
        setGhosts(computeGhosts());
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [computeGhosts]);

  return ghosts;
}
