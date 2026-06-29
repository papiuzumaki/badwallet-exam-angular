import {
  Component, OnInit, OnDestroy, inject, signal,
  ElementRef, ViewChild, AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { WalletApiService } from '../../../core/services/wallet-api.service';
import { BalanceStore } from '../../../core/store/balance.store';
import { XofPipe } from '../../../shared/pipes/xof.pipe';
import { Wallet, Transaction, WalletStats } from '../../../core/models/wallet.model';
import { Chart, ArcElement, DoughnutController, Tooltip, Legend } from 'chart.js';

Chart.register(ArcElement, DoughnutController, Tooltip, Legend);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, XofPipe],
  template: `
    <div class="dashboard">
      <h2>Tableau de bord</h2>

      @if (loading()) {
        <div class="loading">Chargement...</div>
      }

      @if (wallet()) {
        <div class="stats-grid">
          <div class="stat-card main">
            <div class="label">Solde actuel</div>
            <div class="value big">{{ store.balance() | xof: store.currency() }}</div>
            <div class="sub">{{ wallet()!.phoneNumber }} &middot; <code>{{ wallet()!.code }}</code></div>
          </div>

          <div class="stat-card">
            <div class="label">Transactions</div>
            <div class="value">{{ stats()?.totalTransactions ?? transactions().length }}</div>
          </div>

          <div class="stat-card green">
            <div class="label">Total déposé</div>
            <div class="value">{{ (stats()?.totalDepose ?? 0) | xof }}</div>
          </div>

          <div class="stat-card orange">
            <div class="label">Total retiré</div>
            <div class="value">{{ (stats()?.totalRetire ?? 0) | xof }}</div>
          </div>

          <div class="stat-card blue">
            <div class="label">Total transféré</div>
            <div class="value">{{ (stats()?.totalTransfere ?? 0) | xof }}</div>
          </div>

          <div class="stat-card red">
            <div class="label">Total factures</div>
            <div class="value">{{ (stats()?.totalPaye ?? 0) | xof }}</div>
          </div>
        </div>

        <div class="charts-section">
          <div class="chart-card">
            <h3>Répartition des dépenses</h3>
            <div class="chart-wrapper">
              <canvas #chartCanvas></canvas>
            </div>
          </div>

          <div class="recent-card">
            <h3>Dernières transactions</h3>
            @if (transactions().length === 0) {
              <p class="empty">Aucune transaction</p>
            }
            @for (tx of transactions().slice(0, 6); track tx.id) {
              <div class="tx-row">
                <span class="badge" [class]="tx.type.toLowerCase()">{{ typeLabel(tx.type) }}</span>
                <span class="tx-desc">{{ tx.description }}</span>
                <span class="tx-amount">{{ tx.amount | xof }}</span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    h2 { color: #e94560; margin-bottom: 1.5rem; }
    h3 { color: #aaa; font-size: .95rem; margin-bottom: 1rem; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
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
    .label { color: #aaa; font-size: .78rem; margin-bottom: .35rem; text-transform: uppercase; letter-spacing: .05em; }
    .value { color: #eee; font-size: 1.25rem; font-weight: 700; }
    .value.big { font-size: 2rem; color: #2ecc71; }
    .sub { color: #666; font-size: .82rem; margin-top: .35rem; }
    code { background: #1a1a2e; padding: .1rem .35rem; border-radius: 4px; color: #e94560; }
    .charts-section { display: grid; grid-template-columns: 340px 1fr; gap: 1rem; }
    .chart-card, .recent-card {
      background: #0f3460; border-radius: 12px; padding: 1.25rem;
    }
    .chart-wrapper { width: 260px; margin: 0 auto; }
    .tx-row {
      display: flex; align-items: center; gap: .75rem;
      padding: .55rem 0; border-top: 1px solid #1a1a2e; font-size: .88rem;
    }
    .badge {
      padding: .18rem .55rem; border-radius: 20px; font-size: .72rem;
      font-weight: 600; white-space: nowrap;
    }
    .badge.deposit { background: #1b4332; color: #2ecc71; }
    .badge.withdraw { background: #4a1c1c; color: #e74c3c; }
    .badge.transfer_send { background: #1a2a4a; color: #3498db; }
    .badge.transfer_receive { background: #1c3a2a; color: #27ae60; }
    .badge.payment { background: #3d2b1a; color: #e67e22; }
    .tx-desc { flex: 1; color: #ccc; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .tx-amount { font-weight: 600; color: #eee; white-space: nowrap; }
    .loading, .empty { text-align: center; color: #aaa; padding: 2rem; }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  auth = inject(AuthService);
  store = inject(BalanceStore);
  private api = inject(WalletApiService);

  wallet = signal<Wallet | null>(null);
  transactions = signal<Transaction[]>([]);
  stats = signal<WalletStats | null>(null);
  loading = signal(false);

  private chart: Chart | null = null;

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
      next: (txs) => {
        this.transactions.set(txs);
        this.buildChart();
      }
    });

    this.api.getStats(phone).subscribe({
      next: (s) => {
        this.stats.set(s);
        this.buildChart();
      }
    });
  }

  ngAfterViewInit(): void {
    this.buildChart();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private buildChart(): void {
    if (!this.chartCanvas) return;
    const s = this.stats();
    if (!s) return;

    const data = [s.totalDepose, s.totalRetire, s.totalTransfere, s.totalPaye].map(v => Math.round(v));
    const total = data.reduce((a, b) => a + b, 0);
    if (total === 0) return;

    this.chart?.destroy();
    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Dépôts', 'Retraits', 'Transferts', 'Factures'],
        datasets: [{
          data,
          backgroundColor: ['#2ecc71', '#e74c3c', '#3498db', '#e67e22'],
          borderColor: '#0f3460',
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#aaa', font: { size: 11 } }
          }
        }
      }
    });
  }

  typeLabel(type: string): string {
    const labels: Record<string, string> = {
      DEPOSIT: 'Dépôt', WITHDRAW: 'Retrait',
      TRANSFER_SEND: 'Envoi', TRANSFER_RECEIVE: 'Reçu', PAYMENT: 'Paiement'
    };
    return labels[type] ?? type;
  }
}
