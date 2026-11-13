import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  RefreshCw,
  GitCommit,
  ExternalLink,
  Figma,
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle2,
  Share2,
  Copy,
  Check
} from 'lucide-react';
import { getRoomWithMembers, updateMemberTriage } from '../services/supabase';
import { parseGitHubRepo, fetchRepoCommits, mapCommitsToMembers } from '../services/github';
import Navbar from '../components/Navbar';
import InactivityBanner from '../components/InactivityBanner';
import MemberCard from '../components/MemberCard';
import TriageModal from '../components/TriageModal';
import TokenModal from '../components/TokenModal';

export default function RoomDashboard() {
  const { id: roomId } = useParams();

  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [processedMembers, setProcessedMembers] = useState([]);
  const [commits, setCommits] = useState([]);
  const [rateLimit, setRateLimit] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Modals state
  const [selectedTriageMember, setSelectedTriageMember] = useState(null);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Load Room & Members from Supabase
  const loadRoomData = useCallback(async () => {
    try {
      const data = await getRoomWithMembers(roomId);
      setRoom(data.room);
      setMembers(data.members);
      return data;
    } catch (err) {
      setError(`Failed to load sprint room: ${err.message}`);
      return null;
    }
  }, [roomId]);

  // Fetch Commits from GitHub API
  const refreshCommits = useCallback(async (currentRoom, currentMembers) => {
    const activeRoom = currentRoom || room;
    const activeMembers = currentMembers || members;

    if (!activeRoom || !activeRoom.github_repo_url) return;

    const parsed = parseGitHubRepo(activeRoom.github_repo_url);
    if (!parsed) {
      setError('Unable to parse GitHub repo URL from room configuration.');
      return;
    }

    setRefreshing(true);
    try {
      const { commits: fetchedCommits, rateLimitInfo } = await fetchRepoCommits(parsed.owner, parsed.repo);
      setCommits(fetchedCommits);
      setRateLimit(rateLimitInfo);

      // Map commits to members
      const processed = mapCommitsToMembers(
        activeMembers,
        fetchedCommits,
        activeRoom.created_at,
        activeRoom.inactivity_threshold_hours || 6
      );
      setProcessedMembers(processed);
      setError(null);
    } catch (err) {
      setError(err.message);
      // Still display members with existing or 0 commits
      const processed = mapCommitsToMembers(
        activeMembers,
        [],
        activeRoom.created_at,
        activeRoom.inactivity_threshold_hours || 6
      );
      setProcessedMembers(processed);
    } finally {
      setRefreshing(false);
    }
  }, [room, members]);

  // Initial load
  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      const data = await loadRoomData();
      if (data && isMounted) {
        await refreshCommits(data.room, data.members);
      }
      if (isMounted) setLoading(false);
    })();

    return () => {
      isMounted = false;
    };
  }, [roomId]);

  // Periodic polling every 90 seconds
  useEffect(() => {
    if (!room) return;
    const interval = setInterval(() => {
      refreshCommits();
    }, 90000);
    return () => clearInterval(interval);
  }, [room, refreshCommits]);

  // Handle saving triage decision
  const handleSaveTriage = async (memberId, updates) => {
    const updated = await updateMemberTriage(memberId, updates);
    // Update local state
    const newMembers = members.map((m) => (m.id === memberId ? updated : m));
    setMembers(newMembers);

    // Re-process members
    const processed = mapCommitsToMembers(
      newMembers,
      commits,
      room.created_at,
      room.inactivity_threshold_hours || 6
    );
    setProcessedMembers(processed);
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-3">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-sm text-slate-400">Loading sprint room and polling GitHub telemetry...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-lg mx-auto w-full px-4 flex items-center justify-center">
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center space-y-4">
            <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
            <h2 className="text-lg font-bold text-white">Sprint Room Error</h2>
            <p className="text-xs text-rose-300">{error}</p>
            <Link
              to="/"
              className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg"
            >
              Back to Room Creation
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const inactiveMembers = processedMembers.filter((m) => m.isInactive);
  const totalVerifiedCommits = commits.length;
  const parsedRepo = parseGitHubRepo(room?.github_repo_url);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar room={room} onOpenTokenModal={() => setIsTokenModalOpen(true)} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Header / Metadata Banner */}
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
                <span>{parsedRepo ? `${parsedRepo.owner}/${parsedRepo.repo}` : room?.github_repo_url}</span>
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

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => refreshCommits()}
              disabled={refreshing}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/80 transition flex items-center space-x-1.5"
              title="Poll GitHub REST API for new commits"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Polling...' : 'Poll Commits'}</span>
            </button>

            <button
              onClick={handleCopyShareLink}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/80 transition flex items-center space-x-1.5"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedLink ? 'Copied Link!' : 'Share Room'}</span>
            </button>

            <Link
              to={`/room/${room?.id}/manifest`}
              className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition flex items-center space-x-1.5 shadow-sm shadow-emerald-500/20"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Proof-of-Ship Manifest</span>
            </Link>
          </div>
        </div>

        {/* GitHub Rate Limit Info or Warning */}
        {rateLimit && rateLimit.remaining !== null && (
          <div className="mb-4 flex items-center justify-between text-[11px] text-slate-400 px-3 py-1.5 bg-slate-900/60 rounded-lg border border-slate-800">
            <span>
              GitHub API Remaining:{' '}
              <strong className={rateLimit.remaining < 10 ? 'text-rose-400 font-mono' : 'text-emerald-400 font-mono'}>
                {rateLimit.remaining}/{rateLimit.limit}
              </strong>
            </span>
            {rateLimit.remaining < 15 && (
              <button
                onClick={() => setIsTokenModalOpen(true)}
                className="text-amber-400 hover:underline flex items-center space-x-1"
              >
                <span>Rate limit low — Add Personal Token</span>
              </button>
            )}
          </div>
        )}

        {/* Global Error Banner if API failed */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setIsTokenModalOpen(true)}
              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 rounded border border-amber-500/40 text-[11px] font-semibold text-amber-300"
            >
              Configure Token
            </button>
          </div>
        )}

        {/* M2: 6-Hour Inactivity Dead-Man Switch Banner */}
        <InactivityBanner
          inactiveMembers={inactiveMembers}
          room={room}
          onOpenTriage={(member) => setSelectedTriageMember(member)}
        />

        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-white">Teammate Telemetry</h2>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
              {processedMembers.length} contributors
            </span>
          </div>

          <div className="text-xs text-slate-400">
            Passive verification • <span className="text-emerald-400 font-semibold">{totalVerifiedCommits}</span> commits ingested
          </div>
        </div>

        {/* M1: 4 Member Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {processedMembers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              onOpenTriage={(m) => setSelectedTriageMember(m)}
            />
          ))}
        </div>
      </main>

      {/* M3: Early Triage Modal */}
      <TriageModal
        isOpen={Boolean(selectedTriageMember)}
        onClose={() => setSelectedTriageMember(null)}
        member={selectedTriageMember}
        onSaveTriage={handleSaveTriage}
      />

      {/* Token & Settings Modal */}
      <TokenModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        onTokenUpdated={() => refreshCommits()}
      />
    </div>
  );
}
