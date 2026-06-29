import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { WalletApiService } from '../../../core/services/wallet-api.service';
import { BillingApiService } from '../../../core/services/billing-api.service';
import { BalanceStore } from '../../../core/store/balance.store';
import { ToastService } from '../../../core/services/toast.service';
import { XofPipe } from '../../../shared/pipes/xof.pipe';
import { Facture } from '../../../core/models/wallet.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-bills',
  standalone: true,
  imports: [CommonModule, FormsModule, XofPipe, IconComponent],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Factures</h1>
        <p class="page-sub">Mois en cours — <code>{{ walletCode }}</code></p>
      </div>
    </div>

    <div class="toolbar">
      <div class="search-bar">
        <app-icon name="search" [size]="14" class="search-ico" />
        <input class="search-input" [(ngModel)]="uniteFilter" placeholder="Filtrer par unité — ISM, WOYAFAL..." />
      </div>
      <button class="btn btn-ghost" (click)="loadFactures()" [disabled]="loading() || !walletCode">
        Actualiser
      </button>
      @if (selectedRefs().length > 0) {
        <button class="btn btn-primary" (click)="paySelected()" [disabled]="paying()">
          Payer la sélection ({{ selectedRefs().length }})
        </button>
      }
      @if (unpaidFactures().length > 0 && selectedRefs().length === 0) {
        <button class="btn btn-primary" (click)="payAll()" [disabled]="paying()">
          {{ paying() ? 'Paiement...' : 'Tout payer (' + unpaidFactures().length + ')' }}
        </button>
      }
    </div>

    @if (loading()) { <div class="loading-state">Chargement des factures...</div> }

    @if (!loading() && hasLoaded() && factures().length === 0) {
      <div class="card">
        <div class="empty-state">
          <app-icon name="receipt" [size]="28" />
          <p>Aucune facture pour ce mois</p>
        </div>
      </div>
    }

    @if (factures().length > 0) {
      <div class="card">
        <div class="card-header">
          <span style="font-size:13px;font-weight:600">{{ factures().length }} facture(s)</span>
          <span style="font-size:12px;color:var(--text-3)">
            {{ unpaidFactures().length }} non payée(s) ·
            <span class="text-green">{{ paidCount() }} payée(s)</span>
          </span>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th style="width:40px">
                  <input type="checkbox"
                    [checked]="allUnpaidSelected()"
                    [indeterminate]="someSelected()"
                    (change)="toggleAll($event)" />
                </th>
                <th>Service</th>
                <th>Unité</th>
                <th>Référence</th>
                <th>Mois</th>
                <th style="text-align:right">Montant</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              @for (f of factures(); track f.id) {
                <tr [class.row-paid]="f.payee">
                  <td>
                    <input type="checkbox"
                      [checked]="selectedRefs().includes(f.reference)"
                      [disabled]="f.payee"
                      (change)="toggleSelect(f.reference)" />
                  </td>
                  <td style="font-weight:500">{{ f.serviceName }}</td>
                  <td><span class="badge badge-gray">{{ f.unite }}</span></td>
                  <td><code>{{ f.reference }}</code></td>
                  <td style="color:var(--text-3)">{{ f.mois }}</td>
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
  `,
  styles: [`
    .page-header { margin-bottom: 16px; }
    .toolbar {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .search-bar {
      flex: 1;
      min-width: 220px;
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 0 12px;
    }
    .search-ico { color: var(--text-3); flex-shrink: 0; }
    .search-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: var(--text);
      font-size: 13px;
      padding: 9px 0;
    }
    .search-input::placeholder { color: var(--text-3); }
    .row-paid { opacity: .55; }
    input[type=checkbox] { cursor: pointer; accent-color: var(--green); width: 14px; height: 14px; }
    input[type=checkbox]:disabled { cursor: not-allowed; opacity: .4; }
  `]
})
export class BillsComponent implements OnInit {
  private auth = inject(AuthService);
  private walletApi = inject(WalletApiService);
  private billingApi = inject(BillingApiService);
  store = inject(BalanceStore);
  private toast = inject(ToastService);

  factures = signal<Facture[]>([]);
  selectedRefs = signal<string[]>([]);
  loading = signal(false);
  paying = signal(false);
  hasLoaded = signal(false);
  uniteFilter = '';
  walletCode = '';
  walletPhone = '';

  ngOnInit(): void {
    this.walletPhone = this.auth.phone();
    this.walletApi.getWalletByPhone(this.walletPhone).subscribe({
      next: (w) => { this.walletCode = w.code; this.loadFactures(); }
    });
  }

  loadFactures(): void {
    if (!this.walletCode) return;
    this.loading.set(true);
    this.factures.set([]); this.selectedRefs.set([]);
    this.billingApi.getCurrentFactures(this.walletCode, this.uniteFilter || undefined).subscribe({
      next: fs => { this.factures.set(fs); this.loading.set(false); this.hasLoaded.set(true); },
      error: () => { this.loading.set(false); this.hasLoaded.set(true); }
    });
  }

  toggleSelect(ref: string): void {
    this.selectedRefs.update(refs =>
      refs.includes(ref) ? refs.filter(r => r !== ref) : [...refs, ref]
    );
  }

  toggleAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedRefs.set(checked ? this.unpaidFactures().map(f => f.reference) : []);
  }

  unpaidFactures()    { return this.factures().filter(f => !f.payee); }
  paidCount()         { return this.factures().filter(f => f.payee).length; }
  allUnpaidSelected() { const u = this.unpaidFactures(); return u.length > 0 && u.every(f => this.selectedRefs().includes(f.reference)); }
  someSelected()      { const s = this.selectedRefs().length; return s > 0 && !this.allUnpaidSelected(); }

  paySelected(): void {
    const refs = this.selectedRefs();
    if (!refs.length) return;
    const serviceName = this.factures().find(f => refs.includes(f.reference))?.serviceName ?? '';
    this.paying.set(true);
    this.walletApi.payFactures(this.walletPhone, serviceName, refs).subscribe({
      next: () => { this.toast.success(`${refs.length} facture(s) payée(s)`); this.paying.set(false); this.refresh(); },
      error: () => this.paying.set(false)
    });
  }

  payAll(): void {
    const unpaid = this.unpaidFactures();
    if (!unpaid.length) return;
    this.paying.set(true);
    this.walletApi.payFactures(this.walletPhone, unpaid[0].serviceName, unpaid.map(f => f.reference)).subscribe({
      next: () => { this.toast.success('Toutes les factures ont été payées'); this.paying.set(false); this.refresh(); },
      error: () => this.paying.set(false)
    });
  }

  private refresh(): void {
    this.walletApi.getBalance(this.walletPhone).subscribe({ next: r => this.store.setBalance(r.phone, r.balance, r.currency) });
    this.loadFactures();
  }
}
