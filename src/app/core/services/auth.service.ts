import { Injectable, signal } from '@angular/core';

export type Role = 'AGENT' | 'CLIENT' | null;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _role = signal<Role>(null);
  private readonly _phone = signal<string>('');

  readonly role = this._role.asReadonly();
  readonly phone = this._phone.asReadonly();

  loginAsAgent(): void {
    this._role.set('AGENT');
  }

  loginAsClient(phone: string): void {
    this._role.set('CLIENT');
    this._phone.set(phone);
  }

  logout(): void {
    this._role.set(null);
    this._phone.set('');
  }

  isAgent(): boolean {
    return this._role() === 'AGENT';
  }

  isClient(): boolean {
    return this._role() === 'CLIENT';
  }

  isLoggedIn(): boolean {
    return this._role() !== null;
  }
}
