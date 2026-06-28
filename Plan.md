# Plan.md - Community Hero: Hyperlocal Problem Solver

Community Hero is a production-grade, highly polished hyperlocal platform that empowers citizens to identify, report, validate, track, and resolve community infrastructure and environmental issues (like potholes, water leaks, and broken streetlights). It combines interactive mapping, server-side Gemini AI vision categorization, and gamified civic participation.

---

## 1. Project Overview & Architectural Flow

The application will be built as a full-stack **Express + Vite + React (TypeScript)** application to comply with API security standards. This guarantees that all sensitive credentials (such as Google Maps API Key and Gemini API Key) remain securely server-side.

```
+--------------------------------------------------------------------------+
|                                FRONTEND                                  |
|  - React 19 (TS) + Tailwind CSS + Framer Motion (Route Transitions)      |
|  - @vis.gl/react-google-maps (Advanced Marker Elements & InfoWindows)    |
|  - Firebase Client SDK (Auth, Firestore Real-time Synced Feeds)          |
+------------------------------------+-------------------------------------+
                                     |
                                     |  Secure API Proxies
                                     v
+--------------------------------------------------------------------------+
|                                BACKEND                                   |
|  - Node.js Express Server on Port 3000                                   |
|  - Server-side Gemini AI Vision Proxy (/api/reports/analyze)              |
|  - Google Maps Geocoding / Address Proxy                                 |
+------------------------------------+-------------------------------------+
                                     |
                                     v  External SDK integrations
+--------------------------------------------------------------------------+
|                         INFRASTRUCTURE & SERVICE CORES                   |
|  - Firebase Firestore (Persistent Storage & Sync)                        |
|  - Firebase Authentication (Google Single Sign-On Popup)                 |
|  - Google Gen AI SDK (@google/genai using gemini-3.5-flash)              |
+--------------------------------------------------------------------------+
```

---

## 2. Detailed Feature Specification

### A. Dynamic Issue Reporting & AI Verification (The "Zero-Effort Reporter")
*   **Touch-Optimized Camera & Drag-and-Drop Image Uploader**: Allows users to snap a picture or upload an image of the local issue.
*   **Autonomous Gemini AI Vision Analysis**:
    *   Once an image is selected, the frontend sends the base64-encoded file to `/api/reports/analyze`.
    *   The backend calls the Gemini model (`gemini-3.5-flash`) to parse the image, returning:
        *   **Standardized Category** (`Pothole`, `Water Leakage`, `Broken Streetlight`, `Waste Management`, `General Public Infrastructure`).
        *   **Severity Level** (`Low`, `Medium`, `High`, `Critical`).
        *   **Automated Description**: A concise, professionally formatted summary of the damage.
        *   **Actionable Advice**: AI-generated recommended immediate caution (e.g., "Avoid driving through standing water as pothole depth is hidden").
*   **Smart Location Detection**:
    *   Autocompletes location via standard device Geolocation.
    *   Exposes a fallback Google Maps Autocomplete search bar if users want to report an issue elsewhere.
    *   Back-fills the geographic coordinates (`lat`, `lng`) and formatted street address.

### B. Immersive Interactive Map (The "Civic Radar")
*   **Fully Functional Map View**: Built with `@vis.gl/react-google-maps` utilising highly customized `AdvancedMarker` components.
*   **Visual Color Coding & Icons**:
    *   Markers are color-coded based on category and status (e.g., Red for Critical Reported, Yellow for In-Progress, Green for Resolved).
*   **Marker InfoWindows**: Clicking any marker opens an elegant sliding card showing:
    *   The analyzed photo of the issue.
    *   Category, description, and severity rating.
    *   Community verification metrics.
    *   Direct links to "View Comments" and "Validate Issue".
*   **Advanced Filtering Controls**: Fluid sidebar filters allowing users to view issues by:
    *   Status (`Reported`, `Validated`, `In-Progress`, `Resolved`).
    *   Category.
    *   Severity.
    *   Hyperlocal Radius (e.g., within 1 km, 5 km, 10 km).

### C. Community Validation & Consensus Engine (The "Anti-Spam Guard")
*   **Civic Upvoting / Verification**: To ensure database integrity, neighbors can click a "Verify This Issue" button. This registers their assertion and increases the report's credibility.
*   **State Progression Lifecycle**:
    *   **Reported**: Initial AI-created report.
    *   **Validated**: Automatically transitions when +3 community members upvote/verify the issue.
    *   **In-Progress**: Action flagged when acknowledged by community coordinators or local volunteers.
    *   **Resolved**: Citizens can submit "After Photos" to close the ticket, earning premium badges.

