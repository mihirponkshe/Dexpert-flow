/**
 * Dexpert Flow — Ghost position indicator layers
 *
 * ScatterplotLayer for estimated current positions of shipments.
 * Medium-specific colours with glow effect.
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

  const glowLayer = new ScatterplotLayer<GhostData>({
    id: 'ghost-glow',
    data: ghostData,
    getPosition: (d) => d.position,
    getFillColor: (d) => {
      const rgb = getMediumColor(d.medium);
      const a = selectedId && selectedId !== d.shipmentId ? 20 : 80;
      return [...rgb, a] as [number, number, number, number];
    },
    getRadius: 18,
    radiusUnits: 'pixels' as const,
    pickable: false,
    updateTriggers: { getPosition: [ghostPositions], getFillColor: [selectedId] },
  });

  const mainLayer = new ScatterplotLayer<GhostData>({
    id: 'ghost-main',
    data: ghostData,
    getPosition: (d) => d.position,
    getFillColor: (d) => {
      const rgb = getMediumColor(d.medium);
      const a = selectedId && selectedId !== d.shipmentId ? DIM_OPACITY * 255 : 255;
      return [...rgb, a] as [number, number, number, number];
    },
    getRadius: 7,
    radiusUnits: 'pixels' as const,
    radiusMinPixels: 5,
    radiusMaxPixels: 10,
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 120],
    stroked: true,
    getLineColor: [255, 255, 255, 180],
    getLineWidth: 2,
    lineWidthUnits: 'pixels' as const,
    updateTriggers: { getPosition: [ghostPositions], getFillColor: [selectedId] },
  });

  return [glowLayer, mainLayer];
}

