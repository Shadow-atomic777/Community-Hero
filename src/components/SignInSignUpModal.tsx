import React, { useState } from "react";
import { X, Mail, Lock, User, LogIn, UserPlus, AlertCircle, Check, Sparkles, ShieldAlert } from "lucide-react";
import { auth } from "../lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { dbService } from "../lib/dbService";
import { UserProfile } from "../types";

interface SignInSignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (userProfile: UserProfile) => void;
}

const PRESET_AVATARS = [
  {
    name: "Jane (Active Hero)",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
  },
  {
    name: "Alex (Neighborhood Scout)",
    url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
  },
  {
    name: "Elena (Eco Sentry)",
    url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80"
  },
  {
    name: "Marcus (Municipal Ranger)",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
  },
  {
    name: "Sarah (Civic Sentinel)",
    url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
  },
  {
    name: "John (Community Captain)",
    url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80"
  }
];

export default function SignInSignUpModal({ isOpen, onClose, onAuthSuccess }: SignInSignUpModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0].url);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Retrieve existing profile from Firestore or construct a fallback
      let existingProfile = await dbService.fetchUserProfileFromFirestore(user.uid);
      
      if (!existingProfile) {
        existingProfile = {
          uid: user.uid,
          displayName: user.displayName || user.email?.split("@")[0] || "Hero Citizen",
          email: user.email || "",
          avatarUrl: user.photoURL || PRESET_AVATARS[0].url,
          points: 50,
          badges: ["Civic Pioneer"],
          createdAt: Date.now()
        };
        await dbService.saveUserProfileToFirestore(existingProfile);
      }

      dbService.updateLeaderboardEntry(existingProfile);

      setSuccess(`Welcome back, ${existingProfile.displayName}!`);
      setTimeout(() => {
        onAuthSuccess(existingProfile!);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error("Google Auth failed:", err);
      let errMsg = err.message || "Google Sign-In failed.";
      
      if (err.code === "auth/popup-blocked") {
        errMsg = "Sign-in popup was blocked by your browser. Please allow popups for this site, or use 'Developer Sandbox Sign-In' below to test immediately.";
      } else if (err.code === "auth/unauthorized-domain") {
        errMsg = `This domain is not authorized in your Firebase console. Please add '${window.location.hostname}' to your Authorized Domains list under Firebase Console -> Authentication -> Settings -> Authorized Domains, or use 'Developer Sandbox Sign-In' below.`;
      } else if (err.code === "auth/operation-not-allowed") {
        errMsg = "Google login is not enabled in your Firebase project. Please enable Google Sign-In under Firebase Console -> Authentication -> Sign-in method, or use 'Developer Sandbox Sign-In' below.";
      } else if (err.code === "auth/popup-closed-by-user") {
        errMsg = "The sign-in window was closed before completing. Please try again or use 'Developer Sandbox Sign-In'.";
      } else {
        errMsg = `Auth failed [${err.code || "unknown"}]: ${err.message || "Please check your configuration or try 'Developer Sandbox Sign-In' below."}`;
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeveloperSandboxSignIn = () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    
    try {
      // Get or create a local developer sandbox profile
      const localProfile = dbService.getOrCreateProfile();
      
      // Save authenticated flag to localstorage so that the app doesn't reset it
      localStorage.setItem("sandbox_authenticated", "true");
      
      setSuccess(`Simulating Sign-In for developer: ${localProfile.displayName}!`);
      setTimeout(() => {
        onAuthSuccess(localProfile);
        setLoading(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error("Sandbox authentication failed:", err);
      setError("Failed to enter Sandbox mode. Please try standard sign-up.");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (isSignUp) {
        // Validate sign up fields
        if (!displayName.trim()) {
          throw new Error("Display Name is required for registration.");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }

        // Create Firebase Authentication account
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;

        // Build User Profile
        const newProfile: UserProfile = {
          uid: user.uid,
          displayName: displayName.trim(),
          email: user.email || email.trim(),
          avatarUrl: selectedAvatar,
          points: 50, // Starting bonus points for signing up!
          badges: ["Civic Pioneer"],
          createdAt: Date.now()
        };

        // Save profile to Firestore & Local Storage
        await dbService.saveUserProfileToFirestore(newProfile);
        dbService.updateLeaderboardEntry(newProfile);

        setSuccess("Account registered! Welcome to Community Hero.");
        setTimeout(() => {
          onAuthSuccess(newProfile);
          onClose();
        }, 1500);

      } else {
        // Sign In
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;

        // Retrieve existing profile from Firestore or construct a fallback
        let existingProfile = await dbService.fetchUserProfileFromFirestore(user.uid);
        
        if (!existingProfile) {
          // Fallback profile if it doesn't exist in Firestore
          existingProfile = {
            uid: user.uid,
            displayName: user.email ? user.email.split("@")[0] : "Hero Citizen",
            email: user.email || email.trim(),
            avatarUrl: PRESET_AVATARS[0].url,
            points: 25,
            badges: ["Civic Guardian"],
            createdAt: Date.now()
          };
          await dbService.saveUserProfileToFirestore(existingProfile);
        }

        dbService.updateLeaderboardEntry(existingProfile);

        setSuccess(`Welcome back, ${existingProfile.displayName}!`);
        setTimeout(() => {
          onAuthSuccess(existingProfile!);
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      console.error("Auth action failed:", err);
      let errMsg = err.message || "An unexpected error occurred.";
      if (err.code === "auth/email-already-in-use") {
        errMsg = "This email address is already in use.";
      } else if (err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        errMsg = "Invalid email or password. Please try again.";
      } else if (err.code === "auth/invalid-credential") {
        errMsg = "Incorrect password or email credentials.";
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-md animate-fade-in">
      <div 
        className="bg-card-bg w-full max-w-md rounded-3xl border border-border-color shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
        id="auth-gateway-panel"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-border-color">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-brand-500/10 text-brand-600 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black text-text-main uppercase tracking-wider font-mono">
              {isSignUp ? "Register Civic Account" : "Access Civic Gateway"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-card-hover rounded-lg text-text-muted hover:text-text-main transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-canvas-bg/60 p-1 mx-5 mt-4 rounded-xl border border-border-color">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setError(null);
              setSuccess(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              !isSignUp 
                ? "bg-card-bg text-text-main shadow" 
                : "text-text-muted hover:text-text-main"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setError(null);
              setSuccess(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              isSignUp 
                ? "bg-card-bg text-text-main shadow" 
                : "text-text-muted hover:text-text-main"
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-600 p-3 rounded-xl text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 p-3 rounded-xl text-xs font-semibold">
              <Check className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {isSignUp && (
            <div className="space-y-4">
              {/* Display Name */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider">
                  Citizen Display Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. David Miller"
                    className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold rounded-xl border border-border-color text-text-main bg-card-bg focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                </div>
              </div>

              {/* Character Avatar Selector */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider">
                  Choose Platform Character
                </label>
                <div className="grid grid-cols-6 gap-2 pt-1">
                  {PRESET_AVATARS.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => setSelectedAvatar(preset.url)}
                      className={`relative rounded-full overflow-hidden aspect-square border-2 transition-all p-0.5 ${
                        selectedAvatar === preset.url
                          ? "border-brand-500 scale-105 shadow-md"
                          : "border-transparent hover:border-brand-200"
                      }`}
                      title={preset.name}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover rounded-full" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. citizen@communityhero.org"
                className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold rounded-xl border border-border-color text-text-main bg-card-bg focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider">
              Secure Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignUp ? "At least 6 characters" : "••••••••"}
                className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold rounded-xl border border-border-color text-text-main bg-card-bg focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl transition-all uppercase tracking-wider shadow-md shadow-brand-500/10 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isSignUp ? (
              <>
                <UserPlus className="w-4 h-4" />
                Register Civic Profile
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Sign In to Gateway
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-border-color"></div>
            <span className="flex-shrink mx-3 text-[9px] font-bold text-text-muted uppercase tracking-wider">or</span>
            <div className="flex-grow border-t border-border-color"></div>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 bg-card-bg hover:bg-card-hover border border-border-color text-text-main text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm focus:outline-none"
          >
            <span className="text-sm font-black text-brand-500 font-sans">G</span>
            <span>Continue with Google</span>
          </button>

          {/* Developer Sandbox Option */}
          <div className="relative flex py-1.5 items-center">
            <div className="flex-grow border-t border-border-color border-dashed"></div>
            <span className="flex-shrink mx-3 text-[9px] font-bold text-amber-500 uppercase tracking-wider">Test/Preview Fallback</span>
            <div className="flex-grow border-t border-border-color border-dashed"></div>
          </div>

          <button
            id="btn-sandbox-signin"
            type="button"
            onClick={handleDeveloperSandboxSignIn}
            disabled={loading}
            className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/15 border border-dashed border-amber-500/30 text-amber-600 hover:text-amber-500 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm focus:outline-none"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Sign In with Sandbox Account</span>
          </button>

          <p className="text-[9px] text-text-muted text-center leading-relaxed">
            * Note: Google Login is fully implemented. If it fails in this preview iframe, configure your Authorized Domains in the Firebase Console, or use the instant Sandbox bypass to test all premium features.
          </p>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccess(null);
              }}
              className="text-[10px] font-bold text-text-muted hover:text-text-main uppercase tracking-wide"
            >
              {isSignUp ? "Already have a profile? Sign In" : "Need an account? Sign Up for Free"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
