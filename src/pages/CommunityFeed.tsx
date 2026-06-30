import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { pageVariants } from '../utils/motion';
import { 
  Search, 
  MapPin, 
  ThumbsUp, 
  MessageSquare, 
  ChevronRight, 
  Sparkles, 
  ShieldCheck, 
  ShieldAlert,
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  Filter, 
  Calendar, 
  Users, 
  ArrowUpRight,
  Flame,
  Info,
  Clock,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { Issue, IssueCategory, IssueStatus } from '../types';

interface CommunityFeedProps {
  issues: Issue[];
  onVote: (issueId: string, type: 'up' | 'down') => void;
  onSelectIssue: (issue: Issue) => void;
}

const CATEGORY_STYLES: Record<IssueCategory, { label: string; emoji: string; gradient: string; iconBg: string; border: string; text: string }> = {
  pothole: { label: 'Road Pothole', emoji: '🚧', gradient: 'from-amber-500/10 via-amber-600/5 to-transparent', iconBg: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-900/60', text: 'text-amber-800 dark:text-amber-250' },
  garbage: { label: 'Sanitation & Litter', emoji: '🗑️', gradient: 'from-emerald-500/10 via-emerald-600/5 to-transparent', iconBg: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-900/60', text: 'text-emerald-800 dark:text-emerald-250' },
  water_leak: { label: 'Water Leak', emoji: '💧', gradient: 'from-blue-500/10 via-blue-600/5 to-transparent', iconBg: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-900/60', text: 'text-blue-800 dark:text-blue-250' },
  broken_streetlight: { label: 'Streetlight', emoji: '💡', gradient: 'from-yellow-500/10 via-yellow-600/5 to-transparent', iconBg: 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-900/60', text: 'text-yellow-800 dark:text-yellow-250' },
  graffiti: { label: 'Graffiti Abatement', emoji: '🎨', gradient: 'from-purple-500/10 via-purple-600/5 to-transparent', iconBg: 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-900/60', text: 'text-purple-800 dark:text-purple-250' },
  tree_hazard: { label: 'Tree Hazard', emoji: '🌳', gradient: 'from-green-500/10 via-green-600/5 to-transparent', iconBg: 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-900/60', text: 'text-green-800 dark:text-green-250' },
  general: { label: 'General Hazard', emoji: '📋', gradient: 'from-slate-500/10 via-slate-600/5 to-transparent', iconBg: 'bg-slate-100 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-800', text: 'text-slate-800 dark:text-slate-250' }
};

const SEVERITY_STYLES: Record<string, { badge: string; dot: string; label: string }> = {
  low: { badge: 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200/60 dark:border-green-900/50', dot: 'bg-green-505', label: 'Low Urgency' },
  medium: { badge: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/50', dot: 'bg-amber-500', label: 'Moderate' },
  high: { badge: 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-200/60 dark:border-orange-900/50', dot: 'bg-orange-500', label: 'High Priority' },
  critical: { badge: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200/60 dark:border-red-900/50 animate-pulse', dot: 'bg-red-600', label: 'Critical Hazard' }
};

const STATUS_DETAILS: Record<IssueStatus, { label: string; bg: string; text: string; step: number }> = {
  reported: { label: 'Reported', bg: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50', text: 'text-rose-700 dark:text-rose-400', step: 1 },
  verified: { label: 'Community Verified', bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50', text: 'text-amber-700 dark:text-amber-450', step: 2 },
  in_progress: { label: 'Crew Dispatched', bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50', text: 'text-blue-700 dark:text-blue-400', step: 3 },
  resolved: { label: 'Resolved & Closed', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50', text: 'text-emerald-700 dark:text-emerald-400', step: 4 }
};

// Relative time calculation
function getRelativeTime(timestamp: string): string {
  try {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    
    if (isNaN(diffMs) || diffMs < 0) return 'Just now';
    
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return past.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export default function CommunityFeed({ issues, onVote, onSelectIssue }: CommunityFeedProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  
  // Search state
  const searchParamQuery = searchParams.get('search') || '';
  const [inputValue, setInputValue] = useState(searchParamQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<'recent' | 'popular'>('recent');

  // Infinite Scroll States
  const [visibleCount, setVisibleCount] = useState(4);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 850);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setInputValue(searchParamQuery);
  }, [searchParamQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ search: inputValue });
    setVisibleCount(4); // reset infinite scroll limit on new query
  };

  // Filter issues
  const filteredIssues = issues.filter(issue => {
    const matchesSearch = 
      issue.title.toLowerCase().includes(inputValue.toLowerCase()) ||
      issue.description.toLowerCase().includes(inputValue.toLowerCase()) ||
      issue.locationName.toLowerCase().includes(inputValue.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || issue.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || issue.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Sort issues
  const sortedIssues = [...filteredIssues].sort((a, b) => {
    if (selectedSort === 'popular') {
      return b.upvotes - a.upvotes;
    }
    return new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
  });

  // Infinite Scroll simulation on scroll sensor intersection
  useEffect(() => {
    if (isLoading || sortedIssues.length <= visibleCount) return;

    const observer = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting && !isFetchingMore) {
        setIsFetchingMore(true);
        setTimeout(() => {
          setVisibleCount(prev => prev + 4);
          setIsFetchingMore(false);
        }, 900); // Shimmer skeleton load delay
      }
    }, { threshold: 0.1 });

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [visibleCount, sortedIssues.length, isFetchingMore, isLoading]);

  const displayedIssues = sortedIssues.slice(0, visibleCount);

  if (isLoading) {
    return <CommunityFeedSkeleton />;
  }

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left bg-slate-50/50 dark:bg-neutral-950/20"
    >
      <div className="space-y-8">
        
        {/* Top Aesthetic Header Card */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-200/60 dark:border-neutral-800/80">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                <Activity className="w-4.5 h-4.5" />
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                Active Citizen Action Logs
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-sans font-medium tracking-tight text-neutral-900 dark:text-neutral-150">
              Community Repair Feed
            </h1>
            <p className="text-xs text-neutral-500 max-w-2xl">
              Monitor active repair tickers, vote to prioritize municipal dispatches, and peer-verify neighborhood repairs in real time.
            </p>
          </div>

          {/* Quick stats mini ribbon */}
          <div className="flex items-center gap-3 bg-white dark:bg-neutral-900/60 border border-neutral-200/70 dark:border-neutral-800 p-3 rounded-2xl shadow-3xs shrink-0 self-start md:self-center">
            <div className="px-3 border-r border-neutral-100 dark:border-neutral-800">
              <span className="block text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Active</span>
              <span className="text-sm font-extrabold text-neutral-800 dark:text-neutral-200">
                {issues.filter(i => i.status !== 'resolved').length}
              </span>
            </div>
            <div className="px-3 border-r border-neutral-100 dark:border-neutral-800">
              <span className="block text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Resolved</span>
              <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                {issues.filter(i => i.status === 'resolved').length}
              </span>
            </div>
            <div className="px-2">
              <span className="block text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Peers Online</span>
              <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>124</span>
              </span>
            </div>
          </div>
        </div>

        {/* Floating Custom Omnibar Filters */}
        <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur border border-neutral-200/80 dark:border-neutral-800/80 rounded-3xl p-5 space-y-4.5 shadow-md">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
            
            {/* Elegant Search Input */}
            <div className="md:col-span-8 relative flex items-center bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 rounded-2xl px-4 py-1.5 focus-within:ring-4 focus-within:ring-indigo-500/5 focus-within:border-indigo-500/85 transition-all">
              <Search className="w-4 h-4 text-neutral-400 shrink-0" />
              <input 
                type="text" 
                placeholder="Search descriptions, street corridors, neighborhoods..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full px-3 py-2.5 bg-transparent focus:outline-none text-xs text-neutral-700 dark:text-neutral-200 font-medium placeholder-neutral-450"
              />
              {inputValue && (
                <button 
                  type="button" 
                  onClick={() => { setInputValue(''); setSearchParams({}); setVisibleCount(4); }}
                  className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 font-bold px-2 py-1"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter Trigger button */}
            <button 
              type="submit"
              className="md:col-span-4 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-bold py-3.5 px-6 rounded-2xl cursor-pointer shadow transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Query Database</span>
            </button>
          </form>

          {/* Quick Select categories row & Sorters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-800/60">
            
            {/* Quick dropdown selects */}
            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* Category selector */}
              <div className="relative">
                <select 
                  value={selectedCategory} 
                  onChange={(e) => { setSelectedCategory(e.target.value); setVisibleCount(4); }}
                  className="appearance-none pl-3.5 pr-8 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 hover:bg-neutral-100 dark:hover:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none text-neutral-600 dark:text-neutral-300 font-bold cursor-pointer transition-colors"
                >
                  <option value="all">📁 Every Category</option>
                  <option value="pothole">🚧 Road Potholes</option>
                  <option value="garbage">🗑️ Waste & Litter</option>
                  <option value="water_leak">💧 Water Leaks</option>
                  <option value="broken_streetlight">💡 Streetlights</option>
                  <option value="graffiti">🎨 Graffiti</option>
                  <option value="tree_hazard">🌳 Tree Hazards</option>
                  <option value="general">📋 Other Hazards</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Status Selector */}
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => { setSelectedStatus(e.target.value); setVisibleCount(4); }}
                  className="appearance-none pl-3.5 pr-8 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 hover:bg-neutral-100 dark:hover:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none text-neutral-600 dark:text-neutral-300 font-bold cursor-pointer transition-colors"
                >
                  <option value="all">🛠️ Every Triage Status</option>
                  <option value="reported">🔴 Reported</option>
                  <option value="verified">🟡 Peer Verified</option>
                  <option value="in_progress">🔵 In Progress</option>
                  <option value="resolved">🟢 Resolved & Closed</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

            </div>

            {/* Sorter switches */}
            <div className="flex items-center gap-1.5 p-1 bg-neutral-100/70 dark:bg-neutral-950/60 rounded-xl border border-neutral-200/50 dark:border-neutral-850 self-start sm:self-center">
              <button 
                onClick={() => { setSelectedSort('recent'); setVisibleCount(4); }}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg cursor-pointer transition-all ${
                  selectedSort === 'recent' 
                    ? 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 shadow-sm' 
                    : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-350'
                }`}
              >
                Recent Updates
              </button>
              <button 
                onClick={() => { setSelectedSort('popular'); setVisibleCount(4); }}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg cursor-pointer transition-all ${
                  selectedSort === 'popular' 
                    ? 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 shadow-sm' 
                    : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-350'
                }`}
              >
                Popular (Upvotes)
              </button>
            </div>

          </div>
        </div>

        {/* FEED ACTIVITY LIST */}
        <div className="space-y-6">
          {displayedIssues.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {displayedIssues.map((issue, idx) => {
                const cat = CATEGORY_STYLES[issue.category] || CATEGORY_STYLES.general;
                const sev = SEVERITY_STYLES[issue.severity] || SEVERITY_STYLES.medium;
                const stat = STATUS_DETAILS[issue.status] || STATUS_DETAILS.reported;
                const isTrusted = issue.trustScore >= 80 || issue.verifications?.length > 0;

                return (
                  <motion.div 
                    key={issue.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300, delay: Math.min(idx * 0.05, 0.2) }}
                    className="bg-white dark:bg-neutral-900/60 backdrop-blur rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 overflow-hidden hover:border-neutral-350 dark:hover:border-neutral-750 shadow-xs hover:shadow-lg transition-all duration-350 flex flex-col justify-between group"
                  >
                    
                    {/* Upper Post Section */}
                    <div className="p-5 sm:p-6 space-y-4">
                      
                      {/* Post Author info & Header */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 text-left">
                          <div className={`w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-850 flex items-center justify-center font-extrabold text-xs border border-neutral-200 dark:border-neutral-800 ${cat.text}`}>
                            {cat.emoji}
                          </div>
                          <div>
                            <span className="block text-xs font-extrabold text-neutral-800 dark:text-neutral-250">
                              {issue.reportedBy || "Citizen Neighbor"}
                            </span>
                            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-semibold flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{getRelativeTime(issue.reportedAt)}</span>
                            </span>
                          </div>
                        </div>

                        {/* Status Stamp */}
                        <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border ${stat.bg} ${stat.text}`}>
                          {stat.label}
                        </span>
                      </div>

                      {/* Post Large Immersive Media Banner */}
                      <div className="w-full h-52 sm:h-60 rounded-2xl overflow-hidden relative border border-neutral-150 dark:border-neutral-850 bg-neutral-50 dark:bg-neutral-950 select-none group-hover:shadow-inner transition-shadow">
                        {issue.imageUrl ? (
                          <img 
                            src={issue.imageUrl} 
                            alt={issue.title} 
                            className="w-full h-full object-cover group-hover:scale-[1.035] transition-transform duration-500 ease-out"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          /* High-fidelity abstract gradient placeholder themed by category */
                          <div className={`w-full h-full bg-gradient-to-br ${cat.gradient} flex flex-col items-center justify-center p-6 text-center relative`}>
                            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
                            <div className={`w-14 h-14 rounded-full ${cat.iconBg} flex items-center justify-center text-3xl shadow-md mb-2 animate-bounce`} style={{ animationDuration: '4s' }}>
                              {cat.emoji}
                            </div>
                            <span className={`text-xs font-extrabold tracking-widest uppercase opacity-45`}>
                              {cat.label} Asset Log
                            </span>
                          </div>
                        )}

                        {/* Severity Badge overlay */}
                        <div className="absolute top-3 left-3 flex gap-1.5 items-center">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg border backdrop-blur-md ${sev.badge}`}>
                            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${sev.dot}`} />
                            {sev.label}
                          </span>
                        </div>

                        {/* Category Label Overlay */}
                        <div className="absolute bottom-3 right-3">
                          <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 bg-neutral-900/90 text-white rounded-full border border-neutral-800 shadow-lg">
                            {cat.label}
                          </span>
                        </div>
                      </div>

                      {/* Content block */}
                      <div className="space-y-2 text-left">
                        <h3 
                          onClick={() => {
                            onSelectIssue(issue);
                            navigate('/community-map');
                          }}
                          className="text-base font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors cursor-pointer leading-snug line-clamp-1"
                        >
                          {issue.title}
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed line-clamp-2">
                          {issue.description}
                        </p>
                      </div>

                      {/* Verification Badges / Trust score widget */}
                      <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-950/40 rounded-xl border border-neutral-150 dark:border-neutral-850/60">
                        <div className="flex items-center gap-2">
                          {isTrusted ? (
                            <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                              <ShieldCheck className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
                              <Info className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <div className="text-left">
                            <span className="block text-[10px] font-bold text-neutral-800 dark:text-neutral-300">
                              {isTrusted ? 'Community Verified' : 'Triage Assessment'}
                            </span>
                            <span className="block text-[9px] text-neutral-400 font-medium">
                              {issue.verifications?.length || 0} peer confirmation{(issue.verifications?.length !== 1) ? 's' : ''}
                            </span>
                          </div>
                        </div>

                        {/* Trust Score circular percentage block */}
                        <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold">
                          <span className="text-neutral-400">Trust Index:</span>
                          <span className={`px-2 py-0.5 rounded-md ${
                            issue.trustScore >= 80 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' :
                            issue.trustScore >= 50 ? 'bg-amber-100 text-amber-850 dark:bg-amber-950/40 dark:text-amber-300' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {issue.trustScore}%
                          </span>
                        </div>
                      </div>

                      {/* Location address bar */}
                      <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 dark:text-neutral-500 font-semibold pt-1">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate">{issue.locationName}</span>
                      </div>

                    </div>

                    {/* Interaction Footer Dock */}
                    <div className="px-5 py-4 bg-neutral-50/65 dark:bg-neutral-950/30 border-t border-neutral-100 dark:border-neutral-850 flex justify-between items-center text-xs">
                      
                      {/* Interactive upvote toggle */}
                      <button 
                        onClick={() => onVote(issue.id, 'up')}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border font-extrabold hover:scale-[1.025] cursor-pointer transition-all active:scale-[0.975] ${
                          issue.userVote === 'up'
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900 dark:text-indigo-300 shadow-sm'
                            : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4 shrink-0" />
                        <span>Upvote Prioritization</span>
                        <span className="font-mono text-[10px] opacity-60 bg-black/5 dark:bg-white/10 px-1.5 py-0.2 rounded">
                          {issue.upvotes}
                        </span>
                      </button>

                      {/* Comments counter & Inspect trigger */}
                      <div className="flex items-center gap-3 font-semibold text-neutral-500">
                        <span className="flex items-center gap-1.5 text-xs text-neutral-400 bg-neutral-100/60 dark:bg-neutral-900 px-2.5 py-1.5 rounded-lg border border-neutral-200/40 dark:border-neutral-800">
                          <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                          <span>{issue.comments?.length || 0}</span>
                        </span>
                        
                        <button
                          onClick={() => {
                            onSelectIssue(issue);
                            navigate('/community-map');
                          }}
                          className="bg-neutral-900 hover:bg-neutral-850 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 px-3 py-1.5 rounded-lg font-bold flex items-center gap-0.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                        >
                          <span>Inspect</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                    
                  </motion.div>
                );
              })}
            </div>
          ) : (
            /* No Results Empty State Card */
            <div className="bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 p-16 rounded-3xl text-center space-y-4 max-w-xl mx-auto shadow-sm">
              <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                <Search className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <p className="font-bold text-neutral-800 dark:text-neutral-200">No Active Incidents Found</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-normal">
                  No spot reports matched your search criteria. Try removing some filters or broaden your keyword scope.
                </p>
              </div>
              <button
                onClick={() => {
                  setInputValue('');
                  setSelectedCategory('all');
                  setSelectedStatus('all');
                  setSearchParams({});
                  setVisibleCount(4);
                }}
                className="mt-2 text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline bg-indigo-50 dark:bg-indigo-950/40 px-3.5 py-1.5 rounded-full"
              >
                Clear All Filter Conditions
              </button>
            </div>
          )}
        </div>

        {/* INFINITE SCROLL / SHIMMER LOAD SENSOR */}
        {sortedIssues.length > visibleCount && (
          <div ref={loaderRef} className="py-12 flex justify-center items-center w-full min-h-[140px]">
            <AnimatePresence mode="wait">
              {isFetchingMore ? (
                <motion.div 
                  key="shimmer-skeletons"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full text-left"
                >
                  {[1, 2].map(i => (
                    <div key={i} className="bg-white dark:bg-neutral-900/40 rounded-3xl border border-neutral-200 dark:border-neutral-850 p-6 space-y-4 animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
                        <div className="space-y-1">
                          <div className="h-3 w-28 bg-neutral-200 dark:bg-neutral-800 rounded" />
                          <div className="h-2 w-16 bg-neutral-150 dark:bg-neutral-850 rounded" />
                        </div>
                      </div>
                      <div className="w-full h-52 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
                      <div className="space-y-2">
                        <div className="h-4.5 w-2/3 bg-neutral-200 dark:bg-neutral-800 rounded" />
                        <div className="h-3.5 w-full bg-neutral-150 dark:bg-neutral-850 rounded" />
                      </div>
                      <div className="pt-4 border-t border-neutral-100 dark:border-neutral-850 flex justify-between">
                        <div className="h-9 w-32 bg-neutral-150 dark:bg-neutral-800 rounded-xl" />
                        <div className="h-9 w-20 bg-neutral-150 dark:bg-neutral-800 rounded-xl" />
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="trigger-button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center"
                >
                  <p className="text-[11px] text-neutral-400 font-extrabold uppercase tracking-widest animate-pulse">
                    ⚡ Scroll to fetch older city updates
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

      </div>
    </motion.div>
  );
}

function CommunityFeedSkeleton() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left animate-pulse" 
      id="community-feed-loading-skeleton"
    >
      <div className="space-y-8">
        
        {/* Top Header skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="space-y-2.5">
            <div className="h-4.5 w-36 bg-neutral-200 dark:bg-neutral-850 rounded" />
            <div className="h-8 w-64 bg-neutral-250 dark:bg-neutral-800 rounded-lg" />
            <div className="h-3.5 w-96 bg-neutral-150 dark:bg-neutral-855 rounded" />
          </div>
          <div className="h-14 w-60 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
        </div>

        {/* Search filter skeleton */}
        <div className="bg-white dark:bg-neutral-900/60 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-4 shadow-3xs">
          <div className="h-12 bg-neutral-150 dark:bg-neutral-850 rounded-2xl w-full" />
          <div className="flex justify-between items-center pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex gap-2">
              <div className="h-8 w-28 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-none" />
              <div className="h-8 w-28 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-none" />
            </div>
            <div className="h-7 w-40 bg-neutral-150 dark:bg-neutral-850 rounded-lg" />
          </div>
        </div>

        {/* Feed cards list skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {[1, 2].map(i => (
            <div key={i} className="bg-white dark:bg-neutral-900/40 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-neutral-200 dark:bg-neutral-855 rounded-full" />
                  <div className="space-y-1">
                    <div className="h-3 w-28 bg-neutral-250 dark:bg-neutral-800 rounded animate-none" />
                    <div className="h-2 w-16 bg-neutral-150 dark:bg-neutral-855 rounded animate-none" />
                  </div>
                </div>
                {/* Image placeholder */}
                <div className="w-full h-52 bg-neutral-200 dark:bg-neutral-805 rounded-2xl" />
                <div className="space-y-2">
                  <div className="h-5 w-2/3 bg-neutral-250 dark:bg-neutral-800 rounded animate-none" />
                  <div className="h-3.5 w-full bg-neutral-150 dark:bg-neutral-855 rounded" />
                  <div className="h-3.5 w-11/12 bg-neutral-150 dark:bg-neutral-855 rounded" />
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <div className="h-9 w-36 bg-neutral-150 dark:bg-neutral-805 rounded-xl animate-none" />
                <div className="flex gap-2">
                  <div className="h-5 w-8 bg-neutral-100 dark:bg-neutral-855 rounded animate-none" />
                  <div className="h-5 w-14 bg-neutral-150 dark:bg-neutral-800 rounded animate-none" />
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </motion.div>
  );
}
