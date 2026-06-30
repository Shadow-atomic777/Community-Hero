import React, { useState, useEffect } from "react";
import {
  Map,
  Trophy,
  Sparkles,
  Plus,
  HelpCircle,
  Activity,
  Compass,
  Flame,
  ShieldAlert,
  Heart,
  RefreshCcw,
  Palette,
  Info,
  X,
  CheckCircle,
  MessageSquare,
  Users,
  Search,
  Bell,
  Award,
  ChevronRight,
  Target,
  LogIn,
  Menu,
  Clock
} from "lucide-react";
import { dbService } from "./lib/dbService";
import { Report, UserProfile, LeaderboardUser } from "./types";
import MapCanvas from "./components/MapCanvas";
import ActiveFeed from "./components/ActiveFeed";
import ReportModal from "./components/ReportModal";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import Leaderboard from "./components/Leaderboard";
import FirebaseInitBanner from "./components/FirebaseInitBanner";
import ProfileEditModal from "./components/ProfileEditModal";
import SignInSignUpModal from "./components/SignInSignUpModal";
import { auth } from "./lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

function formatTimeAgo(timestamp: string | number): string {
  const ts = typeof timestamp === "string" ? parseInt(timestamp, 10) : timestamp;
  if (!ts || isNaN(ts)) return "Just now";
  const diff = Date.now() - ts;
  if (diff < 60000) return "Just now";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"radar" | "feed" | "analytics" | "leaderboard">("feed");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [reports, setReports] = useState<Report[]>([]);
  const [showGuide, setShowGuide] = useState(() => {
    return localStorage.getItem("civic-guide-dismissed") !== "true";
  });

  const handleDismissGuide = () => {
    setShowGuide(false);
    localStorage.setItem("civic-guide-dismissed", "true");
  };

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>(dbService.getOrCreateProfile());
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [clickedCoords, setClickedCoords] = useState<{ lat: number; lng: number; address: string } | null>(null);
  
  // Theme system state
  const [theme, setTheme] = useState<"emerald" | "cosmic" | "sunset" | "nordic">(() => {
    return (localStorage.getItem("civic-radar-theme") as any) || "emerald";
  });

  const handleThemeChange = (newTheme: "emerald" | "cosmic" | "sunset" | "nordic") => {
    setTheme(newTheme);
    localStorage.setItem("civic-radar-theme", newTheme);
  };

  // Bind theme class to document element so custom styling spreads everywhere
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-emerald", "theme-cosmic", "theme-sunset", "theme-nordic");
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  // Success alert notifications for points earned
  const [toastNotification, setToastNotification] = useState<{ text: string; points: number } | null>(null);

  // Map focus coordinates (centered on SF Civic Center by default)
  const [mapCenter, setMapCenter] = useState({ lat: 37.7749, lng: -122.4194 });

  // Dynamic Live Activity Stream Memo
  const activities = React.useMemo(() => {
    const list: Array<{ id: string; user: string; avatar: string; action: string; target: string; time: string; timestamp: number }> = [];

    // Seed initial/mock timeline items so there is always activity present
    list.push({
      id: "act-init-1",
      user: "Sarah Connor",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      action: "unlocked badge",
      target: "Civic Sentinel Level 3",
      time: "1d ago",
      timestamp: Date.now() - 24 * 60 * 60 * 1000
    });
    list.push({
      id: "act-init-2",
      user: "Marcus Wright",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      action: "verified and upvoted",
      target: "Hazardous Pothole near Crosswalk",
      time: "12h ago",
      timestamp: Date.now() - 12 * 60 * 60 * 1000
    });

    reports.forEach((report) => {
      // Determine reporter avatar
      let reporterAvatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";
      if (report.reporterId === "ai-system") {
        reporterAvatar = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80";
      } else if (report.reporterId === userProfile.uid) {
        reporterAvatar = userProfile.avatarUrl;
      } else {
        const lbMatch = leaderboard.find(u => u.uid === report.reporterId);
        if (lbMatch) {
          reporterAvatar = lbMatch.avatarUrl;
        } else {
          const hash = report.reporterId.charCodeAt(0) % 5;
          const fallbacks = [
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
            "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80"
          ];
          reporterAvatar = fallbacks[hash];
        }
      }

      // 1. Report Creation Activity
      list.push({
        id: `report-act-${report.id}`,
        user: report.reporterName,
        avatar: reporterAvatar,
        action: "reported new hazard",
        target: report.title,
        time: formatTimeAgo(report.createdAt),
        timestamp: Number(report.createdAt)
      });

      // 2. Upvote Validation Threshold
      if (report.upvoteCount >= 3) {
        list.push({
          id: `val-act-${report.id}`,
          user: "The Community",
          avatar: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=150&q=80",
          action: "verified and validated",
          target: report.title,
          time: formatTimeAgo(report.updatedAt),
          timestamp: Number(report.updatedAt) - 1000
        });
      }

      // 3. Claiming Sweeps
      if (report.status === "in_progress") {
        list.push({
          id: `claim-act-${report.id}`,
          user: "A Volunteer Hero",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
          action: "volunteered for",
          target: report.title,
          time: formatTimeAgo(report.updatedAt),
          timestamp: Number(report.updatedAt)
        });
      }

      // 4. Resolution Action
      if (report.status === "resolved") {
        list.push({
          id: `res-act-${report.id}`,
          user: report.resolvedBy || "A Civic Hero",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
          action: "resolved & closed",
          target: report.title,
          time: formatTimeAgo(report.updatedAt),
          timestamp: Number(report.updatedAt)
        });
      }

      // 5. Comments Activity
      if (report.comments && report.comments.length > 0) {
        report.comments.forEach((c) => {
          list.push({
            id: `comment-act-${c.id}`,
            user: c.authorName,
            avatar: c.authorAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
            action: "commented on",
            target: report.title,
            time: formatTimeAgo(c.createdAt),
            timestamp: Number(c.createdAt)
          });
        });
      }
    });

    // Sort by timestamp descending
    list.sort((a, b) => b.timestamp - a.timestamp);
    return list;
  }, [reports, userProfile, leaderboard]);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        const profile = await dbService.fetchUserProfileFromFirestore(user.uid);
        if (profile) {
          setUserProfile(profile);
          dbService.saveProfile(profile);
        } else {
          const localProfile = dbService.getOrCreateProfile();
          if (localProfile && localProfile.uid === user.uid) {
            await dbService.saveUserProfileToFirestore(localProfile);
            setUserProfile(localProfile);
            dbService.saveProfile(localProfile);
          } else {
            const syncedProfile = {
              ...localProfile,
              uid: user.uid,
              displayName: user.displayName || user.email?.split("@")[0] || "Hero Citizen",
              email: user.email || "hero@civic.org",
              avatarUrl: user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
              points: localProfile.points > 25 ? localProfile.points : 50,
              badges: localProfile.badges.length > 0 ? localProfile.badges : ["Civic Pioneer"],
              createdAt: localProfile.createdAt || Date.now()
            };
            await dbService.saveUserProfileToFirestore(syncedProfile);
            setUserProfile(syncedProfile);
            dbService.saveProfile(syncedProfile);
          }
        }
        const fbLeaderboard = await dbService.fetchLeaderboardFromFirestore();
        setLeaderboard(fbLeaderboard);
        
        // Lazy-sync local reports and points to Firestore
        dbService.syncLocalReportsToFirestore().catch(e => console.error("Sync reports failed:", e));
      } else {
        const isSandbox = localStorage.getItem("sandbox_authenticated") === "true";
        if (isSandbox) {
          setIsAuthenticated(true);
          const localProfile = dbService.getOrCreateProfile();
          setUserProfile(localProfile);
          setLeaderboard(dbService.getLeaderboard());
        } else {
          setIsAuthenticated(false);
          setUserProfile(dbService.getOrCreateProfile());
          setLeaderboard(dbService.getLeaderboard());
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to real-time reports in Firestore
  useEffect(() => {
    const unsubscribe = dbService.subscribeReports((syncedReports) => {
      setReports(syncedReports);
    }, mapCenter.lat, mapCenter.lng);
    return () => unsubscribe();
  }, [isAuthenticated, mapCenter.lat, mapCenter.lng]);

  // Subscribe to real-time leaderboard in Firestore
  useEffect(() => {
    const unsubscribe = dbService.subscribeLeaderboard((syncedLeaderboard) => {
      setLeaderboard(syncedLeaderboard);
    });
    return () => unsubscribe();
  }, [isAuthenticated]);

  // Load records and seed based on user's current GPS geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          setMapCenter({ lat: userLat, lng: userLng });
        },
        (error) => {
          console.log("Geolocation permission denied, using default SF center.", error);
        }
      );
    }
    setLeaderboard(dbService.getLeaderboard());
  }, []);

  const triggerToast = (text: string, points: number) => {
    setToastNotification({ text, points });
    setTimeout(() => {
      setToastNotification(null);
    }, 4500);
  };

  const logActivity = (action: string, target: string) => {
    // Handled dynamically in useMemo!
  };

  const handleReportCreated = (newReportData: Omit<Report, "id" | "createdAt" | "updatedAt" | "upvoteCount" | "upvotedBy" | "comments">) => {
    const created = dbService.addReport(newReportData);
    setReports(dbService.getReports());

    // Reward points (+10 for reporting)
    const updatedProfile = dbService.addPoints(10);
    setUserProfile(updatedProfile);
    setLeaderboard(dbService.getLeaderboard());

    logActivity("reported new hazard", newReportData.title);
    triggerToast("Issue reported successfully to Civic Radar!", 10);
    
    // Auto switch to feed view to see the new post
    setActiveTab("feed");
  };

  const handleUpvote = (reportId: string) => {
    const targetReport = reports.find(r => r.id === reportId);
    const reportTitle = targetReport ? targetReport.title : "Incident";

    const { report, pointsEarned } = dbService.upvoteReport(reportId, userProfile.uid);
    setReports(dbService.getReports());

    if (pointsEarned > 0) {
      const updatedProfile = dbService.addPoints(pointsEarned);
      setUserProfile(updatedProfile);
      setLeaderboard(dbService.getLeaderboard());
      
      logActivity("verified and upvoted", reportTitle);
      triggerToast("Neighbor verification vote logged!", pointsEarned);
    }
  };

  const handleClaim = (reportId: string) => {
    const targetReport = reports.find(r => r.id === reportId);
    const reportTitle = targetReport ? targetReport.title : "Incident";

    dbService.claimInProgress(reportId);
    setReports(dbService.getReports());
    
    logActivity("volunteered for", reportTitle);
    triggerToast("You volunteered for this repair sweep!", 0);
  };

  const handleResolve = (reportId: string, imgUrl: string) => {
    const targetReport = reports.find(r => r.id === reportId);
    const reportTitle = targetReport ? targetReport.title : "Incident";

    const { report, pointsEarned } = dbService.resolveReport(reportId, imgUrl, userProfile.uid, userProfile.displayName);
    setReports(dbService.getReports());

    // Reward points (+50 for resolving)
    const updatedProfile = dbService.addPoints(pointsEarned, "Eco Warrior");
    setUserProfile(updatedProfile);
    setLeaderboard(dbService.getLeaderboard());

    logActivity("resolved & closed", reportTitle);
    triggerToast("Thank you, Hero! Issue marked as resolved and closed.", pointsEarned);
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem("sandbox_authenticated");
      dbService.clearProfile();
      await signOut(auth);
      setIsAuthenticated(false);
      setUserProfile(dbService.getOrCreateProfile());
      setLeaderboard(dbService.getLeaderboard());
      triggerToast("Logged out of Civic Gateway.", 0);
    } catch (e) {
      console.error("Logout error:", e);
      dbService.clearProfile();
      setIsAuthenticated(false);
      setUserProfile(dbService.getOrCreateProfile());
      setLeaderboard(dbService.getLeaderboard());
    }
  };

  const handleAuthSuccess = async (profile: UserProfile) => {
    dbService.saveProfile(profile);
    setUserProfile(profile);
    setIsAuthenticated(true);
    // Refresh leaderboard
    const fbLeaderboard = await dbService.fetchLeaderboardFromFirestore();
    setLeaderboard(fbLeaderboard);
  };

  const handleProfileSave = (displayName: string, email: string, avatarUrl: string) => {
    const currentProfile = { ...userProfile, displayName, email, avatarUrl };
    dbService.saveProfile(currentProfile);
    setUserProfile(currentProfile);
    setLeaderboard(dbService.getLeaderboard());
    triggerToast("Profile character updated successfully!", 10);
  };

  const handleAddComment = (reportId: string, text: string) => {
    const targetReport = reports.find(r => r.id === reportId);
    const reportTitle = targetReport ? targetReport.title : "Incident";

    dbService.addComment(reportId, userProfile.uid, userProfile.displayName, userProfile.avatarUrl, text);
    setReports(dbService.getReports());

    // Reward points (+5 for commenting)
    const updatedProfile = dbService.addPoints(5);
    setUserProfile(updatedProfile);
    setLeaderboard(dbService.getLeaderboard());

    logActivity("commented on", reportTitle);
    triggerToast("Comment added to discussion board!", 5);
  };

  // Open report creator modal when clicking coordinates on map
  const handleMapClickedCoords = (coords: { lat: number; lng: number; address: string }) => {
    setClickedCoords(coords);
    setIsReportModalOpen(true);
  };

  // Calculate stats
  const activePinsCount = reports.filter((r) => r.status !== "resolved").length;
  const criticalCount = reports.filter((r) => r.status !== "resolved" && (r.severity === "Critical" || r.severity === "High")).length;
  const totalUpvotesCount = reports.reduce((acc, curr) => acc + (curr.upvoteCount || 0), 0);
  const resolvedCount = reports.filter((r) => r.status === "resolved").length;

  const potholeQuestCount = Math.min(reports.filter(r => r.category === "Pothole").length, 5);
  const potholeQuestPercent = (potholeQuestCount / 5) * 100;

  const currentLevel = Math.floor(userProfile.points / 50) + 1;
  const pointsForNextLevel = currentLevel * 50;
  const pointsFromPrevLevel = (currentLevel - 1) * 50;
  const progressPercent = Math.min(
    Math.max(((userProfile.points - pointsFromPrevLevel) / 50) * 100, 0),
    100
  );

  return (
    <div
      className={`theme-${theme} min-h-screen bg-canvas-bg text-text-main font-sans flex selection:bg-brand-100 selection:text-brand-900 transition-colors duration-300`}
      id="community-hero-app"
    >
      {/* Dynamic Points Earned Float Notification Toast */}
      {toastNotification && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl border border-slate-800 shadow-2xl flex items-center gap-3 animate-[slideUp_0.4s_ease-out] max-w-sm w-[90%]">
          <div className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-xs shrink-0 animate-bounce">
            +{toastNotification.points}
          </div>
          <div>
            <h5 className="text-xs font-extrabold text-brand-400">Civic Points Reward!</h5>
            <p className="text-[11px] text-slate-300 font-medium leading-normal mt-0.5">{toastNotification.text}</p>
          </div>
        </div>
      )}

      {/* ================= SIDEBAR NAVIGATION (PERSISTENT ON DESKTOP, OFF-CANVAS ON MOBILE) ================= */}
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-45 bg-slate-950/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 md:w-72 bg-card-bg border-r border-border-color flex flex-col transition-transform duration-300 md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand / Logo Section */}
        <div className="p-6 border-b border-border-color flex items-center justify-between">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="p-2 bg-gradient-to-br from-brand-500 to-brand-700 text-white rounded-xl shadow-md shadow-brand-500/10">
              <Compass className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="text-sm font-black text-text-main uppercase tracking-wider flex items-center gap-1.5 font-mono">
                Community Hero
                <span className="text-[8px] bg-brand-500/15 text-brand-600 border border-brand-500/20 px-1.5 py-0.25 rounded-md font-bold uppercase tracking-widest">SF-WARD</span>
              </h1>
              <p className="text-[10px] text-text-muted font-medium">Hyperlocal Civic Command</p>
            </div>
          </div>
          {/* Close menu for mobile */}
          <button 
            className="md:hidden p-1.5 hover:bg-card-hover rounded-lg text-text-muted hover:text-text-main"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Profile / Status Section */}
        <div className="p-5 border-b border-border-color bg-canvas-bg/30">
          <div className="flex items-center gap-3">
            <img
              src={userProfile.avatarUrl}
              alt={userProfile.displayName}
              className="w-12 h-12 rounded-full object-cover border-2 border-brand-400 p-0.5 shadow-sm shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <h3 className="text-xs font-black text-text-main uppercase truncate leading-snug">{userProfile.displayName}</h3>
                <Award className="w-4 h-4 text-brand-500 shrink-0" />
              </div>
              <span className="text-[9px] font-bold text-brand-600 bg-brand-500/10 px-2 py-0.5 rounded-md uppercase tracking-wider block w-max mt-0.5">
                {isAuthenticated ? "Civic Champion" : "Local Guest"}
              </span>
            </div>
          </div>

          {/* Level Progress */}
          <div className="space-y-1 mt-3">
            <div className="flex justify-between items-center text-[10px] font-bold font-mono">
              <span className="text-text-muted">LEVEL {currentLevel}</span>
              <span className="text-brand-600">{userProfile.points} / {pointsForNextLevel} PTS</span>
            </div>
            <div className="h-1.5 bg-canvas-bg rounded-full overflow-hidden border border-border-color">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Edit & Auth Actions */}
          <div className="flex gap-2 mt-3.5">
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex-1 text-center py-1.5 text-[9px] font-bold text-text-muted hover:text-text-main bg-canvas-bg hover:bg-card-hover border border-border-color rounded-lg transition-all"
            >
              Edit Profile
            </button>
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-[9px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 rounded-lg transition-all border border-rose-500/10"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex-1 text-center py-1.5 text-[9px] font-bold bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-all"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest px-3 block mb-2">
            Civic Command Portal
          </span>

          <button
            onClick={() => {
              setActiveTab("feed");
              setIsSidebarOpen(false);
            }}
            className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
              activeTab === "feed"
                ? "bg-brand-500/10 text-brand-700 border border-brand-500/10"
                : "text-text-muted hover:text-text-main hover:bg-card-hover border border-transparent"
            }`}
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span>💬 Civic Social Feed</span>
            </div>
            <ChevronRight className={`w-3.5 h-3.5 opacity-50 ${activeTab === "feed" ? "translate-x-0.5" : ""}`} />
          </button>

          <button
            onClick={() => {
              setActiveTab("radar");
              setIsSidebarOpen(false);
            }}
            className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
              activeTab === "radar"
                ? "bg-brand-500/10 text-brand-700 border border-brand-500/10"
                : "text-text-muted hover:text-text-main hover:bg-card-hover border border-transparent"
            }`}
          >
            <div className="flex items-center gap-3">
              <Map className="w-4 h-4 shrink-0" />
              <span>🛰️ Hyperlocal Radar Map</span>
            </div>
            <ChevronRight className={`w-3.5 h-3.5 opacity-50 ${activeTab === "radar" ? "translate-x-0.5" : ""}`} />
          </button>

          <button
            onClick={() => {
              setActiveTab("analytics");
              setIsSidebarOpen(false);
            }}
            className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
              activeTab === "analytics"
                ? "bg-brand-500/10 text-brand-700 border border-brand-500/10"
                : "text-text-muted hover:text-text-main hover:bg-card-hover border border-transparent"
            }`}
          >
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 shrink-0" />
              <span>🤖 Predictive AI Engine</span>
            </div>
            <ChevronRight className={`w-3.5 h-3.5 opacity-50 ${activeTab === "analytics" ? "translate-x-0.5" : ""}`} />
          </button>

          <button
            onClick={() => {
              setActiveTab("leaderboard");
              setIsSidebarOpen(false);
            }}
            className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
              activeTab === "leaderboard"
                ? "bg-brand-500/10 text-brand-700 border border-brand-500/10"
                : "text-text-muted hover:text-text-main hover:bg-card-hover border border-transparent"
            }`}
          >
            <div className="flex items-center gap-3">
              <Trophy className="w-4 h-4 shrink-0" />
              <span>🏆 Civic Leaderboard</span>
            </div>
            <ChevronRight className={`w-3.5 h-3.5 opacity-50 ${activeTab === "leaderboard" ? "translate-x-0.5" : ""}`} />
          </button>
        </nav>

        {/* Sidebar Footer Report CTA */}
        <div className="p-4 border-t border-border-color">
          <button
            onClick={() => {
              setClickedCoords(null);
              setIsReportModalOpen(true);
            }}
            className="w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white text-xs font-extrabold px-4 py-3 rounded-xl transition-all shadow-md shadow-brand-500/15 flex items-center justify-center gap-2 group uppercase tracking-wider"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            Report Local Hazard
          </button>
        </div>
      </aside>

      {/* ================= MAIN DISPLAY AREA (SHIFTS TO THE RIGHT OF PERSISTENT SIDEBAR) ================= */}
      <div className="flex-1 flex flex-col md:pl-64 lg:pl-72 min-w-0 transition-all duration-300">
        
        {/* ================= DYNAMIC STICKY TOP SECTION (HEADER) ================= */}
        <header className="bg-header-bg border-b border-border-color h-16 sticky top-0 z-30 transition-colors flex items-center px-4 md:px-6 justify-between gap-4 shadow-sm">
          {/* Menu button for mobile */}
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-card-hover rounded-xl text-text-muted hover:text-text-main md:hidden transition-all animate-fade-in"
            title="Open navigation menu"
          >
            <Menu className="w-5.5 h-5.5" />
          </button>

          {/* Current Page Breadcrumbs */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-bold uppercase tracking-wider font-mono">
              <span>Platform</span>
              <span>/</span>
              <span className="text-brand-600 font-extrabold">{activeTab}</span>
            </div>
            <h2 className="text-xs md:text-sm font-black text-text-main uppercase tracking-widest font-mono mt-0.5 truncate">
              {activeTab === "feed" && "💬 Active Civic Feed Page"}
              {activeTab === "radar" && "🛰️ Interactive GPS Radar Screen"}
              {activeTab === "analytics" && "🤖 Gemini Proactive Intelligence Page"}
              {activeTab === "leaderboard" && "🏆 Civic Hall of Fame & Quests Screen"}
            </h2>
          </div>

          {/* Top section widgets */}
          <div className="flex items-center gap-3 shrink-0">
            
            {/* Dynamic Live Clock */}
            <div className="hidden sm:flex items-center gap-1.5 bg-canvas-bg border border-border-color px-3 py-1.5 rounded-xl font-mono text-[10px] font-bold text-text-muted">
              <Clock className="w-3.5 h-3.5 text-brand-500 animate-pulse" />
              <span>
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
              </span>
              <span className="text-[8px] bg-border-color text-text-muted px-1 py-0.25 rounded font-sans font-bold">LIVE</span>
            </div>

            {/* Custom Theme Selector Dropdown */}
            <div className="flex items-center gap-2 bg-canvas-bg border border-border-color rounded-xl px-2.5 py-1.5 shadow-sm transition-all hover:border-brand-300">
              <Palette className="w-4 h-4 text-brand-600" />
              <select
                value={theme}
                onChange={(e) => handleThemeChange(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-text-main focus:outline-none cursor-pointer pr-1"
              >
                <option value="emerald">Emerald Sage</option>
                <option value="cosmic">Cosmic Cyber (Dark)</option>
                <option value="sunset">Sunset Gold</option>
                <option value="nordic">Nordic Breeze</option>
              </select>
            </div>

            {/* User Profile / Auth Action */}
            {!isAuthenticated ? (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition-all shadow-sm focus:outline-none"
                title="Sign In"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Sign In</span>
              </button>
            ) : (
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="relative rounded-full hover:ring-2 hover:ring-brand-500 transition-all focus:outline-none"
                title="Edit Profile"
              >
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.displayName}
                  className="w-9 h-9 rounded-full object-cover border border-brand-300 dark:border-brand-500 shadow-sm p-0.5 bg-white dark:bg-slate-900 transition-transform duration-200 hover:scale-105"
                  id="header-profile-avatar"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-white rounded-full" />
              </button>
            )}
          </div>
        </header>

        {/* ================= DEDICATED FULL-WIDTH PAGE CONTENT ================= */}
        <main className="p-4 md:p-6 lg:p-8 flex-1 flex flex-col gap-6 overflow-y-auto">
          
          {/* Connection/Firebase Notice Banner */}
          <FirebaseInitBanner />

          {/* Guide banner */}
          {showGuide && (
            <div className="bg-card-bg border border-border-color rounded-2xl p-5 shadow-sm space-y-4 animate-fade-in relative overflow-hidden transition-all duration-300">
              <div className="absolute right-0 top-0 w-32 h-32 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex justify-between items-start">
                <div className="flex gap-2.5 items-center">
                  <div className="p-2 bg-brand-500/10 rounded-xl text-brand-600">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-text-main uppercase tracking-wider">Neighborhood Action Center</h3>
                    <p className="text-xs text-text-muted">A beautiful community platform to audit and patch local structural issues seamlessly.</p>
                  </div>
                </div>
                <button
                  onClick={handleDismissGuide}
                  className="p-1.5 hover:bg-card-hover rounded-lg text-text-muted hover:text-text-main transition-all"
                  title="Dismiss help center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                <div className="bg-canvas-bg/60 border border-border-color p-3.5 rounded-xl hover:border-brand-200 transition-all">
                  <span className="inline-block text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-1.5">STEP 1</span>
                  <h4 className="text-xs font-bold text-text-main">Pin Local Incidents</h4>
                  <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                    Select coordinates directly on the <strong>Hyperlocal Civic Radar</strong> grid to open the AI analysis wizard.
                  </p>
                </div>

                <div className="bg-canvas-bg/60 border border-border-color p-3.5 rounded-xl hover:border-brand-200 transition-all">
                  <span className="inline-block text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1.5">STEP 2</span>
                  <h4 className="text-xs font-bold text-text-main">Instant Gemini Audit</h4>
                  <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                    Input descriptive visual elements or photos. The Gemini AI categorizes, rates severity, and drafts immediate safety guidelines.
                  </p>
                </div>

                <div className="bg-canvas-bg/60 border border-border-color p-3.5 rounded-xl hover:border-brand-200 transition-all">
                  <span className="inline-block text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-1.5">STEP 3</span>
                  <h4 className="text-xs font-bold text-text-main">Earn Civic Points</h4>
                  <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                    Upvote active reports to verify them, coordinate in public comments, or click <strong>Resolve</strong> to close tickets and unlock badges.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* DYNAMIC PAGE RENDER MOUNTS */}
          <div className="flex-1 flex flex-col min-h-0">
            
            {/* 1. DEDICATED SOCIAL FEED PAGE */}
            {activeTab === "feed" && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start flex-1 animate-fade-in">
                {/* Main Feed panel */}
                <div className="xl:col-span-8 space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-wider animate-pulse">
                      Showing {reports.length} global updates
                    </span>
                  </div>
                  <ActiveFeed
                    reports={reports}
                    selectedReport={selectedReport}
                    onSelectReport={setSelectedReport}
                    onUpvote={handleUpvote}
                    onClaim={handleClaim}
                    onResolve={handleResolve}
                    onAddComment={handleAddComment}
                    currentUser={userProfile}
                    center={mapCenter}
                  />
                </div>

                {/* Integrated Side Widgets panel */}
                <div className="xl:col-span-4 space-y-5">
                  {/* Ward Health Stats Card */}
                  <div className="bg-card-bg border border-border-color rounded-2xl p-4 shadow-sm space-y-3.5">
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest block">
                      Ward Health Overview
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-canvas-bg border border-border-color p-3 rounded-xl flex flex-col justify-between">
                        <span className="text-[9px] font-bold text-text-muted uppercase">Open Tasks</span>
                        <span className="text-xl font-extrabold text-text-main font-mono mt-0.5">{activePinsCount}</span>
                      </div>
                      <div className="bg-canvas-bg border border-border-color p-3 rounded-xl flex flex-col justify-between">
                        <span className="text-[9px] font-bold text-rose-500 uppercase">Urgent</span>
                        <span className="text-xl font-extrabold text-rose-600 font-mono mt-0.5">{criticalCount}</span>
                      </div>
                      <div className="bg-canvas-bg border border-border-color p-3 rounded-xl flex flex-col justify-between">
                        <span className="text-[9px] font-bold text-orange-500 uppercase">Upvotes</span>
                        <span className="text-xl font-extrabold text-orange-600 font-mono mt-0.5">{totalUpvotesCount}</span>
                      </div>
                      <div className="bg-canvas-bg border border-border-color p-3 rounded-xl flex flex-col justify-between">
                        <span className="text-[9px] font-bold text-emerald-500 uppercase">Resolved</span>
                        <span className="text-xl font-extrabold text-emerald-600 font-mono mt-0.5">{resolvedCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quest Card */}
                  <div className="bg-card-bg border border-border-color rounded-2xl p-4 shadow-sm space-y-3">
                    <div className="flex items-center gap-1.5 border-b border-border-color pb-2.5">
                      <Target className="w-4 h-4 text-brand-600" />
                      <span className="text-[9px] font-bold text-text-main uppercase tracking-wider">Group Community Quest</span>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xs font-black text-text-main">Operation: Zero Potholes</h4>
                      <p className="text-[10.5px] text-text-muted leading-relaxed font-medium">
                        Report or verify 5 potholes in the neighborhood to request high-priority municipal repaving asphalt.
                      </p>
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-[9px] font-bold text-text-muted">
                          <span>Progress</span>
                          <span>{potholeQuestCount} / 5 Reports</span>
                        </div>
                        <div className="h-1.5 bg-canvas-bg rounded-full overflow-hidden border border-border-color">
                          <div className="h-full bg-brand-500 transition-all duration-500" style={{ width: `${potholeQuestPercent}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Live Activity Stream */}
                  <div className="bg-card-bg border border-border-color rounded-2xl p-4 shadow-sm space-y-3">
                    <div className="flex items-center gap-1.5 border-b border-border-color pb-2.5">
                      <RefreshCcw className="w-3.5 h-3.5 text-brand-500 animate-spin" style={{ animationDuration: "15s" }} />
                      <span className="text-[9px] font-bold text-text-main uppercase tracking-wider">Live Activity Stream</span>
                    </div>
                    <div className="space-y-3.5 max-h-[280px] overflow-y-auto pr-1">
                      {activities.map((act) => (
                        <div key={act.id} className="flex gap-2.5 text-xs">
                          <img
                            src={act.avatar}
                            alt={act.user}
                            className="w-7.5 h-7.5 rounded-full object-cover border border-border-color shrink-0 mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-text-main font-medium leading-snug">
                              <span className="font-extrabold">{act.user}</span> {act.action} <span className="font-semibold text-brand-600">{act.target}</span>
                            </p>
                            <span className="text-[8.5px] text-text-muted font-mono">{act.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. DEDICATED HYPERLOCAL RADAR MAP PAGE */}
            {activeTab === "radar" && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch flex-1 animate-fade-in min-h-[580px]">
                {/* Big full-width interactive map card */}
                <div className="xl:col-span-8 flex flex-col h-full min-h-[500px]">
                  <div className="flex-1 rounded-3xl overflow-hidden border border-border-color shadow-sm relative min-h-[480px]">
                    <MapCanvas
                      reports={reports}
                      selectedReport={selectedReport}
                      onSelectReport={setSelectedReport}
                      onMapClick={handleMapClickedCoords}
                      center={mapCenter}
                    />
                  </div>
                </div>

                {/* Integrated Command Side Control Panel */}
                <div className="xl:col-span-4 flex flex-col justify-between bg-card-bg border border-border-color rounded-3xl p-5 shadow-sm space-y-5">
                  <div className="space-y-4">
                    <div className="border-b border-border-color pb-3">
                      <h3 className="text-xs font-black text-text-main uppercase tracking-wider font-mono">Radar Command Unit</h3>
                      <p className="text-[11px] text-text-muted mt-0.5">Control spatial hazard feeds and fly-to pinned coordinates seamlessly.</p>
                    </div>

                    {/* How to report */}
                    <div className="bg-brand-500/5 border border-brand-500/10 rounded-2xl p-4 space-y-1.5">
                      <h4 className="text-xs font-bold text-text-main flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-brand-600" />
                        Pinning Instructions
                      </h4>
                      <p className="text-[10.5px] text-text-muted leading-relaxed">
                        Double click or tap anywhere on the coordinates grid (Mcallister Blvd, Fulton Ave, or Market St) to initiate an AI-assisted incident catalog.
                      </p>
                    </div>

                    {/* Quick Active Pins list to fly-to on map! */}
                    <div className="space-y-2">
                      <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest block">
                        Quick Fly-to Local Incidents ({reports.length})
                      </span>
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {reports.map((r) => (
                          <button
                            key={r.id}
                            onClick={() => {
                              setMapCenter({ lat: r.lat, lng: r.lng });
                              setSelectedReport(r);
                            }}
                            className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs flex items-center justify-between gap-2.5 ${
                              selectedReport?.id === r.id
                                ? "bg-brand-500/10 border-brand-500/30 text-brand-800"
                                : "bg-canvas-bg/50 border-border-color hover:border-brand-200 text-text-main"
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-extrabold truncate">{r.title}</p>
                              <p className="text-[10px] text-text-muted truncate mt-0.5">{r.formattedAddress}</p>
                            </div>
                            <span className={`text-[8px] font-bold px-2 py-0.5 rounded-md uppercase shrink-0 ${
                              r.status === 'resolved'
                                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/15'
                                : r.status === 'in_progress'
                                ? 'bg-amber-500/10 text-amber-600 border border-amber-500/15'
                                : 'bg-slate-500/10 text-slate-600 border border-slate-500/15'
                            }`}>
                              {r.status}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border-color pt-4">
                    <button
                      onClick={() => {
                        setClickedCoords(null);
                        setIsReportModalOpen(true);
                      }}
                      className="w-full bg-brand-600 hover:bg-brand-500 text-white text-xs font-extrabold py-3 rounded-xl transition-all uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      Report Incident Here
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. DEDICATED PREDICTIVE AI ENGINE PAGE */}
            {activeTab === "analytics" && (
              <div className="animate-fade-in flex-1">
                <div className="max-w-6xl mx-auto">
                  <AnalyticsDashboard reports={reports} />
                </div>
              </div>
            )}

            {/* 4. DEDICATED HONOR & LEADERBOARD PAGE */}
            {activeTab === "leaderboard" && (
              <div className="animate-fade-in flex-1">
                <div className="max-w-4xl mx-auto">
                  <Leaderboard userProfile={userProfile} leaderboard={leaderboard} />
                </div>
              </div>
            )}

          </div>

        </main>

        {/* ================= RE-STYLED PROFESSIONAL STICKY FOOTER ================= */}
        <footer className="bg-card-bg border-t border-border-color py-4 mt-auto transition-colors">
          <div className="px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-text-muted text-[11px]">
            <div className="flex items-center gap-2">
              <Heart className="w-3.5 h-3.5 text-brand-500 animate-pulse" />
              <span>Empowering municipal neighborhoods through automated validation & transparency.</span>
            </div>
            <span className="font-mono text-[8.5px] font-bold text-text-muted uppercase tracking-wider">PROJECT CORE: CLOUD RUN SERVICE</span>
          </div>
        </footer>

      </div>

      {/* REPORT CREATION MODAL */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleReportCreated}
        clickedCoords={clickedCoords}
        currentUser={userProfile}
      />

      {/* PROFILE SELECTION MODAL */}
      <ProfileEditModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userProfile={userProfile}
        onSave={handleProfileSave}
      />

      {/* SIGN IN / SIGN UP AUTH MODAL */}
      <SignInSignUpModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
