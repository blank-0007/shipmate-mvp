import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ship,
  Github,
  Figma,
  Clock,
  Users,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Shield,
  Copy,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { createRoom, createDemoRoom, getLeadUrl } from '../services/api';
import { toLocalDatetimeInputValue } from '../../shared/date';
import { copyToClipboard } from '../utils/clipboard';
import Navbar from '../components/Navbar';

export default function CreateRoom() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDemoSubmitting, setIsDemoSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Lead link modal state after room creation
  const [createdRoomInfo, setCreatedRoomInfo] = useState(null);
  const [copiedLeadLink, setCopiedLeadLink] = useState(false);
  const [copiedTeamMessage, setCopiedTeamMessage] = useState(false);

  // Form State
  const [hackathonName, setHackathonName] = useState('');
  const [sprintStart, setSprintStart] = useState(() => toLocalDatetimeInputValue(new Date()));
  const [deadline, setDeadline] = useState(() =>
    toLocalDatetimeInputValue(new Date(Date.now() + 24 * 60 * 60 * 1000))
  );
  const [githubRepoUrl, setGithubRepoUrl] = useState('');
  const [figmaUrl, setFigmaUrl] = useState('');
  const [inactivityThresholdHours, setInactivityThresholdHours] = useState(6);

  // Teammates state (1 to 4)
  const [teammates, setTeammates] = useState([
    { handle: '', role: 'Team Lead / Frontend', isDesigner: false, figmaHandle: '' },
    { handle: '', role: 'Backend API', isDesigner: false, figmaHandle: '' },
    { handle: '', role: 'Fullstack', isDesigner: false, figmaHandle: '' },
    { handle: '', role: 'Design / UI', isDesigner: true, figmaHandle: '' },
  ]);

  const handleTeammateChange = (index, field, value) => {
    const updated = [...teammates];
    updated[index][field] = value;

    // Auto-toggle designer if role contains design/ui/ux
    if (field === 'role') {
      const lower = value.toLowerCase();
      if (lower.includes('design') || lower.includes('ui') || lower.includes('ux')) {
        updated[index].isDesigner = true;
      }
    }
    setTeammates(updated);
  };

  const handleDemoClick = async () => {
    setError(null);
    setIsDemoSubmitting(true);
    try {
      const res = await createDemoRoom();
      navigate(`/room/${res.id}#k=${res.leadKey}`);
    } catch (err) {
      setError(`Failed to create demo room: ${err.message}`);
    } finally {
      setIsDemoSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const validTeammates = teammates.filter((t) => Boolean(t.handle.trim()));
    if (validTeammates.length === 0) {
      setError('Please provide at least 1 teammate GitHub handle.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createRoom({
        hackathonName,
        sprintStart: new Date(sprintStart).toISOString(),
        deadline: new Date(deadline).toISOString(),
        githubRepoUrl,
        figmaUrl,
        inactivityThresholdHours: Number(inactivityThresholdHours),
        teammates: validTeammates,
      });

      // Show lead key confirmation modal
      setCreatedRoomInfo(result);
    } catch (err) {
      setError(err.message || 'Failed to create sprint room.');
      if (err.field) {
        setFieldErrors({ [err.field]: err.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const leadUrl = createdRoomInfo ? getLeadUrl(createdRoomInfo.id, createdRoomInfo.leadKey) : '';
  const teamNotice = `Hey team! I set up ShipMate for our hackathon repository (${githubRepoUrl || 'the repo'}). It passively tracks commits, PRs, reviews, and Figma activity to prevent submission blindspots. Inactivity alerts are private to me as the lead — nothing is posted publicly. Let's ship! 🚢`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10">
        {/* Hero Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
            <Ship className="w-3.5 h-3.5" />
            <span>Zero-Friction Hackathon Telemetry</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Create Your Hackathon <span className="text-emerald-400">Sprint Room</span>
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-400">
            Passively tracks verified GitHub commits, PRs, reviews, and Figma activity. Automated 6-hour inactivity alerts let you cut deadweight features early without hostel friction.
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleDemoClick}
              disabled={isDemoSubmitting}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition min-h-[44px]"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{isDemoSubmitting ? 'Creating Demo...' : 'Try the demo (no repo needed)'}</span>
            </button>
          </div>
        </div>

        {/* What ShipMate Reads Privacy Box */}
        <div className="mb-6 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-start space-x-3">
          <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400 flex-shrink-0 mt-0.5">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-200">What ShipMate Reads & Privacy Guarantee</h2>
            <p className="text-slate-400 mt-1 leading-relaxed">
              ShipMate reads <strong>commits, pull requests, reviews</strong>, and <strong>Figma file activity</strong>. Only you, the team lead, can see inactivity alerts. Nothing is posted publicly. Teammates never experience public embarrassment.
            </p>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Setup Form */}
        <form onSubmit={handleSubmit} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-8 shadow-xl space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            {/* Hackathon Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-2">
                Hackathon Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={hackathonName}
                onChange={(e) => setHackathonName(e.target.value)}
                placeholder="e.g. Smart India Hackathon 2026"
                className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition min-h-[44px] ${
                  fieldErrors.hackathonName ? 'border-rose-500' : 'border-slate-800'
                }`}
              />
              {fieldErrors.hackathonName && (
                <p className="mt-1 text-[11px] text-rose-400">{fieldErrors.hackathonName}</p>
              )}
            </div>

            {/* Public GitHub Repo URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-2 flex items-center space-x-1.5">
                <Github className="w-3.5 h-3.5 text-emerald-400" />
                <span>Public GitHub Repo URL</span>
                <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={githubRepoUrl}
                onChange={(e) => setGithubRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repository"
                className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition font-mono min-h-[44px] ${
                  fieldErrors.githubRepoUrl ? 'border-rose-500' : 'border-slate-800'
                }`}
              />
              {fieldErrors.githubRepoUrl ? (
                <p className="mt-1 text-[11px] text-rose-400">{fieldErrors.githubRepoUrl}</p>
              ) : (
                <p className="mt-1 text-[11px] text-slate-500">Verified server-side via GitHub API.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            {/* Sprint Started At (Local time without UTC skew) */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-2 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Sprint Started At</span>
                <span className="text-rose-400">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={sprintStart}
                onChange={(e) => setSprintStart(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition font-mono min-h-[44px]"
              />
              <p className="mt-1 text-[11px] text-slate-500">Silence clock measures from this timestamp.</p>
            </div>

            {/* Submission Deadline (Local time) */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-2 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Submission Deadline</span>
                <span className="text-rose-400">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition font-mono min-h-[44px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            {/* Figma File URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-2 flex items-center space-x-1.5">
                <Figma className="w-3.5 h-3.5 text-purple-400" />
                <span>Figma File URL (Optional)</span>
              </label>
              <input
                type="url"
                value={figmaUrl}
                onChange={(e) => setFigmaUrl(e.target.value)}
                placeholder="https://www.figma.com/design/..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition font-mono min-h-[44px]"
              />
              <p className="mt-1 text-[11px] text-slate-500">Must be set to "Anyone with the link can view".</p>
            </div>

            {/* Inactivity Threshold */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Silence Threshold</span>
                </label>
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {inactivityThresholdHours} hours
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="24"
                step="1"
                value={inactivityThresholdHours}
                onChange={(e) => setInactivityThresholdHours(e.target.value)}
                className="w-full accent-amber-500 bg-slate-800 cursor-pointer h-2.5 rounded-lg my-3"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>1h (aggressive)</span>
                <span>6h (recommended standard)</span>
                <span>12h</span>
                <span>24h</span>
              </div>
            </div>
          </div>

          {/* Teammates (1 to 4 Members) */}
          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Teammates (Up to 4 Contributors)</span>
              </h2>
              <span className="text-[11px] text-slate-400">Validated against GitHub user API</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {teammates.map((teammate, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">Teammate {idx + 1}</span>
                    <label className="flex items-center space-x-1.5 cursor-pointer text-[11px] text-slate-400 select-none">
                      <input
                        type="checkbox"
                        checked={teammate.isDesigner}
                        onChange={(e) => handleTeammateChange(idx, 'isDesigner', e.target.checked)}
                        className="rounded bg-slate-800 border-slate-700 text-purple-500 focus:ring-0"
                      />
                      <span>Designer?</span>
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-2.5 text-xs text-slate-500">@</span>
                      <input
                        type="text"
                        value={teammate.handle}
                        onChange={(e) => handleTeammateChange(idx, 'handle', e.target.value)}
                        placeholder="github_username"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-7 pr-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono min-h-[44px]"
                      />
                    </div>
                    <input
                      type="text"
                      value={teammate.role}
                      onChange={(e) => handleTeammateChange(idx, 'role', e.target.value)}
                      placeholder="Role / Feature"
                      className="w-full sm:w-1/2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 min-h-[44px]"
                    />
                  </div>

                  {teammate.isDesigner && (
                    <div className="pt-2 border-t border-slate-800/60">
                      <label className="block text-[11px] text-purple-300 mb-1">
                        Optional Figma Username / Handle:
                      </label>
                      <input
                        type="text"
                        value={teammate.figmaHandle}
                        onChange={(e) => handleTeammateChange(idx, 'figmaHandle', e.target.value)}
                        placeholder="e.g. ananya_design"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 min-h-[44px]"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 flex items-center justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 min-h-[48px]"
            >
              <span>{isSubmitting ? 'Verifying & Initializing...' : 'Launch Sprint Monitor'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </main>

      {/* One-Time Lead Key Modal after creation */}
      {createdRoomInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
              <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Sprint Room Initialized!</h3>
                <p className="text-xs text-slate-400">Save your private team lead access link.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
              <span className="font-bold block text-amber-300">⚠️ IMPORTANT PRIVACY RULE:</span>
              <p>
                Save your lead link — it is the <strong>only way back into this room</strong>. Do NOT post this link in your team group or public chat.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Your Private Lead URL:</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={leadUrl}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 min-h-[44px]"
                />
                <button
                  type="button"
                  onClick={async () => {
                    await copyToClipboard(leadUrl);
                    setCopiedLeadLink(true);
                    setTimeout(() => setCopiedLeadLink(false), 2000);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs flex items-center space-x-1 min-h-[44px]"
                >
                  {copiedLeadLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLeadLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Ready-to-paste WhatsApp message for team */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Transparency Message for Teammates (Share this in group):
              </label>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 relative">
                <p>{teamNotice}</p>
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={async () => {
                      await copyToClipboard(teamNotice);
                      setCopiedTeamMessage(true);
                      setTimeout(() => setCopiedTeamMessage(false), 2000);
                    }}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 min-h-[36px]"
                  >
                    {copiedTeamMessage ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedTeamMessage ? 'Copied Notice' : 'Copy Team Notice'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => navigate(`/room/${createdRoomInfo.id}#k=${createdRoomInfo.leadKey}`)}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center space-x-1.5 shadow-md min-h-[44px]"
              >
                <span>Enter Sprint Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
