/**
 * Dexpert Flow — Shipments data hook
 *
 * THIS IS THE ONLY FILE TO CHANGE when connecting a real API.
 *
 * Current: reads from mock data via mockFetchShipments().
 * Future:  replace with a fetch() to your real endpoint and
 *          use mapApiToShipments() to normalize the response.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { Shipment } from '../types';
import { mockFetchShipments } from '../api/shipmentsApi';
import { mapApiToShipments } from '../api/mapApiToShipment';

const SHIPMENTS_QUERY_KEY = ['shipments'] as const;

export function useShipments() {
  return useQuery<Shipment[]>({
    queryKey: SHIPMENTS_QUERY_KEY,
    queryFn: async () => {
      // ── Mock implementation ──────────────────────────────
      const raw = await mockFetchShipments();
      return mapApiToShipments(raw);

      // ── Future real API implementation ───────────────────
      // const res = await fetch('/api/shipments', {
      //   headers: { Authorization: `Bearer ${token}` },
      // });
      // if (!res.ok) throw new Error('Failed to fetch shipments');
      // const raw = await res.json();
      // return mapApiToShipments(raw);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000,
  });
}

export { SHIPMENTS_QUERY_KEY };
