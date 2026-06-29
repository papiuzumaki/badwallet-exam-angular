import { Routes } from '@angular/router';
import { agentGuard, clientGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./features/agent/agent-layout.component').then(m => m.AgentLayoutComponent),
    canActivate: [agentGuard],
    children: [
      { path: '', redirectTo: 'wallets', pathMatch: 'full' },
      {
        path: 'wallets',
        loadComponent: () =>
          import('./features/agent/wallet-list/wallet-list.component').then(m => m.WalletListComponent)
      },
      {
        path: 'create',
        loadComponent: () =>
          import('./features/agent/create-wallet/create-wallet.component').then(m => m.CreateWalletComponent)
      },
      {
        path: 'deposit',
        loadComponent: () =>
          import('./features/agent/deposit/deposit.component').then(m => m.DepositComponent)
      },
      {
        path: 'withdraw',
        loadComponent: () =>
          import('./features/agent/withdraw/withdraw.component').then(m => m.WithdrawComponent)
      },
      {
        path: 'search',
        loadComponent: () =>
          import('./features/agent/wallet-search/wallet-search.component').then(m => m.WalletSearchComponent)
      }
    ]
  },
  {
    path: 'client',
    loadComponent: () =>
      import('./features/client/client-layout.component').then(m => m.ClientLayoutComponent),
    canActivate: [clientGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/client/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'transfer',
        loadComponent: () =>
          import('./features/client/transfer/transfer.component').then(m => m.TransferComponent)
      },
      { path: 'bills', redirectTo: 'bills/current', pathMatch: 'full' },
      {
        path: 'bills/current',
        loadComponent: () =>
          import('./features/client/bills/bills.component').then(m => m.BillsComponent)
      },
      {
        path: 'bills/history',
        loadComponent: () =>
          import('./features/client/bills-history/bills-history.component').then(m => m.BillsHistoryComponent)
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./features/client/transactions/transactions.component').then(m => m.TransactionsComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
