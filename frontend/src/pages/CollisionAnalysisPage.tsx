import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Crosshair,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldAlert,
  Radio,
  Trash2
} from 'lucide-react';
import { api } from '../services/api';
import { SpaceObject, ConjunctionAnalysisResponse } from '../types';
import { PageHeader, StatusBadge, RiskBadge, LoadingState, ErrorState } from '../components/Common';

const LOADING_STAGES = [
  'Ingesting TLE orbital parameters & coordinate frames...',
  'Propagating trajectories via SGP4 analytical equations...',
  'Searching temporal window for Minimum Distance Point (TCA)...',
  'Evaluating relative velocity vector & kinetic energy at encounter...',
  'Computing multi-factor deterministic hazard index (0-100)...',
  'Generating AI flight dynamics explanation & maneuver advisory...'
];

export const CollisionAnalysisPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedPrimary = searchParams.get('primary');

  const [objects, setObjects] = useState<SpaceObject[]>([]);
  const [primaryId, setPrimaryId] = useState<string>('');
  const [secondaryId, setSecondaryId] = useState<string>('');
  const [windowHours, setWindowHours] = useState<number>(24);

  const [analyzing, setAnalyzing] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    api.getObjects()
      .then((data) => {
        setObjects(data);
        if (data.length >= 2) {
          if (preselectedPrimary && data.some(o => o.norad_id === preselectedPrimary)) {
            setPrimaryId(preselectedPrimary);
            const other = data.find(o => o.norad_id !== preselectedPrimary);
            if (other) setSecondaryId(other.norad_id);
          } else {
            setPrimaryId(data[0].norad_id);
            setSecondaryId(data[1].norad_id);
          }
        }
      })
      .catch(() => setError('Failed to load orbital catalog for analysis.'));
  }, [preselectedPrimary]);

  useEffect(() => {
    let interval: any;
    if (analyzing) {
      interval = setInterval(() => {
        setStageIndex((prev) => (prev < LOADING_STAGES.length - 1 ? prev + 1 : prev));
      }, 700);
    } else {
      setStageIndex(0);
    }
    return () => clearInterval(interval);
  }, [analyzing]);

  const handleRunAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryId || !secondaryId) {
      setError('Please select both a primary and secondary space object.');
      return;
    }
    if (primaryId === secondaryId) {
      setError('Primary and Secondary objects must be distinct targets.');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setStageIndex(0);

    try {
      const response: ConjunctionAnalysisResponse = await api.analyzeConjunction({
        primary_object_id: primaryId,
        secondary_object_id: secondaryId,
        analysis_window_hours: windowHours
      });

      setTimeout(() => {
        navigate(`/analysis/${response.conjunction_id}`);
      }, 600);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Conjunction analysis failed during numerical propagation.');
      setAnalyzing(false);
    }
  };

  const primaryObj = objects.find(o => o.norad_id === primaryId);
  const secondaryObj = objects.find(o => o.norad_id === secondaryId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Collision Conjunction Analysis Engine"
        subtitle="High-fidelity SGP4 temporal propagation & deterministic risk assessment"
        badge={<StatusBadge type="live" label="ENGINE: SGP4 ACTIVE" />}
      />

      {error && <ErrorState message={error} />}

      <form onSubmit={handleRunAnalysis} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PRIMARY TARGET */}
          <div className="orbit-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,229,255,0.18)]">
              <span className="text-xs font-orbitron font-bold text-[#00e5ff] uppercase tracking-wider flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-[#00e5ff]" />
                Target A: Primary Object
              </span>
              <span className="text-[10px] font-orbitron text-[#8ba0c7]">PROTECTED ASSET</span>
            </div>

            <div>
              <label className="block text-xs font-orbitron text-[#8ba0c7] mb-2 uppercase">
                Select Space Asset:
              </label>
              <select
                value={primaryId}
                onChange={(e) => setPrimaryId(e.target.value)}
                disabled={analyzing}
                className="w-full bg-[#030816]/90 border border-cyan-500/30 rounded-lg px-3 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#00e5ff]"
              >
                {objects.map((o) => (
                  <option key={o.norad_id} value={o.norad_id}>
                    {o.name} (NORAD #{o.norad_id} - {o.object_type})
                  </option>
                ))}
              </select>
            </div>

            {primaryObj && (
              <div className="bg-[rgba(0,229,255,0.04)] p-3 rounded-lg border border-cyan-500/20 text-xs font-mono space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="text-white font-bold">{primaryObj.object_type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Regime:</span>
                  <span className="text-white">{primaryObj.orbit_type || 'LEO'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mean Altitude:</span>
                  <span className="text-[#00e5ff] font-bold">{primaryObj.altitude_km || 420} km</span>
                </div>
              </div>
            )}
          </div>

          {/* SECONDARY TARGET */}
          <div className="orbit-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,229,255,0.18)]">
              <span className="text-xs font-orbitron font-bold text-[#ffb347] uppercase tracking-wider flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-[#ffb347]" />
                Target B: Threat Intersector
              </span>
              <span className="text-[10px] font-orbitron text-[#8ba0c7]">CHASER / DEBRIS</span>
            </div>

            <div>
              <label className="block text-xs font-orbitron text-[#8ba0c7] mb-2 uppercase">
                Select Threat Object:
              </label>
              <select
                value={secondaryId}
                onChange={(e) => setSecondaryId(e.target.value)}
                disabled={analyzing}
                className="w-full bg-[#030816]/90 border border-amber-500/30 rounded-lg px-3 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#ffb347]"
              >
                {objects.map((o) => (
                  <option key={o.norad_id} value={o.norad_id}>
                    {o.name} (NORAD #{o.norad_id} - {o.object_type})
                  </option>
                ))}
              </select>
            </div>

            {secondaryObj && (
              <div className="bg-[rgba(255,179,71,0.04)] p-3 rounded-lg border border-amber-500/20 text-xs font-mono space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="text-white font-bold">{secondaryObj.object_type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Regime:</span>
                  <span className="text-white">{secondaryObj.orbit_type || 'LEO'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mean Altitude:</span>
                  <span className="text-[#ffb347] font-bold">{secondaryObj.altitude_km || 415} km</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TIME WINDOW SELECTION */}
        <div className="orbit-card p-6">
          <label className="block text-xs font-orbitron text-white mb-3 uppercase tracking-wider">
            Analysis Time Window:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[6, 12, 24, 48, 72].map((hours) => (
              <button
                type="button"
                key={hours}
                disabled={analyzing}
                onClick={() => setWindowHours(hours)}
                className={`py-3 px-4 rounded-xl font-orbitron text-xs transition-all flex items-center justify-center gap-2 border ${
                  windowHours === hours
                    ? 'bg-cyan-500/20 text-[#00e5ff] border-cyan-400 font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                    : 'bg-[#030816]/70 text-[#8ba0c7] border-cyan-500/20 hover:border-cyan-400/50'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{hours} Hours</span>
              </button>
            ))}
          </div>
        </div>

        {/* PROGRESS SEQUENCE OR ACTION BUTTON */}
        {analyzing ? (
          <div className="orbit-card p-8 text-center space-y-5 border-cyan-400 shadow-[0_0_40px_rgba(0,229,255,0.25)]">
            <div className="inline-block relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#00e5ff] animate-spin" />
              <div className="absolute inset-3 rounded-full border-2 border-transparent border-t-[#7c4dff] animate-spin-reverse" />
            </div>

            <div className="space-y-1">
              <p className="text-base font-orbitron text-[#00e5ff] font-bold uppercase tracking-wider animate-pulse">
                {LOADING_STAGES[stageIndex]}
              </p>
              <p className="text-xs font-mono text-[#8ba0c7]">
                Phase {stageIndex + 1} of {LOADING_STAGES.length}
              </p>
            </div>

            <div className="flex justify-center gap-2 pt-2">
              {LOADING_STAGES.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx <= stageIndex ? 'w-10 bg-[#00e5ff] shadow-[0_0_8px_#00e5ff]' : 'w-4 bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <button
            type="submit"
            className="w-full py-4 px-6 bg-gradient-to-r from-[#00e5ff] to-[#22ffb7] hover:from-[#4dd0ff] text-slate-950 font-orbitron font-extrabold text-sm uppercase tracking-widest rounded-xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(0,229,255,0.45)] transition-all hover:-translate-y-0.5"
          >
            <Crosshair className="w-5 h-5" />
            <span>ANALYZE CONJUNCTION</span>
          </button>
        )}
      </form>
    </div>
  );
};
