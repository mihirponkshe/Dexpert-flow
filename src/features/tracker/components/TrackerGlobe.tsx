/**
 * Dexpert Flow — Tracker Globe
 *
 * Cinematic 3D globe:
 * - Earth at night texture with glowing city lights
 * - Country name labels on the globe surface
 * - Cyan atmospheric rim glow and stars background
 * - Thin glowing animated arcs for Air shipments (cyan on-time, red delayed)
 * - Surface-hugging teal maritime paths for Sea (red if delayed)
 * - Amber glowing road paths for Road (red if delayed)
 * - Proper airplane SVG for Air vehicles, ship for Sea, truck for Road
 * - Auto-rotation with pause on interaction
 * - Smooth camera fly-to on shipment selection
 */

'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import { Shipment } from '../types';
import { useGhostPositions } from '../hooks/useGhostPosition';

export interface TrackerGlobeProps {
  shipments: Shipment[];
  onRefresh?: (id: string) => Promise<Shipment>;
  onSelect: (shipment: Shipment | null) => void;
  selectedId: string | null;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onGhostPositionsUpdate?: (ghosts: any) => void;
}

interface GlobeElementData {
  id: string;
  type: 'pin' | 'vehicle';
  lat: number;
  lng: number;
  alt: number;
  shipment: Shipment;
  bearing?: number;
  isOrigin?: boolean;
  isDestination?: boolean;
}

