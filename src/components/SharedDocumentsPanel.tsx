import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Download, FileText, Loader2, RefreshCw, UploadCloud } from 'lucide-react';
import {
  downloadSharedDocument,
  listSharedDocuments,
  MAX_SHARED_DOCUMENT_SIZE_BYTES,
  SharedDocumentAccess,
  SharedDocumentSummary,
  uploadSharedDocument,
} from '../utils/sharedDocuments';

interface SharedDocumentsPanelProps {
  access: SharedDocumentAccess;
}

const ACCEPTED_DOCUMENT_TYPES = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp';

const formatFileSize = (size: number) =>
  size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / 1024 / 1024).toFixed(1)} MB`;

export const SharedDocumentsPanel: React.FC<SharedDocumentsPanelProps> = ({ access }) => {
  const [documents, setDocuments] = useState<SharedDocumentSummary[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshDocuments = useCallback(async () => {
    setLoading(true);
    try {
      setDocuments(await listSharedDocuments(access));
      setFeedback(null);
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : 'Dokümanlar yüklenemedi.',
      });
    } finally {
      setLoading(false);
    }
  }, [access]);

  useEffect(() => {
    void refreshDocuments();
  }, [refreshDocuments]);

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile) return;
    setUploading(true);
    setFeedback(null);
    try {
      await uploadSharedDocument(selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await refreshDocuments();
      setFeedback({ type: 'success', text: 'Doküman yüklendi ve bayi panelinde paylaşılmaya hazır.' });
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : 'Doküman yüklenemedi.',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (document: SharedDocumentSummary) => {
    setDownloadingId(document.id);
    setFeedback(null);
    try {
      const blob = await downloadSharedDocument(document.id, access);
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement('a');
      anchor.href = url;
      anchor.download = document.name;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : 'Doküman indirilemedi.',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const isAdmin = access === 'admin';

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <FileText className="h-5 w-5 text-emerald-600" />
            {isAdmin ? 'Yönetici Doküman Yükleme' : 'Yönetici Dokümanları'}
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            {isAdmin
              ? 'Yüklediğiniz dokümanlar tüm bayiler tarafından görüntülenebilir ve indirilebilir.'
              : 'Yönetici tarafından paylaşılan dokümanları görüntüleyip indirebilirsiniz.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refreshDocuments()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {isAdmin && (
        <form onSubmit={handleUpload} className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
          <label htmlFor="shared-document-file" className="block text-xs font-bold text-slate-800">
            Yeni doküman seçin (en fazla 6 MB)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              ref={fileInputRef}
              id="shared-document-file"
              type="file"
              accept={ACCEPTED_DOCUMENT_TYPES}
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white p-2 text-xs file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:font-semibold"
            />
            <button
              type="submit"
              disabled={!selectedFile || uploading || (selectedFile?.size ?? 0) > MAX_SHARED_DOCUMENT_SIZE_BYTES}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              {uploading ? 'Yükleniyor...' : 'Dokümanı Yükle'}
            </button>
          </div>
          <p className="text-[11px] text-slate-600">PDF, Word, Excel, PowerPoint ve PNG/JPG/WebP dosyaları desteklenir.</p>
        </form>
      )}

      {feedback && (
        <div
          role="status"
          className={`rounded-lg border px-3 py-2 text-xs ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-rose-200 bg-rose-50 text-rose-900'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-xs text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Dokümanlar yükleniyor...
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center text-xs text-slate-500">
          Henüz paylaşılan doküman yok.
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {documents.map((document) => (
            <div key={document.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <FileText className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-900">{document.name}</div>
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    {formatFileSize(document.size)} · {new Date(document.uploadedAt).toLocaleDateString('tr-TR')}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void handleDownload(document)}
                disabled={downloadingId === document.id}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-800 hover:bg-indigo-100 disabled:opacity-50"
              >
                {downloadingId === document.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                İndir
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
