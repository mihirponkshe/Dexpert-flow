/**
 * Dexpert Flow — Sea/Road route path layers
 *
 * Creates PathLayer instances with dramatic triple-layer neon glow effect.
 * Much wider and brighter than default to match reference design.
 */

import { PathLayer } from '@deck.gl/layers';
import { Shipment } from '../types';
import { MEDIUM_COLORS, DIM_OPACITY } from '../constants';
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

function buildPathLayers(
  id: string,
  routes: RouteData[],
  colors: { primary: readonly [number, number, number]; secondary: readonly [number, number, number] },
  selectedId: string | null,
  _isDashed: boolean
): PathLayer<RouteData>[] {
  if (routes.length === 0) return [];

  const layers: PathLayer<RouteData>[] = [];

  // Outer glow — wide soft haze
  layers.push(
    new PathLayer<RouteData>({
      id: `${id}-outer-glow`,
      data: routes,
      getPath: (d) => d.path,
      getColor: (d) => {
        const a = selectedId && selectedId !== d.shipment.id ? 10 : 50;
        return [...colors.primary, a] as [number, number, number, number];
      },
      getWidth: 22,
      widthUnits: 'pixels' as const,
      capRounded: true,
      jointRounded: true,
      pickable: false,
      updateTriggers: { getColor: [selectedId] },
    })
  );

  // Inner glow
  layers.push(
    new PathLayer<RouteData>({
      id: `${id}-inner-glow`,
      data: routes,
      getPath: (d) => d.path,
      getColor: (d) => {
        const a = selectedId && selectedId !== d.shipment.id ? 20 : 110;
        return [...colors.primary, a] as [number, number, number, number];
      },
      getWidth: 9,
      widthUnits: 'pixels' as const,
      capRounded: true,
      jointRounded: true,
      pickable: false,
      updateTriggers: { getColor: [selectedId] },
    })
  );

  // Core line — bright and sharp
  layers.push(
    new PathLayer<RouteData>({
      id: `${id}-core`,
      data: routes,
      getPath: (d: RouteData) => d.path,
      getColor: (d: RouteData) => {
        const a = selectedId && selectedId !== d.shipment.id ? DIM_OPACITY * 255 : 240;
        return [...colors.primary, a] as [number, number, number, number];
      },
      getWidth: 3,
      widthUnits: 'pixels' as const,
      capRounded: true,
      jointRounded: true,
      pickable: true,
      autoHighlight: true,
      highlightColor: [255, 255, 255, 100] as [number, number, number, number],
      updateTriggers: { getColor: [selectedId] },
    })
  );

  return layers;
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

  return [
    ...buildPathLayers('sea-routes', seaRoutes, MEDIUM_COLORS.sea, selectedId, false),
    ...buildPathLayers('road-routes', roadRoutes, MEDIUM_COLORS.road, selectedId, true),
  ];
}
