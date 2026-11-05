/**
 * Dexpert Flow — Mini Globe
 *
 * Glass sphere in the bottom-right corner with a thin cyan rim mirroring
 * the main globe, with simplified dots and click-to-recenter.
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { Shipment } from '../types';

interface MiniGlobeProps {
  shipments: Shipment[];
  mainLng?: number;
  mainLat?: number;
  onRecenter: () => void;
}

export default function MiniGlobe({ shipments, onRecenter }: MiniGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;
    let miniGlobe: any = null;

    import('globe.gl').then((GlobeModule) => {
      if (!isMounted || !containerRef.current) return;

      const Globe = GlobeModule.default;
      miniGlobe = new Globe(containerRef.current);
      globeInstanceRef.current = miniGlobe;

      miniGlobe
        .width(160)
        .height(160)
        .backgroundColor('rgba(0,0,0,0)')
        .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
        .showAtmosphere(true)
        .atmosphereColor('#22d3ee')
        .atmosphereAltitude(0.18);

      // Disable orbit controls for mini-globe
      const controls = miniGlobe.controls();
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.8;
        controls.enableZoom = false;
        controls.enablePan = false;
        controls.enableRotate = false;
      }

      // Simplified points for shipments
      const points = shipments.flatMap((s) => [
        { lat: s.origin.lat, lng: s.origin.lng, color: s.status === 'on_time' ? '#10b981' : '#ef4444' },
        { lat: s.destination.lat, lng: s.destination.lng, color: '#22d3ee' },
      ]);

      miniGlobe
        .pointsData(points)
        .pointLat((p: any) => p.lat)
        .pointLng((p: any) => p.lng)
        .pointColor((p: any) => p.color)
        .pointRadius(0.5)
        .pointAltitude(0.02);
    });

    return () => {
      isMounted = false;
      if (globeInstanceRef.current) {
        globeInstanceRef.current._destructor?.();
        globeInstanceRef.current = null;
      }
    };
  }, [shipments]);

  return (
    <div
      onClick={onRecenter}
      title="Click to recenter global view"
      className="fixed bottom-6 right-6 z-50 w-40 h-40 rounded-full border-2 border-cyan-400/40 bg-slate-950/40 backdrop-blur-md shadow-[0_0_30px_rgba(34,211,238,0.25)] flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 group overflow-hidden"
    >
      {/* Outer Cyan Rim Aura */}
      <div className="absolute inset-0 rounded-full border border-cyan-300/30 shadow-[inset_0_0_20px_rgba(34,211,238,0.3)] pointer-events-none" />

      {/* Mini Globe Container */}
      <div ref={containerRef} className="w-full h-full pointer-events-none" />

      {/* Recenter badge on hover */}
      <div className="absolute inset-x-0 bottom-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[10px] font-medium text-cyan-300 bg-slate-900/80 px-2 py-0.5 rounded-full border border-cyan-500/30">
          Recenter
        </span>
      </div>
    </div>
  );
}
