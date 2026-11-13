import React, { useState, useEffect } from 'react';
import { X, Wrench, Scissors, BellOff, ShieldAlert, CheckCircle, RotateCcw } from 'lucide-react';

export default function TriageModal({ isOpen, onClose, member, onSaveTriage }) {
  // Hooks MUST be declared at top before any early returns (fixing D12)
  const [selectedAction, setSelectedAction] = useState('fallback_api');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (member) {
      setSelectedAction(
        member.triage_status && member.triage_status !== 'none'
          ? member.triage_status
          : 'fallback_api'
      );
      setNote(member.triage_note || '');
    }
  }, [member, isOpen]);

  if (!isOpen || !member) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let snoozedUntil = null;
      if (selectedAction === 'snoozed') {
        snoozedUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      }

      await onSaveTriage(member.id, {
        action: selectedAction,
        note: note.trim() || null,
        snoozedUntil,
      });
      onClose();
    } catch (err) {
      alert(`Failed to record triage decision: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsSaving(true);
    try {
      await onSaveTriage(member.id, {
        action: 'none',
        note: null,
        snoozedUntil: null,
      });
      onClose();
    } catch (err) {
      alert(`Failed to reset triage status: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in no-print">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Private Early Triage Advisor</h3>
              <p className="text-xs text-slate-400">Contributor: @{member.github_handle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-2 rounded-lg hover:bg-slate-800 transition min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close triage modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800">
            <p className="font-medium text-slate-200">
              Silence Telemetry: <span className="font-mono text-amber-400">{member.silenceFormatted} elapsed</span> without qualifying activity.
            </p>
            <p className="text-slate-400 mt-1">
              Select an action to cut deadweight features early and submit on time without all-nighters.
            </p>
          </div>

          {/* 3 Explicit Triage Options */}
          <div className="space-y-3">
            {/* Option A */}
            <label
              className={`flex items-start p-3.5 rounded-xl border cursor-pointer transition min-h-[48px] ${
                selectedAction === 'fallback_api'
                  ? 'bg-blue-500/10 border-blue-500 text-slate-100 ring-1 ring-blue-500/40'
                  : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <input
                type="radio"
                name="triageAction"
                value="fallback_api"
                checked={selectedAction === 'fallback_api'}
                onChange={() => setSelectedAction('fallback_api')}
                className="mt-1 mr-3 text-blue-500 focus:ring-0"
              />
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Wrench className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-sm text-slate-100">[A] Switch to Fallback API</span>
                </div>
                <p className="text-xs text-slate-400">
                  Switch the stalled component or integration to a mock/static JSON fallback so the UI can be shipped without waiting.
                </p>
              </div>
            </label>

            {/* Option B */}
            <label
              className={`flex items-start p-3.5 rounded-xl border cursor-pointer transition min-h-[48px] ${
                selectedAction === 'cut_scope'
                  ? 'bg-rose-500/10 border-rose-500 text-slate-100 ring-1 ring-rose-500/40'
                  : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <input
                type="radio"
                name="triageAction"
                value="cut_scope"
                checked={selectedAction === 'cut_scope'}
                onChange={() => setSelectedAction('cut_scope')}
                className="mt-1 mr-3 text-rose-500 focus:ring-0"
              />
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Scissors className="w-4 h-4 text-rose-400" />
                  <span className="font-bold text-sm text-slate-100">[B] Cut Feature Scope</span>
                </div>
                <p className="text-xs text-slate-400">
                  Officially shelve this feature. Disables further inactivity sirens while preserving real telemetry in the submission manifest.
                </p>
              </div>
            </label>

            {/* Option C */}
            <label
              className={`flex items-start p-3.5 rounded-xl border cursor-pointer transition min-h-[48px] ${
                selectedAction === 'snoozed'
                  ? 'bg-indigo-500/10 border-indigo-500 text-slate-100 ring-1 ring-indigo-500/40'
                  : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <input
                type="radio"
                name="triageAction"
                value="snoozed"
                checked={selectedAction === 'snoozed'}
                onChange={() => setSelectedAction('snoozed')}
                className="mt-1 mr-3 text-indigo-500 focus:ring-0"
              />
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <BellOff className="w-4 h-4 text-indigo-400" />
                  <span className="font-bold text-sm text-slate-100">[C] Snooze 1 Hour</span>
                </div>
                <p className="text-xs text-slate-400">
                  Teammate is working locally or sleeping. Suppresses warning banner for exactly 60 minutes.
                </p>
              </div>
            </label>
          </div>

          {/* Reason / Context Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Reason / Context Note (Persisted to Audit Log)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Auth service down, using mocked tokens"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 min-h-[44px]"
            />
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            {member.triage_status && member.triage_status !== 'none' ? (
              <button
                type="button"
                onClick={handleReset}
                disabled={isSaving}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1 min-h-[44px] px-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Normal</span>
              </button>
            ) : <div />}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition flex items-center space-x-1.5 shadow-sm min-h-[44px]"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isSaving ? 'Persisting...' : 'Persist Decision'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
