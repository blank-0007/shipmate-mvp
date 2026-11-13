# ShipMate — MVP Product Brief

## One-Line Scope
My MVP lets student hackathon team leads passively track teammates' verified GitHub commits and design activity with automated 6-hour inactivity alerts so that they can cut deadweight features early and submit on time without blind all-nighters. It will not include manual Kanban boards, in-app video/voice calling, monetary escrow staking, or a built-in code editor.

## User Journey
1. **Create Sprint Room (`/`):** Lead enters hackathon name, submission deadline, public GitHub repo URL, Figma file URL, 4 teammate GitHub handles, and inactivity threshold (default 6h).
2. **Passive Monitoring (`/room/:id`):** ShipMate polls the GitHub REST API for real commit timestamps and shows each member's status (`Active` vs. `Silent`). Zero manual task updates.
3. **6-Hour Inactivity Alert:** If a teammate has zero commits within the threshold, ShipMate shows a **Private to Team Lead** warning banner.
4. **Private Triage (Modal):** Lead clicks `Open Triage` and selects `[A] Switch to Fallback API`, `[B] Cut Feature Scope`, or `[C] Snooze 1 Hour`.
5. **Proof-of-Ship Manifest (`/room/:id/manifest`):** Before submission, the lead opens the Manifest screen showing each contributor's commit count, Figma link status, and `Verified Contributor` vs. `Inactive / Unverified` badges, with Copy/Print export.

## Must-Have Features (Build ONLY These 4)
1. **M1 — Passive GitHub Tracker:** Fetch real commits from a public GitHub repo URL via GitHub REST API (`https://api.github.com/repos/{owner}/{repo}/commits`) and map them to the 4 teammate handles.
2. **M2 — 6-Hour Inactivity Dead-Man Switch:** Calculate hours since each teammate's latest commit; flag silent members with a `"Private to Team Lead — No public alerts sent"` banner + `"Copy WhatsApp Ping"` button.
3. **M3 — Early Triage & Scope-Cut Advisor:** Modal with Fallback API, Cut Scope, and 1h Snooze choices persisted in Supabase so status updates survive reload.
4. **M4 — Verified Proof-of-Ship Manifest:** Summary page breaking down commits per member, Figma URL verification, and exportable/printable judge report.

## Wireframes Reference
Clickable Figma Wireframe: https://www.figma.com/design/WMh3VfmntoPtzRnOLuF1Qi/ShipMate-Wireframe?node-id=0-1&p=f&t=D1BQqjhcIIo0vgxj-0

## Tech Choice
- Frontend: React + Vite + Tailwind CSS (mobile-responsive)
- Database: Supabase (`sprint_rooms` and `members` tables)
- Hosting: Vercel
