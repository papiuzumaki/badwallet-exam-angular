import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { WalletApiService } from '../../../core/services/wallet-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { XofPipe } from '../../../shared/pipes/xof.pipe';
import { Transaction } from '../../../core/models/wallet.model';
import { phoneValidator } from '../../../shared/validators/wallet.validators';

@Component({
  selector: 'app-withdraw',
  standalone: true,
  imports: [ReactiveFormsModule, XofPipe],
  template: `
    <div class="form-page">
      <h2>Effectuer un Retrait</h2>
      <p class="info">Frais de retrait : 1% (plafonné à 5 000 XOF)</p>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="form-group">
          <label>Numéro de téléphone</label>
          <input formControlName="phoneNumber" placeholder="771234567" />
          @if (f['phoneNumber'].touched && f['phoneNumber'].errors?.['required']) {
            <span class="error">Requis</span>
          }
          @if (f['phoneNumber'].touched && f['phoneNumber'].errors?.['invalidPhone']) {
            <span class="error">Format invalide</span>
          }
        </div>

        <div class="form-group">
          <label>Montant à retirer (XOF)</label>
          <input formControlName="amount" type="number" placeholder="5000" min="1" />
          @if (f['amount'].touched && f['amount'].errors?.['required']) {
            <span class="error">Requis</span>
          }
        </div>

        <button type="submit" class="btn-submit" [disabled]="form.invalid || loading">
          {{ loading ? 'Traitement...' : 'Retirer' }}
        </button>
      </form>

      @if (result) {
        <div class="result-card">
          <h3>✅ Retrait effectué</h3>
          <div class="row"><span>Référence</span><code>{{ result.reference }}</code></div>
          <div class="row"><span>Montant</span><strong>{{ result.amount | xof }}</strong></div>
          <div class="row"><span>Frais (1%)</span><span class="red">{{ result.fees | xof }}</span></div>
          <div class="row"><span>Solde avant</span><span>{{ result.balanceBefore | xof }}</span></div>
          <div class="row"><span>Solde après</span><strong class="green">{{ result.balanceAfter | xof }}</strong></div>
        </div>
      }
    </div>
  `,
  styles: [`
    .form-page { max-width: 500px; margin: 0 auto; }
    h2 { color: #e94560; margin-bottom: .5rem; }
    .info { color: #aaa; font-size: .85rem; margin-bottom: 1.5rem; }
    .form-group { margin-bottom: 1rem; }
    label { display: block; color: #aaa; font-size: .85rem; margin-bottom: .35rem; }
    input {
      width: 100%; padding: .7rem; background: #0f3460;
      border: 1px solid #1a1a2e; border-radius: 8px; color: #eee;
      font-size: .95rem; box-sizing: border-box;
    }
    .error { color: #e94560; font-size: .8rem; }
    .btn-submit {
      width: 100%; padding: .85rem; background: #e67e22; border: none;
      color: #fff; border-radius: 8px; cursor: pointer; font-weight: 600;
      margin-top: .5rem; font-size: 1rem;
    }
    .btn-submit:disabled { opacity: .5; cursor: not-allowed; }
    .result-card {
      margin-top: 1.5rem; background: #0f3460; border-radius: 10px; padding: 1.25rem;
      border-left: 4px solid #e67e22;
    }
    h3 { color: #e67e22; margin-bottom: 1rem; }
    .row { display: flex; justify-content: space-between; padding: .4rem 0; color: #ccc; font-size: .9rem; }
    code { color: #e94560; background: #1a1a2e; padding: .15rem .4rem; border-radius: 4px; }
    .green { color: #2ecc71 !important; font-weight: 700; }
    .red { color: #e74c3c; }
  `]
})
export class WithdrawComponent {
  private fb = inject(FormBuilder);
  private api = inject(WalletApiService);
  private toast = inject(ToastService);

  loading = false;
  result: Transaction | null = null;

  form = this.fb.group({
    phoneNumber: ['', [Validators.required, phoneValidator()]],
    amount: [null as number | null, [Validators.required, Validators.min(1)]]
  });

  get f() { return this.form.controls; }

  submit(): void {
    if (this.form.invalid) return;
    const { phoneNumber, amount } = this.form.value;
    this.loading = true;
    this.result = null;

    this.api.withdraw(phoneNumber!, amount!).subscribe({
      next: (tx) => {
        this.result = tx;
        this.toast.success('Retrait effectué avec succès');
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }
}
