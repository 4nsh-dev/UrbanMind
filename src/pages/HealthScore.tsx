import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Trash2, 
  Droplet, 
  Lightbulb, 
  TrendingUp, 
  Bot, 
  Sparkles, 
  RefreshCw, 
  Sliders, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle,
  Flame,
  ArrowRight,
  Info,
  ChevronRight,
  Wrench,
  Gauge
} from 'lucide-react';
import { motion } from 'motion/react';
import { pageVariants } from '../utils/motion';
import { Issue } from '../types';

interface HealthScoreProps {
  issues: Issue[];
}

export default function HealthScore({ issues }: HealthScoreProps) {
  // Count real, unresolved database issues for baseline
  const getLiveCount = (category: string) => {
    return issues.filter(issue => {
      const cat = issue.category.toLowerCase();
      const unresolved = issue.status !== 'resolved';
      if (category === 'pothole') return cat.includes('pothole') && unresolved;
      if (category === 'garbage') return cat.includes('garbage') && unresolved;
      if (category === 'water') return (cat.includes('water') || cat.includes('leak')) && unresolved;
      if (category === 'streetlight') return (cat.includes('streetlight') || cat.includes('light')) && unresolved;
      return false;
    }).length;
  };

  const livePotholes = getLiveCount('pothole');
  const liveGarbage = getLiveCount('garbage');
  const liveWater = getLiveCount('water');
  const liveStreetlights = getLiveCount('streetlight');

  // Tabs: 'live' or 'simulator'
  const [activeMode, setActiveMode] = useState<'live' | 'simulator'>('live');

  // Simulator state variables
  const [simPotholes, setSimPotholes] = useState(livePotholes || 4);
  const [simGarbage, setSimGarbage] = useState(liveGarbage || 3);
  const [simWater, setSimWater] = useState(liveWater || 2);
  const [simStreetlights, setSimStreetlights] = useState(liveStreetlights || 3);

  // Computed state values based on chosen mode
  const potholes = activeMode === 'live' ? livePotholes : simPotholes;
  const garbage = activeMode === 'live' ? liveGarbage : simGarbage;
  const waterIssues = activeMode === 'live' ? liveWater : simWater;
  const streetlights = activeMode === 'live' ? liveStreetlights : simStreetlights;

  // React state for dynamic API output
  const [loading, setLoading] = useState(false);
  const [healthData, setHealthData] = useState<any | null>(null);

  // Fetch from our newly created API route
  const fetchHealthScore = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/community-health-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          potholes,
          garbage,
          waterIssues,
          streetlights
        })
      });
      if (response.ok) {
        const data = await response.json();
        setHealthData(data);
      } else {
        throw new Error('API route failed');
      }
    } catch (err) {
      console.error('Failed to load health scores from backend API:', err);
      // Fallback calculation directly client-side if API fails
      const rH = Math.max(10, Math.min(100, 100 - (potholes * 7)));
      const cl = Math.max(10, Math.min(100, 100 - (garbage * 8)));
      const wI = Math.max(10, Math.min(100, 100 - (waterIssues * 12)));
      const sI = Math.max(10, Math.min(100, 100 - (streetlights * 9)));
      const overall = Math.round((rH + cl + wI + sI) * 0.25);
      
      setHealthData({
        roadHealth: rH,
        cleanliness: cl,
        waterInfrastructure: wI,
        safetyIndex: sI,
        overallScore: overall,
        statusLabel: overall >= 80 ? 'EXCELLENT' : (overall >= 60 ? 'STABLE' : 'MODERATE STRAIN'),
        aiAnalysis: {
          summary: "Local client engine evaluated standard infrastructure indices. Severe reports trigger progressive resource exhaustion warnings.",
          riskForecast: "Prolonged reports increase resident travel times and nocturnal safety risks.",
          recommendations: [
            "Initiate hot-mix road patchwork teams.",
            "Expand local waste receptacle pickups.",
            "Establish streetlight grid patrols."
          ],
          simulated: true
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Re-run whenever relevant input changes
  useEffect(() => {
    fetchHealthScore();
  }, [potholes, garbage, waterIssues, streetlights]);

  // Color functions based on specific sub-scores
  const getMetricColor = (score: number) => {
    if (score >= 80) return { text: 'text-emerald-600', fill: 'bg-emerald-500', bg: 'bg-emerald-50 border-emerald-200/60', label: 'Healthy State' };
    if (score >= 55) return { text: 'text-indigo-600', fill: 'bg-indigo-500', bg: 'bg-indigo-50 border-indigo-200/60', label: 'Minor Concern' };
    if (score >= 35) return { text: 'text-amber-600', fill: 'bg-amber-500', bg: 'bg-amber-50 border-amber-200/60', label: 'Degraded' };
    return { text: 'text-rose-600', fill: 'bg-rose-500', bg: 'bg-rose-50 border-rose-200/60', label: 'Critical Alert' };
  };

  const currentOverall = healthData?.overallScore ?? 100;
  const overallColor = getMetricColor(currentOverall);

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left space-y-8" 
      id="community-health-score-dashboard"
    >
      
      {/* Page Title & Explanation block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F0FE] border border-[#D2E3FC] text-xs font-bold text-[#1A73E8]">
            <Sparkles className="w-3.5 h-3.5 text-[#1A73E8] animate-pulse" />
            <span>AI Infrastructure Audit Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-sans font-black tracking-tight text-neutral-900">
            Neighborhood Health Scores
          </h2>
          <p className="text-xs text-neutral-500 max-w-2xl leading-relaxed">
            Every reported spot in our network impacts the dynamic community viability ratings. This diagnostic interface uses mathematically weighted calculations and server-side <strong>Gemini models</strong> to forecast municipal risks and suggest strategic volunteer interventions.
          </p>
        </div>

        {/* Live Mode Selection Drawer */}
        <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200 self-start md:self-center shrink-0">
          <button
            onClick={() => setActiveMode('live')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'live' 
                ? 'bg-white text-indigo-700 shadow-sm' 
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Live Database Counts</span>
          </button>
          
          <button
            onClick={() => setActiveMode('simulator')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'simulator' 
                ? 'bg-white text-indigo-700 shadow-sm' 
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Simulator Playground</span>
          </button>
        </div>
      </div>

      {/* Grid Layout: Main Gauge & Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Dynamic overall dial and index cards */}
        <div className="md:col-span-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            
            {/* Gigantic Overall Score dial */}
            <div className="md:col-span-5 bg-white border border-neutral-200 rounded-3xl p-6 flex flex-col justify-between items-center text-center shadow-xs min-h-[300px]">
              
              <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                Overall Community Score
              </span>

              {/* Graphical Circular Meter dial */}
              <div className="relative my-4 flex items-center justify-center">
                
                {/* SVG circular track background */}
                <svg className="w-36 h-36 transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r="64"
                    className="stroke-neutral-100 fill-transparent"
                    strokeWidth="10"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="64"
                    className={`fill-transparent transition-all duration-1000 ${
                      currentOverall >= 80 ? 'stroke-emerald-500' :
                      currentOverall >= 55 ? 'stroke-indigo-500' :
                      currentOverall >= 35 ? 'stroke-amber-500' : 'stroke-rose-500'
                    }`}
                    strokeWidth="10"
                    strokeDasharray={402}
                    strokeDashoffset={402 - (402 * currentOverall) / 100}
                    strokeLinecap="round"
                  />
                </svg>

                {/* Inner Score Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-sans font-black tracking-tight text-neutral-900">
                    {loading ? (
                      <RefreshCw className="w-8 h-8 text-neutral-400 animate-spin" />
                    ) : (
                      `${currentOverall}%`
                    )}
                  </span>
                  <span className={`text-[8.5px] font-black tracking-wider uppercase mt-1 px-2 py-0.5 rounded-full ${overallColor.bg} ${overallColor.text}`}>
                    {healthData?.statusLabel || 'EVALUATING'}
                  </span>
                </div>

              </div>

              <div className="space-y-1 w-full text-center">
                <p className="text-xs font-semibold text-neutral-500">
                  {overallColor.label} Range
                </p>
                <p className="text-[9.5px] text-neutral-400 max-w-xs mx-auto leading-normal">
                  Weighted sum index across active potholes, safety grids, sanitation reports, and hydrants.
                </p>
              </div>

            </div>

            {/* AI Diagnostics Strategic Assessment Card */}
            <div className="md:col-span-7 bg-white border border-[#DADCE0] rounded-3xl p-6 flex flex-col justify-between shadow-xs relative overflow-hidden text-left hover:shadow-md transition-all duration-200">
              
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#1A73E8]/5 rounded-full -mr-16 -mt-16 pointer-events-none blur-xl" />
              
              <div className="space-y-4 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 bg-[#E8F0FE] border border-[#D2E3FC] px-3 py-1 rounded-full text-[10px] font-bold text-[#1A73E8] uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-[#1A73E8] animate-pulse" />
                    <span>Gemini Core Analytics</span>
                  </div>
                  {loading && (
                    <RefreshCw className="w-4 h-4 text-[#1A73E8] animate-spin" />
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-neutral-800 tracking-tight flex items-center gap-1.5">
                    <span>MUNICIPAL DIAGNOSTIC ASSESSMENT</span>
                  </h4>
                  <p className="text-xs text-neutral-600 font-medium leading-relaxed">
                    {loading ? (
                      <span className="text-neutral-400 italic">Querying model parameters and historical triage indexes...</span>
                    ) : (
                      healthData?.aiAnalysis?.summary || "Analyzing counts..."
                    )}
                  </p>
                </div>

                {/* Risk prediction box */}
                <div className="bg-[#FEF7E0] border border-[#FEEFC3] text-[#B06000] rounded-xl p-3 flex gap-2.5 items-start">
                  <AlertTriangle className="w-4.5 h-4.5 text-[#E37400] shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold uppercase text-[#B06000] tracking-wider">Predictive Risk Forecast</span>
                    <p className="text-[10px] text-[#804600] font-semibold leading-relaxed">
                      {loading ? (
                        <span className="text-[#A07030] italic">Evaluating cascading municipal indicators...</span>
                      ) : (
                        healthData?.aiAnalysis?.riskForecast || "Stable outlook."
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#E8EAED] pt-4 mt-4 flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                <span>Model: Gemini 3.5 Flash</span>
                {healthData?.aiAnalysis?.simulated && (
                  <span className="bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 text-[9px]">
                    ● High-fidelity Simulation Active
                  </span>
                )}
              </div>

            </div>

          </div>

          {/* Indicators Breakdown Bento list */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-neutral-400 uppercase tracking-widest text-left">
              Category Indices & Formulas
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Road Health Card */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-4.5 text-left space-y-3 shadow-3xs hover:border-neutral-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Wrench className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-neutral-800">Road Health</h5>
                      <span className="text-[8px] text-neutral-400 font-mono font-bold">100 - (Potholes * 7)</span>
                    </div>
                  </div>
                  <span className={`text-sm font-black font-mono ${getMetricColor(healthData?.roadHealth ?? 100).text}`}>
                    {healthData?.roadHealth ?? 100}%
                  </span>
                </div>
                
                {/* Visual health line */}
                <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${getMetricColor(healthData?.roadHealth ?? 100).fill}`}
                    style={{ width: `${healthData?.roadHealth ?? 100}%` }}
                  />
                </div>

                <p className="text-[10px] text-neutral-500 font-semibold flex items-center justify-between">
                  <span>Potholes outstanding:</span>
                  <span className="text-neutral-800 font-black">{potholes} active</span>
                </p>
              </div>

              {/* Cleanliness Card */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-4.5 text-left space-y-3 shadow-3xs hover:border-neutral-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Trash2 className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-neutral-800">Cleanliness Index</h5>
                      <span className="text-[8px] text-neutral-400 font-mono font-bold">100 - (Garbage * 8)</span>
                    </div>
                  </div>
                  <span className={`text-sm font-black font-mono ${getMetricColor(healthData?.cleanliness ?? 100).text}`}>
                    {healthData?.cleanliness ?? 100}%
                  </span>
                </div>
                
                {/* Visual health line */}
                <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${getMetricColor(healthData?.cleanliness ?? 100).fill}`}
                    style={{ width: `${healthData?.cleanliness ?? 100}%` }}
                  />
                </div>

                <p className="text-[10px] text-neutral-500 font-semibold flex items-center justify-between">
                  <span>Garbage clusters:</span>
                  <span className="text-neutral-800 font-black">{garbage} active</span>
                </p>
              </div>

              {/* Water Infrastructure Card */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-4.5 text-left space-y-3 shadow-3xs hover:border-neutral-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Droplet className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-neutral-800">Water Infrastructure</h5>
                      <span className="text-[8px] text-neutral-400 font-mono font-bold">100 - (Water * 12)</span>
                    </div>
                  </div>
                  <span className={`text-sm font-black font-mono ${getMetricColor(healthData?.waterInfrastructure ?? 100).text}`}>
                    {healthData?.waterInfrastructure ?? 100}%
                  </span>
                </div>
                
                {/* Visual health line */}
                <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${getMetricColor(healthData?.waterInfrastructure ?? 100).fill}`}
                    style={{ width: `${healthData?.waterInfrastructure ?? 100}%` }}
                  />
                </div>

                <p className="text-[10px] text-neutral-500 font-semibold flex items-center justify-between">
                  <span>Hydrant/Leak reports:</span>
                  <span className="text-neutral-800 font-black">{waterIssues} active</span>
                </p>
              </div>

              {/* Safety Index Card */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-4.5 text-left space-y-3 shadow-3xs hover:border-neutral-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Lightbulb className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-neutral-800">Safety Index</h5>
                      <span className="text-[8px] text-neutral-400 font-mono font-bold">100 - (Streetlights * 9)</span>
                    </div>
                  </div>
                  <span className={`text-sm font-black font-mono ${getMetricColor(healthData?.safetyIndex ?? 100).text}`}>
                    {healthData?.safetyIndex ?? 100}%
                  </span>
                </div>
                
                {/* Visual health line */}
                <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${getMetricColor(healthData?.safetyIndex ?? 100).fill}`}
                    style={{ width: `${healthData?.safetyIndex ?? 100}%` }}
                  />
                </div>

                <p className="text-[10px] text-neutral-500 font-semibold flex items-center justify-between">
                  <span>Dark/Lamp issues:</span>
                  <span className="text-neutral-800 font-black">{streetlights} active</span>
                </p>
              </div>

            </div>

          </div>

        </div>

        {/* Right Side: Active Mode Configurations & Suggestions */}
        <div className="md:col-span-4 space-y-8">
          
          {/* Active Mode Control Configuration Box */}
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 text-left space-y-5 shadow-xs">
            
            <div className="space-y-1">
              <h4 className="text-xs font-black text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                {activeMode === 'live' ? (
                  <>
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span>Live Database Metrics</span>
                  </>
                ) : (
                  <>
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    <span>Simulator Playground</span>
                  </>
                )}
              </h4>
              <p className="text-[10px] text-neutral-400 font-semibold leading-relaxed">
                {activeMode === 'live' 
                  ? "Scores below are calculated based on active, unresolved complaints recorded by citizens in the live feed database." 
                  : "Tweak variables below to simulate different pressure models and test community resilience triggers in real time."}
              </p>
            </div>

            {activeMode === 'live' ? (
              <div className="space-y-3">
                <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-150 flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-600">Potholes Reports:</span>
                  <span className="text-xs font-black text-neutral-800 bg-white border px-2.5 py-1 rounded-lg shadow-3xs">{livePotholes}</span>
                </div>
                <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-150 flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-600">Garbage Reports:</span>
                  <span className="text-xs font-black text-neutral-800 bg-white border px-2.5 py-1 rounded-lg shadow-3xs">{liveGarbage}</span>
                </div>
                <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-150 flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-600">Water Infrastructure:</span>
                  <span className="text-xs font-black text-neutral-800 bg-white border px-2.5 py-1 rounded-lg shadow-3xs">{liveWater}</span>
                </div>
                <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-150 flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-600">Streetlight Reports:</span>
                  <span className="text-xs font-black text-neutral-800 bg-white border px-2.5 py-1 rounded-lg shadow-3xs">{liveStreetlights}</span>
                </div>

                <div className="bg-blue-50/50 text-blue-800 border border-blue-100 p-3.5 rounded-xl text-[10px] leading-relaxed font-semibold">
                  To recalculate active live indices, navigate to the <strong>Report Spot</strong> page to file a real incident, or click mock reports.
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-1">
                
                {/* Simulator Pothole count */}
                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-neutral-700">Potholes</span>
                    <span className="font-mono font-black text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded text-[11px]">
                      {simPotholes} active
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={simPotholes}
                    onChange={(e) => setSimPotholes(parseInt(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-neutral-200 rounded-lg appearance-none"
                  />
                </div>

                {/* Simulator Garbage count */}
                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-neutral-700">Garbage Accumulation</span>
                    <span className="font-mono font-black text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded text-[11px]">
                      {simGarbage} active
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={simGarbage}
                    onChange={(e) => setSimGarbage(parseInt(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-neutral-200 rounded-lg appearance-none"
                  />
                </div>

                {/* Simulator Water issues count */}
                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-neutral-700">Water Infrastructure</span>
                    <span className="font-mono font-black text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded text-[11px]">
                      {simWater} active
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={simWater}
                    onChange={(e) => setSimWater(parseInt(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-neutral-200 rounded-lg appearance-none"
                  />
                </div>

                {/* Simulator Streetlight issues count */}
                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-neutral-700">Broken Streetlights</span>
                    <span className="font-mono font-black text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded text-[11px]">
                      {simStreetlights} active
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={simStreetlights}
                    onChange={(e) => setSimStreetlights(parseInt(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-neutral-200 rounded-lg appearance-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={fetchHealthScore}
                  disabled={loading}
                  className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:bg-neutral-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Force Re-Analyze Playground</span>
                </button>
              </div>
            )}

          </div>

          {/* AI Recommended Community Action Checklist */}
          <div className="bg-white border border-[#DADCE0] rounded-3xl p-6 text-left space-y-4 shadow-xs">
            
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#1A73E8]" />
                <span>Strategic Interventions</span>
              </h4>
              <p className="text-[10px] text-neutral-500 font-medium leading-relaxed">
                Suggested tactical activities compiled by Gemini to optimize localized health indexes:
              </p>
            </div>

            <div className="space-y-3.5">
              {loading ? (
                <div className="space-y-2 py-3">
                  <div className="h-6 bg-neutral-50 rounded-lg animate-pulse w-full" />
                  <div className="h-6 bg-neutral-50 rounded-lg animate-pulse w-11/12" />
                  <div className="h-6 bg-neutral-50 rounded-lg animate-pulse w-4/5" />
                </div>
              ) : (
                healthData?.aiAnalysis?.recommendations?.map((rec: string, index: number) => (
                  <div key={index} className="flex gap-2.5 items-start bg-[#F8F9FA] p-3 rounded-2xl border border-[#E8EAED] hover:border-[#DADCE0] transition-colors">
                    <span className="w-5 h-5 rounded-full bg-[#E8F0FE] border border-[#D2E3FC] flex items-center justify-center text-[10px] font-bold font-mono text-[#1A73E8] shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <p className="text-[10.5px] leading-relaxed text-neutral-700 font-semibold">
                      {rec}
                    </p>
                  </div>
                )) || (
                  <p className="text-xs text-neutral-400 italic">No instructions retrieved.</p>
                )
              )}
            </div>

          </div>

        </div>

      </div>

    </motion.div>
  );
}
