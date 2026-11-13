# ShipMate MVP — Claims & Features Verification Matrix

| Claim / Capability | Status | Evidence (Code / Test / Endpoint) | Notes & Details |
| :--- | :--- | :--- | :--- |
| **Passive GitHub Commits** | **Built** | `server/github.js:93-176`, `test/status.test.js:84-142` | GraphQL query fetches all branches' commits since `sprint_start`; deduped across branches by OID; not capped at 100. |
| **Passive Pull Requests & Reviews** | **Built** | `server/github.js:122-176`, `shared/status.js:121-143`, `test/status.test.js:144-187` | PR opened/updated and reviews submitted each count as qualifying activity and reset the silence clock. |
| **Passive Figma Activity for Designers** | **Built** | `server/figma.js:18-77`, `shared/status.js:145-207`, `test/status.test.js:189-236` | Version history and shallow frame counts queried via Figma API; attributed by `figma_handle` or single designer fallback. |
| **Figma Graceful Degradation** | **Built** | `server/figma.js:29-41`, `shared/status.js:247-259`, `test/status.test.js:219-236` | If Figma is 403/404 or unshared, status degrades to neutral "Figma not verifiable", NEVER Silent or Inactive. |
| **Private to Team Lead Inactivity Alerts** | **Built** | `server/auth.js:28-50`, `server/api.js:185-195`, `src/components/InactivityBanner.jsx:31-48` | Gated by 32-byte cryptographic `lead_key` verified via SHA-256 constant-time compare; 401 on unauthorized access. |
| **Signals Collected Transparency Notice** | **Built** | `src/pages/CreateRoom.jsx:136-147`, `src/pages/CreateRoom.jsx:346-370` | Explicit notice on setup form explaining signals collected; 1-click copyable WhatsApp team notice provided after creation. |
| **Early Triage & Scope-Cut Advisor ([A], [B], [C])** | **Built** | `server/api.js:271-300`, `src/components/TriageModal.jsx:87-175`, `test/api.test.js:133-173` | Exact options `[A] Switch to Fallback API`, `[B] Cut Feature Scope`, `[C] Snooze 1 Hour`; persisted in Supabase `members` and `triage_events`. |
| **Verified vs Unverified Proof-of-Ship Manifest** | **Built** | `shared/status.js:264-273`, `src/pages/RoomManifest.jsx:163-316`, `test/status.test.js:262-283` | `Verified Contributor` enforced only if qualifying activity count >= 3 (`MIN_VERIFIED_ACTIVITY = 3`). Triage chip is secondary and does not replace evidence. |
| **Zero Secrets in Client Bundle** | **Built** | `test/api.test.js:175-205`, `docs/DEPLOY_VERIFICATION.md:2` | Built `dist/` and live served bundle contain zero tokens, zero service keys. All database/API calls proxied via server. |
| **SPA Client Routing Without 404s** | **Built** | `wrangler.jsonc:8-12`, `docs/DEPLOY_VERIFICATION.md:1` | Direct navigation and hard refresh on `/room/:id` and `/room/:id/manifest` cleanly return HTTP 200. |
| **Mobile Responsiveness (375x667)** | **Built** | `scripts/verify-e2e.js:33-116`, `docs/screens/01_setup_mobile.png`, `02_dashboard_mobile.png` | Zero horizontal scroll (`scrollWidth == clientWidth`); touch targets >= 44px for triage and clipboard actions. |

---

### Items NOT Built (Intentionally Cut per Prompt Ground Rules)
The following capabilities were explicitly forbidden or out-of-scope for the MVP:
- ❌ Kanban / task boards (Banned)
- ❌ Drag-and-drop interfaces (Banned)
- ❌ In-app chat, calling, or video (Banned)
- ❌ Monetary escrow or staking (Banned)
- ❌ In-app code editor / IDE (Banned)
- ❌ Login / signup / OAuth account walls (Banned — replaced with Lead Key auth)
- ❌ AI summary generation / bots (Banned)
