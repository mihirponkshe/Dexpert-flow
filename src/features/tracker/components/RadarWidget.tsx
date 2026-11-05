/**
 * Dexpert Flow — Radar / Live Status Widget
 *
 * Glassmorphic floating card with animated radar sweep and "Fetch Live Status"
 * button matching IMAGE B.
 */

'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Shipment } from '../types';

interface RadarWidgetProps {
  selectedShipment?: Shipment | null;
  onRefreshLive?: (id?: string) => Promise<any> | void;
  isRefreshing?: boolean;
}

export default function RadarWidget({
  selectedShipment,
  onRefreshLive,
  isRefreshing = false,
}: RadarWidgetProps) {
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(() => new Date(Date.now() - 48 * 3600000));
  const [internalLoading, setInternalLoading] = useState(false);

  // Compute display relative time
  const getTimeAgoText = () => {
    if (selectedShipment?.lastKnown?.at) {
      const diffHrs = Math.max(1, Math.round((Date.now() - new Date(selectedShipment.lastKnown.at).getTime()) / 3600000));
      return `${diffHrs}h ago`;
    }
    const diffHrs = Math.max(0, Math.round((Date.now() - lastRefreshedAt.getTime()) / 3600000));
    return diffHrs === 0 ? 'Just now' : `${diffHrs}h ago`;
  };

  const handleFetch = async () => {
    setInternalLoading(true);
    try {
      if (onRefreshLive) {
        await onRefreshLive(selectedShipment?.id);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
      setLastRefreshedAt(new Date());
    } finally {
      setInternalLoading(false);
    }
  };

  const loading = isRefreshing || internalLoading;

  return (
    <div className="glass-panel px-4 py-3 flex items-center gap-4 text-white shadow-2xl pointer-events-auto">
      {/* Radar circular screen */}
      <div className="relative w-14 h-14 rounded-full border border-cyan-400/40 bg-slate-950/80 overflow-hidden flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.25)]">
        {/* Concentric rings */}
        <div className="absolute inset-1.5 rounded-full border border-cyan-400/25" />
        <div className="absolute inset-3.5 rounded-full border border-cyan-400/20" />
        <div className="absolute inset-5.5 rounded-full border border-cyan-400/15" />
        
        {/* Crosshairs */}
        <div className="absolute inset-x-0 top-1/2 h-px bg-cyan-400/15 -translate-y-1/2" />
        <div className="absolute inset-y-0 left-1/2 w-px bg-cyan-400/15 -translate-x-1/2" />

        {/* Rotating sweep */}
        <div className="absolute inset-0 rounded-full radar-sweep-blade" />

        {/* Center glowing blip */}
        <div className="relative w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee]" />
      </div>

      {/* Info & action */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[12px] font-medium text-slate-300">
          Last updated: <span className="text-white font-semibold">{getTimeAgoText()}</span>
        </span>

        <button
          onClick={handleFetch}
          disabled={loading}
          className="relative px-4 py-1.5 rounded-xl text-xs font-semibold text-white tracking-wide
                     bg-gradient-to-r from-[#22d3ee] via-[#6366f1] to-[#c084fc]
                     hover:opacity-95 active:scale-95 transition-all duration-200
                     shadow-[0_0_20px_rgba(99,102,241,0.4)] disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Fetching...</span>
            </>
          ) : (
            <span>Fetch Live Status</span>
          )}
        </button>
      </div>
    </div>
  );
}

