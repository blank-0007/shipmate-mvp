import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ShipMate MVP — Official Submission Document</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 14mm 12mm 14mm;
      @bottom-right {
        content: "Page " counter(page) " of " counter(pages);
        font-size: 8pt;
        color: #64748b;
      }
    }
    
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.38;
      font-size: 8.5pt;
      margin: 0;
      padding: 0;
    }

    h1, h2, h3, h4 {
      color: #0f172a;
      margin-top: 0;
      font-weight: 700;
    }

    h1 {
      font-size: 16pt;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 4px;
      margin-bottom: 2px;
    }

    .subtitle {
      font-size: 9pt;
      color: #64748b;
      margin-bottom: 10px;
    }

    .hero-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #2563eb;
      border-radius: 5px;
      padding: 8px 12px;
      margin-bottom: 12px;
    }

    .hero-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      margin-top: 6px;
    }

    .hero-item {
      font-size: 8.5pt;
    }

    .hero-label {
      font-weight: 700;
      color: #334155;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .hero-link {
      color: #2563eb;
      text-decoration: none;
      font-weight: 600;
      word-break: break-all;
    }

    .section-title {
      font-size: 11pt;
      color: #0f172a;
      border-bottom: 1.5px solid #cbd5e1;
      padding-bottom: 3px;
      margin-top: 10px;
      margin-bottom: 6px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .badge {
      display: inline-block;
      padding: 1px 6px;
      font-size: 7pt;
      font-weight: 700;
      border-radius: 3px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .badge-done {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
    }

    .badge-cut {
      background: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fca5a5;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 5px;
      margin-bottom: 8px;
      font-size: 7.8pt;
      line-height: 1.3;
    }

    th, td {
      border: 1px solid #cbd5e1;
      padding: 4px 6px;
      text-align: left;
      vertical-align: top;
    }

    th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 600;
    }

    tr:nth-child(even) td {
      background: #f8fafc;
    }

    .checklist-table td:first-child {
      width: 25px;
      text-align: center;
      font-weight: bold;
      color: #16a34a;
      font-size: 9pt;
    }

    .page-break {
      page-break-before: always;
      break-before: page;
    }

    .avoid-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 5px;
      padding: 6px 10px;
      margin-bottom: 6px;
    }

    .card-title {
      font-size: 9pt;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 2px;
    }

    ul, ol {
      margin-top: 2px;
      margin-bottom: 4px;
      padding-left: 14px;
    }

    li {
      margin-bottom: 2px;
    }

    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 7.2pt;
      background: #f1f5f9;
      padding: 1px 3px;
      border-radius: 2px;
      border: 1px solid #e2e8f0;
      color: #0f172a;
    }

    pre {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 6.8pt;
      background: #0f172a;
      color: #f8fafc;
      padding: 6px 8px;
      border-radius: 4px;
      margin-top: 3px;
      margin-bottom: 4px;
      line-height: 1.25;
    }

    .quote-box {
      background: #f0fdf4;
      border-left: 3px solid #16a34a;
      padding: 5px 10px;
      font-style: italic;
      color: #166534;
      margin-bottom: 6px;
      font-size: 8pt;
    }
  </style>
