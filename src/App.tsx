import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { pageVariants } from './utils/motion';
import { INITIAL_ISSUES, INITIAL_ACHIEVEMENTS, LEADERBOARD_USERS, INITIAL_STATS } from './data';
import { Issue, IssueStatus, IssueCategory, Comment, Achievement } from './types';
import { M3ThemeProvider, useTheme, MaterialIcon } from './components/M3Components';

// Import New Pages Structured Under Route Hubs
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ReportIssue from './pages/ReportIssue';
import CommunityMap from './pages/CommunityMap';
import CommunityFeed from './pages/CommunityFeed';
import Leaderboard from './pages/Leaderboard';
import AuthorityDashboard from './pages/AuthorityDashboard';
import AIAssistant from './pages/AIAssistant';
import Profile from './pages/Profile';
import HealthScore from './pages/HealthScore';
import DigitalTwin from './pages/DigitalTwin';
import PredictiveRiskEngine from './pages/PredictiveRiskEngine';
import Landing from './pages/Landing';
import About from './pages/About';

import logo from './assets/logo.svg';
import { 
  Compass, 
  Cpu,
  MapPin, 
  Award, 
  Bot, 
  Plus, 
  Activity, 
  Sparkles, 
  CheckCircle2, 
  LogOut,
  Info,
  Menu,
  X,
  Trophy,
  Users,
  Shield,
  FileText,
  User,
  ExternalLink,
  TrendingUp,
  Brain,
  Search,
  Laptop,
  Smartphone
} from 'lucide-react';

export function ThemeToggler() {
  return null;
}

