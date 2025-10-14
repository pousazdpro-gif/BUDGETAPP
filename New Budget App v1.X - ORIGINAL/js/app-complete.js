        document.addEventListener('DOMContentLoaded', () => {
            // Initialiser PDF.js
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;

            const APP_VERSION = "5.0.0";

            // ========== STATE MANAGEMENT ========== //
            let state = {};
            const initialState = {
                appVersion: APP_VERSION,
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
                'carwash': { type: 'expense', category: 'Transport', subCategory: 'Entretien voiture' },
                'lavage': { type: 'expense', category: 'Transport', subCategory: 'Entretien voiture' },
                'parking': { type: 'expense', category: 'Transport', subCategory: 'Parking' },
                'péage': { type: 'expense', category: 'Transport', subCategory: 'Péages' },
                'essence': { type: 'expense', category: 'Transport', subCategory: 'Carburant' },
                'diesel': { type: 'expense', category: 'Transport', subCategory: 'Carburant' },
                'sans plomb': { type: 'expense', category: 'Transport', subCategory: 'Carburant' },
                'sp95': { type: 'expense', category: 'Transport', subCategory: 'Carburant' },
                'sp98': { type: 'expense', category: 'Transport', subCategory: 'Carburant' },
                'gazole': { type: 'expense', category: 'Transport', subCategory: 'Carburant' },
                'électrique': { type: 'expense', category: 'Transport', subCategory: 'Carburant' },
                'recharge': { type: 'expense', category: 'Transport', subCategory: 'Carburant' },
                'bornes': { type: 'expense', category: 'Transport', subCategory: 'Carburant' },
                'tesla': { type: 'expense', category: 'Transport', subCategory: 'Carburant' },
                'lease': { type: 'expense', category: 'Transport', subCategory: 'Location' },
                'leasing': { type: 'expense', category: 'Transport', subCategory: 'Location' },
                'location': { type: 'expense', category: 'Transport', subCategory: 'Location' },
                'uber': { type: 'expense', category: 'Transport', subCategory: 'Taxi' },
                'bolt': { type: 'expense', category: 'Transport', subCategory: 'Taxi' },
                'taxi': { type: 'expense', category: 'Transport', subCategory: 'Taxi' },
                'blablacar': { type: 'expense', category: 'Transport', subCategory: 'Covoiturage' },
                'covoiturage': { type: 'expense', category: 'Transport', subCategory: 'Covoiturage' },
                'trainline': { type: 'expense', category: 'Transport', subCategory: 'Train' },
                'sncf': { type: 'expense', category: 'Transport', subCategory: 'Train' },
                'ouigo': { type: 'expense', category: 'Transport', subCategory: 'Train' },
                'tgv': { type: 'expense', category: 'Transport', subCategory: 'Train' },
                'ter': { type: 'expense', category: 'Transport', subCategory: 'Train' },
                'intercité': { type: 'expense', category: 'Transport', subCategory: 'Train' },
                'eurostar': { type: 'expense', category: 'Transport', subCategory: 'Train' },
                'thalys': { type: 'expense', category: 'Transport', subCategory: 'Train' },
                'lyria': { type: 'expense', category: 'Transport', subCategory: 'Train' },
                'airfrance': { type: 'expense', category: 'Transport', subCategory: 'Avion' },
                'ryanair': { type: 'expense', category: 'Transport', subCategory: 'Avion' },
                'easyjet': { type: 'expense', category: 'Transport', subCategory: 'Avion' },
                'lufthansa': { type: 'expense', category: 'Transport', subCategory: 'Avion' },
                'emirates': { type: 'expense', category: 'Transport', subCategory: 'Avion' },
                'qatar': { type: 'expense', category: 'Transport', subCategory: 'Avion' },
                'singapore': { type: 'expense', category: 'Transport', subCategory: 'Avion' },
                'turkish': { type: 'expense', category: 'Transport', subCategory: 'Avion' },
                'billet': { type: 'expense', category: 'Loisirs', subCategory: 'Événements' },
                'concert': { type: 'expense', category: 'Loisirs', subCategory: 'Événements' },
                'festival': { type: 'expense', category: 'Loisirs', subCategory: 'Événements' },
                'cinéma': { type: 'expense', category: 'Loisirs', subCategory: 'Cinéma' },
                'ugc': { type: 'expense', category: 'Loisirs', subCategory: 'Cinéma' },
                'pathé': { type: 'expense', category: 'Loisirs', subCategory: 'Cinéma' },
                'gaumont': { type: 'expense', category: 'Loisirs', subCategory: 'Cinéma' },
                'netflix': { type: 'expense', category: 'Loisirs', subCategory: 'Streaming' },
                'disney': { type: 'expense', category: 'Loisirs', subCategory: 'Streaming' },
                'prime': { type: 'expense', category: 'Loisirs', subCategory: 'Streaming' },
                'amazon prime': { type: 'expense', category: 'Loisirs', subCategory: 'Streaming' },
                'apple tv': { type: 'expense', category: 'Loisirs', subCategory: 'Streaming' },
                'hbo': { type: 'expense', category: 'Loisirs', subCategory: 'Streaming' },
                'canal': { type: 'expense', category: 'Loisirs', subCategory: 'Streaming' },
                'canal+': { type: 'expense', category: 'Loisirs', subCategory: 'Streaming' },
                'bein': { type: 'expense', category: 'Loisirs', subCategory: 'Streaming' },
                'beinsports': { type: 'expense', category: 'Loisirs', subCategory: 'Streaming' },
                'spotify': { type: 'expense', category: 'Loisirs', subCategory: 'Musique' },
                'deezer': { type: 'expense', category: 'Loisirs', subCategory: 'Musique' },
                'apple music': { type: 'expense', category: 'Loisirs', subCategory: 'Musique' },
                'tidal': { type: 'expense', category: 'Loisirs', subCategory: 'Musique' },
                'qobuz': { type: 'expense', category: 'Loisirs', subCategory: 'Musique' },
                'youtube': { type: 'expense', category: 'Loisirs', subCategory: 'Streaming' },
                'youtube premium': { type: 'expense', category: 'Loisirs', subCategory: 'Streaming' },
                'twitch': { type: 'expense', category: 'Loisirs', subCategory: 'Streaming' },
                'crunchyroll': { type: 'expense', category: 'Loisirs', subCategory: 'Streaming' },
                'adn': { type: 'expense', category: 'Loisirs', subCategory: 'Streaming' },
                'wakanim': { type: 'expense', category: 'Loisirs', subCategory: 'Streaming' },
                'manga': { type: 'expense', category: 'Loisirs', subCategory: 'Livres' },
                'livre': { type: 'expense', category: 'Loisirs', subCategory: 'Livres' },
                'fnac': { type: 'expense', category: 'Loisirs', subCategory: 'Livres' },
                'amazon livre': { type: 'expense', category: 'Loisirs', subCategory: 'Livres' },
                'kindle': { type: 'expense', category: 'Loisirs', subCategory: 'Livres' },
                'audiolivres': { type: 'expense', category: 'Loisirs', subCategory: 'Livres' },
                'audible': { type: 'expense', category: 'Loisirs', subCategory: 'Livres' },
                'jeu': { type: 'expense', category: 'Loisirs', subCategory: 'Jeux vidéo' },
                'jeux': { type: 'expense', category: 'Loisirs', subCategory: 'Jeux vidéo' },
                'jeux vidéo': { type: 'expense', category: 'Loisirs', subCategory: 'Jeux vidéo' },
                'ps5': { type: 'expense', category: 'Loisirs', subCategory: 'Jeux vidéo' },
                'playstation': { type: 'expense', category: 'Loisirs', subCategory: 'Jeux vidéo' },
                'xbox': { type: 'expense', category: 'Loisirs', subCategory: 'Jeux vidéo' },
                'nintendo': { type: 'expense', category: 'Loisirs', subCategory: 'Jeux vidéo' },
                'switch': { type: 'expense', category: 'Loisirs', subCategory: 'Jeux vidéo' },
                'steam': { type: 'expense', category: 'Loisirs', subCategory: 'Jeux vidéo' },
                'epic': { type: 'expense', category: 'Loisirs', subCategory: 'Jeux vidéo' },
                'origin': { type: 'expense', category: 'Loisirs', subCategory: 'Jeux vidéo' },
                'ubisoft': { type: 'expense', category: 'Loisirs', subCategory: 'Jeux vidéo' },
                'battle.net': { type: 'expense', category: 'Loisirs', subCategory: 'Jeux vidéo' },
                'blizzard': { type: 'expense', category: 'Loisirs', subCategory: 'Jeux vidéo' },
                'riot': { type: 'expense', category: 'Loisirs', subCategory: 'Jeux vidéo' },
                'valorant': { type: 'expense', category: 'Loisirs', subCategory: 'Jeux vidéo' },
                'lol': { type: 'expense', category: 'Loisirs', subCategory: 'Jeux vidéo' },
                'league of legends': { type: 'expense', category: 'Loisirs', subCategory: 'Jeux vidéo' },
                'fortnite': { type: 'expense', category: 'Loisirs', subCategory: 'Jeux vidéo' },
                'minecraft': { type: 'expense', category: 'Loisirs', subCategory: 'Jeux vidéo' },
                'roblox': { type: 'expense', category: 'Loisirs', subCategory: 'Jeux vidéo' },
                'gta': { type: 'expense', category: 'Loisirs', subCategory: 'Jeux vidéo' },
                'fifa': { type: 'expense', category: 'Loisirs', subCategory: 'Jeux vidéo' },
                'call of duty': { type: 'expense', category: 'Loisirs', subCategory: 'Jeux vidéo' },
                'cod': { type: 'expense', category: 'Loisirs', subCategory: 'Jeux vidéo' },
                'assassin': { type: 'expense', category: 'Loisirs', subCategory: 'Jeux vidéo' },
                'assassin\'s creed': { type: 'expense', category: 'Loisirs', subCategory: 'Jeux vidéo' },
                'zelda': { type: 'expense', category: 'Loisirs', subCategory: 'Jeux vidéo' },
                'mario': { type: 'expense', category: 'Loisirs', subCategory: 'Jeux vidéo' },
                'pokémon': { type: 'expense', category: 'Loisirs', subCategory: 'Jeux vidéo' },
                'animal crossing': { type: 'expense', category: 'Loisirs', subCategory: 'Jeux vidéo' },
                'sport': { type: 'expense', category: 'Santé', subCategory: 'Sport' },
                'gym': { type: 'expense', category: 'Santé', subCategory: 'Sport' },
                'fitness': { type: 'expense', category: 'Santé', subCategory: 'Sport' },
                'salle de sport': { type: 'expense', category: 'Santé', subCategory: 'Sport' },
                'basic fit': { type: 'expense', category: 'Santé', subCategory: 'Sport' },
                'keepcool': { type: 'expense', category: 'Santé', subCategory: 'Sport' },
                'neoness': { type: 'expense', category: 'Santé', subCategory: 'Sport' },
                'fitness park': { type: 'expense', category: 'Santé', subCategory: 'Sport' },
                'l\'usine': { type: 'expense', category: 'Santé', subCategory: 'Sport' },
                'crossfit': { type: 'expense', category: 'Santé', subCategory: 'Sport' },
                'yoga': { type: 'expense', category: 'Santé', subCategory: 'Sport' },
                'pilates': { type: 'expense', category: 'Santé', subCategory: 'Sport' },
                'natation': { type: 'expense', category: 'Santé', subCategory: 'Sport' },
                'piscine': { type: 'expense', category: 'Santé', subCategory: 'Sport' },
                'tennis': { type: 'expense', category: 'Santé', subCategory: 'Sport' },
                'golf': { type: 'expense', category: 'Santé', subCategory: 'Sport' },
                'équitation': { type: 'expense', category: 'Santé', subCategory: 'Sport' },
                'escalade': { type: 'expense', category: 'Santé', subCategory: 'Sport' },
                'ski': { type: 'expense', category: 'Santé', subCategory: 'Sport' },
                'snowboard': { type: 'expense', category: 'Santé', subCategory: 'Sport' },
                'randonnée': { type: 'expense', category: 'Santé', subCategory: 'Sport' },
                'vélo': { type: 'expense', category: 'Santé', subCategory: 'Sport' },
                'cyclisme': { type: 'expense', category: 'Santé', subCategory: 'Sport' },
                'course': { type: 'expense', category: 'Santé', subCategory: 'Sport' },
                'marathon': { type: 'expense', category: 'Santé', subCategory: 'Sport' },
                'triathlon': { type: 'expense', category: 'Santé', subCategory: 'Sport' },
                'musculation': { type: 'expense', category: 'Santé', subCategory: 'Sport' },
                'boxe': { type: 'expense', category: 'Santé', subCategory: 'Sport' },
                'arts martiaux': { type: 'expense', category: 'Santé', subCategory: 'Sport' },
                'judo': { type: 'expense', category: 'Santé', subCategory: 'Sport' },
                'karaté': { type: 'expense', category: 'Santé', subCategory: 'Sport' },
                'aïkido': { type: 'expense', category: 'Santé', subCategory: 'Sport' },
                'taekwondo': { type: 'expense', category: 'Santé', subCategory: 'Sport' },
                'krav maga': { type: 'expense', category: 'Santé', subCategory: 'Sport' },
                'danse': { type: 'expense', category: 'Santé', subCategory: 'Sport' },
                'zumba': { type: 'expense', category: 'Santé', subCategory: 'Sport' },
                'abonnements': { type: 'expense', category: 'Divers', subCategory: 'Abonnements' },
                'abonnements divers': { type: 'expense', category: 'Divers', subCategory: 'Abonnements' },
            };

            // Instances des graphiques avec gestion mémoire optimisée
            let netWorthChart = null;
            let cashFlowChart = null;
            let forecastChart = null;
            let expenseDonutChart = null;
            let assetsPieChart = null;
            let flowLineChart = null;
            
            // Fonction pour détruire proprement les graphiques
            const destroyChart = (chart) => {
                if (chart && typeof chart.destroy === 'function') {
                    chart.destroy();
                }
                return null;
            };
            
            const destroyAllCharts = () => {
                netWorthChart = destroyChart(netWorthChart);
                cashFlowChart = destroyChart(cashFlowChart);
                forecastChart = destroyChart(forecastChart);
                expenseDonutChart = destroyChart(expenseDonutChart);
                assetsPieChart = destroyChart(assetsPieChart);
                flowLineChart = destroyChart(flowLineChart);
            };

            // ========== UTILITY FUNCTIONS ========== //
            const generateId = () => `id_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`;

            // Cache pour les formatters de devise
            const currencyFormatters = new Map();
            const formatCurrency = (amount, currency = state.baseCurrency) => {
                if (isNaN(amount)) return "0.00";
                
                // Formatage spécial pour BTC avec plus de décimales
                if (currency === 'BTC') {
                    return `₿ ${parseFloat(amount).toFixed(8)}`;
                }
                
                if (!currencyFormatters.has(currency)) {
                    currencyFormatters.set(currency, new Intl.NumberFormat('fr-FR', { style: 'currency', currency }));
                }
                
                return currencyFormatters.get(currency).format(amount);
            };

            const today = () => new Date().toISOString().split('T')[0];

            // Optimisation: réutiliser les éléments toast
            let currentToast = null;
            const showToast = (message, type = 'success') => {
                if (currentToast) {
                    currentToast.remove();
                }
                
                currentToast = document.createElement('div');
                currentToast.className = `fixed bottom-5 right-5 ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white py-2 px-4 rounded-lg shadow-lg animate-bounce z-50`;
                currentToast.textContent = message;
                document.body.appendChild(currentToast);
                
                setTimeout(() => {
                    if (currentToast) {
                        currentToast.remove();
                        currentToast = null;
                    }
                }, 3000);
            };

            // Fonction de debounce pour optimiser les performances
            const debounce = (func, wait) => {
                let timeout;
                return function executedFunction(...args) {
                    const later = () => {
                        clearTimeout(timeout);
                        func(...args);
                    };
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                };
            };

            // ========== DATA MIGRATION ========== //
            const migrateData = (loadedState) => {
                if (!loadedState) return initialState;

                // Migration logic for older data structures
                if (!loadedState.appVersion || loadedState.appVersion < APP_VERSION) {
                    // This is the place for any future data structure updates
                }

                loadedState.appVersion = APP_VERSION;

                // A robust deep merge is required to correctly combine the default state
                // with the user's saved data, especially for nested arrays of objects like investment history.
                const isObject = (item) => item && typeof item === 'object' && !Array.isArray(item);

                function mergeDeep(target, source) {
                    let output = { ...target };
                    if (isObject(target) && isObject(source)) {
                        Object.keys(source).forEach(key => {
                            if (isObject(source[key])) {
                                if (!(key in target)) {
                                    Object.assign(output, { [key]: source[key] });
                                } else {
                                    output[key] = mergeDeep(target[key], source[key]);
                                }
                            } else if (Array.isArray(source[key])) {
                                // Crucially, if the source has an array (e.g., investments, transactions, history),
                                // we must take the source's array, not the default empty one.
                                output[key] = source[key];
                            } else {
                                Object.assign(output, { [key]: source[key] });
                            }
                        });
                    }
                    return output;
                }

                const freshInitialState = JSON.parse(JSON.stringify(initialState));
                return mergeDeep(freshInitialState, loadedState);
            };

            // ========== LOCAL STORAGE & DATA I/O ========== //
            const saveState = () => {
                try {
                    console.log('Saving state...', state);
                    localStorage.setItem('financialDashboardState', JSON.stringify(state));
                    console.log('State saved successfully');
                    showToast('Données sauvegardées !');
                } catch (error) {
                    console.error('Erreur sauvegarde:', error);
                    showToast('Erreur lors de la sauvegarde', 'error');
                }
            };

            const loadState = () => {
                try {
                    const savedState = localStorage.getItem('financialDashboardState');
                    if (savedState) {
                        const parsedState = JSON.parse(savedState);
                        state = migrateData(parsedState);
                        console.log('État chargé avec succès depuis localStorage');
                    } else {
                        state = { ...initialState };
                        console.log('Initialisation avec état par défaut');
                    }
                } catch (error) {
                    console.error('Erreur lors du chargement de l\'état:', error);
                    console.log('Réinitialisation avec état par défaut');
                    // Nettoyer le localStorage corrompu
                    try {
                        localStorage.removeItem('financialDashboardState');
                    } catch (e) {
                        console.error('Impossible de nettoyer localStorage:', e);
                    }
                    state = { ...initialState };
                }
            };

            const fetchExchangeRates = async (isSilent = false) => {
                try {
                    // Récupération des taux de change traditionnels
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 10000); // Timeout de 10s
                    
                    const response = await fetch(`https://api.frankfurter.app/latest?from=${state.baseCurrency}`, {
                        signal: controller.signal,
                        headers: {
                            'Accept': 'application/json',
                            'Cache-Control': 'no-cache'
                        }
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    
                    const data = await response.json();
                    
                    if (!data.rates) {
                        throw new Error('Format de réponse invalide');
                    }
                    
                    const convertedRates = {};
                    for (const currency in data.rates) {
                        convertedRates[currency] = 1 / data.rates[currency];
                    }
                    
                    // Récupération du prix BTC
                    try {
                        const btcController = new AbortController();
                        const btcTimeoutId = setTimeout(() => btcController.abort(), 10000);
                        
                        const btcResponse = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${state.baseCurrency.toLowerCase()}`, {
                            signal: btcController.signal,
                            headers: {
                                'Accept': 'application/json',
                                'Cache-Control': 'no-cache'
                            }
                        });
                        
                        clearTimeout(btcTimeoutId);
                        
                        if (btcResponse.ok) {
                            const btcData = await btcResponse.json();
                            if (btcData.bitcoin && btcData.bitcoin[state.baseCurrency.toLowerCase()]) {
                                const btcPrice = btcData.bitcoin[state.baseCurrency.toLowerCase()];
                                convertedRates['BTC'] = btcPrice; // Prix BTC en devise de base
                            }
                        }
                    } catch (btcError) {
                        console.warn('Impossible de récupérer le prix BTC:', btcError);
                        // Garder le taux BTC existant si la récupération échoue
                        if (state.exchangeRates['BTC']) {
                            convertedRates['BTC'] = state.exchangeRates['BTC'];
                        }
                    }
                    
                    state.exchangeRates = { ...state.exchangeRates, ...convertedRates, [state.baseCurrency]: 1 };
                    invalidateBalanceCache(); // Invalider le cache après mise à jour des taux
                    
                    if (!isSilent) showToast('Taux de change mis à jour (BTC inclus).');
                } catch (error) {
                    console.error('Erreur taux de change:', error);
                    const errorMessage = error.name === 'AbortError' ? 'Timeout de la requête' : 'Impossible de mettre à jour les taux';
                    if (!isSilent) showToast(errorMessage, 'error');
                }
            };

            const fetchCryptoPrices = async () => {
                const cryptoInvestments = state.investments.filter(inv => inv.type === 'Crypto' && inv.ticker?.trim());
                if (cryptoInvestments.length === 0) {
                    showToast('Aucun investissement crypto valide.', 'info');
                    return;
                }

                const ids = cryptoInvestments.map(inv => inv.ticker).join(',');
                const vs_currency = state.baseCurrency.toLowerCase();

                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 15000); // Timeout de 15s
                    
                    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${vs_currency}`, {
                        signal: controller.signal,
                        headers: {
                            'Accept': 'application/json',
                            'Cache-Control': 'no-cache'
                        }
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (!response.ok) {
                        throw new Error(`API CoinGecko HTTP ${response.status}: ${response.statusText}`);
                    }
                    
                    const data = await response.json();
                    let updatedCount = 0;

                    cryptoInvestments.forEach(inv => {
                        if (data[inv.ticker]?.[vs_currency]) {
                            inv.currentValue = data[inv.ticker][vs_currency];
                            updatedCount++;
                        }
                    });

                    if (updatedCount > 0) {
                        showToast(`${updatedCount} prix crypto mis à jour !`);
                        invalidateBalanceCache();
                        fullUpdate();
                    } else {
                        showToast('Aucun prix mis à jour.', 'error');
                    }
                } catch (error) {
                    console.error('Erreur prix crypto:', error);
                    const errorMessage = error.name === 'AbortError' ? 'Timeout de la requête crypto' : 'Erreur récupération prix crypto';
                    showToast(errorMessage, 'error');
                }
            };

            const exportData = () => {
                const dataStr = JSON.stringify(state, null, 2);
                const blob = new Blob([dataStr], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `financeapp-backup-${today()}.json`;
                a.click();
                URL.revokeObjectURL(url);
                showToast('Exportation démarrée.');
            };

            const exportTransactionsToCsv = () => {
                const transactions = getTransactionsForFilter();
                if (transactions.length === 0) {
                    showToast("Aucune transaction à exporter.", "info");
                    return;
                }

                const headers = ['Date', 'Description', 'Type', 'Montant', 'Devise', 'Compte', 'Catégorie', 'Sous-catégorie', 'Tags', 'Notes'];
                const csvRows = [headers.join(',')];

                transactions.forEach(tx => {
                    const accountName = state.accounts.find(a => a.id === tx.accountId)?.name || 'N/A';
                    const row = [
                        tx.date,
                        `"${tx.description.replace(/"/g, '""')}"`,
                        tx.type,
                        tx.originalAmount,
                        tx.originalCurrency,
                        accountName,
                        tx.category,
                        tx.subCategory || '',
                        `"${(tx.tags || []).join(', ')}"`,
                        `"${(tx.notes || '').replace(/"/g, '""')}"`
                    ];
                    csvRows.push(row.join(','));
                });

                const csvString = csvRows.join('\n');
                const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `transactions-${today()}.csv`;
                a.click();
                URL.revokeObjectURL(url);
                showToast('Export CSV démarré.');
            };

            const importData = (file) => {
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const importedState = JSON.parse(e.target.result);
                        if (importedState.appVersion) {
                            state = migrateData(importedState);
                            saveState();
                            showToast('Données importées !');
                            setTimeout(() => location.reload(), 1000);
                        } else {
                            throw new Error("Fichier invalide.");
                        }
                    } catch (error) {
                        showToast(`Erreur import: ${error.message}`, 'error');
                    }
                    transactions = transactions.filter(tx => tx.accountId === state.activeAccountFilterId);
                }
                transactions = transactions.filter(tx => !tx.parentTransactionId);

                const filters = state.transactionFilters;
                if (filters.accountId) {
                    transactions = transactions.filter(tx => tx.accountId === filters.accountId);
                }
                if (filters.categoryId) {
                    transactions = transactions.filter(tx => tx.category === filters.categoryId);
                }
                if (filters.startDate) {
                    transactions = transactions.filter(tx => new Date(tx.date) >= new Date(filters.startDate));
                }
                if (filters.endDate) {
                    transactions = transactions.filter(tx => new Date(tx.date) <= new Date(filters.endDate));
                }
                if (filters.tags) {
                    const searchTags = filters.tags.toLowerCase().split(',').map(t => t.trim()).filter(Boolean);
                    if (searchTags.length > 0) {
                        transactions = transactions.filter(tx => tx.tags && tx.tags.some(tag => searchTags.includes(tag.toLowerCase())));
                    }
                }

                return transactions;
            };

            // Cache pour les balances des comptes
            const accountBalanceCache = new Map();
            let cacheInvalidated = true;
            
            const calculateAccountBalance = (accountId) => {
                if (!cacheInvalidated && accountBalanceCache.has(accountId)) {
                    return accountBalanceCache.get(accountId);
                }
                
                const account = state.accounts.find(a => a.id === accountId);
                if (!account) return 0;

                // Calculer le solde dans la devise de base (CHF)
                const balance = (state.transactions || []).filter(t => t.accountId === accountId && !t.isSplit).reduce((sum, t) => {
                    // Convertir le montant de la transaction vers la devise de base
                    const txRate = state.exchangeRates[t.originalCurrency] || 1;
                    const amountInBaseCurrency = t.originalAmount / txRate;
                    return t.type === 'income' ? sum + amountInBaseCurrency : sum - amountInBaseCurrency;
                }, 0);
                
                accountBalanceCache.set(accountId, balance);
                return balance;
            };
            
            const invalidateBalanceCache = () => {
                accountBalanceCache.clear();
                cacheInvalidated = true;
            };


            const calculateInvestmentDetails = (investmentId) => {
                const inv = state.investments.find(i => i.id === investmentId);
                if (!inv || !inv.history) {
                    return { totalQuantity: 0, totalCost: 0, pru: 0, totalSalesValue: 0, totalDividends: 0, currentQuantity: 0, totalBoughtQuantity: 0 };
                }

                const invCurrency = inv.currency || state.baseCurrency;
                let totalBoughtQuantity = 0;
                let totalBoughtCost = 0;
                let totalSoldQuantity = 0;
                let totalSalesValue = 0;
                let totalDividends = 0;

                const parseRobust = (value) => {
                    if (typeof value === 'number') return value;
                    if (typeof value !== 'string') return 0;
                    const cleanValue = String(value).replace(/[, ]/g, '').replace(/,/g, '.');
                    return parseFloat(cleanValue) || 0;
                };

                inv.history.forEach(entry => {
                    const entryCurrency = entry.currency || invCurrency;
                    let convertedAmount = parseRobust(entry.amount);
                    const quantity = parseRobust(entry.quantity);

                    if (entryCurrency !== invCurrency) {
                        if (state.exchangeRates && state.exchangeRates[entryCurrency] && state.exchangeRates[invCurrency]) {
                            const rateFrom = state.exchangeRates[entryCurrency];
                            const rateTo = state.exchangeRates[invCurrency];
                            convertedAmount = convertedAmount * (rateTo / rateFrom);
                        }
                    }

                    if (entry.type === 'buy' || quantity > 0 && entry.type !== 'sell') {
                        totalBoughtQuantity += quantity;
                        const cost = convertedAmount > 0 ? convertedAmount : (parseRobust(inv.currentValue) || 0) * quantity;
                        totalBoughtCost += cost;
                    } else if (entry.type === 'sell') {
                        totalSoldQuantity += quantity;
                        totalSalesValue += convertedAmount;
                    } else if (entry.type === 'dividend' || entry.type === 'dividende') {
                        totalDividends += convertedAmount;
                    }
                });

                const currentQuantity = totalBoughtQuantity - totalSoldQuantity;
                const pru = totalBoughtQuantity > 0 ? totalBoughtCost / totalBoughtQuantity : 0;

                return { 
                    totalCost: totalBoughtCost, 
                    pru, 
                    totalSalesValue, 
                    totalDividends, 
                    currentQuantity, 
                    totalBoughtQuantity 
                };
            };

            const calculateTotalInvestments = () => {
                return (state.investments || []).reduce((sum, inv) => {
                    const details = calculateInvestmentDetails(inv.id);
                    return sum + (inv.currentValue * details.currentQuantity);
                }, 0);
            };

            const calculateGoalProgress = (goalId) => {
                const goal = state.goals.find(g => g.id === goalId);
                if (!goal) return 0;

                let savedAmount = 0;
                savedAmount += (goal.manualContributions || []).reduce((sum, contrib) => sum + contrib.amount, 0);

                (goal.linkedAssetIds || []).forEach(assetId => {
                    const account = state.accounts.find(a => a.id === assetId);
                    if (account) {
                        savedAmount += calculateAccountBalance(account.id);
                    }

                    const investment = state.investments.find(i => i.id === assetId);
                    if (investment) {
                        const details = calculateInvestmentDetails(investment.id);
                        savedAmount += investment.currentValue * details.currentQuantity;
                    }
                });

                return savedAmount;
            };

            const calculateAverageMonthlySavings = (months = 6) => {
                const today = new Date();
                const pastDate = new Date();
                pastDate.setMonth(today.getMonth() - months);

                const relevantTransactions = state.transactions.filter(tx => {
                    const txDate = new Date(tx.date);
                    return txDate >= pastDate && txDate <= today && !tx.isSplit;
                });

                const totalIncome = relevantTransactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
                const totalExpense = relevantTransactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);

                return (totalIncome - totalExpense) / months;
            };

            const calculateAverageMonthlyIncome = (months = 3) => {
                const today = new Date();
                const startDate = new Date(today.getFullYear(), today.getMonth() - months, 1);
                
                const monthlyIncomes = state.transactions
                    .filter(tx => tx.type === 'income' && new Date(tx.date) >= startDate)
                    .reduce((sum, tx) => sum + tx.amount, 0);
                
                return monthlyIncomes / months;
            };

            const calculateAverageMonthlyExpenses = (months = 3) => {
                const today = new Date();
                const startDate = new Date(today.getFullYear(), today.getMonth() - months, 1);
                
                const monthlyExpenses = state.transactions
                    .filter(tx => tx.type === 'expense' && new Date(tx.date) >= startDate)
                    .reduce((sum, tx) => sum + tx.amount, 0);
                
                return monthlyExpenses / months;
            };

            const calculateDebtOutstanding = (debt) => {
                if (!debt?.history) return 0;

                const initial = debt.history.find(h => h.type === 'initial')?.amount || 0;
                const repaid = debt.history.filter(h => h.type === 'repayment').reduce((sum, h) => sum + h.amount, 0);

                return initial - repaid;
            };

            const isDebtFullyPaid = (debt) => {
                return calculateDebtOutstanding(debt) <= 0;
            };

            const autoArchiveDebt = (debt) => {
                if (isDebtFullyPaid(debt) && !debt.archived) {
                    debt.archived = true;
                    debt.archivedDate = today();
                    showToast(`Dette "${debt.name}" automatiquement archivée (entièrement remboursée)`, 'success');
                }
            };

            const isClaimFullyPaid = (claim) => {
                return calculateClaimOutstanding(claim) <= 0;
            };

            const autoArchiveClaim = (claim) => {
                if (isClaimFullyPaid(claim) && !claim.archived) {
                    claim.archived = true;
                    claim.archivedDate = today();
                    showToast(`Créance "${claim.name}" automatiquement archivée (entièrement remboursée)`, 'success');
                }
            };

            const calculateTotalDebts = () => {
                return (state.debts || []).filter(debt => !debt.archived).reduce((sum, debt) => sum + calculateDebtOutstanding(debt), 0);
            };

            const calculateClaimOutstanding = (claim) => {
                if (!claim?.history) return 0;

                const initial = claim.history.find(h => h.type === 'initial')?.amount || 0;
                const received = claim.history.filter(h => h.type === 'paymentReceived').reduce((sum, h) => sum + h.amount, 0);

                return initial - received;
            };

            const calculateTotalClaims = () => {
                return (state.claims || []).filter(claim => !claim.archived).reduce((sum, claim) => sum + calculateClaimOutstanding(claim), 0);
            };

            const calculateTotalAccountsBalance = () => {
                return (state.accounts || []).reduce((sum, acc) => sum + calculateAccountBalance(acc.id), 0);
            };

            const calculateNetWorth = () => {
                const totalAccounts = calculateTotalAccountsBalance();
                return totalAccounts + calculateTotalInvestments() - calculateTotalDebts() + calculateTotalClaims();
            };

            const updateNetWorthHistory = () => {
                const now = today();
                const currentNetWorth = calculateNetWorth();

                if (!state.netWorthHistory) {
                    state.netWorthHistory = [];
                }

                const lastEntry = state.netWorthHistory[state.netWorthHistory.length - 1];
                if (!lastEntry || lastEntry.date !== now) {
                    state.netWorthHistory.push({ date: now, netWorth: currentNetWorth });
                } else {
                    lastEntry.netWorth = currentNetWorth;
                }

                if (state.netWorthHistory.length > 365) {
                    state.netWorthHistory.shift();
                }
            };

            // ========== MODAL FUNCTIONS ========== //
            const openModal = (title, contentHTML, size = 'max-w-md') => {
                closeModal();
                const modalContainer = document.getElementById('app-modal');
                modalContainer.innerHTML = `
                    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div class="bg-white rounded-lg shadow-xl w-full ${size}">
                            <div class="p-4 border-b flex justify-between items-center">
                                <h3 class="text-xl font-semibold">${title}</h3>
                                <button data-action="close-modal" class="text-gray-500 hover:text-gray-800 text-3xl font-bold">&times;</button>
                            </div>
                            <div class="p-6 modal-content overflow-y-auto">${contentHTML}</div>
                        </div>
                    </div>`;
                lucide.createIcons();
            };

            const closeModal = () => {
                console.log('Closing modal...');
                const modal = document.getElementById('app-modal');
                if (modal) {
                    modal.innerHTML = '';
                }
            };

            const fullUpdate = (callback) => {
                try {
                    console.log('fullUpdate called with callback:', callback);
                    cacheInvalidated = false; // Réinitialiser le flag de cache
                    updateNetWorthHistory();
                    console.log('About to save state...');
                    saveState();
                    console.log('State saved, now handling callback...');
                    
                    if (callback && typeof callback === 'function') {
                        console.log('Executing callback function');
                        callback();
                    } else {
                        console.log('No callback, closing modal and rendering');
                        closeModal();
                        render();
                    }
                } catch (error) {
                    console.error('Erreur lors de la mise à jour complète:', error);
                    showToast('Erreur lors de la mise à jour', 'error');
                }
            };

            // ========== OCR FUNCTIONS ========== //
            const showOcrUploadModal = () => {
                const content = `
                    <div id="ocr-initial-view">
                        <p class="mb-4 text-gray-600">Sélectionnez une image ou un PDF de ticket de caisse.</p>
                        <input type="file" id="ocr-file-input" accept="image/*,application/pdf" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                    </div>
                    <div id="ocr-progress-view" class="hidden text-center">
                        <p id="ocr-status" class="mb-2 font-semibold">Analyse en cours...</p>
                        <div class="w-full bg-gray-200 rounded-full h-2.5">
                            <div id="ocr-progress-bar" class="bg-indigo-600 h-2.5 rounded-full progress-bar" style="width: 0%"></div>
                        </div>
                    </div>`;

                openModal('Scanner un Ticket', content);

                document.getElementById('ocr-file-input').addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        document.getElementById('ocr-initial-view').classList.add('hidden');
                        document.getElementById('ocr-progress-view').classList.remove('hidden');
                        handleOcrFileUpload(file);
                    }
                });
            };

            const handleOcrFileUpload = (file) => {
                if (file.type === "application/pdf") {
                    handlePdfUploadForOcr(file);
                } else if (file.type.startsWith('image/')) {
                    handleImageUploadForOcr(file);
                } else {
                    showToast("Format non supporté.", "error");
                    closeModal();
                }
            };

            const handlePdfUploadForOcr = async (file) => {
                const statusEl = document.getElementById('ocr-status');
                const progressBar = document.getElementById('ocr-progress-bar');
                if (!statusEl || !progressBar) {
                    console.error('Éléments OCR introuvables');
                    return;
                }
                
                statusEl.textContent = 'Analyse du PDF...';
                progressBar.style.width = '5%';

                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const loadingTask = pdfjsLib.getDocument({
                            data: e.target.result,
                            cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/cmaps/',
                            cMapPacked: true
                        });
                        
                        const pdf = await loadingTask.promise;
                        const numPages = pdf.numPages;
                        console.log(`PDF détecté avec ${numPages} page(s)`);
                        
                        statusEl.textContent = `Traitement de ${numPages} page(s)...`;
                        progressBar.style.width = '10%';
                        
                        let allText = '';
                        
                        // Traiter toutes les pages
                        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                            statusEl.textContent = `Conversion page ${pageNum}/${numPages}...`;
                            const pageProgress = 10 + (pageNum - 1) * (40 / numPages);
                            progressBar.style.width = `${pageProgress}%`;
                            
                            const page = await pdf.getPage(pageNum);
                            const viewport = page.getViewport({ scale: 2.0 });
                            const canvas = document.createElement('canvas');
                            const context = canvas.getContext('2d');
                            canvas.height = viewport.height;
                            canvas.width = viewport.width;

                            await page.render({ canvasContext: context, viewport: viewport }).promise;
                            
                            // Convertir en blob et faire l'OCR
                            const blob = await new Promise(resolve => {
                                canvas.toBlob(resolve, 'image/jpeg', 0.95);
                            });
                            
                            if (blob) {
                                statusEl.textContent = `OCR page ${pageNum}/${numPages}...`;
                                const ocrProgress = 50 + (pageNum - 1) * (40 / numPages);
                                progressBar.style.width = `${ocrProgress}%`;
                                
                                const { data: { text } } = await Tesseract.recognize(blob, 'fra', {
                                    logger: m => {
                                        if (m.status === 'recognizing text') {
                                            const subProgress = Math.round(m.progress * (40 / numPages));
                                            progressBar.style.width = `${ocrProgress + subProgress}%`;
                                        }
                                    }
                                });
                                
                                allText += `\n=== PAGE ${pageNum} ===\n${text}\n`;
                                console.log(`Page ${pageNum} OCR terminé, ${text.length} caractères`);
                            }
                        }
                        
                        // Nettoyer les ressources PDF
                        await pdf.destroy();
                        
                        statusEl.textContent = 'Analyse du texte complet...';
                        progressBar.style.width = '95%';
                        
                        console.log('Texte complet extrait:', allText);
                        const detectedItems = parseOcrText(allText);
                        
                        statusEl.textContent = `${detectedItems.length} transaction(s) détectée(s) sur ${numPages} page(s)`;
                        progressBar.style.width = '100%';
                        
                        if (detectedItems.length > 0) {
                            setTimeout(() => {
                                closeModal();
                                showOcrValidationModal(detectedItems);
                            }, 1000);
                        } else {
                            statusEl.textContent = 'Aucune transaction détectée. Vérifiez la qualité du PDF.';
                        }
                        
                    } catch(error) {
                        console.error('Erreur PDF:', error);
                        showToast(`Erreur lecture PDF: ${error.message}`, "error");
                        closeModal();
                    }
                };
                
                reader.onerror = () => {
                    console.error('Erreur lecture fichier PDF');
                    showToast("Erreur lecture PDF", "error");
                    closeModal();
                };
                
                reader.readAsArrayBuffer(file);
            };

            const handleImageUploadForOcr = async (imageSrc) => {
                const statusDiv = document.getElementById('ocr-status');
                const progressBar = document.getElementById('ocr-progress-bar');
                
                if (!statusDiv || !progressBar) return;
                
                statusDiv.textContent = 'Initialisation de l\'OCR...';
                progressBar.style.width = '10%';
                
                try {
                    const { data: { text } } = await Tesseract.recognize(imageSrc, 'fra', {
                        logger: m => {
                            if (m.status === 'recognizing text') {
                                const progress = Math.round(m.progress * 100);
                                progressBar.style.width = `${10 + progress * 0.8}%`;
                                statusDiv.textContent = `Reconnaissance en cours... ${progress}%`;
                            }
                        }
                    });
                    
                    statusDiv.textContent = 'Analyse du texte...';
                    progressBar.style.width = '95%';
                    
                    const detectedItems = parseOcrText(text);
                    
                    statusDiv.textContent = `${detectedItems.length} transaction(s) détectée(s)`;
                    progressBar.style.width = '100%';
                    
                    if (detectedItems.length > 0) {
                        setTimeout(() => {
                            closeModal();
                            showOcrValidationModal(detectedItems);
                        }, 1000);
                    } else {
                        statusDiv.textContent = 'Aucune transaction détectée. Vérifiez la qualité de l\'image.';
                    }
                } catch (error) {
                    console.error('Erreur OCR:', error);
                    statusDiv.textContent = 'Erreur lors de la reconnaissance. Réessayez avec une image plus claire.';
                    progressBar.style.width = '0%';
                }
            };
            
            const parseOcrText = (text) => {
                console.log('=== DÉBUT PARSING OCR ===');
                console.log('Texte OCR brut (longueur: ' + text.length + '):', text.substring(0, 500) + '...');
                
                const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
                console.log('Nombre total de lignes:', lines.length);
                console.log('Premières 10 lignes:', lines.slice(0, 10));
                
                // Analyse des patterns dans le texte
                const amountLines = lines.filter(line => line.match(/\d+[.,]\d{2}/));
                console.log('Lignes contenant des montants:', amountLines.length);
                console.log('Exemples de lignes avec montants:', amountLines.slice(0, 5));
                
                // Détection du type de relevé bancaire
                const isRevolut = text.toLowerCase().includes('revolut') || text.includes('Rev-') || text.toLowerCase().includes('rev ');
                const isRaiffeisen = text.toLowerCase().includes('raiffeisen') || text.toLowerCase().includes('raiffeisenbank');
                const isUBS = text.toLowerCase().includes('ubs') || text.toLowerCase().includes('union bank');
                const isCredit = text.toLowerCase().includes('credit suisse') || text.toLowerCase().includes('cs ');
                
                console.log('Détection banque:', { isRevolut, isRaiffeisen, isUBS, isCredit });
                
                let result = [];
                
                // Essayer tous les parsers et prendre le meilleur résultat
                if (isRevolut) {
                    console.log('=== TENTATIVE PARSER REVOLUT ===');
                    result = parseRevolutStatement(lines);
                }
                
                if (result.length === 0 && isRaiffeisen) {
                    console.log('=== TENTATIVE PARSER RAIFFEISEN ===');
                    result = parseRaiffeisenStatement(lines);
                }
                
                if (result.length === 0) {
                    console.log('=== TENTATIVE PARSER GÉNÉRIQUE ===');
                    result = parseGenericStatement(lines);
                }
                
                // Si toujours aucun résultat, essayer un parsing plus agressif
                if (result.length === 0) {
                    console.log('=== TENTATIVE PARSER AGRESSIF ===');
                    result = parseAggressiveStatement(lines);
                }
                
                console.log('Résultat final:', result.length, 'transactions trouvées');
                console.log('Détails des transactions:', result);
                console.log('=== FIN PARSING OCR ===');
                return result;
            };
            
            // Parser spécifique pour Revolut avec extraction intelligente des montants
            const parseRevolutStatement = (lines) => {
                const transactions = [];
                const transactionLines = lines.filter(line => {
                    if (!line || line.trim().length < 10) return false;
                    const lowerLine = line.toLowerCase();
                    const hasDate = lowerLine.match(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}|\d{1,2}\s+\w{3,}/);
                    const hasAmount = lowerLine.match(/\d+[.,]\d{2}/);
                    const isHeaderOrFooter = ['revolut', 'statement', 'balance', 'total', 'date', 'description', 'amount'].some(kw => lowerLine.includes(kw));
                    return hasDate && hasAmount && !isHeaderOrFooter;
                });

                console.log(`Found ${transactionLines.length} potential transaction lines.`);

                transactionLines.forEach((line, index) => {
                    console.log(`\n[PARSING LINE ${index + 1}]: "${line}"`);

                    let dateStr, location = '', description = '', transactionAmount = 0, balance = 0, isExpense = false;

                    const dateMatch = line.match(/^(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}|\d{1,2}\s+\w{3,}\.?\s+\d{4})/i);
                    if (!dateMatch) {
                        console.log('   [FAILURE] No date found.');
                        return; // Skip line if no date
                    }
                    dateStr = dateMatch[0];

                    let textWithoutDate = line.substring(dateStr.length).trim();

                    // Extract all amounts from the rest of the line
                    const amountRegex = /(-?\d+[.,]\d{2})/g;
                    const allAmounts = (textWithoutDate.match(amountRegex) || []).map(m => parseFloat(m.replace(',', '.')));

                    if (allAmounts.length > 0) {
                        // First amount is the transaction, last is the balance
                        const transactionValue = allAmounts[0];
                        transactionAmount = Math.abs(transactionValue);
                        isExpense = transactionValue < 0;

                        if (allAmounts.length > 1) {
                            balance = allAmounts[allAmounts.length - 1];
                        }

                        // Remove all amounts to get the description text
                        description = textWithoutDate.replace(amountRegex, '').replace(/CHF|EUR|USD|GBP/gi, '').trim().replace(/\s{2,}/g, ' ');

                        // Try to extract location from the description
                        const locPatterns = [/^([A-Z]{2,}[A-Z\s&-]*)/, /^([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/];
                        let locMatch = null;
                        for (const p of locPatterns) {
                            locMatch = description.match(p);
                            if (locMatch) break;
                        }
                        if (locMatch) {
                            location = locMatch[1].trim();
                            description = description.replace(location, '').trim();
                        }

                        // Special case for 'Virement'
                        if (description.toLowerCase().includes('virement')) {
                            description = 'Virement';
                            location = '';
                        }

                    } else {
                        // If no amount found, the whole text is the description
                        description = textWithoutDate;
                    }

                    if (transactionAmount > 0 && dateStr) {
                        const transaction = {
                            id: generateId(),
                            description: description || 'N/A',
                            location: location || '',
                            amount: transactionAmount,
                            balance: balance,
                            date: convertRevolutDate(dateStr),
                            type: isExpense ? 'expense' : 'income',
                            currency: 'CHF',
                            category: categorizeTransaction(description || location),
                            selected: true,
                            rawLine: line
                        };
                        transactions.push(transaction);
                        console.log(`   [SUCCESS] Parsed Transaction:`, { date: transaction.date, location: transaction.location, desc: transaction.description, amount: transaction.amount });
                    } else {
                        console.log(`   [FAILURE] Could not parse line into a valid transaction.`);
                    }
                });

                console.log(`\n=== RÉSULTAT FINAL ===`);
                console.log(`Total transactions Revolut trouvées: ${transactions.length}`);
                transactions.forEach((tx, i) => {
                    console.log(`${i+1}. ${tx.date} | ${tx.description} | ${tx.amount} CHF (${tx.type})`);
                });
                
                return transactions;
            };
            
            // Fonction de conversion de date Revolut
            const convertRevolutDate = (dateStr) => {
                if (!dateStr) return today();
                
                // Format "DD MMM YYYY" (ex: "15 Jan 2024" ou "30 sept. 2025")
                if (dateStr.match(/\d{1,2}\s+\w{3,4}\.?\s+\d{4}/)) {
                    const months = {
                        // Anglais
                        'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
                        'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
                        'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12',
                        // Français
                        'janv': '01', 'févr': '02', 'mars': '03', 'avr': '04',
                        'mai': '05', 'juin': '06', 'juil': '07', 'août': '08',
                        'sept': '09', 'oct': '10', 'nov': '11', 'déc': '12'
                    };
                    
                    const parts = dateStr.toLowerCase().split(/\s+/);
                    if (parts.length === 3) {
                        const day = parts[0].padStart(2, '0');
                        const month = months[parts[1]] || '01';
                        const year = parts[2];
                        return `${year}-${month}-${day}`;
                    }
                }
                
                // Format "DD-MM-YYYY" ou "DD/MM/YYYY"
                if (dateStr.match(/\d{1,2}[-\/]\d{1,2}[-\/]\d{4}/)) {
                    const parts = dateStr.split(/[-\/]/);
                    if (parts.length === 3) {
                        const day = parts[0].padStart(2, '0');
                        const month = parts[1].padStart(2, '0');
                        const year = parts[2];
                        return `${year}-${month}-${day}`;
                    }
                }
                
                // Format "YYYY-MM-DD" (déjà correct)
                if (dateStr.match(/\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/)) {
                    return dateStr.replace(/\//g, '-');
                }
                
                return today();
            };
            
            // Parser pour Raiffeisen (à implémenter)
            const parseRaiffeisenStatement = (lines) => {
                console.log('=== PARSING RAIFFEISEN ===');
                const transactions = [];
                
                lines.forEach((line, index) => {
                    console.log(`Ligne ${index}: "${line}"`);
                    
                    // Pattern Raiffeisen basique
                    const raiffeisenPattern = /(\d{1,2}\.\d{1,2}\.\d{4})\s+(.+?)\s+(-?\d+[.,]\d{2})/i;
                    const match = line.match(raiffeisenPattern);
                    
                    if (match) {
                        const [, dateStr, description, amountStr] = match;
                        const amount = Math.abs(parseFloat(amountStr.replace(',', '.')));
                        const isExpense = amountStr.includes('-') || amountStr.startsWith('-');
                        
                        if (amount > 0 && description.length > 2) {
                            transactions.push({
                                description: description.trim(),
                                amount: amount,
                                date: convertSwissDate(dateStr),
                                type: isExpense ? 'expense' : 'income',
                                currency: 'CHF',
                                category: categorizeTransaction(description.trim())
                            });
                        }
                    }
                });
                
                console.log(`Total transactions Raiffeisen trouvées: ${transactions.length}`);
                return transactions;
            };
            
            // Parser générique amélioré
            const parseGenericStatement = (lines) => {
                console.log('=== PARSING GÉNÉRIQUE ===');
                const transactions = [];
                
                // Filtrer les lignes pertinentes
                const relevantLines = lines.filter(line => {
                    if (line.length < 8) return false;
                    if (!line.match(/\d+[.,]\d{2}/)) return false;
                    if (line.toLowerCase().includes('total') && line.toLowerCase().includes('balance')) return false;
                    if (line.toLowerCase().includes('statement') || line.toLowerCase().includes('period')) return false;
                    return true;
                });
                
                console.log('Lignes pertinentes filtrées:', relevantLines);
                
                relevantLines.forEach((line, index) => {
                    console.log(`Ligne ${index}: "${line}"`);
                    
                    // Patterns génériques multiples
                    const patterns = [
                        // Format avec date: "DD.MM.YYYY Description Amount"
                        /(\d{1,2}\.\d{1,2}\.\d{4})\s+(.+?)\s+(-?\d+[.,]\d{2})\s*(CHF|EUR|USD|GBP|£|€|\$)?\s*$/i,
                        
                        // Format avec date: "DD/MM/YYYY Description Amount"
                        /(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+(-?\d+[.,]\d{2})\s*(CHF|EUR|USD|GBP|£|€|\$)?\s*$/i,
                        
                        // Format avec date: "YYYY-MM-DD Description Amount"
                        /(\d{4}-\d{1,2}-\d{1,2})\s+(.+?)\s+(-?\d+[.,]\d{2})\s*(CHF|EUR|USD|GBP|£|€|\$)?\s*$/i,
                        
                        // Format simple: "Description Amount Currency"
                        /^(.+?)\s+(-?\d+[.,]\d{2})\s*(CHF|EUR|USD|GBP|£|€|\$)\s*$/i,
                        
                        // Format tableau avec espaces multiples
                        /^(.+?)\s{2,}(-?\d+[.,]\d{2})\s*(CHF|EUR|USD|GBP|£|€|\$)?\s*$/i,
                        
                        // Format basique: "Description Amount" (sans devise)
                        /^(.+?)\s+(-?\d+[.,]\d{2})\s*$/i
                    ];
                    
                    let match = null;
                    let patternUsed = -1;
                    let dateStr = null;
                    
                    for (let i = 0; i < patterns.length; i++) {
                        match = line.match(patterns[i]);
                        if (match) {
                            patternUsed = i;
                            console.log(`Pattern générique ${i} matched:`, match);
                            break;
                        }
                    }
                    
                    if (match) {
                        let description, amountStr, currency;
                        
                        if (patternUsed <= 2) {
                            // Formats avec date
                            [, dateStr, description, amountStr, currency] = match;
                        } else {
                            // Formats sans date
                            [, description, amountStr, currency] = match;
                        }
                        
                        // Nettoyer la description
                        description = description.trim()
                            .replace(/\s+/g, ' ')
                            .replace(/[^\w\s\-\.\,]/g, ' ')
                            .trim();
                        
                        const amount = Math.abs(parseFloat(amountStr.replace(',', '.')));
                        const isExpense = amountStr.includes('-') || amountStr.startsWith('-');
                        
                        // Détecter la devise depuis les symboles
                        if (!currency) {
                            if (line.includes('€')) currency = 'EUR';
                            else if (line.includes('$')) currency = 'USD';
                            else if (line.includes('£')) currency = 'GBP';
                            else currency = 'CHF';
                        }
                        
                        console.log('Parsed générique:', { dateStr, description, amount, isExpense, currency });
                        
                        // Validation
                        if (amount > 0 && description && description.length > 3 &&
                            !description.toLowerCase().includes('balance') &&
                            !description.toLowerCase().includes('total') &&
                            !description.toLowerCase().includes('statement') &&
                            !description.toLowerCase().includes('page')) {
                            
                            transactions.push({
                                description: description,
                                amount: amount,
                                date: dateStr ? convertGenericDate(dateStr) : today(),
                                type: isExpense ? 'expense' : 'income',
                                currency: currency || 'CHF',
                                category: categorizeTransaction(description)
                            });
                            console.log('Transaction générique ajoutée:', transactions[transactions.length - 1]);
                        } else {
                            console.log('Transaction générique rejetée - validation échouée');
                        }
                    } else {
                        console.log('Aucun pattern générique ne correspond');
                    }
                });
                
                console.log(`Total transactions génériques trouvées: ${transactions.length}`);
                return transactions;
            };
            
            // Fonction de conversion de date générique
            const convertGenericDate = (dateStr) => {
                console.log('Conversion date générique:', dateStr);
                
                // Format DD.MM.YYYY
                if (dateStr.includes('.')) {
                    const parts = dateStr.split('.');
                    if (parts.length === 3) {
                        const day = parts[0].padStart(2, '0');
                        const month = parts[1].padStart(2, '0');
                        const year = parts[2];
                        return `${year}-${month}-${day}`;
                    }
                }
                
                // Format DD/MM/YYYY
                if (dateStr.includes('/')) {
                    const parts = dateStr.split('/');
                    if (parts.length === 3) {
                        const day = parts[0].padStart(2, '0');
                        const month = parts[1].padStart(2, '0');
                        const year = parts[2];
                        return `${year}-${month}-${day}`;
                    }
                }
                
                // Format YYYY-MM-DD (déjà correct)
                if (dateStr.match(/\d{4}-\d{1,2}-\d{1,2}/)) {
                    return dateStr;
                }
                
                return today();
            };
            
            // Parser agressif pour capturer plus de transactions
            const parseAggressiveStatement = (lines) => {
                console.log('=== PARSING AGRESSIF ===');
                const transactions = [];
                
                // Chercher toutes les lignes avec des montants
                const potentialTransactions = lines.filter(line => {
                    // Doit contenir un montant avec 2 décimales
                    if (!line.match(/\d+[.,]\d{2}/)) return false;
                    // Ignorer les lignes trop courtes
                    if (line.length < 5) return false;
                    // Ignorer les lignes qui sont clairement des en-têtes
                    if (line.toLowerCase().includes('date') && line.toLowerCase().includes('amount')) return false;
                    if (line.toLowerCase().includes('solde') && line.toLowerCase().includes('initial')) return false;
                    return true;
                });
                
                console.log('Transactions potentielles trouvées:', potentialTransactions.length);
                
                potentialTransactions.forEach((line, index) => {
                    console.log(`Ligne agressive ${index}: "${line}"`);
                    
                    // Extraire tous les montants de la ligne
                    const amountMatches = line.match(/(-?\d+[.,]\d{2})/g);
                    if (!amountMatches) return;
                    
                    // Prendre le dernier montant (généralement le montant de la transaction)
                    const amountStr = amountMatches[amountMatches.length - 1];
                    const amount = Math.abs(parseFloat(amountStr.replace(',', '.')));
                    const isExpense = amountStr.includes('-') || amountStr.startsWith('-');
                    
                    // Extraire la description (tout ce qui précède le montant)
                    let description = line.replace(new RegExp(amountStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '.*$'), '').trim();
                    
                    // Nettoyer la description des dates et autres éléments
                    description = description
                        .replace(/\d{1,2}[.\/\-]\d{1,2}[.\/\-]\d{4}/g, '') // Supprimer dates
                        .replace(/\d{4}[.\/\-]\d{1,2}[.\/\-]\d{1,2}/g, '') // Supprimer dates ISO
                        .replace(/\d{1,2}\s+\w{3}\s+\d{4}/g, '') // Supprimer dates format "DD MMM YYYY"
                        .replace(/CHF|EUR|USD|GBP|£|€|\$/g, '') // Supprimer devises
                        .replace(/\s+/g, ' ') // Normaliser espaces
                        .trim();
                    
                    // Détecter la devise
                    let currency = 'CHF';
                    if (line.includes('€') || line.includes('EUR')) currency = 'EUR';
                    else if (line.includes('$') || line.includes('USD')) currency = 'USD';
                    else if (line.includes('£') || line.includes('GBP')) currency = 'GBP';
                    
                    console.log('Parsing agressif:', { description, amount, isExpense, currency });
                    
                    // Validation minimale
                    if (amount > 0 && description && description.length > 2 &&
                        !description.toLowerCase().includes('total') &&
                        !description.toLowerCase().includes('balance') &&
                        !description.toLowerCase().includes('page') &&
                        !description.toLowerCase().includes('statement')) {
                        
                        transactions.push({
                            description: description,
                            amount: amount,
                            date: today(),
                            type: isExpense ? 'expense' : 'income',
                            currency: currency,
                            category: categorizeTransaction(description)
                        });
                        console.log('Transaction agressive ajoutée:', transactions[transactions.length - 1]);
                    }
                });
                
                console.log(`Total transactions agressives trouvées: ${transactions.length}`);
                return transactions;
            };
            
            // Fonction utilitaire pour dates suisses
            const convertSwissDate = (dateStr) => {
                // Format DD.MM.YYYY vers YYYY-MM-DD
                const parts = dateStr.split('.');
                if (parts.length === 3) {
                    const day = parts[0].padStart(2, '0');
                    const month = parts[1].padStart(2, '0');
                    const year = parts[2];
                    return `${year}-${month}-${day}`;
                }
                return today();
            };
            
            // Catégorisation automatique intelligente
            const categorizeTransaction = (description) => {
                const desc = description.toLowerCase();
                
                // Alimentation
                if (desc.includes('migros') || desc.includes('coop') || desc.includes('denner') || 
                    desc.includes('aldi') || desc.includes('lidl') || desc.includes('restaurant') ||
                    desc.includes('mcdonalds') || desc.includes('burger') || desc.includes('pizza')) {
                    return 'Alimentation';
                }
                
                // Transport
                if (desc.includes('sbb') || desc.includes('cff') || desc.includes('uber') ||
                    desc.includes('taxi') || desc.includes('parking') || desc.includes('essence') ||
                    desc.includes('shell') || desc.includes('bp') || desc.includes('esso')) {
                    return 'Transport';
                }
                
                // Logement
                if (desc.includes('loyer') || desc.includes('miete') || desc.includes('rent') ||
                    desc.includes('electricite') || desc.includes('gaz') || desc.includes('eau')) {
                    return 'Logement';
                }
                
                // Loisirs
                if (desc.includes('cinema') || desc.includes('netflix') || desc.includes('spotify') ||
                    desc.includes('amazon') || desc.includes('steam') || desc.includes('playstation')) {
                    return 'Loisirs';
                }
                
                // Santé
                if (desc.includes('pharmacie') || desc.includes('medecin') || desc.includes('dentiste') ||
                    desc.includes('hopital') || desc.includes('assurance')) {
                    return 'Santé';
                }
                
                // Virement/Banque
                if (desc.includes('virement') || desc.includes('transfer') || desc.includes('atm') ||
                    desc.includes('retrait') || desc.includes('frais')) {
                    return 'Vie Quotidienne';
                }
                
                return 'Divers';
            };

            const showOcrValidationModal = (detectedItems) => {
                const accountsOptions = state.accounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
                const expenseCategories = Object.keys(state.categories.expense).map(cat => `<option value="${cat}">${cat}</option>`).join('');
                const incomeCategories = Object.keys(state.categories.income).map(cat => `<option value="${cat}">${cat}</option>`).join('');

                const itemsHtml = detectedItems.map((item, index) => {
                    const typeOptions = item.type === 'income' ? incomeCategories : expenseCategories;
                    
                    return `
                    <tr class="border-b transition-all duration-200 bg-white" data-item-row data-item-id="${item.id}">
                        <td class="p-2 align-middle text-center">
                            <input type="checkbox" checked class="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" onchange="toggleRowSelection(this)">
                        </td>
                        <td class="p-2 align-middle">
                            <div class="flex items-center">
                                <input type="checkbox" name="include_date_${index}" checked class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2" onchange="toggleField(this)">
                                <input type="date" name="date_${index}" value="${item.date || today()}" class="w-32 p-2 border rounded">
                            </div>
                        </td>
                        <td class="p-2 align-middle">
                            <div class="flex items-center">
                                <input type="checkbox" name="include_description_${index}" checked class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2" onchange="toggleField(this)">
                                <input type="text" name="description_${index}" value="${item.description}" class="w-full p-2 border rounded">
                            </div>
                        </td>
                        <td class="p-2 align-middle">
                            <div class="flex items-center">
                                <input type="checkbox" name="include_location_${index}" checked class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2" onchange="toggleField(this)">
                                <input type="text" name="location_${index}" value="${item.location || ''}" placeholder="Lieu/Magasin" class="w-32 p-2 border rounded">
                            </div>
                        </td>
                        <td class="p-2 align-middle">
                            <div class="flex items-center">
                                <input type="checkbox" name="include_amount_${index}" checked class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2" onchange="toggleField(this)">
                                <input type="number" name="amount_${index}" value="${item.amount.toFixed(2)}" step="0.01" min="0" class="w-24 p-2 border rounded">
                            </div>
                        </td>
                        <td class="p-2 align-middle">
                            <div class="flex items-center">
                                <input type="checkbox" name="include_balance_${index}" checked class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2" onchange="toggleField(this)">
                                <input type="number" name="balance_${index}" value="${item.balance ? item.balance.toFixed(2) : ''}" step="0.01" class="w-24 p-2 border rounded">
                            </div>
                        </td>
                        <td class="p-2 align-middle">
                             <div class="flex items-center">
                                <input type="checkbox" name="include_category_${index}" checked class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2" onchange="toggleField(this, true)">
                                <select name="type_${index}" class="w-20 p-2 border rounded mr-2" onchange="updateCategoryOptions(${index}, this.value)">
                                    <option value="expense" ${item.type === 'expense' ? 'selected' : ''}>Dépense</option>
                                    <option value="income" ${item.type === 'income' ? 'selected' : ''}>Revenu</option>
                                </select>
                                <select name="category_${index}" class="flex-1 p-2 border rounded">
                                    <option value="">-- Catégorie --</option>
                                    ${typeOptions}
                                </select>
                            </div>
                        </td>
                        <td class="p-2 align-middle text-xs text-gray-500">
                            <div class="max-w-xs truncate" title="${item.rawLine || ''}">
                                ${(item.rawLine || '').substring(0, 50)}...
                            </div>
                        </td>
                    </tr>
                `;
                }).join('');

                const content = `
                    <p class="mb-4">
                        <strong>Cliquez sur une ligne</strong> pour l'activer/désactiver. 
                        Vérifiez les montants extraits et les descriptions nettoyées.
                    </p>
                    <form id="ocr-validation-form">
                        <div class="mb-4 grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium">Compte à débiter</label>
                                <select name="accountId" required class="w-full p-2 border rounded">${accountsOptions}</select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium">Date par défaut</label>
                                <input type="date" name="date" value="${today()}" required class="w-full p-2 border rounded">
                            </div>
                        </div>
                        <div class="mt-4 flex items-center">
                            <input type="checkbox" id="ocr-update-balance" name="updateBalance" checked class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" onchange="toggleAllBalanceFields(this.checked)">
                            <label for="ocr-update-balance" class="ml-2 block text-sm text-gray-900">Mettre à jour le solde du compte avec le dernier solde valide</label>
                        </div>
                        <div class="overflow-x-auto max-h-96 border rounded mt-4">
                            <table class="w-full text-left">
                                <thead class="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th class="p-2 w-16">Ligne</th>
                                        <th class="p-2 w-32">Date</th>
                                        <th class="p-2">Description</th>
                                        <th class="p-2 w-32">Lieu</th>
                                        <th class="p-2 w-24">Montant</th>
                                        <th class="p-2 w-24">Solde</th>
                                        <th class="p-2">Type & Catégorie</th>
                                        <th class="p-2 w-32">Ligne OCR</th>
                                    </tr>
                                </thead>
                                <tbody id="ocr-transactions-tbody">${itemsHtml}</tbody>
                            </table>
                        </div>
                        <div class="mt-4 text-sm text-gray-600">
                            <strong>Astuce :</strong> Les montants ont été extraits automatiquement depuis les descriptions OCR. 
                            Le solde final a été ignoré pour ne garder que les montants de transaction.
                        </div>
                        <div class="mt-6 flex justify-end">
                            <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg mr-2">Annuler</button>
                            <button type="submit" class="bg-indigo-600 text-white py-2 px-4 rounded-lg">Ajouter les Transactions Sélectionnées</button>
                        </div>
                    </form>`;

                openModal('Valider les Transactions OCR', content, 'max-w-6xl');
                
                // Stocker les items pour la fonction de toggle
                window.ocrDetectedItems = detectedItems;
            };

            // Fonction pour basculer la sélection d'une transaction OCR
            const toggleTransactionSelection = (itemId) => {
                const row = document.querySelector(`[data-item-id="${itemId}"]`);
                if (!row) return;
                
                const isCurrentlySelected = row.dataset.selected === 'true';
                const newSelected = !isCurrentlySelected;
                
                // Mettre à jour l'état visuel
                row.dataset.selected = newSelected;
                
                // Mettre à jour les classes CSS
                if (newSelected) {
                    row.className = row.className.replace('bg-gray-100 opacity-60', 'bg-white');
                } else {
                    row.className = row.className.replace('bg-white', 'bg-gray-100 opacity-60');
                }
                
                // Mettre à jour la checkbox
                const checkbox = row.querySelector('input[type="checkbox"]');
                if (checkbox) checkbox.checked = newSelected;
                
                // Mettre à jour les champs (readonly/disabled)
                const inputs = row.querySelectorAll('input:not([type="checkbox"]), select');
                inputs.forEach(input => {
                    if (newSelected) {
                        input.removeAttribute('readonly');
                        input.removeAttribute('disabled');
                        input.classList.remove('bg-gray-100');
                    } else {
                        if (input.tagName === 'SELECT') {
                            input.setAttribute('disabled', 'disabled');
                        } else {
                            input.setAttribute('readonly', 'readonly');
                        }
                        input.classList.add('bg-gray-100');
                    }
                });
                
                // Mettre à jour l'objet dans le tableau global
                if (window.ocrDetectedItems) {
                    const item = window.ocrDetectedItems.find(item => item.id === itemId);
                    if (item) item.selected = newSelected;
                }
            };

            // Fonction pour mettre à jour les options de catégorie selon le type
            const updateCategoryOptions = (index, type) => {
                const categorySelect = document.querySelector(`select[name="category_${index}"]`);
                if (!categorySelect) return;
                
                const expenseCategories = Object.keys(state.categories.expense).map(cat => `<option value="${cat}">${cat}</option>`).join('');
                const incomeCategories = Object.keys(state.categories.income).map(cat => `<option value="${cat}">${cat}</option>`).join('');
                
                const options = type === 'income' ? incomeCategories : expenseCategories;
                categorySelect.innerHTML = `<option value="">-- Catégorie --</option>${options}`;
            };

            window.toggleRowSelection = (masterCheckbox) => {
                const row = masterCheckbox.closest('tr');
                const checkboxes = row.querySelectorAll('input[type="checkbox"]:not(.h-5)');
                checkboxes.forEach(cb => {
                    cb.checked = masterCheckbox.checked;
                    window.toggleField(cb, cb.name.includes('category'));
                });
            };

            window.toggleField = (checkbox, isSelectGroup = false) => {
                const parentDiv = checkbox.parentElement;
                const toggleDisabled = (element, disabled) => {
                    element.disabled = disabled;
                    element.readOnly = disabled;
                    element.classList.toggle('bg-gray-100', disabled);
                    element.classList.toggle('opacity-50', disabled);
                };

                if (isSelectGroup) {
                    parentDiv.querySelectorAll('select').forEach(el => toggleDisabled(el, !checkbox.checked));
                } else {
                    const input = parentDiv.querySelector('input[type="date"], input[type="text"], input[type="number"]');
                    if (input) toggleDisabled(input, !checkbox.checked);
                }
            };

            const toggleAllBalanceFields = (enabled) => {
                const balanceCheckboxes = document.querySelectorAll('input[name^="include_balance_"]');
                balanceCheckboxes.forEach(cb => {
                    cb.checked = enabled;
                    cb.disabled = !enabled;
                    window.toggleField(cb);
                });
            };

            const handleOcrValidationSubmit = (e) => {
                e.preventDefault();
                const form = e.target;
                const accountId = form.querySelector('select[name="accountId"]').value;
                const defaultDate = form.querySelector('input[name="date"]').value;
                const shouldUpdateBalance = form.querySelector('input[name="updateBalance"]').checked;

                const transactionsToAdd = [];
                let lastValidBalance = null;

                const selectedRows = Array.from(document.querySelectorAll('#ocr-transactions-tbody tr'))
                    .filter(row => row.querySelector('input[type="checkbox"][onchange="toggleRowSelection(this)"]').checked);

                selectedRows.forEach(row => {
                    const index = window.ocrDetectedItems.findIndex(i => i.id === row.dataset.itemId);
                    if (index === -1) return;

                    const item = window.ocrDetectedItems[index];
                    const includeDate = row.querySelector(`input[name="include_date_${index}"]`)?.checked;
                    const includeDescription = row.querySelector(`input[name="include_description_${index}"]`)?.checked;
                    const includeAmount = row.querySelector(`input[name="include_amount_${index}"]`)?.checked;
                    const includeCategory = row.querySelector(`input[name="include_category_${index}"]`)?.checked;

                    if (!includeDescription || !includeAmount) return;

                    const transaction = {
                        id: generateId(),
                        accountId: accountId,
                        date: includeDate ? row.querySelector(`input[name="date_${index}"]`).value : defaultDate,
                        description: row.querySelector(`input[name="description_${index}"]`).value,
                        amount: parseFloat(row.querySelector(`input[name="amount_${index}"]`).value),
                        type: includeCategory ? row.querySelector(`select[name="type_${index}"]`).value : 'expense',
                        category: includeCategory ? row.querySelector(`select[name="category_${index}"]`).value : 'Divers',
                        subCategory: '',
                        recurring: false,
                        isSplit: false,
                        parentTransactionId: null,
                        tags: ['OCR'],
                        notes: `Importé via OCR. Ligne brute: ${item.rawLine || ''}`
                    };
                    transactionsToAdd.push(transaction);

                    const includeBalance = row.querySelector(`input[name="include_balance_${index}"]`)?.checked;
                    if (includeBalance) {
                        const balanceValue = parseFloat(row.querySelector(`input[name="balance_${index}"]`).value);
                        if (!isNaN(balanceValue)) {
                            lastValidBalance = balanceValue;
                        }
                    }
                });

                if (shouldUpdateBalance && lastValidBalance !== null) {
                    const account = state.accounts.find(a => a.id === accountId);
                    if (account) {
                        account.balance = lastValidBalance;
                        showToast(`Solde de ${account.name} mis à jour à ${formatCurrency(lastValidBalance)}`);
                    }
                }

                if (transactionsToAdd.length > 0) {
                    state.transactions.push(...transactionsToAdd);
                    showToast(`${transactionsToAdd.length} transaction(s) ajoutée(s).`, 'success');
                } else {
                    showToast('Aucune transaction sélectionnée ou valide.', 'error');
                }

                closeModal();
                fullUpdate();
            };

            // Rendre les fonctions globales pour les onclick
            window.toggleTransactionSelection = toggleTransactionSelection;
            window.updateCategoryOptions = updateCategoryOptions;

            // ========== ACCOUNT MODALS ========== //
            const showAccountModal = (accountId = null) => {
                const isEditing = !!accountId;
                const account = isEditing ? state.accounts.find(a => a.id === accountId) : null;
                const title = isEditing ? 'Modifier le Compte' : 'Ajouter un Compte';

                const content = `
                    <form id="${isEditing ? 'edit-account-form' : 'account-form'}" data-id="${isEditing ? accountId : ''}">
                        <div class="space-y-4">
                            <div>
                                <label for="acc-name" class="block text-sm font-medium">Nom du compte</label>
                                <input type="text" id="acc-name" name="name" required class="w-full p-2 border rounded" value="${isEditing ? account.name : ''}">
                            </div>
                            <div>
                                <label for="acc-currency" class="block text-sm font-medium">Devise</label>
                                <select id="acc-currency" name="currency" class="w-full p-2 border rounded" ${isEditing ? 'disabled' : ''}>
                                    ${(state.exchangeRates ? Object.keys(state.exchangeRates) : ['CHF', 'EUR', 'USD', 'BTC']).map(c => `<option value="${c}" ${isEditing && account.currency === c ? 'selected' : ''}>${c}</option>`).join('')}
                                </select>
                                ${isEditing ? '<p class="text-xs text-gray-500 mt-1">La devise ne peut pas être modifiée.</p>' : ''}
                            </div>
                        </div>
                        <div class="mt-6 flex justify-end">
                            <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg mr-2">Annuler</button>
                            <button type="submit" class="bg-indigo-600 text-white py-2 px-4 rounded-lg">${isEditing ? 'Sauvegarder' : 'Ajouter'}</button>
                        </div>
                    </form>`;

                openModal(title, content);
            };

            const handleAccountSubmit = (e) => {
                e.preventDefault();
                const form = e.target;
                const fd = new FormData(form);
                const accountId = form.dataset.id;

                if (accountId) {
                    const account = state.accounts.find(a => a.id === accountId);
                    if (account) {
                        account.name = fd.get('name');
                    }
                } else {
                    state.accounts.push({
                        id: generateId(),
                        name: fd.get('name'),
                        currency: fd.get('currency')
                    });
                }

                saveState(); // Sauvegarder les changements
                closeModal();
                fullUpdate();
            };

            // ========== TRANSACTION MODALS ========== //
            const showTransactionModal = (type = 'expense', txId = null, prefillData = {}) => {
                const isEditing = !!txId;
                const tx = isEditing ? state.transactions.find(t => t.id === txId) : prefillData;
                const currentType = isEditing ? tx.type : (prefillData.type || type);
                const title = isEditing ? 'Modifier la Transaction' : `Ajouter un${currentType === 'income' ? ' Revenu' : 'e Dépense'}`;

                const mainCategories = Object.keys(state.categories[currentType]);

                const content = `
                    <form id="${isEditing ? 'edit-transaction-form' : 'transaction-form'}" data-type="${currentType}" data-id="${isEditing ? txId : ''}">
                        <input type="hidden" name="linkedTo" value="${tx?.linkedTo || ''}">
                        <div class="space-y-4">
                            <div><label>Description</label><input type="text" name="description" required class="w-full p-2 border rounded" value="${tx?.description || ''}"></div>
                            <div class="grid grid-cols-2 gap-4">
                                <div><label>Montant</label><input type="number" name="originalAmount" required step="any" min="0" class="w-full p-2 border rounded" value="${tx?.originalAmount || ''}"></div>
                                <div><label>Devise</label><select name="originalCurrency" class="w-full p-2 border rounded">${(state.exchangeRates ? Object.keys(state.exchangeRates) : ['CHF', 'EUR', 'USD', 'BTC']).map(c => `<option value="${c}" ${(tx?.originalCurrency || state.baseCurrency) === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
                            </div>
                            <div><label>Date</label><input type="date" name="date" value="${tx?.date || today()}" required class="w-full p-2 border rounded"></div>
                            <div><label>Compte</label><select name="accountId" required class="w-full p-2 border rounded">${state.accounts.map(a => `<option value="${a.id}" ${tx?.accountId === a.id ? 'selected' : ''}>${a.name}</option>`).join('')}</select></div>
                            <div><label>Catégorie</label><select name="category" required class="w-full p-2 border rounded"><option value="">-- Choisir --</option>${mainCategories.map(c => `<option value="${c}" ${tx?.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
                            <div id="subcategory-wrapper" class="hidden"><label>Sous-catégorie</label><select name="subCategory" class="w-full p-2 border rounded"></select></div>
                            <div><label>Tags (virgules)</label><input type="text" name="tags" class="w-full p-2 border rounded" value="${isEditing ? (tx?.tags || []).join(', ') : ''}"></div>
                            <div><label>Notes</label><textarea name="notes" class="w-full p-2 border rounded" rows="2">${isEditing ? tx?.notes || '' : ''}</textarea></div>
                            <div class="flex items-center"><input type="checkbox" name="recurring" class="h-4 w-4 rounded" ${tx?.recurring ? 'checked' : ''}><label class="ml-2">Transaction récurrente</label></div>
                        </div>
                        <div class="mt-6 flex justify-between items-center">
                            <div>${!isEditing && currentType === 'expense' ? `<button type="button" data-action="show-split-modal" class="bg-gray-200 py-2 px-4 rounded-lg hover:bg-gray-300">Fractionner</button>` : ''}</div>
                            <div class="flex justify-end gap-2">
                                <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg mr-2">Annuler</button>
                                <button type="submit" class="bg-indigo-600 text-white py-2 px-4 rounded-lg">${isEditing ? 'Sauvegarder' : 'Ajouter'}</button>
                            </div>
                        </div>
                    </form>`;

                openModal(title, content);

                const form = document.querySelector(`#${isEditing ? 'edit-transaction-form' : 'transaction-form'}`);
                const categorySelect = form.querySelector('[name="category"]');
                const subcategoryWrapper = form.querySelector('#subcategory-wrapper');
                const subcategorySelect = form.querySelector('[name="subCategory"]');

                const updateSubcategories = () => {
                    const selectedCategory = categorySelect.value;
                    const subcategories = state.categories[currentType][selectedCategory] || [];
                    subcategorySelect.innerHTML = subcategories.length > 0
                        ? `<option value="">-- Choisir --</option>${subcategories.map(sc => `<option value="${sc}" ${tx?.subCategory === sc ? 'selected' : ''}>${sc}</option>`).join('')}`
                        : '';
                    subcategoryWrapper.classList.toggle('hidden', subcategories.length === 0);
                };

                categorySelect.addEventListener('change', updateSubcategories);
                if (tx?.category) updateSubcategories();
            };

            const handleTransactionSubmit = (e, isEditing = false) => {
                e.preventDefault();
                const form = e.target;
                const fd = new FormData(form);
                const originalAmount = parseFloat(fd.get('originalAmount'));

                // Validation améliorée
                if (isNaN(originalAmount) || originalAmount <= 0) {
                    showToast('Montant invalide.', 'error');
                    return;
                }
                
                if (!fd.get('description')?.trim()) {
                    showToast('Description requise.', 'error');
                    return;
                }
                
                if (!fd.get('accountId')) {
                    showToast('Compte requis.', 'error');
                    return;
                }
                
                if (!fd.get('category')) {
                    showToast('Catégorie requise.', 'error');
                    return;
                }

                const originalCurrency = fd.get('originalCurrency');
                const exchangeRate = state.exchangeRates[originalCurrency] || 1;
                const amount = originalAmount * exchangeRate;
                const tags = fd.get('tags') ? fd.get('tags').split(',').map(t => t.trim()).filter(t => t) : [];
                
                const newTxData = {
                    description: fd.get('description').trim(),
                    amount,
                    originalAmount,
                    originalCurrency,
                    date: fd.get('date'),
                    accountId: fd.get('accountId'),
                    category: fd.get('category'),
                    subCategory: fd.get('subCategory') || null,
                    recurring: fd.get('recurring') === 'on',
                    tags,
                    notes: fd.get('notes')?.trim() || '',
                    linkedTo: fd.get('linkedTo') || null,
                };

                if (isEditing) {
                    const txIndex = state.transactions.findIndex(t => t.id === form.dataset.id);
                    if (txIndex > -1) {
                        state.transactions[txIndex] = { ...state.transactions[txIndex], ...newTxData };
                        invalidateBalanceCache();
                    } else {
                        showToast('Transaction introuvable.', 'error');
                        return;
                    }
                } else {
                    state.transactions.push({
                        ...newTxData,
                        id: generateId(),
                        type: form.dataset.type,
                        isSplit: false,
                        parentTransactionId: null
                    });
                    invalidateBalanceCache();
                }

                saveState(); // Sauvegarder les changements
                showToast(isEditing ? 'Transaction modifiée !' : 'Transaction ajoutée !');
                closeModal();
                fullUpdate();
            };

            const showSplitTransactionModal = (parentData) => {
                const expenseCategories = Object.keys(state.categories.expense).map(cat => `<option value="${cat}">${cat}</option>`).join('');

                const content = `
                    <form id="split-transaction-form">
                        <div class="mb-4 p-4 bg-gray-100 rounded-lg">
                            <div class="flex justify-between items-center">
                                <h4 class="font-semibold">Transaction Originale</h4>
                                <span class="text-lg font-bold">${formatCurrency(parentData.originalAmount, parentData.originalCurrency)}</span>
                            </div>
                            <p class="text-sm text-gray-600">${parentData.description} - ${parentData.date}</p>
                        </div>
                        <div id="split-items-container" class="space-y-3 mb-4"></div>
                        <div class="flex justify-between items-center mb-4 p-2 border-t border-b">
                            <button type="button" data-action="add-split-item" class="text-sm bg-blue-500 text-white py-1 px-3 rounded-md hover:bg-blue-600">Ajouter une ligne</button>
                            <div>
                                <span class="text-sm">Restant à allouer: </span>
                                <span id="split-remaining" class="font-bold text-lg"></span>
                            </div>
                        </div>
                        <div class="mt-6 flex justify-end">
                            <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg mr-2">Annuler</button>
                            <button type="submit" id="submit-split" class="bg-indigo-600 text-white py-2 px-4 rounded-lg">Valider</button>
                        </div>
                    </form>`;

                openModal('Fractionner la Transaction', content, 'max-w-3xl');

                const container = document.getElementById('split-items-container');
                const remainingEl = document.getElementById('split-remaining');
                const submitBtn = document.getElementById('submit-split');
                let splitItemId = 0;

                const addSplitItem = () => {
                    splitItemId++;
                    const itemHtml = `
                        <div class="grid grid-cols-12 gap-2 items-center p-2 rounded-md border" data-split-item-id="${splitItemId}">
                            <div class="col-span-5"><input type="text" name="desc_${splitItemId}" placeholder="Description" required class="w-full p-2 border rounded-md text-sm"></div>
                            <div class="col-span-3"><input type="number" name="amount_${splitItemId}" placeholder="Montant" required step="0.01" min="0" class="w-full p-2 border rounded-md text-sm split-amount-input"></div>
                            <div class="col-span-3"><select name="cat_${splitItemId}" required class="w-full p-2 border rounded-md text-sm"><option value="">-- Catégorie --</option>${expenseCategories}</select></div>
                            <div class="col-span-1 text-right"><button type="button" data-action="remove-split-item" class="text-red-500 hover:text-red-700 p-1"><i data-lucide="x-circle" class="w-5 h-5"></i></button></div>
                        </div>`;

                    container.insertAdjacentHTML('beforeend', itemHtml);
                    lucide.createIcons();
                    updateRemaining();
                };

                const updateRemaining = () => {
                    const amounts = Array.from(document.querySelectorAll('.split-amount-input')).map(input => parseFloat(input.value) || 0);
                    const totalSplit = amounts.reduce((sum, amount) => sum + amount, 0);
                    const remaining = parentData.originalAmount - totalSplit;

                    remainingEl.textContent = formatCurrency(remaining, parentData.originalCurrency);

                    if (Math.abs(remaining) < 0.001) {
                        remainingEl.className = 'font-bold text-lg text-green-600';
                        submitBtn.disabled = false;
                    } else {
                        remainingEl.className = 'font-bold text-lg text-red-600';
                        submitBtn.disabled = true;
                    }
                };

                addSplitItem();
                addSplitItem();

                document.querySelector('#split-transaction-form').addEventListener('click', e => {
                    const target = e.target.closest('[data-action]');
                    if (!target) return;

                    if (target.dataset.action === 'add-split-item') {
                        addSplitItem();
                    }

                    if (target.dataset.action === 'remove-split-item') {
                        target.closest('[data-split-item-id]').remove();
                        updateRemaining();
                    }
                });

                document.querySelector('#split-transaction-form').addEventListener('input', e => {
                    if (e.target.classList.contains('split-amount-input')) {
                        updateRemaining();
                    }
                });

                document.getElementById('split-transaction-form').dataset.parentData = JSON.stringify(parentData);
            };

            const handleSplitTransactionSubmit = (e) => {
                e.preventDefault();
                const form = e.target;
                const parentData = JSON.parse(form.dataset.parentData);
                const fd = new FormData(form);
                const parentId = generateId();

                const parentTx = {
                    ...parentData,
                    id: parentId,
                    type: 'expense',
                    amount: parentData.originalAmount * (state.exchangeRates[parentData.originalCurrency] || 1),
                    isSplit: true,
                    parentTransactionId: null,
                    category: 'Dépense fractionnée',
                    subCategory: null,
                    linkedTo: null,
                    tags: parentData.tags ? parentData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
                };

                state.transactions.push(parentTx);

                const itemRows = form.querySelectorAll('[data-split-item-id]');
                itemRows.forEach(row => {
                    const id = row.dataset.splitItemId;
                    const originalAmount = parseFloat(fd.get(`amount_${id}`));
                    const amount = originalAmount * (state.exchangeRates[parentData.originalCurrency] || 1);

                    const childTx = {
                        id: generateId(),
                        type: 'expense',
                        description: fd.get(`desc_${id}`),
                        amount,
                        originalAmount,
                        originalCurrency: parentData.originalCurrency,
                        date: parentData.date,
                        accountId: parentData.accountId,
                        category: fd.get(`cat_${id}`),
                        subCategory: null,
                        linkedTo: null,
                        isSplit: false,
                        parentTransactionId: parentId,
                        recurring: false,
                        tags: [],
                        notes: `Partie de: ${parentData.description}`
                    };

                    state.transactions.push(childTx);
                });

                saveState(); // Sauvegarder les changements
                showToast('Transaction fractionnée !');
                closeModal();
                fullUpdate();
            };

            // ========== TRANSFER MODAL ========== //
            const showTransferModal = () => {
                const accountsOptions = state.accounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
                const currencyOptions = (state.exchangeRates ? Object.keys(state.exchangeRates) : ['CHF', 'EUR', 'USD', 'BTC']).map(c => `<option value="${c}" ${c === state.baseCurrency ? 'selected' : ''}>${c}</option>`).join('');

                const content = `
                    <form id="transfer-form">
                        <div class="space-y-4">
                            <div>
                                <label for="transfer-from" class="block text-sm font-medium">Compte source</label>
                                <select id="transfer-from" name="fromAccountId" required class="w-full p-2 border rounded">${accountsOptions}</select>
                            </div>
                            <div>
                                <label for="transfer-to" class="block text-sm font-medium">Compte destination</label>
                                <select id="transfer-to" name="toAccountId" required class="w-full p-2 border rounded"></select>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label for="transfer-amount">Montant</label>
                                    <input type="number" id="transfer-amount" name="amount" required step="0.01" min="0" class="w-full p-2 border rounded">
                                </div>
                                <div>
                                    <label for="transfer-currency">Devise</label>
                                    <select id="transfer-currency" name="currency" class="w-full p-2 border rounded">${currencyOptions}</select>
                                </div>
                            </div>
                        </div>
                        <div class="mt-6 flex justify-end">
                            <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg mr-2">Annuler</button>
                            <button type="submit" class="bg-indigo-600 text-white py-2 px-4 rounded-lg">Effectuer</button>
                        </div>
                    </form>`;

                openModal('Virement Interne', content);

                const fromSelect = document.getElementById('transfer-from');
                const toSelect = document.getElementById('transfer-to');

                const updateToAccountOptions = () => {
                    const fromId = fromSelect.value;
                    const toOptions = state.accounts.filter(a => a.id !== fromId).map(a => `<option value="${a.id}">${a.name}</option>`).join('');
                    toSelect.innerHTML = toOptions;
                };

                fromSelect.addEventListener('change', updateToAccountOptions);
                updateToAccountOptions();
            };

            const handleTransferSubmit = (e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                const fromAccountId = fd.get('fromAccountId');
                const toAccountId = fd.get('toAccountId');
                const originalAmount = parseFloat(fd.get('amount'));
                const originalCurrency = fd.get('currency');

                if (fromAccountId === toAccountId) {
                    showToast("Les comptes doivent être différents.", 'error');
                    return;
                }

                const amountInBase = originalAmount * (state.exchangeRates[originalCurrency] || 1);
                const fromAccountName = state.accounts.find(a => a.id === fromAccountId)?.name;
                const toAccountName = state.accounts.find(a => a.id === toAccountId)?.name;

                state.transactions.push({
                    id: generateId(),
                    type: 'expense',
                    description: `Virement vers ${toAccountName}`,
                    amount: amountInBase,
                    originalAmount,
                    originalCurrency,
                    date: today(),
                    accountId: fromAccountId,
                    category: 'Vie Quotidienne',
                    subCategory: 'Virement',
                    recurring: false,
                    isSplit: false,
                    parentTransactionId: null,
                    tags: ['virement'],
                    notes: ''
                });

                state.transactions.push({
                    id: generateId(),
                    type: 'income',
                    description: `Virement de ${fromAccountName}`,
                    amount: amountInBase,
                    originalAmount,
                    originalCurrency,
                    date: today(),
                    accountId: toAccountId,
                    category: 'Autres Revenus',
                    subCategory: 'Virement',
                    recurring: false,
                    isSplit: false,
                    parentTransactionId: null,
                    tags: ['virement'],
                    notes: ''
                });

                showToast('Virement effectué !');
                fullUpdate();
            };

            // ========== INVESTMENT MODALS ========== //
            const showInvestmentModal = () => {
                const content = `
                    <form id="investment-form">
                        <div class="space-y-4">
                            <div><label for="inv-name">Nom</label><input type="text" id="inv-name" name="name" required class="w-full p-2 border rounded"></div>
                            <div>
                                <label for="inv-type">Type</label>
                                <select id="inv-type" name="type" class="w-full p-2 border rounded">
                                    <option>Actions</option>
                                    <option>Trading</option>
                                    <option>Crypto</option>
                                    <option>Rig Physique</option>
                                    <option>Rig Virtuel</option>
                                    <option>Immobilier</option>
                                    <option>Immobilier Contrats</option>
                                    <option>Matériel Actif</option>
                                    <option>Matériel Passif</option>
                                    <option>Autre</option>
                                </select>
                            </div>
                            <div>
                                <label for="inv-currency">Devise</label>
                                <select id="inv-currency" name="currency" class="w-full p-2 border rounded">
                                    ${(state.exchangeRates ? Object.keys(state.exchangeRates) : ['CHF', 'EUR', 'USD', 'BTC']).map(c => 
                                        `<option value="${c}" ${c === state.baseCurrency ? 'selected' : ''}>${c}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <div id="crypto-ticker-field" class="hidden">
                                <label for="inv-ticker">Ticker (ID CoinGecko)</label>
                                <input type="text" id="inv-ticker" name="ticker" class="w-full p-2 border rounded" placeholder="ex: bitcoin, ethereum...">
                                <p class="text-xs text-gray-500 mt-1">ID de la crypto sur coingecko.com.</p>
                            </div>
                            <div id="depreciation-rate-field" class="hidden">
                                <label for="inv-depreciation-rate">Taux d\'amortissement annuel (%)</label>
                                <input type="number" id="inv-depreciation-rate" name="depreciationRate" class="w-full p-2 border rounded" placeholder="ex: 20" value="0">
                            </div>
                        </div>
                        <div class="mt-6 flex justify-end">
                            <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg mr-2">Annuler</button>
                            <button type="submit" class="bg-indigo-600 text-white py-2 px-4 rounded-lg">Ajouter</button>
                        </div>
                    </form>`;

                openModal('Ajouter un Investissement', content);

                document.getElementById('inv-type').addEventListener('change', (e) => {
                    const tickerField = document.getElementById('crypto-ticker-field');
                    const depreciationField = document.getElementById('depreciation-rate-field');

                    if (e.target.value === 'Crypto') {
                        tickerField.classList.remove('hidden');
                    } else {
                        tickerField.classList.add('hidden');
                    }

                    if (['Matériel Actif', 'Matériel Passif', 'Rig Physique'].includes(e.target.value)) {
                        depreciationField.classList.remove('hidden');
                    } else {
                        depreciationField.classList.add('hidden');
                    }
                });
            };

            const handleInvestmentSubmit = (e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                const newInvestment = {
                    id: generateId(),
                    name: fd.get('name'),
                    type: fd.get('type'),
                    currency: fd.get('currency') || state.baseCurrency,
                    currentValue: 0,
                    history: [],
                    depreciationRate: 0
                };

                if (newInvestment.type === 'Crypto') {
                    newInvestment.ticker = fd.get('ticker').toLowerCase().trim();
                }

                if (newInvestment.type === 'Matériel') {
                    newInvestment.depreciationRate = parseFloat(fd.get('depreciationRate')) || 0;
                }

                state.investments.push(newInvestment);
                closeModal();
                fullUpdate();
            };

            const showEditInvestmentValueModal = (investmentId) => {
                const inv = state.investments.find(i => i.id === investmentId);
                if (!inv) return;

                const currencyOptions = (state.exchangeRates ? Object.keys(state.exchangeRates) : ['CHF', 'EUR', 'USD', 'BTC']).map(c => 
                    `<option value="${c}" ${c === (inv.currency || state.baseCurrency) ? 'selected' : ''}>${c}</option>`
                ).join('');

                const content = `
                    <form id="edit-investment-value-form" data-id="${investmentId}">
                        <div class="space-y-4">
                            <div>
                                <label for="inv-current-value" class="block text-sm font-medium">Nouvelle valeur par unité</label>
                                <input type="number" id="inv-current-value" name="currentValue" value="${inv.currentValue}" required step="0.00000001" min="0" class="w-full p-2 border rounded">
                            </div>
                            <div>
                                <label for="inv-currency" class="block text-sm font-medium">Devise</label>
                                <select id="inv-currency" name="currency" class="w-full p-2 border rounded">
                                    ${currencyOptions}
                                </select>
                            </div>
                            <div class="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-md">
                                <p><strong>Attention :</strong> Changer la devise convertira automatiquement :</p>
                                <ul class="list-disc list-inside mt-1 space-y-1">
                                    <li>La valeur actuelle selon le taux de change</li>
                                    <li>Toutes les transactions liées à cet investissement</li>
                                    <li>L'historique des opérations (prix, dividendes, etc.)</li>
                                </ul>
                            </div>
                        </div>
                        <div class="mt-6 flex justify-end">
                            <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg mr-2">Annuler</button>
                            <button type="submit" class="bg-indigo-600 text-white py-2 px-4 rounded-lg">Modifier</button>
                        </div>
                    </form>`;

                openModal('Modifier la Valeur et Devise', content);
            };

            const showRenameInvestmentModal = (investmentId) => {
                const inv = state.investments.find(i => i.id === investmentId);
                if (!inv) return;

                const content = `
                    <form id="rename-investment-form" data-id="${investmentId}">
                        <div class="space-y-4">
                            <div>
                                <label for="inv-new-name" class="block text-sm font-medium">Nouveau nom</label>
                                <input type="text" id="inv-new-name" name="name" value="${inv.name}" required class="w-full p-2 border rounded-md" placeholder="Nom de l'investissement">
                            </div>
                            <div class="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                                <p><strong>Note :</strong> Le renommage mettra à jour :</p>
                                <ul class="list-disc list-inside mt-1 space-y-1">
                                    <li>Le nom de l'investissement</li>
                                    <li>Toutes les transactions liées</li>
                                    <li>L'historique des opérations</li>
                                </ul>
                            </div>
                        </div>
                        <div class="mt-6 flex justify-end">
                            <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg mr-2">Annuler</button>
                            <button type="submit" class="bg-green-600 text-white py-2 px-4 rounded-lg">Renommer</button>
                        </div>
                    </form>`;

                openModal('Renommer l\'Investissement', content);
            };

            const showEditInvestmentCategoryModal = (investmentId) => {
                const inv = state.investments.find(i => i.id === investmentId);
                if (!inv) return;

                const content = `
                    <form id="edit-investment-category-form" data-id="${investmentId}">
                        <div class="space-y-4">
                            <div>
                                <label for="inv-new-type" class="block text-sm font-medium">Nouvelle catégorie</label>
                                <select id="inv-new-type" name="type" required class="w-full p-2 border rounded-md">
                                    <option value="Action" ${inv.type === 'Action' ? 'selected' : ''}>Action</option>
                                    <option value="Obligation" ${inv.type === 'Obligation' ? 'selected' : ''}>Obligation</option>
                                    <option value="ETF" ${inv.type === 'ETF' ? 'selected' : ''}>ETF</option>
                                    <option value="Crypto" ${inv.type === 'Crypto' ? 'selected' : ''}>Crypto</option>
                                    <option value="Immobilier" ${inv.type === 'Immobilier' ? 'selected' : ''}>Immobilier</option>
                                    <option value="Matière Première" ${inv.type === 'Matière Première' ? 'selected' : ''}>Matière Première</option>
                                    <option value="Matériel Actif" ${inv.type === 'Matériel Actif' ? 'selected' : ''}>Matériel Actif</option>
                                    <option value="Matériel Passif" ${inv.type === 'Matériel Passif' ? 'selected' : ''}>Matériel Passif</option>
                                    <option value="Rig Physique" ${inv.type === 'Rig Physique' ? 'selected' : ''}>Rig Physique</option>
                                    <option value="Rig Virtuel" ${inv.type === 'Rig Virtuel' ? 'selected' : ''}>Rig Virtuel</option>
                                    <option value="Autre" ${inv.type === 'Autre' ? 'selected' : ''}>Autre</option>
                                </select>
                            </div>
                        </div>
                        <div class="mt-6 flex justify-end">
                            <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg mr-2">Annuler</button>
                            <button type="submit" class="bg-indigo-600 text-white py-2 px-4 rounded-lg">Modifier</button>
                        </div>
                    </form>`;

                openModal('Modifier la Catégorie', content);

                document.getElementById('inv-new-type').addEventListener('change', (e) => {
                    const tickerField = document.getElementById('crypto-ticker-field-edit');
                    const depreciationField = document.getElementById('depreciation-rate-field-edit');

                    if (e.target.value === 'Crypto') {
                        tickerField.classList.remove('hidden');
                    } else {
                        tickerField.classList.add('hidden');
                    }

                    if (['Matériel Actif', 'Matériel Passif', 'Rig Physique'].includes(e.target.value)) {
                        depreciationField.classList.remove('hidden');
                    } else {
                        depreciationField.classList.add('hidden');
                    }
                });
            };

            const handleEditInvestmentValueSubmit = (e) => {
                e.preventDefault();
                const form = e.target;
                const fd = new FormData(form);
                const investmentId = form.dataset.id;
                const inv = state.investments.find(i => i.id === investmentId);

                if (inv) {
                    const newValue = parseFloat(fd.get('currentValue'));
                    const newCurrency = fd.get('currency');
                    const oldCurrency = inv.currency || state.baseCurrency;
                    
                    console.log('Changement devise investissement:', {
                        oldCurrency,
                        newCurrency,
                        oldValue: inv.currentValue,
                        newValue
                    });

                    // Mettre à jour la valeur et la devise
                    inv.currentValue = newValue;
                    inv.currency = newCurrency;
                    
                    console.log('Devise sauvegardée:', inv.currency);

                    // Si la devise a changé, convertir toutes les transactions et l'historique liés
                    if (oldCurrency !== newCurrency) {
                        console.log('Conversion de devise nécessaire pour:', inv.name);
                        
                        // Convertir l'historique des opérations
                        if (inv.history && inv.history.length > 0) {
                            inv.history.forEach(entry => {
                                if (entry.currency && entry.currency === oldCurrency) {
                                    console.log('Conversion entrée historique:', entry);
                                    
                                    // Convertir les prix et montants selon la nouvelle devise
                                    if (entry.pricePerUnit) {
                                        const oldRate = state.exchangeRates[oldCurrency] || 1;
                                        const newRate = state.exchangeRates[newCurrency] || 1;
                                        
                                        if (newCurrency === 'BTC') {
                                            // Conversion vers BTC : diviser par le prix BTC
                                            entry.pricePerUnit = entry.pricePerUnit / newRate;
                                        } else if (oldCurrency === 'BTC') {
                                            // Conversion depuis BTC : multiplier par le prix BTC
                                            entry.pricePerUnit = entry.pricePerUnit * oldRate / newRate;
                                        } else {
                                            // Conversion entre devises fiat
                                            entry.pricePerUnit = entry.pricePerUnit * oldRate / newRate;
                                        }
                                    }
                                    
                                    if (entry.amount) {
                                        const oldRate = state.exchangeRates[oldCurrency] || 1;
                                        const newRate = state.exchangeRates[newCurrency] || 1;
                                        
                                        if (newCurrency === 'BTC') {
                                            entry.amount = entry.amount / newRate;
                                        } else if (oldCurrency === 'BTC') {
                                            entry.amount = entry.amount * oldRate / newRate;
                                        } else {
                                            entry.amount = entry.amount * oldRate / newRate;
                                        }
                                    }
                                    
                                    entry.currency = newCurrency;
                                }
                            });
                        }

                        // Mettre à jour les transactions liées
                        const linkedTransactions = state.transactions.filter(tx => tx.linkedTo === investmentId);
                        linkedTransactions.forEach(tx => {
                            console.log('Mise à jour transaction liée:', tx.id);
                            
                            // Recalculer le montant en devise de base selon la nouvelle devise
                            if (tx.originalCurrency === oldCurrency) {
                                tx.originalCurrency = newCurrency;
                                
                                const oldRate = state.exchangeRates[oldCurrency] || 1;
                                const newRate = state.exchangeRates[newCurrency] || 1;
                                
                                if (newCurrency === 'BTC') {
                                    tx.originalAmount = tx.originalAmount / newRate;
                                    tx.amount = tx.originalAmount * newRate; // Montant en devise de base
                                } else if (oldCurrency === 'BTC') {
                                    tx.originalAmount = tx.originalAmount * oldRate / newRate;
                                    tx.amount = tx.originalAmount / newRate; // Montant en devise de base
                                } else {
                                    tx.originalAmount = tx.originalAmount * oldRate / newRate;
                                    tx.amount = tx.originalAmount / newRate; // Montant en devise de base
                                }
                            }
                        });

                        showToast(`Devise changée de ${oldCurrency} vers ${newCurrency} avec conversion automatique`, 'success');
                    } else {
                        showToast('Valeur de l\'investissement mise à jour', 'success');
                    }

                    saveState(); // Sauvegarder les changements
                    closeModal();
                    fullUpdate();
                }
            };

            const handleRenameInvestmentSubmit = (e) => {
                e.preventDefault();
                const form = e.target;
                const fd = new FormData(form);
                const investmentId = form.dataset.id;
                const inv = state.investments.find(i => i.id === investmentId);

                if (inv) {
                    const oldName = inv.name;
                    const newName = fd.get('name').trim();
                    
                    if (newName && newName !== oldName) {
                        // Mettre à jour le nom de l'investissement
                        inv.name = newName;
                        
                        // Mettre à jour toutes les transactions liées à cet investissement
                        state.transactions.forEach(tx => {
                            if (tx.linkedTo === investmentId) {
                                // Mettre à jour la description si elle contient l'ancien nom
                                if (tx.description && tx.description.includes(oldName)) {
                                    tx.description = tx.description.replace(oldName, newName);
                                }
                                // Mettre à jour les notes si elles contiennent l'ancien nom
                                if (tx.notes && tx.notes.includes(oldName)) {
                                    tx.notes = tx.notes.replace(oldName, newName);
                                }
                            }
                        });
                        
                        saveState(); // Sauvegarder les changements
                        showToast(`Investissement renommé de "${oldName}" vers "${newName}"`);
                        closeModal();
                        fullUpdate();
                    } else {
                        showToast('Le nouveau nom ne peut pas être vide', 'error');
                    }
                }
            };

            const handleEditInvestmentCategorySubmit = (e) => {
                e.preventDefault();
                const form = e.target;
                const fd = new FormData(form);
                const investmentId = form.dataset.id;
                const inv = state.investments.find(i => i.id === investmentId);

                if (inv) {
                    const oldType = inv.type;
                    const newType = fd.get('type');
                    
                    inv.type = newType;
                    
                    // Mettre à jour les champs spécifiques selon le type
                    if (newType === 'Crypto') {
                        inv.ticker = fd.get('ticker') || '';
                    } else {
                        inv.ticker = '';
                    }
                    
                    if (['Matériel Actif', 'Matériel Passif', 'Rig Physique'].includes(newType)) {
                        inv.depreciationRate = parseFloat(fd.get('depreciationRate')) || 0;
                    } else {
                        inv.depreciationRate = 0;
                    }

                    // Mettre à jour les transactions liées pour refléter le changement de catégorie
                    state.transactions.forEach(tx => {
                        if (tx.linkedTo === investmentId) {
                            if (tx.category === 'Investissement') {
                                tx.notes = tx.notes ? tx.notes.replace(`(${oldType})`, `(${newType})`) : `Investissement ${newType}`;
                            }
                        }
                    });

                    saveState(); // Sauvegarder les changements
                    showToast(`Catégorie changée de "${oldType}" vers "${newType}"`);
                    closeModal();
                    fullUpdate();
                }
            };

            const showInvestmentHistoryModal = (investmentId) => {
                const inv = state.investments.find(i => i.id === investmentId);
                if (!inv) return;

                let content = `
                    <div class="overflow-y-auto">
                        <table class="w-full text-left table-auto">
                            <thead>
                                <tr class="border-b">
                                    <th class="p-2 text-sm">Date</th>
                                    <th class="p-2 text-sm">Type</th>
                                    <th class="p-2 text-sm text-right">Quantité</th>
                                    <th class="p-2 text-sm text-right">Prix/Unité</th>
                                    <th class="p-2 text-sm text-right">Montant Total</th>
                                    <th class="p-2 text-sm text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>${[...inv.history].sort((a, b) => new Date(b.date) - new Date(a.date)).map(h => {
                                let totalAmount = 0;
                                let displayCurrency = state.baseCurrency;

                                if (h.type === 'achat' || h.type === 'vente') {
                                    totalAmount = h.quantity * h.pricePerUnit + (h.fees || 0);
                                    displayCurrency = h.currency;
                                } else {
                                    totalAmount = h.amount;
                                    displayCurrency = h.currency || state.baseCurrency;
                                }

                                return `
                                    <tr class="border-t">
                                        <td class="p-2">${h.date}</td>
                                        <td class="p-2 capitalize">${h.type}</td>
                                        <td class="p-2 text-right">${h.quantity?.toLocaleString('fr-FR') || 'N/A'}</td>
                                        <td class="p-2 text-right">${h.pricePerUnit ? formatCurrency(h.pricePerUnit, h.currency) : 'N/A'}</td>
                                        <td class="p-2 text-right font-semibold">${formatCurrency(totalAmount, displayCurrency)}</td>
                                        <td class="p-2 text-center">
                                            <button data-action="edit-investment-entry" data-investment-id="${investmentId}" data-entry-id="${h.transactionId}" class="text-blue-600 hover:text-blue-800 text-sm mr-2">
                                                <i data-lucide="edit-2" class="w-3 h-3"></i>
                                            </button>
                                            <button data-action="delete-investment-entry" data-investment-id="${investmentId}" data-entry-id="${h.transactionId}" class="text-red-600 hover:text-red-800 text-sm">
                                                <i data-lucide="trash-2" class="w-3 h-3"></i>
                                            </button>
                                        </td>
                                    </tr>`;
                            }).join('') || `<tr><td colspan="6" class="p-4 text-center text-gray-500">Aucune opération.</td></tr>`}</tbody>
                        </table>
                    </div>
                    <div class="mt-6 flex justify-end">
                        <button data-action="add-investment-entry" data-id="${investmentId}" class="bg-indigo-600 text-white py-2 px-4 rounded-lg">Ajouter une opération</button>
                    </div>`;

                openModal(`Historique: ${inv.name}`, content, 'max-w-2xl');
            };

            const showAddInvestmentEntryModal = (investmentId) => {
                const inv = state.investments.find(i => i.id === investmentId);
                if (!inv) return;

                const disabled = state.accounts.length === 0 ? 'disabled' : '';
                const currencyOptions = (state.exchangeRates ? Object.keys(state.exchangeRates) : ['CHF', 'EUR', 'USD', 'BTC']).map(c => `<option value="${c}" ${c === state.baseCurrency ? 'selected' : ''}>${c}</option>`).join('');

                const content = `
                    <form id="investment-entry-form" data-id="${investmentId}" method="post" action="#">
                        <div class="space-y-4">
                            <div>
                                <label>Type</label>
                                <select id="inv-entry-type" name="type" class="w-full p-2 border rounded">
                                    <option value="achat">Achat</option>
                                    <option value="vente">Vente</option>
                                    <option value="dividende">Dividende</option>
                                </select>
                            </div>
                            <div>
                                <label>Date</label>
                                <input type="date" name="date" value="${today()}" required class="w-full p-2 border rounded">
                            </div>
                            <div id="achat-vente-fields">
                                <div class="grid grid-cols-2 gap-4">
                                    <div><label>Quantité</label><input type="number" name="quantity" step="any" min="0" class="w-full p-2 border rounded" value="0"></div>
                                    <div><label>Prix/Unité</label><input type="number" name="pricePerUnit" step="any" min="0" class="w-full p-2 border rounded" value="0"></div>
                                </div>
                                <div class="grid grid-cols-2 gap-4 mt-4">
                                    <div><label>Frais</label><input type="number" name="fees" step="any" min="0" class="w-full p-2 border rounded" value="0"></div>
                                    <div><label>Devise</label><select name="currency" class="w-full p-2 border rounded">${currencyOptions}</select></div>
                                </div>
                            </div>
                            <div id="dividende-fields" class="hidden">
                                <label>Montant du dividende</label>
                                <input type="number" name="amount" step="any" min="0" class="w-full p-2 border rounded" value="0">
                                <div class="mt-2">
                                    <label>Devise</label>
                                    <select name="currency" class="w-full p-2 border rounded">${currencyOptions}</select>
                                </div>
                            </div>
                            <div>
                                <label>Compte</label>
                                <select name="accountId" class="w-full p-2 border rounded" ${disabled}>
                                    ${state.accounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
                                </select>
                            </div>
                            <div class="mt-2 p-3 bg-gray-100 rounded-md text-center">
                                Total: <span id="inv-total-amount" class="font-bold">0.00 ${state.baseCurrency}</span>
                            </div>
                        </div>
                        <div class="mt-6 flex justify-end">
                            <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg mr-2">Annuler</button>
                            <button type="submit" class="bg-indigo-600 text-white py-2 px-4 rounded-lg" ${disabled}>Ajouter</button>
                        </div>
                    </form>`;

                openModal(`Ajouter une Opération pour ${inv.name}`, content, 'max-w-lg');

                const form = document.getElementById('investment-entry-form');
                const typeSelect = form.querySelector('#inv-entry-type');
                const achatVenteFields = form.querySelector('#achat-vente-fields');
                const dividendeFields = form.querySelector('#dividende-fields');
                const totalAmountEl = form.querySelector('#inv-total-amount');

                const updateTotal = () => {
                    const type = typeSelect.value;
                    let total = 0;
                    let currency = state.baseCurrency;

                    if (type === 'achat' || type === 'vente') {
                        const quantity = parseFloat(form.querySelector('[name="quantity"]').value) || 0;
                        const price = parseFloat(form.querySelector('[name="pricePerUnit"]').value) || 0;
                        const fees = parseFloat(form.querySelector('[name="fees"]').value) || 0;
                        currency = form.querySelector('[name="currency"]').value;
                        total = (quantity * price + fees);
                    } else {
                        total = parseFloat(form.querySelector('[name="amount"]').value) || 0;
                        currency = form.querySelector('#dividende-fields [name="currency"]').value;
                    }

                    totalAmountEl.textContent = formatCurrency(total, currency);
                };

                typeSelect.addEventListener('change', () => {
                    const isDividend = typeSelect.value === 'dividende';
                    achatVenteFields.classList.toggle('hidden', isDividend);
                    dividendeFields.classList.toggle('hidden', !isDividend);
                    updateTotal();
                });

                form.addEventListener('input', updateTotal);
                updateTotal(); // Calculer le total initial
            };

            const handleInvestmentEntrySubmit = (e) => {
                console.log('handleInvestmentEntrySubmit called');
                e.preventDefault();
                e.stopPropagation();
                const form = e.target;
                const fd = new FormData(form);
                const investmentId = form.dataset.id;
                const inv = state.investments.find(i => i.id === investmentId);

                console.log('Form data:', Object.fromEntries(fd.entries()));
                console.log('Investment ID:', investmentId);
                console.log('Investment found:', inv);

                if (!inv) {
                    showToast('Investissement non trouvé', 'error');
                    return;
                }

                const type = fd.get('type');
                const accountId = fd.get('accountId');
                
                console.log('Type:', type);
                console.log('Account ID:', accountId);
                
                // Validation des champs requis
                if (!accountId) {
                    showToast('Veuillez sélectionner un compte', 'error');
                    return;
                }

                if (type === 'achat' || type === 'vente') {
                    const quantity = parseFloat(fd.get('quantity'));
                    const pricePerUnit = parseFloat(fd.get('pricePerUnit'));
                    
                    if (!quantity || quantity <= 0) {
                        showToast('La quantité doit être supérieure à 0', 'error');
                        return;
                    }
                    
                    if (!pricePerUnit || pricePerUnit <= 0) {
                        showToast('Le prix par unité doit être supérieur à 0', 'error');
                        return;
                    }
                } else if (type === 'dividende') {
                    const amount = parseFloat(fd.get('amount'));
                    console.log('Dividend amount:', amount);
                    
                    if (!amount || amount <= 0) {
                        showToast('Le montant du dividende doit être supérieur à 0', 'error');
                        return;
                    }
                }

                const date = fd.get('date');
                const txId = generateId();

                let historyEntry = { type, date, transactionId: txId };
                let transactionData = {
                    id: txId,
                    description: `${type.charAt(0).toUpperCase() + type.slice(1)}: ${inv.name}`,
                    date,
                    accountId,
                    linkedTo: investmentId,
                    recurring: false
                };

                if (type === 'achat' || type === 'vente') {
                    historyEntry.quantity = parseFloat(fd.get('quantity'));
                    historyEntry.pricePerUnit = parseFloat(fd.get('pricePerUnit'));
                    historyEntry.fees = parseFloat(fd.get('fees')) || 0;
                    historyEntry.currency = fd.get('currency') || inv.currency || state.baseCurrency;

                    const amountInForeignCurrency = historyEntry.quantity * historyEntry.pricePerUnit + historyEntry.fees;
                    const amountInBaseCurrency = historyEntry.currency === 'BTC' ? 
                        amountInForeignCurrency * (state.exchangeRates[historyEntry.currency] || 1) :
                        amountInForeignCurrency / (state.exchangeRates[historyEntry.currency] || 1);

                    transactionData.type = type === 'achat' ? 'expense' : 'income';
                    transactionData.category = 'Investissement';
                    transactionData.subCategory = type === 'achat' ? "Achat d'actif" : "Vente d'actif";
                    transactionData.originalAmount = amountInForeignCurrency;
                    transactionData.originalCurrency = historyEntry.currency;
                    transactionData.amount = amountInBaseCurrency;
                } else {
                    const amount = parseFloat(fd.get('amount'));
                    const currency = fd.get('currency') || inv.currency || state.baseCurrency;
                    historyEntry.amount = amount;
                    historyEntry.currency = currency;

                    const amountInBaseCurrency = currency === 'BTC' ? amount * (state.exchangeRates[currency] || 1) : amount / (state.exchangeRates[currency] || 1);

                    transactionData.type = 'income';
                    transactionData.category = 'Revenus du Capital';
                    transactionData.subCategory = 'Dividendes';
                    transactionData.originalAmount = amount;
                    transactionData.originalCurrency = currency;
                    transactionData.amount = amountInBaseCurrency;
                    
                    console.log('Dividend transaction data:', transactionData);
                    console.log('Dividend history entry:', historyEntry);
                }

                console.log('Adding to investment history...');
                inv.history.push(historyEntry);
                console.log('Adding to transactions...');
                state.transactions.push(transactionData);

                console.log('Calling fullUpdate...');
                saveState(); // Sauvegarder les changements
                showToast('Opération ajoutée avec succès !');
                fullUpdate(() => {
                    console.log('Update complete, closing modal...');
                    closeModal();
                    showInvestmentHistoryModal(investmentId);
                });
            };

            const showEditInvestmentEntryModal = (investmentId, entryId) => {
                const inv = state.investments.find(i => i.id === investmentId);
                if (!inv) return;

                const entry = inv.history.find(h => h.transactionId === entryId);
                if (!entry) return;

                const currencyOptions = (state.exchangeRates ? Object.keys(state.exchangeRates) : ['CHF', 'EUR', 'USD', 'BTC']).map(c => `<option value="${c}" ${c === (entry.currency || state.baseCurrency) ? 'selected' : ''}>${c}</option>`).join('');

                const content = `
                    <form id="edit-investment-entry-form" data-investment-id="${investmentId}" data-entry-id="${entryId}" method="post" action="#">
                        <div class="space-y-4">
                            <div>
                                <label>Type</label>
                                <select id="edit-inv-entry-type" name="type" class="w-full p-2 border rounded">
                                    <option value="achat" ${entry.type === 'achat' ? 'selected' : ''}>Achat</option>
                                    <option value="vente" ${entry.type === 'vente' ? 'selected' : ''}>Vente</option>
                                    <option value="dividende" ${entry.type === 'dividende' ? 'selected' : ''}>Dividende</option>
                                </select>
                            </div>
                            <div>
                                <label>Date</label>
                                <input type="date" name="date" value="${entry.date}" required class="w-full p-2 border rounded">
                            </div>
                            <div id="edit-achat-vente-fields" ${entry.type === 'dividende' ? 'class="hidden"' : ''}>
                                <div class="grid grid-cols-2 gap-4">
                                    <div><label>Quantité</label><input type="number" name="quantity" step="any" min="0" class="w-full p-2 border rounded" value="${entry.quantity || 0}"></div>
                                    <div><label>Prix/Unité</label><input type="number" name="pricePerUnit" step="any" min="0" class="w-full p-2 border rounded" value="${entry.pricePerUnit || 0}"></div>
                                </div>
                                <div class="grid grid-cols-2 gap-4 mt-4">
                                    <div><label>Frais</label><input type="number" name="fees" step="any" min="0" class="w-full p-2 border rounded" value="${entry.fees || 0}"></div>
                                    <div><label>Devise</label><select name="currency" class="w-full p-2 border rounded">${currencyOptions}</select></div>
                                </div>
                            </div>
                            <div id="edit-dividende-fields" ${entry.type !== 'dividende' ? 'class="hidden"' : ''}>
                                <label>Montant du dividende</label>
                                <input type="number" name="amount" step="any" min="0" class="w-full p-2 border rounded" value="${entry.amount || 0}">
                                <div class="mt-2">
                                    <label>Devise</label>
                                    <select name="currency" class="w-full p-2 border rounded">${currencyOptions}</select>
                                </div>
                            </div>
                            <div class="mt-2 p-3 bg-gray-100 rounded-md text-center">
                                Total: <span id="edit-inv-total-amount" class="font-bold">0.00 ${state.baseCurrency}</span>
                            </div>
                        </div>
                        <div class="mt-6 flex justify-end">
                            <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg mr-2">Annuler</button>
                            <button type="submit" class="bg-indigo-600 text-white py-2 px-4 rounded-lg">Sauvegarder</button>
                        </div>
                    </form>`;

                openModal(`Modifier l'opération - ${inv.name}`, content, 'max-w-lg');

                const form = document.getElementById('edit-investment-entry-form');
                const typeSelect = form.querySelector('#edit-inv-entry-type');
                const achatVenteFields = form.querySelector('#edit-achat-vente-fields');
                const dividendeFields = form.querySelector('#edit-dividende-fields');
                const totalAmountEl = form.querySelector('#edit-inv-total-amount');

                const updateTotal = () => {
                    const type = typeSelect.value;
                    let total = 0;
                    let currency = state.baseCurrency;

                    if (type === 'achat' || type === 'vente') {
                        const quantity = parseFloat(form.querySelector('[name="quantity"]').value) || 0;
                        const price = parseFloat(form.querySelector('[name="pricePerUnit"]').value) || 0;
                        const fees = parseFloat(form.querySelector('[name="fees"]').value) || 0;
                        currency = form.querySelector('[name="currency"]').value;
                        total = (quantity * price + fees);
                    } else {
                        total = parseFloat(form.querySelector('[name="amount"]').value) || 0;
                        currency = form.querySelector('#edit-dividende-fields [name="currency"]').value;
                    }

                    totalAmountEl.textContent = formatCurrency(total, currency);
                };

                typeSelect.addEventListener('change', () => {
                    const isDividend = typeSelect.value === 'dividende';
                    achatVenteFields.classList.toggle('hidden', isDividend);
                    dividendeFields.classList.toggle('hidden', !isDividend);
                    updateTotal();
                });

                form.addEventListener('input', updateTotal);
                updateTotal();
            };

            const handleEditInvestmentEntrySubmit = (e) => {
                e.preventDefault();
                const form = e.target;
                const fd = new FormData(form);
                const investmentId = form.dataset.investmentId;
                const entryId = form.dataset.entryId;

                const inv = state.investments.find(i => i.id === investmentId);
                if (!inv) return;

                const entryIndex = inv.history.findIndex(h => h.transactionId === entryId);
                if (entryIndex === -1) return;

                const oldEntry = inv.history[entryIndex];
                const type = fd.get('type');
                const date = fd.get('date');

                // Mettre à jour l'entrée d'historique
                let updatedEntry = { ...oldEntry, type, date };

                if (type === 'achat' || type === 'vente') {
                    updatedEntry.quantity = parseFloat(fd.get('quantity'));
                    updatedEntry.pricePerUnit = parseFloat(fd.get('pricePerUnit'));
                    updatedEntry.fees = parseFloat(fd.get('fees')) || 0;
                    updatedEntry.currency = fd.get('currency');
                    delete updatedEntry.amount;
                } else {
                    updatedEntry.amount = parseFloat(fd.get('amount'));
                    updatedEntry.currency = fd.get('currency') || state.baseCurrency;
                    delete updatedEntry.quantity;
                    delete updatedEntry.pricePerUnit;
                    delete updatedEntry.fees;
                }

                inv.history[entryIndex] = updatedEntry;

                // Mettre à jour la transaction liée
                const transaction = state.transactions.find(tx => tx.id === entryId);
                if (transaction) {
                    transaction.date = date;
                    transaction.description = `${type.charAt(0).toUpperCase() + type.slice(1)}: ${inv.name}`;

                    if (type === 'achat' || type === 'vente') {
                        const amountInForeignCurrency = updatedEntry.quantity * updatedEntry.pricePerUnit + updatedEntry.fees;
                        const amountInBaseCurrency = amountInForeignCurrency / (state.exchangeRates[updatedEntry.currency] || 1);

                        transaction.type = type === 'achat' ? 'expense' : 'income';
                        transaction.category = 'Investissement';
                        transaction.subCategory = type === 'achat' ? "Achat d'actif" : "Vente d'actif";
                        transaction.originalAmount = amountInForeignCurrency;
                        transaction.originalCurrency = updatedEntry.currency;
                        transaction.amount = amountInBaseCurrency;
                    } else {
                        transaction.type = 'income';
                        transaction.category = 'Revenus du Capital';
                        transaction.subCategory = 'Dividendes';
                        const amountInBaseCurrency = updatedEntry.currency === 'BTC' ? updatedEntry.amount * (state.exchangeRates[updatedEntry.currency] || 1) : updatedEntry.amount / (state.exchangeRates[updatedEntry.currency] || 1);
                        transaction.originalAmount = updatedEntry.amount;
                        transaction.originalCurrency = updatedEntry.currency;
                        transaction.amount = amountInBaseCurrency;
                    }
                }

                saveState(); // Sauvegarder les changements
                showToast('Opération modifiée avec succès !');
                fullUpdate(() => {
                    closeModal();
                    showInvestmentHistoryModal(investmentId);
                });
            };

            const handleDeleteInvestmentEntry = (investmentId, entryId) => {
                const inv = state.investments.find(i => i.id === investmentId);
                if (!inv) return;

                const entry = inv.history.find(h => h.transactionId === entryId);
                if (!entry) return;

                const content = `
                    <p>Supprimer cette opération d'investissement ?</p>
                    <p class="mt-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                        <strong>Attention :</strong> Cette action supprimera également la transaction associée dans vos comptes.
                    </p>`;

                openModal('Confirmer la suppression', content);

                document.getElementById('app-modal').addEventListener('click', (e) => {
                    if (e.target.matches('[data-action="confirm-delete"]')) {
                        // Supprimer l'entrée de l'historique
                        inv.history = inv.history.filter(h => h.transactionId !== entryId);
                        
                        // Supprimer la transaction liée
                        state.transactions = state.transactions.filter(tx => tx.id !== entryId);
                        
                        showToast('Opération supprimée !');
                        fullUpdate(() => {
                            closeModal();
                            showInvestmentHistoryModal(investmentId);
                        });
                    }
                });

                // Ajouter les boutons de confirmation
                const modalContent = document.querySelector('.modal-content');
                modalContent.innerHTML += `
                    <div class="mt-6 flex justify-end">
                        <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg mr-2">Annuler</button>
                        <button type="button" data-action="confirm-delete" class="bg-red-600 text-white py-2 px-4 rounded-lg">Supprimer</button>
                    </div>`;
            };

            // ========== DEBT MODALS ========== //
            const showDebtModal = () => {
                const content = `
                    <form id="debt-form">
                        <div class="space-y-4">
                            <div><label for="debt-name">Nom</label><input type="text" id="debt-name" name="name" required class="w-full p-2 border rounded"></div>
                            <div><label for="debt-amount">Montant Initial</label><input type="number" step="0.01" min="0" id="debt-amount" name="amount" required class="w-full p-2 border rounded"></div>
                            <div><label for="debt-rate">Taux d\'intérêt (%)</label><input type="number" step="0.01" min="0" id="debt-rate" name="interestRate" value="0" required class="w-full p-2 border rounded"></div>
                        </div>
                        <div class="mt-6 flex justify-end">
                            <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg mr-2">Annuler</button>
                            <button type="submit" class="bg-indigo-600 text-white py-2 px-4 rounded-lg">Ajouter</button>
                        </div>
                    </form>`;

                openModal('Ajouter une Dette', content);
            };

            const handleDebtSubmit = (e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                const amount = parseFloat(fd.get('amount'));

                state.debts.push({
                    id: generateId(),
                    name: fd.get('name'),
                    interestRate: parseFloat(fd.get('interestRate')),
                    history: [{ type: 'initial', date: today(), amount }]
                });

                closeModal();
                fullUpdate();
            };

            const showDebtHistoryModal = (debtId) => {
                const debt = state.debts.find(d => d.id === debtId);
                if (!debt) return;

                let content = `
                    <table class="w-full text-left table-auto">
                        <thead><tr><th class="p-2">Date</th><th class="p-2">Type</th><th class="p-2 text-right">Montant</th></tr></thead>
                        <tbody>${[...debt.history].sort((a, b) => new Date(b.date) - new Date(a.date)).map(h => `
                            <tr class="border-t"><td class="p-2">${h.date}</td><td class="p-2 capitalize">${h.type === 'initial' ? 'Montant initial' : 'Remboursement'}</td><td class="p-2 text-right">${formatCurrency(h.amount)}</td></tr>
                        `).join('') || `<tr><td colspan="3" class="p-4 text-center text-gray-500">Aucune opération.</td></tr>`}</tbody>
                    </table>
                    <div class="mt-6 flex justify-end">
                        <button data-action="show-add-debt-repayment-modal" data-id="${debtId}" class="bg-indigo-600 text-white py-2 px-4 rounded-lg">Ajouter un remboursement</button>
                    </div>`;

                openModal(`Historique: ${debt.name}`, content, 'max-w-lg');
            };

            const showAddDebtRepaymentModal = (debtId) => {
                const disabled = state.accounts.length === 0 ? 'disabled' : '';

                const content = `
                    <form id="debt-repayment-form" data-id="${debtId}">
                        <div class="space-y-4">
                            <div><label>Montant</label><input type="number" name="amount" required step="0.01" min="0" class="w-full p-2 border rounded"></div>
                            <div><label>Date</label><input type="date" name="date" value="${today()}" required class="w-full p-2 border rounded"></div>
                            <div><label>Compte de paiement</label><select name="accountId" class="w-full p-2 border rounded" ${disabled}>${state.accounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}</select></div>
                        </div>
                        <div class="mt-6 flex justify-end">
                            <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg mr-2">Annuler</button>
                            <button type="submit" class="bg-indigo-600 text-white py-2 px-4 rounded-lg" ${disabled}>Ajouter</button>
                        </div>
                    </form>`;

                openModal('Ajouter un Remboursement', content);
            };

            const handleDebtRepaymentSubmit = (e) => {
                e.preventDefault();
                const form = e.target;
                const fd = new FormData(form);
                const debtId = form.dataset.id;
                const debt = state.debts.find(d => d.id === debtId);

                if (!debt) return;

                const amount = parseFloat(fd.get('amount'));
                const date = fd.get('date');
                const accountId = fd.get('accountId');
                const txId = generateId();

                debt.history.push({ type: 'repayment', date, amount, transactionId: txId });

                state.transactions.push({
                    id: txId,
                    type: 'expense',
                    description: `Remboursement: ${debt.name}`,
                    amount,
                    originalAmount: amount,
                    originalCurrency: state.baseCurrency,
                    date,
                    accountId,
                    category: 'Dettes & Créances',
                    subCategory: 'Remboursement de prêt',
                    linkedTo: debtId,
                    recurring: false
                });

                // Vérifier si la dette est entièrement remboursée et l'archiver automatiquement
                autoArchiveDebt(debt);

                fullUpdate(() => {
                    closeModal();
                    showDebtHistoryModal(debtId);
                });
            };

            const showAmortizationModal = (debtId) => {
                const content = `
                    <form id="amortization-term-form" data-id="${debtId}">
                        <div class="space-y-4">
                            <div><label>Durée (mois)</label><input type="number" name="months" required min="1" class="w-full p-2 border rounded"></div>
                        </div>
                        <div class="mt-6 flex justify-end">
                            <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg mr-2">Annuler</button>
                            <button type="submit" class="bg-indigo-600 text-white py-2 px-4 rounded-lg">Générer</button>
                        </div>
                    </form>`;

                openModal('Tableau d\'Amortissement', content);
            };

            const handleAmortizationSubmit = (e) => {
                e.preventDefault();
                const form = e.target;
                const fd = new FormData(form);
                const debtId = form.dataset.id;
                const debt = state.debts.find(d => d.id === debtId);
                const termMonths = parseInt(fd.get('months'));

                if (!debt || !termMonths || termMonths <= 0) {
                    showToast("Durée invalide.", "error");
                    return;
                }

                const principal = calculateDebtOutstanding(debt);
                const annualRate = debt.interestRate / 100;
                const monthlyRate = annualRate / 12;

                if (monthlyRate === 0) {
                    const monthlyPayment = principal / termMonths;
                    let tableBody = '';

                    for (let i = 1; i <= termMonths; i++) {
                        tableBody += `<tr class="border-b"><td class="p-2">${i}</td><td class="p-2">${formatCurrency(monthlyPayment)}</td><td class="p-2">${formatCurrency(monthlyPayment)}</td><td class="p-2">${formatCurrency(0)}</td><td class="p-2">${formatCurrency(principal - (monthlyPayment * i))}</td></tr>`;
                    }

                    const content = `<div class="overflow-y-auto"><table class="w-full text-left table-auto"><thead><tr><th class="p-2">Mois</th><th class="p-2">Paiement</th><th class="p-2">Principal</th><th class="p-2">Intérêt</th><th class="p-2">Solde Restant</th></tr></thead><tbody>${tableBody}</tbody></table></div>`;
                    openModal(`Amortissement: ${debt.name}`, content, 'max-w-2xl');
                    return;
                }

                const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1);
                let remainingBalance = principal;
                let tableBody = '';

                for (let i = 1; i <= termMonths; i++) {
                    const interestPayment = remainingBalance * monthlyRate;
                    const principalPayment = monthlyPayment - interestPayment;
                    remainingBalance -= principalPayment;

                    if (remainingBalance < 0) {
                        remainingBalance = 0;
                    }

                    tableBody += `<tr class="border-b"><td class="p-2">${i}</td><td class="p-2">${formatCurrency(monthlyPayment)}</td><td class="p-2">${formatCurrency(principalPayment)}</td><td class="p-2">${formatCurrency(interestPayment)}</td><td class="p-2">${formatCurrency(remainingBalance)}</td></tr>`;
                }

                const content = `<div class="overflow-y-auto"><table class="w-full text-left table-auto"><thead><tr><th class="p-2">Mois</th><th class="p-2">Paiement</th><th class="p-2">Principal</th><th class="p-2">Intérêt</th><th class="p-2">Solde Restant</th></tr></thead><tbody>${tableBody}</tbody></table></div>`;
                openModal(`Amortissement: ${debt.name}`, content, 'max-w-2xl');
            };

            // ========== CLAIM MODALS ========== //
            const showClaimModal = () => {
                const content = `
                    <form id="claim-form">
                        <div class="space-y-4">
                            <div><label for="claim-name">Description</label><input type="text" id="claim-name" name="name" required class="w-full p-2 border rounded" placeholder="ex: Prêt à Jean"></div>
                            <div><label for="claim-amount">Montant Initial</label><input type="number" step="0.01" min="0" id="claim-amount" name="amount" required class="w-full p-2 border rounded"></div>
                        </div>
                        <div class="mt-6 flex justify-end">
                            <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg mr-2">Annuler</button>
                            <button type="submit" class="bg-indigo-600 text-white py-2 px-4 rounded-lg">Ajouter</button>
                        </div>
                    </form>`;

                openModal('Ajouter une Créance', content);
            };

            const handleClaimSubmit = (e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                const amount = parseFloat(fd.get('amount'));

                state.claims.push({
                    id: generateId(),
                    name: fd.get('name'),
                    history: [{ type: 'initial', date: today(), amount }]
                });

                showToast("Créance ajoutée ! Ajoutez la transaction de dépense correspondante.");
                closeModal();
                fullUpdate();
            };

            const showClaimHistoryModal = (claimId) => {
                const claim = state.claims.find(c => c.id === claimId);
                if (!claim) return;

                let content = `
                    <table class="w-full text-left table-auto">
                        <thead><tr><th class="p-2">Date</th><th class="p-2">Type</th><th class="p-2 text-right">Montant</th></tr></thead>
                        <tbody>${[...claim.history].sort((a, b) => new Date(b.date) - new Date(a.date)).map(h => `
                            <tr class="border-t"><td class="p-2">${h.date}</td><td class="p-2 capitalize">${h.type === 'initial' ? 'Montant initial' : 'Remboursement reçu'}</td><td class="p-2 text-right">${formatCurrency(h.amount)}</td></tr>
                        `).join('') || `<tr><td colspan="3" class="p-4 text-center text-gray-500">Aucune opération.</td></tr>`}</tbody>
                    </table>
                    <div class="mt-6 flex justify-end">
                        <button data-action="show-add-claim-payment-modal" data-id="${claimId}" class="bg-indigo-600 text-white py-2 px-4 rounded-lg">Ajouter un remboursement</button>
                    </div>`;

                openModal(`Historique: ${claim.name}`, content, 'max-w-lg');
            };

            const showAddClaimPaymentModal = (claimId) => {
                const disabled = state.accounts.length === 0 ? 'disabled' : '';

                const content = `
                    <form id="claim-payment-form" data-id="${claimId}">
                        <div class="space-y-4">
                            <div><label>Montant</label><input type="number" name="amount" required step="0.01" min="0" class="w-full p-2 border rounded"></div>
                            <div><label>Date</label><input type="date" name="date" value="${today()}" required class="w-full p-2 border rounded"></div>
                            <div><label>Compte de réception</label><select name="accountId" class="w-full p-2 border rounded" ${disabled}>${state.accounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}</select></div>
                        </div>
                        <div class="mt-6 flex justify-end">
                            <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg mr-2">Annuler</button>
                            <button type="submit" class="bg-indigo-600 text-white py-2 px-4 rounded-lg" ${disabled}>Ajouter</button>
                        </div>
                    </form>`;

                openModal('Ajouter un Remboursement', content);
            };

            const handleClaimPaymentSubmit = (e) => {
                e.preventDefault();
                const form = e.target;
                const fd = new FormData(form);
                const claimId = form.dataset.id;
                const claim = state.claims.find(c => c.id === claimId);

                if (!claim) return;

                const amount = parseFloat(fd.get('amount'));
                const date = fd.get('date');
                const accountId = fd.get('accountId');
                const txId = generateId();

                claim.history.push({ type: 'paymentReceived', date, amount, transactionId: txId });

                state.transactions.push({
                    id: txId,
                    type: 'income',
                    description: `Remboursement: ${claim.name}`,
                    amount,
                    originalAmount: amount,
                    originalCurrency: state.baseCurrency,
                    date,
                    accountId,
                    category: 'Autres Revenus',
                    subCategory: 'Remboursement de créance',
                    linkedTo: claimId
                });

                // Vérifier si la créance est entièrement remboursée et l'archiver automatiquement
                autoArchiveClaim(claim);

                fullUpdate(() => {
                    closeModal();
                    showClaimHistoryModal(claimId);
                });
            };

            const showDeleteClaimConfirmationModal = (claimId) => {
                const claim = state.claims.find(c => c.id === claimId);
                if (!claim) return;

                const content = `
                    <p>Supprimer la créance "<strong>${claim.name}</strong>" ?</p>
                    <p class="mt-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                        <strong>Attention :</strong> Toutes les transactions de remboursement liées seront supprimées.
                    </p>
                    <div class="mt-6 flex justify-end">
                        <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg mr-2">Annuler</button>
                        <button type="button" data-action="confirm-delete-claim" data-id="${claimId}" class="bg-red-600 text-white py-2 px-4 rounded-lg">Confirmer</button>
                    </div>`;

                openModal('Confirmer la suppression', content);
            };

            const handleDeleteClaim = (claimId) => {
                const claimName = state.claims.find(c => c.id === claimId)?.name || 'inconnue';
                state.claims = state.claims.filter(c => c.id !== claimId);
                state.transactions = state.transactions.filter(tx => tx.linkedTo !== claimId);
                showToast(`Créance "${claimName}" supprimée.`);
                fullUpdate();
            };

            // ========== GOAL MODALS ========== //
            const showGoalModal = () => {
                const content = `
                    <form id="goal-form">
                        <div class="space-y-4">
                            <div><label for="goal-name">Nom</label><input type="text" id="goal-name" name="name" required class="w-full p-2 border rounded"></div>
                            <div><label for="goal-target">Montant Cible</label><input type="number" step="0.01" min="0" id="goal-target" name="targetAmount" required class="w-full p-2 border rounded"></div>
                            <div><label for="goal-date">Date Cible</label><input type="date" id="goal-date" name="targetDate" class="w-full p-2 border rounded"></div>
                        </div>
                        <div class="mt-6 flex justify-end">
                            <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg mr-2">Annuler</button>
                            <button type="submit" class="bg-indigo-600 text-white py-2 px-4 rounded-lg">Ajouter</button>
                        </div>
                    </form>`;

                openModal('Ajouter un Objectif', content);
            };

            const handleGoalSubmit = (e) => {
                e.preventDefault();
                const fd = new FormData(e.target);

                state.goals.push({
                    id: generateId(),
                    name: fd.get('name'),
                    targetAmount: parseFloat(fd.get('targetAmount')),
                    targetDate: fd.get('targetDate'),
                    linkedAssetIds: [],
                    manualContributions: []
                });

                fullUpdate();
            };

            const showManageGoalModal = (goalId) => {
                const goal = state.goals.find(g => g.id === goalId);
                if (!goal) return;

                const allAssets = [
                    ...state.accounts.map(a => ({ id: a.id, name: `${a.name} (Compte)`, type: 'account' })),
                    ...state.investments.map(i => ({ id: i.id, name: `${i.name} (Investissement)`, type: 'investment' }))
                ];

                const linkedAssetsHtml = allAssets.map(asset => {
                    const isChecked = (goal.linkedAssetIds || []).includes(asset.id);
                    return `<div><label class="flex items-center"><input type="checkbox" name="asset" value="${asset.id}" ${isChecked ? 'checked' : ''} class="mr-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500">${asset.name}</label></div>`;
                }).join('');

                const content = `
                    <form id="manage-goal-form" data-id="${goalId}">
                        <h4 class="text-lg font-semibold mb-2">Actifs Liés</h4>
                        <div class="space-y-2 max-h-48 overflow-y-auto border p-3 rounded-md mb-4">
                            ${linkedAssetsHtml || '<p class="text-gray-500 text-sm">Aucun compte ou investissement.</p>'}
                        </div>
                        <h4 class="text-lg font-semibold mb-2 mt-6">Contributions Manuelles</h4>
                        <div class="max-h-48 overflow-y-auto border p-3 rounded-md">
                            ${(goal.manualContributions || []).length > 0 ?
                                `<ul class="space-y-1">${goal.manualContributions.map(c => `<li class="text-sm flex justify-between"><span>${c.date}: ${formatCurrency(c.amount)}</span></li>`).join('')}</ul>` :
                                `<p class="text-gray-500 text-sm">Aucune contribution.</p>`}
                        </div>
                        <div class="mt-4 flex justify-end">
                            <button type="button" data-action="show-add-manual-contribution-modal" data-id="${goalId}" class="bg-green-600 text-white py-2 px-4 rounded-lg text-sm">Ajouter une Contribution</button>
                        </div>
                        <div class="mt-8 flex justify-end">
                            <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg mr-2">Annuler</button>
                            <button type="submit" class="bg-indigo-600 text-white py-2 px-4 rounded-lg">Sauvegarder</button>
                        </div>
                    </form>`;

                openModal(`Gérer: ${goal.name}`, content, 'max-w-xl');
            };

            const handleManageGoalSubmit = (e) => {
                e.preventDefault();
                const form = e.target;
                const fd = new FormData(form);
                const goalId = form.dataset.id;
                const goal = state.goals.find(g => g.id === goalId);

                if (goal) {
                    goal.linkedAssetIds = fd.getAll('asset');
                }

                showToast('Liaisons mises à jour !');
                fullUpdate();
            };

            const showAddManualContributionModal = (goalId) => {
                const disabled = state.accounts.length === 0 ? 'disabled' : '';

                const content = `
                    <form id="manual-contribution-form" data-id="${goalId}">
                        <div class="space-y-4">
                            <div><label>Montant</label><input type="number" name="amount" required step="0.01" min="0" class="w-full p-2 border rounded"></div>
                            <div><label>Date</label><input type="date" name="date" value="${today()}" required class="w-full p-2 border rounded"></div>
                            <div>
                                <label>Compte</label>
                                <select name="accountId" class="w-full p-2 border rounded" ${disabled}>
                                    ${state.accounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        <div class="mt-6 flex justify-end">
                            <button type="button" data-action="close-modal-and-reopen-manage-goal" data-id="${goalId}" class="bg-gray-200 py-2 px-4 rounded-lg mr-2">Annuler</button>
                            <button type="submit" class="bg-indigo-600 text-white py-2 px-4 rounded-lg" ${disabled}>Ajouter</button>
                        </div>
                    </form>`;

                openModal('Ajouter une Contribution', content);
            };

            const handleAddManualContributionSubmit = (e) => {
                e.preventDefault();
                const form = e.target;
                const fd = new FormData(form);
                const goalId = form.dataset.id;
                const goal = state.goals.find(g => g.id === goalId);

                if (!goal) return;

                const amount = parseFloat(fd.get('amount'));
                const date = fd.get('date');
                const accountId = fd.get('accountId');
                const txId = generateId();

                if (!goal.manualContributions) {
                    goal.manualContributions = [];
                }

                goal.manualContributions.push({ id: generateId(), date, amount, transactionId: txId });

                state.transactions.push({
                    id: txId,
                    type: 'expense',
                    description: `Contribution: ${goal.name}`,
                    amount,
                    originalAmount: amount,
                    originalCurrency: state.baseCurrency,
                    date,
                    accountId,
                    category: 'Épargne',
                    subCategory: 'Contribution Manuelle',
                    linkedTo: goalId,
                    recurring: false
                });

                fullUpdate(() => {
                    closeModal();
                    showManageGoalModal(goalId);
                });
            };

            const showDeleteGoalConfirmationModal = (goalId) => {
                const goal = state.goals.find(g => g.id === goalId);
                if (!goal) return;

                const content = `
                    <p>Supprimer l'objectif "<strong>${goal.name}</strong>" ?</p>
                    <div class="mt-6 flex justify-end">
                        <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg mr-2">Annuler</button>
                        <button type="button" data-action="confirm-delete-goal" data-id="${goalId}" class="bg-red-600 text-white py-2 px-4 rounded-lg">Confirmer</button>
                    </div>`;

                openModal('Confirmer la suppression', content);
            };

            const handleDeleteGoal = (goalId) => {
                const goalName = state.goals.find(g => g.id === goalId)?.name || 'inconnu';
                state.goals = state.goals.filter(g => g.id !== goalId);
                showToast(`Objectif "${goalName}" supprimé.`);
                fullUpdate();
            };

            // ========== BUDGET MODAL ========== //
            const showBudgetModal = () => {
                // Rediriger vers l'onglet Budget au lieu d'utiliser l'ancienne modale
                state.activeTab = 'budget';
                render();
            };

            // ========== TASK MODALS ========== //
            const showTaskModal = (taskId = null) => {
                const isEditing = !!taskId;
                const task = isEditing ? state.tasks.find(t => t.id === taskId) : null;
                const title = isEditing ? 'Modifier la Tâche' : 'Ajouter une Tâche';

                const content = `
                    <form id="task-form" data-id="${isEditing ? taskId : ''}">
                        <div class="space-y-4">
                            <div>
                                <label for="task-description" class="block text-sm font-medium">Description</label>
                                <input type="text" id="task-description" name="description" required class="w-full p-2 border rounded" value="${isEditing ? task.description : ''}">
                            </div>
                            <div>
                                <label for="task-quadrant" class="block text-sm font-medium">Quadrant</label>
                                <select id="task-quadrant" name="quadrant" class="w-full p-2 border rounded">
                                    <option value="inbox" ${isEditing && task.quadrant === 'inbox' ? 'selected' : ''}>Boîte de réception</option>
                                    <option value="do" ${isEditing && task.quadrant === 'do' ? 'selected' : ''}>🔴 Faire (Urgent & Important)</option>
                                    <option value="decide" ${isEditing && task.quadrant === 'decide' ? 'selected' : ''}>🔵 Planifier (Non Urgent & Important)</option>
                                    <option value="delegate" ${isEditing && task.quadrant === 'delegate' ? 'selected' : ''}>🟡 Déléguer (Urgent & Non Important)</option>
                                    <option value="delete" ${isEditing && task.quadrant === 'delete' ? 'selected' : ''}>🟢 Abandonner (Non Urgent & Non Important)</option>
                                </select>
                            </div>
                        </div>
                        <div class="mt-6 flex justify-end">
                            <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg mr-2">Annuler</button>
                            <button type="submit" class="bg-indigo-600 text-white py-2 px-4 rounded-lg">${isEditing ? 'Sauvegarder' : 'Ajouter'}</button>
                        </div>
                    </form>`;

                openModal(title, content);
            };

            const handleTaskSubmit = (e) => {
                e.preventDefault();
                const form = e.target;
                const fd = new FormData(form);
                const taskId = form.dataset.id;

                if (taskId) {
                    const task = state.tasks.find(t => t.id === taskId);
                    if (task) {
                        task.description = fd.get('description');
                        task.quadrant = fd.get('quadrant');
                    }
                } else {
                    state.tasks.push({
                        id: generateId(),
                        description: fd.get('description'),
                        quadrant: fd.get('quadrant'),
                        done: false
                    });
                }

                fullUpdate();
            };

            const showWishlistItemModal = (itemId = null) => {
                const isEditing = !!itemId;
                const item = isEditing ? state.wishlist.find(i => i.id === itemId) : null;
                const title = isEditing ? 'Modifier l\'Article' : 'Ajouter à la Wishlist';

                const content = `
                    <form id="wishlist-item-form" data-id="${isEditing ? itemId : ''}">
                        <div class="space-y-4">
                            <div>
                                <label for="wishlist-name" class="block text-sm font-medium">Nom</label>
                                <input type="text" id="wishlist-name" name="name" required class="w-full p-2 border rounded" value="${isEditing ? item.name : ''}">
                            </div>
                            <div>
                                <label for="wishlist-price" class="block text-sm font-medium">Prix</label>
                                <input type="number" step="0.01" min="0" id="wishlist-price" name="price" required class="w-full p-2 border rounded" value="${isEditing ? item.price : ''}">
                            </div>
                            <div>
                                <label for="wishlist-url" class="block text-sm font-medium">URL (optionnel)</label>
                                <input type="url" id="wishlist-url" name="url" class="w-full p-2 border rounded" value="${isEditing ? item.url : ''}" placeholder="https://...">
                            </div>
                        </div>
                        <div class="mt-6 flex justify-end">
                            <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg mr-2">Annuler</button>
                            <button type="submit" class="bg-indigo-600 text-white py-2 px-4 rounded-lg">${isEditing ? 'Sauvegarder' : 'Ajouter'}</button>
                        </div>
                    </form>`;

                openModal(title, content);
            };

            const handleWishlistItemSubmit = (e) => {
                e.preventDefault();
                const form = e.target;
                const fd = new FormData(form);
                const itemId = form.dataset.id;

                if (itemId) {
                    const item = state.wishlist.find(i => i.id === itemId);
                    if (item) {
                        item.name = fd.get('name');
                        item.price = parseFloat(fd.get('price'));
                        item.url = fd.get('url') || null;
                    }
                } else {
                    state.wishlist.push({
                        id: generateId(),
                        name: fd.get('name'),
                        price: parseFloat(fd.get('price')),
                        url: fd.get('url') || null
                    });
                }

                fullUpdate();
            };

            // ========== MANAGE CATEGORIES MODAL ========== //
            const showManageCategoriesModal = () => {
                const expenseCategories = Object.entries(state.categories.expense).map(([category, subcategories]) => {
                    return `
                        <div class="border rounded-lg p-4 mb-4">
                            <h4 class="font-semibold text-gray-900 mb-2">${category}</h4>
                            <div class="space-y-2">
                                ${subcategories.map(sub => `
                                    <div class="flex justify-between items-center bg-gray-50 p-2 rounded">
                                        <span class="text-sm">${sub}</span>
                                        <button data-action="delete-subcategory" data-category="${category}" data-subcategory="${sub}" 
                                                class="text-red-600 hover:text-red-800 text-sm">
                                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                                        </button>
                                    </div>
                                `).join('')}
                                <div class="flex gap-2 mt-2">
                                    <input type="text" placeholder="Nouvelle sous-catégorie" 
                                           class="flex-1 p-2 border rounded text-sm" 
                                           id="new-subcategory-${category}">
                                    <button data-action="add-subcategory" data-category="${category}" 
                                            class="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700">
                                        Ajouter
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');

                const incomeCategories = Object.entries(state.categories.income).map(([category, subcategories]) => {
                    return `
                        <div class="border rounded-lg p-4 mb-4">
                            <h4 class="font-semibold text-gray-900 mb-2">${category}</h4>
                            <div class="space-y-2">
                                ${subcategories.map(sub => `
                                    <div class="flex justify-between items-center bg-gray-50 p-2 rounded">
                                        <span class="text-sm">${sub}</span>
                                        <button data-action="delete-subcategory" data-category="${category}" data-subcategory="${sub}" 
                                                class="text-red-600 hover:text-red-800 text-sm">
                                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                                        </button>
                                    </div>
                                `).join('')}
                                <div class="flex gap-2 mt-2">
                                    <input type="text" placeholder="Nouvelle sous-catégorie" 
                                           class="flex-1 p-2 border rounded text-sm" 
                                           id="new-subcategory-${category}">
                                    <button data-action="add-subcategory" data-category="${category}" 
                                            class="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700">
                                        Ajouter
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');

                const content = `
                    <div class="space-y-6">
                        <div>
                            <h3 class="text-lg font-semibold mb-4 text-red-600">Catégories de Dépenses</h3>
                            ${expenseCategories}
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold mb-4 text-green-600">Catégories de Revenus</h3>
                            ${incomeCategories}
                        </div>
                        <div class="border-t pt-4">
                            <h4 class="font-semibold mb-2">Ajouter une nouvelle catégorie principale</h4>
                            <div class="flex gap-2">
                                <select id="new-category-type" class="p-2 border rounded">
                                    <option value="expense">Dépense</option>
                                    <option value="income">Revenu</option>
                                </select>
                                <input type="text" placeholder="Nom de la catégorie" 
                                       class="flex-1 p-2 border rounded" 
                                       id="new-category-name">
                                <button data-action="add-main-category" 
                                        class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                                    Ajouter
                                </button>
                            </div>
                        </div>
                    </div>
                `;

                openModal('Gérer les Catégories', content, 'max-w-4xl');
            };

            // ========== DELETE CONFIRMATION MODALS ========== //
            const showDeleteAccountConfirmationModal = (accountId) => {
                const hasTransactions = state.transactions.some(tx => tx.accountId === accountId);

                if (hasTransactions) {
                    showToast("Impossible: ce compte a des transactions.", 'error');
                    return;
                }

                const content = `
                    <p>Supprimer le compte "<strong>${state.accounts.find(a => a.id === accountId)?.name}</strong>" ?</p>
                    <p class="mt-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                        <strong>Attention :</strong> Cette action est irréversible.
                    </p>
                    <div class="mt-6 flex justify-end">
                        <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg mr-2">Annuler</button>
                        <button type="button" data-action="confirm-delete-account" data-id="${accountId}" class="bg-red-600 text-white py-2 px-4 rounded-lg">Confirmer</button>
                    </div>`;

                openModal('Confirmer la suppression', content);
            };

            const handleDeleteAccount = (accountId) => {
                const accountName = state.accounts.find(a => a.id === accountId)?.name || 'inconnu';
                state.accounts = state.accounts.filter(acc => acc.id !== accountId);

                state.goals.forEach(goal => {
                    if (goal.linkedAssetIds) {
                        goal.linkedAssetIds = goal.linkedAssetIds.filter(id => id !== accountId);
                    }
                });

                showToast(`Compte "${accountName}" supprimé.`);
                fullUpdate();
            };

            const showDeleteTransactionConfirmationModal = (txId) => {
                const tx = state.transactions.find(t => t.id === txId);
                if (!tx) return;

                const content = `
                    <p>Supprimer la transaction "<strong>${tx.description}</strong>" (${formatCurrency(tx.originalAmount, tx.originalCurrency)}) ?</p>
                    <div class="mt-6 flex justify-end">
                        <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg mr-2">Annuler</button>
                        <button type="button" data-action="confirm-delete-transaction" data-id="${txId}" class="bg-red-600 text-white py-2 px-4 rounded-lg">Confirmer</button>
                    </div>`;

                openModal('Confirmer la suppression', content);
            };

            const handleDeleteTransaction = (txId) => {
                const tx = state.transactions.find(t => t.id === txId);
                if (!tx) return;

                if (tx.isSplit) {
                    state.transactions = state.transactions.filter(child => child.parentTransactionId !== tx.id);
                }

                state.transactions = state.transactions.filter(t => t.id !== txId);

                if (tx.linkedTo) {
                    const debt = state.debts.find(d => d.id === tx.linkedTo);
                    if (debt) {
                        debt.history = debt.history.filter(h => h.transactionId !== txId);
                    }

                    const investment = state.investments.find(i => i.id === tx.linkedTo);
                    if (investment) {
                        investment.history = investment.history.filter(h => h.transactionId !== txId);
                    }

                    const goal = state.goals.find(g => g.id === tx.linkedTo);
                    if (goal) {
                        goal.manualContributions = goal.manualContributions.filter(mc => mc.transactionId !== txId);
                    }
                }

                // Gérer les liens budget
                if (tx.budgetItemLink) {
                    const { month, categoryKey } = tx.budgetItemLink;
                    if (state.monthlyBudgets[month] && state.monthlyBudgets[month][categoryKey]) {
                        const budgetItem = state.monthlyBudgets[month][categoryKey];
                        budgetItem.spent = Math.max(0, budgetItem.spent - tx.amount);
                        budgetItem.transactions = budgetItem.transactions.filter(id => id !== txId);
                    }
                }

                showToast(`Transaction "${tx.description}" supprimée.`);
                fullUpdate();
            };

            const showDeleteInvestmentConfirmationModal = (investmentId) => {
                const inv = state.investments.find(i => i.id === investmentId);
                if (!inv) return;

                const content = `
                    <p>Supprimer l'investissement "<strong>${inv.name}</strong>" ?</p>
                    <p class="mt-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                        <strong>Attention :</strong> Toutes les transactions liées (achats, ventes) seront supprimées.
                    </p>
                    <div class="mt-6 flex justify-end">
                        <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg mr-2">Annuler</button>
                        <button type="button" data-action="confirm-delete-investment" data-id="${investmentId}" class="bg-red-600 text-white py-2 px-4 rounded-lg">Confirmer</button>
                    </div>`;

                openModal('Confirmer la suppression', content);
            };

            const handleDeleteInvestment = (investmentId) => {
                const invName = state.investments.find(i => i.id === investmentId)?.name || 'inconnu';
                state.investments = state.investments.filter(i => i.id !== investmentId);
                state.transactions = state.transactions.filter(tx => tx.linkedTo !== investmentId);

                state.goals.forEach(goal => {
                    if (goal.linkedAssetIds) {
                        goal.linkedAssetIds = goal.linkedAssetIds.filter(id => id !== investmentId);
                    }
                });

                showToast(`Investissement "${invName}" supprimé.`);
                fullUpdate();
            };

            const showDeleteDebtConfirmationModal = (debtId) => {
                const debt = state.debts.find(d => d.id === debtId);
                if (!debt) return;

                const content = `
                    <p>Supprimer la dette "<strong>${debt.name}</strong>" ?</p>
                    <p class="mt-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                        <strong>Attention :</strong> Toutes les transactions de remboursement liées seront supprimées.
                    </p>
                    <div class="mt-6 flex justify-end">
                        <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg mr-2">Annuler</button>
                        <button type="button" data-action="confirm-delete-debt" data-id="${debtId}" class="bg-red-600 text-white py-2 px-4 rounded-lg">Confirmer</button>
                    </div>`;

                openModal('Confirmer la suppression', content);
            };

            const handleDeleteDebt = (debtId) => {
                const debtName = state.debts.find(d => d.id === debtId)?.name || 'inconnue';
                state.debts = state.debts.filter(d => d.id !== debtId);
                state.transactions = state.transactions.filter(tx => tx.linkedTo !== debtId);
                showToast(`Dette "${debtName}" supprimée.`);
                fullUpdate();
            };

            const getPeriodDates = (period) => {
                const now = new Date();
                let startDate = new Date();
                const endDate = new Date();

                switch (period) {
                    case 'this-month':
                        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                        break;
                    case 'last-month':
                        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                        endDate.setDate(0); // End of last month
                        break;
                    case 'this-year':
                        startDate = new Date(now.getFullYear(), 0, 1);
                        break;
                    case 'last-30-days':
                        startDate.setDate(now.getDate() - 30);
                        break;
                    case 'last-90-days':
                        startDate.setDate(now.getDate() - 90);
                        break;
                }
                return { startDate, endDate };
            };

            const getTransactionsForFilter = () => {
                let filtered = [...(state.transactions || [])];
                const filters = state.transactionFilters;

                if (filters.period && filters.period !== 'all') {
                    const { startDate, endDate } = getPeriodDates(filters.period);
                    filtered = filtered.filter(tx => {
                        const txDate = new Date(tx.date);
                        return txDate >= startDate && txDate <= endDate;
                    });
                }

                if (filters.type) {
                    filtered = filtered.filter(tx => tx.type === filters.type);
                }

                if (filters.accountId) {
                    filtered = filtered.filter(tx => tx.accountId === filters.accountId);
                }

                if (filters.search) {
                    const searchTerm = filters.search.toLowerCase();
                    filtered = filtered.filter(tx => 
                        tx.description.toLowerCase().includes(searchTerm) ||
                        (tx.tags && tx.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
                    );
                }

                if (filters.startDate && filters.endDate && filters.startDate.trim() !== '' && filters.endDate.trim() !== '') {
                    const start = new Date(filters.startDate);
                    const end = new Date(filters.endDate);
                    end.setHours(23, 59, 59, 999); // Include the whole end day
                    filtered = filtered.filter(tx => {
                        const txDate = new Date(tx.date);
                        return txDate >= start && txDate <= end;
                    });
                }

                if (filters.category) {
                    filtered = filtered.filter(tx => tx.category === filters.category);
                }

                return filtered;
            };

            // ========== UI RENDERING ========== //
            const render = () => {
                renderSidebar();
                renderContent();
                renderNotifications();
                lucide.createIcons();
            };

            const renderSidebar = () => {
                const nav = document.getElementById('sidebar-nav');
                const tabs = [
                    { id: 'dashboard', label: 'Résumé', icon: 'layout-dashboard' },
                    { id: 'accounts', label: 'Comptes', icon: 'wallet' },
                    { id: 'transactions', label: 'Transactions', icon: 'history' },
                    { id: 'budget', label: 'Budget', icon: 'calculator' },
                    { id: 'investments', label: 'Investissements', icon: 'trending-up' },
                    { id: 'debts', label: 'Dettes', icon: 'credit-card' },
                    { id: 'claims', label: 'Créances', icon: 'hand-coins' },
                    { id: 'goals', label: 'Objectifs', icon: 'flag' },
                    { id: 'planner', label: 'Planificateur', icon: 'calendar-check' },
                    { id: 'reports', label: 'Rapports', icon: 'bar-chart-big' },
                    { id: 'forecasts', label: 'Prévisions', icon: 'bar-chart-3' },
                    { id: 'settings', label: 'Paramètres', icon: 'settings' }
                ];

                nav.innerHTML = tabs.map(tab =>
                    `<a href="#" data-tab="${tab.id}" class="nav-link flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100 ${state.activeTab === tab.id ? 'bg-indigo-100 text-indigo-700 font-semibold' : ''}">
                        <i data-lucide="${tab.icon}" class="mr-3"></i><span>${tab.label}</span>
                    </a>`
                ).join('');

                document.getElementById('main-title').textContent = tabs.find(t => t.id === state.activeTab)?.label || 'Résumé';
            };

            const renderContent = () => {
                const content = document.getElementById('main-content');
                let filterBanner = '';

                if (state.activeAccountFilterId) {
                    const account = state.accounts.find(a => a.id === state.activeAccountFilterId);
                    if (account) {
                        filterBanner = `
                            <div class="sticky top-0 z-10 mb-4 p-3 bg-blue-600 text-white rounded-lg flex justify-between items-center text-sm shadow-lg">
                                <p><i data-lucide="filter" class="inline-block mr-2"></i>Filtre actif: <strong>${account.name}</strong></p>
                                <button data-action="clear-global-filter" class="bg-white text-blue-600 font-semibold py-1 px-3 rounded-md hover:bg-blue-100">Effacer</button>
                            </div>`;
                    }
                }

                if (state.searchQuery) {
                    renderSearchResults();
                    return;
                }

                const renderMap = {
                    dashboard: () => { content.innerHTML = filterBanner + renderDashboard(); setTimeout(() => renderDashboardCharts(), 100); },
                    accounts: () => content.innerHTML = filterBanner + renderAccounts(),
                    transactions: () => content.innerHTML = filterBanner + renderTransactions(),
                    budget: () => content.innerHTML = filterBanner + renderBudget(),
                    investments: () => content.innerHTML = filterBanner + renderInvestments(),
                    debts: () => content.innerHTML = filterBanner + renderDebts(),
                    claims: () => content.innerHTML = filterBanner + renderClaims(),
                    goals: () => content.innerHTML = filterBanner + renderGoals(),
                    planner: () => content.innerHTML = filterBanner + renderPlanner(),
                    reports: () => { content.innerHTML = filterBanner + renderReports(); setTimeout(() => renderReportCharts(), 100); },
                    forecasts: () => { content.innerHTML = filterBanner + renderForecasts(); setTimeout(() => renderForecastChart(), 100); },
                    settings: () => content.innerHTML = filterBanner + renderSettings(),
                };

                try {
                    (renderMap[state.activeTab] || renderMap.dashboard)();
                } catch (error) {
                    console.error('Erreur lors du rendu de l\'onglet:', state.activeTab, error);
                    content.innerHTML = filterBanner + renderDashboard();
                    setTimeout(() => renderDashboardCharts(), 100);
                }
            };

            const renderDashboard = () => {
                if (state.activeAccountFilterId) {
                    return renderFilteredDashboard();
                }

                const netWorth = calculateNetWorth();
                const now = new Date();
                const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                const monthlyTransactions = state.transactions.filter(t => t.date >= firstDayOfMonth);
                const monthlyExpenses = monthlyTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
                // Calculer le budget total du mois en cours depuis monthlyBudgets
                const currentMonthData = state.monthlyBudgets[state.currentBudgetMonth] || {};
                const totalBudget = Object.values(currentMonthData).reduce((sum, cat) => sum + (cat.planned || 0), 0);

                const goalsPreview = state.goals.slice(0, 3).map(goal => {
                    const savedAmount = calculateGoalProgress(goal.id);
                    const progress = Math.min(100, (savedAmount / goal.targetAmount) * 100);

                    return `
                        <div>
                            <div class="flex justify-between text-sm mb-1">
                                <span class="font-medium">${goal.name}</span>
                                <span>${progress.toFixed(0)}%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2.5"><div class="bg-indigo-600 h-2.5 rounded-full" style="width: ${progress}%"></div></div>
                        </div>`;
                }).join('');

                return `
                    <div class="mb-6 flex justify-end gap-4">
                        <!-- Bouton OCR sur le Dashboard -->
                        <button data-action="show-ocr-modal" class="bg-amber-500 text-white py-2 px-4 rounded-lg hover:bg-amber-600 flex items-center space-x-2">
                            <i data-lucide="scan"></i><span>Scanner Relevé Bancaire</span>
                        </button>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
                        <a href="#" data-action="navigate" data-tab="accounts">${renderInfoCard('Comptes', formatCurrency(calculateTotalAccountsBalance()), 'wallet', 'bg-blue-100 text-blue-800')}</a>
                        <a href="#" data-action="navigate" data-tab="investments">${renderInfoCard('Investissements', formatCurrency(calculateTotalInvestments()), 'trending-up', 'bg-green-100 text-green-800')}</a>
                        <a href="#" data-action="navigate" data-tab="debts">${renderInfoCard('Dettes', formatCurrency(calculateTotalDebts()), 'credit-card', 'bg-red-100 text-red-800')}</a>
                        <a href="#" data-action="navigate" data-tab="claims">${renderInfoCard('Créances', formatCurrency(calculateTotalClaims()), 'hand-coins', 'bg-green-100 text-green-800')}</a>
                        ${totalBudget > 0
                            ? `<a href="#" data-action="navigate" data-tab="forecasts">${renderInfoCard('Budget (Mois)', `${formatCurrency(monthlyExpenses)} / ${formatCurrency(totalBudget)}`, 'target', 'bg-purple-100 text-purple-800')}</a>`
                            : `<a href="#" data-action="navigate" data-tab="transactions">${renderInfoCard('Dépenses (Mois)', formatCurrency(monthlyExpenses), 'arrow-left-right', 'bg-yellow-100 text-yellow-800')}</a>`}
                    </div>
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div class="lg:col-span-2 bg-white p-6 rounded-lg shadow">
                            <h3 class="text-lg font-semibold mb-4">Évolution du Patrimoine Net</h3>
                            <canvas id="netWorthChart"></canvas>
                        </div>
                        <div class="space-y-6">
                            <div class="bg-white p-6 rounded-lg shadow">
                                <h3 class="text-lg font-semibold mb-4">Objectifs Principaux</h3>
                                <div class="space-y-4">${goalsPreview || '<p class="text-gray-500 text-sm">Aucun objectif.</p>'}</div>
                            </div>
                            <div class="bg-white p-6 rounded-lg shadow">
                                <h3 class="text-lg font-semibold mb-4">Soldes des Comptes</h3>
                                <div class="space-y-3">
                                    ${(state.accounts || []).map(acc => {
                                        const balance = calculateAccountBalance(acc.id);
                                        const rate = state.exchangeRates[acc.currency] || 1;
                                        const balanceInAccountCurrency = acc.currency === state.baseCurrency ? balance : (balance * rate);

                                        return `<div class="flex justify-between items-center">
                                            <span>${acc.name}</span>
                                            <span class="font-semibold">${formatCurrency(balanceInAccountCurrency, acc.currency)}</span>
                                        </div>`;
                                    }).join('') || '<p class="text-center text-gray-500">Aucun compte.</p>'}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="mt-6 bg-white p-6 rounded-lg shadow">
                        <h3 class="text-lg font-semibold mb-4">Flux de Trésorerie (Mois en cours)</h3>
                        <canvas id="cashFlowChart"></canvas>
                    </div>`;
            };

            const renderFilteredDashboard = () => {
                const account = state.accounts.find(a => a.id === state.activeAccountFilterId);
                if (!account) {
                    return `<p>Compte introuvable.</p>`;
                }

                const balance = calculateAccountBalance(account.id);
                const rate = state.exchangeRates[account.currency] || 1;
                const balanceInAccountCurrency = account.currency === state.baseCurrency ? balance : (balance * rate);

                const now = new Date();
                const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                const monthlyTransactions = state.transactions.filter(t => t.date >= firstDayOfMonth && t.accountId === account.id);
                const monthlyIncome = monthlyTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
                const monthlyExpenses = monthlyTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

                const monthlyIncomeInAccountCurrency = account.currency === state.baseCurrency ? monthlyIncome : (monthlyIncome * rate);
                const monthlyExpensesInAccountCurrency = account.currency === state.baseCurrency ? monthlyExpenses : (monthlyExpenses * rate);

                return `
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        ${renderInfoCard(`Solde (${account.name})`, formatCurrency(balanceInAccountCurrency, account.currency), 'wallet', 'bg-green-100 text-green-800')}
                        ${renderInfoCard('Revenus (Mois)', formatCurrency(monthlyIncomeInAccountCurrency, account.currency), 'arrow-up', 'bg-blue-100 text-blue-800')}
                        ${renderInfoCard('Dépenses (Mois)', formatCurrency(monthlyExpensesInAccountCurrency, account.currency), 'arrow-down', 'bg-red-100 text-red-800')}
                        ${renderInfoCard('Cash Flow (Mois)', formatCurrency(monthlyIncomeInAccountCurrency - monthlyExpensesInAccountCurrency, account.currency), 'arrow-left-right', 'bg-yellow-100 text-yellow-800')}
                    </div>
                    <div class="mt-6 bg-white p-6 rounded-lg shadow">
                        <h3 class="text-lg font-semibold mb-4">Flux de Trésorerie pour ${account.name} (Mois en cours)</h3>
                        <canvas id="cashFlowChart"></canvas>
                    </div>`;
            };

            const renderInfoCard = (title, value, icon, colors) =>
                `<div class="bg-white p-5 rounded-lg shadow flex items-center hover:shadow-lg transition-shadow duration-300 h-full">
                    <div class="p-3 rounded-full ${colors} mr-4"><i data-lucide="${icon}"></i></div>
                    <div><p class="text-sm text-gray-500">${title}</p><p class="text-2xl font-bold">${value}</p></div>
                </div>`;

            const renderDashboardCharts = () => {
                if (netWorthChart) {
                    netWorthChart.destroy();
                    netWorthChart = null;
                }

                if (cashFlowChart) {
                    cashFlowChart.destroy();
                    cashFlowChart = null;
                }

                const transactionsToShow = getTransactionsForFilter();
                const now = new Date();
                const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);
                const monthlyIncomeByDay = new Array(daysInMonth).fill(0);
                const monthlyExpensesByDay = new Array(daysInMonth).fill(0);

                transactionsToShow.filter(t => new Date(t.date).getMonth() === now.getMonth() && new Date(t.date).getFullYear() === now.getFullYear())
                    .forEach(t => {
                        const day = new Date(t.date).getDate() - 1;
                        if (t.type === 'income') {
                            monthlyIncomeByDay[day] += t.amount;
                        } else {
                            monthlyExpensesByDay[day] += t.amount;
                        }
                    });

                const cashFlowCtx = document.getElementById('cashFlowChart')?.getContext('2d');
                if (cashFlowCtx) {
                    cashFlowChart = new Chart(cashFlowCtx, {
                        type: 'bar',
                        data: {
                            labels,
                            datasets: [
                                { label: 'Revenus', data: monthlyIncomeByDay, backgroundColor: 'rgba(74, 222, 128, 0.6)' },
                                { label: 'Dépenses', data: monthlyExpensesByDay, backgroundColor: 'rgba(248, 113, 113, 0.6)' }
                            ]
                        },
                        options: { scales: { x: { stacked: true }, y: { stacked: true, ticks: { maxTicksLimit: 10 } } } }
                    });
                }

                if (!state.activeAccountFilterId) {
                    const netWorthCtx = document.getElementById('netWorthChart')?.getContext('2d');
                    const netWorthData = state.netWorthHistory.slice(-90);

                    if (netWorthCtx) {
                        netWorthChart = new Chart(netWorthCtx, {
                            type: 'line',
                            data: {
                                labels: netWorthData.map(h => h.date),
                                datasets: [{
                                    label: 'Patrimoine Net',
                                    data: netWorthData.map(h => h.netWorth),
                                    borderColor: 'rgb(79, 70, 229)',
                                    tension: 0.1,
                                    fill: true
                                }]
                            },
                            options: { scales: { y: { ticks: { maxTicksLimit: 10 } } } }
                        });
                    }
                }
            };

            const renderAccounts = () => {
                const transferButtonDisabled = state.accounts.length < 2 ? 'disabled' : '';
                const transferButtonTooltip = transferButtonDisabled ? 'title="Créez 2 comptes pour un virement"' : '';

                return `
                    <div class="mb-6 flex justify-end gap-4">
                        <!-- Bouton OCR dans Comptes -->
                        <button data-action="show-ocr-modal" class="bg-amber-500 text-white py-2 px-4 rounded-lg hover:bg-amber-600 flex items-center space-x-2">
                            <i data-lucide="scan"></i><span>Scanner Relevé Bancaire</span>
                        </button>
                        <button data-action="add-transfer" class="bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-800 flex items-center space-x-2" ${transferButtonDisabled} ${transferButtonTooltip}>
                            <i data-lucide="arrow-right-left"></i><span>Virement Interne</span>
                        </button>
                        <button data-action="add-account" class="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 flex items-center space-x-2">
                            <i data-lucide="plus"></i><span>Nouveau Compte</span>
                        </button>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${(state.accounts || []).map(account => {
                            const balance = calculateAccountBalance(account.id);
                            const rate = state.exchangeRates[account.currency] || 1;
                            const balanceInAccountCurrency = account.currency === state.baseCurrency ? balance : (balance * rate);

                            return `
                                <div class="bg-white p-6 rounded-lg shadow">
                                    <div class="flex justify-between items-start">
                                        <div>
                                            <h3 class="text-xl font-semibold">${account.name}</h3>
                                            <p class="text-3xl font-bold mt-2 text-gray-800">${formatCurrency(balanceInAccountCurrency, account.currency)}</p>
                                        </div>
                                        <div class="flex flex-col items-end space-y-2">
                                            <div class="flex items-center gap-2">
                                                <button data-action="view-account-dashboard" data-id="${account.id}" class="text-indigo-600 hover:text-indigo-800" title="Voir le résumé"><i data-lucide="layout-dashboard"></i></button>
                                                <button data-action="view-account-tx" data-id="${account.id}" class="text-indigo-600 hover:text-indigo-800" title="Voir les transactions"><i data-lucide="history"></i></button>
                                                <button data-action="edit-account" data-id="${account.id}" class="text-blue-600 hover:text-blue-800" title="Modifier"><i data-lucide="pencil"></i></button>
                                                <button data-action="delete-account" data-id="${account.id}" class="text-red-600 hover:text-red-800" title="Supprimer"><i data-lucide="trash-2"></i></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>`;
                        }).join('') || '<p class="text-center text-gray-500 col-span-full py-8">Aucun compte. Ajoutez-en un.</p>'}
                    </div>`;
            };

            const renderTransactions = () => {
                const addButtonsDisabled = state.accounts.length === 0 ? 'disabled' : '';
                const addButtonsTooltip = addButtonsDisabled ? 'title="Créez un compte d\'abord"' : '';

                const sortedTransactions = getTransactionsForFilter().sort((a, b) => new Date(b.date) - new Date(a.date));
                let tableBody = sortedTransactions.map(tx => {
                    let childrenHtml = '';
                    if (tx.isSplit) {
                        const children = state.transactions.filter(child => child.parentTransactionId === tx.id);
                        childrenHtml = `
                            <tr class="split-details-row bg-gray-50" id="split-details-${tx.id}">
                                <td colspan="6" class="p-0">
                                    <div class="p-4 space-y-2">
                                        ${children.map(child => `
                                            <div class="flex justify-between items-center text-sm">
                                                <span><i data-lucide="corner-down-right" class="inline-block w-4 h-4 mr-2"></i>${child.description}</span>
                                                <span class="font-medium">${formatCurrency(child.amount)}</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                </td>
                            </tr>`;
                    }

                    const rowClass = tx.isSplit ? 'cursor-pointer hover:bg-blue-50' : 'hover:bg-gray-50';
                    const descriptionHtml = tx.isSplit ? `${tx.description} <span class="text-xs text-blue-600 font-semibold">(détails)</span>` : tx.description;

                    return `
                        <tr class="${rowClass}" ${tx.isSplit ? `data-action="toggle-split-details" data-id="${tx.id}"` : ''}>
                            <td class="p-3">${tx.date}</td>
                            <td class="p-3 font-medium">
                                ${descriptionHtml} ${tx.recurring ? '<i data-lucide="repeat" class="inline-block w-4 h-4 text-gray-400 ml-1"></i>' : ''}
                                ${tx.tags?.length ? `<div class="mt-1 flex flex-wrap gap-1">${tx.tags.map(tag => `<span class="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">${tag}</span>`).join('')}</div>` : ''}
                            </td>
                            <td class="p-3 text-sm text-gray-600">${state.accounts.find(a => a.id === tx.accountId)?.name || 'N/A'}</td>
                            <td class="p-3 text-sm text-gray-600">${tx.category}${tx.subCategory ? ` / <span class="italic">${tx.subCategory}</span>` : ''}</td>
                            <td class="p-3 text-right font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}">${tx.type === 'income' ? '+' : '-'} ${formatCurrency(tx.amount)}</td>
                            <td class="p-3 text-center">
                                <button data-action="edit-transaction" data-id="${tx.id}" class="text-indigo-600 hover:text-indigo-800 p-1" title="Modifier"><i data-lucide="pencil" class="w-4 h-4"></i></button>
                                <button data-action="delete-transaction" data-id="${tx.id}" class="text-red-600 hover:text-red-800 p-1" title="Supprimer"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                            </td>
                        </tr>${childrenHtml}`;
                }).join('');

                if (sortedTransactions.length === 0) {
                    tableBody = `<tr><td colspan="6" class="text-center p-6 text-gray-500">Aucune transaction.</td></tr>`;
                }

                return `
                    <div class="mb-6 bg-white p-4 rounded-lg shadow">
                        <h3 class="font-semibold mb-3">Filtres Avancés</h3>
                        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div><label class="text-sm">Compte</label><select id="filter-account" class="w-full p-2 border rounded-md text-sm"><option value="">Tous</option>${state.accounts.map(a => `<option value="${a.id}" ${state.transactionFilters.accountId === a.id ? 'selected' : ''}>${a.name}</option>`).join('')}</select></div>
                            <div><label class="text-sm">Catégorie</label><select id="filter-category" class="w-full p-2 border rounded-md text-sm"><option value="">Toutes</option>${[...Object.keys(state.categories.expense || {}), ...Object.keys(state.categories.income || {})].sort().map(c => `<option value="${c}" ${state.transactionFilters.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
                            <div><label class="text-sm">Tags</label><input type="text" id="filter-tags" placeholder="ex: vacances, facture" class="w-full p-2 border rounded-md text-sm" value="${state.transactionFilters.tags}"></div>
                            <div><label class="text-sm">Date de début</label><input type="date" id="filter-start-date" class="w-full p-2 border rounded-md text-sm" value="${state.transactionFilters.startDate}"></div>
                            <div><label class="text-sm">Date de fin</label><input type="date" id="filter-end-date" class="w-full p-2 border rounded-md text-sm" value="${state.transactionFilters.endDate}"></div>
                        </div>
                        <div class="mt-4 flex justify-end gap-2">
                            <button data-action="clear-tx-filters" class="bg-gray-200 py-2 px-4 rounded-lg">Réinitialiser</button>
                            <button data-action="apply-tx-filters" class="bg-indigo-600 text-white py-2 px-4 rounded-lg">Appliquer</button>
                        </div>
                    </div>
                    <div class="mb-6 flex justify-end gap-4">
                        <!-- Bouton OCR dans Transactions -->
                        <button data-action="show-ocr-modal" class="bg-amber-500 text-white py-2 px-4 rounded-lg hover:bg-amber-600 flex items-center space-x-2" ${addButtonsDisabled} ${addButtonsTooltip}>
                            <i data-lucide="scan"></i><span>Scanner Relevé Bancaire</span>
                        </button>
                        <button data-action="export-csv" class="bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-800 flex items-center space-x-2" ${addButtonsDisabled} ${addButtonsTooltip}>
                            <i data-lucide="download"></i><span>Exporter (CSV)</span>
                        </button>
                        <button data-action="add-transaction" data-type="income" class="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center space-x-2" ${addButtonsDisabled} ${addButtonsTooltip}>
                            <i data-lucide="plus"></i><span>Ajouter un Revenu</span>
                        </button>
                        <button data-action="add-transaction" data-type="expense" class="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 flex items-center space-x-2" ${addButtonsDisabled} ${addButtonsTooltip}>
                            <i data-lucide="minus"></i><span>Ajouter une Dépense</span>
                        </button>
                    </div>
                    <div class="bg-white rounded-lg shadow">
                        <div class="overflow-x-auto">
                            <table class="w-full text-left">
                                <thead>
                                    <tr class="border-b">
                                        <th class="p-3 font-semibold">Date</th>
                                        <th class="p-3 font-semibold">Description</th>
                                        <th class="p-3 font-semibold">Compte</th>
                                        <th class="p-3 font-semibold">Catégorie</th>
                                        <th class="p-3 font-semibold text-right">Montant</th>
                                        <th class="p-3 font-semibold text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>${tableBody}</tbody>
                            </table>
                        </div>
                    </div>`;
            };

            const renderPlanner = () => {
                const tasks = state.tasks || [];
                const inboxTasks = tasks.filter(t => t.quadrant === 'inbox');
                const doTasks = tasks.filter(t => t.quadrant === 'do');
                const decideTasks = tasks.filter(t => t.quadrant === 'decide');
                const delegateTasks = tasks.filter(t => t.quadrant === 'delegate');
                const deleteTasks = tasks.filter(t => t.quadrant === 'delete');

                const renderTaskList = (tasks) => tasks.map(task => `
                    <div class="flex items-center justify-between p-2 bg-white rounded shadow-sm border cursor-grab" draggable="true" data-action="drag-task" data-task-id="${task.id}">
                        <div class="flex items-center">
                            <input type="checkbox" data-action="toggle-task-done" data-id="${task.id}" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2" ${task.done ? 'checked' : ''}>
                            <span class="${task.done ? 'line-through text-gray-500' : ''}">${task.description}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <button data-action="edit-task" data-id="${task.id}" class="text-gray-400 hover:text-blue-600 p-1" title="Modifier"><i data-lucide="pencil" class="w-4 h-4"></i></button>
                            <button data-action="delete-task" data-id="${task.id}" class="text-red-500 hover:text-red-700 p-1" title="Supprimer"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                        </div>
                    </div>
                `).join('') || '<p class="text-xs text-gray-400 text-center py-2">Vide</p>';

                const wishlistHtml = state.wishlist.map(item => `
                    <div class="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border">
                        <div>
                            <p class="font-medium">${item.name}</p>
                            <div class="flex items-center gap-4 text-xs text-gray-500">
                                <span>${formatCurrency(item.price)}</span>
                                ${item.url ? `<a href="${item.url}" target="_blank" class="text-indigo-600 hover:underline flex items-center"><i data-lucide="external-link" class="w-3 h-3 mr-1"></i>Voir</a>` : ''}
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <button data-action="edit-wishlist-item" data-id="${item.id}" class="text-blue-600 hover:text-blue-800 p-1" title="Modifier"><i data-lucide="pencil" class="w-4 h-4"></i></button>
                            <button data-action="delete-wishlist-item" data-id="${item.id}" class="text-red-600 hover:text-red-800 p-1" title="Supprimer"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                        </div>
                    </div>
                `).join('');

                return `
                    <div class="flex flex-col h-full overflow-y-auto pr-4">
                        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6" style="min-height: calc(100vh - 120px);">
                            <!-- Colonne Gauche: Boîte de réception + Wishlist -->
                            <div class="lg:col-span-1 bg-gray-50 p-4 rounded-lg flex flex-col gap-6 overflow-y-auto">
                                <!-- Boîte de réception -->
                                <div>
                                    <h3 class="text-lg font-semibold mb-2 flex items-center">
                                        <i data-lucide="inbox" class="mr-2"></i> Boîte de réception
                                    </h3>
                                    <form id="planner-add-task-form" class="flex gap-2 mb-3">
                                        <input type="text" name="description" placeholder="Nouvelle tâche..." required class="flex-grow p-2 border rounded-md text-sm">
                                        <button type="submit" class="bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700">
                                            <i data-lucide="plus"></i>
                                        </button>
                                    </form>
                                    <div id="inbox-list" class="space-y-2 p-1 min-h-[150px]" data-quadrant="inbox">
                                        ${renderTaskList(inboxTasks)}
                                    </div>
                                </div>
                                <!-- Wishlist -->
                                <div class="border-t pt-4">
                                    <div class="flex justify-between items-center mb-2">
                                        <h3 class="text-lg font-semibold flex items-center">
                                            <i data-lucide="gift" class="mr-2"></i> Wishlist
                                        </h3>
                                        <button data-action="add-wishlist-item" class="bg-gray-200 text-gray-700 py-1 px-3 rounded-lg text-sm hover:bg-gray-300 flex items-center">
                                            <i data-lucide="plus" class="w-3 h-3 mr-1"></i> Ajouter
                                        </button>
                                    </div>
                                    <div class="space-y-3">
                                        ${wishlistHtml || '<p class="text-center text-gray-500 p-4">Aucun article dans votre wishlist.</p>'}
                                    </div>
                                </div>
                            </div>
                            <!-- Matrice d'Eisenhower (3 colonnes) -->
                            <div class="lg:col-span-3">
                                <h3 class="text-xl font-semibold mb-4 text-center">Matrice d'Eisenhower</h3>
                                <div class="grid grid-cols-2 grid-rows-2 gap-4 h-[calc(100%-2.5rem)]">
                                    <!-- Faire (Urgent & Important) -->
                                    <div class="quadrant bg-red-50/50 border-2 border-dashed border-red-200 rounded-lg p-4 flex flex-col" data-quadrant="do">
                                        <div class="flex justify-between items-center mb-2">
                                            <h4 class="font-bold text-red-800 flex items-center">
                                                <i data-lucide="alert-triangle" class="mr-1"></i> 🔴 Faire
                                            </h4>
                                            <span class="text-xs text-red-600">Urgent & Important</span>
                                        </div>
                                        <div class="space-y-2 flex-grow overflow-y-auto p-1">
                                            ${renderTaskList(doTasks)}
                                        </div>
                                    </div>
                                    <!-- Planifier (Non Urgent & Important) -->
                                    <div class="quadrant bg-blue-50/50 border-2 border-dashed border-blue-200 rounded-lg p-4 flex flex-col" data-quadrant="decide">
                                        <div class="flex justify-between items-center mb-2">
                                            <h4 class="font-bold text-blue-800 flex items-center">
                                                <i data-lucide="calendar" class="mr-1"></i> 🔵 Planifier
                                            </h4>
                                            <span class="text-xs text-blue-600">Non Urgent & Important</span>
                                        </div>
                                        <div class="space-y-2 flex-grow overflow-y-auto p-1">
                                            ${renderTaskList(decideTasks)}
                                        </div>
                                    </div>
                                    <!-- Déléguer (Urgent & Non Important) -->
                                    <div class="quadrant bg-yellow-50/50 border-2 border-dashed border-yellow-300 rounded-lg p-4 flex flex-col" data-quadrant="delegate">
                                        <div class="flex justify-between items-center mb-2">
                                            <h4 class="font-bold text-yellow-800 flex items-center">
                                                <i data-lucide="users" class="mr-1"></i> 🟡 Déléguer
                                            </h4>
                                            <span class="text-xs text-yellow-600">Urgent & Non Important</span>
                                        </div>
                                        <div class="space-y-2 flex-grow overflow-y-auto p-1">
                                            ${renderTaskList(delegateTasks)}
                                        </div>
                                    </div>
                                    <!-- Abandonner (Non Urgent & Non Important) -->
                                    <div class="quadrant bg-green-50/50 border-2 border-dashed border-green-200 rounded-lg p-4 flex flex-col" data-quadrant="delete">
                                        <div class="flex justify-between items-center mb-2">
                                            <h4 class="font-bold text-green-800 flex items-center">
                                                <i data-lucide="trash" class="mr-1"></i> 🟢 Abandonner
                                            </h4>
                                            <span class="text-xs text-green-600">Non Urgent & Non Important</span>
                                        </div>
                                        <div class="space-y-2 flex-grow overflow-y-auto p-1">
                                            ${renderTaskList(deleteTasks)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>`;
            };


            const renderInvestments = () => {
                const hasCrypto = state.investments.some(inv => inv.type === 'Crypto' && inv.ticker?.trim());

                // Calculs par catégorie d'investissement
                const categoryStats = (state.investments || []).reduce((acc, inv) => {
                    const details = calculateInvestmentDetails(inv.id);
                    const currentValue = inv.currentValue * details.currentQuantity;
                    
                    if (!acc[inv.type]) {
                        acc[inv.type] = {
                            invested: 0,
                            currentValue: 0,
                            realizedGains: 0,
                            dividends: 0,
                            count: 0
                        };
                    }
                    
                    acc[inv.type].invested += details.totalCost;
                    acc[inv.type].currentValue += currentValue;
                    acc[inv.type].realizedGains += details.totalSalesValue;
                    acc[inv.type].dividends += details.totalDividends;
                    acc[inv.type].count += 1;
                    
                    return acc;
                }, {});

                // Calculs globaux
                const totalInvested = Object.values(categoryStats).reduce((sum, cat) => sum + cat.invested, 0);
                const totalCurrentValue = Object.values(categoryStats).reduce((sum, cat) => sum + cat.currentValue, 0);
                const totalRealizedGains = Object.values(categoryStats).reduce((sum, cat) => sum + cat.realizedGains + cat.dividends, 0);
                const totalUnrealizedGains = totalCurrentValue - totalInvested;
                const totalGains = totalRealizedGains + totalUnrealizedGains;
                const totalROI = totalInvested > 0 ? (totalGains / totalInvested) * 100 : 0;

                return `
                    <!-- Tableau de bord des investissements -->
                    <div class="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div class="bg-white p-4 rounded-lg shadow">
                            <div class="text-sm text-gray-500 mb-1">Montant Total Investi</div>
                            <div class="font-bold text-xl text-blue-600">${formatCurrency(totalInvested)}</div>
                        </div>
                        <div class="bg-white p-4 rounded-lg shadow">
                            <div class="text-sm text-gray-500 mb-1">Valeur Actuelle</div>
                            <div class="font-bold text-xl text-indigo-600">${formatCurrency(totalCurrentValue)}</div>
                        </div>
                        <div class="bg-white p-4 rounded-lg shadow">
                            <div class="text-sm text-gray-500 mb-1">Gains Totaux</div>
                            <div class="font-bold text-xl ${totalGains >= 0 ? 'text-green-600' : 'text-red-600'}">${formatCurrency(totalGains)}</div>
                            <div class="text-xs text-gray-400">Réalisés: ${formatCurrency(totalRealizedGains)} | Non-réalisés: ${formatCurrency(totalUnrealizedGains)}</div>
                        </div>
                        <div class="bg-white p-4 rounded-lg shadow">
                            <div class="text-sm text-gray-500 mb-1">ROI Global</div>
                            <div class="font-bold text-xl ${totalROI >= 0 ? 'text-green-600' : 'text-red-600'}">${totalROI.toFixed(2)}%</div>
                        </div>
                    </div>

                    <!-- Détail par catégorie d'investissement -->
                    <div class="mb-6 bg-white p-6 rounded-lg shadow">
                        <h3 class="text-lg font-semibold mb-4">Analyse par Catégorie</h3>
                        <div class="space-y-4">
                            ${Object.entries(categoryStats).map(([type, stats]) => {
                                const unrealizedGain = stats.currentValue - stats.invested;
                                const totalGainForType = stats.realizedGains + stats.dividends + unrealizedGain;
                                const roiForType = stats.invested > 0 ? (totalGainForType / stats.invested) * 100 : 0;
                                const percentage = totalCurrentValue > 0 ? (stats.currentValue / totalCurrentValue * 100) : 0;
                                
                                // Logique spéciale pour le matériel et les rigs
                                const isEquipment = ['Matériel Actif', 'Matériel Passif', 'Rig Physique', 'Rig Virtuel'].includes(type);
                                const amortizedValue = isEquipment ? Math.max(0, stats.invested - stats.dividends) : stats.invested;
                                const equipmentROI = isEquipment && stats.invested > 0 ? (stats.dividends / stats.invested) * 100 : 0;
                                
                                return `
                                    <div class="border rounded-lg p-4 bg-gray-50">
                                        <div class="flex justify-between items-start mb-3">
                                            <div>
                                                <h4 class="font-semibold text-lg">${type}</h4>
                                                <p class="text-sm text-gray-500">${stats.count} investissement${stats.count > 1 ? 's' : ''} • ${percentage.toFixed(1)}% du portefeuille</p>
                                            </div>
                                            <div class="text-right">
                                                <div class="font-bold text-xl">${formatCurrency(stats.currentValue)}</div>
                                                <div class="text-sm ${totalGainForType >= 0 ? 'text-green-600' : 'text-red-600'}">${formatCurrency(totalGainForType)} (${roiForType.toFixed(1)}%)</div>
                                            </div>
                                        </div>
                                        
                                        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                            <div>
                                                <div class="text-gray-500">Investi</div>
                                                <div class="font-medium">${formatCurrency(stats.invested)}</div>
                                            </div>
                                            ${isEquipment ? `
                                            <div>
                                                <div class="text-gray-500">Revenus Générés</div>
                                                <div class="font-medium text-green-600">${formatCurrency(stats.dividends)}</div>
                                            </div>
                                            <div>
                                                <div class="text-gray-500">Reste à Amortir</div>
                                                <div class="font-medium ${amortizedValue <= 0 ? 'text-green-600' : 'text-orange-600'}">${formatCurrency(amortizedValue)}</div>
                                            </div>
                                            <div>
                                                <div class="text-gray-500">Amortissement</div>
                                                <div class="font-medium ${equipmentROI >= 100 ? 'text-green-600' : 'text-blue-600'}">${equipmentROI.toFixed(1)}%</div>
                                            </div>` : `
                                            <div>
                                                <div class="text-gray-500">Ventes</div>
                                                <div class="font-medium">${formatCurrency(stats.realizedGains)}</div>
                                            </div>
                                            <div>
                                                <div class="text-gray-500">Dividendes</div>
                                                <div class="font-medium text-green-600">${formatCurrency(stats.dividends)}</div>
                                            </div>
                                            <div>
                                                <div class="text-gray-500">Plus-value Latente</div>
                                                <div class="font-medium ${unrealizedGain >= 0 ? 'text-green-600' : 'text-red-600'}">${formatCurrency(unrealizedGain)}</div>
                                            </div>`}
                                        </div>
                                        
                                        ${isEquipment && amortizedValue <= 0 ? `
                                        <div class="mt-2 p-2 bg-green-100 rounded text-sm text-green-800">
                                            ✅ Investissement entièrement amorti par les revenus !
                                        </div>` : ''}
                                    </div>
                                `;
                            }).join('') || '<div class="text-center text-gray-500">Aucun investissement</div>'}
                        </div>
                    </div>

                    <div class="mb-6 flex justify-between items-center">
                        <h3 class="text-lg font-semibold">Détail des Investissements</h3>
                        <div class="flex gap-4">
                            ${hasCrypto ? `
                                <button data-action="fetch-crypto-prices" class="bg-amber-500 text-white py-2 px-4 rounded-lg hover:bg-amber-600 flex items-center space-x-2">
                                    <i data-lucide="refresh-cw"></i><span>Mettre à jour les Cryptos</span>
                                </button>` : ''}
                            <button data-action="add-investment" class="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 flex items-center space-x-2">
                                <i data-lucide="plus"></i><span>Ajouter</span>
                            </button>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${(state.investments || []).map(inv => {
                            const details = calculateInvestmentDetails(inv.id);
                            const currentValue = Number(inv.currentValue) || 0;
                            const currentValueTotal = currentValue * details.currentQuantity;
                            const gainLoss = currentValueTotal + details.totalSalesValue + details.totalDividends - details.totalCost;
                            const roi = details.totalCost > 0 ? (gainLoss / details.totalCost) * 100 : 0;
                            const performanceColor = gainLoss >= 0 ? 'text-green-600' : 'text-red-600';

                            return `
                                <div class="bg-white p-6 rounded-lg shadow">
                                    <div class="flex justify-between items-start">
                                        <div>
                                            <h3 class="font-semibold text-lg">${inv.name} <span class="text-sm text-gray-500 font-normal">(${inv.type})</span></h3>
                                            ${inv.type === 'Crypto' && inv.ticker ? `<p class="text-xs text-gray-400">ID: ${inv.ticker}</p>` : ''}
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <button data-action="rename-investment" data-id="${inv.id}" class="text-green-500 hover:text-green-600" title="Renommer">
                                                <i data-lucide="edit" class="w-5 h-5"></i>
                                            </button>
                                            <button data-action="edit-investment-category" data-id="${inv.id}" class="text-blue-500 hover:text-blue-600" title="Modifier la catégorie">
                                                <i data-lucide="tag" class="w-5 h-5"></i>
                                            </button>
                                            <button data-action="edit-investment-value" data-id="${inv.id}" class="text-gray-500 hover:text-indigo-600" title="Modifier la valeur">
                                                <i data-lucide="edit-3" class="w-5 h-5"></i>
                                            </button>
                                            <button data-action="delete-investment" data-id="${inv.id}" class="text-red-600 hover:text-red-800" title="Supprimer">
                                                <i data-lucide="trash-2" class="w-5 h-5"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <p class="text-2xl font-bold mt-2">${formatCurrency(currentValueTotal, inv.currency || state.baseCurrency)}</p>
                                    <p class="text-sm text-gray-500">${details.currentQuantity.toLocaleString('fr-FR')} unités @ ${formatCurrency(inv.currentValue, inv.currency || state.baseCurrency)} / unité</p>
                                    <div class="mt-4 border-t pt-4 space-y-2 text-sm">
                                        <div class="flex justify-between">
                                            <span class="text-gray-500">Coût Total d'Achat</span>
                                            <span class="font-medium">${formatCurrency(details.totalCost)}</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-gray-500">PRU (Prix Revient Unitaire)</span>
                                            <p class="font-semibold">${formatCurrency(details.pru, inv.currency)}</p>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-gray-500">Quantité Totale Achetée</span>
                                            <span class="font-medium">${details.totalBoughtQuantity.toLocaleString('fr-FR')}</span>
                                        </div>
                                        ${details.totalSalesValue > 0 ? `
                                        <div class="flex justify-between">
                                            <span class="text-gray-500">Ventes Réalisées</span>
                                            <span class="font-medium">${formatCurrency(details.totalSalesValue)}</span>
                                        </div>` : ''}
                                        ${details.totalDividends > 0 ? `
                                        <div class="flex justify-between">
                                            <span class="text-gray-500">${['Matériel Actif', 'Matériel Passif', 'Rig Physique', 'Rig Virtuel'].includes(inv.type) ? 'Revenus Générés' : 'Dividendes Reçus'}</span>
                                            <span class="font-medium text-green-600">${formatCurrency(details.totalDividends)}</span>
                                        </div>` : ''}
                                        ${['Matériel Actif', 'Matériel Passif', 'Rig Physique', 'Rig Virtuel'].includes(inv.type) && details.totalDividends > 0 ? `
                                        <div class="flex justify-between">
                                            <span class="text-gray-500">Reste à Amortir</span>
                                            <span class="font-medium ${Math.max(0, details.totalCost - details.totalDividends) <= 0 ? 'text-green-600' : 'text-orange-600'}">${formatCurrency(Math.max(0, details.totalCost - details.totalDividends))}</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-gray-500">Amortissement</span>
                                            <span class="font-medium ${(details.totalDividends / details.totalCost * 100) >= 100 ? 'text-green-600' : 'text-blue-600'}">${(details.totalDividends / details.totalCost * 100).toFixed(1)}%</span>
                                        </div>` : ''}
                                        <div class="flex justify-between border-t pt-2">
                                            <span class="text-gray-500">Plus/Moins-value Non-réalisée</span>
                                            <span class="font-bold ${currentValueTotal - details.totalCost >= 0 ? 'text-green-600' : 'text-red-600'}">${formatCurrency(currentValueTotal - details.totalCost)}</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-gray-500">Plus/Moins-value Totale</span>
                                            <span class="font-bold ${performanceColor}">${formatCurrency(gainLoss)}</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-gray-500">ROI Global</span>
                                            <span class="font-bold ${performanceColor}">${roi.toFixed(2)}%</span>
                                        </div>
                                    </div>
                                    <div class="mt-4 flex gap-3">
                                        <button data-action="add-investment-entry" data-id="${inv.id}" class="bg-green-600 text-white py-1 px-3 rounded text-sm font-semibold flex items-center hover:bg-green-700">
                                            <i data-lucide="plus" class="w-3 h-3 mr-1"></i> Ajouter opération
                                        </button>
                                        <button data-action="show-investment-history" data-id="${inv.id}" class="text-indigo-600 hover:text-indigo-800 text-sm font-semibold flex items-center">
                                            <i data-lucide="clock" class="w-3 h-3 mr-1"></i> Voir l'historique
                                        </button>
                                    </div>
                                </div>`;
                        }).join('') || '<p class="text-center text-gray-500 col-span-full py-8">Aucun investissement ajouté.</p>'}
                    </div>`;
            };

            const renderDebts = () => {
                const activeDebts = (state.debts || []).filter(debt => !debt.archived);
                const archivedDebts = (state.debts || []).filter(debt => debt.archived);
                
                return `
                <div class="mb-6 flex justify-between items-center">
                    <div class="flex space-x-4">
                        <div class="bg-white p-4 rounded-lg shadow">
                            Total Dettes Actives: <span class="font-bold text-xl text-red-600">${formatCurrency(calculateTotalDebts())}</span>
                        </div>
                        ${archivedDebts.length > 0 ? `
                            <div class="bg-gray-50 p-4 rounded-lg shadow">
                                Dettes Archivées: <span class="font-bold text-xl text-gray-600">${archivedDebts.length}</span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="flex space-x-2">
                        <button data-action="toggle-archived-debts" class="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 flex items-center space-x-2">
                            <i data-lucide="archive"></i><span>Voir Archivées</span>
                        </button>
                        <button data-action="add-debt" class="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 flex items-center space-x-2">
                            <i data-lucide="plus"></i><span>Ajouter</span>
                        </button>
                    </div>
                </div>
                
                <!-- Dettes Actives -->
                <div class="mb-8">
                    <h3 class="text-lg font-semibold mb-4">Dettes Actives</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${activeDebts.map(debt => `
                            <div class="bg-white p-6 rounded-lg shadow ${isDebtFullyPaid(debt) ? 'border-l-4 border-green-500' : ''}">
                                <div class="flex justify-between items-start mb-2">
                                    <h4 class="font-semibold text-lg">${debt.name}</h4>
                                    ${isDebtFullyPaid(debt) ? `
                                        <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Remboursée</span>
                                    ` : ''}
                                </div>
                                <p class="text-2xl font-bold ${isDebtFullyPaid(debt) ? 'text-green-600' : ''}">${formatCurrency(calculateDebtOutstanding(debt))}</p>
                                <p class="text-sm text-gray-500">Taux: ${debt.interestRate}%</p>
                                <div class="mt-4 flex justify-between items-center">
                                    <div class="flex flex-wrap gap-2">
                                        <button data-action="view-debt-history" data-id="${debt.id}" class="text-indigo-600 hover:text-indigo-800 text-sm flex items-center">
                                            <i data-lucide="clock" class="w-3 h-3 mr-1"></i> Historique
                                        </button>
                                        ${debt.interestRate > 0 ? `
                                            <button data-action="view-amortization" data-id="${debt.id}" class="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                                                <i data-lucide="bar-chart" class="w-3 h-3 mr-1"></i> Amortissement
                                            </button>` : ''}
                                        ${isDebtFullyPaid(debt) ? `
                                            <button data-action="archive-debt" data-id="${debt.id}" class="text-green-600 hover:text-green-800 text-sm flex items-center">
                                                <i data-lucide="archive" class="w-3 h-3 mr-1"></i> Archiver
                                            </button>
                                        ` : ''}
                                    </div>
                                    <button data-action="delete-debt" data-id="${debt.id}" class="text-red-600 hover:text-red-800" title="Supprimer">
                                        <i data-lucide="trash-2" class="w-5 h-5"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('') || '<p class="text-center text-gray-500 col-span-full py-8">Aucune dette active.</p>'}
                    </div>
                </div>
                
                <!-- Dettes Archivées -->
                <div id="archived-debts" class="hidden">
                    <h3 class="text-lg font-semibold mb-4 text-gray-600">Dettes Archivées</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${archivedDebts.map(debt => `
                            <div class="bg-gray-50 p-6 rounded-lg shadow border-l-4 border-gray-400">
                                <div class="flex justify-between items-start mb-2">
                                    <h4 class="font-semibold text-lg text-gray-700">${debt.name}</h4>
                                    <span class="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">Archivée</span>
                                </div>
                                <p class="text-xl font-bold text-gray-600">${formatCurrency(calculateDebtOutstanding(debt))}</p>
                                <p class="text-sm text-gray-500">Archivée le: ${debt.archivedDate || 'Date inconnue'}</p>
                                <div class="mt-4 flex justify-between items-center">
                                    <div class="flex gap-2">
                                        <button data-action="view-debt-history" data-id="${debt.id}" class="text-indigo-600 hover:text-indigo-800 text-sm flex items-center">
                                            <i data-lucide="clock" class="w-3 h-3 mr-1"></i> Historique
                                        </button>
                                        <button data-action="unarchive-debt" data-id="${debt.id}" class="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                                            <i data-lucide="archive-restore" class="w-3 h-3 mr-1"></i> Désarchiver
                                        </button>
                                    </div>
                                    <button data-action="delete-debt" data-id="${debt.id}" class="text-red-600 hover:text-red-800" title="Supprimer définitivement">
                                        <i data-lucide="trash-2" class="w-5 h-5"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('') || '<p class="text-center text-gray-500 col-span-full py-8">Aucune dette archivée.</p>'}
                    </div>
                </div>`;
            };

            const renderClaims = () => {
                const activeClaims = (state.claims || []).filter(claim => !claim.archived);
                const archivedClaims = (state.claims || []).filter(claim => claim.archived);
                
                return `
                <div class="mb-6 flex justify-between items-center">
                    <div class="flex space-x-4">
                        <div class="bg-white p-4 rounded-lg shadow">
                            Total Créances Actives: <span class="font-bold text-xl text-green-600">${formatCurrency(calculateTotalClaims())}</span>
                        </div>
                        ${archivedClaims.length > 0 ? `
                            <div class="bg-gray-50 p-4 rounded-lg shadow">
                                Créances Archivées: <span class="font-bold text-xl text-gray-600">${archivedClaims.length}</span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="flex space-x-2">
                        <button data-action="toggle-archived-claims" class="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 flex items-center space-x-2">
                            <i data-lucide="archive"></i><span>Voir Archivées</span>
                        </button>
                        <button data-action="add-claim" class="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 flex items-center space-x-2">
                            <i data-lucide="plus"></i><span>Ajouter</span>
                        </button>
                    </div>
                </div>
                
                <!-- Créances Actives -->
                <div class="mb-8">
                    <h3 class="text-lg font-semibold mb-4">Créances Actives</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${activeClaims.map(claim => `
                            <div class="bg-white p-6 rounded-lg shadow ${isClaimFullyPaid(claim) ? 'border-l-4 border-green-500' : ''}">
                                <div class="flex justify-between items-start mb-2">
                                    <h4 class="font-semibold text-lg">${claim.name}</h4>
                                    ${isClaimFullyPaid(claim) ? `
                                        <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Remboursée</span>
                                    ` : ''}
                                </div>
                                <p class="text-2xl font-bold ${isClaimFullyPaid(claim) ? 'text-green-600' : ''}">${formatCurrency(calculateClaimOutstanding(claim))}</p>
                                <div class="mt-4 flex justify-between items-center">
                                    <div class="flex flex-wrap gap-2">
                                        <button data-action="view-claim-history" data-id="${claim.id}" class="text-indigo-600 hover:text-indigo-800 text-sm flex items-center">
                                            <i data-lucide="clock" class="w-3 h-3 mr-1"></i> Historique
                                        </button>
                                        ${isClaimFullyPaid(claim) ? `
                                            <button data-action="archive-claim" data-id="${claim.id}" class="text-green-600 hover:text-green-800 text-sm flex items-center">
                                                <i data-lucide="archive" class="w-3 h-3 mr-1"></i> Archiver
                                            </button>
                                        ` : ''}
                                    </div>
                                    <button data-action="delete-claim" data-id="${claim.id}" class="text-red-600 hover:text-red-800" title="Supprimer">
                                        <i data-lucide="trash-2" class="w-5 h-5"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('') || '<p class="text-center text-gray-500 col-span-full py-8">Aucune créance active.</p>'}
                    </div>
                </div>
                
                <!-- Créances Archivées -->
                <div id="archived-claims" class="hidden">
                    <h3 class="text-lg font-semibold mb-4 text-gray-600">Créances Archivées</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${archivedClaims.map(claim => `
                            <div class="bg-gray-50 p-6 rounded-lg shadow border-l-4 border-gray-400">
                                <div class="flex justify-between items-start mb-2">
                                    <h4 class="font-semibold text-lg text-gray-700">${claim.name}</h4>
                                    <span class="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">Archivée</span>
                                </div>
                                <p class="text-xl font-bold text-gray-600">${formatCurrency(calculateClaimOutstanding(claim))}</p>
                                <p class="text-sm text-gray-500">Archivée le: ${claim.archivedDate || 'Date inconnue'}</p>
                                <div class="mt-4 flex justify-between items-center">
                                    <div class="flex gap-2">
                                        <button data-action="view-claim-history" data-id="${claim.id}" class="text-indigo-600 hover:text-indigo-800 text-sm flex items-center">
                                            <i data-lucide="clock" class="w-3 h-3 mr-1"></i> Historique
                                        </button>
                                        <button data-action="unarchive-claim" data-id="${claim.id}" class="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                                            <i data-lucide="archive-restore" class="w-3 h-3 mr-1"></i> Désarchiver
                                        </button>
                                    </div>
                                    <button data-action="delete-claim" data-id="${claim.id}" class="text-red-600 hover:text-red-800" title="Supprimer définitivement">
                                        <i data-lucide="trash-2" class="w-5 h-5"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('') || '<p class="text-center text-gray-500 col-span-full py-8">Aucune créance archivée.</p>'}
                    </div>
                </div>`;
            };

            const renderGoals = () => `
                <div class="mb-6 flex justify-end">
                    <button data-action="add-goal" class="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 flex items-center space-x-2">
                        <i data-lucide="plus"></i><span>Nouvel Objectif</span>
                    </button>
                </div>
                <div class="space-y-6">
                    ${(state.goals || []).map(goal => {
                        const savedAmount = calculateGoalProgress(goal.id);
                        const progress = Math.min(100, (savedAmount / goal.targetAmount) * 100);
                        let projectionHtml = '';

                        const monthlySavings = calculateAverageMonthlySavings();
                        if (monthlySavings > 0) {
                            const remaining = goal.targetAmount - savedAmount;
                            if (remaining > 0) {
                                const monthsNeeded = Math.ceil(remaining / monthlySavings);
                                const targetDate = new Date();
                                targetDate.setMonth(targetDate.getMonth() + monthsNeeded);
                                projectionHtml = `<p class="text-sm text-gray-500 mt-2">Atteinte estimée: <span class="font-semibold">${targetDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric'})}</span></p>`;
                            } else {
                                projectionHtml = `<p class="text-sm text-green-600 mt-2 font-semibold">Objectif atteint !</p>`;
                            }
                        }

                        return `
                            <div class="bg-white p-6 rounded-lg shadow">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <h3 class="font-semibold text-lg">${goal.name}</h3>
                                        <p class="text-sm text-gray-500">Cible: ${goal.targetDate || 'Non définie'}</p>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <button data-action="manage-goal" data-id="${goal.id}" class="bg-gray-200 text-gray-800 py-1 px-3 rounded-lg text-sm font-semibold hover:bg-gray-300 flex items-center">
                                            <i data-lucide="settings" class="w-3 h-3 mr-1"></i> Gérer
                                        </button>
                                        <button data-action="delete-goal" data-id="${goal.id}" class="text-red-600 hover:text-red-800" title="Supprimer">
                                            <i data-lucide="trash-2" class="w-5 h-5"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-4 mt-4">
                                    <div class="bg-green-500 h-4 rounded-full" style="width: ${progress}%"></div>
                                </div>
                                <p class="text-right mt-1 text-sm">${formatCurrency(savedAmount)} / ${formatCurrency(goal.targetAmount)} (${progress.toFixed(0)}%)</p>
                                ${projectionHtml}
                            </div>`;
                    }).join('') || '<p class="text-center text-gray-500 py-8">Aucun objectif défini.</p>'}
                </div>`;

            // ========== BUDGET FUNCTIONS ========== //
            const initializeBudgetMonth = () => {
                const now = new Date();
                const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                
                if (!state.currentBudgetMonth) {
                    state.currentBudgetMonth = currentMonth;
                }
                
                if (!state.monthlyBudgets[state.currentBudgetMonth]) {
                    state.monthlyBudgets[state.currentBudgetMonth] = {};
                }
            };

            const getBudgetData = (month) => {
                const monthData = state.monthlyBudgets[month] || {};
                const [year, monthNum] = month.split('-');
                const startDate = new Date(year, monthNum - 1, 1);
                const endDate = new Date(year, monthNum, 0);
                
                // Calculer les dépenses réelles pour ce mois
                const monthTransactions = state.transactions.filter(tx => {
                    const txDate = new Date(tx.date);
                    return tx.type === 'expense' && txDate >= startDate && txDate <= endDate;
                });
                
                const spentByCategory = monthTransactions.reduce((acc, tx) => {
                    const categoryKey = `${tx.category}-${tx.subCategory}`;
                    acc[categoryKey] = (acc[categoryKey] || 0) + tx.amount;
                    return acc;
                }, {});
                
                return { monthData, spentByCategory, monthTransactions };
            };

            const addBudgetTransaction = (categoryKey, amount, description, isPartial = false) => {
                const [category, subCategory] = categoryKey.split('-');
                const accountId = state.accounts[0]?.id; // Premier compte par défaut
                
                if (!accountId) {
                    showToast('Aucun compte disponible pour enregistrer la transaction', 'error');
                    return;
                }
                
                const transaction = {
                    id: generateId(),
                    accountId: accountId,
                    type: 'expense',
                    amount: amount,
                    originalAmount: amount,
                    originalCurrency: state.baseCurrency,
                    category: category,
                    subCategory: subCategory,
                    description: description,
                    date: new Date().toISOString().split('T')[0],
                    tags: isPartial ? ['budget-partiel'] : ['budget'],
                    linkedTo: null,
                    isRecurring: false,
                    isSplit: false,
                    parentTransactionId: null
                };
                
                state.transactions.push(transaction);
                
                // Mettre à jour le budget
                const budgetData = state.monthlyBudgets[state.currentBudgetMonth];
                if (!budgetData[categoryKey]) {
                    budgetData[categoryKey] = { planned: 0, spent: 0, transactions: [] };
                }
                budgetData[categoryKey].spent += amount;
                budgetData[categoryKey].transactions.push(transaction.id);
                
                showToast(`Transaction ajoutée: ${description} (${formatCurrency(amount)})`, 'success');
                fullUpdate();
            };

            const renderBudget = () => {
                initializeBudgetMonth();
                
                const now = new Date();
                const currentMonth = state.currentBudgetMonth;
                const { monthData, spentByCategory } = getBudgetData(currentMonth);
                
                // Générer les options de mois pour l'historique
                const monthOptions = [];
                for (let i = 6; i >= 0; i--) {
                    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    const monthName = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                    monthOptions.push({ key: monthKey, name: monthName });
                }
                
                // Calculer les totaux
                let totalPlanned = 0;
                let totalSpent = 0;
                
                const categoryRows = Object.keys(state.categories.expense).flatMap(category => {
                    return state.categories.expense[category].map(subCategory => {
                        const categoryKey = `${category}-${subCategory}`;
                        const planned = monthData[categoryKey]?.planned || 0;
                        const spent = spentByCategory[categoryKey] || 0;
                        const remaining = planned - spent;
                        const progress = planned > 0 ? Math.min(100, (spent / planned) * 100) : 0;
                        
                        totalPlanned += planned;
                        totalSpent += spent;
                        
                        let statusColor = 'text-gray-500';
                        let bgColor = 'bg-gray-100';
                        
                        if (planned > 0) {
                            if (remaining > 0) {
                                statusColor = 'text-green-600';
                                bgColor = 'bg-green-50';
                            } else {
                                statusColor = 'text-red-600';
                                bgColor = 'bg-red-50';
                            }
                        }
                        
                        return {
                            category,
                            subCategory,
                            categoryKey,
                            planned,
                            spent,
                            remaining,
                            progress,
                            statusColor,
                            bgColor
                        };
                    });
                }).filter(row => row.planned > 0 || row.spent > 0);
                
                const totalRemaining = totalPlanned - totalSpent;
                const overallProgress = totalPlanned > 0 ? (totalSpent / totalPlanned) * 100 : 0;
                
                return `
                    <div class="space-y-6">
                        <!-- En-tête avec sélecteur de mois -->
                        <div class="bg-white p-6 rounded-lg shadow">
                            <div class="flex justify-between items-center mb-4">
                                <h2 class="text-xl font-semibold">Budget - ${monthOptions.find(m => m.key === currentMonth)?.name || 'Mois actuel'}</h2>
                                <div class="flex gap-4 items-center">
                                    <select id="budget-month-selector" class="border rounded-lg px-3 py-2">
                                        ${monthOptions.map(option => 
                                            `<option value="${option.key}" ${option.key === currentMonth ? 'selected' : ''}>${option.name}</option>`
                                        ).join('')}
                                    </select>
                                    <button data-action="add-budget-category" class="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                                        <i data-lucide="plus"></i> Ajouter Catégorie
                                    </button>
                                    ${currentMonth === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}` ? `
                                        <button data-action="prepare-next-month" class="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center gap-2">
                                            <i data-lucide="calendar-plus"></i> Préparer le mois suivant
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                            
                            <!-- Résumé global -->
                            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div class="bg-blue-50 p-4 rounded-lg">
                                    <div class="text-sm text-blue-600 font-medium">Budget Planifié</div>
                                    <div class="text-2xl font-bold text-blue-800">${formatCurrency(totalPlanned)}</div>
                                </div>
                                <div class="bg-orange-50 p-4 rounded-lg">
                                    <div class="text-sm text-orange-600 font-medium">Dépensé</div>
                                    <div class="text-2xl font-bold text-orange-800">${formatCurrency(totalSpent)}</div>
                                </div>
                                <div class="${totalRemaining >= 0 ? 'bg-green-50' : 'bg-red-50'} p-4 rounded-lg">
                                    <div class="text-sm ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'} font-medium">Restant</div>
                                    <div class="text-2xl font-bold ${totalRemaining >= 0 ? 'text-green-800' : 'text-red-800'}">${formatCurrency(totalRemaining)}</div>
                                </div>
                                <div class="bg-purple-50 p-4 rounded-lg">
                                    <div class="text-sm text-purple-600 font-medium">Progression</div>
                                    <div class="text-2xl font-bold text-purple-800">${overallProgress.toFixed(1)}%</div>
                                </div>
                            </div>
                            
                            <!-- Barre de progression globale -->
                            <div class="mb-4">
                                <div class="flex justify-between text-sm mb-1">
                                    <span>Progression globale</span>
                                    <span>${overallProgress.toFixed(1)}%</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-3">
                                    <div class="h-3 rounded-full ${overallProgress > 100 ? 'bg-red-500' : overallProgress > 80 ? 'bg-orange-500' : 'bg-green-500'}" 
                                         style="width: ${Math.min(100, overallProgress)}%"></div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Tableau des catégories -->
                        <div class="bg-white rounded-lg shadow overflow-hidden">
                            <div class="overflow-x-auto">
                                <table class="w-full">
                                    <thead class="bg-gray-50">
                                        <tr>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Planifié</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dépensé</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Restant</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progression</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-200">
                                        ${categoryRows.map(row => `
                                            <tr class="${row.bgColor}">
                                                <td class="px-6 py-4">
                                                    <div class="font-medium text-gray-900">${row.category}</div>
                                                    <div class="text-sm text-gray-500">${row.subCategory}</div>
                                                </td>
                                                <td class="px-6 py-4">
                                                    <input type="number" step="0.01" min="0" 
                                                           value="${row.planned}" 
                                                           data-category-key="${row.categoryKey}"
                                                           class="budget-planned-input w-24 px-2 py-1 border rounded text-sm"
                                                           placeholder="0.00">
                                                </td>
                                                <td class="px-6 py-4 font-medium ${row.statusColor}">
                                                    ${formatCurrency(row.spent)}
                                                </td>
                                                <td class="px-6 py-4 font-medium ${row.remaining >= 0 ? 'text-green-600' : 'text-red-600'}">
                                                    ${formatCurrency(row.remaining)}
                                                </td>
                                                <td class="px-6 py-4">
                                                    <div class="flex items-center">
                                                        <div class="w-full bg-gray-200 rounded-full h-2 mr-2">
                                                            <div class="h-2 rounded-full ${row.progress > 100 ? 'bg-red-500' : row.progress > 80 ? 'bg-orange-500' : 'bg-green-500'}" 
                                                                 style="width: ${Math.min(100, row.progress)}%"></div>
                                                        </div>
                                                        <span class="text-sm font-medium ${row.statusColor}">${row.progress.toFixed(0)}%</span>
                                                    </div>
                                                </td>
                                                <td class="px-6 py-4">
                                                    <div class="flex gap-2">
                                                        <button data-action="add-expense" data-category-key="${row.categoryKey}" 
                                                                class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                                                            Dépenser
                                                        </button>
                                                        <button data-action="partial-payment" data-category-key="${row.categoryKey}" 
                                                                class="text-green-600 hover:text-green-800 text-sm font-medium">
                                                            Partiel
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <!-- Historique des budgets précédents -->
                        <div class="bg-white p-6 rounded-lg shadow">
                            <h3 class="text-lg font-semibold mb-4">Historique des Budgets</h3>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                ${monthOptions.slice(1, 4).map(option => {
                                    const { monthData: historyData, spentByCategory: historySpent } = getBudgetData(option.key);
                                    const historyPlanned = Object.values(historyData).reduce((sum, cat) => sum + (cat.planned || 0), 0);
                                    const historySpentTotal = Object.values(historySpent).reduce((sum, amount) => sum + amount, 0);
                                    const historyRemaining = historyPlanned - historySpentTotal;
                                    
                                    return `
                                        <div class="border rounded-lg p-4 ${historyRemaining >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}">
                                            <h4 class="font-medium mb-2">${option.name}</h4>
                                            <div class="space-y-1 text-sm">
                                                <div class="flex justify-between">
                                                    <span>Planifié:</span>
                                                    <span class="font-medium">${formatCurrency(historyPlanned)}</span>
                                                </div>
                                                <div class="flex justify-between">
                                                    <span>Dépensé:</span>
                                                    <span class="font-medium">${formatCurrency(historySpentTotal)}</span>
                                                </div>
                                                <div class="flex justify-between border-t pt-1">
                                                    <span>Résultat:</span>
                                                    <span class="font-bold ${historyRemaining >= 0 ? 'text-green-600' : 'text-red-600'}">
                                                        ${formatCurrency(historyRemaining)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    </div>
                `;
            };

            // ========== BUDGET MODALS ========== //
            const showAddBudgetCategoryModal = () => {
                const categories = Object.keys(state.categories.expense);
                const categoryOptions = categories.map(category => {
                    const subCategories = state.categories.expense[category];
                    return `<optgroup label="${category}">
                        ${subCategories.map(sub => `<option value="${category}-${sub}">${sub}</option>`).join('')}
                    </optgroup>`;
                }).join('');

                const content = `
                    <form id="add-budget-category-form">
                        <div class="space-y-4">
                            <div>
                                <label for="budget-category-select" class="block text-sm font-medium mb-2">Sélectionner une catégorie</label>
                                <select id="budget-category-select" name="categoryKey" required class="w-full p-2 border rounded-lg">
                                    <option value="">-- Choisir une catégorie --</option>
                                    ${categoryOptions}
                                </select>
                            </div>
                            <div>
                                <label for="budget-planned-amount" class="block text-sm font-medium mb-2">Montant planifié</label>
                                <input type="number" step="0.01" min="0" id="budget-planned-amount" name="plannedAmount" required 
                                       class="w-full p-2 border rounded-lg" placeholder="0.00">
                            </div>
                        </div>
                        <div class="mt-6 flex justify-end gap-2">
                            <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg">Annuler</button>
                            <button type="submit" class="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700">Ajouter</button>
                        </div>
                    </form>`;

                openModal('Ajouter une catégorie au budget', content);
            };

            const showBudgetExpenseModal = (categoryKey, isPartial = false) => {
                const [category, subCategory] = categoryKey.split('-');
                const budgetData = state.monthlyBudgets[state.currentBudgetMonth]?.[categoryKey];
                const planned = budgetData?.planned || 0;
                const spent = budgetData?.spent || 0;
                const remaining = planned - spent;

                const title = isPartial ? 'Paiement Partiel' : 'Ajouter une Dépense';
                const maxAmount = isPartial && remaining > 0 ? remaining : null;

                const content = `
                    <form id="budget-expense-form" data-category-key="${categoryKey}" data-is-partial="${isPartial}">
                        <div class="space-y-4">
                            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                                <h4 class="font-semibold text-gray-900 text-lg">${category} - ${subCategory}</h4>
                                <div class="mt-3 space-y-2">
                                    <div class="flex justify-between items-center">
                                        <span class="text-sm text-gray-600">Budget total planifié:</span>
                                        <span class="font-bold text-blue-800 text-lg">${formatCurrency(planned)}</span>
                                    </div>
                                    <div class="flex justify-between items-center">
                                        <span class="text-sm text-gray-600">Déjà dépensé:</span>
                                        <span class="font-semibold text-orange-700">${formatCurrency(spent)}</span>
                                    </div>
                                    <div class="flex justify-between items-center border-t border-blue-200 pt-2 mt-2">
                                        <span class="text-sm font-medium text-gray-700">Montant restant:</span>
                                        <span class="font-bold text-xl ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}">${formatCurrency(remaining)}</span>
                                    </div>
                                    ${isPartial && remaining > 0 ? `
                                        <div class="bg-green-100 border border-green-300 rounded-md p-2 mt-2">
                                            <p class="text-xs text-green-800 font-medium">
                                                💡 Paiement partiel limité au montant restant disponible
                                            </p>
                                        </div>
                                    ` : ''}
                                    ${remaining < 0 ? `
                                        <div class="bg-red-100 border border-red-300 rounded-md p-2 mt-2">
                                            <p class="text-xs text-red-800 font-medium">
                                                ⚠️ Budget dépassé de ${formatCurrency(Math.abs(remaining))}
                                            </p>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                            
                            <div>
                                <label for="expense-amount" class="block text-sm font-medium mb-2">Montant ${isPartial ? '(paiement partiel)' : ''}</label>
                                <input type="number" step="0.01" min="0.01" ${maxAmount ? `max="${maxAmount}"` : ''} 
                                       id="expense-amount" name="amount" required 
                                       class="w-full p-2 border rounded-lg" placeholder="0.00">
                                ${maxAmount ? `<p class="text-xs text-gray-500 mt-1">Maximum: ${formatCurrency(maxAmount)}</p>` : ''}
                            </div>
                            
                            <div>
                                <label for="expense-description" class="block text-sm font-medium mb-2">Description</label>
                                <input type="text" id="expense-description" name="description" required 
                                       class="w-full p-2 border rounded-lg" 
                                       placeholder="${isPartial ? 'Paiement partiel - ' : ''}${subCategory}">
                            </div>
                            
                            <div>
                                <label for="expense-account" class="block text-sm font-medium mb-2">Compte</label>
                                <select id="expense-account" name="accountId" required class="w-full p-2 border rounded-lg">
                                    ${state.accounts.map(acc => `<option value="${acc.id}">${acc.name}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        
                        <div class="mt-6 flex justify-end gap-2">
                            <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg">Annuler</button>
                            <button type="submit" class="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700">
                                ${isPartial ? 'Enregistrer Paiement' : 'Ajouter Dépense'}
                            </button>
                        </div>
                    </form>`;

                openModal(title, content);
            };

            const handleAddBudgetCategorySubmit = (e) => {
                e.preventDefault();
                const form = e.target;
                const fd = new FormData(form);
                const categoryKey = fd.get('categoryKey');
                const plannedAmount = parseFloat(fd.get('plannedAmount'));

                if (!categoryKey || plannedAmount <= 0) {
                    showToast('Veuillez remplir tous les champs correctement', 'error');
                    return;
                }

                if (!state.monthlyBudgets[state.currentBudgetMonth]) {
                    state.monthlyBudgets[state.currentBudgetMonth] = {};
                }

                if (!state.monthlyBudgets[state.currentBudgetMonth][categoryKey]) {
                    state.monthlyBudgets[state.currentBudgetMonth][categoryKey] = { planned: 0, spent: 0, transactions: [] };
                }

                state.monthlyBudgets[state.currentBudgetMonth][categoryKey].planned = plannedAmount;
                
                closeModal();
                showToast(`Catégorie ajoutée au budget: ${formatCurrency(plannedAmount)}`, 'success');
                fullUpdate();
            };

            const prepareNextMonth = () => {
                const now = new Date();
                const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                const nextMonthKey = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
                const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                
                // Vérifier si le budget du mois suivant existe déjà
                if (state.monthlyBudgets[nextMonthKey] && Object.keys(state.monthlyBudgets[nextMonthKey]).length > 0) {
                    const content = `
                        <p>Le budget pour <strong>${nextMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</strong> existe déjà.</p>
                        <p class="mt-2 text-sm text-gray-600">Voulez-vous le remplacer par une copie du budget actuel ?</p>
                        <div class="flex gap-3 mt-4">
                            <button onclick="confirmPrepareNextMonth('${nextMonthKey}', '${currentMonthKey}')" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                                Remplacer
                            </button>
                            <button onclick="closeModal()" class="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">
                                Annuler
                            </button>
                        </div>
                    `;
                    openModal('Préparer le mois suivant', content);
                } else {
                    confirmPrepareNextMonth(nextMonthKey, currentMonthKey);
                }
            };

            window.confirmPrepareNextMonth = (nextMonthKey, currentMonthKey) => {
                const currentBudget = state.monthlyBudgets[currentMonthKey] || {};
                
                // Copier le budget actuel vers le mois suivant
                state.monthlyBudgets[nextMonthKey] = {};
                Object.keys(currentBudget).forEach(categoryKey => {
                    state.monthlyBudgets[nextMonthKey][categoryKey] = {
                        planned: currentBudget[categoryKey].planned || 0,
                        spent: 0,
                        transactions: []
                    };
                });
                
                // Changer vers le nouveau mois
                state.currentBudgetMonth = nextMonthKey;
                
                closeModal();
                const nextMonth = new Date(nextMonthKey + '-01');
                showToast(`Budget préparé pour ${nextMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`, 'success');
                fullUpdate();
            };

            const handleBudgetExpenseSubmit = (e) => {
                e.preventDefault();
                const form = e.target;
                const fd = new FormData(form);
                const categoryKey = form.dataset.categoryKey;
                const isPartial = form.dataset.isPartial === 'true';
                const amount = parseFloat(fd.get('amount'));
                const description = fd.get('description');
                const accountId = fd.get('accountId');

                if (!amount || amount <= 0 || !description || !accountId) {
                    showToast('Veuillez remplir tous les champs correctement', 'error');
                    return;
                }

                const [category, subCategory] = categoryKey.split('-');
                
                const transaction = {
                    id: generateId(),
                    accountId: accountId,
                    type: 'expense',
                    amount: amount,
                    originalAmount: amount,
                    originalCurrency: state.baseCurrency,
                    category: category,
                    subCategory: subCategory,
                    description: description,
                    date: new Date().toISOString().split('T')[0],
                    tags: isPartial ? ['budget-partiel'] : ['budget'],
                    linkedTo: null,
                    budgetItemLink: {
                        month: state.currentBudgetMonth,
                        categoryKey: categoryKey,
                        isPartialPayment: isPartial
                    },
                    isRecurring: false,
                    isSplit: false,
                    parentTransactionId: null
                };

                state.transactions.push(transaction);

                // Mettre à jour le budget
                if (!state.monthlyBudgets[state.currentBudgetMonth]) {
                    state.monthlyBudgets[state.currentBudgetMonth] = {};
                }
                if (!state.monthlyBudgets[state.currentBudgetMonth][categoryKey]) {
                    state.monthlyBudgets[state.currentBudgetMonth][categoryKey] = { planned: 0, spent: 0, transactions: [] };
                }
                
                state.monthlyBudgets[state.currentBudgetMonth][categoryKey].spent += amount;
                state.monthlyBudgets[state.currentBudgetMonth][categoryKey].transactions.push(transaction.id);

                closeModal();
                showToast(`${isPartial ? 'Paiement partiel' : 'Dépense'} ajouté: ${description} (${formatCurrency(amount)})`, 'success');
                fullUpdate();
            };

            const renderSettings = () => `
                <div class="bg-white p-6 rounded-lg shadow space-y-8">
                    <div>
                        <h3 class="text-lg font-semibold mb-4">Gestion des Données</h3>
                        <div class="flex flex-wrap gap-4">
                            <button data-action="export-data" class="bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-blue-700">
                                <i data-lucide="download"></i> Exporter les données
                            </button>
                            <label class="bg-green-600 text-white py-2 px-4 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-green-700">
                                <i data-lucide="upload"></i> Importer des données
                                <input type="file" id="import-file" class="hidden" accept=".json">
                            </label>
                        </div>
                    </div>
                    <div class="border-t pt-6">
                        <h3 class="text-lg font-semibold mb-4">Personnalisation</h3>
                        <div class="flex flex-wrap gap-4">
                            <button data-action="manage-categories" class="bg-gray-700 text-white py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-gray-800">
                                <i data-lucide="list-tree"></i> Gérer les catégories
                            </button>
                        </div>
                    </div>
                </div>`;

            const renderForecasts = () => {
                const budgetSection = (() => {
                    const now = new Date();
                    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                    const currentMonthExpenses = state.transactions.filter(tx => tx.type === 'expense' && new Date(tx.date) >= firstDayOfMonth);
                    
                    // Utiliser monthlyBudgets au lieu de budgets
                    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                    const currentMonthData = state.monthlyBudgets[currentMonth] || {};
                    
                    const spentByCategory = currentMonthExpenses.reduce((acc, tx) => {
                        const categoryKey = `${tx.category}-${tx.subCategory}`;
                        acc[categoryKey] = (acc[categoryKey] || 0) + tx.amount;
                        return acc;
                    }, {});

                    const totalBudget = Object.values(currentMonthData).reduce((sum, cat) => sum + (cat.planned || 0), 0);
                    const totalSpent = Object.values(spentByCategory).reduce((sum, amount) => sum + amount, 0);

                    let tableRows = Object.keys(currentMonthData).map(categoryKey => {
                        const [category, subCategory] = categoryKey.split('-');
                        const budgeted = currentMonthData[categoryKey]?.planned || 0;
                        if (budgeted === 0) return '';

                        const spent = spentByCategory[categoryKey] || 0;
                        const remaining = budgeted - spent;
                        const progress = budgeted > 0 ? (spent / budgeted) * 100 : 0;

                        let progressBarColor = 'bg-green-500';
                        if (progress > 90) {
                            progressBarColor = 'bg-red-500';
                        } else if (progress > 75) {
                            progressBarColor = 'bg-yellow-500';
                        }

                        return `<tr class="border-b">
                            <td class="p-3 font-medium">${category} - ${subCategory}</td>
                            <td class="p-3">${formatCurrency(budgeted)}</td>
                            <td class="p-3">${formatCurrency(spent)}</td>
                            <td class="p-3 font-semibold ${remaining < 0 ? 'text-red-600' : 'text-green-600'}">${formatCurrency(remaining)}</td>
                            <td class="p-3"><div class="w-full bg-gray-200 rounded-full h-4"><div class="${progressBarColor} h-4 rounded-full" style="width: ${Math.min(progress, 100)}%"></div></div></td>
                        </tr>`;
                    }).join('');

                    if (totalBudget === 0) {
                        tableRows = `<tr><td colspan="5" class="text-center p-6 text-gray-500">Aucun budget défini.</td></tr>`;
                    }

                    return `
                        <div class="mb-6 flex justify-between items-center">
                            <div class="bg-white p-4 rounded-lg shadow">
                                Dépensé ce mois: <span class="font-bold text-xl">${formatCurrency(totalSpent)}</span> / ${formatCurrency(totalBudget)}
                            </div>
                            <button data-action="navigate" data-tab="budget" class="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 flex items-center space-x-2">
                                <i data-lucide="settings-2"></i><span>Gérer le Budget</span>
                            </button>
                        </div>
                        <div class="bg-white rounded-lg shadow">
                            <div class="overflow-x-auto">
                                <table class="w-full text-left">
                                    <thead>
                                        <tr class="border-b">
                                            <th class="p-3 font-semibold">Catégorie</th>
                                            <th class="p-3 font-semibold">Budgétisé</th>
                                            <th class="p-3 font-semibold">Dépensé</th>
                                            <th class="p-3 font-semibold">Restant</th>
                                            <th class="p-3 font-semibold">Progression</th>
                                        </tr>
                                    </thead>
                                    <tbody>${tableRows}</tbody>
                                </table>
                            </div>
                        </div>`;
                })();

                const scenarioSection = `
                    <div class="mt-8 bg-white p-6 rounded-lg shadow">
                        <h3 class="text-lg font-semibold mb-4">Scénarios "What-If"</h3>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div>
                                <label for="additional-savings" class="block text-sm font-medium">Épargne mensuelle supplémentaire</label>
                                <input type="range" id="additional-savings" min="0" max="5000" step="10" value="500" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
                                <span id="additional-savings-value" class="text-indigo-600 font-semibold">${formatCurrency(500)}</span>
                            </div>
                            <div>
                                <label for="annual-return" class="block text-sm font-medium">Rendement annuel (%)</label>
                                <input type="range" id="annual-return" min="0" max="100" step="1" value="7" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
                                <span id="annual-return-value" class="text-indigo-600 font-semibold">7 %</span>
                            </div>
                            <div>
                                <label for="additional-income" class="block text-sm font-medium">Revenu mensuel supplémentaire</label>
                                <input type="range" id="additional-income" min="0" max="5000" step="10" value="0" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
                                <span id="additional-income-value" class="text-indigo-600 font-semibold">${formatCurrency(0)}</span>
                            </div>
                        </div>
                        <div><canvas id="forecastChart"></canvas></div>
                    </div>`;

                return budgetSection + scenarioSection;
            };

            const renderForecastChart = () => {
                const additionalSavingsEl = document.getElementById('additional-savings');
                if (!additionalSavingsEl) return;

                const additionalSavings = parseFloat(additionalSavingsEl.value);
                const annualReturn = parseFloat(document.getElementById('annual-return').value);
                const additionalIncome = parseFloat(document.getElementById('additional-income').value);

                document.getElementById('additional-savings-value').textContent = formatCurrency(additionalSavings);
                document.getElementById('annual-return-value').textContent = `${annualReturn} %`;
                document.getElementById('additional-income-value').textContent = formatCurrency(additionalIncome);

                const projectionData = [];
                const labels = [];
                let projectedNetWorth = calculateNetWorth();
                const monthlyReturnRate = Math.pow(1 + (annualReturn / 100), 1/12) - 1;

                for (let year = 1; year <= 10; year++) {
                    for (let month = 1; month <= 12; month++) {
                        projectedNetWorth *= (1 + monthlyReturnRate);
                        projectedNetWorth += additionalSavings + additionalIncome;
                    }
                    labels.push(`Année ${year}`);
                    projectionData.push(projectedNetWorth);
                }

                const forecastCtx = document.getElementById('forecastChart')?.getContext('2d');
                if (forecastChart) {
                    forecastChart.destroy();
                }

                if (forecastCtx) {
                    forecastChart = new Chart(forecastCtx, {
                        type: 'line',
                        data: {
                            labels,
                            datasets: [{
                                label: 'Patrimoine Net Projeté',
                                data: projectionData,
                                borderColor: 'rgb(14, 165, 233)',
                                backgroundColor: 'rgba(14, 165, 233, 0.1)',
                                tension: 0.1,
                                fill: true
                            }]
                        },
                        options: {
                            scales: { y: { ticks: { maxTicksLimit: 10, callback: (value) => formatCurrency(value) } } },
                            plugins: { tooltip: { callbacks: { label: (context) => ` ${context.dataset.label}: ${formatCurrency(context.parsed.y)}` } } }
                        }
                    });
                }
            };

            const renderReports = () => {
                const currentYear = new Date().getFullYear();
                const currentMonth = new Date().getMonth() + 1;
                
                // Générer le bilan récapitulatif
                const totalAssets = calculateTotalAccountsBalance() + calculateTotalInvestments() + calculateTotalClaims();
                const totalDebts = calculateTotalDebts();
                const netWorth = calculateNetWorth();
                const monthlyIncome = calculateAverageMonthlyIncome(3);
                const monthlyExpenses = calculateAverageMonthlyExpenses(3);
                
                const financialSummary = `
                    <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
                        <h5 class="font-semibold">Patrimoine Net</h5>
                        <p class="text-2xl font-bold">${formatCurrency(netWorth)}</p>
                    </div>
                    <div class="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
                        <h5 class="font-semibold">Total Actifs</h5>
                        <p class="text-2xl font-bold">${formatCurrency(totalAssets)}</p>
                    </div>
                    <div class="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-lg">
                        <h5 class="font-semibold">Total Dettes</h5>
                        <p class="text-2xl font-bold">${formatCurrency(totalDebts)}</p>
                    </div>
                    <div class="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
                        <h5 class="font-semibold">Épargne Mensuelle</h5>
                        <p class="text-2xl font-bold">${formatCurrency(monthlyIncome - monthlyExpenses)}</p>
                    </div>
                `;

                // Générer le tableau des top dépenses
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                
                const recentExpenses = state.transactions.filter(tx => 
                    tx.type === 'expense' && new Date(tx.date) >= thirtyDaysAgo
                );
                
                const expensesByCategory = recentExpenses.reduce((acc, tx) => {
                    const key = `${tx.category} - ${tx.subCategory}`;
                    if (!acc[key]) acc[key] = { total: 0, count: 0 };
                    acc[key].total += tx.amount;
                    acc[key].count += 1;
                    return acc;
                }, {});
                
                const sortedExpenses = Object.entries(expensesByCategory)
                    .sort(([,a], [,b]) => b.total - a.total)
                    .slice(0, 10);
                
                const topExpensesTable = `
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b">
                                <th class="text-left p-2">Catégorie</th>
                                <th class="text-right p-2">Montant</th>
                                <th class="text-right p-2">Transactions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sortedExpenses.map(([category, data]) => `
                                <tr class="border-b">
                                    <td class="p-2">${category}</td>
                                    <td class="p-2 text-right font-semibold">${formatCurrency(data.total)}</td>
                                    <td class="p-2 text-right">${data.count}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;

                // Générer la performance des investissements
                const investmentsPerformance = !state.investments.length ? 
                    '<p class="text-gray-500 text-center py-4">Aucun investissement</p>' :
                    `<table class="w-full text-sm">
                        <thead>
                            <tr class="border-b">
                                <th class="text-left p-2">Investissement</th>
                                <th class="text-right p-2">Valeur</th>
                                <th class="text-right p-2">Performance</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${state.investments.map(inv => {
                                const details = calculateInvestmentDetails(inv.id);
                                const currentValue = inv.currentValue * details.currentQuantity;
                                const gainLoss = currentValue + details.totalSalesValue + details.totalDividends - details.totalCost;
                                const performance = details.totalCost > 0 ? (gainLoss / details.totalCost * 100) : 0;
                                
                                return `
                                    <tr class="border-b">
                                        <td class="p-2">${inv.name}</td>
                                        <td class="p-2 text-right font-semibold">${formatCurrency(currentValue)}</td>
                                        <td class="p-2 text-right ${performance >= 0 ? 'text-green-600' : 'text-red-600'}">
                                            ${performance >= 0 ? '+' : ''}${performance.toFixed(2)}%
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>`;

                // Générer l'analyse mensuelle
                const months = [];
                const today = new Date();
                
                for (let i = 5; i >= 0; i--) {
                    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
                    const monthName = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                    
                    const monthTransactions = state.transactions.filter(tx => {
                        const txDate = new Date(tx.date);
                        return txDate.getFullYear() === date.getFullYear() && 
                               txDate.getMonth() === date.getMonth();
                    });
                    
                    const income = monthTransactions.filter(tx => tx.type === 'income')
                        .reduce((sum, tx) => sum + tx.amount, 0);
                    const expenses = monthTransactions.filter(tx => tx.type === 'expense')
                        .reduce((sum, tx) => sum + tx.amount, 0);
                    const savings = income - expenses;
                    
                    months.push({ monthName, income, expenses, savings });
                }
                
                const monthlyAnalysis = `
                    <table class="w-full">
                        <thead>
                            <tr class="border-b">
                                <th class="text-left p-3">Mois</th>
                                <th class="text-right p-3">Revenus</th>
                                <th class="text-right p-3">Dépenses</th>
                                <th class="text-right p-3">Épargne</th>
                                <th class="text-right p-3">Taux d'épargne</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${months.map(month => {
                                const savingsRate = month.income > 0 ? (month.savings / month.income * 100) : 0;
                                return `
                                    <tr class="border-b">
                                        <td class="p-3 font-medium">${month.monthName}</td>
                                        <td class="p-3 text-right text-green-600">${formatCurrency(month.income)}</td>
                                        <td class="p-3 text-right text-red-600">${formatCurrency(month.expenses)}</td>
                                        <td class="p-3 text-right font-semibold ${month.savings >= 0 ? 'text-green-600' : 'text-red-600'}">
                                            ${formatCurrency(month.savings)}
                                        </td>
                                        <td class="p-3 text-right ${savingsRate >= 20 ? 'text-green-600' : savingsRate >= 10 ? 'text-yellow-600' : 'text-red-600'}">
                                            ${savingsRate.toFixed(1)}%
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                `;
                
                return `
                <div class="space-y-6">
                    <!-- En-tête avec sélecteurs de période -->
                    <div class="bg-white p-6 rounded-lg shadow">
                        <div class="flex justify-between items-center mb-4">
                            <div>
                                <h3 class="text-xl font-semibold">Rapports Financiers Détaillés</h3>
                                <p class="text-gray-500">Analysez vos finances avec des visualisations et bilans complets</p>
                            </div>
                            <div class="flex space-x-2">
                                <select id="report-period" class="p-2 border rounded-lg">
                                    <option value="monthly">Mensuel</option>
                                    <option value="quarterly">Trimestriel</option>
                                    <option value="yearly">Annuel</option>
                                    <option value="custom">Personnalisé</option>
                                </select>
                                <select id="report-year" class="p-2 border rounded-lg">
                                    ${Array.from({length: 5}, (_, i) => currentYear - i).map(year => 
                                        `<option value="${year}" ${year === currentYear ? 'selected' : ''}>${year}</option>`
                                    ).join('')}
                                </select>
                                <select id="report-month" class="p-2 border rounded-lg">
                                    ${Array.from({length: 12}, (_, i) => {
                                        const month = i + 1;
                                        const monthName = new Date(2024, i).toLocaleDateString('fr-FR', { month: 'long' });
                                        return `<option value="${month}" ${month === currentMonth ? 'selected' : ''}>${monthName}</option>`;
                                    }).join('')}
                                </select>
                                <button data-action="generate-report" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                                    Générer Rapport
                                </button>
                                <button data-action="export-report" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                                    Exporter PDF
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Bilan Récapitulatif -->
                    <div class="bg-white p-6 rounded-lg shadow">
                        <h4 class="text-lg font-semibold mb-4">Bilan Récapitulatif</h4>
                        <div id="financial-summary" class="grid grid-cols-1 md:grid-cols-4 gap-4">
                            ${financialSummary}
                        </div>
                    </div>

                    <!-- Graphiques principaux -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div class="bg-white p-6 rounded-lg shadow">
                            <h4 class="text-lg font-semibold mb-4">Répartition des Dépenses</h4>
                            <canvas id="expenseDonutChart"></canvas>
                        </div>
                        <div class="bg-white p-6 rounded-lg shadow">
                            <h4 class="text-lg font-semibold mb-4">Évolution Patrimoine</h4>
                            <canvas id="netWorthChart"></canvas>
                        </div>
                        <div class="bg-white p-6 rounded-lg shadow">
                            <h4 class="text-lg font-semibold mb-4">Répartition des Actifs</h4>
                            <canvas id="assetsPieChart"></canvas>
                        </div>
                        <div class="bg-white p-6 rounded-lg shadow">
                            <h4 class="text-lg font-semibold mb-4">Revenus vs Dépenses</h4>
                            <canvas id="incomeExpenseChart"></canvas>
                        </div>
                    </div>

                    <!-- Flux de trésorerie -->
                    <div class="bg-white p-6 rounded-lg shadow">
                        <h4 class="text-lg font-semibold mb-4">Flux de Trésorerie (12 mois)</h4>
                        <canvas id="flowLineChart"></canvas>
                    </div>

                    <!-- Tableaux détaillés -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div class="bg-white p-6 rounded-lg shadow">
                            <h4 class="text-lg font-semibold mb-4">Top Dépenses par Catégorie</h4>
                            <div id="top-expenses-table">
                                ${topExpensesTable}
                            </div>
                        </div>
                        <div class="bg-white p-6 rounded-lg shadow">
                            <h4 class="text-lg font-semibold mb-4">Performance Investissements</h4>
                            <div id="investments-performance">
                                ${investmentsPerformance}
                            </div>
                        </div>
                    </div>

                    <!-- Analyse mensuelle détaillée -->
                    <div class="bg-white p-6 rounded-lg shadow">
                        <h4 class="text-lg font-semibold mb-4">Analyse Mensuelle Détaillée</h4>
                        <div id="monthly-analysis">
                            ${monthlyAnalysis}
                        </div>
                    </div>
                </div>`;
            };

            // Fonctions pour générer les données des rapports
            const generateFinancialSummary = () => {
                const totalAssets = calculateTotalAccountsBalance() + calculateTotalInvestments() + calculateTotalClaims();
                const totalDebts = calculateTotalDebts();
                const netWorth = calculateNetWorth();
                const monthlyIncome = calculateAverageMonthlyIncome(3);
                const monthlyExpenses = calculateAverageMonthlyExpenses(3);
                
                return `
                    <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
                        <h5 class="font-semibold">Patrimoine Net</h5>
                        <p class="text-2xl font-bold">${formatCurrency(netWorth)}</p>
                    </div>
                    <div class="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
                        <h5 class="font-semibold">Total Actifs</h5>
                        <p class="text-2xl font-bold">${formatCurrency(totalAssets)}</p>
                    </div>
                    <div class="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-lg">
                        <h5 class="font-semibold">Total Dettes</h5>
                        <p class="text-2xl font-bold">${formatCurrency(totalDebts)}</p>
                    </div>
                    <div class="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
                        <h5 class="font-semibold">Épargne Mensuelle</h5>
                        <p class="text-2xl font-bold">${formatCurrency(monthlyIncome - monthlyExpenses)}</p>
                    </div>
                `;
            };

            const generateTopExpensesTable = () => {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                
                const recentExpenses = state.transactions.filter(tx => 
                    tx.type === 'expense' && new Date(tx.date) >= thirtyDaysAgo
                );
                
                const expensesByCategory = recentExpenses.reduce((acc, tx) => {
                    const key = `${tx.category} - ${tx.subCategory}`;
                    if (!acc[key]) acc[key] = { total: 0, count: 0 };
                    acc[key].total += tx.amount;
                    acc[key].count += 1;
                    return acc;
                }, {});
                
                const sortedExpenses = Object.entries(expensesByCategory)
                    .sort(([,a], [,b]) => b.total - a.total)
                    .slice(0, 10);
                
                return `
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b">
                                <th class="text-left p-2">Catégorie</th>
                                <th class="text-right p-2">Montant</th>
                                <th class="text-right p-2">Transactions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sortedExpenses.map(([category, data]) => `
                                <tr class="border-b">
                                    <td class="p-2">${category}</td>
                                    <td class="p-2 text-right font-semibold">${formatCurrency(data.total)}</td>
                                    <td class="p-2 text-right">${data.count}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            };

            const generateInvestmentsPerformance = () => {
                if (!state.investments.length) {
                    return '<p class="text-gray-500 text-center py-4">Aucun investissement</p>';
                }
                
                return `
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b">
                                <th class="text-left p-2">Investissement</th>
                                <th class="text-right p-2">Valeur</th>
                                <th class="text-right p-2">Performance</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${state.investments.map(inv => {
                                const details = calculateInvestmentDetails(inv.id);
                                const currentValue = inv.currentValue * details.currentQuantity;
                                const totalInvested = details.totalInvested;
                                const performance = totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested * 100) : 0;
                                
                                return `
                                    <tr class="border-b">
                                        <td class="p-2">${inv.name}</td>
                                        <td class="p-2 text-right font-semibold">${formatCurrency(currentValue)}</td>
                                        <td class="p-2 text-right ${performance >= 0 ? 'text-green-600' : 'text-red-600'}">
                                            ${performance >= 0 ? '+' : ''}${performance.toFixed(2)}%
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                `;
            };

            const generateMonthlyAnalysis = () => {
                const months = [];
                const today = new Date();
                
                for (let i = 5; i >= 0; i--) {
                    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    const monthName = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                    
                    const monthTransactions = state.transactions.filter(tx => {
                        const txDate = new Date(tx.date);
                        return txDate.getFullYear() === date.getFullYear() && 
                               txDate.getMonth() === date.getMonth();
                    });
                    
                    const income = monthTransactions.filter(tx => tx.type === 'income')
                        .reduce((sum, tx) => sum + tx.amount, 0);
                    const expenses = monthTransactions.filter(tx => tx.type === 'expense')
                        .reduce((sum, tx) => sum + tx.amount, 0);
                    const savings = income - expenses;
                    
                    months.push({ monthName, income, expenses, savings });
                }
                
                return `
                    <table class="w-full">
                        <thead>
                            <tr class="border-b">
                                <th class="text-left p-3">Mois</th>
                                <th class="text-right p-3">Revenus</th>
                                <th class="text-right p-3">Dépenses</th>
                                <th class="text-right p-3">Épargne</th>
                                <th class="text-right p-3">Taux d'épargne</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${months.map(month => {
                                const savingsRate = month.income > 0 ? (month.savings / month.income * 100) : 0;
                                return `
                                    <tr class="border-b">
                                        <td class="p-3 font-medium">${month.monthName}</td>
                                        <td class="p-3 text-right text-green-600">${formatCurrency(month.income)}</td>
                                        <td class="p-3 text-right text-red-600">${formatCurrency(month.expenses)}</td>
                                        <td class="p-3 text-right font-semibold ${month.savings >= 0 ? 'text-green-600' : 'text-red-600'}">
                                            ${formatCurrency(month.savings)}
                                        </td>
                                        <td class="p-3 text-right ${savingsRate >= 20 ? 'text-green-600' : savingsRate >= 10 ? 'text-yellow-600' : 'text-red-600'}">
                                            ${savingsRate.toFixed(1)}%
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                `;
            };

            // Fonction de formatage pour PDF (sans séparateurs de milliers)
            const formatCurrencyForPDF = (amount, currency = state.baseCurrency) => {
                if (isNaN(amount)) return "0.00";
                
                // Formatage spécial pour BTC avec plus de décimales
                if (currency === 'BTC') {
                    return `₿ ${parseFloat(amount).toFixed(8)}`;
                }
                
                // Format simple sans séparateurs de milliers pour PDF
                const formatted = parseFloat(amount).toFixed(2);
                const currencySymbols = {
                    'EUR': '€',
                    'USD': '$',
                    'CHF': 'CHF',
                    'GBP': '£'
                };
                const symbol = currencySymbols[currency] || currency;
                return `${formatted} ${symbol}`;
            };

            // Fonction d'export PDF
            const exportReportToPDF = async () => {
                try {
                    showToast('Génération du PDF en cours...', 'info');
                    
                    const { jsPDF } = window.jspdf;
                    const pdf = new jsPDF('p', 'mm', 'a4');
                    
                    // Configuration
                    const pageWidth = pdf.internal.pageSize.getWidth();
                    const pageHeight = pdf.internal.pageSize.getHeight();
                    const margin = 20;
                    let yPosition = margin;
                    
                    // En-tête du rapport
                    pdf.setFontSize(20);
                    pdf.setTextColor(79, 70, 229); // Indigo
                    pdf.text('Rapport Financier Détaillé', margin, yPosition);
                    yPosition += 10;
                    
                    pdf.setFontSize(12);
                    pdf.setTextColor(107, 114, 128); // Gray
                    const today = new Date();
                    const period = document.getElementById('report-period')?.value || 'mensuel';
                    const year = document.getElementById('report-year')?.value || today.getFullYear();
                    const month = document.getElementById('report-month')?.value || (today.getMonth() + 1);
                    
                    pdf.text(`Période: ${period} - ${month}/${year}`, margin, yPosition);
                    pdf.text(`Généré le: ${today.toLocaleDateString('fr-FR')}`, margin, yPosition + 5);
                    yPosition += 20;
                    
                    // Bilan récapitulatif
                    pdf.setFontSize(16);
                    pdf.setTextColor(0, 0, 0);
                    pdf.text('Bilan Récapitulatif', margin, yPosition);
                    yPosition += 10;
                    
                    const totalAssets = calculateTotalAccountsBalance() + calculateTotalInvestments() + calculateTotalClaims();
                    const totalDebts = calculateTotalDebts();
                    const netWorth = calculateNetWorth();
                    const monthlyIncome = calculateAverageMonthlyIncome(3);
                    const monthlyExpenses = calculateAverageMonthlyExpenses(3);
                    const monthlySavings = monthlyIncome - monthlyExpenses;
                    
                    pdf.setFontSize(12);
                    pdf.text(`Patrimoine net: ${formatCurrencyForPDF(netWorth)}`, margin, yPosition);
                    pdf.text(`Total actifs: ${formatCurrencyForPDF(totalAssets)}`, margin, yPosition + 5);
                    pdf.text(`Total dettes: ${formatCurrencyForPDF(totalDebts)}`, margin, yPosition + 10);
                    pdf.text(`Épargne mensuelle: ${formatCurrencyForPDF(monthlySavings)}`, margin, yPosition + 15);
                    yPosition += 35;
                    
                    // Top dépenses
                    if (yPosition > pageHeight - 60) {
                        pdf.addPage();
                        yPosition = margin;
                    }
                    
                    pdf.setFontSize(16);
                    pdf.text('Top Dépenses (30 derniers jours)', margin, yPosition);
                    yPosition += 10;
                    
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    
                    const recentExpenses = state.transactions.filter(tx => 
                        tx.type === 'expense' && new Date(tx.date) >= thirtyDaysAgo
                    );
                    
                    const expensesByCategory = recentExpenses.reduce((acc, tx) => {
                        const key = `${tx.category} - ${tx.subCategory}`;
                        if (!acc[key]) acc[key] = { total: 0, count: 0 };
                        acc[key].total += tx.amount;
                        acc[key].count += 1;
                        return acc;
                    }, {});
                    
                    const sortedExpenses = Object.entries(expensesByCategory)
                        .sort(([,a], [,b]) => b.total - a.total)
                        .slice(0, 10);
                    
                    pdf.setFontSize(10);
                    pdf.text('Catégorie', margin, yPosition);
                    pdf.text('Montant', margin + 100, yPosition);
                    pdf.text('Nb Trans.', margin + 140, yPosition);
                    yPosition += 7;
                    
                    sortedExpenses.forEach(([category, data]) => {
                        if (yPosition > pageHeight - 20) {
                            pdf.addPage();
                            yPosition = margin;
                        }
                        pdf.text(category.substring(0, 40), margin, yPosition);
                        pdf.text(formatCurrencyForPDF(data.total), margin + 100, yPosition);
                        pdf.text(data.count.toString(), margin + 140, yPosition);
                        yPosition += 5;
                    });
                    
                    yPosition += 10;
                    
                    // Analyse mensuelle
                    if (yPosition > pageHeight - 80) {
                        pdf.addPage();
                        yPosition = margin;
                    }
                    
                    pdf.setFontSize(16);
                    pdf.text('Analyse Mensuelle (6 derniers mois)', margin, yPosition);
                    yPosition += 10;
                    
                    const months = [];
                    for (let i = 5; i >= 0; i--) {
                        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
                        const monthName = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                        
                        const monthTransactions = state.transactions.filter(tx => {
                            const txDate = new Date(tx.date);
                            return txDate.getFullYear() === date.getFullYear() && 
                                   txDate.getMonth() === date.getMonth();
                        });
                        
                        const income = monthTransactions.filter(tx => tx.type === 'income')
                            .reduce((sum, tx) => sum + tx.amount, 0);
                        const expenses = monthTransactions.filter(tx => tx.type === 'expense')
                            .reduce((sum, tx) => sum + tx.amount, 0);
                        const savings = income - expenses;
                        const savingsRate = income > 0 ? (savings / income * 100) : 0;
                        
                        months.push({ monthName, income, expenses, savings, savingsRate });
                    }
                    
                    pdf.setFontSize(10);
                    pdf.text('Mois', margin, yPosition);
                    pdf.text('Revenus', margin + 50, yPosition);
                    pdf.text('Dépenses', margin + 90, yPosition);
                    pdf.text('Épargne', margin + 130, yPosition);
                    pdf.text('Taux', margin + 170, yPosition);
                    yPosition += 7;
                    
                    months.forEach(month => {
                        if (yPosition > pageHeight - 20) {
                            pdf.addPage();
                            yPosition = margin;
                        }
                        pdf.text(month.monthName.substring(0, 15), margin, yPosition);
                        pdf.text(formatCurrencyForPDF(month.income), margin + 50, yPosition);
                        pdf.text(formatCurrencyForPDF(month.expenses), margin + 90, yPosition);
                        pdf.text(formatCurrencyForPDF(month.savings), margin + 130, yPosition);
                        pdf.text(`${month.savingsRate.toFixed(1)}%`, margin + 170, yPosition);
                        yPosition += 5;
                    });
                    
                    // Performance investissements
                    if (state.investments.length > 0) {
                        if (yPosition > pageHeight - 60) {
                            pdf.addPage();
                            yPosition = margin;
                        }
                        
                        pdf.setFontSize(16);
                        pdf.text('Performance Investissements', margin, yPosition);
                        yPosition += 10;
                        
                        pdf.setFontSize(10);
                        pdf.text('Investissement', margin, yPosition);
                        pdf.text('Valeur Actuelle', margin + 80, yPosition);
                        pdf.text('Performance', margin + 130, yPosition);
                        yPosition += 7;
                        
                        state.investments.forEach(inv => {
                            if (yPosition > pageHeight - 20) {
                                pdf.addPage();
                                yPosition = margin;
                            }
                            const details = calculateInvestmentDetails(inv.id);
                            const currentValue = inv.currentValue * details.currentQuantity;
                            const gainLoss = currentValue + details.totalSalesValue + details.totalDividends - details.totalCost;
                            const performance = details.totalCost > 0 ? (gainLoss / details.totalCost * 100) : 0;
                            
                            pdf.text(inv.name.substring(0, 25), margin, yPosition);
                            pdf.text(formatCurrencyForPDF(currentValue), margin + 80, yPosition);
                            pdf.text(`${performance >= 0 ? '+' : ''}${performance.toFixed(2)}%`, margin + 130, yPosition);
                            yPosition += 5;
                        });
                    }
                    
                    // Pied de page
                    const pageCount = pdf.internal.getNumberOfPages();
                    for (let i = 1; i <= pageCount; i++) {
                        pdf.setPage(i);
                        pdf.setFontSize(8);
                        pdf.setTextColor(107, 114, 128);
                        pdf.text(`Page ${i} sur ${pageCount}`, pageWidth - 30, pageHeight - 10);
                        pdf.text('Généré par FinanceApp', margin, pageHeight - 10);
                    }
                    
                    // Télécharger le PDF
                    const filename = `rapport-financier-${period}-${month}-${year}.pdf`;
                    pdf.save(filename);
                    
                    showToast('PDF exporté avec succès !', 'success');
                    
                } catch (error) {
                    console.error('Erreur lors de l\'export PDF:', error);
                    showToast('Erreur lors de l\'export PDF', 'error');
                }
            };

            const renderReportCharts = () => {
                // Détruire les graphiques existants
                [expenseDonutChart, assetsPieChart, flowLineChart, netWorthChart, incomeExpenseChart].forEach(chart => {
                    if (chart) chart.destroy();
                });

                // Graphique des dépenses (donut)
                const expenseCtx = document.getElementById('expenseDonutChart')?.getContext('2d');
                if (expenseCtx) {
                    const period = document.getElementById('report-period')?.value || 'monthly';
                    const daysBack = period === 'yearly' ? 365 : period === 'quarterly' ? 90 : 30;
                    
                    const periodStart = new Date();
                    periodStart.setDate(periodStart.getDate() - daysBack);
                    
                    const periodExpenses = state.transactions.filter(tx => 
                        tx.type === 'expense' && new Date(tx.date) >= periodStart
                    );
                    
                    const expenseByCategory = periodExpenses.reduce((acc, tx) => {
                        acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
                        return acc;
                    }, {});

                    expenseDonutChart = new Chart(expenseCtx, {
                        type: 'doughnut',
                        data: {
                            labels: Object.keys(expenseByCategory),
                            datasets: [{
                                data: Object.values(expenseByCategory),
                                backgroundColor: ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6']
                            }]
                        },
                        options: {
                            plugins: {
                                legend: { position: 'bottom' },
                                tooltip: {
                                    callbacks: {
                                        label: (context) => `${context.label}: ${formatCurrency(context.parsed)}`
                                    }
                                }
                            }
                        }
                    });
                }

                // Graphique évolution patrimoine
                const netWorthCtx = document.getElementById('netWorthChart')?.getContext('2d');
                if (netWorthCtx) {
                    const months = [];
                    const netWorthData = [];
                    const today = new Date();
                    
                    for (let i = 11; i >= 0; i--) {
                        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
                        months.push(date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }));
                        
                        // Calculer le patrimoine net à cette date (approximation)
                        const monthTransactions = state.transactions.filter(tx => new Date(tx.date) <= date);
                        const monthlyNetWorth = calculateNetWorth(); // Simplification
                        netWorthData.push(monthlyNetWorth);
                    }

                    netWorthChart = new Chart(netWorthCtx, {
                        type: 'line',
                        data: {
                            labels: months,
                            datasets: [{
                                label: 'Patrimoine Net',
                                data: netWorthData,
                                borderColor: '#3b82f6',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                tension: 0.1,
                                fill: true
                            }]
                        },
                        options: {
                            scales: {
                                y: {
                                    ticks: {
                                        callback: (value) => formatCurrency(value)
                                    }
                                }
                            },
                            plugins: {
                                tooltip: {
                                    callbacks: {
                                        label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`
                                    }
                                }
                            }
                        }
                    });
                }

                // Graphique revenus vs dépenses
                const incomeExpenseCtx = document.getElementById('incomeExpenseChart')?.getContext('2d');
                if (incomeExpenseCtx) {
                    const months = [];
                    const incomeData = [];
                    const expenseData = [];
                    const today = new Date();
                    
                    for (let i = 5; i >= 0; i--) {
                        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
                        const nextMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
                        
                        months.push(date.toLocaleDateString('fr-FR', { month: 'short' }));
                        
                        const monthTransactions = state.transactions.filter(tx => {
                            const txDate = new Date(tx.date);
                            return txDate >= date && txDate < nextMonth;
                        });
                        
                        const income = monthTransactions.filter(tx => tx.type === 'income')
                            .reduce((sum, tx) => sum + tx.amount, 0);
                        const expenses = monthTransactions.filter(tx => tx.type === 'expense')
                            .reduce((sum, tx) => sum + tx.amount, 0);
                        
                        incomeData.push(income);
                        expenseData.push(expenses);
                    }

                    incomeExpenseChart = new Chart(incomeExpenseCtx, {
                        type: 'bar',
                        data: {
                            labels: months,
                            datasets: [
                                {
                                    label: 'Revenus',
                                    data: incomeData,
                                    backgroundColor: '#22c55e'
                                },
                                {
                                    label: 'Dépenses',
                                    data: expenseData,
                                    backgroundColor: '#ef4444'
                                }
                            ]
                        },
                        options: {
                            scales: {
                                y: {
                                    ticks: {
                                        callback: (value) => formatCurrency(value)
                                    }
                                }
                            },
                            plugins: {
                                tooltip: {
                                    callbacks: {
                                        label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`
                                    }
                                }
                            }
                        }
                    });
                }

                // Graphique répartition des actifs
                const assetsCtx = document.getElementById('assetsPieChart')?.getContext('2d');
                if (assetsCtx) {
                    const totalCash = calculateTotalAccountsBalance();
                    const totalInvestments = calculateTotalInvestments();
                    const totalClaims = calculateTotalClaims();

                    assetsPieChart = new Chart(assetsCtx, {
                        type: 'pie',
                        data: {
                            labels: ['Liquidités', 'Investissements', 'Créances'],
                            datasets: [{
                                data: [totalCash, totalInvestments, totalClaims],
                                backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981']
                            }]
                        },
                        options: {
                            plugins: {
                                legend: { position: 'bottom' },
                                tooltip: {
                                    callbacks: {
                                        label: (context) => `${context.label}: ${formatCurrency(context.parsed)}`
                                    }
                                }
                            }
                        }
                    });
                }

                // Graphique flux de trésorerie (12 mois)
                const flowCtx = document.getElementById('flowLineChart')?.getContext('2d');
                if (flowCtx) {
                    const monthLabels = [];
                    const incomeData = new Array(12).fill(0);
                    const expenseData = new Array(12).fill(0);
                    const netFlowData = new Array(12).fill(0);
                    const today = new Date();

                    for (let i = 11; i >= 0; i--) {
                        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
                        monthLabels.push(date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }));
                    }

                    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
                    state.transactions.filter(tx => new Date(tx.date) >= oneYearAgo).forEach(tx => {
                        const txDate = new Date(tx.date);
                        const monthDiff = (today.getFullYear() - txDate.getFullYear()) * 12 + (today.getMonth() - txDate.getMonth());
                        const index = 11 - monthDiff;

                        if (index >= 0 && index < 12) {
                            if (tx.type === 'income') {
                                incomeData[index] += tx.amount;
                            } else {
                                expenseData[index] += tx.amount;
                            }
                            netFlowData[index] = incomeData[index] - expenseData[index];
                        }
                    });

                    flowLineChart = new Chart(flowCtx, {
                        type: 'line',
                        data: {
                            labels: monthLabels,
                            datasets: [
                                {
                                    label: 'Revenus',
                                    data: incomeData,
                                    borderColor: '#22c55e',
                                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                    tension: 0.1,
                                    fill: false
                                },
                                {
                                    label: 'Dépenses',
                                    data: expenseData,
                                    borderColor: '#ef4444',
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    tension: 0.1,
                                    fill: false
                                },
                                {
                                    label: 'Flux Net',
                                    data: netFlowData,
                                    borderColor: '#3b82f6',
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                    tension: 0.1,
                                    fill: true
                                }
                            ]
                        },
                        options: {
                            scales: {
                                y: {
                                    ticks: {
                                        callback: (value) => formatCurrency(value)
                                    }
                                }
                            },
                            plugins: {
                                tooltip: {
                                    callbacks: {
                                        label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`
                                    }
                                }
                            }
                        }
                    });
                }
            };

            const renderSearchResults = () => {
                const content = document.getElementById('main-content');
                const query = state.searchQuery.toLowerCase();

                if (!query) {
                    renderContent();
                    return;
                }

                const results = {
                    transactions: state.transactions.filter(tx => !tx.parentTransactionId && (
                        tx.description.toLowerCase().includes(query) ||
                        tx.category.toLowerCase().includes(query) ||
                        (tx.subCategory && tx.subCategory.toLowerCase().includes(query)) ||
                        (tx.tags || []).some(t => t.toLowerCase().includes(query))
                    )),
                    accounts: state.accounts.filter(acc => acc.name.toLowerCase().includes(query)),
                    investments: state.investments.filter(inv => inv.name.toLowerCase().includes(query)),
                    debts: state.debts.filter(d => d.name.toLowerCase().includes(query)),
                    claims: state.claims.filter(c => c.name.toLowerCase().includes(query)),
                    goals: state.goals.filter(g => g.name.toLowerCase().includes(query)),
                };

                let html = `<div class="space-y-8"><h2 class="text-2xl font-bold">Résultats pour "${state.searchQuery}"</h2>`;
                const hasResults = Object.values(results).some(r => r.length > 0);

                if (!hasResults) {
                    html += `<p class="text-center text-gray-500 py-8">Aucun résultat.</p>`;
                } else {
                    const renderSection = (title, items, renderItem) => {
                        if (items.length > 0) {
                            html += `<div>
                                <h3 class="text-xl font-semibold mb-3 border-b pb-2">${title}</h3>
                                <div class="space-y-2 mt-2">${items.map(item => renderItem(item)).join('')}</div>
                            </div>`;
                        }
                    };

                    renderSection('Transactions', results.transactions, tx => {
                        const accountName = state.accounts.find(a => a.id === tx.accountId)?.name || 'N/A';
                        return `<div class="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center">
                            <div>
                                <p class="font-medium">${tx.description} <span class="text-sm text-gray-500">- ${tx.date}</span></p>
                                <p class="text-sm text-gray-600">${tx.category} • ${accountName}</p>
                            </div>
                            <span class="font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}">${formatCurrency(tx.amount)}</span>
                        </div>`;
                    });

                    renderSection('Comptes', results.accounts, acc => `
                        <div class="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center">
                            <p class="font-medium">${acc.name}</p>
                            <span class="font-bold">${formatCurrency(calculateAccountBalance(acc.id))}</span>
                        </div>`);

                    renderSection('Investissements', results.investments, inv => {
                        const details = calculateInvestmentDetails(inv.id);
                        const currentValue = inv.currentValue * details.currentQuantity;
                        return `<div class="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center">
                            <p class="font-medium">${inv.name} <span class="text-sm text-gray-500">(${inv.type})</span></p>
                            <span class="font-bold">${formatCurrency(currentValue)}</span>
                        </div>`;
                    });

                    renderSection('Dettes', results.debts, debt => `
                        <div class="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center">
                            <p class="font-medium">${debt.name}</p>
                            <span class="font-bold text-red-600">${formatCurrency(calculateDebtOutstanding(debt))}</span>
                        </div>`);

                    renderSection('Créances', results.claims, claim => `
                        <div class="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center">
                            <p class="font-medium">${claim.name}</p>
                            <span class="font-bold text-green-600">${formatCurrency(calculateClaimOutstanding(claim))}</span>
                        </div>`);

                    renderSection('Objectifs', results.goals, goal => {
                        const progress = (calculateGoalProgress(goal.id) / goal.targetAmount) * 100;
                        return `<div class="bg-white p-3 rounded-lg shadow-sm">
                            <div class="flex justify-between items-center">
                                <p class="font-medium">${goal.name}</p>
                                <span class="font-semibold">${progress.toFixed(0)}%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2 mt-1">
                                <div class="bg-indigo-600 h-2 rounded-full" style="width: ${progress}%"></div>
                            </div>
                        </div>`;
                    });
                }

                html += `</div>`;
                content.innerHTML = html;
                lucide.createIcons();
            };

            // ========== NOTIFICATIONS ========== //
            const getNotifications = () => {
                const notifications = [];
                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();

                // Budget alerts
                const monthlyExpenses = state.transactions.filter(t => t.type === 'expense' && new Date(t.date).getMonth() === currentMonth && new Date(t.date).getFullYear() === currentYear);
                const spentByCategory = monthlyExpenses.reduce((acc, tx) => {
                    const categoryKey = `${tx.category}-${tx.subCategory}`;
                    acc[categoryKey] = (acc[categoryKey] || 0) + tx.amount;
                    return acc;
                }, {});

                // Vérifier les dépassements de budget depuis monthlyBudgets
                const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
                const currentMonthData = state.monthlyBudgets[currentMonthKey] || {};
                
                Object.keys(currentMonthData).forEach(categoryKey => {
                    const budgetData = currentMonthData[categoryKey];
                    const planned = budgetData.planned || 0;
                    const spent = spentByCategory[categoryKey] || 0;
                    
                    if (spent > planned && planned > 0) {
                        const [category, subCategory] = categoryKey.split('-');
                        notifications.push({
                            id: `budget_${categoryKey}`,
                            type: 'warning',
                            message: `Budget "${category} - ${subCategory}" dépassé de ${formatCurrency(spent - planned)}.`
                        });
                    }
                });

                // Recurring transactions due
                const recurringTxs = state.transactions.filter(tx => tx.recurring);
                recurringTxs.forEach(tx => {
                    const alreadyPaidThisMonth = state.transactions.some(t =>
                        !t.recurring && t.description === tx.description &&
                        new Date(t.date).getMonth() === currentMonth && new Date(t.date).getFullYear() === currentYear
                    );

                    if (!alreadyPaidThisMonth) {
                        notifications.push({
                            id: `recurring_${tx.id}`,
                            type: 'info',
                            message: `Paiement récurrent dû: "${tx.description}" (${formatCurrency(tx.originalAmount, tx.originalCurrency)}).`
                        });
                    }
                });

                return notifications;
            };

            const renderNotifications = () => {
                const panel = document.getElementById('notification-panel');
                const dot = document.getElementById('notification-dot');
                const notifications = getNotifications();

                if (notifications.length === 0) {
                    panel.innerHTML = `<div class="p-4 text-center text-sm text-gray-500">Aucune notification.</div>`;
                    dot.classList.add('hidden');
                } else {
                    dot.classList.remove('hidden');
                    panel.innerHTML = `
                        <div class="p-3 border-b font-semibold text-sm">Notifications</div>
                        <div class="max-h-64 overflow-y-auto">
                            ${notifications.map(n => `
                                <div class="p-3 border-b border-gray-100 text-sm hover:bg-gray-50 flex items-start gap-3">
                                    <div class="mt-1">${n.type === 'warning' ? '<i data-lucide="alert-triangle" class="text-yellow-500"></i>' : '<i data-lucide="info" class="text-blue-500"></i>'}</div>
                                    <p>${n.message}</p>
                                </div>
                            `).join('')}
                        </div>`;
                    lucide.createIcons();
                }
            };

            // ========== EVENT LISTENERS ========== //
            const setupEventListeners = () => {
                // Navigation
                document.getElementById('sidebar-nav').addEventListener('click', e => {
                    if (e.target.closest('.nav-link')) {
                        e.preventDefault();
                        state.searchQuery = '';
                        document.getElementById('global-search').value = '';
                        state.activeTab = e.target.closest('.nav-link').dataset.tab;
                        render();
                    }
                });

                // Save data
                document.getElementById('save-data').addEventListener('click', saveState);

                // Global search avec debounce
                const debouncedSearch = debounce((query) => {
                    state.searchQuery = query;
                    render();
                }, 300);
                
                document.getElementById('global-search').addEventListener('input', e => {
                    debouncedSearch(e.target.value);
                });
                
                document.getElementById('global-search').addEventListener('keydown', e => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        state.searchQuery = e.target.value;
                        render();
                    }
                });

                // Quick add
                document.getElementById('quick-add-bar').addEventListener('keydown', e => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target.value.trim();
                        if (input) {
                            handleQuickAdd(input);
                            e.target.value = '';
                        }
                    }
                });

                // Event listeners pour le budget
                document.body.addEventListener('change', e => {
                    if (e.target.classList.contains('budget-planned-input')) {
                        const categoryKey = e.target.dataset.categoryKey;
                        const plannedAmount = parseFloat(e.target.value) || 0;
                        
                        if (!state.monthlyBudgets[state.currentBudgetMonth]) {
                            state.monthlyBudgets[state.currentBudgetMonth] = {};
                        }
                        
                        if (!state.monthlyBudgets[state.currentBudgetMonth][categoryKey]) {
                            state.monthlyBudgets[state.currentBudgetMonth][categoryKey] = { planned: 0, spent: 0, transactions: [] };
                        }
                        
                        state.monthlyBudgets[state.currentBudgetMonth][categoryKey].planned = plannedAmount;
                        saveState();
                        render();
                    }
                    
                    if (e.target.id === 'budget-month-selector') {
                        state.currentBudgetMonth = e.target.value;
                        render();
                    }
                });

                // Click events - Optimisation avec délégation d'événements
                const clickHandlers = {
                    'add-account': () => showAccountModal(),
                    'edit-account': (target) => showAccountModal(target.dataset.id),
                    'delete-account': (target) => showDeleteAccountConfirmationModal(target.dataset.id),
                    'add-transaction': (target) => showTransactionModal(target.dataset.type || 'expense'),
                    'edit-transaction': (target) => showTransactionModal('expense', target.dataset.id),
                    'delete-transaction': (target) => showDeleteTransactionConfirmationModal(target.dataset.id),
                    'show-split-modal': () => {
                        const form = document.querySelector('#transaction-form');
                        if (form) {
                            const fd = new FormData(form);
                            const parentData = {
                                description: fd.get('description'),
                                originalAmount: parseFloat(fd.get('originalAmount')),
                                originalCurrency: fd.get('originalCurrency'),
                                date: fd.get('date'),
                                accountId: fd.get('accountId'),
                                tags: fd.get('tags')
                            };
                            showSplitTransactionModal(parentData);
                        }
                    },
                    'close-modal': closeModal,
                    'show-transfer-modal': showTransferModal,
                    'add-debt': () => showDebtModal(),
                    'view-debt-history': (target) => showDebtHistoryModal(target.dataset.id),
                    'show-add-debt-repayment-modal': (target) => showAddDebtRepaymentModal(target.dataset.id),
                    'archive-debt': (target) => {
                        const debt = state.debts.find(d => d.id === target.dataset.id);
                        if (debt) {
                            debt.archived = true;
                            debt.archivedDate = today();
                            showToast(`Dette "${debt.name}" archivée`, 'success');
                            fullUpdate();
                        }
                    },
                    'unarchive-debt': (target) => {
                        const debt = state.debts.find(d => d.id === target.dataset.id);
                        if (debt) {
                            debt.archived = false;
                            delete debt.archivedDate;
                            showToast(`Dette "${debt.name}" désarchivée`, 'success');
                            fullUpdate();
                        }
                    },
                    'toggle-archived-debts': () => {
                        const archivedSection = document.getElementById('archived-debts');
                        if (archivedSection) {
                            archivedSection.classList.toggle('hidden');
                            const button = document.querySelector('[data-action="toggle-archived-debts"] span');
                            if (button) {
                                button.textContent = archivedSection.classList.contains('hidden') ? 'Voir Archivées' : 'Masquer Archivées';
                            }
                        }
                    },
                    'add-claim': () => showClaimModal(),
                    'view-claim-history': (target) => showClaimHistoryModal(target.dataset.id),
                    'show-add-claim-payment-modal': (target) => showAddClaimPaymentModal(target.dataset.id),
                    'archive-claim': (target) => {
                        const claim = state.claims.find(c => c.id === target.dataset.id);
                        if (claim) {
                            claim.archived = true;
                            claim.archivedDate = today();
                            showToast(`Créance "${claim.name}" archivée`, 'success');
                            fullUpdate();
                        }
                    },
                    'unarchive-claim': (target) => {
                        const claim = state.claims.find(c => c.id === target.dataset.id);
                        if (claim) {
                            claim.archived = false;
                            delete claim.archivedDate;
                            showToast(`Créance "${claim.name}" désarchivée`, 'success');
                            fullUpdate();
                        }
                    },
                    'toggle-archived-claims': () => {
                        const archivedSection = document.getElementById('archived-claims');
                        if (archivedSection) {
                            archivedSection.classList.toggle('hidden');
                            const button = document.querySelector('[data-action="toggle-archived-claims"] span');
                            if (button) {
                                button.textContent = archivedSection.classList.contains('hidden') ? 'Voir Archivées' : 'Masquer Archivées';
                            }
                        }
                    },
                    'add-goal': () => showGoalModal(),
                    'manage-goal': (target) => showManageGoalModal(target.dataset.id),
                    'delete-goal': (target) => showDeleteGoalConfirmationModal(target.dataset.id),
                    'generate-report': () => {
                        const period = document.getElementById('report-period')?.value;
                        const year = document.getElementById('report-year')?.value;
                        const month = document.getElementById('report-month')?.value;
                        
                        showToast(`Rapport ${period} généré pour ${month}/${year}`, 'success');
                        setTimeout(() => renderReportCharts(), 100);
                    },
                    'export-report': () => {
                        exportReportToPDF();
                    },
                    'add-investment': showInvestmentModal,
                    'edit-investment-value': (target) => showEditInvestmentValueModal(target.dataset.id),
                    'rename-investment': (target) => showRenameInvestmentModal(target.dataset.id),
                    'edit-investment-category': (target) => showEditInvestmentCategoryModal(target.dataset.id),
                    'show-investment-history': (target) => showInvestmentHistoryModal(target.dataset.id),
                    'add-investment-entry': (target) => showAddInvestmentEntryModal(target.dataset.id),
                    'edit-investment-entry': (target) => showEditInvestmentEntryModal(target.dataset.investmentId, target.dataset.entryId),
                    'delete-investment-entry': (target) => handleDeleteInvestmentEntry(target.dataset.investmentId, target.dataset.entryId),
                    'delete-investment': (target) => showDeleteInvestmentConfirmationModal(target.dataset.id),
                    'show-ocr-modal': showOcrUploadModal,
                    'export-data': exportData,
                    'export-csv': exportTransactionsToCsv,
                    'fetch-crypto-prices': fetchCryptoPrices,
                    'update-exchange-rates': () => fetchExchangeRates(false),
                    'toggle-notifications': () => {
                        const panel = document.getElementById('notification-panel');
                        panel?.classList.toggle('hidden');
                    },
                    'prepare-next-month': prepareNextMonth,
                    'add-budget-category': showAddBudgetCategoryModal,
                    'add-budget-expense': (target) => showBudgetExpenseModal(target.dataset.categoryKey, false),
                    'add-budget-partial': (target) => showBudgetExpenseModal(target.dataset.categoryKey, true)
                };
                
                document.body.addEventListener('click', e => {
                    const target = e.target.closest('[data-action]');
                    if (!target) return;
                    
                    const action = target.dataset.action;
                    const handler = clickHandlers[action];
                    
                    if (handler) {
                        e.preventDefault();
                        try {
                            handler(target);
                        } catch (error) {
                            console.error(`Erreur action ${action}:`, error);
                            showToast(`Erreur: ${error.message}`, 'error');
                        }
                    } else {
                        // Action non reconnue - essayer avec les actions étendues
                        const { id, type, tab } = target.dataset;
                        const extendedActionMap = {
                            'navigate': () => { state.activeTab = tab; render(); },
                            'scan-receipt': showOcrUploadModal,
                            'fetch-crypto-prices': fetchCryptoPrices,
                            'add-transaction': () => showTransactionModal(type),
                            'edit-transaction': () => showTransactionModal(null, id),
                            'add-transfer': showTransferModal,
                            'add-investment': showInvestmentModal,
                            'edit-investment-value': () => showEditInvestmentValueModal(id),
                            'manage-budget': showBudgetModal,
                            'export-data': exportData,
                            'export-csv': exportTransactionsToCsv,
                            'apply-tx-filters': () => {
                                const filterAccount = document.getElementById('filter-account');
                                const filterCategory = document.getElementById('filter-category');
                                const filterTags = document.getElementById('filter-tags');
                                const filterStartDate = document.getElementById('filter-start-date');
                                const filterEndDate = document.getElementById('filter-end-date');
                                
                                if (filterAccount) state.transactionFilters.accountId = filterAccount.value;
                                if (filterCategory) state.transactionFilters.categoryId = filterCategory.value;
                                if (filterTags) state.transactionFilters.tags = filterTags.value;
                                if (filterStartDate) state.transactionFilters.startDate = filterStartDate.value;
                                if (filterEndDate) state.transactionFilters.endDate = filterEndDate.value;
                                render();
                            },
                            'clear-tx-filters': () => {
                                state.transactionFilters = { accountId: '', categoryId: '', tags: '', startDate: '', endDate: '' };
                                render();
                            },
                            'toggle-notifications': () => {
                                const panel = document.getElementById('notification-panel');
                                if (panel) panel.classList.toggle('hidden');
                            },
                            'view-account-dashboard': () => { 
                                state.activeAccountFilterId = id; 
                                state.activeTab = 'dashboard'; 
                                render(); 
                            },
                            'view-account-tx': () => { 
                                state.activeAccountFilterId = id; 
                                state.activeTab = 'transactions'; 
                                render(); 
                            },
                            'clear-global-filter': () => { 
                                state.activeAccountFilterId = null; 
                                render(); 
                            },
                            'toggle-split-details': () => {
                                const element = document.getElementById(`split-details-${id}`);
                                if (element) element.classList.toggle('visible');
                            },
                            // Actions Budget
                            'add-budget-category': showAddBudgetCategoryModal,
                            'add-expense': () => showBudgetExpenseModal(target.dataset.categoryKey, false),
                            'partial-payment': () => showBudgetExpenseModal(target.dataset.categoryKey, true),
                            'update-budget-month': () => {
                                const selector = document.getElementById('budget-month-selector');
                                if (selector) {
                                    state.currentBudgetMonth = selector.value;
                                    render();
                                }
                            },
                            // Actions manquantes pour les confirmations de suppression
                            'confirm-delete-investment': () => {
                                const investmentId = id;
                                const inv = state.investments.find(i => i.id === investmentId);
                                if (!inv) return;

                                // Supprimer toutes les transactions liées
                                state.transactions = state.transactions.filter(tx => tx.linkedTo !== investmentId);
                                
                                // Supprimer l'investissement
                                state.investments = state.investments.filter(i => i.id !== investmentId);
                                
                                closeModal();
                                showToast(`Investissement "${inv.name}" supprimé.`, 'success');
                                fullUpdate();
                            },
                            'confirm-delete-account': () => {
                                const accountId = id;
                                const account = state.accounts.find(a => a.id === accountId);
                                if (!account) return;

                                // Supprimer toutes les transactions liées
                                state.transactions = state.transactions.filter(tx => tx.accountId !== accountId);
                                
                                // Supprimer le compte
                                state.accounts = state.accounts.filter(a => a.id !== accountId);
                                
                                closeModal();
                                showToast(`Compte "${account.name}" supprimé.`, 'success');
                                fullUpdate();
                            },
                            'confirm-delete-transaction': () => {
                                handleDeleteTransaction(id);
                                closeModal();
                            },
                            'confirm-delete-debt': () => {
                                const debtId = id;
                                const debt = state.debts.find(d => d.id === debtId);
                                if (!debt) return;

                                // Supprimer toutes les transactions liées
                                state.transactions = state.transactions.filter(tx => tx.linkedTo !== debtId);
                                
                                // Supprimer la dette
                                state.debts = state.debts.filter(d => d.id !== debtId);
                                
                                closeModal();
                                showToast(`Dette "${debt.name}" supprimée.`, 'success');
                                fullUpdate();
                            },
                            'confirm-delete-claim': () => {
                                const claimId = id;
                                const claim = state.claims.find(c => c.id === claimId);
                                if (!claim) return;

                                // Supprimer toutes les transactions liées
                                state.transactions = state.transactions.filter(tx => tx.linkedTo !== claimId);
                                
                                // Supprimer la créance
                                state.claims = state.claims.filter(c => c.id !== claimId);
                                
                                closeModal();
                                showToast(`Créance "${claim.name}" supprimée.`, 'success');
                                fullUpdate();
                            },
                            'confirm-delete-goal': () => {
                                const goalId = id;
                                const goal = state.goals.find(g => g.id === goalId);
                                if (!goal) return;

                                // Supprimer toutes les transactions liées
                                state.transactions = state.transactions.filter(tx => tx.linkedTo !== goalId);
                                
                                // Supprimer l'objectif
                                state.goals = state.goals.filter(g => g.id !== goalId);
                                
                                closeModal();
                                showToast(`Objectif "${goal.name}" supprimé.`, 'success');
                                fullUpdate();
                            },
                            // Actions pour les tâches et wishlist
                            'toggle-task-done': () => {
                                const taskId = id;
                                const task = state.tasks.find(t => t.id === taskId);
                                if (task) {
                                    task.done = !task.done;
                                    render();
                                }
                            },
                            'edit-task': () => {
                                const taskId = id;
                                const task = state.tasks.find(t => t.id === taskId);
                                if (task) {
                                    const newDescription = prompt('Modifier la tâche:', task.description);
                                    if (newDescription && newDescription.trim()) {
                                        task.description = newDescription.trim();
                                        render();
                                    }
                                }
                            },
                            'delete-task': () => {
                                const taskId = id;
                                state.tasks = state.tasks.filter(t => t.id !== taskId);
                                render();
                            },
                            'edit-wishlist-item': () => {
                                const itemId = id;
                                const item = state.wishlist.find(w => w.id === itemId);
                                if (item) {
                                    showWishlistModal(itemId);
                                }
                            },
                            'delete-wishlist-item': () => {
                                const itemId = id;
                                state.wishlist = state.wishlist.filter(w => w.id !== itemId);
                                render();
                            },
                            'manage-categories': () => {
                                showManageCategoriesModal();
                            },
                            'add-subcategory': () => {
                                const category = e.target.dataset.category;
                                const input = document.getElementById(`new-subcategory-${category}`);
                                const subcategoryName = input.value.trim();
                                
                                if (subcategoryName) {
                                    // Déterminer si c'est une catégorie de dépense ou de revenu
                                    if (state.categories.expense[category]) {
                                        if (!state.categories.expense[category].includes(subcategoryName)) {
                                            state.categories.expense[category].push(subcategoryName);
                                            saveState();
                                            showManageCategoriesModal(); // Rafraîchir la modale
                                            showToast(`Sous-catégorie "${subcategoryName}" ajoutée`, 'success');
                                        } else {
                                            showToast('Cette sous-catégorie existe déjà', 'error');
                                        }
                                    } else if (state.categories.income[category]) {
                                        if (!state.categories.income[category].includes(subcategoryName)) {
                                            state.categories.income[category].push(subcategoryName);
                                            saveState();
                                            showManageCategoriesModal(); // Rafraîchir la modale
                                            showToast(`Sous-catégorie "${subcategoryName}" ajoutée`, 'success');
                                        } else {
                                            showToast('Cette sous-catégorie existe déjà', 'error');
                                        }
                                    }
                                }
                            },
                            'delete-subcategory': () => {
                                const category = e.target.dataset.category;
                                const subcategory = e.target.dataset.subcategory;
                                
                                if (confirm(`Supprimer la sous-catégorie "${subcategory}" ?`)) {
                                    if (state.categories.expense[category]) {
                                        state.categories.expense[category] = state.categories.expense[category].filter(sub => sub !== subcategory);
                                    } else if (state.categories.income[category]) {
                                        state.categories.income[category] = state.categories.income[category].filter(sub => sub !== subcategory);
                                    }
                                    saveState();
                                    showManageCategoriesModal(); // Rafraîchir la modale
                                    showToast(`Sous-catégorie "${subcategory}" supprimée`, 'success');
                                }
                            },
                            'add-main-category': () => {
                                const type = document.getElementById('new-category-type').value;
                                const name = document.getElementById('new-category-name').value.trim();
                                
                                if (name) {
                                    if (!state.categories[type][name]) {
                                        state.categories[type][name] = [];
                                        saveState();
                                        showManageCategoriesModal(); // Rafraîchir la modale
                                        showToast(`Catégorie "${name}" ajoutée`, 'success');
                                    } else {
                                        showToast('Cette catégorie existe déjà', 'error');
                                    }
                                }
                            }
                        };

                        if (extendedActionMap[action]) {
                            try {
                                extendedActionMap[action]();
                            } catch (error) {
                                console.error(`Erreur action étendue ${action}:`, error);
                                showToast(`Erreur: ${error.message}`, 'error');
                            }
                        } else {
                            console.warn(`Action non gérée: ${action}`);
                        }
                    }
                });

                // Form submissions - FORCE preventDefault on ALL forms
                document.body.addEventListener('submit', e => {
                    console.log('=== FORM SUBMISSION INTERCEPTED ===');
                    console.log('Form ID:', e.target.id);
                    console.log('Form element:', e.target);
                    console.log('Event type:', e.type);
                    
                    // ALWAYS prevent default first
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const formMap = {
                        'ocr-validation-form': handleOcrValidationSubmit,
                        'account-form': handleAccountSubmit,
                        'edit-account-form': (e) => handleAccountSubmit(e, true),
                        'transaction-form': (e) => handleTransactionSubmit(e, false),
                        'edit-transaction-form': (e) => handleTransactionSubmit(e, true),
                        'goal-form': handleGoalSubmit,
                        'manage-goal-form': handleManageGoalSubmit,
                        'manual-contribution-form': handleAddManualContributionSubmit,
                        'investment-entry-form': handleInvestmentEntrySubmit,
                        'edit-investment-entry-form': handleEditInvestmentEntrySubmit,
                        'rename-investment-form': handleRenameInvestmentSubmit,
                        'edit-investment-value-form': handleEditInvestmentValueSubmit,
                        'edit-investment-category-form': handleEditInvestmentCategorySubmit,
                        'debt-form': handleDebtSubmit,
                        'debt-repayment-form': handleDebtRepaymentSubmit,
                        'claim-form': handleClaimSubmit,
                        'claim-payment-form': handleClaimPaymentSubmit,
                        'split-transaction-form': handleSplitTransactionSubmit,
                        'add-budget-category-form': handleAddBudgetCategorySubmit,
                        'budget-expense-form': handleBudgetExpenseSubmit,
                        'investment-form': handleInvestmentSubmit,
                        'planner-add-task-form': (e) => {
                            const form = e.target;
                            const description = form.querySelector('[name="description"]').value.trim();
                            if (description) {
                                state.tasks.push({ id: generateId(), description, done: false, quadrant: 'inbox' });
                                form.reset();
                                fullUpdate();
                            }
                        },
                        'task-form': handleTaskSubmit,
                        'wishlist-item-form': handleWishlistItemSubmit,
                    };

                    if (formMap[e.target.id]) {
                        console.log('✓ Handler found for:', e.target.id);
                        try {
                            formMap[e.target.id](e);
                            console.log('✓ Handler executed successfully');
                        } catch (error) {
                            console.error('✗ Error in form handler:', error);
                            showToast('Erreur lors de la soumission', 'error');
                        }
                    } else {
                        console.log('✗ No handler found for form:', e.target.id);
                        console.log('Available handlers:', Object.keys(formMap));
                    }
                    
                    console.log('=== END FORM SUBMISSION ===');
                    return false;
                });

                // File import
                document.body.addEventListener('change', e => {
                    if (e.target.id === 'import-file') {
                        importData(e.target.files[0]);
                    }
                });

                // Forecast sliders
                document.body.addEventListener('input', e => {
                    const targetId = e.target.id;
                    if (['additional-savings', 'annual-return', 'additional-income'].includes(targetId)) {
                        renderForecastChart();
                    }
                });

                // Drag and drop for tasks
                document.body.addEventListener('dragstart', e => {
                    const taskEl = e.target.closest('[data-action="drag-task"]');
                    if (taskEl) {
                        e.dataTransfer.setData('text/plain', taskEl.dataset.taskId);
                        e.dataTransfer.effectAllowed = 'move';
                    }
                });

                document.body.addEventListener('dragover', e => {
                    const dropZone = e.target.closest('[data-quadrant]');
                    if (dropZone) {
                        e.preventDefault();
                        dropZone.classList.add('drag-over');
                    }
                });

                document.body.addEventListener('dragleave', e => {
                    const dropZone = e.target.closest('[data-quadrant]');
                    if (dropZone) {
                        dropZone.classList.remove('drag-over');
                    }
                });

                document.body.addEventListener('drop', e => {
                    const dropZone = e.target.closest('[data-quadrant]');
                    if (dropZone) {
                        e.preventDefault();
                        dropZone.classList.remove('drag-over');
                        const taskId = e.dataTransfer.getData('text/plain');
                        const newQuadrant = dropZone.dataset.quadrant;
                        const task = state.tasks.find(t => t.id === taskId);

                        if (task && task.quadrant !== newQuadrant) {
                            task.quadrant = newQuadrant;
                            fullUpdate();
                        }
                    }
                });
            };

            const handleQuickAdd = (input) => {
                if (!input) return;

                let prefillData = {
                    description: input,
                    originalAmount: '',
                    originalCurrency: state.baseCurrency,
                    date: today(),
                    recurring: false,
                    type: 'expense',
                    linkedTo: null
                };

                const amountRegex = /(.*?)\s+([\d.,]+)\s*([A-Z]{3})?$/;
                const match = input.match(amountRegex);

                if (match) {
                    prefillData.description = match[1].trim();
                    prefillData.originalAmount = parseFloat(match[2].replace(',', '.'));
                    if (match[3] && state.exchangeRates[match[3].toUpperCase()]) {
                        prefillData.originalCurrency = match[3].toUpperCase();
                    }
                }

                const lowerCaseDescription = prefillData.description.toLowerCase();
                for (const keyword in quickAddKeywordMap) {
                    if (lowerCaseDescription.includes(keyword)) {
                        Object.assign(prefillData, quickAddKeywordMap[keyword]);
                        break;
                    }
                }

                const allLinkableItems = [
                    ...state.debts.map(d => ({ id: d.id, name: d.name, type: 'debt' })),
                    ...state.claims.map(c => ({ id: c.id, name: c.name, type: 'claim' })),
                    ...state.investments.map(i => ({ id: i.id, name: i.name, type: 'investment' }))
                ];

                for (const item of allLinkableItems) {
                    if (lowerCaseDescription.includes(item.name.toLowerCase())) {
                        prefillData.linkedTo = item.id;

                        if (item.type === 'debt') {
                            prefillData.category = 'Dettes & Créances';
                            prefillData.subCategory = 'Remboursement de prêt';
                        } else if (item.type === 'claim') {
                            prefillData.category = 'Autres Revenus';
                            prefillData.subCategory = 'Remboursement de créance';
                            prefillData.type = 'income';
                        } else if (item.type === 'investment') {
                            prefillData.category = 'Investissement';
                            prefillData.subCategory = "Achat d'actif";
                        }

                        break;
                    }
                }

                showTransactionModal(prefillData.type, null, prefillData);
            };

            // ========== INIT APP ========== //
            // Nettoyage avant fermeture de la page
            window.addEventListener('beforeunload', () => {
                destroyAllCharts();
                if (currentToast) {
                    currentToast.remove();
                }
            });
            
            const init = async () => {
                try {
                    loadState();
                    
                    // Tentative de récupération des taux de change avec fallback
                    try {
                        await fetchExchangeRates(true); // Silent au démarrage
                    } catch (error) {
                        console.warn('Impossible de récupérer les taux de change au démarrage:', error);
                    }
                    
                    // Mise à jour périodique des taux (toutes les 4h)
                    setInterval(() => fetchExchangeRates(true), 4 * 60 * 60 * 1000);
                    
                    setupEventListeners();
                    render();
                    
                    console.log('Application initialisée avec succès');
                    
                    
                } catch (error) {
                    console.error('Erreur lors de l\'initialisation:', error);
                    showToast('Erreur d\'initialisation de l\'application', 'error');
                }
            };

            init();
        });