### D. Before/After Civic Closures
*   A "Mark as Resolved" panel on active reports where verified local heroes can upload a "Resolved Image".
*   Displaying an interactive Before/After image comparison slider to highlight the direct impact of community efforts.

### E. Gamified Profile & Leaderboards
*   **Points & Levels System**:
    *   *Report an Issue*: +10 Points.
    *   *Verify/Upvote an Issue*: +2 Points.
    *   *Resolve an Issue with Photo*: +50 Points.
    *   *Helpful Comment*: +5 Points.
*   **Civic Badges**:
    *   `Pothole Ranger` (3 pothole reports).
    *   `Beacon of Light` (3 streetlight reports).
    *   `Eco Warrior` (Waste cleanup verification).
    *   `Civic Sentinel` (Top contributor on the local leaderboard).
*   **Real-time Leaderboard**: Dynamic ranking of top "Community Heroes" within the municipality to encourage friendly competition and high participation.

### F. Global Predictive Analytics Dashboard
*   **Live Metrics Panel**: Displays total reported issues, active resolutions, overall resolution rates, and average ticket lifetime.
*   **Heatmap Visualization**: Highlights density concentrations of unresolved issues using customizable map clusters.
*   **Gemini AI Trend Synthesis**:
    *   Runs a weekly regional analysis model asking Gemini to synthesize geographic and category trends.
    *   Outputs proactive infrastructure predictions (e.g., "Multiple minor water leakages in a 200m radius of Sector 4 suggest main trunk pipe degradation. Recommend preventative municipal inspection.").

---

## 3. Technology Stack & Packages

### A. Core Technologies
*   **Language**: TypeScript (strict-mode compiler rules).
*   **Frontend**: React 19 (Vite bundle system), `@vis.gl/react-google-maps` (Maps canvas), `motion` (route and layout micro-animations), `lucide-react` (icon set).
*   **Backend**: Node.js + Express.js + `tsx` (TypeScript executor).
*   **Database & Auth**: Firebase Firestore & Firebase Auth (Google Provider popup flow).
*   **AI Integration**: Google Gen AI SDK (`@google/genai`) on the server.

### B. Package.json Verification & Installation Checklist
We have the following packages pre-installed:
*   `@google/genai`, `dotenv`, `express`, `lucide-react`, `motion`, `react`, `react-dom`, `vite`.
*   *Required Packages to Install*: `@vis.gl/react-google-maps` for maps, and `firebase` for persistence.

---

## 4. Firestore Database Schema & Security Rules Blueprint

### A. intermediate representation (`firebase-blueprint.json`)
```json
{
  "entities": {
    "User": {
      "title": "User Profile",
      "description": "Stores gamified civic credentials of the user",
      "type": "object",
      "properties": {
        "uid": { "type": "string", "description": "Auth UID matching request.auth.uid" },
        "displayName": { "type": "string" },
        "email": { "type": "string" },
        "avatarUrl": { "type": "string" },
        "points": { "type": "integer" },
        "badges": { "type": "array" },
        "createdAt": { "type": "string", "format": "date-time" }
      },
      "required": ["uid", "displayName", "email", "points", "badges", "createdAt"]
    },
    "Report": {
      "title": "Community Incident Report",
      "description": "Core report detailing community issues and resolution status",
      "type": "object",
      "properties": {
        "reportId": { "type": "string" },
        "reporterId": { "type": "string" },
        "reporterName": { "type": "string" },
        "title": { "type": "string" },
        "description": { "type": "string" },
        "category": { "type": "string" },
        "severity": { "type": "string" },
        "imageUrl": { "type": "string" },
        "lat": { "type": "number" },
        "lng": { "type": "number" },
        "formattedAddress": { "type": "string" },
        "status": { "type": "string", "enum": ["reported", "validated", "in_progress", "resolved"] },
        "upvoteCount": { "type": "integer" },
        "upvotedBy": { "type": "array" },
        "resolvedImageUrl": { "type": "string" },
        "resolvedBy": { "type": "string" },
        "aiCautionTips": { "type": "string" },
        "createdAt": { "type": "string", "format": "date-time" },
        "updatedAt": { "type": "string", "format": "date-time" }
      },
      "required": ["reportId", "reporterId", "title", "category", "severity", "imageUrl", "lat", "lng", "status", "upvoteCount", "upvotedBy", "createdAt", "updatedAt"]
    },
    "Comment": {
      "title": "Incident Comment",
      "description": "Subcollection of comments attached to single reports",
      "type": "object",
      "properties": {
        "commentId": { "type": "string" },
        "authorId": { "type": "string" },
        "authorName": { "type": "string" },
        "authorAvatar": { "type": "string" },
        "text": { "type": "string" },
        "createdAt": { "type": "string", "format": "date-time" }
      },
      "required": ["commentId", "authorId", "authorName", "text", "createdAt"]
    }
  },
  "firestore": {
    "users/{userId}": {
      "schema": "User",
      "description": "User account documents containing points and gamification milestones"
    },
    "reports/{reportId}": {
      "schema": "Report",
      "description": "Global collection containing verified community incident tickets"
    },
    "reports/{reportId}/comments/{commentId}": {
      "schema": "Comment",
      "description": "Subcollection of comments for crowdsourced reports"
    }
  }
}
```

