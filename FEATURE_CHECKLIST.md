# ShipMate — Must-Have Feature Checklist

| ID | Feature | Status (`Done` / `Partial` / `Cut`) | Notes / Reason |
| :--- | :--- | :--- | :--- |
| M1 | Passive GitHub Activity Tracker | Done | Fetches real commits from public GitHub repo via REST API (`/repos/{owner}/{repo}/commits`) and maps to 4 teammate handles with active/silent status. |
| M2 | 6-Hour Inactivity Dead-Man Switch | Done | Calculates elapsed hours since last commit against configurable threshold (default 6h); displays "Private to Team Lead" warning banner and 1-click "Copy WhatsApp Ping". |
| M3 | Early Triage & Scope-Cut Modal | Done | Private advisor modal offering Fallback API, Cut Feature Scope, and 1h Snooze; persisted in Supabase so decisions survive page reloads. |
| M4 | Verified Proof-of-Ship Manifest | Done | Dedicated `/room/:id/manifest` view with commit breakdown, contributor verification badges, Figma link check, Devpost Markdown export, and print/PDF styling. |
