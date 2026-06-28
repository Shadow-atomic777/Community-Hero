import React, { useState } from "react";
import { Database, X, Sparkles } from "lucide-react";

export default function FirebaseInitBanner() {
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem("civic-banner-dismissed") === "true";
  });

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("civic-banner-dismissed", "true");
  };

  if (isDismissed) return null;

  return (
    <div className="bg-card-bg border border-border-color text-text-main rounded-2xl p-4 flex gap-3.5 items-center justify-between shadow-sm animate-fade-in transition-colors duration-300">
      <div className="flex gap-3.5 items-center">
        <div className="p-2 bg-brand-500/10 rounded-xl border border-brand-500/20 text-brand-500 shrink-0">
          <Database className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-text-main flex items-center gap-2 flex-wrap">
            Local Sandbox Mode Enabled
            <span className="text-[9px] font-mono bg-brand-500/10 text-brand-600 border border-brand-500/20 px-2 py-0.5 rounded-full font-bold">
              AUTOSAVE ACTIVE
            </span>
          </h4>
          <p className="text-[11px] text-text-muted leading-relaxed font-medium mt-0.5">
            Your reported issues, comments, and points are persistent in this browser.
            To scale to real-time municipal-wide databases, you can connect a cloud-hosted Firebase backend.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="hidden lg:block">
          <span className="text-[10px] font-mono text-text-muted font-bold bg-canvas-bg px-2.5 py-1 rounded-lg border border-border-color">
            SECURE CLIENT v1.0
          </span>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1.5 hover:bg-card-hover rounded-lg text-text-muted hover:text-text-main transition-colors"
          title="Dismiss notice"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

