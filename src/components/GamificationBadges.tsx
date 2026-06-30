import React from 'react';
import { Achievement, LeaderboardUser } from '../types';
import { Award, Zap, ShieldCheck, Trophy, Target, Star, Flame, UserCheck, Activity, Users, Radio, Droplet } from 'lucide-react';

interface GamificationBadgesProps {
  achievements: Achievement[];
  leaderboard: LeaderboardUser[];
  userPoints: number;
}

// Icon mapper for achievements
const ICON_MAP: Record<string, any> = {
  Radio: Radio,
  ShieldCheck: ShieldCheck,
  Activity: Activity,
  Award: Award,
  Droplet: Droplet
};

export default function GamificationBadges({ achievements, leaderboard, userPoints }: GamificationBadgesProps) {
  const currentXP = userPoints % 1000;
  const level = Math.floor(userPoints / 1000) + 1;
  const xpNeeded = 1000;
  const percentage = (currentXP / xpNeeded) * 100;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in text-left">
      
      {/* Upper overview section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* User XP stats circle badge */}
        <div className="lg:col-span-4 bg-white rounded-[2rem] border border-neutral-200/80 shadow-sm p-6 flex flex-col justify-between space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-[#4285F4] rounded-2xl">
              <Star className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-500">Your Civic Level</h3>
              <p className="text-xs text-neutral-400">Google Play Games-inspired Rank</p>
            </div>
          </div>

          {/* Large Ring showing the Level progress */}
          <div className="flex flex-col items-center justify-center py-4 relative">
            <svg className="w-36 h-36 transform -rotate-95">
              {/* Slate background track circle */}
              <circle
                cx="72"
                cy="72"
                r="64"
                strokeWidth="10"
                stroke="#F1F5F9"
                fill="transparent"
              />
              {/* Concentric progress tracker */}
              <circle
                cx="72"
                cy="72"
                r="64"
                strokeWidth="10"
                stroke="#34A853" // Green
                fill="transparent"
                strokeDasharray={2 * Math.PI * 64}
                strokeDashoffset={2 * Math.PI * 64 * (1 - percentage / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-extrabold text-neutral-900 tracking-tight">Lvl {level}</span>
              <span className="text-[10px] font-bold text-neutral-500 mt-0.5">{userPoints} Total XP</span>
            </div>
          </div>

          {/* Level description and XP metrics */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-neutral-600">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                Active Civic Warden
              </span>
              <span>{currentXP}/{xpNeeded} XP</span>
            </div>
            {/* Linear backup gauge */}
            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="text-[10px] text-neutral-400 font-medium">Earn +{xpNeeded - currentXP} XP to level up! Filings earn 100 XP, verified upvotes earn 25 XP each.</p>
          </div>
        </div>

        {/* Level leaderboard table roster */}
        <div className="lg:col-span-8 bg-white rounded-[2rem] border border-neutral-200/80 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-yellow-50 text-[#FBBC05] rounded-xl">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-800">Urban Mind Standings</h3>
                <p className="text-xs text-neutral-400">Real-time leadership scoreboard</p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold uppercase bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
              🏆 Oakwood District
            </span>
          </div>

          {/* Scores list */}
          <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 mt-2">
            {leaderboard.map((user, idx) => {
              const isTop = user.rank <= 3;
              const ranksIcon = user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : user.rank === 3 ? '🥉' : null;

              return (
                <div key={user.id} className="py-3 flex items-center justify-between hover:bg-neutral-50/50 rounded-xl px-2 transition-all">
                  <div className="flex items-center gap-3">
                    {/* Rank indices */}
                    <div className="w-6 text-center">
                      {ranksIcon ? (
                        <span className="text-lg">{ranksIcon}</span>
                      ) : (
                        <span className="text-xs font-extrabold text-neutral-400">{user.rank}</span>
                      )}
                    </div>
                    {/* Avatar */}
                    <img
                      src={user.avatar}
                      alt={user.name}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full bg-neutral-150 border border-neutral-200"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                        {user.name}
                        {user.rank === 1 && (
                          <span className="text-[9px] bg-yellow-150 text-yellow-800 px-1.5 py-0.2 rounded font-extrabold">CHIEF</span>
                        )}
                      </h4>
                      <p className="text-[10px] text-neutral-400 font-semibold flex gap-3">
                        <span>📋 {user.reportsCount} Reports Filed</span>
                        <span>🛡️ {user.verifiedCount} Verifications</span>
                      </p>
                    </div>
                  </div>

                  {/* XP Points badges */}
                  <div className="text-right">
                    <span className="text-xs font-black text-[#4285F4] block">{user.reputation} XP</span>
                    <span className="text-[9px] font-bold text-green-600 block">▲ Active Contributor</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Play Games Achievement Grid and badges */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-50 text-[#34A853] rounded-xl">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-800">Achievements Hub</h3>
            <p className="text-xs text-neutral-400">Unlock community badges and civic tokens</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map(ach => {
            const IconComponent = ICON_MAP[ach.icon] || Award;
            const progressPct = (ach.progress / ach.maxProgress) * 100;

            return (
              <div
                key={ach.id}
                className={`bg-white rounded-2xl border p-5 space-y-4 transition-all shadow-sm hover:shadow-md relative overflow-hidden group ${
                  ach.unlocked ? 'border-neutral-250/70' : 'border-neutral-200 opacity-80'
                }`}
              >
                {/* Decorative radial gradient highlight if unlocked */}
                {ach.unlocked && (
                  <div
                    className="absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-10 pointer-events-none group-hover:scale-125 transition-transform"
                    style={{ backgroundColor: ach.color }}
                  />
                )}

                <div className="flex items-start gap-4 text-left">
                  {/* Badge visual icon circle */}
                  <div
                    className="p-3.5 rounded-2xl text-white shrink-0 shadow-sm"
                    style={{ backgroundColor: ach.unlocked ? ach.color : '#94A3B8' }}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-black text-neutral-800">{ach.title}</h4>
                      {ach.unlocked ? (
                        <span className="text-[8px] font-sans font-extrabold bg-green-50 text-green-700 border border-green-100 px-1.5 py-0.2 rounded uppercase">
                          UNLOCKED
                        </span>
                      ) : (
                        <span className="text-[8px] font-sans font-extrabold bg-slate-100 text-slate-500 border border-neutral-200 px-1.5 py-0.2 rounded uppercase">
                          LOCKED
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 leading-relaxed font-semibold">
                      {ach.description}
                    </p>
                  </div>
                </div>

                {/* Achievement slider metrics */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest">
                    <span>Progress Tracker</span>
                    <span>{ach.progress}/{ach.maxProgress}</span>
                  </div>
                  {/* Progress Line */}
                  <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${progressPct}%`,
                        backgroundColor: ach.unlocked ? ach.color : '#94A3B8'
                      }}
                    />
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
