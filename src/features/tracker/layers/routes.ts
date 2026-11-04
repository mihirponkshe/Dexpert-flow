/**
 * Dexpert Flow — Sea/Road route path layers
 *
 * Creates PathLayer instances for sea and road shipments.
 * Uses route waypoints when available, falls back to great-circle arc.
 */

import { PathLayer } from '@deck.gl/layers';
import { Shipment } from '../types';
import { MEDIUM_COLORS, GLOW_OPACITY, DIM_OPACITY } from '../constants';
import { greatCircleArc } from '../lib/geo';

interface RouteData {
  shipment: Shipment;
  path: [number, number][];
}

function getRoutePaths(shipments: Shipment[]): RouteData[] {
  return shipments
    .filter((s) => s.medium === 'sea' || s.medium === 'road')
    .map((s) => ({
      shipment: s,
      path:
        s.route && s.route.length >= 2
          ? s.route
          : greatCircleArc([s.origin.lng, s.origin.lat], [s.destination.lng, s.destination.lat]),
    }));
}

export function createRouteLayers(
  shipments: Shipment[],
  selectedId: string | null,
  _currentTime: number
) {
  const routeData = getRoutePaths(shipments);
  if (routeData.length === 0) return [];

  const seaRoutes = routeData.filter((r) => r.shipment.medium === 'sea');
  const roadRoutes = routeData.filter((r) => r.shipment.medium === 'road');
  const layers: PathLayer<RouteData>[] = [];

  if (seaRoutes.length > 0) {
    layers.push(
      new PathLayer<RouteData>({
        id: 'sea-routes-glow',
        data: seaRoutes,
        getPath: (d) => d.path,
        getColor: (d) => {
          const a = selectedId && selectedId !== d.shipment.id ? DIM_OPACITY * 255 : GLOW_OPACITY * 255;
          return [...MEDIUM_COLORS.sea.primary, a] as [number, number, number, number];
        },
        getWidth: 10,
        widthUnits: 'pixels' as const,
        capRounded: true,
        jointRounded: true,
        pickable: false,
        updateTriggers: { getColor: [selectedId] },
      }),
      new PathLayer<RouteData>({
        id: 'sea-routes-main',
        data: seaRoutes,
        getPath: (d) => d.path,
        getColor: (d) => {
          const a = selectedId && selectedId !== d.shipment.id ? DIM_OPACITY * 255 : 200;
          return [...MEDIUM_COLORS.sea.primary, a] as [number, number, number, number];
        },
        getWidth: 2.5,
        widthUnits: 'pixels' as const,
        capRounded: true,
        jointRounded: true,
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 255, 255, 80],
        updateTriggers: { getColor: [selectedId] },
      })
    );
  }

  if (roadRoutes.length > 0) {
    layers.push(
      new PathLayer<RouteData>({
        id: 'road-routes-glow',
        data: roadRoutes,
        getPath: (d) => d.path,
        getColor: (d) => {
          const a = selectedId && selectedId !== d.shipment.id ? DIM_OPACITY * 255 : GLOW_OPACITY * 255;
          return [...MEDIUM_COLORS.road.primary, a] as [number, number, number, number];
        },
        getWidth: 8,
        widthUnits: 'pixels' as const,
        capRounded: true,
        jointRounded: true,
        pickable: false,
        updateTriggers: { getColor: [selectedId] },
      }),
      new PathLayer<RouteData>({
        id: 'road-routes-main',
        data: roadRoutes,
        getPath: (d) => d.path,
        getColor: (d) => {
          const a = selectedId && selectedId !== d.shipment.id ? DIM_OPACITY * 255 : 200;
          return [...MEDIUM_COLORS.road.primary, a] as [number, number, number, number];
        },
        getWidth: 2,
        widthUnits: 'pixels' as const,
        capRounded: true,
        jointRounded: true,
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 255, 255, 80],
        updateTriggers: { getColor: [selectedId] },
      })
    );
  }

  return layers;
}

