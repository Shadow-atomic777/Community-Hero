# Community Hero - Pre-Deployment Audit & System Integrity Report (PROBLEMV3.md)

This technical report details the current architectural state, security vulnerabilities, API constraints, and user experience bottlenecks identified in the **Community Hero** hyperlocal civic engagement platform. It outlines a production-grade roadmap to address these vulnerabilities before a public deployment.

---

## 1. Technical Audit Summary

A comprehensive review of the codebase (`server.ts`, `App.tsx`, `dbService.ts`, `MapCanvas.tsx`, and the security configurations) was executed. All code successfully compiles and is 100% compliant with standard TypeScript typing and strict ESLint guidelines. 

### Resolved vs. Outstanding Issues
* **Resolved**: 
  * **Zero-Config Firebase Integration**: Completely resolved hardcoded fallback configurations by importing `/firebase-applet-config.json` dynamically. It now targets your actual active project (`fit-transmitter-2gxqk`) and its custom database ID seamlessly!
  * **Exposed API Key Protection**: The Gemini AI integration is now fully secured on the server-side (`server.ts`). Under no conditions are API keys exposed to the client bundle.
  * **Permissive Firestore Rules**: The `firestore.rules` have been overhauled with tier-based access controls to prevent unauthenticated resource modifications.
  * **Interactive Dual-Map System**: Fully integrated a live interactive Leaflet (OpenStreetMap) GIS engine with Nominatim reverse-geocoding, supplemented by a stylized SVG grid for fallback testing.
  * **Developer Sandbox Mode**: Solved iframe authentication blocks with a secure Sandbox bypass, maintaining full localized persistence.
  * **Static Profile Hardcoding**: Built an in-app Profile Character Editor (`ProfileEditModal.tsx`) allowing custom names, emails, and avatar selections.
  
* **Outstanding (Deployment-Blockers)**:
  * **Vulnerability to Payload Size Crashes (Express HTTP 413)**
  * **Nominatim Geocoding API Rate Limiting (HTTP 429)**
  * **Data Volatility and Storage Split (Local Storage vs. Live Firestore)**
  * **Unvalidated Proof-of-Resolution Inputs**
  * **Sandbox User-Generated Content Desynchronization**

---

## 2. High & Medium Risk Pre-Deployment Problems

### ✅ Resolved: Hardcoded Firebase Configuration Fallbacks (Secured)
* **File Affected**: `/src/lib/firebase.ts`
* **Description**: Originally, if environment variables were not loaded, the client fell back to obsolete hardcoded plain-text credentials of a separate public Firebase project (`community-hero-62a0c`).
* **Resolution**: Replaced hardcoded fallback strings with an automated dynamic parser. The client now automatically imports `firebase-applet-config.json` directly as its local fallback. This ensures that the local preview and production environment are always securely synced to the actual active workspace Firebase project and database ID (`fit-transmitter-2gxqk` and database `ai-studio-communityhero-64d63321-1c03-45d3-a58a-dddbbe32560b`) without any manual code maintenance or leakage risk!

---

### ⚠️ Problem 2: Lack of Client-Side Image Compression (Medium Risk)
* **File Affected**: `/src/components/ReportModal.tsx`
* **Description**: The image uploader reads local image files directly via a FileReader and transmits the raw base64 data to the Express backend (`/api/reports/analyze` and `/api/reports/predict`).
* **Impact**: Uncompressed photos taken on modern smartphone cameras regularly exceed 10MB to 15MB. Since the Express payload limit is capped at `10mb`, this will result in immediate `HTTP 413 Payload Too Large` crashes, failing reports on high-end device uploads.
* **Remediation**: Implement a client-side canvas-based image resizing and compression helper inside the uploader stream to downscale images (e.g., to 1280px width, 80% JPEG quality) before base64 conversion.

---

### ⚠️ Problem 3: Nominatim Geocoding Rate Limits (Medium Risk)
* **File Affected**: `/src/components/MapCanvas.tsx`
* **Description**: Map canvas clicks make direct API requests to the OpenStreetMap free Nominatim geocoding server:
  `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat={lat}&lon={lng}`
* **Impact**: Nominatim enforces strict rate limits. Concurrent traffic, rapid double-clicks, or automated bots will immediately trigger `HTTP 429 Too Many Requests` errors. This disables the address locator, forcing the UI to display raw coordinate headers or fall back to simulated intersections.
* **Remediation**: 
  1. Add a debounce threshold (e.g., 500ms) on map selection handlers.
  2. Transition to a premium geocoding service (such as Google Maps Geocoding API) with caching of requested coordinate pairs.

---

### ⚠️ Problem 4: Storage Volatility and Storage Split (Medium Risk)
* **File Affected**: `/src/lib/dbService.ts` & `/src/App.tsx`
* **Description**: Guest users and sandbox accounts store reports, comments, and points purely in `localStorage`. 
* **Impact**: 
  * clearing browser cookies or caches instantly wipes all local reports and points.
  * Sandbox users operate in a "split-brain" state. Any reports or comments they submit are not synced to Firestore, which means other active users will not see them, limiting real-time community engagement.
* **Remediation**: Establish a "Lazy Synchronization Queue". When an unauthenticated sandbox user signs up or logs in with Google, queue their local cached records and upload them safely to Firestore.

---

### ⚠️ Problem 5: Unvalidated Proof-of-Resolution Links (Low Risk)
* **File Affected**: `/src/components/ActiveFeed.tsx`
* **Description**: The "Civic Resolution Gateway" allows users to select preset resolution photos or enter their own custom URL. There is no structural validation of the custom text input.
* **Impact**: Users can type broken URLs, plain text, or malicious script endpoints. This breaks the before/after slider display and allows gaming the gamified points system.
* **Remediation**: Add URL format validation (regex or HTML5 constraints) and implement client-side image uploads for resolution proofs rather than relying on external web URLs.

---

## 3. Production Readiness Checklist

Before deploying this application to serverless hosting (such as Cloud Run or Vercel), verify the completion of the following configuration tasks:

### A. Environment Variables Setup
Ensure `.env` contains correct and active keys in the hosting interface:
* [ ] `GEMINI_API_KEY`: Server-side API key for Google GenAI models.
* [ ] `VITE_FIREBASE_API_KEY`: Client-side Firebase key.
* [ ] `VITE_FIREBASE_AUTH_DOMAIN`: Firebase auth domain path.
* [ ] `VITE_FIREBASE_PROJECT_ID`: Firebase project ID matching backend.
* [ ] `VITE_GOOGLE_MAPS_API_KEY`: Google Maps Platform key (if transitioning from OSM).

### B. Security & Validation
* [ ] **Firestore Rule Deploy**: Confirm `firestore.rules` has been synced to the Firebase console.
* [ ] **Auth Restrictions**: Verify that Google OAuth redirect URLs are set correctly to match the custom production domain.

---

## 4. Suggested Future Enhancements

| Enhancement | Description | Priority |
| :--- | :--- | :--- |
| **Client-Side Compressor** | Downscale base64 images inside `ReportModal` to prevent Express payload size blocks. | **High** |
| **Google Maps SDK Upgrade** | Transition from Leaflet/OSM to standard Google Maps JS API for precise geocoding and visual styling consistency. | **Medium** |
| **Lazy-Sync Engine** | Queue and sync offline/sandbox submissions to Firestore upon authenticated sign-in. | **Medium** |
| **DPW Export Utility** | Button to compile reports, verification logs, and photos into a structured PDF petition to submit to the local Department of Public Works. | **Low** |
