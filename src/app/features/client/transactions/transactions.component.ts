import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { WalletApiService } from '../../../core/services/wallet-api.service';
import { XofPipe } from '../../../shared/pipes/xof.pipe';
import { Transaction } from '../../../core/models/wallet.model';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, XofPipe],
  template: `
    <div class="page">
      <h2>Historique des transactions</h2>

      <div class="filters">
        <button
          *ngFor="let t of typeFilters"
          [class.active]="activeFilter() === t.value"
          (click)="setFilter(t.value)"
          class="filter-btn"
        >{{ t.label }}</button>
      </div>

      @if (loading()) {
        <div class="loading">Chargement...</div>
      }

      @if (!loading() && filtered().length === 0) {
        <div class="empty">Aucune transaction trouvée</div>
      }

      @for (tx of filtered(); track tx.id) {
        <div class="tx-card">
          <div class="tx-header">
            <span class="badge" [class]="tx.type.toLowerCase()">{{ typeLabel(tx.type) }}</span>
            <code class="ref">{{ tx.reference }}</code>
            <span class="date">{{ tx.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
          </div>
          <div class="tx-body">
            <div class="desc">{{ tx.description }}</div>
            <div class="amounts">
              <span>Montant : <strong>{{ tx.amount | xof }}</strong></span>
              @if (tx.fees > 0) {
                <span class="fees">Frais : {{ tx.fees | xof }}</span>
              }
              <span>Solde : <strong class="balance">{{ tx.balanceAfter | xof }}</strong></span>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page h2 { color: #e94560; margin-bottom: 1rem; }
    .filters { display: flex; gap: .5rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
    .filter-btn {
      background: #0f3460; border: 1px solid #1a1a2e;
      color: #aaa; padding: .35rem .9rem; border-radius: 20px;
      cursor: pointer; font-size: .8rem;
    }
    .filter-btn.active { background: #e94560; border-color: #e94560; color: #fff; }
    .tx-card {
      background: #0f3460; border-radius: 10px; padding: 1rem 1.25rem;
      margin-bottom: .75rem; border-left: 4px solid #1a1a2e;
    }
    .tx-header { display: flex; align-items: center; gap: .75rem; margin-bottom: .5rem; }
    .badge {
      padding: .2rem .6rem; border-radius: 20px; font-size: .75rem; font-weight: 600;
    }
    .badge.deposit { background: #1b4332; color: #2ecc71; }
    .badge.withdraw { background: #4a1c1c; color: #e74c3c; }
    .badge.transfer_send { background: #1a2a4a; color: #3498db; }
    .badge.transfer_receive { background: #1c3a2a; color: #27ae60; }
    .badge.payment { background: #3d2b1a; color: #e67e22; }
    .ref { flex: 1; color: #e94560; font-size: .8rem; background: #1a1a2e; padding: .15rem .4rem; border-radius: 4px; }
    .date { color: #666; font-size: .8rem; }
    .desc { color: #aaa; font-size: .85rem; margin-bottom: .4rem; }
    .amounts { display: flex; gap: 1.5rem; font-size: .9rem; color: #ccc; }
    .amounts strong { color: #eee; }
    .fees { color: #e74c3c; }
    .balance { color: #2ecc71 !important; }
    .loading, .empty { text-align: center; color: #aaa; padding: 3rem; }
  `]
})
export class TransactionsComponent implements OnInit {
  private auth = inject(AuthService);
  private api = inject(WalletApiService);

  transactions = signal<Transaction[]>([]);
  loading = signal(false);
  activeFilter = signal<string>('ALL');

  typeFilters = [
    { label: 'Tous', value: 'ALL' },
    { label: 'Dépôts', value: 'DEPOSIT' },
    { label: 'Retraits', value: 'WITHDRAW' },
    { label: 'Envois', value: 'TRANSFER_SEND' },
    { label: 'Reçus', value: 'TRANSFER_RECEIVE' },
    { label: 'Paiements', value: 'PAYMENT' },
  ];

  filtered() {
    const f = this.activeFilter();
    if (f === 'ALL') return this.transactions();
    return this.transactions().filter(tx => tx.type === f);
  }

  ngOnInit(): void {
    this.loading.set(true);
    this.api.getTransactions(this.auth.phone()).subscribe({
      next: (txs) => { this.transactions.set(txs); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  setFilter(value: string): void {
    this.activeFilter.set(value);
  }

  typeLabel(type: string): string {
    const labels: Record<string, string> = {
      DEPOSIT: 'Dépôt', WITHDRAW: 'Retrait',
      TRANSFER_SEND: 'Envoi', TRANSFER_RECEIVE: 'Reçu', PAYMENT: 'Paiement'
    };
    return labels[type] ?? type;
  }
}
