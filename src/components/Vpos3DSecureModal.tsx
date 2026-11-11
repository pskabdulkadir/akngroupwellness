import React, { useEffect, useState } from 'react';
import { ShieldCheck, X, AlertTriangle } from 'lucide-react';
import {
  SANDBOX_SMS_CODE,
  VPOS_3DS_REQUEST_EVENT,
  Vpos3dsRequestDetail,
} from '../utils/paymentProcessor';
import { formatUsd } from '../utils/currency';

export const Vpos3DSecureModal: React.FC = () => {
  const [request, setRequest] = useState<Vpos3dsRequestDetail | null>(null);
  const [smsCode, setSmsCode] = useState<string>('');

  useEffect(() => {
    const handleRequest = (event: Event) => {
      const detail = (event as CustomEvent<Vpos3dsRequestDetail>).detail;
      setSmsCode('');
      setRequest(detail);
    };
    window.addEventListener(VPOS_3DS_REQUEST_EVENT, handleRequest);
    return () => window.removeEventListener(VPOS_3DS_REQUEST_EVENT, handleRequest);
  }, []);

  if (!request) return null;

  const close = (value: string | null) => {
    request.resolve(value);
    setRequest(null);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          close(smsCode.trim());
        }}
        className="w-full max-w-sm p-6 rounded-3xl bg-slate-950 border border-emerald-500/40 shadow-2xl space-y-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>3D Secure Doğrulama</span>
          </div>
          <button
            type="button"
            onClick={() => close(null)}
            className="text-slate-400 hover:text-slate-200 cursor-pointer"
            aria-label="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs text-slate-300 space-y-1">
          <div>
            Kart: <span className="font-mono text-slate-100">{request.maskedCard}</span>
          </div>
          <div>
            Tutar: <span className="font-mono text-emerald-400">{formatUsd(request.amount)}</span>
          </div>
          <div>
            İşlem No: <span className="font-mono text-slate-400">{request.merchantOid}</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Bu ekran gerçek banka doğrulaması değil, Sandbox 3D Secure simülasyonudur. Test SMS kodu:{' '}
          <span className="font-mono text-emerald-300">{SANDBOX_SMS_CODE}</span>
        </p>

        {request.errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{request.errorMessage}</span>
          </div>
        )}

        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          autoFocus
          value={smsCode}
          onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ''))}
          placeholder="SMS KODU"
          className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-center text-lg tracking-[0.4em] text-white font-mono"
        />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => close(null)}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold cursor-pointer"
          >
            Vazgeç
          </button>
          <button
            type="submit"
            disabled={smsCode.length < 6}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold disabled:opacity-40 cursor-pointer"
          >
            Onayla
          </button>
        </div>
      </form>
    </div>
  );
};
