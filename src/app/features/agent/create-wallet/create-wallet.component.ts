import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { WalletApiService } from '../../../core/services/wallet-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { phoneValidator } from '../../../shared/validators/wallet.validators';

@Component({
  selector: 'app-create-wallet',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="form-page">
      <h2>Créer un portefeuille</h2>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="form-group">
          <label>Numéro de téléphone</label>
          <input formControlName="phoneNumber" placeholder="771234567" />
          @if (f['phoneNumber'].touched && f['phoneNumber'].errors?.['required']) {
            <span class="error">Requis</span>
          }
          @if (f['phoneNumber'].touched && f['phoneNumber'].errors?.['invalidPhone']) {
            <span class="error">Format invalide (ex: 771234567)</span>
          }
        </div>

        <div class="form-group">
          <label>Email</label>
          <input formControlName="email" placeholder="client@mail.com" type="email" />
          @if (f['email'].touched && f['email'].errors?.['required']) {
            <span class="error">Requis</span>
          }
          @if (f['email'].touched && f['email'].errors?.['email']) {
            <span class="error">Email invalide</span>
          }
        </div>

        <div class="form-group">
          <label>Solde initial (XOF)</label>
          <input formControlName="initialBalance" type="number" placeholder="0" min="0" />
          @if (f['initialBalance'].touched && f['initialBalance'].errors?.['required']) {
            <span class="error">Requis</span>
          }
          @if (f['initialBalance'].touched && f['initialBalance'].errors?.['min']) {
            <span class="error">Doit être ≥ 0</span>
          }
        </div>

        <div class="form-group">
          <label>Devise</label>
          <select formControlName="currency">
            <option value="XOF">XOF</option>
            <option value="XAF">XAF</option>
            <option value="EUR">EUR</option>
          </select>
        </div>

        <div class="actions">
          <button type="button" class="btn-cancel" routerLink="/agent/wallets">Annuler</button>
          <button type="submit" class="btn-submit" [disabled]="form.invalid || loading">
            {{ loading ? 'Création...' : 'Créer le portefeuille' }}
          </button>
        </div>
      </form>
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
    input:focus, select:focus { outline: none; border-color: #e94560; }
    .error { color: #e94560; font-size: .8rem; }
    .actions { display: flex; gap: 1rem; margin-top: 1.5rem; }
    .btn-cancel {
      flex: 1; padding: .75rem; background: #1a1a2e; border: 1px solid #333;
      color: #aaa; border-radius: 8px; cursor: pointer;
    }
    .btn-submit {
      flex: 2; padding: .75rem; background: #e94560; border: none;
      color: #fff; border-radius: 8px; cursor: pointer; font-weight: 600;
    }
    .btn-submit:disabled { opacity: .5; cursor: not-allowed; }
  `]
})
export class CreateWalletComponent {
  private fb = inject(FormBuilder);
  private api = inject(WalletApiService);
  private toast = inject(ToastService);
  private router = inject(Router);

  loading = false;

  form = this.fb.group({
    phoneNumber: ['', [Validators.required, phoneValidator()]],
    email: ['', [Validators.required, Validators.email]],
    initialBalance: [0, [Validators.required, Validators.min(0)]],
    currency: ['XOF', Validators.required]
  });

  get f() { return this.form.controls; }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.api.createWallet(this.form.value as any).subscribe({
      next: (w) => {
        this.toast.success(`Portefeuille ${w.code} créé avec succès`);
        this.router.navigate(['/agent/wallets']);
      },
      error: () => { this.loading = false; }
    });
  }
}
