import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { WalletApiService } from '../../../core/services/wallet-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { XofPipe } from '../../../shared/pipes/xof.pipe';
import { Wallet, Transaction, WalletStats } from '../../../core/models/wallet.model';
import { phoneValidator } from '../../../shared/validators/wallet.validators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-wallet-search',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, XofPipe],
  template: `
    <div class="page">
      <h2>Consulter un portefeuille</h2>

      <form [formGroup]="form" (ngSubmit)="search()">
        <div class="search-row">
          <input
            formControlName="phone"
            placeholder="Numéro de téléphone (ex: 771234567)"
            [class.invalid]="form.get('phone')?.touched && form.get('phone')?.invalid"
          />
          <button type="submit" [disabled]="form.invalid || loading()">
            {{ loading() ? '...' : 'Rechercher' }}
          </button>
        </div>
        @if (form.get('phone')?.touched && form.get('phone')?.errors?.['invalidPhone']) {
          <span class="error">Format invalide (ex: 771234567)</span>
        }
      </form>

      @if (wallet()) {
        <div class="result">
          <div class="info-grid">
            <div class="info-card">
              <div class="label">Code portefeuille</div>
              <div class="value code">{{ wallet()!.code }}</div>
            </div>
            <div class="info-card">
              <div class="label">Téléphone</div>
              <div class="value">{{ wallet()!.phoneNumber }}</div>
            </div>
            <div class="info-card">
              <div class="label">Email</div>
              <div class="value">{{ wallet()!.email }}</div>
            </div>
            <div class="info-card highlight">
              <div class="label">Solde</div>
              <div class="value green">{{ wallet()!.balance | xof: wallet()!.currency }}</div>
            </div>
            <div class="info-card">
              <div class="label">Devise</div>
              <div class="value">{{ wallet()!.currency }}</div>
            </div>
            <div class="info-card">
              <div class="label">Créé le</div>
              <div class="value">{{ wallet()!.createdAt | date:'dd/MM/yyyy' }}</div>
            </div>
          </div>

          @if (stats()) {
            <div class="stats-section">
              <h3>Statistiques</h3>
              <div class="stats-row">
                <div class="stat"><span class="sl">Transactions</span><strong>{{ stats()!.totalTransactions }}</strong></div>
                <div class="stat"><span class="sl">Déposé</span><strong class="g">{{ stats()!.totalDepose | xof }}</strong></div>
                <div class="stat"><span class="sl">Retiré</span><strong class="r">{{ stats()!.totalRetire | xof }}</strong></div>
                <div class="stat"><span class="sl">Transféré</span><strong class="b">{{ stats()!.totalTransfere | xof }}</strong></div>
                <div class="stat"><span class="sl">Factures</span><strong class="o">{{ stats()!.totalPaye | xof }}</strong></div>
              </div>
            </div>
          }

          @if (transactions().length > 0) {
            <div class="tx-section">
              <h3>Dernières transactions ({{ transactions().length }})</h3>
              @for (tx of transactions().slice(0, 10); track tx.id) {
                <div class="tx-row">
                  <span class="badge" [class]="tx.type.toLowerCase()">{{ typeLabel(tx.type) }}</span>
                  <span class="desc">{{ tx.description }}</span>
                  <span class="amount">{{ tx.amount | xof }}</span>
                  <span class="date">{{ tx.createdAt | date:'dd/MM HH:mm' }}</span>
                </div>
              }
            </div>
          }
        </div>
      }

      @if (notFound()) {
        <div class="not-found">Aucun portefeuille trouvé pour ce numéro.</div>
      }
    </div>
  `,
  styles: [`
    .page h2 { color: #e94560; margin-bottom: 1.5rem; }
    h3 { color: #aaa; margin-bottom: .75rem; font-size: .95rem; }
    .search-row { display: flex; gap: .75rem; }
    input {
      flex: 1; padding: .7rem 1rem; background: #0f3460;
      border: 1px solid #1a1a2e; border-radius: 8px; color: #eee; font-size: .95rem;
    }
    input.invalid { border-color: #e94560; }
    button {
      padding: .7rem 1.5rem; background: #e94560; border: none;
      color: #fff; border-radius: 8px; cursor: pointer; font-weight: 600;
    }
    button:disabled { opacity: .5; cursor: not-allowed; }
    .error { color: #e94560; font-size: .8rem; }
    .result { margin-top: 1.5rem; }
    .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.25rem; }
    .info-card {
      background: #0f3460; border-radius: 10px; padding: 1rem 1.25rem;
      border-left: 3px solid #1a1a2e;
    }
    .info-card.highlight { border-left-color: #2ecc71; }
    .label { color: #666; font-size: .78rem; text-transform: uppercase; letter-spacing: .05em; margin-bottom: .3rem; }
    .value { color: #eee; font-size: 1rem; font-weight: 600; }
    .value.code { color: #e94560; font-family: monospace; font-size: 1.1rem; }
    .value.green { color: #2ecc71; font-size: 1.2rem; }
    .stats-section {
      background: #0f3460; border-radius: 10px; padding: 1rem 1.25rem; margin-bottom: 1.25rem;
    }
    .stats-row { display: flex; gap: 1.5rem; flex-wrap: wrap; }
    .stat { display: flex; flex-direction: column; gap: .2rem; }
    .sl { color: #666; font-size: .78rem; text-transform: uppercase; }
    .stat strong { color: #eee; font-size: 1rem; }
    .stat strong.g { color: #2ecc71; }
    .stat strong.r { color: #e74c3c; }
    .stat strong.b { color: #3498db; }
    .stat strong.o { color: #e67e22; }
    .tx-section { background: #0f3460; border-radius: 10px; padding: 1rem 1.25rem; }
    .tx-row {
      display: flex; align-items: center; gap: .75rem;
      padding: .5rem 0; border-top: 1px solid #1a1a2e; font-size: .87rem;
    }
    .badge {
      padding: .18rem .55rem; border-radius: 20px;
      font-size: .72rem; font-weight: 600; white-space: nowrap;
    }
    .badge.deposit { background: #1b4332; color: #2ecc71; }
    .badge.withdraw { background: #4a1c1c; color: #e74c3c; }
    .badge.transfer_send { background: #1a2a4a; color: #3498db; }
    .badge.transfer_receive { background: #1c3a2a; color: #27ae60; }
    .badge.payment { background: #3d2b1a; color: #e67e22; }
    .desc { flex: 1; color: #ccc; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .amount { font-weight: 600; color: #eee; white-space: nowrap; }
    .date { color: #666; font-size: .8rem; white-space: nowrap; }
    .not-found { margin-top: 1.5rem; text-align: center; color: #aaa; background: #0f3460; border-radius: 10px; padding: 2rem; }
  `]
})
export class WalletSearchComponent {
  private fb = inject(FormBuilder);
  private api = inject(WalletApiService);
  private toast = inject(ToastService);

  loading = signal(false);
  wallet = signal<Wallet | null>(null);
  transactions = signal<Transaction[]>([]);
  stats = signal<WalletStats | null>(null);
  notFound = signal(false);

  form = this.fb.group({
    phone: ['', [Validators.required, phoneValidator()]]
  });

  search(): void {
    if (this.form.invalid) return;
    const phone = this.form.value.phone!;
    this.loading.set(true);
    this.wallet.set(null);
    this.transactions.set([]);
    this.stats.set(null);
    this.notFound.set(false);

    this.api.getWalletByPhone(phone).subscribe({
      next: (w) => {
        this.wallet.set(w);
        this.loading.set(false);
        this.api.getTransactions(phone).subscribe({ next: txs => this.transactions.set(txs) });
        this.api.getStats(phone).subscribe({ next: s => this.stats.set(s) });
      },
      error: () => {
        this.loading.set(false);
        this.notFound.set(true);
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
