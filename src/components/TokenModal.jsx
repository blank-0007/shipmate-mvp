import React, { useState } from 'react';
import { X, Key, Database, Check, ShieldCheck, AlertCircle } from 'lucide-react';
import { getGitHubToken, setGitHubToken } from '../services/github';
import { isSupabaseConfigured } from '../services/supabase';

export default function TokenModal({ isOpen, onClose, onTokenUpdated }) {
  if (!isOpen) return null;

  const [token, setToken] = useState(getGitHubToken());
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setGitHubToken(token);
    setSaved(true);
    if (onTokenUpdated) onTokenUpdated();
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in no-print">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-slate-100">API & Storage Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Supabase Status */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300 flex items-center space-x-1.5">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Supabase Database</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  isSupabaseConfigured
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {isSupabaseConfigured ? 'Active (Live Cloud)' : 'Local Storage Mode'}
              </span>
            </div>
            <p className="text-slate-400 text-[11px] pt-1">
              {isSupabaseConfigured
                ? 'Connected to live cloud project via VITE_SUPABASE_URL.'
                : 'Running in zero-config local storage mode. To sync with cloud, add VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY.'}
            </p>
          </div>

          {/* GitHub Token */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-200">
              Optional GitHub Personal Access Token
            </label>
            <p className="text-[11px] text-slate-400">
              Unauthenticated GitHub API calls are limited to 60 requests/hr. Add any public read token (classic or fine-grained) to increase your limit to 5,000 requests/hr. Stored safely in your browser only.
            </p>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            >
              Close
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition flex items-center space-x-1.5"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Token</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
