import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="toast-container">
      @for (item of svc.toasts(); track item.id) {
        <div class="toast-item" [class]="'toast-' + item.type">
          <app-icon [name]="item.type === 'success' ? 'check' : item.type === 'error' ? 'x' : 'info'" [size]="15" />
          <span>{{ item.message }}</span>
          <button class="toast-close" (click)="svc.remove(item.id)">
            <app-icon name="x" [size]="13" />
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    }
    .toast-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 11px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      min-width: 280px;
      max-width: 380px;
      pointer-events: all;
      animation: slideIn .2s ease;
      border: 1px solid;
    }
    .toast-item span { flex: 1; }
    .toast-success {
      background: rgba(34,197,94,.1);
      color: #4ade80;
      border-color: rgba(34,197,94,.25);
    }
    .toast-error {
      background: rgba(248,113,113,.1);
      color: #fca5a5;
      border-color: rgba(248,113,113,.25);
    }
    .toast-info {
      background: rgba(96,165,250,.1);
      color: #93c5fd;
      border-color: rgba(96,165,250,.25);
    }
    .toast-close {
      background: transparent;
      border: none;
      color: inherit;
      opacity: .6;
      padding: 0;
      display: flex;
    }
    .toast-close:hover { opacity: 1; }
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(12px); }
      to   { opacity: 1; transform: translateX(0); }
    }
  `]
})
export class ToastComponent {
  svc = inject(ToastService);
}
