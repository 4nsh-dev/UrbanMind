import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Plus, 
  MapPin, 
  TrendingUp, 
  Flame, 
  CheckCircle2, 
  Award,
  Zap,
  ChevronRight,
  ChevronDown,
  Activity,
  Search,
  ArrowUpRight,
  Filter,
  Calendar,
  Target,
  Users,
  ShieldCheck,
  Cpu,
  Info
} from 'lucide-react';
import { Issue, IssueCategory } from '../types';
import { LEADERBOARD_USERS } from '../data';
import { motion, AnimatePresence } from 'motion/react';
import { pageVariants } from '../utils/motion';
import InteractiveMap from '../components/InteractiveMap';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

interface DashboardProps {
  stats: {
    reported: number;
    resolved: number;
    volunteers: number;
    impactScore: number;
  };
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
  userPoints: number;
  userName: string;
}

const LAST_30_DAYS_TRENDS = [
  { day: 'Day 1', impactScore: 88, timeToFix: 4.8 },
  { day: 'Day 2', impactScore: 88, timeToFix: 4.7 },
  { day: 'Day 3', impactScore: 89, timeToFix: 4.5 },
  { day: 'Day 4', impactScore: 89, timeToFix: 4.6 },
  { day: 'Day 5', impactScore: 89, timeToFix: 4.4 },
  { day: 'Day 6', impactScore: 90, timeToFix: 4.2 },
  { day: 'Day 7', impactScore: 90, timeToFix: 4.1 },
  { day: 'Day 8', impactScore: 90, timeToFix: 3.9 },
  { day: 'Day 9', impactScore: 91, timeToFix: 3.8 },
  { day: 'Day 10', impactScore: 91, timeToFix: 3.9 },
  { day: 'Day 11', impactScore: 90, timeToFix: 4.2 },
  { day: 'Day 12', impactScore: 91, timeToFix: 3.8 },
  { day: 'Day 13', impactScore: 92, timeToFix: 3.6 },
  { day: 'Day 14', impactScore: 92, timeToFix: 3.5 },
  { day: 'Day 15', impactScore: 92, timeToFix: 3.3 },
  { day: 'Day 16', impactScore: 91, timeToFix: 3.6 },
  { day: 'Day 17', impactScore: 91, timeToFix: 3.4 },
  { day: 'Day 18', impactScore: 92, timeToFix: 3.2 },
  { day: 'Day 19', impactScore: 93, timeToFix: 3.0 },
  { day: 'Day 20', impactScore: 93, timeToFix: 2.9 },
  { day: 'Day 21', impactScore: 92, timeToFix: 3.1 },
  { day: 'Day 22', impactScore: 93, timeToFix: 2.8 },
  { day: 'Day 23', impactScore: 93, timeToFix: 2.7 },
  { day: 'Day 24', impactScore: 94, timeToFix: 2.6 },
  { day: 'Day 25', impactScore: 94, timeToFix: 2.5 },
  { day: 'Day 26', impactScore: 93, timeToFix: 2.8 },
  { day: 'Day 27', impactScore: 94, timeToFix: 2.4 },
  { day: 'Day 28', impactScore: 94, timeToFix: 2.3 },
  { day: 'Day 29', impactScore: 94, timeToFix: 2.1 },
  { day: 'Day 30', impactScore: 95, timeToFix: 1.8 }
];

