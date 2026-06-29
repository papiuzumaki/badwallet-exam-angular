import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { WalletApiService } from '../../../core/services/wallet-api.service';
import { XofPipe } from '../../../shared/pipes/xof.pipe';
import { Transaction } from '../../../core/models/wallet.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, XofPipe, IconComponent],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Transactions</h1>
        <p class="page-sub">{{ filtered().length }} résultat(s)</p>
      </div>
    </div>

    <div class="filters">
      @for (f of typeFilters; track f.value) {
        <button
          class="filter-chip"
          [class.active]="activeFilter() === f.value"
          (click)="activeFilter.set(f.value)"
        >{{ f.label }}</button>
      }
    </div>

    <div class="date-filters">
      <div class="field" style="flex:1;min-width:140px">
        <label>Du</label>
        <input type="date" class="input" [(ngModel)]="dateDebut" [max]="today" />
      </div>
      <div class="field" style="flex:1;min-width:140px">
        <label>Au</label>
        <input type="date" class="input" [(ngModel)]="dateFin" [max]="today" />
      </div>
      <button class="btn btn-ghost btn-sm" (click)="resetDates()" style="align-self:flex-end">
        Réinitialiser
      </button>
    </div>

    @if (loading()) {
      <div class="loading-state">Chargement des transactions...</div>
    }

    @if (!loading()) {
      <div class="card">
        @if (filtered().length === 0) {
          <div class="empty-state">
            <app-icon name="history" [size]="28" />
            <p>Aucune transaction pour ce filtre</p>
          </div>
        }
        @if (filtered().length > 0) {
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Référence</th>
                  <th style="text-align:right">Montant</th>
                  <th style="text-align:right">Frais</th>
                  <th style="text-align:right">Solde après</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                @for (tx of filtered(); track tx.id) {
                  <tr>
                    <td><span class="badge" [class]="txBadge(tx.type)">{{ typeLabel(tx.type) }}</span></td>
                    <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ tx.description }}</td>
                    <td><code>{{ tx.reference }}</code></td>
                    <td style="text-align:right;font-weight:600" [class.text-green]="tx.balanceAfter > tx.balanceBefore">{{ tx.amount | xof }}</td>
                    <td style="text-align:right;color:var(--text-3)">{{ tx.fees > 0 ? (tx.fees | xof) : '—' }}</td>
                    <td style="text-align:right;font-weight:600;color:var(--text)">{{ tx.balanceAfter | xof }}</td>
                    <td style="white-space:nowrap">{{ tx.createdAt | date:'dd MMM yyyy, HH:mm' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .page-header { margin-bottom: 16px; }
    .filters {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-bottom: 10px;
    }
    .date-filters {
      display: flex;
      align-items: flex-end;
      gap: 10px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .filter-chip {
      padding: 5px 12px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      color: var(--text-2);
      transition: all .12s;
    }
    .filter-chip:hover { color: var(--text); border-color: var(--border-2); }
    .filter-chip.active {
      background: var(--surface-3);
      border-color: var(--border-2);
      color: var(--text);
    }
  `]
})
export class TransactionsComponent implements OnInit {
  private auth = inject(AuthService);
  private api = inject(WalletApiService);

  transactions = signal<Transaction[]>([]);
  loading = signal(false);
  activeFilter = signal('ALL');
  today = new Date().toISOString().split('T')[0];
  dateDebut = '';
  dateFin = '';

  typeFilters = [
    { label: 'Tous',      value: 'ALL'              },
    { label: 'Dépôts',    value: 'DEPOSIT'          },
    { label: 'Retraits',  value: 'WITHDRAW'         },
    { label: 'Envois',    value: 'TRANSFER_SEND'    },
    { label: 'Reçus',     value: 'TRANSFER_RECEIVE' },
    { label: 'Paiements', value: 'PAYMENT'          },
  ];

  filtered() {
    let list = this.transactions();
    const f = this.activeFilter();
    if (f !== 'ALL') list = list.filter(tx => tx.type === f);
    if (this.dateDebut) list = list.filter(tx => tx.createdAt >= this.dateDebut);
    if (this.dateFin)  list = list.filter(tx => tx.createdAt <= this.dateFin + 'T23:59:59');
    return list;
  }

  resetDates(): void { this.dateDebut = ''; this.dateFin = ''; }

  ngOnInit(): void {
    this.loading.set(true);
    this.api.getTransactions(this.auth.phone()).subscribe({
      next: txs => { this.transactions.set(txs); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  typeLabel(type: string): string {
    return ({ DEPOSIT:'Dépôt', WITHDRAW:'Retrait', TRANSFER_SEND:'Envoi', TRANSFER_RECEIVE:'Reçu', PAYMENT:'Paiement' } as any)[type] ?? type;
  }

  txBadge(type: string): string {
    return ({ DEPOSIT:'badge badge-green', WITHDRAW:'badge badge-red', TRANSFER_SEND:'badge badge-blue', TRANSFER_RECEIVE:'badge badge-green', PAYMENT:'badge badge-amber' } as any)[type] ?? 'badge badge-gray';
  }
}
