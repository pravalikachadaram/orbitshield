import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Crosshair,
  ArrowLeft,
  Bell,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Compass,
  Activity,
  Layers,
  ChevronRight,
  Database,
  ExternalLink
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import { api } from '../services/api';
import { ConjunctionAnalysisResponse } from '../types';
import { PageHeader, StatusBadge, RiskBadge, LoadingState, ErrorState } from '../components/Common';

export const AnalysisResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [analysis, setAnalysis] = useState<ConjunctionAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    api.getConjunctionDetail(id)
      .then((data) => setAnalysis(data))
      .catch((err) => setError('Could not retrieve conjunction analysis record.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingState message="Loading saved orbital conjunction record..." />;
  if (error || !analysis) return <ErrorState message={error || 'Record not found.'} onRetry={() => navigate('/history')} />;

  const breakdownData = [
    {
      factor: 'Miss Distance',
      score: analysis.calculation_metadata?.breakdown?.distance_score ?? 35,
      max: 55,
      color: '#00e5ff'
    },
    {
      factor: 'Rel Velocity',
      score: analysis.calculation_metadata?.breakdown?.velocity_score ?? 18,
      max: 25,
      color: '#7c4dff'
    },
    {
      factor: 'Encounter Urgency',
      score: analysis.calculation_metadata?.breakdown?.urgency_score ?? 15,
      max: 20,
      color: '#ffb347'
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(0,229,255,0.18)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/history')}
            className="p-2.5 bg-[#030816] hover:bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-slate-300 hover:text-[#00e5ff] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black font-orbitron text-white uppercase tracking-wider drop-shadow-[0_0_15px_rgba(0,229,255,0.3)]">
                Conjunction Assessment Report
              </h1>
              <RiskBadge level={analysis.risk_level} score={analysis.risk_score} />
            </div>
            <p className="text-xs font-mono text-[#8ba0c7] mt-0.5">
              Event ID: {analysis.conjunction_id} • Epoch: {new Date(analysis.created_at).toUTCString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge type={analysis.data_mode} label={`DATA: ${analysis.data_mode.toUpperCase()}`} />
          <StatusBadge type="live" label="CALC: SGP4 INTEGRATION" />
        </div>
      </div>

      {/* TIMELY THREAT ALERT BANNER */}
      <div className={`p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg border ${
        analysis.risk_level === 'CRITICAL' || analysis.risk_level === 'HIGH'
          ? 'bg-rose-950/50 border-rose-500/80 shadow-[0_0_30px_rgba(255,56,96,0.25)] text-rose-200'
          : analysis.risk_level === 'MEDIUM'
          ? 'bg-amber-950/50 border-amber-500/80 shadow-[0_0_30px_rgba(255,179,71,0.25)] text-amber-200'
          : 'bg-cyan-950/50 border-cyan-500/80 shadow-[0_0_30px_rgba(0,229,255,0.2)] text-cyan-200'
      }`}>
        <div className="flex items-center gap-3">
          <AlertTriangle className={`w-6 h-6 flex-shrink-0 animate-pulse ${
            analysis.risk_level === 'CRITICAL' || analysis.risk_level === 'HIGH'
              ? 'text-[#ff3860]'
              : analysis.risk_level === 'MEDIUM'
              ? 'text-[#ffb347]'
              : 'text-[#00e5ff]'
          }`} />
          <div>
            <p className="text-sm font-orbitron font-extrabold uppercase tracking-wide">
              {analysis.risk_level} Timely Threat Alert Dispatched
            </p>
            <p className="text-xs font-mono opacity-90 mt-0.5">
              Event #{analysis.conjunction_id.substring(0, 8)} • Miss Distance: {analysis.closest_approach_km.toFixed(2)} km • OrbitShield Risk: {analysis.risk_score.toFixed(1)}/100
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/alerts')}
          className={`px-5 py-2.5 font-orbitron text-xs font-black uppercase rounded-lg border transition-all shadow-md flex items-center justify-center gap-2 self-start sm:self-auto hover:scale-105 ${
            analysis.risk_level === 'CRITICAL' || analysis.risk_level === 'HIGH'
              ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 shadow-[0_0_15px_rgba(255,56,96,0.5)]'
              : analysis.risk_level === 'MEDIUM'
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_15px_rgba(255,179,71,0.5)]'
              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 border-cyan-300 shadow-[0_0_15px_rgba(0,229,255,0.5)]'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>View in Timely Alerts Queue →</span>
        </button>
      </div>

      {/* TARGET OBJECTS COMPARISON CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Primary Object */}
        <div className="orbit-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,229,255,0.18)]">
            <span className="text-xs font-orbitron font-bold text-[#00e5ff] uppercase">
              Target A: Protected Asset
            </span>
            <span className="text-[10px] font-orbitron text-[#8ba0c7]">PRIMARY TARGET</span>
          </div>
          <div>
            <h3 className="text-2xl font-orbitron font-extrabold text-white">
              {analysis.primary_object?.name || 'Primary Object'}
            </h3>
            <p className="text-xs font-mono text-[#8ba0c7] mt-1">
              NORAD #{analysis.primary_object?.norad_id} • {analysis.primary_object?.object_type} • {analysis.primary_object?.orbit_type || 'LEO'}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-cyan-500/15 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">Altitude:</span>
              <p className="text-[#00e5ff] font-bold font-orbitron">{analysis.primary_object?.altitude_km || 420} km</p>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Period:</span>
              <p className="text-white font-bold font-orbitron">{analysis.primary_object?.period_min || 92.5}m</p>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Source:</span>
              <p className="text-[#22ffb7] font-bold font-orbitron">{analysis.primary_object?.source || 'DEMO'}</p>
            </div>
          </div>
        </div>

        {/* Secondary Object */}
        <div className="orbit-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,229,255,0.18)]">
            <span className="text-xs font-orbitron font-bold text-[#ffb347] uppercase">
              Target B: Threat Intersector
            </span>
            <span className="text-[10px] font-orbitron text-[#8ba0c7]">CHASER / DEBRIS</span>
          </div>
          <div>
            <h3 className="text-2xl font-orbitron font-extrabold text-white">
              {analysis.secondary_object?.name || 'Secondary Object'}
            </h3>
            <p className="text-xs font-mono text-[#8ba0c7] mt-1">
              NORAD #{analysis.secondary_object?.norad_id} • {analysis.secondary_object?.object_type} • {analysis.secondary_object?.orbit_type || 'LEO'}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-amber-500/15 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">Altitude:</span>
              <p className="text-[#ffb347] font-bold font-orbitron">{analysis.secondary_object?.altitude_km || 415} km</p>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Period:</span>
              <p className="text-white font-bold font-orbitron">{analysis.secondary_object?.period_min || 92.0}m</p>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Source:</span>
              <p className="text-amber-400 font-bold font-orbitron">{analysis.secondary_object?.source || 'DEMO'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* METRIC HIGHLIGHTS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="orbit-card text-center p-5">
          <span className="text-[10px] font-orbitron uppercase text-[#8ba0c7]">Closest Approach</span>
          <p className="text-3xl font-orbitron font-extrabold text-[#00e5ff] mt-1">
            {analysis.closest_approach_km.toFixed(2)} <span className="text-xs font-normal">km</span>
          </p>
          <span className="text-[11px] font-rajdhani text-slate-400 mt-1 block">Miss distance</span>
        </div>

        <div className="orbit-card text-center p-5">
          <span className="text-[10px] font-orbitron uppercase text-[#8ba0c7]">Relative Velocity</span>
          <p className="text-3xl font-orbitron font-extrabold text-white mt-1">
            {analysis.relative_velocity_km_s.toFixed(2)} <span className="text-xs font-normal">km/s</span>
          </p>
          <span className="text-[11px] font-rajdhani text-slate-400 mt-1 block">Encounter speed</span>
        </div>

        <div className="orbit-card text-center p-5">
          <span className="text-[10px] font-orbitron uppercase text-[#8ba0c7]">Time to Encounter</span>
          <p className="text-3xl font-orbitron font-extrabold text-[#ffb347] mt-1">
            {analysis.time_to_encounter_hours.toFixed(1)} <span className="text-xs font-normal">hrs</span>
          </p>
          <span className="text-[11px] font-rajdhani text-slate-400 mt-1 block">Reaction timeline</span>
        </div>

        <div className="orbit-card text-center p-5">
          <span className="text-[10px] font-orbitron uppercase text-[#8ba0c7]">Confidence Level</span>
          <p className="text-3xl font-orbitron font-extrabold text-[#22ffb7] mt-1">
            {analysis.data_quality}
          </p>
          <span className="text-[11px] font-rajdhani text-slate-400 mt-1 block">{analysis.data_source}</span>
        </div>
      </div>

      {/* RISK BREAKDOWN & DETERMINISTIC RATIONALE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 orbit-card p-6">
          <h3 className="text-xs font-orbitron font-bold text-white uppercase tracking-wider mb-4">
            Deterministic Hazard Penalty (0-100)
          </h3>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={breakdownData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <XAxis type="number" domain={[0, 60]} tick={{ fill: '#8ba0c7', fontSize: 10 }} />
                <YAxis dataKey="factor" type="category" tick={{ fill: '#e6f1ff', fontSize: 11 }} width={90} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#040b18', borderColor: '#00e5ff', fontSize: '11px', borderRadius: '8px' }}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {breakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-3 border-t border-[rgba(0,229,255,0.15)] text-center font-orbitron text-xs text-[#8ba0c7]">
            Composite Hazard Score: <strong className="text-white text-base">{analysis.risk_score} / 100</strong> ({analysis.risk_level})
          </div>
        </div>

        <div className="lg:col-span-7 orbit-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-orbitron font-bold text-white uppercase tracking-wider mb-3">
              Deterministic Flight Dynamics Rationale
            </h3>
            <p className="text-xs font-mono text-slate-200 leading-relaxed bg-[#030816]/90 p-4 rounded-xl border border-cyan-500/20">
              {analysis.deterministic_explanation}
            </p>

            <h4 className="text-[11px] font-orbitron font-bold text-[#8ba0c7] uppercase tracking-wider mt-4 mb-2">
              Identified Conjunction Factors:
            </h4>
            <ul className="space-y-2 font-mono text-xs text-slate-300">
              {analysis.risk_factors.map((factor, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff] mt-1.5 flex-shrink-0 shadow-[0_0_8px_#00e5ff]" />
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* AI EXPLANATION LAYER */}
      <div className="orbit-card p-6 space-y-4 border-cyan-400/40">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,229,255,0.18)]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#00e5ff]" />
            <h3 className="text-sm font-orbitron font-bold text-[#00e5ff] uppercase tracking-wider">
              AI Conjunction Assessment Layer
            </h3>
          </div>
          <span className="text-[10px] font-orbitron text-[#00e5ff] uppercase px-3 py-1 bg-cyan-950/60 border border-cyan-500/40 rounded-full">
            {analysis.calculation_metadata?.ai_status || 'Decision Support'}
          </span>
        </div>

        <p className="text-sm font-mono text-slate-200 leading-relaxed whitespace-pre-line bg-[#030816]/80 p-5 rounded-xl border border-cyan-500/20">
          {analysis.ai_explanation || 'Generating AI orbital assessment...'}
        </p>

        <p className="text-[10px] font-mono text-[#8ba0c7] italic">
          Safety Scope: OrbitShield AI explains deterministic numerical propagation results only. It never invents orbital parameters.
        </p>
      </div>

      {/* OPERATIONAL RECOMMENDATION */}
      <div className="orbit-card p-6 space-y-3 border-amber-500/30">
        <div className="flex items-center gap-2 pb-2 border-b border-[rgba(0,229,255,0.15)]">
          <ShieldCheck className="w-5 h-5 text-[#ffb347]" />
          <h3 className="text-xs font-orbitron font-bold text-[#ffb347] uppercase tracking-wider">
            Avoidance Maneuver Recommendation
          </h3>
        </div>

        <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl text-xs font-mono text-amber-200 leading-relaxed">
          {analysis.recommendation}
        </div>

        <p className="text-[10px] font-mono text-[#8ba0c7]">
          Notice: This recommendation is a decision-support output for the hackathon prototype and is not an operational spacecraft command.
        </p>
      </div>

      {/* INTERCONNECTED WORKFLOW BAR */}
      <div className="orbit-card p-6 bg-gradient-to-r from-[#070e1c] via-[#0c162d] to-[#070e1c] border-cyan-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_30px_rgba(0,229,255,0.15)]">
        <div className="space-y-1 text-center sm:text-left">
          <span className="text-xs font-orbitron font-bold text-[#00e5ff] uppercase tracking-wider flex items-center gap-2 justify-center sm:justify-start">
            <Bell className="w-4 h-4 text-cyan-400" />
            Mission Pipeline: Timely Alerts Active
          </span>
          <p className="text-xs font-mono text-slate-300">
            This conjunction analysis was recorded and converted into an operational alert.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <button
            onClick={() => navigate('/alerts')}
            className="px-6 py-3 bg-gradient-to-r from-rose-500 via-pink-600 to-amber-500 hover:opacity-90 text-white font-orbitron font-bold text-xs uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(255,56,96,0.4)] flex items-center gap-2 transition-all hover:scale-105"
          >
            <Bell className="w-4 h-4" />
            <span>Open Timely Alerts Queue</span>
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/analysis')}
            className="px-5 py-3 bg-[#0d182b] hover:bg-[#132442] text-cyan-300 border border-cyan-500/30 font-orbitron text-xs uppercase rounded-xl transition-all"
          >
            Screen Another Target
          </button>
        </div>
      </div>
    </div>
  );
};
