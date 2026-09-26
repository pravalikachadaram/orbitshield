import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Search, Filter, ExternalLink, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { ConjunctionHistoryItem } from '../types';
import { PageHeader, StatusBadge, RiskBadge, LoadingState, ErrorState, EmptyState } from '../components/Common';

export const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<ConjunctionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const navigate = useNavigate();

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getHistory(100);
      setHistory(data);
    } catch (err) {
      setError('Unable to load conjunction history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.primary_object_name.toLowerCase().includes(search.toLowerCase()) ||
      item.secondary_object_name.toLowerCase().includes(search.toLowerCase()) ||
      item.primary_object_norad.includes(search) ||
      item.secondary_object_norad.includes(search) ||
      item.conjunction_id.includes(search);

    const matchesRisk = riskFilter === 'ALL' || item.risk_level === riskFilter;
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analysis History & Ephemeris Archive"
        subtitle="Permanent audit trail of evaluated orbital conjunction encounters"
        actions={
          <button
            onClick={loadHistory}
            className="px-3 py-1.5 bg-[#0e1726] hover:bg-[#162338] text-slate-300 font-mono text-xs border border-[#1e2a3c] rounded flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>REFRESH ARCHIVE</span>
          </button>
        }
      />

      {/* FILTER & SEARCH CONTROLS */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#0b101a] border border-[#1b263b] p-4 rounded-lg">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by object name, NORAD or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#060910] border border-[#1e2a3c] rounded text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-mono text-slate-400">RISK:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setRiskFilter(lvl)}
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                riskFilter === lvl
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold'
                  : 'bg-[#070b13] text-slate-400 border border-[#1b263b] hover:text-slate-200'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingState message="Reading database conjunction records..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadHistory} />
      ) : filteredHistory.length === 0 ? (
        <EmptyState
          title="No Archive Records"
          description="No historical conjunctions found matching your query."
          action={
            <button
              onClick={() => navigate('/analysis')}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold rounded"
            >
              Launch First Analysis Run
            </button>
          }
        />
      ) : (
        <div className="bg-[#0b101a] border border-[#1b263b] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[#070b13] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#1b263b]">
                <tr>
                  <th className="py-3 px-4">Event ID</th>
                  <th className="py-3 px-4">Protected Asset</th>
                  <th className="py-3 px-4">Threat Object</th>
                  <th className="py-3 px-4">Miss Distance</th>
                  <th className="py-3 px-4">Rel Velocity</th>
                  <th className="py-3 px-4">Risk Evaluation</th>
                  <th className="py-3 px-4">TCA (UTC)</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#151f2e] text-slate-300">
                {filteredHistory.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => navigate(`/analysis/${item.conjunction_id}`)}
                    className="hover:bg-[#111928] cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 text-cyan-400 font-mono">
                      #{item.conjunction_id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-white">{item.primary_object_name}</span>
                      <span className="block text-[10px] text-slate-500">#{item.primary_object_norad}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-200">{item.secondary_object_name}</span>
                      <span className="block text-[10px] text-slate-500">#{item.secondary_object_norad}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-cyan-300">
                      {item.closest_approach_km.toFixed(2)} km
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {item.relative_velocity_km_s.toFixed(2)} km/s
                    </td>
                    <td className="py-3 px-4">
                      <RiskBadge level={item.risk_level} score={item.risk_score} />
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(item.time_of_closest_approach).toUTCString().slice(5, 22)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center text-cyan-400 hover:text-cyan-300 text-xs font-semibold gap-1">
                        <span>Reopen</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
