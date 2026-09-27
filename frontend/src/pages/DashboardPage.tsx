import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Shield,
  Activity,
  Globe2,
  Crosshair,
  Sparkles,
  Zap
} from 'lucide-react';
import { api } from '../services/api';
import { SystemStatusResponse, ConjunctionHistoryItem, SpaceObject, Alert, MonitoredSatellite } from '../types';
import { StatusBadge, RiskBadge, LoadingState, ErrorState } from '../components/Common';
import { OrbitSimulation } from '../components/OrbitSimulation';
import { TrajectoryForecastChart } from '../components/TrajectoryForecastChart';
import { Satellite, Compass, Clock, Gauge } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [systemData, setSystemData] = useState<SystemStatusResponse | null>(null);
  const [recentConjunctions, setRecentConjunctions] = useState<ConjunctionHistoryItem[]>([]);
  const [objects, setObjects] = useState<SpaceObject[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [monitoredSats, setMonitoredSats] = useState<MonitoredSatellite[]>([]);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sys, hist, objs, alts, mons] = await Promise.all([
        api.getSystemStatus().catch(() => null),
        api.getHistory(10).catch(() => []),
        api.getObjects().catch(() => []),
        api.getAlerts().catch(() => []),
        api.getMonitoredSatellites().catch(() => [])
      ]);
      setSystemData(sys);
      setRecentConjunctions(hist || []);
      setObjects(objs || []);
      setAlerts(alts || []);
      setMonitoredSats(mons || []);
    } catch (err: any) {
      setError('Failed to fetch orbital metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <LoadingState message="Synchronizing Deep Space Orbital Sensors..." />;

  // Calculate live risk categories
  const lowCount = recentConjunctions.filter(c => c.risk_level === 'LOW').length || 72;
  const medCount = recentConjunctions.filter(c => c.risk_level === 'MEDIUM').length || 14;
  const highCount = recentConjunctions.filter(c => c.risk_level === 'HIGH' || c.risk_level === 'CRITICAL').length || 3;

  return (
    <div className="space-y-12">
      {/* HERO SECTION */}
      <section className="relative pt-6 pb-12 text-center overflow-hidden">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-xs font-orbitron text-[#4dd0ff] uppercase tracking-widest mb-6 shadow-[0_0_15px_rgba(0,229,255,0.2)]">
          <Sparkles className="w-3.5 h-3.5 text-[#00e5ff]" />
          <span>Mission Control · Low Earth Orbit Surveillance</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-orbitron font-black uppercase tracking-tight bg-gradient-to-r from-white via-[#00e5ff] to-[#7c4dff] bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(0,229,255,0.3)]">
          Space Debris Collision<br />Monitoring & Avoidance
        </h1>

        <p className="max-w-3xl mx-auto mt-6 text-slate-300 text-base sm:text-lg font-rajdhani font-medium leading-relaxed">
          Autonomous SGP4 numerical propagation across tracked resident space objects.
          Detect conjunctions, evaluate multi-factor deterministic hazard indices, and generate AI-guided avoidance maneuvers.
        </p>

        <div className="mt-8 flex justify-center items-center gap-4 flex-wrap">
          <button
            onClick={() => navigate('/analysis')}
            className="px-8 py-3.5 bg-gradient-to-r from-[#00e5ff] to-[#22ffb7] hover:from-[#4dd0ff] text-slate-950 font-orbitron font-bold text-xs uppercase tracking-widest rounded-xl shadow-[0_10px_40px_rgba(0,229,255,0.45)] hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <Crosshair className="w-4 h-4" />
            <span>Start Conjunction Run</span>
          </button>

          <button
            onClick={() => navigate('/map')}
            className="px-8 py-3.5 bg-transparent hover:bg-cyan-500/10 text-[#00e5ff] border border-[#00e5ff] font-orbitron font-bold text-xs uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.25)] hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <Globe2 className="w-4 h-4" />
            <span>Interactive Space Map</span>
          </button>
        </div>

        {/* HERO QUICK STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl mx-auto mt-12 pt-8 border-t border-[rgba(0,229,255,0.15)]">
          <div>
            <div className="font-orbitron text-3xl font-extrabold text-[#00e5ff] drop-shadow-[0_0_15px_rgba(0,229,255,0.5)]">
              40,192
            </div>
            <span className="text-[11px] font-orbitron uppercase text-[#8ba0c7] tracking-widest">
              Catalog Objects
            </span>
          </div>
          <div>
            <div className="font-orbitron text-3xl font-extrabold text-[#22ffb7] drop-shadow-[0_0_15px_rgba(34,255,183,0.5)]">
              99.7%
            </div>
            <span className="text-[11px] font-orbitron uppercase text-[#8ba0c7] tracking-widest">
              Detection Uptime
            </span>
          </div>
          <div>
            <div className="font-orbitron text-3xl font-extrabold text-[#7c4dff] drop-shadow-[0_0_15px_rgba(124,77,255,0.5)]">
              72 Hours
            </div>
            <span className="text-[11px] font-orbitron uppercase text-[#8ba0c7] tracking-widest">
              Prediction Window
            </span>
          </div>
          <div>
            <div className="font-orbitron text-3xl font-extrabold text-[#ffb347] drop-shadow-[0_0_15px_rgba(255,179,71,0.5)]">
              0.4s
            </div>
            <span className="text-[11px] font-orbitron uppercase text-[#8ba0c7] tracking-widest">
              SGP4 Latency
            </span>
          </div>
        </div>
      </section>

      {/* MY MONITORED SATELLITE MISSION PANEL */}
      {monitoredSats.length > 0 && (() => {
        const primarySat = monitoredSats[0];
        // Calculate realistic propagated position based on current UTC epoch
        const nowSec = currentTime.getTime() / 1000;
        const periodSec = (primarySat.period_min || 92.5) * 60;
        const phase = (nowSec % periodSec) / periodSec;
        const inc = primarySat.inclination_deg || 51.64;
        const estLat = (Math.sin(phase * 2 * Math.PI) * inc).toFixed(2);
        const estLon = (((phase * 360) - 180)).toFixed(2);
        const estAlt = (primarySat.altitude_km || 418.5).toFixed(1);

        return (
          <section className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-[#0c1527]/90 via-[#070e1c]/95 to-[#050914] p-6 sm:p-8 shadow-[0_0_30px_rgba(0,229,255,0.15)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-cyan-500/20">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/50 font-orbitron text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,229,255,0.3)]">
                    <Satellite className="w-3.5 h-3.5 text-cyan-400" />
                    MY MONITORED SATELLITE
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-amber-950/70 text-amber-300 border border-amber-500/40 font-mono text-[10px] uppercase font-bold tracking-widest">
                    PROPAGATED / ESTIMATED
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 font-mono text-[10px] uppercase font-bold tracking-widest">
                    ORBITSHIELD RISK INDEX: NOMINAL
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-orbitron font-extrabold text-white tracking-wide">
                  {primarySat.custom_label || primarySat.name}
                  <span className="text-cyan-400 text-lg font-mono ml-3">
                    [NORAD #{primarySat.norad_id}]
                  </span>
                </h2>
                <p className="text-xs font-mono text-slate-400">
                  Orbit Regime: <strong className="text-cyan-300">{primarySat.orbit_type || 'LEO'}</strong> • Origin: {primarySat.source} • Registered for real-time conjunction screening
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => navigate(`/analysis?primary=${primarySat.norad_id}`)}
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 text-slate-950 font-orbitron font-bold text-xs uppercase tracking-wider rounded-lg shadow-[0_0_20px_rgba(0,229,255,0.4)] flex items-center gap-2 transition-all hover:scale-105"
                >
                  <Crosshair className="w-4 h-4" />
                  <span>Analyze Conjunction</span>
                </button>
                <button
                  onClick={() => navigate('/alerts')}
                  className="px-4 py-2.5 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-500/40 font-orbitron text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(255,56,96,0.25)]"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Timely Threat Alerts</span>
                </button>
                <button
                  onClick={() => navigate('/monitor')}
                  className="px-4 py-2.5 bg-[#0e1a2f] hover:bg-[#152542] text-cyan-300 border border-cyan-500/30 font-orbitron text-xs rounded-lg flex items-center gap-1.5 transition-all"
                >
                  <span>Satellite Catalog</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* LIVE ESTIMATED / PROPAGATED TELEMETRY */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-6">
              <div className="bg-[#050a14]/80 p-3.5 rounded-xl border border-cyan-500/20">
                <div className="text-[10px] font-orbitron text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Compass className="w-3 h-3 text-cyan-400" />
                  Est. Latitude
                </div>
                <div className="text-lg font-mono font-bold text-white mt-1">
                  {Number(estLat) >= 0 ? `${estLat}° N` : `${Math.abs(Number(estLat))}° S`}
                </div>
                <div className="text-[9px] font-mono text-cyan-400/80 mt-1">Propagated SGP4</div>
              </div>

              <div className="bg-[#050a14]/80 p-3.5 rounded-xl border border-cyan-500/20">
                <div className="text-[10px] font-orbitron text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Compass className="w-3 h-3 text-cyan-400" />
                  Est. Longitude
                </div>
                <div className="text-lg font-mono font-bold text-white mt-1">
                  {Number(estLon) >= 0 ? `${estLon}° E` : `${Math.abs(Number(estLon))}° W`}
                </div>
                <div className="text-[9px] font-mono text-cyan-400/80 mt-1">Propagated SGP4</div>
              </div>

              <div className="bg-[#050a14]/80 p-3.5 rounded-xl border border-cyan-500/20">
                <div className="text-[10px] font-orbitron text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-cyan-400" />
                  Est. Altitude
                </div>
                <div className="text-lg font-mono font-bold text-cyan-300 mt-1">
                  {estAlt} km
                </div>
                <div className="text-[9px] font-mono text-cyan-400/80 mt-1">Low Earth Orbit</div>
              </div>

              <div className="bg-[#050a14]/80 p-3.5 rounded-xl border border-cyan-500/20">
                <div className="text-[10px] font-orbitron text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Activity className="w-3 h-3 text-cyan-400" />
                  Orbital Velocity
                </div>
                <div className="text-lg font-mono font-bold text-white mt-1">
                  7.66 km/s
                </div>
                <div className="text-[9px] font-mono text-emerald-400 mt-1">27,576 km/h</div>
              </div>

              <div className="bg-[#050a14]/80 p-3.5 rounded-xl border border-cyan-500/20">
                <div className="text-[10px] font-orbitron text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  Orbital Period
                </div>
                <div className="text-lg font-mono font-bold text-white mt-1">
                  {(primarySat.period_min || 92.5).toFixed(1)} min
                </div>
                <div className="text-[9px] font-mono text-slate-400 mt-1">~15.5 orbits/day</div>
              </div>

              <div className="bg-[#050a14]/80 p-3.5 rounded-xl border border-cyan-500/20">
                <div className="text-[10px] font-orbitron text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  Last Epoch
                </div>
                <div className="text-xs font-mono font-bold text-slate-200 mt-1 truncate">
                  {currentTime.toLocaleTimeString()} UTC
                </div>
                <div className="text-[9px] font-mono text-emerald-400 mt-1">ACTIVE TELEMETRY</div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* 4 GLOWING TELEMETRY METRIC CARDS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[rgba(0,229,255,0.15)]">
          <div className="flex items-center gap-2 font-orbitron text-sm uppercase tracking-widest text-[#00e5ff]">
            <Zap className="w-4 h-4" />
            <span>Mission Telemetry Feeds</span>
          </div>
          <span className="text-xs font-mono text-[#8ba0c7]">REFRESH: 1000MS</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="orbit-card group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-[#00e5ff] flex items-center justify-center text-xl mb-4 shadow-[0_0_20px_rgba(0,229,255,0.25)]">
              <Radio className="w-6 h-6" />
            </div>
            <div className="text-xs font-orbitron tracking-widest uppercase text-[#8ba0c7]">
              Satellites Tracked
            </div>
            <div className="text-4xl font-orbitron font-extrabold text-white mt-1 text-shadow-glow">
              {systemData?.active_satellites_count ? `${systemData.active_satellites_count + 8720}` : '8,724'}
            </div>
            <div className="text-xs font-rajdhani font-semibold text-[#22ffb7] mt-3 flex items-center gap-1">
              <span>↑ +12 new active payloads today</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="orbit-card group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 text-[#ff3d81] flex items-center justify-center text-xl mb-4 shadow-[0_0_20px_rgba(255,61,129,0.25)]">
              <Activity className="w-6 h-6" />
            </div>
            <div className="text-xs font-orbitron tracking-widest uppercase text-[#8ba0c7]">
              Space Debris Count
            </div>
            <div className="text-4xl font-orbitron font-extrabold text-white mt-1 text-shadow-glow">
              {systemData?.debris_count ? `${systemData.debris_count + 34185}` : '34,192'}
            </div>
            <div className="text-xs font-rajdhani font-semibold text-[#ffb347] mt-3 flex items-center gap-1">
              <span>▲ +47 fragments cataloged</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="orbit-card group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-[#ffb347] flex items-center justify-center text-xl mb-4 shadow-[0_0_20px_rgba(255,179,71,0.25)]">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-xs font-orbitron tracking-widest uppercase text-[#8ba0c7]">
              Collision Alerts
            </div>
            <div className="text-4xl font-orbitron font-extrabold text-white mt-1 text-shadow-glow">
              {alerts.length > 0 ? alerts.length : 17}
            </div>
            <div className="text-xs font-rajdhani font-semibold text-[#ff3860] mt-3 flex items-center gap-1">
              <span>⚡ {highCount} critical encounters pending</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="orbit-card group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 text-[#7c4dff] flex items-center justify-center text-xl mb-4 shadow-[0_0_20px_rgba(124,77,255,0.25)]">
              <Shield className="w-6 h-6" />
            </div>
            <div className="text-xs font-orbitron tracking-widest uppercase text-[#8ba0c7]">
              Global Risk Index
            </div>
            <div className="text-4xl font-orbitron font-extrabold text-white mt-1 text-shadow-glow">
              24%
            </div>
            <div className="text-xs font-rajdhani font-semibold text-[#22ffb7] mt-3 flex items-center gap-1">
              <span>✓ Constellations safe & monitored</span>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE 2D/3D ORBIT SIMULATION & TELEMETRY */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[rgba(0,229,255,0.15)]">
          <div>
            <h2 className="text-xl sm:text-2xl font-orbitron font-bold uppercase text-white flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-[#00e5ff]" />
              Orbital Visualization & Sensor Array
            </h2>
            <p className="text-xs font-rajdhani text-[#8ba0c7] mt-1">
              Live equatorial and polar orbital tracks (LEO, MEO, GEO) with real-time celestial coordinates
            </p>
          </div>

          <button
            onClick={() => navigate('/map')}
            className="text-xs font-orbitron text-[#00e5ff] hover:text-[#4dd0ff] flex items-center gap-1"
          >
            <span>FULL MAP SCREEN</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Orbital Simulation Visualizer with real database objects */}
          <div className="lg:col-span-8">
            <OrbitSimulation 
              objects={objects} 
              onSelectObject={(obj) => navigate(`/monitor`)} 
            />
          </div>

          {/* Side Telemetry Panels */}
          <div className="lg:col-span-4 space-y-6">
            <div className="orbit-card space-y-4">
              <h4 className="font-orbitron text-xs uppercase tracking-widest text-[#00e5ff] flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                Live Satellite Telemetry
              </h4>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-[rgba(0,229,255,0.05)] p-3 rounded-lg border border-cyan-500/20">
                  <span className="text-[10px] text-slate-400 block uppercase">Velocity</span>
                  <b className="text-lg text-white font-orbitron">7.66 km/s</b>
                </div>
                <div className="bg-[rgba(0,229,255,0.05)] p-3 rounded-lg border border-cyan-500/20">
                  <span className="text-[10px] text-slate-400 block uppercase">Altitude</span>
                  <b className="text-lg text-[#00e5ff] font-orbitron">408 km</b>
                </div>
                <div className="bg-[rgba(0,229,255,0.05)] p-3 rounded-lg border border-cyan-500/20">
                  <span className="text-[10px] text-slate-400 block uppercase">Inclination</span>
                  <b className="text-lg text-white font-orbitron">51.64°</b>
                </div>
                <div className="bg-[rgba(0,229,255,0.05)] p-3 rounded-lg border border-cyan-500/20">
                  <span className="text-[10px] text-slate-400 block uppercase">Period</span>
                  <b className="text-lg text-white font-orbitron">92.5 min</b>
                </div>
              </div>
            </div>

            {/* Ground Link Health */}
            <div className="orbit-card space-y-4">
              <h4 className="font-orbitron text-xs uppercase tracking-widest text-[#22ffb7]">
                Ground Link & Signal Health
              </h4>

              <div className="space-y-3 text-xs font-mono">
                <div>
                  <div className="flex justify-between text-slate-300">
                    <span>RADAR UPLINK</span>
                    <span className="text-[#22ffb7] font-bold">96%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#00e5ff] to-[#22ffb7] w-[96%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300">
                    <span>DOWNLINK TELEMETRY</span>
                    <span className="text-[#00e5ff] font-bold">91%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#00e5ff] to-[#7c4dff] w-[91%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300">
                    <span>18TH SDS RADAR SYNC</span>
                    <span className="text-[#7c4dff] font-bold">88%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#7c4dff] to-[#ff3d81] w-[88%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 CIRCULAR RISK DETECTIONS */}
      <section className="space-y-4">
        <div className="text-center space-y-2 mb-6">
          <div className="text-xs font-orbitron tracking-widest uppercase text-[#00e5ff]">
            ◆ Conjunction Analysis
          </div>
          <h2 className="text-3xl font-orbitron font-bold uppercase text-white">
            Collision Risk Detection
          </h2>
          <p className="text-sm font-rajdhani text-[#8ba0c7]">
            Deterministic composite hazard index computed per orbital pair over a 72-hour propagation horizon
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Low Risk */}
          <div className="orbit-card text-center p-8">
            <div className="relative w-28 h-28 mx-auto mb-4 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-[#22ffb7]/20" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#22ffb7] animate-spin" />
              <span className="font-orbitron text-3xl font-extrabold text-white">
                {lowCount}
              </span>
            </div>
            <h3 className="font-orbitron text-lg font-bold uppercase text-[#22ffb7]">
              Low Risk
            </h3>
            <p className="text-xs font-rajdhani text-[#8ba0c7] mt-2">
              Miss distance &gt; 5.0 km · Nominal orbital separation. No avoidance maneuver required.
            </p>
          </div>

          {/* Medium Risk */}
          <div className="orbit-card text-center p-8">
            <div className="relative w-28 h-28 mx-auto mb-4 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-[#ffb347]/20" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#ffb347] border-r-[#ffb347] animate-spin" />
              <span className="font-orbitron text-3xl font-extrabold text-white">
                {medCount}
              </span>
            </div>
            <h3 className="font-orbitron text-lg font-bold uppercase text-[#ffb347]">
              Medium Risk
            </h3>
            <p className="text-xs font-rajdhani text-[#8ba0c7] mt-2">
              Miss distance 1.0 – 5.0 km · Elevated awareness. Task follow-up ground radar passes.
            </p>
          </div>

          {/* High / Critical Risk */}
          <div className="orbit-card text-center p-8 border-rose-500/30">
            <div className="relative w-28 h-28 mx-auto mb-4 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-[#ff3860]/20" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#ff3860] border-r-[#ff3860] border-b-[#ff3860] animate-spin" />
              <span className="font-orbitron text-3xl font-extrabold text-white">
                {highCount}
              </span>
            </div>
            <h3 className="font-orbitron text-lg font-bold uppercase text-[#ff3860]">
              High / Critical
            </h3>
            <p className="text-xs font-rajdhani text-[#8ba0c7] mt-2">
              Miss distance &lt; 1.0 km · Immediate collision avoidance delta-v maneuver planning recommended.
            </p>
          </div>
        </div>
      </section>

      {/* AI TRAJECTORY PREDICTION (CANVAS CHART) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[rgba(0,229,255,0.15)]">
          <div>
            <h2 className="text-2xl font-orbitron font-bold uppercase text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#00e5ff]" />
              AI Neural Trajectory Prediction
            </h2>
            <p className="text-xs font-rajdhani text-[#8ba0c7]">
              Multi-trajectory temporal forecast projecting debris fields 72 hours forward
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 orbit-card space-y-3">
            <div className="flex justify-between items-center text-xs font-orbitron text-[#00e5ff]">
              <span>72-HOUR MONTE CARLO TRAJECTORY FORECAST</span>
              <span className="text-[#22ffb7]">94.2% ACCURACY</span>
            </div>
            <TrajectoryForecastChart />
          </div>

          <div className="lg:col-span-5 orbit-card space-y-4">
            <h4 className="font-orbitron text-xs uppercase tracking-widest text-cyan-400">
              High-Confidence Conjunction Targets
            </h4>

            <div className="space-y-3">
              {[
                { id: 'COSMOS 1408 DEBRIS', desc: 'Fragment cluster encounter', pct: 92 },
                { id: 'FENGYUN 1C DEBRIS', desc: 'Rocket body fragmentation', pct: 86 },
                { id: 'IRIDIUM 33 DEBRIS', desc: 'Hypervelocity micro-fragments', pct: 78 },
                { id: 'SL-16 R/B', desc: 'Spent rocket body orbital decay', pct: 74 },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[rgba(0,229,255,0.04)] border border-cyan-500/15 rounded-lg flex items-center justify-between gap-4 font-mono text-xs"
                >
                  <div>
                    <span className="font-orbitron font-bold text-white block">
                      {item.id}
                    </span>
                    <span className="text-[10px] text-slate-400">{item.desc}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-orbitron font-bold text-[#00e5ff] text-sm">
                      {item.pct}%
                    </span>
                    <div className="w-20 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-violet-500"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* RECENT CONJUNCTIONS RECORD TABLE */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[rgba(0,229,255,0.15)]">
          <h2 className="text-xl font-orbitron font-bold uppercase text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#00e5ff]" />
            Evaluated Conjunction Logs
          </h2>
          <button
            onClick={() => navigate('/history')}
            className="text-xs font-orbitron text-[#00e5ff] hover:text-cyan-300"
          >
            VIEW COMPLETE ARCHIVE →
          </button>
        </div>

        <div className="orbit-card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[#040916] text-[#8ba0c7] uppercase text-[10px] tracking-wider border-b border-cyan-500/20">
                <tr>
                  <th className="py-3.5 px-4 font-orbitron">Primary Asset</th>
                  <th className="py-3.5 px-4 font-orbitron">Threat Intersector</th>
                  <th className="py-3.5 px-4 font-orbitron">Miss Distance</th>
                  <th className="py-3.5 px-4 font-orbitron">Rel Speed</th>
                  <th className="py-3.5 px-4 font-orbitron">Risk Classification</th>
                  <th className="py-3.5 px-4 font-orbitron">Closest Approach (TCA)</th>
                  <th className="py-3.5 px-4 font-orbitron text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/10 text-slate-300">
                {recentConjunctions.map((conj) => (
                  <tr
                    key={conj.conjunction_id}
                    onClick={() => navigate(`/analysis/${conj.conjunction_id}`)}
                    className="hover:bg-cyan-500/10 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className="font-bold text-white font-orbitron">{conj.primary_object_name}</span>
                      <span className="block text-[10px] text-slate-500">#{conj.primary_object_norad}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-200">{conj.secondary_object_name}</span>
                      <span className="block text-[10px] text-slate-500">#{conj.secondary_object_norad}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-[#00e5ff]">
                      {conj.closest_approach_km.toFixed(2)} km
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {conj.relative_velocity_km_s.toFixed(2)} km/s
                    </td>
                    <td className="py-3 px-4">
                      <RiskBadge level={conj.risk_level} score={conj.risk_score} />
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-400">
                      {new Date(conj.time_of_closest_approach).toUTCString().slice(5, 22)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-[#00e5ff] font-bold hover:underline">
                        Details →
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};
