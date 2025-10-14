// =====================================================
// RENDER FUNCTIONS - Partie 1
// =====================================================

// Fonction principale de rendu
const render = () => {
    renderSidebar();
    renderContent();
    renderNotifications();
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
};

// Rendu de la sidebar
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

// Rendu du contenu principal
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
        dashboard: () => { content.innerHTML = filterBanner + renderDashboard(); renderDashboardCharts(); },
        accounts: () => content.innerHTML = filterBanner + renderAccounts(),
        transactions: () => content.innerHTML = filterBanner + renderTransactions(),
        budget: () => content.innerHTML = filterBanner + renderBudget(),
        investments: () => content.innerHTML = filterBanner + renderInvestments(),
        debts: () => content.innerHTML = filterBanner + renderDebts(),
        claims: () => content.innerHTML = filterBanner + renderClaims(),
        goals: () => content.innerHTML = filterBanner + renderGoals(),
        planner: () => content.innerHTML = filterBanner + renderPlanner(),
        reports: () => { content.innerHTML = filterBanner + renderReports(); renderReportCharts(); },
        forecasts: () => { content.innerHTML = filterBanner + renderForecasts(); renderForecastChart(); },
        settings: () => content.innerHTML = filterBanner + renderSettings(),
    };

    (renderMap[state.activeTab] || renderMap.dashboard)();
};

// Rendu du dashboard
const renderDashboard = () => {
    if (state.activeAccountFilterId) {
        return renderFilteredDashboard();
    }

    const netWorth = calculateNetWorth();
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthlyTransactions = state.transactions.filter(t => t.date >= firstDayOfMonth);
    const monthlyExpenses = monthlyTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
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
            <button data-action="scan-receipt" class="bg-amber-500 text-white py-2 px-4 rounded-lg hover:bg-amber-600 flex items-center space-x-2">
                <i data-lucide="receipt"></i><span>Scanner un Ticket</span>
            </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
            <div class="bg-white p-6 rounded-lg shadow">
                <div class="text-sm text-gray-500 mb-1">Patrimoine Net</div>
                <div class="text-2xl font-bold text-indigo-600">${formatCurrency(netWorth)}</div>
            </div>
            <div class="bg-white p-6 rounded-lg shadow">
                <div class="text-sm text-gray-500 mb-1">Comptes</div>
                <div class="text-2xl font-bold">${formatCurrency(state.accounts.reduce((sum, acc) => sum + calculateAccountBalance(acc.id), 0))}</div>
            </div>
            <div class="bg-white p-6 rounded-lg shadow">
                <div class="text-sm text-gray-500 mb-1">Investissements</div>
                <div class="text-2xl font-bold text-green-600">${formatCurrency(calculateTotalInvestments())}</div>
            </div>
            <div class="bg-white p-6 rounded-lg shadow">
                <div class="text-sm text-gray-500 mb-1">Dépenses du mois</div>
                <div class="text-2xl font-bold text-red-600">${formatCurrency(monthlyExpenses)}</div>
                <div class="text-xs text-gray-400">Budget: ${formatCurrency(totalBudget)}</div>
            </div>
            <div class="bg-white p-6 rounded-lg shadow">
                <div class="text-sm text-gray-500 mb-1">Dettes</div>
                <div class="text-2xl font-bold text-orange-600">${formatCurrency(calculateTotalDebts())}</div>
            </div>
        </div>
        ${goalsPreview ? `
        <div class="bg-white p-6 rounded-lg shadow mb-6">
            <h3 class="text-lg font-semibold mb-4">Objectifs en cours</h3>
            <div class="space-y-3">${goalsPreview}</div>
        </div>` : ''}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-lg font-semibold mb-4">Évolution du Patrimoine Net</h3>
                <canvas id="netWorthChart"></canvas>
            </div>
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-lg font-semibold mb-4">Flux de Trésorerie (30 jours)</h3>
                <canvas id="cashFlowChart"></canvas>
            </div>
        </div>`;
};

const renderFilteredDashboard = () => {
    const account = state.accounts.find(a => a.id === state.activeAccountFilterId);
    if (!account) return '<p>Compte introuvable.</p>';

    const balance = calculateAccountBalance(account.id);
    const accountTransactions = state.transactions.filter(tx => tx.accountId === account.id);
    const recentTx = accountTransactions.slice(-5).reverse();

    return `
        <div class="bg-white p-6 rounded-lg shadow mb-6">
            <h2 class="text-2xl font-bold mb-4">${account.name}</h2>
            <div class="text-3xl font-bold text-indigo-600 mb-2">${formatCurrency(balance, account.currency)}</div>
            <p class="text-gray-500">${accountTransactions.length} transaction(s)</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
            <h3 class="text-lg font-semibold mb-4">Transactions récentes</h3>
            ${recentTx.length > 0 ? recentTx.map(tx => `
                <div class="flex justify-between items-center py-2 border-b">
                    <div>
                        <p class="font-medium">${tx.description}</p>
                        <p class="text-xs text-gray-500">${tx.date}</p>
                    </div>
                    <span class="font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}">
                        ${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.originalAmount, tx.originalCurrency)}
                    </span>
                </div>
            `).join('') : '<p class="text-gray-500">Aucune transaction.</p>'}
        </div>`;
};

const renderNotifications = () => {
    const notifications = [];
    const now = new Date();
    
    state.goals.forEach(goal => {
        if (goal.targetDate) {
            const targetDate = new Date(goal.targetDate);
            const daysRemaining = Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24));
            const progress = calculateGoalProgress(goal.id);
            const progressPercent = (progress / goal.targetAmount) * 100;
            
            if (daysRemaining <= 30 && daysRemaining > 0 && progressPercent < 100) {
                notifications.push({
                    type: 'warning',
                    message: `Objectif "${goal.name}" : ${daysRemaining} jours restants (${progressPercent.toFixed(0)}% atteint)`
                });
            }
        }
    });

    const panel = document.getElementById('notification-panel');
    const dot = document.getElementById('notification-dot');

    if (notifications.length > 0) {
        dot.classList.remove('hidden');
        panel.innerHTML = `
            <div class="p-4">
                <h4 class="font-semibold mb-2">Notifications (${notifications.length})</h4>
                ${notifications.map(n => `
                    <div class="p-3 mb-2 rounded ${n.type === 'warning' ? 'bg-yellow-50 border-l-4 border-yellow-400' : 'bg-blue-50'}">
                        <p class="text-sm">${n.message}</p>
                    </div>
                `).join('')}
            </div>`;
    } else {
        dot.classList.add('hidden');
        panel.innerHTML = '<div class="p-4 text-center text-gray-500">Aucune notification</div>';
    }
};
