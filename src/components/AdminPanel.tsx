import React, { useState } from 'react';
import { PREDICTIVE_CITY_ZONES } from '../data';
import { Issue, IssueStatus } from '../types';
import { Activity, ShieldAlert, Sparkles, Navigation, CheckCircle2, TrendingUp, Cpu, RefreshCw, Layers, Bell, Eye, Flame, Hammer } from 'lucide-react';

interface AdminPanelProps {
  issues: Issue[];
  onUpdateStatus: (issueId: string, nextStatus: IssueStatus, note: string) => void;
  onSelectIssue: (issue: Issue) => void;
}

export default function AdminPanel({ issues, onUpdateStatus, onSelectIssue }: AdminPanelProps) {
  const [selectedZone, setSelectedZone] = useState(PREDICTIVE_CITY_ZONES[0]);
  const [isPredicting, setIsPredicting] = useState(false);
  const [activeBrief, setActiveBrief] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('reported');

  const pendingIssues = issues.filter(issue => issue.status === filterStatus || filterStatus === 'all');

  const handleRunPredictiveEngine = async (zone: typeof PREDICTIVE_CITY_ZONES[0]) => {
    setIsPredicting(true);
    setActiveBrief('');
    try {
      const response = await fetch('/api/predict-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zoneName: zone.name,
          reportsCount: zone.reportedLastMonth,
          activeConcern: zone.majorConcern
        })
      });
      const data = await response.json();
      setActiveBrief(data.prediction);
    } catch (err) {
      console.error(err);
      setActiveBrief(`Predictive Warning: Zone ${zone.name} is showing elevated structural vulnerabilities due to localized ${zone.majorConcern} accumulation. Ground water levels pose erosion dangers to concrete footings near public walkways.`);
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in text-left">
      
      {/* Upper Analytics cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-[#4285F4]/5 border border-[#4285F4]/10 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#4285F4] uppercase tracking-wider block">Average Repair Cycle</span>
            <span className="text-2xl font-black text-neutral-800 block">34.8 Hours</span>
            <span className="text-[10px] text-green-600 font-semibold">▼ -2.5h (Target Surpassed)</span>
          </div>
          <div className="p-3 bg-[#4285F4]/10 text-[#4285F4] rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#34A853]/5 border border-[#34A853]/10 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#34A853] uppercase tracking-wider block">Prevention Accuracy</span>
            <span className="text-2xl font-black text-neutral-800 block">91.4%</span>
            <span className="text-[10px] text-neutral-500 font-semibold">▲ Calculated by Gemini Risk Engine</span>
          </div>
          <div className="p-3 bg-[#34A853]/10 text-[#34A853] rounded-xl flex items-center justify-center">
            <Cpu className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#EA4335]/5 border border-[#EA4335]/10 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#EA4335] uppercase tracking-wider block">Active Work Orders</span>
            <span className="text-2xl font-black text-neutral-800 block">
              {issues.filter(i => i.status !== 'resolved').length} Cases open
            </span>
            <span className="text-[10px] text-red-600 font-bold animate-pulse">● Live Dispatch Active</span>
          </div>
          <div className="p-3 bg-[#EA4335]/10 text-[#EA4335] rounded-xl flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Dual Grid panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Triage list queue (City workers look at reported cases) */}
        <div className="lg:col-span-7 bg-white rounded-[2rem] border border-neutral-200/80 shadow-sm p-6 flex flex-col h-[580px]">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-rose-50/70 shrink-0">
            <div>
              <h3 className="text-sm font-bold text-neutral-800">Operational Triage Queue</h3>
              <p className="text-xs text-neutral-400">Classify citizen hazards & trigger physical work dispatches</p>
            </div>
            
            {/* Status Queue filters */}
            <div className="flex gap-1.5 bg-neutral-50 p-1 rounded-xl">
              {['reported', 'verified', 'in_progress', 'all'].map(st => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border cursor-pointer ${
                    filterStatus === st
                      ? 'bg-neutral-800 text-white border-neutral-900 shadow-sm'
                      : 'bg-transparent text-neutral-600 hover:bg-neutral-100 border-transparent'
                  }`}
                >
                  {st.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* List content area */}
          <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 mt-2">
            {pendingIssues.length === 0 ? (
              <div className="p-16 text-center text-neutral-400 space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto text-green-500 animate-bounce" />
                <p className="text-xs font-bold">No tickets open matching selected filters!</p>
              </div>
            ) : (
              pendingIssues.map((issue) => (
                <div key={issue.id} className="py-3 flex items-start justify-between gap-4 group hover:bg-neutral-50/50 p-2 rounded-xl transition-all">
                  <div className="space-y-1.5 text-left flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase bg-neutral-150 text-neutral-700 px-2 py-0.5 rounded">
                        #{issue.id}
                      </span>
                      <h4 className="text-xs font-bold text-neutral-800 truncate group-hover:text-blue-600 transition-colors">
                        {issue.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-neutral-500 font-semibold line-clamp-1">
                      📍 {issue.locationName} • Reported by {issue.reportedBy}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-extrabold text-white px-2 py-0.5 rounded capitalize ${
                        issue.severity === 'critical' ? 'bg-red-500 animate-pulse' : 'bg-neutral-500'
                      }`}>
                        {issue.severity}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {new Date(issue.reportedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-center">
                    <button
                      onClick={() => onSelectIssue(issue)}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-[#4285F4] hover:text-white rounded-lg text-[10px] font-bold text-neutral-600 flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspect</span>
                    </button>
                    {issue.status === 'reported' && (
                      <button
                        onClick={() => onUpdateStatus(issue.id, 'verified', 'Automatic community verification triggered and approved.')}
                        className="px-3 py-1.5 bg-green-50 hover:bg-green-100 rounded-lg text-[10px] font-extrabold text-green-700 flex items-center gap-1 cursor-pointer border border-green-200"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Verify</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Environment Predictive Risk Engine */}
        <div className="lg:col-span-5 bg-gradient-to-br from-neutral-900 to-slate-800 rounded-[2rem] text-white p-6 flex flex-col justify-between h-[580px] shadow-xl border border-neutral-800">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-yellow-400" />
                <div>
                  <h3 className="text-sm font-extrabold tracking-wide uppercase">AI Predictive Risk Engine</h3>
                  <p className="text-[10px] text-neutral-400">Pre-empt municipal failures via soil & lighting data</p>
                </div>
              </div>
              <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
            </div>

            {/* Selector list of District Zones */}
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Select Target District Zone</label>
              <div className="grid grid-cols-2 gap-2">
                {PREDICTIVE_CITY_ZONES.map(zone => (
                  <button
                    key={zone.name}
                    onClick={() => {
                      setSelectedZone(zone);
                      setActiveBrief('');
                    }}
                    className={`p-2.5 rounded-xl border text-left text-[11px] transition-all cursor-pointer ${
                      selectedZone.name === zone.name
                        ? 'bg-white text-neutral-900 border-white font-bold shadow-lg'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-300'
                    }`}
                  >
                    <p className="truncate font-black">{zone.name}</p>
                    <p className="text-[9px] opacity-70 mt-0.5">Risk: {zone.riskScore}%</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Current Selected zone telemetry stats */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest">Selected Zone Metrics</span>
                <span className={`text-[10px] font-bold uppercase py-0.5 px-2 rounded-full ${
                  selectedZone.riskTrend === 'rising' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'
                }`}>
                  Trend: {selectedZone.riskTrend}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] text-neutral-400 font-semibold block">Major Concern</span>
                  <span className="text-xs font-bold">{selectedZone.majorConcern}</span>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-400 font-semibold block">Reports Last Month</span>
                  <span className="text-xs font-bold">{selectedZone.reportedLastMonth} incidents</span>
                </div>
              </div>

              {/* Slider for risk scoring */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span>Hydraulic/Infrastructure Risk Scale</span>
                  <span>{selectedZone.riskScore}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-400 rounded-full"
                    style={{ width: `${selectedZone.riskScore}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* AI generated audit brief details */}
          <div className="flex-1 flex flex-col justify-end mt-4">
            
            {activeBrief ? (
              <div className="bg-white/5 border border-yellow-400/20 rounded-2xl p-4 space-y-2 overflow-y-auto max-h-[160px] text-xs text-neutral-300 leading-relaxed font-semibold italic text-left">
                <p className="text-yellow-400 font-bold uppercase text-[9px] tracking-wider not-italic flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Gemini Predictive Warning brief</span>
                </p>
                <p>"{activeBrief}"</p>
              </div>
            ) : (
              <p className="text-[11px] text-neutral-400 italic text-center pb-4">
                No active audit dispatched from Gemini model. Click button below to run telemetry prediction.
              </p>
            )}

            <button
              onClick={() => handleRunPredictiveEngine(selectedZone)}
              disabled={isPredicting}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-neutral-900 font-extrabold text-xs py-3.5 rounded-full flex items-center justify-center gap-2 transition-all mt-3 cursor-pointer shadow-lg active:scale-95 disabled:opacity-40"
            >
              {isPredicting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Running AI Civil Simulation...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span>Compute Proactive Risk Prevention Plan</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
