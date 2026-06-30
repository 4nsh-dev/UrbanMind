import React, { useState } from 'react';
import { Search, AlertCircle, Users, CheckCircle, Award, Sparkles } from 'lucide-react';

interface LandingHeroProps {
  onReportClick: () => void;
  onExploreClick: () => void;
  onSearch: (query: string) => void;
  stats: {
    reported: number;
    resolved: number;
    volunteers: number;
    impactScore: number;
  };
}

export default function LandingHero({ onReportClick, onExploreClick, onSearch, stats }: LandingHeroProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <div className="relative overflow-hidden bg-radial from-slate-50 to-neutral-100 py-16 px-4 sm:px-6 lg:px-8">
      {/* Dynamic Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Text Content */}
          <div className="lg:col-span-7 space-y-8 text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Civic Intelligence Network • Powered by Gemini AI</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-sans font-extrabold text-neutral-900 tracking-tight leading-tight">
              Be the <span className="text-[#4285F4]">Hero</span> Your <span className="text-[#34A853]">Community</span> Deserves
            </h1>

            <p className="text-lg text-neutral-600 max-w-2xl leading-relaxed">
              Report local hazards like potholes, water leaks, or broken streetlights. Your smartphone and our AI scanning platform route reports straight to municipal workers, keeping your city safe, clean, and vibrant.
            </p>

            {/* Google Search Style Omni-bar */}
            <form onSubmit={handleSearchSubmit} className="max-w-xl">
              <div className="relative flex items-center bg-white rounded-full shadow-lg border border-neutral-200 p-1 hover:shadow-xl transition-all duration-300">
                <Search className="w-5 h-5 ml-4 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search reported issues, street names, or zip codes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 text-neutral-700 bg-transparent focus:outline-none placeholder-neutral-400 text-sm"
                />
                <button
                  type="submit"
                  className="bg-[#4285F4] hover:bg-blue-600 text-white text-sm font-medium px-6 py-3.5 rounded-full transition-all duration-200 active:scale-95 cursor-pointer"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Dual CTA Buttons */}
            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={onReportClick}
                className="bg-[#34A853] hover:bg-green-600 text-white font-medium px-8 py-4 rounded-full shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <AlertCircle className="w-5 h-5" />
                Report an Issue
              </button>
              <button
                onClick={onExploreClick}
                className="bg-white hover:bg-neutral-50 text-neutral-800 font-medium px-8 py-4 rounded-full border border-neutral-300 shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
              >
                Explore Live Map
              </button>
            </div>
          </div>

          {/* Connected City SVG Illustration */}
          <div className="lg:col-span-5 flex justify-center z-10">
            <div className="relative w-full max-w-md aspect-square bg-white rounded-[2rem] shadow-xl border border-neutral-100 p-6 flex flex-col justify-center items-center overflow-hidden">
              <svg viewBox="0 0 400 400" className="w-full h-full select-none">
                {/* Sky & Clouds */}
                <path d="M 20 60 Q 40 40 60 60 T 100 60" fill="none" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
                <path d="M 300 80 Q 320 60 340 80 T 380 80" fill="none" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
                
                {/* Sun */}
                <circle cx="80" cy="90" r="28" fill="#FEE2E2" opacity="0.3" />
                <circle cx="80" cy="90" r="20" fill="#FBBC05" />

                {/* Hills / Background Greenery */}
                <path d="M -20 320 Q 120 220 280 320 T 420 320 L 400 400 L 0 400 Z" fill="#F0FDF4" />
                <path d="M 120 340 Q 240 260 380 340 L 400 400 L 120 400 Z" fill="#DCFCE7" />

                {/* Roads */}
                <path d="M 0 320 L 400 320" stroke="#CBD5E1" strokeWidth="20" />
                <path d="M 0 320 L 400 320" stroke="#94A3B8" strokeWidth="16" />
                <path d="M 10 320 L 390 320" stroke="#FFF" strokeWidth="2" strokeDasharray="10 12" />

                {/* Buildings / Houses */}
                {/* School/City Hall */}
                <rect x="140" y="210" width="120" height="100" rx="8" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="3" />
                <path d="M 130 210 L 200 170 L 270 210 Z" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="3" />
                <circle cx="200" cy="195" r="8" fill="#F59E0B" />
                {/* Windows on City Hall */}
                <rect x="155" y="225" width="20" height="25" rx="4" fill="#3B82F6" opacity="0.2" />
                <rect x="185" y="225" width="20" height="25" rx="4" fill="#3B82F6" opacity="0.2" />
                <rect x="215" y="225" width="20" height="25" rx="4" fill="#3B82F6" opacity="0.2" />
                {/* Door */}
                <rect x="185" y="270" width="30" height="40" rx="3" fill="#3B82F6" />

                {/* Small Eco-House */}
                <rect x="60" y="240" width="60" height="70" rx="6" fill="#F0FDFA" stroke="#14B8A6" strokeWidth="3" />
                <polygon points="50,240 90,210 130,240" fill="#CCFBF1" stroke="#14B8A6" strokeWidth="3" />
                <rect x="75" y="260" width="14" height="14" rx="2" fill="#E0F2FE" />
                <rect x="95" y="280" width="16" height="30" rx="1" fill="#0D9488" />

                {/* Modern Apartment / Condo */}
                <rect x="280" y="160" width="65" height="150" rx="10" fill="#FFFBEB" stroke="#F59E0B" strokeWidth="3" />
                <rect x="295" y="180" width="14" height="20" rx="2" fill="#FEF3C7" />
                <rect x="315" y="180" width="14" height="20" rx="2" fill="#FEF3C7" />
                <rect x="295" y="215" width="14" height="20" rx="2" fill="#FEF3C7" />
                <rect x="315" y="215" width="14" height="20" rx="2" fill="#FEF3C7" />
                <rect x="295" y="250" width="14" height="20" rx="2" fill="#FEF3C7" />
                <rect x="315" y="250" width="14" height="20" rx="2" fill="#FEF3C7" />

                {/* Spinning Wind Turbine (Smart Grid) */}
                <line x1="100" y1="210" x2="100" y2="150" stroke="#64748B" strokeWidth="4" />
                <circle cx="100" cy="150" r="4" fill="#475569" />
                {/* Propellers */}
                <path d="M 100 150 Q 110 130 115 110" fill="none" stroke="#64748B" strokeWidth="3" strokeLinecap="round" />
                <path d="M 100 150 Q 80 150 63 155" fill="none" stroke="#64748B" strokeWidth="3" strokeLinecap="round" />
                <path d="M 100 150 Q 110 170 123 185" fill="none" stroke="#64748B" strokeWidth="3" strokeLinecap="round" />

                {/* Animated Smart WiFi Signal Loops */}
                <path d="M 200 135 A 40 40 0 0 0 160 160" fill="none" stroke="#60A5FA" strokeWidth="2" strokeDasharray="4 4" />
                <path d="M 200 120 A 60 60 0 0 0 140 160" fill="none" stroke="#93C5FD" strokeWidth="2" strokeDasharray="4 4" />

                {/* Pothole / Issue Alert Pin hovering */}
                <path d="M 160 140 Q 165 125 170 140 Q 170 140 165 150 Z" fill="#EF4444" />
                <circle cx="165" cy="138" r="2.5" fill="#FFF" />

                {/* Green Tree */}
                <circle cx="45" cy="290" r="16" fill="#22C55E" />
                <circle cx="35" cy="305" r="12" fill="#16A34A" />
                <rect x="38" y="305" width="6" height="15" fill="#78350F" />

                {/* Connected Network Dots bridging buildings */}
                <line x1="90" y1="210" x2="140" y2="210" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="3 3" />
                <line x1="260" y1="210" x2="280" y2="210" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="3 3" />
              </svg>

              {/* Floating micro indicators */}
              <div className="absolute top-8 right-8 bg-green-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white block" />
                Smart City Live
              </div>
            </div>
          </div>

        </div>

        {/* Live Statistics Cards */}
        <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-orange-50 text-[#FBBC05] group-hover:scale-110 transition-transform">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-500">Issues Filed</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.reported}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-green-50 text-[#34A853] group-hover:scale-110 transition-transform">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-500">Incidents Solved</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.resolved}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-50 text-[#4285F4] group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-500">Volunteers Joined</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.volunteers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-red-50 text-[#EA4335] group-hover:scale-110 transition-transform">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-neutral-500">City Impact Index</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-bold text-neutral-900">{stats.impactScore}%</p>
                  <span className="text-xs font-semibold text-green-600">▲ Solid</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
