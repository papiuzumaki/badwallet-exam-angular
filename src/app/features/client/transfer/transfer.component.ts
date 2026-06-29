import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { WalletApiService } from '../../../core/services/wallet-api.service';
import { BalanceStore } from '../../../core/store/balance.store';
import { ToastService } from '../../../core/services/toast.service';
import { XofPipe } from '../../../shared/pipes/xof.pipe';
import { phoneValidator, differentPhoneValidator } from '../../../shared/validators/wallet.validators';
import { Transaction } from '../../../core/models/wallet.model';

@Component({
  selector: 'app-transfer',
  standalone: true,
  imports: [ReactiveFormsModule, XofPipe],
  template: `
    <div class="form-page">
      <h2>Effectuer un Transfert</h2>

      <div class="balance-info">
        Solde disponible : <strong>{{ store.balance() | xof: store.currency() }}</strong>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="form-group">
          <label>Expéditeur (votre numéro)</label>
          <input formControlName="senderPhone" placeholder="771234567" readonly />
        </div>

        <div class="form-group">
          <label>Destinataire</label>
          <input formControlName="receiverPhone" placeholder="781234567" />
          @if (f['receiverPhone'].touched && f['receiverPhone'].errors?.['required']) {
            <span class="error">Requis</span>
          }
          @if (f['receiverPhone'].touched && f['receiverPhone'].errors?.['invalidPhone']) {
            <span class="error">Format invalide (ex: 781234567)</span>
          }
          @if (f['receiverPhone'].touched && f['receiverPhone'].errors?.['samePhone']) {
            <span class="error">Le destinataire doit être différent de l'expéditeur</span>
          }
        </div>

        <div class="form-group">
          <label>Montant (XOF)</label>
          <input formControlName="amount" type="number" placeholder="5000" min="1" />
          @if (f['amount'].touched && f['amount'].errors?.['required']) {
            <span class="error">Requis</span>
          }
          @if (f['amount'].touched && f['amount'].errors?.['min']) {
            <span class="error">Minimum 1 XOF</span>
          }
        </div>

        <button type="submit" class="btn-submit" [disabled]="form.invalid || loading">
          {{ loading ? 'Traitement...' : 'Transférer' }}
        </button>
      </form>

      @if (results.length > 0) {
        <div class="result-card">
          <h3>✅ Transfert effectué</h3>
          @for (tx of results; track tx.id) {
            <div class="tx-block">
              <div class="row"><span>Type</span><span class="badge">{{ tx.type }}</span></div>
              <div class="row"><span>Montant</span><strong>{{ tx.amount | xof }}</strong></div>
              <div class="row"><span>Nouveau solde</span><strong class="green">{{ tx.balanceAfter | xof }}</strong></div>
              <div class="row"><span>Réf.</span><code>{{ tx.reference }}</code></div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .form-page { max-width: 500px; margin: 0 auto; }
    h2 { color: #e94560; margin-bottom: .75rem; }
    .balance-info {
      background: #0f3460; border-radius: 8px; padding: .75rem 1rem;
      color: #aaa; font-size: .9rem; margin-bottom: 1.5rem;
    }
    .balance-info strong { color: #2ecc71; }
    .form-group { margin-bottom: 1rem; }
    label { display: block; color: #aaa; font-size: .85rem; margin-bottom: .35rem; }
    input {
      width: 100%; padding: .7rem; background: #0f3460;
      border: 1px solid #1a1a2e; border-radius: 8px; color: #eee;
      font-size: .95rem; box-sizing: border-box;
    }
    input[readonly] { opacity: .6; cursor: not-allowed; }
    .error { color: #e94560; font-size: .8rem; }
    .btn-submit {
      width: 100%; padding: .85rem; background: #3498db; border: none;
      color: #fff; border-radius: 8px; cursor: pointer; font-weight: 600;
      font-size: 1rem;
    }
    .btn-submit:disabled { opacity: .5; cursor: not-allowed; }
    .result-card {
      margin-top: 1.5rem; background: #0f3460; border-radius: 10px; padding: 1.25rem;
      border-left: 4px solid #3498db;
    }
    h3 { color: #3498db; margin-bottom: 1rem; }
    .tx-block { margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #1a1a2e; }
    .tx-block:last-child { border-bottom: none; margin-bottom: 0; }
    .row { display: flex; justify-content: space-between; padding: .35rem 0; color: #ccc; font-size: .9rem; }
    .badge {
      background: #1a2a4a; color: #3498db;
      padding: .15rem .5rem; border-radius: 4px; font-size: .8rem;
    }
    code { color: #e94560; background: #1a1a2e; padding: .15rem .4rem; border-radius: 4px; }
    .green { color: #2ecc71 !important; }
  `]
})
export class TransferComponent {
  private fb = inject(FormBuilder);
  private api = inject(WalletApiService);
  private auth = inject(AuthService);
  store = inject(BalanceStore);
  private toast = inject(ToastService);

  loading = false;
  results: Transaction[] = [];

  form = this.fb.group({
    senderPhone: [{ value: this.auth.phone(), disabled: true }],
    receiverPhone: ['', [Validators.required, phoneValidator(), differentPhoneValidator('senderPhone')]],
    amount: [null as number | null, [Validators.required, Validators.min(1)]]
  });

  get f() { return this.form.controls; }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.results = [];

    const sender = this.auth.phone();
    const { receiverPhone, amount } = this.form.getRawValue();

    this.api.transfer(sender, receiverPhone!, amount!).subscribe({
      next: (txs) => {
        this.results = txs;
        const senderTx = txs.find(t => t.type === 'TRANSFER_SEND');
        if (senderTx) this.store.setBalance(sender, senderTx.balanceAfter);
        this.toast.success('Transfert effectué avec succès');
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }
}
