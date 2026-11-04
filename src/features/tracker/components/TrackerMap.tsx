/**
 * Dexpert Flow — TrackerMap component
 *
 * "Dumb" map component that receives data via props and renders deck.gl layers
 * on top of a MapLibre globe. Never fetches data by itself.
 */

'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import Map, { NavigationControl, useControl } from 'react-map-gl/maplibre';
import { MapboxOverlay } from '@deck.gl/mapbox';
import type { MapRef } from 'react-map-gl/maplibre';
import type { PickingInfo } from '@deck.gl/core';
import type { LayersList } from '@deck.gl/core';
import 'maplibre-gl/dist/maplibre-gl.css';

import { Shipment } from '../types';
import { DEFAULT_VIEW_STATE, MAP_STYLE_URL, AUTO_ROTATE_SPEED, AUTO_ROTATE_IDLE_MS } from '../constants';
import { useGhostPositions } from '../hooks/useGhostPosition';
import { createArcLayers } from '../layers/arcs';
import { createRouteLayers } from '../layers/routes';
import { createPinLayers } from '../layers/pins';
import { createGhostLayers } from '../layers/ghost';
import { createBeaconLayers } from '../layers/lastKnown';
import type { GhostPosition } from '../hooks/useGhostPosition';

/* ── deck.gl overlay integration via react-map-gl ─────────────── */
function DeckGLOverlay(props: {
  layers: LayersList;
  onClick?: (info: PickingInfo) => void;
  onHover?: (info: PickingInfo) => void;
}) {
  const overlay = useControl(() => new MapboxOverlay({ interleaved: false }));
  overlay.setProps({
    layers: props.layers,
    onClick: props.onClick,
    onHover: props.onHover,
  });
  return null;
}

/* ── Props ─────────────────────────────────────────────────────── */
interface TrackerMapProps {
  shipments: Shipment[];
  onRefresh: (id: string) => Promise<Shipment>;
  onSelect?: (s: Shipment | null) => void;
  selectedId: string | null;
  hoveredId: string | null;
  onHover?: (id: string | null) => void;
  onGhostPositionsUpdate?: (ghosts: Map<string, GhostPosition>) => void;
}

export default function TrackerMap({
  shipments,
  onSelect,
  selectedId,
  hoveredId,
  onHover,
  onGhostPositionsUpdate,
}: TrackerMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState(DEFAULT_VIEW_STATE);
  const [animationTime, setAnimationTime] = useState(0);
  const lastInteraction = useRef(Date.now());
  const rafRef = useRef<number | null>(null);
  const [webglSupported, setWebglSupported] = useState(true);

  /* ── Check WebGL support ──────────────────────────────────── */
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) setWebglSupported(false);
    } catch {
      setWebglSupported(false);
    }
  }, []);

  /* ── Ghost positions ──────────────────────────────────────── */
  const ghostPositions = useGhostPositions(shipments);

  useEffect(() => {
    onGhostPositionsUpdate?.(ghostPositions);
  }, [ghostPositions, onGhostPositionsUpdate]);

  /* ── Animation loop ───────────────────────────────────────── */
  useEffect(() => {
    const animate = () => {
      setAnimationTime(Date.now());
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  /* ── Auto-rotation ────────────────────────────────────────── */
  useEffect(() => {
    const interval = setInterval(() => {
      const idleTime = Date.now() - lastInteraction.current;
      if (idleTime > AUTO_ROTATE_IDLE_MS && !selectedId) {
        setViewState((prev) => ({
          ...prev,
          bearing: (prev.bearing + AUTO_ROTATE_SPEED * 0.05) % 360,
        }));
      }
    }, 50);
    return () => clearInterval(interval);
  }, [selectedId]);

  /* ── Interaction handlers ─────────────────────────────────── */
  const handleMove = useCallback(
    (evt: { viewState: typeof viewState }) => {
      lastInteraction.current = Date.now();
      setViewState(evt.viewState);
    },
    []
  );

  const handleClick = useCallback(
    (info: PickingInfo) => {
      if (!onSelect) return;
      if (info.object) {
        const obj = info.object as { shipmentId?: string; id?: string };
        const id = obj.shipmentId || obj.id;
        if (id) {
          const shipment = shipments.find((s) => s.id === id);
          if (shipment) {
            onSelect(shipment);
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

  const handleHover = useCallback(
    (info: PickingInfo) => {
      if (!onHover) return;
      if (info.object) {
        const obj = info.object as { shipmentId?: string; id?: string };
        const id = obj.shipmentId || obj.id;
        onHover(id || null);
      } else {
        onHover(null);
      }
    },
    [onHover]
  );

  /* ── Build deck.gl layers ─────────────────────────────────── */
  const layers: LayersList = useMemo(() => {
    return [
      ...createArcLayers(shipments, selectedId),
      ...createRouteLayers(shipments, selectedId, animationTime),
      ...createPinLayers(shipments, selectedId),
      ...createGhostLayers(shipments, ghostPositions, selectedId),
      ...createBeaconLayers(shipments, selectedId, hoveredId, animationTime),
    ];
  }, [shipments, selectedId, hoveredId, animationTime, ghostPositions]);

  /* ── Fly to selected shipment's ghost ─────────────────────── */
  useEffect(() => {
    if (!selectedId || !mapRef.current) return;
    const ghost = ghostPositions.get(selectedId);
    if (ghost) {
      mapRef.current.flyTo({
        center: [ghost.lng, ghost.lat],
        zoom: 4,
        duration: 1500,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  /* ── Set globe projection on map load ─────────────────────── */
  const handleLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) {
      // setProjection exists on maplibre-gl v4+ but react-map-gl types lag behind
      (map as unknown as { setProjection: (p: { type: string }) => void }).setProjection({ type: 'globe' });
    }
  }, []);

  if (!webglSupported) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-white">
        <div className="text-center p-8">
          <div className="text-4xl mb-4">🌐</div>
          <h2 className="text-xl font-semibold mb-2">WebGL Not Available</h2>
          <p className="text-gray-400 max-w-md">
            Your browser or device does not support WebGL, which is required for the 3D globe.
            Please try a different browser or enable hardware acceleration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Map
      ref={mapRef}
      {...viewState}
      onMove={handleMove}
      onLoad={handleLoad}
      mapStyle={MAP_STYLE_URL}
      style={{ width: '100%', height: '100%' }}
      attributionControl={false}
      maxPitch={60}
    >
      <DeckGLOverlay
        layers={layers}
        onClick={handleClick}
        onHover={handleHover}
      />
      <NavigationControl position="bottom-right" />
    </Map>
  );
}
