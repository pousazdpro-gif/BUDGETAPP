// ========== RENDER MODULE ========== //

// Rendu de la sidebar
const renderSidebar = () => {
    const nav = document.getElementById('sidebar-nav');
    if (!nav) return;

    const tabs = [
        { id: 'dashboard', icon: 'home', label: 'Tableau de bord' },
        { id: 'accounts', icon: 'credit-card', label: 'Comptes' },
        { id: 'transactions', icon: 'list', label: 'Transactions' },
        { id: 'purchases', icon: 'shopping-cart', label: 'Achats' },
        { id: 'investments', icon: 'trending-up', label: 'Investissements' },
        { id: 'debts', icon: 'minus-circle', label: 'Dettes' },
        { id: 'claims', icon: 'plus-circle', label: 'Créances' },
        { id: 'goals', icon: 'target', label: 'Objectifs' },
        { id: 'budget', icon: 'pie-chart', label: 'Budget' },
        { id: 'reports', icon: 'bar-chart-3', label: 'Rapports' },
        { id: 'planner', icon: 'calendar', label: 'Planificateur' },
        { id: 'settings', icon: 'settings', label: 'Paramètres' }
    ];

    nav.innerHTML = tabs.map(tab => `
        <button data-action="show-tab" data-tab="${tab.id}" 
                class="w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                    state.activeTab === tab.id ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
                }">
            <i data-lucide="${tab.icon}" class="w-5 h-5 mr-3"></i>
            ${tab.label}
        </button>
    `).join('');
};

// Rendu du contenu principal
const renderContent = () => {
    const content = document.getElementById('main-content');
    if (!content) return;

    switch (state.activeTab) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'accounts':
            renderAccounts();
            break;
        case 'purchases':
            renderPurchases();
            break;
        case 'investments':
            renderInvestments();
            break;
        case 'debts':
            renderDebts();
            break;
        case 'claims':
            renderClaims();
            break;
        case 'goals':
            renderGoals();
            break;
        case 'budget':
            renderBudget();
            break;
        case 'reports':
            renderReports();
            break;
        case 'planner':
            renderPlanner();
            break;
        case 'settings':
            renderSettings();
            break;
        default:
            renderDashboard();
    }
};

// Rendu du tableau de bord
const renderDashboard = () => {
    const content = document.getElementById('main-content');
    if (!content) return;

    const netWorth = calculateNetWorth();
    const totalAccounts = (state.accounts || []).reduce((sum, acc) => sum + calculateAccountBalance(acc.id), 0);
    const totalInvestments = calculateTotalInvestments();
    const totalDebts = calculateTotalDebts();

    content.innerHTML = `
        <div class="p-6">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">Tableau de bord</h2>
            
            <!-- Cartes de résumé -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <i data-lucide="wallet" class="w-8 h-8 text-green-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">Valeur nette</p>
                            <p class="text-2xl font-semibold text-gray-900">${formatCurrency(netWorth)}</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <i data-lucide="credit-card" class="w-8 h-8 text-blue-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">Comptes</p>
                            <p class="text-2xl font-semibold text-gray-900">${formatCurrency(totalAccounts)}</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <i data-lucide="trending-up" class="w-8 h-8 text-purple-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">Investissements</p>
                            <p class="text-2xl font-semibold text-gray-900">${formatCurrency(totalInvestments)}</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <i data-lucide="minus-circle" class="w-8 h-8 text-red-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">Dettes</p>
                            <p class="text-2xl font-semibold text-gray-900">${formatCurrency(totalDebts)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Actions rapides -->
            <div class="bg-white rounded-lg shadow p-6 mb-8">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button data-action="show-transaction-modal" class="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <i data-lucide="plus" class="w-6 h-6 text-indigo-600 mb-2"></i>
                        <span class="text-sm font-medium text-gray-900">Transaction</span>
                    </button>
                    <button data-action="show-account-modal" class="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <i data-lucide="credit-card" class="w-6 h-6 text-blue-600 mb-2"></i>
                        <span class="text-sm font-medium text-gray-900">Compte</span>
                    </button>
                    <button data-action="show-investment-modal" class="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <i data-lucide="trending-up" class="w-6 h-6 text-purple-600 mb-2"></i>
                        <span class="text-sm font-medium text-gray-900">Investissement</span>
                    </button>
                    <button data-action="fetch-exchange-rates" class="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <i data-lucide="refresh-cw" class="w-6 h-6 text-green-600 mb-2"></i>
                        <span class="text-sm font-medium text-gray-900">Taux</span>
                    </button>
                </div>
            </div>

            <!-- Graphiques -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Évolution patrimoniale</h3>
                    <canvas id="netWorthChart" width="400" height="200"></canvas>
                </div>
                
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Répartition des actifs</h3>
                    <canvas id="assetsPieChart" width="400" height="200"></canvas>
                </div>
            </div>
        </div>
    `;

    // Créer les graphiques après le rendu
    setTimeout(() => {
        createNetWorthChart();
        createAssetsPieChart();
    }, 100);
};

