/**
 * Dexpert Flow — Tracker Page
 *
 * Main page wiring together TrackerGlobe, FilterPanel, ShipmentPanel,
 * RadarWidget, MiniGlobe, GlobalSearch, and TanStack Query data hooks.
 */

'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { Shipment, Medium, Status, TrackerFilters } from '@/features/tracker/types';
import { useShipments } from '@/features/tracker/hooks/useShipments';
import { useRefreshShipment } from '@/features/tracker/hooks/useRefreshShipment';
import { getTenantsFromShipments } from '@/features/tracker/data/shipments.mock';
import FilterPanel from '@/features/tracker/components/FilterPanel';
import ShipmentPanel from '@/features/tracker/components/ShipmentPanel';
import RadarWidget from '@/features/tracker/components/RadarWidget';
import GlobalSearch from '@/features/tracker/components/GlobalSearch';
import type { GhostPosition } from '@/features/tracker/hooks/useGhostPosition';

/* ── Dynamic imports for client-only 3D Globe components ─────── */
const TrackerGlobe = dynamic(
  () => import('@/features/tracker/components/TrackerGlobe'),
  { ssr: false, loading: () => <GlobeLoadingFallback /> }
);

const MiniGlobe = dynamic(
  () => import('@/features/tracker/components/MiniGlobe'),
  { ssr: false }
);

function GlobeLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full bg-[#070b17] text-white">
      <div className="text-center">
        <div className="inline-block w-10 h-10 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_20px_#22d3ee]" />
        <p className="text-cyan-300 text-sm tracking-wide font-medium">Initializing 3D Globe Environment…</p>
      </div>
    </div>
  );
}

/* ── Filter logic (pure function) ───────────────────────────── */
function applyFilters(shipments: Shipment[], filters: TrackerFilters): Shipment[] {
  return shipments.filter((s) => {
    if (filters.mediums.size > 0 && !filters.mediums.has(s.medium)) return false;
    if (filters.tenantIds.size > 0 && !filters.tenantIds.has(s.tenantId)) return false;
    if (filters.statuses.size > 0 && !filters.statuses.has(s.status)) return false;
    if (filters.actionRequiredOnly && s.status === 'on_time') return false;
    return true;
  });
}

