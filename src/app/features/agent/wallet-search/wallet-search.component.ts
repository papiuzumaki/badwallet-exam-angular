import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { WalletApiService } from '../../../core/services/wallet-api.service';
import { XofPipe } from '../../../shared/pipes/xof.pipe';
import { Wallet, Transaction, WalletStats } from '../../../core/models/wallet.model';
import { phoneValidator } from '../../../shared/validators/wallet.validators';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-wallet-search',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, XofPipe, IconComponent],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Rechercher un portefeuille</h1>
        <p class="page-sub">Consultation par numéro de téléphone</p>
      </div>
    </div>

    <form [formGroup]="form" (ngSubmit)="search()">
      <div class="search-bar">
        <app-icon name="search" [size]="15" class="search-ico" />
        <input
          class="search-input"
          formControlName="phone"
          placeholder="Numéro de téléphone — ex: 771234567"
          autocomplete="tel"
        />
        <button type="submit" class="btn btn-primary btn-sm" [disabled]="form.invalid || loading()">
          {{ loading() ? '...' : 'Rechercher' }}
        </button>
      </div>
      @if (form.get('phone')?.touched && form.get('phone')?.errors?.['invalidPhone']) {
        <span class="field-error" style="margin-top:6px;display:block">Format invalide — ex: 771234567</span>
      }
    </form>

    @if (notFound()) {
      <div class="card" style="margin-top:20px">
        <div class="empty-state">
          <app-icon name="search" [size]="28" />
          <p>Aucun portefeuille trouvé pour ce numéro</p>
        </div>
      </div>
    }

    @if (wallet()) {
      <div class="result-grid">
        <!-- Identity card -->
        <div class="card span-2">
          <div class="card-header">
            <span style="font-size:13px;font-weight:600">Informations du portefeuille</span>
            <code>{{ wallet()!.code }}</code>
          </div>
          <div class="card-body info-grid">
            <div class="info-item">
              <span class="info-label">Téléphone</span>
              <span class="info-value">{{ wallet()!.phoneNumber }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Email</span>
              <span class="info-value">{{ wallet()!.email }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Solde actuel</span>
              <span class="info-value text-green" style="font-size:18px;font-weight:700">{{ wallet()!.balance | xof: wallet()!.currency }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Devise</span>
              <span class="info-value"><span class="badge badge-gray">{{ wallet()!.currency }}</span></span>
            </div>
            <div class="info-item">
              <span class="info-label">Membre depuis</span>
              <span class="info-value">{{ wallet()!.createdAt | date:'dd MMMM yyyy' }}</span>
            </div>
          </div>
        </div>

        @if (stats()) {
          <div class="card">
            <div class="card-header"><span style="font-size:13px;font-weight:600">Statistiques</span></div>
            <div class="card-body stat-list">
              <div class="stat-row">
                <span>Total transactions</span>
                <strong>{{ stats()!.totalTransactions }}</strong>
              </div>
              <div class="stat-row">
                <span>Déposé</span>
                <strong class="text-green">{{ stats()!.totalDepose | xof }}</strong>
              </div>
              <div class="stat-row">
                <span>Retiré</span>
                <strong class="text-red">{{ stats()!.totalRetire | xof }}</strong>
              </div>
              <div class="stat-row">
                <span>Transféré</span>
                <strong>{{ stats()!.totalTransfere | xof }}</strong>
              </div>
              <div class="stat-row">
                <span>Factures payées</span>
                <strong>{{ stats()!.totalPaye | xof }}</strong>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><span style="font-size:13px;font-weight:600">Dernières transactions</span></div>
            @if (transactions().length === 0) {
              <div class="empty-state" style="padding:30px">
                <app-icon name="history" [size]="22" /><p>Aucune transaction</p>
              </div>
            }
            @for (tx of transactions().slice(0, 8); track tx.id) {
              <div class="tx-row">
                <span class="badge" [class]="txBadge(tx.type)">{{ typeLabel(tx.type) }}</span>
                <span class="tx-desc">{{ tx.description }}</span>
                <span class="tx-amt">{{ tx.amount | xof }}</span>
              </div>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .page-header { margin-bottom: 20px; }

    .search-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 0 12px;
      margin-bottom: 4px;
    }
    .search-ico { color: var(--text-3); flex-shrink: 0; }
    .search-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: var(--text);
      font-size: 13.5px;
      padding: 10px 0;
    }
    .search-input::placeholder { color: var(--text-3); }

    .result-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-top: 20px;
    }
    .span-2 { grid-column: 1 / -1; }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }
    .info-item { display: flex; flex-direction: column; gap: 4px; }
    .info-label { font-size: 11px; font-weight: 600; color: var(--text-3); text-transform: uppercase; letter-spacing: .06em; }
    .info-value { font-size: 14px; color: var(--text); font-weight: 500; }

    .stat-list { display: flex; flex-direction: column; gap: 0; padding: 0; }
    .stat-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 20px;
      border-bottom: 1px solid var(--border);
      font-size: 13px;
      color: var(--text-2);
    }
    .stat-row:last-child { border-bottom: none; }
    .stat-row strong { color: var(--text); font-weight: 600; }

    .tx-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 20px;
      border-bottom: 1px solid var(--border);
      font-size: 13px;
    }
    .tx-row:last-child { border-bottom: none; }
    .tx-desc { flex: 1; color: var(--text-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .tx-amt { font-weight: 600; color: var(--text); white-space: nowrap; }
  `]
})
export class WalletSearchComponent {
  private fb = inject(FormBuilder);
  private api = inject(WalletApiService);

  loading = signal(false);
  wallet  = signal<Wallet | null>(null);
  transactions = signal<Transaction[]>([]);
  stats   = signal<WalletStats | null>(null);
  notFound = signal(false);

  form = this.fb.group({ phone: ['', [Validators.required, phoneValidator()]] });

  search(): void {
    if (this.form.invalid) return;
    const phone = this.form.value.phone!;
    this.loading.set(true);
    this.wallet.set(null); this.stats.set(null);
    this.transactions.set([]); this.notFound.set(false);

    this.api.getWalletByPhone(phone).subscribe({
      next: (w) => {
        this.wallet.set(w); this.loading.set(false);
        this.api.getTransactions(phone).subscribe({ next: t => this.transactions.set(t) });
        this.api.getStats(phone).subscribe({ next: s => this.stats.set(s) });
      },
      error: () => { this.loading.set(false); this.notFound.set(true); }
    });
  }

  typeLabel(type: string): string {
    return ({ DEPOSIT:'Dépôt', WITHDRAW:'Retrait', TRANSFER_SEND:'Envoi', TRANSFER_RECEIVE:'Reçu', PAYMENT:'Paiement' } as any)[type] ?? type;
  }

  txBadge(type: string): string {
    return ({ DEPOSIT:'badge badge-green', WITHDRAW:'badge badge-red', TRANSFER_SEND:'badge badge-blue', TRANSFER_RECEIVE:'badge badge-green', PAYMENT:'badge badge-amber' } as any)[type] ?? 'badge badge-gray';
  }
}
