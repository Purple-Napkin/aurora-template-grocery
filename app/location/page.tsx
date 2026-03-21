"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import { useState, useCallback } from "react";
import { useStore } from "aurora-starter-core";

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
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

/** Store/location pin SVG: rounded teardrop, green gradient to match site. */
const DEFAULT_PIN_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="32" height="42"><defs><linearGradient id="pinGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%2347c9a0"/><stop offset="100%" stop-color="%231FA971"/></linearGradient></defs><path fill="url(%23pinGrad)" stroke="%23178C5D" stroke-width="1.25" stroke-linejoin="round" d="M16 1C10.5 1 6 5.5 6 11c0 7 10 18 10 18s10-11 10-18C26 5.5 21.5 1 16 1z"/><circle cx="16" cy="11" r="4" fill="%23fff" stroke="%23178C5D" stroke-width="1"/></svg>';

function DraggableMapContent({
  position,
  onPositionChange,
}: {
  position: { lat: number; lng: number };
  onPositionChange: (lat: number, lng: number) => void;
}) {
  const L = typeof window !== "undefined" ? require("leaflet") : null;
  if (!L) return null;

  const markerIcon = L.divIcon({
    html: DEFAULT_PIN_SVG,
    className: "aurora-location-pin",
    iconSize: [32, 42],
    iconAnchor: [16, 42],
  });

  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker
        position={[position.lat, position.lng]}
        icon={markerIcon}
        eventHandlers={{
          dragend: (e: { target: { getLatLng: () => { lat: number; lng: number } } }) => {
            const { lat, lng } = e.target.getLatLng();
            onPositionChange(lat, lng);
          },
        }}
        draggable
      >
        <Popup>Drag to move pin</Popup>
      </Marker>
    </>
  );
}

export default function LocationPage() {
  const router = useRouter();
  const { setLocation } = useStore();
  const [position, setPosition] = useState({ lat: 51.5074, lng: -0.1278 });
  const [address, setAddress] = useState("Waterloo Station, London SE1, UK");

  const handleSetLocation = useCallback(() => {
    setLocation({
      lat: position.lat,
      lng: position.lng,
      address,
    });
    router.push("/stores");
  }, [position, address, setLocation, router]);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="p-4 border-b border-aurora-border bg-aurora-bg/95 flex items-center gap-4">
        <Link href="/stores" className="text-aurora-muted hover:text-white" aria-label="Back">
          ←
        </Link>
        <h1 className="text-xl font-bold flex-1">Set Your Location</h1>
      </div>

      <div className="flex-1 flex flex-col p-4 gap-4">
        <div>
          <label htmlFor="address" className="sr-only">
            Address search
          </label>
          <input
            id="address"
            type="text"
            placeholder="Type your address here..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-4 py-3 rounded-component bg-aurora-surface border border-aurora-border text-aurora-text placeholder:text-aurora-muted"
          />
        </div>

        <div className="flex-1 min-h-[300px] rounded-component overflow-hidden border border-aurora-border [&_.leaflet-container]:!h-full">
          <MapContainer
            center={[position.lat, position.lng]}
            zoom={13}
            className="w-full h-full"
            style={{ minHeight: 300 }}
          >
            <DraggableMapContent
              position={position}
              onPositionChange={(lat, lng) => setPosition({ lat, lng })}
            />
          </MapContainer>
        </div>

        <div className="flex items-start gap-2 text-aurora-muted text-sm">
          <MapPin className="w-4 h-4 shrink-0" />
          <span>
            {address}
            <br />
            Move the map to position the pin at your delivery location.
          </span>
        </div>

        <button
          type="button"
          onClick={handleSetLocation}
          className="w-full py-4 rounded-component bg-aurora-accent text-aurora-bg font-bold hover:opacity-90"
        >
          Set Location
        </button>
      </div>
    </div>
  );
}
