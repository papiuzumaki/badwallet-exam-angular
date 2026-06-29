import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Facture } from '../models/wallet.model';

@Injectable({ providedIn: 'root' })
export class BillingApiService {
  private readonly BASE = 'http://localhost:8080/api/external/factures';

  constructor(private http: HttpClient) {}

  getCurrentFactures(walletCode: string, unite?: string): Observable<Facture[]> {
    const params = unite ? `?unite=${encodeURIComponent(unite)}` : '';
    return this.http.get<Facture[]>(`${this.BASE}/${walletCode}/current${params}`);
  }

  getFacturesByPeriode(walletCode: string, debut: string, fin: string): Observable<Facture[]> {
    return this.http.get<Facture[]>(`${this.BASE}/${walletCode}/periode?debut=${debut}&fin=${fin}`);
  }
}
