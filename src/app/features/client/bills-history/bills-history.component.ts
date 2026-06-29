import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { WalletApiService } from '../../../core/services/wallet-api.service';
import { BillingApiService } from '../../../core/services/billing-api.service';
import { XofPipe } from '../../../shared/pipes/xof.pipe';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { Facture } from '../../../core/models/wallet.model';

@Component({
  selector: 'app-bills-history',
  standalone: true,
  imports: [CommonModule, FormsModule, XofPipe, IconComponent],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Historique des factures</h1>
        <p class="page-sub">Factures sur une période donnée</p>
      </div>
    </div>

    <div class="card filter-card">
      <div class="card-body">
        <div class="filter-row">
          <div class="field">
            <label>Date de début</label>
            <input type="date" class="input" [(ngModel)]="debut" [max]="today" />
          </div>
          <div class="field">
            <label>Date de fin</label>
            <input type="date" class="input" [(ngModel)]="fin" [max]="today" />
          </div>
          <button class="btn btn-primary" (click)="load()" [disabled]="loading() || !debut || !fin || !walletCode">
            <app-icon name="search" [size]="14" />
            Rechercher
          </button>
        </div>
      </div>
    </div>

    @if (loading()) {
      <div class="loading-state">Chargement...</div>
    }

    @if (!loading() && hasLoaded()) {
      @if (factures().length === 0) {
        <div class="card">
          <div class="empty-state">
            <app-icon name="calendar" [size]="28" />
            <p>Aucune facture sur cette période</p>
          </div>
        </div>
      } @else {
        <div class="card">
          <div class="card-header">
            <span style="font-size:13px;font-weight:600">{{ factures().length }} facture(s) trouvée(s)</span>
            <span style="font-size:12px;color:var(--text-3)">
              Total : <strong style="color:var(--text)">{{ total() | xof }}</strong>
              &nbsp;·&nbsp;
              <span class="text-green">{{ paidCount() }} payée(s)</span>
              &nbsp;·&nbsp;
              <span style="color:var(--amber)">{{ factures().length - paidCount() }} en attente</span>
            </span>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Unité</th>
                  <th>Référence</th>
                  <th>Mois</th>
                  <th>Date</th>
                  <th style="text-align:right">Montant</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                @for (f of factures(); track f.id) {
                  <tr>
                    <td style="font-weight:500">{{ f.serviceName }}</td>
                    <td><span class="badge badge-gray">{{ f.unite }}</span></td>
                    <td><code>{{ f.reference }}</code></td>
                    <td style="color:var(--text-3)">{{ f.mois }}</td>
                    <td style="color:var(--text-3)">{{ f.dateFacture | date:'dd/MM/yyyy' }}</td>
                    <td style="text-align:right;font-weight:600">{{ f.montant | xof }}</td>
                    <td>
                      @if (f.payee) {
                        <span class="badge badge-green"><app-icon name="check" [size]="10" /> Payée</span>
                      } @else {
                        <span class="badge badge-amber">En attente</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    }
  `,
  styles: [`
    .page-header { margin-bottom: 16px; }
    .filter-card { margin-bottom: 16px; }
    .filter-row {
      display: flex;
      align-items: flex-end;
      gap: 12px;
      flex-wrap: wrap;
    }
    .filter-row .field { flex: 1; min-width: 160px; }
    .filter-row .btn { flex-shrink: 0; align-self: flex-end; }
  `]
})
export class BillsHistoryComponent implements OnInit {
  private auth = inject(AuthService);
  private walletApi = inject(WalletApiService);
  private billingApi = inject(BillingApiService);

  factures = signal<Facture[]>([]);
  loading = signal(false);
  hasLoaded = signal(false);
  walletCode = '';

  today = new Date().toISOString().split('T')[0];
  debut = this.firstDayOfMonth();
  fin = this.today;

  ngOnInit(): void {
    this.walletApi.getWalletByPhone(this.auth.phone()).subscribe({
      next: (w) => { this.walletCode = w.code; this.load(); }
    });
  }

  load(): void {
    if (!this.walletCode || !this.debut || !this.fin) return;
    this.loading.set(true);
    this.billingApi.getFacturesByPeriode(this.walletCode, this.debut, this.fin).subscribe({
      next: fs => { this.factures.set(fs); this.loading.set(false); this.hasLoaded.set(true); },
      error: () => { this.loading.set(false); this.hasLoaded.set(true); }
    });
  }

  paidCount() { return this.factures().filter(f => f.payee).length; }
  total()     { return this.factures().reduce((s, f) => s + f.montant, 0); }

  private firstDayOfMonth(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  }
}