</head>
<body>

  <!-- ==================== PAGE 1: OVERVIEW & BRIEF ==================== -->
  <h1>ShipMate — Hackathon Dead-Man Switch & Proof-of-Ship MVP</h1>
  <div class="subtitle">Official Project Submission Document &bull; Full End-to-End System Audit &bull; November 16, 2026</div>

  <div class="hero-box">
    <div style="font-size: 9.5pt; font-weight: 700; color: #0f172a; margin-bottom: 2px;">🚀 Submission Core Links & Deliverables</div>
    <div class="hero-grid">
      <div class="hero-item">
        <span class="hero-label">Live Link to MVP:</span><br>
        <a class="hero-link" href="https://shipmate-mvp.kaushaldhaked007.workers.dev" target="_blank">https://shipmate-mvp.kaushaldhaked007.workers.dev</a>
      </div>
      <div class="hero-item">
        <span class="hero-label">GitHub Repository:</span><br>
        <a class="hero-link" href="https://github.com/blank-0007/shipmate-mvp" target="_blank">https://github.com/blank-0007/shipmate-mvp</a>
      </div>
      <div class="hero-item" style="grid-column: span 2;">
        <span class="hero-label">2-Minute Screen-Recorded Demo (Google Drive):</span><br>
        <a class="hero-link" href="https://drive.google.com/file/d/1IDMguBcu-C9Fi07-IqB_1b7aq6G7pjRR/view?usp=sharing" target="_blank">https://drive.google.com/file/d/1IDMguBcu-C9Fi07-IqB_1b7aq6G7pjRR/view?usp=sharing</a>
        <div style="font-size: 7.5pt; color: #64748b; margin-top: 1px;">
          Includes synchronized friendly female AI voice guide (<code>en-US-JennyNeural</code>) covering setup, telemetry, 6h private alert, WhatsApp ping, early triage persistence, and proof-of-ship manifest in 113.6 seconds.
        </div>
      </div>
    </div>
  </div>

  <div class="section-title">📋 Submission Requirements Checklist</div>
  <table class="checklist-table">
    <thead>
      <tr>
        <th style="width: 25px;"></th>
        <th style="width: 175px;">Requirement Item</th>
        <th>Delivery & Verification Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>&#10004;</td>
        <td><strong>Live Link to the MVP</strong></td>
        <td>Deployed to Cloudflare Workers with Static Assets at <code>shipmate-mvp.kaushaldhaked007.workers.dev</code>. Edge caching, zero cold starts, global SSL.</td>
      </tr>
      <tr>
        <td>&#10004;</td>
        <td><strong>GitHub Repository Link</strong></td>
        <td>Available at <code>github.com/blank-0007/shipmate-mvp</code> with regular, atomic commits across all implementation and hardening phases.</td>
      </tr>
      <tr>
        <td>&#10004;</td>
        <td><strong>2-Minute Screen Demo</strong></td>
        <td>Accessible via Google Drive (113.6s, 1280x720, H.264 High Profile, AAC audio) showcasing all 4 must-have flows and voice narration.</td>
      </tr>
      <tr>
        <td>&#10004;</td>
        <td><strong>Product Brief & Plan</strong></td>
        <td>Documented below with strict scope boundaries (M1&ndash;M4), target user personas, database schemas, and architectural data flows.</td>
      </tr>
      <tr>
        <td>&#10004;</td>
        <td><strong>Complete Build Log</strong></td>
        <td>Phase-by-phase record detailing exact prompt intents, technical hurdles, bugs resolved, and commit hashes.</td>
      </tr>
      <tr>
        <td>&#10004;</td>
        <td><strong>Feature Checklist (Done/Cut)</strong></td>
        <td>All four Must-Have features verified 100% Done with comprehensive technical rationale and automated test coverage.</td>
      </tr>
    </tbody>
  </table>

  <div class="section-title">📄 Product Brief</div>
  <div class="quote-box">
    <strong>One-Line Scope:</strong> ShipMate lets student hackathon team leads passively track teammates' verified GitHub commits and Figma design activity with automated 6-hour inactivity alerts so they can cut deadweight features early and submit on time without blind all-nighters.
  </div>

  <div class="card avoid-break">
    <div class="card-title">Target Persona & Hackathon Problem</div>
    <p style="margin: 0 0 3px 0;">
      Tailored for Indian undergraduate engineering students (Tier-2/3 colleges) leading teams in competitive hackathons (Smart India Hackathon, Devfolio, Unstop). In high-pressure sprints, teammates often go completely dark 12&ndash;18 hours before the deadline. The lead wastes critical hours waiting on promises, then scrambles through a solo all-nighter to produce a half-broken submission.
    </p>
    <div class="card-title" style="margin-top: 4px;">Three Hard Product Constraints</div>
    <ul>
      <li><strong>Zero Manual Logging:</strong> Telemetry is passively queried via GitHub GraphQL/REST and Figma REST APIs. No manual task lists or check-ins.</li>
      <li><strong>Private Alerts (Hostel Safety):</strong> Teammates frequently share hostel rooms. Inactivity warnings and triage notes are strictly sealed to the team lead via a 32-byte cryptographic <code>lead_key</code>. Public embarrassment is strictly prevented.</li>
      <li><strong>Designers Count as First-Class Contributors:</strong> Teammates doing UI/UX in Figma are detected through version history and frame count, ensuring non-coders are never falsely flagged as inactive.</li>
    </ul>
  </div>

  <!-- ==================== PAGE 2: IMPLEMENTATION PLAN ==================== -->
  <div class="page-break"></div>

  <div class="section-title">🏗️ Agent's Implementation Plan (M1–M4 Only)</div>

  <div class="card avoid-break">
    <div class="card-title">1. Strict Scope Boundaries & Anti-Feature Non-Goals</div>
    <table style="margin-top: 2px; margin-bottom: 3px;">
      <thead>
        <tr>
          <th style="width: 50%;">In-Scope Must-Haves (Built & Delivered)</th>
          <th style="width: 50%;">Explicitly Banned & Cut Features</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            &bull; <strong>M1: Passive Multi-Signal Activity Tracker</strong> (Commits, PRs, Reviews, Figma)<br>
            &bull; <strong>M2: Inactivity Dead-Man Switch</strong> (6h threshold, Private Banner, WhatsApp Ping)<br>
            &bull; <strong>M3: Early Triage Advisor</strong> (Fallback API, Scope Cut, Snooze; Persisted in DB)<br>
            &bull; <strong>M4: Proof-of-Ship Manifest</strong> (Verified Contributor badges, Judge Markdown)
          </td>
          <td>
            <span class="badge badge-cut">CUT</span> No Kanban / Drag-and-Drop Task Boards<br>
            <span class="badge badge-cut">CUT</span> No In-App Chat Rooms or Audio/Video Calling<br>
            <span class="badge badge-cut">CUT</span> No Mandatory Login / Sign-Up / OAuth Walls<br>
            <span class="badge badge-cut">CUT</span> No Monetary Escrow Staking or Payments<br>
            <span class="badge badge-cut">CUT</span> No In-App Code Editor or AI Summarizers
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="card avoid-break">
    <div class="card-title">2. Technical Architecture & Secure Data Flow</div>
    <ul style="margin: 0; padding-left: 14px;">
      <li><strong>Client Architecture:</strong> React 18 SPA built with Vite, Tailwind CSS, and Lucide React. Uses URL hash fragment (<code>#k=&lt;lead_key&gt;</code>) so sensitive lead credentials are never leaked in HTTP request headers, server logs, or referrer headers.</li>
      <li><strong>Edge API Proxy (Cloudflare Workers):</strong> Secure serverless edge functions (<code>server/api.js</code>) broker GitHub GraphQL and Figma REST queries, keeping fine-grained tokens encapsulated in Cloudflare Secrets away from the client.</li>
      <li><strong>Database & Row Level Security:</strong> Supabase PostgreSQL with strict Row Level Security. Zero public anonymous access. All writes and triage operations authenticate via the Service Role Key at the edge.</li>
    </ul>
  </div>

  <div class="card avoid-break">
    <div class="card-title">3. Supabase Database Schema Specification</div>
    <pre><code>-- 1. Sprint Rooms: Central container for each hackathon sprint
create table sprint_rooms (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  hackathon_name text not null,
  deadline timestamptz not null,
  sprint_start timestamptz default now(),
  github_repo_url text not null,
  figma_url text,
  inactivity_threshold_hours integer default 6,
  lead_key_hash text not null  -- SHA-256 hash of 32-byte secret lead key
);

-- 2. Members: Contributor telemetry, identity mappings, and triage state
create table members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references sprint_rooms(id) on delete cascade,
  github_handle text not null,
  role_label text,
  is_designer boolean default false,
  figma_handle text,
  aliases jsonb default '[]'::jsonb,
  triage_status text default 'none' check (triage_status in ('none', 'fallback_api', 'cut_scope', 'snoozed')),
  snoozed_until timestamptz,
  triage_note text,
  created_at timestamptz default now()
);