export default function App() {
  return (
    <M3ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </M3ThemeProvider>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  const [appLoading, setAppLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setAppLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Authentication states
  const [user, setUser] = useState<{ name: string; email: string; role: 'citizen' | 'official' } | null>({
    name: 'Anshdeep Singh',
    email: 'anshdeeep.singh.2006@gmail.com',
    role: 'citizen'
  });

  // Global shared data states
  const [issues, setIssues] = useState<Issue[]>(INITIAL_ISSUES);
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  const [userPoints, setUserPoints] = useState<number>(1250); // XP rep score
  const [stats, setStats] = useState(INITIAL_STATS);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(INITIAL_ISSUES[0]);

  // Coordinates picked from map click state
  const [mapInputLat, setMapInputLat] = useState<number>(37.7599);
  const [mapInputLng, setMapInputLng] = useState<number>(-122.4269);
  const [mapInputLocationName, setMapInputLocationName] = useState<string>('Dolores Park Entrance');
  const [pickingMode, setPickingMode] = useState<boolean>(false);
  
  // Mobile responsive nav toggler
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  // Global search and member details state variables
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);

  // Responsive device modes & auto screen layout calculations
  const [deviceMode, setDeviceMode] = useState<'auto' | 'desktop' | 'mobile'>('auto');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = deviceMode === 'mobile' || (deviceMode === 'auto' && windowWidth < 1024);
  const isPhoneChassis = deviceMode === 'mobile' && windowWidth >= 1024;

  // Authentication actions
  const handleLogin = (name: string, email: string, role: 'citizen' | 'official') => {
    setUser({ name, email, role });
  };

  const handleLogout = () => {
    setUser(null);
    navigate('/login');
  };

  const handleSetRole = (role: 'citizen' | 'official') => {
    if (user) {
      setUser({ ...user, role });
    }
  };

  // Upvoting / verification peer-coordination handler
  const handleVote = (issueId: string, type: 'up' | 'down') => {
    setIssues(prevIssues => 
      prevIssues.map(issue => {
        if (issue.id !== issueId) return issue;
        
        let upAdd = 0;
        let downAdd = 0;
        let nextVote: 'up' | 'down' | undefined = type;

        if (issue.userVote === type) {
          if (type === 'up') upAdd = -1;
          else downAdd = -1;
          nextVote = undefined;
        } else {
          if (type === 'up') {
            upAdd = 1;
            if (issue.userVote === 'down') downAdd = -1;
          } else {
            downAdd = 1;
            if (issue.userVote === 'up') upAdd = -1;
          }
        }

        const nextUpvotes = issue.upvotes + upAdd;
        const nextStatus: IssueStatus = nextUpvotes >= 10 && issue.status === 'reported' ? 'verified' : issue.status;

        // Rep multiplier increment
        if (type === 'up' && nextVote === 'up') {
          setUserPoints(p => p + 25);
          if (nextStatus === 'verified' && issue.status === 'reported') {
            setStats(s => ({ ...s, impactScore: Math.min(s.impactScore + 1, 100) }));
          }
        }

        const historyUpdate = nextStatus !== issue.status ? [
          ...issue.history,
          {
            status: nextStatus,
            timestamp: new Date().toISOString(),
            note: 'Community upvote verification threshold exceeded (+10 verifications). Escalated.',
            updatedBy: 'Community Peer Validator'
          }
        ] : issue.history;

        const updatedIssue = {
          ...issue,
          upvotes: nextUpvotes,
          downvotes: issue.downvotes + downAdd,
          userVote: nextVote,
          status: nextStatus,
          history: historyUpdate
        };

        if (selectedIssue?.id === issueId) {
          setSelectedIssue(updatedIssue);
        }

        return updatedIssue;
      })
    );

    // Civic Validator progress update
    setAchievements(prev => 
      prev.map(ach => {
        if (ach.id === 'ach-2' && !ach.unlocked) {
          const nextVal = Math.min(ach.progress + 1, ach.maxProgress);
          return {
            ...ach,
            progress: nextVal,
            unlocked: nextVal === ach.maxProgress
          };
        }
        return ach;
      })
    );
  };

  // Community verification handler
  const handleVerifyIssue = (updatedIssue: Issue, earnedXP: number) => {
    setIssues(prevIssues =>
      prevIssues.map(issue => {
        if (issue.id !== updatedIssue.id) return issue;

        const isConfirm = updatedIssue.verifications[updatedIssue.verifications.length - 1]?.type === 'confirm';
        const nextStatus = updatedIssue.trustScore >= 80 && issue.status === 'reported' ? 'verified' as IssueStatus : issue.status;
        const updatedHistory = [
          ...issue.history,
          {
            status: nextStatus,
            timestamp: new Date().toISOString(),
            note: `Community verification logged: Citizen verified ${isConfirm ? 'presence of reported hazard' : 'disputed legitimacy'}. Current Trust Score: ${updatedIssue.trustScore}%.`,
            updatedBy: user?.name || 'Active Citizen'
          }
        ];

        return {
          ...updatedIssue,
          status: nextStatus,
          history: updatedHistory
        };
      })
    );

    // Sync selected issue
    setSelectedIssue(prev => {
      if (prev?.id === updatedIssue.id) {
        const isConfirm = updatedIssue.verifications[updatedIssue.verifications.length - 1]?.type === 'confirm';
        const nextStatus = updatedIssue.trustScore >= 80 && prev.status === 'reported' ? 'verified' as IssueStatus : prev.status;
        return {
          ...updatedIssue,
          status: nextStatus,
          history: [
            ...prev.history,
            {
              status: nextStatus,
              timestamp: new Date().toISOString(),
              note: `Community verification logged: Citizen verified ${isConfirm ? 'presence of reported hazard' : 'disputed legitimacy'}. Current Trust Score: ${updatedIssue.trustScore}%.`,
              updatedBy: user?.name || 'Active Citizen'
            }
          ]
        };
      }
      return prev;
    });

    // Reward user points
    setUserPoints(p => p + earnedXP);
  };

  // Add Comment handler
  const handleAddComment = (issueId: string, text: string) => {
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      author: user?.name || 'Active Hero',
      avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=active',
      text,
      timestamp: new Date().toISOString(),
      reputationScore: userPoints,
      badge: user?.role === 'official' ? 'Official Inspector' : 'Civic Explorer'
    };

    setIssues(prevIssues => 
      prevIssues.map(issue => {
        if (issue.id !== issueId) return issue;

        const updatedIssue = {
          ...issue,
          comments: [...issue.comments, newComment]
        };

        if (selectedIssue?.id === issueId) {
          setSelectedIssue(updatedIssue);
        }

        return updatedIssue;
      })
    );

    setUserPoints(p => p + 50);
  };

  // Update Status handler (for official actions)
  const handleUpdateStatus = (issueId: string, nextStatus: IssueStatus, note: string) => {
    setIssues(prevIssues => 
      prevIssues.map(issue => {
        if (issue.id !== issueId) return issue;

        const updatedIssue = {
          ...issue,
          status: nextStatus,
          history: [
            ...issue.history,
            {
              status: nextStatus,
              timestamp: new Date().toISOString(),
              note,
              updatedBy: user?.name || 'City Dispatch Authority'
            }
          ]
        };

        if (selectedIssue?.id === issueId) {
          setSelectedIssue(updatedIssue);
        }

        return updatedIssue;
      })
    );

    if (nextStatus === 'resolved') {
      setStats(prev => ({
        ...prev,
        resolved: prev.resolved + 1,
        impactScore: Math.min(prev.impactScore + 2, 100)
      }));
      setUserPoints(p => p + 150); // Big boost for resolution coordination
    }
  };

  // Success handler for newly filed issue
  const handleReportSuccess = (newIssue: Issue) => {
    setIssues(prev => [newIssue, ...prev]);
    setSelectedIssue(newIssue);
    setStats(prev => ({
      ...prev,
      reported: prev.reported + 1
    }));
    setUserPoints(p => p + 100);

    // Turn off report mode
    setPickingMode(false);

    // Unlock Play Achievements
    setAchievements(prev => 
      prev.map(ach => {
        if (ach.id === 'ach-1') {
          return { ...ach, unlocked: true, progress: 1 };
        }
        return ach;
      })
    );
  };

  const handleCoordinatePicked = (lat: number, lng: number, landmark: string) => {
    setMapInputLat(lat);
    setMapInputLng(lng);
    setMapInputLocationName(landmark);
    setPickingMode(false);
    navigate('/report-issue');
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-neutral-800">
      <AnimatePresence mode="wait">
        {appLoading && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center p-6 select-none"
          >
            <div className="flex flex-col items-center space-y-6 max-w-sm text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
                className="w-[120px] h-[120px] flex items-center justify-center"
              >
                <img 
                  src={logo} 
                  alt="Urban Mind Logo" 
                  className="w-full h-full object-contain filter drop-shadow-md"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
              
              <div className="space-y-1">
                <motion.h1 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl font-extrabold tracking-tight text-neutral-900"
                >
                  Urban Mind
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-[10px] text-neutral-500 font-bold tracking-wide uppercase"
                >
                  Civic Intelligence Network
                </motion.p>
              </div>

              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "120px" }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-indigo-500 rounded-full"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {!isAuthPage && user && (
        <header className="h-16 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 sm:px-6 flex items-center justify-between shrink-0 z-40 select-none shadow-xs">
          
          {/* Logo Brand Block */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Hamburger / Menu toggle button */}
            <button 
              onClick={() => {
                if (isMobile) {
                  setMobileMenuOpen(!mobileMenuOpen);
                } else {
                  setSidebarExpanded(!sidebarExpanded);
                }
              }}
              className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer shrink-0"
              aria-label="Toggle navigation drawer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link to="/dashboard" className="flex items-center gap-2 hover:scale-[1.02] transition-all select-none ml-1" aria-label="Urban Mind Dashboard Home">
              <img 
                src={logo} 
                alt="Urban Mind Logo" 
                className="h-8 w-auto object-contain shrink-0" 
                referrerPolicy="no-referrer"
                loading="lazy"
              />
              <div className="text-left hidden md:block">
                <h1 className="text-sm font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50 leading-none">
                  UrbanMind
                </h1>
                <p className="text-[9px] text-neutral-400 font-bold tracking-wider uppercase mt-1">Civic Platform</p>
              </div>
            </Link>
          </div>

          {/* Global Search Bar (Centered & Wide like Google Drive/Gmail) */}
          <div className="relative mx-4 flex-1 max-w-lg">
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-neutral-400 group-focus-within:text-[#0B57D0] dark:group-focus-within:text-[#D3E3FD] transition-colors" />
              </span>
              <input
                type="text"
                value={globalSearchQuery}
                onChange={(e) => {
                  setGlobalSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Search issues, members..."
                className="w-full bg-[#F1F3F4] dark:bg-neutral-800 hover:bg-[#E8EAED] dark:hover:bg-neutral-750 focus:bg-white dark:focus:bg-neutral-950 text-xs font-medium pl-10 pr-10 py-2.5 rounded-full outline-none transition-all placeholder:text-neutral-500 text-neutral-800 dark:text-neutral-100 focus:shadow-md focus:ring-1 focus:ring-neutral-250 dark:focus:ring-neutral-800"
              />
              {globalSearchQuery && (
                <button
                  onClick={() => setGlobalSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-750 dark:hover:text-neutral-200 text-xs font-semibold"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Live Search Dropdown */}
            {isSearchFocused && globalSearchQuery.trim() !== '' && (
              <>
                {/* Click outside backdrop */}
                <div 
                  className="fixed inset-0 z-40 cursor-default" 
                  onClick={() => setIsSearchFocused(false)}
                />
                
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl z-50 overflow-hidden max-h-[440px] flex flex-col animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                  <div className="p-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex justify-between items-center shrink-0">
                    <span className="text-[10px] font-extrabold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Search Results</span>
                    <button 
                      onClick={() => setIsSearchFocused(false)}
                      className="text-[10px] text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 font-bold"
                    >
                      Close
                    </button>
                  </div>
                  
                  <div className="overflow-y-auto flex-1 p-2 space-y-3.5">
                    
                    {/* ISSUES SECTION */}
                    <div>
                      <div className="px-2.5 py-1 text-[9px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider bg-indigo-50/45 dark:bg-indigo-950/25 rounded-md mb-1.5 flex items-center justify-between">
                        <span>Issues & Reports</span>
                        <span className="text-neutral-450 dark:text-neutral-500 font-mono text-[8px] font-normal">Title, Desc, Location</span>
                      </div>
                      {(() => {
                        const query = globalSearchQuery.toLowerCase();
                        const matches = issues.filter(issue => 
                          issue.title.toLowerCase().includes(query) ||
                          issue.description.toLowerCase().includes(query) ||
                          issue.locationName.toLowerCase().includes(query) ||
                          issue.category.toLowerCase().includes(query)
                        );
                        
                        if (matches.length === 0) {
                          return <div className="text-[11px] text-neutral-450 dark:text-neutral-500 italic px-2.5 py-1.5">No matching issues or locations found</div>;
                        }
                        
                        return (
                          <div className="space-y-1">
                            {matches.slice(0, 5).map(issue => (
                              <button
                                key={issue.id}
                                onClick={() => {
                                  setSelectedIssue(issue);
                                  setIsSearchFocused(false);
                                  setGlobalSearchQuery('');
                                  navigate('/community-map');
                                }}
                                className="w-full text-left p-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 active:bg-neutral-100 dark:active:bg-neutral-800 transition-all flex gap-2.5 group hover:translate-x-1"
                              >
                                <span className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-neutral-250 dark:border-neutral-700">
                                  <img src={issue.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center gap-1.5">
                                    <span className="truncate">{issue.title}</span>
                                    <span className={`text-[8px] px-1 py-0.2 rounded-sm shrink-0 uppercase font-mono font-bold ${
                                      issue.severity === 'critical' ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400' :
                                      issue.severity === 'high' ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                                    }`}>
                                      {issue.severity}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-neutral-550 dark:text-neutral-400 truncate flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                                    <span className="truncate">{issue.locationName}</span>
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        );
                      })()}
                    </div>

                    {/* COMMUNITY MEMBERS SECTION */}
                    <div>
                      <div className="px-2.5 py-1 text-[9px] font-extrabold text-emerald-700 dark:text-emerald-450 uppercase tracking-wider bg-emerald-50/45 dark:bg-emerald-950/25 rounded-md mb-1.5 flex items-center justify-between">
                        <span>Community Members</span>
                        <span className="text-neutral-450 dark:text-neutral-500 font-mono text-[8px] font-normal">Active contributors</span>
                      </div>
                      {(() => {
                        const query = globalSearchQuery.toLowerCase();
                        const matches = LEADERBOARD_USERS.filter(usr => 
                          usr.name.toLowerCase().includes(query)
                        );
                        
                        if (matches.length === 0) {
                          return <div className="text-[11px] text-neutral-450 dark:text-neutral-500 italic px-2.5 py-1.5">No community members found matching "{globalSearchQuery}"</div>;
                        }
                        
                        return (
                          <div className="space-y-1">
                            {matches.slice(0, 4).map(usr => (
                              <button
                                key={usr.id}
                                onClick={() => {
                                  setSelectedMember(usr);
                                  setIsSearchFocused(false);
                                  setGlobalSearchQuery('');
                                }}
                                className="w-full text-left p-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 active:bg-neutral-100 dark:active:bg-neutral-800 transition-all flex items-center justify-between gap-2.5 group hover:translate-x-1"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <img src={usr.avatar} alt="" className="w-8 h-8 rounded-full border border-neutral-250 dark:border-neutral-700" referrerPolicy="no-referrer" />
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 truncate">{usr.name}</p>
                                    <p className="text-[10px] text-neutral-500 dark:text-neutral-455 font-mono">Rank #{usr.rank} • Active Validator</p>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full font-mono">
                                    {usr.reputation} XP
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        );
                      })()}
                    </div>

                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Status / Settings / Profile Control Section */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link 
              to="/profile"
              className="bg-[#F1F3F4] dark:bg-neutral-800 hover:bg-[#E8EAED] dark:hover:bg-neutral-750 px-3 py-1.5 rounded-full flex items-center gap-2 select-none transition-all group"
            >
              <img 
                src="https://api.dicebear.com/7.x/pixel-art/svg?seed=active" 
                alt="User Avatar" 
                className="w-5 h-5 rounded-full object-cover shrink-0 border border-neutral-300 dark:border-neutral-700"
                referrerPolicy="no-referrer"
              />
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                <span className="hidden sm:inline">Level {Math.floor(userPoints / 1000) + 1}</span>
              </span>
              <span className="text-[10px] sm:text-xs font-extrabold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
                {userPoints} <span className="hidden xs:inline">XP</span>
              </span>
            </Link>
            
            <ThemeToggler />

            <button
              onClick={handleLogout}
              className="text-[#5F6368] dark:text-neutral-400 hover:text-[#202124] dark:hover:text-[#F1F3F4] p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
              title="Logout session"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

        </header>
      )}

      {/* Mobile Drawer Slide Navigation Overlay (Material Design 3 Navigation Drawer) */}
      <AnimatePresence>
        {!isAuthPage && user && mobileMenuOpen && (
          <div className="fixed inset-0 z-50 xl:hidden flex">
            {/* Backdrop Scrim */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Drawer Sheet */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-80 max-w-[85vw] h-full bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col p-4 shadow-2xl overflow-y-auto select-none"
            >
              {/* Drawer Header Brand Block */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <img 
                    src={logo} 
                    alt="Urban Mind Logo" 
                    className="h-8 w-auto object-contain" 
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <div>
                    <p className="text-sm font-extrabold text-neutral-900 dark:text-neutral-50 leading-none">Urban Mind</p>
                    <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider mt-1">Civic Platform</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition-colors cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Scrollable Navigation Links */}
              <div className="flex-1 flex flex-col gap-1.5 text-left text-xs font-bold">
                {[
                  { to: '/dashboard', label: 'Dashboard', icon: Compass, category: 'Explore' },
                  { to: '/community-feed', label: 'Reports Feed', icon: FileText, category: 'Explore', badge: issues.filter(i => i.status !== 'resolved').length.toString() },
                  { to: '/community-map', label: 'Tracking Map', icon: MapPin, category: 'Explore' },
                  
                  { to: '/health-score', label: 'Health Index', icon: Activity, category: 'Analysis' },
                  { to: '/risk-engine', label: 'Risk Engine', icon: TrendingUp, category: 'Analysis' },
                  { to: '/digital-twin', label: 'Digital Twin', icon: Cpu, category: 'Analysis' },
                  
                  { to: '/ai-assistant', label: 'AI Assistant', icon: Bot, category: 'Intelligence' },
                  { to: '/authority-dashboard', label: 'Ops Console', icon: Shield, category: 'Intelligence', adminOnly: true },
                  
                  { to: '/profile', label: 'My Profile', icon: User, category: 'Account' },
                  { to: '/about', label: 'About App', icon: Info, category: 'Account' }
                ].map((item, idx, arr) => {
                  if (item.adminOnly && user?.role !== 'official') return null;

                  const isActive = location.pathname === item.to || (item.to === '/dashboard' && location.pathname === '/');
                  const Icon = item.icon;
                  const showHeader = idx === 0 || arr[idx - 1].category !== item.category;

                  return (
                    <React.Fragment key={item.to}>
                      {showHeader && (
                        <p className="text-[10px] font-extrabold text-neutral-400 dark:text-neutral-500 px-3.5 pt-3.5 pb-1 uppercase tracking-wider">
                          {item.category}
                        </p>
                      )}
                      <Link 
                        to={item.to} 
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-4 py-3 rounded-full transition-all ${
                          isActive 
                            ? 'bg-[#E8F0FE] dark:bg-blue-950/40 text-[#0B57D0] dark:text-blue-300 shadow-xs' 
                            : 'text-neutral-600 dark:text-neutral-350 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-[#0B57D0] dark:text-blue-300' : 'text-neutral-400 dark:text-neutral-500'}`} />
                          <span className="text-xs font-semibold">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-[#0B57D0]/10 text-[#0B57D0] dark:text-blue-300' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'}`}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </React.Fragment>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reusable Routes and Layout Components for Dual Views */}
      {(() => {
        const routesArea = (
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              {/* Public Auth routes */}
              <Route path="/login" element={
                user ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />
              } />
              <Route path="/signup" element={
                user ? <Navigate to="/dashboard" replace /> : <Signup onLogin={handleLogin} />
              } />

            {/* Public Landing & Auth routes */}
            <Route path="/" element={
              <Landing issues={issues} stats={stats} />
            } />

            <Route path="/dashboard" element={
              user ? (
                <Dashboard 
                  stats={stats}
                  issues={issues}
                  onSelectIssue={setSelectedIssue}
                  userPoints={userPoints}
                  userName={user.name}
                />
              ) : <Navigate to="/login" replace />
            } />

            <Route path="/health-score" element={
              user ? (
                <HealthScore issues={issues} />
              ) : <Navigate to="/login" replace />
            } />

            <Route path="/digital-twin" element={
              user ? (
                <DigitalTwin issues={issues} />
              ) : <Navigate to="/login" replace />
            } />

            <Route path="/risk-engine" element={
              user ? (
                <PredictiveRiskEngine issues={issues} />
              ) : <Navigate to="/login" replace />
            } />

            <Route path="/community-map" element={
              user ? (
                <CommunityMap 
                  issues={issues}
                  selectedIssue={selectedIssue}
                  onSelectIssue={setSelectedIssue}
                  onVote={handleVote}
                  onAddComment={handleAddComment}
                  onUpdateStatus={handleUpdateStatus}
                  onVerifyIssue={handleVerifyIssue}
                  pickingMode={pickingMode}
                  setPickingMode={setPickingMode}
                  onCoordinatePicked={handleCoordinatePicked}
                />
              ) : <Navigate to="/login" replace />
            } />

            <Route path="/community-feed" element={
              user ? (
                <CommunityFeed 
                  issues={issues}
                  onVote={handleVote}
                  onSelectIssue={setSelectedIssue}
                />
              ) : <Navigate to="/login" replace />
            } />

            <Route path="/report-issue" element={
              user ? (
                <ReportIssue 
                  onSuccess={handleReportSuccess}
                  mapInputLat={mapInputLat}
                  mapInputLng={mapInputLng}
                  mapInputLocationName={mapInputLocationName}
                  setPickingMode={setPickingMode}
                />
              ) : <Navigate to="/login" replace />
            } />

            <Route path="/ai-assistant" element={
              user ? <AIAssistant issues={issues} user={user} /> : <Navigate to="/login" replace />
            } />

            <Route path="/leaderboard" element={
              user ? (
                <Leaderboard 
                  userPoints={userPoints}
                  userName={user.name}
                />
              ) : <Navigate to="/login" replace />
            } />

            <Route path="/authority-dashboard" element={
              user ? (
                <AuthorityDashboard 
                  issues={issues}
                  onUpdateStatus={handleUpdateStatus}
                  onSelectIssue={setSelectedIssue}
                  userRole={user.role}
                  onSetRole={handleSetRole}
                />
              ) : <Navigate to="/login" replace />
            } />

            <Route path="/profile" element={
              user ? (
                <Profile 
                  userPoints={userPoints}
                  userName={user.name}
                  userEmail={user.email}
                  userRole={user.role}
                  achievements={achievements}
                  issues={issues}
                />
              ) : <Navigate to="/login" replace />
            } />

            <Route path="/about" element={
              user ? <About /> : <Navigate to="/login" replace />
            } />

            {/* Catch-all Fallback redirection */}
            <Route path="*" element={
              user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
            } />
          </Routes>
          </AnimatePresence>
        );

        const getMobileTabBar = (isFixed: boolean) => {
          if (isFixed && !isMobile && !isScrolling) {
            return null;
          }

          return (
            <motion.div 
              key={isFixed ? "fixed-tabbar" : "inline-tabbar"}
              initial={isFixed ? { y: 60, opacity: 0 } : undefined}
              animate={isFixed ? { y: 0, opacity: 1 } : undefined}
              exit={isFixed ? { y: 60, opacity: 0 } : undefined}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`${
                isFixed 
                  ? 'fixed bottom-4 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[600px] bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md border border-neutral-200/50 dark:border-neutral-800/50 rounded-[1.5rem] shadow-[0_12px_40px_rgba(0,0,0,0.12)] z-45 px-6 py-2.5' 
                  : 'bg-white border-t border-neutral-200/80 px-2 py-1.5 shrink-0 z-40'
              } flex justify-around items-center select-none transition-all duration-300`}
            >
              {[
                { to: '/dashboard', label: 'Dashboard', icon: Compass },
                { to: '/community-map', label: 'Map', icon: MapPin },
                { to: '/report-issue', label: 'Report', icon: Plus, isFab: true },
                { to: '/ai-assistant', label: 'AI', icon: Bot },
                { to: '/community-feed', label: 'Feed', icon: FileText }
              ].map((tab) => {
                const isActive = location.pathname === tab.to;
                const Icon = tab.icon;
                
                if (tab.isFab) {
                  return (
                    <Link
                      key={tab.to}
                      to={tab.to}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setPickingMode(false);
                      }}
                      className={`relative ${isFixed ? '-top-6' : '-top-4'} w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100 border-4 border-white hover:scale-105 active:scale-95 transition-all`}
                      title="Report Issue"
                    >
                      <Icon className="w-5 h-5" />
                    </Link>
                  );
                }

                return (
                  <Link
                    key={tab.to}
                    to={tab.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
                      isActive ? 'text-[#0B57D0] dark:text-blue-400 font-bold' : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'scale-110 text-[#0B57D0] dark:text-blue-400' : 'text-neutral-400'}`} />
                    <span className="text-[10px] font-bold tracking-tight">{tab.label}</span>
                  </Link>
                );
              })}
            </motion.div>
          );
        };

        if (isPhoneChassis) {
          return (
            <div className="flex-1 bg-neutral-100 flex items-center justify-center p-4 sm:p-8 overflow-y-auto relative select-none">
              {/* Simulated physical smartphone device frame */}
              <div className="relative w-[385px] h-[800px] bg-white rounded-[50px] shadow-[0_30px_70px_rgba(0,0,0,0.85)] border-[10px] border-slate-950 flex flex-col overflow-hidden">
                {/* Dynamic Island Notch */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-950 rounded-full z-50 flex items-center justify-center" />
                
                {/* Phone Status Bar */}
                <div className="h-9 bg-white shrink-0 px-6 pt-3 flex justify-between items-center text-[10px] font-black text-neutral-800 z-40 select-none">
                  <span>9:41</span>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[8px] font-bold tracking-tight">LIVE MOCK</span>
                  </div>
                </div>

                {/* Screen main content area */}
                <main className="flex-1 overflow-y-auto relative bg-slate-50 flex flex-col">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={location.pathname}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                      className="w-full min-h-full flex flex-col"
                    >
                      {routesArea}
                    </motion.div>
                  </AnimatePresence>
                </main>

                {/* Simulated mobile bottom bar */}
                {!isAuthPage && user && getMobileTabBar(false)}

                {/* iPhone Home Bar indicator */}
                <div className="h-5 bg-white shrink-0 flex items-center justify-center">
                  <span className="w-28 h-1 bg-neutral-850 rounded-full" />
                </div>
              </div>
            </div>
          );
        }

        return (
          <div className="flex-1 flex min-h-0 overflow-hidden relative">
            {/* Desktop Left Navigation Drawer/Rail (Google/Material Design 3 Style) */}
            {!isAuthPage && user && !isMobile && (
              <motion.aside
                animate={{ 
                  width: sidebarExpanded ? (isScrolling ? 220 : 240) : (isScrolling ? 66 : 72),
                  scale: isScrolling ? 0.97 : 1.0,
                  x: isScrolling ? 4 : 0,
                  opacity: !sidebarExpanded ? (isScrolling ? 0.65 : 0.8) : 1.0
                }}
                whileHover={{ opacity: 1.0, scale: 1.0 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className={`my-3 ml-3 h-[calc(100vh-88px)] rounded-[2.5rem] border flex flex-col shrink-0 overflow-hidden select-none z-30 transition-all duration-300 ${
                  !sidebarExpanded 
                    ? 'bg-white/40 dark:bg-neutral-900/40 backdrop-blur-md border-neutral-200/50 dark:border-neutral-800/50 shadow-xs' 
                    : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-lg'
                }`}
              >
                <div className={`flex-1 overflow-y-auto py-4 px-3 flex flex-col transition-all duration-300 ${isScrolling ? 'gap-0.5' : 'gap-1'}`}>
                  {[
                    { to: '/dashboard', label: 'Dashboard', icon: Compass, category: 'Explore' },
                    { to: '/community-feed', label: 'Reports Feed', icon: FileText, category: 'Explore', badge: issues.filter(i => i.status !== 'resolved').length.toString() },
                    { to: '/community-map', label: 'Tracking Map', icon: MapPin, category: 'Explore' },
                    
                    { to: '/health-score', label: 'Health Index', icon: Activity, category: 'Analysis' },
                    { to: '/risk-engine', label: 'Risk Engine', icon: TrendingUp, category: 'Analysis' },
                    { to: '/digital-twin', label: 'Digital Twin', icon: Cpu, category: 'Analysis' },
                    
                    { to: '/ai-assistant', label: 'AI Assistant', icon: Bot, category: 'Intelligence' },
                    { to: '/authority-dashboard', label: 'Ops Console', icon: Shield, category: 'Intelligence', adminOnly: true },
                    
                    { to: '/profile', label: 'My Profile', icon: User, category: 'Account' },
                    { to: '/about', label: 'About App', icon: Info, category: 'Account' }
                  ].map((item, idx, arr) => {
                    if (item.adminOnly && user?.role !== 'official') return null;

                    const isActive = location.pathname === item.to || (item.to === '/dashboard' && location.pathname === '/');
                    const Icon = item.icon;
                    const showHeader = idx === 0 || arr[idx - 1].category !== item.category;

                    return (
                      <React.Fragment key={item.to}>
                        {showHeader && sidebarExpanded && (
                          <p className="text-[10px] font-extrabold text-neutral-400 dark:text-neutral-500 px-3 pt-4 pb-1 uppercase tracking-wider truncate">
                            {item.category}
                          </p>
                        )}
                        <Link 
                          to={item.to} 
                          title={!sidebarExpanded ? item.label : undefined}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-full transition-all duration-150 group relative ${
                            isActive 
                              ? 'bg-[#E8F0FE] dark:bg-blue-950/45 text-[#0B57D0] dark:text-blue-300 font-bold' 
                              : 'text-neutral-600 dark:text-neutral-350 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          }`}
                        >
                          {/* Left highlight pill on active in collapsed state */}
                          {!sidebarExpanded && isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#0B57D0] dark:bg-blue-400 rounded-r-full" />
                          )}

                          <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#0B57D0] dark:text-blue-300 scale-105' : 'text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300'}`} />
                          
                          {sidebarExpanded && (
                            <span className="text-xs truncate font-medium flex-1">{item.label}</span>
                          )}

                          {sidebarExpanded && item.badge && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${isActive ? 'bg-[#0B57D0]/10 text-[#0B57D0] dark:text-blue-300' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'}`}>
                              {item.badge}
                            </span>
                          )}

                          {!sidebarExpanded && item.badge && (
                            <span className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-extrabold h-4 w-4 rounded-full flex items-center justify-center border-2 border-white dark:border-neutral-900 shadow-xs">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </React.Fragment>
                    );
                  })}
                </div>
              </motion.aside>
            )}

            {/* Content Frame */}
            <div 
              onScroll={(e) => {
                const scrollTop = e.currentTarget.scrollTop;
                const active = scrollTop > 20;
                if (active !== isScrolling) {
                  setIsScrolling(active);
                }
              }}
              className="flex-1 flex flex-col min-h-0 min-w-0 overflow-y-auto bg-slate-50 dark:bg-neutral-950 relative pb-24 md:pb-28"
            >
              <main className="flex-1 relative">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                    className="w-full min-h-full flex flex-col"
                  >
                    {routesArea}
                  </motion.div>
                </AnimatePresence>
              </main>

              {/* Branding Footer bottom line inside scroll viewport */}
              <footer className="bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 p-5 text-center shrink-0">
                <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-semibold leading-relaxed max-w-4xl mx-auto">
                  Urban Mind AI Civic Network • Designed by Google's Civic Technology division © 2026. Prioritizing urban trust, infrastructure durability, and public cooperation.
                </p>
              </footer>
            </div>

            {/* Sticky Bottom Tab Bar (renders on both mobile and desktop views) */}
            <AnimatePresence>
              {!isAuthPage && user && getMobileTabBar(true)}
            </AnimatePresence>
          </div>
        );
      })()}

      {/* Community Member Showcase Modal overlay */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <motion.div 
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl max-w-sm w-full border border-neutral-200/80 shadow-2xl p-6 relative overflow-hidden"
          >
            {/* Ambient Background Glow decoration */}
            <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-br from-indigo-500/10 to-emerald-500/5 -z-10" />
            
            <button
              onClick={() => setSelectedMember(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-800 transition-colors text-xs font-bold"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <img 
                  src={selectedMember.avatar} 
                  alt={selectedMember.name} 
                  className="w-20 h-20 rounded-full border-4 border-white shadow-md bg-neutral-50"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-0 right-0 bg-yellow-500 text-white font-mono text-[10px] font-extrabold w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-xs">
                  ★
                </span>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-neutral-900">{selectedMember.name}</h3>
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">
                  SF Honor Roll Citizen
                </p>
              </div>

              {/* Stats bento rows */}
              <div className="grid grid-cols-3 gap-2.5 w-full bg-neutral-50 border border-neutral-200 p-3 rounded-2xl text-center">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase">Reputation</p>
                  <p className="text-xs font-black text-indigo-600 font-mono">{selectedMember.reputation} XP</p>
                </div>
                <div className="space-y-0.5 border-x border-neutral-200">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase">Reports</p>
                  <p className="text-xs font-black text-neutral-800 font-mono">{selectedMember.reportsCount || 0}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase">Verified</p>
                  <p className="text-xs font-black text-emerald-600 font-mono">{selectedMember.verifiedCount || 0}</p>
                </div>
              </div>

              {/* Status details */}
              <div className="text-[11px] text-neutral-600 leading-relaxed bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl w-full">
                <p className="font-semibold text-indigo-950 flex items-center gap-1 justify-center mb-1">
                  <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                  <span>Leaderboard Rank #{selectedMember.rank || 'N/A'}</span>
                </p>
                As a highly verified community watch leader, this user's upvotes provide authoritative civic weight to ongoing infrastructure repairs.
              </div>

              <div className="flex gap-2 w-full pt-1">
                <button
                  onClick={() => {
                    setSelectedMember(null);
                    navigate('/leaderboard');
                  }}
                  className="flex-1 bg-neutral-900 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-neutral-800 transition-colors"
                >
                  View Honor Roll
                </button>
                <button
                  onClick={() => setSelectedMember(null)}
                  className="flex-1 bg-neutral-100 text-neutral-800 text-xs font-bold py-2.5 rounded-xl hover:bg-neutral-200 transition-colors"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
