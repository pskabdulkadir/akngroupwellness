/**
 * Real-Time Accounting Sync Bridge between
 * AKN Group Wellness & Monoline MLM and VergiSync AI Smart Accounting Suite
 */

export interface SyncTransactionPayload {
  orderId: string;
  customerName: string;
  customerEmail?: string;
  vknTckn?: string;
  amountTry: number;
  amountUsd?: number;
  packageId?: string;
  packageName?: string;
  isExport?: boolean; // Yurt dışı ($3x$ USD)
  isDealerCommission?: boolean;
  dealerIsCompany?: boolean;
  withholdingTaxTry?: number; // %20 Stopaj
  netPayoutTry?: number;
  channel?: string;
  timestamp?: string;
  taxOffice?: string;
}

const STORAGE_SYNCED_ORDERS_KEY = 'akn_synced_orders_v1';

class AccountingSyncBridge {
  private listeners: Array<(payload: SyncTransactionPayload) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      // Listen to window-level dispatch events
      window.addEventListener('akn-accounting-order-sync', ((event: CustomEvent<SyncTransactionPayload>) => {
        if (event.detail) {
          this.processSync(event.detail);
        }
      }) as EventListener);
    }
  }

  public subscribe(cb: (payload: SyncTransactionPayload) => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  public async syncOrderTransaction(payload: SyncTransactionPayload): Promise<void> {
    try {
      this.processSync(payload);

      // Save locally
      if (typeof window !== 'undefined') {
        const existing = this.getSyncedTransactions();
        existing.unshift({ ...payload, timestamp: payload.timestamp || new Date().toISOString() });
        localStorage.setItem(STORAGE_SYNCED_ORDERS_KEY, JSON.stringify(existing.slice(0, 100)));
      }

      // Also notify backend API asynchronously
      fetch('/api/v1/integrations/accounting/sync-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_system: 'AKN_WELLNESS_MONOLINE',
          source_event_type: payload.isDealerCommission ? 'COMMISSION_PENDING_ACCRUED' : 'ORDER_PAYMENT_CONFIRMED',
          source_event_id: payload.orderId,
          idempotency_key: `IDEMP-${payload.orderId}-${Date.now()}`,
          payload,
        }),
      }).catch((e) => console.warn('Async accounting sync notice failed:', e));
    } catch (err) {
      console.error('AccountingSyncBridge error:', err);
    }
  }

  private processSync(payload: SyncTransactionPayload) {
    for (const listener of this.listeners) {
      try {
        listener(payload);
      } catch (err) {
        console.error('Listener notification error:', err);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('akn-smart-accounting-updated', {
          detail: payload,
        })
      );
    }
  }

  public getSyncedTransactions(): SyncTransactionPayload[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_SYNCED_ORDERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}

export const accountingSyncBridge = new AccountingSyncBridge();
