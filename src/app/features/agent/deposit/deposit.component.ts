import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { WalletApiService } from '../../../core/services/wallet-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { XofPipe } from '../../../shared/pipes/xof.pipe';
import { Transaction } from '../../../core/models/wallet.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-deposit',
  standalone: true,
  imports: [ReactiveFormsModule, XofPipe, IconComponent],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Dépôt</h1>
        <p class="page-sub">Créditer un portefeuille client</p>
      </div>
    </div>

    <div class="layout">
      <div class="card" style="flex:1;max-width:460px">
        <div class="card-header">
          <span style="font-size:13px;font-weight:600">Effectuer un dépôt</span>
        </div>
        <div class="card-body">
          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="field">
              <label>ID du portefeuille</label>
              <input class="input" formControlName="walletId" type="number" placeholder="1" />
              @if (f['walletId'].touched && f['walletId'].errors?.['required']) {
                <span class="field-error">Requis</span>
              }
            </div>

            <div class="field">
              <label>Montant (XOF)</label>
              <input class="input" formControlName="amount" type="number" placeholder="10 000" min="1" />
              @if (f['amount'].touched && f['amount'].errors?.['min']) {
                <span class="field-error">Montant minimum : 1 XOF</span>
              }
            </div>

            <div class="field">
              <label>Méthode de paiement</label>
              <select class="input" formControlName="paymentMethod">
                <option value="CREDIT_CARD">Carte bancaire</option>
                <option value="WALLET_TARGET">Portefeuille source</option>
              </select>
            </div>

            <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;margin-top:4px"
              [disabled]="form.invalid || loading()">
              <app-icon name="arrow-down" [size]="14" />
              {{ loading() ? 'Traitement...' : 'Confirmer le dépôt' }}
            </button>
          </form>
        </div>
      </div>

      @if (result()) {
        <div class="receipt card">
          <div class="card-header">
            <span style="font-size:13px;font-weight:600">Reçu de transaction</span>
            <span class="badge badge-green">Confirmé</span>
          </div>
          <div class="card-body">
            <div class="receipt-rows">
              <div class="r-row">
                <span>Référence</span>
                <code>{{ result()!.reference }}</code>
              </div>
              <div class="r-row">
                <span>Montant crédité</span>
                <strong class="text-green">{{ result()!.amount | xof }}</strong>
              </div>
              <div class="r-row">
                <span>Frais</span>
                <span>{{ result()!.fees | xof }}</span>
              </div>
              <div class="r-row border-top">
                <span>Solde après</span>
                <strong>{{ result()!.balanceAfter | xof }}</strong>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    .layout { display: flex; gap: 20px; align-items: flex-start; flex-wrap: wrap; }
    .field { margin-bottom: 16px; }
    .receipt { flex: 1; min-width: 280px; }
    .receipt-rows { display: flex; flex-direction: column; gap: 0; }
    .r-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 11px 0;
      border-bottom: 1px solid var(--border);
      font-size: 13px;
      color: var(--text-2);
    }
    .r-row:last-child { border-bottom: none; }
    .r-row.border-top { border-top: 1px solid var(--border-2); margin-top: 4px; padding-top: 15px; }
    .r-row strong { color: var(--text); font-weight: 600; }
  `]
})
export class DepositComponent {
  private fb = inject(FormBuilder);
  private api = inject(WalletApiService);
  private toast = inject(ToastService);

  loading = signal(false);
  result = signal<Transaction | null>(null);

  form = this.fb.group({
    walletId:      [null as number | null, [Validators.required]],
    amount:        [null as number | null, [Validators.required, Validators.min(1)]],
    paymentMethod: ['CREDIT_CARD', Validators.required]
  });

  get f() { return this.form.controls; }

  submit(): void {
    if (this.form.invalid) return;
    const { walletId, amount, paymentMethod } = this.form.value;
    this.loading.set(true);
    this.result.set(null);
    this.api.deposit(walletId!, amount!, paymentMethod!).subscribe({
      next: (tx) => { this.result.set(tx); this.toast.success('Dépôt effectué'); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
