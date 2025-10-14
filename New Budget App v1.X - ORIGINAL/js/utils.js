// =================================// ========== UTILITY FUNCTIONS MODULE ========== //

// Génération d'ID unique
const generateId = () => `id_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`;

// Formatage de devise avec cache
const currencyFormatters = new Map();
const formatCurrency = (amount, currency = 'CHF') => {
    if (isNaN(amount)) return "0.00";
    
    // Formatage spécial pour BTC avec plus de décimales
    if (currency === 'BTC') {
        return `₿ ${parseFloat(amount).toFixed(8)}`;
    }
    
    if (!currencyFormatters.has(currency)) {
        currencyFormatters.set(currency, new Intl.NumberFormat('fr-CH', { style: 'currency', currency }));
    }
    
    return currencyFormatters.get(currency).format(amount);
};

// Date du jour
const today = () => new Date().toISOString().split('T')[0];

// Toast notifications optimisées
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

// =====================================================
// CORE LOGIC & CALCULATIONS
// =====================================================

// Calcul du solde d'un compte
const calculateAccountBalance = (accountId) => {
    if (!cacheInvalidated && accountBalanceCache.has(accountId)) {
        return accountBalanceCache.get(accountId);
    }
    
    const account = state.accounts.find(a => a.id === accountId);
    if (!account) return 0;

    const balance = (state.transactions || []).filter(t => t.accountId === accountId && !t.isSplit).reduce((sum, t) => {
        const txRate = state.exchangeRates[t.originalCurrency] || 1;
        const amountInBaseCurrency = t.originalAmount / txRate;
        return t.type === 'income' ? sum + amountInBaseCurrency : sum - amountInBaseCurrency;
    }, 0);
    
    accountBalanceCache.set(accountId, balance);
    return balance;
};

// Calcul des détails d'investissement
const calculateInvestmentDetails = (investmentId) => {
    const inv = state.investments.find(i => i.id === investmentId);
    if (!inv || !inv.history) {
        return { totalQuantity: 0, totalCost: 0, pru: 0, totalSalesValue: 0, totalDividends: 0, currentQuantity: 0 };
    }

    let totalQuantity = 0;
    let totalCost = 0;
    let totalSalesValue = 0;
    let totalDividends = 0;
    let soldQuantity = 0;

    const sortedHistory = [...inv.history].sort((a, b) => new Date(a.date) - new Date(b.date));

    for (const entry of sortedHistory) {
        if (entry.type === 'achat' || entry.type === 'vente') {
            const rate = state.exchangeRates[entry.currency] || 1;
            const amountInBase = (entry.quantity * entry.pricePerUnit + (entry.fees || 0)) / rate;

            if (entry.type === 'achat') {
                totalCost += amountInBase;
                totalQuantity += entry.quantity;
            } else {
                soldQuantity += entry.quantity;
                totalSalesValue += (entry.quantity * entry.pricePerUnit / rate) - ((entry.fees || 0) / rate);
            }
        } else if (entry.type === 'dividende') {
            const rate = state.exchangeRates[entry.currency] || 1;
            totalDividends += entry.currency === 'BTC' ? entry.amount * rate : entry.amount / rate;
        }
    }

    const currentQuantity = totalQuantity - soldQuantity;
    const pru = totalQuantity > 0 ? totalCost / totalQuantity : 0;

    return { totalQuantity, totalCost, pru, totalSalesValue, totalDividends, currentQuantity };
};

// Calcul du total des investissements
const calculateTotalInvestments = () => {
    return (state.investments || []).reduce((sum, inv) => {
        const details = calculateInvestmentDetails(inv.id);
        return sum + (inv.currentValue * details.currentQuantity);
    }, 0);
};

// Calcul de la progression d'un objectif
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

// Calcul des économies moyennes mensuelles
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

