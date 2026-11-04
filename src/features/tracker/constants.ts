/**
 * Dexpert Flow — Visual and physical constants
 *
 * All colours, speeds, and animation parameters in one place.
 */

// ─── Medium colours ───────────────────────────────────────────────
export const MEDIUM_COLORS = {
  air: { primary: [34, 211, 238] as const, secondary: [56, 189, 248] as const, hex: '#22d3ee', hexSecondary: '#38bdf8' },
  sea: { primary: [20, 184, 166] as const, secondary: [52, 211, 153] as const, hex: '#14b8a6', hexSecondary: '#34d399' },
  road: { primary: [245, 158, 11] as const, secondary: [251, 146, 60] as const, hex: '#f59e0b', hexSecondary: '#fb923c' },
} as const;

// ─── Status colours ───────────────────────────────────────────────
export const STATUS_COLORS = {
  on_time: { rgb: [16, 185, 129] as const, hex: '#10b981' },
  delayed: { rgb: [239, 68, 68] as const, hex: '#ef4444' },
  exception: { rgb: [239, 68, 68] as const, hex: '#ef4444' },
} as const;

// ─── Average speeds (km/h) for ghost position estimation ──────────
export const AVG_SPEED_KMH: Record<string, number> = {
  air: 800,
  sea: 35 * 1.852, // 35 kts → ~64.8 km/h
  road: 60,
};

// ─── Animation parameters ─────────────────────────────────────────
/** Ghost position update interval (ms) */
export const GHOST_UPDATE_INTERVAL = 1000;

/** Arc height multiplier for air routes */
export const ARC_HEIGHT = 0.5;

/** Glow layer opacity (under-layer for glow effect) */
export const GLOW_OPACITY = 0.15;

/** Dim opacity for non-selected routes */
export const DIM_OPACITY = 0.25;

/** Beacon pulse period (ms) */
export const BEACON_PULSE_PERIOD = 2000;

/** Beacon max radius in pixels */
export const BEACON_MAX_RADIUS = 40;

/** Auto-rotation speed (degrees per second) */
export const AUTO_ROTATE_SPEED = 3;

/** Idle time before auto-rotation starts (ms) */
export const AUTO_ROTATE_IDLE_MS = 5000;

// ─── Map defaults ─────────────────────────────────────────────────
export const DEFAULT_VIEW_STATE = {
  longitude: 30,
  latitude: 20,
  zoom: 1.5,
  pitch: 30,
  bearing: 0,
};

/** MapLibre style URL — override with NEXT_PUBLIC_MAP_STYLE_URL env var */
export const MAP_STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ||
  'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

// ─── Trips animation ──────────────────────────────────────────────
/** Trail length for TripsLayer (seconds of trail) */
export const TRIP_TRAIL_LENGTH = 180;

/** TripsLayer animation loop duration (seconds) */
export const TRIP_LOOP_LENGTH = 600;
