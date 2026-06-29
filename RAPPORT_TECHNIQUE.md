# Rapport Technique — BadWallet Web Dashboard

**Étudiant** : Pape Oumar Ndiaye  
**Module** : Développement Frontend Angular  
**Date** : Juin 2026

---

## Choix d'architecture

### Standalone Components (Angular 17)
J'ai opté pour les **Standalone Components** introduits en Angular 14+ et stabilisés en 17, en évitant les NgModules classiques. Chaque composant déclare ses propres dépendances (`imports: [...]`), ce qui rend le code plus lisible et plus facile à maintenir. Tous les modules sont chargés en **lazy loading** via `loadComponent()` dans le router, ce qui réduit le bundle initial à ~110 KB.

### State Management avec Angular Signals
Le suivi du solde en temps réel est géré par un **`BalanceStore`** basé sur `signal()` et `computed()`. Ce store est injecté dans le `SidebarComponent` : dès qu'une opération (dépôt, retrait, transfert, paiement) met à jour le signal, le solde s'actualise automatiquement dans la sidebar sans rechargement. L'`AuthService` utilise également des signaux pour stocker le rôle (`AGENT`/`CLIENT`) et le numéro de téléphone actif.

### Séparation des responsabilités
```
core/      → Guards, Intercepteur, Services API, Store, Modèles
shared/    → Composants UI réutilisables (Sidebar, Toast, Icon), Pipes, Validators
features/  → agent/ et client/ (chacun avec son layout et ses pages)
```

### Routing avec Guards
Deux guards fonctionnels (`CanActivateFn`) protègent les espaces :
- `agentGuard` → redirige vers `/` si le rôle n'est pas `AGENT`
- `clientGuard` → redirige vers `/` si le rôle n'est pas `CLIENT`

---

## Difficultés rencontrées

### 1. Validator sur un champ désactivé (`differentPhoneValidator`)
Dans le formulaire de transfert, le champ `senderPhone` est désactivé (`disabled: true`) car pré-rempli depuis l'`AuthService`. Un formulaire Angular n'inclut pas les valeurs des champs désactivés dans `form.value`. J'ai contourné ce problème en lisant `AbstractControl.value` directement sur le control (qui retourne la valeur même si le champ est désactivé), plutôt que d'utiliser `form.value`.

### 2. Génération automatique du code wallet côté backend
Le backend ne générait pas le code wallet (`WLT-XXXXXXX`) lors de la création. Le champ était `null` en base. J'ai modifié le `WalletService` Spring Boot pour sauvegarder d'abord l'entité (obtenir l'ID auto-généré), puis calculer et persister le code : `"WLT-" + String.format("%07d", wallet.getId())`.

### 3. Chart.js et le cycle de vie Angular
Le graphique doughnut doit être instancié après que le canvas soit rendu dans le DOM (`AfterViewInit`) et les données disponibles (callback HTTP asynchrone). J'ai géré ce cas en appelant `buildChart()` depuis les deux points (`ngAfterViewInit` et le subscribe des stats), avec une garde `if (!this.chartCanvas || !this.stats()) return` pour éviter les double-initialisations.

### 4. Proxy Pattern backend → payment-service
Les factures transitent par le backend (`/api/external/factures/...`) qui fait office de proxy vers le `payment-service` sur le port 8081. Cela évite les problèmes CORS et centralise la logique d'authentification côté serveur. Du côté Angular, le `BillingApiService` appelle uniquement `localhost:8080`, sans savoir que les données viennent d'un second service.