---

## 5. Development Phases & Roadmap

### Phase 1: Setup, Key Registration & Shell Verification
1.  Verify development environment structure.
2.  Install required dependencies: `firebase`, `@vis.gl/react-google-maps`.
3.  Implement Vite environment mappings (`vite.config.ts`) to expose `GOOGLE_MAPS_PLATFORM_KEY` seamlessly to the browser.
4.  Construct the **API Key Splash Screen** for users who haven't set up credentials yet.

### Phase 2: Full-Stack Express Server Setup & Gemini Integration
1.  Configure the dev/build/start scripts inside `package.json` to support a cohesive CJS bundling process:
    *   `"dev": "tsx server.ts"`
    *   `"build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs"`
    *   `"start": "node dist/server.cjs"`
2.  Set up Express backend (`server.ts`) including:
    *   API routes first.
    *   Vite Dev Server Middlewares.
    *   Static file serving and client-side index routing for production runtime.
3.  Create `/api/reports/analyze` endpoint:
    *   Accepts Base64 image payload.
    *   Leverages the official `@google/genai` client, calling `gemini-3.5-flash` with a tailored `responseSchema` and system instructions.
    *   Returns structured AI analysis (Category, Severity, AI Description, Safety/Caution Tips).
4.  Create `/api/reports/predictions` endpoint:
    *   Fetches current reports, summarizes coordinates/categories, and feeds it into `gemini-3.5-flash` to get predictive maintenance recommendations.

### Phase 3: Firebase Integration & Absolute Security Rules
1.  Initiate `set_up_firebase` tool to register credentials and provision Firestore.
2.  Write `firebase-blueprint.json` and sync it.
3.  Write secure `firestore.rules` (including strong validations for email, state transitions, key-size bounds, and temporal request.time verification).
4.  Generate error helper utils (`handleFirestoreError`) to gracefully catch permissions leaks.

### Phase 4: UI Design, Advanced Mapping & Dashboards
1.  **Dashboard Shell**: A premium, modern, responsive multi-view shell featuring:
    *   Global Map Explorer.
    *   Issue Feed List.
    *   Predictive AI Analytics Dashboard.
    *   Gamified Profiles & Local Leaderboard.
2.  **Advanced Map Integration**:
    *   Deploy interactive canvas mapping using `@vis.gl/react-google-maps`.
    *   Utilize standard `AdvancedMarker` and custom Pin nodes showing issue visual categories.
    *   Expose dynamic details modal on Pin click.
3.  **Gamified Citizen Dashboard**:
    *   Profile card highlighting active level, score, progress bar, and visual badges.
    *   Interactive leaderboard featuring live rankings and civic stats.

### Phase 5: Verification & Production Polish
1.  Run `lint_applet` to identify syntax or import mismatches.
2.  Test the full-stack image upload -> Gemini auto-classification sequence.
3.  Execute `compile_applet` to verify esbuild/vite production compilation.

---

## 6. Premium Visual Identity & Themes

*   **Theme Name**: "Clean Slate & Sage Accent"
*   **Primary Mood**: Modern, trustworthy, civic-focused, spacious.
*   **Colors**:
    *   Canvas Background: Soft Gray-White (`#F9FAFB`) to ensure a high-contrast layout.
    *   Primary Text: Deep Slate-Navy (`#0F172A`).
    *   Accent Color: Soft Organic Sage-Green (`#10B981`) representing environmental care, rejuvenation, and solved community issues.
*   **Typography Pairings**:
    *   Display Headings: **Space Grotesk** for an assertive, tech-forward, neat civic feel.
    *   Body text: **Inter** for absolute legibility, clean density, and premium tracking.
    *   Status/Metadata: **JetBrains Mono** for tracking statistics, points, and coordinates.

---

## 7. Zero-Tolerance Integrity Checks
*   **No Mock APIs**: Every image upload runs a real server-side Gemini request; no randomized mocks.
*   **No System Trash Lines**: Page boundaries must look clean and modern; zero fake system logs, docker terminal prints, or telemetry pings.
*   **Desktop-First Fluidity**: Layouts use `max-w-7xl` boundaries to render beautifully on high-res monitors while remaining highly touch-responsive for mobile field reporters.
