import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { pageVariants } from '../utils/motion';
import { Issue, IssueStatus } from '../types';
import AdminPanel from '../components/AdminPanel';
import { ShieldCheck, Lock, AlertTriangle, Cpu, Sparkles, ChevronRight } from 'lucide-react';

interface AuthorityDashboardProps {
  issues: Issue[];
  onUpdateStatus: (issueId: string, nextStatus: IssueStatus, note: string) => void;
  onSelectIssue: (issue: Issue) => void;
  userRole: 'citizen' | 'official';
  onSetRole: (role: 'citizen' | 'official') => void;
}

export default function AuthorityDashboard({
  issues,
  onUpdateStatus,
  onSelectIssue,
  userRole,
  onSetRole
}: AuthorityDashboardProps) {
  const navigate = useNavigate();
  const [overrideAuthorized, setOverrideAuthorized] = useState(false);

  const handleOverride = () => {
    onSetRole('official');
    setOverrideAuthorized(true);
  };

  const isAuthorized = userRole === 'official' || overrideAuthorized;

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left w-full"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Page Heading */}
        <div className="md:col-span-12 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-sans font-extrabold text-neutral-900 tracking-tight flex items-center gap-2">
              <Cpu className="text-blue-600 w-6 h-6" />
              <span>Municipal Dispatch Authority Console</span>
            </h1>
            <p className="text-xs text-neutral-500">
              For use by City Dispatchers and Public Works Inspectors to triage community verified alerts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isAuthorized ? (
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Session Authenticated: Official Clearance</span>
              </span>
            ) : (
              <span className="bg-amber-50 text-amber-800 border border-amber-250 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                <span>Restricted Session View</span>
              </span>
            )}
          </div>
        </div>

        {isAuthorized ? (
          <div className="md:col-span-12 space-y-6">
            <AdminPanel 
              issues={issues}
              onUpdateStatus={onUpdateStatus}
              onSelectIssue={(issue) => {
                onSelectIssue(issue);
                navigate('/community-map'); // redirect to map so official inspects geographically
              }}
            />
          </div>
        ) : (
          <div className="md:col-span-12">
            <div className="bg-white rounded-3xl border border-neutral-200 p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6 shadow-xs">
              <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-neutral-900">Official Access Restriction Code: 403</h2>
                <p className="text-xs text-neutral-500 leading-relaxed max-w-md mx-auto">
                  Your session is currently authenticated under standard **Active Citizen** guidelines. Access is restricted to Public Works agency inspectors. To inspect administrative commands, please override authentication below.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
                <button 
                  onClick={handleOverride}
                  className="bg-[#4285F4] hover:bg-blue-600 text-white font-bold text-xs px-6 py-3.5 rounded-full transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm active:scale-95"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Simulate Official Authorization Override</span>
                </button>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="bg-white hover:bg-neutral-50 text-neutral-700 font-bold text-xs px-6 py-3.5 rounded-full border border-neutral-300 transition-all cursor-pointer flex items-center justify-center gap-1 shadow-3xs"
                >
                  <span>Cancel to Dashboard</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </motion.div>
  );
}
