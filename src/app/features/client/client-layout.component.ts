import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent, NavItem } from '../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <app-sidebar [navItems]="nav" />
    <div class="shell">
      <router-outlet />
    </div>
  `,
  styles: [`
    :host { display: flex; min-height: 100vh; }
    .shell {
      margin-left: var(--sidebar-w);
      flex: 1;
      padding: 32px 36px;
      max-width: 1100px;
    }
  `]
})
export class ClientLayoutComponent {
  nav: NavItem[] = [
    { label: 'Tableau de bord', route: '/client/dashboard',    icon: 'chart'    },
    { label: 'Transfert',       route: '/client/transfer',     icon: 'transfer' },
    { label: 'Factures',        route: '/client/bills',        icon: 'receipt'  },
    { label: 'Transactions',    route: '/client/transactions', icon: 'history'  },
  ];
}
