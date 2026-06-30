import React, { useState } from 'react';
import { Issue, Comment, IssueStatus } from '../types';
import { ThumbsUp, ThumbsDown, MessageSquare, Sparkles, CheckCircle2, ShieldAlert, Award, Calendar, ChevronRight, MessageCircleCode, CheckSquare, RefreshCw, Send, ShieldCheck, HeartPulse } from 'lucide-react';
import CommunityVerificationPanel from './CommunityVerificationPanel';

interface IssueDetailProps {
  issue: Issue | null;
  onClose: () => void;
  onVote: (issueId: string, type: 'up' | 'down') => void;
  onAddComment: (issueId: string, commentText: string) => void;
  onUpdateStatus?: (issueId: string, nextStatus: IssueStatus, updateNote: string) => void;
  onVerifyIssue?: (updatedIssue: Issue, earnedXP: number) => void;
}

const CATEGORY_TAGS: Record<string, string> = {
  pothole: 'Road Potholes',
  garbage: 'Sanitation & Litter',
  water_leak: 'Potable Leak',
  broken_streetlight: 'Electrical Lights',
  graffiti: 'Vandals / Graffiti',
  tree_hazard: 'Tree Hazard',
  general: 'General inquiry'
};

const SEVERITY_ACCENT: Record<string, { badge: string, bg: string }> = {
  low: { badge: 'text-green-800 bg-green-50 border-green-100', bg: 'bg-green-500' },
  medium: { badge: 'text-amber-800 bg-amber-50 border-amber-100', bg: 'bg-amber-500' },
  high: { badge: 'text-orange-850 bg-orange-50 border-orange-100', bg: 'bg-orange-500' },
  critical: { badge: 'text-red-800 bg-red-50 border-red-100', bg: 'bg-red-500' }
};

