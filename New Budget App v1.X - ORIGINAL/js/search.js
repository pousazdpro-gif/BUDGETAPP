// ========== GLOBAL SEARCH MODULE ========== //

// Fonction pour effectuer la recherche globale
const performGlobalSearch = (query) => {
    if (!query || query.trim().length < 2) {
        return { transactions: [], accounts: [], investments: [], goals: [], tasks: [] };
    }

    const searchTerm = query.toLowerCase().trim();
    const results = {
        transactions: [],
        accounts: [],
        investments: [],
        goals: [],
        tasks: []
    };

    // Recherche dans les transactions
    if (state.transactions) {
        results.transactions = state.transactions.filter(tx => {
            return tx.description.toLowerCase().includes(searchTerm) ||
                   tx.category.toLowerCase().includes(searchTerm) ||
                   tx.subCategory.toLowerCase().includes(searchTerm) ||
                   (tx.tags && tx.tags.some(tag => tag.toLowerCase().includes(searchTerm))) ||
                   (tx.notes && tx.notes.toLowerCase().includes(searchTerm));
        }).slice(0, 10); // Limiter à 10 résultats
    }

    // Recherche dans les comptes
    if (state.accounts) {
        results.accounts = state.accounts.filter(acc =>
            acc.name.toLowerCase().includes(searchTerm)
        ).slice(0, 5);
    }

    // Recherche dans les investissements
    if (state.investments) {
        results.investments = state.investments.filter(inv =>
            inv.name.toLowerCase().includes(searchTerm) ||
            (inv.ticker && inv.ticker.toLowerCase().includes(searchTerm))
        ).slice(0, 5);
    }

    // Recherche dans les objectifs
    if (state.goals) {
        results.goals = state.goals.filter(goal =>
            goal.name.toLowerCase().includes(searchTerm) ||
            (goal.description && goal.description.toLowerCase().includes(searchTerm))
        ).slice(0, 5);
    }

    // Recherche dans les tâches
    if (state.tasks) {
        results.tasks = state.tasks.filter(task =>
            task.title.toLowerCase().includes(searchTerm) ||
            (task.description && task.description.toLowerCase().includes(searchTerm))
        ).slice(0, 5);
    }

    return results;
};

