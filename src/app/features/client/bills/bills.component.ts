import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { WalletApiService } from '../../../core/services/wallet-api.service';
import { BillingApiService } from '../../../core/services/billing-api.service';
import { BalanceStore } from '../../../core/store/balance.store';
import { ToastService } from '../../../core/services/toast.service';
import { XofPipe } from '../../../shared/pipes/xof.pipe';
import { Facture, Wallet } from '../../../core/models/wallet.model';

@Component({
  selector: 'app-bills',
  standalone: true,
  imports: [CommonModule, FormsModule, XofPipe],
  template: `
    <div class="page">
      <h2>Factures du mois en cours</h2>

      <div class="balance-info">
        Solde disponible : <strong>{{ store.balance() | xof: store.currency() }}</strong>
      </div>

      <div class="filters-row">
        <div class="form-group inline">
          <label>Filtrer par unité</label>
          <input [(ngModel)]="uniteFilter" name="unite" placeholder="ISM, WOYAFAL..." />
        </div>
        <button (click)="loadFactures()" class="btn-load">Charger les factures</button>
      </div>

      @if (loading()) {
        <div class="loading">Chargement des factures...</div>
      }

      @if (!loading() && factures().length > 0) {
        <div class="factures-header">
          <h3>{{ factures().length }} facture(s) trouvée(s)</h3>
          @if (selectedRefs().length > 0) {
            <button (click)="paySelected()" class="btn-pay" [disabled]="paying()">
              {{ paying() ? 'Paiement...' : 'Payer la sélection (' + selectedRefs().length + ')' }}
            </button>
          }
          <button (click)="payAll()" class="btn-pay-all" [disabled]="paying() || unpaidFactures().length === 0">
            {{ paying() ? 'Paiement...' : 'Tout payer (' + unpaidFactures().length + ')' }}
          </button>
        </div>

        <div class="factures-list">
          @for (f of factures(); track f.id) {
            <div class="facture-card" [class.paid]="f.payee">
              <input
                type="checkbox"
                [checked]="selectedRefs().includes(f.reference)"
                [disabled]="f.payee"
                (change)="toggleSelect(f.reference)"
              />
              <div class="facture-info">
                <div class="service">{{ f.serviceName }} <span class="unite">{{ f.unite }}</span></div>
                <div class="ref">{{ f.reference }}</div>
                <div class="mois">{{ f.mois }}</div>
              </div>
              <div class="facture-right">
                <div class="montant">{{ f.montant | xof }}</div>
                <span class="status" [class.payee]="f.payee">
                  {{ f.payee ? '✅ Payée' : '⏳ Non payée' }}
                </span>
              </div>
            </div>
          }
        </div>
      }

      @if (!loading() && factures().length === 0 && hasLoaded()) {
        <div class="empty">Aucune facture pour ce portefeuille ce mois-ci</div>
      }
    </div>
  `,
  styles: [`
    .page h2 { color: #e94560; margin-bottom: .75rem; }
    .balance-info {
      background: #0f3460; border-radius: 8px; padding: .75rem 1rem;
      color: #aaa; font-size: .9rem; margin-bottom: 1.25rem;
    }
    .balance-info strong { color: #2ecc71; }
    .filters-row { display: flex; gap: 1rem; align-items: flex-end; margin-bottom: 1.5rem; }
    .form-group.inline label { display: block; color: #aaa; font-size: .85rem; margin-bottom: .35rem; }
    input[type=text], input:not([type=checkbox]) {
      padding: .6rem; background: #0f3460; border: 1px solid #1a1a2e;
      border-radius: 8px; color: #eee; font-size: .9rem;
    }
    .btn-load {
      background: #3498db; color: #fff; border: none;
      padding: .6rem 1.2rem; border-radius: 8px; cursor: pointer; font-weight: 600;
    }
    .factures-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
    .factures-header h3 { color: #aaa; margin: 0; }
    .btn-pay {
      background: #e94560; color: #fff; border: none;
      padding: .5rem 1rem; border-radius: 6px; cursor: pointer; font-size: .85rem;
    }
    .btn-pay-all {
      background: #2ecc71; color: #fff; border: none;
      padding: .5rem 1rem; border-radius: 6px; cursor: pointer; font-size: .85rem;
    }
    .btn-pay:disabled, .btn-pay-all:disabled { opacity: .5; cursor: not-allowed; }
    .facture-card {
      display: flex; align-items: center; gap: 1rem;
      background: #0f3460; border-radius: 10px; padding: 1rem 1.25rem;
      margin-bottom: .75rem; border-left: 4px solid #e94560;
    }
    .facture-card.paid { border-left-color: #2ecc71; opacity: .7; }
    input[type=checkbox] { width: 1.1rem; height: 1.1rem; cursor: pointer; }
    .facture-info { flex: 1; }
    .service { color: #eee; font-weight: 600; }
    .unite {
      background: #1a1a2e; color: #aaa;
      padding: .1rem .4rem; border-radius: 4px; font-size: .75rem; margin-left: .5rem;
    }
    .ref { color: #666; font-size: .8rem; }
    .mois { color: #aaa; font-size: .8rem; }
    .facture-right { text-align: right; }
    .montant { font-weight: 700; color: #e94560; font-size: 1.1rem; }
    .status { font-size: .8rem; color: #e74c3c; }
    .status.payee { color: #2ecc71; }
    .loading, .empty { text-align: center; color: #aaa; padding: 3rem; }
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
      next: (w) => { this.walletCode = w.code; }
    });
  }

  loadFactures(): void {
    if (!this.walletCode) {
      this.toast.error('Portefeuille non chargé');
      return;
    }
    this.loading.set(true);
    this.factures.set([]);
    this.selectedRefs.set([]);

    this.billingApi.getCurrentFactures(this.walletCode, this.uniteFilter || undefined).subscribe({
      next: (fs) => {
        this.factures.set(fs);
        this.loading.set(false);
        this.hasLoaded.set(true);
      },
      error: () => { this.loading.set(false); this.hasLoaded.set(true); }
    });
  }

  toggleSelect(ref: string): void {
    this.selectedRefs.update(refs =>
      refs.includes(ref) ? refs.filter(r => r !== ref) : [...refs, ref]
    );
  }

  unpaidFactures(): Facture[] {
    return this.factures().filter(f => !f.payee);
  }

  paySelected(): void {
    const refs = this.selectedRefs();
    if (refs.length === 0) return;

    const serviceName = this.factures().find(f => refs.includes(f.reference))?.serviceName ?? '';
    this.paying.set(true);

    this.walletApi.payFactures(this.walletPhone, serviceName, refs).subscribe({
      next: () => {
        this.toast.success(`${refs.length} facture(s) payée(s)`);
        this.paying.set(false);
        this.refreshBalance();
        this.loadFactures();
      },
      error: () => this.paying.set(false)
    });
  }

  payAll(): void {
    const unpaid = this.unpaidFactures();
    if (unpaid.length === 0) return;
    const serviceName = unpaid[0].serviceName;
    const refs = unpaid.map(f => f.reference);
    this.paying.set(true);

    this.walletApi.payFactures(this.walletPhone, serviceName, refs).subscribe({
      next: () => {
        this.toast.success('Toutes les factures ont été payées');
        this.paying.set(false);
        this.refreshBalance();
        this.loadFactures();
      },
      error: () => this.paying.set(false)
    });
  }

  private refreshBalance(): void {
    this.walletApi.getBalance(this.walletPhone).subscribe({
      next: (r) => this.store.setBalance(r.phone, r.balance, r.currency)
    });
  }
}
