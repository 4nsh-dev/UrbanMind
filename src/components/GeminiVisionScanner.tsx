import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  ShieldCheck, 
  Bot, 
  Check, 
  RefreshCw, 
  Flame, 
  Info,
  ShieldAlert,
  HelpCircle,
  Building,
  Target,
  ArrowRight
} from 'lucide-react';

interface VisionResult {
  category: string;
  severity: string;
  confidence: string;
  summary: string;
  department: string;
  simulated?: boolean;
}

// Preset samples to help users instantly try the vision analysis without finding a real image file.
const SYSTEM_PRESETS = [
  {
    label: 'Road Crater pothole',
    url: 'https://images.unsplash.com/photo-1599740831119-94b15c9f518e?auto=format&fit=crop&q=80&w=600',
    description: 'Crater-like road pothole posing heavy risk to cyclists.'
  },
  {
    label: 'Water Main Pipe Rupture',
    url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=600',
    description: 'Fresh water spraying onto sidewalk from active street vent.'
  },
  {
    label: 'Refuse & Litter Pileup',
    url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&q=80&w=600',
    description: 'Accumulation of discarded cardboard and plastic bin rubbish.'
  }
];

export default function GeminiVisionScanner() {
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [scanStep, setScanStep] = useState('');
  const [result, setResult] = useState<VisionResult | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processSelectedFile = (file: File) => {
    setErrorStatus(null);
    setResult(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      // Strip metadata before encoding if needed, backend strips it anyway
      setImageBase64(dataUrl);
    };
    reader.onerror = () => {
      setErrorStatus('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processSelectedFile(file);
    } else {
      setErrorStatus('Please drag an image file (PNG, JPG, or WEBP).');
    }
  };

  const handleSelectPreset = async (preset: typeof SYSTEM_PRESETS[0]) => {
    setErrorStatus(null);
    setResult(null);
    setImagePreview(preset.url);
    
    setAnalyzing(true);
    setScanStep('Retrieving high-resolution preset raster...');
    try {
      const response = await fetch(preset.url);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const fullBase64 = reader.result as string;
        setImageBase64(fullBase64);
        setAnalyzing(false);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error("Preset base64 fetch failed:", err);
      // Fallback local base64 simulation
      setImageBase64(preset.url);
      setAnalyzing(false);
    }
  };

  const runVisionAnalysis = async () => {
    if (!imageBase64) return;
    
    setAnalyzing(true);
    setResult(null);
    setErrorStatus(null);

    const telemetrySteps = [
      'Locking raster resolution specs...',
      'Submitting vision matrix payload to model server...',
      'Running Google Gemini multimodal feature extraction...',
      'Organizing structure nodes under target schema...'
    ];

    for (let i = 0; i < telemetrySteps.length; i++) {
      setScanStep(telemetrySteps[i]);
      await new Promise(resolve => setTimeout(resolve, 550));
    }

    try {
      const response = await fetch('/api/gemini-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageBase64,
          mimeType: 'image/jpeg'
        })
      });

      if (!response.ok) {
        throw new Error(`Server responded with HTTP ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || 'Error occurred during image classification telemetry.');
    } finally {
      setAnalyzing(false);
    }
  };

  const triggerReset = () => {
    setImageBase64(null);
    setImagePreview(null);
    setResult(null);
    setErrorStatus(null);
  };

  // Color mapping matching severity
  const getSeverityStyles = (severity: string) => {
    const cleanSev = severity ? severity.trim().toLowerCase() : 'medium';
    if (cleanSev.includes('critical')) {
      return { badge: 'bg-red-100 text-red-800 border-red-250', iconColor: 'text-red-600', border: 'border-red-300' };
    }
    if (cleanSev.includes('high')) {
      return { badge: 'bg-orange-100 text-orange-850 border-orange-255', iconColor: 'text-orange-600', border: 'border-orange-300' };
    }
    if (cleanSev.includes('low')) {
      return { badge: 'bg-green-100 text-green-800 border-green-250', iconColor: 'text-green-600', border: 'border-green-300' };
    }
    return { badge: 'bg-amber-100 text-amber-800 border-amber-250', iconColor: 'text-amber-600', border: 'border-amber-300' };
  };

  const activeStyles = result ? getSeverityStyles(result.severity) : { badge: 'bg-neutral-100', iconColor: 'text-neutral-500', border: 'border-neutral-200' };

  return (
    <div className="bg-white rounded-3xl border border-neutral-200 shadow-3xs overflow-hidden flex flex-col md:flex-row items-stretch min-h-[500px]" id="vision-scanner-container">
      
      {/* Upload/Preview Area */}
      <div className="md:w-1/2 p-6 border-b md:border-b-0 md:border-r border-neutral-100 flex flex-col justify-between space-y-4">
        
        <div className="space-y-2">
          <h3 className="text-sm font-extrabold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
            <Camera className="w-4 h-4 text-indigo-600" />
            <span>Digital Asset Inspection</span>
          </h3>
          <p className="text-xs text-neutral-500">
            Provide a clear photo of the municipal hazard. Let the vision engine scan and register metadata.
          </p>
        </div>

        {/* Drag/Drop workspace canvas card */}
        <div 
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`flex-1 min-h-[220px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-all bg-neutral-50/50 relative overflow-hidden ${
            imagePreview ? 'border-indigo-400 bg-neutral-100/30' : 'border-neutral-200 hover:border-indigo-400'
          }`}
        >
          {analyzing && (
            <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center p-4">
              <div className="w-10 h-10 rounded-full border-4 border-blue-50 border-t-[#4285F4] animate-spin mb-3" />
              {/* Animated green laser scanner */}
              <div className="w-1/2 h-0.5 bg-emerald-500 animate-[bounce_2s_infinite] shadow-lg shadow-emerald-400/50 opacity-80" />
              <p className="text-xs font-black text-neutral-800 animate-pulse mt-3 text-center">{scanStep}</p>
            </div>
          )}

          {imagePreview ? (
            <div className="space-y-4">
              <div className="w-48 h-36 mx-auto rounded-xl overflow-hidden border border-neutral-250 shadow-sm relative group">
                <img 
                  src={imagePreview} 
                  alt="Scanned public space" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-[10px] text-white font-black truncate px-2">IMAGE RECOGNIZED</span>
                </div>
              </div>
              
              {!result && (
                <div className="flex flex-col items-center gap-2 pt-1.5">
                  <button
                    type="button"
                    onClick={runVisionAnalysis}
                    className="bg-[#4285F4] hover:bg-blue-600 text-white font-bold text-xs px-6 py-2.5 rounded-full shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4 text-[#FBBC05]" />
                    <span>Scan with Gemini Vision</span>
                  </button>
                  <button
                    type="button"
                    onClick={triggerReset}
                    className="text-[10px] text-neutral-400 font-bold hover:text-red-650 hover:underline cursor-pointer"
                  >
                    Clear Photo & Reset
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3.5 py-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-black text-indigo-600 hover:underline cursor-pointer"
                >
                  Choose file to upload
                </button>
                <p className="text-[10px] text-neutral-400 mt-1">or drag here (PNG, JPG, WEBP)</p>
              </div>
              <input 
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* System test presets to avoid local disk search */}
        {!imagePreview && (
          <div className="space-y-1.5 pt-1">
            <p className="text-[9px] font-black tracking-wider text-neutral-400 uppercase">Simulate Evaluation Presets</p>
            <div className="grid grid-cols-3 gap-2">
              {SYSTEM_PRESETS.map((preset, i) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="bg-white hover:bg-neutral-50 p-2 border border-neutral-200 hover:border-indigo-400 rounded-xl text-left transition-colors cursor-pointer group flex flex-col justify-between h-14"
                >
                  <span className="text-[9px] font-black text-neutral-800 line-clamp-1">Preset {i+1}</span>
                  <span className="text-[8px] text-neutral-400 font-bold truncate block">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Structured Vision Triage Outputs */}
      <div className="md:w-1/2 p-6 flex flex-col justify-between bg-neutral-50/50 space-y-5 text-left">
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 justify-between">
            <h3 className="text-sm font-extrabold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
              <Bot className="w-4.5 h-4.5 text-indigo-600" />
              <span>Cognitive Triage Assessment</span>
            </h3>
            
            {result?.simulated && (
              <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[8px] font-black tracking-wide uppercase px-2 py-0.5 rounded ml-auto">
                SIMULATION FALLBACK ACTIVE
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-500">
            Real-time metadata classification produced by structural analysis instructions.
          </p>
        </div>

        {/* Display response schema parsed */}
        {result ? (
          <div className="flex-1 space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              
              {/* Category */}
              <div className="bg-white p-3.5 rounded-2xl border border-neutral-150 relative overflow-hidden shadow-3xs">
                <p className="text-[9px] font-black text-neutral-450 uppercase tracking-wider">Category</p>
                <div className="flex items-center gap-1.5 mt-1 font-sans">
                  <Target className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="text-xs font-bold text-neutral-850 capitalize leading-tight">
                    {result.category}
                  </span>
                </div>
              </div>

              {/* Confidence Score */}
              <div className="bg-white p-3.5 rounded-2xl border border-neutral-150 relative overflow-hidden shadow-3xs">
                <p className="text-[9px] font-black text-neutral-450 uppercase tracking-wider">Confidence Level</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-sm font-black text-emerald-600 font-mono leading-none">
                    {result.confidence}
                  </span>
                  {/* Miniature score visual bar */}
                  <div className="flex-1 max-w-[28px] h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full" 
                      style={{ width: `${String(result?.confidence || '95').replace('%', '')}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Severity calculated */}
              <div className="bg-white p-3.5 rounded-2xl border border-neutral-150 relative overflow-hidden shadow-3xs col-span-1">
                <p className="text-[9px] font-black text-neutral-450 uppercase tracking-wider">Severity Tag</p>
                <div className={`mt-1.5 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${activeStyles.badge}`}>
                  <Flame className="w-3.5 h-3.5" />
                  <span>{result.severity}</span>
                </div>
              </div>

              {/* Assigned Department */}
              <div className="bg-white p-3.5 rounded-2xl border border-neutral-150 relative overflow-hidden shadow-3xs col-span-1">
                <p className="text-[9px] font-black text-neutral-450 uppercase tracking-wider">Assigned Department</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Building className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="text-[10px] font-bold text-neutral-800 line-clamp-2 leading-tight">
                    {result.department}
                  </span>
                </div>
              </div>

            </div>

            {/* Comprehensive visual summary */}
            <div className="bg-white rounded-2xl border border-neutral-150 p-4 shadow-3xs space-y-1.5">
              <span className="text-[9px] font-black text-indigo-550 uppercase tracking-widest block">Structural Briefing</span>
              <p className="text-xs text-neutral-700 leading-relaxed font-semibold">
                {result.summary}
              </p>
            </div>

            {/* Interactive reset triggers */}
            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={triggerReset}
                className="bg-white hover:bg-neutral-50 px-4 py-2 border border-neutral-200 text-xs font-bold rounded-xl text-neutral-600 transition-colors cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Examine Another</span>
              </button>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 rounded-2xl p-6 text-center text-neutral-450 bg-white/45">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-3 select-none pointer-events-none">
              <Info className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-neutral-800">Pending Vision Input</p>
            <p className="text-[10px] text-neutral-400 max-w-xs mt-1">
              Select one of our system presets or upload an image on the left, then click "Scan with Gemini Vision" to observe the structured data parser!
            </p>
          </div>
        )}

        {/* Trust disclaimer badge */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex gap-2.5 text-[10px] leading-relaxed text-neutral-500 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Gemini extracts core hazard fields in JSON with strict constraints to reduce city dispatcher triage latency.</span>
        </div>

      </div>

    </div>
  );
}