export default function Dashboard({ stats, issues, onSelectIssue, userPoints, userName }: DashboardProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(issues[0] || null);
  const [pickingMode, setPickingMode] = useState(false);
  const [showPublicLighting, setShowPublicLighting] = useState(false);
  const [showTrashZones, setShowTrashZones] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | IssueCategory>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/community-feed?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Sort and inject current user into leaderboard list
  const currentUserObj = {
    id: 'user-current',
    name: userName,
    reputation: userPoints,
    reportsCount: issues.filter(i => i.reportedBy === userName).length || 4,
    verifiedCount: 12,
    avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=active',
    rank: 0,
  };

  const sortedLeaderboard = [...LEADERBOARD_USERS, currentUserObj]
    .sort((a, b) => b.reputation - a.reputation)
    .map((usr, index) => ({
      ...usr,
      rank: index + 1
    }));

  // Filter lists for Nearby/Critical and Recent Reports
  const activeCriticalIssues = issues
    .filter(i => i.status !== 'resolved' && (i.severity === 'critical' || i.severity === 'high'))
    .slice(0, 3);

  const recentReports = [...issues]
    .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime())
    .slice(0, 4);

  // Health Score Calculation based on real metrics
  const totalReportsCount = issues.length;
  const resolvedCount = issues.filter(i => i.status === 'resolved').length;
  const healthPercent = totalReportsCount > 0 
    ? Math.round((resolvedCount / totalReportsCount) * 100) 
    : 85;

  // Personal Achievements Calculations
  const userLevel = Math.floor(userPoints / 1000) + 1;
  const currentLevelXP = Math.floor(userPoints / 1000) * 1000;
  const progressPercent = Math.min(100, Math.max(0, ((userPoints % 1000) / 1000) * 100));
  const xpNeeded = 1000 - (userPoints % 1000);

  // Dynamic Badges based on active states
  const badges = [
    { id: 'first_report', name: 'Dolores Pioneer', icon: '📍', unlocked: true, desc: 'First report created' },
    { id: 'high_xp', name: 'Civic Leader', icon: '👑', unlocked: userPoints >= 1500, desc: 'Achieve 1,500 XP' },
    { id: 'validator', name: 'Top Verifier', icon: '🔍', unlocked: true, desc: '12 successful hazard validations' },
  ];

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-20 font-sans antialiased text-left text-neutral-900 dark:text-neutral-100 selection:bg-blue-100 dark:selection:bg-blue-900/30 selection:text-blue-600"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        
        {/* Row 1: Greeting & Minimal Search Hero */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-2 border-b border-neutral-200 dark:border-neutral-800">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Dolores Park District
              </p>
              <span className="text-[10px] text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full font-mono">
                Active Session
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              Welcome back, {userName}
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Your real-time operations console for neighborhood infrastructure, safety, and community consensus.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Minimal Search Bar inside Hero */}
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-neutral-400" />
              </span>
              <input
                type="text"
                placeholder="Search issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-800 rounded-full py-2 pl-9 pr-4 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none text-neutral-800 dark:text-neutral-100 shadow-xs"
              />
            </form>

            <button 
              onClick={() => navigate('/report-issue')}
              className="w-full sm:w-auto bg-[#0B57D0] hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Report Spot Hazard</span>
            </button>
          </div>
        </div>

        {/* Row 2: Today's Summary & Personal Achievements (Merged, highly focused cards with whitespace) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* TODAY'S DISTRICT SUMMARY (Merged KPI & Health score card) */}
          <section className="lg:col-span-7 bg-white dark:bg-neutral-900 border border-neutral-200/75 dark:border-neutral-800 rounded-3xl p-8 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-neutral-400 dark:text-neutral-550 uppercase tracking-wider block">District Outlook</span>
                  <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <span>Today's Summary</span>
                  </h2>
                </div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full font-medium">
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>

              {/* Progress Summary Section */}
              <div className="flex flex-col sm:flex-row items-center gap-8 py-2">
                {/* Radial Health score */}
                <div className="relative w-28 h-28 flex items-center justify-center shrink-0 bg-neutral-50 dark:bg-neutral-950 rounded-full border border-neutral-100 dark:border-neutral-850 p-2 shadow-xs">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle 
                      cx="56" 
                      cy="56" 
                      r="46" 
                      className="stroke-neutral-100 dark:stroke-neutral-800 fill-none" 
                      strokeWidth="8"
                    />
                    <circle 
                      cx="56" 
                      cy="56" 
                      r="46" 
                      className="stroke-[#0B57D0] dark:stroke-blue-400 fill-none transition-all duration-700" 
                      strokeWidth="8"
                      strokeDasharray={289}
                      strokeDashoffset={289 - (289 * healthPercent) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-black text-neutral-900 dark:text-white tracking-tighter">{healthPercent}%</span>
                    <span className="text-[9px] font-bold text-blue-600 dark:text-blue-300 uppercase tracking-wider">Health</span>
                  </div>
                </div>

                <div className="space-y-3 text-center sm:text-left flex-1">
                  <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                    Dolores Park is operating at <strong className="text-neutral-800 dark:text-neutral-200 font-semibold">{healthPercent}% operational safety</strong> today. Out of <strong className="text-neutral-850 dark:text-neutral-150 font-semibold">{totalReportsCount}</strong> reported hazards, <strong className="text-neutral-850 dark:text-neutral-150 font-semibold">{resolvedCount}</strong> have been fully resolved.
                  </p>
                  
                  {/* Micro stats dashboard inside summary */}
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="bg-neutral-50 dark:bg-neutral-950 rounded-2xl p-3 border border-neutral-200/50 dark:border-neutral-800 text-center">
                      <span className="text-[9px] uppercase font-bold text-neutral-400 dark:text-neutral-500 block">Guardians</span>
                      <span className="text-sm font-extrabold text-neutral-900 dark:text-white mt-0.5 block">{stats.volunteers}</span>
                    </div>
                    <div className="bg-neutral-50 dark:bg-neutral-950 rounded-2xl p-3 border border-neutral-200/50 dark:border-neutral-800 text-center">
                      <span className="text-[9px] uppercase font-bold text-neutral-400 dark:text-neutral-500 block">Efficiency</span>
                      <span className="text-sm font-extrabold text-neutral-900 dark:text-white mt-0.5 block">{stats.impactScore}/100</span>
                    </div>
                    <div className="bg-neutral-50 dark:bg-neutral-950 rounded-2xl p-3 border border-neutral-200/50 dark:border-neutral-800 text-center">
                      <span className="text-[9px] uppercase font-bold text-neutral-400 dark:text-neutral-500 block">Unresolved</span>
                      <span className="text-sm font-extrabold text-amber-600 dark:text-amber-450 mt-0.5 block">{totalReportsCount - resolvedCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Verified by real-time community consensus</span>
              </span>
              <button 
                onClick={() => navigate('/health-score')}
                className="text-[#0B57D0] dark:text-blue-300 hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
              >
                <span>Full Audit</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </section>

          {/* PERSONAL ACHIEVEMENTS (Refined user level, streak, & badges card) */}
          <section className="lg:col-span-5 bg-white dark:bg-neutral-900 border border-neutral-200/75 dark:border-neutral-800 rounded-3xl p-8 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-neutral-400 dark:text-neutral-550 uppercase tracking-wider block">Your Accomplishments</span>
                  <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    <span>Personal Achievements</span>
                  </h2>
                </div>
                <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-450 px-2.5 py-1 rounded-full text-xs font-extrabold font-mono border border-amber-100 dark:border-amber-900/50">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  <span>{userPoints} XP</span>
                </div>
              </div>

              {/* Progress & Tier Gauge */}
              <div className="space-y-2 bg-neutral-50 dark:bg-neutral-950 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-850">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block">Current Rank</span>
                    <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Level {userLevel} Civic Guardian</span>
                  </div>
                  <span className="text-[10px] font-semibold text-neutral-500 font-mono">{userPoints % 1000} / 1000 XP</span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-amber-400 to-amber-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${progressPercent}%` }} 
                  />
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  You are <strong className="text-neutral-700 dark:text-neutral-350">{xpNeeded} XP</strong> away from Level {userLevel + 1} ranks!
                </p>
              </div>

              {/* Achievements Badges list */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block">Earned Badges</span>
                <div className="grid grid-cols-3 gap-2">
                  {badges.map((badge) => (
                    <div 
                      key={badge.id}
                      title={badge.desc}
                      className={`p-2.5 rounded-xl border text-center transition-all duration-200 flex flex-col items-center justify-center gap-1 ${
                        badge.unlocked 
                          ? 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 shadow-xs' 
                          : 'bg-neutral-100/50 dark:bg-neutral-900/40 border-dashed border-neutral-200 dark:border-neutral-850 opacity-40'
                      }`}
                    >
                      <span className="text-lg">{badge.icon}</span>
                      <span className="text-[10px] font-bold text-neutral-700 dark:text-neutral-350 truncate max-w-full">
                        {badge.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
              <button 
                onClick={() => navigate('/profile')}
                className="text-xs text-neutral-500 hover:text-neutral-850 dark:hover:text-neutral-200 font-bold flex items-center gap-0.5 cursor-pointer"
              >
                <span>View My Achievements</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </section>

        </div>

        {/* Dynamic Intelligence Forecast Alert Banner */}
        <div className="bg-gradient-to-r from-[#E8F0FE]/50 via-blue-50/25 to-transparent dark:from-blue-950/20 dark:via-neutral-900/30 dark:to-transparent border border-blue-100 dark:border-blue-900/40 rounded-2xl p-5 flex items-start gap-4 shadow-2xs">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-[#0B57D0] dark:text-blue-300 rounded-xl shrink-0">
            <Sparkles className="w-5 h-5 text-amber-500 fill-current animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0B57D0] dark:text-blue-300">
                AI Predictive Intelligence Bulletin
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            </div>
            <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-300 font-medium">
              Dolores Park model indicates near-term precipitation spikes will accelerate regional pavement erosion by <strong className="text-neutral-800 dark:text-neutral-100">2.4x</strong> over the next 10 days, heavily concentrating near <em className="text-[#0B57D0] dark:text-blue-300 not-italic font-semibold">El Camino Real</em>. Resolving potholes here awards 1.5x bonus validation reputation points.
            </p>
          </div>
        </div>

        {/* Row 3: Large GIS Interactive Map (Primary Centerpiece) */}
        <section className="bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 rounded-3xl p-6 shadow-xs hover:shadow-sm transition-all space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-neutral-150 dark:border-neutral-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-450 font-mono text-[9px] font-semibold uppercase tracking-wider">
                  Live GIS GRID
                </span>
                <h2 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Spatial Hazards & Logistics
                </h2>
              </div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight mt-1">
                Interactive Incidents Live Map
              </h3>
            </div>

            {/* Quick Filter Shortcuts on Map */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-neutral-400" />
                <span>Quick View:</span>
              </span>
              {['pothole', 'garbage', 'water_leak', 'broken_streetlight'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => navigate(`/community-map?category=${cat}`)}
                  className="text-[11px] bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-300 font-bold px-3 py-1.5 rounded-full cursor-pointer transition-colors"
                >
                  {cat.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive GIS Map Container */}
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-2xs">
            <InteractiveMap
              issues={issues}
              selectedIssue={selectedIssue}
              onSelectIssue={(issue) => {
                setSelectedIssue(issue);
                onSelectIssue(issue);
              }}
              pickingMode={pickingMode}
              setPickingMode={setPickingMode}
              showPublicLighting={showPublicLighting}
              setShowPublicLighting={setShowPublicLighting}
              showTrashZones={showTrashZones}
              setShowTrashZones={setShowTrashZones}
            />
          </div>
        </section>

        {/* Row 4: Nearby Urgencies & Recent Feed vs Live Community Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Column 1: Incidents & Feed (Nearby issues + Recent Reports Feed) */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* NEARBY & CRITICAL HAZARDS */}
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block">Priority Alerts</span>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
                    Urgent Nearby Hazards
                  </h3>
                </div>
                <span className="text-[10px] font-extrabold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 rounded-full px-3 py-1">
                  Needs Resident Verification
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activeCriticalIssues.map(issue => (
                  <div 
                    key={issue.id}
                    onClick={() => {
                      onSelectIssue(issue);
                      navigate('/community-map');
                    }}
                    className="bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-850 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-2xs hover:shadow-md cursor-pointer group transition-all duration-250 hover:-translate-y-0.5"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                          issue.severity === 'critical' ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                        }`}>
                          {issue.severity}
                        </span>
                        <span className="text-[10px] font-semibold text-neutral-500 font-mono">
                          {issue.trustScore}% Trust
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-[#0B57D0] dark:group-hover:text-blue-300 truncate transition-colors">
                        {issue.title}
                      </h4>
                      <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400 line-clamp-2">
                        {issue.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500">
                      <span className="flex items-center gap-1 truncate max-w-[110px]">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span className="truncate">{issue.locationName}</span>
                      </span>
                      <span className="font-bold text-neutral-700 dark:text-neutral-350 shrink-0">
                        {issue.upvotes} upvotes
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* RECENT REPORTS FEED */}
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block">Chronological Stream</span>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
                    Recent Neighborhood Reports
                  </h3>
                </div>
                <button
                  onClick={() => navigate('/community-feed')}
                  className="text-xs font-bold text-[#0B57D0] dark:text-blue-300 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>View All Reports</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 rounded-3xl overflow-hidden divide-y divide-neutral-150 dark:divide-neutral-800 shadow-2xs hover:shadow-xs transition-all">
                {recentReports.map(issue => (
                  <div 
                    key={issue.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50/50 dark:hover:bg-neutral-850/30 transition-all cursor-pointer text-left"
                    onClick={() => {
                      onSelectIssue(issue);
                      navigate('/community-map');
                    }}
                  >
                    <div className="flex gap-4 items-start">
                      <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 overflow-hidden shrink-0 border border-neutral-200 dark:border-neutral-700 relative">
                        {issue.imageUrl && !failedImages[issue.id] ? (
                          <img 
                            src={issue.imageUrl} 
                            referrerPolicy="no-referrer" 
                            alt="" 
                            className="w-full h-full object-cover" 
                            onError={() => setFailedImages(prev => ({ ...prev, [issue.id]: true }))}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg bg-blue-50 dark:bg-neutral-950 text-[#0B57D0] dark:text-blue-300 font-bold">
                            📍
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                            {issue.category.replace('_', ' ')}
                          </span>
                          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            issue.status === 'resolved' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' :
                            issue.status === 'in_progress' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400' :
                            'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                          }`}>
                            {issue.status.replace('_', ' ')}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white">{issue.title}</h4>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-450">
                          Reported by <strong className="text-neutral-700 dark:text-neutral-350 font-medium">{issue.reportedBy}</strong> • {new Date(issue.reportedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto shrink-0 pl-16 sm:pl-0">
                      <div className="text-right">
                        <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">{issue.upvotes} upvotes</p>
                        <p className="text-[10px] text-neutral-500">{issue.trustScore}% Trust consensus</p>
                      </div>
                      <span className="p-2 bg-neutral-50 hover:bg-blue-50 dark:bg-neutral-950 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-750 text-neutral-500 hover:text-blue-600 dark:hover:text-blue-300 rounded-lg transition-colors">
                        <ArrowUpRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Column 2: Live Community Activity (Leaderboard + Validation streams) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* LIVE COMMUNITY ACTIVITY (Leaderboard) */}
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block">Active Contributors</span>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
                    Community Activity
                  </h3>
                </div>
                <button
                  onClick={() => navigate('/leaderboard')}
                  className="text-xs font-bold text-[#0B57D0] dark:text-blue-300 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Scoreboard</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Leaderboard panel list */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 rounded-3xl overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800 shadow-2xs hover:shadow-xs transition-all">
                {sortedLeaderboard.slice(0, 5).map((usr) => {
                  const isSelf = usr.id === 'user-current';
                  return (
                    <div 
                      key={usr.id}
                      className={`p-4 flex items-center justify-between gap-3 transition-colors ${
                        isSelf ? 'bg-blue-50/20 dark:bg-blue-950/15 border-l-[3px] border-l-[#0B57D0]' : 'hover:bg-neutral-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-6 shrink-0 flex items-center justify-center font-mono text-xs font-bold text-neutral-500">
                          {usr.rank === 1 ? '🥇' : usr.rank === 2 ? '🥈' : usr.rank === 3 ? '🥉' : usr.rank}
                        </div>

                        <img 
                          src={usr.avatar} 
                          alt="" 
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 shrink-0 border border-neutral-200 dark:border-neutral-700"
                        />

                        <div className="min-w-0 text-left">
                          <p className={`text-xs font-extrabold truncate ${isSelf ? 'text-[#0B57D0] dark:text-blue-300' : 'text-neutral-800 dark:text-neutral-200'}`}>
                            {usr.name} {isSelf && <span className="text-[8px] bg-[#0B57D0] text-white font-extrabold px-1.5 py-0.2 rounded-full uppercase ml-1">You</span>}
                          </p>
                          <p className="text-[10px] text-neutral-500 font-medium font-mono">
                            {usr.reportsCount} spots • {usr.verifiedCount} audits
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1 text-xs font-bold text-neutral-800 dark:text-neutral-200 font-mono">
                        <span>{usr.reputation}</span>
                        <span className="text-[9px] text-neutral-400 font-semibold font-sans">XP</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* REAL-TIME LOG / CIVIC TIPS */}
            <section className="bg-gradient-to-br from-neutral-900 to-neutral-950 dark:from-neutral-900 dark:to-neutral-950 text-white rounded-3xl p-6 shadow-md relative overflow-hidden space-y-4">
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-8 -mb-8 pointer-events-none" />
              
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-[10px] uppercase tracking-wider">
                  <Target className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Next Milestones</span>
                </div>
                <h4 className="text-sm font-bold text-white">Earn the "District Vanguard" Medal</h4>
                <p className="text-xs leading-relaxed text-neutral-300">
                  Verify or upvote <strong className="text-white font-bold">3 nearby road spots</strong> in the next 48 hours to secure a 200 XP streak bonus!
                </p>
              </div>

              <div className="pt-2">
                <div className="w-full bg-neutral-800 rounded-full h-1">
                  <div className="bg-amber-400 h-1 rounded-full transition-all" style={{ width: '60%' }} />
                </div>
                <span className="text-[9px] text-neutral-400 font-semibold font-mono block mt-1.5 text-right">2/3 verified</span>
              </div>
            </section>
          </div>
        </div>

        {/* Row 5: Collapsible Historical Performance Charts (Progressive Information Hierarchy) */}
        <section className="border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden bg-white dark:bg-neutral-900 shadow-2xs">
          <button 
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="w-full flex items-center justify-between p-6 hover:bg-neutral-50 dark:hover:bg-neutral-850/30 transition-all text-left"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-[#0B57D0] dark:text-blue-300 uppercase tracking-wider block">
                Deep Dive Audit
              </span>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
                <span>Show Strategic Analytics & Fix-Time Trends</span>
              </h3>
            </div>
            <div className="p-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 rounded-full">
              <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${showAnalytics ? 'rotate-180' : 'rotate-0'}`} />
            </div>
          </button>

          <AnimatePresence initial={false}>
            {showAnalytics && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="border-t border-neutral-150 dark:border-neutral-800"
              >
                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 bg-neutral-50/50 dark:bg-neutral-950/20">
                  
                  {/* Chart A: Impact Score Trend */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-450 uppercase tracking-wide">30-Day Impact Metric</h4>
                        <h5 className="text-lg font-bold text-neutral-900 dark:text-white">Consensus Impact Trend</h5>
                      </div>
                      <span className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/50">
                        +7.9% growth
                      </span>
                    </div>

                    <div className="h-60 w-full bg-white dark:bg-neutral-900 p-4 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-3xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={LAST_30_DAYS_TRENDS}
                          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorImpact" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0B57D0" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="#0B57D0" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8EAED" className="opacity-40" />
                          <XAxis 
                            dataKey="day" 
                            stroke="#888888" 
                            fontSize={10} 
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => {
                              const dayNum = parseInt(value.replace('Day ', ''));
                              return dayNum % 5 === 0 || dayNum === 1 ? value : '';
                            }}
                          />
                          <YAxis 
                            domain={[80, 100]} 
                            stroke="#888888" 
                            fontSize={10} 
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#202124', 
                              borderRadius: '12px', 
                              color: '#ffffff',
                              border: 'none',
                              fontSize: '11px',
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="impactScore" 
                            stroke="#0B57D0" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorImpact)" 
                            name="Impact Score"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart B: Average Fix-Time */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-450 uppercase tracking-wide">Resolution Timelines</h4>
                        <h5 className="text-lg font-bold text-neutral-900 dark:text-white">Avg Resolution Fix-Time</h5>
                      </div>
                      <span className="bg-blue-50 dark:bg-blue-950 text-[#0B57D0] dark:text-blue-300 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-100 dark:border-blue-900/50">
                        62% Faster resolutions
                      </span>
                    </div>

                    <div className="h-60 w-full bg-white dark:bg-neutral-900 p-4 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-3xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={LAST_30_DAYS_TRENDS}
                          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8EAED" className="opacity-40" />
                          <XAxis 
                            dataKey="day" 
                            stroke="#888888" 
                            fontSize={10} 
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => {
                              const dayNum = parseInt(value.replace('Day ', ''));
                              return dayNum % 5 === 0 || dayNum === 1 ? value : '';
                            }}
                          />
                          <YAxis 
                            stroke="#888888" 
                            fontSize={10} 
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}d`}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#202124', 
                              borderRadius: '12px', 
                              color: '#ffffff',
                              border: 'none',
                              fontSize: '11px',
                            }}
                          />
                          <Bar 
                            dataKey="timeToFix" 
                            fill="#10B981" 
                            radius={[3, 3, 0, 0]}
                            name="Fix Time (Days)"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

      </div>
    </motion.div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-20 font-sans antialiased text-left" id="dashboard-loading-skeleton">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 animate-pulse">
        
        {/* Row 1 Skeleton: Greeting & Search */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-2 border-b border-neutral-200 dark:border-neutral-800">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-neutral-200 dark:bg-neutral-800" />
              <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
            </div>
            <div className="h-8 w-64 bg-neutral-300 dark:bg-neutral-800 rounded-lg" />
            <div className="h-4 w-5/6 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="h-10 w-full sm:w-48 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
            <div className="h-10 w-full sm:w-36 bg-neutral-300 dark:bg-neutral-800 rounded-full" />
          </div>
        </div>

        {/* Row 2 Skeleton: Summary and Progress cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 h-64 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl" />
          <div className="lg:col-span-5 h-64 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl" />
        </div>

        {/* Map Skeleton */}
        <div className="h-[440px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl" />

        {/* Feed Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 h-96 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl" />
          <div className="lg:col-span-4 h-96 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl" />
        </div>

      </div>
    </div>
  );
}
