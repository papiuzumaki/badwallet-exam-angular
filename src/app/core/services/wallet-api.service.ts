import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Wallet, WalletPage, Transaction, BalanceResponse, WalletStats } from '../models/wallet.model';

@Injectable({ providedIn: 'root' })
export class WalletApiService {
  private readonly BASE = 'http://localhost:8080/api/wallets';

  constructor(private http: HttpClient) {}

  getWallets(page = 0, size = 10): Observable<WalletPage> {
    return this.http.get<WalletPage>(`${this.BASE}?page=${page}&size=${size}`);
  }

  getWalletByPhone(phone: string): Observable<Wallet> {
    return this.http.get<Wallet>(`${this.BASE}/${encodeURIComponent(phone)}`);
  }

  getBalance(phone: string): Observable<BalanceResponse> {
    return this.http.get<BalanceResponse>(`${this.BASE}/${encodeURIComponent(phone)}/balance`);
  }

  createWallet(data: Partial<Wallet> & { initialBalance: number }): Observable<Wallet> {
    return this.http.post<Wallet>(this.BASE, data);
  }

  deposit(id: number, amount: number, paymentMethod: string): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.BASE}/${id}/deposit`, { amount, paymentMethod });
  }

  withdraw(phoneNumber: string, amount: number): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.BASE}/withdraw`, { phoneNumber, amount });
  }

  transfer(senderPhone: string, receiverPhone: string, amount: number): Observable<Transaction[]> {
    return this.http.post<Transaction[]>(`${this.BASE}/transfer`, { senderPhone, receiverPhone, amount });
  }

  getTransactions(phone: string): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.BASE}/${encodeURIComponent(phone)}/transactions`);
  }

  payCurrentBill(phoneNumber: string, serviceName: string, amount: number): Observable<any> {
    return this.http.post(`${this.BASE}/pay`, { phoneNumber, serviceName, amount });
  }

  payFactures(phoneNumber: string, serviceName: string, factureReferences: string[]): Observable<any> {
    return this.http.post(`${this.BASE}/pay-factures`, { phoneNumber, serviceName, factureReferences });
  }

  getStats(phone: string): Observable<WalletStats> {
    return this.http.get<WalletStats>(`${this.BASE}/${encodeURIComponent(phone)}/stats`);
  }

  seed(numWallets = 10, eventsPerWallet = 50): Observable<any> {
    return this.http.post(`${this.BASE}/seed?numWallets=${numWallets}&eventsPerWallet=${eventsPerWallet}`, {});
  }
}
