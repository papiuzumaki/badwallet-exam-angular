import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { WalletApiService } from '../../../core/services/wallet-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { XofPipe } from '../../../shared/pipes/xof.pipe';
import { Transaction } from '../../../core/models/wallet.model';
import { phoneValidator } from '../../../shared/validators/wallet.validators';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-withdraw',
  standalone: true,
  imports: [ReactiveFormsModule, XofPipe, IconComponent],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Retrait</h1>
        <p class="page-sub">Frais : 1% du montant, plafonné à 5 000 XOF</p>
      </div>
    </div>

    <div class="layout">
      <div class="card" style="flex:1;max-width:460px">
        <div class="card-header">
          <span style="font-size:13px;font-weight:600">Effectuer un retrait</span>
        </div>
        <div class="card-body">
          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="field">
              <label>Numéro de téléphone</label>
              <input class="input" [class.error]="touched('phoneNumber') && invalid('phoneNumber')"
                formControlName="phoneNumber" placeholder="771234567" />
              @if (touched('phoneNumber') && f['phoneNumber'].errors?.['invalidPhone']) {
                <span class="field-error">Format invalide — ex: 771234567</span>
              }
            </div>

            <div class="field">
              <label>Montant à retirer (XOF)</label>
              <input class="input" formControlName="amount" type="number" placeholder="5 000" min="1" />
              @if (f['amount'].touched && f['amount'].errors?.['min']) {
                <span class="field-error">Montant minimum : 1 XOF</span>
              }
            </div>

            <div class="fee-info">
              <app-icon name="info" [size]="13" />
              <span>Frais estimés : {{ estimatedFees() | xof }}</span>
            </div>

            <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;margin-top:12px"
              [disabled]="form.invalid || loading()">
              <app-icon name="arrow-up" [size]="14" />
              {{ loading() ? 'Traitement...' : 'Confirmer le retrait' }}
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
              <div class="r-row"><span>Référence</span><code>{{ result()!.reference }}</code></div>
              <div class="r-row"><span>Montant retiré</span><strong>{{ result()!.amount | xof }}</strong></div>
              <div class="r-row"><span>Frais (1%)</span><span class="text-red">{{ result()!.fees | xof }}</span></div>
              <div class="r-row"><span>Solde avant</span><span>{{ result()!.balanceBefore | xof }}</span></div>
              <div class="r-row border-top"><span>Solde après</span><strong class="text-green">{{ result()!.balanceAfter | xof }}</strong></div>
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
    .fee-info {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 12px;
      color: var(--text-3);
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 9px 12px;
    }
    .receipt { flex: 1; min-width: 280px; }
    .receipt-rows { display: flex; flex-direction: column; }
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
    .r-row.border-top { border-top: 1px solid var(--border-2); margin-top: 4px; }
    .r-row strong { color: var(--text); font-weight: 600; }
  `]
})
export class WithdrawComponent {
  private fb = inject(FormBuilder);
  private api = inject(WalletApiService);
  private toast = inject(ToastService);

  loading = signal(false);
  result = signal<Transaction | null>(null);

  form = this.fb.group({
    phoneNumber: ['', [Validators.required, phoneValidator()]],
    amount:      [null as number | null, [Validators.required, Validators.min(1)]]
  });

  get f() { return this.form.controls; }
  touched(k: string) { return this.form.get(k)?.touched; }
  invalid(k: string)  { return this.form.get(k)?.invalid; }

  estimatedFees(): number {
    const amt = this.form.value.amount ?? 0;
    return Math.min(amt * 0.01, 5000);
  }

  submit(): void {
    if (this.form.invalid) return;
    const { phoneNumber, amount } = this.form.value;
    this.loading.set(true);
    this.result.set(null);
    this.api.withdraw(phoneNumber!, amount!).subscribe({
      next: (tx) => { this.result.set(tx); this.toast.success('Retrait effectué'); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
