/**
 * Dexpert Flow — Air route arc layers
 *
 * Creates ArcLayer instances for air shipments with a glow effect.
 * Two layers: a wider low-alpha "glow" underneath and a thinner bright arc on top.
 */

import { ArcLayer } from '@deck.gl/layers';
import { Shipment } from '../types';
import { MEDIUM_COLORS, GLOW_OPACITY, DIM_OPACITY } from '../constants';

const AIR = MEDIUM_COLORS.air;

export function createArcLayers(
  shipments: Shipment[],
  selectedId: string | null
) {
  const airShipments = shipments.filter((s) => s.medium === 'air');
  if (airShipments.length === 0) return [];

  const glowLayer = new ArcLayer({
    id: 'air-arcs-glow',
    data: airShipments,
    getSourcePosition: (d: Shipment) => [d.origin.lng, d.origin.lat],
    getTargetPosition: (d: Shipment) => [d.destination.lng, d.destination.lat],
    getSourceColor: (d: Shipment) => {
      const a = selectedId && selectedId !== d.id ? DIM_OPACITY * 255 : GLOW_OPACITY * 255;
      return [...AIR.primary, a] as [number, number, number, number];
    },
    getTargetColor: (d: Shipment) => {
      const a = selectedId && selectedId !== d.id ? DIM_OPACITY * 255 : GLOW_OPACITY * 255;
      return [...AIR.secondary, a] as [number, number, number, number];
    },
    getWidth: 12,
    getHeight: 0.5,
    greatCircle: true,
    widthUnits: 'pixels' as const,
    updateTriggers: { getSourceColor: [selectedId], getTargetColor: [selectedId] },
    pickable: false,
  });

  const mainLayer = new ArcLayer({
    id: 'air-arcs-main',
    data: airShipments,
    getSourcePosition: (d: Shipment) => [d.origin.lng, d.origin.lat],
    getTargetPosition: (d: Shipment) => [d.destination.lng, d.destination.lat],
    getSourceColor: (d: Shipment) => {
      const a = selectedId && selectedId !== d.id ? DIM_OPACITY * 255 : 220;
      return [...AIR.primary, a] as [number, number, number, number];
    },
    getTargetColor: (d: Shipment) => {
      const a = selectedId && selectedId !== d.id ? DIM_OPACITY * 255 : 220;
      return [...AIR.secondary, a] as [number, number, number, number];
    },
    getWidth: 2.5,
    getHeight: 0.5,
    greatCircle: true,
    widthUnits: 'pixels' as const,
    updateTriggers: { getSourceColor: [selectedId], getTargetColor: [selectedId] },
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 80],
  });

  return [glowLayer, mainLayer];
}

