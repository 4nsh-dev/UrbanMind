import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { pageVariants } from '../utils/motion';
import { LEADERBOARD_USERS } from '../data';
import { Award, Trophy, Star, ArrowUpRight, Shield, Medal, Sparkles } from 'lucide-react';

interface LeaderboardProps {
  userPoints: number;
  userName: string;
}

export default function Leaderboard({ userPoints, userName }: LeaderboardProps) {
  const navigate = useNavigate();

  // Sort and inject current user into leaderboard simulation
  const currentUserObj = {
    id: 'user-current',
    name: userName,
    reputation: userPoints,
    reportsCount: 4,
    verifiedCount: 12,
    avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=active',
    rank: 0, // calculated below
  };

  const sortedLeaderboard = [...LEADERBOARD_USERS, currentUserObj]
    .sort((a, b) => b.reputation - a.reputation)
    .map((usr, index) => ({
      ...usr,
      rank: index + 1
    }));

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
        <div className="md:col-span-12 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-sans font-extrabold text-neutral-900 tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <span>Citizen Honor Roll</span>
          </h1>
          <p className="text-xs text-neutral-500">
            Acknowledge the community leaders validating, reporting, and supporting the SF metropolitan infrastructure.
          </p>
        </div>

        <div className="bg-white px-4 py-2 border border-neutral-200 shadow-3xs rounded-2xl flex items-center gap-2 text-xs">
          <Medal className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold text-neutral-600">Your Current Rep: </span>
          <span className="font-black text-neutral-950 font-mono">{userPoints} XP</span>
        </div>
      </div>

        {/* Podium layout for top 3 */}
        <div className="md:col-span-12 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 items-end">
        
        {/* Second Place */}
        {sortedLeaderboard[1] && (
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 text-center order-2 sm:order-1 relative shadow-3xs">
            <div className="absolute top-4 left-4 bg-slate-100 text-slate-850 w-7 h-7 rounded-lg font-mono font-black text-xs flex items-center justify-center">
              2
            </div>
            
            <div className="space-y-3.5">
              <img 
                src={sortedLeaderboard[1].avatar} 
                className="w-16 h-16 rounded-full border-2 border-neutral-250 mx-auto bg-neutral-50 pointer-events-none select-none" 
                alt="" 
                referrerPolicy="no-referrer"
              />
              <div>
                <h4 className="text-sm font-bold text-neutral-850 truncate">{sortedLeaderboard[1].name}</h4>
                <p className="text-[11px] text-neutral-400 font-semibold uppercase font-mono mt-0.5">{sortedLeaderboard[1].reputation} XP</p>
              </div>
            </div>
            
            <div className="mt-4 pt-3.5 border-t border-neutral-100 flex justify-around text-[10px] text-neutral-500">
              <div>
                <p className="font-black text-neutral-900">{sortedLeaderboard[1].reportsCount}</p>
                <p className="font-semibold">Reports</p>
              </div>
              <div className="border-l border-neutral-100 h-6" />
              <div>
                <p className="font-black text-neutral-900">{sortedLeaderboard[1].verifiedCount}</p>
                <p className="font-semibold">Verified</p>
              </div>
            </div>
          </div>
        )}

        {/* First Place */}
        {sortedLeaderboard[0] && (
          <div className="bg-gradient-to-b from-yellow-50 to-white border-2 border-yellow-300 rounded-3xl p-8 text-center order-1 sm:order-2 shadow-sm relative scale-100 sm:scale-105">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-white w-9 h-9 rounded-full font-black text-sm flex items-center justify-center border-4 border-white shadow-md animate-bounce">
              👑
            </div>
            
            <div className="space-y-4 pt-2">
              <img 
                src={sortedLeaderboard[0].avatar} 
                className="w-20 h-20 rounded-full border-2 border-yellow-400 mx-auto bg-yellow-100/50 pointer-events-none select-none" 
                alt="" 
                referrerPolicy="no-referrer"
              />
              <div>
                <h3 className="text-base font-black text-neutral-900 truncate">{sortedLeaderboard[0].name}</h3>
                <p className="text-xs text-yellow-600 font-black uppercase font-mono mt-0.5">
                  <Star className="w-3.5 h-3.5 text-yellow-500 inline mr-0.5" />
                  <span>{sortedLeaderboard[0].reputation} XP</span>
                </p>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-neutral-150 flex justify-around text-[11px] text-neutral-600">
              <div>
                <p className="font-black text-neutral-900">{sortedLeaderboard[0].reportsCount}</p>
                <p className="font-semibold">Reports</p>
              </div>
              <div className="border-l border-neutral-150 h-8" />
              <div>
                <p className="font-black text-neutral-900">{sortedLeaderboard[0].verifiedCount}</p>
                <p className="font-semibold">Verified</p>
              </div>
            </div>
          </div>
        )}

        {/* Third Place */}
        {sortedLeaderboard[2] && (
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 text-center order-3 relative shadow-3xs">
            <div className="absolute top-4 left-4 bg-orange-50 text-orange-850 w-7 h-7 rounded-lg font-mono font-black text-xs flex items-center justify-center">
              3
            </div>
            
            <div className="space-y-3.5">
              <img 
                src={sortedLeaderboard[2].avatar} 
                className="w-16 h-16 rounded-full border-2 border-neutral-250 mx-auto bg-neutral-50 pointer-events-none select-none" 
                alt="" 
                referrerPolicy="no-referrer"
              />
              <div>
                <h4 className="text-sm font-bold text-neutral-850 truncate">{sortedLeaderboard[2].name}</h4>
                <p className="text-[11px] text-neutral-400 font-semibold uppercase font-mono mt-0.5">{sortedLeaderboard[2].reputation} XP</p>
              </div>
            </div>
            
            <div className="mt-4 pt-3.5 border-t border-neutral-100 flex justify-around text-[10px] text-neutral-500">
              <div>
                <p className="font-black text-neutral-900">{sortedLeaderboard[2].reportsCount}</p>
                <p className="font-semibold">Reports</p>
              </div>
              <div className="border-l border-neutral-100 h-6" />
              <div>
                <p className="font-black text-neutral-900">{sortedLeaderboard[2].verifiedCount}</p>
                <p className="font-semibold">Verified</p>
              </div>
            </div>
          </div>
        )}

      </div>

        {/* Leaderboard Table List */}
        <div className="md:col-span-12 bg-white border border-neutral-200 rounded-3xl shadow-3xs overflow-hidden">
        <div className="p-5 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
          <span className="text-xs font-extrabold text-neutral-500 uppercase tracking-wider">All Active Citizens</span>
          <span className="text-xs text-neutral-400 font-medium">Updated live</span>
        </div>

        <div className="divide-y divide-neutral-100">
          {sortedLeaderboard.map((usr) => {
            const isSelf = usr.id === 'user-current';
            
            return (
              <div 
                key={usr.id}
                className={`p-4 flex items-center justify-between transition-colors ${
                  isSelf ? 'bg-indigo-50/50' : 'hover:bg-neutral-50/45'
                }`}
              >
                {/* User info */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-6 text-center text-xs font-black font-mono text-neutral-400">
                    {usr.rank}
                  </div>
                  
                  <img 
                    src={usr.avatar} 
                    className={`w-9 h-9 rounded-full border shrink-0 bg-neutral-100 pointer-events-none select-none ${
                      isSelf ? 'border-indigo-400' : 'border-neutral-200'
                    }`} 
                    alt="" 
                    referrerPolicy="no-referrer"
                  />
                  
                  <div className="min-w-0">
                    <p className={`text-xs font-bold leading-none ${isSelf ? 'text-indigo-950 flex items-center gap-1' : 'text-neutral-850'}`}>
                      <span>{usr.name}</span>
                      {isSelf && (
                        <span className="text-[8px] uppercase tracking-wide bg-indigo-600 text-white font-extrabold px-1.5 py-0.2 rounded-full scale-95">You</span>
                      )}
                    </p>
                    <p className="text-[10px] text-neutral-400 mt-1">
                      {usr.reportsCount} Reports Filed • {usr.verifiedCount} Verifications
                    </p>
                  </div>
                </div>

                {/* Points count */}
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold font-mono ${isSelf ? 'text-indigo-700 font-black' : 'text-neutral-700'}`}>
                    {usr.reputation} XP
                  </span>
                  
                  <ArrowUpRight className="w-3.5 h-3.5 text-neutral-300" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      </div>
    </motion.div>
  );
}
