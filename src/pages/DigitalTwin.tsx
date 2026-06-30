import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, 
  Layers, 
  Activity, 
  Radio, 
  Sparkles, 
  RefreshCw, 
  Sliders, 
  Database, 
  Terminal, 
  TrendingUp, 
  ShieldAlert, 
  Eye, 
  Compass, 
  MapPin, 
  Wrench, 
  Trash2, 
  Droplet, 
  Lightbulb, 
  AlertTriangle,
  Info,
  ChevronRight,
  Globe,
  Gauge
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Issue } from '../types';

interface DigitalTwinProps {
  issues: Issue[];
}

interface TelemetryLog {
  id: string;
  timestamp: string;
  source: string;
  message: string;
  type: 'info' | 'warning' | 'critical' | 'success';
}

export default function DigitalTwin({ issues }: DigitalTwinProps) {
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

  // Interactive modes: 'database' (live count) or 'simulation'
  const [twinMode, setTwinMode] = useState<'database' | 'simulation'>('database');

  // Simulation Sliders
  const [simPotholes, setSimPotholes] = useState(livePotholes || 5);
  const [simGarbage, setSimGarbage] = useState(liveGarbage || 4);
  const [simWater, setSimWater] = useState(liveWater || 2);
  const [simStreetlights, setSimStreetlights] = useState(liveStreetlights || 3);

  // Active Map Layer toggles
  const [showMesh, setShowMesh] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showNodes, setShowNodes] = useState(true);

  // Active selected sector for telemetry drill-down
  const [selectedSector, setSelectedSector] = useState<'all' | 'dolores' | 'soma' | 'mission'>('all');

  // Twin dynamic state variables loaded from backend
  const [loading, setLoading] = useState(false);
  const [twinData, setTwinData] = useState<any | null>(null);

  // Real-time telemetry log feed state
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const potholes = twinMode === 'database' ? livePotholes : simPotholes;
  const garbage = twinMode === 'database' ? liveGarbage : simGarbage;
  const waterIssues = twinMode === 'database' ? liveWater : simWater;
  const streetlights = twinMode === 'database' ? liveStreetlights : simStreetlights;

  // Trigger scanning effect
  const [isScanning, setIsScanning] = useState(false);

  // Fetch twin simulation data from backend
  const fetchTwinAnalysis = async () => {
    setLoading(true);
    setIsScanning(true);
    
    // Add scanning log
    addLog('Grid Core Engine', 'Initiating full mesh diagnostic sweep...', 'info');

    try {
      const response = await fetch('/api/digital-twin-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          potholes,
          garbage,
          waterIssues,
          streetlights,
          sector: selectedSector
        })
      });

      if (response.ok) {
        const data = await response.json();
        setTwinData(data);
        addLog('Grid Core Engine', `Twin synchronized successfully. Score: ${data.overallScore}% (${data.statusLabel})`, 'success');
      } else {
        throw new Error('Twin API failed');
      }
    } catch (err) {
      console.error('Twin API load failed, performing local computation:', err);
      
      // Client computation fallback
      const rH = Math.max(10, Math.min(100, 100 - (potholes * 7.5)));
      const cl = Math.max(10, Math.min(100, 100 - (garbage * 8.5)));
      const wI = Math.max(10, Math.min(100, 100 - (waterIssues * 13)));
      const sI = Math.max(10, Math.min(100, 100 - (streetlights * 10)));
      const overall = Math.round((rH + cl + wI + sI) * 0.25);
      
      const dR = Math.max(5, Math.min(95, Math.round((waterIssues * 15 + streetlights * 12 + potholes * 5) * 0.6)));
      const sR = Math.max(10, Math.min(98, Math.round((potholes * 18 + streetlights * 10 + garbage * 10) * 0.75)));
      const mR = Math.max(15, Math.min(99, Math.round((garbage * 16 + streetlights * 14 + waterIssues * 8) * 0.85)));

      setTwinData({
        roadHealth: rH,
        cleanliness: cl,
        waterInfrastructure: wI,
        safetyIndex: sI,
        overallScore: overall,
        sectorRisks: {
          dolores: dR,
          soma: sR,
          mission: mR
        },
        statusLabel: overall >= 80 ? 'OPTIMAL' : (overall >= 60 ? 'STABLE' : 'VULNERABLE'),
        aiAnalysis: {
          twinStateSummary: `Local client engine synchronized physical indicators. High report volumes in several nodes require volunteer/dispatch balancing.`,
          predictiveTimeline: "Pavement and lighting decay multipliers are expected to remain steady unless wet weather factors trigger cascading failures.",
          anomaliesCount: potholes + garbage + waterIssues + streetlights,
          recommendations: [
            "Dispatch reactive patch crews to potholes inside the Soma grid.",
            "Instruct volunteer walking groups to run a safety inspection of dim streetlights.",
            "Log hydraulic pressure indices to verify potential valve friction."
          ],
          simulated: true
        }
      });
      addLog('Fallback Local Engine', 'Twin calculation rendered client-side.', 'warning');
    } finally {
      setLoading(false);
      setTimeout(() => setIsScanning(false), 800);
    }
  };

  // Helper to add telemetry log entries
  const addLog = (source: string, message: string, type: 'info' | 'warning' | 'critical' | 'success' = 'info') => {
    const timeString = new Date().toLocaleTimeString('en-US', { hour12: false });
    const newLog: TelemetryLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: timeString,
      source,
      message,
      type
    };
    setLogs(prev => {
      const updated = [...prev, newLog];
      if (updated.length > 40) updated.shift(); // keep last 40 logs
      return updated;
    });
  };

  // Initialize logs and run periodic simulated sensor feedback
  useEffect(() => {
    // Seed initial logs
    addLog('System Kernel', 'Initializing Civic Digital Twin telemetry array...', 'info');
    addLog('Sensor Hub', 'Connected to 110 smart streetlight photo-sensors.', 'success');
    addLog('Water API', 'Arterial flow meters reported nominal 54 PSI pressure.', 'info');
    addLog('Sanitation AI', 'Waste level monitoring array calibrated.', 'success');
    
    fetchTwinAnalysis();

    const interval = setInterval(() => {
      // Periodic randomized sensor ticks to make the dashboard feel alive and scientific!
      const systems = ['Hydraulic Meter #402', 'Smart-Bin Cluster D', 'Grid Photo-Resistor', 'Pavement G-Sensor #19'];
      const messages = [
        'Returned normal voltage rating.',
        'Sanitation bins reporting 42% spatial fill capacity.',
        'Minor vibration registered (3.2 Hz) - standard traffic pass.',
        'Ambient dusk index calibrated successfully.',
        'Hydraulic flux within stable ±0.4% deviation bounds.',
        'Heartbeat signal acknowledged.'
      ];
      const types: ('info' | 'warning' | 'success')[] = ['info', 'success', 'info'];
      
      const randomSys = systems[Math.floor(Math.random() * systems.length)];
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      const randomType = types[Math.floor(Math.random() * types.length)];
      
      addLog(randomSys, randomMsg, randomType);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  // Fetch twin data whenever relevant parameters modify
  useEffect(() => {
    fetchTwinAnalysis();
    addLog('Grid Simulation', `Recalculating twin parameters: Potholes(${potholes}) Garbage(${garbage}) Water(${waterIssues}) Light(${streetlights})`, 'info');
  }, [potholes, garbage, waterIssues, streetlights]);

  // Scroll logs to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Color configurations based on risk scoring (higher is worse)
  const getRiskAttributes = (score: number) => {
    if (score < 30) return { text: 'text-emerald-600', fill: 'bg-emerald-50 text-emerald-700 border-emerald-200', badge: 'LOW RISK', hex: '#10B981' };
    if (score < 60) return { text: 'text-amber-600', fill: 'bg-amber-50 text-amber-700 border-amber-200', badge: 'MODERATE', hex: '#F59E0B' };
    if (score < 80) return { text: 'text-orange-600', fill: 'bg-orange-50 text-orange-700 border-orange-200', badge: 'HIGH RISK', hex: '#F97316' };
    return { text: 'text-rose-600', fill: 'bg-rose-50 text-rose-700 border-rose-200', badge: 'CRITICAL', hex: '#EF4444' };
  };

  // Color functions for standard indicators (higher is better)
  const getIndicatorAttributes = (score: number) => {
    if (score >= 80) return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', fill: 'bg-gradient-to-r from-emerald-500 to-teal-500', barBg: 'bg-slate-100' };
    if (score >= 60) return { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', fill: 'bg-gradient-to-r from-blue-500 to-indigo-500', barBg: 'bg-slate-100' };
    if (score >= 40) return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', fill: 'bg-gradient-to-r from-amber-500 to-orange-500', barBg: 'bg-slate-100' };
    return { text: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', fill: 'bg-gradient-to-r from-rose-500 to-red-500', barBg: 'bg-slate-100' };
  };

  const currentScore = twinData?.overallScore ?? 100;
  const scoreTheme = getIndicatorAttributes(currentScore);

  // Trigger quick manual event simulations
  const triggerEvent = (type: string) => {
    if (twinMode !== 'simulation') {
      setTwinMode('simulation');
      addLog('Simulation Core', 'Switched grid core to SIMULATION PLAYGROUND.', 'warning');
    }

    if (type === 'leak') {
      setSimWater(prev => Math.min(20, prev + 4));
      addLog('Grid Intervention', 'ALERT: Simulated high pressure water leak registered in Soma corridor.', 'critical');
    } else if (type === 'blackout') {
      setSimStreetlights(prev => Math.min(20, prev + 5));
      addLog('Grid Intervention', 'ALERT: Simulated power grid twilight failure registered in Mission quadrant.', 'critical');
    } else if (type === 'storm') {
      setSimPotholes(prev => Math.min(20, prev + 3));
      setSimGarbage(prev => Math.min(20, prev + 2));
      addLog('Grid Intervention', 'ALERT: Simulated heavy storm sweeps SF Grid. Adding potholes and trash overflow.', 'warning');
    } else if (type === 'clear') {
      setSimPotholes(0);
      setSimGarbage(0);
      setSimWater(0);
      setSimStreetlights(0);
      addLog('Grid Intervention', 'GRID RESTORATION: All simulated nodes cleared to optimal. Resetting parameters.', 'success');
    }
  };

  return (
    <div 
      className="min-h-screen bg-neutral-50/70 text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900 pb-12" 
      id="digital-twin-dashboard-container"
    >
      
      {/* Top Premium Spatial Sub-Header Navigation Bar */}
      <div className="bg-white/95 backdrop-blur border-b border-neutral-200/60 px-4 sm:px-6 lg:px-8 py-4.5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm relative">
        
        <div className="flex items-center gap-3.5 self-start md:self-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 relative shadow-sm">
            <Cpu className="w-6 h-6 animate-pulse" />
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-black tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Spatial Engine Active</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 mt-1">
              Civic Digital Twin Grid
            </h1>
          </div>
        </div>

        {/* Dynamic Telemetry Status Badges */}
        <div className="flex flex-wrap items-center gap-3 self-end md:self-center w-full md:w-auto">
          <div className="bg-white border border-neutral-200 rounded-xl px-3.5 py-1.5 flex items-center gap-2 text-xs font-semibold shadow-sm text-neutral-600">
            <Database className="w-4 h-4 text-slate-400" />
            <span>Live Feed:</span>
            <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">{issues.length} Issues</span>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl px-3.5 py-1.5 flex items-center gap-2 text-xs font-semibold shadow-sm text-neutral-600">
            <Radio className="w-4 h-4 text-emerald-500" />
            <span>Engine Sync:</span>
            <span className={`font-bold uppercase ${twinMode === 'database' ? 'text-emerald-600' : 'text-amber-600'}`}>
              {twinMode === 'database' ? 'Live Mode' : 'Sandbox Mode'}
            </span>
          </div>

          {/* Sync mode switcher trigger */}
          <div className="bg-neutral-100 p-1 rounded-xl border border-neutral-200 flex shrink-0 shadow-inner">
            <button
              onClick={() => {
                setTwinMode('database');
                addLog('Mode Shift', 'Linked core state back to real city database.', 'success');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                twinMode === 'database' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              Live DB
            </button>
            <button
              onClick={() => {
                setTwinMode('simulation');
                addLog('Mode Shift', 'Initialized virtual simulated sandbox.', 'warning');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                twinMode === 'simulation' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              Sandbox
            </button>
          </div>
        </div>

      </div>

      {/* Main Content Dashboard layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Section: Overview Dial Gauge, Indicators & Gemini Prediction */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* 1. Large Holographic Overall Synchrony Gauge */}
          <div className="lg:col-span-3 bg-white border border-neutral-200/60 rounded-3xl p-6 flex flex-col justify-between items-center text-center relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
            
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Synchrony Index</span>
              <p className="text-xs text-neutral-500 font-medium leading-normal">Combined health of road, waste, water & safety grids</p>
            </div>

            {/* Glowing HUD Circle */}
            <div className="relative my-6 flex items-center justify-center">
              <div className="absolute w-40 h-40 rounded-full bg-slate-50 border border-slate-100 shadow-inner" />
              
              <svg className="w-36 h-36 transform -rotate-90 relative z-10">
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  className="stroke-neutral-100 fill-transparent"
                  strokeWidth="8"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  className="fill-transparent transition-all duration-1000"
                  stroke={
                    currentScore >= 80 ? '#10B981' :
                    currentScore >= 60 ? '#3B82F6' :
                    currentScore >= 40 ? '#F59E0B' : '#EF4444'
                  }
                  strokeWidth="8"
                  strokeDasharray={377}
                  strokeDashoffset={377 - (377 * currentScore) / 100}
                  strokeLinecap="round"
                />
              </svg>

              {/* Inner details */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10">
                <span className="text-4xl font-extrabold tracking-tight text-neutral-900">
                  {loading ? (
                    <RefreshCw className="w-8 h-8 text-neutral-400 animate-spin" />
                  ) : (
                    `${currentScore}%`
                  )}
                </span>
                <span className={`text-[9px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full border mt-1.5 ${
                  currentScore >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  currentScore >= 60 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  currentScore >= 40 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {twinData?.statusLabel || 'SYNCING'}
                </span>
              </div>
            </div>

            <div className="w-full text-center space-y-2">
              <div className="text-xs text-neutral-600 font-semibold flex items-center justify-center gap-1.5">
                <Activity className="w-4 h-4 text-indigo-500" />
                <span>Active Anomalies: <strong className="text-neutral-900">{potholes + garbage + waterIssues + streetlights} Nodes</strong></span>
              </div>
              <p className="text-[10px] text-neutral-400 font-medium leading-relaxed">
                Mesh integrity is calculated mathematically through weighted categories inside the active sectors.
              </p>
            </div>
          </div>

          {/* 2. Interactive Gemini Predictive Twin Analytics Module */}
          <div className="lg:col-span-5 bg-white border border-neutral-200/60 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-24 -mt-24 pointer-events-none blur-3xl" />
            
            <div className="space-y-4 z-10 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 px-3.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider text-amber-700 uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Gemini Predictive Engine</span>
                </div>
                
                {loading && (
                  <div className="flex items-center gap-1.5 text-xs text-indigo-500 font-medium">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Sweeping Grid...</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold tracking-tight text-slate-900">Grid Predictive Assessment</h3>
                <p className="text-xs text-neutral-600 leading-relaxed font-sans font-medium">
                  {loading ? (
                    <span className="text-neutral-400 italic font-normal">Querying AI model variables and compiling spatial timeline forecasts...</span>
                  ) : (
                    twinData?.aiAnalysis?.twinStateSummary || 'Synchronizing grid dimensions.'
                  )}
                </p>
              </div>

              {/* 48-72h Cascading forecast */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex gap-3 items-start">
                <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1 text-left">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Predictive Degradation Horizon</span>
                  <p className="text-xs text-neutral-700 font-medium leading-relaxed">
                    {loading ? (
                      <span className="text-neutral-400 italic font-normal">Processing soil friction ratios & lighting circuit indices...</span>
                    ) : (
                      twinData?.aiAnalysis?.predictiveTimeline || 'Awaiting telemetry updates.'
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between text-[10px] font-semibold text-neutral-400">
              <span>Model Node: Gemini Flash 3.5</span>
              <span>Status: {twinData?.aiAnalysis?.simulated ? 'High-fidelity Emulation' : 'Synced'}</span>
            </div>
          </div>

          {/* 3. Real-Time Dynamic Simulation Logs Feed */}
          <div className="lg:col-span-4 bg-slate-900 text-slate-100 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <h3 className="text-xs font-mono uppercase tracking-widest text-slate-300 flex items-center gap-2">
                <Terminal className="w-4.5 h-4.5 text-indigo-400" />
                <span>Grid Telemetry Logs</span>
              </h3>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-emerald-400">
                ACTIVE
              </span>
            </div>

            {/* Scrollable logs box */}
            <div 
              ref={logContainerRef}
              className="flex-1 overflow-y-auto font-mono text-[10px] text-left py-3 my-1.5 h-40 space-y-2 scrollbar-thin scrollbar-thumb-slate-850"
            >
              {logs.map((log) => (
                <div key={log.id} className="flex gap-2.5 items-start leading-normal">
                  <span className="text-slate-500 select-none shrink-0">{log.timestamp}</span>
                  <span className={`px-1.5 py-0.2 rounded select-none text-[8px] font-black shrink-0 uppercase tracking-wider ${
                    log.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                    log.type === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                    log.type === 'critical' ? 'bg-rose-500/10 text-rose-400 animate-pulse' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {log.source.replace(' ', '_').toUpperCase()}
                  </span>
                  <p className="text-slate-200 font-medium break-all">{log.message}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-800 pt-3 mt-1 text-[9px] text-slate-500 font-mono text-left flex justify-between">
              <span>Smart IoT Grid Sensors Sync: ON</span>
              <button 
                onClick={() => { setLogs([]); addLog('Console', 'Cleared terminal buffer.', 'info'); }}
                className="text-indigo-400 hover:text-indigo-300 uppercase font-black cursor-pointer"
              >
                Clear Buffer
              </button>
            </div>
          </div>

        </div>

        {/* Middle Section: Community Map Canvas & Sidebar Control Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Main Map Viewer Canvas */}
          <div className="lg:col-span-8 bg-white border border-neutral-200/60 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden h-[540px] shadow-sm">
            {/* Scan lines effect when isScanning is true */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden rounded-3xl">
                <div className="w-full h-full bg-indigo-500/5 relative">
                  <div className="absolute inset-x-0 h-0.5 bg-indigo-500/20 shadow-lg shadow-indigo-500/50 animate-[scan_1.5s_infinite_linear]" />
                </div>
              </div>
            )}

            {/* Top map controls layer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200/60 pb-3 shrink-0">
              <div className="text-left">
                <h3 className="text-sm font-bold text-slate-950">Interactive Spatial Engine</h3>
                <span className="text-xs text-neutral-500 font-medium">Click on SOMA, Dolores, or Mission to filter localized telemetry</span>
              </div>

              {/* Layer toggles */}
              <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl border border-neutral-200 shadow-inner">
                <button
                  onClick={() => setShowMesh(!showMesh)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    showMesh ? 'bg-white text-indigo-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Mesh</span>
                </button>
                <button
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    showHeatmap ? 'bg-white text-indigo-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Heatmap</span>
                </button>
                <button
                  onClick={() => setShowNodes(!showNodes)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    showNodes ? 'bg-white text-indigo-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Nodes</span>
                </button>
              </div>
            </div>

            {/* SVG Cyber Map Canvas representing Digital Twin Grid */}
            <div className="flex-1 relative overflow-hidden bg-slate-50 rounded-2xl my-4 flex items-center justify-center border border-neutral-200/60 shadow-inner">
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="w-full h-full cursor-crosshair select-none"
              >
                {/* 1. Holographic Mesh City Grid Layer (Glowing background vectors) */}
                {showMesh && (
                  <g opacity="0.8">
                    {/* Radial grid circles centered at Soma */}
                    <circle cx="50" cy="50" r="15" fill="none" stroke="#E2E8F0" strokeWidth="0.25" strokeDasharray="1 2" />
                    <circle cx="50" cy="50" r="30" fill="none" stroke="#E2E8F0" strokeWidth="0.25" strokeDasharray="1 2" />
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#E2E8F0" strokeWidth="0.25" strokeDasharray="1 2" />

                    {/* SF Bay border water wave line */}
                    <path
                      d="M 0 0 L 100 0 L 100 22 Q 85 30 70 17 T 40 35 T 15 25 Q 0 45 0 55 Z"
                      fill="none"
                      stroke="#CBD5E1"
                      strokeWidth="0.5"
                    />

                    {/* Grid sectors boundaries */}
                    {/* Dolores Heights Area */}
                    <polygon
                      points="0,50 48,50 48,100 0,100"
                      fill={selectedSector === 'dolores' ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255, 255, 255, 0.3)'}
                      stroke={selectedSector === 'dolores' ? '#6366F1' : '#E2E8F0'}
                      strokeWidth={selectedSector === 'dolores' ? '0.75' : '0.4'}
                      className="transition-all duration-300 cursor-pointer hover:fill-indigo-500/5"
                      onClick={(e) => { e.stopPropagation(); setSelectedSector('dolores'); }}
                    />
                    {/* SoMa Area */}
                    <polygon
                      points="48,0 100,0 100,60 48,60"
                      fill={selectedSector === 'soma' ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255, 255, 255, 0.3)'}
                      stroke={selectedSector === 'soma' ? '#6366F1' : '#E2E8F0'}
                      strokeWidth={selectedSector === 'soma' ? '0.75' : '0.4'}
                      className="transition-all duration-300 cursor-pointer hover:fill-indigo-500/5"
                      onClick={(e) => { e.stopPropagation(); setSelectedSector('soma'); }}
                    />
                    {/* Mission Area */}
                    <polygon
                      points="48,60 100,60 100,100 48,100"
                      fill={selectedSector === 'mission' ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255, 255, 255, 0.3)'}
                      stroke={selectedSector === 'mission' ? '#6366F1' : '#E2E8F0'}
                      strokeWidth={selectedSector === 'mission' ? '0.75' : '0.4'}
                      className="transition-all duration-300 cursor-pointer hover:fill-indigo-500/5"
                      onClick={(e) => { e.stopPropagation(); setSelectedSector('mission'); }}
                    />

                    {/* Glowing Street lines */}
                    {/* Diagonal Market Street */}
                    <line x1="0" y1="40" x2="100" y2="90" stroke="#CBD5E1" strokeWidth="0.8" />
                    <line x1="0" y1="40" x2="100" y2="90" stroke="#818CF8" strokeWidth="0.3" strokeDasharray="3 3" opacity="0.6" />

                    {/* El Camino Real Highway */}
                    <line x1="50" y1="0" x2="50" y2="100" stroke="#E2E8F0" strokeWidth="0.8" />
                    <line x1="50" y1="0" x2="50" y2="100" stroke="#818CF8" strokeWidth="0.25" strokeDasharray="2 2" opacity="0.4" />

                    {/* Mission Street */}
                    <line x1="40" y1="0" x2="45" y2="100" stroke="#E2E8F0" strokeWidth="0.6" />

                    {/* Grid coordinates labels */}
                    <text x="2" y="98" fill="#94A3B8" fontSize="2.2" fontFamily="monospace" fontWeight="semibold">COORDS_X00_Y99</text>
                    <text x="78" y="98" fill="#94A3B8" fontSize="2.2" fontFamily="monospace" fontWeight="semibold">COORDS_X99_Y99</text>
                    <text x="78" y="4" fill="#94A3B8" fontSize="2.2" fontFamily="monospace" fontWeight="semibold">COORDS_X99_Y00</text>
                  </g>
                )}

                {/* 2. Interactive Heatmap Intensity Layer (Dynamic glowing clusters based on counts) */}
                {showHeatmap && (
                  <g>
                    {/* Dolores Cluster - Intensified by Water leak count & streetlight failure */}
                    <circle 
                      cx="25" 
                      cy="75" 
                      r={Math.min(25, 6 + (waterIssues * 1.8 + streetlights * 1.4))} 
                      fill="url(#twinDoloresHeat)" 
                      opacity={Math.max(0.2, Math.min(0.85, (waterIssues + streetlights) * 0.12))} 
                    />
                    
                    {/* SoMa Cluster - Intensified by potholes and water leaks */}
                    <circle 
                      cx="75" 
                      cy="30" 
                      r={Math.min(25, 6 + (potholes * 2.1 + waterIssues * 1.5))} 
                      fill="url(#twinSomaHeat)" 
                      opacity={Math.max(0.2, Math.min(0.85, (potholes + waterIssues) * 0.12))} 
                    />

                    {/* Mission Cluster - Intensified by Garbage Accumulation & streetlights */}
                    <circle 
                      cx="75" 
                      cy="80" 
                      r={Math.min(25, 7 + (garbage * 1.8 + streetlights * 1.6))} 
                      fill="url(#twinMissionHeat)" 
                      opacity={Math.max(0.2, Math.min(0.85, (garbage + streetlights) * 0.12))} 
                    />
                  </g>
                )}

                {/* Map labels */}
                <g style={{ pointerEvents: 'none' }}>
                  <rect x="12" y="62.5" width="28" height="5" rx="1.5" fill="rgba(255,255,255,0.85)" stroke="#E2E8F0" strokeWidth="0.15" />
                  <text x="26" y="66" fill={selectedSector === 'dolores' ? '#4F46E5' : '#475569'} fontSize="2.6" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    DOLORES HEIGHTS
                  </text>
                  
                  <rect x="62" y="20.5" width="24" height="5" rx="1.5" fill="rgba(255,255,255,0.85)" stroke="#E2E8F0" strokeWidth="0.15" />
                  <text x="74" y="24" fill={selectedSector === 'soma' ? '#4F46E5' : '#475569'} fontSize="2.6" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    SOMA SECTOR
                  </text>

                  <rect x="62" y="70.5" width="24" height="5" rx="1.5" fill="rgba(255,255,255,0.85)" stroke="#E2E8F0" strokeWidth="0.15" />
                  <text x="74" y="74" fill={selectedSector === 'mission' ? '#4F46E5' : '#475569'} fontSize="2.6" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    MISSION WARD
                  </text>
                </g>

                {/* 3. Anomalies Nodes Layer (Blinking warning nodes for issues) */}
                {showNodes && (
                  <g>
                    {/* Dolores Sector Nodes */}
                    {waterIssues > 0 && (
                      <g className="animate-pulse">
                        <circle cx="20" cy="72" r="1.8" fill="#3B82F6" stroke="#FFF" strokeWidth="0.4" />
                        <circle cx="20" cy="72" r="4.5" fill="none" stroke="#3B82F6" strokeWidth="0.25" className="animate-ping" style={{ transformOrigin: '20px 72px' }} />
                      </g>
                    )}
                    {streetlights > 0 && (
                      <g className="animate-pulse">
                        <circle cx="32" cy="78" r="1.8" fill="#F59E0B" stroke="#FFF" strokeWidth="0.4" />
                        <circle cx="32" cy="78" r="4.5" fill="none" stroke="#F59E0B" strokeWidth="0.25" className="animate-ping" style={{ transformOrigin: '32px 78px' }} />
                      </g>
                    )}

                    {/* SoMa Sector Nodes */}
                    {potholes > 0 && (
                      <g className="animate-pulse">
                        <circle cx="70" cy="28" r="1.8" fill="#EF4444" stroke="#FFF" strokeWidth="0.4" />
                        <circle cx="70" cy="28" r="4.5" fill="none" stroke="#EF4444" strokeWidth="0.25" className="animate-ping" style={{ transformOrigin: '70px 28px' }} />
                        <circle cx="82" cy="34" r="1.4" fill="#EF4444" stroke="#FFF" strokeWidth="0.4" />
                      </g>
                    )}
                    {potholes > 4 && (
                      <g className="animate-pulse">
                        <circle cx="76" cy="18" r="1.8" fill="#EF4444" stroke="#FFF" strokeWidth="0.4" />
                      </g>
                    )}

                    {/* Mission Sector Nodes */}
                    {garbage > 0 && (
                      <g className="animate-pulse">
                        <circle cx="72" cy="85" r="1.8" fill="#10B981" stroke="#FFF" strokeWidth="0.4" />
                        <circle cx="72" cy="85" r="4.5" fill="none" stroke="#10B981" strokeWidth="0.25" className="animate-ping" style={{ transformOrigin: '72px 85px' }} />
                        <circle cx="80" cy="76" r="1.4" fill="#10B981" stroke="#FFF" strokeWidth="0.4" />
                      </g>
                    )}
                    {streetlights > 2 && (
                      <g className="animate-pulse">
                        <circle cx="86" cy="84" r="1.8" fill="#F59E0B" stroke="#FFF" strokeWidth="0.4" />
                      </g>
                    )}
                  </g>
                )}

                {/* SVG Definitions for heatmap gradients */}
                <defs>
                  <radialGradient id="twinDoloresHeat">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.7" />
                    <stop offset="60%" stopColor="#818CF8" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#EEF2F6" stopOpacity="0" />
                  </radialGradient>
                  
                  <radialGradient id="twinSomaHeat">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity="0.7" />
                    <stop offset="60%" stopColor="#F97316" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#EEF2F6" stopOpacity="0" />
                  </radialGradient>

                  <radialGradient id="twinMissionHeat">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.7" />
                    <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#EEF2F6" stopOpacity="0" />
                  </radialGradient>
                </defs>
              </svg>

              {/* HUD Compass calibration card */}
              <div className="absolute right-4 bottom-4 bg-white/95 backdrop-blur border border-neutral-200/80 rounded-2xl p-2.5 flex flex-col items-center select-none shadow-md">
                <Compass className="w-5.5 h-5.5 text-indigo-500 animate-[spin_24s_linear_infinite]" />
                <span className="text-[9px] font-mono font-bold text-neutral-400 mt-1 uppercase">Spatial 3D Vector</span>
              </div>

              {/* Selected Sector Indicator Panel */}
              <div className="absolute left-4 bottom-4 bg-white/95 backdrop-blur border border-neutral-200/85 rounded-2xl px-4 py-3 text-left shadow-md">
                <span className="text-[9px] font-mono text-indigo-600 uppercase font-extrabold tracking-wider">Focused Subgrid</span>
                <p className="text-sm font-semibold text-neutral-900 uppercase mt-0.5">
                  {selectedSector === 'all' && 'ALL DISTRICTS'}
                  {selectedSector === 'dolores' && 'DOLORES HEIGHTS'}
                  {selectedSector === 'soma' && 'SOMA TECH DISTRICT'}
                  {selectedSector === 'mission' && 'MISSION RESIDENTIAL'}
                </p>
                {selectedSector !== 'all' && (
                  <button 
                    onClick={() => setSelectedSector('all')}
                    className="text-[10px] text-indigo-500 hover:text-indigo-700 underline font-semibold mt-1 cursor-pointer block"
                  >
                    Reset Grid Zoom
                  </button>
                )}
              </div>
            </div>

            {/* Bottom active indicators bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-neutral-500 border-t border-neutral-200/60 pt-3 shrink-0">
              <div className="flex items-center gap-4 font-semibold">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-200" /> Roads</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200" /> Trash</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-200" /> Hydraulics</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-200" /> Light Grid</span>
              </div>

              <span className="font-bold text-neutral-400">SF SPATIAL MESH L12 v2.4</span>
            </div>
          </div>

          {/* Right Side: Simulation Controllers & Sector Risks */}
          <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
            
            {/* 1. Simulation Parameter Controller Panel */}
            <div className="bg-white border border-neutral-200/60 rounded-3xl p-6 text-left space-y-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Sliders className="w-4.5 h-4.5 text-indigo-600" />
                  <span>Twin Input Modulators</span>
                </h3>
                <span className={`text-[9px] font-mono px-2.5 py-0.5 rounded-full border ${
                  twinMode === 'simulation' ? 'bg-amber-50 border-amber-200 text-amber-700 font-bold' : 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold'
                }`}>
                  {twinMode === 'simulation' ? 'SANDBOX' : 'LIVE DB SYNC'}
                </span>
              </div>

              {twinMode === 'database' ? (
                <div className="space-y-4 font-mono text-xs text-neutral-500">
                  <p className="text-[11px] text-neutral-400 font-medium leading-normal">
                    Sliders are locked because the twin is mirroring the **Live Citizen Complaint Feed database**.
                  </p>

                  <div className="space-y-2.5 font-sans">
                    <div className="bg-neutral-50 border border-neutral-200/60 p-3.5 rounded-2xl flex items-center justify-between shadow-sm">
                      <span className="flex items-center gap-2.5 font-semibold text-slate-700"><Wrench className="w-4.5 h-4.5 text-rose-500" /> Potholes</span>
                      <span className="font-bold text-neutral-800 bg-white px-3 py-1 rounded-xl border border-neutral-200 shadow-sm">{livePotholes}</span>
                    </div>
                    <div className="bg-neutral-50 border border-neutral-200/60 p-3.5 rounded-2xl flex items-center justify-between shadow-sm">
                      <span className="flex items-center gap-2.5 font-semibold text-slate-700"><Trash2 className="w-4.5 h-4.5 text-emerald-500" /> Garbage</span>
                      <span className="font-bold text-neutral-800 bg-white px-3 py-1 rounded-xl border border-neutral-200 shadow-sm">{liveGarbage}</span>
                    </div>
                    <div className="bg-neutral-50 border border-neutral-200/60 p-3.5 rounded-2xl flex items-center justify-between shadow-sm">
                      <span className="flex items-center gap-2.5 font-semibold text-slate-700"><Droplet className="w-4.5 h-4.5 text-blue-500" /> Water Leaks</span>
                      <span className="font-bold text-neutral-800 bg-white px-3 py-1 rounded-xl border border-neutral-200 shadow-sm">{liveWater}</span>
                    </div>
                    <div className="bg-neutral-50 border border-neutral-200/60 p-3.5 rounded-2xl flex items-center justify-between shadow-sm">
                      <span className="flex items-center gap-2.5 font-semibold text-slate-700"><Lightbulb className="w-4.5 h-4.5 text-amber-500" /> Streetlights</span>
                      <span className="font-bold text-neutral-800 bg-white px-3 py-1 rounded-xl border border-neutral-200 shadow-sm">{liveStreetlights}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setTwinMode('simulation');
                      addLog('Simulator', 'Sliders unlocked. Simulation playground active.', 'warning');
                    }}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-md shadow-indigo-100 hover:shadow-lg cursor-pointer text-center text-xs uppercase tracking-wider block font-sans"
                  >
                    Unlock Sandbox Modulators
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Potholes slider */}
                  <div className="space-y-2 text-left">
                    <div className="flex justify-between items-center text-xs font-semibold text-neutral-600">
                      <span className="flex items-center gap-2"><Wrench className="w-4 h-4 text-rose-500" /> Pothole Distress Nodes</span>
                      <span className="text-slate-900 font-extrabold">{simPotholes} Active</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={simPotholes}
                      onChange={(e) => setSimPotholes(parseInt(e.target.value))}
                      className="w-full accent-indigo-600 bg-neutral-200 h-1.5 rounded-lg cursor-pointer appearance-none"
                    />
                  </div>

                  {/* Garbage accumulation slider */}
                  <div className="space-y-2 text-left">
                    <div className="flex justify-between items-center text-xs font-semibold text-neutral-600">
                      <span className="flex items-center gap-2"><Trash2 className="w-4 h-4 text-emerald-500" /> Garbage Discharges</span>
                      <span className="text-slate-900 font-extrabold">{simGarbage} Active</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={simGarbage}
                      onChange={(e) => setSimGarbage(parseInt(e.target.value))}
                      className="w-full accent-indigo-600 bg-neutral-200 h-1.5 rounded-lg cursor-pointer appearance-none"
                    />
                  </div>

                  {/* Water pressure leak slider */}
                  <div className="space-y-2 text-left">
                    <div className="flex justify-between items-center text-xs font-semibold text-neutral-600">
                      <span className="flex items-center gap-2"><Droplet className="w-4 h-4 text-blue-500" /> Hydraulic Leaks</span>
                      <span className="text-slate-900 font-extrabold">{simWater} Active</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={simWater}
                      onChange={(e) => setSimWater(parseInt(e.target.value))}
                      className="w-full accent-indigo-600 bg-neutral-200 h-1.5 rounded-lg cursor-pointer appearance-none"
                    />
                  </div>

                  {/* Streetlights failure slider */}
                  <div className="space-y-2 text-left">
                    <div className="flex justify-between items-center text-xs font-semibold text-neutral-600">
                      <span className="flex items-center gap-2"><Lightbulb className="w-4 h-4 text-amber-500" /> Broken Streetlights</span>
                      <span className="text-slate-900 font-extrabold">{simStreetlights} Active</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={simStreetlights}
                      onChange={(e) => setSimStreetlights(parseInt(e.target.value))}
                      className="w-full accent-indigo-600 bg-neutral-200 h-1.5 rounded-lg cursor-pointer appearance-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setTwinMode('database')}
                      className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-xl text-xs font-bold text-neutral-700 uppercase cursor-pointer transition-colors"
                    >
                      Lock to Live
                    </button>
                    <button
                      onClick={() => {
                        setSimPotholes(5);
                        setSimGarbage(3);
                        setSimWater(2);
                        setSimStreetlights(3);
                        addLog('Simulator', 'Reset variables to baseline values.', 'info');
                      }}
                      className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-xl text-xs font-bold text-neutral-700 uppercase cursor-pointer transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Quick Incident Sandbox Stress Tests */}
            <div className="bg-white border border-neutral-200/60 rounded-3xl p-6 text-left space-y-4 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-neutral-100 pb-3 flex items-center gap-2">
                <Gauge className="w-4.5 h-4.5 text-indigo-600" />
                <span>Sandbox Grid Stress-Tests</span>
              </h3>
              <p className="text-[11px] text-neutral-500 leading-normal font-medium">
                Trigger simulated extreme weather and power conditions to test infrastructure limits:
              </p>

              <div className="grid grid-cols-2 gap-3 text-left">
                <button
                  onClick={() => triggerEvent('storm')}
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/40 border border-neutral-200/60 flex flex-col items-start gap-1 cursor-pointer group transition-all duration-300 hover:border-indigo-200"
                >
                  <span className="text-xs font-bold text-neutral-800 group-hover:text-indigo-600">⛈️ Storm</span>
                  <span className="text-[10px] text-neutral-400 font-medium font-mono">Potholes +3</span>
                </button>

                <button
                  onClick={() => triggerEvent('blackout')}
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/40 border border-neutral-200/60 flex flex-col items-start gap-1 cursor-pointer group transition-all duration-300 hover:border-indigo-200"
                >
                  <span className="text-xs font-bold text-neutral-800 group-hover:text-indigo-600">🔌 Blackout</span>
                  <span className="text-[10px] text-neutral-400 font-medium font-mono">Lights +5</span>
                </button>

                <button
                  onClick={() => triggerEvent('leak')}
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/40 border border-neutral-200/60 flex flex-col items-start gap-1 cursor-pointer group transition-all duration-300 hover:border-indigo-200"
                >
                  <span className="text-xs font-bold text-neutral-800 group-hover:text-indigo-600">💧 Blowout</span>
                  <span className="text-[10px] text-neutral-400 font-medium font-mono">Leaks +4</span>
                </button>

                <button
                  onClick={() => triggerEvent('clear')}
                  className="p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100/60 border border-emerald-100 flex flex-col items-start gap-1 cursor-pointer transition-all duration-300 group"
                >
                  <span className="text-xs font-bold text-emerald-700 group-hover:text-emerald-800">🛡️ Clear</span>
                  <span className="text-[10px] text-emerald-500 font-semibold font-mono">Reset state</span>
                </button>
              </div>
            </div>

            {/* 3. Subgrid Risk Classification Indicators */}
            <div className="bg-white border border-neutral-200/60 rounded-3xl p-6 text-left space-y-4 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-neutral-100 pb-3">
                Area Risk Classifications
              </h3>

              <div className="space-y-3">
                {/* Dolores Heights Area */}
                <div 
                  onClick={() => setSelectedSector('dolores')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedSector === 'dolores' 
                      ? 'bg-indigo-50/60 border-indigo-500 shadow-md shadow-indigo-50/30' 
                      : 'bg-neutral-50/50 border-neutral-200/80 hover:border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  <div className="text-left space-y-0.5">
                    <span className="text-xs font-bold text-slate-800">Dolores Heights</span>
                    <p className="text-[10px] text-neutral-400 font-medium">Residential & Parks</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-neutral-900">{twinData?.sectorRisks?.dolores ?? 0}%</span>
                    <span className={`block text-[8px] font-extrabold uppercase mt-1 px-2 py-0.5 rounded-full border ${getRiskAttributes(twinData?.sectorRisks?.dolores ?? 0).fill}`}>
                      {getRiskAttributes(twinData?.sectorRisks?.dolores ?? 0).badge}
                    </span>
                  </div>
                </div>

                {/* SoMa Tech Sector */}
                <div 
                  onClick={() => setSelectedSector('soma')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedSector === 'soma' 
                      ? 'bg-indigo-50/60 border-indigo-500 shadow-md shadow-indigo-50/30' 
                      : 'bg-neutral-50/50 border-neutral-200/80 hover:border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  <div className="text-left space-y-0.5">
                    <span className="text-xs font-bold text-slate-800">Soma District</span>
                    <p className="text-[10px] text-neutral-400 font-medium">Tech Corridor & Traffic</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-neutral-900">{twinData?.sectorRisks?.soma ?? 0}%</span>
                    <span className={`block text-[8px] font-extrabold uppercase mt-1 px-2 py-0.5 rounded-full border ${getRiskAttributes(twinData?.sectorRisks?.soma ?? 0).fill}`}>
                      {getRiskAttributes(twinData?.sectorRisks?.soma ?? 0).badge}
                    </span>
                  </div>
                </div>

                {/* Mission Ward */}
                <div 
                  onClick={() => setSelectedSector('mission')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedSector === 'mission' 
                      ? 'bg-indigo-50/60 border-indigo-500 shadow-md shadow-indigo-50/30' 
                      : 'bg-neutral-50/50 border-neutral-200/80 hover:border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  <div className="text-left space-y-0.5">
                    <span className="text-xs font-bold text-slate-800">Mission Ward</span>
                    <p className="text-[10px] text-neutral-400 font-medium">Commercial & Dense Housing</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-neutral-900">{twinData?.sectorRisks?.mission ?? 0}%</span>
                    <span className={`block text-[8px] font-extrabold uppercase mt-1 px-2 py-0.5 rounded-full border ${getRiskAttributes(twinData?.sectorRisks?.mission ?? 0).fill}`}>
                      {getRiskAttributes(twinData?.sectorRisks?.mission ?? 0).badge}
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Bottom Section: Category Health Indicators Breakdown & Action items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Road Health Gauge */}
          <div className="bg-white border border-neutral-200/60 rounded-3xl p-5 text-left space-y-4 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 inset-x-0 h-1 bg-amber-500" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-sm">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase">Road Surface</h4>
                  <span className="text-[9px] text-neutral-400 font-bold font-mono uppercase tracking-wider">Node Integrity</span>
                </div>
              </div>
              <span className={`text-base font-extrabold ${getIndicatorAttributes(twinData?.roadHealth ?? 100).text}`}>
                {twinData?.roadHealth ?? 100}%
              </span>
            </div>

            <div className="space-y-1.5">
              <div className={`w-full h-2 rounded-full overflow-hidden ${getIndicatorAttributes(twinData?.roadHealth ?? 100).barBg}`}>
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${getIndicatorAttributes(twinData?.roadHealth ?? 100).fill}`}
                  style={{ width: `${twinData?.roadHealth ?? 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-bold text-neutral-400 font-mono">
                <span>CRITICAL</span>
                <span>OPTIMAL</span>
              </div>
            </div>

            <p className="text-[11px] text-neutral-500 font-medium leading-relaxed">
              Calculated on active distress nodes. Degradation triggers immediate traffic delays.
            </p>
          </div>

          {/* Cleanliness Index Gauge */}
          <div className="bg-white border border-neutral-200/60 rounded-3xl p-5 text-left space-y-4 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase">Sanitation</h4>
                  <span className="text-[9px] text-neutral-400 font-bold font-mono uppercase tracking-wider">Discharge Ratio</span>
                </div>
              </div>
              <span className={`text-base font-extrabold ${getIndicatorAttributes(twinData?.cleanliness ?? 100).text}`}>
                {twinData?.cleanliness ?? 100}%
              </span>
            </div>

            <div className="space-y-1.5">
              <div className={`w-full h-2 rounded-full overflow-hidden ${getIndicatorAttributes(twinData?.cleanliness ?? 100).barBg}`}>
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${getIndicatorAttributes(twinData?.cleanliness ?? 100).fill}`}
                  style={{ width: `${twinData?.cleanliness ?? 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-bold text-neutral-400 font-mono">
                <span>CRITICAL</span>
                <span>OPTIMAL</span>
              </div>
            </div>

            <p className="text-[11px] text-neutral-500 font-medium leading-relaxed">
              Trash overflows diminish visual cleanliness and compromise stormwater drainage vectors.
            </p>
          </div>

          {/* Water Integrity Gauge */}
          <div className="bg-white border border-neutral-200/60 rounded-3xl p-5 text-left space-y-4 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 inset-x-0 h-1 bg-blue-500" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm">
                  <Droplet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase">Hydraulics</h4>
                  <span className="text-[9px] text-neutral-400 font-bold font-mono uppercase tracking-wider">Flow Index</span>
                </div>
              </div>
              <span className={`text-base font-extrabold ${getIndicatorAttributes(twinData?.waterInfrastructure ?? 100).text}`}>
                {twinData?.waterInfrastructure ?? 100}%
              </span>
            </div>

            <div className="space-y-1.5">
              <div className={`w-full h-2 rounded-full overflow-hidden ${getIndicatorAttributes(twinData?.waterInfrastructure ?? 100).barBg}`}>
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${getIndicatorAttributes(twinData?.waterInfrastructure ?? 100).fill}`}
                  style={{ width: `${twinData?.waterInfrastructure ?? 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-bold text-neutral-400 font-mono">
                <span>CRITICAL</span>
                <span>OPTIMAL</span>
              </div>
            </div>

            <p className="text-[11px] text-neutral-500 font-medium leading-relaxed">
              Measures sub-surface fluid mechanics. Leaks drain hydraulic pressure within 3 blocks.
            </p>
          </div>

          {/* Safety Index Gauge */}
          <div className="bg-white border border-neutral-200/60 rounded-3xl p-5 text-left space-y-4 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 inset-x-0 h-1 bg-indigo-500" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase">Illumination</h4>
                  <span className="text-[9px] text-neutral-400 font-bold font-mono uppercase tracking-wider">Photocell Flux</span>
                </div>
              </div>
              <span className={`text-base font-extrabold ${getIndicatorAttributes(twinData?.safetyIndex ?? 100).text}`}>
                {twinData?.safetyIndex ?? 100}%
              </span>
            </div>

            <div className="space-y-1.5">
              <div className={`w-full h-2 rounded-full overflow-hidden ${getIndicatorAttributes(twinData?.safetyIndex ?? 100).barBg}`}>
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${getIndicatorAttributes(twinData?.safetyIndex ?? 100).fill}`}
                  style={{ width: `${twinData?.safetyIndex ?? 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-bold text-neutral-400 font-mono">
                <span>CRITICAL</span>
                <span>OPTIMAL</span>
              </div>
            </div>

            <p className="text-[11px] text-neutral-500 font-medium leading-relaxed">
              Nocturnal safety index. High broken light count restricts twilight visibility.
            </p>
          </div>

        </div>

        {/* Strategic Intervention Steps Action Plan */}
        <div className="bg-white border border-neutral-200/60 rounded-3xl p-6 text-left space-y-5 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-600 animate-pulse" />
              <h3 className="text-sm font-bold tracking-tight text-slate-900">Recommended Spatial Mitigations</h3>
            </div>
            <p className="text-xs text-neutral-500 font-medium">
              Actionable municipal interventions generated in real-time by the Gemini intelligence matching our digital twin parameters:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {loading ? (
              <>
                <div className="h-24 bg-neutral-50 border border-neutral-200/60 rounded-2xl animate-pulse" />
                <div className="h-24 bg-neutral-50 border border-neutral-200/60 rounded-2xl animate-pulse" />
                <div className="h-24 bg-neutral-50 border border-neutral-200/60 rounded-2xl animate-pulse" />
              </>
            ) : (
              twinData?.aiAnalysis?.recommendations?.map((rec: string, idx: number) => (
                <div key={idx} className="bg-neutral-50/50 border border-neutral-200/80 rounded-2xl p-4.5 flex gap-3.5 items-start hover:bg-neutral-50 transition-colors duration-200">
                  <span className="w-7.5 h-7.5 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-mono font-bold text-indigo-600 shrink-0 mt-0.5 shadow-sm">
                    {idx + 1}
                  </span>
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-wider">Tactical Step 0{idx + 1}</span>
                    <p className="text-xs text-neutral-700 leading-relaxed font-semibold">
                      {rec}
                    </p>
                  </div>
                </div>
              )) || (
                <p className="text-xs text-slate-500 font-mono italic">No actions registered.</p>
              )
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
