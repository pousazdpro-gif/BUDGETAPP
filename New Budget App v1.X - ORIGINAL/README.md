# Budget App - Version Modulaire Complète

## Structure du Projet

```
New Budget App v1/
├── index.html              # Page principale
├── css/
│   └── styles.css          # Styles personnalisés
├── js/
│   ├── state.js           # Gestion de l'état global
│   ├── utils.js           # Fonctions utilitaires
│   ├── calculations.js    # Calculs financiers
│   ├── api.js             # Appels API externes
│   ├── render.js          # Rendu des composants UI
│   ├── modals.js          # Gestion des modales
│   ├── events.js          # Gestionnaires d'événements
│   ├── main.js            # Initialisation principale
│   └── app-complete.js    # [LEGACY] Code monolithique original
└── README.md               # Documentation
```

## Architecture Modulaire

L'application a été entièrement refactorisée en modules JavaScript séparés pour une meilleure maintenabilité :

### 📁 **state.js** - Gestion de l'État
- État global de l'application
- Sauvegarde/chargement localStorage
- Migration des données
- Cache des balances de comptes

### 🛠️ **utils.js** - Utilitaires
- Génération d'IDs uniques
- Formatage des devises
- Notifications toast
- Fonction debounce
- Utilitaires de date

### 🧮 **calculations.js** - Calculs Financiers
- Calculs de soldes de comptes
- Détails d'investissements
- Progression des objectifs
- Valeur nette et totaux
- Filtrage des transactions

### 🌐 **api.js** - Intégrations API
- Taux de change (Frankfurter API)
- Prix des cryptomonnaies (CoinGecko)
- OCR avec Tesseract.js
- Gestion des timeouts et erreurs

### 🎨 **render.js** - Rendu UI
- Rendu de la sidebar
- Dashboard avec graphiques
- Listes de comptes/transactions
- Création de graphiques Chart.js
- Gestion responsive

### 🖼️ **modals.js** - Modales
- Modales de comptes
- Modales de transactions
- Modales d'investissements
- Modales de dettes/créances
- Validation OCR

### ⚡ **events.js** - Événements
- Gestionnaires de suppression/édition
- Recherche globale
- Ajout rapide de transactions
- Raccourcis clavier
- Drag & drop de fichiers

### 🚀 **main.js** - Initialisation
- Point d'entrée de l'application
- Gestion des graphiques
- Événements globaux
- Cycle de vie de l'app

## Installation et Utilisation

### Démarrage Rapide
1. Clonez ou téléchargez le projet
2. Ouvrez un terminal dans le dossier du projet
3. Lancez un serveur local :
   ```bash
   python -m http.server 8000
   ```
4. Ouvrez http://localhost:8000 dans votre navigateur

### Développement
- **Modifier la logique** : Éditez les fichiers dans `/js/`
- **Modifier les styles** : Éditez `css/styles.css`
- **Modifier la structure** : Éditez `index.html`

## Fonctionnalités Complètes

### 💰 Gestion Financière
- ✅ Comptes multiples avec devises
- ✅ Transactions (revenus/dépenses)
- ✅ Virements internes
- ✅ Transactions fractionnées
- ✅ Transactions récurrentes

### 📈 Investissements
- ✅ Portfolio d'investissements
- ✅ Historique d'achats/ventes
- ✅ Calcul de PRU et gains
- ✅ Suivi des dividendes

### 🎯 Objectifs et Dettes
- ✅ Objectifs d'épargne
- ✅ Suivi des dettes
- ✅ Gestion des créances
- ✅ Progression automatique

### 📊 Tableaux de Bord
- ✅ Dashboard avec métriques clés
- ✅ Graphiques interactifs (Chart.js)
- ✅ Évolution patrimoniale
- ✅ Répartition des actifs

### 🔧 Fonctionnalités Avancées
- ✅ Import/Export JSON
- ✅ Export CSV des transactions
- ✅ OCR pour tickets de caisse
- ✅ Taux de change automatiques
- ✅ Recherche globale intelligente
- ✅ Raccourcis clavier
- ✅ Drag & drop de fichiers

## Technologies

- **Frontend** : HTML5, CSS3, JavaScript ES6+
- **Styling** : TailwindCSS
- **Graphiques** : Chart.js
- **Icônes** : Lucide
- **OCR** : Tesseract.js
- **PDF** : PDF.js
- **APIs** : Frankfurter (taux), CoinGecko (crypto)

## Raccourcis Clavier

- `Ctrl/Cmd + N` : Nouvelle transaction
- `Ctrl/Cmd + Shift + N` : Nouveau compte
- `Ctrl/Cmd + F` : Recherche globale
- `Échap` : Fermer la modale

## Migration depuis la Version Monolithique

Si vous utilisez l'ancienne version monolithique :
1. Vos données sont automatiquement migrées au premier lancement
2. L'ancien fichier `app-complete.js` est conservé pour référence
3. Toutes les fonctionnalités sont préservées à l'identique

## Performance et Maintenabilité

### Avantages de la Modularisation
- **Code organisé** : Séparation claire des responsabilités
- **Maintenance facilitée** : Modifications isolées par module
- **Réutilisabilité** : Fonctions modulaires réutilisables
- **Debugging amélioré** : Erreurs localisées par module
- **Évolutivité** : Ajout facile de nouvelles fonctionnalités

### Optimisations
- Cache des balances de comptes
- Gestion mémoire des graphiques
- Debounce sur les recherches
- Chargement différé des modules

## Support et Développement

Cette version modulaire est prête pour :
- ✅ Tests unitaires
- ✅ Intégration continue
- ✅ Déploiement web
- ✅ Extensions futures
- ✅ Maintenance à long terme

---

**Version** : 5.0.0 Modulaire  
**Compatibilité** : Navigateurs modernes (ES6+)  
**Licence** : Usage personnel
