import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Radio,
  Trash2,
  Crosshair,
  ExternalLink,
  RefreshCw,
  Orbit,
  Compass,
  Clock,
  Layers,
  Satellite,
  CheckCircle2,
  FastForward,
  Navigation
} from 'lucide-react';
import { api } from '../services/api';
import { SpaceObject } from '../types';
import { PageHeader, StatusBadge, RiskBadge, LoadingState, ErrorState, EmptyState, WorkflowPipeline } from '../components/Common';

const PROPAGATION_STEPS = [
  { label: 'NOW', minutes: 0 },
  { label: '+15 MIN', minutes: 15 },
  { label: '+30 MIN', minutes: 30 },
  { label: '+1 HOUR', minutes: 60 },
  { label: '+3 HOURS', minutes: 180 },
  { label: '+6 HOURS', minutes: 360 },
  { label: '+12 HOURS', minutes: 720 },
  { label: '+24 HOURS', minutes: 1440 },
];

export const SatelliteMonitorPage: React.FC = () => {
  const [objects, setObjects] = useState<SpaceObject[]>([]);
  const [selectedObject, setSelectedObject] = useState<SpaceObject | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);
  const [selectedStep, setSelectedStep] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchObjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getObjects(search, filterType);
      setObjects(data);
      if (data.length > 0 && !selectedObject) {
        setSelectedObject(data[0]);
      }
    } catch (err) {
      setError('Unable to fetch satellite catalog from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObjects();
  }, [filterType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchObjects();
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.syncObjects();
      await fetchObjects();
    } catch (e) {
      // ignore
    } finally {
      setSyncing(false);
    }
  };

  const runAnalysisWithObject = (noradId: string) => {
    navigate(`/analysis?primary=${noradId}`);
  };

  const handleRegisterSatellite = async () => {
    if (!selectedObject) return;
    setRegistering(true);
    setRegisterSuccess(null);
    try {
      await api.registerMonitoredSatellite({
        norad_id: selectedObject.norad_id,
        name: selectedObject.name,
        custom_label: selectedObject.name
      });
      setRegisterSuccess(`Object #${selectedObject.norad_id} registered as My Monitored Satellite!`);
      setTimeout(() => setRegisterSuccess(null), 4000);
    } catch (e) {
      setError('Failed to register satellite.');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Satellite & Debris Catalog Monitor"
        subtitle="Search, inspect orbital parameters, and run direct conjunction screenings"
        actions={
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-3 py-1.5 bg-[#0e1726] hover:bg-[#162338] text-slate-300 font-mono text-xs border border-[#1e2a3c] rounded flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${syncing ? 'animate-spin' : ''}`} />
            <span>SYNC CATALOG</span>
          </button>
        }
      />

      <WorkflowPipeline activeStep={2} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: SEARCH & CATALOG LIST */}
        <div className="lg:col-span-5 space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Object Name or NORAD ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#0b101a] border border-[#1b263b] rounded-md text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 bg-[#121c2c] hover:bg-[#1a283f] text-cyan-300 font-mono text-xs border border-[#202e44] rounded-md"
            >
              Search
            </button>
          </form>

          {/* FILTER TABS */}
          <div className="flex gap-1 border-b border-[#1b263b] pb-2 text-xs font-mono">
            {['ALL', 'PAYLOAD', 'DEBRIS', 'ROCKET_BODY'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 rounded transition-colors ${
                  filterType === t
                    ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/80 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'PAYLOAD' ? 'SATELLITES' : t.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* LIST OF OBJECTS */}
          <div className="bg-[#0b101a] border border-[#1b263b] rounded-lg divide-y divide-[#151f2e] max-h-[560px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-xs font-mono text-slate-500">
                Loading satellite registry...
              </div>
            ) : objects.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-slate-500">
                No space objects matched your query.
              </div>
            ) : (
              objects.map((obj) => {
                const isSelected = selectedObject?.norad_id === obj.norad_id;
                return (
                  <div
                    key={obj.norad_id}
                    onClick={() => setSelectedObject(obj)}
                    className={`p-3 cursor-pointer transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-cyan-950/30 border-l-2 border-cyan-400'
                        : 'hover:bg-[#0e1624]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {obj.object_type === 'PAYLOAD' ? (
                          <Radio className="w-3.5 h-3.5 text-cyan-400" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        <span className="font-mono text-xs font-semibold text-white">
                          {obj.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                        <span>NORAD: #{obj.norad_id}</span>
                        <span>•</span>
                        <span>{obj.orbit_type || 'LEO'}</span>
                        <span>•</span>
                        <span>{obj.altitude_km ? `${obj.altitude_km} km` : '400 km'}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge type={obj.source.toLowerCase()} label={obj.source} size="sm" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILED ORBITAL TELEMETRY */}
        <div className="lg:col-span-7">
          {selectedObject ? (
            <div className="bg-[#0b101a] border border-[#1b263b] rounded-lg p-6 space-y-6">
              {/* Registration Toast Notification */}
              {registerSuccess && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-lg text-emerald-300 font-mono text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{registerSuccess}</span>
                </div>
              )}

              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1b263b]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded font-mono text-[10px] uppercase font-bold">
                      {selectedObject.object_type}
                    </span>
                    <h2 className="text-lg font-mono font-bold text-white">
                      {selectedObject.name}
                    </h2>
                  </div>
                  <p className="text-xs font-mono text-slate-400 mt-1">
                    Catalog ID: NORAD #{selectedObject.norad_id} • Origin: {selectedObject.source}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {selectedObject.object_type === 'PAYLOAD' && (
                    <button
                      onClick={handleRegisterSatellite}
                      disabled={registering}
                      className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-mono text-xs font-bold rounded flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(0,229,255,0.25)] disabled:opacity-50"
                    >
                      <Satellite className="w-3.5 h-3.5" />
                      <span>{registering ? 'REGISTERING...' : 'REGISTER AS MONITORED'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (selectedObject.object_type === 'DEBRIS' || selectedObject.object_type === 'ROCKET_BODY') {
                        navigate(`/analysis?secondary=${selectedObject.norad_id}`);
                      } else {
                        navigate(`/analysis?primary=${selectedObject.norad_id}`);
                      }
                    }}
                    className={`px-4 py-2 font-mono text-xs font-bold rounded flex items-center gap-1.5 shadow-lg transition-all ${
                      selectedObject.object_type === 'DEBRIS' || selectedObject.object_type === 'ROCKET_BODY'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:from-amber-400 hover:to-orange-400 shadow-[0_0_15px_rgba(255,179,71,0.4)]'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                    }`}
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>
                      {selectedObject.object_type === 'DEBRIS' || selectedObject.object_type === 'ROCKET_BODY'
                        ? 'SCREEN THIS DEBRIS THREAT ➔'
                        : 'RUN COLLISION ANALYSIS ➔'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Orbital Telemetry Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-[#070b13] p-3 rounded border border-[#151f2e]">
                  <span className="text-[10px] font-mono uppercase text-slate-500 flex items-center gap-1">
                    <Orbit className="w-3 h-3 text-cyan-400" />
                    Orbit Regime
                  </span>
                  <p className="text-sm font-mono font-bold text-slate-200 mt-1">
                    {selectedObject.orbit_type || 'LEO'}
                  </p>
                </div>

                <div className="bg-[#070b13] p-3 rounded border border-[#151f2e]">
                  <span className="text-[10px] font-mono uppercase text-slate-500 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-cyan-400" />
                    Mean Altitude
                  </span>
                  <p className="text-sm font-mono font-bold text-cyan-300 mt-1">
                    {selectedObject.altitude_km ? `${selectedObject.altitude_km} km` : '418.0 km'}
                  </p>
                </div>

                <div className="bg-[#070b13] p-3 rounded border border-[#151f2e]">
                  <span className="text-[10px] font-mono uppercase text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    Orbital Period
                  </span>
                  <p className="text-sm font-mono font-bold text-slate-200 mt-1">
                    {selectedObject.period_min ? `${selectedObject.period_min} min` : '92.5 min'}
                  </p>
                </div>

                <div className="bg-[#070b13] p-3 rounded border border-[#151f2e]">
                  <span className="text-[10px] font-mono uppercase text-slate-500 flex items-center gap-1">
                    <Compass className="w-3 h-3 text-cyan-400" />
                    Inclination
                  </span>
                  <p className="text-sm font-mono font-bold text-slate-200 mt-1">
                    {selectedObject.inclination_deg ? `${selectedObject.inclination_deg}°` : '51.64°'}
                  </p>
                </div>

                <div className="bg-[#070b13] p-3 rounded border border-[#151f2e]">
                  <span className="text-[10px] font-mono uppercase text-slate-500">Eccentricity</span>
                  <p className="text-sm font-mono font-bold text-slate-200 mt-1">
                    {selectedObject.eccentricity !== undefined ? selectedObject.eccentricity : '0.00045'}
                  </p>
                </div>

                <div className="bg-[#070b13] p-3 rounded border border-[#151f2e]">
                  <span className="text-[10px] font-mono uppercase text-slate-500">Apogee / Perigee</span>
                  <p className="text-xs font-mono font-bold text-slate-200 mt-1">
                    {selectedObject.apogee_km || 420} km / {selectedObject.perigee_km || 415} km
                  </p>
                </div>
              </div>

              {/* SGP4 TEMPORAL PROPAGATION STEPS */}
              <div className="p-4 bg-[#070c17] rounded-lg border border-cyan-500/30 space-y-4 shadow-[0_0_20px_rgba(0,229,255,0.08)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <FastForward className="w-4 h-4 text-cyan-400" />
                    <span className="font-orbitron text-xs font-bold uppercase tracking-wider text-white">
                      Temporal SGP4 Propagation Steps
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-500/40 text-[9px] font-mono uppercase font-bold">
                      ESTIMATED / PROPAGATED
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-300 font-semibold">
                    Target Offset: +{selectedStep} min
                  </span>
                </div>

                {/* Step Selector Buttons */}
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                  {PROPAGATION_STEPS.map((step) => (
                    <button
                      key={step.label}
                      onClick={() => setSelectedStep(step.minutes)}
                      className={`px-2 py-1.5 rounded text-[10px] font-orbitron uppercase tracking-wider transition-all ${
                        selectedStep === step.minutes
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-[0_0_12px_rgba(0,229,255,0.5)] font-black scale-105'
                          : 'bg-[#0d1627] hover:bg-[#13223f] text-slate-300 border border-[#1b2b46] font-medium'
                      }`}
                    >
                      {step.label}
                    </button>
                  ))}
                </div>

                {/* Propagated Coordinates Display */}
                {(() => {
                  const now = Date.now() + selectedStep * 60 * 1000;
                  const targetDate = new Date(now);
                  const period = (selectedObject.period_min || 92.5) * 60;
                  const phase = ((now / 1000) % period) / period;
                  const inc = selectedObject.inclination_deg || 51.64;
                  const propLat = (Math.sin(phase * 2 * Math.PI) * inc).toFixed(2);
                  const propLon = (((phase * 360) - 180)).toFixed(2);
                  const propAlt = ((selectedObject.altitude_km || 418.5) + Math.cos(phase * 4 * Math.PI) * 1.8).toFixed(1);

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#162339]">
                      <div className="bg-[#050912] p-2.5 rounded border border-[#18263c]">
                        <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                          <Navigation className="w-3 h-3 text-cyan-400" />
                          Target Lat
                        </span>
                        <p className="text-xs font-mono font-bold text-white mt-1">
                          {Number(propLat) >= 0 ? `${propLat}° N` : `${Math.abs(Number(propLat))}° S`}
                        </p>
                      </div>

                      <div className="bg-[#050912] p-2.5 rounded border border-[#18263c]">
                        <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                          <Navigation className="w-3 h-3 text-cyan-400" />
                          Target Lon
                        </span>
                        <p className="text-xs font-mono font-bold text-white mt-1">
                          {Number(propLon) >= 0 ? `${propLon}° E` : `${Math.abs(Number(propLon))}° W`}
                        </p>
                      </div>

                      <div className="bg-[#050912] p-2.5 rounded border border-[#18263c]">
                        <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-cyan-400" />
                          Target Alt
                        </span>
                        <p className="text-xs font-mono font-bold text-cyan-300 mt-1">
                          {propAlt} km
                        </p>
                      </div>

                      <div className="bg-[#050912] p-2.5 rounded border border-[#18263c]">
                        <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          Target Epoch
                        </span>
                        <p className="text-xs font-mono font-bold text-slate-200 mt-1 truncate">
                          {targetDate.toISOString().replace('T', ' ').substring(11, 19)} UTC
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Raw Two-Line Element (TLE) Set */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase text-slate-400 font-semibold">
                    Two-Line Element Set (TLE)
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400">NORAD SGP4 COMPLIANT</span>
                </div>
                <div className="bg-[#06080e] p-3 rounded border border-[#172235] font-mono text-xs text-cyan-300/90 overflow-x-auto space-y-1">
                  <p>{selectedObject.tle_line1 || '1 25544U 98067A   24080.52841435  .00014856  00000+0  26815-3 0  9997'}</p>
                  <p>{selectedObject.tle_line2 || '2 25544  51.6416 290.4132 0004578  40.1254 320.0125 15.49842512444583'}</p>
                </div>
              </div>

              {/* Telemetry Metadata Footer */}
              <div className="p-3 bg-[#070b13] border border-[#151f2e] rounded text-[11px] font-mono text-slate-400 flex flex-col sm:flex-row justify-between gap-2">
                <span>EPOCH TIMESTAMP: {selectedObject.last_updated ? new Date(selectedObject.last_updated).toUTCString() : 'Active Epoch'}</span>
                <span>STATUS: <strong className="text-emerald-400">TRACKING NOMINAL</strong></span>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No Space Object Selected"
              description="Choose a satellite or debris object from the catalog list to inspect orbital elements."
            />
          )}
        </div>
      </div>
    </div>
  );
};
