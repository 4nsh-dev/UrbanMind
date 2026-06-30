import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { pageVariants } from '../utils/motion';
import { AlertCircle, ArrowLeft, Bot, HelpCircle, ShieldCheck, Landmark } from 'lucide-react';
import IssueReportForm from '../components/IssueReportForm';

interface ReportIssueProps {
  onSuccess: (newIssue: any) => void;
  mapInputLat: number;
  mapInputLng: number;
  mapInputLocationName: string;
  setPickingMode: (val: boolean) => void;
}

export default function ReportIssue({ 
  onSuccess, 
  mapInputLat, 
  mapInputLng, 
  mapInputLocationName,
  setPickingMode
}: ReportIssueProps) {
  const navigate = useNavigate();

  const handleSuccess = (newIssue: any) => {
    onSuccess(newIssue);
    navigate('/community-map'); // redirect to map to see the new pin
  };

  const handleEnterPickingMode = () => {
    setPickingMode(true);
    navigate('/community-map'); // redirect to map so user can click to pick coords
  };

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left space-y-6"
    >
      
      {/* Header back button */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-1 text-sm font-bold text-neutral-600 hover:text-neutral-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
        
        <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400 bg-neutral-100 rounded-full px-3 py-1 border border-neutral-200">
          <Landmark className="w-3.5 h-3.5" />
          <span>Active Session Code: SF-2026</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Main report form wrapper */}
        <div className="md:col-span-8 bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden p-6 sm:p-8">
          <div className="space-y-1 pb-6 border-b border-neutral-100">
            <h1 className="text-xl sm:text-2xl font-sans font-extrabold text-neutral-900 tracking-tight">
              Report Physical Municipal Hazard
            </h1>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Every submission runs through our server-side <strong>Gemini visual engine</strong> to extract severity metadata and refine description logs dynamically.
            </p>
          </div>

          <div className="pt-6">
            <IssueReportForm 
              onSuccess={handleSuccess}
              onClose={() => navigate('/dashboard')}
              initialLat={mapInputLat}
              initialLng={mapInputLng}
              initialLocationName={mapInputLocationName}
              onEnterPickingMode={handleEnterPickingMode}
              isInline={true}
            />
          </div>
        </div>

        {/* Right Info Checklist Pane */}
        <div className="md:col-span-4 space-y-6">
          
          {/* Gemini Scanning Assist Notice */}
          <div className="bg-gradient-to-br from-indigo-50/60 to-blue-50/60 p-5 rounded-3xl border border-indigo-100/80 text-xs leading-relaxed space-y-3.5 text-indigo-950">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Bot className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="font-extrabold text-indigo-950">AI Multimodal Assistance</h4>
                <p className="text-[10px] text-indigo-700 font-semibold">Gemini 2.5 Flash Triage</p>
              </div>
            </div>
            
            <p className="text-neutral-700">
              By uploading a photorealistic image or picking one of our **Simulated Presets**, the system triggers structural analyses:
            </p>

            <ul className="space-y-2 text-[11px] text-neutral-600 list-disc pl-3">
              <li><strong className="text-neutral-800">Severe Damage Extraction:</strong> Auto identifies asphalt sizes, water flow velocity, or garbage volumes.</li>
              <li><strong className="text-neutral-800">Triage Assignment:</strong> Establishes estimated resolution timelines and severity tiers.</li>
              <li><strong className="text-neutral-800">Reputation Dispatch:</strong> Submitting a valid file matches 100 XP baseline bonus.</li>
            </ul>
          </div>

          {/* Quick instructions */}
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 text-left space-y-4">
            <h4 className="text-xs font-extrabold text-neutral-900 uppercase tracking-wider">How Triage Works</h4>
            
            <div className="space-y-4 text-xs font-medium">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-neutral-100 text-neutral-700 text-xs font-bold flex items-center justify-center shrink-0">1</div>
                <div>
                  <p className="text-neutral-900 font-bold">Pin Location</p>
                  <p className="text-neutral-500 text-[11px]">Specify exact geographic markings either manually or using our map picker coordinates.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-neutral-100 text-neutral-700 text-xs font-bold flex items-center justify-center shrink-0">2</div>
                <div>
                  <p className="text-neutral-900 font-bold">Image & Detail Scan</p>
                  <p className="text-neutral-500 text-[11px]">Provide accurate context or load a demo preset. The Gemini API clarifies description notes instantly.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-neutral-100 text-[#34A853] text-xs font-bold flex items-center justify-center shrink-0">3</div>
                <div>
                  <p className="text-neutral-900 font-bold">Dispatch Authorization</p>
                  <p className="text-neutral-500 text-[11px]">Once verified by peers or administrators, Public Works contractors schedule onsite roadworks.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Verification terms */}
          <div className="bg-neutral-100 border border-neutral-200 rounded-2xl p-4 flex gap-2.5 text-[11px] leading-normal text-left text-neutral-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Spam filters actively flag submissions. False reporting blocks account privileges.</span>
          </div>

        </div>

      </div>

    </motion.div>
  );
}