// Rendu des comptes
const renderAccounts = () => {
    const content = document.getElementById('main-content');
    if (!content) return;

    content.innerHTML = `
        <div class="p-6">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-gray-900">Comptes</h2>
                <button data-action="show-account-modal" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                    <i data-lucide="plus" class="w-4 h-4 mr-2 inline"></i>
                    Nouveau compte
                </button>
            </div>

            <div class="bg-white rounded-lg shadow overflow-hidden">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solde</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${(state.accounts || []).map(account => `
                            <tr>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${account.name}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${account.type}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formatCurrency(calculateAccountBalance(account.id))}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button data-action="edit-account" data-id="${account.id}" class="text-indigo-600 hover:text-indigo-900 mr-3">Modifier</button>
                                    <button data-action="delete-account" data-id="${account.id}" class="text-red-600 hover:text-red-900">Supprimer</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ${(state.accounts || []).length === 0 ? '<div class="p-6 text-center text-gray-500">Aucun compte créé</div>' : ''}
            </div>
        </div>
    `;
};

// Rendu des transactions
const renderTransactions = () => {
    const content = document.getElementById('main-content');
    if (!content) return;

    const transactions = getTransactionsForFilter().sort((a, b) => new Date(b.date) - new Date(a.date));

    content.innerHTML = `
        <div class="p-6">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-gray-900">Transactions</h2>
                <button data-action="show-transaction-modal" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                    <i data-lucide="plus" class="w-4 h-4 mr-2 inline"></i>
                    Nouvelle transaction
                </button>
            </div>

            <div class="bg-white rounded-lg shadow overflow-hidden">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${transactions.slice(0, 50).map(tx => `
                            <tr>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${tx.date}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${tx.description}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${tx.category}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}">
                                    ${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.originalAmount, tx.originalCurrency)}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button data-action="edit-transaction" data-id="${tx.id}" class="text-indigo-600 hover:text-indigo-900 mr-3">Modifier</button>
                                    <button data-action="delete-transaction" data-id="${tx.id}" class="text-red-600 hover:text-red-900">Supprimer</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ${transactions.length === 0 ? '<div class="p-6 text-center text-gray-500">Aucune transaction</div>' : ''}
            </div>
        </div>
    `;
};

// Fonctions de création de graphiques (simplifiées)
const createNetWorthChart = () => {
    const ctx = document.getElementById('netWorthChart');
    if (!ctx || !state.netWorthHistory) return;

    const data = state.netWorthHistory.slice(-30); // 30 derniers points
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.date),
            datasets: [{
                label: 'Valeur nette',
                data: data.map(d => d.netWorth),
                borderColor: 'rgb(99, 102, 241)',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
};

const createAssetsPieChart = () => {
    const ctx = document.getElementById('assetsPieChart');
    if (!ctx) return;

    const totalAccounts = (state.accounts || []).reduce((sum, acc) => sum + Math.max(0, calculateAccountBalance(acc.id)), 0);
    const totalInvestments = calculateTotalInvestments();
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Comptes', 'Investissements'],
            datasets: [{
                data: [totalAccounts, totalInvestments],
                backgroundColor: ['#3B82F6', '#8B5CF6']
            }]
        },
        options: {
            responsive: true
        }
    });
};

// Rendu des autres sections (versions simplifiées)
const renderInvestments = () => {
    const content = document.getElementById('main-content');
    if (!content) return;
    content.innerHTML = `<div class="p-6"><h2 class="text-2xl font-bold text-gray-900">Investissements</h2><p class="text-gray-600 mt-4">Section en cours de développement...</p></div>`;
};

const renderDebts = () => {
    const content = document.getElementById('main-content');
    if (!content) return;
    content.innerHTML = `<div class="p-6"><h2 class="text-2xl font-bold text-gray-900">Dettes</h2><p class="text-gray-600 mt-4">Section en cours de développement...</p></div>`;
};

const renderClaims = () => {
    const content = document.getElementById('main-content');
    if (!content) return;
    content.innerHTML = `<div class="p-6"><h2 class="text-2xl font-bold text-gray-900">Créances</h2><p class="text-gray-600 mt-4">Section en cours de développement...</p></div>`;
};

