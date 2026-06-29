import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { BalanceStore } from '../../../core/store/balance.store';
import { XofPipe } from '../../pipes/xof.pipe';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, XofPipe],
  template: `
    <nav class="navbar">
      <div class="brand">
        <span class="logo">💼</span>
        <strong>BadWallet</strong>
      </div>

      @if (auth.isAgent()) {
        <div class="links">
          <a routerLink="/agent/wallets" routerLinkActive="active">Portefeuilles</a>
          <a routerLink="/agent/search" routerLinkActive="active">Rechercher</a>
          <a routerLink="/agent/create" routerLinkActive="active">Nouveau</a>
          <a routerLink="/agent/deposit" routerLinkActive="active">Dépôt</a>
          <a routerLink="/agent/withdraw" routerLinkActive="active">Retrait</a>
        </div>
      }

      @if (auth.isClient()) {
        <div class="links">
          <a routerLink="/client/dashboard" routerLinkActive="active">Tableau de bord</a>
          <a routerLink="/client/transfer" routerLinkActive="active">Transfert</a>
          <a routerLink="/client/bills" routerLinkActive="active">Factures</a>
          <a routerLink="/client/transactions" routerLinkActive="active">Historique</a>
        </div>
        <div class="balance-badge">
          {{ store.balance() | xof: store.currency() }}
        </div>
      }

      <button class="btn-logout" (click)="logout()">Déconnexion</button>
    </nav>
  `,
  styles: [`
    .navbar {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      background: #1a1a2e;
      padding: .75rem 2rem;
      color: #eee;
    }
    .brand { display: flex; align-items: center; gap: .5rem; font-size: 1.1rem; }
    .links { display: flex; gap: 1rem; margin-left: auto; }
    .links a { color: #ccc; text-decoration: none; font-size: .9rem; }
    .links a.active { color: #e94560; font-weight: 600; }
    .balance-badge {
      background: #e94560;
      color: #fff;
      padding: .25rem .75rem;
      border-radius: 20px;
      font-size: .85rem;
      font-weight: 600;
    }
    .btn-logout {
      background: transparent;
      border: 1px solid #e94560;
      color: #e94560;
      padding: .3rem .8rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: .85rem;
    }
    .btn-logout:hover { background: #e94560; color: #fff; }
  `]
})
export class NavbarComponent {
  auth = inject(AuthService);
  store = inject(BalanceStore);
  private router = inject(Router);

  logout(): void {
    this.auth.logout();
    this.store.reset();
    this.router.navigate(['/']);
  }
}
