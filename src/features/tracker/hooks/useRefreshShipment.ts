/**
 * Dexpert Flow — Single shipment refresh mutation
 *
 * Calls the "Fetch Live Status" action and updates the cached shipment.
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Shipment } from '../types';
import { mockRefreshShipment } from '../api/shipmentsApi';
import { SHIPMENTS_QUERY_KEY } from './useShipments';

export function useRefreshShipment() {
  const queryClient = useQueryClient();

  return useMutation<Shipment, Error, string>({
    mutationFn: async (id: string) => {
      // ── Mock implementation ──────────────────────────────
      return mockRefreshShipment(id);

      // ── Future real API implementation ───────────────────
      // const res = await fetch(`/api/shipments/${id}/refresh`, { method: 'POST' });
      // if (!res.ok) throw new Error('Failed to refresh shipment');
      // return mapApiToShipment(await res.json());
    },
    onSuccess: (updatedShipment) => {
      // Update the shipment in the cached list
      queryClient.setQueryData<Shipment[]>(SHIPMENTS_QUERY_KEY, (old) => {
        if (!old) return [updatedShipment];
        return old.map((s) =>
          s.id === updatedShipment.id ? updatedShipment : s
        );
      });
    },
  });
}
