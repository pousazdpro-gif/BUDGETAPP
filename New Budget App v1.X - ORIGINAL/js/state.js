// ========== STATE MANAGEMENT MODULE ========== //

// État global de l'application
let state = {};

// État initial avec toutes les propriétés par défaut
const initialState = {
    appVersion: "5.0.0",
    activeTab: 'dashboard',
    baseCurrency: 'CHF',
    exchangeRates: { 'CHF': 1, 'EUR': 1.02, 'USD': 1.10, 'GBP': 0.87, 'JPY': 163.78, 'BTC': 65000 },
    accounts: [],
    transactions: [],
    activeAccountFilterId: null,
    searchQuery: '',
    investments: [],
    debts: [],
    claims: [],
    goals: [],
    monthlyBudgets: {}, // Structure: { '2024-01': { categoryId: { planned: 800, spent: 200, transactions: [] } } }
    currentBudgetMonth: '', // Format: 'YYYY-MM'
    categories: {
        income: {
            'Revenus du Travail': ['Salaire', 'Bonus', 'Commissions', 'Freelance', 'Primes', 'Heures supplémentaires'],
            'Revenus du Capital': ['Dividendes', 'Intérêts', 'Plus-values', 'Gains crypto'],
            'Revenus Passifs': ['Loyers', 'Redevances', 'Affiliation', 'Publicité'],
            'Autres Revenus': ['Cadeaux', 'Ventes', 'Allocations', 'Remboursements', 'Autre']
        },
        expense: {
            'Logement': ['Loyer', 'Hypothèque', 'Charges', 'Électricité', 'Eau', 'Gaz', 'Chauffage', 'Assurance habitation', 'Entretien', 'Mobilier'],
            'Transport': ['Carburant', 'Transports', 'Assurance voiture', 'Entretien voiture', 'Parking', 'Péages', 'Taxi', 'Location'],
            'Alimentation': ['Supermarché', 'Restaurant', 'Café', 'Livraison', 'Boulangerie'],
            'Santé': ['Médecin', 'Médicaments', 'Dentiste', 'Opticien', 'Assurance santé', 'Soins'],
            'Loisirs': ['Cinéma', 'Sport', 'Livres', 'Musique', 'Streaming', 'Vacances', 'Cadeaux'],
            'Éducation': ['Frais scolaires', 'Fouritures', 'Formation', 'Activités enfants'],
            'Dettes': ['Remboursement prêt', 'Carte de crédit', 'Prêt personnel'],
            'Investissements': ['Achat actions', 'Achat crypto', 'Frais de courtage'],
            'Épargne': ['Virement épargne', 'Contribution objectif'],
            'Divers': ['Dons', 'Animaux', 'Impôts', 'Amendes', 'Frais bancaires', 'Autre']
        }
    },
    tasks: [],
    wishlist: [],
    netWorthHistory: [],
    transactionTemplates: [],
    transactionFilters: { accountId: '', categoryId: '', tags: '', startDate: '', endDate: '' },
    budgetHistory: [] // Historique des budgets des mois précédents
};

// Cache pour les balances des comptes
const accountBalanceCache = new Map();
let cacheInvalidated = true;

const invalidateBalanceCache = () => {
    accountBalanceCache.clear();
    cacheInvalidated = true;
};

