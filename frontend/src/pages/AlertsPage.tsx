import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  ExternalLink,
  Filter,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { Alert } from '../types';
import { PageHeader, StatusBadge, RiskBadge, LoadingState, ErrorState, EmptyState } from '../components/Common';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAlerts(filterStatus, filterSeverity);
      setAlerts(data);
    } catch (err) {
      setError('Failed to fetch conjunction alerts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [filterSeverity, filterStatus]);

  const handleReview = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.reviewAlert(id);
      loadAlerts();
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operational Conjunction Alerts"
        subtitle="Critical close-approach notifications exceeding automated screening thresholds"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-slate-400">SEVERITY:</span>
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                  filterSeverity === sev
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold'
                    : 'bg-[#0b101a] text-slate-400 border border-[#1b263b] hover:text-slate-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        }
      />

      {loading ? (
        <LoadingState message="Querying active conjunction alert log..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadAlerts} />
      ) : alerts.length === 0 ? (
        <EmptyState
          title="No Alerts Detected"
          description="All monitored space conjunctions are currently within nominal safety margins, or no alerts match the active filter."
          action={
            <button
              onClick={() => navigate('/analysis')}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold rounded"
            >
              Run New Conjunction Screening
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {alerts.map((alt) => {
            const isCritical = alt.severity === 'CRITICAL';
            return (
              <div
                key={alt.id}
                onClick={() => navigate(`/analysis/${alt.conjunction_id}`)}
                className={`p-4 rounded-lg border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isCritical
                    ? 'bg-rose-950/20 border-rose-800/80 hover:bg-rose-950/30'
                    : 'bg-[#0b101a] border-[#1b263b] hover:bg-[#101726]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {isCritical ? (
                      <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-orange-400" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-white">
                        {alt.title}
                      </span>
                      <RiskBadge level={alt.severity} score={alt.risk_score} />
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                          alt.status === 'ACTIVE'
                            ? 'bg-rose-950/80 text-rose-300 border-rose-700'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {alt.status}
                      </span>
                    </div>

                    <p className="text-xs font-mono text-slate-300">
                      {alt.message}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 pt-1">
                      <span>Miss Distance: <strong className="text-cyan-400">{alt.closest_approach_km?.toFixed(2) || '0.80'} km</strong></span>
                      <span>•</span>
                      <span>Target: {alt.primary_object_name || 'Protected Asset'}</span>
                      <span>•</span>
                      <span>Logged: {new Date(alt.created_at).toUTCString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
                  {alt.status === 'ACTIVE' && (
                    <button
                      onClick={(e) => handleReview(alt.id, e)}
                      className="px-3 py-1.5 bg-[#0e1828] hover:bg-[#16253d] text-slate-200 border border-[#20324d] font-mono text-xs rounded flex items-center gap-1.5 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Mark Reviewed</span>
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/analysis/${alt.conjunction_id}`)}
                    className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 font-mono text-xs font-semibold rounded flex items-center gap-1 transition-colors"
                  >
                    <span>Inspect</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
