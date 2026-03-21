"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { MapPin, Home } from "lucide-react";
import { useStore } from "@aurora-studio/starter-core";
import type { StoreItem } from "@aurora-studio/starter-core";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m away`;
  return `${km.toFixed(1)}km away`;
}

function getStoreCoords(s: StoreItem): { lat: number; lng: number } | null {
  const loc = s.location as
    | { type?: string; coordinates?: [number, number]; lat?: number; lng?: number }
    | undefined;
  if (!loc) return null;
  // GeoJSON Point: { type: "Point", coordinates: [lng, lat] }
  const coords = loc.coordinates;
  if (Array.isArray(coords) && coords.length >= 2) {
    const lng = coords[0];
    const lat = coords[1];
    if (typeof lat === "number" && typeof lng === "number" && !Number.isNaN(lat) && !Number.isNaN(lng))
      return { lat, lng };
  }
  // Flat: { lat, lng }
  if (typeof loc.lat === "number" && typeof loc.lng === "number" && !Number.isNaN(loc.lat) && !Number.isNaN(loc.lng))
    return { lat: loc.lat, lng: loc.lng };
  return null;
}

type StoreWithCoords = { store: StoreItem & { _distance?: number }; coords: { lat: number; lng: number }; id: string; name: string };

function StoresMap({
  stores,
  userLocation,
  onSelect,
}: {
  stores: (StoreItem & { _distance?: number })[];
  userLocation?: { lat: number; lng: number } | null;
  onSelect?: (s: StoreItem) => void;
}) {
  const L = typeof window !== "undefined" ? require("leaflet") : null;
  const [mapStores, setMapStores] = useState<StoreWithCoords[]>([]);

  const storesWithCoordsFromList = useMemo(() => {
    return stores
      .map((s) => {
        const coords = getStoreCoords(s);
        if (!coords) return null;
        return { store: s, coords, id: s.id, name: s.name } as StoreWithCoords;
      })
      .filter(Boolean) as StoreWithCoords[];
  }, [stores]);

  useEffect(() => {
    if (storesWithCoordsFromList.length > 0) {
      setMapStores(storesWithCoordsFromList);
      return;
    }
    let cancelled = false;
    fetch("/api/stores-map")
      .then((r) => r.json())
      .then((data: { data?: Array<{ id: string; name: string; lat: number | null; lng: number | null }> }) => {
        if (cancelled) return;
        const list = (data.data ?? []).filter((s) => s.lat != null && s.lng != null);
        setMapStores(
          list.map((s) => ({
            store: { id: s.id, name: s.name } as StoreItem,
            coords: { lat: s.lat!, lng: s.lng! },
            id: s.id,
            name: s.name,
          }))
        );
      })
      .catch(() => setMapStores([]));
    return () => { cancelled = true; };
  }, [storesWithCoordsFromList.length]);
  const center: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : mapStores.length > 0
      ? [mapStores[0].coords.lat, mapStores[0].coords.lng]
      : [51.5074, -0.1278];
  const defaultPinSvg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36"><path fill="%231FA971" stroke="%23178C5D" stroke-width="1" d="M12 0C7.3 0 3.5 3.8 3.5 8.5c0 5.2 8.5 15.5 8.5 15.5S20.5 13.7 20.5 8.5C20.5 3.8 16.7 0 12 0zm0 11.5a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg>';
  const markerIcon = L
    ? L.divIcon({
        html: defaultPinSvg,
        className: "aurora-store-pin",
        iconSize: [24, 36],
        iconAnchor: [12, 36],
      })
    : undefined;

  if (!markerIcon) return null;

  return (
    <div className="stores-map-bw w-full h-full min-h-[320px] rounded-component overflow-hidden border border-aurora-border [&_.leaflet-container]:!h-full [&_.leaflet-container]:!rounded-component">
      <MapContainer
        center={center}
        zoom={12}
        className="w-full h-full"
        style={{ minHeight: 320 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mapStores.map(({ store, coords }) => (
          <Marker
            key={store.id}
            position={[coords.lat, coords.lng]}
            icon={markerIcon}
            eventHandlers={
              onSelect
                ? {
                    click: () => onSelect(store),
                  }
                : undefined
            }
          />
        ))}
      </MapContainer>
    </div>
  );
}

export default function StoresPage() {
  const { location, setStore } = useStore();
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/stores").then((r) => r.json());
        if (cancelled) return;
        if (res.error) {
          setError(res.error);
          setStores([]);
          return;
        }
        let list = res.data ?? [];
        if (location && list.length > 0) {
          const userLat = location.lat;
          const userLng = location.lng;
          list = list
            .map((s: StoreItem) => {
              const loc = s.location as { coordinates?: [number, number] } | undefined;
              const coords = loc?.coordinates;
              const lat = Array.isArray(coords) ? coords[1] : undefined;
              const lng = Array.isArray(coords) ? coords[0] : undefined;
              const dist =
                lat != null && lng != null
                  ? haversineDistance(userLat, userLng, lat, lng)
                  : null;
              return { ...s, _distance: dist };
            })
            .sort((a: StoreItem & { _distance?: number | null }, b: StoreItem & { _distance?: number | null }) => (a._distance ?? Infinity) - (b._distance ?? Infinity));
        }
        setStores(list);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load stores");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [location]);

  const handleSelectStore = (s: StoreItem) => {
    setStore({
      id: s.id,
      name: s.name,
      email: s.email,
      address: s.address,
      image_url: s.image_url,
    });
    window.location.href = "/";
  };

  const locationAddress = location?.address ?? "Waterloo Station, London SE1, UK";

  return (
    <div className="min-h-screen flex flex-col">
      <div className="p-4 border-b border-aurora-border bg-aurora-bg/95 flex items-center gap-4">
        <Link href="/location" className="text-aurora-muted hover:text-white" aria-label="Back">
          ←
        </Link>
        <h1 className="text-xl font-bold flex-1">Nearby Stores</h1>
        <Link href="/" className="text-aurora-muted hover:text-white p-1" aria-label="Home">
          <Home className="w-5 h-5" />
        </Link>
      </div>

      <div className="flex-1 py-4 px-6 lg:px-10">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-aurora-muted text-sm mb-1">
            <MapPin className="w-4 h-4 shrink-0" />
            <span>{locationAddress}</span>
          </div>
          <Link
            href="/location"
            className="text-aurora-accent hover:underline text-sm font-medium"
          >
            Change Location
          </Link>
        </div>

        {loading && (
          <p className="text-aurora-muted py-8 text-center">Loading stores…</p>
        )}
        {error && (
          <div className="rounded-component bg-aurora-surface border border-aurora-border p-6 max-w-lg mx-auto text-center">
            <p className="text-red-400 font-medium mb-2">Couldn&apos;t load stores</p>
            <p className="text-aurora-muted text-sm mb-4">
              {error}. Set NEXT_PUBLIC_AURORA_API_URL and AURORA_API_KEY in .env.local, then ensure your tenant has stores in Aurora Studio.
            </p>
            <Link href="/location" className="text-aurora-accent hover:underline text-sm font-medium">
              Set location
            </Link>
          </div>
        )}

        {!loading && !error && stores.length === 0 && (
          <p className="text-aurora-muted py-8 text-center">
            No stores found for your location. Try changing your location or add stores in Aurora Studio.
          </p>
        )}

        {!loading && !error && stores.length > 0 && (
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
            <div className="lg:w-1/2 lg:max-w-md flex flex-col px-2 lg:px-0 lg:pr-4">
              <p className="text-aurora-muted text-sm mb-4">
                Found {stores.length} store{stores.length !== 1 ? "s" : ""} near your location
              </p>
              <div className="space-y-3 lg:max-h-[60vh] lg:overflow-y-auto pr-1">
                {stores.map((s) => {
                  const dist = (s as StoreItem & { _distance?: number })._distance;
                  return (
                    <div
                      key={s.id}
                      className="rounded-component bg-aurora-surface border border-aurora-border overflow-hidden shrink-0"
                    >
                      <div className="flex flex-col sm:flex-row">
                        {s.image_url && (
                          <div className="sm:w-32 h-24 sm:h-auto bg-aurora-surface-hover shrink-0">
                            <img
                              src={s.image_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 p-4 flex flex-col gap-2 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h2 className="font-bold text-base">{s.name}</h2>
                            {dist != null && (
                              <span className="shrink-0 px-2 py-1 rounded-component bg-aurora-surface-hover text-xs text-aurora-muted">
                                {formatDistance(dist)}
                              </span>
                            )}
                          </div>
                          {s.address && (
                            <p className="text-aurora-muted text-sm flex items-start gap-2">
                              <MapPin className="w-4 h-4 shrink-0" />
                              <span className="break-words">{s.address}</span>
                            </p>
                          )}
                          <div className="flex gap-2 mt-auto flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleSelectStore(s)}
                              className="px-4 py-2 rounded-component bg-aurora-accent text-aurora-bg font-semibold hover:opacity-90 text-sm"
                            >
                              Select Store
                            </button>
                            <Link
                              href="/"
                              className="px-4 py-2 rounded-component border border-aurora-border hover:bg-aurora-surface-hover font-medium text-sm"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="lg:flex-1 lg:min-h-[480px] px-2 lg:px-4">
              <StoresMap
                stores={stores}
                userLocation={location ? { lat: location.lat, lng: location.lng } : null}
                onSelect={handleSelectStore}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
