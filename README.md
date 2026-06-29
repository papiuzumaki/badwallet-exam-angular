# BadWallet Dashboard

Application web SPA développée avec **Angular 17** pour gérer des portefeuilles mobiles BadWallet. Elle consomme l'API Spring Boot `badwallet-api` et expose deux espaces distincts : Agent et Client.

## Examen

**Sujet** : Développement Frontend Angular  
**Étudiant** : Pape Oumar Ndiaye  
**Backend** : [badwallet-api](https://github.com/papiuzumaki/badwallet-api)

---

## Stack technique

| Technologie | Usage |
|---|---|
| Angular 17 | Framework SPA (Standalone Components) |
| Angular Signals | Gestion d'état réactive (`signal`, `computed`, `asReadonly`) |
| Angular Router | Routing avec lazy-loading + guards |
| ReactiveFormsModule | Formulaires avec validateurs personnalisés |
| HttpClient | Appels API avec intercepteur fonctionnel |
| Chart.js | Graphique doughnut sur le tableau de bord |
| SCSS | Design system avec CSS custom properties |

---

## Fonctionnalités Angular requises

| Exigence | Implémentation |
|---|---|
| Signals | `AuthService`, `BalanceStore`, tous les composants |
| State Management | `BalanceStore` — état global du solde via `signal()` + `computed()` |
| Guards | `agentGuard`, `clientGuard` — `CanActivateFn` |
| Intercepteur HTTP | `errorInterceptor` — `HttpInterceptorFn` via `withInterceptors()` |
| Pipe personnalisé | `XofPipe` — formatage monétaire XOF via `Intl.NumberFormat('fr-FR')` |
| Reactive Forms | Validateurs : `phoneValidator` (regex `/^7[0-9]{8}$/`), `differentPhoneValidator` |
| Lazy loading | Tous les modules Agent et Client chargés à la demande |
| Chart.js | Doughnut 70% cutout, `AfterViewInit` / `OnDestroy` |

---

## Espace Agent

| Page | Description |
|---|---|
| Portefeuilles | Liste paginée de tous les wallets + bouton seed |
| Recherche | Recherche par numéro de téléphone + stats + dernières transactions |
| Nouveau wallet | Formulaire de création avec validation |
| Dépôt | Dépôt sur un wallet par ID (CREDIT_CARD / WALLET_TARGET) |
| Retrait | Retrait avec calcul des frais en temps réel (1%, max 5 000 XOF) |

## Espace Client

| Page | Description |
|---|---|
| Tableau de bord | Stats (solde, dépôts, retraits, transferts) + graphique doughnut |
| Transfert | Envoi d'argent vers un autre numéro |
| Factures | Factures du mois courant, filtrage, paiement par sélection |
| Transactions | Historique complet avec filtre par type |

---

## Prérequis

- Node.js 18+
- Angular CLI 17
- [badwallet-api](https://github.com/papiuzumaki/badwallet-api) démarré sur le port `8080`
- `payment-service` démarré sur le port `8081`

## Démarrage

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm start
# → http://localhost:4200
```

## Build production

```bash
npm run build
# Artefacts dans dist/badwallet-dashboard/
```

---

## Structure du projet

```
src/app/
├── core/
│   ├── guards/         # agentGuard, clientGuard
│   ├── interceptors/   # errorInterceptor
│   ├── models/         # Wallet, Transaction, Facture, WalletStats
│   ├── services/       # WalletApiService, BillingApiService, AuthService, ToastService
│   └── store/          # BalanceStore (Signals)
├── shared/
│   ├── components/     # IconComponent, SidebarComponent, ToastComponent
│   ├── pipes/          # XofPipe
│   └── validators/     # phoneValidator, differentPhoneValidator
└── features/
    ├── home/           # Page d'accueil + sélection de rôle
    ├── agent/          # wallet-list, wallet-search, create-wallet, deposit, withdraw
    └── client/         # dashboard, transfer, bills, transactions
```
