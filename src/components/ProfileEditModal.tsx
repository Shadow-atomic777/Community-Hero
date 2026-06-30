import React, { useState, useEffect } from "react";
import { X, User, Mail, Sparkles } from "lucide-react";

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: { displayName: string; email: string; avatarUrl: string };
  onSave: (displayName: string, email: string, avatarUrl: string) => void;
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
  },
  {
    name: "Leo (Garden Coordinator)",
    url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80"
  },
  {
    name: "Chloe (Traffic Sentry)",
    url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80"
  },
  {
    name: "Zane (Smart Tech Expert)",
    url: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80"
  },
  {
    name: "Nisha (Urban Planner)",
    url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80"
  }
];

export default function ProfileEditModal({ isOpen, onClose, userProfile, onSave }: ProfileEditModalProps) {
  const [displayName, setDisplayName] = useState(userProfile.displayName);
  const [email, setEmail] = useState(userProfile.email);
  const [selectedAvatar, setSelectedAvatar] = useState(userProfile.avatarUrl);
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
  const [useCustomAvatar, setUseCustomAvatar] = useState(
    !PRESET_AVATARS.some((preset) => preset.url === userProfile.avatarUrl)
  );

  // Keep state synchronized with parent userProfile whenever modal opens or profile changes
  useEffect(() => {
    if (isOpen) {
      setDisplayName(userProfile.displayName || "");
      setEmail(userProfile.email || "");
      setSelectedAvatar(userProfile.avatarUrl || PRESET_AVATARS[0].url);
      const isCustom = !PRESET_AVATARS.some((preset) => preset.url === userProfile.avatarUrl);
      setUseCustomAvatar(isCustom);
      if (isCustom) {
        setCustomAvatarUrl(userProfile.avatarUrl || "");
      }
    }
  }, [isOpen, userProfile]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    
    const finalAvatar = useCustomAvatar && customAvatarUrl.trim() 
      ? customAvatarUrl.trim() 
      : selectedAvatar;

    onSave(displayName.trim(), email.trim() || "citizen@communityhero.org", finalAvatar);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
      <div 
        className="bg-card-bg w-full max-w-md rounded-3xl border border-border-color shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        id="profile-edit-panel"
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-5 border-b border-border-color">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-brand-500/10 text-brand-600 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black text-text-main uppercase tracking-wider font-mono">
              Edit Citizen Profile
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-card-hover rounded-lg text-text-muted hover:text-text-main transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          
          {/* Avatar Preview Section */}
          <div className="flex flex-col items-center py-3 bg-canvas-bg/40 border border-border-color rounded-2xl">
            <img
              src={useCustomAvatar && customAvatarUrl ? customAvatarUrl : selectedAvatar}
              alt="Avatar Preview"
              className="w-16 h-16 rounded-full object-cover border-2 border-brand-500 p-0.5 shadow-md"
              onError={(e) => {
                // Fallback icon if URL breaks
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80";
              }}
            />
            <span className="text-[10px] text-text-muted mt-2 font-semibold">Live Avatar Indicator</span>
          </div>

          {/* Name Input */}
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
                placeholder="e.g. Jane Civic"
                className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold rounded-xl border border-border-color text-text-main bg-card-bg focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
              />
            </div>
          </div>

          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. hero@civic.org"
                className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold rounded-xl border border-border-color text-text-main bg-card-bg focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
              />
            </div>
          </div>

          {/* Preset Avatars Selector */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider">
                Select Platform Character
              </label>
              <button
                type="button"
                onClick={() => setUseCustomAvatar(!useCustomAvatar)}
                className="text-[9px] font-extrabold text-brand-600 hover:text-brand-700 uppercase"
              >
                {useCustomAvatar ? "Use presets" : "Use custom URL"}
              </button>
            </div>

            {!useCustomAvatar ? (
              <div className="grid grid-cols-6 gap-2 pt-1">
                {PRESET_AVATARS.map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => setSelectedAvatar(preset.url)}
                    className={`relative rounded-full overflow-hidden aspect-square border-2 transition-all p-0.5 ${
                      selectedAvatar === preset.url && !useCustomAvatar
                        ? "border-brand-500 scale-105 shadow-md"
                        : "border-transparent hover:border-brand-200"
                    }`}
                    title={preset.name}
                  >
                    <img src={preset.url} alt={preset.name} className="w-full h-full object-cover rounded-full" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-1.5 pt-1">
                <input
                  type="url"
                  placeholder="Paste direct image URL (https://...)"
                  value={customAvatarUrl}
                  onChange={(e) => setCustomAvatarUrl(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs font-semibold rounded-xl border border-border-color text-text-main bg-card-bg focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t border-border-color">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-canvas-bg hover:bg-card-hover text-text-muted text-xs font-extrabold rounded-xl border border-border-color transition-all uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-extrabold rounded-xl transition-all uppercase tracking-wider shadow-md shadow-brand-500/10"
            >
              Save Profile
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
