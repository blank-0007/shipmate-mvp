import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  Calendar,
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';
import { getRoomWithMembers } from '../services/supabase';
import { parseGitHubRepo, fetchRepoCommits, mapCommitsToMembers } from '../services/github';
import Navbar from '../components/Navbar';

export default function RoomManifest() {
  const { id: roomId } = useParams();

  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [processedMembers, setProcessedMembers] = useState([]);
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedMd, setCopiedMd] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getRoomWithMembers(roomId);
      setRoom(data.room);
      setMembers(data.members);

      // Fetch commits
      if (data.room?.github_repo_url) {
        const parsed = parseGitHubRepo(data.room.github_repo_url);
        if (parsed) {
          try {
            const { commits: fetchedCommits } = await fetchRepoCommits(parsed.owner, parsed.repo);
            setCommits(fetchedCommits);
            const processed = mapCommitsToMembers(
              data.members,
              fetchedCommits,
              data.room.created_at,
              data.room.inactivity_threshold_hours || 6
            );
            setProcessedMembers(processed);
          } catch (apiErr) {
            console.warn('Commit fetch warning:', apiErr);
            const processed = mapCommitsToMembers(
              data.members,
              [],
              data.room.created_at,
              data.room.inactivity_threshold_hours || 6
            );
            setProcessedMembers(processed);
          }
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePrint = () => {
    window.print();
  };

  const generateMarkdownReport = () => {
    if (!room) return '';
    const nowStr = new Date().toLocaleString();
    const verifiedCount = processedMembers.filter((m) => m.commitCount > 0).length;

    let md = `# 🚢 ShipMate — Verified Proof-of-Ship Manifest\n\n`;
    md += `**Hackathon:** ${room.hackathon_name}\n`;
    md += `**Repository:** ${room.github_repo_url}\n`;
    if (room.figma_url) {
      md += `**Figma Design:** ${room.figma_url} (Verified)\n`;
    }
    md += `**Generated At:** ${nowStr}\n`;
    md += `**Total Verified Commits:** ${commits.length}\n`;
    md += `**Active Contributors:** ${verifiedCount} / ${processedMembers.length}\n\n`;

    md += `## 👥 Contributor Verification Breakdown\n\n`;
    md += `| Contributor | Role / Scope | Verified Commits | Latest Commit | Status |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;

    processedMembers.forEach((m) => {
      let status = m.commitCount > 0 ? '✅ Verified Contributor' : '⚠️ Unverified (0 Commits)';
      if (m.triage_status === 'cut_scope') status = '✂️ Scope Cut / Shelved';
      if (m.triage_status === 'fallback_api') status = '🛠️ Fallback API Active';

      const latest = m.latestCommit ? `${m.latestCommit.sha} (${m.latestCommit.message})` : 'None';
      md += `| @${m.github_handle} | ${m.role_label || 'Contributor'} | ${m.commitCount} | ${latest} | ${status} |\n`;
    });

    const triagedMembers = processedMembers.filter((m) => m.triage_status !== 'none' || m.triage_note);
    if (triagedMembers.length > 0) {
      md += `\n## 📋 Early Triage & Scope Decisions Audit\n\n`;
      triagedMembers.forEach((m) => {
        md += `- **@${m.github_handle}** [${m.triage_status}]: ${m.triage_note || 'No custom note recorded'}\n`;
      });
    }

    md += `\n---\n*Verified passively via ShipMate MVP (GitHub REST API Telemetry)*\n`;
    return md;
  };

  const handleCopyMarkdown = () => {
    const md = generateMarkdownReport();
    navigator.clipboard.writeText(md);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2500);
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

  const verifiedContributorsCount = processedMembers.filter((m) => m.commitCount > 0).length;
  const isFigmaVerified = Boolean(room?.figma_url && room.figma_url.includes('figma.com'));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar room={room} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Navigation back and export action buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 no-print">
          <Link
            to={`/room/${room?.id}`}
            className="inline-flex items-center space-x-2 text-xs font-medium text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Live Monitor</span>
          </Link>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleCopyMarkdown}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center space-x-2 shadow-sm"
              title="Copy formatted Markdown for Devpost or submission form"
            >
              {copiedMd ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copiedMd ? 'Copied Markdown!' : 'Copy Submission Markdown'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition flex items-center space-x-2 shadow-lg shadow-emerald-500/20"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>

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

            <div className="text-right sm:self-end">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 print:text-slate-600 block">
                Verification Grade
              </span>
              <span className="text-lg font-bold font-mono text-emerald-400 print:text-emerald-700">
                {verifiedContributorsCount} / {processedMembers.length} Contributors Verified
              </span>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Commits */}
            <div className="p-4 rounded-xl bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200">
              <span className="text-xs text-slate-400 print:text-slate-600 block font-medium">Public Commits Polled</span>
              <div className="text-2xl font-bold font-mono text-slate-100 print:text-black mt-1 flex items-center space-x-2">
                <Github className="w-5 h-5 text-emerald-400 print:text-emerald-700" />
                <span>{commits.length}</span>
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

            {/* Design Spec */}
            <div className="p-4 rounded-xl bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200">
              <span className="text-xs text-slate-400 print:text-slate-600 block font-medium">Figma Spec Status</span>
              <div className="text-base font-bold text-slate-100 print:text-black mt-2 flex items-center space-x-2">
                <Figma className="w-5 h-5 text-purple-400" />
                <span className={isFigmaVerified ? 'text-purple-400 print:text-purple-700' : 'text-slate-500'}>
                  {isFigmaVerified ? 'Verified Spec Linked' : 'No Spec Attached'}
                </span>
              </div>
              {room?.figma_url ? (
                <a
                  href={room.figma_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 text-xs text-purple-400 hover:underline inline-flex items-center space-x-1 truncate max-w-full"
                >
                  <span>Open Figma Design</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              ) : (
                <p className="text-[11px] text-slate-500 mt-2">Optional for hackathon entry</p>
              )}
            </div>

            {/* Deadline / Duration */}
            <div className="p-4 rounded-xl bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200">
              <span className="text-xs text-slate-400 print:text-slate-600 block font-medium">Sprint Deadline</span>
              <div className="text-sm font-bold font-mono text-slate-200 print:text-black mt-2 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>{new Date(room?.deadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Inactivity threshold set to {room?.inactivity_threshold_hours || 6}h
              </p>
            </div>
          </div>

          {/* Contributors Breakdown Table */}
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
                    <th className="py-3 px-4 font-semibold">Role / Feature</th>
                    <th className="py-3 px-4 font-semibold text-center">Commits</th>
                    <th className="py-3 px-4 font-semibold">Latest Commit</th>
                    <th className="py-3 px-4 font-semibold text-right">Manifest Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-slate-200 text-slate-200 print:text-black font-sans">
                  {processedMembers.map((member) => {
                    const isVerified = member.commitCount > 0;
                    return (
                      <tr key={member.id} className="hover:bg-slate-950/30 print:hover:bg-transparent">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-2.5">
                            <img
                              src={`https://github.com/${member.github_handle}.png`}
                              alt={member.github_handle}
                              className="w-7 h-7 rounded-full border border-slate-700 bg-slate-800"
                              onError={(e) => {
                                e.target.src = 'https://github.com/ghost.png';
                              }}
                            />
                            <div>
                              <span className="font-bold text-slate-100 print:text-black block">
                                @{member.github_handle}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-400 print:text-slate-600">
                          {member.role_label || 'Core Contributor'}
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono font-bold text-sm">
                          {member.commitCount}
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          {member.latestCommit ? (
                            <div className="truncate">
                              <span className="font-mono text-emerald-400 print:text-emerald-700 font-semibold mr-1.5">
                                {member.latestCommit.sha}
                              </span>
                              <span className="text-slate-300 print:text-slate-700">
                                {member.latestCommit.message}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">No commits recorded</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {member.triage_status === 'cut_scope' ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 print:border-rose-600 print:text-rose-700">
                              <Scissors className="w-3 h-3" />
                              <span>Scope Cut / Shelved</span>
                            </span>
                          ) : member.triage_status === 'fallback_api' ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 print:border-blue-600 print:text-blue-700">
                              <Wrench className="w-3 h-3" />
                              <span>Fallback API Active</span>
                            </span>
                          ) : isVerified ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 print:border-emerald-600 print:text-emerald-700">
                              <ShieldCheck className="w-3 h-3" />
                              <span>Verified Contributor</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700 print:border-slate-300 print:text-slate-600">
                              <AlertCircle className="w-3 h-3" />
                              <span>Inactive / Unverified</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Triage Log / Audit Trail */}
          {processedMembers.some((m) => m.triage_status !== 'none' || m.triage_note) && (
            <div className="pt-4 border-t border-slate-800 print:border-slate-200">
              <h3 className="text-sm font-bold text-slate-200 print:text-black mb-3">
                Early Triage & Scope Audit Trail
              </h3>
              <div className="space-y-2">
                {processedMembers
                  .filter((m) => m.triage_status !== 'none' || m.triage_note)
                  .map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-lg bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200 text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-100 print:text-black">@{m.github_handle}</span>
                        <span className="text-slate-400 print:text-slate-600 ml-2 font-mono">
                          [{m.triage_status.toUpperCase()}]
                        </span>
                        {m.triage_note && (
                          <p className="text-slate-300 print:text-slate-700 mt-0.5">
                            Note: "{m.triage_note}"
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500">Documented</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Footer certification */}
          <div className="pt-6 border-t border-slate-800 print:border-slate-300 text-center text-xs text-slate-500 print:text-slate-600">
            <p>
              Certified by ShipMate Telemetry Engine • Commits queried directly from GitHub REST API
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
