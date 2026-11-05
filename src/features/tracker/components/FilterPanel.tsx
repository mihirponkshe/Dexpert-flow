/**
 * Dexpert Flow — Filter Panel
 *
 * Glassmorphic floating control panel matching IMAGE B.
 */

'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plane, Ship, Truck, ChevronDown, Search, X } from 'lucide-react';
import { Medium, Status, TrackerFilters, Tenant } from '../types';

interface FilterPanelProps {
  filters: TrackerFilters;
  onFiltersChange: (filters: TrackerFilters) => void;
  tenants: Tenant[];
  totalCount: number;
  filteredCount: number;
}

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

  /* Close dropdown on outside click */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setTenantDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* Master medium toggle: if all 3 are on, turn off; otherwise turn all on */
  const allMediumsActive = filters.mediums.size === 3;
  const toggleAllMediums = () => {
    if (allMediumsActive) {
      onFiltersChange({ ...filters, mediums: new Set() });
    } else {
      onFiltersChange({ ...filters, mediums: new Set<Medium>(['air', 'sea', 'road']) });
    }
  };

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
      if (next.size === tenants.length) {
        next.clear();
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

  const isDelayedOrExceptionActive = filters.statuses.has('delayed') || filters.statuses.has('exception');

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed top-5 left-5 z-50 p-3 glass-panel text-white hover:bg-white/10 transition-colors md:hidden"
        aria-label="Open filters"
      >
        <Search className="w-5 h-5 text-cyan-400" />
      </button>
    );
  }

  return (
    <div className="fixed top-5 left-5 z-50 w-[270px] glass-panel text-white shadow-[0_25px_60px_rgba(0,0,0,0.6)] select-none">
      {/* Title Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[17px] font-bold tracking-tight text-white">Dexpert Flow</h1>
            <p className="text-[11px] text-slate-300 font-normal mt-0.5">Live 3D Global Cargo Tracker</p>
          </div>
          <button
            onClick={() => setCollapsed(true)}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors md:hidden"
            aria-label="Collapse filters"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Medium Section Header with Master Switch */}
      <div className="px-4 pb-2 flex items-center justify-between">
        <span className="text-[12px] font-semibold text-slate-200">Medium</span>
        {/* Master Switch */}
        <button
          type="button"
          onClick={toggleAllMediums}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
            allMediumsActive ? 'bg-emerald-400' : 'bg-slate-700'
          }`}
          role="switch"
          aria-checked={allMediumsActive}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out mt-0.5 ml-0.5 ${
              allMediumsActive ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Medium 3 Tiles */}
      <div className="px-4 pb-3 grid grid-cols-3 gap-2">
        {/* Air Tile */}
        <button
          onClick={() => toggleMedium('air')}
          className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl transition-all duration-200 border cursor-pointer ${
            filters.mediums.has('air')
              ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.25)]'
              : 'border-white/5 bg-white/5 text-slate-400 hover:border-white/15 hover:text-slate-200'
          }`}
        >
          <Plane className="w-5 h-5 mb-1" />
          <span className="text-[11px] font-medium">Air</span>
        </button>

        {/* Sea Tile */}
        <button
          onClick={() => toggleMedium('sea')}
          className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl transition-all duration-200 border cursor-pointer ${
            filters.mediums.has('sea')
              ? 'border-teal-400/60 bg-teal-500/20 text-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.25)]'
              : 'border-white/5 bg-white/5 text-slate-400 hover:border-white/15 hover:text-slate-200'
          }`}
        >
          <Ship className="w-5 h-5 mb-1" />
          <span className="text-[11px] font-medium">Sea</span>
        </button>

        {/* Road Tile */}
        <button
          onClick={() => toggleMedium('road')}
          className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl transition-all duration-200 border cursor-pointer ${
            filters.mediums.has('road')
              ? 'border-amber-400/60 bg-amber-500/20 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
              : 'border-white/5 bg-white/5 text-slate-400 hover:border-white/15 hover:text-slate-200'
          }`}
        >
          <Truck className="w-5 h-5 mb-1" />
          <span className="text-[11px] font-medium">Road</span>
        </button>
      </div>

      {/* Companies / Tenants Dropdown */}
      <div className="px-4 pb-3" ref={dropdownRef}>
        <div className="relative">
          <button
            onClick={() => setTenantDropdownOpen(!tenantDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/60 border border-white/10 text-xs text-slate-200 hover:border-white/20 transition-colors cursor-pointer"
            aria-expanded={tenantDropdownOpen}
          >
            <span className="truncate">
              {allTenantsSelected
                ? 'Companies / Tenants'
                : `${filters.tenantIds.size} company selected`}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                tenantDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {tenantDropdownOpen && (
            <div className="absolute top-full mt-1.5 left-0 right-0 glass-panel bg-slate-900/95 border border-white/15 rounded-xl shadow-2xl overflow-hidden z-50 p-1.5">
              <div className="relative mb-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                <input
                  type="text"
                  value={tenantSearch}
                  onChange={(e) => setTenantSearch(e.target.value)}
                  placeholder="Filter company..."
                  className="w-full pl-6 pr-2 py-1 text-xs bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/40"
                />
              </div>
              <div className="max-h-36 overflow-y-auto space-y-0.5">
                <button
                  onClick={() => toggleTenant('__all__')}
                  className="w-full flex items-center gap-2 px-2 py-1 text-xs rounded-lg hover:bg-white/10 text-slate-200 transition-colors text-left"
                >
                  <span className={`w-3 h-3 rounded flex items-center justify-center border ${allTenantsSelected ? 'bg-cyan-500 border-cyan-400' : 'border-slate-500'}`}>
                    {allTenantsSelected && <span className="text-[9px] text-white">✓</span>}
                  </span>
                  <span>All Companies</span>
                </button>
                {filteredTenants.map((t) => {
                  const checked = filters.tenantIds.has(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => toggleTenant(t.id)}
                      className="w-full flex items-center gap-2 px-2 py-1 text-xs rounded-lg hover:bg-white/10 text-slate-300 transition-colors text-left"
                    >
                      <span className={`w-3 h-3 rounded flex items-center justify-center border ${checked ? 'bg-cyan-500 border-cyan-400' : 'border-slate-500'}`}>
                        {checked && <span className="text-[9px] text-white">✓</span>}
                      </span>
                      <span className="truncate">{t.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Section */}
      <div className="px-4 pb-3">
        <span className="text-[12px] font-semibold text-slate-200 block mb-2">Status</span>
        <div className="space-y-1.5">
          {/* On-Time Chip */}
          <button
            onClick={() => toggleStatus('on_time')}
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border cursor-pointer ${
              filters.statuses.has('on_time')
                ? 'border-cyan-500/40 bg-cyan-950/40 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.15)]'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
            </span>
            <span>On-Time</span>
          </button>

          {/* Delay / Exception Chip */}
          <button
            onClick={() => {
              const next = new Set(filters.statuses);
              if (isDelayedOrExceptionActive) {
                next.delete('delayed');
                next.delete('exception');
              } else {
                next.add('delayed');
                next.add('exception');
              }
              onFiltersChange({ ...filters, statuses: next });
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border cursor-pointer ${
              isDelayedOrExceptionActive
                ? 'border-red-500/40 bg-red-950/40 text-red-200 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-400 shadow-[0_0_6px_#ef4444]" />
            </span>
            <span>Delay / Exception</span>
          </button>
        </div>
      </div>

      {/* Shipment Counter */}
      <div className="px-4 py-2 border-t border-white/5 text-[11px] text-slate-400">
        Showing <span className="text-white font-medium">{filteredCount}</span> of{' '}
        <span className="text-slate-300">{totalCount}</span> shipments
      </div>
    </div>
  );
}
