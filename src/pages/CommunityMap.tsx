import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { pageVariants } from '../utils/motion';
import { Issue, IssueStatus, IssueCategory } from '../types';
import InteractiveMap from '../components/InteractiveMap';
import IssueDetail from '../components/IssueDetail';
import { 
  SlidersHorizontal, 
  Lightbulb, 
  Trash2, 
  AlertTriangle, 
  Layers, 
  MapPin, 
  Compass, 
  Plus, 
  X, 
  Activity,
  Sparkles,
  Info
} from 'lucide-react';

interface CommunityMapProps {
  issues: Issue[];
  selectedIssue: Issue | null;
  onSelectIssue: (issue: Issue) => void;
  onVote: (issueId: string, type: 'up' | 'down') => void;
  onAddComment: (issueId: string, commentText: string) => void;
  onUpdateStatus?: (issueId: string, nextStatus: IssueStatus, updateNote: string) => void;
  onVerifyIssue?: (updatedIssue: Issue, earnedXP: number) => void;
  pickingMode: boolean;
  setPickingMode: (val: boolean) => void;
  onCoordinatePicked: (lat: number, lng: number, landmark: string) => void;
}

const CATEGORY_TAGS: Record<string, string> = {
  pothole: 'Road Potholes 🚧',
  garbage: 'Sanitation & Litter 🗑️',
  water_leak: 'Potable Leak 💧',
  broken_streetlight: 'Electrical Lights 💡',
  graffiti: 'Vandals / Graffiti 🎨',
  tree_hazard: 'Tree Hazard 🌳',
  general: 'General Civic 📋'
};