// Mots-clés pour l'ajout rapide
const quickAddKeywordMap = {
    'salaire': { type: 'income', category: 'Revenus du Travail', subCategory: 'Salaire' },
    'loyer': { type: 'expense', category: 'Logement', subCategory: 'Loyer' },
    'courses': { type: 'expense', category: 'Alimentation', subCategory: 'Supermarché' },
    'restaurant': { type: 'expense', category: 'Alimentation', subCategory: 'Restaurant' },
    'essence': { type: 'expense', category: 'Transport', subCategory: 'Carburant' },
    'carburant': { type: 'expense', category: 'Transport', subCategory: 'Carburant' },
    'netflix': { type: 'expense', category: 'Loisirs', subCategory: 'Streaming' },
    'spotify': { type: 'expense', category: 'Loisirs', subCategory: 'Streaming' },
    'amazon': { type: 'expense', category: 'Divers', subCategory: 'Achat en ligne' },
    'facture': { type: 'expense', category: 'Logement', subCategory: 'Électricité' },
    'électricité': { type: 'expense', category: 'Logement', subCategory: 'Électricité' },
    'eau': { type: 'expense', category: 'Logement', subCategory: 'Eau' },
    'gaz': { type: 'expense', category: 'Logement', subCategory: 'Gaz' },
    'téléphone': { type: 'expense', category: 'Divers', subCategory: 'Abonnement téléphone' },
    'internet': { type: 'expense', category: 'Divers', subCategory: 'Abonnement internet' },
    'assurance': { type: 'expense', category: 'Divers', subCategory: 'Assurance' },
    'impôt': { type: 'expense', category: 'Divers', subCategory: 'Impôts' },
    'cadeau': { type: 'expense', category: 'Loisirs', subCategory: 'Cadeaux' },
    'vêtement': { type: 'expense', category: 'Divers', subCategory: 'Vêtements' },
    'chaussure': { type: 'expense', category: 'Divers', subCategory: 'Chaussures' },
    'pharmacie': { type: 'expense', category: 'Santé', subCategory: 'Médicaments' },
    'médecin': { type: 'expense', category: 'Santé', subCategory: 'Médecin' },
    'dentiste': { type: 'expense', category: 'Santé', subCategory: 'Dentiste' },
    'coiffeur': { type: 'expense', category: 'Santé', subCategory: 'Soins personnels' },
    'vacance': { type: 'expense', category: 'Loisirs', subCategory: 'Vacances' },
    'voyage': { type: 'expense', category: 'Loisirs', subCategory: 'Vacances' },
    'hôtel': { type: 'expense', category: 'Loisirs', subCategory: 'Vacances' },
    'avion': { type: 'expense', category: 'Transport', subCategory: 'Voyage' },
    'train': { type: 'expense', category: 'Transport', subCategory: 'Transports en commun' },
    'bus': { type: 'expense', category: 'Transport', subCategory: 'Transports en commun' },
    'métro': { type: 'expense', category: 'Transport', subCategory: 'Transports en commun' },
    'tram': { type: 'expense', category: 'Transport', subCategory: 'Transports en commun' },
    'vélo': { type: 'expense', category: 'Transport', subCategory: 'Autre' },
    'voiture': { type: 'expense', category: 'Transport', subCategory: 'Entretien voiture' },
    'garage': { type: 'expense', category: 'Transport', subCategory: 'Entretien voiture' },
    'parking': { type: 'expense', category: 'Transport', subCategory: 'Parking' },
    'péage': { type: 'expense', category: 'Transport', subCategory: 'Péages' },
    'uber': { type: 'expense', category: 'Transport', subCategory: 'Taxi' },
    'taxi': { type: 'expense', category: 'Transport', subCategory: 'Taxi' },
    'cinéma': { type: 'expense', category: 'Loisirs', subCategory: 'Cinéma' },
    'sport': { type: 'expense', category: 'Santé', subCategory: 'Sport' },
    'gym': { type: 'expense', category: 'Santé', subCategory: 'Sport' },
    'fitness': { type: 'expense', category: 'Santé', subCategory: 'Sport' }
};

// Migration des données
const migrateData = (loadedState) => {
    if (!loadedState) return initialState;
    if (!loadedState.appVersion || loadedState.appVersion < "5.0.0") {
        // Migration logic here
    }
    loadedState.appVersion = "5.0.0";
    return { ...initialState, ...loadedState };
};

// Sauvegarde et chargement
const saveState = () => {
    try {
        localStorage.setItem('financialDashboardState', JSON.stringify(state));
        showToast('Données sauvegardées !');
    } catch (error) {
        console.error('Erreur sauvegarde:', error);
        showToast('Erreur de sauvegarde.', 'error');
    }
};

const loadState = () => {
    try {
        const saved = localStorage.getItem('financeAppState');
        if (saved) {
            const parsedState = JSON.parse(saved);
            state = migrateData(parsedState);
        } else {
            state = { ...initialState };
            initializeBudgetMonth();
        }
        cacheInvalidated = true;
    } catch (error) {
        console.error('Erreur chargement:', error);
        state = { ...initialState };
        initializeBudgetMonth();
    }
}

function migrateData(data) {
    const migrated = { ...initialState, ...data, appVersion: APP_VERSION };
    
    if (!migrated.monthlyBudgets) {
        migrated.monthlyBudgets = {};
    }
    
    if (!migrated.currentBudgetMonth) {
        const now = new Date();
        migrated.currentBudgetMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    
    if (!migrated.tasks) migrated.tasks = [];
    if (!migrated.wishlist) migrated.wishlist = [];
    if (!migrated.netWorthHistory) migrated.netWorthHistory = [];
    if (!migrated.transactionTemplates) migrated.transactionTemplates = [];
    if (!migrated.budgetHistory) migrated.budgetHistory = [];
    
    return migrated;
}

function initializeBudgetMonth() {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    if (!state.currentBudgetMonth) {
        state.currentBudgetMonth = currentMonth;
    }
    
    if (!state.monthlyBudgets[state.currentBudgetMonth]) {
        state.monthlyBudgets[state.currentBudgetMonth] = {};
    }
}

function invalidateBalanceCache() {
    accountBalanceCache.clear();
    cacheInvalidated = true;
}

function fullUpdate(callback) {
    invalidateBalanceCache();
    saveState();
    if (typeof render === 'function') {
        render();
    }
    if (callback && typeof callback === 'function') {
        callback();
    }
}
