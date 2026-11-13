import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  RefreshCw,
  GitCommit,
  ExternalLink,
  Figma,
  AlertTriangle,
  FileText,
  Clock,
  ShieldAlert,
  UserCheck,
  Sparkles,
  Key,
  Shield,
  Layers,
} from 'lucide-react';
import {
  getStoredLeadKey,
  saveStoredLeadKey,
  getRoomActivity,
  saveTriageDecision,
  assignMemberAlias,
} from '../services/api';
import Navbar from '../components/Navbar';
import InactivityBanner from '../components/InactivityBanner';
import MemberCard from '../components/MemberCard';
import TriageModal from '../components/TriageModal';

export default function RoomDashboard() {
  const { id: roomId } = useParams();
  const location = useLocation();

  const [leadKey, setLeadKey] = useState(() => getStoredLeadKey(roomId));
  const [keyInput, setKeyInput] = useState('');

  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [unattributedCommits, setUnattributedCommits] = useState([]);
  const [totalCommits, setTotalCommits] = useState(0);
  const [dataFreshness, setDataFreshness] = useState(null);
  const [figmaFrameCount, setFigmaFrameCount] = useState(null);
  const [isFigmaAccessible, setIsFigmaAccessible] = useState(true);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [authError, setAuthError] = useState(false);

  // Modals state
  const [selectedTriageMember, setSelectedTriageMember] = useState(null);

  // Sync key if hash changes
  useEffect(() => {
    const k = getStoredLeadKey(roomId);
    if (k) setLeadKey(k);
  }, [location.hash, roomId]);

  // Load Room Activity
  const fetchActivity = useCallback(async (currentKey) => {
    const activeKey = currentKey || leadKey;
    if (!activeKey) {
      setAuthError(true);
      setLoading(false);
      return;
    }

    try {
      setRefreshing(true);
      const data = await getRoomActivity(roomId, activeKey);
      setRoom(data.room);
      setMembers(data.members || []);
      setUnattributedCommits(data.unattributedCommits || []);
      setTotalCommits(data.totalCommits || 0);
      setDataFreshness(data.dataFreshness || null);
      setFigmaFrameCount(data.figmaFrameCount || null);
      setIsFigmaAccessible(data.isFigmaAccessible !== false);
      setError(null);
      setAuthError(false);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        setAuthError(true);
      } else {
        setError(err.message || 'Failed to load telemetry.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [roomId, leadKey]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  // Periodic polling every 60 seconds
  useEffect(() => {
    if (!room || authError) return;
    const interval = setInterval(() => {
      fetchActivity();
    }, 60000);
    return () => clearInterval(interval);
  }, [room, authError, fetchActivity]);

  // Handle saving triage
  const handleSaveTriage = async (memberId, payload) => {
    await saveTriageDecision(roomId, { memberId, ...payload }, leadKey);
    await fetchActivity();
  };

  // Handle assigning alias to unattributed commit
  const handleAssignAlias = async (commitAuthor, targetMemberId) => {
    if (!targetMemberId) return;
    const alias = commitAuthor.email || commitAuthor.name;
    if (!alias) return;

    try {
      await assignMemberAlias(roomId, { memberId: targetMemberId, alias }, leadKey);
      await fetchActivity();
    } catch (err) {
      alert(`Failed to assign alias: ${err.message}`);
    }
  };

  // Handle manually setting lead key
  const handleManualKeySubmit = (e) => {
    e.preventDefault();
    if (!keyInput.trim()) return;
    saveStoredLeadKey(roomId, keyInput.trim());
    setLeadKey(keyInput.trim());
    setAuthError(false);
    fetchActivity(keyInput.trim());
  };

  // -------------------------------------------------------------
  // Auth Error View: Invalid or Missing Lead Key
  // -------------------------------------------------------------
  if (authError) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-md mx-auto w-full px-4 flex items-center justify-center py-10">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
              <Key className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">Lead Access Key Required</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              This lead link is invalid or incomplete. Telemetry and inactivity alerts are private to the team lead. If you created this room, enter your 64-character Lead Key or open your full bookmark URL containing <span className="font-mono text-emerald-400">#k=...</span>
            </p>

            <form onSubmit={handleManualKeySubmit} className="space-y-3 pt-2">
              <input
                type="text"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="Paste your 64-char Lead Key"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 min-h-[44px]"
              />
              <button
                type="submit"
                className="w-full px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition min-h-[44px]"
              >
                Authenticate Lead Key
              </button>
            </form>

            <div className="pt-2 border-t border-slate-800">
              <Link to="/" className="text-xs text-slate-400 hover:text-white transition">
                Create a new room instead
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-3">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-sm text-slate-400">Loading verified hackathon telemetry...</p>
          </div>
        </div>
      </div>
    );
  }

  const inactiveMembers = members.filter((m) => m.needsDecision);
  const hash = typeof window !== 'undefined' ? window.location.hash : '';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar room={room} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Persistent Demo Warning Banner */}
        {room?.is_demo && (
          <div className="mb-6 p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                <strong>DEMO DATA — not from GitHub:</strong> This is a synthetic hallway test room showing one active member, one silent member (7h+), and one Figma-active designer.
              </span>
            </div>
          </div>
        )}

        {/* Upstream Error / Stale Data Amber Banner */}
        {dataFreshness?.stale && (
          <div className="mb-6 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                Showing data from {new Date(dataFreshness.fetchedAt).toLocaleTimeString()}; GitHub fetch temporarily degraded ({dataFreshness.error}).
              </span>
            </div>
            <button
              onClick={() => fetchActivity()}
              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 rounded border border-amber-500/40 text-[11px] font-semibold text-amber-300 min-h-[36px]"
            >
              Retry
            </button>
          </div>
        )}

        {/* Top Header / Metadata Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800/80">
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
              <span>Sprint Room</span>
              <span>/</span>
              <span className="font-mono text-slate-300">{room?.id.substring(0, 8)}...</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center space-x-3">
              <span>{room?.hackathon_name}</span>
            </h1>

            {/* Quick Links */}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
              <a
                href={room?.github_repo_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 text-slate-300 hover:text-emerald-400 font-mono bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 hover:border-slate-700 transition"
              >
                <span>{room?.github_repo_url.replace('https://github.com/', '')}</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>

              {room?.figma_url && (
                <a
                  href={room.figma_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1 text-purple-300 hover:text-purple-200 bg-purple-950/40 px-2.5 py-1 rounded-md border border-purple-800/40 transition"
                >
                  <Figma className="w-3 h-3 text-purple-400" />
                  <span>Figma Specs</span>
                  <ExternalLink className="w-3 h-3 text-purple-400/60" />
                </a>
              )}

              <span className="text-slate-500">|</span>

              <span className="text-slate-400">
                Silence Threshold: <strong className="text-amber-400 font-mono">{room?.inactivity_threshold_hours || 6}h</strong>
              </span>
            </div>
          </div>

          {/* Action Toolbar (Share Room button removed per D3) */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => fetchActivity()}
              disabled={refreshing}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center space-x-1.5 min-h-[44px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Polling...' : 'Refresh Telemetry'}</span>
            </button>

            <Link
              to={`/room/${room?.id}/manifest${hash}`}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition flex items-center space-x-1.5 shadow-sm shadow-emerald-500/20 min-h-[44px]"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Proof-of-Ship Manifest</span>
            </Link>
          </div>
        </div>

        {/* M2: 6-Hour Inactivity Dead-Man Switch Banner */}
        <InactivityBanner
          inactiveMembers={inactiveMembers}
          room={room}
          onOpenTriage={(m) => setSelectedTriageMember(m)}
        />

        {/* Teammates Section */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-white">Teammate Telemetry</h2>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
              {members.length} contributors
            </span>
          </div>

          <div className="text-xs text-slate-400">
            {totalCommits} commits across all branches
          </div>
        </div>

        {/* 4 Member Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {members.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              onOpenTriage={(m) => setSelectedTriageMember(m)}
            />
          ))}
        </div>

        {/* Unattributed Commits Panel (if any exist) */}
        {unattributedCommits.length > 0 && (
          <div className="mt-8 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center space-x-2">
                <GitCommit className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-200">
                  Unattributed Commits ({unattributedCommits.length})
                </h3>
              </div>
              <p className="text-[11px] text-slate-400">
                Assign author emails to teammates so their work counts toward verification.
              </p>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {unattributedCommits.map((c) => (
                <div
                  key={c.fullOid || c.oid}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2 font-mono text-[11px]">
                      <span className="text-emerald-400">{c.oid}</span>
                      <span className="text-slate-400 truncate">{c.message}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Author: <span className="text-slate-300">{c.authorName}</span> &lt;{c.authorEmail}&gt;
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <select
                      defaultValue=""
                      onChange={(e) => handleAssignAlias(c, e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-emerald-500 min-h-[38px]"
                    >
                      <option value="" disabled>Assign to...</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          @{m.github_handle} ({m.role_label || 'Contributor'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* M3: Early Triage Modal */}
      <TriageModal
        isOpen={Boolean(selectedTriageMember)}
        onClose={() => setSelectedTriageMember(null)}
        member={selectedTriageMember}
        onSaveTriage={handleSaveTriage}
      />
    </div>
  );
}
