import React, { useState } from 'react';
import { 
  ShieldCheck, 
  MapPin, 
  ThumbsUp, 
  ThumbsDown, 
  Info, 
  HelpCircle, 
  Award, 
  Bot, 
  Sparkles, 
  Check, 
  X, 
  Flame, 
  Compass, 
  MessageSquareQuote,
  Scale
} from 'lucide-react';
import { Issue, Verification } from '../types';

interface CommunityVerificationPanelProps {
  issue: Issue;
  currentUser: {
    id: string;
    name: string;
    reputation: number;
    avatar: string;
  };
  onVerificationSubmitted: (updatedIssue: Issue, earnedXP: number) => void;
}

export default function CommunityVerificationPanel({
  issue,
  currentUser,
  onVerificationSubmitted
}: CommunityVerificationPanelProps) {
  // Local state for the verification form
  const [verificationType, setVerificationType] = useState<'confirm' | 'reject' | null>(null);
  const [evidence, setEvidence] = useState('');
  const [distanceSim, setDistanceSim] = useState<number>(15); // Default to 15m (on-site)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFormulaBreakdown, setShowFormulaBreakdown] = useState(false);
  const [apiLogs, setApiLogs] = useState<any | null>(null);

  // Quick preset distance toggles to demonstrate proximity-weighted score calculations
  const DISTANCE_PRESETS = [
    { label: 'On-Site (15m)', value: 15, weight: '1.5x Multiplier' },
    { label: 'Nearby (150m)', value: 150, weight: '1.25x Multiplier' },
    { label: 'Far Away (1.2km)', value: 1200, weight: '0.5x Multiplier (Degraded)' }
  ];

  // Check if current user already verified this issue
  const alreadyVerified = issue.verifications?.some(v => v.verifierId === currentUser.id);

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationType) return;

    setIsSubmitting(true);
    try {
      // Build request body for our Trust Score API route
      const response = await fetch('/api/verify-issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          issueId: issue.id,
          reporterReputation: 120, // Reporter reputation baseline
          verifications: issue.verifications || [],
          newVerification: {
            verifierName: currentUser.name,
            verifierId: currentUser.id,
            type: verificationType,
            evidence: evidence,
            distanceMeters: distanceSim,
            reputationAtVerification: currentUser.reputation
          }
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      
      // Verification rewards citizen with Reputation XP!
      // On-site verification grants 100 XP, nearby 50 XP
      const earnedXP = distanceSim <= 200 ? 100 : 40;

      const updatedIssue: Issue = {
        ...issue,
        verifications: data.verifications,
        trustScore: data.trustScore
      };

      // Set API calculation telemetry for transparency
      setApiLogs(data);
      onVerificationSubmitted(updatedIssue, earnedXP);
      
      // Reset form states
      setEvidence('');
      setVerificationType(null);
    } catch (err) {
      console.error("Verification processing failed:", err);
      // Local fallback simulation if server is offline
      const simulatedVerification: Verification = {
        id: `v-sim-${Date.now()}`,
        issueId: issue.id,
        verifierName: currentUser.name,
        verifierId: currentUser.id,
        type: verificationType,
        evidence: evidence,
        distanceMeters: distanceSim,
        reputationAtVerification: currentUser.reputation,
        createdAt: new Date().toISOString()
      };

      const updatedVerifications = [...(issue.verifications || []), simulatedVerification];
      
      // Simple local trust score formula recalculation fallback
      let rawScore = 50 + (updatedVerifications.filter(v => v.type === 'confirm').length * 15) - (updatedVerifications.filter(v => v.type === 'reject').length * 20);
      const finalSimScore = Math.max(5, Math.min(99, rawScore));

      const updatedIssue: Issue = {
        ...issue,
        verifications: updatedVerifications,
        trustScore: finalSimScore
      };

      onVerificationSubmitted(updatedIssue, 75);
      setEvidence('');
      setVerificationType(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Color properties based on trust level
  const getTrustColorInfo = (score: number) => {
    if (score >= 80) return { text: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', progress: 'bg-emerald-500', label: 'Highly Trusted Consensus' };
    if (score >= 55) return { text: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100', progress: 'bg-indigo-500', label: 'Developing Trust' };
    if (score >= 35) return { text: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', progress: 'bg-amber-500', label: 'Unverified / Disputed' };
    return { text: 'text-red-600', bg: 'bg-red-50 border-red-100', progress: 'bg-red-500', label: 'Suspected False Report' };
  };

  const trustColor = getTrustColorInfo(issue.trustScore || 50);

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs" id="community-verification-panel">
      
      {/* Header Info */}
      <div className="p-4.5 bg-neutral-50/75 border-b border-neutral-200 flex justify-between items-center text-left">
        <div className="space-y-0.5">
          <h4 className="text-xs font-black text-neutral-900 uppercase tracking-widest flex items-center gap-1.5">
            <ShieldCheck className="w-4.5 h-4.5 text-indigo-600" />
            <span>Community Verification Engine</span>
          </h4>
          <p className="text-[10px] text-neutral-500 font-semibold">
            Nearby citizens verify incidents with real-time telemetry inputs & proof.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowFormulaBreakdown(!showFormulaBreakdown)}
          className="text-[10px] font-black text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Formula Breakdown</span>
        </button>
      </div>

      <div className="p-4.5 space-y-4">
        
        {/* Trust Score Progress indicator */}
        <div className={`p-4 rounded-xl border flex items-center gap-4 ${trustColor.bg}`}>
          
          {/* Radial Indicator circle */}
          <div className="relative w-14 h-14 rounded-full flex items-center justify-center shrink-0 border border-neutral-100 bg-white shadow-3xs">
            <span className="text-sm font-black font-mono text-neutral-800">
              {issue.trustScore || 50}%
            </span>
            <div className="absolute inset-0 rounded-full border-2 border-neutral-100 border-t-indigo-600 animate-[spin_4s_linear_infinite] pointer-events-none opacity-30" />
          </div>

          <div className="flex-1 min-w-0 text-left space-y-1">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-black uppercase tracking-wider ${trustColor.text}`}>
                {trustColor.label}
              </span>
              <span className="text-[9px] text-neutral-400 font-bold">
                {issue.verifications?.length || 0} assertions
              </span>
            </div>
            
            {/* ProgressBar */}
            <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${trustColor.progress}`}
                style={{ width: `${issue.trustScore || 50}%` }}
              />
            </div>

            <p className="text-[9.5px] text-neutral-500 font-semibold leading-relaxed">
              Consensus updates dynamically when neighbors log proximity validation coordinates.
            </p>
          </div>

        </div>

        {/* Dynamic Formula Explanation Overlay */}
        {showFormulaBreakdown && (
          <div className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs space-y-3 font-mono border border-slate-850 animate-fade-in text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="font-extrabold text-blue-400 flex items-center gap-1">
                <Bot className="w-4 h-4 text-[#FBBC05]" />
                <span>Consensus Engine DDL v1.2</span>
              </span>
              <button 
                type="button" 
                onClick={() => setShowFormulaBreakdown(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-slate-300 font-bold text-[10px]">
                We compute community credibility dynamically to reduce automated dispatcher noise:
              </p>
              <div className="bg-slate-950 p-2 rounded border border-slate-800 text-[10px] text-emerald-400 font-black overflow-x-auto">
                Score = Clamp( 50 + ReporterBonus + (ΣConfirmWeight * 12) - (ΣRejectWeight * 20), 5, 99 )
              </div>

              <div className="space-y-1 text-[10px] text-slate-400">
                <p><span className="text-white font-bold">Reporter Bonus:</span> Up to +15% based on submitter lifetime reputation XP.</p>
                <p><span className="text-white font-bold">Verifier Reputation Modifier:</span> Weight multiplier scales up to 2.5x for trusted veterans (XP &gt; 2000).</p>
                <p><span className="text-white font-bold">Proximity Modifier:</span> Physical check matches GPS coordinates (1.5x if &le; 50m, 1.25x if &le; 200m).</p>
                <p><span className="text-white font-bold">Evidence Modifier:</span> 1.2x weight bonus if detailed proof text is supplied.</p>
              </div>
            </div>

            {/* Current Weight Breakdown */}
            {issue.verifications && issue.verifications.length > 0 && (
              <div className="border-t border-slate-800 pt-2 space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Active Weights:</span>
                <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                  {issue.verifications.map((v, i) => {
                    const repModifier = 1.0 + Math.min((v.reputationAtVerification || 0) / 1000, 1.5);
                    const isConfirm = v.type === 'confirm';
                    return (
                      <div key={v.id || i} className="flex justify-between items-center text-[9px] bg-slate-950 p-1.5 rounded">
                        <span className="truncate max-w-[80px] font-bold text-slate-300">{v.verifierName}</span>
                        <span className={isConfirm ? 'text-emerald-400 font-extrabold' : 'text-red-400 font-extrabold'}>
                          {isConfirm ? 'Confirm' : 'Reject'}
                        </span>
                        <span className="text-indigo-300">Rep: x{repModifier.toFixed(1)}</span>
                        <span className="text-amber-400 font-black">Weight: {((repModifier * (v.distanceMeters <= 50 ? 1.5 : (v.distanceMeters <= 200 ? 1.25 : 1.0))) * (v.evidence && v.evidence.length >= 15 ? 1.2 : 1.0)).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Citizen verification form card */}
        {alreadyVerified ? (
          <div className="bg-neutral-50 rounded-xl p-4.5 border border-neutral-150 text-center text-neutral-600 space-y-2 font-medium">
            <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-3xs">
              <Check className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-neutral-800">Your Assertion is Locked</p>
            <p className="text-[10px] text-neutral-400 max-w-xs mx-auto">
              You have already logged a community check for this case. Your verifications contribute permanently to our municipal dispatch triage logic.
            </p>
          </div>
        ) : (
          <form onSubmit={handleVerifySubmit} className="bg-neutral-50/50 rounded-xl p-4 border border-neutral-200 text-left space-y-3.5">
            
            <div className="space-y-1">
              <label className="text-[9.5px] font-extrabold uppercase text-neutral-400 block tracking-wider">
                1. Select Verification Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setVerificationType('confirm')}
                  className={`py-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    verificationType === 'confirm'
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm font-extrabold'
                      : 'bg-white hover:bg-emerald-50 text-neutral-700 border-neutral-200'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Confirm Issue</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVerificationType('reject')}
                  className={`py-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    verificationType === 'reject'
                      ? 'bg-red-500 text-white border-red-600 shadow-sm font-extrabold'
                      : 'bg-white hover:bg-red-50 text-neutral-700 border-neutral-200'
                  }`}
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  <span>Reject / Fake</span>
                </button>
              </div>
            </div>

            {/* Sim GPS coordinates selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[9.5px] font-extrabold uppercase text-neutral-400 tracking-wider">
                  2. Simulate GPS Proximity
                </label>
                <Compass className="w-3.5 h-3.5 text-indigo-500 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {DISTANCE_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setDistanceSim(preset.value)}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col justify-between h-13 ${
                      distanceSim === preset.value
                        ? 'border-indigo-500 bg-indigo-50/55 text-indigo-950 font-bold ring-2 ring-indigo-100'
                        : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-500'
                    }`}
                  >
                    <span className="text-[9px] font-extrabold block truncate leading-tight">{preset.label}</span>
                    <span className="text-[7.5px] text-neutral-400 font-semibold block leading-none">{preset.weight}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Narrative Evidence Input box */}
            <div className="space-y-1">
              <label className="text-[9.5px] font-extrabold uppercase text-neutral-400 block tracking-wider">
                3. Add Written Evidence
              </label>
              <textarea
                rows={2}
                maxLength={200}
                placeholder="Briefly explain what you see on the ground (e.g., 'Water is active puddle 10cm deep', 'Pothole is blocking car lane'). Minimum 15 chars for reputation boost!"
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                className="w-full text-xs border border-neutral-350 bg-white rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-[8.5px] text-neutral-400 font-semibold">
                {evidence.trim().length >= 15 ? (
                  <span className="text-emerald-600 flex items-center gap-0.5">
                    <Check className="w-3 h-3 inline" /> Detailed evidence bonus unlocked! (+20% weight modifier)
                  </span>
                ) : (
                  <span>Provide details to amplify verification weight.</span>
                )}
              </span>
            </div>

            <button
              type="submit"
              disabled={!verificationType || isSubmitting}
              className="w-full py-2.5 rounded-xl text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all disabled:bg-neutral-200 disabled:text-neutral-400 disabled:scale-100 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Award className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Submit Triage Verification</span>
            </button>

          </form>
        )}

        {/* Historical Verifications Stream inside card */}
        {issue.verifications && issue.verifications.length > 0 && (
          <div className="space-y-2 pt-1 border-t border-neutral-150 text-left">
            <span className="text-[9.5px] font-extrabold uppercase text-neutral-400 tracking-wider block">
              Recent Proximity Assertions ({issue.verifications.length})
            </span>
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {issue.verifications.map((v) => {
                const isConfirm = v.type === 'confirm';
                return (
                  <div key={v.id} className="bg-neutral-50/50 p-3 rounded-xl border border-neutral-150 space-y-1.5 relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${isConfirm ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className="text-xs font-extrabold text-neutral-800">{v.verifierName}</span>
                      </div>
                      <span className="text-[8.5px] text-neutral-400 font-bold">
                        {v.distanceMeters <= 50 ? 'On-site' : `${v.distanceMeters}m away`} • {new Date(v.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {v.evidence && (
                      <p className="text-[10px] text-neutral-600 font-medium italic bg-white border border-neutral-100 p-2 rounded-lg pl-2.5 flex items-start gap-1">
                        <MessageSquareQuote className="w-3.5 h-3.5 text-neutral-350 shrink-0 mt-0.5" />
                        <span>"{v.evidence}"</span>
                      </p>
                    )}

                    <div className="flex gap-2 text-[8px] text-neutral-400 font-bold">
                      <span>Reputation: {v.reputationAtVerification} XP</span>
                      <span>•</span>
                      <span className={isConfirm ? 'text-emerald-600' : 'text-red-500'}>
                        {isConfirm ? 'CONFIRMED' : 'REJECTED'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
