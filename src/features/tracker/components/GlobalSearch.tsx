/**
 * Dexpert Flow — Global Shipment Search
 *
 * Glassmorphic search bar that lets users search shipments by ID, reference,
 * tenant name, origin, destination, or status. Results appear in a dropdown;
 * clicking a result selects and flies to that shipment on the globe.
 */

'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Search, X, Plane, Ship, Truck } from 'lucide-react';
import { Shipment, Medium } from '../types';

interface GlobalSearchProps {
  /** All shipments (unfiltered) so we can search across everything */
  shipments: Shipment[];
  /** Called when a shipment result is clicked */
  onSelectShipment: (shipment: Shipment) => void;
}

const MEDIUM_ICON: Record<Medium, typeof Plane> = {
  air: Plane,
  sea: Ship,
  road: Truck,
};

const MEDIUM_COLOR: Record<Medium, string> = {
  air: '#22d3ee',
  sea: '#14b8a6',
  road: '#f59e0b',
};

export default function GlobalSearch({ shipments, onSelectShipment }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── Close on outside click ─────────────────────────────────── */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  /* ── Keyboard shortcut: Ctrl+K or Cmd+K to focus ────────────── */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  /* ── Filter results ─────────────────────────────────────────── */
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return shipments
      .filter((s) => {
        return (
          s.id.toLowerCase().includes(q) ||
          s.reference.toLowerCase().includes(q) ||
          s.tenantName.toLowerCase().includes(q) ||
          s.origin.name.toLowerCase().includes(q) ||
          (s.origin.code ?? '').toLowerCase().includes(q) ||
          s.destination.name.toLowerCase().includes(q) ||
          (s.destination.code ?? '').toLowerCase().includes(q) ||
          s.medium.toLowerCase().includes(q) ||
          s.status.replace('_', ' ').toLowerCase().includes(q)
        );
      })
      .slice(0, 8); // max 8 results
  }, [query, shipments]);

  const handleSelect = useCallback(
    (shipment: Shipment) => {
      onSelectShipment(shipment);
      setQuery('');
      setOpen(false);
    },
    [onSelectShipment]
  );

  const statusColor = (status: string) => {
    if (status === 'on_time') return '#10b981';
    return '#ef4444';
  };

  return (
    <div ref={wrapperRef} className="relative w-72">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search shipments… (Ctrl+K)"
          className="w-full pl-9 pr-8 py-2 rounded-xl glass-panel text-xs text-white placeholder-slate-400
                     border border-white/10 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20
                     outline-none transition-all bg-slate-900/60"
          aria-label="Search shipments"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setOpen(false);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {open && query.trim() && (
        <div className="absolute top-full mt-2 left-0 right-0 glass-panel border border-white/15 rounded-xl shadow-2xl overflow-hidden z-[60] max-h-[320px] overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-slate-400 text-xs">No shipments found for &quot;{query}&quot;</p>
            </div>
          ) : (
            <div className="py-1">
              {results.map((s) => {
                const MediumIcon = MEDIUM_ICON[s.medium];
                const mediumColor = MEDIUM_COLOR[s.medium];
                const stColor = statusColor(s.status);

                return (
                  <button
                    key={s.id}
                    onClick={() => handleSelect(s)}
                    className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-white/10 transition-colors text-left cursor-pointer"
                  >
                    {/* Medium Icon */}
                    <div
                      className="mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center border shrink-0"
                      style={{
                        borderColor: `${mediumColor}40`,
                        backgroundColor: `${mediumColor}15`,
                      }}
                    >
                      <MediumIcon className="w-3.5 h-3.5" style={{ color: mediumColor }} />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white truncate">{s.reference}</span>
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: stColor, boxShadow: `0 0 4px ${stColor}` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-300 mt-0.5 truncate">
                        {s.origin.name} → {s.destination.name}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 capitalize">
                        {s.tenantName} • {s.medium} • {s.status.replace('_', ' ')}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
