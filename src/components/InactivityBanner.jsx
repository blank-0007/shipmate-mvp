import React, { useState } from 'react';
import { AlertTriangle, Copy, Check, ShieldAlert, ArrowRight } from 'lucide-react';

export default function InactivityBanner({ inactiveMembers, room, onOpenTriage }) {
  const [copiedId, setCopiedId] = useState(null);

  if (!inactiveMembers || inactiveMembers.length === 0) {
    return null;
  }

  const handleCopyWhatsAppPing = (member) => {
    const handle = member.github_handle;
    const hours = member.hoursSinceLastCommit;
    const hackathon = room?.hackathon_name || 'Hackathon';
    const repo = room?.github_repo_url || 'the repo';

    const message = `🚨 Hey @${handle}! Just checking in for *${hackathon}*. No commits registered in the last *${hours}h* on ${repo}. Are you blocked or do we need to triage/cut scope before deadline? Let's ship! 🚢`;

    navigator.clipboard.writeText(message);
    setCopiedId(member.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  return (
    <div className="mb-8 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/40 p-5 shadow-lg shadow-amber-950/20 backdrop-blur">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-amber-500/20">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-500/20 rounded-lg border border-amber-500/30 text-amber-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase tracking-wider font-bold text-amber-400">
                Private to Team Lead
              </span>
              <span className="text-xs text-amber-300/70 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                No public alerts sent
              </span>
            </div>
            <h2 className="text-sm font-semibold text-slate-100 mt-0.5">
              {inactiveMembers.length} teammate{inactiveMembers.length > 1 ? 's' : ''} exceeded {room?.inactivity_threshold_hours || 6}h silence threshold
            </h2>
          </div>
        </div>

        <button
          onClick={() => onOpenTriage(inactiveMembers[0])}
          className="self-start sm:self-auto flex items-center space-x-2 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg transition shadow-sm"
        >
          <span>Open Triage Advisor</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {inactiveMembers.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-amber-500/30 text-xs"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <img
                src={`https://github.com/${member.github_handle}.png`}
                alt={member.github_handle}
                className="w-8 h-8 rounded-full border border-amber-500/40 bg-slate-800 flex-shrink-0"
                onError={(e) => {
                  e.target.src = 'https://github.com/ghost.png';
                }}
              />
              <div className="min-w-0">
                <div className="font-semibold text-slate-200 truncate">@{member.github_handle}</div>
                <div className="text-amber-400/90 font-mono">
                  {member.commitCount === 0
                    ? `0 commits (${member.hoursSinceLastCommit}h silent)`
                    : `${member.hoursSinceLastCommit}h since last commit`}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                onClick={() => handleCopyWhatsAppPing(member)}
                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-md font-medium text-xs transition ${
                  copiedId === member.id
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
                title="Copy WhatsApp alert message to clipboard"
              >
                {copiedId === member.id ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>WhatsApp Ping</span>
                  </>
                )}
              </button>

              <button
                onClick={() => onOpenTriage(member)}
                className="px-2.5 py-1.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium text-xs transition"
              >
                Triage
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
