import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ship, Github, Figma, Clock, Users, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { createSprintRoom } from '../services/supabase';
import { parseGitHubRepo } from '../services/github';
import Navbar from '../components/Navbar';

export default function CreateRoom() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [hackathonName, setHackathonName] = useState('');
  const [deadline, setDeadline] = useState(() => {
    // Default deadline 24 hours from now
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  });
  const [githubRepoUrl, setGithubRepoUrl] = useState('');
  const [figmaUrl, setFigmaUrl] = useState('');
  const [inactivityThresholdHours, setInactivityThresholdHours] = useState(6);

  // 4 teammates
  const [teammates, setTeammates] = useState([
    { handle: '', role: 'Lead / Frontend' },
    { handle: '', role: 'Backend API' },
    { handle: '', role: 'ML / Integrations' },
    { handle: '', role: 'Design / UI' },
  ]);

  const handleTeammateChange = (index, field, value) => {
    const updated = [...teammates];
    updated[index][field] = value;
    setTeammates(updated);
  };

  const handleLoadDemo = () => {
    setHackathonName('AI Hackathon Fall 2026');
    setGithubRepoUrl('https://github.com/facebook/react');
    setFigmaUrl('https://www.figma.com/design/WMh3VfmntoPtzRnOLuF1Qi/ShipMate-Wireframe?node-id=0-1');
    setInactivityThresholdHours(6);
    setTeammates([
      { handle: 'gaearon', role: 'State Architecture' },
      { handle: 'sophiebits', role: 'Core Engine' },
      { handle: 'acdlite', role: 'Fiber Reconciler' },
      { handle: 'zpao', role: 'Release Engineering' },
    ]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!hackathonName.trim()) {
      setError('Please provide a hackathon name.');
      return;
    }
    if (!githubRepoUrl.trim()) {
      setError('Please enter a public GitHub repository URL.');
      return;
    }
    const parsed = parseGitHubRepo(githubRepoUrl);
    if (!parsed) {
      setError('Invalid GitHub repository URL. Use format: https://github.com/owner/repo or owner/repo');
      return;
    }

    const validTeammates = teammates.filter((t) => Boolean(t.handle.trim()));
    if (validTeammates.length === 0) {
      setError('Please provide at least 1 teammate GitHub handle.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { room } = await createSprintRoom({
        hackathonName,
        deadline,
        githubRepoUrl,
        figmaUrl,
        inactivityThresholdHours: Number(inactivityThresholdHours),
        teammates: validTeammates,
      });

      navigate(`/room/${room.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create sprint room.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
        {/* Hero Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
            <Ship className="w-3.5 h-3.5" />
            <span>Zero-Friction Hackathon Telemetry</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Create Your Hackathon <span className="text-emerald-400">Sprint Room</span>
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            Track verified GitHub commits and design progress passively. Receive automated 6-hour inactivity alerts and cut deadweight features early without manual task-nagging.
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={handleLoadDemo}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 text-xs font-medium border border-slate-700/60 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Fill With Demo Data</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Room Setup Form */}
        <form onSubmit={handleSubmit} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                placeholder="e.g. TreeHacks 2026 / HackMIT"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Submission Deadline */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-2">
                Submission Deadline <span className="text-rose-400">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition font-mono"
              />
              <p className="mt-1.5 text-[11px] text-slate-400">Must be a public repository so commits can be polled via REST API.</p>
            </div>

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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition font-mono"
              />
              <p className="mt-1.5 text-[11px] text-slate-400">Included and verified in your final Proof-of-Ship Manifest.</p>
            </div>
          </div>

          {/* Inactivity Threshold */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Inactivity Dead-Man Threshold</span>
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
              className="w-full accent-amber-500 bg-slate-800 cursor-pointer h-2 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>1h (aggressive)</span>
              <span>6h (recommended standard)</span>
              <span>12h</span>
              <span>24h</span>
            </div>
          </div>

          {/* Teammates (4 Members) */}
          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Teammate GitHub Handles (Up to 4 Contributors)</span>
              </h2>
              <span className="text-[11px] text-slate-400">Matched passively against commit authors</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {teammates.map((teammate, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-slate-300">Teammate {idx + 1}</span>
                    <span className="text-[10px] text-slate-500">Handle (no @)</span>
                  </div>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-2.5 text-xs text-slate-500">@</span>
                      <input
                        type="text"
                        value={teammate.handle}
                        onChange={(e) => handleTeammateChange(idx, 'handle', e.target.value)}
                        placeholder="github_username"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-7 pr-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                    <input
                      type="text"
                      value={teammate.role}
                      onChange={(e) => handleTeammateChange(idx, 'role', e.target.value)}
                      placeholder="Role / Feature"
                      className="w-1/2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 flex items-center justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20"
            >
              <span>{isSubmitting ? 'Initializing Room...' : 'Launch Sprint Monitor'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