export default function IssueDetail({
  issue,
  onClose,
  onVote,
  onAddComment,
  onUpdateStatus,
  onVerifyIssue
}: IssueDetailProps) {
  const [commentText, setCommentText] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [discussionSummary, setDiscussionSummary] = useState('');
  const [adminNote, setAdminNote] = useState('');

  if (!issue) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200/85 p-8 text-center h-full flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-blue-50 text-[#4285F4] flex items-center justify-center">
          <MessageCircleCode className="w-8 h-8" />
        </div>
        <div className="space-y-1.5 max-w-sm">
          <h3 className="font-bold text-neutral-800">Select an Incident Pin</h3>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Click on any map pin or select items from the sidebar to inspect diagnostic data, public validation parameters, and resolution status feeds.
          </p>
        </div>
      </div>
    );
  }

  const handleVoteSubmit = (type: 'up' | 'down') => {
    onVote(issue.id, type);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(issue.id, commentText.trim());
    setCommentText('');
    setDiscussionSummary(''); // reset summary so user can refresh it
  };

  const handleStatusChange = (nextStatus: IssueStatus) => {
    if (onUpdateStatus && adminNote.trim()) {
      onUpdateStatus(issue.id, nextStatus, adminNote.trim());
      setAdminNote('');
    }
  };

  const summarizeDiscussionWithAi = async () => {
    setIsSummarizing(true);
    try {
      const response = await fetch('/api/summarize-discussion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: issue.comments })
      });
      const data = await response.json();
      setDiscussionSummary(data.summary);
    } catch (err) {
      console.error(err);
      setDiscussionSummary("Sentiment: Highly supportive civic dialogue indicating immediate repair importance.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const severityProps = SEVERITY_ACCENT[issue.severity] || SEVERITY_ACCENT.medium;

  // Active progress tracks indexing
  const statusSteps: { id: IssueStatus; label: string }[] = [
    { id: 'reported', label: 'Reported' },
    { id: 'verified', label: 'Verified' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'resolved', label: 'Resolved' }
  ];

  const currentStepIndex = statusSteps.findIndex(s => s.id === issue.status);

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col h-full">
      
      {/* Detail header photo banner */}
      <div className="h-56 bg-neutral-100 relative overflow-hidden shrink-0">
        {issue.imageUrl ? (
          <img
            src={issue.imageUrl}
            alt={issue.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-[#4285F4]/10 flex items-center justify-center">
            <Sparkles className="w-12 h-12 text-[#4285F4]/40" />
          </div>
        )}

        {/* Back and exit action triggers */}
        <div className="absolute inset-x-4 top-4 flex justify-between items-center">
          <span className="text-[10px] font-extrabold uppercase bg-neutral-900/80 text-white px-3 py-1.5 rounded-full backdrop-blur">
            ID: #{issue.id}
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-900/80 text-white hover:bg-neutral-800 flex items-center justify-center backdrop-blur font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Categories floating tags */}
        <div className="absolute left-4 bottom-4 flex flex-wrap gap-1.5">
          <span className="text-xs font-bold bg-[#4285F4] text-white px-3 py-1.5 rounded-full shadow-md">
            {CATEGORY_TAGS[issue.category] || issue.category}
          </span>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full shadow-md border ${severityProps.badge}`}>
            {issue.severity.toUpperCase()} Priority
          </span>
        </div>
      </div>

      {/* Main body information blocks */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
        
        {/* Title and submit info */}
        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-neutral-900 leading-snug">
            {issue.title}
          </h2>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <span className="font-semibold text-neutral-700">Filed by {issue.reportedBy}</span>
            <span>•</span>
            <Calendar className="w-3.5 h-3.5" />
            <span>{new Date(issue.reportedAt).toLocaleDateString()}</span>
            <span>•</span>
            <span className="text-[#34A853] font-bold">📍 {issue.locationName}</span>
          </div>
        </div>

        {/* Dynamic status progress tracker timeline bar */}
        <div className="bg-neutral-50 rounded-2xl p-4.5 border border-neutral-100">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-neutral-400 mb-3.5">
            Triage Progress Checklist
          </p>
          <div className="flex items-center justify-between">
            {statusSteps.map((step, idx) => {
              const isPast = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div key={step.id} className="flex items-center flex-1 last:flex-initial">
                  <div className="flex flex-col items-center">
                    {/* Circle representing the stage node */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                        isPast
                          ? step.id === 'resolved' ? 'bg-[#34A853] text-white' : 'bg-[#4285F4] text-white shadow'
                          : 'bg-neutral-200 text-neutral-500'
                      } ${isCurrent ? 'ring-4 ring-blue-100 animate-pulse' : ''}`}
                    >
                      {step.id === 'resolved' && isPast ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <span className="text-xs font-bold">{idx + 1}</span>
                      )}
                    </div>
                    {/* Label of node */}
                    <span
                      className={`text-[9px] font-bold mt-1.5 ${
                        isCurrent ? 'text-blue-600 font-extrabold' : 'text-neutral-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>

                  {/* Connective spacer line */}
                  {idx < statusSteps.length - 1 && (
                    <div
                      className={`flex-1 h-1.5 mx-2 rounded-full transition-colors ${
                        idx < currentStepIndex ? 'bg-[#4285F4]' : 'bg-neutral-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Description */}
        <div className="space-y-2">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">
            Citizen Case Description
          </h3>
          <p className="text-sm text-neutral-600 leading-relaxed font-medium bg-neutral-50/50 p-4 rounded-xl border border-neutral-100">
            {issue.description}
          </p>
        </div>

        {/* AI refinement insights */}
        {issue.aiAnalysis && (
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-1.5 text-indigo-700">
              <Sparkles className="w-4 h-4 text-[#FBBC05]" />
              <h4 className="text-xs font-extrabold uppercase tracking-wide">AI Dispatch Telemetry</h4>
            </div>
            
            <div className="text-xs text-neutral-600 space-y-2 font-medium">
              <p>
                <strong className="text-indigo-800">Cognitive Structural Summary:</strong>{' '}
                {issue.aiAnalysis.descriptionRefined}
              </p>
              <div className="flex flex-wrap gap-4 pt-1.5 border-t border-indigo-100/60 mt-1">
                <div>
                  <span className="text-[10px] text-neutral-400 font-semibold block uppercase">Urgency Score</span>
                  <span className="text-xs font-bold text-indigo-700">{issue.aiAnalysis.urgencyScore}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 font-semibold block uppercase">Resolution Estimate</span>
                  <span className="text-xs font-bold text-neutral-700">{issue.aiAnalysis.resolutionEstimate}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Community Verification Panel */}
        {onVerifyIssue && (
          <CommunityVerificationPanel
            issue={issue}
            currentUser={{
              id: 'user-active-citizen',
              name: 'Anshdeep Singh',
              reputation: 1250,
              avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Anshdeep'
            }}
            onVerificationSubmitted={onVerifyIssue}
          />
        )}

        {/* Discussion summary using Gemini AI */}
        {issue.comments.length > 0 && (
          <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-150 relative overflow-hidden text-left space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-extrabold uppercase text-neutral-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>AI Forum Analysis</span>
              </h4>
              <button
                onClick={summarizeDiscussionWithAi}
                disabled={isSummarizing}
                className="text-[10px] text-blue-600 hover:underline font-extrabold flex items-center gap-1 cursor-pointer"
              >
                {isSummarizing ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3" />
                    <span>{discussionSummary ? 'Re-analyse Comments' : 'Analyze Comments'}</span>
                  </>
                )}
              </button>
            </div>

            {discussionSummary ? (
              <p className="text-xs bg-white p-3 rounded-xl border border-neutral-100 font-semibold text-neutral-600 leading-relaxed italic">
                "{discussionSummary}"
              </p>
            ) : (
              <p className="text-[11px] text-neutral-400">
                Click button above to aggregate comments and compile sentiment indices using Gemini AI models.
              </p>
            )}
          </div>
        )}

        {/* Triage History Stream */}
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">
            Case Lifecycle History Logs
          </h3>
          <div className="space-y-3.5 relative pl-4 border-l border-neutral-200">
            {issue.history.map((log, idx) => (
              <div key={idx} className="relative text-xs">
                {/* Visual node on timeline */}
                <span className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full bg-[#4285F4]" />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-neutral-800 capitalize">
                      Status: {log.status.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-medium">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 font-semibold">
                    {log.note}
                  </p>
                  <p className="text-[10px] text-neutral-400">
                    Logged by: {log.updatedBy}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comments Feed list */}
        <div className="space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-blue-500" />
            <span>Community Forum ({issue.comments.length})</span>
          </h3>

          {/* Add comment form input */}
          <form onSubmit={handleCommentSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Suggest repair shortcuts, verify findings, or coordinate cleanup volunteers..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 text-xs border border-neutral-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className={`p-2.5 rounded-xl text-white transition-all cursor-pointer flex items-center justify-center ${
                !commentText.trim() ? 'bg-neutral-200' : 'bg-[#4285F4] hover:bg-blue-600 active:scale-95'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Forum items stack */}
          <div className="space-y-3">
            {issue.comments.map(c => (
              <div key={c.id} className="bg-neutral-50 p-3 rounded-2xl border border-neutral-100 flex gap-3 text-xs leading-relaxed">
                <img
                  src={c.avatar}
                  alt={c.author}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full shrink-0 border border-neutral-200 bg-neutral-200"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-800">{c.author}</span>
                    <span className="text-[10px] font-semibold text-neutral-400">
                      {new Date(c.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  {/* Badge */}
                  {c.badge && (
                    <span className="inline-block text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded font-extrabold leading-3">
                      🎖️ {c.badge}
                    </span>
                  )}
                  <p className="text-neutral-600 font-semibold">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Administration Status Triage Console */}
        {onUpdateStatus && (
          <div className="border-t border-neutral-100 pt-6 space-y-4 text-left p-1 bg-red-50/10 rounded-2xl">
            <div className="flex items-center gap-1.5 text-neutral-800">
              <Award className="w-4 h-4 text-orange-500" />
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#EA4335]">Authority Admin Console</h4>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-400 uppercase">Triage Log Note</label>
              <textarea
                rows={2}
                placeholder="Write physical work orders or update dispatch notes here..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="w-full text-xs border border-neutral-200 bg-white rounded-xl p-3 focus:outline-[#EA4335]"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              {['reported', 'verified', 'in_progress', 'resolved'].map(st => (
                <button
                  key={st}
                  disabled={!adminNote.trim()}
                  type="button"
                  onClick={() => handleStatusChange(st as IssueStatus)}
                  className={`text-[10px] px-3 py-2 rounded-xl border font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                    issue.status === st
                      ? 'bg-neutral-800 text-white'
                      : 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-600'
                  }`}
                >
                  Mark {st.replace('_', ' ')}
                </button>
              ))}
            </div>
            <p className="text-[9px] text-neutral-400">Requires writing a triage note above first to log audit trails.</p>
          </div>
        )}

      </div>
    </div>
  );
}