// Calcul du solde d'une dette
const calculateDebtOutstanding = (debt) => {
    if (!debt?.history) return 0;

    const initial = debt.history.find(h => h.type === 'initial')?.amount || 0;
    const repaid = debt.history.filter(h => h.type === 'repayment').reduce((sum, h) => sum + h.amount, 0);

    return initial - repaid;
};

// Calcul du total des dettes
const calculateTotalDebts = () => {
    return (state.debts || []).reduce((sum, debt) => sum + calculateDebtOutstanding(debt), 0);
};

// Calcul du solde d'une créance
const calculateClaimOutstanding = (claim) => {
    if (!claim?.history) return 0;

    const initial = claim.history.find(h => h.type === 'initial')?.amount || 0;
    const received = claim.history.filter(h => h.type === 'paymentReceived').reduce((sum, h) => sum + h.amount, 0);

    return initial - received;
};

// Calcul du total des créances
const calculateTotalClaims = () => {
    return (state.claims || []).reduce((sum, claim) => sum + calculateClaimOutstanding(claim), 0);
};

// Calcul du patrimoine net
const calculateNetWorth = () => {
    const totalAccounts = (state.accounts || []).reduce((sum, acc) => sum + calculateAccountBalance(acc.id), 0);
    return totalAccounts + calculateTotalInvestments() - calculateTotalDebts() + calculateTotalClaims();
};

// Mise à jour de l'historique du patrimoine net
const updateNetWorthHistory = () => {
    const now = today();
    const currentNetWorth = calculateNetWorth();

    if (!state.netWorthHistory) {
        state.netWorthHistory = [];
    }

    const existingEntry = state.netWorthHistory.find(e => e.date === now);
    if (existingEntry) {
        existingEntry.value = currentNetWorth;
    } else {
        state.netWorthHistory.push({ date: now, value: currentNetWorth });
        state.netWorthHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        if (state.netWorthHistory.length > 365) {
            state.netWorthHistory = state.netWorthHistory.slice(-365);
        }
    }
};

// Récupérer les transactions avec filtres
const getTransactionsForFilter = () => {
    let transactions = state.transactions || [];
    if (state.activeAccountFilterId) {
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

// Export de données
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

// Export CSV des transactions
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

// Import de données
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
    };
    reader.readAsText(file);
};

// Récupération des données du budget pour un mois
const getBudgetData = (month) => {
    const monthData = state.monthlyBudgets[month] || {};
    
    const now = new Date();
    const [year, monthNum] = month.split('-').map(Number);
    const firstDayOfMonth = new Date(year, monthNum - 1, 1).toISOString().split('T')[0];
    const lastDayOfMonth = new Date(year, monthNum, 0).toISOString().split('T')[0];
    
    const monthTransactions = state.transactions.filter(tx => 
        tx.type === 'expense' && 
        tx.date >= firstDayOfMonth && 
        tx.date <= lastDayOfMonth &&
        !tx.isSplit
    );
    
    const spentByCategory = monthTransactions.reduce((acc, tx) => {
        const categoryKey = `${tx.category}-${tx.subCategory}`;
        acc[categoryKey] = (acc[categoryKey] || 0) + tx.amount;
        return acc;
    }, {});
    
    return { monthData, spentByCategory, monthTransactions };
};

// Préparation du mois suivant (budget)
const prepareNextMonth = () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthKey = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
    
    if (!state.monthlyBudgets[nextMonthKey]) {
        state.monthlyBudgets[nextMonthKey] = {};
    }
    
    const currentMonth = state.currentBudgetMonth;
    const currentMonthData = state.monthlyBudgets[currentMonth] || {};
    
    Object.keys(currentMonthData).forEach(categoryKey => {
        if (!state.monthlyBudgets[nextMonthKey][categoryKey]) {
            state.monthlyBudgets[nextMonthKey][categoryKey] = {
                planned: currentMonthData[categoryKey].planned || 0,
                spent: 0,
                transactions: []
            };
        }
    });
    
    state.currentBudgetMonth = nextMonthKey;
    showToast(`Budget pour ${nextMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} créé !`);
    fullUpdate();
};
