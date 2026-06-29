import { Injectable, signal, computed } from '@angular/core';

export interface BalanceState {
  phone: string;
  balance: number;
  currency: string;
  loading: boolean;
}

@Injectable({ providedIn: 'root' })
export class BalanceStore {
  private readonly _state = signal<BalanceState>({
    phone: '',
    balance: 0,
    currency: 'XOF',
    loading: false,
  });

  readonly phone = computed(() => this._state().phone);
  readonly balance = computed(() => this._state().balance);
  readonly currency = computed(() => this._state().currency);
  readonly loading = computed(() => this._state().loading);

  setBalance(phone: string, balance: number, currency = 'XOF'): void {
    this._state.update(s => ({ ...s, phone, balance, currency }));
  }

  setLoading(loading: boolean): void {
    this._state.update(s => ({ ...s, loading }));
  }

  reset(): void {
    this._state.set({ phone: '', balance: 0, currency: 'XOF', loading: false });
  }
}
