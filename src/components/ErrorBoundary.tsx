import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Sparkles, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
  errorStack?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
      errorStack: '',
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'Beklenmeyen bir hata oluştu',
      errorStack: error.stack,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[AuraBio ErrorBoundary] Uncaught runtime exception caught:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, errorMessage: '', errorStack: '' });
    if (typeof window !== 'undefined') {
      window.location.hash = '';
      window.location.reload();
    }
  };

  private handleSoftRecover = () => {
    this.setState({ hasError: false, errorMessage: '', errorStack: '' });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 select-none">
          <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-slate-900/95 border border-emerald-500/30 shadow-2xl shadow-emerald-950/40 text-center space-y-5 animate-fade-in">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <ShieldAlert className="w-8 h-8" />
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
                <span>AuraBio Biyo-Kalkan Devrede</span>
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
                Sistem donma ve çökmelere karşı korumaya alındı. Verileriniz ve seans geçmişiniz güvende.
              </p>
            </div>

            {/* Technical Detail Badge */}
            {this.state.errorMessage && (
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-left overflow-x-auto max-h-24">
                <span className="text-[10px] font-mono text-slate-400 block uppercase font-bold tracking-wider mb-0.5">
                  Sistem Tanı Notu:
                </span>
                <p className="text-[11px] font-mono text-emerald-300/90 break-words">
                  {this.state.errorMessage}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleSoftRecover}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 border border-slate-700 active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-emerald-400" />
                <span>Modülü Yeniden Başlat</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-950/60 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Ana Sayfaya Dön</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

