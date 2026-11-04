/**
 * Dexpert Flow — Unit tests for filter logic
 */

import { describe, it, expect } from 'vitest';
import { Shipment, TrackerFilters, Medium, Status } from '../types';

function applyFilters(shipments: Shipment[], filters: TrackerFilters): Shipment[] {
  return shipments.filter((s) => {
    if (filters.mediums.size > 0 && !filters.mediums.has(s.medium)) return false;
    if (filters.tenantIds.size > 0 && !filters.tenantIds.has(s.tenantId)) return false;
    if (filters.statuses.size > 0 && !filters.statuses.has(s.status)) return false;
    if (filters.actionRequiredOnly && s.status === 'on_time') return false;
    return true;
  });
}

const mockShipments: Shipment[] = [
  {
    id: '1', tenantId: 't1', tenantName: 'T1', reference: 'R1',
    medium: 'air', status: 'on_time',
    origin: { name: 'A', lng: 0, lat: 0 },
    destination: { name: 'B', lng: 1, lat: 1 },
    source: 'mock',
  },
  {
    id: '2', tenantId: 't2', tenantName: 'T2', reference: 'R2',
    medium: 'sea', status: 'delayed',
    origin: { name: 'C', lng: 2, lat: 2 },
    destination: { name: 'D', lng: 3, lat: 3 },
    source: 'mock',
  },
  {
    id: '3', tenantId: 't1', tenantName: 'T1', reference: 'R3',
    medium: 'road', status: 'exception',
    origin: { name: 'E', lng: 4, lat: 4 },
    destination: { name: 'F', lng: 5, lat: 5 },
    source: 'mock',
  },
  {
    id: '4', tenantId: 't2', tenantName: 'T2', reference: 'R4',
    medium: 'air', status: 'on_time',
    origin: { name: 'G', lng: 6, lat: 6 },
    destination: { name: 'H', lng: 7, lat: 7 },
    source: 'mock',
  },
];

const allFilters: TrackerFilters = {
  mediums: new Set<Medium>(['air', 'sea', 'road']),
  tenantIds: new Set(['t1', 't2']),
  statuses: new Set<Status>(['on_time', 'delayed', 'exception']),
  actionRequiredOnly: false,
};

describe('applyFilters', () => {
  it('returns all shipments with all filters enabled', () => {
    expect(applyFilters(mockShipments, allFilters)).toHaveLength(4);
  });

  it('filters by medium', () => {
    const filters = { ...allFilters, mediums: new Set<Medium>(['air']) };
    const result = applyFilters(mockShipments, filters);
    expect(result).toHaveLength(2);
    expect(result.every((s) => s.medium === 'air')).toBe(true);
  });

  it('filters by tenant', () => {
    const filters = { ...allFilters, tenantIds: new Set(['t1']) };
    const result = applyFilters(mockShipments, filters);
    expect(result).toHaveLength(2);
    expect(result.every((s) => s.tenantId === 't1')).toBe(true);
  });

  it('filters by status', () => {
    const filters = { ...allFilters, statuses: new Set<Status>(['delayed', 'exception']) };
    const result = applyFilters(mockShipments, filters);
    expect(result).toHaveLength(2);
    expect(result.every((s) => s.status !== 'on_time')).toBe(true);
  });

  it('actionRequiredOnly hides on_time', () => {
    const filters = { ...allFilters, actionRequiredOnly: true };
    const result = applyFilters(mockShipments, filters);
    expect(result).toHaveLength(2);
    expect(result.every((s) => s.status !== 'on_time')).toBe(true);
  });

  it('combines multiple filters', () => {
    const filters: TrackerFilters = {
      mediums: new Set<Medium>(['air']),
      tenantIds: new Set(['t1']),
      statuses: new Set<Status>(['on_time']),
      actionRequiredOnly: false,
    };
    const result = applyFilters(mockShipments, filters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });
});
