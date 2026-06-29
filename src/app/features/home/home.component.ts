import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { WalletApiService } from '../../core/services/wallet-api.service';
import { BalanceStore } from '../../core/store/balance.store';
import { ToastService } from '../../core/services/toast.service';
import { phoneValidator } from '../../shared/validators/wallet.validators';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="login-page">
      <div class="card">
        <h1>💼 BadWallet</h1>
        <p class="subtitle">Choisissez votre espace</p>

        <div class="role-buttons">
          <button class="btn-agent" (click)="enterAsAgent()">
            🏦 Espace Agent
          </button>

          <div class="divider">ou</div>

          <form [formGroup]="clientForm" (ngSubmit)="enterAsClient()">
            <div class="form-group">
              <label>Numéro de téléphone (client)</label>
              <input
                formControlName="phone"
                placeholder="77 XXX XX XX"
                [class.invalid]="clientForm.get('phone')?.touched && clientForm.get('phone')?.invalid"
              />
              @if (clientForm.get('phone')?.touched && clientForm.get('phone')?.errors?.['required']) {
                <span class="error">Téléphone requis</span>
              }
              @if (clientForm.get('phone')?.touched && clientForm.get('phone')?.errors?.['invalidPhone']) {
                <span class="error">Format invalide (ex: 771234567)</span>
              }
            </div>
            <button type="submit" class="btn-client" [disabled]="clientForm.invalid">
              📱 Espace Client
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1a1a2e, #16213e);
    }
    .card {
      background: #0f3460;
      padding: 2.5rem;
      border-radius: 16px;
      width: 380px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,.4);
    }
    h1 { color: #e94560; font-size: 2rem; margin-bottom: .5rem; }
    .subtitle { color: #aaa; margin-bottom: 2rem; }
    .role-buttons { display: flex; flex-direction: column; gap: 1rem; }
    .btn-agent, .btn-client {
      width: 100%;
      padding: .9rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity .2s;
    }
    .btn-agent { background: #e94560; color: #fff; }
    .btn-client { background: #2ecc71; color: #fff; margin-top: .5rem; }
    .btn-agent:hover, .btn-client:hover { opacity: .9; }
    .btn-client:disabled { opacity: .5; cursor: not-allowed; }
    .divider { color: #666; font-size: .85rem; margin: .5rem 0; }
    .form-group { text-align: left; }
    label { display: block; color: #ccc; font-size: .85rem; margin-bottom: .4rem; }
    input {
      width: 100%;
      padding: .7rem;
      background: #1a1a2e;
      border: 1px solid #333;
      border-radius: 8px;
      color: #fff;
      font-size: .95rem;
      box-sizing: border-box;
    }
    input.invalid { border-color: #e94560; }
    .error { color: #e94560; font-size: .8rem; }
  `]
})
export class HomeComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private walletApi = inject(WalletApiService);
  private store = inject(BalanceStore);
  private toast = inject(ToastService);

  clientForm = this.fb.group({
    phone: ['', [Validators.required, phoneValidator()]]
  });

  enterAsAgent(): void {
    this.auth.loginAsAgent();
    this.router.navigate(['/agent/wallets']);
  }

  enterAsClient(): void {
    if (this.clientForm.invalid) return;
    const phone = this.clientForm.value.phone!;

    this.store.setLoading(true);
    this.walletApi.getBalance(phone).subscribe({
      next: (res) => {
        this.auth.loginAsClient(phone);
        this.store.setBalance(res.phone, res.balance, res.currency);
        this.store.setLoading(false);
        this.router.navigate(['/client/dashboard']);
      },
      error: () => {
        this.store.setLoading(false);
        this.toast.error('Aucun portefeuille trouvé pour ce numéro');
      }
    });
  }
}
