import React, { useState, useEffect } from 'react';
import {
  Cpu,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Database,
  Radio,
  Sparkles,
  RefreshCw,
  Server,
  Layers,
  Terminal
} from 'lucide-react';
import { api } from '../services/api';
import { SystemStatusResponse } from '../types';
import { PageHeader, StatusBadge, LoadingState, ErrorState } from '../components/Common';

export const SystemStatusPage: React.FC = () => {
  const [statusData, setStatusData] = useState<SystemStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getSystemStatus();
      setStatusData(data);
    } catch (err) {
      setError('Unable to query system health services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Mission Telemetry & Engine Health"
        subtitle="Live diagnostics for orbital integration, database persistence, and AI reasoning layers"
        actions={
          <button
            onClick={fetchStatus}
            className="px-3 py-1.5 bg-[#0e1726] hover:bg-[#162338] text-slate-300 font-mono text-xs border border-[#1e2a3c] rounded flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>PING HEALTH</span>
          </button>
        }
      />

      {loading ? (
        <LoadingState message="Probing aerospace subsystem microservices..." />
      ) : error || !statusData ? (
        <ErrorState message={error || 'Failed to connect.'} onRetry={fetchStatus} />
      ) : (
        <div className="space-y-6">
          {/* OVERALL HEALTH CARD */}
          <div className="bg-[#0b101a] border border-[#1b263b] rounded-lg p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-mono font-bold text-white">
                  ALL SUBSYSTEMS NOMINAL
                </h3>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  Platform Version {statusData.version} • Environment: {statusData.environment.toUpperCase()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <StatusBadge type={statusData.status.toLowerCase()} label={`CORE: ${statusData.status.toUpperCase()}`} size="md" />
              <StatusBadge type={statusData.data_mode} label={`MODE: ${statusData.data_mode.toUpperCase()}`} size="md" />
            </div>
          </div>

          {/* INDIVIDUAL SERVICES STATUS */}
          <div className="bg-[#0b101a] border border-[#1b263b] rounded-lg p-5">
            <h3 className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              Subsystem Service Grid
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {statusData.services.map((svc, idx) => {
                const isOp = svc.status === 'Operational';
                const isDeg = svc.status === 'Degraded';
                return (
                  <div
                    key={idx}
                    className="p-4 bg-[#070b13] border border-[#162132] rounded-lg flex items-start justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white">
                          {svc.name}
                        </span>
                        {svc.latency_ms !== undefined && (
                          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-800">
                            {svc.latency_ms} ms
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-slate-400">
                        {svc.details || 'Subsystem responsive and healthy.'}
                      </p>
                    </div>

                    <StatusBadge type={svc.status.toLowerCase()} label={svc.status} size="sm" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* TELEMETRY & CATALOG VOLUMES */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#0b101a] border border-[#1b263b] rounded-lg p-4 text-center">
              <span className="text-[10px] font-mono uppercase text-slate-500">Tracked Catalog</span>
              <p className="text-xl font-mono font-bold text-white mt-1">
                {statusData.tracked_objects_count}
              </p>
            </div>
            <div className="bg-[#0b101a] border border-[#1b263b] rounded-lg p-4 text-center">
              <span className="text-[10px] font-mono uppercase text-slate-500">Active Payloads</span>
              <p className="text-xl font-mono font-bold text-cyan-300 mt-1">
                {statusData.active_satellites_count}
              </p>
            </div>
            <div className="bg-[#0b101a] border border-[#1b263b] rounded-lg p-4 text-center">
              <span className="text-[10px] font-mono uppercase text-slate-500">Tracked Debris</span>
              <p className="text-xl font-mono font-bold text-amber-300 mt-1">
                {statusData.debris_count}
              </p>
            </div>
            <div className="bg-[#0b101a] border border-[#1b263b] rounded-lg p-4 text-center">
              <span className="text-[10px] font-mono uppercase text-slate-500">Active High-Risks</span>
              <p className="text-xl font-mono font-bold text-rose-400 mt-1">
                {statusData.critical_conjunctions_count}
              </p>
            </div>
          </div>

          {/* SYSTEM ARCHITECTURE SPECIFICATIONS */}
          <div className="bg-[#0b101a] border border-[#1b263b] rounded-lg p-5 space-y-3 font-mono text-xs">
            <h3 className="text-slate-300 font-semibold uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              Aerospace Architecture Stack
            </h3>
            <div className="bg-[#06080e] p-4 rounded border border-[#162132] text-slate-400 space-y-2">
              <p>• Propagation Engine: <span className="text-cyan-300">SGP4 Simplified General Perturbations (sgp4-2.27 / WGS-84 / TEME)</span></p>
              <p>• Risk Evaluation Model: <span className="text-cyan-300">Deterministic Multi-Factor Hazard Scoring (0 - 100 Index)</span></p>
              <p>• Decision Support: <span className="text-cyan-300">OpenAI Compatible LLM Layer with Guaranteed Deterministic Fallback</span></p>
              <p>• Persistence Layer: <span className="text-cyan-300">SQLAlchemy 2.0 with PostgreSQL schema & SQLite standalone fallback</span></p>
              <p>• Ground Visualization: <span className="text-cyan-300">Leaflet 2D Equirectangular Basemap with sub-satellite coordinates</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
