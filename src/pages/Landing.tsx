import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import logo from '../assets/logo.svg';
import { 
  ArrowRight, 
  MapPin, 
  FileText, 
  Search,
  Droplet,
  AlertTriangle,
  Award,
  ChevronRight,
  Clock,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { Issue } from '../types';
import { M3Button, M3Card, M3Chip, MaterialIcon, useTheme } from '../components/M3Components';
import { AnimatedCounter } from '../components/AnimatedCounter';

interface LandingProps {
  issues: Issue[];
  stats: {
    reported: number;
    resolved: number;
    volunteers: number;
    impactScore: number;
  };
}

export default function Landing({ issues, stats }: LandingProps) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  // Rotating Search Query Placeholders
  const rotatingQueries = [
    "Pothole on Dolores St near the tennis courts",
    "Fallen tree branch blocking the bike lane",
    "Water main leak reported on Valencia St",
    "Flickering street lamp at 18th & Guerrero",
    "Overfilled trash bin near the transit stop"
  ];
  const [queryIndex, setQueryIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setQueryIndex((prev) => (prev + 1) % rotatingQueries.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Phone Mockup Active Tab
  // 'map' (Interactive Map), 'report' (Simulated Report Form), 'ai' (Civic AI Chatbot)
  const [phoneTab, setPhoneTab] = useState<'map' | 'report' | 'ai'>('map');
  
  // Real Dolores-like items inside the interactive phone mockup
  const mockPhoneMarkers = [
    {
      id: 'm1',
      title: 'Pavement Crack',
      location: '18th St & Dolores St',
      category: 'Road Hazard',
      severity: 'high',
      status: 'Verified by 12 neighbors',
      coordinates: { x: 45, y: 35 },
      desc: 'Significant asphalt buckling in the pedestrian crosswalk. Public works team scheduled.',
      icon: AlertTriangle,
      color: '#EA4335',
      m3Icon: 'construction'
    },
    {
      id: 'm2',
      title: 'Water Main Leak',
      location: 'Valencia St & 19th St',
      category: 'Water & Utilities',
      severity: 'critical',
      status: 'Maintenance team routed',
      coordinates: { x: 75, y: 65 },
      desc: 'Subterranean water leakage bubbling through asphalt. Crew dispatch confirmed.',
      icon: Droplet,
      color: '#1A73E8',
      m3Icon: 'water_drop'
    },
    {
      id: 'm3',
      title: 'Outed Streetlight',
      location: '20th St & Guerrero St',
      category: 'Street Lighting',
      severity: 'warning',
      status: 'Awaiting crew review',
      coordinates: { x: 25, y: 75 },
      desc: 'Corner street lamp bulb is completely dark. High priority evening safety report.',
      icon: Sparkles,
      color: '#FBBC05',
      m3Icon: 'lightbulb'
    }
  ];

  const [selectedMarkerId, setSelectedMarkerId] = useState<string>('m1');
  const activeMarker = mockPhoneMarkers.find(m => m.id === selectedMarkerId) || mockPhoneMarkers[0];

  // Simulated AI Chat history for mockup
  const [aiChatMessages, setAiChatMessages] = useState([
    { sender: 'user', text: "Report a broken streetlight on Guerrero" },
    { sender: 'ai', text: "I found a matching report from 3 hours ago: 'Street lamp completely out at 20th & Guerrero'. Would you like to upvote it to speed up the repair schedule?" }
  ]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim() || rotatingQueries[queryIndex];
    navigate(`/community-feed?search=${encodeURIComponent(query)}`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-md-background text-md-on-background font-sans antialiased text-left"
    >
      {/* Soft Google-style subtle radial mesh overlay background */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-[radial-gradient(var(--color-md-outline-variant)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_0%,#000_65%,transparent_100%)] pointer-events-none -z-10 opacity-70" />

      {/* Google-Style Top Navigation Bar (MD3 styled, flat) */}
      <header className="sticky top-0 z-50 h-[64px] px-6 sm:px-8 lg:px-12 flex items-center justify-between bg-md-background/85 backdrop-blur-md border-b border-md-outline-variant/60 transition-all">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center justify-center transition-all select-none" aria-label="Urban Mind Home">
            <img 
              src={logo} 
              alt="Urban Mind Logo" 
              className="h-8 w-auto object-contain shrink-0" 
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-lg font-medium tracking-tight text-md-on-background font-sans font-semibold">Urban Mind</span>
            <span className="text-[10px] bg-md-primary-container text-md-on-primary-container border border-md-primary/10 px-2.5 py-0.5 rounded-full font-semibold">
              Dolores District
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <M3Button 
            variant="text" 
            onClick={() => navigate('/dashboard')}
            className="text-xs font-semibold px-3"
          >
            Launch Console
          </M3Button>
          <M3Button 
            variant="filled" 
            onClick={() => navigate('/signup')}
            className="h-9 text-xs px-4 rounded-xl"
            icon="arrow_forward"
            iconPosition="right"
          >
            Get Started
          </M3Button>
        </div>
      </header>

      {/* Hero Section: Split Layout (Compact, Sleek, Professional) */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-6 sm:pt-12 pb-14 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* Left: Material Design Headlines, Search, and Action buttons */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-md-secondary-container text-md-on-secondary-container text-xs font-semibold border border-md-secondary/10">
            <MaterialIcon name="volunteer_activism" className="text-[14px] text-md-primary" />
            <span>Coordinating repairs for San Francisco neighborhoods</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-[48px] font-semibold tracking-tight text-md-on-background leading-[1.15] font-sans">
              Help keep your neighborhood <br />
              <span className="text-md-primary">safe, clean, and connected.</span>
            </h1>
            <p className="text-sm sm:text-base text-md-on-surface-variant leading-relaxed max-w-xl font-medium">
              Urban Mind connects community feedback directly with city service teams. Report a broken streetlight, flag pavement hazards, and track maintenance request resolutions live in your district.
            </p>
          </div>

          {/* Clean Google Maps/Google Search Style Input Bar */}
          <div className="max-w-xl space-y-2">
            <form onSubmit={handleSearchSubmit}>
              <motion.div 
                animate={{ 
                  scale: searchFocused ? 1.015 : 1.0,
                  boxShadow: searchFocused ? "0px 8px 24px rgba(0, 0, 0, 0.06)" : "0px 1px 2px rgba(0, 0, 0, 0.02)"
                }}
                transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
                className="relative flex items-center bg-md-surface-variant/40 hover:bg-md-surface-variant/65 focus-within:bg-md-surface focus-within:ring-2 focus-within:ring-md-primary/20 focus-within:border-md-primary rounded-[20px] border border-md-outline-variant/80 transition-all h-[52px] px-4 shadow-sm"
              >
                <MaterialIcon name="search" className="text-md-on-surface-variant shrink-0" />
                
                <div className="relative flex-1 h-full flex items-center overflow-hidden ml-3">
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    className="w-full bg-transparent border-none outline-none text-sm text-md-on-surface placeholder-transparent focus:placeholder-md-on-surface-variant/40 h-full font-medium"
                    id="landing_search_input"
                    placeholder="Type a street issue..."
                  />
                  
                  {/* Elegant sliding query placeholder */}
                  {searchQuery === '' && (
                    <div className="absolute inset-y-0 left-0 right-0 flex items-center pointer-events-none">
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={queryIndex}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="text-xs sm:text-sm text-md-on-surface-variant/60 font-medium truncate"
                        >
                          {rotatingQueries[queryIndex]}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                <M3Button
                  type="submit"
                  variant="tonal"
                  className="h-8 px-4 text-xs font-semibold rounded-lg shrink-0 ml-2"
                >
                  Search
                </M3Button>
              </motion.div>
            </form>

            {/* Quick search shortcut pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-md-on-surface-variant/60 mr-1.5">Quick search:</span>
              <M3Chip 
                onClick={() => navigate('/community-feed?search=streetlight')}
                icon="lightbulb"
                className="py-1 px-2.5 rounded-full"
              >
                Lighting
              </M3Chip>
              <M3Chip 
                onClick={() => navigate('/community-feed?search=water')}
                icon="water_drop"
                className="py-1 px-2.5 rounded-full"
              >
                Leaks
              </M3Chip>
              <M3Chip 
                onClick={() => navigate('/community-feed?search=pavement')}
                icon="construction"
                className="py-1 px-2.5 rounded-full"
              >
                Potholes
              </M3Chip>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <M3Button
              onClick={() => navigate('/signup')}
              variant="filled"
              className="h-11 px-6 rounded-xl text-xs font-semibold"
              icon="add_circle"
            >
              Report an Issue
            </M3Button>
            <M3Button
              onClick={() => navigate('/community-map')}
              variant="outlined"
              className="h-11 px-6 rounded-xl text-xs font-semibold bg-md-surface/50"
              icon="map"
            >
              Explore Live Map
            </M3Button>
          </div>
        </div>

        {/* Right: Premium CSS Phone Mockup serving real screenshot-like simulator */}
        <div className="lg:col-span-5 flex justify-center mt-4 lg:mt-0">
          <motion.div 
            animate={{ 
              y: [0, -10, 0],
              rotateZ: [0, 0.5, 0]
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative w-[300px] h-[580px] rounded-[38px] border-[8px] border-md-on-surface bg-md-surface shadow-2xl overflow-hidden flex flex-col select-none"
          >
            
            {/* Phone Notch */}
            <div className="absolute top-0 inset-x-0 h-5 bg-md-on-surface flex items-center justify-center z-50">
              <div className="w-16 h-3 bg-md-on-surface rounded-b-lg flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-neutral-800 mr-2" />
                <div className="w-7 h-0.5 bg-neutral-700 rounded-full" />
              </div>
            </div>

            {/* Simulated Phone Status Bar */}
            <div className="h-[24px] bg-md-surface px-5 pt-5 flex justify-between items-center text-[9px] font-bold text-md-on-surface-variant z-40 shrink-0">
              <span>10:14</span>
              <div className="flex items-center gap-1">
                <MaterialIcon name="wifi" className="text-[10px]" />
                <span className="text-[8px]">LTE</span>
                <MaterialIcon name="battery_full" className="text-[10px]" />
              </div>
            </div>

            {/* Simulated App Header */}
            <div className="border-b border-md-outline-variant px-3 py-1.5 flex items-center justify-between bg-md-surface shrink-0">
              <div className="flex items-center gap-1.5">
                <img src={logo} alt="Urban Mind mini" className="w-5 h-5 object-contain" />
                <span className="text-[11px] font-bold text-md-on-surface">Urban Mind</span>
              </div>
              <span className="text-[8px] font-bold bg-md-primary-container text-md-on-primary-container px-2 py-0.5 rounded-full">
                Dolores
              </span>
            </div>

            {/* Phone Screen App Canvas View (Interacting Tab) */}
            <div className="flex-1 bg-md-background relative flex flex-col overflow-hidden">
              <AnimatePresence mode="wait">
                {phoneTab === 'map' && (
                  <motion.div 
                    key="map"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col justify-between"
                  >
                    {/* Simulated Google Map */}
                    <div className="absolute inset-0 bg-sky-100/50 dark:bg-slate-900/40">
                      <svg viewBox="0 0 300 400" className="w-full h-full opacity-80">
                        {/* Streets */}
                        <path d="M 0 90 L 300 90" stroke={theme === 'dark' ? '#2d3748' : '#FFFFFF'} strokeWidth="5" />
                        <path d="M 0 240 L 300 240" stroke={theme === 'dark' ? '#2d3748' : '#FFFFFF'} strokeWidth="5" />
                        <path d="M 95 0 L 95 400" stroke={theme === 'dark' ? '#2d3748' : '#FFFFFF'} strokeWidth="5" />
                        <path d="M 210 0 L 210 400" stroke={theme === 'dark' ? '#2d3748' : '#FFFFFF'} strokeWidth="5" />
                        
                        {/* Dolores Park Green Area */}
                        <rect x="105" y="100" width="95" height="130" rx="6" fill={theme === 'dark' ? '#1b4d3e' : '#e6f4ea'} stroke={theme === 'dark' ? '#103024' : '#ceead6'} strokeWidth="1" />
                        <text x="152" y="165" fill={theme === 'dark' ? '#a3e635' : '#137333'} fontSize="9" fontWeight="600" textAnchor="middle" opacity="0.6">Dolores Park</text>
                      </svg>

                      {/* Interactive Custom Map Pins */}
                      {mockPhoneMarkers.map((marker) => {
                        const isSelected = marker.id === selectedMarkerId;
                        return (
                          <motion.button
                            key={marker.id}
                            type="button"
                            onClick={() => setSelectedMarkerId(marker.id)}
                            style={{ left: `${marker.coordinates.x}%`, top: `${marker.coordinates.y}%` }}
                            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
                            animate={isSelected ? {
                              y: [0, -4, 0]
                            } : {}}
                            transition={{
                              duration: 1.6,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          >
                            <div className={`p-1 rounded-full shadow-md flex items-center justify-center border transition-all ${
                              isSelected 
                                ? 'scale-110 bg-md-primary border-white text-md-on-primary z-30' 
                                : 'bg-md-surface border-md-outline-variant text-md-on-surface-variant hover:scale-105'
                            }`}>
                              <MaterialIcon 
                                name={marker.m3Icon} 
                                className="text-[12px] w-3 h-3 flex items-center justify-center" 
                                filled={isSelected}
                              />
                            </div>
                            {isSelected && (
                              <span className="absolute top-6 left-1/2 -translate-x-1/2 bg-md-primary text-md-on-primary text-[7px] font-bold py-0.5 px-1.5 rounded-md whitespace-nowrap shadow-xs">
                                {marker.title}
                              </span>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Floating Bottom Drawer Sheet (M3 Styled) */}
                    <div className="absolute bottom-2 inset-x-2 bg-md-surface rounded-2xl border border-md-outline-variant shadow-lg p-3 space-y-1.5 z-30">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[7px] font-bold uppercase tracking-wider text-md-on-surface-variant/70">
                            {activeMarker.category}
                          </span>
                          <h4 className="text-[11px] font-bold text-md-on-surface mt-0.5">{activeMarker.title}</h4>
                        </div>
                        <span className={`text-[7px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wide ${
                          activeMarker.severity === 'critical' ? 'bg-md-error-container text-md-on-error-container' :
                          activeMarker.severity === 'high' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' : 'bg-md-secondary-container text-md-on-secondary-container'
                        }`}>
                          {activeMarker.severity}
                        </span>
                      </div>

                      <p className="text-[9px] text-md-on-surface-variant leading-relaxed">
                        {activeMarker.desc}
                      </p>

                      <div className="flex justify-between items-center pt-1.5 border-t border-md-outline-variant/60 text-[8px]">
                        <span className="text-md-on-surface-variant/80 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-md-on-surface-variant/60" />
                          <span>{activeMarker.status}</span>
                        </span>
                        <button 
                          type="button"
                          onClick={() => navigate('/community-map')}
                          className="font-bold text-md-primary flex items-center gap-0.5 cursor-pointer hover:underline"
                        >
                          <span>Full Map</span>
                          <ChevronRight className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {phoneTab === 'report' && (
                  <motion.div 
                    key="report"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-md-surface p-3 space-y-2.5 flex flex-col overflow-y-auto"
                  >
                    <div>
                      <h4 className="text-[12px] font-bold text-md-on-surface">Report local issue</h4>
                      <p className="text-[8px] text-md-on-surface-variant leading-relaxed">Help city services identify what needs attention.</p>
                    </div>

                    {/* Category Selectors */}
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-md-on-surface-variant">CATEGORY</label>
                      <div className="grid grid-cols-2 gap-1">
                        <div className="p-1.5 border border-md-primary bg-md-primary-container/20 rounded-lg text-center flex items-center justify-center gap-1 cursor-pointer">
                          <MaterialIcon name="construction" className="text-[12px] text-md-primary" />
                          <span className="text-[8px] font-bold text-md-on-primary-container">Road Repair</span>
                        </div>
                        <div className="p-1.5 border border-md-outline-variant rounded-lg text-center flex items-center justify-center gap-1 opacity-70">
                          <MaterialIcon name="lightbulb" className="text-[12px]" />
                          <span className="text-[8px] font-bold">Public Light</span>
                        </div>
                      </div>
                    </div>

                    {/* Location Field */}
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-md-on-surface-variant">LOCATION</label>
                      <div className="p-2 bg-md-surface-variant/30 rounded-lg flex items-center justify-between text-[8px] font-semibold text-md-on-surface">
                        <span className="truncate">Dolores St & 18th St, San Francisco</span>
                        <MaterialIcon name="my_location" className="text-[12px] text-md-primary" />
                      </div>
                    </div>

                    {/* Description Field */}
                    <div className="space-y-1 flex-1 flex flex-col">
                      <label className="text-[8px] font-bold text-md-on-surface-variant">DESCRIPTION</label>
                      <div className="p-2 border border-md-outline-variant rounded-lg text-[8px] font-medium text-md-on-surface flex-1 min-h-[50px] bg-md-surface-variant/10">
                        Deep pothole in the left bike lane right before the crosswalk. It forces cyclists into the main lane.
                      </div>
                    </div>

                    {/* Intelligent Scanning Widget */}
                    <div className="p-2 rounded-xl bg-md-primary-container text-md-on-primary-container border border-md-primary/10 flex items-center gap-2">
                      <MaterialIcon name="photo_camera" className="text-[14px]" />
                      <div className="min-w-0 flex-1">
                        <span className="text-[8px] font-bold block">Smart Image Scan</span>
                        <span className="text-[7px] opacity-85 block truncate">AI automatically classifies category & details.</span>
                      </div>
                    </div>

                    <M3Button variant="filled" className="h-7 text-[9px] py-1 rounded-lg mt-auto">
                      Submit Report
                    </M3Button>
                  </motion.div>
                )}

                {phoneTab === 'ai' && (
                  <motion.div 
                    key="ai"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-md-surface flex flex-col justify-between"
                  >
                    {/* Chat Area */}
                    <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                      <div className="text-[8px] font-extrabold uppercase tracking-wider text-md-on-surface-variant/60 text-center py-1">
                        Civic AI Assistant
                      </div>

                      {aiChatMessages.map((msg, index) => (
                        <div 
                          key={index} 
                          className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                        >
                          <div className={`p-2 rounded-xl text-[9px] leading-relaxed ${
                            msg.sender === 'user' 
                              ? 'bg-md-primary text-md-on-primary rounded-tr-none' 
                              : 'bg-md-surface-variant text-md-on-surface-variant rounded-tl-none'
                          }`}>
                            {msg.text}
                          </div>
                          <span className="text-[6px] text-md-on-surface-variant/50 mt-0.5">
                            {msg.sender === 'user' ? 'You' : 'Assistant'}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Predefined Action Chips */}
                    <div className="px-3 py-1 flex gap-1 overflow-x-auto whitespace-nowrap shrink-0 border-t border-md-outline-variant/40">
                      <button 
                        type="button"
                        onClick={() => {
                          setAiChatMessages(prev => [
                            ...prev,
                            { sender: 'user', text: "Is the Valencia leak scheduled?" },
                            { sender: 'ai', text: "Yes! San Francisco Water Enterprise dispatched a repair crew. Work is scheduled to start tomorrow morning at 8:00 AM." }
                          ]);
                        }}
                        className="px-2 py-1 bg-md-primary-container text-md-on-primary-container border border-md-primary/10 rounded-full text-[7px] font-bold cursor-pointer hover:bg-md-primary-container/80 shrink-0"
                      >
                        Check Valencia Leak
                      </button>
                    </div>

                    {/* Chat Input Field */}
                    <div className="p-2 border-t border-md-outline-variant flex items-center gap-1 bg-md-surface shrink-0">
                      <input 
                        type="text" 
                        disabled 
                        placeholder="Ask Assistant..." 
                        className="flex-1 bg-md-surface-variant/30 rounded-full text-[9px] px-2.5 py-1 outline-none text-md-on-surface placeholder:text-md-on-surface-variant/50"
                      />
                      <div className="p-1 rounded-full bg-md-primary text-md-on-primary">
                        <MaterialIcon name="send" className="text-[10px]" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Simulated Phone Navigation Tab Bar */}
            <div className="h-[46px] border-t border-md-outline-variant bg-md-surface flex justify-around items-center px-2 z-40 shrink-0 pb-1">
              <button 
                type="button"
                onClick={() => setPhoneTab('map')}
                className={`flex flex-col items-center gap-0.5 cursor-pointer transition-colors ${phoneTab === 'map' ? 'text-md-primary' : 'text-md-on-surface-variant/60 hover:text-md-on-surface'}`}
              >
                <MaterialIcon name="map" className="text-[16px]" filled={phoneTab === 'map'} />
                <span className="text-[8px] font-bold">Map</span>
              </button>
              <button 
                type="button"
                onClick={() => setPhoneTab('report')}
                className={`flex flex-col items-center gap-0.5 cursor-pointer transition-colors ${phoneTab === 'report' ? 'text-md-primary' : 'text-md-on-surface-variant/60 hover:text-md-on-surface'}`}
              >
                <MaterialIcon name="edit_document" className="text-[16px]" filled={phoneTab === 'report'} />
                <span className="text-[8px] font-bold">Report</span>
              </button>
              <button 
                type="button"
                onClick={() => setPhoneTab('ai')}
                className={`flex flex-col items-center gap-0.5 cursor-pointer transition-colors ${phoneTab === 'ai' ? 'text-md-primary' : 'text-md-on-surface-variant/60 hover:text-md-on-surface'}`}
              >
                <MaterialIcon name="chat_bubble" className="text-[16px]" filled={phoneTab === 'ai'} />
                <span className="text-[8px] font-bold">Ask AI</span>
              </button>
            </div>

            {/* Phone Home Bar */}
            <div className="h-3 bg-md-surface flex items-center justify-center z-50 pb-1.5 shrink-0">
              <div className="w-20 h-1 bg-md-outline-variant rounded-full" />
            </div>

          </motion.div>
        </div>

      </section>

      {/* Meaningful Real-World Neighborhood Insights Section */}
      <section className="bg-md-surface-variant/30 border-y border-md-outline-variant py-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            
            <div className="space-y-1.5 border-l-2 border-md-primary pl-5">
              <h3 className="text-2xl sm:text-3xl font-semibold text-md-on-background tracking-tight">
                <AnimatedCounter value={142} /> Resolved
              </h3>
              <p className="text-[10px] font-bold text-md-on-surface-variant uppercase tracking-wider">Active Resolutions This Week</p>
              <p className="text-xs text-md-on-surface-variant/80 leading-relaxed font-medium">
                Potholes refilled, street lights repaired, and public utility leaks successfully closed.
              </p>
            </div>

            <div className="space-y-1.5 border-l-2 border-md-secondary pl-5">
              <h3 className="text-2xl sm:text-3xl font-semibold text-md-on-background tracking-tight">
                <AnimatedCounter value={3.2} decimals={1} /> Days
              </h3>
              <p className="text-[10px] font-bold text-md-on-surface-variant uppercase tracking-wider">Average Repair Time</p>
              <p className="text-xs text-md-on-surface-variant/80 leading-relaxed font-medium">
                Average duration elapsed from initial neighbor report to verified city repair.
              </p>
            </div>

            <div className="space-y-1.5 border-l-2 border-[#137333] pl-5">
              <h3 className="text-2xl sm:text-3xl font-semibold text-md-on-background tracking-tight">
                <AnimatedCounter value={98} suffix="%" /> Accuracy
              </h3>
              <p className="text-[10px] font-bold text-md-on-surface-variant uppercase tracking-wider">Neighborhood Verified</p>
              <p className="text-xs text-md-on-surface-variant/80 leading-relaxed font-medium">
                Reports verified by adjacent residents to ensure municipal dispatchers route correctly.
              </p>
            </div>

            <div className="space-y-1.5 border-l-2 border-amber-600 pl-5">
              <h3 className="text-2xl sm:text-3xl font-semibold text-md-on-background tracking-tight">
                <AnimatedCounter value={2450} /> Connected
              </h3>
              <p className="text-[10px] font-bold text-md-on-surface-variant uppercase tracking-wider">Active District Residents</p>
              <p className="text-xs text-md-on-surface-variant/80 leading-relaxed font-medium">
                San Francisco neighbors collaborating to keep community infrastructure operating.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Core Platform Modules Grid (Consistent Spacing, Clean White Cards) */}
      <section className="bg-md-background py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-12">
          
          <div className="max-w-3xl space-y-2">
            <span className="text-xs font-bold uppercase text-md-primary tracking-wider block">
              Civic Platform Features
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-md-on-background">
              Six simple services designed for transparent local action.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Neighborhood Health Score',
                description: 'Understand local public lighting levels, sidewalk conditions, and utility status metrics at a single glance.',
                category: 'District Index',
                icon: 'health_and_safety',
                colorBg: 'bg-md-primary-container/30',
                colorIcon: 'text-md-primary',
                path: '/health-score'
              },
              {
                title: 'Predictive Infrastructure Alerts',
                description: 'Receive notifications on scheduled repairs, pipe inspections, and light outages before they impact your commute.',
                category: 'Smart Care',
                icon: 'notifications_active',
                colorBg: 'bg-amber-100/40 dark:bg-amber-950/20',
                colorIcon: 'text-amber-700 dark:text-amber-400',
                path: '/risk-engine'
              },
              {
                title: 'Community Activity Feed',
                description: 'Browse reported concerns near you. Comment, attach photo evidence, and upvote reports to help prioritize repairs.',
                category: 'Peer Verification',
                icon: 'forum',
                colorBg: 'bg-md-secondary-container/30',
                colorIcon: 'text-md-secondary',
                path: '/community-feed'
              },
              {
                title: 'Interactive Live Map',
                description: 'Explore verified coordinates on a digital vector map featuring consensus boundaries and active repair teams.',
                category: 'Geospatial Map',
                icon: 'map',
                colorBg: 'bg-emerald-100/40 dark:bg-emerald-950/20',
                colorIcon: 'text-emerald-700 dark:text-emerald-400',
                path: '/community-map'
              },
              {
                title: 'Real-time Civic Dashboards',
                description: 'Track district repair response curves, historical resolution rates, and volunteer activity stats easily.',
                category: 'Digital Twin Model',
                icon: 'analytics',
                colorBg: 'bg-md-primary-container/30',
                colorIcon: 'text-md-primary',
                path: '/digital-twin'
              },
              {
                title: 'Civic AI Assistant',
                description: 'Converse with the local district assistant to quickly draft reports, find municipal ordinances, or check scheduled works.',
                category: 'Intelligence Core',
                icon: 'chat_sparkle',
                colorBg: 'bg-purple-100/40 dark:bg-purple-950/20',
                colorIcon: 'text-purple-700 dark:text-purple-400',
                path: '/ai-assistant'
              }
            ].map((module, idx) => {
              return (
                <M3Card 
                  key={idx}
                  variant="outlined"
                  hoverable={true}
                  onClick={() => navigate(module.path)}
                  className="p-5 flex flex-col justify-between cursor-pointer group bg-md-surface hover:border-md-primary/20 hover:bg-md-primary-container/5"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-md-on-surface-variant/70 uppercase tracking-wider">
                        {module.category}
                      </span>
                      <div className={`p-1.5 rounded-xl ${module.colorBg} ${module.colorIcon} flex items-center justify-center`}>
                        <MaterialIcon name={module.icon} className="text-[18px] w-4.5 h-4.5 flex items-center justify-center" />
                      </div>
                    </div>

                    <h4 className="text-base font-bold text-md-on-surface">
                      {module.title}
                    </h4>
                    
                    <p className="text-xs text-md-on-surface-variant leading-relaxed">
                      {module.description}
                    </p>
                  </div>

                  <div className="flex justify-end items-center pt-4 mt-auto">
                    <span className="text-[10px] font-bold text-md-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                      <span>Open Tool</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </M3Card>
              );
            })}
          </div>

        </div>
      </section>

      {/* Refined Google-style Footer */}
      <footer className="bg-md-surface border-t border-md-outline-variant/60 py-10 text-center text-xs text-md-on-surface-variant">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-4">
          <div className="flex items-center justify-center gap-2">
            <span className="font-bold text-md-on-surface text-sm">Urban Mind</span>
            <span className="text-md-outline-variant">•</span>
            <span>Dolores District Civic Portal</span>
          </div>
          <div className="flex flex-wrap justify-center gap-5 text-md-on-surface-variant/80 font-medium">
            <Link to="/dashboard" className="hover:text-md-primary transition-colors">Dashboard Console</Link>
            <Link to="/community-feed" className="hover:text-md-primary transition-colors">Recent Activity</Link>
            <Link to="/community-map" className="hover:text-md-primary transition-colors">Interactive Map</Link>
            <Link to="/signup" className="hover:text-md-primary transition-colors">Register Account</Link>
          </div>
          <p className="text-[10px] text-md-on-surface-variant/60 leading-relaxed max-w-md mx-auto pt-2">
            Urban Mind is designed and built following Material Design 3 guidelines. Designed exclusively for neighborhood connection and civic reporting efficiency.
          </p>
        </div>
      </footer>

    </motion.div>
  );
}
