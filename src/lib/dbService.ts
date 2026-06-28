import { Report, Comment, UserProfile, LeaderboardUser } from '../types';
import { auth, db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  onSnapshot, 
  query, 
  orderBy,
  writeBatch
} from 'firebase/firestore';

// Simple check if Firebase configuration exists.
// We fall back to standard localStorage to prevent crashes during sandbox reviews.
const LOCAL_STORAGE_REPORTS_KEY = "community_hero_reports";
const LOCAL_STORAGE_PROFILE_KEY = "community_hero_profile";
const LOCAL_STORAGE_USERS_KEY = "community_hero_users_list";

// Default starting issues centered around San Francisco (Civic Center)
const DEFAULT_SF_LAT = 37.7749;
const DEFAULT_SF_LNG = -122.4194;

export function getInitialReports(centerLat: number = DEFAULT_SF_LAT, centerLng: number = DEFAULT_SF_LNG): Report[] {
  return [
    {
      id: "seed-1",
      reporterId: "ai-system",
      reporterName: "EcoSentinel AI",
      title: "Major Water Main Pipe Leakage",
      description: "Severe water leakage bursting through pavement seam. Wasting hundreds of gallons of clean drinking water per hour and eroding road base.",
      category: "Water Leakage",
      severity: "Critical",
      imageUrl: "https://images.unsplash.com/photo-1542044896530-05d85be9b11a?auto=format&fit=crop&w=800&q=80",
      lat: centerLat + 0.003,
      lng: centerLng - 0.004,
      formattedAddress: "McAllister St & Polk St, San Francisco, CA 94102",
      status: "validated",
      upvoteCount: 5,
      upvotedBy: ["user-1", "user-2", "user-3", "user-4", "user-5"],
      aiCautionTips: "Do not step into the high-pressure water flow. Standing water may hide deeper pavement sinkholes or electrical conduits.",
      createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
      comments: [
        {
          id: "c-1",
          authorId: "user-1",
          authorName: "Sarah Connor",
          authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
          text: "Water has been pooling here since yesterday afternoon. Reporting to utility boards as well.",
          createdAt: Date.now() - 1.5 * 24 * 60 * 60 * 1000
        },
        {
          id: "c-2",
          authorId: "user-2",
          authorName: "Marcus Wright",
          authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
          text: "I placed a warning cone, but the water pressure is starting to move it.",
          createdAt: Date.now() - 1.2 * 24 * 60 * 60 * 1000
        }
      ]
    },
    {
      id: "seed-2",
      reporterId: "user-abc",
      reporterName: "David Miller",
      title: "Deep Hazardous Pothole near Crosswalk",
      description: "Extremely deep pothole directly on the pedestrian lane. Multiple cyclists and scooters have nearly wiped out attempting to avoid it.",
      category: "Pothole",
      severity: "High",
      imageUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80",
      lat: centerLat - 0.002,
      lng: centerLng + 0.003,
      formattedAddress: "Grove St & Larkin St, San Francisco, CA 94102",
      status: "reported",
      upvoteCount: 2,
      upvotedBy: ["user-2", "user-4"],
      aiCautionTips: "Keep a safe distance from the curb. Vehicles hitting this pothole may splash debris or pool water towards the sidewalk.",
      createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
      comments: []
    },
    {
      id: "seed-3",
      reporterId: "user-def",
      reporterName: "Elena Rostova",
      title: "Flickering / Damaged Streetlight Intersection",
      description: "The primary overhead streetlight is completely dead, making this dense residential intersection Pitch black after 8 PM. Danger for pedestrians crossing.",
      category: "Broken Streetlight",
      severity: "Medium",
      imageUrl: "https://images.unsplash.com/photo-1509024644558-2f56ce76c490?auto=format&fit=crop&w=800&q=80",
      lat: centerLat + 0.004,
      lng: centerLng + 0.002,
      formattedAddress: "Golden Gate Ave & Hyde St, San Francisco, CA 94102",
      status: "in_progress",
      upvoteCount: 3,
      upvotedBy: ["user-3", "user-4", "user-5"],
      aiCautionTips: "Use a phone flashlight when crossing this intersection. Ensure approaching vehicles have completely stopped before stepping out.",
      createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now() - 12 * 60 * 60 * 1000,
      comments: [
        {
          id: "c-3",
          authorId: "volunteer-1",
          authorName: "John Green (Civic Captain)",
          authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
          text: "I have filed a maintenance request with the local grid. They estimated replacement bulb crew arrival tomorrow morning.",
          createdAt: Date.now() - 8 * 60 * 60 * 1000
        }
      ]
    },
    {
      id: "seed-4",
      reporterId: "user-ghi",
      reporterName: "Alex Mercer",
      title: "Overflowing Garbage and Broken Plastic Containers",
      description: "Illegal dumping of residential waste beside the public park fence. Odor is drawing rodents and blocking the visual line of the bicycle path.",
      category: "Waste Management",
      severity: "Medium",
      imageUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80",
      lat: centerLat - 0.003,
      lng: centerLng - 0.002,
      formattedAddress: "Fulton St & Franklin St, San Francisco, CA 94102",
      status: "resolved",
      upvoteCount: 4,
      upvotedBy: ["user-1", "user-2", "user-4", "user-5"],
      resolvedImageUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80",
      resolvedBy: "Alex Mercer",
      aiCautionTips: "Wear protective gloves if handling debris. Report heavy items or suspicious materials to health departments.",
      createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now() - 6 * 60 * 60 * 1000,
      comments: [
        {
          id: "c-4",
          authorId: "user-ghi",
          authorName: "Alex Mercer",
          authorAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
          text: "Cleaned up the main heap with a team of 3 neighbors! Left a notification card for the council to take the heavier plastic units.",
          createdAt: Date.now() - 6 * 60 * 60 * 1000
        }
      ]
    }
  ];
}

