# Community Hero - Technical Audit & Production Roadmap (PROBLEMV2.md)

This document provides a comprehensive analysis of the existing limitations, security gaps, and architectural drawbacks in the **Community Hero** hyperlocal civic platform. It details the precise steps required to transition this prototype into a secure, scalable, and fully deployable production system.

---

## 1. Executive Summary of Current State
While the application features a beautiful **Civic Command Sidebar Layout**, real-time **Firebase Firestore synchronization**, and an interactive **hyperlocal radar simulation**, it still operates on several development-grade shortcuts. 

Transitioning to production requires addressing **client-side key exposure**, upgrading simulated components to **industry-standard SDKs**, strengthening **database security boundaries**, and implementing **CI/CD infrastructure**.

---

## 2. Core Drawbacks & Gaps

### A. Security & Key Management (High Risk)
1. **Exposed Credentials**: The Firebase configuration block is hardcoded in plain text in `/src/lib/firebase.ts`. While client-side Firebase keys are not inherently private, exposing them in git history makes it easy for malicious actors to scrape and clone projects.
2. **Client-Side AI Risk (Anti-AI-Slop & API Key Security)**: If the Gemini AI analytics are processed client-side, the user's Gemini API key will be exposed to the browser. Under zero circumstances should the Gemini API key be loaded in the client-side bundle.
3. **Permissive Firestore Rules**: The local `firestore.rules` file allows any authenticated user to write or modify *any* report. An authenticated user could theoretically edit or delete reports filed by other citizens or administrators.

### B. Maps & Spatial Limitations (Functional Drawback)
1. **Simulated Canvas Map**: The current layout utilizes a highly stylized custom HTML5 canvas grid to simulate GPS coordinate lookups and streets (Mcallister Blvd, Fulton Ave). This is perfect for demoing but lacks real-world utility.
2. **No Real GIS/Routing**: It cannot convert actual GPS coordinates of a user's smartphone into true global map coordinates, nor can it route municipal repair trucks using true street paths.

### C. Authentication & Profile Gaps
1. **Simplified Auth Flows**: The sign-up and sign-in wizard is fully functional but lacks essential enterprise-ready features:
   - Email verification checks (to prevent registration with fake/disposable emails).
   - Secure Password Reset / "Forgot Password" pipelines.
   - Third-party social logins (Sign in with Google, Apple ID).
2. **Missing Session Management**: No persistent token refresh handling or auto-logout settings for idle sessions.

### D. Data Persistence & Offline Resiliency
1. **Conflict Resolution**: The app utilizes a mixture of standard `localStorage` caching and live Firestore snapshots. If a user loses internet connectivity, submits an incident offline, and then reconnects, there is no advanced reconciliation algorithm to prevent data collision.
2. **Database Schema Volatility**: Firestore is NoSQL, which offers agility, but changes in the `Report` typescript interface require manually updating existing historical documents in production to prevent runtime crashes.

---

## 3. Major Steps to Achieve Production-Ready Deployment

Follow this step-by-step blueprint to confidently deploy Community Hero in a production environment:

### Step 1: Secure Environment Configurations
- **Move to Environment Variables**: Strip the hardcoded credentials in `/src/lib/firebase.ts` and replace them with standard Vite client-side variables:
  ```ts
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };
  ```
- **Populate Variables Safely**: Declare empty placeholders in `.env.example` and set actual values directly within the production environment interface (e.g. Cloud Run, Vercel, or Netlify dashboard).

### Step 2: Implement Secure Full-Stack Proxy for AI (Gemini)
- **Implement Server-Side Proxy**: Instead of initiating the `@google/genai` client in the frontend, route all incident analysis prompts to `/api/analyze` in your Node.js custom server (`server.ts`).
- **Hide the Secret Key**: Store `GEMINI_API_KEY` on your backend environment, ensuring the API key is completely invisible to the client.

### Step 3: Tighten Firestore Security Rules
- **Verify Owners**: Update `firestore.rules` to ensure only the original author of a report (or a verified municipal administrator) can modify its status or delete it:
  ```javascript
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /reports/{reportId} {
        allow read: if true;
        // Only allow creation by authenticated users, and updates of status/resolution if rules are met
        allow create: if request.auth != null;
        allow update: if request.auth != null && (
          request.resource.data.authorId == request.auth.uid || 
          resource.data.status == "open"
        );
        allow delete: if request.auth != null && resource.data.authorId == request.auth.uid;
      }
      match /users/{userId} {
        allow read: if true;
        allow write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
  ```

### Step 4: Upgrade simulated coordinates to Google Maps Platform
- **Integrate Google Maps SDK**: Replace `/src/components/MapCanvas.tsx` with `@react-google-maps/api` or standard Google Maps JavaScript API script loading.
- **Enable Geocoding API**: Hook up search and click actions to the Google Places and Geocoding API to dynamically translate pixel coordinate clicks into real physical street addresses.

### Step 5: Advanced Analytics & Leaderboard Auditing
- **Cron Jobs for Leaderboard Reset**: To prevent point inflation, introduce server-side cloud functions to run weekly leaderboard tallies and allocate virtual badges.
- **Prevent Point Abuse**: Validate the upvote request server-side or via Firestore rules to prevent the same user from spamming multiple upvotes on their own reports.

### Step 6: DevOps, Testing & Continuous Integration
- **Write Unit & Integration Tests**: Set up **Vitest** for state-reduction tests in `dbService` and **Playwright** for verifying signup/signin flows and reporting wizards.
- **Configure Build Verification**: Bind your repository to a GitHub Action that executes `npm run lint` and `npm run build` on every pull request before auto-deploying to your Cloud Run or serverless hosting container.
- **Set Up SSL and CDN Cache**: Configure a global content delivery network (like Cloudflare or GCP Cloud CDN) to cache static assets and ensure low-latency loading of repair-proof photos.

---

## 4. Architectural Verification Check
Before launching the production pipeline, execute the local checks:
- [ ] Run `npm run lint` to ensure typescript type compliance across all custom modals.
- [ ] Run `npm run build` to verify standard esbuild and vite code chunk production.
- [ ] Deploy custom `firestore.rules` rules directly to the Firebase console of your project.
