/**
 * Dexpert Flow — Mini Globe (overview inset)
 *
 * Small circular synced globe in the bottom-right corner.
 */

'use client';

import React, { useMemo, useCallback, useRef } from 'react';
import Map from 'react-map-gl/maplibre';
import { ScatterplotLayer } from '@deck.gl/layers';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { useControl } from 'react-map-gl/maplibre';
import type { LayersList } from '@deck.gl/core';
import type { MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

import { Shipment } from '../types';
import { MAP_STYLE_URL, MEDIUM_COLORS } from '../constants';

function MiniDeckOverlay(props: { layers: LayersList }) {
  const overlay = useControl(() => new MapboxOverlay({ interleaved: false }));
  overlay.setProps({ layers: props.layers });
  return null;
}

interface MiniGlobeProps {
  shipments: Shipment[];
  mainLng: number;
  mainLat: number;
  onRecenter: (lng: number, lat: number) => void;
}

export default function MiniGlobe({ shipments, mainLng, mainLat, onRecenter }: MiniGlobeProps) {
  const miniMapRef = useRef<MapRef>(null);

  const dotData = useMemo(() => {
    const dots: { position: [number, number]; color: [number, number, number, number] }[] = [];
    for (const s of shipments) {
      const c = MEDIUM_COLORS[s.medium].primary;
      dots.push({ position: [s.origin.lng, s.origin.lat], color: [...c, 180] });
      dots.push({ position: [s.destination.lng, s.destination.lat], color: [...c, 180] });
    }
    return dots;
  }, [shipments]);

  const layers: LayersList = useMemo(
    () => [
      new ScatterplotLayer({
        id: 'mini-dots',
        data: dotData,
        getPosition: (d: (typeof dotData)[0]) => d.position,
        getFillColor: (d: (typeof dotData)[0]) => d.color,
        getRadius: 3,
        radiusUnits: 'pixels' as const,
        radiusMinPixels: 2,
        pickable: false,
      }),
    ],
    [dotData]
  );

  const handleLoad = useCallback(() => {
    const map = miniMapRef.current?.getMap();
    if (map) {
      // setProjection exists on maplibre-gl v4+ but react-map-gl types lag behind
      (map as unknown as { setProjection: (p: { type: string }) => void }).setProjection({ type: 'globe' });
    }
  }, []);

  return (
    <div
      className="fixed bottom-6 right-6 z-40 w-32 h-32 rounded-full overflow-hidden border-2 border-white/10 shadow-2xl cursor-pointer hover:border-white/25 transition-colors hidden md:block"
      onClick={() => onRecenter(mainLng, mainLat)}
      role="button"
      aria-label="Re-centre main map"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onRecenter(mainLng, mainLat);
      }}
    >
      <Map
        ref={miniMapRef}
        longitude={mainLng}
        latitude={mainLat}
        zoom={0.5}
        pitch={0}
        bearing={0}
        mapStyle={MAP_STYLE_URL}
        style={{ width: '100%', height: '100%' }}
        interactive={false}
        attributionControl={false}
        onLoad={handleLoad}
      >
        <MiniDeckOverlay layers={layers} />
      </Map>
    </div>
  );
}
