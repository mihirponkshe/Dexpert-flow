/**
 * Dexpert Flow — TrackerMap component
 *
 * Uses deck.gl's _GlobeView for a REAL 3D sphere globe.
 * Basemap: GeoJSON land + SolidPolygon ocean (no tiles, no API keys).
 * Same approach as deck.gl's official GlobeView examples.
 */

'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Deck } from '@deck.gl/core';
import { _GlobeView as GlobeView } from '@deck.gl/core';
import { GeoJsonLayer, SolidPolygonLayer } from '@deck.gl/layers';
import type { PickingInfo } from '@deck.gl/core';

import { Shipment } from '../types';
import { DEFAULT_VIEW_STATE, AUTO_ROTATE_SPEED, AUTO_ROTATE_IDLE_MS } from '../constants';
import { useGhostPositions } from '../hooks/useGhostPosition';
import { createArcLayers } from '../layers/arcs';
import { createRouteLayers } from '../layers/routes';
import { createPinLayers } from '../layers/pins';
import { createGhostLayers } from '../layers/ghost';
import { createBeaconLayers } from '../layers/lastKnown';
import type { GhostPosition } from '../hooks/useGhostPosition';

/**
 * Natural Earth 50m countries GeoJSON — same CDN deck.gl examples use.
 * Loaded once from browser, ~500KB.
 */
const COUNTRIES_URL =
  'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_countries.geojson';

interface TrackerMapProps {
  shipments: Shipment[];
  onRefresh: (id: string) => Promise<Shipment>;
  onSelect?: (s: Shipment | null) => void;
  selectedId: string | null;
  hoveredId: string | null;
  onHover?: (id: string | null) => void;
  onGhostPositionsUpdate?: (ghosts: Map<string, GhostPosition>) => void;
}

/** Full-world polygon coordinates for the ocean background */
const OCEAN_POLYGON = [
  [-180, 90],
  [0, 90],
  [180, 90],
  [180, -90],
  [0, -90],
  [-180, -90],
] as [number, number][];

