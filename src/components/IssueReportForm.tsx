import React, { useState, useRef } from 'react';
import { Camera, Upload, Trash2, Sparkles, Navigation, CheckCircle2, ShieldCheck, HeartCrack, HelpCircle, Loader2 } from 'lucide-react';
import { IssueCategory, SeverityLevel } from '../types';
import GooglePlacesAutocomplete from './GooglePlacesAutocomplete';

interface IssueReportFormProps {
  onSuccess: (newIssue: any) => void;
  onClose: () => void;
  initialLat?: number;
  initialLng?: number;
  initialLocationName?: string;
  onEnterPickingMode: () => void;
  isInline?: boolean;
}

// Preset demo scans that let users test without needing local images
const DEMO_PRESETS = [
  {
    name: 'Road Pothole',
    title: 'Damaged asphalt on exit lane',
    description: 'Large pothole about 2 feet wide, slowing down traffic.',
    imageUrl: 'https://images.unsplash.com/photo-1599740831119-94b15c9f518e?auto=format&fit=crop&q=80&w=400',
    type: 'image/png'
  },
  {
    name: 'Potable Leak',
    title: 'Water main rupture',
    description: 'Fresh water spraying up through pavement, flooding crosswalk of active avenue.',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=400',
    type: 'image/png'
  },
  {
    name: 'Refuse Pileup',
    title: 'Illegal commercial trash dumping',
    description: 'Bulk cardboards and plastics left near bus stop area.',
    imageUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&q=80&w=400',
    type: 'image/png'
  }
];

