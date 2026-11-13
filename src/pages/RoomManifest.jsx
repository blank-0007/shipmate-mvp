import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  FileText,
  Printer,
  Copy,
  Check,
  ExternalLink,
  Github,
  Figma,
  ShieldCheck,
  AlertCircle,
  Scissors,
  Wrench,
  ArrowLeft,
  Clock,
  Layers,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { getStoredLeadKey, getRoomActivity } from '../services/api';
import { copyToClipboard } from '../utils/clipboard';
import Navbar from '../components/Navbar';

export default function RoomManifest() {
  const { id: roomId } = useParams();
  const location = useLocation();
  const leadKey = getStoredLeadKey(roomId);

  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [triageEvents, setTriageEvents] = useState([]);
  const [totalCommits, setTotalCommits] = useState(0);
  const [figmaFrameCount, setFigmaFrameCount] = useState(null);
  const [isFigmaAccessible, setIsFigmaAccessible] = useState(true);
  const [dataFreshness, setDataFreshness] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedMd, setCopiedMd] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getRoomActivity(roomId, leadKey);
      setRoom(data.room);
      setMembers(data.members || []);
      setTriageEvents(data.triageEvents || []);
      setTotalCommits(data.totalCommits || 0);
      setFigmaFrameCount(data.figmaFrameCount || null);
      setIsFigmaAccessible(data.isFigmaAccessible !== false);
      setDataFreshness(data.dataFreshness || null);
    } catch (err) {
      setError(err.message || 'Failed to load manifest data.');
    } finally {
      setLoading(false);
    }
  }, [roomId, leadKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePrint = () => {
    window.print();
  };

  const generateMarkdownReport = () => {
    if (!room) return '';
    const nowStr = new Date().toLocaleString();
    const verifiedCount = members.filter((m) => m.manifestBadge === 'Verified Contributor').length;

    let md = `# 🚢 ShipMate — Verified Proof-of-Ship Manifest\n\n`;
    md += `**Hackathon:** ${room.hackathon_name}\n`;
    md += `**Repository:** ${room.github_repo_url}\n`;
    if (room.figma_url) {
      md += `**Figma Design:** ${room.figma_url} (${isFigmaAccessible ? 'Activity Verified' : 'Linked'})\n`;
    }
    md += `**Sprint Window:** ${new Date(room.sprint_start).toLocaleString()} to ${new Date(room.deadline).toLocaleString()}\n`;
    md += `**Total Verified Commits:** ${totalCommits}\n`;
    md += `**Active Contributors:** ${verifiedCount} / ${members.length}\n`;
    if (dataFreshness?.stale) {
      md += `\n> ⚠️ Note: Data as of ${new Date(dataFreshness.fetchedAt).toLocaleString()} (Upstream warning: ${dataFreshness.error})\n`;
    }
    md += `\n## 👥 Contributor Verification Breakdown\n\n`;
    md += `| Contributor | Role | Commits (+/- lines) | PRs / Reviews | Figma Activity | Verification Badge | Triage Status |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

    members.forEach((m) => {
      const commitsStr = `${m.commitsCount} (+${m.linesAdded}/-${m.linesDeleted})`;
      const prsStr = `${m.prsCount} PR / ${m.reviewsCount} review`;
      const figmaStr = m.is_designer ? `${m.figmaVersionsCount} versions` : 'N/A';
      const triageStr = m.triage_status !== 'none' ? `[${m.triage_status}] ${m.triage_note || ''}` : 'None';

      md += `| @${m.github_handle} | ${m.role_label || 'Contributor'} | ${commitsStr} | ${prsStr} | ${figmaStr} | ${m.manifestBadge} | ${triageStr} |\n`;
    });

    if (triageEvents.length > 0) {
      md += `\n## 📋 Triage Decisions Audit Log\n\n`;
      md += `| Timestamp | Contributor | Action | Note |\n`;
      md += `| :--- | :--- | :--- | :--- |\n`;
      triageEvents.forEach((ev) => {
        const mem = members.find((m) => m.id === ev.member_id);
        const handle = mem ? `@${mem.github_handle}` : 'Member';
        md += `| ${new Date(ev.created_at).toLocaleString()} | ${handle} | ${ev.action} | ${ev.note || '-'} |\n`;
      });
    }

    md += `\n---\n*Verified Contributor requires >= 3 qualifying events (commits, PRs, reviews, or Figma checkpoints) within the sprint window.*\n`;
    return md;
  };

  const handleCopyMarkdown = async () => {
    const md = generateMarkdownReport();
    const success = await copyToClipboard(md);
    if (success) {
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center space-x-2 text-slate-400 text-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Compiling Proof-of-Ship Manifest...</span>
          </div>
        </div>
      </div>
    );
  }

  const verifiedCount = members.filter((m) => m.manifestBadge === 'Verified Contributor').length;
  const hash = typeof window !== 'undefined' ? window.location.hash : '';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar room={room} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        {/* Navigation Bar & Action Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 no-print">
          <Link
            to={`/room/${room?.id}${hash}`}
            className="inline-flex items-center space-x-2 text-xs font-medium text-slate-400 hover:text-white transition min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Live Monitor</span>
          </Link>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleCopyMarkdown}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center space-x-2 shadow-sm min-h-[44px]"
            >
              {copiedMd ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copiedMd ? 'Copied Markdown!' : 'Copy Submission Markdown'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition flex items-center space-x-2 shadow-lg shadow-emerald-500/20 min-h-[44px]"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>

        {/* Stale Data Warning Banner */}
        {dataFreshness?.stale && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1 no-print">
            <span className="font-bold flex items-center space-x-1.5 text-amber-400">
              <AlertCircle className="w-4 h-4" />
              <span>Warning: Data Stale / Upstream Error</span>
            </span>
            <p>
              Telemetry data shown was captured at {new Date(dataFreshness.fetchedAt).toLocaleString()}. Reason: {dataFreshness.error}
            </p>
          </div>
        )}

        {/* Printable Manifest Document Sheet */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-8 print:border-none print:shadow-none print:p-0 print:text-black print:bg-white">
          {/* Header */}
          <div className="border-b border-slate-800 print:border-slate-300 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3 print:border-emerald-600 print:text-emerald-700">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Proof-of-Ship Manifest</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white print:text-black">
                {room?.hackathon_name}
              </h1>
              <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
                Generated {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()} • Zero-friction passive telemetry audit
              </p>
            </div>

            <div className="text-left sm:text-right sm:self-end">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 print:text-slate-600 block">
                Verification Grade
              </span>
              <span className="text-lg font-bold font-mono text-emerald-400 print:text-emerald-700">
                {verifiedCount} / {members.length} Contributors Verified
              </span>
            </div>
          </div>

          {/* Top Telemetry Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* GitHub Commits */}
            <div className="p-4 rounded-xl bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200">
              <span className="text-xs text-slate-400 print:text-slate-600 block font-medium">Public Commits Polled</span>
              <div className="text-2xl font-bold font-mono text-slate-100 print:text-black mt-1 flex items-center space-x-2">
                <Github className="w-5 h-5 text-emerald-400 print:text-emerald-700" />
                <span>{totalCommits}</span>
              </div>
              <a
                href={room?.github_repo_url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 text-xs text-emerald-400 hover:underline inline-flex items-center space-x-1 truncate max-w-full font-mono"
              >
                <span>{room?.github_repo_url.replace('https://github.com/', '')}</span>
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            </div>

            {/* Figma Spec Status */}
            <div className="p-4 rounded-xl bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200">
              <span className="text-xs text-slate-400 print:text-slate-600 block font-medium">Figma Spec Status</span>
              <div className="text-sm font-bold text-slate-100 print:text-black mt-2 flex items-center space-x-2">
                <Figma className="w-4 h-4 text-purple-400" />
                <span>
                  {room?.figma_url
                    ? isFigmaAccessible
                      ? 'Activity Verified'
                      : 'Linked (Read-Only)'
                    : 'No Spec Attached'}
                </span>
              </div>
              {room?.figma_url ? (
                <div className="mt-2 text-xs">
                  {figmaFrameCount !== null && (
                    <span className="text-slate-400 print:text-slate-600 font-mono block mb-1">
                      {figmaFrameCount} top-level frames
                    </span>
                  )}
                  <a
                    href={room.figma_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-400 hover:underline inline-flex items-center space-x-1 truncate max-w-full"
                  >
                    <span>Open Figma Design</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 mt-2">Optional for hackathon entry</p>
              )}
            </div>

            {/* Sprint Window */}
            <div className="p-4 rounded-xl bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200">
              <span className="text-xs text-slate-400 print:text-slate-600 block font-medium">Sprint Window</span>
              <div className="text-xs font-bold font-mono text-slate-200 print:text-black mt-2 space-y-1">
                <div>Start: {new Date(room?.sprint_start).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>
                <div>End: {new Date(room?.deadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>
              </div>
            </div>
          </div>

          {/* Contributor Verification Table */}
          <div>
            <h2 className="text-base font-bold text-white print:text-black mb-3 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Contributor Verification Table</span>
            </h2>

            <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-slate-300">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 print:bg-slate-100 text-slate-400 print:text-slate-700 border-b border-slate-800 print:border-slate-300">
                    <th className="py-3 px-4 font-semibold">Contributor</th>
                    <th className="py-3 px-4 font-semibold">Role</th>
                    <th className="py-3 px-4 font-semibold text-center">Commits (+/-)</th>
                    <th className="py-3 px-4 font-semibold text-center">PRs & Reviews</th>
                    <th className="py-3 px-4 font-semibold text-center">Figma Versions</th>
                    <th className="py-3 px-4 font-semibold text-right">Evidence Badge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-slate-200 text-slate-200 print:text-black font-sans">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-950/30 print:hover:bg-transparent">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2.5">
                          <img
                            src={`https://github.com/${member.github_handle}.png`}
                            alt={member.github_handle}
                            className="w-7 h-7 rounded-full border border-slate-700 bg-slate-800 flex-shrink-0"
                            onError={(e) => {
                              e.target.src = 'https://github.com/ghost.png';
                            }}
                          />
                          <div>
                            <span className="font-bold text-slate-100 print:text-black block">
                              @{member.github_handle}
                            </span>
                            {member.hasDecision && (
                              <span className="text-[10px] text-amber-400 print:text-amber-700 block font-semibold">
                                {member.triage_status === 'cut_scope' ? 'Scope Cut' : 'Fallback API'}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 print:text-slate-600">
                        {member.role_label || 'Contributor'}
                        {member.is_designer && (
                          <span className="block text-[10px] text-purple-400 print:text-purple-700">
                            Designer
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className="font-bold">{member.commitsCount}</span>
                        {(member.linesAdded > 0 || member.linesDeleted > 0) && (
                          <span className="block text-[10px] text-slate-500">
                            +{member.linesAdded}/-{member.linesDeleted}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono">
                        {member.prsCount} PR / {member.reviewsCount} review
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono">
                        {member.is_designer ? `${member.figmaVersionsCount} versions` : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {member.manifestBadge === 'Verified Contributor' ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 print:border-emerald-600 print:text-emerald-700">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Verified Contributor</span>
                          </span>
                        ) : member.manifestBadge === 'Figma not verifiable' ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700 print:border-slate-400 print:text-slate-700">
                            <HelpCircle className="w-3 h-3" />
                            <span>Figma not verifiable</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700 print:border-slate-300 print:text-slate-600">
                            <AlertCircle className="w-3 h-3" />
                            <span>Inactive / Unverified</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Triage Events Audit Trail */}
          {triageEvents.length > 0 && (
            <div className="pt-4 border-t border-slate-800 print:border-slate-200">
              <h3 className="text-sm font-bold text-slate-200 print:text-black mb-3">
                Early Triage & Scope Audit Trail
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-slate-300">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 print:bg-slate-100 text-slate-400 print:text-slate-700 border-b border-slate-800 print:border-slate-300">
                      <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                      <th className="py-2.5 px-3 font-semibold">Contributor</th>
                      <th className="py-2.5 px-3 font-semibold">Decision Action</th>
                      <th className="py-2.5 px-3 font-semibold">Recorded Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 print:divide-slate-200 text-slate-300 print:text-black font-sans">
                    {triageEvents.map((ev) => {
                      const member = members.find((m) => m.id === ev.member_id);
                      return (
                        <tr key={ev.id}>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 print:text-slate-600">
                            {new Date(ev.created_at).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-200 print:text-black">
                            @{member ? member.github_handle : 'Contributor'}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-amber-400 print:text-amber-700">
                            [{ev.action}]
                          </td>
                          <td className="py-2.5 px-3 text-slate-300 print:text-slate-700 italic">
                            {ev.note || 'No custom note recorded'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer Rule Explanation */}
          <div className="pt-6 border-t border-slate-800 print:border-slate-300 text-center text-xs text-slate-500 print:text-slate-600">
            <p>
              *Verified Contributor badge requires ≥ 3 qualifying activities (commits, pull requests, reviews, or Figma versions) within the sprint window.
            </p>
            <p className="mt-1">
              Certified by ShipMate Telemetry Engine • Commits & PRs queried via GitHub GraphQL API
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
