// ========== CALCULATIONS MODULE ========== //

// Cache pour les balances des comptes
const accountBalanceCache = new Map();
let cacheInvalidated = true;

const invalidateBalanceCache = () => {
    accountBalanceCache.clear();
    cacheInvalidated = true;
};

// Calcul du solde d'un compte
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
            let amountInBase;
            
            // Calcul correct selon la devise de l'entrée
            if (entry.currency === 'BTC') {
                // Pour BTC : multiplier par le taux (prix du BTC)
                amountInBase = (entry.quantity * entry.pricePerUnit + (entry.fees || 0)) * rate;
            } else {
                // Pour devises fiat : diviser par le taux
                amountInBase = (entry.quantity * entry.pricePerUnit + (entry.fees || 0)) / rate;
            }

            if (entry.type === 'achat') {
                totalCost += amountInBase;
                totalQuantity += entry.quantity;
            } else {
                soldQuantity += entry.quantity;
                let salesValue;
                if (entry.currency === 'BTC') {
                    salesValue = (entry.quantity * entry.pricePerUnit * rate) - ((entry.fees || 0) * rate);
                } else {
                    salesValue = (entry.quantity * entry.pricePerUnit / rate) - ((entry.fees || 0) / rate);
                }
                totalSalesValue += salesValue;
            }
        } else if (entry.type === 'dividende') {
            const rate = state.exchangeRates[entry.currency] || 1;
            if (entry.currency === 'BTC') {
                totalDividends += entry.amount * rate;
            } else {
                totalDividends += entry.amount / rate;
            }
        }
    }

    const currentQuantity = totalQuantity - soldQuantity;
    const pru = totalQuantity > 0 ? totalCost / totalQuantity : 0;

    return { totalQuantity, totalCost, pru, totalSalesValue, totalDividends, currentQuantity };
};

// Calcul du total des investissements
const calculateTotalInvestments = () => {
    return (state.investments || []).reduce((sum, inv) => {
        if (inv.type === 'Trading') {
            return sum + inv.currentValue;
        }
        const details = calculateInvestmentDetails(inv.id);
        return sum + (inv.currentValue * details.currentQuantity);
    }, 0);
};

// Calcul du progrès d'un objectif
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
            // Pour les comptes de trading, utiliser la valeur totale directement
            if (investment.type === 'Trading' && investment.accountValue) {
                savedAmount += investment.accountValue;
            } else {
                // Pour les autres types d'investissement, utiliser le calcul traditionnel
                const details = calculateInvestmentDetails(investment.id);
                savedAmount += details.pru * details.currentQuantity;
            }
        }
    });

    return savedAmount;
};

// Calcul du total des dettes
const calculateTotalDebts = () => {
    return (state.debts || []).reduce((sum, debt) => sum + calculateDebtOutstanding(debt), 0);
};

// Calcul du total des créances
const calculateTotalClaims = () => {
    return (state.claims || []).reduce((sum, claim) => sum + calculateClaimOutstanding(claim), 0);
};

// Calcul de la valeur nette
const calculateNetWorth = () => {
    const totalAccounts = (state.accounts || []).reduce((sum, acc) => sum + calculateAccountBalance(acc.id), 0);
    return totalAccounts + calculateTotalInvestments() - calculateTotalDebts() + calculateTotalClaims();
};

// Calcul du solde d'une dette
const calculateDebtOutstanding = (debt) => {
    if (!debt?.history) return 0;

    const initial = debt.history.find(h => h.type === 'initial')?.amount || 0;
    const repaid = debt.history.filter(h => h.type === 'repayment').reduce((sum, h) => sum + h.amount, 0);

    return initial - repaid;
};

// Calcul du solde d'une créance
const calculateClaimOutstanding = (claim) => {
    if (!claim?.history) return 0;

    const initial = claim.history.find(h => h.type === 'initial')?.amount || 0;
    const received = claim.history.filter(h => h.type === 'paymentReceived').reduce((sum, h) => sum + h.amount, 0);

    return initial - received;
};

// Filtrage des transactions
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

// Export/Import de données
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
    };
    reader.readAsText(file);
};
