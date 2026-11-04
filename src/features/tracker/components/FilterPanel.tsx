/**
 * Dexpert Flow — Filter Panel
 *
 * Glassmorphism floating panel with medium, tenant, and status filters.
 */

'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plane, Ship, Truck, ChevronDown, Search, X } from 'lucide-react';
import { Medium, Status, TrackerFilters, Tenant } from '../types';
import { MEDIUM_COLORS, STATUS_COLORS } from '../constants';

interface FilterPanelProps {
  filters: TrackerFilters;
  onFiltersChange: (filters: TrackerFilters) => void;
  tenants: Tenant[];
  totalCount: number;
  filteredCount: number;
}

const MEDIUM_CONFIG: { key: Medium; label: string; Icon: typeof Plane }[] = [
  { key: 'air', label: 'Air', Icon: Plane },
  { key: 'sea', label: 'Sea', Icon: Ship },
  { key: 'road', label: 'Road', Icon: Truck },
];

export default function FilterPanel({
  filters,
  onFiltersChange,
  tenants,
  totalCount,
  filteredCount,
}: FilterPanelProps) {
  const [tenantDropdownOpen, setTenantDropdownOpen] = useState(false);
  const [tenantSearch, setTenantSearch] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* ── Close dropdown on outside click ──────────────────────── */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setTenantDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ── Handlers ─────────────────────────────────────────────── */
  const toggleMedium = (m: Medium) => {
    const next = new Set(filters.mediums);
    if (next.has(m)) {
      next.delete(m);
    } else {
      next.add(m);
    }
    onFiltersChange({ ...filters, mediums: next });
  };

  const toggleTenant = (id: string) => {
    const next = new Set(filters.tenantIds);
    if (id === '__all__') {
      // Toggle all
      if (next.size === tenants.length) {
        next.clear();
        // Keep at least all selected
        tenants.forEach((t) => next.add(t.id));
      } else {
        tenants.forEach((t) => next.add(t.id));
      }
    } else if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onFiltersChange({ ...filters, tenantIds: next });
  };

  const toggleStatus = (s: Status) => {
    const next = new Set(filters.statuses);
    if (next.has(s)) {
      next.delete(s);
    } else {
      next.add(s);
    }
    onFiltersChange({ ...filters, statuses: next });
  };

  const filteredTenants = useMemo(() => {
    if (!tenantSearch) return tenants;
    const q = tenantSearch.toLowerCase();
    return tenants.filter((t) => t.name.toLowerCase().includes(q));
  }, [tenants, tenantSearch]);

  const allTenantsSelected = filters.tenantIds.size === tenants.length;

  /* ── Mobile collapse ──────────────────────────────────────── */
  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed top-4 left-4 z-50 p-3 rounded-2xl bg-gray-900/80 backdrop-blur-xl border border-white/10 shadow-2xl text-white hover:bg-gray-800/80 transition-colors md:hidden"
        aria-label="Open filters"
      >
        <Search className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed top-4 left-4 z-50 w-72 rounded-2xl bg-gray-900/80 backdrop-blur-xl border border-white/10 shadow-2xl text-white">
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Dexpert Flow</h1>
            <p className="text-[11px] text-gray-400 mt-0.5">Live 3D Global Cargo Tracker</p>
          </div>
          <button
            onClick={() => setCollapsed(true)}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors md:hidden"
            aria-label="Collapse filters"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Medium Toggles */}
      <div className="px-4 pb-3">
        <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-2 font-medium">Medium</p>
        <div className="flex gap-2">
          {MEDIUM_CONFIG.map(({ key, label, Icon }) => {
            const active = filters.mediums.has(key);
            const color = MEDIUM_COLORS[key];
            return (
              <button
                key={key}
                onClick={() => toggleMedium(key)}
                className={`
                  flex-1 flex flex-col items-center gap-1 py-2 px-2 rounded-xl text-xs font-medium
                  transition-all duration-200 border
                  ${active
                    ? 'border-white/20 shadow-lg'
                    : 'border-transparent bg-white/5 opacity-50 hover:opacity-80'}
                `}
                style={active ? {
                  backgroundColor: `${color.hex}20`,
                  borderColor: `${color.hex}40`,
                  color: color.hex,
                  boxShadow: `0 0 20px ${color.hex}15`,
                } : undefined}
                aria-label={`Toggle ${label}`}
                aria-pressed={active}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tenant Dropdown */}
      <div className="px-4 pb-3" ref={dropdownRef}>
        <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-2 font-medium">Companies / Tenants</p>
        <div className="relative">
          <button
            onClick={() => setTenantDropdownOpen(!tenantDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors"
            aria-expanded={tenantDropdownOpen}
            aria-haspopup="listbox"
          >
            <span className="text-gray-300 truncate">
              {allTenantsSelected
                ? 'All Companies'
                : `${filters.tenantIds.size} selected`}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${
                tenantDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
          {tenantDropdownOpen && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="p-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={tenantSearch}
                    onChange={(e) => setTenantSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-7 pr-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/20"
                    aria-label="Search tenants"
                  />
                </div>
              </div>
              <div className="max-h-40 overflow-y-auto px-1 pb-1" role="listbox" aria-label="Tenants">
                {/* All option */}
                <button
                  onClick={() => toggleTenant('__all__')}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg hover:bg-white/10 transition-colors"
                  role="option"
                  aria-selected={allTenantsSelected}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                      allTenantsSelected
                        ? 'bg-cyan-500 border-cyan-400'
                        : 'border-gray-500'
                    }`}
                  >
                    {allTenantsSelected && (
                      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className="text-gray-200 font-medium">All</span>
                </button>
                {filteredTenants.map((t) => {
                  const checked = filters.tenantIds.has(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => toggleTenant(t.id)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg hover:bg-white/10 transition-colors"
                      role="option"
                      aria-selected={checked}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                          checked ? 'bg-cyan-500 border-cyan-400' : 'border-gray-500'
                        }`}
                      >
                        {checked && (
                          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span className="text-gray-300">{t.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Filters */}
      <div className="px-4 pb-3">
        <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-2 font-medium">Status</p>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => toggleStatus('on_time')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
              filters.statuses.has('on_time')
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
            aria-pressed={filters.statuses.has('on_time')}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: STATUS_COLORS.on_time.hex }}
            />
            On-Time
          </button>
          <button
            onClick={() => {
              // Toggle both delayed and exception together
              const hasEither = filters.statuses.has('delayed') || filters.statuses.has('exception');
              const next = new Set(filters.statuses);
              if (hasEither) {
                next.delete('delayed');
                next.delete('exception');
              } else {
                next.add('delayed');
                next.add('exception');
              }
              onFiltersChange({ ...filters, statuses: next });
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
              filters.statuses.has('delayed') || filters.statuses.has('exception')
                ? 'bg-red-500/15 text-red-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
            aria-pressed={filters.statuses.has('delayed') || filters.statuses.has('exception')}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: STATUS_COLORS.delayed.hex }}
            />
            Delay / Exception
          </button>
        </div>
      </div>

      {/* Count */}
      <div className="px-4 py-2.5 border-t border-white/5">
        <p className="text-[11px] text-gray-400">
          Showing <span className="text-white font-semibold">{filteredCount}</span> of{' '}
          <span className="text-gray-300">{totalCount}</span> shipments
        </p>
      </div>
    </div>
  );
}