/* ── Country & major city labels on the globe surface ─────────── */
const COUNTRY_LABELS: { name: string; lat: number; lng: number; size?: number }[] = [
  // ─── NORTH AMERICA ──────────────────────────────────────────
  { name: 'United States', lat: 39.8, lng: -98.6, size: 0.9 },
  { name: 'Canada', lat: 56.1, lng: -106.3, size: 0.9 },
  { name: 'Mexico', lat: 23.6, lng: -102.6, size: 0.8 },
  { name: 'New York', lat: 40.7, lng: -74.0 },
  { name: 'Los Angeles', lat: 34.1, lng: -118.2 },
  { name: 'Chicago', lat: 41.9, lng: -87.6 },
  { name: 'Houston', lat: 29.8, lng: -95.4 },
  { name: 'Miami', lat: 25.8, lng: -80.2 },
  { name: 'San Francisco', lat: 37.8, lng: -122.4 },
  { name: 'Toronto', lat: 43.7, lng: -79.4 },
  { name: 'Vancouver', lat: 49.3, lng: -123.1 },
  { name: 'Montreal', lat: 45.5, lng: -73.6 },
  { name: 'Mexico City', lat: 19.4, lng: -99.1 },
  { name: 'Guadalajara', lat: 20.7, lng: -103.3 },
  { name: 'Alaska', lat: 63.6, lng: -154.5 },
  { name: 'Hawaii', lat: 19.9, lng: -155.6 },
  { name: 'Dallas', lat: 32.8, lng: -96.8 },
  { name: 'Seattle', lat: 47.6, lng: -122.3 },
  { name: 'Atlanta', lat: 33.7, lng: -84.4 },
  { name: 'Boston', lat: 42.4, lng: -71.1 },
  { name: 'Washington DC', lat: 38.9, lng: -77.0 },
  { name: 'Denver', lat: 39.7, lng: -105.0 },
  { name: 'Phoenix', lat: 33.4, lng: -112.1 },

  // ─── CENTRAL AMERICA & CARIBBEAN ────────────────────────────
  { name: 'Cuba', lat: 21.5, lng: -77.8 },
  { name: 'Jamaica', lat: 18.1, lng: -77.3 },
  { name: 'Haiti', lat: 19.1, lng: -72.3 },
  { name: 'Dom. Republic', lat: 18.7, lng: -70.2 },
  { name: 'Guatemala', lat: 15.8, lng: -90.2 },
  { name: 'Honduras', lat: 15.2, lng: -86.2 },
  { name: 'Panama', lat: 8.5, lng: -80.8 },
  { name: 'Costa Rica', lat: 9.7, lng: -83.8 },
  { name: 'Puerto Rico', lat: 18.2, lng: -66.6 },

  // ─── SOUTH AMERICA ──────────────────────────────────────────
  { name: 'Brazil', lat: -14.2, lng: -51.9, size: 0.9 },
  { name: 'Argentina', lat: -38.4, lng: -63.6, size: 0.8 },
  { name: 'Colombia', lat: 4.6, lng: -74.3 },
  { name: 'Peru', lat: -9.2, lng: -75.0 },
  { name: 'Chile', lat: -35.7, lng: -71.5 },
  { name: 'Venezuela', lat: 6.4, lng: -66.6 },
  { name: 'Ecuador', lat: -1.8, lng: -78.2 },
  { name: 'Bolivia', lat: -16.3, lng: -63.6 },
  { name: 'Paraguay', lat: -23.4, lng: -58.4 },
  { name: 'Uruguay', lat: -32.5, lng: -55.8 },
  { name: 'Guyana', lat: 4.9, lng: -58.9 },
  { name: 'Suriname', lat: 3.9, lng: -56.0 },
  { name: 'São Paulo', lat: -23.6, lng: -46.6 },
  { name: 'Rio de Janeiro', lat: -22.9, lng: -43.2 },
  { name: 'Buenos Aires', lat: -34.6, lng: -58.4 },
  { name: 'Lima', lat: -12.0, lng: -77.0 },
  { name: 'Bogotá', lat: 4.7, lng: -74.1 },
  { name: 'Santiago', lat: -33.4, lng: -70.7 },

  // ─── WESTERN EUROPE ─────────────────────────────────────────
  { name: 'United Kingdom', lat: 54.0, lng: -2.5, size: 0.8 },
  { name: 'France', lat: 46.2, lng: 2.2, size: 0.8 },
  { name: 'Germany', lat: 51.2, lng: 10.4, size: 0.8 },
  { name: 'Spain', lat: 40.5, lng: -3.7 },
  { name: 'Italy', lat: 41.9, lng: 12.6 },
  { name: 'Portugal', lat: 39.4, lng: -8.2 },
  { name: 'Netherlands', lat: 52.1, lng: 5.3 },
  { name: 'Belgium', lat: 50.5, lng: 4.5 },
  { name: 'Switzerland', lat: 46.8, lng: 8.2 },
  { name: 'Austria', lat: 47.5, lng: 14.6 },
  { name: 'Ireland', lat: 53.1, lng: -8.2 },
  { name: 'London', lat: 51.5, lng: -0.1 },
  { name: 'Paris', lat: 48.9, lng: 2.3 },
  { name: 'Berlin', lat: 52.5, lng: 13.4 },
  { name: 'Madrid', lat: 40.4, lng: -3.7 },
  { name: 'Rome', lat: 41.9, lng: 12.5 },
  { name: 'Amsterdam', lat: 52.4, lng: 4.9 },
  { name: 'Frankfurt', lat: 50.1, lng: 8.7 },
  { name: 'Munich', lat: 48.1, lng: 11.6 },
  { name: 'Milan', lat: 45.5, lng: 9.2 },
  { name: 'Barcelona', lat: 41.4, lng: 2.2 },
  { name: 'Zurich', lat: 47.4, lng: 8.5 },
  { name: 'Hamburg', lat: 53.6, lng: 10.0 },
  { name: 'Rotterdam', lat: 51.9, lng: 4.5 },

  // ─── NORTHERN & EASTERN EUROPE ──────────────────────────────
  { name: 'Sweden', lat: 60.1, lng: 18.6 },
  { name: 'Norway', lat: 60.5, lng: 8.5 },
  { name: 'Finland', lat: 61.9, lng: 25.7 },
  { name: 'Denmark', lat: 56.3, lng: 9.5 },
  { name: 'Poland', lat: 51.9, lng: 19.1 },
  { name: 'Czech Republic', lat: 49.8, lng: 15.5 },
  { name: 'Romania', lat: 45.9, lng: 25.0 },
  { name: 'Hungary', lat: 47.2, lng: 19.5 },
  { name: 'Ukraine', lat: 48.4, lng: 31.2 },
  { name: 'Greece', lat: 39.1, lng: 21.8 },
  { name: 'Iceland', lat: 64.9, lng: -19.0 },
  { name: 'Greenland', lat: 71.7, lng: -42.6 },
  { name: 'Moscow', lat: 55.8, lng: 37.6 },
  { name: 'Stockholm', lat: 59.3, lng: 18.1 },
  { name: 'Copenhagen', lat: 55.7, lng: 12.6 },
  { name: 'Warsaw', lat: 52.2, lng: 21.0 },
  { name: 'Prague', lat: 50.1, lng: 14.4 },
  { name: 'Budapest', lat: 47.5, lng: 19.0 },
  { name: 'Athens', lat: 37.98, lng: 23.7 },
  { name: 'Istanbul', lat: 41.0, lng: 29.0 },
  { name: 'Bucharest', lat: 44.4, lng: 26.1 },
  { name: 'Helsinki', lat: 60.2, lng: 24.9 },
  { name: 'Oslo', lat: 59.9, lng: 10.8 },
  { name: 'Kyiv', lat: 50.5, lng: 30.5 },
  { name: 'Belgrade', lat: 44.8, lng: 20.5 },
  { name: 'Sofia', lat: 42.7, lng: 23.3 },
  { name: 'Croatia', lat: 45.1, lng: 15.2 },
  { name: 'Serbia', lat: 44.0, lng: 21.0 },
  { name: 'Lithuania', lat: 55.2, lng: 23.9 },
  { name: 'Latvia', lat: 56.9, lng: 24.1 },
  { name: 'Estonia', lat: 58.6, lng: 25.0 },

  // ─── RUSSIA & CENTRAL ASIA ─────────────────────────────────
  { name: 'Russia', lat: 61.5, lng: 105.3, size: 1.0 },
  { name: 'Kazakhstan', lat: 48.0, lng: 68.0 },
  { name: 'Uzbekistan', lat: 41.4, lng: 64.6 },
  { name: 'Turkmenistan', lat: 38.97, lng: 59.6 },
  { name: 'Mongolia', lat: 46.9, lng: 103.8 },
  { name: 'St Petersburg', lat: 59.9, lng: 30.3 },
  { name: 'Novosibirsk', lat: 55.0, lng: 82.9 },
  { name: 'Vladivostok', lat: 43.1, lng: 131.9 },

  // ─── MIDDLE EAST ────────────────────────────────────────────
  { name: 'Saudi Arabia', lat: 23.9, lng: 45.1, size: 0.8 },
  { name: 'UAE', lat: 23.4, lng: 53.8 },
  { name: 'Turkey', lat: 38.9, lng: 35.2, size: 0.8 },
  { name: 'Iran', lat: 32.4, lng: 53.7, size: 0.8 },
  { name: 'Iraq', lat: 33.2, lng: 43.7 },
  { name: 'Israel', lat: 31.0, lng: 34.9 },
  { name: 'Jordan', lat: 30.6, lng: 36.2 },
  { name: 'Kuwait', lat: 29.3, lng: 47.5 },
  { name: 'Qatar', lat: 25.4, lng: 51.2 },
  { name: 'Oman', lat: 21.5, lng: 55.9 },
  { name: 'Yemen', lat: 15.6, lng: 48.5 },
  { name: 'Syria', lat: 35.0, lng: 38.5 },
  { name: 'Lebanon', lat: 33.9, lng: 35.9 },
  { name: 'Dubai', lat: 25.2, lng: 55.3 },
  { name: 'Riyadh', lat: 24.7, lng: 46.7 },
  { name: 'Jeddah', lat: 21.5, lng: 39.2 },
  { name: 'Abu Dhabi', lat: 24.5, lng: 54.4 },
  { name: 'Doha', lat: 25.3, lng: 51.5 },
  { name: 'Tehran', lat: 35.7, lng: 51.4 },
  { name: 'Baghdad', lat: 33.3, lng: 44.4 },
  { name: 'Ankara', lat: 39.9, lng: 32.9 },

  // ─── SOUTH ASIA ─────────────────────────────────────────────
  { name: 'India', lat: 20.6, lng: 79.0, size: 0.9 },
  { name: 'Pakistan', lat: 30.4, lng: 69.3 },
  { name: 'Bangladesh', lat: 23.7, lng: 90.4 },
  { name: 'Sri Lanka', lat: 7.9, lng: 80.8 },
  { name: 'Nepal', lat: 28.4, lng: 84.1 },
  { name: 'Afghanistan', lat: 33.9, lng: 67.7 },
  { name: 'Mumbai', lat: 19.1, lng: 72.9 },
  { name: 'Delhi', lat: 28.7, lng: 77.1 },
  { name: 'Bangalore', lat: 12.97, lng: 77.6 },
  { name: 'Chennai', lat: 13.1, lng: 80.3 },
  { name: 'Kolkata', lat: 22.6, lng: 88.4 },
  { name: 'Hyderabad', lat: 17.4, lng: 78.5 },
  { name: 'Pune', lat: 18.5, lng: 73.9 },
  { name: 'Ahmedabad', lat: 23.0, lng: 72.6 },
  { name: 'Karachi', lat: 24.9, lng: 67.0 },
  { name: 'Lahore', lat: 31.6, lng: 74.4 },
  { name: 'Dhaka', lat: 23.8, lng: 90.4 },
  { name: 'Colombo', lat: 6.9, lng: 79.9 },

  // ─── EAST & SOUTHEAST ASIA ──────────────────────────────────
  { name: 'China', lat: 35.9, lng: 104.2, size: 0.9 },
  { name: 'Japan', lat: 36.2, lng: 138.3, size: 0.8 },
  { name: 'South Korea', lat: 35.9, lng: 127.8 },
  { name: 'North Korea', lat: 40.3, lng: 127.5 },
  { name: 'Taiwan', lat: 23.7, lng: 121.0 },
  { name: 'Indonesia', lat: -0.8, lng: 113.9, size: 0.8 },
  { name: 'Philippines', lat: 12.9, lng: 121.8 },
  { name: 'Vietnam', lat: 14.1, lng: 108.3 },
  { name: 'Thailand', lat: 15.9, lng: 100.9 },
  { name: 'Malaysia', lat: 4.2, lng: 101.9 },
  { name: 'Singapore', lat: 1.4, lng: 103.8 },
  { name: 'Myanmar', lat: 19.8, lng: 96.1 },
  { name: 'Cambodia', lat: 12.6, lng: 104.9 },
  { name: 'Laos', lat: 19.9, lng: 102.5 },
  { name: 'Beijing', lat: 39.9, lng: 116.4 },
  { name: 'Shanghai', lat: 31.2, lng: 121.5 },
  { name: 'Shenzhen', lat: 22.5, lng: 114.1 },
  { name: 'Guangzhou', lat: 23.1, lng: 113.3 },
  { name: 'Hong Kong', lat: 22.3, lng: 114.2 },
  { name: 'Tokyo', lat: 35.7, lng: 139.7 },
  { name: 'Osaka', lat: 34.7, lng: 135.5 },
  { name: 'Seoul', lat: 37.6, lng: 127.0 },
  { name: 'Busan', lat: 35.2, lng: 129.1 },
  { name: 'Bangkok', lat: 13.8, lng: 100.5 },
  { name: 'Ho Chi Minh', lat: 10.8, lng: 106.7 },
  { name: 'Hanoi', lat: 21.0, lng: 105.9 },
  { name: 'Jakarta', lat: -6.2, lng: 106.8 },
  { name: 'Manila', lat: 14.6, lng: 121.0 },
  { name: 'Kuala Lumpur', lat: 3.1, lng: 101.7 },
  { name: 'Taipei', lat: 25.0, lng: 121.6 },
  { name: 'Chengdu', lat: 30.6, lng: 104.1 },
  { name: 'Wuhan', lat: 30.6, lng: 114.3 },
  { name: 'Xi\'an', lat: 34.3, lng: 108.9 },

  // ─── AFRICA ─────────────────────────────────────────────────
  { name: 'Egypt', lat: 26.8, lng: 30.8, size: 0.8 },
  { name: 'South Africa', lat: -30.6, lng: 22.9, size: 0.8 },
  { name: 'Nigeria', lat: 9.1, lng: 8.7, size: 0.8 },
  { name: 'Kenya', lat: -0.02, lng: 37.9 },
  { name: 'Ethiopia', lat: 9.1, lng: 40.5 },
  { name: 'Tanzania', lat: -6.4, lng: 34.9 },
  { name: 'Ghana', lat: 7.9, lng: -1.0 },
  { name: 'Senegal', lat: 14.5, lng: -14.5 },
  { name: 'Ivory Coast', lat: 7.5, lng: -5.5 },
  { name: 'Cameroon', lat: 7.4, lng: 12.4 },
  { name: 'DR Congo', lat: -4.0, lng: 21.8 },
  { name: 'Angola', lat: -11.2, lng: 17.9 },
  { name: 'Mozambique', lat: -18.7, lng: 35.5 },
  { name: 'Madagascar', lat: -18.8, lng: 46.9 },
  { name: 'Morocco', lat: 31.8, lng: -7.1 },
  { name: 'Algeria', lat: 28.0, lng: 1.7 },
  { name: 'Libya', lat: 26.3, lng: 17.2 },
  { name: 'Tunisia', lat: 34.0, lng: 9.5 },
  { name: 'Sudan', lat: 12.9, lng: 30.2 },
  { name: 'Uganda', lat: 1.4, lng: 32.3 },
  { name: 'Rwanda', lat: -1.9, lng: 29.9 },
  { name: 'Zimbabwe', lat: -19.0, lng: 29.2 },
  { name: 'Zambia', lat: -13.1, lng: 27.8 },
  { name: 'Botswana', lat: -22.3, lng: 24.7 },
  { name: 'Namibia', lat: -22.6, lng: 17.1 },
  { name: 'Mali', lat: 17.6, lng: -4.0 },
  { name: 'Niger', lat: 17.6, lng: 8.1 },
  { name: 'Chad', lat: 15.5, lng: 18.7 },
  { name: 'Somalia', lat: 5.2, lng: 46.2 },
  { name: 'Cairo', lat: 30.0, lng: 31.2 },
  { name: 'Lagos', lat: 6.5, lng: 3.4 },
  { name: 'Johannesburg', lat: -26.2, lng: 28.0 },
  { name: 'Cape Town', lat: -33.9, lng: 18.4 },
  { name: 'Nairobi', lat: -1.3, lng: 36.8 },
  { name: 'Addis Ababa', lat: 9.0, lng: 38.7 },
  { name: 'Casablanca', lat: 33.6, lng: -7.6 },
  { name: 'Accra', lat: 5.6, lng: -0.2 },
  { name: 'Dar es Salaam', lat: -6.8, lng: 39.3 },
  { name: 'Luanda', lat: -8.8, lng: 13.2 },

  // ─── OCEANIA ────────────────────────────────────────────────
  { name: 'Australia', lat: -25.3, lng: 133.8, size: 0.9 },
  { name: 'New Zealand', lat: -40.9, lng: 174.9 },
  { name: 'Papua New Guinea', lat: -6.3, lng: 143.9 },
  { name: 'Fiji', lat: -17.7, lng: 178.1 },
  { name: 'Sydney', lat: -33.9, lng: 151.2 },
  { name: 'Melbourne', lat: -37.8, lng: 144.96 },
  { name: 'Brisbane', lat: -27.5, lng: 153.0 },
  { name: 'Perth', lat: -31.95, lng: 115.9 },
  { name: 'Auckland', lat: -36.9, lng: 174.8 },
  { name: 'Adelaide', lat: -34.9, lng: 138.6 },
];

