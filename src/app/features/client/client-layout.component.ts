import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <app-navbar />
    <main class="container">
      <router-outlet />
    </main>
  `,
  styles: [`
    .container { max-width: 1100px; margin: 2rem auto; padding: 0 1rem; }
  `]
})
export class ClientLayoutComponent {}
