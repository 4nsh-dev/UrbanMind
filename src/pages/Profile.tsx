import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { pageVariants } from '../utils/motion';
import { Achievement, Issue } from '../types';
import { 
  Award, 
  Shield, 
  CheckCircle2, 
  Flame, 
  Calendar, 
  MapPin, 
  Sparkles, 
  AlertCircle, 
  Clock, 
  MessageSquare, 
  Heart, 
  User, 
  ShieldCheck, 
  Droplet, 
  Zap, 
  Check, 
  ArrowUpRight, 
  ChevronRight,
  Activity,
  ThumbsUp,
  Award as PrizeIcon
} from 'lucide-react';

interface ProfileProps {
  userPoints: number;
  userName: string;
  userEmail: string;
  userRole: 'citizen' | 'official';
  achievements: Achievement[];
  issues?: Issue[];
}

export default function Profile({ 
  userPoints, 
  userName, 
  userEmail, 
  userRole, 
  achievements,
  issues = [] 
}: ProfileProps) {
  const navigate = useNavigate();

  // Get user level & thresholds
  const getLevelDetails = (xp: number) => {
    if (xp < 500) {
      return { 
        level: 1, 
        title: 'Civic Novice', 
        nextXp: 500, 
        prevXp: 0, 
        desc: 'Sensing local concerns and exploring municipal systems.',
        accent: 'from-blue-500 to-indigo-500',
        badgeBg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200'
      };
    }
    if (xp < 1000) {
      return { 
        level: 2, 
        title: 'Local Guardian', 
        nextXp: 1000, 
        prevXp: 500, 
        desc: 'Verifying community hazards and logging essential repairs.',
        accent: 'from-cyan-500 to-teal-500',
        badgeBg: 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200'
      };
    }
    if (xp < 2000) {
      return { 
        level: 3, 
        title: 'Neighborhood Sentinel', 
        nextXp: 2000, 
        prevXp: 1000, 
        desc: 'Prominent watchdog accelerating emergency and public works triage.',
        accent: 'from-indigo-600 to-purple-600',
        badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200'
      };
    }
    if (xp < 4000) {
      return { 
        level: 4, 
        title: 'Community Pillar', 
        nextXp: 4000, 
        prevXp: 2000, 
        desc: 'Indispensable leader steering high-consensus environmental resolutions.',
        accent: 'from-amber-500 to-orange-600',
        badgeBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200'
      };
    }
    return { 
      level: 5, 
      title: "Mayor's Counsel Sentinel", 
      nextXp: xp + 1500, 
      prevXp: 4000, 
      desc: 'Top-tier advisor validating city-wide infrastructural resilience.',
      accent: 'from-rose-500 via-indigo-600 to-purple-600',
      badgeBg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200'
    };
  };

  const currentLvl = getLevelDetails(userPoints);
  const xpInCurrentLvl = userPoints - currentLvl.prevXp;
  const xpNeededForLvl = currentLvl.nextXp - currentLvl.prevXp;
  const progressPercent = Math.min((xpInCurrentLvl / xpNeededForLvl) * 100, 100);

  // Filter user's dynamic contributions
  const reportedByMe = issues.filter(i => i.reportedBy === userName || i.reporterId === 'user-02');
  const peerVerifiedByMe = issues.filter(i => 
    i.verifications?.some(v => v.verifierName === userName || v.verifierId === 'user-02')
  );
  const commentedByMe = issues.filter(i => 
    i.comments?.some(c => c.author === userName)
  );

  // Compute Achievements stats
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  // Compile a narrative activity timeline combining real actions and historic baselines
  const buildActivityTimeline = () => {
    const timeline: {
      id: string;
      title: string;
      description: string;
      timestamp: string;
      icon: React.ReactNode;
      color: string;
      linkIssue?: Issue;
    }[] = [];

    // 1. Dynamic active reports from the user
    reportedByMe.forEach(issue => {
      timeline.push({
        id: `timeline-report-${issue.id}`,
        title: `Logged hazard report: "${issue.title}"`,
        description: `Filed as a ${issue.severity} priority under ${issue.category} at ${issue.locationName}.`,
        timestamp: issue.reportedAt,
        icon: <AlertCircle className="w-4 h-4 text-rose-600" />,
        color: 'bg-rose-100 dark:bg-rose-950 text-rose-600',
        linkIssue: issue
      });
    });

    // 2. Dynamic peer verifications
    peerVerifiedByMe.forEach(issue => {
      const myVerification = issue.verifications.find(v => v.verifierName === userName || v.verifierId === 'user-02');
      timeline.push({
        id: `timeline-verify-${issue.id}`,
        title: `Logged Peer Verification`,
        description: `Confirmed legitimacy for "${issue.title}" with evidence: "${myVerification?.evidence || 'Hazard verified at close proximity.'}"`,
        timestamp: myVerification?.createdAt || issue.reportedAt,
        icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
        color: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600',
        linkIssue: issue
      });
    });

    // 3. Dynamic comments contributed
    commentedByMe.forEach(issue => {
      const myComment = issue.comments.find(c => c.author === userName);
      timeline.push({
        id: `timeline-comment-${issue.id}`,
        title: `Contributed Resolution Advice`,
        description: `Posted details: "${myComment?.text || 'Coordination comment added.'}"`,
        timestamp: myComment?.timestamp || issue.reportedAt,
        icon: <MessageSquare className="w-4 h-4 text-indigo-600" />,
        color: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600',
        linkIssue: issue
      });
    });

    // 4. Achievement unlock entries
    achievements.forEach(ach => {
      if (ach.unlocked) {
        timeline.push({
          id: `timeline-ach-${ach.id}`,
          title: `Unlocked "${ach.title}" Achievement Badge`,
          description: ach.description,
          timestamp: '2026-06-25T10:00:00Z', // fixed baseline
          icon: <Award className="w-4 h-4 text-amber-600" />,
          color: 'bg-amber-100 dark:bg-amber-950 text-amber-600'
        });
      }
    });

    // 5. Hardcoded baseline join date
    timeline.push({
      id: 'timeline-joined',
      title: 'Joined Urban Mind Network',
      description: 'Profile registered as a verified San Francisco Resident Sentinel.',
      timestamp: '2026-06-01T08:00:00Z',
      icon: <Check className="w-4 h-4 text-neutral-600" />,
      color: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600'
    });

    // Sort timeline by date descending
    return timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const activityTimeline = buildActivityTimeline();

  // Helper to get category icons for personal contributions
  const getCategoryEmoji = (category: string) => {
    switch(category) {
      case 'pothole': return '🚧';
      case 'garbage': return '🗑️';
      case 'water_leak': return '💧';
      case 'broken_streetlight': return '💡';
      case 'graffiti': return '🎨';
      case 'tree_hazard': return '🌳';
      default: return '📋';
    }
  };

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left bg-slate-50/50 dark:bg-neutral-950/20"
    >
      
      {/* 1. HERO IDENTITY CARD */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-[32px] overflow-hidden shadow-sm relative">
        {/* Cover graphic */}
        <div className={`h-36 bg-gradient-to-r ${currentLvl.accent} relative overflow-hidden transition-all duration-500`}>
          <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(#FFF_1px,transparent_1px)] [background-size:20px_20px]" />
          <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-white/10 dark:bg-black/20 border border-white/20 rounded-full text-[10px] text-white font-extrabold tracking-widest uppercase backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
            <span>Consensus Verified Citizen</span>
          </div>
        </div>

        <div className="px-6 pb-8 relative flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-14 sm:-mt-16 text-center sm:text-left">
          {/* DiceBear Pixel-art Avatar */}
          <div className="relative group">
            <img 
              src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${userName}`} 
              alt="Citizen Avatar"
              className="w-28 h-28 rounded-2xl border-4 border-white dark:border-neutral-900 shadow-lg bg-indigo-50 dark:bg-neutral-800 select-none pointer-events-none transition-transform duration-350 hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white rounded-full p-1.5 shadow border-2 border-white dark:border-neutral-900">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
          </div>

          {/* Identity details */}
          <div className="flex-1 space-y-2.5 sm:mb-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-center sm:justify-start">
              <h1 className="text-2xl sm:text-3xl font-sans font-medium tracking-tight text-neutral-900 dark:text-neutral-50">
                {userName}
              </h1>
              <span className={`inline-flex self-center items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${currentLvl.badgeBg}`}>
                Level {currentLvl.level} • {currentLvl.title}
              </span>
            </div>

            <p className="text-xs text-neutral-450 dark:text-neutral-400 font-medium">
              {userEmail} • Authorized Citizen Dispatcher
            </p>

            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-x-5 gap-y-2 text-xs text-neutral-500 dark:text-neutral-400 font-semibold">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span>Active Since June 2026</span>
              </span>
              <span className="hidden sm:inline text-neutral-300 dark:text-neutral-750">•</span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span>San Francisco, CA</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. REPUTATION & IMPACT SCOREBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* REPUTATION CARD */}
        <div className="md:col-span-5 bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-[28px] p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                Reputation Capital
              </span>
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 px-2.5 py-1 rounded-md">
                {userPoints} XP
              </span>
            </div>

            <div className="space-y-2.5">
              <h2 className="text-xl font-sans font-medium text-neutral-900 dark:text-neutral-100">
                {currentLvl.title}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-450 leading-relaxed">
                {currentLvl.desc}
              </p>
            </div>

            {/* Level XP Progress meter */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-[11px] font-bold text-neutral-400 dark:text-neutral-500">
                <span>Level {currentLvl.level}</span>
                <span>Next rank: {currentLvl.nextXp} XP</span>
              </div>
              
              <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-3.5 p-0.5 border border-neutral-200/40 dark:border-neutral-750">
                <div 
                  className={`bg-gradient-to-r ${currentLvl.accent} h-2 rounded-full transition-all duration-1000`} 
                  style={{ width: `${progressPercent}%` }} 
                />
              </div>
              
              <div className="flex justify-between text-[10px] font-semibold text-neutral-400">
                <span>{userPoints - currentLvl.prevXp} XP earned in tier</span>
                <span>{currentLvl.nextXp - userPoints} XP remaining</span>
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-dashed border-neutral-150 dark:border-neutral-800 mt-5 text-[10.5px] text-neutral-450 dark:text-neutral-500 leading-relaxed flex gap-2">
            <Sparkles className="w-4.5 h-4.5 text-indigo-500 shrink-0 mt-0.5" />
            <span>
              Your trust score index is determined by verified peer consensus. Retain 100% verifier consistency for faster municipal dispatch priority.
            </span>
          </div>
        </div>

        {/* COMMUNITY IMPACT CARDS */}
        <div className="md:col-span-7 bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-[28px] p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
              My Real-World Community Impact
            </span>
            <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-900">
              Score: 98% Active Confidence
            </span>
          </div>

          {/* Bento-grid of Human Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Metric 1 */}
            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/40 flex gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Droplet className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] text-blue-500 dark:text-blue-400 font-extrabold uppercase tracking-wide">Water Resource Preservation</span>
                <span className="block text-base font-extrabold text-neutral-800 dark:text-neutral-100 mt-0.5">14,200 Gallons Saved</span>
                <span className="block text-[10px] text-neutral-450 mt-1">Pre-flagged and routed major clean water ruptures.</span>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/40 flex gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] text-amber-600 dark:text-amber-400 font-extrabold uppercase tracking-wide">Public Safety Hazard patches</span>
                <span className="block text-base font-extrabold text-neutral-800 dark:text-neutral-100 mt-0.5">3 Potholes Resolved</span>
                <span className="block text-[10px] text-neutral-450 mt-1">Validated asphalt reports expedited by road crews.</span>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/40 flex gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-wide">Validation Accuracy</span>
                <span className="block text-base font-extrabold text-neutral-800 dark:text-neutral-100 mt-0.5">12 Inspections Logged</span>
                <span className="block text-[10px] text-neutral-450 mt-1">Provided peer confirmation for neighbor reports.</span>
              </div>
            </div>

            {/* Metric 4 */}
            <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100/50 dark:border-purple-900/40 flex gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] text-purple-600 dark:text-purple-400 font-extrabold uppercase tracking-wide">Triage Time Saved</span>
                <span className="block text-base font-extrabold text-neutral-800 dark:text-neutral-100 mt-0.5">14 Hours Expedited</span>
                <span className="block text-[10px] text-neutral-450 mt-1">Pre-structured telemetry reduced manual triage queues.</span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* 3. DUAL SECTIONS: RECENT REPORTS / PERSONAL CONTRIBUTIONS & BADGES / TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: PERSONAL CONTRIBUTIONS & RECENT REPORTS */}
        <div className="lg:col-span-6 space-y-6">
          
          <div className="space-y-1">
            <h3 className="text-xs font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              My Active Contributions & Reports
            </h3>
            <p className="text-[11px] text-neutral-400">
              Live spot reports and active municipal repair order requests initiated or comment-supported by you.
            </p>
          </div>

          <div className="space-y-4">
            {reportedByMe.length > 0 ? (
              reportedByMe.map(issue => {
                const isResolved = issue.status === 'resolved';

                return (
                  <div 
                    key={issue.id}
                    className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl shadow-2xs hover:border-indigo-350 dark:hover:border-indigo-900 transition-all flex gap-4 text-left group"
                  >
                    {/* Compact Image or Categorized Fallback */}
                    <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-neutral-150 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 relative select-none">
                      {issue.imageUrl ? (
                        <img 
                          src={issue.imageUrl} 
                          alt="" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          {getCategoryEmoji(issue.category)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 truncate">
                            {issue.category}
                          </span>
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${
                            issue.status === 'resolved' ? 'bg-emerald-55 border border-emerald-100 text-emerald-600' :
                            issue.status === 'in_progress' ? 'bg-blue-55 border border-blue-100 text-blue-600' :
                            'bg-rose-55 border border-rose-100 text-rose-600'
                          }`}>
                            {issue.status.replace('_', ' ')}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-150 truncate mt-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {issue.title}
                        </h4>
                        
                        <p className="text-[10px] text-neutral-400 truncate flex items-center gap-1 mt-0.5 font-medium">
                          <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                          <span>{issue.locationName}</span>
                        </p>
                      </div>

                      {/* Inspect details */}
                      <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800/60 mt-1">
                        <span className="text-[9px] font-bold text-neutral-400 font-mono">
                          {issue.upvotes} prioritization upvotes
                        </span>
                        
                        <button
                          onClick={() => {
                            navigate('/community-map');
                          }}
                          className="text-[10px] font-extrabold text-indigo-600 hover:text-indigo-850 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-0.5 transition-colors cursor-pointer"
                        >
                          <span>Inspect on Map</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              /* High-fidelity prompt if they haven't submitted anything yet */
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 p-8 rounded-2xl text-center space-y-3.5">
                <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-neutral-850 dark:text-neutral-200">No Spot Reports Logged</p>
                  <p className="text-[10px] text-neutral-400 leading-normal max-w-sm mx-auto">
                    You haven't initiated any road hazard tickers yet. Help clean up municipal corridors by flagging a pothole or ruptured pipe near you!
                  </p>
                </div>
                <button
                  onClick={() => navigate('/report-issue')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-5 rounded-full cursor-pointer shadow active:scale-95 transition-all"
                >
                  File First Community Report
                </button>
              </div>
            )}
          </div>

          {/* ACCOMPANYING PEER-VERIFIED LIST */}
          {peerVerifiedByMe.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                Peer Inspections Underwritten by me ({peerVerifiedByMe.length})
              </h4>
              <div className="space-y-2">
                {peerVerifiedByMe.map(issue => (
                  <div 
                    key={`verified-${issue.id}`}
                    onClick={() => navigate('/community-map')}
                    className="p-3 bg-neutral-50 hover:bg-indigo-50/40 dark:bg-neutral-950/40 dark:hover:bg-indigo-950/20 border border-neutral-200/50 dark:border-neutral-850/60 rounded-xl flex items-center justify-between gap-3 text-left transition-all cursor-pointer"
                  >
                    <div className="min-w-0">
                      <h5 className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 truncate">
                        {issue.title}
                      </h5>
                      <span className="text-[9px] text-neutral-400 font-medium">
                        Verified at Dolores Park corridor • Trust score escalated to {issue.trustScore}%
                      </span>
                    </div>
                    <span className="text-[9.5px] font-extrabold text-emerald-700 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.8 rounded-full flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verified</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: ACHIEVEMENTS & ACTIVITY TIMELINE */}
        <div className="lg:col-span-6 space-y-8">
          
          {/* BADGES SHELF */}
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-xs font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                Achievements & Honor Badges
              </h3>
              <p className="text-[11px] text-neutral-400">
                Unlock official state and community honors by coordinating with neighbor networks.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {achievements.map((ach) => {
                const unlocked = ach.unlocked;

                return (
                  <div 
                    key={ach.id}
                    className={`bg-white dark:bg-neutral-900 border rounded-2xl p-4 flex gap-3.5 shadow-2xs transition-all relative overflow-hidden text-left ${
                      unlocked 
                        ? 'border-neutral-200 dark:border-neutral-800 hover:border-indigo-400 dark:hover:border-indigo-900' 
                        : 'border-neutral-200/40 dark:border-neutral-850/60 opacity-55'
                    }`}
                  >
                    {/* Emoji icon badge */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border text-base select-none ${
                      unlocked 
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-150 dark:border-indigo-900 text-indigo-700' 
                        : 'bg-neutral-100 dark:bg-neutral-850 border-neutral-200 dark:border-neutral-800 text-neutral-400'
                    }`}>
                      {ach.icon === 'Radio' ? '📡' : 
                       ach.icon === 'ShieldCheck' ? '🛡️' : 
                       ach.icon === 'Activity' ? '⚡' : 
                       ach.icon === 'Award' ? '🏅' : '💧'}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <h4 className={`text-xs font-bold truncate ${unlocked ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-400'}`}>
                        {ach.title}
                      </h4>
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-450 leading-relaxed line-clamp-2">
                        {ach.description}
                      </p>

                      {/* Mini progress tracker */}
                      <div className="pt-2 flex items-center gap-1.5">
                        <div className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-full h-1">
                          <div 
                            className="bg-indigo-600 dark:bg-indigo-500 h-1 rounded-full transition-all duration-700" 
                            style={{ width: `${(ach.progress / ach.maxProgress) * 100}%` }} 
                          />
                        </div>
                        <span className="text-[8.5px] font-bold font-mono text-neutral-400">
                          {ach.progress}/{ach.maxProgress}
                        </span>
                      </div>
                    </div>

                    {/* Ribbon */}
                    {unlocked && (
                      <div className="absolute top-2 right-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-150 dark:border-emerald-900 text-[7px] px-1.5 py-0.2 rounded-full font-black uppercase scale-90">
                        Unlocked
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ACTIVITY TIMELINE */}
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-xs font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                My Activity Timeline
              </h3>
              <p className="text-[11px] text-neutral-400">
                Audited sequence of environmental sentinel activities logged under your consensus key.
              </p>
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 p-6 rounded-3xl shadow-3xs relative">
              
              {/* Vertical timeline connector track line */}
              <div className="absolute left-10.5 top-8 bottom-8 w-0.5 bg-neutral-100 dark:bg-neutral-800" />

              <div className="space-y-7 relative">
                {activityTimeline.map((item, idx) => (
                  <div key={item.id} className="flex gap-4 items-start text-left relative group">
                    
                    {/* Left Icon Dot */}
                    <div className={`w-9.5 h-9.5 rounded-full flex items-center justify-center shrink-0 border-2 border-white dark:border-neutral-900 shadow-sm transition-transform duration-300 group-hover:scale-105 ${item.color} z-10`}>
                      {item.icon}
                    </div>

                    {/* Right Content */}
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                        <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {item.title}
                        </h4>
                        <span className="text-[9.5px] text-neutral-400 font-bold shrink-0">
                          {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-450 leading-relaxed">
                        {item.description}
                      </p>

                      {/* Quick contextual action link */}
                      {item.linkIssue && (
                        <div className="pt-1">
                          <button
                            onClick={() => {
                              navigate('/community-map');
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-extrabold text-indigo-600 hover:text-indigo-850 dark:text-indigo-400 dark:hover:text-indigo-300 bg-indigo-50/50 hover:bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg border border-indigo-100/40 dark:border-indigo-900/40 cursor-pointer"
                          >
                            <span>Inspect Repair Order</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>

      </div>

    </motion.div>
  );
}
