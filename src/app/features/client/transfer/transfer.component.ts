import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { WalletApiService } from '../../../core/services/wallet-api.service';
import { BalanceStore } from '../../../core/store/balance.store';
import { ToastService } from '../../../core/services/toast.service';
import { XofPipe } from '../../../shared/pipes/xof.pipe';
import { phoneValidator, differentPhoneValidator } from '../../../shared/validators/wallet.validators';
import { Transaction } from '../../../core/models/wallet.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-transfer',
  standalone: true,
  imports: [ReactiveFormsModule, XofPipe, IconComponent],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Transfert</h1>
        <p class="page-sub">Envoyer de l'argent vers un autre compte</p>
      </div>
    </div>

    <div class="layout">
      <div class="card" style="flex:1;max-width:480px">
        <div class="card-header">
          <span style="font-size:13px;font-weight:600">Nouveau transfert</span>
          <span style="font-size:12px;color:var(--text-3)">Solde : <strong style="color:var(--green)">{{ store.balance() | xof: store.currency() }}</strong></span>
        </div>
        <div class="card-body">
          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="field">
              <label>Expéditeur</label>
              <input class="input" formControlName="senderPhone" readonly />
            </div>

            <div class="field">
              <label>Destinataire</label>
              <input class="input" [class.error]="touched('receiverPhone') && invalid('receiverPhone')"
                formControlName="receiverPhone" placeholder="781234567" />
              @if (touched('receiverPhone') && f['receiverPhone'].errors?.['invalidPhone']) {
                <span class="field-error">Format invalide — ex: 781234567</span>
              }
              @if (touched('receiverPhone') && f['receiverPhone'].errors?.['samePhone']) {
                <span class="field-error">Le destinataire doit être différent de l'expéditeur</span>
              }
            </div>

            <div class="field">
              <label>Montant (XOF)</label>
              <input class="input" formControlName="amount" type="number" placeholder="5 000" min="1" />
              @if (f['amount'].touched && f['amount'].errors?.['min']) {
                <span class="field-error">Montant minimum : 1 XOF</span>
              }
            </div>

            <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center"
              [disabled]="form.invalid || loading()">
              <app-icon name="transfer" [size]="14" />
              {{ loading() ? 'Traitement...' : 'Envoyer le transfert' }}
            </button>
          </form>
        </div>
      </div>

      @if (results().length > 0) {
        <div class="card" style="flex:1;min-width:260px">
          <div class="card-header">
            <span style="font-size:13px;font-weight:600">Confirmation</span>
            <span class="badge badge-green">Effectué</span>
          </div>
          <div class="card-body">
            @for (tx of results(); track tx.id) {
              <div class="tx-block">
                <div class="tb-header">
                  <span class="badge" [class]="tx.type === 'TRANSFER_SEND' ? 'badge badge-blue' : 'badge badge-green'">
                    {{ tx.type === 'TRANSFER_SEND' ? 'Débit' : 'Crédit' }}
                  </span>
                </div>
                <div class="r-row"><span>Montant</span><strong>{{ tx.amount | xof }}</strong></div>
                <div class="r-row"><span>Solde après</span><strong class="text-green">{{ tx.balanceAfter | xof }}</strong></div>
                <div class="r-row"><span>Référence</span><code>{{ tx.reference }}</code></div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    .layout { display: flex; gap: 20px; align-items: flex-start; flex-wrap: wrap; }
    .field { margin-bottom: 16px; }
    .tx-block { margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
    .tx-block:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .tb-header { margin-bottom: 10px; }
    .r-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid var(--border);
      font-size: 13px;
      color: var(--text-2);
    }
    .r-row:last-child { border-bottom: none; }
    .r-row strong { color: var(--text); font-weight: 600; }
  `]
})
export class TransferComponent {
  private fb = inject(FormBuilder);
  private api = inject(WalletApiService);
  private auth = inject(AuthService);
  store = inject(BalanceStore);
  private toast = inject(ToastService);

  loading = signal(false);
  results = signal<Transaction[]>([]);

  form = this.fb.group({
    senderPhone:   [{ value: this.auth.phone(), disabled: true }],
    receiverPhone: ['', [Validators.required, phoneValidator(), differentPhoneValidator('senderPhone')]],
    amount:        [null as number | null, [Validators.required, Validators.min(1)]]
  });

  get f() { return this.form.controls; }
  touched(k: string) { return this.form.get(k)?.touched; }
  invalid(k: string)  { return this.form.get(k)?.invalid; }

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true); this.results.set([]);
    const sender = this.auth.phone();
    const { receiverPhone, amount } = this.form.getRawValue();
    this.api.transfer(sender, receiverPhone!, amount!).subscribe({
      next: (txs) => {
        this.results.set(txs);
        const s = txs.find(t => t.type === 'TRANSFER_SEND');
        if (s) this.store.setBalance(sender, s.balanceAfter);
        this.toast.success('Transfert effectué avec succès');
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
