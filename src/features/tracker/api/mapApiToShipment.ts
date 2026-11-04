/**
 * Dexpert Flow — API Response Normalizer
 *
 * Maps raw API responses to the internal Shipment type.
 *
 * Currently an identity function for mock data.
 * When connecting a real API:
 * 1. Define the raw API response type (e.g., CarrierApiResponse)
 * 2. Map each field to the Shipment interface
 * 3. Handle missing/optional fields with defaults
 *
 * Example future implementation:
 * ```ts
 * interface CarrierApiResponse {
 *   tracking_id: string;
 *   company_id: string;
 *   company_name: string;
 *   bill_of_lading: string;
 *   transport_mode: 'AIR' | 'SEA' | 'ROAD';
 *   current_status: string;
 *   pickup: { city: string; country: string; longitude: number; latitude: number };
 *   delivery: { city: string; country: string; longitude: number; latitude: number };
 *   waypoints?: Array<{ longitude: number; latitude: number }>;
 *   last_position?: { longitude: number; latitude: number; timestamp: string; speed_knots?: number };
 *   estimated_arrival?: string;
 *   data_source: string;
 * }
 *
 * export function mapApiToShipment(raw: CarrierApiResponse): Shipment {
 *   return {
 *     id: raw.tracking_id,
 *     tenantId: raw.company_id,
 *     tenantName: raw.company_name,
 *     reference: raw.bill_of_lading,
 *     medium: raw.transport_mode.toLowerCase() as Medium,
 *     status: mapStatus(raw.current_status),
 *     origin: { name: raw.pickup.city, lng: raw.pickup.longitude, lat: raw.pickup.latitude },
 *     destination: { name: raw.delivery.city, lng: raw.delivery.longitude, lat: raw.delivery.latitude },
 *     route: raw.waypoints?.map(w => [w.longitude, w.latitude] as [number, number]),
 *     lastKnown: raw.last_position ? {
 *       lng: raw.last_position.longitude,
 *       lat: raw.last_position.latitude,
 *       at: raw.last_position.timestamp,
 *       speedKts: raw.last_position.speed_knots,
 *     } : undefined,
 *     etaAt: raw.estimated_arrival,
 *     source: raw.data_source,
 *   };
 * }
 * ```
 */

import { Shipment } from '../types';

/**
 * Identity mapper for mock data.
 * Replace this with actual field mapping when connecting a real API.
 */
export function mapApiToShipment(raw: Shipment): Shipment {
  return raw;
}

/**
 * Batch mapper convenience.
 */
export function mapApiToShipments(rawList: Shipment[]): Shipment[] {
  return rawList.map(mapApiToShipment);
}