export const dbService = {
  // --- REPORTS ---
  getReports(centerLat?: number, centerLng?: number): Report[] {
    const raw = localStorage.getItem(LOCAL_STORAGE_REPORTS_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error("Failed to parse local storage reports:", e);
      }
    }
    // No local storage yet, seed initial reports matching user/default coordinates
    const seeded = getInitialReports(centerLat, centerLng);
    this.saveReports(seeded);
    return seeded;
  },

  saveReports(reports: Report[]): void {
    localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify(reports));
  },

  addReport(report: Omit<Report, "id" | "createdAt" | "updatedAt" | "upvoteCount" | "upvotedBy" | "comments">): Report {
    const reports = this.getReports(report.lat, report.lng);
    const newReport: Report = {
      ...report,
      id: `report-${Date.now()}`,
      upvoteCount: 1,
      upvotedBy: [report.reporterId],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      comments: []
    };
    reports.unshift(newReport);
    this.saveReports(reports);

    // Sync to Firestore if authenticated
    if (auth.currentUser) {
      setDoc(doc(db, "reports", newReport.id), newReport)
        .catch(err => console.error("Firestore sync error on addReport:", err));
    }

    return newReport;
  },

  upvoteReport(reportId: string, userId: string): { report: Report; pointsEarned: number } {
    const reports = this.getReports();
    const index = reports.findIndex(r => r.id === reportId);
    let pointsEarned = 0;

    if (index !== -1) {
      const r = reports[index];
      if (!r.upvotedBy.includes(userId)) {
        r.upvotedBy.push(userId);
        r.upvoteCount = r.upvotedBy.length;
        pointsEarned = 2; // Civic validation reward points

        // Automated status progression: Upgrade reported -> validated at >= 3 upvotes
        if (r.status === "reported" && r.upvoteCount >= 3) {
          r.status = "validated";
        }
        r.updatedAt = Date.now();
        reports[index] = r;
        this.saveReports(reports);

        // Sync to Firestore if authenticated
        if (auth.currentUser) {
          updateDoc(doc(db, "reports", reportId), {
            upvotedBy: r.upvotedBy,
            upvoteCount: r.upvoteCount,
            status: r.status,
            updatedAt: r.updatedAt
          }).catch(err => console.error("Firestore sync error on upvoteReport:", err));
        }
      }
      return { report: reports[index], pointsEarned };
    }
    throw new Error("Report not found");
  },

  addComment(reportId: string, authorId: string, authorName: string, authorAvatar: string, text: string): Comment {
    const reports = this.getReports();
    const index = reports.findIndex(r => r.id === reportId);

    if (index !== -1) {
      const r = reports[index];
      const comment: Comment = {
        id: `comment-${Date.now()}`,
        authorId,
        authorName,
        authorAvatar,
        text,
        createdAt: Date.now()
      };
      if (!r.comments) r.comments = [];
      r.comments.push(comment);
      r.updatedAt = Date.now();
      reports[index] = r;
      this.saveReports(reports);

      // Sync to Firestore if authenticated
      if (auth.currentUser) {
        updateDoc(doc(db, "reports", reportId), {
          comments: r.comments,
          updatedAt: r.updatedAt
        }).catch(err => console.error("Firestore sync error on addComment:", err));
      }

      return comment;
    }
    throw new Error("Report not found for commenting");
  },

  resolveReport(reportId: string, resolvedImageUrl: string, userId: string, resolverName: string): { report: Report; pointsEarned: number } {
    const reports = this.getReports();
    const index = reports.findIndex(r => r.id === reportId);
    let pointsEarned = 0;

    if (index !== -1) {
      const r = reports[index];
      r.status = "resolved";
      r.resolvedImageUrl = resolvedImageUrl;
      r.resolvedBy = resolverName;
      r.updatedAt = Date.now();
      pointsEarned = 50; // Massively rewarding civic resolution!

      reports[index] = r;
      this.saveReports(reports);

      // Sync to Firestore if authenticated
      if (auth.currentUser) {
        updateDoc(doc(db, "reports", reportId), {
          status: r.status,
          resolvedImageUrl: r.resolvedImageUrl,
          resolvedBy: r.resolvedBy,
          updatedAt: r.updatedAt
        }).catch(err => console.error("Firestore sync error on resolveReport:", err));
      }

      return { report: r, pointsEarned };
    }
    throw new Error("Report not found for resolution");
  },

  claimInProgress(reportId: string): Report {
    const reports = this.getReports();
    const index = reports.findIndex(r => r.id === reportId);

    if (index !== -1) {
      const r = reports[index];
      r.status = "in_progress";
      r.updatedAt = Date.now();
      reports[index] = r;
      this.saveReports(reports);

      // Sync to Firestore if authenticated
      if (auth.currentUser) {
        updateDoc(doc(db, "reports", reportId), {
          status: r.status,
          updatedAt: r.updatedAt
        }).catch(err => console.error("Firestore sync error on claimInProgress:", err));
      }

      return r;
    }
    throw new Error("Report not found");
  },

  // --- USER PROFILE ---
  getOrCreateProfile(): UserProfile {
    const raw = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error("Failed to parse local storage profile:", e);
      }
    }
    const defaultProfile: UserProfile = {
      uid: "user-local-hero",
      displayName: "Jane Civic",
      email: "jane.hero@civic.org",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      points: 25,
      badges: ["Civic Sentinel"],
      createdAt: Date.now()
    };
    this.saveProfile(defaultProfile);
    this.updateLeaderboardEntry(defaultProfile);
    return defaultProfile;
  },

  saveProfile(profile: UserProfile): void {
    localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(profile));
    this.updateLeaderboardEntry(profile);

    // Sync to Firestore if authenticated
    if (auth.currentUser && auth.currentUser.uid === profile.uid) {
      this.saveUserProfileToFirestore(profile)
        .catch(err => console.error("Firestore sync error on saveProfile:", err));
    }
  },

  addPoints(points: number, badgeCandidate?: string): UserProfile {
    const profile = this.getOrCreateProfile();
    profile.points += points;

    // Check point milestones for badges
    if (profile.points >= 50 && !profile.badges.includes("Pothole Ranger")) {
      profile.badges.push("Pothole Ranger");
    }
    if (profile.points >= 100 && !profile.badges.includes("Eco Warrior")) {
      profile.badges.push("Eco Warrior");
    }
    if (profile.points >= 150 && !profile.badges.includes("Beacon of Light")) {
      profile.badges.push("Beacon of Light");
    }

    if (badgeCandidate && !profile.badges.includes(badgeCandidate)) {
      profile.badges.push(badgeCandidate);
    }

    this.saveProfile(profile);
    return profile;
  },

  // --- LEADERBOARD ---
  getLeaderboard(): LeaderboardUser[] {
    const raw = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    let list: LeaderboardUser[] = [];
    if (raw) {
      try {
        list = JSON.parse(raw);
      } catch (e) {
        console.error("Failed to parse leaderboard:", e);
      }
    }

    // If empty, seed default competitive leaderboard profiles
    if (list.length === 0) {
      list = [
        { uid: "leader-1", displayName: "Sarah Connor", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80", points: 185, badgesCount: 4 },
        { uid: "leader-2", displayName: "Marcus Wright", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80", points: 120, badgesCount: 2 },
        { uid: "leader-3", displayName: "Alex Mercer", avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80", points: 95, badgesCount: 1 },
        { uid: "leader-4", displayName: "Elena Rostova", avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80", points: 65, badgesCount: 1 }
      ];
      // Include current user in leaderboard seed
      const currentUser = this.getOrCreateProfile();
      list.push({
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        avatarUrl: currentUser.avatarUrl,
        points: currentUser.points,
        badgesCount: currentUser.badges.length
      });
    }

    // Sort descending by points
    list.sort((a, b) => b.points - a.points);
    return list.map((user, index) => ({
      ...user,
      rank: index + 1
    }));
  },

  updateLeaderboardEntry(profile: UserProfile): void {
    const raw = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    let list: LeaderboardUser[] = [];
    if (raw) {
      try {
        list = JSON.parse(raw);
      } catch (e) {}
    }

    const index = list.findIndex(u => u.uid === profile.uid);
    const entry: LeaderboardUser = {
      uid: profile.uid,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      points: profile.points,
      badgesCount: profile.badges.length
    };

    if (index !== -1) {
      list[index] = entry;
    } else {
      list.push(entry);
    }
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(list));
  },

  // --- FIRESTORE SUBSCRIPTIONS & OPERATIONS ---
  subscribeReports(callback: (reports: Report[]) => void): () => void {
    const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const reports: Report[] = [];
      snapshot.forEach((doc) => {
        reports.push({ id: doc.id, ...doc.data() } as Report);
      });
      if (reports.length > 0) {
        // save to local storage as cache
        localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify(reports));
        callback(reports);
      } else {
        // If Firestore is completely empty (e.g., initial setup), let's seed it!
        const initial = getInitialReports();
        if (auth.currentUser) {
          const batch = writeBatch(db);
          initial.forEach(report => {
            const reportRef = doc(db, "reports", report.id);
            batch.set(reportRef, report);
          });
          batch.commit()
            .then(() => console.log("Seeded Firestore successfully!"))
            .catch(err => console.error("Failed to seed Firestore:", err));
        } else {
          console.log("Firestore is empty, but visitor is unauthenticated. Showing local seed data.");
        }
        callback(initial);
      }
    }, (error) => {
      console.warn("Firestore subscription failed, falling back to local storage:", error);
      // fallback
      callback(this.getReports());
    });
  },

  async fetchUserProfileFromFirestore(uid: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data() as UserProfile;
        // save locally too
        localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(data));
        return data;
      }
      return null;
    } catch (e) {
      console.error("Error fetching user profile from Firestore:", e);
      return null;
    }
  },

  async saveUserProfileToFirestore(profile: UserProfile): Promise<void> {
    try {
      const userRef = doc(db, "users", profile.uid);
      await setDoc(userRef, profile);
      // save locally too
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.error("Error saving user profile to Firestore:", e);
    }
  },

  async fetchLeaderboardFromFirestore(): Promise<LeaderboardUser[]> {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const users: LeaderboardUser[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as UserProfile;
        users.push({
          uid: data.uid,
          displayName: data.displayName,
          avatarUrl: data.avatarUrl,
          points: data.points,
          badgesCount: data.badges?.length || 0
        });
      });
      if (users.length > 0) {
        users.sort((a, b) => b.points - a.points);
        return users.map((u, i) => ({ ...u, rank: i + 1 }));
      }
      return this.getLeaderboard(); // fallback
    } catch (e) {
      console.error("Error fetching leaderboard from Firestore:", e);
      return this.getLeaderboard(); // fallback
    }
  }
};