export default function TrackerMap({
  shipments,
  onSelect,
  selectedId,
  hoveredId,
  onHover,
  onGhostPositionsUpdate,
}: TrackerMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deckRef = useRef<any>(null);
  const lastInteraction = useRef(Date.now());
  const [animationTime, setAnimationTime] = useState(0);
  const rafRef = useRef<number | null>(null);
  const viewStateRef = useRef({
    longitude: DEFAULT_VIEW_STATE.longitude,
    latitude: DEFAULT_VIEW_STATE.latitude,
    zoom: DEFAULT_VIEW_STATE.zoom,
  });
  const [webglSupported, setWebglSupported] = useState(true);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [landData, setLandData] = useState<any>(null);

  /* ── Check WebGL ──────────────────────────────────────────── */
  useEffect(() => {
    try {
      const c = document.createElement('canvas');
      if (!c.getContext('webgl2') && !c.getContext('webgl')) setWebglSupported(false);
    } catch {
      setWebglSupported(false);
    }
  }, []);

  /* ── Load land GeoJSON once ───────────────────────────────── */
  useEffect(() => {
    fetch(COUNTRIES_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => setLandData(data))
      .catch((err) => console.warn('[DexpertFlow] Failed to load land GeoJSON:', err));
  }, []);

  /* ── Ghost positions ──────────────────────────────────────── */
  const ghostPositions = useGhostPositions(shipments);

  useEffect(() => {
    onGhostPositionsUpdate?.(ghostPositions);
  }, [ghostPositions, onGhostPositionsUpdate]);

  /* ── Click handler ────────────────────────────────────────── */
  const handleClick = useCallback(
    (info: PickingInfo) => {
      if (!onSelect) return;
      if (info.object) {
        const obj = info.object as { shipmentId?: string; id?: string };
        const id = obj.shipmentId || obj.id;
        if (id) {
          const s = shipments.find((sh) => sh.id === id);
          if (s) {
            onSelect(s);
            return;
          }
        }
        if ('medium' in info.object && 'origin' in info.object) {
          onSelect(info.object as Shipment);
          return;
        }
      }
      onSelect(null);
    },
    [onSelect, shipments]
  );

  /* ── Hover handler ────────────────────────────────────────── */
  const handleHover = useCallback(
    (info: PickingInfo) => {
      if (!onHover) return;
      if (info.object) {
        const obj = info.object as { shipmentId?: string; id?: string };
        onHover(obj.shipmentId || obj.id || null);
      } else {
        onHover(null);
      }
    },
    [onHover]
  );

  /* ── Basemap layers (ocean + land) ────────────────────────── */
  const basemapLayers = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const layers: any[] = [];

    // Ocean / globe background — dark blue tinted (lighter than land)
    layers.push(
      new SolidPolygonLayer({
        id: 'ocean-bg',
        data: [OCEAN_POLYGON],
        getPolygon: (d: [number, number][]) => d,
        filled: true,
        getFillColor: [12, 18, 42, 255], // Dark navy blue ocean
        stroked: false,
      })
    );

    // Land masses — near-black (darker than ocean for contrast)
    if (landData) {
      layers.push(
        new GeoJsonLayer({
          id: 'land-fill',
          data: landData,
          filled: true,
          stroked: true,
          getFillColor: [5, 8, 18, 255],       // Near-black land
          getLineColor: [35, 55, 95, 80],       // Subtle country borders
          getLineWidth: 1,
          lineWidthMinPixels: 0.5,
          lineWidthMaxPixels: 1.5,
          pickable: false,
        })
      );

      // Coastline glow — slight blue highlight on coastlines
      layers.push(
        new GeoJsonLayer({
          id: 'coast-glow',
          data: landData,
          filled: false,
          stroked: true,
          getLineColor: [40, 80, 140, 40],      // Subtle blue coast glow
          getLineWidth: 2,
          lineWidthMinPixels: 0.5,
          lineWidthMaxPixels: 2,
          pickable: false,
        })
      );
    }

    return layers;
  }, [landData]);

  /* ── Shipment feature layers ──────────────────────────────── */
  const featureLayers = useMemo(
    () => [
      ...createArcLayers(shipments, selectedId),
      ...createRouteLayers(shipments, selectedId, animationTime),
      ...createPinLayers(shipments, selectedId),
      ...createGhostLayers(shipments, ghostPositions, selectedId),
      ...createBeaconLayers(shipments, selectedId, hoveredId, animationTime),
    ],
    [shipments, selectedId, hoveredId, animationTime, ghostPositions]
  );

  /* ── Initialize Deck with GlobeView ───────────────────────── */
  useEffect(() => {
    if (!containerRef.current || !webglSupported) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deckProps: any = {
      parent: containerRef.current,
      views: new GlobeView({ resolution: 10 }),
      initialViewState: {
        longitude: DEFAULT_VIEW_STATE.longitude,
        latitude: DEFAULT_VIEW_STATE.latitude,
        zoom: DEFAULT_VIEW_STATE.zoom,
      },
      controller: true,
      parameters: {
        clearColor: [0.008, 0.012, 0.03, 1],
      },
      layers: [],
      getTooltip: () => null,
      onViewStateChange: ({
        viewState,
      }: {
        viewState: { longitude: number; latitude: number; zoom: number };
      }) => {
        lastInteraction.current = Date.now();
        viewStateRef.current = {
          longitude: viewState.longitude,
          latitude: viewState.latitude,
          zoom: viewState.zoom,
        };
      },
    };

    const deck = new Deck(deckProps);
    deckRef.current = deck;

    return () => {
      deck.finalize();
      deckRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webglSupported]);

  /* ── Throttled animation (~10 fps, enough for beacon pulse) ─ */
  useEffect(() => {
    let lastUpdate = 0;
    const animate = (ts: number) => {
      if (ts - lastUpdate >= 100) {
        lastUpdate = ts;
        setAnimationTime(ts);
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  /* ── Auto-rotation when idle ──────────────────────────────── */
  useEffect(() => {
    const interval = setInterval(() => {
      const deck = deckRef.current;
      if (!deck) return;
      const idleTime = Date.now() - lastInteraction.current;
      if (idleTime > AUTO_ROTATE_IDLE_MS && !selectedId) {
        const vs = viewStateRef.current;
        const newLng = vs.longitude + AUTO_ROTATE_SPEED * 0.03;
        viewStateRef.current = { ...vs, longitude: newLng };
        deck.setProps({
          viewState: {
            longitude: newLng,
            latitude: vs.latitude,
            zoom: vs.zoom,
          },
        });
      }
    }, 50);
    return () => clearInterval(interval);
  }, [selectedId]);

  /* ── Push layers to Deck instance ─────────────────────────── */
  useEffect(() => {
    if (!deckRef.current) return;
    deckRef.current.setProps({
      layers: [...basemapLayers, ...featureLayers],
      onClick: handleClick,
      onHover: handleHover,
    });
  }, [basemapLayers, featureLayers, handleClick, handleHover]);

  /* ── Fly to selected shipment ─────────────────────────────── */
  useEffect(() => {
    if (!selectedId || !deckRef.current) return;
    const ghost = ghostPositions.get(selectedId);
    if (ghost) {
      viewStateRef.current = {
        longitude: ghost.lng,
        latitude: ghost.lat,
        zoom: 3.5,
      };
      deckRef.current.setProps({
        viewState: {
          longitude: ghost.lng,
          latitude: ghost.lat,
          zoom: 3.5,
          transitionDuration: 1200,
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  /* ── Escape key closes selection ──────────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSelect?.(null);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onSelect]);

  /* ── WebGL fallback ───────────────────────────────────────── */
  if (!webglSupported) {
    return (
      <div className="flex items-center justify-center h-full bg-[#020308] text-white">
        <div className="text-center p-8">
          <div className="text-4xl mb-4">🌐</div>
          <h2 className="text-xl font-semibold mb-2">WebGL Not Available</h2>
          <p className="text-gray-400 max-w-md">
            Your browser does not support WebGL. Please try a different browser.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative"
      style={{ background: '#020308' }}
      aria-label="3D Globe Cargo Tracker"
    />
  );
}
