/**
 * Dexpert Flow — Origin/Destination pin layers
 *
 * ScatterplotLayer for origin and destination points, coloured by status.
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

  const glowLayer = new ScatterplotLayer<PinData>({
    id: 'pins-glow',
    data: pins,
    getPosition: (d) => d.position,
    getFillColor: (d) => {
      const rgb = getStatusColor(d.status);
      const a = selectedId && selectedId !== d.shipmentId ? DIM_OPACITY * 60 : 60;
      return [...rgb, a] as [number, number, number, number];
    },
    getRadius: 12,
    radiusUnits: 'pixels' as const,
    pickable: false,
    updateTriggers: { getFillColor: [selectedId] },
  });

  const mainLayer = new ScatterplotLayer<PinData>({
    id: 'pins-main',
    data: pins,
    getPosition: (d) => d.position,
    getFillColor: (d) => {
      const rgb = getStatusColor(d.status);
      const a = selectedId && selectedId !== d.shipmentId ? DIM_OPACITY * 255 : 255;
      return [...rgb, a] as [number, number, number, number];
    },
    getRadius: 5,
    radiusUnits: 'pixels' as const,
    radiusMinPixels: 3,
    radiusMaxPixels: 8,
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 100],
    stroked: true,
    getLineColor: [255, 255, 255, 120],
    getLineWidth: 1,
    lineWidthUnits: 'pixels' as const,
    updateTriggers: { getFillColor: [selectedId] },
  });

  return [glowLayer, mainLayer];
}

