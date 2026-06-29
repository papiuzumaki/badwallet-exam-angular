import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { WalletApiService } from '../../../core/services/wallet-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { XofPipe } from '../../../shared/pipes/xof.pipe';
import { Transaction } from '../../../core/models/wallet.model';

@Component({
  selector: 'app-deposit',
  standalone: true,
  imports: [ReactiveFormsModule, XofPipe],
  template: `
    <div class="form-page">
      <h2>Effectuer un Dépôt</h2>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="form-group">
          <label>ID du portefeuille</label>
          <input formControlName="walletId" type="number" placeholder="1" />
          @if (f['walletId'].touched && f['walletId'].errors?.['required']) {
            <span class="error">Requis</span>
          }
        </div>

        <div class="form-group">
          <label>Montant (XOF)</label>
          <input formControlName="amount" type="number" placeholder="10000" min="1" />
          @if (f['amount'].touched && f['amount'].errors?.['required']) {
            <span class="error">Requis</span>
          }
          @if (f['amount'].touched && f['amount'].errors?.['min']) {
            <span class="error">Minimum 1 XOF</span>
          }
        </div>

        <div class="form-group">
          <label>Méthode de paiement</label>
          <select formControlName="paymentMethod">
            <option value="CREDIT_CARD">Carte de crédit</option>
            <option value="WALLET_TARGET">Autre portefeuille</option>
          </select>
        </div>

        <button type="submit" class="btn-submit" [disabled]="form.invalid || loading">
          {{ loading ? 'Traitement...' : 'Déposer' }}
        </button>
      </form>

      @if (result) {
        <div class="result-card">
          <h3>✅ Dépôt effectué</h3>
          <div class="row"><span>Référence</span><code>{{ result.reference }}</code></div>
          <div class="row"><span>Montant</span><strong>{{ result.amount | xof }}</strong></div>
          <div class="row"><span>Frais</span><span>{{ result.fees | xof }}</span></div>
          <div class="row"><span>Nouveau solde</span><strong class="green">{{ result.balanceAfter | xof }}</strong></div>
        </div>
      }
    </div>
  `,
  styles: [`
    .form-page { max-width: 500px; margin: 0 auto; }
    h2 { color: #e94560; margin-bottom: 1.5rem; }
    .form-group { margin-bottom: 1rem; }
    label { display: block; color: #aaa; font-size: .85rem; margin-bottom: .35rem; }
    input, select {
      width: 100%; padding: .7rem; background: #0f3460;
      border: 1px solid #1a1a2e; border-radius: 8px; color: #eee;
      font-size: .95rem; box-sizing: border-box;
    }
    .error { color: #e94560; font-size: .8rem; }
    .btn-submit {
      width: 100%; padding: .85rem; background: #2ecc71; border: none;
      color: #fff; border-radius: 8px; cursor: pointer; font-weight: 600;
      margin-top: .5rem; font-size: 1rem;
    }
    .btn-submit:disabled { opacity: .5; cursor: not-allowed; }
    .result-card {
      margin-top: 1.5rem; background: #0f3460; border-radius: 10px; padding: 1.25rem;
      border-left: 4px solid #2ecc71;
    }
    h3 { color: #2ecc71; margin-bottom: 1rem; }
    .row { display: flex; justify-content: space-between; padding: .4rem 0; color: #ccc; font-size: .9rem; }
    .row code { color: #e94560; background: #1a1a2e; padding: .15rem .4rem; border-radius: 4px; }
    .green { color: #2ecc71 !important; font-weight: 700; }
  `]
})
export class DepositComponent {
  private fb = inject(FormBuilder);
  private api = inject(WalletApiService);
  private toast = inject(ToastService);

  loading = false;
  result: Transaction | null = null;

  form = this.fb.group({
    walletId: [null as number | null, [Validators.required, Validators.min(1)]],
    amount: [null as number | null, [Validators.required, Validators.min(1)]],
    paymentMethod: ['CREDIT_CARD', Validators.required]
  });

  get f() { return this.form.controls; }

  submit(): void {
    if (this.form.invalid) return;
    const { walletId, amount, paymentMethod } = this.form.value;
    this.loading = true;
    this.result = null;

    this.api.deposit(walletId!, amount!, paymentMethod!).subscribe({
      next: (tx) => {
        this.result = tx;
        this.toast.success('Dépôt effectué avec succès');
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }
}
