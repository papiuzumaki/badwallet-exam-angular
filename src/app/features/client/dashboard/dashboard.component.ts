import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { WalletApiService } from '../../../core/services/wallet-api.service';
import { BalanceStore } from '../../../core/store/balance.store';
import { XofPipe } from '../../../shared/pipes/xof.pipe';
import { Wallet, Transaction } from '../../../core/models/wallet.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, XofPipe],
  template: `
    <div class="dashboard">
      <h2>Tableau de bord</h2>

      @if (wallet()) {
        <div class="stats-grid">
          <div class="stat-card main">
            <div class="label">Solde actuel</div>
            <div class="value big">{{ store.balance() | xof: store.currency() }}</div>
            <div class="sub">{{ wallet()!.phoneNumber }} · {{ wallet()!.code }}</div>
          </div>

          <div class="stat-card">
            <div class="label">Total transactions</div>
            <div class="value">{{ transactions().length }}</div>
          </div>

          <div class="stat-card green">
            <div class="label">Total déposé</div>
            <div class="value">{{ totalByType('DEPOSIT') | xof }}</div>
          </div>

          <div class="stat-card orange">
            <div class="label">Total retiré</div>
            <div class="value">{{ totalByType('WITHDRAW') | xof }}</div>
          </div>

          <div class="stat-card blue">
            <div class="label">Total transféré</div>
            <div class="value">{{ totalByType('TRANSFER_SEND') | xof }}</div>
          </div>

          <div class="stat-card red">
            <div class="label">Total payé (factures)</div>
            <div class="value">{{ totalByType('PAYMENT') | xof }}</div>
          </div>
        </div>

        <div class="recent">
          <h3>Dernières transactions</h3>
          @if (transactions().length === 0) {
            <p class="empty">Aucune transaction</p>
          }
          @for (tx of transactions().slice(0, 5); track tx.id) {
            <div class="tx-row">
              <span class="tx-type" [class]="tx.type.toLowerCase()">{{ typeLabel(tx.type) }}</span>
              <span class="tx-ref">{{ tx.description }}</span>
              <span class="tx-amount" [class.positive]="tx.balanceAfter > tx.balanceBefore">
                {{ tx.amount | xof }}
              </span>
              <span class="tx-date">{{ tx.createdAt | date:'dd/MM HH:mm' }}</span>
            </div>
          }
        </div>
      }

      @if (!wallet() && loading()) {
        <div class="loading">Chargement...</div>
      }
    </div>
  `,
  styles: [`
    h2 { color: #e94560; margin-bottom: 1.5rem; }
    h3 { color: #aaa; margin-bottom: 1rem; }
    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: #0f3460; border-radius: 12px; padding: 1.25rem;
      border-left: 4px solid #3498db;
    }
    .stat-card.main { grid-column: 1 / -1; border-left-color: #e94560; }
    .stat-card.green { border-left-color: #2ecc71; }
    .stat-card.orange { border-left-color: #e67e22; }
    .stat-card.blue { border-left-color: #3498db; }
    .stat-card.red { border-left-color: #e74c3c; }
    .label { color: #aaa; font-size: .8rem; margin-bottom: .4rem; }
    .value { color: #eee; font-size: 1.4rem; font-weight: 700; }
    .value.big { font-size: 2rem; color: #2ecc71; }
    .sub { color: #666; font-size: .8rem; margin-top: .25rem; }
    .recent { background: #0f3460; border-radius: 12px; padding: 1.25rem; }
    .tx-row {
      display: flex; align-items: center; gap: 1rem;
      padding: .6rem 0; border-top: 1px solid #1a1a2e; font-size: .88rem;
    }
    .tx-type {
      padding: .2rem .6rem; border-radius: 20px; font-size: .75rem; font-weight: 600;
      background: #1a1a2e; color: #aaa;
    }
    .tx-type.deposit { background: #1b4332; color: #2ecc71; }
    .tx-type.withdraw { background: #4a1c1c; color: #e74c3c; }
    .tx-type.transfer_send { background: #1a2a4a; color: #3498db; }
    .tx-type.payment { background: #3d2b1a; color: #e67e22; }
    .tx-ref { flex: 1; color: #ccc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tx-amount { font-weight: 600; color: #eee; }
    .tx-amount.positive { color: #2ecc71; }
    .tx-date { color: #666; font-size: .8rem; white-space: nowrap; }
    .empty, .loading { text-align: center; color: #aaa; padding: 2rem; }
  `]
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  store = inject(BalanceStore);
  private api = inject(WalletApiService);

  wallet = signal<Wallet | null>(null);
  transactions = signal<Transaction[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    const phone = this.auth.phone();
    if (!phone) return;
    this.loading.set(true);

    this.api.getWalletByPhone(phone).subscribe({
      next: (w) => {
        this.wallet.set(w);
        this.store.setBalance(phone, w.balance, w.currency);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });

    this.api.getTransactions(phone).subscribe({
      next: (txs) => this.transactions.set(txs),
      error: () => {}
    });
  }

  typeLabel(type: string): string {
    const labels: Record<string, string> = {
      DEPOSIT: 'Dépôt', WITHDRAW: 'Retrait',
      TRANSFER_SEND: 'Envoi', TRANSFER_RECEIVE: 'Reçu', PAYMENT: 'Paiement'
    };
    return labels[type] ?? type;
  }

  totalByType(type: string): number {
    return this.transactions()
      .filter(tx => tx.type === type)
      .reduce((sum, tx) => sum + tx.amount, 0);
  }
}
