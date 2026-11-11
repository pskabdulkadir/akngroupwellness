import { useEffect, useState } from 'react';
import { DEFAULT_ETHICS_GUIDELINES_CONTENT } from '../utils/ethicsGuidelinesContent';
import { saveEthicsGuidelinesContent } from '../utils/ethicsGuidelinesManager';

interface EthicsGuidelinesAdminTabProps {
  onSuccessMessage: (message: string) => void;
}

export const EthicsGuidelinesAdminTab: React.FC<EthicsGuidelinesAdminTabProps> = ({
  onSuccessMessage,
}) => {
  const [content, setContent] = useState(DEFAULT_ETHICS_GUIDELINES_CONTENT);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/v1/ethics-guidelines')
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Etik kurallar yüklenemedi.');
        return data as { content?: unknown };
      })
      .then((data) => {
        if (!cancelled && typeof data.content === 'string') setContent(data.content);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Etik kurallar yüklenemedi.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await saveEthicsGuidelinesContent(content);
      onSuccessMessage('Etik kurallar kaydedildi ve bayi panellerine yayınlandı.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Etik kurallar kaydedilemedi.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="mx-auto max-w-5xl space-y-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-7">
      <div>
        <h3 className="text-base font-bold text-slate-100">Etik Kurallar &amp; Ticari Davranış İlkeleri</h3>
        <p className="mt-1 text-xs text-slate-400">
          Bu metin bayi panellerine anlık olarak yayınlanır. © 2026 AKN Global Group Ltd. Tüm hakları saklıdır.
        </p>
      </div>
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        disabled={isLoading || isSaving}
        rows={24}
        className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm leading-6 text-slate-100 outline-none focus:border-emerald-500 disabled:opacity-60"
      />
      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
      <button
        type="submit"
        disabled={isLoading || isSaving || !content.trim()}
        className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? 'Yükleniyor...' : isSaving ? 'Kaydediliyor...' : 'Kuralları Güncelle / Kaydet'}
      </button>
    </form>
  );
};
