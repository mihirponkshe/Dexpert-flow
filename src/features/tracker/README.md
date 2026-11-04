# Dexpert Flow — Live 3D Global Cargo Tracker

Interactive 3D globe showing air, sea, and road shipments with glowing routes, status pins, and a floating control panel.

## Quick Start

```bash
cd dexpert-flow
npm install
npm run dev
```

Then open [http://localhost:3000/tracker](http://localhost:3000/tracker).

## Basemap

The map uses [CARTO's dark-matter](https://carto.com/basemaps) vector style by default (free for development/low-traffic use). For production, set `NEXT_PUBLIC_MAP_STYLE_URL` in `.env.local` to a hosted tile provider with proper licensing terms (e.g., MapTiler, Stadia Maps).

## Architecture

```
/features/tracker
  /types.ts                      — Core domain types (Shipment, Medium, Status, etc.)
  /constants.ts                  — All visual/physical constants in one place
  /data/shipments.mock.ts        — 24 sample shipments
  /api/shipmentsApi.ts           — Mock API functions
  /api/mapApiToShipment.ts       — Response normalizer (identity for mock)
  /hooks/useShipments.ts         — react-query hook (ONLY file to change for real API)
  /hooks/useRefreshShipment.ts   — Mutation for "Fetch Live Status"
  /hooks/useGhostPosition.ts    — Estimated position computation
  /components/TrackerMap.tsx     — "Dumb" map (data via props only)
  /components/FilterPanel.tsx    — Medium, tenant, status filters
  /components/ShipmentPanel.tsx  — Shipment detail panel
  /components/MiniGlobe.tsx      — Overview inset globe
  /layers/arcs.ts                — Air route arc layers
  /layers/routes.ts              — Sea/road path layers
  /layers/pins.ts                — Origin/destination pins
  /layers/ghost.ts               — Estimated position indicators
  /layers/lastKnown.ts           — Pulsing beacon at last known position
  /lib/geo.ts                    — Geographic utilities
```

The map is "dumb" — it receives `Shipment[]` via props and never fetches data.

## Connecting a Real API

Changes needed in **only 3 files** (no component/layer/map changes):

### 1. `hooks/useShipments.ts`

Replace the mock call with a real fetch:

```typescript
export function useShipments() {
  return useQuery<Shipment[]>({
    queryKey: ['shipments'],
    queryFn: async () => {
      const res = await fetch('/api/shipments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch shipments');
      const raw = await res.json();
      return mapApiToShipments(raw);
    },
    staleTime: 5 * 60 * 1000,
  });
}
```

### 2. `api/mapApiToShipment.ts`

Map your API's response shape to the `Shipment` interface:

```typescript
export function mapApiToShipment(raw: CarrierApiResponse): Shipment {
  return {
    id: raw.tracking_id,
    tenantId: raw.company_id,
    tenantName: raw.company_name,
    reference: raw.bill_of_lading,
    medium: raw.transport_mode.toLowerCase() as Medium,
    status: mapStatus(raw.current_status),
    origin: { name: raw.pickup.city, lng: raw.pickup.longitude, lat: raw.pickup.latitude },
    destination: { name: raw.delivery.city, lng: raw.delivery.longitude, lat: raw.delivery.latitude },
    route: raw.waypoints?.map(w => [w.longitude, w.latitude] as [number, number]),
    lastKnown: raw.last_position ? {
      lng: raw.last_position.longitude,
      lat: raw.last_position.latitude,
      at: raw.last_position.timestamp,
      speedKts: raw.last_position.speed_knots,
    } : undefined,
    etaAt: raw.estimated_arrival,
    source: raw.data_source,
  };
}
```

### 3. `hooks/useRefreshShipment.ts`

Replace `mockRefreshShipment` with a real API call:

```typescript
mutationFn: async (id: string) => {
  const res = await fetch(`/api/shipments/${id}/refresh`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to refresh');
  return mapApiToShipment(await res.json());
},
```

### Security Note

Tenant isolation **must be enforced server-side**. The frontend filter is only for user convenience — never trust it for access control.

## Tech Stack

- **Next.js** (App Router) + **TypeScript** (strict) + **Tailwind CSS**
- **maplibre-gl 5.x** (globe projection) + **react-map-gl** (`react-map-gl/maplibre`)
- **deck.gl 9.x** (`@deck.gl/core`, `@deck.gl/layers`, `@deck.gl/geo-layers`, `@deck.gl/mapbox`)
- **@tanstack/react-query** (data fetching, cache, mutations)
- **lucide-react** (icons)
- **framer-motion** (optional panel animations)