export default function IssueReportForm({
  onSuccess,
  onClose,
  initialLat,
  initialLng,
  initialLocationName,
  onEnterPickingMode,
  isInline = false
}: IssueReportFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IssueCategory>('general');
  const [severity, setSeverity] = useState<SeverityLevel>('medium');
  const [lat, setLat] = useState<number>(initialLat || 37.7749);
  const [lng, setLng] = useState<number>(initialLng || -122.4194);
  const [locationName, setLocationName] = useState<string>(initialLocationName || 'Dolores & Market Corridor');
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [scanStep, setScanStep] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync coords from parent if updated
  React.useEffect(() => {
    if (initialLat) setLat(initialLat);
    if (initialLng) setLng(initialLng);
    if (initialLocationName) setLocationName(initialLocationName);
  }, [initialLat, initialLng, initialLocationName]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    processFile(file);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      setImageBase64(base64String);
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Preset quick picker
  const handleSelectPreset = async (preset: typeof DEMO_PRESETS[0]) => {
    setTitle(preset.title);
    setDescription(preset.description);
    setImagePreview(preset.imageUrl);
    
    // Convert image URL to base64 for real/simulated analysis
    try {
      const res = await fetch(preset.imageUrl);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setImageBase64(base64String);
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      console.warn("Could not download preset base64 directly; simulation mode will still operate beautifully.");
    }
  };

  const runAiDiagnostic = async () => {
    setIsAiScanning(true);
    const steps = [
      'Initiating Google Lens-inspired visual telemetry...',
      'Segmenting boundaries (isphalt vs masonry)...',
      'Correlating local environmental impact indices...',
      'Querying municipal civil ordinance guidelines...',
      'Compiling diagnostic metadata recommendations...'
    ];

    for (let i = 0; i < steps.length; i++) {
      setScanStep(steps[i]);
      await new Promise((res) => setTimeout(res, 600));
    }

    try {
      const response = await fetch('/api/analyze-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || 'Scanned Issue Description',
          description,
          imageBase64,
          mimeType: 'image/png'
        })
      });
      const data = await response.json();
      setAiAnalysisResult(data);
      
      // Auto populate form details with AI recommendations
      setCategory(data.categorySuggested as IssueCategory);
      setSeverity(data.severityPrediction as SeverityLevel);
      if (data.title) setTitle(data.title);
      if (data.descriptionRefined) setDescription(data.descriptionRefined);
    } catch (err) {
      console.error(err);
      // Fallback
      setCategory('general');
    } finally {
      setIsAiScanning(false);
      setScanStep('');
    }
  };

  const triggerFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    const payload = {
      id: `issue-${Date.now()}`,
      title,
      description,
      category,
      status: 'reported',
      severity,
      lat,
      lng,
      locationName,
      imageUrl: imagePreview || undefined,
      reportedBy: 'You (Active Hero)',
      reporterId: 'user-active',
      reportedAt: new Date().toISOString(),
      upvotes: 1,
      downvotes: 0,
      comments: [],
      aiAnalysis: aiAnalysisResult ? {
        categorySuggested: aiAnalysisResult.categorySuggested,
        descriptionRefined: aiAnalysisResult.descriptionRefined,
        severityPrediction: aiAnalysisResult.severityPrediction,
        urgencyScore: aiAnalysisResult.urgencyScore,
        resolutionEstimate: aiAnalysisResult.resolutionEstimate
      } : undefined,
      history: [
        {
          status: 'reported' as const,
          timestamp: new Date().toISOString(),
          note: aiAnalysisResult ? 'Report created with AI diagnostic scoring.' : 'Report created.',
          updatedBy: 'You'
        }
      ]
    };

    setSubmitSuccess(true);
    setTimeout(() => {
      onSuccess(payload);
      onClose();
    }, 1500);
  };

  const clearImage = () => {
    setImageBase64(null);
    setImagePreview(null);
    setAiAnalysisResult(null);
  };

  const innerForm = (
    <div className={`relative bg-white w-full rounded-3xl overflow-hidden text-left flex flex-col ${isInline ? 'border border-neutral-250 shadow-xs' : 'max-w-2xl shadow-2xl border border-neutral-100 max-h-[85vh]'}`}>
      
      {/* Success splash overlay */}
      {submitSuccess && (
        <div className="absolute inset-0 bg-white/95 z-50 flex flex-col items-center justify-center space-y-4 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-neutral-800">Filing Complete!</h3>
          <p className="text-sm text-neutral-500">Your civic report is logged, tagged, and assigned to municipal triage.</p>
        </div>
      )}

      {/* Form header */}
      <div className="bg-[#4285F4] p-5 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 animate-pulse" />
          <div>
            <h2 className="text-lg font-bold text-white">Log New Community Incident</h2>
            <p className="text-xs text-blue-100">Tag public infrastructure failures for municipal workers.</p>
          </div>
        </div>
        {!isInline && (
          <button
            onClick={onClose}
            type="button"
            className="text-white hover:text-neutral-200 font-bold bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer"
          >
            &times;
          </button>
        )}
      </div>

        {/* Scrollable Form parameters */}
        <form onSubmit={triggerFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Lens Scan Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#FBBC05]" />
                <span>Google Lens Scanning Hub</span>
              </label>
              {imageBase64 && (
                <button
                  type="button"
                  onClick={clearImage}
                  className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove Scanned Image
                </button>
              )}
            </div>

            {/* Drag Drop camera canvas */}
            <div className="relative border-2 border-dashed border-neutral-200 hover:border-[#4285F4] rounded-2xl p-6 transition-all bg-neutral-50 text-center">
              {isAiScanning && (
                <div className="absolute inset-0 bg-white/90 z-20 flex flex-col items-center justify-center p-4">
                  <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin mb-4" />
                  {/* Digital active line scanner */}
                  <div className="w-2/3 h-1 bg-blue-600 animate-[bounce_2s_infinite] rounded-full shadow-lg opacity-80" />
                  <p className="text-sm font-bold text-neutral-800 animate-pulse mt-4">{scanStep}</p>
                  <p className="text-xs text-neutral-400 mt-1">Interrogating pixel coordinates via Gemini AI...</p>
                </div>
              )}

              {imagePreview ? (
                <div className="flex flex-col items-center">
                  <div className="w-48 h-32 rounded-xl overflow-hidden border border-neutral-300 shadow-inner">
                    <img src={imagePreview} alt="Target Civic Artifact" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <p className="text-xs text-green-600 font-bold mt-2">Lens targeting system locked!</p>
                  {!aiAnalysisResult && (
                    <button
                      type="button"
                      onClick={runAiDiagnostic}
                      className="mt-3 bg-[#4285F4] hover:bg-blue-600 text-white text-xs font-extrabold px-4 py-2.5 rounded-full flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      Run Gemini Image AI Scan
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 rounded-full bg-blue-50 text-[#4285F4]">
                      <Upload className="w-8 h-8" />
                    </div>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm font-bold text-[#4285F4] hover:underline"
                    >
                      Upload an Issue Image
                    </button>
                    <p className="text-xs text-neutral-400 mt-1">drag and drop JPEG/PNG or use Presets below.</p>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  {/* Quick-test Presets block */}
                  <div className="pt-2">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Simulated Testing presets</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {DEMO_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className="px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs font-semibold hover:border-blue-500 hover:bg-blue-50/20 text-neutral-700 transition-all cursor-pointer"
                        >
                          📷 Run {preset.name} Demo
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Gemini AI Diagnostic results report Card */}
          {aiAnalysisResult && (
            <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border border-blue-100 rounded-2xl p-5 space-y-3.5 text-left">
              <div className="flex items-center gap-2 text-blue-700">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="text-sm font-extrabold uppercase tracking-wide">Gemini Cognitive Diagnosis</h3>
                <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full ml-auto">Accuracy Safe</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Proposed Category */}
                <div className="bg-white/80 p-3 rounded-xl border border-blue-50">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Suggested Category</p>
                  <p className="text-sm font-bold text-neutral-800 capitalize">
                    {aiAnalysisResult.categorySuggested.replace('_', ' ')}
                  </p>
                </div>

                {/* Urgency Rating percentage */}
                <div className="bg-white/80 p-3 rounded-xl border border-blue-50">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Urgency Score</p>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-extrabold text-indigo-700">{aiAnalysisResult.urgencyScore}%</span>
                    {/* Linear slider bar */}
                    <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${aiAnalysisResult.urgencyScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Estimate action schedule */}
              <div className="bg-white/90 p-4 rounded-xl border border-blue-100 space-y-1">
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Estimated Mitigation Plan</p>
                <p className="text-xs text-neutral-700 leading-relaxed font-semibold">
                  {aiAnalysisResult.resolutionEstimate}
                </p>
              </div>

              <p className="text-[9px] text-neutral-400 italic">Gemini refined fields filled down below automatically.</p>
            </div>
          )}

          {/* Standard Form parameters */}
          <div className="space-y-4">
            
            {/* Title */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-neutral-600">Incident Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Broken streetlight causing pitch-black pathway"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-sm border border-neutral-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4285F4] focus:border-transparent placeholder-neutral-400"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-600">Refined Case Description</label>
                {!aiAnalysisResult && description.length > 5 && (
                  <button
                    type="button"
                    onClick={runAiDiagnostic}
                    className="text-[10px] text-indigo-600 font-extrabold uppercase hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-[#FBBC05]" />
                    Optimise Text via AI
                  </button>
                )}
              </div>
              <textarea
                required
                rows={3}
                placeholder="Provide details about the damage, size, hazard level, and surrounding safety threats..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-sm border border-neutral-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4285F4] focus:border-transparent placeholder-neutral-400 leading-relaxed"
              />
            </div>

            {/* Dual selection categories & severities */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Category */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-neutral-600">Administrative Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as IssueCategory)}
                  className="w-full text-sm border border-[#CBD5E1] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4285F4]"
                >
                  <option value="pothole">Road Pothole</option>
                  <option value="garbage">Sanitation & Garbage</option>
                  <option value="water_leak">Potable Water Leak</option>
                  <option value="broken_streetlight">Broken Streetlight</option>
                  <option value="graffiti">Vandalism / Graffiti</option>
                  <option value="tree_hazard">Pruning & Tree Hazard</option>
                  <option value="general">General Civil Inquiry</option>
                </select>
              </div>

              {/* Severity Level */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-neutral-600">Calculated Safety Threat</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                  className="w-full text-sm border border-[#CBD5E1] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4285F4]"
                >
                  <option value="low">Low Priority (Nuisance)</option>
                  <option value="medium">Medium Priority (Standard Case)</option>
                  <option value="high">High Priority (Active Hazard)</option>
                  <option value="critical">Critical (Immediate Public Danger)</option>
                </select>
              </div>
            </div>

            {/* Google Maps-powered Address Autocomplete and Coordinate anchor */}
            <GooglePlacesAutocomplete
              lat={lat}
              lng={lng}
              setLat={setLat}
              setLng={setLng}
              locationName={locationName}
              setLocationName={setLocationName}
              onEnterPickingMode={onEnterPickingMode}
            />

          </div>

          {/* Form action triggers */}
          <div className="flex gap-3 justify-end pt-4 border-t border-neutral-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 text-neutral-600 font-semibold text-sm hover:bg-neutral-100 rounded-full transition-all cursor-pointer border border-neutral-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title || !description}
              className={`px-8 py-3 rounded-full text-white font-bold text-sm shadow transition-all cursor-pointer select-none ${
                (!title || !description)
                  ? 'bg-neutral-300 pointer-events-none'
                  : 'bg-[#34A853] hover:bg-green-600 active:scale-95'
              }`}
            >
              Submit Civic Report
            </button>
          </div>

        </form>
      </div>
    );

  if (isInline) {
    return innerForm;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      {innerForm}
    </div>
  );
}