const renderGoals = () => {
    const content = document.getElementById('main-content');
    if (!content) return;
    content.innerHTML = `<div class="p-6"><h2 class="text-2xl font-bold text-gray-900">Objectifs</h2><p class="text-gray-600 mt-4">Section en cours de développement...</p></div>`;
};

const renderBudget = () => {
    const content = document.getElementById('main-content');
    if (!content) return;
    content.innerHTML = `<div class="p-6"><h2 class="text-2xl font-bold text-gray-900">Budget</h2><p class="text-gray-600 mt-4">Section en cours de développement...</p></div>`;
};

const renderReports = () => {
    const content = document.getElementById('main-content');
    if (!content) return;
    content.innerHTML = `<div class="p-6"><h2 class="text-2xl font-bold text-gray-900">Rapports</h2><p class="text-gray-600 mt-4">Section en cours de développement...</p></div>`;
};

const renderPlanner = () => {
    const content = document.getElementById('main-content');
    if (!content) return;
    content.innerHTML = `<div class="p-6"><h2 class="text-2xl font-bold text-gray-900">Planificateur</h2><p class="text-gray-600 mt-4">Section en cours de développement...</p></div>`;
};

const renderSettings = () => {
    const content = document.getElementById('main-content');
    if (!content) return;
    content.innerHTML = `
        <div class="p-6">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">Paramètres</h2>
            <div class="bg-white rounded-lg shadow p-6">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Devise de base</label>
                        <select id="base-currency" class="w-full p-2 border border-gray-300 rounded-lg">
                            <option value="CHF" ${state.baseCurrency === 'CHF' ? 'selected' : ''}>CHF</option>
                            <option value="EUR" ${state.baseCurrency === 'EUR' ? 'selected' : ''}>EUR</option>
                            <option value="USD" ${state.baseCurrency === 'USD' ? 'selected' : ''}>USD</option>
                        </select>
                    </div>
                    <div class="flex space-x-4">
                        <button data-action="export-data" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                            Exporter les données
                        </button>
                        <button data-action="export-csv" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                            Exporter CSV
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
};

// Rendu de la page des achats
const renderPurchases = () => {
    const content = document.getElementById('main-content');
    if (!content) return;

    const purchases = getAllPurchases();
    const purchasesWithPromotions = getPurchasesWithPromotions();
    const recentPurchases = getRecentPurchases(7); // Derniers 7 jours

    content.innerHTML = `
        <div class="p-6">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-gray-900">Gestion des Achats</h2>
                <div class="flex space-x-2">
                    <button id="add-purchase-btn" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2">
                        <i data-lucide="plus" class="w-4 h-4"></i>
                        <span>Ajouter un achat</span>
                    </button>
                    <button id="generate-shopping-list-btn" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
                        <i data-lucide="shopping-bag" class="w-4 h-4"></i>
                        <span>Générer liste de courses</span>
                    </button>
                </div>
            </div>

            <!-- Résumé des achats -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <i data-lucide="shopping-cart" class="w-8 h-8 text-blue-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">Total achats</p>
                            <p class="text-2xl font-semibold text-gray-900">${purchases.length}</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <i data-lucide="tag" class="w-8 h-8 text-green-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">Avec promotions</p>
                            <p class="text-2xl font-semibold text-gray-900">${purchasesWithPromotions.length}</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <i data-lucide="clock" class="w-8 h-8 text-orange-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">Cette semaine</p>
                            <p class="text-2xl font-semibold text-gray-900">${recentPurchases.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Onglets pour filtrer les achats -->
            <div class="bg-white rounded-lg shadow mb-6">
                <div class="border-b border-gray-200">
                    <nav class="flex space-x-8 px-6">
                        <button id="all-purchases-tab" class="py-4 px-1 border-b-2 border-indigo-500 text-indigo-600 font-medium text-sm">
                            Tous les achats
                        </button>
                        <button id="promotions-tab" class="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm">
                            Promotions
                        </button>
                        <button id="recent-tab" class="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm">
                            Récents (7j)
                        </button>
                    </nav>
                </div>

                <!-- Contenu des achats -->
                <div id="purchases-content" class="p-6">
                    ${renderPurchasesList(purchases)}
                </div>
            </div>

            <!-- Section liste de courses générée -->
            <div id="shopping-list-section" class="bg-white rounded-lg shadow hidden">
                <div class="p-6 border-b border-gray-200">
                    <h3 class="text-lg font-semibold">Liste de courses suggérée</h3>
                    <p class="text-gray-600 text-sm">Basée sur vos achats récents</p>
                </div>
                <div id="shopping-list-content" class="p-6">
                </div>
            </div>
        </div>
    `;

    // Ajouter les event listeners
    setTimeout(() => {
        initPurchasesEvents();
    }, 100);
};
