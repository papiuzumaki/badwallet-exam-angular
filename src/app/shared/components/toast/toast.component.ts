import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (item of svc.toasts(); track item.id) {
        <div class="toast" [class]="item.type" (click)="svc.remove(item.id)">
          {{ item.message }}
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: .5rem;
    }
    .toast {
      padding: .75rem 1.25rem;
      border-radius: 8px;
      color: #fff;
      font-size: .9rem;
      cursor: pointer;
      animation: fadeIn .3s ease;
      max-width: 360px;
    }
    .success { background: #2ecc71; }
    .error   { background: #e74c3c; }
    .info    { background: #3498db; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; } }
  `]
})
export class ToastComponent {
  svc = inject(ToastService);
}
