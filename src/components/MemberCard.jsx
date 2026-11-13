import React from 'react';
import {
  GitCommit,
  Clock,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Wrench,
  Scissors,
  BellOff,
  GitPullRequest,
  CheckSquare,
  Figma,
  HelpCircle,
} from 'lucide-react';

export default function MemberCard({ member, onOpenTriage }) {
  // Determine primary display badge
  let statusBadge = {
    label: member.displayStatus,
    bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    icon: ShieldCheck,
  };

  if (member.displayStatus === 'Figma not verifiable') {
    statusBadge = {
      label: 'Figma not verifiable',
      bg: 'bg-slate-700/50 text-slate-300 border-slate-600',
      icon: HelpCircle,
    };
  } else if (member.displayStatus === 'Silent') {
    statusBadge = {
      label: `Silent (${member.silenceFormatted})`,
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      icon: AlertCircle,
    };
  } else if (member.displayStatus === 'Scope Cut') {
    statusBadge = {
      label: 'Scope Cut',
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      icon: Scissors,
    };
  } else if (member.displayStatus === 'Fallback API Active') {
    statusBadge = {
      label: 'Fallback API Active',
      bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      icon: Wrench,
    };
  } else if (member.displayStatus === 'Snoozed') {
    statusBadge = {
      label: 'Snoozed',
      bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      icon: BellOff,
    };
  }

  const StatusIcon = statusBadge.icon;

  return (
    <div
      className={`rounded-xl border p-4 sm:p-5 flex flex-col justify-between transition-all shadow-md ${
        member.needsDecision
          ? 'bg-gradient-to-b from-amber-950/20 to-slate-900 border-amber-500/40 ring-1 ring-amber-500/30'
          : member.isCut
          ? 'bg-slate-900/50 border-slate-800'
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
      }`}
    >
      <div>
        {/* Header: Avatar, Handle, Role, Badges */}
        <div className="flex items-start justify-between gap-2">
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
                className="w-11 h-11 rounded-xl border border-slate-700 bg-slate-800 object-cover group-hover:border-emerald-500 transition"
                onError={(e) => {
                  e.target.src = 'https://github.com/ghost.png';
                }}
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-900 flex items-center justify-center">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    member.needsDecision
                      ? 'bg-amber-400 animate-ping'
                      : member.qualifyingCount > 0
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
                  <ExternalLink className="w-3 h-3 text-slate-500 flex-shrink-0" />
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-1 mt-0.5">
                {member.role_label && (
                  <span className="text-[11px] text-slate-400 truncate">{member.role_label}</span>
                )}
                {member.is_designer && (
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                    Designer
                  </span>
                )}
              </div>
            </div>
          </div>

          <span
            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${statusBadge.bg}`}
          >
            <StatusIcon className="w-3 h-3 flex-shrink-0" />
            <span className="truncate max-w-[120px]">{statusBadge.label}</span>
          </span>
        </div>

        {/* Triage Decision Chip if active */}
        {member.hasDecision && (
          <div className="mt-3 text-xs bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between">
            <span className="text-slate-300 font-medium">
              Decision: <strong className="text-amber-400">{member.triage_status === 'cut_scope' ? 'Scope Cut' : 'Fallback API'}</strong>
            </span>
            {member.triage_note && (
              <span className="text-[11px] text-slate-400 italic truncate max-w-[150px]">
                "{member.triage_note}"
              </span>
            )}
          </div>
        )}

        {/* Telemetry Stats Grid */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
              <span className="text-slate-400 block text-[11px]">Activity Events</span>
              <span className="text-base font-bold font-mono text-slate-100 flex items-center space-x-1.5 mt-0.5">
                <GitCommit className="w-3.5 h-3.5 text-emerald-400" />
                <span>{member.commitsCount}</span>
                {member.prsCount > 0 && (
                  <span className="text-[11px] text-blue-400 font-sans" title="Pull Requests">
                    +{member.prsCount} PR
                  </span>
                )}
                {member.figmaVersionsCount > 0 && (
                  <span className="text-[11px] text-purple-400 font-sans" title="Figma Checkpoints">
                    +{member.figmaVersionsCount} Figma
                  </span>
                )}
              </span>
            </div>

            <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
              <span className="text-slate-400 block text-[11px]">Silence Duration</span>
              <span className="text-base font-bold font-mono text-slate-100 flex items-center space-x-1.5 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{member.silenceFormatted}</span>
              </span>
            </div>
          </div>

          {/* Latest commit or activity */}
          <div className="mt-3">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Latest Qualifying Work
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
                  <span>
                    {new Date(member.latestCommit.date).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-slate-300 font-sans truncate mt-1 group-hover:text-slate-100">
                  {member.latestCommit.message}
                </p>
              </a>
            ) : member.figmaVersionsCount > 0 ? (
              <p className="mt-1 text-xs text-purple-300 p-2 bg-purple-950/30 rounded-lg border border-purple-800/40 font-mono">
                {member.figmaVersionsCount} Figma checkpoint(s) verified
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-500 italic p-2 bg-slate-950/50 rounded-lg border border-slate-800/50">
                No activity detected since sprint start
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Card Action footer */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
        <span className="text-[11px] text-slate-500">
          {member.manifestBadge === 'Verified Contributor' ? (
            <span className="text-emerald-400/90 font-medium">✓ Verified</span>
          ) : (
            <span className="text-slate-500">Unverified</span>
          )}
        </span>

        <button
          onClick={() => onOpenTriage(member)}
          className="text-xs px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium transition border border-slate-700/60 min-h-[44px] flex items-center space-x-1"
        >
          <span>Triage</span>
        </button>
      </div>
    </div>
  );
}
