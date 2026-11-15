# ShipMate — Hackathon Dead-Man Switch & Proof-of-Ship MVP

> Accountable, zero-friction progress tracking and early scope triage for student hackathon teams (SIH, Devfolio, Unstop).

**Live Production URL:** [https://shipmate-mvp.kaushaldhaked007.workers.dev](https://shipmate-mvp.kaushaldhaked007.workers.dev)

---

## 📹 Demo Video Walkthrough (113.6s with Voice Guide)

A full automated end-to-end recording of the live deployed application with an AI female voiceover guide is available locally at `shipmate_demo.mp4` (Duration: 1m 53s / 113.6 seconds, 1280x720 H.264 at 30 fps, AAC audio).

To re-record and re-generate the narrated video:
```bash
node scripts/record-demo.js
uv run --with edge-tts python3 scripts/add-voiceover.py
```

### Flow Recorded:
1. **Setup Screen (0:00 – 0:25):**
   - Configures sprint room (`Devfolio AI Sprint`, 36h deadline) with real GitHub repository (`blank-0007/shipmate-mvp`) and Figma link.
   - Adds 4 teammates including active and inactive members with a 6-hour silence threshold.
2. **Activity Pulse & Inactivity Alert (0:25 – 0:55):**
   - Loads multi-signal GitHub & Figma activity with active vs. silent contributors.
   - Highlights the private *"Private to Team Lead — No public alerts sent"* banner.
   - Generates and tests 1-click **Copy WhatsApp Ping** with instant visual confirmation.
3. **Early Scope Triage & Persistence (0:55 – 1:25):**
   - Opens the triage modal showcasing recovery actions (`[A] Switch to Fallback API`, `[B] Cut Feature Scope`, `[C] Snooze 1 Hour`).
   - Applies `[A] Switch to Fallback API` with a custom triage note.
   - Reloads the page (`page.reload()`) to prove the triage decision persisted in Supabase.
4. **Verified Proof-of-Ship Manifest (1:25 – 1:53):**
   - Navigates to `/room/:id/manifest` displaying verified contributor badges (`Verified Contributor` vs `Inactive / Unverified`), Figma specs, and triage audit history.
   - Copies judge submission markdown via **Copy Submission Markdown** button.

---

## 🚀 Features (Must-Haves M1–M4 Only)

1. **M1 — Passive Multi-Signal Activity Tracker:**
   - Real commits queried across all branches via GitHub GraphQL API.
   - Pull requests (created, updated, merged) and PR reviews count toward activity.
   - Figma design versions and frame count queried via Figma REST API (designers are never penalized for lacking commits).
   - Strict attribution order (exact login, exact noreply email, aliases) with an interactive Unattributed Commits alias panel.

2. **M2 — Inactivity Dead-Man Switch:**
   - Evaluates silence elapsed since `sprint_start` or latest activity against configurable threshold (default: 6h).
   - Gated by a 32-byte cryptographic `lead_key` verified via SHA-256 constant-time compare (`/room/:id#k=<lead_key>`).
   - Private warning banner: *"Private to Team Lead — No public alerts sent"*.
   - 1-click WhatsApp Ping generator with clipboard fallback for mobile.

3. **M3 — Early Triage & Scope-Cut Advisor:**
   - Private advisor modal with 3 persistent options:
     - `[A] Switch to Fallback API`
     - `[B] Cut Feature Scope`
     - `[C] Snooze 1 Hour`
   - Persisted centrally in Supabase (`members` and append-only `triage_events`).

4. **M4 — Verified Proof-of-Ship Manifest:**
   - Route: `/room/:id/manifest`
   - Verified contributor table (`MIN_VERIFIED_ACTIVITY = 3` rule).
   - Figma spec status check and timestamped triage audit log.
   - 1-click **Copy Submission Markdown** (for Devpost/Devfolio) and clean **Print / Save as PDF** stylesheet.

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** React 18 + Vite + Tailwind CSS + Lucide React + React Router DOM
- **Backend / Edge Functions:** Cloudflare Workers with Static Assets (`server/api.js`, `server/index.js`, `functions/api/*`)
- **Database:** Supabase PostgreSQL with Row Level Security (Service Role only, zero public anon policies)
- **APIs:** GitHub GraphQL API (`api.github.com/graphql`), Figma REST API (`api.figma.com/v1`)
- **Testing:** Vitest (unit & API tests), Playwright (mobile 375x667 & desktop 1280x800)

---

## 📦 Environment Variables (Names Only)

Stored in `.dev.vars` locally (git-ignored) and in Cloudflare Secrets for production:

```bash
GITHUB_TOKEN=                # Fine-grained GitHub PAT (Public repo read-only)
FIGMA_TOKEN=                 # Figma personal access token (File/Version read)
SUPABASE_URL=                # Supabase project URL (https://xyz.supabase.co)
SUPABASE_SERVICE_ROLE_KEY=   # Supabase service role secret key
```

*Note: Never include secrets in git or client bundles.*

---

## 💻 Local Development

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Secrets:**
   Copy `.dev.vars.example` to `.dev.vars` and add your keys:
   ```bash
   cp .dev.vars.example .dev.vars
   ```

3. **Run Dev Server:**
   ```bash
   npx wrangler dev
   ```
   Or run the Vite client preview:
   ```bash
   npm run dev
   ```

---

## 🧪 Testing

1. **Unit & API Tests (Vitest):**
   ```bash
   npm test
   ```

2. **End-to-End Browser Tests (Playwright):**
   ```bash
   node scripts/verify-e2e.js
   ```

---

## 🚢 Cloudflare Deployment

1. **Build Production Assets:**
   ```bash
   npm run build
   ```

2. **Provision Cloudflare Secrets:**
   ```bash
   npx wrangler secret put GITHUB_TOKEN
   npx wrangler secret put FIGMA_TOKEN
   npx wrangler secret put SUPABASE_URL
   npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   ```

3. **Deploy Worker with Static Assets:**
   ```bash
   npx wrangler deploy
   ```

---

## 📋 Documentation
- [Official Submission PDF](file:///Users/blank/Desktop/shipmate-mvp/ShipMate_MVP_Submission.pdf)
- [Audit Report](file:///Users/blank/Desktop/shipmate-mvp/docs/AUDIT_REPORT.md)
- [Claims & Verification Matrix](file:///Users/blank/Desktop/shipmate-mvp/docs/CLAIMS_MATRIX.md)
- [Live Deployment Verification](file:///Users/blank/Desktop/shipmate-mvp/docs/DEPLOY_VERIFICATION.md)
- [Database Schema Migration](file:///Users/blank/Desktop/shipmate-mvp/docs/schema.sql)
