# ShipMate MVP — Live Deployment Verification Report

**Deployment Target:** Cloudflare Workers with Static Assets & Pages Functions  
**Live URL:** [https://shipmate-mvp.kaushaldhaked007.workers.dev](https://shipmate-mvp.kaushaldhaked007.workers.dev)  
**Database:** Supabase PostgreSQL (`bzkuwawwzgveljhuookc.supabase.co`) via Service Role  
**Date of Verification:** 2026-11-13  

---

## 1. Cloudflare Deployment Status & HTTP Headers

Command executed:
```bash
curl -s -i "https://shipmate-mvp.kaushaldhaked007.workers.dev/room/70ab9e4a-2793-4ad5-9702-524bda2f69bf" | head -n 18
```

Output:
```http
HTTP/2 200 
date: Fri, 13 Nov 2026 10:29:05 GMT
content-type: text/html
cf-cache-status: MISS
cache-control: public, max-age=0, must-revalidate
permissions-policy: camera=(), microphone=(), geolocation=()
referrer-policy: strict-origin-when-cross-origin
x-content-type-options: nosniff
x-frame-options: DENY
server: cloudflare
```
- **SPA Fallback Verified:** Hard-refreshing `/room/:id` directly returns HTTP 200 and loads `index.html` (no 404).
- **Security Headers Verified:** `x-content-type-options: nosniff`, `x-frame-options: DENY`, `referrer-policy: strict-origin-when-cross-origin`, `permissions-policy: camera=(), microphone=(), geolocation=()`.

---

## 2. Zero Secrets in Client Bundle Verification

Commands executed:
```bash
JS_FILE=$(curl -s "https://shipmate-mvp.kaushaldhaked007.workers.dev/" | grep -o 'assets/index-[^"]*\.js')
curl -s "https://shipmate-mvp.kaushaldhaked007.workers.dev/$JS_FILE" | grep -i -E "ghp_|github_pat_|service_role|SUPABASE_SERVICE" || echo "CLEAN: Zero secrets in live served JS bundle!"
```

Output:
```
Found live JS: assets/index-CkFJGkto.js
CLEAN: Zero secrets in live served JS bundle!
```

---

## 3. Lead Key Authentication & Privacy Verification

### A. Request without Authorization Header:
Command:
```bash
curl -s -i "https://shipmate-mvp.kaushaldhaked007.workers.dev/api/rooms/70ab9e4a-2793-4ad5-9702-524bda2f69bf/activity"
```
Output:
```http
HTTP/2 401 Unauthorized
{"error":"Unauthorized: This lead link is invalid or incomplete. Provide Authorization: Bearer <leadKey>"}
```

### B. Request with Invalid Key:
Command:
```bash
curl -s -i "https://shipmate-mvp.kaushaldhaked007.workers.dev/api/rooms/70ab9e4a-2793-4ad5-9702-524bda2f69bf/activity" \
  -H "Authorization: Bearer 0000000000000000000000000000000000000000000000000000000000000000"
```
Output:
```http
HTTP/2 401 Unauthorized
{"error":"Unauthorized: This lead link is invalid or incomplete. Provide Authorization: Bearer <leadKey>"}
```

### C. Request with Valid Lead Key:
Command:
```bash
curl -s -i "https://shipmate-mvp.kaushaldhaked007.workers.dev/api/rooms/70ab9e4a-2793-4ad5-9702-524bda2f69bf/activity" \
  -H "Authorization: Bearer 4d321d5db816646975446aabbf40702a14ffcec52a6db70c8aa48533671fd178"
```
Output:
```http
HTTP/2 200 OK
{"room":{"id":"70ab9e4a-2793-4ad5-9702-524bda2f69bf", ...},"members":[...],"totalCommits":4,"figmaFrameCount":18,"isFigmaAccessible":true}
```

---

## 4. Real GitHub GraphQL Telemetry & Alias Attribution Verification

Created real room for `https://github.com/blank-0007/shipmate-mvp`:
- Initial query identified 2 commits by `Kaushal Dhaked <kaushaldhakad007@gmail.com>`.
- Correctly classified as **Unattributed** (avoiding false-positive substring matching).
- Assigned alias via `POST /api/rooms/7025c8d4-db33-483f-a256-b297624a8dd3/aliases`:
```json
{
  "member": {
    "github_handle": "blank-0007",
    "aliases": ["kaushaldhakad007@gmail.com"]
  }
}
```
- Re-query verified instant attribution:
```json
{
  "github_handle": "blank-0007",
  "commitsCount": 2,
  "linesAdded": 7532,
  "linesDeleted": 2590,
  "latestCommit": {
    "sha": "e720eb8",
    "message": "feat(arch): implement hardened Cloudflare backend, lead-key auth, multi-signal telemetry, and privacy controls"
  },
  "silenceFormatted": "10m",
  "displayStatus": "Active"
}
```

---

## 5. Playwright Browser Automation Results

Command:
```bash
node scripts/verify-e2e.js
```

Execution Output:
```
Starting Playwright end-to-end verification against: https://shipmate-mvp.kaushaldhaked007.workers.dev

--- 1. Testing Mobile Viewport (375x667) ---
Navigating to Setup page...
Mobile width check: scrollWidth=375, clientWidth=375
Saved 01_setup_mobile.png
Clicking "Try the demo (no repo needed)"...
Landed on Dashboard: https://shipmate-mvp.kaushaldhaked007.workers.dev/room/adc82da9-12d7-4c97-935a-ddbb3232eba1#k=2267db94acf90fe4f51b5a311d10c20e682861f14a59a0ba507be68a708bde32
Dashboard width check: scrollWidth=375, clientWidth=375
Saved 02_dashboard_mobile.png
Opening Triage Advisor modal...
Saved 03_triage_modal.png
Selecting [A] Switch to Fallback API and persisting...
Decision recorded in UI.
Reloading dashboard to verify persistence across refresh...
Saved 04_triage_persisted_mobile.png (Decision persisted across refresh!)
Navigating to Proof-of-Ship Manifest...
Manifest width check: scrollWidth=375, clientWidth=375
Saved 05_manifest_mobile.png

--- 2. Testing Desktop Viewport (1280x800) ---
Saved 01_setup_desktop.png
Saved 02_dashboard_desktop.png
Saved 05_manifest_desktop.png
Emulating print media for manifest print stylesheet check...
Saved 06_manifest_print.png

✅ ALL Playwright tests passed in 18.5s (under 120s limit)!
```

### Generated Screenshots:
- `docs/screens/01_setup_mobile.png` (375x667 setup page, zero horizontal scroll)
- `docs/screens/01_setup_desktop.png` (1280x800 setup page)
- `docs/screens/02_dashboard_mobile.png` (375x667 mobile dashboard with private warning banner)
- `docs/screens/02_dashboard_desktop.png` (1280x800 desktop dashboard)
- `docs/screens/03_triage_modal.png` (Triage advisor dialog with options [A], [B], [C])
- `docs/screens/04_triage_persisted_mobile.png` (Verified persistence after browser reload)
- `docs/screens/05_manifest_mobile.png` (Mobile proof-of-ship manifest)
- `docs/screens/05_manifest_desktop.png` (Desktop proof-of-ship manifest)
- `docs/screens/06_manifest_print.png` (Emulated print view rendering clean white document)
