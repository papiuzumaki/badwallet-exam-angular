import { Component, inject, Input } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { BalanceStore } from '../../../core/store/balance.store';
import { XofPipe } from '../../pipes/xof.pipe';
import { IconComponent } from '../icon/icon.component';

export interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, XofPipe, IconComponent],
  template: `
    <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="logo-mark">BW</div>
        <span class="logo-text">BadWallet</span>
      </div>

      <nav class="sidebar-nav">
        @for (item of navItems; track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="active"
            class="nav-item"
          >
            <app-icon [name]="item.icon" [size]="16" />
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>

      <div class="sidebar-footer">
        @if (store.phone()) {
          <div class="balance-block">
            <span class="balance-label">Solde</span>
            <span class="balance-amount">{{ store.balance() | xof: store.currency() }}</span>
          </div>
        }

        <div class="user-block">
          <div class="user-avatar">
            <app-icon name="user" [size]="14" />
          </div>
          <div class="user-info">
            <span class="user-role">{{ auth.isAgent() ? 'Agent' : 'Client' }}</span>
            @if (store.phone()) {
              <span class="user-phone">{{ store.phone() }}</span>
            }
          </div>
        </div>

        <button class="logout-btn-full" (click)="logout()">
          <app-icon name="logout" [size]="14" />
          Déconnexion
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: var(--sidebar-w);
      height: 100vh;
      background: var(--surface);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0;
      left: 0;
      z-index: 100;
    }

    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 16px;
      height: var(--header-h);
      border-bottom: 1px solid var(--border);
    }
    .logo-mark {
      width: 28px;
      height: 28px;
      background: var(--text);
      color: #000;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: .05em;
      flex-shrink: 0;
    }
    .logo-text {
      font-size: 14px;
      font-weight: 600;
      color: var(--text);
      letter-spacing: -.01em;
    }

    .sidebar-nav {
      flex: 1;
      padding: 12px 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow-y: auto;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border-radius: var(--radius);
      font-size: 13px;
      font-weight: 450;
      color: var(--text-2);
      transition: background .12s, color .12s;
    }
    .nav-item:hover { background: var(--surface-2); color: var(--text); }
    .nav-item.active {
      background: var(--surface-3);
      color: var(--text);
      font-weight: 500;
    }

    .sidebar-footer {
      padding: 12px 10px;
      border-top: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .balance-block {
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 10px 12px;
    }
    .balance-label {
      display: block;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: .07em;
      color: var(--text-3);
      margin-bottom: 3px;
    }
    .balance-amount {
      font-size: 15px;
      font-weight: 650;
      color: var(--green);
      letter-spacing: -.02em;
    }

    .user-block {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .user-avatar {
      width: 28px;
      height: 28px;
      background: var(--surface-3);
      border: 1px solid var(--border);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-2);
      flex-shrink: 0;
    }
    .user-info {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .user-role  { font-size: 12px; font-weight: 500; color: var(--text); }
    .user-phone { font-size: 11px; color: var(--text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .logout-btn-full {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 8px 10px;
      background: transparent;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      color: var(--text-2);
      font-size: 12.5px;
      font-weight: 500;
      transition: background .12s, color .12s, border-color .12s;
    }
    .logout-btn-full:hover {
      background: var(--red-bg);
      color: var(--red);
      border-color: var(--red-border);
    }
  `]
})
export class SidebarComponent {
  @Input() navItems: NavItem[] = [];
  auth = inject(AuthService);
  store = inject(BalanceStore);
  private router = inject(Router);

  logout(): void {
    this.auth.logout();
    this.store.reset();
    this.router.navigate(['/']);
  }
}
