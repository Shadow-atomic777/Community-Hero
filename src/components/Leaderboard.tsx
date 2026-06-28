import React from "react";
import { Trophy, Award, Target, Star, ChevronRight, Sparkles, UserCheck, Flame } from "lucide-react";
import { UserProfile, LeaderboardUser } from "../types";

interface LeaderboardProps {
  userProfile: UserProfile;
  leaderboard: LeaderboardUser[];
}

const BADGES_DETAILS = [
  {
    name: "Civic Sentinel",
    desc: "Created your account and filed your first verification vote",
    color: "from-blue-500 to-indigo-600",
    iconColor: "text-blue-100"
  },
  {
    name: "Pothole Ranger",
    desc: "Earned 50 points by helping map and patch regional road hazards",
    color: "from-amber-500 to-orange-600",
    iconColor: "text-amber-100"
  },
  {
    name: "Eco Warrior",
    desc: "Earned 100 points through collaborative public waste resolution",
    color: "from-emerald-500 to-teal-600",
    iconColor: "text-emerald-100"
  },
  {
    name: "Beacon of Light",
    desc: "Earned 150 points cataloguing and coordinating streetlight outages",
    color: "from-yellow-400 to-amber-500",
    iconColor: "text-yellow-100"
  }
];

export default function Leaderboard({ userProfile, leaderboard }: LeaderboardProps) {
  // Simple Level calculation: 50 points per level
  const pointsPerLevel = 50;
  const currentLevel = Math.floor(userProfile.points / pointsPerLevel) + 1;
  const currentLevelPoints = userProfile.points % pointsPerLevel;
  const progressPercent = Math.min((currentLevelPoints / pointsPerLevel) * 100, 100);

  return (
    <div className="space-y-6" id="gamification-hub">
      
      {/* User profile & level progress banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-brand-950/40 text-white rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-4">
          <img
            src={userProfile.avatarUrl}
            alt={userProfile.displayName}
            className="w-14 h-14 rounded-full border-2 border-brand-400 object-cover shadow-md"
          />
          <div className="flex-1">
            <span className="text-[10px] text-brand-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Active Local Citizen
            </span>
            <h4 className="text-base font-bold text-white tracking-tight">{userProfile.displayName}</h4>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-[10px] font-mono text-slate-300 font-bold bg-slate-800 border border-slate-700/80 px-2.5 py-0.5 rounded-full">
                POINTS: <span className="text-brand-400">{userProfile.points}</span>
              </span>
              <span className="text-[10px] font-mono text-slate-300 font-bold bg-slate-800 border border-slate-700/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                STREAK: 5 DAYS
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase">LEVEL</span>
            <div className="text-4xl font-black text-brand-400 leading-none">{currentLevel}</div>
          </div>
        </div>

        {/* Level progress bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-[10px] font-semibold text-slate-300">
            <span>Next Level progress</span>
            <span>{currentLevelPoints} / {pointsPerLevel} XP</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Trophies Badge Shelf */}
      <div className="bg-card-bg border border-border-color rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-border-color pb-3">
          <Award className="w-4.5 h-4.5 text-brand-600" />
          <h4 className="text-xs font-bold text-text-main uppercase tracking-wider">Civic Badge Cabinet</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BADGES_DETAILS.map((badge, idx) => {
            const hasBadge = userProfile.badges.includes(badge.name);
            return (
              <div
                key={idx}
                className={`border rounded-xl p-3.5 flex gap-3 transition-all ${
                  hasBadge
                    ? "bg-canvas-bg border-border-color"
                    : "bg-canvas-bg/20 border-border-color/40 opacity-50 filter grayscale"
                }`}
              >
                <div className={`p-2 rounded-xl bg-gradient-to-br ${badge.color} text-white shrink-0 shadow`}>
                  <Trophy className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-text-main leading-tight">{badge.name}</span>
                    {hasBadge && (
                      <span className="text-[8px] bg-brand-100 text-brand-800 font-bold px-1.5 py-0.25 rounded-full uppercase">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-text-muted mt-1 leading-snug font-medium">{badge.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leaderboard ranking list */}
      <div className="bg-card-bg border border-border-color rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-border-color pb-3">
          <Trophy className="w-4.5 h-4.5 text-brand-600" />
          <h4 className="text-xs font-bold text-text-main uppercase tracking-wider">Top Regional Heroes</h4>
        </div>

        <div className="space-y-2.5">
          {leaderboard.map((user, idx) => {
            const isSelf = user.uid === userProfile.uid;
            return (
              <div
                key={user.uid}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isSelf
                    ? "bg-brand-50/60 border-brand-300 ring-1 ring-brand-100 shadow-sm"
                    : "bg-canvas-bg border-border-color hover:border-brand-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Rank Placement */}
                  <div className="w-7 text-center">
                    {user.rank === 1 ? (
                      <span className="text-lg">🥇</span>
                    ) : user.rank === 2 ? (
                      <span className="text-lg">🥈</span>
                    ) : user.rank === 3 ? (
                      <span className="text-lg">🥉</span>
                    ) : (
                      <span className="text-xs font-mono font-bold text-text-muted">#{user.rank}</span>
                    )}
                  </div>

                  {/* Avatar & Display name */}
                  <img src={user.avatarUrl} alt={user.displayName} className="w-9 h-9 rounded-full object-cover border border-border-color" />
                  <div>
                    <h5 className="text-xs font-bold text-text-main flex items-center gap-1.5">
                      {user.displayName}
                      {isSelf && (
                        <span className="text-[8px] bg-brand-100 text-brand-700 font-bold px-1.5 py-0.5 rounded-full uppercase">
                          You
                        </span>
                      )}
                    </h5>
                    <span className="text-[9px] text-text-muted font-semibold">{user.badgesCount} badge{user.badgesCount !== 1 ? "s" : ""} unlocked</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-text-main font-mono">{user.points}</span>
                  <span className="block text-[8px] text-text-muted font-bold uppercase tracking-wider">POINTS</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly quests / cooperative missions */}
      <div className="bg-card-bg border border-border-color rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-border-color pb-3">
          <Target className="w-4.5 h-4.5 text-brand-600" />
          <h4 className="text-xs font-bold text-text-main uppercase tracking-wider">Weekly Cooperative Quests</h4>
        </div>

        <div className="space-y-3">
          <div className="bg-canvas-bg border border-border-color rounded-xl p-3.5 space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-indigo-400 uppercase">MUNICIPAL CLEANUP SPRINT</span>
              <span className="text-[9px] text-text-muted font-semibold">Ends in 3 days</span>
            </div>
            <div>
              <span className="block text-xs font-bold text-text-main">Operation: Zero Potholes</span>
              <p className="text-[10px] text-text-muted mt-1 font-medium leading-relaxed">
                As a community, report or verify 5 active pothole coordinates to trigger rapid municipal tarmac operations.
              </p>
            </div>
            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-bold text-text-muted">
                <span>Total community reports</span>
                <span>3 / 5 reports</span>
              </div>
              <div className="h-1.5 bg-border-color rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 w-[60%]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
