import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { WalletApiService } from '../../../core/services/wallet-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { phoneValidator } from '../../../shared/validators/wallet.validators';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-create-wallet',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Nouveau portefeuille</h1>
        <p class="page-sub">Créer un compte client BadWallet</p>
      </div>
    </div>

    <div class="card" style="max-width:520px">
      <div class="card-body">
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="field">
            <label>Numéro de téléphone</label>
            <input class="input" [class.error]="touched('phoneNumber') && invalid('phoneNumber')"
              formControlName="phoneNumber" placeholder="771234567" />
            @if (touched('phoneNumber') && f['phoneNumber'].errors?.['required']) {
              <span class="field-error">Requis</span>
            }
            @if (touched('phoneNumber') && f['phoneNumber'].errors?.['invalidPhone']) {
              <span class="field-error">Format invalide — ex: 771234567</span>
            }
          </div>

          <div class="field">
            <label>Adresse email</label>
            <input class="input" [class.error]="touched('email') && invalid('email')"
              formControlName="email" placeholder="client@example.com" type="email" />
            @if (touched('email') && f['email'].errors?.['required']) {
              <span class="field-error">Requis</span>
            }
            @if (touched('email') && f['email'].errors?.['email']) {
              <span class="field-error">Email invalide</span>
            }
          </div>

          <div class="two-col">
            <div class="field">
              <label>Solde initial</label>
              <input class="input" formControlName="initialBalance" type="number" placeholder="0" min="0" />
            </div>
            <div class="field">
              <label>Devise</label>
              <select class="input" formControlName="currency">
                <option value="XOF">XOF — Franc CFA BCEAO</option>
                <option value="XAF">XAF — Franc CFA BEAC</option>
                <option value="EUR">EUR — Euro</option>
              </select>
            </div>
          </div>

          <div class="form-actions">
            <a routerLink="/agent/wallets" class="btn btn-ghost">Annuler</a>
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || loading()">
              @if (loading()) { Création en cours... }
              @else { Créer le portefeuille }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .field { margin-bottom: 16px; }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 8px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
    }
  `]
})
export class CreateWalletComponent {
  private fb = inject(FormBuilder);
  private api = inject(WalletApiService);
  private toast = inject(ToastService);
  private router = inject(Router);

  loading = signal(false);

  form = this.fb.group({
    phoneNumber:    ['', [Validators.required, phoneValidator()]],
    email:          ['', [Validators.required, Validators.email]],
    initialBalance: [0,  [Validators.required, Validators.min(0)]],
    currency:       ['XOF', Validators.required]
  });

  get f() { return this.form.controls; }
  touched(k: string) { return this.form.get(k)?.touched; }
  invalid(k: string)  { return this.form.get(k)?.invalid; }

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.api.createWallet(this.form.value as any).subscribe({
      next: (w) => {
        this.toast.success(`Portefeuille ${w.code} créé`);
        this.router.navigate(['/agent/wallets']);
      },
      error: () => this.loading.set(false)
    });
  }
}
