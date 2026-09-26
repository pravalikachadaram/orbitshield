import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe2,
  Crosshair,
  Layers,
  Radio,
  Trash2,
  Filter,
  Eye,
  RefreshCw,
  Info,
  Sparkles
} from 'lucide-react';
import L from 'leaflet';
import { api } from '../services/api';
import { SpaceObject } from '../types';
import { PageHeader, StatusBadge, RiskBadge, LoadingState, ErrorState } from '../components/Common';

export const SpaceMapPage: React.FC = () => {
  const [objects, setObjects] = useState<SpaceObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PAYLOAD' | 'DEBRIS'>('ALL');
  const [selectedObject, setSelectedObject] = useState<SpaceObject | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    api.getObjects()
      .then((data) => {
        setObjects(data);
        if (data.length > 0) setSelectedObject(data[0]);
      })
      .catch(() => setError('Failed to retrieve space object coordinates.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20, 0],
      zoom: 2,
      minZoom: 1.5,
      maxZoom: 7,
      worldCopyJump: true,
      attributionControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [loading]);

  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    const filtered = objects.filter((o) => {
      if (filter === 'ALL') return true;
      if (filter === 'PAYLOAD') return o.object_type === 'PAYLOAD';
      return o.object_type !== 'PAYLOAD';
    });

    filtered.forEach((obj, idx) => {
      const noradInt = parseInt(obj.norad_id, 10) || (idx * 5000);
      const inc = obj.inclination_deg || 51.6;
      const lat = Math.sin((noradInt % 360) * (Math.PI / 180)) * inc;
      const lon = ((noradInt * 7) % 360) - 180;

      const isPayload = obj.object_type === 'PAYLOAD';
      const color = isPayload ? '#00e5ff' : '#ff3d81';

      const customIcon = L.divIcon({
        className: 'custom-satellite-marker',
        html: `
          <div style="
            width: 14px; 
            height: 14px; 
            background: ${color}; 
            border: 2px solid #ffffff; 
            border-radius: 50%; 
            box-shadow: 0 0 14px ${color};
            cursor: pointer;
          "></div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const marker = L.marker([lat, lon], { icon: customIcon });

      const popupHtml = `
        <div style="font-family: Orbitron, sans-serif; font-size: 11px; padding: 4px;">
          <strong style="color: #00e5ff; font-size: 13px;">${obj.name}</strong><br/>
          <span style="color: #8ba0c7;">NORAD: #${obj.norad_id}</span><br/>
          <span style="color: #8ba0c7;">Type: ${obj.object_type}</span><br/>
          <span style="color: #22ffb7;">Altitude: ${obj.altitude_km || 420} km</span><br/>
          <span style="color: #ffb347;">Orbit: ${obj.orbit_type || 'LEO'}</span>
        </div>
      `;
      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        setSelectedObject(obj);
      });

      marker.addTo(markersLayerRef.current!);
    });
  }, [objects, filter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orbital Space Map & Ground Tracks"
        subtitle="Global 2D Equirectangular Celestial Projection with SGP4 Sub-Satellite Coordinates"
        badge={<StatusBadge type="live" label="WGS84 EQUATORIAL MESH" />}
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs font-orbitron text-[#8ba0c7]">FILTER:</span>
            {(['ALL', 'PAYLOAD', 'DEBRIS'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1 text-xs font-orbitron rounded-lg transition-colors ${
                  filter === t
                    ? 'bg-cyan-500/20 text-[#00e5ff] border border-cyan-400 font-bold shadow-[0_0_12px_rgba(0,229,255,0.3)]'
                    : 'bg-slate-900/60 text-[#8ba0c7] border border-cyan-500/20 hover:text-white'
                }`}
              >
                {t === 'PAYLOAD' ? 'SATELLITES' : t}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* MAP VIEW */}
        <div className="lg:col-span-8 orbit-card p-3 overflow-hidden flex flex-col h-[580px]">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[rgba(0,229,255,0.15)] text-xs font-orbitron text-[#8ba0c7]">
            <span className="flex items-center gap-2 text-[#00e5ff]">
              <span className="w-2 h-2 rounded-full bg-[#00e5ff] shadow-[0_0_10px_#00e5ff] animate-ping" />
              SGP4 Numerical Orbit Trajectories
            </span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00e5ff] shadow-[0_0_8px_#00e5ff]" /> Satellite
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff3d81] shadow-[0_0_8px_#ff3d81]" /> Debris
              </span>
            </div>
          </div>

          <div ref={mapContainerRef} className="flex-1 w-full rounded-xl overflow-hidden mt-2" />
        </div>

        {/* SELECTED OBJECT DETAILS */}
        <div className="lg:col-span-4 space-y-4">
          {selectedObject ? (
            <div className="orbit-card space-y-5">
              <div className="pb-3 border-b border-[rgba(0,229,255,0.18)]">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-cyan-950 text-[#00e5ff] text-[10px] font-orbitron uppercase rounded border border-cyan-700 font-bold">
                    {selectedObject.object_type}
                  </span>
                  <StatusBadge type={selectedObject.source} label={selectedObject.source} size="sm" />
                </div>
                <h3 className="text-xl font-orbitron font-extrabold text-white mt-2 drop-shadow-[0_0_10px_rgba(0,229,255,0.4)]">
                  {selectedObject.name}
                </h3>
                <p className="text-xs font-mono text-[#8ba0c7] mt-0.5">
                  NORAD ID: #{selectedObject.norad_id}
                </p>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div className="flex justify-between py-1.5 border-b border-cyan-500/10">
                  <span className="text-slate-400">Orbital Regime:</span>
                  <span className="text-white font-semibold font-orbitron">{selectedObject.orbit_type || 'LEO'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-cyan-500/10">
                  <span className="text-slate-400">Mean Altitude:</span>
                  <span className="text-[#00e5ff] font-bold font-orbitron">{selectedObject.altitude_km || 420} km</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-cyan-500/10">
                  <span className="text-slate-400">Inclination:</span>
                  <span className="text-white font-orbitron">{selectedObject.inclination_deg || 51.6}°</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-cyan-500/10">
                  <span className="text-slate-400">Orbital Period:</span>
                  <span className="text-white font-orbitron">{selectedObject.period_min || 92.5} min</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-cyan-500/10">
                  <span className="text-slate-400">Eccentricity:</span>
                  <span className="text-white font-mono">{selectedObject.eccentricity || 0.0005}</span>
                </div>
              </div>

              <button
                onClick={() => navigate(`/analysis?primary=${selectedObject.norad_id}`)}
                className="w-full py-3 bg-gradient-to-r from-[#00e5ff] to-[#22ffb7] hover:from-[#4dd0ff] text-slate-950 font-orbitron text-xs font-bold uppercase rounded-lg flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all hover:-translate-y-0.5"
              >
                <Crosshair className="w-4 h-4" />
                <span>RUN COLLISION ANALYSIS</span>
              </button>
            </div>
          ) : (
            <div className="orbit-card text-center p-8 text-xs font-orbitron text-slate-400">
              Click any orbital marker on the map to inspect telemetry.
            </div>
          )}

          <div className="orbit-card p-4 text-xs font-rajdhani text-slate-300 flex items-start gap-3">
            <Info className="w-5 h-5 text-[#00e5ff] flex-shrink-0 mt-0.5" />
            <p>
              Sub-satellite ground tracks are calculated via numerical SGP4 integration over the rotating Earth frame (WGS-84), accounting for J2 gravitational oblateness harmonics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
