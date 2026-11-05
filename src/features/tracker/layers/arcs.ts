/**
 * Dexpert Flow — Air route arc layers
 *
 * Creates ArcLayer instances for air shipments with a dramatic neon glow effect.
 * Three layers: widest soft glow → medium glow → thin bright core.
 *
 * Tuned for maximum visual impact — wide, bright arcs like the reference design.
 */

import { ArcLayer } from '@deck.gl/layers';
import { Shipment } from '../types';
import { MEDIUM_COLORS, DIM_OPACITY } from '../constants';

const AIR = MEDIUM_COLORS.air;

export function createArcLayers(
  shipments: Shipment[],
  selectedId: string | null
) {
  const airShipments = shipments.filter((s) => s.medium === 'air');
  if (airShipments.length === 0) return [];

  // Layer 1: Wide soft outer glow — creates the "neon haze" effect
  const outerGlow = new ArcLayer({
    id: 'air-arcs-outer-glow',
    data: airShipments,
    getSourcePosition: (d: Shipment) => [d.origin.lng, d.origin.lat],
    getTargetPosition: (d: Shipment) => [d.destination.lng, d.destination.lat],
    getSourceColor: (d: Shipment) => {
      const a = selectedId && selectedId !== d.id ? 10 : 55;
      return [...AIR.primary, a] as [number, number, number, number];
    },
    getTargetColor: (d: Shipment) => {
      const a = selectedId && selectedId !== d.id ? 10 : 55;
      return [...AIR.secondary, a] as [number, number, number, number];
    },
    getWidth: 32,
    getHeight: 0.55,
    greatCircle: true,
    widthUnits: 'pixels' as const,
    updateTriggers: { getSourceColor: [selectedId], getTargetColor: [selectedId] },
    pickable: false,
  });

  // Layer 2: Medium glow
  const innerGlow = new ArcLayer({
    id: 'air-arcs-inner-glow',
    data: airShipments,
    getSourcePosition: (d: Shipment) => [d.origin.lng, d.origin.lat],
    getTargetPosition: (d: Shipment) => [d.destination.lng, d.destination.lat],
    getSourceColor: (d: Shipment) => {
      const a = selectedId && selectedId !== d.id ? 25 : 130;
      return [...AIR.primary, a] as [number, number, number, number];
    },
    getTargetColor: (d: Shipment) => {
      const a = selectedId && selectedId !== d.id ? 25 : 130;
      return [...AIR.secondary, a] as [number, number, number, number];
    },
    getWidth: 12,
    getHeight: 0.55,
    greatCircle: true,
    widthUnits: 'pixels' as const,
    updateTriggers: { getSourceColor: [selectedId], getTargetColor: [selectedId] },
    pickable: false,
  });

  // Layer 3: Bright core line
  const mainLayer = new ArcLayer({
    id: 'air-arcs-main',
    data: airShipments,
    getSourcePosition: (d: Shipment) => [d.origin.lng, d.origin.lat],
    getTargetPosition: (d: Shipment) => [d.destination.lng, d.destination.lat],
    getSourceColor: (d: Shipment) => {
      const a = selectedId && selectedId !== d.id ? DIM_OPACITY * 255 : 255;
      return [...AIR.primary, a] as [number, number, number, number];
    },
    getTargetColor: (d: Shipment) => {
      const a = selectedId && selectedId !== d.id ? DIM_OPACITY * 255 : 255;
      return [...AIR.secondary, a] as [number, number, number, number];
    },
    getWidth: 3.5,
    getHeight: 0.55,
    greatCircle: true,
    widthUnits: 'pixels' as const,
    updateTriggers: { getSourceColor: [selectedId], getTargetColor: [selectedId] },
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 100],
  });

  return [outerGlow, innerGlow, mainLayer];
}
