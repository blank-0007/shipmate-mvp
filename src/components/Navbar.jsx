import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Ship, Clock, ExternalLink, FileText, LayoutDashboard, Key, Database } from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabase';

export default function Navbar({ room, onOpenTokenModal }) {
  const location = useLocation();
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!room?.deadline) return;

    const updateTimer = () => {
      const now = Date.now();
      const end = new Date(room.deadline).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('Deadline Passed');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s left`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [room?.deadline]);

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to="/" className="flex items-center space-x-2 text-emerald-400 font-bold text-xl hover:text-emerald-300 transition">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Ship className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="tracking-tight text-white">Ship<span className="text-emerald-400">Mate</span></span>
          </Link>

          {room && (
            <div className="hidden md:flex items-center space-x-2 pl-4 border-l border-slate-800">
              <span className="text-sm font-semibold text-slate-200">{room.hackathon_name}</span>
            </div>
          )}
        </div>

        {room && (
          <div className="flex items-center space-x-4">
            {/* Deadline Timer */}
            <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-full text-xs font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="text-slate-200">{timeLeft}</span>
            </div>

            {/* Nav Tabs */}
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <Link
                to={`/room/${room.id}`}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-medium transition ${
                  location.pathname === `/room/${room.id}`
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Monitor</span>
              </Link>
              <Link
                to={`/room/${room.id}/manifest`}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-medium transition ${
                  location.pathname.includes('/manifest')
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Manifest</span>
              </Link>
            </div>

            {/* Settings / Token button */}
            <button
              onClick={onOpenTokenModal}
              title="GitHub Token & Storage Settings"
              className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 rounded-lg border border-slate-700/60 transition text-xs flex items-center space-x-1.5"
            >
              <Key className="w-4 h-4" />
              <span className="hidden lg:inline text-xs">Settings</span>
            </button>
          </div>
        )}

        {!room && (
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span className="flex items-center space-x-1">
              <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span>{isSupabaseConfigured ? 'Supabase Connected' : 'Local Storage Mode'}</span>
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