/* ── Inner component ────────────────────────────────────────── */
function TrackerPageInner() {
  const { data: shipments = [], isLoading, error } = useShipments();
  const refreshMutation = useRefreshShipment();

  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const ghostPositionsRef = useRef<Map<string, GhostPosition>>(new Map());

  /* ── Filter state ─────────────────────────────────────────── */
  const [filters, setFilters] = useState<TrackerFilters>({
    mediums: new Set<Medium>(['air', 'sea', 'road']),
    tenantIds: new Set<string>(),
    statuses: new Set<Status>(['on_time', 'delayed', 'exception']),
    actionRequiredOnly: false,
  });

  /* ── Derive tenants from data ─────────────────────────────── */
  const tenants = useMemo(() => getTenantsFromShipments(shipments), [shipments]);

  /* ── Initialize tenant filter when data loads ─────────────── */
  React.useEffect(() => {
    if (tenants.length > 0 && filters.tenantIds.size === 0) {
      setFilters((prev) => ({
        ...prev,
        tenantIds: new Set(tenants.map((t) => t.id)),
      }));
    }
  }, [tenants, filters.tenantIds.size]);

  /* ── Apply filters ────────────────────────────────────────── */
  const filteredShipments = useMemo(
    () => applyFilters(shipments, filters),
    [shipments, filters]
  );

  /* ── Keep selected shipment in sync with data updates ─────── */
  React.useEffect(() => {
    if (selectedShipment) {
      const updated = shipments.find((s) => s.id === selectedShipment.id);
      if (updated) {
        setSelectedShipment(updated);
      }
    }
  }, [shipments, selectedShipment]);

  /* ── Handlers ─────────────────────────────────────────────── */
  const handleSelect = useCallback((s: Shipment | null) => {
    setSelectedShipment(s);
  }, []);

  const handleRefresh = useCallback(
    async (id?: string): Promise<Shipment> => {
      const targetId = id || selectedShipment?.id || filteredShipments[0]?.id;
      if (!targetId) throw new Error('No shipment to refresh');
      return refreshMutation.mutateAsync(targetId);
    },
    [refreshMutation, selectedShipment, filteredShipments]
  );

  const handleGhostPositionsUpdate = useCallback((ghosts: Map<string, GhostPosition>) => {
    ghostPositionsRef.current = ghosts;
  }, []);

  const selectedGhost = selectedShipment
    ? ghostPositionsRef.current.get(selectedShipment.id)
    : null;

  /* ── Error state ──────────────────────────────────────────── */
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#070b17] text-white">
        <div className="text-center p-8 glass-panel max-w-md">
          <h2 className="text-xl font-bold mb-2 text-red-400">Error Loading Shipments</h2>
          <p className="text-slate-300 text-sm">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-[#070b17] overflow-hidden select-none">
      {/* Main 3D Globe */}
      <div className="absolute inset-0 z-0">
        {isLoading ? (
          <GlobeLoadingFallback />
        ) : (
          <TrackerGlobe
            shipments={filteredShipments}
            onRefresh={handleRefresh}
            onSelect={handleSelect}
            selectedId={selectedShipment?.id || null}
            hoveredId={hoveredId}
            onHover={setHoveredId}
            onGhostPositionsUpdate={handleGhostPositionsUpdate}
          />
        )}
      </div>

      {/* Atmospheric depth vignette */}
      <div className="globe-atmosphere" />

      {/* ── Top bar: Global Search (top-center) ──────────────── */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50">
        <GlobalSearch
          shipments={shipments}
          onSelectShipment={handleSelect}
        />
      </div>

      {/* Filter Panel (top-left) */}
      <FilterPanel
        filters={filters}
        onFiltersChange={setFilters}
        tenants={tenants}
        totalCount={shipments.length}
        filteredCount={filteredShipments.length}
      />

      {/* Radar / Live Status Card */}
      <div className="fixed top-1/2 -translate-y-8 left-[300px] z-40 hidden lg:block">
        <RadarWidget
          selectedShipment={selectedShipment}
          onRefreshLive={handleRefresh}
          isRefreshing={refreshMutation.isPending}
        />
      </div>

      {/* Shipment Detail Panel (right side) */}
      {selectedShipment && (
        <ShipmentPanel
          shipment={selectedShipment}
          onClose={() => setSelectedShipment(null)}
          onRefresh={handleRefresh}
          isRefreshing={refreshMutation.isPending}
          refreshError={refreshMutation.error}
          ghostPosition={
            selectedGhost
              ? { lng: selectedGhost.lng, lat: selectedGhost.lat, fraction: selectedGhost.fraction }
              : null
          }
        />
      )}

      {/* Mini Globe (bottom-right) */}
      {!isLoading && (
        <MiniGlobe
          shipments={filteredShipments}
          onRecenter={() => {
            handleSelect(null);
          }}
        />
      )}

      {/* Legend (bottom-left) */}
      <div className="fixed bottom-6 left-6 z-50">
        <div className="glass-panel px-4 py-3 text-[11px] text-slate-300 space-y-2 shadow-2xl">
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-0.5 rounded shadow-[0_0_6px_#22d3ee]" style={{ backgroundColor: '#22d3ee' }} />
            <span className="font-medium text-slate-200">Air</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-0.5 rounded shadow-[0_0_6px_#14b8a6]" style={{ backgroundColor: '#14b8a6' }} />
            <span className="font-medium text-slate-200">Sea</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-0.5 rounded shadow-[0_0_6px_#f59e0b]" style={{ backgroundColor: '#f59e0b' }} />
            <span className="font-medium text-slate-200">Road</span>
          </div>
          <div className="border-t border-white/10 pt-2 flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full shadow-[0_0_6px_#10b981]" style={{ backgroundColor: '#10b981' }} />
            <span className="font-medium text-slate-200">On-Time</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full shadow-[0_0_6px_#ef4444]" style={{ backgroundColor: '#ef4444' }} />
            <span className="font-medium text-slate-200">Delay / Exception</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-0.5 rounded shadow-[0_0_6px_#ef4444]" style={{ backgroundColor: '#ef4444' }} />
            <span className="font-medium text-slate-200">Delayed Route</span>
          </div>
        </div>
      </div>

      {/* Toast notification on refresh */}
      {refreshMutation.isSuccess && <Toast message="Live tracking status updated" />}
    </div>
  );
}

/* ── Success Toast ──────────────────────────────────────────── */
function Toast({ message }: { message: string }) {
  const [visible, setVisible] = useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-5 right-5 z-[100] px-4 py-2.5 rounded-xl bg-cyan-500/90 backdrop-blur-md text-white text-xs font-semibold shadow-[0_0_25px_rgba(34,211,238,0.5)] border border-cyan-300/40">
      ✓ {message}
    </div>
  );
}

/* ── QueryClient Provider ───────────────────────────────────── */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default function TrackerPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <TrackerPageInner />
    </QueryClientProvider>
  );
}
