import React, { useState, useMemo, useRef, useEffect } from "react";
import { MapPin, Navigation, Compass, Layers, AlertCircle, Sparkles, CheckCircle, ShieldAlert, Globe } from "lucide-react";
import { Report, IssueCategory } from "../types";

interface MapCanvasProps {
  reports: Report[];
  selectedReport: Report | null;
  onSelectReport: (report: Report) => void;
  onMapClick: (coords: { lat: number; lng: number; address: string }) => void;
  center: { lat: number; lng: number };
}

export default function MapCanvas({
  reports,
  selectedReport,
  onSelectReport,
  onMapClick,
  center,
}: MapCanvasProps) {
  const [svgZoom, setSvgZoom] = useState<number>(1);
  const [svgPan, setSvgPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Switch between OpenStreetMap (Leaflet) and Vector SVG Grid
  const [activeMap, setActiveMap] = useState<"leaflet" | "vector">("leaflet");

  const leafletContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);

  const getCategoryColor = (cat: IssueCategory, type: "bg" | "border" | "text" | "pin") => {
    switch (cat) {
      case "Pothole":
        return type === "bg" ? "bg-amber-100" : type === "border" ? "border-amber-300" : type === "text" ? "text-amber-950 font-extrabold" : "#F59E0B";
      case "Water Leakage":
        return type === "bg" ? "bg-blue-100" : type === "border" ? "border-blue-300" : type === "text" ? "text-blue-950 font-extrabold" : "#3B82F6";
      case "Broken Streetlight":
        return type === "bg" ? "bg-indigo-100" : type === "border" ? "border-indigo-300" : type === "text" ? "text-indigo-950 font-extrabold" : "#6366F1";
      case "Waste Management":
        return type === "bg" ? "bg-emerald-100" : type === "border" ? "border-emerald-300" : type === "text" ? "text-emerald-950 font-extrabold" : "#10B981";
      default:
        return type === "bg" ? "bg-slate-100" : type === "border" ? "border-slate-300" : type === "text" ? "text-slate-950 font-extrabold" : "#64748B";
    }
  };

  // Live Free Leaflet (OpenStreetMap) Map Engine
  useEffect(() => {
    if (activeMap !== "leaflet" || !leafletContainerRef.current) return;
    const L = (window as any).L;
    if (!L) {
      console.warn("Leaflet library is still loading or not found in index.html.");
      return;
    }

    // Always clean up existing instance
    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }

    try {
      const map = L.map(leafletContainerRef.current, {
        zoomControl: false,
      }).setView([center.lat, center.lng], 15);
      leafletMapRef.current = map;

      // Add zoom control to bottom right
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Add high-resolution OSM live tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // Add interactive pins for reports
      reports.forEach((report) => {
        const pinColor = getCategoryColor(report.category, "pin");
        const customIcon = L.divIcon({
          className: "custom-leaflet-marker",
          html: `<div style="background-color: ${pinColor}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.4); transform: scale(${selectedReport?.id === report.id ? "1.3" : "1"}); transition: all 0.2s;"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        const marker = L.marker([report.lat, report.lng], { icon: customIcon }).addTo(map);

        // Bind custom styled popups
        marker.bindPopup(`
          <div style="font-family: system-ui, sans-serif; font-size: 11px; color: #1e293b; min-width: 150px; padding: 4px;">
            <strong style="font-size: 12px; display: block; margin-bottom: 4px; color: #0f172a;">${report.title}</strong>
            <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; background-color: ${pinColor}15; color: ${pinColor}; font-weight: bold; font-size: 9px; margin-bottom: 6px;">
              ${report.category}
            </span>
            <div style="font-size: 10px; color: #64748b; margin-bottom: 6px;">Severity: <strong>${report.severity}</strong></div>
            <button id="leaflet-btn-${report.id}" style="width: 100%; background-color: var(--brand-600, #10b981); color: white; border: none; padding: 5px; border-radius: 6px; font-weight: bold; cursor: pointer; text-transform: uppercase; font-size: 9px; transition: opacity 0.2s;">
              Select & Inspect
            </button>
          </div>
        `);

        marker.on("popupopen", () => {
          const btn = document.getElementById(`leaflet-btn-${report.id}`);
          if (btn) {
            btn.addEventListener("click", () => {
              onSelectReport(report);
              map.closePopup();
            });
          }
        });
      });

      // Handle map click with automatic FREE reverse geocoding via Nominatim API
      map.on("click", async (e: any) => {
        const { lat, lng } = e.latlng;
        let finalAddress = `Simulated Intersect at Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;

        try {
          // Free, key-less real reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
            {
              headers: {
                "User-Agent": "CivicRadarCommunityHeroApp/1.0",
              },
            }
          );
          if (response.ok) {
            const data = await response.json();
            if (data && data.display_name) {
              finalAddress = data.display_name;
            }
          }
        } catch (err) {
          console.warn("Nominatim reverse geocode fallback:", err);
        }

        onMapClick({
          lat: Number(lat.toFixed(6)),
          lng: Number(lng.toFixed(6)),
          address: finalAddress,
        });
      });
    } catch (e) {
      console.error("Leaflet initialization failure:", e);
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [activeMap, center, reports, selectedReport]);

  // Helpers to map lat/lng coordinates to our local 800x500 vector grid canvas
  const gridProjection = useMemo(() => {
    if (reports.length === 0) {
      return {
        toXY: (lat: number, lng: number) => ({ x: 400, y: 250 }),
        fromXY: (x: number, y: number) => ({ lat: center.lat, lng: center.lng }),
      };
    }

    let minLat = center.lat - 0.01;
    let maxLat = center.lat + 0.01;
    let minLng = center.lng - 0.01;
    let maxLng = center.lng + 0.01;

    reports.forEach((r) => {
      if (r.lat < minLat) minLat = r.lat;
      if (r.lat > maxLat) maxLat = r.lat;
      if (r.lng < minLng) minLng = r.lng;
      if (r.lng > maxLng) maxLng = r.lng;
    });

    const latRange = maxLat - minLat || 0.01;
    const lngRange = maxLng - minLng || 0.01;

    const paddedMinLat = minLat - latRange * 0.1;
    const paddedMaxLat = maxLat + latRange * 0.1;
    const paddedMinLng = minLng - lngRange * 0.1;
    const paddedMaxLng = maxLng + lngRange * 0.1;

    const finalLatRange = paddedMaxLat - paddedMinLat;
    const finalLngRange = paddedMaxLng - paddedMinLng;

    return {
      toXY: (lat: number, lng: number) => {
        const x = ((lng - paddedMinLng) / finalLngRange) * 800;
        const y = 500 - ((lat - paddedMinLat) / finalLatRange) * 500;
        return { x, y };
      },
      fromXY: (x: number, y: number) => {
        const lng = paddedMinLng + (x / 800) * finalLngRange;
        const lat = paddedMinLat + ((500 - y) / 500) * finalLatRange;
        return { lat, lng };
      },
    };
  }, [reports, center]);

  // Handle click on our localized SVG Vector Canvas map
  const handleSvgCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const viewboxX = (clickX / rect.width) * 800;
    const viewboxY = (clickY / rect.height) * 500;

    const coords = gridProjection.fromXY(viewboxX, viewboxY);
    const mockAddresses = [
      "McAllister St & Polk St",
      "Grove St & Larkin St",
      "Golden Gate Ave & Hyde St",
      "Fulton St & Franklin St",
      "Market St & 7th St",
      "Van Ness Ave & Hayes St"
    ];
    const randomAddress = mockAddresses[Math.floor(Math.random() * mockAddresses.length)] + ", Local Ward";

    onMapClick({
      lat: Number(coords.lat.toFixed(6)),
      lng: Number(coords.lng.toFixed(6)),
      address: randomAddress,
    });
  };

  return (
    <div className="relative h-full w-full rounded-2xl overflow-hidden shadow-sm border border-border-color bg-canvas-bg flex flex-col" id="master-map-canvas-container">
      
      {/* Absolute Control Header Overlay */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-wrap gap-2 items-center justify-between pointer-events-none">
        
        {/* Toggle Map Mode Selector */}
        <div className="flex gap-1 p-1 bg-card-bg/95 backdrop-blur-md rounded-xl border border-border-color shadow-lg pointer-events-auto">
          <button
            onClick={() => setActiveMap("leaflet")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide transition-all ${
              activeMap === "leaflet"
                ? "bg-brand-600 text-white shadow-sm"
                : "text-text-muted hover:text-text-main hover:bg-card-hover"
            }`}
          >
            🗺️ Live Map (Free)
          </button>
          
          <button
            onClick={() => setActiveMap("vector")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide transition-all ${
              activeMap === "vector"
                ? "bg-brand-600 text-white shadow-sm"
                : "text-text-muted hover:text-text-main hover:bg-card-hover"
            }`}
          >
            📡 Radar Grid (Simulated)
          </button>
        </div>

        {/* Live indicator badge */}
        <div className="pointer-events-auto bg-card-bg/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-border-color text-text-main shadow-lg text-[10px] font-mono font-bold flex items-center gap-1.5">
          <Globe className={`w-3.5 h-3.5 text-brand-600 ${activeMap === "leaflet" ? "animate-spin" : ""}`} style={{ animationDuration: "12s" }} />
          <span className="text-text-muted">MODE:</span>
          <span className="text-brand-600 uppercase tracking-wide">{activeMap}</span>
        </div>
      </div>

      {/* RENDER VIEWPORT ACCORDING TO STATE */}
      <div className="flex-1 w-full h-full relative min-h-[420px]">
        
        {/* VIEW 1: FREE INTERACTIVE LEAFLET OPENSTREETMAP */}
        {activeMap === "leaflet" && (
          <div className="w-full h-full absolute inset-0">
            <div ref={leafletContainerRef} className="w-full h-full" style={{ zIndex: 1 }} />
            
            {/* Quick interactive guide overlay */}
            <div className="absolute bottom-4 left-4 right-4 bg-card-bg/95 backdrop-blur-md p-3 rounded-xl border border-border-color text-text-main shadow-lg text-[10px] font-semibold z-[1000] pointer-events-none flex items-center gap-2 max-w-md">
              <AlertCircle className="w-4 h-4 text-brand-500 shrink-0" />
              <span><strong>Completely Free Map:</strong> Powered by OpenStreetMap. Click anywhere on the streets to search reverse geocoding addresses dynamically!</span>
            </div>
          </div>
        )}

        {/* VIEW 3: FALLBACK VECTOR SVG RADAR */}
        {activeMap === "vector" && (
          <div className="w-full h-full absolute inset-0 flex flex-col" id="vector-radar-viewport">
            <div className="bg-gradient-to-r from-brand-500/10 to-brand-600/5 border-b border-border-color p-3.5 flex items-center justify-between pt-16">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-brand-500/15 rounded-lg text-brand-600">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-main flex items-center gap-1.5">
                    Civic Radar Grid
                  </h4>
                  <p className="text-[10px] text-text-muted mt-0.5">
                    Simulated high-contrast navigation vector grid. Best for fast and low-bandwidth telemetry audits.
                  </p>
                </div>
              </div>
            </div>

            <svg
              viewBox="0 0 800 500"
              className="w-full h-full max-h-[460px] bg-canvas-bg transition-all select-none cursor-crosshair relative"
              onClick={handleSvgCanvasClick}
            >
              {/* Grid Background Patterns */}
              <defs>
                <pattern id="radar-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--border-color)" strokeWidth="0.5" opacity="0.3" />
                </pattern>
                <pattern id="radar-fine-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="var(--border-color)" strokeWidth="0.25" opacity="0.1" />
                </pattern>
              </defs>

              <rect width="100%" height="100%" fill="var(--canvas-bg)" />
              <rect width="100%" height="100%" fill="url(#radar-grid)" />
              <rect width="100%" height="100%" fill="url(#radar-fine-grid)" />

              {/* Civic Center and Parks */}
              <circle cx="400" cy="250" r="180" fill="var(--brand-500)" opacity="0.03" className="animate-pulse" style={{ animationDuration: "10s" }} />
              <circle cx="400" cy="250" r="120" fill="var(--brand-500)" opacity="0.02" />
              <circle cx="400" cy="250" r="60" fill="var(--brand-500)" opacity="0.02" />

              <rect x="40" y="50" width="180" height="120" rx="12" fill="var(--brand-500)" opacity="0.08" />
              <text x="130" y="115" fill="var(--brand-600)" fontSize="10" fontWeight="700" textAnchor="middle" opacity="0.5">Civic Park</text>

              <rect x="580" y="280" width="180" height="150" rx="12" fill="var(--brand-500)" opacity="0.08" />
              <text x="670" y="350" fill="var(--brand-600)" fontSize="10" fontWeight="700" textAnchor="middle" opacity="0.5">Community Forest</text>

              {/* Water Reservoir Stream */}
              <path
                d="M -20,250 Q 200,200 400,300 T 820,180"
                fill="none"
                stroke="#E1F5FE"
                strokeWidth="32"
                strokeLinecap="round"
                opacity="0.8"
              />
              <path
                d="M -20,250 Q 200,200 400,300 T 820,180"
                fill="none"
                stroke="#B3E5FC"
                strokeWidth="12"
                strokeLinecap="round"
                opacity="0.6"
              />
              <text x="350" y="250" fill="#0288D1" fontSize="9" fontWeight="600" opacity="0.5" transform="rotate(12, 350, 250)">Civic River</text>

              {/* Major Streets Grid Layout */}
              <g stroke="var(--border-color)" strokeWidth="6" strokeLinecap="round" opacity="0.4">
                <line x1="0" y1="100" x2="800" y2="100" />
                <line x1="0" y1="220" x2="800" y2="220" />
                <line x1="0" y1="380" x2="800" y2="380" />
                <line x1="180" y1="0" x2="180" y2="500" />
                <line x1="420" y1="0" x2="420" y2="500" />
                <line x1="640" y1="0" x2="640" y2="500" />
              </g>

              {/* Street Labels */}
              <g fill="var(--text-muted)" fontSize="8" fontWeight="600" letterSpacing="0.05em" opacity="0.7">
                <text x="10" y="94">MCALLISTER BOULEVARD</text>
                <text x="10" y="214">FULTON AVENUE</text>
                <text x="10" y="374">MARKET STREET</text>
                <text x="190" y="20" transform="rotate(90, 190, 20)">LARKIN AVENUE</text>
                <text x="430" y="20" transform="rotate(90, 430, 20)">FRANKLIN AVENUE</text>
                <text x="650" y="20" transform="rotate(90, 650, 20)">VAN NESS HIGHWAY</text>
              </g>

              {/* Compass rose */}
              <g transform="translate(730, 60)" opacity="0.8" className="pointer-events-none">
                <circle cx="0" cy="0" r="22" fill="var(--card-bg)" stroke="var(--border-color)" strokeWidth="1.5" />
                <line x1="0" y1="-18" x2="0" y2="18" stroke="var(--text-muted)" strokeWidth="1" />
                <line x1="-18" y1="0" x2="18" y2="0" stroke="var(--text-muted)" strokeWidth="1" />
                <polygon points="0,-16 4,0 -4,0" fill="var(--brand-500)" />
                <polygon points="0,16 4,0 -4,0" fill="var(--text-muted)" />
                <text x="0" y="-20" fill="var(--brand-500)" fontSize="8" fontWeight="bold" textAnchor="middle">N</text>
              </g>

              {/* Interactive Issue Markers */}
              {reports.map((report) => {
                const { x, y } = gridProjection.toXY(report.lat, report.lng);
                const isSelected = selectedReport?.id === report.id;
                const markerColor = getCategoryColor(report.category, "pin");

                return (
                  <g
                    key={report.id}
                    className="group cursor-pointer transition-all duration-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectReport(report);
                    }}
                  >
                    {report.status !== "resolved" && (report.severity === "Critical" || report.severity === "High") && (
                      <circle
                        cx={x}
                        cy={y}
                        r={isSelected ? 18 : 12}
                        fill={markerColor}
                        opacity="0.25"
                        className="animate-ping"
                        style={{ animationDuration: "3s" }}
                      />
                    )}

                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 10 : 7}
                      fill={report.status === "resolved" ? "#10B981" : markerColor}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      className="shadow-md transition-all hover:scale-125"
                    />

                    {report.status === "resolved" ? (
                      <circle cx={x} cy={y} r="2.5" fill="white" />
                    ) : (
                      <circle cx={x} cy={y} r="2.5" fill="#FFFFFF" />
                    )}

                    {/* Tooltip Hover Card */}
                    <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <rect x={x - 80} y={y - 55} width="160" height="45" rx="8" fill="#0F172A" opacity="0.95" />
                      <polygon points={`${x},${y-10} ${x-6},${y-16} ${x+6},${y-16}`} fill="#0F172A" opacity="0.95" />
                      <text x={x} y={y - 42} fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle">
                        {report.title.slice(0, 22)}
                      </text>
                      <text x={x} y={y - 30} fill="#94A3B8" fontSize="7.5" textAnchor="middle">
                        {report.category} • {report.severity}
                      </text>
                      <text x={x} y={y - 20} fill="#10B981" fontSize="7" fontWeight="bold" textAnchor="middle">
                        Status: {report.status.toUpperCase()}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>

            <div className="absolute bottom-4 left-4 bg-card-bg/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-border-color text-text-main shadow-lg pointer-events-none">
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <Navigation className="w-3.5 h-3.5 text-brand-500 animate-pulse" />
                <span className="text-text-muted font-semibold">RADAR LOCK:</span>
                <span className="text-brand-600 font-bold">{center.lat.toFixed(4)}°N, {center.lng.toFixed(4)}°W</span>
              </div>
            </div>

            <div className="absolute bottom-4 right-4 bg-card-bg/95 backdrop-blur-md p-2.5 rounded-xl border border-border-color text-text-main shadow-lg text-[10px] font-semibold max-w-[220px] pointer-events-none flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-brand-500 shrink-0" />
              <span>Click anywhere on the radar grid above to simulate reporting an issue at those GPS coordinates!</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
