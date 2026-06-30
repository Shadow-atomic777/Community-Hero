import React, { useState } from "react";
import { Search, Filter, MessageSquare, ThumbsUp, CheckCircle, Clock, ShieldAlert, ArrowRight, User, Plus, Send, MapPin, Navigation } from "lucide-react";
import { Report, IssueCategory, IssueStatus, Comment } from "../types";

interface ActiveFeedProps {
  reports: Report[];
  selectedReport: Report | null;
  onSelectReport: (report: Report) => void;
  onUpvote: (id: string) => void;
  onClaim: (id: string) => void;
  onResolve: (id: string, imgUrl: string) => void;
  onAddComment: (id: string, text: string) => void;
  currentUser: { uid: string; displayName: string; avatarUrl: string };
  center: { lat: number; lng: number };
}

function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000; // Radius of the earth in m
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in m
  return d;
}

export const RESOLVED_PRESETS = [
  {
    name: "Patched Road (Pothole)",
    url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=80"
  },
  {
    name: "Clean Area (Debris / Trash)",
    url: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=400&q=80"
  },
  {
    name: "Repaired Light (Bright Street)",
    url: "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=400&q=80"
  },
  {
    name: "Dry Utility Set (Water Pipe)",
    url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80"
  }
];

export default function ActiveFeed({
  reports,
  selectedReport,
  onSelectReport,
  onUpvote,
  onClaim,
  onResolve,
  onAddComment,
  currentUser,
  center,
}: ActiveFeedProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<IssueCategory | "All">("All");
  const [statusFilter, setStatusFilter] = useState<IssueStatus | "All">("All");
  const [radiusFilter, setRadiusFilter] = useState<string>("All");
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [newCommentTexts, setNewCommentTexts] = useState<Record<string, string>>({});
  const [resolvingReportId, setResolvingReportId] = useState<string | null>(null);
  const [resolvedImgUrl, setResolvedImgUrl] = useState(RESOLVED_PRESETS[0].url);
  const [resolutionError, setResolutionError] = useState<string | null>(null);

  // Filter reports
  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.formattedAddress.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "All" || r.category === categoryFilter;
    const matchesStatus = statusFilter === "All" || r.status === statusFilter;
    
    // Proximity calculations
    let matchesRadius = true;
    if (radiusFilter !== "All") {
      const distance = getDistanceInMeters(center.lat, center.lng, r.lat, r.lng);
      matchesRadius = distance <= Number(radiusFilter);
    }
    
    return matchesSearch && matchesCategory && matchesStatus && matchesRadius;
  });

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "Critical":
        return "bg-red-500 text-white";
      case "High":
        return "bg-amber-500 text-white";
      case "Medium":
        return "bg-blue-500 text-white";
      default:
        return "bg-slate-500 text-white";
    }
  };

  const getStatusBadge = (status: IssueStatus) => {
    switch (status) {
      case "resolved":
        return "bg-brand-100 text-brand-800 border-brand-200";
      case "in_progress":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "validated":
        return "bg-sky-100 text-sky-800 border-sky-200";
      default:
        return "bg-canvas-bg text-text-muted border-border-color";
    }
  };

  const handleSendComment = (reportId: string) => {
    const text = newCommentTexts[reportId];
    if (text && text.trim()) {
      onAddComment(reportId, text.trim());
      setNewCommentTexts((prev) => ({ ...prev, [reportId]: "" }));
    }
  };

  const triggerResolutionSubmit = (reportId: string) => {
    const trimmedUrl = resolvedImgUrl.trim();
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?.*$/i;
    
    if (!trimmedUrl || !urlPattern.test(trimmedUrl)) {
      setResolutionError("Please select a preset image or enter a valid web URL starting with http:// or https://");
      return;
    }
    
    setResolutionError(null);
    onResolve(reportId, trimmedUrl);
    setResolvingReportId(null);
  };

  return (
    <div className="flex flex-col h-full space-y-4" id="civic-reports-hub">
      
      {/* Search & Filter Header */}
      <div className="bg-card-bg p-4 rounded-2xl border border-border-color space-y-3 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by keywords, street address or title..."
            className="w-full pl-10 pr-4 py-2 text-xs font-semibold rounded-xl border border-border-color text-text-main bg-canvas-bg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 bg-canvas-bg border border-border-color px-3 py-1.5 rounded-xl text-text-muted">
            <Filter className="w-3.5 h-3.5 text-text-muted" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="bg-transparent text-xs font-bold outline-none cursor-pointer text-text-main"
            >
              <option value="All" className="bg-card-bg text-text-main">All Categories</option>
              <option value="Pothole" className="bg-card-bg text-text-main">Potholes</option>
              <option value="Water Leakage" className="bg-card-bg text-text-main">Water Leakages</option>
              <option value="Broken Streetlight" className="bg-card-bg text-text-main">Streetlights</option>
              <option value="Waste Management" className="bg-card-bg text-text-main">Waste Cleanup</option>
              <option value="Infrastructure" className="bg-card-bg text-text-main">Infrastructure</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5 bg-canvas-bg border border-border-color px-3 py-1.5 rounded-xl text-text-muted">
            <Clock className="w-3.5 h-3.5 text-text-muted" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-xs font-bold outline-none cursor-pointer text-text-main"
            >
              <option value="All" className="bg-card-bg text-text-main">All Statuses</option>
              <option value="reported" className="bg-card-bg text-text-main">Reported</option>
              <option value="validated" className="bg-card-bg text-text-main">Community Validated</option>
              <option value="in_progress" className="bg-card-bg text-text-main">In Progress</option>
              <option value="resolved" className="bg-card-bg text-text-main">Resolved</option>
            </select>
          </div>

          {/* Distance Proximity Dropdown */}
          <div className="flex items-center gap-1.5 bg-canvas-bg border border-border-color px-3 py-1.5 rounded-xl text-text-muted">
            <Navigation className="w-3.5 h-3.5 text-text-muted rotate-45" />
            <select
              value={radiusFilter}
              onChange={(e) => setRadiusFilter(e.target.value)}
              className="bg-transparent text-xs font-bold outline-none cursor-pointer text-text-main"
            >
              <option value="All" className="bg-card-bg text-text-main">All Neighborhood</option>
              <option value="300" className="bg-card-bg text-text-main">Within 300m</option>
              <option value="750" className="bg-card-bg text-text-main">Within 750m</option>
              <option value="1500" className="bg-card-bg text-text-main">Within 1.5km</option>
              <option value="3000" className="bg-card-bg text-text-main">Within 3.0km</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feed List Container */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-[400px]">
        {filteredReports.length === 0 ? (
          <div className="text-center py-12 bg-card-bg rounded-2xl border border-dashed border-border-color">
            <ShieldAlert className="w-8 h-8 text-text-muted mx-auto mb-2" />
            <h4 className="text-sm font-bold text-text-main">No active incidents found</h4>
            <p className="text-xs text-text-muted mt-1">Try broadening your filters or click the radar grid to report an issue.</p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <div
              key={report.id}
              onClick={() => onSelectReport(report)}
              className={`bg-card-bg rounded-2xl border transition-all hover:shadow-md cursor-pointer ${
                selectedReport?.id === report.id
                  ? "border-brand-500 ring-1 ring-brand-100"
                  : "border-border-color"
              }`}
            >
              {/* Card Images / Split view if resolved */}
              <div className="relative h-44 w-full overflow-hidden rounded-t-2xl bg-slate-900">
                {report.status === "resolved" && report.resolvedImageUrl ? (
                  <div className="grid grid-cols-2 h-full gap-0.5 relative">
                    <div className="relative h-full w-full">
                      <img src={report.imageUrl} alt="Before" className="w-full h-full object-cover filter brightness-75" />
                      <span className="absolute bottom-2 left-2 text-[9px] bg-red-600 text-white font-bold px-2 py-0.5 rounded-md uppercase">Before</span>
                    </div>
                    <div className="relative h-full w-full">
                      <img src={report.resolvedImageUrl} alt="After" className="w-full h-full object-cover filter brightness-95" />
                      <span className="absolute bottom-2 left-2 text-[9px] bg-brand-600 text-white font-bold px-2 py-0.5 rounded-md uppercase">Patched & Closed</span>
                    </div>
                  </div>
                ) : (
                  <img src={report.imageUrl} alt={report.title} className="w-full h-full object-cover" />
                )}

                {/* Floating Severity & Status badges */}
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase ${getSeverityBadge(report.severity)}`}>
                    {report.severity}
                  </span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase border ${getStatusBadge(report.status)}`}>
                    {report.status === "reported" ? "Needs Upvotes" : report.status.replace("_", " ")}
                  </span>
                </div>

                <div className="absolute top-3 right-3">
                  <span className="text-[10px] font-mono bg-slate-900/85 backdrop-blur-md text-white font-bold px-2 py-0.5 rounded-md">
                    {report.category}
                  </span>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4 space-y-3">
                <div>
                  <h4 className="text-sm font-bold text-text-main font-sans leading-snug line-clamp-1">{report.title}</h4>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed line-clamp-3">{report.description}</p>
                </div>

                {/* Address and Geolocation */}
                <div className="text-[10px] font-semibold text-text-muted flex items-center justify-between bg-canvas-bg px-2.5 py-1.5 rounded-xl border border-border-color">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                    <span className="truncate">{report.formattedAddress}</span>
                  </div>
                  <span className="text-[9.5px] font-mono text-brand-600 bg-brand-500/10 px-2 py-0.5 rounded shrink-0 font-bold ml-2">
                    {Math.round(getDistanceInMeters(center.lat, center.lng, report.lat, report.lng))}m away
                  </span>
                </div>

                {/* Gemini Safety Caution Strip if open */}
                {report.status !== "resolved" && report.aiCautionTips && (
                  <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-2.5 text-[11px] text-amber-900 flex gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block uppercase text-[8.5px] tracking-wider text-amber-800">Gemini Safety Advice</span>
                      <p className="font-medium mt-0.5 leading-relaxed">{report.aiCautionTips}</p>
                    </div>
                  </div>
                )}

                {/* Actions Bar */}
                <div className="flex items-center justify-between border-t border-border-color pt-3 flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-3">
                    {/* Upvote/Verify Button */}
                    <button
                      onClick={() => onUpvote(report.id)}
                      disabled={report.status === "resolved"}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all ${
                        report.upvotedBy.includes(currentUser.uid)
                          ? "bg-brand-50 border-brand-300 text-brand-700"
                          : "bg-canvas-bg border-border-color text-text-muted hover:bg-card-hover hover:text-text-main"
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{report.upvoteCount} Verification{report.upvoteCount !== 1 ? "s" : ""}</span>
                    </button>

                    {/* Toggle Comments Button */}
                    <button
                      onClick={() => setExpandedComments((prev) => ({ ...prev, [report.id]: !prev[report.id] }))}
                      className="text-xs font-bold text-text-muted hover:text-text-main bg-canvas-bg hover:bg-card-hover border border-border-color px-3 py-1.5 rounded-xl flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{report.comments?.length || 0} discussion</span>
                    </button>
                  </div>

                  {/* Resolution Action Button */}
                  {report.status !== "resolved" && (
                    <div className="flex gap-2">
                      {report.status !== "in_progress" && (
                        <button
                          onClick={() => onClaim(report.id)}
                          className="bg-indigo-50/10 hover:bg-indigo-50/20 text-indigo-400 border border-indigo-500/30 text-xs font-extrabold px-3 py-1.5 rounded-xl transition-all"
                        >
                          Volunteer
                        </button>
                      )}
                      <button
                        onClick={() => setResolvingReportId(resolvingReportId === report.id ? null : report.id)}
                        className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Resolve
                      </button>
                    </div>
                  )}
                </div>

                {/* Inline Resolution Panel */}
                {resolvingReportId === report.id && (
                  <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4 space-y-4.5 mt-3.5 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center border-b border-brand-100 pb-2.5">
                      <span className="block text-[10px] font-mono font-black text-brand-800 uppercase tracking-widest">CIVIC RESOLUTION GATEWAY</span>
                      <span className="text-[9px] font-mono bg-brand-500/10 text-brand-700 px-1.5 py-0.25 rounded font-extrabold">+50 PTS AWARD</span>
                    </div>
                    
                    <p className="text-[11px] text-brand-900 leading-relaxed font-semibold">
                      Verify that the community issue has been successfully resolved. Please select or paste a visual proof of repair to close this ticket:
                    </p>

                    {/* Pre-selected Resolved Photo Thumbnails */}
                    <div className="space-y-2">
                      <label className="block text-[9.5px] font-bold text-brand-800 uppercase tracking-wide">
                        Select Repair Proof Photo
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {RESOLVED_PRESETS.map((preset) => (
                          <button
                            key={preset.url}
                            type="button"
                            onClick={() => {
                              setResolvedImgUrl(preset.url);
                              setResolutionError(null);
                            }}
                            className={`relative rounded-xl overflow-hidden aspect-video border-2 transition-all p-0.5 bg-white ${
                              resolvedImgUrl === preset.url
                                ? "border-brand-500 scale-[1.03] shadow-sm"
                                : "border-transparent hover:border-brand-200"
                            }`}
                            title={preset.name}
                          >
                            <img src={preset.url} alt={preset.name} className="w-full h-full object-cover rounded-lg" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom URL Input option */}
                    <div className="space-y-1.5">
                      <label className="block text-[9.5px] font-bold text-brand-800 uppercase tracking-wide">
                        Or Paste Custom Proof Image URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/photo-..."
                        value={resolvedImgUrl}
                        onChange={(e) => {
                          setResolvedImgUrl(e.target.value);
                          setResolutionError(null);
                        }}
                        className="w-full text-[11px] font-semibold rounded-xl border border-brand-200/80 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all"
                      />
                    </div>

                    {resolutionError && (
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold">
                        ⚠️ {resolutionError}
                      </div>
                    )}

                    <div className="flex gap-2 pt-1 border-t border-brand-100">
                      <button
                        onClick={() => triggerResolutionSubmit(report.id)}
                        disabled={!resolvedImgUrl.trim()}
                        className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-extrabold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Confirm Repair & Close Ticket
                      </button>
                      <button
                        onClick={() => setResolvingReportId(null)}
                        className="px-4 py-2.5 bg-canvas-bg hover:bg-card-hover text-text-muted hover:text-text-main text-xs font-bold rounded-xl border border-border-color"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline Expanded Comments Thread */}
                {expandedComments[report.id] && (
                  <div className="border-t border-border-color pt-3.5 mt-3 space-y-3.5" onClick={(e) => e.stopPropagation()}>
                    <span className="block text-[10px] font-bold text-text-muted uppercase tracking-wider">Crowdsourced Comments</span>
                    
                    {/* Comments List */}
                    <div className="space-y-3">
                      {!report.comments || report.comments.length === 0 ? (
                        <p className="text-[11px] text-text-muted italic">No community comments yet. Start the conversation!</p>
                      ) : (
                        report.comments.map((comment) => (
                          <div key={comment.id} className="flex gap-2.5 items-start">
                            <img src={comment.authorAvatar} alt={comment.authorName} className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5" />
                            <div className="bg-canvas-bg border border-border-color rounded-2xl p-2.5 flex-1">
                              <div className="flex justify-between items-center mb-0.5">
                                <span className="text-[10px] font-bold text-text-main">{comment.authorName}</span>
                                <span className="text-[8.5px] font-mono text-text-muted">
                                  {new Date(comment.createdAt).toLocaleDateString(undefined, { hour: 'numeric', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs text-text-main font-medium leading-relaxed">{comment.text}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* New Comment Input */}
                    <div className="flex gap-2 items-center pt-1">
                      <input
                        type="text"
                        value={newCommentTexts[report.id] || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewCommentTexts((prev) => ({ ...prev, [report.id]: val }));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSendComment(report.id);
                        }}
                        placeholder="Write a helpful comment to coordinate efforts..."
                        className="flex-1 bg-canvas-bg hover:bg-card-hover/60 border border-border-color text-text-main text-xs font-medium rounded-xl p-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                      <button
                        onClick={() => handleSendComment(report.id)}
                        className="p-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition-all shadow-md"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
