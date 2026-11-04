/**
 * Dexpert Flow — Last-known beacon layer
 *
 * Pulsing neon ring at the lastKnown position of the selected/hovered shipment.
 */

import { ScatterplotLayer } from '@deck.gl/layers';
import { Shipment, Medium } from '../types';
import { MEDIUM_COLORS, BEACON_PULSE_PERIOD, BEACON_MAX_RADIUS } from '../constants';

interface BeaconData {
  shipmentId: string;
  position: [number, number];
  medium: Medium;
}

export function createBeaconLayers(
  shipments: Shipment[],
  selectedId: string | null,
  hoveredId: string | null,
  animationTime: number
) {
  const activeIds = new Set<string>();
  if (selectedId) activeIds.add(selectedId);
  if (hoveredId) activeIds.add(hoveredId);

  const beaconData: BeaconData[] = shipments
    .filter((s) => activeIds.has(s.id) && s.lastKnown)
    .map((s) => ({
      shipmentId: s.id,
      position: [s.lastKnown!.lng, s.lastKnown!.lat] as [number, number],
      medium: s.medium,
    }));

  if (beaconData.length === 0) return [];

  const pulse = (Math.sin((animationTime / BEACON_PULSE_PERIOD) * Math.PI * 2) + 1) / 2;
  const pulseRadius = 10 + pulse * (BEACON_MAX_RADIUS - 10);
  const pulseAlpha = Math.round(180 - pulse * 140);

  const innerRing = new ScatterplotLayer<BeaconData>({
    id: 'beacon-inner',
    data: beaconData,
    getPosition: (d) => d.position,
    getFillColor: [0, 0, 0, 0],
    getLineColor: (d) => {
      const rgb = MEDIUM_COLORS[d.medium].primary;
      return [...rgb, 200] as [number, number, number, number];
    },
    getRadius: 8,
    radiusUnits: 'pixels' as const,
    stroked: true,
    filled: false,
    getLineWidth: 2,
    lineWidthUnits: 'pixels' as const,
    pickable: false,
    updateTriggers: { getPosition: [selectedId, hoveredId] },
  });

  const outerRing = new ScatterplotLayer<BeaconData>({
    id: 'beacon-pulse',
    data: beaconData,
    getPosition: (d) => d.position,
    getFillColor: [0, 0, 0, 0],
    getLineColor: (d) => {
      const rgb = MEDIUM_COLORS[d.medium].primary;
      return [...rgb, pulseAlpha] as [number, number, number, number];
    },
    getRadius: pulseRadius,
    radiusUnits: 'pixels' as const,
    stroked: true,
    filled: false,
    getLineWidth: 2,
    lineWidthUnits: 'pixels' as const,
    pickable: false,
    updateTriggers: {
      getPosition: [selectedId, hoveredId],
      getRadius: [animationTime],
      getLineColor: [animationTime],
    },
  });

  return [outerRing, innerRing];
}

