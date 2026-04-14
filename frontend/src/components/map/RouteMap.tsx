import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Agent } from '../../types';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const LUSAKA_CENTER: [number, number] = [-15.4167, 28.2833];

function agentPinColour(agent: Agent): string {
  if (agent.status === 'SUSPENDED') return '#9ca3af';
  if (agent.status === 'FLAGGED' || agent.requestLocked) return '#ef4444';
  const lur = agent.lurScore;
  if (lur === null || lur === undefined) return '#3b82f6';
  if (lur >= 0.80) return '#22c55e';
  if (lur >= 0.50) return '#f59e0b';
  if (lur >= 0.30) return '#f97316';
  return '#ef4444';
}

function createPin(colour: string): L.DivIcon {
  return L.divIcon({
    html: `<div style="width:20px;height:20px;border-radius:50%;background:${colour};border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

interface RebalancerMarkerProps {
  lat: number;
  lng: number;
}

const REBALANCER_ICON = L.divIcon({
  html: `<div style="width:24px;height:24px;border-radius:4px;background:#E4007C;display:flex;align-items:center;justify-content:center;color:white;font-size:14px;font-weight:bold;box-shadow:0 1px 4px rgba(0,0,0,.4)">R</div>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const FlyTo: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 14, { duration: 1 });
  }, [lat, lng, map]);
  return null;
};

interface Props {
  agents: Agent[];
  rebalancerPosition?: RebalancerMarkerProps | null;
  selectedAgentId?: string | null;
  onAgentClick?: (agent: Agent) => void;
  height?: string;
}

export const RouteMap: React.FC<Props> = ({
  agents,
  rebalancerPosition,
  selectedAgentId,
  onAgentClick,
  height = '400px',
}) => {
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

  return (
    <MapContainer
      center={LUSAKA_CENTER}
      zoom={13}
      style={{ height, width: '100%', borderRadius: '12px' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />

      {flyTarget && <FlyTo lat={flyTarget[0]} lng={flyTarget[1]} />}

      {/* Rebalancer position */}
      {rebalancerPosition && (
        <Marker
          position={[rebalancerPosition.lat, rebalancerPosition.lng]}
          icon={REBALANCER_ICON}
        >
          <Popup>You are here</Popup>
        </Marker>
      )}

      {/* Agent markers */}
      {agents.map((agent) => {
        const colour = agentPinColour(agent);
        const isSelected = agent.id === selectedAgentId;
        return (
          <React.Fragment key={agent.id}>
            {isSelected && (
              <Circle
                center={[agent.gpsLat, agent.gpsLng]}
                radius={agent.geofenceRadiusM}
                pathOptions={{ color: colour, fillColor: colour, fillOpacity: 0.15, weight: 2 }}
              />
            )}
            <Marker
              position={[agent.gpsLat, agent.gpsLng]}
              icon={createPin(colour)}
              eventHandlers={{
                click: () => {
                  onAgentClick?.(agent);
                  setFlyTarget([agent.gpsLat, agent.gpsLng]);
                },
              }}
            >
              <Popup>
                <strong>{agent.businessName}</strong>
                <br />
                {agent.msisdn}
                <br />
                <span style={{ color: colour }}>
                  {agent.status === 'FLAGGED' ? '🔴 Flagged' :
                    agent.status === 'SUSPENDED' ? '⚫ Suspended' : '🟢 Active'}
                </span>
              </Popup>
            </Marker>
          </React.Fragment>
        );
      })}
    </MapContainer>
  );
};
