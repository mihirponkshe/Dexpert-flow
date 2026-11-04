/**
 * Dexpert Flow — Tracker Page
 *
 * Main page that wires together the TrackerMap, FilterPanel, ShipmentPanel,
 * MiniGlobe, and data hooks. All data flows through this page.
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
import type { GhostPosition } from '@/features/tracker/hooks/useGhostPosition';

/* ── Dynamic imports for client-only map components ─────────── */
const TrackerMap = dynamic(
  () => import('@/features/tracker/components/TrackerMap'),
  { ssr: false, loading: () => <MapLoadingFallback /> }
);

const MiniGlobe = dynamic(
  () => import('@/features/tracker/components/MiniGlobe'),
  { ssr: false }
);

function MapLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full bg-gray-950 text-white">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400 text-sm">Loading 3D Globe…</p>
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

/* ── Inner component (requires QueryClient context) ─────────── */
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

  /* ── Update selected shipment when data changes ───────────── */
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
    async (id: string): Promise<Shipment> => {
      return refreshMutation.mutateAsync(id);
    },
    [refreshMutation]
  );

  const handleGhostPositionsUpdate = useCallback((ghosts: Map<string, GhostPosition>) => {
    ghostPositionsRef.current = ghosts;
  }, []);

  const selectedGhost = selectedShipment
    ? ghostPositionsRef.current.get(selectedShipment.id)
    : null;

  /* ── Loading / Error states ───────────────────────────────── */
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950 text-white">
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold mb-2 text-red-400">Error Loading Data</h2>
          <p className="text-gray-400">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-gray-950 overflow-hidden">
      {/* Main Map */}
      <div className="absolute inset-0">
        {isLoading ? (
          <MapLoadingFallback />
        ) : (
          <TrackerMap
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

      {/* Filter Panel (top-left) */}
      <FilterPanel
        filters={filters}
        onFiltersChange={setFilters}
        tenants={tenants}
        totalCount={shipments.length}
        filteredCount={filteredShipments.length}
      />

      {/* Shipment Detail Panel (right side or bottom sheet) */}
      {selectedShipment && (
        <ShipmentPanel
          shipment={selectedShipment}
          onClose={() => setSelectedShipment(null)}
          onRefresh={handleRefresh}
          isRefreshing={refreshMutation.isPending}
          refreshError={refreshMutation.error}
          ghostPosition={selectedGhost ? { lng: selectedGhost.lng, lat: selectedGhost.lat, fraction: selectedGhost.fraction } : null}
        />
      )}

      {/* Mini Globe (bottom-right, hidden on mobile) */}
      {!isLoading && (
        <MiniGlobe
          shipments={filteredShipments}
          mainLng={30}
          mainLat={20}
          onRecenter={() => {
            // Re-centre handled by main map view state
          }}
        />
      )}

      {/* Legend (bottom-left) */}
      <div className="fixed bottom-6 left-4 z-40 hidden md:block">
        <div className="px-3 py-2.5 rounded-xl bg-gray-900/80 backdrop-blur-xl border border-white/10 text-[10px] text-gray-400 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-5 h-0.5 rounded" style={{ backgroundColor: '#22d3ee' }} />
            <span>Air</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-0.5 rounded" style={{ backgroundColor: '#14b8a6' }} />
            <span>Sea</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-0.5 rounded" style={{ backgroundColor: '#f59e0b' }} />
            <span>Road</span>
          </div>
          <div className="border-t border-white/5 pt-1.5 mt-1.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10b981' }} />
            <span>On-Time</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#ef4444' }} />
            <span>Delayed / Exception</span>
          </div>
        </div>
      </div>

      {/* Toast for refresh success */}
      {refreshMutation.isSuccess && (
        <Toast message="Live status updated" />
      )}
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
    <div className="fixed top-4 right-4 z-[100] px-4 py-2.5 rounded-xl bg-emerald-500/90 backdrop-blur text-white text-sm font-medium shadow-lg animate-in slide-in-from-top-2 fade-in">
      ✓ {message}
    </div>
  );
}

/* ── Page with QueryClient Provider ─────────────────────────── */
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

