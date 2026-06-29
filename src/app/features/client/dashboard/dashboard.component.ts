import { Component, OnInit, OnDestroy, AfterViewInit, inject, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { WalletApiService } from '../../../core/services/wallet-api.service';
import { BalanceStore } from '../../../core/store/balance.store';
import { XofPipe } from '../../../shared/pipes/xof.pipe';
import { Wallet, Transaction, WalletStats } from '../../../core/models/wallet.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { Chart, ArcElement, DoughnutController, Tooltip, Legend } from 'chart.js';

Chart.register(ArcElement, DoughnutController, Tooltip, Legend);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, XofPipe, IconComponent],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Tableau de bord</h1>
        @if (wallet()) {
          <p class="page-sub">{{ wallet()!.phoneNumber }} &nbsp;·&nbsp; <code>{{ wallet()!.code }}</code></p>
        }
      </div>
    </div>

    @if (loading()) {
      <div class="loading-state">Chargement...</div>
    }

    @if (!loading() && wallet()) {
      <!-- Stats row -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-label">Solde actuel</div>
          <div class="stat-value text-green">{{ store.balance() | xof: store.currency() }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Transactions</div>
          <div class="stat-value">{{ stats()?.totalTransactions ?? '—' }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total déposé</div>
          <div class="stat-value">{{ (stats()?.totalDepose ?? 0) | xof }}</div>
          <div class="stat-sub">Entrées cumulées</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total retiré</div>
          <div class="stat-value">{{ (stats()?.totalRetire ?? 0) | xof }}</div>
          <div class="stat-sub">Sorties cumulées</div>
        </div>
      </div>

      <!-- Chart + recent -->
      <div class="bottom-grid">
        <div class="card chart-card">
          <div class="card-header">
            <span style="font-size:13px;font-weight:600">Répartition des flux</span>
          </div>
          <div class="card-body chart-body">
            <canvas #chartCanvas></canvas>
          </div>
        </div>

        <div class="card recent-card">
          <div class="card-header">
            <span style="font-size:13px;font-weight:600">Transactions récentes</span>
          </div>
          @if (transactions().length === 0) {
            <div class="empty-state" style="padding:30px">
              <app-icon name="history" [size]="24" /><p>Aucune transaction</p>
            </div>
          }
          @for (tx of transactions().slice(0, 7); track tx.id) {
            <div class="tx-row">
              <div class="tx-left">
                <span class="badge" [class]="txBadge(tx.type)">{{ typeLabel(tx.type) }}</span>
                <span class="tx-desc">{{ tx.description }}</span>
              </div>
              <div class="tx-right">
                <span class="tx-amt" [class.pos]="tx.balanceAfter > tx.balanceBefore">
                  {{ tx.balanceAfter > tx.balanceBefore ? '+' : '' }}{{ tx.amount | xof }}
                </span>
                <span class="tx-date">{{ tx.createdAt | date:'dd MMM' }}</span>
              </div>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }
    .bottom-grid {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 16px;
    }
    .chart-body {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .chart-body canvas { max-width: 220px; }

    .tx-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 11px 20px;
      border-bottom: 1px solid var(--border);
      gap: 12px;
    }
    .tx-row:last-child { border-bottom: none; }
    .tx-left { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .tx-desc { font-size: 12.5px; color: var(--text-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .tx-right { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex-shrink: 0; }
    .tx-amt { font-size: 13px; font-weight: 600; color: var(--text); }
    .tx-amt.pos { color: var(--green); }
    .tx-date { font-size: 11px; color: var(--text-3); }
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
      next: (w) => { this.wallet.set(w); this.store.setBalance(phone, w.balance, w.currency); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
    this.api.getTransactions(phone).subscribe({ next: txs => this.transactions.set(txs) });
    this.api.getStats(phone).subscribe({ next: s => { this.stats.set(s); this.buildChart(); } });
  }

  ngAfterViewInit(): void { this.buildChart(); }
  ngOnDestroy(): void { this.chart?.destroy(); }

  private buildChart(): void {
    if (!this.chartCanvas) return;
    const s = this.stats();
    if (!s) return;
    const data = [s.totalDepose, s.totalRetire, s.totalTransfere, s.totalPaye];
    if (data.every(v => v === 0)) return;
    this.chart?.destroy();
    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Dépôts', 'Retraits', 'Transferts', 'Factures'],
        datasets: [{
          data: data.map(Math.round),
          backgroundColor: ['#22c55e', '#f87171', '#60a5fa', '#fbbf24'],
          borderColor: '#1c1c1c',
          borderWidth: 3,
          hoverOffset: 4
        }]
      },
      options: {
        cutout: '70%',
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#666', font: { size: 11, family: 'Inter' }, padding: 12, boxWidth: 10 }
          },
          tooltip: {
            bodyFont: { family: 'Inter', size: 12 },
            titleFont: { family: 'Inter', size: 12 }
          }
        }
      }
    });
  }

  typeLabel(type: string): string {
    return ({ DEPOSIT:'Dépôt', WITHDRAW:'Retrait', TRANSFER_SEND:'Envoi', TRANSFER_RECEIVE:'Reçu', PAYMENT:'Paiement' } as any)[type] ?? type;
  }

  txBadge(type: string): string {
    return ({ DEPOSIT:'badge badge-green', WITHDRAW:'badge badge-red', TRANSFER_SEND:'badge badge-blue', TRANSFER_RECEIVE:'badge badge-green', PAYMENT:'badge badge-amber' } as any)[type] ?? 'badge badge-gray';
  }
}