const CATEGORIES_COLOR: Record<IssueCategory, { bg: string, text: string, border: string }> = {
  pothole: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-800 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-900/60' },
  garbage: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-800 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-900/60' },
  water_leak: { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-800 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-900/60' },
  broken_streetlight: { bg: 'bg-yellow-50 dark:bg-yellow-950/40', text: 'text-yellow-800 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-900/60' },
  graffiti: { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-800 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-900/60' },
  tree_hazard: { bg: 'bg-green-50 dark:bg-green-950/40', text: 'text-green-800 dark:text-green-300', border: 'border-green-200 dark:border-green-900/60' },
  general: { bg: 'bg-slate-50 dark:bg-slate-900/40', text: 'text-slate-800 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-800' }
};

export default function CommunityMap({
  issues,
  selectedIssue,
  onSelectIssue,
  onVote,
  onAddComment,
  onUpdateStatus,
  onVerifyIssue,
  pickingMode,
  setPickingMode,
  onCoordinatePicked
}: CommunityMapProps) {
  // State for categories selection
  const [selectedCategories, setSelectedCategories] = useState<IssueCategory[]>([
    'pothole', 'garbage', 'water_leak', 'broken_streetlight', 'graffiti', 'tree_hazard', 'general'
  ]);
  
  // Overlay states managed in parent card but controlled locally via chips
  const [showPublicLighting, setShowPublicLighting] = useState(false);
  const [showTrashZones, setShowTrashZones] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState<'none' | 'density' | 'infrastructure' | 'traffic'>('none');

  // Firestore Real-Time Emulation State
  const [localIssues, setLocalIssues] = useState<Issue[]>(issues);
  const [liveNotification, setLiveNotification] = useState<{ id: string; text: string; icon: string; category?: IssueCategory } | null>(null);

  // Sync localIssues when prop issues update
  useEffect(() => {
    setLocalIssues(issues);
  }, [issues]);

  // Firestore Stream Emulator
  useEffect(() => {
    const interval = setInterval(() => {
      if (localIssues.length === 0) return;

      const actionType = Math.floor(Math.random() * 3);

      if (actionType === 0) {
        // Simulated New Incident reported by a neighbor
        const categories: IssueCategory[] = ['pothole', 'garbage', 'water_leak', 'broken_streetlight', 'graffiti', 'tree_hazard', 'general'];
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        const names = ['Sarah Jenkins', 'Elena Rostova', 'Marcus Vance', 'David Lopez', 'Anshdeep Singh'];
        const randomReporter = names[Math.floor(Math.random() * names.length)];
        
        // Coords in SF near current view
        const lat = 37.755 + Math.random() * 0.035;
        const lng = -122.405 - Math.random() * 0.04;

        const streetNames = ['Dolores St', 'Castro St', 'Valencia St', 'Mission St', '18th St', '24th St'];
        const randomStreet = streetNames[Math.floor(Math.random() * streetNames.length)];

        const newSimulatedIssue: Issue = {
          id: `sim-${Date.now()}`,
          title: `Live: Simulated ${randomCategory.replace('_', ' ')} hazard`,
          description: `A resident reported a new ${randomCategory.replace('_', ' ')} incident on ${randomStreet}. This report was broadcasted instantly to your map viewport via Firestore onSnapshot live triggers.`,
          category: randomCategory,
          severity: Math.random() > 0.8 ? 'critical' : 'medium',
          status: 'reported',
          lat,
          lng,
          locationName: `${randomStreet} Corridor`,
          reportedBy: randomReporter,
          reporterId: `sim-user-${Date.now()}`,
          reportedAt: new Date().toISOString(),
          upvotes: 1,
          downvotes: 0,
          comments: [],
          history: [
            {
              status: 'reported',
              timestamp: new Date().toISOString(),
              note: 'Incident initialized via real-time satellite telemetry sync.',
              updatedBy: 'Citizen GPS Sync'
            }
          ],
          verifications: [],
          trustScore: 85
        };

        setLocalIssues(prev => [newSimulatedIssue, ...prev]);
        setLiveNotification({
          id: newSimulatedIssue.id,
          text: `Live Report: New ${randomCategory.replace('_', ' ')} on ${newSimulatedIssue.locationName}!`,
          icon: '📍',
          category: randomCategory
        });

      } else if (actionType === 1) {
        // Simulated Resident Agreement / Upvote
        const randomIndex = Math.floor(Math.random() * localIssues.length);
        const target = localIssues[randomIndex];

        setLocalIssues(prev => prev.map(issue => {
          if (issue.id === target.id) {
            const nextUpvotes = issue.upvotes + 1;
            const thresholdExceeded = nextUpvotes >= 10 && issue.status === 'reported';
            const nextStatus: IssueStatus = thresholdExceeded ? 'verified' : issue.status;

            return {
              ...issue,
              upvotes: nextUpvotes,
              status: nextStatus,
              history: thresholdExceeded ? [
                ...issue.history,
                {
                  status: 'verified',
                  timestamp: new Date().toISOString(),
                  note: 'Upvote threshold achieved (+10 peer agreements). Triage escalated.',
                  updatedBy: 'Community Peer Consensus'
                }
              ] : issue.history
            };
          }
          return issue;
        }));

        setLiveNotification({
          id: `vote-${Date.now()}`,
          text: `Live Agreement: Neighbor upvoted "${target.title}"!`,
          icon: '👍',
          category: target.category
        });

      } else {
        // Simulated Dispatch Status Upgrade
        const randomIndex = Math.floor(Math.random() * localIssues.length);
        const target = localIssues[randomIndex];
        const statuses: IssueStatus[] = ['verified', 'in_progress', 'resolved'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

        if (target.status !== randomStatus) {
          setLocalIssues(prev => prev.map(issue => {
            if (issue.id === target.id) {
              return {
                ...issue,
                status: randomStatus,
                history: [
                  ...issue.history,
                  {
                    status: randomStatus,
                    timestamp: new Date().toISOString(),
                    note: `Status upgraded to ${randomStatus.replace('_', ' ')} via Municipal Dispatch terminal.`,
                    updatedBy: 'District Crew Dispatch'
                  }
                ]
              };
            }
            return issue;
          }));

          setLiveNotification({
            id: `status-${Date.now()}`,
            text: `Live Status: "${target.title}" marked as ${randomStatus.replace('_', ' ')}!`,
            icon: '🛠️',
            category: target.category
          });
        }
      }
    }, 18000);

    return () => clearInterval(interval);
  }, [localIssues]);

  // Autoclose notifications
  useEffect(() => {
    if (liveNotification) {
      const timer = setTimeout(() => {
        setLiveNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [liveNotification]);

  // Apply filters
  const filteredIssues = localIssues.filter(issue => selectedCategories.includes(issue.category));

  // If selectedIssue is filtered out, clear it or select first available visible
  useEffect(() => {
    if (selectedIssue && !selectedCategories.includes(selectedIssue.category)) {
      const firstVisible = filteredIssues[0] || null;
      if (firstVisible) {
        onSelectIssue(firstVisible);
      }
    }
  }, [selectedCategories, selectedIssue, filteredIssues, onSelectIssue]);

  const handleToggleCategory = (cat: IssueCategory) => {
    setSelectedCategories(prev => {
      if (prev.includes(cat)) {
        // Don't empty out everything if it's the last one, toggle to all
        if (prev.length === 1) {
          return ['pothole', 'garbage', 'water_leak', 'broken_streetlight', 'graffiti', 'tree_hazard', 'general'];
        }
        return prev.filter(c => c !== cat);
      } else {
        return [...prev, cat];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedCategories([
      'pothole', 'garbage', 'water_leak', 'broken_streetlight', 'graffiti', 'tree_hazard', 'general'
    ]);
  };

  const handleClearAll = () => {
    setSelectedCategories([]);
  };

  const isAllSelected = selectedCategories.length === 7;

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-70px)] text-left relative overflow-hidden bg-slate-100 dark:bg-neutral-950"
    >
      {/* Outer viewport container */}
      <div className="flex-1 relative w-full h-full">
        
        {/* Real-time map element */}
        <div className="w-full h-full absolute inset-0 z-0">
          <InteractiveMap 
            issues={filteredIssues}
            selectedIssue={selectedIssue}
            onSelectIssue={onSelectIssue}
            pickingMode={pickingMode}
            setPickingMode={setPickingMode}
            onCoordinatePicked={onCoordinatePicked}
            showPublicLighting={showPublicLighting}
            setShowPublicLighting={setShowPublicLighting}
            showTrashZones={showTrashZones}
            setShowTrashZones={setShowTrashZones}
            activeOverlay={activeOverlay}
            setActiveOverlay={setActiveOverlay}
          />
        </div>

        {/* FLOATING ACTION INTERFACES OVER MAP */}

        {/* Floating Top Header Overlay & Chips */}
        <div className="absolute top-3 inset-x-3 z-10 pointer-events-none flex flex-col gap-2.5">
          
          {/* Real-time active Firestore Notification Toast */}
          <AnimatePresence>
            {liveNotification && (
              <motion.div
                initial={{ y: -40, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -20, opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="mx-auto pointer-events-auto bg-neutral-900/95 dark:bg-neutral-900/98 backdrop-blur text-white px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 border border-neutral-800 max-w-sm sm:max-w-md"
              >
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0 text-xs shadow">
                  {liveNotification.icon}
                </div>
                <div className="text-left overflow-hidden">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1">
                    <Activity className="w-3 h-3 animate-pulse" />
                    <span>Live Firestore Sync</span>
                  </p>
                  <p className="text-[11.5px] font-medium text-neutral-100 truncate pr-2">
                    {liveNotification.text}
                  </p>
                </div>
                <button 
                  onClick={() => setLiveNotification(null)}
                  className="text-neutral-400 hover:text-white shrink-0 font-bold p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scrolling Row of Category chips */}
          <div className="w-full flex flex-col gap-1.5">
            
            {/* Category selection row */}
            <div className="flex gap-1.5 items-center overflow-x-auto no-scrollbar pointer-events-auto pb-1 max-w-full">
              
              {/* All / Clear Filter Chip */}
              <button
                onClick={isAllSelected ? handleClearAll : handleSelectAll}
                className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold shadow-md border cursor-pointer shrink-0 transition-all ${
                  isAllSelected 
                    ? 'bg-neutral-900 border-neutral-900 text-white dark:bg-neutral-100 dark:border-neutral-100 dark:text-neutral-900' 
                    : 'bg-white/95 dark:bg-neutral-900/95 text-neutral-700 dark:text-neutral-200 border-neutral-200 dark:border-neutral-800'
                }`}
              >
                {isAllSelected ? 'Clear Filters' : 'Show All'}
              </button>

              {/* Individual Category filter chips */}
              {Object.keys(CATEGORY_TAGS).map(catKey => {
                const isSelected = selectedCategories.includes(catKey as IssueCategory);
                const countOnMap = localIssues.filter(i => i.category === catKey).length;
                const col = CATEGORIES_COLOR[catKey as IssueCategory];

                return (
                  <button
                    key={catKey}
                    onClick={() => handleToggleCategory(catKey as IssueCategory)}
                    className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold shadow-sm border cursor-pointer shrink-0 transition-all flex items-center gap-1.5 ${
                      isSelected 
                        ? `${col.bg} ${col.text} ${col.border} ring-2 ring-blue-500/10 font-extrabold`
                        : 'bg-white/95 dark:bg-neutral-900/95 text-neutral-500 dark:text-neutral-400 border-neutral-200/80 dark:border-neutral-800 hover:bg-neutral-50'
                    }`}
                  >
                    <span>{CATEGORY_TAGS[catKey]}</span>
                    <span className="text-[9px] font-mono opacity-60 bg-black/5 dark:bg-white/10 px-1.5 py-0.2 rounded-full font-bold">
                      {countOnMap}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Overlays secondary row */}
            <div className="flex gap-1.5 items-center overflow-x-auto no-scrollbar pointer-events-auto pb-1 max-w-full">
              
              <span className="text-[9px] font-extrabold text-neutral-500 bg-white/80 dark:bg-neutral-900/80 backdrop-blur border border-neutral-200 dark:border-neutral-800 px-2.5 py-1 rounded-full uppercase shrink-0">
                🗺️ Live GIS Overlays
              </span>

              {/* Public Lighting overlay chip */}
              <button
                onClick={() => setShowPublicLighting(!showPublicLighting)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold shadow-xs border cursor-pointer shrink-0 transition-all flex items-center gap-1.5 ${
                  showPublicLighting 
                    ? 'bg-amber-500 border-amber-600 text-white shadow-amber-100' 
                    : 'bg-white/90 dark:bg-neutral-900/90 text-neutral-600 dark:text-neutral-300 border-neutral-200/60 dark:border-neutral-800'
                }`}
              >
                <Lightbulb className="w-3 h-3" />
                <span>💡 Lighting Grid</span>
                <span className="text-[8px] bg-black/10 dark:bg-white/20 px-1 py-0.2 rounded font-bold">
                  Active
                </span>
              </button>

              {/* Trash Collection sectors overlay */}
              <button
                onClick={() => setShowTrashZones(!showTrashZones)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold shadow-xs border cursor-pointer shrink-0 transition-all flex items-center gap-1.5 ${
                  showTrashZones 
                    ? 'bg-emerald-600 border-emerald-700 text-white shadow-emerald-100' 
                    : 'bg-white/90 dark:bg-neutral-900/90 text-neutral-600 dark:text-neutral-300 border-neutral-200/60 dark:border-neutral-800'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>🗑️ Trash Sectors</span>
                <span className="text-[8px] bg-black/10 dark:bg-white/20 px-1 py-0.2 rounded font-bold">
                  Active
                </span>
              </button>

              {/* Hotspot heatmap overlay */}
              <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold shadow-xs border cursor-pointer shrink-0 transition-all flex items-center gap-1.5 ${
                  showHeatmap 
                    ? 'bg-red-500 border-red-600 text-white' 
                    : 'bg-white/90 dark:bg-neutral-900/90 text-neutral-600 dark:text-neutral-300 border-neutral-200/60 dark:border-neutral-800'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>🔥 Incident Hotspots</span>
              </button>
            </div>

          </div>
        </div>

        {/* Floating Layer Control Chip Panel */}
        <div className="absolute top-24 right-3 z-15 pointer-events-auto max-w-[calc(100vw-24px)] overflow-x-auto no-scrollbar">
          <div className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-2.5 shadow-xl flex gap-1.5 items-center whitespace-nowrap">
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 dark:text-neutral-500 px-2 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden sm:inline">Layers</span>
            </span>
            
            {/* None / Default Map */}
            <button
              onClick={() => setActiveOverlay('none')}
              className={`px-3 py-1.5 rounded-xl text-[10.5px] font-bold cursor-pointer transition-all ${
                activeOverlay === 'none'
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 font-black'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
              }`}
            >
              Default
            </button>

            {/* Report Density */}
            <button
              onClick={() => setActiveOverlay(activeOverlay === 'density' ? 'none' : 'density')}
              className={`px-3 py-1.5 rounded-xl text-[10.5px] font-bold cursor-pointer transition-all flex items-center gap-1 ${
                activeOverlay === 'density'
                  ? 'bg-indigo-600 text-white font-black shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Report Density</span>
            </button>

            {/* Infrastructure Health */}
            <button
              onClick={() => setActiveOverlay(activeOverlay === 'infrastructure' ? 'none' : 'infrastructure')}
              className={`px-3 py-1.5 rounded-xl text-[10.5px] font-bold cursor-pointer transition-all flex items-center gap-1 ${
                activeOverlay === 'infrastructure'
                  ? 'bg-emerald-600 text-white font-black shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>Infrastructure Health</span>
            </button>

            {/* Traffic Flow */}
            <button
              onClick={() => setActiveOverlay(activeOverlay === 'traffic' ? 'none' : 'traffic')}
              className={`px-3 py-1.5 rounded-xl text-[10.5px] font-bold cursor-pointer transition-all flex items-center gap-1 ${
                activeOverlay === 'traffic'
                  ? 'bg-amber-600 text-white font-black shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Traffic Flow</span>
            </button>
          </div>
        </div>

        {/* Floating guidance toast for GPS Pinpoint Picking Mode */}
        <AnimatePresence>
          {pickingMode && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="absolute bottom-24 left-4 right-4 md:left-auto md:right-4 md:w-96 z-25 bg-orange-50 dark:bg-orange-950 border-l-4 border-orange-500 p-4.5 rounded-r-2xl shadow-2xl flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1 text-left">
                <h4 className="text-xs font-extrabold text-orange-800 dark:text-orange-200">Interactive GPS Mode Active</h4>
                <p className="text-[11px] text-orange-600 dark:text-orange-300 leading-normal mt-0.5">
                  Click anywhere on the satellite vector map grid to register coordinates and file a neighborhood repair ticket.
                </p>
                <button
                  onClick={() => setPickingMode(false)}
                  className="mt-2 text-[10.5px] font-extrabold text-orange-800 dark:text-orange-100 bg-orange-200/50 dark:bg-orange-900/50 px-2.5 py-1 rounded hover:bg-orange-200 transition-colors"
                >
                  Dismiss Picker
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Action Button (FAB) and Coordinates Mode Toggle */}
        <div className="absolute bottom-6 right-6 z-20 flex flex-col items-end gap-3 pointer-events-auto">
          
          {/* Main Action FAB */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setPickingMode(!pickingMode);
            }}
            className={`shadow-2xl rounded-2xl flex items-center gap-2 px-5 py-3.5 text-xs font-bold tracking-tight cursor-pointer ${
              pickingMode 
                ? 'bg-red-500 hover:bg-red-600 text-white ring-4 ring-red-100'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white ring-4 ring-indigo-50/20'
            }`}
          >
            {pickingMode ? (
              <>
                <X className="w-4.5 h-4.5" />
                <span>Cancel Pinning</span>
              </>
            ) : (
              <>
                <Plus className="w-4.5 h-4.5" />
                <span>Pin Ward Hazard</span>
              </>
            )}
          </motion.button>
        </div>

        {/* BOTTOM SHEET / FLOATING left PANEL FOR ISSUE DETAILS */}
        <AnimatePresence>
          {selectedIssue && (
            <motion.div
              // Animates differently based on device frame
              initial={{ y: '100%', opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0.5 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="absolute bottom-0 inset-x-0 h-[65vh] md:h-[calc(100%-32px)] md:inset-y-0 md:top-4 md:bottom-4 md:left-4 md:right-auto md:w-[420px] z-30 bg-white dark:bg-neutral-950 shadow-2xl rounded-t-3xl md:rounded-3xl border border-neutral-200/80 dark:border-neutral-800 flex flex-col overflow-hidden"
              id="map-detail-bottom-sheet"
            >
              {/* Drag Handle pill for Mobile Sheet context */}
              <div className="w-12 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full mx-auto my-3 cursor-pointer shrink-0 md:hidden" />

              {/* Scrollable Container of Issue detail cards */}
              <div className="flex-1 overflow-y-auto no-scrollbar">
                <IssueDetail 
                  issue={selectedIssue}
                  onClose={() => onSelectIssue(null as any)}
                  onVote={onVote}
                  onAddComment={onAddComment}
                  onUpdateStatus={onUpdateStatus}
                  onVerifyIssue={onVerifyIssue}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
}