// Fonction pour afficher les résultats de recherche
const renderSearchResults = (results) => {
    const searchResultsContainer = document.getElementById('global-search-results');
    if (!searchResultsContainer) return;

    if (!results || (results.transactions.length === 0 && results.accounts.length === 0 &&
        results.investments.length === 0 && results.goals.length === 0 && results.tasks.length === 0)) {
        searchResultsContainer.innerHTML = '<div class="p-4 text-gray-500">Aucun résultat trouvé</div>';
        return;
    }

    let html = '';

    // Résultats des transactions
    if (results.transactions.length > 0) {
        html += `
            <div class="mb-4">
                <h3 class="font-semibold text-gray-700 mb-2 flex items-center">
                    <i data-lucide="receipt" class="w-4 h-4 mr-2"></i>
                    Transactions (${results.transactions.length})
                </h3>
                <div class="space-y-1">
        `;

        results.transactions.forEach(tx => {
            const account = state.accounts.find(acc => acc.id === tx.accountId);
            const accountName = account ? account.name : 'Compte inconnu';
            html += `
                <div class="p-2 hover:bg-gray-50 rounded cursor-pointer search-result-item"
                     data-type="transaction" data-id="${tx.id}">
                    <div class="flex justify-between items-center">
                        <div>
                            <div class="font-medium">${tx.description}</div>
                            <div class="text-sm text-gray-500">${accountName} • ${tx.category}${tx.subCategory ? ' • ' + tx.subCategory : ''}</div>
                        </div>
                        <div class="text-right">
                            <div class="font-medium ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}">
                                ${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.originalAmount)} ${tx.originalCurrency}
                            </div>
                            <div class="text-sm text-gray-500">${formatDate(tx.date)}</div>
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div></div>';
    }

    // Résultats des comptes
    if (results.accounts.length > 0) {
        html += `
            <div class="mb-4">
                <h3 class="font-semibold text-gray-700 mb-2 flex items-center">
                    <i data-lucide="credit-card" class="w-4 h-4 mr-2"></i>
                    Comptes (${results.accounts.length})
                </h3>
                <div class="space-y-1">
        `;

        results.accounts.forEach(acc => {
            html += `
                <div class="p-2 hover:bg-gray-50 rounded cursor-pointer search-result-item"
                     data-type="account" data-id="${acc.id}">
                    <div class="flex justify-between items-center">
                        <div>
                            <div class="font-medium">${acc.name}</div>
                            <div class="text-sm text-gray-500">${acc.currency}</div>
                        </div>
                        <div class="text-right">
                            <div class="font-medium">${formatCurrency(calculateAccountBalance(acc.id))}</div>
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div></div>';
    }

    // Résultats des investissements
    if (results.investments.length > 0) {
        html += `
            <div class="mb-4">
                <h3 class="font-semibold text-gray-700 mb-2 flex items-center">
                    <i data-lucide="trending-up" class="w-4 h-4 mr-2"></i>
                    Investissements (${results.investments.length})
                </h3>
                <div class="space-y-1">
        `;

        results.investments.forEach(inv => {
            const details = calculateInvestmentDetails(inv.id);
            html += `
                <div class="p-2 hover:bg-gray-50 rounded cursor-pointer search-result-item"
                     data-type="investment" data-id="${inv.id}">
                    <div class="flex justify-between items-center">
                        <div>
                            <div class="font-medium">${inv.name}</div>
                            <div class="text-sm text-gray-500">${inv.type}${inv.ticker ? ' • ' + inv.ticker : ''}</div>
                        </div>
                        <div class="text-right">
                            <div class="font-medium">${formatCurrency(inv.currentValue * details.currentQuantity)}</div>
                            <div class="text-sm text-gray-500">${details.currentQuantity} unités</div>
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div></div>';
    }

    // Résultats des objectifs
    if (results.goals.length > 0) {
        html += `
            <div class="mb-4">
                <h3 class="font-semibold text-gray-700 mb-2 flex items-center">
                    <i data-lucide="target" class="w-4 h-4 mr-2"></i>
                    Objectifs (${results.goals.length})
                </h3>
                <div class="space-y-1">
        `;

        results.goals.forEach(goal => {
            const progress = calculateGoalProgress(goal.id);
            const percentage = goal.targetAmount > 0 ? (progress / goal.targetAmount * 100).toFixed(1) : 0;

            html += `
                <div class="p-2 hover:bg-gray-50 rounded cursor-pointer search-result-item"
                     data-type="goal" data-id="${goal.id}">
                    <div class="flex justify-between items-center">
                        <div>
                            <div class="font-medium">${goal.name}</div>
                            <div class="text-sm text-gray-500">${goal.targetAmount ? formatCurrency(goal.targetAmount) + ' • ' + percentage + '%' : 'Sans objectif'}</div>
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div></div>';
    }

    // Résultats des tâches
    if (results.tasks.length > 0) {
        html += `
            <div class="mb-4">
                <h3 class="font-semibold text-gray-700 mb-2 flex items-center">
                    <i data-lucide="check-square" class="w-4 h-4 mr-2"></i>
                    Tâches (${results.tasks.length})
                </h3>
                <div class="space-y-1">
        `;

        results.tasks.forEach(task => {
            const priorityColors = {
                'high': 'text-red-600',
                'medium': 'text-yellow-600',
                'low': 'text-green-600'
            };

            html += `
                <div class="p-2 hover:bg-gray-50 rounded cursor-pointer search-result-item"
                     data-type="task" data-id="${task.id}">
                    <div class="flex justify-between items-center">
                        <div>
                            <div class="font-medium">${task.title}</div>
                            <div class="text-sm text-gray-500 ${priorityColors[task.priority] || 'text-gray-500'}">
                                ${task.priority} • ${task.quadrant}
                            </div>
                        </div>
                        <div class="text-sm text-gray-500">
                            ${task.completed ? 'Terminée' : 'En cours'}
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div></div>';
    }

    searchResultsContainer.innerHTML = html;

    // Ajouter les event listeners pour la navigation
    document.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', handleSearchResultClick);
    });

    // Réinitialiser les icônes Lucide
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
};

// Gestionnaire de clic sur un résultat de recherche
const handleSearchResultClick = (e) => {
    const item = e.currentTarget;
    const type = item.dataset.type;
    const id = item.dataset.id;

    // Fermer les résultats de recherche
    document.getElementById('global-search-results').innerHTML = '';

    // Naviguer vers l'élément correspondant
    switch (type) {
        case 'transaction':
            // Aller à l'onglet Transactions et mettre en évidence la transaction
            switchToTab('transactions');
            setTimeout(() => {
                const txElement = document.querySelector(`[data-transaction-id="${id}"]`);
                if (txElement) {
                    txElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    txElement.classList.add('bg-yellow-100');
                    setTimeout(() => txElement.classList.remove('bg-yellow-100'), 3000);
                }
            }, 100);
            break;

        case 'account':
            // Aller à l'onglet Comptes et mettre en évidence le compte
            switchToTab('accounts');
            setTimeout(() => {
                const accElement = document.querySelector(`[data-account-id="${id}"]`);
                if (accElement) {
                    accElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    accElement.classList.add('bg-blue-100');
                    setTimeout(() => accElement.classList.remove('bg-blue-100'), 3000);
                }
            }, 100);
            break;

        case 'investment':
            // Aller à l'onglet Investissements et mettre en évidence l'investissement
            switchToTab('investments');
            setTimeout(() => {
                const invElement = document.querySelector(`[data-investment-id="${id}"]`);
                if (invElement) {
                    invElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    invElement.classList.add('bg-green-100');
                    setTimeout(() => invElement.classList.remove('bg-green-100'), 3000);
                }
            }, 100);
            break;

        case 'goal':
            // Aller à l'onglet Objectifs et mettre en évidence l'objectif
            switchToTab('goals');
            setTimeout(() => {
                const goalElement = document.querySelector(`[data-goal-id="${id}"]`);
                if (goalElement) {
                    goalElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    goalElement.classList.add('bg-purple-100');
                    setTimeout(() => goalElement.classList.remove('bg-purple-100'), 3000);
                }
            }, 100);
            break;

        case 'task':
            // Aller à l'onglet Planificateur et mettre en évidence la tâche
            switchToTab('planner');
            setTimeout(() => {
                const taskElement = document.querySelector(`[data-task-id="${id}"]`);
                if (taskElement) {
                    taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    taskElement.classList.add('bg-indigo-100');
                    setTimeout(() => taskElement.classList.remove('bg-indigo-100'), 3000);
                }
            }, 100);
            break;
    }
};

// Event listener pour la recherche globale
const initGlobalSearch = () => {
    const searchInput = document.getElementById('global-search');
    const searchResultsContainer = document.createElement('div');
    searchResultsContainer.id = 'global-search-results';
    searchResultsContainer.className = 'absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto hidden';

    if (searchInput) {
        searchInput.parentNode.appendChild(searchResultsContainer);

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value;
            if (query.trim()) {
                const results = performGlobalSearch(query);
                renderSearchResults(results);
                searchResultsContainer.classList.remove('hidden');
            } else {
                searchResultsContainer.classList.add('hidden');
            }
        });

        // Fermer les résultats quand on clique ailleurs
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchResultsContainer.contains(e.target)) {
                searchResultsContainer.classList.add('hidden');
            }
        });
    }
};

// Initialiser la recherche globale au chargement de l'application
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initGlobalSearch, 1000);
});
