'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';

export type MapItem = {
  id: string;
  title: string;
  lat: number;
  lng: number;
  href?: string;
  price?: string;
};

// Fix de íconos por defecto de Leaflet (los bundlers rompen las rutas relativas).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function goldIcon(active: boolean) {
  const size = active ? 22 : 16;
  return L.divIcon({
    className: 'impy-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:50%;background:#B8922A;border:2px solid #0e0e0e;box-shadow:0 0 0 ${active ? 8 : 4}px rgba(184,146,42,${active ? 0.35 : 0.2});transition:all .2s"></span>`,
  });
}

function FitBounds({ items }: { items: MapItem[] }) {
  const map = useMap();
  useEffect(() => {
    if (items.length === 0) return;
    if (items.length === 1) {
      map.setView([items[0].lat, items[0].lng], 15);
      return;
    }
    const bounds = L.latLngBounds(items.map((i) => [i.lat, i.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [items, map]);
  return null;
}

export default function PropertiesMap({
  items,
  highlightedId,
  height = '100%',
}: {
  items: MapItem[];
  highlightedId?: string | null;
  height?: number | string;
}) {
  const valid = useMemo(
    () => items.filter((i) => Number.isFinite(i.lat) && Number.isFinite(i.lng) && !(i.lat === 0 && i.lng === 0)),
    [items]
  );
  // Centro por defecto: Asunción
  const center: [number, number] = valid[0] ? [valid[0].lat, valid[0].lng] : [-25.2867, -57.3333];

  return (
    <div style={{ width: '100%', height, position: 'relative' }}>
      <style>{`
        .impy-map .leaflet-tile-pane { filter: grayscale(0.6) brightness(0.75) contrast(1.1); }
        .impy-map .leaflet-popup-content-wrapper { background: #161616; color: #f5f5f5; border-radius: 10px; }
        .impy-map .leaflet-popup-tip { background: #161616; }
        .impy-map .leaflet-popup-content a { color: #B8922A; }
        .impy-marker { background: transparent; border: none; }
      `}</style>
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={false}
        className="impy-map"
        style={{ width: '100%', height: '100%', background: '#0d0d0d' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds items={valid} />
        {valid.map((item) => (
          <Marker key={item.id} position={[item.lat, item.lng]} icon={goldIcon(highlightedId === item.id)}>
            <Popup>
              <div style={{ minWidth: 160 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.title}</div>
                {item.price && <div style={{ marginBottom: 6 }}>{item.price}</div>}
                {item.href && <a href={item.href}>Ver propiedad →</a>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
