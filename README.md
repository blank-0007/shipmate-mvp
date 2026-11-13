# ShipMate — Hackathon Dead-Man Switch & Proof-of-Ship MVP

> Accountable, zero-friction progress tracking and early scope triage for student hackathon teams (SIH, Devfolio, Unstop).

**Live Production URL:** [https://shipmate-mvp.kaushaldhaked007.workers.dev](https://shipmate-mvp.kaushaldhaked007.workers.dev)

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
- [Audit Report](file:///Users/blank/Desktop/shipmate-mvp/docs/AUDIT_REPORT.md)
- [Claims & Verification Matrix](file:///Users/blank/Desktop/shipmate-mvp/docs/CLAIMS_MATRIX.md)
- [Live Deployment Verification](file:///Users/blank/Desktop/shipmate-mvp/docs/DEPLOY_VERIFICATION.md)
- [Database Schema Migration](file:///Users/blank/Desktop/shipmate-mvp/docs/schema.sql)
