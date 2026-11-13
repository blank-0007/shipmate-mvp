import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Ship, Clock, FileText, LayoutDashboard, AlertCircle, Shield } from 'lucide-react';

export default function Navbar({ room }) {
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

  // Preserve hash with #k=<lead_key> across navigation
  const hash = typeof window !== 'undefined' ? window.location.hash : '';

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-0 sm:h-16 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center justify-between sm:justify-start space-x-3">
          <Link to="/" className="flex items-center space-x-2 text-emerald-400 font-bold text-lg sm:text-xl hover:text-emerald-300 transition">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
              <Ship className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="tracking-tight text-white">Ship<span className="text-emerald-400">Mate</span></span>
          </Link>

          {room && (
            <div className="flex items-center space-x-2 pl-3 border-l border-slate-800 truncate">
              <span className="text-xs sm:text-sm font-semibold text-slate-200 truncate max-w-[150px] sm:max-w-[220px]">
                {room.hackathon_name}
              </span>
              {room.is_demo && (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-bold flex-shrink-0">
                  Demo
                </span>
              )}
            </div>
          )}
        </div>

        {room && (
          <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-4">
            {/* Deadline Timer */}
            <div className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1 rounded-full text-xs font-mono border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 animate-pulse" />
              <span className="text-slate-200 text-[11px] sm:text-xs truncate">{timeLeft}</span>
            </div>

            {/* Nav Links */}
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <Link
                to={`/room/${room.id}${hash}`}
                className={`flex items-center space-x-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md font-medium transition min-h-[36px] ${
                  !location.pathname.includes('/manifest')
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Monitor</span>
              </Link>
              <Link
                to={`/room/${room.id}/manifest${hash}`}
                className={`flex items-center space-x-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md font-medium transition min-h-[36px] ${
                  location.pathname.includes('/manifest')
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Manifest</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
