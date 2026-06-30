import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  CloudRain, 
  Flame, 
  Snowflake, 
  Sun, 
  Sparkles, 
  Activity, 
  AlertTriangle, 
  Wrench, 
  Users, 
  ArrowRight, 
  HelpCircle, 
  RefreshCw, 
  FileText, 
  MapPin, 
  CheckCircle2, 
  TrendingUp, 
  Percent, 
  Droplets, 
  Trash2, 
  Lightbulb 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { pageVariants } from "../utils/motion";
import { Issue } from "../types";

interface PredictiveRiskEngineProps {
  issues: Issue[];
}

type WeatherProfile = "sunny" | "heavy_storm" | "heatwave" | "freeze";

export default function PredictiveRiskEngine({ issues }: PredictiveRiskEngineProps) {
  // 1. Parse historical reports stats as baseline
  const getLiveCount = (category: string) => {
    return issues.filter(issue => {
      const cat = issue.category.toLowerCase();
      const unresolved = issue.status !== "resolved";
      if (category === "pothole") return cat.includes("pothole") && unresolved;
      if (category === "garbage") return cat.includes("garbage") && unresolved;
      if (category === "water") return (cat.includes("water") || cat.includes("leak")) && unresolved;
      if (category === "streetlight") return (cat.includes("streetlight") || cat.includes("light")) && unresolved;
      return false;
    }).length;
  };

  const initialPotholes = getLiveCount("pothole") || 5;
  const initialGarbage = getLiveCount("garbage") || 4;
  const initialWater = getLiveCount("water") || 2;
  const initialLights = getLiveCount("streetlight") || 3;

  // Average trust score from live issues or default to 75
  const activeUnresolvedIssues = issues.filter(i => i.status !== "resolved");
  const initialTrust = activeUnresolvedIssues.length > 0 
    ? Math.round(activeUnresolvedIssues.reduce((acc, curr) => acc + (curr.trustScore || 50), 0) / activeUnresolvedIssues.length)
    : 78;

  const initialVerified = activeUnresolvedIssues.reduce((acc, curr) => acc + (curr.verifications?.length || 0), 0) || 12;

  // 2. State controls for simulation parameters
  const [weather, setWeather] = useState<WeatherProfile>("heavy_storm");
  
  // What-if historical report overrides
  const [potholesCount, setPotholesCount] = useState(initialPotholes);
  const [garbageCount, setGarbageCount] = useState(initialGarbage);
  const [waterCount, setWaterCount] = useState(initialWater);
  const [lightsCount, setLightsCount] = useState(initialLights);

  // Verification metrics
  const [trustScore, setTrustScore] = useState(initialTrust);
  const [verifiedCount, setVerifiedCount] = useState(initialVerified);
  const [unverifiedCount, setUnverifiedCount] = useState(Math.max(2, Math.round(activeUnresolvedIssues.length * 0.3)));

  // Socio-Demographics parameters
  const [popDensity, setPopDensity] = useState<"low" | "medium" | "high">("medium");
  const [vulnerabilityIndex, setVulnerabilityIndex] = useState(54); // elderly, disabled, children ratio %
  const [socioeconomicIndex, setSocioeconomicIndex] = useState(62); // Opportunity index 0-100

  // Urban Planning and Substrate parameters
  const [pipeAge, setPipeAge] = useState<"new" | "mid" | "old">("mid");
  const [pavementMaterial, setPavementMaterial] = useState<"asphalt" | "concrete" | "cobblestone">("asphalt");
  const [transitProximity, setTransitProximity] = useState<"low" | "medium" | "high">("medium");

  // Output prediction states
  const [isLoading, setIsLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"forecast" | "specs">("forecast");

  // 3. Trigger risk prediction request
  const runPredictiveModel = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/predictive-risk-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          historicalReports: {
            potholesCount,
            garbageCount,
            waterCount,
            lightsCount
          },
          weatherCondition: weather,
          verificationStats: {
            verifiedCount,
            unverifiedCount,
            averageTrustScore: trustScore
          },
          demographics: {
            popDensity,
            vulnerabilityIndex,
            socioeconomicIndex
          },
          urbanPlanning: {
            pipeAge,
            pavementMaterial,
            transitProximity
          }
        })
      });

      if (!response.ok) {
        throw new Error("Prediction engine API returned an error status.");
      }

      const data = await response.json();
      setPredictionResult(data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to generate predictive intelligence report. Run simulator again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Run model initially
  useEffect(() => {
    runPredictiveModel();
  }, [popDensity, pipeAge, pavementMaterial, transitProximity]);

  // Helper for colors
  const getSeverityBg = (status: string) => {
    switch (status?.toUpperCase()) {
      case "CATASTROPHIC": return "bg-rose-50 border-rose-200 text-rose-800";
      case "SEVERE": return "bg-amber-50 border-amber-200 text-amber-800";
      case "ELEVATED": return "bg-blue-50 border-blue-200 text-blue-800";
      default: return "bg-emerald-50 border-emerald-150 text-emerald-800";
    }
  };

  const getSeverityBadgeColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "CATASTROPHIC": return "bg-rose-600 text-white shadow-rose-100";
      case "SEVERE": return "bg-amber-500 text-neutral-950 shadow-amber-100";
      case "ELEVATED": return "bg-blue-600 text-white shadow-blue-100";
      default: return "bg-emerald-600 text-white shadow-emerald-100";
    }
  };

  const getCategoryRiskColor = (score: number) => {
    if (score >= 80) return "text-rose-600";
    if (score >= 50) return "text-amber-600";
    if (score >= 25) return "text-blue-600";
    return "text-emerald-600";
  };

  const getCategoryRiskProgressColor = (score: number) => {
    if (score >= 80) return "bg-rose-600";
    if (score >= 50) return "bg-amber-500";
    if (score >= 25) return "bg-blue-600";
    return "bg-emerald-600";
  };

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left"
    >
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200/60 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-150">
              Civic AI Simulation
            </span>
            <span className="flex items-center gap-1 text-xs text-neutral-500 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>Gemini Pro Active</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-sans font-extrabold text-neutral-900 tracking-tight mt-1">
            Predictive Infrastructure Risk Engine
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Combines multi-modal verification confidence, real-time climate telemetry, and spatial reports to forecast municipal failures.
          </p>
        </div>

        <button
          onClick={runPredictiveModel}
          disabled={isLoading}
          className="bg-neutral-950 hover:bg-neutral-800 disabled:bg-neutral-300 text-white font-bold text-xs px-6 py-3.5 rounded-full transition-all cursor-pointer shadow-sm active:scale-95 flex items-center justify-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          <span>Execute Risk Diagnostics</span>
        </button>
      </div>

      {/* Main Grid: Control Station on Left, Output Analysis on Right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: CONTROL STATION (4 spans) */}
        <div className="md:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 space-y-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
              <div className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <h2 className="font-bold text-neutral-900 text-sm">Telemetry Control Station</h2>
            </div>

            {/* 1. Climate Profile Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-black text-neutral-500 uppercase tracking-wider flex items-center justify-between">
                <span>1. Forecasted Climate Profile</span>
                <span className="text-[10px] text-neutral-400 lowercase italic font-normal">adjusts multipliers</span>
              </label>
              
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "sunny", label: "Sunny / Clear", icon: Sun, color: "hover:border-amber-400 hover:bg-amber-50/30 text-amber-600 activeBorder:border-amber-500 activeBg:bg-amber-50/50" },
                  { id: "heavy_storm", label: "Heavy Storm", icon: CloudRain, color: "hover:border-blue-400 hover:bg-blue-50/30 text-blue-600 activeBorder:border-blue-500 activeBg:bg-blue-50/50" },
                  { id: "heatwave", label: "Heatwave Peak", icon: Flame, color: "hover:border-rose-400 hover:bg-rose-50/30 text-rose-600 activeBorder:border-rose-500 activeBg:bg-rose-50/50" },
                  { id: "freeze", label: "Arctic Freeze", icon: Snowflake, color: "hover:border-sky-400 hover:bg-sky-50/30 text-sky-600 activeBorder:border-sky-500 activeBg:bg-sky-50/50" }
                ].map((p) => {
                  const IconComponent = p.icon;
                  const isActive = weather === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setWeather(p.id as WeatherProfile)}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                        isActive 
                          ? "border-neutral-900 bg-neutral-50/80 font-bold" 
                          : "border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                      <span className="text-[11px]">{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Historical Baselines Overrides */}
            <div className="space-y-4 pt-2 border-t border-neutral-100">
              <label className="block text-xs font-black text-neutral-500 uppercase tracking-wider flex items-center justify-between">
                <span>2. Historical Stress Loads</span>
                <span className="text-[10px] text-neutral-400 font-normal">Active Reports Count</span>
              </label>

              <div className="space-y-3 text-xs">
                {/* Potholes Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between font-medium">
                    <span className="text-neutral-600 flex items-center gap-1">
                      <Percent className="w-3 h-3 text-neutral-400" />
                      Pothole Nodes
                    </span>
                    <span className="font-mono text-neutral-900 font-bold">{potholesCount}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="20" 
                    value={potholesCount} 
                    onChange={(e) => setPotholesCount(parseInt(e.target.value))}
                    className="w-full accent-neutral-950 h-1 bg-neutral-200 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Garbage Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between font-medium">
                    <span className="text-neutral-600 flex items-center gap-1">
                      <Trash2 className="w-3 h-3 text-neutral-400" />
                      Sanitation Blocks
                    </span>
                    <span className="font-mono text-neutral-900 font-bold">{garbageCount}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="20" 
                    value={garbageCount} 
                    onChange={(e) => setGarbageCount(parseInt(e.target.value))}
                    className="w-full accent-neutral-950 h-1 bg-neutral-200 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Water Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between font-medium">
                    <span className="text-neutral-600 flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-neutral-400" />
                      Hydraulic Pressure Drops
                    </span>
                    <span className="font-mono text-neutral-900 font-bold">{waterCount}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="15" 
                    value={waterCount} 
                    onChange={(e) => setWaterCount(parseInt(e.target.value))}
                    className="w-full accent-neutral-950 h-1 bg-neutral-200 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Lighting Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between font-medium">
                    <span className="text-neutral-600 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3 text-neutral-400" />
                      Dark Grid Junctions
                    </span>
                    <span className="font-mono text-neutral-900 font-bold">{lightsCount}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="15" 
                    value={lightsCount} 
                    onChange={(e) => setLightsCount(parseInt(e.target.value))}
                    className="w-full accent-neutral-950 h-1 bg-neutral-200 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* 3. Community Verification Stats */}
            <div className="space-y-4 pt-3 border-t border-neutral-100">
              <label className="block text-xs font-black text-neutral-500 uppercase tracking-wider flex items-center justify-between">
                <span>3. Crowdsource Trust Factor</span>
                <span className="text-[10px] text-neutral-400 font-normal">Modulates model confidence</span>
              </label>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between font-medium">
                    <span className="text-neutral-600 flex items-center gap-1">
                      <Users className="w-3 h-3 text-indigo-500" />
                      Average Report Trust Score
                    </span>
                    <span className="font-mono text-neutral-900 font-bold">{trustScore}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    value={trustScore} 
                    onChange={(e) => setTrustScore(parseInt(e.target.value))}
                    className="w-full accent-indigo-600 h-1 bg-neutral-200 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-neutral-600 pt-1">
                  <div className="bg-neutral-50 border border-neutral-200 p-2 rounded-xl flex flex-col">
                    <span className="text-neutral-400 text-[9px] uppercase font-bold tracking-wider">Verified Audits</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-emerald-600 text-sm font-mono">{verifiedCount}</span>
                      <button 
                        onClick={() => setVerifiedCount(prev => prev + 1)} 
                        className="text-[10px] bg-neutral-200 hover:bg-neutral-300 px-1 py-0.2 rounded cursor-pointer"
                      >
                        +
                      </button>
                      <button 
                        onClick={() => setVerifiedCount(prev => Math.max(0, prev - 1))} 
                        className="text-[10px] bg-neutral-200 hover:bg-neutral-300 px-1.5 py-0.2 rounded cursor-pointer"
                      >
                        -
                      </button>
                    </div>
                  </div>
                  <div className="bg-neutral-50 border border-neutral-200 p-2 rounded-xl flex flex-col">
                    <span className="text-neutral-400 text-[9px] uppercase font-bold tracking-wider">Unverified Alerts</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-amber-600 text-sm font-mono">{unverifiedCount}</span>
                      <button 
                        onClick={() => setUnverifiedCount(prev => prev + 1)} 
                        className="text-[10px] bg-neutral-200 hover:bg-neutral-300 px-1 py-0.2 rounded cursor-pointer"
                      >
                        +
                      </button>
                      <button 
                        onClick={() => setUnverifiedCount(prev => Math.max(0, prev - 1))} 
                        className="text-[10px] bg-neutral-200 hover:bg-neutral-300 px-1.5 py-0.2 rounded cursor-pointer"
                      >
                        -
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Socio-Demographics Matrix */}
            <div className="space-y-4 pt-3 border-t border-neutral-100">
              <label className="block text-xs font-black text-neutral-500 uppercase tracking-wider flex items-center justify-between">
                <span>4. Socio-Demographic Matrix</span>
                <span className="text-[10px] text-neutral-400 font-normal">district profile metrics</span>
              </label>

              <div className="space-y-3 text-xs">
                {/* Pop Density Buttons */}
                <div className="space-y-1">
                  <span className="text-neutral-600 block font-semibold text-[11px]">Population Density</span>
                  <div className="flex bg-neutral-50 p-1 rounded-xl border border-neutral-200">
                    {(["low", "medium", "high"] as const).map((density) => (
                      <button
                        key={density}
                        type="button"
                        onClick={() => setPopDensity(density)}
                        className={`flex-1 py-1 text-[10px] font-bold rounded-lg border uppercase transition-all cursor-pointer ${
                          popDensity === density
                            ? "bg-white text-indigo-700 border-neutral-300 shadow-3xs"
                            : "bg-transparent text-neutral-500 border-transparent hover:text-neutral-800"
                        }`}
                      >
                        {density}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vulnerable Index Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between font-medium">
                    <span className="text-neutral-600 text-[11px]">Vulnerable Pop (Elderly/Disabled)</span>
                    <span className="font-mono text-neutral-900 font-bold">{vulnerabilityIndex}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="90" 
                    value={vulnerabilityIndex} 
                    onChange={(e) => setVulnerabilityIndex(parseInt(e.target.value))}
                    className="w-full accent-indigo-600 h-1 bg-neutral-200 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Socioeconomic Index Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between font-medium">
                    <span className="text-neutral-600 text-[11px]">Socioeconomic Opportunity index</span>
                    <span className="font-mono text-neutral-900 font-bold">{socioeconomicIndex}/100</span>
                  </div>
                  <input 
                    type="range" 
                    min="15" 
                    max="95" 
                    value={socioeconomicIndex} 
                    onChange={(e) => setSocioeconomicIndex(parseInt(e.target.value))}
                    className="w-full accent-indigo-600 h-1 bg-neutral-200 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* 5. Substrate & Urban Planning Matrix */}
            <div className="space-y-4 pt-3 border-t border-neutral-100">
              <label className="block text-xs font-black text-neutral-500 uppercase tracking-wider flex items-center justify-between">
                <span>5. Substrate & Urban Planning</span>
                <span className="text-[10px] text-neutral-400 font-normal">pipe, pavement & transit grids</span>
              </label>

              <div className="space-y-3 text-xs">
                {/* Pipe Network Age Buttons */}
                <div className="space-y-1">
                  <span className="text-neutral-600 block font-semibold text-[11px]">Subterranean Piping Age</span>
                  <div className="flex bg-neutral-50 p-1 rounded-xl border border-neutral-200">
                    {(["new", "mid", "old"] as const).map((age) => (
                      <button
                        key={age}
                        type="button"
                        onClick={() => setPipeAge(age)}
                        className={`flex-1 py-1 text-[10px] font-bold rounded-lg border uppercase transition-all cursor-pointer ${
                          pipeAge === age
                            ? "bg-white text-indigo-700 border-neutral-300 shadow-3xs"
                            : "bg-transparent text-neutral-500 border-transparent hover:text-neutral-800"
                        }`}
                      >
                        {age === "new" ? "<10Y" : age === "mid" ? "10-30Y" : ">30Y"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pavement Substrate Buttons */}
                <div className="space-y-1">
                  <span className="text-neutral-600 block font-semibold text-[11px]">Surface Pavement Material</span>
                  <div className="flex bg-neutral-50 p-1 rounded-xl border border-neutral-200">
                    {(["asphalt", "concrete", "cobblestone"] as const).map((mat) => (
                      <button
                        key={mat}
                        type="button"
                        onClick={() => setPavementMaterial(mat)}
                        className={`flex-1 py-1 text-[10px] font-bold rounded-lg border uppercase transition-all cursor-pointer ${
                          pavementMaterial === mat
                            ? "bg-white text-indigo-700 border-neutral-300 shadow-3xs"
                            : "bg-transparent text-neutral-500 border-transparent hover:text-neutral-800"
                        }`}
                      >
                        {mat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transit Hub Proximity Buttons */}
                <div className="space-y-1">
                  <span className="text-neutral-600 block font-semibold text-[11px]">Transit Hub Proximity</span>
                  <div className="flex bg-neutral-50 p-1 rounded-xl border border-neutral-200">
                    {(["low", "medium", "high"] as const).map((prox) => (
                      <button
                        key={prox}
                        type="button"
                        onClick={() => setTransitProximity(prox)}
                        className={`flex-1 py-1 text-[10px] font-bold rounded-lg border uppercase transition-all cursor-pointer ${
                          transitProximity === prox
                            ? "bg-white text-indigo-700 border-neutral-300 shadow-3xs"
                            : "bg-transparent text-neutral-500 border-transparent hover:text-neutral-800"
                        }`}
                      >
                        {prox}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Run Button Container */}
            <div className="pt-2">
              <button
                onClick={runPredictiveModel}
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-300 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all cursor-pointer shadow-sm active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                <span>Simulate Environmental Telemetry</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PREDICTIVE DIAGNOSTICS & ANALYSIS (8 spans) */}
        <div className="md:col-span-8 space-y-6 min-h-[500px]">
          
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading-skeleton"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-3xl border border-neutral-200 p-8 text-center space-y-6 shadow-xs min-h-[500px] flex flex-col items-center justify-center"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-indigo-600 animate-pulse" />
                  </div>
                </div>
                
                <div className="space-y-2 max-w-sm">
                  <h3 className="text-base font-bold text-neutral-900">Synthesizing Sensor Array Telemetry</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Querying municipal history indexes and mapping environmental storm multipliers through the predictive AI model...
                  </p>
                </div>
                
                {/* Simulated Loading Lines */}
                <div className="w-full max-w-md space-y-2 pt-4">
                  <div className="h-3 bg-neutral-100 rounded-full w-full overflow-hidden relative">
                    <div className="absolute top-0 bottom-0 left-0 bg-indigo-600 animate-[loadingBar_2s_infinite_linear]" style={{ width: "30%" }}></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                    <span>GET /api/predictive-risk-engine</span>
                    <span>T={Math.round(Date.now() / 100000) % 10000}</span>
                  </div>
                </div>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error-box"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center space-y-4"
              >
                <AlertTriangle className="w-12 h-12 text-rose-600 mx-auto" />
                <h3 className="font-bold text-rose-900 text-base">Prediction Engine Stalled</h3>
                <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
                <button
                  onClick={runPredictiveModel}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-6 py-2.5 rounded-full cursor-pointer transition-all active:scale-95"
                >
                  Force Retrigger Simulation
                </button>
              </motion.div>
            ) : predictionResult ? (
              <motion.div
                key="prediction-results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Visual Tab Selector for Senior Architect Specifications */}
                <div className="flex bg-neutral-100 p-1 rounded-2xl border border-neutral-200/80 gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab("forecast")}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                      activeTab === "forecast"
                        ? "bg-white text-indigo-700 shadow-3xs border-neutral-200/50"
                        : "text-neutral-500 hover:text-neutral-900 bg-transparent border-transparent"
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                    <span>Spatio-Temporal Risk Forecasts</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("specs")}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                      activeTab === "specs"
                        ? "bg-white text-indigo-700 shadow-3xs border-neutral-200/50"
                        : "text-neutral-500 hover:text-neutral-900 bg-transparent border-transparent"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Architectural & Data Science Blueprint</span>
                  </button>
                </div>

                {activeTab === "forecast" ? (
                  <div className="space-y-6">
                    {/* 1. Overall Combined Risk Status Banner */}
                    <div className={`p-6 rounded-3xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 ${getSeverityBg(predictionResult.overallStatusLabel)}`}>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black tracking-widest px-2.5 py-0.5 rounded-full uppercase shadow-xs ${getSeverityBadgeColor(predictionResult.overallStatusLabel)}`}>
                            {predictionResult.overallStatusLabel} RISK WARNING
                          </span>
                          {predictionResult.simulated && (
                            <span className="text-[9px] bg-neutral-200/80 text-neutral-600 font-bold px-1.5 py-0.2 rounded-md">
                              Local Fallback Simulation
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-sans font-bold text-neutral-900">
                          Neighborhood Infrastructure Stress Rating: {predictionResult.overallRiskScore}%
                        </h3>
                        <p className="text-xs text-neutral-600 leading-relaxed max-w-xl">
                          {predictionResult.summary}
                        </p>
                      </div>

                      {/* Circular Dial Indicator */}
                      <div className="flex items-center justify-center shrink-0">
                        <div className="relative w-24 h-24">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle
                              cx="48"
                              cy="48"
                              r="40"
                              className="stroke-neutral-200"
                              strokeWidth="8"
                              fill="transparent"
                            />
                            <circle
                              cx="48"
                              cy="48"
                              r="40"
                              className={`transition-all duration-1000 ${
                                predictionResult.overallRiskScore >= 75 ? "stroke-rose-500" :
                                predictionResult.overallRiskScore >= 45 ? "stroke-amber-500" : "stroke-indigo-500"
                              }`}
                              strokeWidth="8"
                              fill="transparent"
                              strokeDasharray={251.2}
                              strokeDashoffset={251.2 - (251.2 * predictionResult.overallRiskScore) / 100}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black font-mono text-neutral-950">
                              {predictionResult.overallRiskScore}
                            </span>
                            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest leading-none">Index</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 2. Categorized Analysis: 2x2 Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        {
                          id: "pothole",
                          title: "Pothole Formation Risk",
                          data: predictionResult.predictions?.potholeFormation,
                          icon: Percent,
                          color: "text-blue-600",
                          bg: "bg-blue-50/50"
                        },
                        {
                          id: "garbage",
                          title: "Garbage Overflow Risk",
                          data: predictionResult.predictions?.garbageOverflow,
                          icon: Trash2,
                          color: "text-emerald-600",
                          bg: "bg-emerald-50/50"
                        },
                        {
                          id: "water",
                          title: "Hydraulic Leakage Risk",
                          data: predictionResult.predictions?.waterLeakage,
                          icon: Droplets,
                          color: "text-indigo-600",
                          bg: "bg-indigo-50/50"
                        },
                        {
                          id: "lighting",
                          title: "Lighting Failure Risk",
                          data: predictionResult.predictions?.lightingFailure,
                          icon: Lightbulb,
                          color: "text-amber-500",
                          bg: "bg-amber-50/50"
                        }
                      ].map((cat) => {
                        if (!cat.data) return null;
                        const IconComponent = cat.icon;
                        return (
                          <div key={cat.id} className="bg-white rounded-3xl border border-neutral-200 p-5 space-y-4 hover:border-neutral-300 transition-all flex flex-col justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <IconComponent className={`w-4 h-4 ${cat.color}`} />
                                  <span>{cat.title}</span>
                                </span>
                                <span className={`text-sm font-black font-mono ${getCategoryRiskColor(cat.data.riskScore)}`}>
                                  {cat.data.riskScore}% Risk
                                </span>
                              </div>

                              {/* Risk Progress Bar */}
                              <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-1000 ${getCategoryRiskProgressColor(cat.data.riskScore)}`}
                                  style={{ width: `${cat.data.riskScore}%` }}
                                ></div>
                              </div>

                              <p className="text-xs text-neutral-500 leading-relaxed pt-1">
                                {cat.data.explanation}
                              </p>
                            </div>

                            {/* Hotspot tags */}
                            {cat.data.hotspotZones && cat.data.hotspotZones.length > 0 && (
                              <div className="pt-2 border-t border-neutral-100 space-y-1.5">
                                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-neutral-400" />
                                  <span>Predictive Hotspots</span>
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {cat.data.hotspotZones.map((zone: string, index: number) => (
                                    <span key={index} className="bg-neutral-50 border border-neutral-200 text-neutral-700 px-2 py-0.5 rounded-lg text-[10px] font-medium">
                                      {zone}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* 3. Dynamic Cascading Cause-and-Effect Flow Diagram */}
                    <div className="bg-white rounded-3xl border border-neutral-200 p-6 space-y-4">
                      <div className="flex items-center gap-1.5 border-b border-neutral-100 pb-3">
                        <TrendingUp className="w-4 h-4 text-indigo-600" />
                        <h3 className="font-bold text-neutral-900 text-sm">Inter-Dependent Cascading Risk Pathways</h3>
                      </div>

                      <p className="text-xs text-neutral-500 max-w-2xl leading-relaxed">
                        Municipal infrastructure does not fail in isolation. Our network model projects how secondary stressors aggregate to expand structural anomalies across categories:
                      </p>

                      <div className="space-y-3 pt-2">
                        {predictionResult.cascadingRisks?.map((risk: any, idx: number) => (
                          <div key={idx} className="bg-neutral-50 border border-neutral-100 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-medium">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="shrink-0 w-6 h-6 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] font-mono text-indigo-600">
                                {idx + 1}
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-neutral-400 text-[10px] uppercase font-bold block tracking-wider">Trigger Event</span>
                                <span className="text-neutral-900 font-bold">{risk.trigger}</span>
                              </div>
                            </div>

                            {/* Arrow separator in desktop */}
                            <div className="hidden md:block text-neutral-300">
                              <ArrowRight className="w-4 h-4" />
                            </div>

                            <div className="flex items-center gap-3 flex-1">
                              <div className="space-y-0.5">
                                <span className="text-neutral-400 text-[10px] uppercase font-bold block tracking-wider">Downstream Cascading Impact</span>
                                <span className="text-neutral-700 font-semibold">{risk.impact}</span>
                              </div>
                            </div>

                            <div className="shrink-0 flex flex-col items-end justify-center bg-white border border-neutral-200 rounded-xl px-3 py-1 text-right">
                              <span className="text-neutral-400 text-[8px] uppercase font-bold tracking-widest block">Probability</span>
                              <span className="text-rose-600 font-mono font-black text-sm">{risk.probability}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 4. Actionable Preventative Playbook */}
                    <div className="bg-white rounded-3xl border border-neutral-200 p-6 space-y-4">
                      <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                        <div className="flex items-center gap-1.5">
                          <Wrench className="w-4 h-4 text-indigo-600" />
                          <h3 className="font-bold text-neutral-900 text-sm">Actionable Preventative Playbook</h3>
                        </div>
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                          Triage Active
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        
                        {/* Municipal Crews Playbook */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 pb-1 text-xs font-black text-neutral-500 uppercase tracking-wider">
                            <Wrench className="w-3.5 h-3.5 text-neutral-500" />
                            <span>Public Works Dispatches</span>
                          </div>

                          <div className="space-y-3">
                            {predictionResult.preventativeActions
                              ?.filter((a: any) => a.audience?.includes("Crew"))
                              ?.map((action: any, index: number) => (
                                <div key={index} className="border border-neutral-150 p-4 rounded-2xl bg-white hover:bg-neutral-50/50 transition-colors space-y-2 text-xs">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-neutral-900">{action.title}</h4>
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.2 rounded-full ${
                                      action.priority === "high" ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-neutral-100 text-neutral-600"
                                    }`}>
                                      {action.priority} Priority
                                    </span>
                                  </div>
                                  <p className="text-neutral-500 leading-relaxed text-[11px]">
                                    {action.description}
                                  </p>
                                </div>
                            ))}
                          </div>
                        </div>

                        {/* Community Volunteers Playbook */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 pb-1 text-xs font-black text-neutral-500 uppercase tracking-wider">
                            <Users className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Urban Mind Missions</span>
                          </div>

                          <div className="space-y-3">
                            {predictionResult.preventativeActions
                              ?.filter((a: any) => a.audience?.includes("Volunteer"))
                              ?.map((action: any, index: number) => (
                                <div key={index} className="border border-indigo-100 p-4 rounded-2xl bg-indigo-50/20 hover:bg-indigo-50/40 transition-colors space-y-2 text-xs">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-indigo-950">{action.title}</h4>
                                    <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[9px] font-black uppercase px-2 py-0.2 rounded-full">
                                      Volunteer XP
                                    </span>
                                  </div>
                                  <p className="text-indigo-950/80 leading-relaxed text-[11px]">
                                    {action.description}
                                  </p>
                                </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 animate-fade-in text-neutral-800">
                    {/* Header Summary card */}
                    <div className="bg-neutral-900 text-neutral-100 p-6 rounded-3xl border border-neutral-800 shadow-lg space-y-2">
                      <span className="bg-indigo-500 text-neutral-100 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                        Architectural Specification Manual
                      </span>
                      <h3 className="text-base font-bold text-white">Civic Predictive Engine (CPE-1) Pipeline Matrix</h3>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        This model leverages multiple machine learning classifiers to analyze soil moisture dynamics, material aging indices, transit volume loads, and district demographics. Projections are mathematically integrated to prevent municipal disruptions.
                      </p>
                    </div>

                    {/* Bento Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Box 1: Core Mathematical Classifiers */}
                      <div className="bg-white rounded-3xl border border-neutral-200 p-5 space-y-3 shadow-3xs flex flex-col justify-between">
                        <div className="space-y-2">
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block">1. Core Classifiers & Statistical Workflows</span>
                          <h4 className="text-sm font-bold text-neutral-900">Advanced Modeling Stack</h4>
                          <p className="text-xs text-neutral-500 leading-relaxed">
                            A multi-tier modeling assembly executes simultaneously to predict issues:
                          </p>
                          <div className="space-y-2 pt-1 text-[11px]">
                            <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-150">
                              <span className="font-extrabold text-neutral-800 block">Holt-Winters Seasonal Smoothing:</span>
                              <span className="text-neutral-500 block">Deconstructs historical citizen complaints to extract seasonal trends and predict base hazard loads per district.</span>
                            </div>
                            <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-150">
                              <span className="font-extrabold text-neutral-800 block">XGBoost & Random Forest Classifiers:</span>
                              <span className="text-neutral-500 block">Maps moisture levels, pipe materials, and transit loads to calculate pothole and pipe burst probabilities.</span>
                            </div>
                            <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-150">
                              <span className="font-extrabold text-neutral-800 block">Spatio-Temporal Kriging:</span>
                              <span className="text-neutral-500 block">Applies geographic interpolation to outline active high-probability hotspot sectors.</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Box 2: Multi-Modal Data Sources */}
                      <div className="bg-white rounded-3xl border border-neutral-200 p-5 space-y-3 shadow-3xs flex flex-col justify-between">
                        <div className="space-y-2">
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block">2. Model Ingest Directories</span>
                          <h4 className="text-sm font-bold text-neutral-900">Demographic, Climate & GIS Ingestion</h4>
                          <p className="text-xs text-neutral-500 leading-relaxed">
                            Predictions are computed by ingesting four primary distinct directories:
                          </p>
                          <div className="space-y-2 pt-1 text-[11px]">
                            <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-150">
                              <span className="font-extrabold text-neutral-800 block">Citizen Telemetry (Urban Mind):</span>
                              <span className="text-neutral-500 block">Ingests report volumes, upvotes, photos, and verification trust scores from active mobile citizens.</span>
                            </div>
                            <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-150">
                              <span className="font-extrabold text-neutral-800 block">National Climate Data Feed (NOAA):</span>
                              <span className="text-neutral-500 block">Supplies real-time and 7-day forecasted precipitation, severe temperature alerts, and frost-depth indexes.</span>
                            </div>
                            <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-150">
                              <span className="font-extrabold text-neutral-800 block">Socio-Census Blocks (US Census Bureau):</span>
                              <span className="text-neutral-500 block">Tracks population densities, elderly ratios, and socioeconomic opportunities to measure community impact.</span>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Full width Integration card */}
                    <div className="bg-white rounded-3xl border border-neutral-200 p-6 space-y-4 shadow-3xs">
                      <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                        <Users className="w-4 h-4 text-indigo-600" />
                        <div>
                          <h4 className="font-bold text-neutral-900 text-sm">Authority Dashboard Integration Flow</h4>
                          <span className="text-[10px] text-neutral-400 font-medium">Pre-emptive dispatch scheduling matrix</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-150 space-y-1">
                          <span className="font-bold text-neutral-900 block">1. Priority Dispatch Queues</span>
                          <p className="text-neutral-500 text-[11px] leading-relaxed">
                            Predictions showing a high overall risk are instantly pushed to the **Authority Dispatch Console** as urgent verified items, flagging hotspot alerts before they disrupt traffic.
                          </p>
                        </div>
                        <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-150 space-y-1">
                          <span className="font-bold text-neutral-900 block">2. Dynamic Volunteer Routing</span>
                          <p className="text-neutral-500 text-[11px] leading-relaxed">
                            Non-critical preventative tasks (like cleaning street drains before storms) are turned into XP-rewarding **Citizen Missions** on the public map.
                          </p>
                        </div>
                        <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-150 space-y-1">
                          <span className="font-bold text-neutral-900 block">3. Capital Asset Upgrades</span>
                          <p className="text-neutral-500 text-[11px] leading-relaxed">
                            Frequent predictions of infrastructure failure (like water leaks) highlight areas in high-density zones that need structural replacement rather than temporary patching.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </motion.div>
            ) : null}
          </AnimatePresence>

        </div>

      </div>

    </motion.div>
  );
}
