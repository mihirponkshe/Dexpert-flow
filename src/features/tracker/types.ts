/**
 * Dexpert Flow — Core domain types
 *
 * These types define the data contract between the frontend and any future API.
 * Only `id`, `tenantId`, `medium`, `status`, `origin`, and `destination` are required.
 */

export type Medium = 'air' | 'sea' | 'road';
export type Status = 'on_time' | 'delayed' | 'exception';

export interface Place {
  name: string;
  code?: string;
  lng: number;
  lat: number;
}

export interface LastKnown {
  lng: number;
  lat: number;
  /** ISO 8601 timestamp */
  at: string;
  /** Speed in knots (1 knot ≈ 1.852 km/h) */
  speedKts?: number;
}

export interface Shipment {
  id: string;
  tenantId: string;
  tenantName: string;
  /** BL / AWB / container number */
  reference: string;
  medium: Medium;
  status: Status;
  origin: Place;
  destination: Place;
  /** Optional precomputed [lng, lat] path (sea/road) */
  route?: [number, number][];
  lastKnown?: LastKnown;
  /** ISO 8601 ETA timestamp */
  etaAt?: string;
  /** 'mock' now; carrier/RPA name later */
  source: string;
}

/** Filter state for the tracker UI */
export interface TrackerFilters {
  mediums: Set<Medium>;
  tenantIds: Set<string>;
  statuses: Set<Status>;
  actionRequiredOnly: boolean;
}

/** Tenant info derived from shipment data */
export interface Tenant {
  id: string;
  name: string;
}