export default function TrackerGlobe({
  shipments,
  onSelect,
  selectedId,
  hoveredId,
  onHover,
  onGhostPositionsUpdate,
}: TrackerGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeInstanceRef = useRef<any>(null);
  const autoRotateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time ghost positions of shipments
  const ghosts = useGhostPositions(shipments);

  // Notify parent of ghost positions if requested
  useEffect(() => {
    if (onGhostPositionsUpdate) {
      onGhostPositionsUpdate(ghosts);
    }
  }, [ghosts, onGhostPositionsUpdate]);

  /* ── 1. Prepare Air Arcs Data ──────────────────────────────── */
  const arcsData = useMemo(() => {
    return shipments
      .filter((s) => s.medium === 'air')
      .map((s) => {
        const isSelected = s.id === selectedId;
        const isHovered = s.id === hoveredId;
        const isDelayed = s.status === 'delayed' || s.status === 'exception';

        // Calculate approximate distance for altitude scaling
        const dLat = (s.destination.lat - s.origin.lat) * (Math.PI / 180);
        const dLng = (s.destination.lng - s.origin.lng) * (Math.PI / 180);
        const distApprox = Math.sqrt(dLat * dLat + dLng * dLng);
        const altitude = Math.max(0.18, Math.min(0.42, distApprox * 0.18));

        // Change 3: Delayed/exception arcs → red
        let color: string | string[];
        if (isSelected) {
          color = ['#ffffff', '#22d3ee'];
        } else if (isHovered) {
          color = isDelayed ? ['#fca5a5', '#ef4444'] : ['#67e8f9', '#06b6d4'];
        } else if (isDelayed) {
          color = ['rgba(239, 68, 68, 0.95)', 'rgba(239, 68, 68, 0.4)'];
        } else {
          color = ['rgba(34, 211, 238, 0.95)', 'rgba(34, 211, 238, 0.4)'];
        }

        return {
          id: s.id,
          shipment: s,
          startLat: s.origin.lat,
          startLng: s.origin.lng,
          endLat: s.destination.lat,
          endLng: s.destination.lng,
          color,
          altitude,
          stroke: isSelected ? 2.2 : isHovered ? 1.8 : 1.3,
        };
      });
  }, [shipments, selectedId, hoveredId]);

  /* ── 2. Prepare Sea & Road Paths Data ──────────────────────── */
  const pathsData = useMemo(() => {
    return shipments
      .filter((s) => (s.medium === 'sea' || s.medium === 'road') && s.route && s.route.length > 1)
      .map((s) => {
        const isSelected = s.id === selectedId;
        const isHovered = s.id === hoveredId;
        const isSea = s.medium === 'sea';
        const isDelayed = s.status === 'delayed' || s.status === 'exception';

        // Coordinates format for globe.gl path: [[lat, lng, alt], ...]
        const coords = s.route!.map(([lng, lat]) => [lat, lng, 0.005]);

        // Change 3: Delayed/exception paths → red
        let color: string;
        if (isSelected) {
          color = '#ffffff';
        } else if (isDelayed) {
          color = isHovered ? '#fca5a5' : '#ef4444';
        } else if (isHovered) {
          color = isSea ? '#2dd4bf' : '#fbbf24';
        } else {
          color = isSea ? '#14b8a6' : '#f59e0b';
        }

        return {
          id: s.id,
          shipment: s,
          coords,
          color,
          stroke: isSelected ? 2.5 : isHovered ? 2.0 : 1.4,
          dashLength: isSea ? 0.2 : 0.15,
          dashGap: isSea ? 0.08 : 0.05,
          // Slowed by ~50% total from original (higher value = slower animation)
          dashAnimateTime: isSea ? 4760 : 5860,
        };
      });
  }, [shipments, selectedId, hoveredId]);

  /* ── 3. Prepare 3D HTML Elements (Pins & Vehicles) ─────────── */
  const htmlElementsData = useMemo(() => {
    const list: GlobeElementData[] = [];

    // Pins for origins and destinations
    shipments.forEach((s) => {
      list.push({
        id: `${s.id}-origin`,
        type: 'pin',
        lat: s.origin.lat,
        lng: s.origin.lng,
        alt: 0.01,
        shipment: s,
        isOrigin: true,
      });

      list.push({
        id: `${s.id}-dest`,
        type: 'pin',
        lat: s.destination.lat,
        lng: s.destination.lng,
        alt: 0.01,
        shipment: s,
        isDestination: true,
      });

      // Moving Vehicle
      const ghost = ghosts.get(s.id);
      if (ghost) {
        // For air: compute altitude along the arc parabola so the plane
        // flies along the visible arc curve, not in vacant space.
        // Arc altitude peaks at midpoint: alt = peakAlt × 4 × f × (1−f)
        let vehicleAlt: number;
        if (s.medium === 'air') {
          const dLat2 = (s.destination.lat - s.origin.lat) * (Math.PI / 180);
          const dLng2 = (s.destination.lng - s.origin.lng) * (Math.PI / 180);
          const dist2 = Math.sqrt(dLat2 * dLat2 + dLng2 * dLng2);
          const peakAlt = Math.max(0.18, Math.min(0.42, dist2 * 0.18));
          const f = ghost.fraction;
          vehicleAlt = peakAlt * 4 * f * (1 - f);
        } else {
          vehicleAlt = 0.012;
        }
        list.push({
          id: `${s.id}-vehicle`,
          type: 'vehicle',
          lat: ghost.lat,
          lng: ghost.lng,
          alt: vehicleAlt,
          shipment: s,
          bearing: ghost.bearing,
        });
      }
    });

    return list;
  }, [shipments, ghosts]);

  /* ── 4. Initialize Globe ───────────────────────────────────── */
  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;
    let globe: any = null;

    import('globe.gl').then((GlobeModule) => {
      if (!isMounted || !containerRef.current) return;

      const Globe = GlobeModule.default;
      globe = new Globe(containerRef.current);
      globeInstanceRef.current = globe;

      globe
        .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
        .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
        .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
        .showAtmosphere(true)
        .atmosphereColor('#22d3ee')
        .atmosphereAltitude(0.22);

      globe.pointOfView({ lat: 24, lng: 25, altitude: 2.1 }, 0);

      // OrbitControls
      const controls = globe.controls();
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.45;
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        const pauseAutoRotate = () => {
          controls.autoRotate = false;
          if (autoRotateTimeoutRef.current) clearTimeout(autoRotateTimeoutRef.current);
          autoRotateTimeoutRef.current = setTimeout(() => {
            if (controls) controls.autoRotate = true;
          }, 6000);
        };

        controls.addEventListener('start', pauseAutoRotate);
      }

      // Country & city name labels on globe surface
      globe
        .labelsData(COUNTRY_LABELS)
        .labelLat((d: any) => d.lat)
        .labelLng((d: any) => d.lng)
        .labelText((d: any) => d.name)
        .labelSize((d: any) => d.size ?? 0.55)
        .labelDotRadius(0)
        .labelColor((d: any) => d.size ? 'rgba(200, 215, 240, 0.65)' : 'rgba(180, 195, 220, 0.45)')
        .labelResolution(2)
        .labelAltitude(0.005)
        .labelIncludeDot(false);

      // Responsive resize
      const handleResize = () => {
        if (!containerRef.current || !globe) return;
        globe.width(containerRef.current.clientWidth);
        globe.height(containerRef.current.clientHeight);
      };
      window.addEventListener('resize', handleResize);
      handleResize();
    });

    return () => {
      isMounted = false;
      if (autoRotateTimeoutRef.current) clearTimeout(autoRotateTimeoutRef.current);
      if (globeInstanceRef.current) {
        globeInstanceRef.current._destructor?.();
        globeInstanceRef.current = null;
      }
    };
  }, []);

  /* ── 5. Update Arcs & Paths when data changes ───────────────── */
  useEffect(() => {
    const globe = globeInstanceRef.current;
    if (!globe) return;

    // Air arcs — Change 2: arcDashAnimateTime slowed 40% (2200 → 3660)
    globe
      .arcsData(arcsData)
      .arcStartLat((d: any) => d.startLat)
      .arcStartLng((d: any) => d.startLng)
      .arcEndLat((d: any) => d.endLat)
      .arcEndLng((d: any) => d.endLng)
      .arcColor((d: any) => d.color)
      .arcAltitude((d: any) => d.altitude)
      .arcStroke((d: any) => d.stroke)
      .arcDashLength(0.4)
      .arcDashGap(0.2)
      .arcDashInitialGap((d: any) => (d.id === selectedId ? 0 : 0.1))
      .arcDashAnimateTime(4000)
      .onArcClick((arc: any) => {
        if (arc?.shipment) onSelect(arc.shipment);
      })
      .onArcHover((arc: any) => {
        onHover(arc?.shipment?.id || null);
      });

    // Sea & Road paths
    globe
      .pathsData(pathsData)
      .pathPoints((d: any) => d.coords)
      .pathPointLat((p: any) => p[0])
      .pathPointLng((p: any) => p[1])
      .pathPointAlt((p: any) => p[2])
      .pathColor((d: any) => d.color)
      .pathStroke((d: any) => d.stroke)
      .pathDashLength((d: any) => d.dashLength)
      .pathDashGap((d: any) => d.dashGap)
      .pathDashAnimateTime((d: any) => d.dashAnimateTime)
      .onPathClick((path: any) => {
        if (path?.shipment) onSelect(path.shipment);
      })
      .onPathHover((path: any) => {
        onHover(path?.shipment?.id || null);
      });
  }, [arcsData, pathsData, onSelect, onHover, selectedId]);

  /* ── 6. Update 3D HTML Markers (Pins & Moving Vehicles) ─────── */
  useEffect(() => {
    const globe = globeInstanceRef.current;
    if (!globe) return;

    globe
      .htmlElementsData(htmlElementsData)
      .htmlTransitionDuration(600)
      .htmlLat((d: GlobeElementData) => d.lat)
      .htmlLng((d: GlobeElementData) => d.lng)
      .htmlAltitude((d: GlobeElementData) => d.alt)
      .htmlElement((d: GlobeElementData) => {
        const isSelected = d.shipment.id === selectedId;
        const isHovered = d.shipment.id === hoveredId;

        // 1) Vehicle Element
        if (d.type === 'vehicle') {
          const el = document.createElement('div');
          el.className = 'cursor-pointer select-none transition-transform hover:scale-125';
          el.style.pointerEvents = 'auto';

          const rot = d.bearing || 0;
          let iconSvg = '';

          // Change 4: Proper airplane SVG for Air instead of star
          if (d.shipment.medium === 'air') {
            iconSvg = `
              <svg viewBox="0 0 32 32" class="w-7 h-7" style="filter: drop-shadow(0 0 8px #22d3ee);">
                <path d="M16 3 L14 12 L4 15 L6 17 L14 16 L15 26 L12 28 L12 30 L16 29 L20 30 L20 28 L17 26 L18 16 L26 17 L28 15 L18 12 Z"
                  fill="#22d3ee" fill-opacity="0.85" stroke="#67e8f9" stroke-width="0.6"/>
              </svg>
            `;
          } else if (d.shipment.medium === 'sea') {
            iconSvg = `
              <svg viewBox="0 0 24 24" class="w-7 h-7" style="filter: drop-shadow(0 0 8px #14b8a6);" fill="none" stroke="#14b8a6" stroke-width="1.8">
                <path d="M2 19l2-8h16l2 8H2z" fill="#14b8a6" fill-opacity="0.3"/>
                <path d="M6 11V6h12v5M9 6V3h6v3" />
              </svg>
            `;
          } else {
            iconSvg = `
              <svg viewBox="0 0 24 24" class="w-6 h-6" style="filter: drop-shadow(0 0 8px #f59e0b);" fill="none" stroke="#f59e0b" stroke-width="1.8">
                <rect x="1" y="5" width="15" height="11" rx="1" fill="#f59e0b" fill-opacity="0.3"/>
                <path d="M16 8h4l3 4v4h-7V8z" fill="#f59e0b" fill-opacity="0.3"/>
                <circle cx="5.5" cy="18.5" r="2.5" fill="#f59e0b"/>
                <circle cx="18.5" cy="18.5" r="2.5" fill="#f59e0b"/>
              </svg>
            `;
          }

          el.innerHTML = `
            <div style="transform: rotate(${rot}deg);" class="transition-transform duration-300">
              ${iconSvg}
            </div>
          `;

          el.onclick = (e) => {
            e.stopPropagation();
            onSelect(d.shipment);
          };

          el.onmouseenter = () => onHover(d.shipment.id);
          el.onmouseleave = () => onHover(null);

          return el;
        }

        // 2) Pin Element (Origin / Destination)
        const isDelayed = d.shipment.status === 'delayed' || d.shipment.status === 'exception';
        const pinColor = isSelected ? '#38bdf8' : isDelayed ? '#ef4444' : '#10b981';

        const el = document.createElement('div');
        el.className = 'relative flex items-center justify-center cursor-pointer select-none';
        el.style.pointerEvents = 'auto';

        el.innerHTML = `
          ${
            isDelayed || isSelected
              ? `<div class="absolute w-8 h-8 rounded-full border animate-pin-ring" style="border-color: ${pinColor};"></div>`
              : ''
          }
          <div class="relative w-4 h-4 rounded-full border-2 border-white/80" style="background-color: ${pinColor}; box-shadow: 0 0 12px ${pinColor};">
            <div class="w-1.5 h-1.5 rounded-full bg-white mx-auto mt-0.5"></div>
          </div>
          ${
            isHovered || isSelected
              ? `
              <div class="globe-marker-tooltip">
                <div class="font-bold text-cyan-300">${d.shipment.reference}</div>
                <div class="text-[10px] text-slate-300">${d.shipment.origin.name} → ${d.shipment.destination.name}</div>
                <div class="text-[9px] mt-0.5 capitalize flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full" style="background-color: ${pinColor};"></span>
                  ${d.shipment.status.replace('_', ' ')} • ${d.shipment.medium}
                </div>
              </div>
            `
              : ''
          }
        `;

        el.onclick = (e) => {
          e.stopPropagation();
          onSelect(d.shipment);
        };

        el.onmouseenter = () => onHover(d.shipment.id);
        el.onmouseleave = () => onHover(null);

        return el;
      });
  }, [htmlElementsData, selectedId, hoveredId, onSelect, onHover]);

  /* ── 7. Fly to selected shipment on change ─────────────────── */
  useEffect(() => {
    const globe = globeInstanceRef.current;
    if (!globe || !selectedId) return;

    const selected = shipments.find((s) => s.id === selectedId);
    if (!selected) return;

    const ghost = ghosts.get(selected.id);
    const targetLat = ghost ? ghost.lat : (selected.origin.lat + selected.destination.lat) / 2;
    const targetLng = ghost ? ghost.lng : (selected.origin.lng + selected.destination.lng) / 2;

    globe.pointOfView({ lat: targetLat, lng: targetLng, altitude: 1.55 }, 1400);
  }, [selectedId, shipments, ghosts]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative cursor-grab active:cursor-grabbing bg-[#070b17] overflow-hidden"
    />
  );
}