-- 3. Triage Events: Append-only immutable audit trail for judges and team records
create table triage_events (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references sprint_rooms(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  decision text not null,
  note text,
  created_at timestamptz default now()
);</code></pre>
  </div>

  <!-- ==================== PAGE 3: BUILD LOG ==================== -->
  <div class="page-break"></div>

  <div class="section-title">🛠️ Comprehensive Build Log</div>
  <p style="margin-top: 0; margin-bottom: 6px;">
    Detailed history of all development sessions, prompt objectives, successful executions, obstacles encountered, and architectural solutions:
  </p>

  <table>
    <thead>
      <tr>
        <th style="width: 32px;">Phase</th>
        <th style="width: 110px;">Prompt / Objective</th>
        <th style="width: 175px;">What Worked Cleanly</th>
        <th>Problems Encountered & Exact Architectural Solutions</th>
        <th style="width: 50px;">Commit</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>P1</strong></td>
        <td>Repo Setup & Plan</td>
        <td>Git initialization, project structure, documentation artifacts, implementation plan approval.</td>
        <td>None. Clean scaffold.</td>
        <td><code>2b08842</code></td>
      </tr>
      <tr>
        <td><strong>P2</strong></td>
        <td>M1: GitHub Tracker</td>
        <td>Validated repo inputs, parsed owner/repo, queried GitHub commits API, attributed to 4 teammates.</td>
        <td>
          <strong>Public API rate limit (60 req/hr):</strong> Shared campus NAT IPs hit 403 rate limits instantly.<br>
          <em>Solution:</em> Routed queries through edge proxy with fine-grained PAT stored in Cloudflare Secrets.
        </td>
        <td><code>d41877f</code></td>
      </tr>
      <tr>
        <td><strong>P3</strong></td>
        <td>M2: Dead-Man Switch</td>
        <td>Silence calculation from latest commit; Private Lead banner; 1-click WhatsApp message generator.</td>
        <td>
          <strong>0-commit teammate silence gap:</strong> Inactive members showed 0h silence.<br>
          <em>Solution:</em> Added <code>sprint_start</code> baseline so members with zero commits measure silence from room creation.
        </td>
        <td><code>d41877f</code></td>
      </tr>
      <tr>
        <td><strong>P4</strong></td>
        <td>M3: Early Triage Advisor</td>
        <td>3 recovery options ([A] Fallback API, [B] Cut Scope, [C] Snooze) with note input and instant UI updates.</td>
        <td>
          <strong>LocalStorage fallback data loss:</strong> State was previously isolated to creator browser.<br>
          <em>Solution:</em> Bound state to Supabase PostgreSQL with append-only <code>triage_events</code> audit logging.
        </td>
        <td><code>d41877f</code></td>
      </tr>
      <tr>
        <td><strong>P5</strong></td>
        <td>M4: Proof-of-Ship Manifest</td>
        <td>Dedicated <code>/room/:id/manifest</code> view, contributor audit breakdown, and Markdown exporter.</td>
        <td>
          <strong>Print styling artifact:</strong> UI elements and backgrounds bled into printed judge manifests.<br>
          <em>Solution:</em> Authored <code>@media print</code> CSS hiding navigation and enforcing clean monochrome tables.
        </td>
        <td><code>d41877f</code></td>
      </tr>
      <tr>
        <td><strong>P6</strong></td>
        <td>Cloudflare Deployment & Hardening</td>
        <td>Deployed to Cloudflare Workers with Static Assets. Sealed Supabase RLS with service-role security.</td>
        <td>
          <strong>1. Single Page App routing loop:</strong> Workers with Assets looped on <code>_redirects</code>.<br>
          <em>Solution:</em> Removed <code>_redirects</code>; set <code>"not_found_handling": "single-page-application"</code> in <code>wrangler.jsonc</code>.<br>
          <strong>2. Supabase room_id insert binding:</strong> Member insertion failed foreign key constraint.<br>
          <em>Solution:</em> Explicitly bound <code>room_id</code> onto member records before batch insertion.
        </td>
        <td><code>e720eb8</code></td>
      </tr>
      <tr>
        <td><strong>P7</strong></td>
        <td>Automated Playwright Video Recording</td>
        <td>Headless Chromium automation recorded full 4-stage workflow at 1280x720 in 113.6 seconds.</td>
        <td>
          <strong>Playwright strict-mode locator conflict:</strong> Locating <code>text=@blank-0007</code> matched multiple elements.<br>
          <em>Solution:</em> Refined locator to <code>a:has-text("@blank-0007").first()</code>.
        </td>
        <td><code>80046cc</code></td>
      </tr>
      <tr>
        <td><strong>P8</strong></td>
        <td>Friendly Female AI Voice Integration</td>
        <td>Generated Azure neural voiceover (<code>en-US-JennyNeural</code>) aligned to 12 video cues.</td>
        <td>
          <strong>Sub-second narration overlap:</strong> Standard speaking rate overlapped quick UI interactions.<br>
          <em>Solution:</em> Paced speech at <code>rate="+10%"</code> and used FFmpeg <code>adelay</code> and <code>amix</code> filters for exact cue synchronization.
        </td>
        <td><code>d389408</code></td>
      </tr>
    </tbody>
  </table>

  <!-- ==================== PAGE 4: FEATURE CHECKLIST ==================== -->
  <div class="page-break"></div>

  <div class="section-title">✅ Must-Have Feature Checklist (Audit Graded)</div>
  <p style="margin-top: 0; margin-bottom: 6px;">
    All 4 Must-Have features have been implemented, deployed, verified with automated test suites, and audited against ground rules:
  </p>

  <div class="card avoid-break">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
      <span class="card-title">M1 — Passive Multi-Signal Activity Tracker</span>
      <span class="badge badge-done">Status: 100% Done</span>
    </div>
    <p style="margin: 0 0 3px 0; font-size: 8pt;">
      <strong>Specification:</strong> Passively monitors genuine project progress across code and design without requiring manual task updates.
    </p>
    <ul style="margin: 0; padding-left: 14px;">
      <li><strong>GitHub GraphQL & REST Telemetry:</strong> Ingests commits across all branches, pull requests (open, merged, closed), and PR code reviews.</li>
      <li><strong>Figma Design Integration:</strong> Queries versions API and frame count. Designers who commit zero code are recognized as active contributors when design activity is verified.</li>
      <li><strong>Author Attribution Engine:</strong> Matches authors via primary GitHub username, noreply email, and custom Git author email aliases with an interactive alias management panel.</li>
      <li><strong>Evidence:</strong> Implemented in <code>server/github.js</code>, <code>server/figma.js</code>, and <code>server/api.js</code>. Verified by unit tests in <code>test/api.test.js</code>.</li>
    </ul>
  </div>

  <div class="card avoid-break">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
      <span class="card-title">M2 — Inactivity Dead-Man Switch</span>
      <span class="badge badge-done">Status: 100% Done</span>
    </div>
    <p style="margin: 0 0 3px 0; font-size: 8pt;">
      <strong>Specification:</strong> Detects teammate silence beyond a threshold (default 6h) and alerts the team lead without public shaming.
    </p>
    <ul style="margin: 0; padding-left: 14px;">
      <li><strong>Cryptographic Lead Privacy:</strong> Room creation yields a 32-byte secret key (<code>lead_key</code>). Alerts and triage capabilities are strictly restricted to the lead link (<code>/room/:id#k=&lt;key&gt;</code>). Public visitors only see public status.</li>
      <li><strong>Private Warning Banner:</strong> Shows high-visibility banner reading <em>"Private to Team Lead &mdash; No public alerts sent"</em> whenever elapsed silence exceeds the threshold.</li>
      <li><strong>1-Click WhatsApp Ping:</strong> Generates a pre-formatted, polite check-in message (<em>"Hey! Checking in on [Role] for [Hackathon]. Can you push an update or let me know if you're stuck?"</em>) with visual copy feedback.</li>
      <li><strong>Evidence:</strong> Implemented in <code>src/pages/RoomDashboard.jsx</code> (lines 140&ndash;195) and tested in <code>test/status.test.js</code>.</li>
    </ul>
  </div>

  <div class="card avoid-break">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
      <span class="card-title">M3 — Early Triage & Scope-Cut Advisor</span>
      <span class="badge badge-done">Status: 100% Done</span>
    </div>
    <p style="margin: 0 0 3px 0; font-size: 8pt;">
      <strong>Specification:</strong> Enables structured recovery decisions 12&ndash;18 hours before submission rather than waiting for panic to set in.
    </p>
    <ul style="margin: 0; padding-left: 14px;">
      <li><strong>Three Recovery Choices:</strong>
        <ol style="margin-top: 1px; margin-bottom: 1px; padding-left: 14px;">
          <li><code>[A] Switch to Fallback API:</code> Fallback to pre-built mocks or static responses when a teammate's backend stalls.</li>
          <li><code>[B] Cut Feature Scope:</code> Gracefully descope the blocked feature from the MVP deliverable.</li>
          <li><code>[C] Snooze 1 Hour:</code> Temporarily defer alerting while teammate is actively troubleshooting.</li>
        </ol>
      </li>
      <li><strong>Full Supabase Persistence:</strong> Triage choices and contextual notes are saved to <code>members</code> and logged to <code>triage_events</code>. Decisions persist across browser refreshes and devices.</li>
      <li><strong>Evidence:</strong> Implemented in <code>src/components/TriageModal.jsx</code> and validated via Playwright reload test in <code>scripts/verify-e2e.js</code>.</li>
    </ul>
  </div>

  <div class="card avoid-break">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
      <span class="card-title">M4 — Verified Proof-of-Ship Manifest</span>
      <span class="badge badge-done">Status: 100% Done</span>
    </div>
    <p style="margin: 0 0 3px 0; font-size: 8pt;">
      <strong>Specification:</strong> Provides a public, transparent record of genuine team contributions and scope decisions for hackathon judges.
    </p>
    <ul style="margin: 0; padding-left: 14px;">
      <li><strong>Automated Contributor Badging:</strong> Automatically assigns <span class="badge badge-done">Verified Contributor</span> to members meeting the verified activity threshold (or verified Figma specs) and <span class="badge badge-cut">Inactive / Unverified</span> to inactive ghosts.</li>
      <li><strong>Transparent Triage Audit Trail:</strong> Logs timestamped triage actions to show judges how technical blockers were managed proactively.</li>
      <li><strong>One-Click Judge Markdown Export:</strong> Copies formatted Markdown ready for Devpost/Devfolio project descriptions, and includes print stylesheets for clean PDF generation.</li>
      <li><strong>Evidence:</strong> Implemented in <code>src/pages/RoomManifest.jsx</code>. E2E verified in <code>scripts/record-demo.js</code>.</li>
    </ul>
  </div>

</body>
</html>
`;

async function generatePdf() {
  console.log('Generating PDF submission document using Playwright...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.setContent(htmlContent, { waitUntil: 'networkidle' });

  const outputPath = path.resolve(process.cwd(), 'ShipMate_MVP_Submission.pdf');
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '12mm',
      bottom: '12mm',
      left: '14mm',
      right: '14mm'
    }
  });

  await browser.close();
  console.log(`✅ PDF document successfully generated: ${outputPath}`);

  // Also copy to artifacts directory
  const artifactDir = '/Users/blank/.gemini/antigravity/brain/35cb9890-88f7-4ff9-b592-083bf0b976c5';
  const artifactPdf = path.join(artifactDir, 'ShipMate_MVP_Submission.pdf');
  fs.copyFileSync(outputPath, artifactPdf);
  console.log(`✅ PDF copied to artifact directory: ${artifactPdf}`);
}

generatePdf().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
