/**
 * Dexpert Flow — Shipment Detail Panel
 *
 * Shows details of the selected shipment with "Fetch Live Status" button.
 * Glassmorphism design, responsive bottom sheet on mobile.
 */

'use client';

import React, { useEffect, useCallback } from 'react';
import { Plane, Ship, Truck, X, ArrowRight, RefreshCw, Clock, MapPin, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { Shipment, Medium, Status } from '../types';
import { MEDIUM_COLORS, STATUS_COLORS } from '../constants';

interface ShipmentPanelProps {
  shipment: Shipment;
  onClose: () => void;
  onRefresh: (id: string) => Promise<Shipment>;
  isRefreshing: boolean;
  refreshError: Error | null;
  /** Ghost position info for "Estimated position" display */
  ghostPosition?: { lng: number; lat: number; fraction: number } | null;
}

const MEDIUM_ICONS: Record<Medium, typeof Plane> = {
  air: Plane,
  sea: Ship,
  road: Truck,
};

const MEDIUM_LABELS: Record<Medium, string> = {
  air: 'Air Freight',
  sea: 'Sea Freight',
  road: 'Road Transport',
};

const STATUS_LABELS: Record<Status, string> = {
  on_time: 'On Time',
  delayed: 'Delayed',
  exception: 'Exception',
};

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatETA(isoString?: string): string {
  if (!isoString) return 'Unknown';
  const date = new Date(isoString);
  const now = new Date();
  if (date < now) return 'Overdue';
  const diff = date.getTime() - now.getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 24) return `~${hours}h`;
  const days = Math.floor(hours / 24);
  return `~${days}d ${hours % 24}h`;
}

export default function ShipmentPanel({
  shipment,
  onClose,
  onRefresh,
  isRefreshing,
  refreshError,
  ghostPosition,
}: ShipmentPanelProps) {
  const MediumIcon = MEDIUM_ICONS[shipment.medium];
  const mediumColor = MEDIUM_COLORS[shipment.medium];
  const statusColor = STATUS_COLORS[shipment.status];
  const isAlert = shipment.status === 'delayed' || shipment.status === 'exception';

  /* ── Escape key handler ───────────────────────────────────── */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  /* ── Live-updating relative time ──────────────────────────── */
  const [lastUpdatedText, setLastUpdatedText] = React.useState(
    shipment.lastKnown ? formatRelativeTime(shipment.lastKnown.at) : 'Never'
  );

  useEffect(() => {
    if (!shipment.lastKnown) {
      setLastUpdatedText('Never');
      return;
    }
    setLastUpdatedText(formatRelativeTime(shipment.lastKnown.at));
    const interval = setInterval(() => {
      setLastUpdatedText(formatRelativeTime(shipment.lastKnown!.at));
    }, 10000);
    return () => clearInterval(interval);
  }, [shipment.lastKnown]);

  const handleRefresh = async () => {
    try {
      await onRefresh(shipment.id);
    } catch {
      // Error is handled by the mutation state
    }
  };

  return (
    <>
      {/* Desktop: Right side panel */}
      <div
        className="
          fixed z-50 bg-gray-900/85 backdrop-blur-xl border border-white/10 shadow-2xl text-white
          /* Desktop */
          right-4 top-4 w-80 rounded-2xl
          /* Mobile: bottom sheet */
          max-md:right-0 max-md:left-0 max-md:top-auto max-md:bottom-0 max-md:w-full max-md:rounded-t-2xl max-md:rounded-b-none max-md:max-h-[60vh] max-md:overflow-y-auto
        "
        role="dialog"
        aria-label="Shipment details"
      >
        {/* Handle for mobile */}
        <div className="flex justify-center py-2 md:hidden">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between p-4 pb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="p-2 rounded-xl flex-shrink-0"
              style={{ backgroundColor: `${mediumColor.hex}20` }}
            >
              <MediumIcon
                className="w-5 h-5"
                style={{ color: mediumColor.hex }}
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{shipment.reference}</p>
              <p className="text-[11px] text-gray-400 truncate">{shipment.tenantName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
            aria-label="Close panel"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Status Badge */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                isAlert
                  ? 'bg-red-500/15 text-red-400'
                  : 'bg-emerald-500/15 text-emerald-400'
              }`}
            >
              {isAlert ? (
                <AlertTriangle className="w-3 h-3" />
              ) : (
                <CheckCircle2 className="w-3 h-3" />
              )}
              {STATUS_LABELS[shipment.status]}
            </span>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full border"
              style={{
                color: mediumColor.hex,
                borderColor: `${mediumColor.hex}40`,
                backgroundColor: `${mediumColor.hex}10`,
              }}
            >
              {MEDIUM_LABELS[shipment.medium]}
            </span>
          </div>
        </div>

        {/* Route */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1.5 text-gray-300">
              <MapPin className="w-3.5 h-3.5 text-gray-500" />
              <span className="truncate" title={shipment.origin.name}>{shipment.origin.name}</span>
              {shipment.origin.code && (
                <span className="text-[10px] text-gray-500">({shipment.origin.code})</span>
              )}
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
            <div className="flex items-center gap-1.5 text-gray-300">
              <span className="truncate" title={shipment.destination.name}>{shipment.destination.name}</span>
              {shipment.destination.code && (
                <span className="text-[10px] text-gray-500">({shipment.destination.code})</span>
              )}
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="px-4 pb-3 grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">ETA</p>
            <p className="text-sm text-gray-200 font-medium">{formatETA(shipment.etaAt)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Last Updated</p>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-gray-500" />
              <p className="text-sm text-gray-200 font-medium">{lastUpdatedText}</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Source</p>
            <p className="text-sm text-gray-200">{shipment.source}</p>
          </div>
          {ghostPosition && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Progress</p>
              <p className="text-sm text-gray-200">{Math.round(ghostPosition.fraction * 100)}%</p>
            </div>
          )}
        </div>

        {/* Estimated Position Note */}
        {shipment.lastKnown && (
          <div className="mx-4 mb-3 px-3 py-2 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
            <p className="text-[11px] text-yellow-400/80">
              ⚡ Position is estimated until refreshed
            </p>
          </div>
        )}

        {/* Refresh Error */}
        {refreshError && (
          <div className="mx-4 mb-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-[11px] text-red-400">
              Failed to refresh: {refreshError.message}
            </p>
          </div>
        )}

        {/* Fetch Live Status Button */}
        <div className="px-4 pb-4">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`
              w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
              transition-all duration-200
              ${isRefreshing
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'text-white shadow-lg hover:shadow-xl active:scale-[0.98]'}
            `}
            style={
              !isRefreshing
                ? {
                    background: `linear-gradient(135deg, ${mediumColor.hex}, ${mediumColor.hexSecondary})`,
                    boxShadow: `0 4px 20px ${mediumColor.hex}30`,
                  }
                : undefined
            }
            aria-label="Fetch live status for this shipment"
          >
            {isRefreshing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Fetching Live Status…
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Fetch Live Status
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

