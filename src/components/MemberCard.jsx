import React from 'react';
import { GitCommit, Clock, ExternalLink, ShieldCheck, AlertCircle, Wrench, Scissors, BellOff } from 'lucide-react';

export default function MemberCard({ member, onOpenTriage }) {
  // Determine badge styling and label
  let statusBadge = {
    label: 'Active',
    bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    icon: ShieldCheck,
  };

  if (member.isCut) {
    statusBadge = {
      label: 'Scope Cut / Shelved',
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      icon: Scissors,
    };
  } else if (member.isFallback) {
    statusBadge = {
      label: 'Fallback API Active',
      bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      icon: Wrench,
    };
  } else if (member.isSnoozed) {
    statusBadge = {
      label: 'Snoozed',
      bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      icon: BellOff,
    };
  } else if (member.isInactive) {
    statusBadge = {
      label: `Silent (${member.hoursSinceLastCommit}h)`,
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      icon: AlertCircle,
    };
  }

  const StatusIcon = statusBadge.icon;

  return (
    <div
      className={`rounded-xl border p-5 flex flex-col justify-between transition-all shadow-md ${
        member.isInactive
          ? 'bg-gradient-to-b from-amber-950/20 to-slate-900 border-amber-500/40 ring-1 ring-amber-500/30'
          : member.isCut
          ? 'bg-slate-900/40 border-slate-800/80 opacity-75'
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
      }`}
    >
      <div>
        {/* Header: Avatar, Handle, Role, Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <a
              href={`https://github.com/${member.github_handle}`}
              target="_blank"
              rel="noreferrer"
              className="relative group flex-shrink-0"
            >
              <img
                src={`https://github.com/${member.github_handle}.png`}
                alt={member.github_handle}
                className="w-12 h-12 rounded-xl border border-slate-700 bg-slate-800 object-cover group-hover:border-emerald-500 transition"
                onError={(e) => {
                  e.target.src = 'https://github.com/ghost.png';
                }}
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-900 flex items-center justify-center">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    member.isInactive
                      ? 'bg-amber-400 animate-ping'
                      : member.commitCount > 0
                      ? 'bg-emerald-400'
                      : 'bg-slate-500'
                  }`}
                />
              </span>
            </a>

            <div className="min-w-0">
              <div className="flex items-center space-x-1">
                <a
                  href={`https://github.com/${member.github_handle}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-slate-100 hover:text-emerald-400 text-sm truncate flex items-center space-x-1"
                >
                  <span>@{member.github_handle}</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </div>
              {member.role_label && (
                <p className="text-xs text-slate-400 truncate mt-0.5">{member.role_label}</p>
              )}
            </div>
          </div>

          <span
            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium border ${statusBadge.bg}`}
          >
            <StatusIcon className="w-3 h-3" />
            <span>{statusBadge.label}</span>
          </span>
        </div>

        {/* Triage Note if set */}
        {member.triage_note && (
          <div className="mt-3 text-xs bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 text-slate-300 font-sans">
            <span className="font-semibold text-slate-400">Triage Note:</span> {member.triage_note}
          </div>
        )}

        {/* Commits & Telemetry */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
              <span className="text-slate-400 block text-[11px]">Total Commits</span>
              <span className="text-lg font-bold font-mono text-slate-100 flex items-center space-x-1">
                <GitCommit className="w-4 h-4 text-emerald-400" />
                <span>{member.commitCount}</span>
              </span>
            </div>

            <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
              <span className="text-slate-400 block text-[11px]">Silence Duration</span>
              <span className="text-lg font-bold font-mono text-slate-100 flex items-center space-x-1">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>{member.hoursSinceLastCommit}h</span>
              </span>
            </div>
          </div>

          {/* Latest commit details */}
          <div className="mt-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Latest Commit
            </span>
            {member.latestCommit ? (
              <a
                href={member.latestCommit.url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block p-2 rounded-lg bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition group text-xs"
              >
                <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono">
                  <span className="text-emerald-400 group-hover:underline">
                    {member.latestCommit.sha}
                  </span>
                  <span>{new Date(member.latestCommit.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-slate-300 font-sans truncate mt-1 group-hover:text-slate-100">
                  {member.latestCommit.message}
                </p>
              </a>
            ) : (
              <p className="mt-1 text-xs text-slate-500 italic p-2 bg-slate-950/50 rounded-lg border border-slate-800/50">
                No commits detected in repository yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Card Action footer */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-end">
        <button
          onClick={() => onOpenTriage(member)}
          className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium transition border border-slate-700/60 flex items-center space-x-1.5"
        >
          <span>Triage Scope</span>
        </button>
      </div>
    </div>
  );
}
