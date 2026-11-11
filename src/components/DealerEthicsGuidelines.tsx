import { useEffect, useState } from 'react';
import { BookOpen, X } from 'lucide-react';
import { DEFAULT_ETHICS_GUIDELINES_CONTENT } from '../utils/ethicsGuidelinesContent';
import { subscribeToEthicsGuidelines } from '../utils/ethicsGuidelinesManager';

export const DealerEthicsGuidelines: React.FC = () => {
  const [content, setContent] = useState(DEFAULT_ETHICS_GUIDELINES_CONTENT);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => subscribeToEthicsGuidelines(setContent), []);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-500/20"
      >
        <BookOpen className="h-4 w-4" />
        Etik Kurallar
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="dealer-ethics-title"
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
          >
            <header className="flex items-center justify-between gap-4 border-b border-slate-700 p-4 sm:p-5">
              <h2 id="dealer-ethics-title" className="text-base font-bold text-slate-100 sm:text-lg">
                Etik Kurallar &amp; Ticari Davranış İlkeleri
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Etik kurallar penceresini kapat"
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </header>
            <div className="overflow-y-auto p-4 text-sm leading-7 text-slate-200 sm:p-6">
              <div className="whitespace-pre-wrap">{content}</div>
            </div>
            <footer className="border-t border-slate-700 px-4 py-3 text-center text-xs font-semibold text-slate-400 sm:px-6">
              © 2026 AKN Global Group Ltd. Tüm hakları saklıdır.
            </footer>
          </section>
        </div>
      )}
    </>
  );
};
