import React, { useState } from 'react';
import { AIAdvice, TaxReportSummary } from '../../types/accounting';
import {
  Sparkles,
  Send,
  HelpCircle,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';
import avatarCpa from '../../assets/images/avatar_mali_musavir_1792512085316.jpg';

interface AIAdvisorViewProps {
  advices: AIAdvice[];
  summary: TaxReportSummary;
}

export const AIAdvisorView: React.FC<AIAdvisorViewProps> = ({ advices, summary }) => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatLog, setChatLog] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: `Merhaba! Ben şirketinizin Vergi ve Mali Mevzuat Danışmanıyım. Sistemimizdeki tüm TRY ve USD ($3x$) satışlarınızı, TCMB kurlarını, KDV beyannamenizi ve MLM bayi stopajlarınızı anlık olarak izliyorum.\n\nŞu anda yurt dışı hizmet ihracatınız nedeniyle **KDV İadesi hakkı** ve ay sonu **Muhtasar Stopaj ödemesi** ön plandadır. Bana vergi mevzuatı, KDV istisnası, gider pusulası veya beyanname optimizasyonu hakkında dilediğinizi sorabilirsiniz.`,
      time: '08:30',
    },
  ]);

  const quickQuestions = [
    'Yurt dışı hizmet ihracatı KDV iadesi başvuru süreci ve gerekli evraklar nelerdir?',
    'Bireysel bayilere ödenen komisyonlarda Gider Pusulası ve %20 Stopaj zorunluluğu nedir?',
    'KVK md. 10/1-ğ uyarınca %80 Kurumlar Vergisi kazanç indiriminden nasıl yararlanırız?',
    'Şirketimizin ay sonu KDV ve Muhtasar nakit akışı likidite analizini yap.',
  ];

  const handleSendQuestion = async (customText?: string) => {
    const textToSend = customText || question;
    if (!textToSend.trim() || isLoading) return;

    const userMsg = {
      sender: 'user' as const,
      text: textToSend,
      time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    };

    setChatLog((prev) => [...prev, userMsg]);
    if (!customText) setQuestion('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: textToSend,
          financialSnapshot: {
            domesticSalesTRY: summary.totalDomesticSalesTRY.toFixed(2),
            exportSalesUSD: summary.totalExportSalesUSD.toFixed(2),
            exportSalesTRY: summary.totalExportSalesTRY.toFixed(2),
            vatCalculated: summary.vatCalculated391.toFixed(2),
            withholdingTax: summary.totalWithholdingTax360.toFixed(2),
            netCommissions: summary.totalNetCommissionsPaidTRY.toFixed(2),
            tcmbUsdRate: summary.tcmbUsdRate.toFixed(4),
          },
        }),
      });

      const data = await response.json();
      const aiReply = data.advice || 'Mali analiz tamamlandı.';

      setChatLog((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: aiReply,
          time: new Date().toTimeString().split(' ')[0].substring(0, 5),
        },
      ]);
    } catch (err) {
      console.error(err);
      setChatLog((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Mali mevzuat analizi gerçekleştirilirken bir hata oluştu. Lütfen tekrar deneyiniz.',
          time: new Date().toTimeString().split(' ')[0].substring(0, 5),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Yapay Zeka Destekli Mali Müşavir &amp; Tavsiye Robotu</span>
          </h2>
          <p className="text-xs text-slate-500">
            Gemini 3.8 Flash modeli ve Türk Vergi Mevzuatı uzmanlığı ile anlık mali tavsiye ve risk denetimi
          </p>
        </div>
      </div>

      {/* Proaktif Sistem Tavsiye Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {advices.map((adv) => {
          const isOpp = adv.priority === 'OPPORTUNITY';
          const isWarn = adv.priority === 'WARNING';
          return (
            <div
              key={adv.id}
              className={`p-5 rounded-xl border shadow-xs space-y-3 flex flex-col justify-between ${
                isOpp
                  ? 'bg-emerald-50/40 border-emerald-200'
                  : isWarn
                  ? 'bg-amber-50/40 border-amber-200'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                  <span
                    className={`px-2 py-0.5 rounded ${
                      isOpp
                        ? 'text-emerald-800 bg-emerald-100/70'
                        : isWarn
                        ? 'text-amber-800 bg-amber-100/70'
                        : 'text-slate-700 bg-slate-100'
                    }`}
                  >
                    {adv.category}
                  </span>
                  {adv.statutoryDeadline && (
                    <span className="text-slate-400 font-mono">Vade: {adv.statutoryDeadline}</span>
                  )}
                </div>

                <h3 className="text-xs font-bold text-slate-900 tracking-tight leading-snug">
                  {adv.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">{adv.summary}</p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-700 font-medium">
                <span className="text-slate-400 block text-[10px]">Tavsiye Edilen Eylem:</span>
                <span className="text-slate-900 leading-snug">{adv.actionRecommendation}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* İnteraktif Soru-Cevap & Danışman Konsolu */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs flex flex-col h-[520px]">
        {/* Danışman Başlık Alanı */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={avatarCpa}
              alt="Yeminli Mali Müşavir"
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-900">
                  Ayşe Kaya, SMMM &amp; YMM Vergi Danışmanı
                </h3>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  Çevrimiçi
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                GİB Mevzuatı, e-Belge Standartları ve Kurumsal Vergi Yönetimi
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Model: Gemini 3.8 Flash</span>
        </div>

        {/* Mesaj Akışı */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30 text-xs">
          {chatLog.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                  AI
                </div>
              )}
              <div
                className={`max-w-2xl rounded-xl p-4 shadow-2xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-slate-900 text-white font-medium'
                    : 'bg-white border border-slate-200 text-slate-800'
                }`}
              >
                <div className="whitespace-pre-line text-xs font-sans space-y-1">
                  {msg.text}
                </div>
                <span
                  className={`block text-[10px] text-right mt-1.5 font-mono ${
                    msg.sender === 'user' ? 'text-slate-400' : 'text-slate-400'
                  }`}
                >
                  {msg.time}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-700" />
              <span>Mevzuat ve bilanço taranıyor...</span>
            </div>
          )}
        </div>

        {/* Hızlı Soru Hapları */}
        <div className="px-4 py-2 border-t border-slate-100 bg-white flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-semibold text-slate-400 shrink-0">Örnek Sorular:</span>
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendQuestion(q)}
              className="text-[11px] text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md whitespace-nowrap transition-colors"
            >
              {q.substring(0, 42)}...
            </button>
          ))}
        </div>

        {/* Soru Giriş Formu */}
        <div className="p-3.5 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuestion();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Vergi mevzuatı, KDV iadesi veya bayi stopajı ile ilgili danışmak istediğiniz konuyu yazın..."
              className="flex-1 px-3.5 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
            />
            <button
              type="submit"
              disabled={isLoading || !question.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Sor</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
