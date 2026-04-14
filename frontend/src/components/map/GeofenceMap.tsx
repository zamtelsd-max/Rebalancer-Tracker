import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { HeatmapPoint } from '../../types';
import { getColourForGeofence, formatCurrency, formatDate } from '../../utils/helpers';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const LUSAKA_CENTER: [number, number] = [-15.4167, 28.2833];

function createAgentIcon(colour: string): L.DivIcon {
  const hex = getColourForGeofence(colour);
  return L.divIcon({
    html: `<div style="
      width:18px;height:18px;border-radius:50%;
      background:${hex};border:2.5px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,0.3)
    "></div>`,
    className: '',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

interface MapCenterProps {
  center: [number, number];
}
const MapCenter: React.FC<MapCenterProps> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

interface Props {
  points: HeatmapPoint[];
  height?: string;
  showUnserviced?: boolean;
}

export const GeofenceMap: React.FC<Props> = ({ points, height = '500px', showUnserviced = true }) => {
  const visiblePoints = showUnserviced ? points : points.filter((p) => p.hasBeenServiced);

  return (
    <MapContainer
      center={LUSAKA_CENTER}
      zoom={12}
      style={{ height, width: '100%', borderRadius: '12px', zIndex: 1 }}
      className="shadow-sm"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <MapCenter center={LUSAKA_CENTER} />

      {visiblePoints.map((point) => {
        const hex = getColourForGeofence(point.colour);
        return (
          <React.Fragment key={point.agentId}>
            {/* Geofence circle */}
            <Circle
              center={[point.gpsLat, point.gpsLng]}
              radius={point.geofenceRadiusM}
              pathOptions={{
                color: hex,
                fillColor: hex,
                fillOpacity: 0.20,
                weight: 2,
                opacity: 0.7,
              }}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{point.agentName}</h3>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>
                      <span className="font-medium">LUR: </span>
                      {point.lurScore !== null
                        ? `${Math.round((point.lurScore ?? 0) * 100)}%`
                        : <span className="text-blue-600">Pending Core Integration</span>
                      }
                    </p>
                    {point.casScore !== null && (
                      <p><span className="font-medium">CAS: </span>{point.casScore}/100</p>
                    )}
                    <p>
                      <span className="font-medium">Last serviced: </span>
                      {formatDate(point.lastServicedAt)}
                    </p>
                    <p>
                      <span className="font-medium">Distributed: </span>
                      {formatCurrency(point.totalDistributed)}
                    </p>
                    {point.burnPct !== null && (
                      <p><span className="font-medium">Burn: </span>{Math.round(point.burnPct)}%</p>
                    )}
                    <p>
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-white text-xs"
                        style={{ backgroundColor: hex }}
                      >
                        {point.status}
                      </span>
                    </p>
                  </div>
                </div>
              </Popup>
            </Circle>

            {/* Agent marker pin */}
            <Marker
              position={[point.gpsLat, point.gpsLng]}
              icon={createAgentIcon(point.colour)}
            >
              <Popup>
                <strong>{point.agentName}</strong>
              </Popup>
            </Marker>
          </React.Fragment>
        );
      })}
    </MapContainer>
  );
};
