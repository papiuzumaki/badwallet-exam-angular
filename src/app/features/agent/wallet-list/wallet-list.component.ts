import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WalletApiService } from '../../../core/services/wallet-api.service';
import { Wallet, WalletPage } from '../../../core/models/wallet.model';
import { XofPipe } from '../../../shared/pipes/xof.pipe';
import { PhonePipe } from '../../../shared/pipes/phone.pipe';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-wallet-list',
  standalone: true,
  imports: [CommonModule, RouterLink, XofPipe, PhonePipe, IconComponent],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Portefeuilles</h1>
        <p class="page-sub">{{ totalElements }} comptes enregistrés</p>
      </div>
      <a routerLink="/agent/create" class="btn btn-primary">
        <app-icon name="plus" [size]="14" /> Nouveau portefeuille
      </a>
    </div>

    @if (loading()) {
      <div class="loading-state">Chargement des portefeuilles...</div>
    }

    @if (!loading() && wallets.length === 0) {
      <div class="card">
        <div class="empty-state">
          <app-icon name="wallet" [size]="32" />
          <p>Aucun portefeuille trouvé</p>
          <button class="btn btn-ghost" style="margin-top:16px" (click)="seed()" [disabled]="seeding()">
            @if (seeding()) { Génération en cours... }
            @else { Initialiser les données de test }
          </button>
        </div>
      </div>
    }

    @if (wallets.length > 0) {
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Téléphone</th>
                <th>Email</th>
                <th>Devise</th>
                <th style="text-align:right">Solde</th>
                <th>Créé le</th>
              </tr>
            </thead>
            <tbody>
              @for (w of wallets; track w.id) {
                <tr>
                  <td><code>{{ w.code }}</code></td>
                  <td>{{ w.phoneNumber | phone }}</td>
                  <td style="color:var(--text-2)">{{ w.email }}</td>
                  <td><span class="badge badge-gray">{{ w.currency }}</span></td>
                  <td style="text-align:right;font-weight:600;color:var(--green)">{{ w.balance | xof: w.currency }}</td>
                  <td style="color:var(--text-3)">{{ w.createdAt | date:'dd MMM yyyy' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <span class="pag-info">Page {{ currentPage + 1 }} sur {{ totalPages }}</span>
          <div class="pag-controls">
            <button class="btn btn-ghost btn-sm" [disabled]="currentPage === 0" (click)="loadPage(currentPage - 1)">
              Précédent
            </button>
            <button class="btn btn-ghost btn-sm" [disabled]="currentPage >= totalPages - 1" (click)="loadPage(currentPage + 1)">
              Suivant
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }
    .pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      border-top: 1px solid var(--border);
    }
    .pag-info { font-size: 12px; color: var(--text-3); }
    .pag-controls { display: flex; gap: 6px; }
  `]
})
export class WalletListComponent implements OnInit {
  private api = inject(WalletApiService);

  wallets: Wallet[] = [];
  currentPage = 0;
  totalPages = 1;
  totalElements = 0;
  loading = signal(false);
  seeding = signal(false);

  ngOnInit(): void { this.loadPage(0); }

  loadPage(page: number): void {
    this.loading.set(true);
    this.api.getWallets(page, 10).subscribe({
      next: (res: WalletPage) => {
        this.wallets = res.content;
        this.currentPage = res.number;
        this.totalPages = res.totalPages;
        this.totalElements = res.totalElements;
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  seed(): void {
    this.seeding.set(true);
    this.api.seed(10, 50).subscribe({
      next: () => setTimeout(() => { this.seeding.set(false); this.loadPage(0); }, 3000),
      error: () => this.seeding.set(false)
    });
  }
}
