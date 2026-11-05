/**
 * Dexpert Flow — Ghost position indicator layers
 *
 * Smaller, cleaner ghost dots — subtle indicators that don't overwhelm the map.
 * Colored by medium with soft glow.
 */

import { ScatterplotLayer } from '@deck.gl/layers';
import { Shipment, Medium } from '../types';
import { MEDIUM_COLORS, DIM_OPACITY } from '../constants';

export interface GhostPositionInfo {
  lng: number;
  lat: number;
  bearing: number;
  fraction: number;
}

interface GhostData {
  shipmentId: string;
  position: [number, number];
  bearing: number;
  medium: Medium;
}

function getMediumColor(medium: Medium): [number, number, number] {
  return [...MEDIUM_COLORS[medium].primary] as [number, number, number];
}

export function createGhostLayers(
  shipments: Shipment[],
  ghostPositions: Map<string, GhostPositionInfo>,
  selectedId: string | null
) {
  const ghostData: GhostData[] = [];
  for (const s of shipments) {
    const ghost = ghostPositions.get(s.id);
    if (!ghost) continue;
    ghostData.push({
      shipmentId: s.id,
      position: [ghost.lng, ghost.lat],
      bearing: ghost.bearing,
      medium: s.medium,
    });
  }
  if (ghostData.length === 0) return [];

  // Outer glow — subtle halo
  const outerGlow = new ScatterplotLayer<GhostData>({
    id: 'ghost-outer-glow',
    data: ghostData,
    getPosition: (d) => d.position,
    getFillColor: (d) => {
      const rgb = getMediumColor(d.medium);
      const a = selectedId && selectedId !== d.shipmentId ? 8 : 35;
      return [...rgb, a] as [number, number, number, number];
    },
    getRadius: 14,
    radiusUnits: 'pixels' as const,
    pickable: false,
    updateTriggers: { getPosition: [ghostPositions], getFillColor: [selectedId] },
  });

  // Inner glow
  const innerGlow = new ScatterplotLayer<GhostData>({
    id: 'ghost-inner-glow',
    data: ghostData,
    getPosition: (d) => d.position,
    getFillColor: (d) => {
      const rgb = getMediumColor(d.medium);
      const a = selectedId && selectedId !== d.shipmentId ? 18 : 80;
      return [...rgb, a] as [number, number, number, number];
    },
    getRadius: 8,
    radiusUnits: 'pixels' as const,
    pickable: false,
    updateTriggers: { getPosition: [ghostPositions], getFillColor: [selectedId] },
  });

  // Core dot — small and bright
  const core = new ScatterplotLayer<GhostData>({
    id: 'ghost-core',
    data: ghostData,
    getPosition: (d) => d.position,
    getFillColor: (d) => {
      const rgb = getMediumColor(d.medium);
      const a = selectedId && selectedId !== d.shipmentId ? DIM_OPACITY * 255 : 255;
      return [...rgb, a] as [number, number, number, number];
    },
    getRadius: 4,
    radiusUnits: 'pixels' as const,
    radiusMinPixels: 3,
    radiusMaxPixels: 7,
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 120],
    stroked: true,
    getLineColor: [255, 255, 255, 200],
    getLineWidth: 1.5,
    lineWidthUnits: 'pixels' as const,
    updateTriggers: { getPosition: [ghostPositions], getFillColor: [selectedId] },
  });

  return [outerGlow, innerGlow, core];
}
