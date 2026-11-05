/**
 * Dexpert Flow — Origin/Destination pin layers
 *
 * Dramatic triple-layer neon pins with strong glow.
 * Larger and brighter to match reference design.
 */

import { ScatterplotLayer } from '@deck.gl/layers';
import { Shipment, Status } from '../types';
import { STATUS_COLORS, DIM_OPACITY } from '../constants';

interface PinData {
  shipmentId: string;
  position: [number, number];
  status: Status;
  isOrigin: boolean;
}

function extractPins(shipments: Shipment[]): PinData[] {
  const pins: PinData[] = [];
  for (const s of shipments) {
    pins.push({
      shipmentId: s.id,
      position: [s.origin.lng, s.origin.lat],
      status: s.status,
      isOrigin: true,
    });
    pins.push({
      shipmentId: s.id,
      position: [s.destination.lng, s.destination.lat],
      status: s.status,
      isOrigin: false,
    });
  }
  return pins;
}

function getStatusColor(status: Status): [number, number, number] {
  return [...STATUS_COLORS[status].rgb] as [number, number, number];
}

export function createPinLayers(
  shipments: Shipment[],
  selectedId: string | null
) {
  const pins = extractPins(shipments);
  if (pins.length === 0) return [];

  // Outer glow — large and soft
  const outerGlow = new ScatterplotLayer<PinData>({
    id: 'pins-outer-glow',
    data: pins,
    getPosition: (d) => d.position,
    getFillColor: (d) => {
      const rgb = getStatusColor(d.status);
      const a = selectedId && selectedId !== d.shipmentId ? 12 : 50;
      return [...rgb, a] as [number, number, number, number];
    },
    getRadius: 24,
    radiusUnits: 'pixels' as const,
    pickable: false,
    updateTriggers: { getFillColor: [selectedId] },
  });

  // Inner glow
  const innerGlow = new ScatterplotLayer<PinData>({
    id: 'pins-inner-glow',
    data: pins,
    getPosition: (d) => d.position,
    getFillColor: (d) => {
      const rgb = getStatusColor(d.status);
      const a = selectedId && selectedId !== d.shipmentId ? 30 : 120;
      return [...rgb, a] as [number, number, number, number];
    },
    getRadius: 13,
    radiusUnits: 'pixels' as const,
    pickable: false,
    updateTriggers: { getFillColor: [selectedId] },
  });

  // Core pin — bright
  const core = new ScatterplotLayer<PinData>({
    id: 'pins-core',
    data: pins,
    getPosition: (d) => d.position,
    getFillColor: (d) => {
      const rgb = getStatusColor(d.status);
      const a = selectedId && selectedId !== d.shipmentId ? DIM_OPACITY * 255 : 255;
      return [...rgb, a] as [number, number, number, number];
    },
    getRadius: 6,
    radiusUnits: 'pixels' as const,
    radiusMinPixels: 4,
    radiusMaxPixels: 9,
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 120],
    stroked: true,
    getLineColor: [255, 255, 255, 180],
    getLineWidth: 1.5,
    lineWidthUnits: 'pixels' as const,
    updateTriggers: { getFillColor: [selectedId] },
  });

  return [outerGlow, innerGlow, core];
}
