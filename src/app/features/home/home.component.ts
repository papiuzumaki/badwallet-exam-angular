import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { WalletApiService } from '../../core/services/wallet-api.service';
import { BalanceStore } from '../../core/store/balance.store';
import { ToastService } from '../../core/services/toast.service';
import { phoneValidator } from '../../shared/validators/wallet.validators';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent],
  template: `
    <div class="login-shell">
      <div class="login-left">
        <div class="brand">
          <div class="logo-mark">BW</div>
          <span>BadWallet</span>
        </div>
        <div class="tagline">
          <h1>Gestion de<br>portefeuilles<br>mobile</h1>
          <p>Plateforme de gestion financière pour agents et clients. Dépôts, retraits, transferts et paiement de factures.</p>
        </div>
        <div class="features">
          <div class="feat"><app-icon name="shield" [size]="14" /><span>Transactions sécurisées</span></div>
          <div class="feat"><app-icon name="chart" [size]="14" /><span>Statistiques en temps réel</span></div>
          <div class="feat"><app-icon name="receipt" [size]="14" /><span>Paiement de factures</span></div>
        </div>
      </div>

      <div class="login-right">
        <div class="login-card">
          <div class="card-top">
            <h2>Connexion</h2>
            <p>Choisissez votre espace d'accès</p>
          </div>

          <div class="tabs">
            <button
              class="tab"
              [class.active]="mode() === 'agent'"
              (click)="mode.set('agent')"
            >Espace Agent</button>
            <button
              class="tab"
              [class.active]="mode() === 'client'"
              (click)="mode.set('client')"
            >Espace Client</button>
          </div>

          @if (mode() === 'agent') {
            <div class="agent-section">
              <p class="agent-info">
                <app-icon name="shield" [size]="14" />
                Accès réservé aux agents agréés. Gestion complète des portefeuilles.
              </p>
              <button class="btn btn-primary full" (click)="enterAsAgent()">
                Accéder à l'espace Agent
                <app-icon name="chevron" [size]="14" />
              </button>
            </div>
          }

          @if (mode() === 'client') {
            <form [formGroup]="clientForm" (ngSubmit)="enterAsClient()">
              <div class="field">
                <label>Numéro de téléphone</label>
                <input
                  class="input"
                  [class.error]="f['phone'].touched && f['phone'].invalid"
                  formControlName="phone"
                  placeholder="771234567"
                  autocomplete="tel"
                />
                @if (f['phone'].touched && f['phone'].errors?.['required']) {
                  <span class="field-error">Ce champ est requis</span>
                }
                @if (f['phone'].touched && f['phone'].errors?.['invalidPhone']) {
                  <span class="field-error">Format invalide — ex: 771234567</span>
                }
              </div>
              <button
                type="submit"
                class="btn btn-primary full"
                [disabled]="clientForm.invalid || loading()"
              >
                @if (loading()) { Vérification... }
                @else { Accéder à mon compte <app-icon name="chevron" [size]="14" /> }
              </button>
            </form>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-shell {
      display: flex;
      min-height: 100vh;
    }

    /* LEFT */
    .login-left {
      flex: 1;
      background: var(--surface);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 40px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 15px;
      font-weight: 600;
      color: var(--text);
    }
    .logo-mark {
      width: 30px;
      height: 30px;
      background: var(--text);
      color: #000;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: .05em;
    }
    .tagline h1 {
      font-size: 38px;
      font-weight: 700;
      color: var(--text);
      line-height: 1.15;
      letter-spacing: -.04em;
      margin-bottom: 16px;
    }
    .tagline p {
      font-size: 14px;
      color: var(--text-2);
      line-height: 1.7;
      max-width: 360px;
    }
    .features {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .feat {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12.5px;
      color: var(--text-2);
    }
    .feat app-icon { color: var(--text-3); }

    /* RIGHT */
    .login-right {
      width: 440px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
    }
    .login-card {
      width: 100%;
    }
    .card-top {
      margin-bottom: 28px;
    }
    .card-top h2 {
      font-size: 20px;
      font-weight: 650;
      color: var(--text);
      letter-spacing: -.02em;
      margin-bottom: 4px;
    }
    .card-top p {
      font-size: 13px;
      color: var(--text-2);
    }

    .tabs {
      display: flex;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 3px;
      margin-bottom: 24px;
    }
    .tab {
      flex: 1;
      padding: 7px 12px;
      background: transparent;
      border: none;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-2);
      transition: background .12s, color .12s;
    }
    .tab.active {
      background: var(--surface-3);
      color: var(--text);
    }
    .tab:hover:not(.active) { color: var(--text); }

    .agent-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .agent-info {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 13px;
      color: var(--text-2);
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 12px 14px;
      line-height: 1.5;
    }
    .agent-info app-icon { flex-shrink: 0; margin-top: 1px; color: var(--text-3); }

    .field { margin-bottom: 16px; }

    .full { width: 100%; justify-content: center; margin-top: 8px; padding: 10px 16px; }
  `]
})
export class HomeComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private walletApi = inject(WalletApiService);
  private store = inject(BalanceStore);
  private toast = inject(ToastService);

  mode = signal<'agent' | 'client'>('agent');
  loading = signal(false);

  clientForm = this.fb.group({
    phone: ['', [Validators.required, phoneValidator()]]
  });

  get f() { return this.clientForm.controls; }

  enterAsAgent(): void {
    this.auth.loginAsAgent();
    this.router.navigate(['/admin/wallets']);
  }

  enterAsClient(): void {
    if (this.clientForm.invalid) return;
    const phone = this.clientForm.value.phone!;
    this.loading.set(true);

    this.walletApi.getBalance(phone).subscribe({
      next: (res) => {
        this.auth.loginAsClient(phone);
        this.store.setBalance(res.phone, res.balance, res.currency);
        this.loading.set(false);
        this.router.navigate(['/client/dashboard']);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Aucun portefeuille trouvé pour ce numéro');
      }
    });
  }
}
