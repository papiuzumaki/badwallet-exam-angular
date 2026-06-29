import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WalletApiService } from '../../../core/services/wallet-api.service';
import { Wallet, WalletPage } from '../../../core/models/wallet.model';
import { XofPipe } from '../../../shared/pipes/xof.pipe';

@Component({
  selector: 'app-wallet-list',
  standalone: true,
  imports: [CommonModule, RouterLink, XofPipe],
  template: `
    <div class="page-header">
      <h2>Liste des portefeuilles</h2>
      <a routerLink="/agent/create" class="btn-primary">+ Nouveau portefeuille</a>
    </div>

    @if (loading) {
      <div class="loading">Chargement...</div>
    }

    @if (!loading && wallets.length === 0) {
      <div class="empty">Aucun portefeuille trouvé.
        <button (click)="seed()" class="btn-seed">Initialiser les données</button>
      </div>
    }

    @if (wallets.length > 0) {
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Téléphone</th>
              <th>Email</th>
              <th>Solde</th>
              <th>Devise</th>
              <th>Créé le</th>
            </tr>
          </thead>
          <tbody>
            @for (w of wallets; track w.id) {
              <tr>
                <td><code>{{ w.code }}</code></td>
                <td>{{ w.phoneNumber }}</td>
                <td>{{ w.email }}</td>
                <td class="amount">{{ w.balance | xof: w.currency }}</td>
                <td>{{ w.currency }}</td>
                <td>{{ w.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <button [disabled]="currentPage === 0" (click)="loadPage(currentPage - 1)">← Précédent</button>
        <span>Page {{ currentPage + 1 }} / {{ totalPages }}</span>
        <button [disabled]="currentPage >= totalPages - 1" (click)="loadPage(currentPage + 1)">Suivant →</button>
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    h2 { color: #e94560; }
    .btn-primary {
      background: #e94560; color: #fff; padding: .5rem 1.2rem;
      border-radius: 8px; text-decoration: none; font-size: .9rem;
    }
    .btn-seed {
      background: #3498db; color: #fff; border: none;
      padding: .5rem 1rem; border-radius: 6px; cursor: pointer; margin-left: 1rem;
    }
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; background: #0f3460; border-radius: 10px; overflow: hidden; }
    th { background: #1a1a2e; color: #aaa; padding: .75rem 1rem; text-align: left; font-size: .85rem; }
    td { padding: .75rem 1rem; color: #eee; border-top: 1px solid #1a1a2e; font-size: .9rem; }
    code { background: #1a1a2e; padding: .15rem .4rem; border-radius: 4px; color: #e94560; }
    .amount { font-weight: 600; color: #2ecc71; }
    .pagination { display: flex; gap: 1rem; align-items: center; margin-top: 1rem; justify-content: center; color: #aaa; }
    .pagination button {
      background: #0f3460; border: 1px solid #333; color: #eee;
      padding: .4rem .9rem; border-radius: 6px; cursor: pointer;
    }
    .pagination button:disabled { opacity: .4; cursor: default; }
    .loading, .empty { text-align: center; padding: 3rem; color: #aaa; }
  `]
})
export class WalletListComponent implements OnInit {
  private api = inject(WalletApiService);

  wallets: Wallet[] = [];
  currentPage = 0;
  totalPages = 1;
  loading = false;

  ngOnInit(): void {
    this.loadPage(0);
  }

  loadPage(page: number): void {
    this.loading = true;
    this.api.getWallets(page, 10).subscribe({
      next: (res: WalletPage) => {
        this.wallets = res.content;
        this.currentPage = res.number;
        this.totalPages = res.totalPages;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  seed(): void {
    this.api.getWallets(0, 10).subscribe(); // trigger seed from UI is separate
  }
}
