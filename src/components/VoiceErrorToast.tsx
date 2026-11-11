import React, { useEffect, useState } from 'react';
import { voiceAssistant, VoiceErrorCode, getVoiceErrorMessage } from '../utils/voiceAssistant';
import { getLanguage } from '../utils/i18n';

const AUTO_HIDE_MS = 6000;

export function VoiceErrorToast() {
  const [code, setCode] = useState<VoiceErrorCode | null>(null);

  useEffect(() => voiceAssistant.subscribeError(setCode), []);

  useEffect(() => {
    if (!code) return;
    const timer = setTimeout(() => setCode(null), AUTO_HIDE_MS);
    return () => clearTimeout(timer);
  }, [code]);

  if (!code) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-[60] max-w-[calc(100vw-2rem)] flex items-start gap-3 px-4 py-3 rounded-2xl bg-slate-900 border border-amber-500/60 text-amber-100 shadow-2xl text-sm"
    >
      <span className="flex-1">{getVoiceErrorMessage(code, getLanguage())}</span>
      <button
        type="button"
        onClick={() => setCode(null)}
        aria-label="Kapat"
        className="min-h-12 min-w-12 -my-2 -mr-2 px-3 rounded-xl hover:bg-white/10"
      >
        ×
      </button>
    </div>
  );
}
