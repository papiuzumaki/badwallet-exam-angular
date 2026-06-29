import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent, NavItem } from '../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-agent-layout',
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
export class AgentLayoutComponent {
  nav: NavItem[] = [
    { label: 'Portefeuilles',  route: '/admin/wallets', icon: 'wallet'    },
    { label: 'Rechercher',     route: '/admin/search',  icon: 'search'    },
    { label: 'Nouveau wallet', route: '/admin/create',  icon: 'plus'      },
    { label: 'Dépôt',         route: '/admin/deposit', icon: 'arrow-down' },
    { label: 'Retrait',       route: '/admin/withdraw', icon: 'arrow-up'  },
  ];
}
