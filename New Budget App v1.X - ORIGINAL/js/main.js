// ========== MAIN APPLICATION MODULE ========== //

document.addEventListener('DOMContentLoaded', () => {
    // Initialiser PDF.js
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;
    }

    const APP_VERSION = "5.0.0";

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

    // Fonction de mise à jour complète
    const fullUpdate = (callback) => {
        destroyAllCharts();
        saveState();
        render();
        if (callback) callback();
    };

    // Fonction de rendu principal
    const render = () => {
        if (typeof renderSidebar === 'function') renderSidebar();
        if (typeof renderContent === 'function') renderContent();
        if (typeof renderNotifications === 'function') renderNotifications();
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
    };

    // Gestionnaire d'événements global
    document.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        if (!action) return;

        e.preventDefault();
        e.stopPropagation();

        // Actions de navigation
        if (action === 'show-tab') {
            const tab = e.target.dataset.tab;
            if (tab && typeof state !== 'undefined') {
                state.activeTab = tab;
                render();
            }
            return;
        }

        // Actions modales
        if (action === 'close-modal') {
            if (typeof closeModal === 'function') closeModal();
            return;
        }

        // Actions de base
        switch (action) {
            case 'show-account-modal':
                if (typeof showAccountModal === 'function') showAccountModal();
                break;
            case 'show-transaction-modal':
                if (typeof showTransactionModal === 'function') showTransactionModal();
                break;
            case 'show-investment-modal':
                if (typeof showInvestmentModal === 'function') showInvestmentModal();
                break;
            case 'show-debt-modal':
                if (typeof showDebtModal === 'function') showDebtModal();
                break;
            case 'show-claim-modal':
                if (typeof showClaimModal === 'function') showClaimModal();
                break;
            case 'show-goal-modal':
                if (typeof showGoalModal === 'function') showGoalModal();
                break;
            case 'fetch-exchange-rates':
                if (typeof fetchExchangeRates === 'function') fetchExchangeRates();
                break;
            case 'fetch-crypto-prices':
                if (typeof fetchCryptoPrices === 'function') fetchCryptoPrices();
                break;
            case 'export-data':
                if (typeof exportData === 'function') exportData();
                break;
            case 'export-csv':
                if (typeof exportTransactionsToCsv === 'function') exportTransactionsToCsv();
                break;
            default:
                console.log('Action non gérée:', action);
        }
    });

    // Gestionnaire de soumission de formulaires
    document.addEventListener('submit', (e) => {
        const form = e.target;
        const formId = form.id;

        switch (formId) {
            case 'account-form':
                if (typeof handleAccountSubmit === 'function') handleAccountSubmit(e);
                break;
            case 'transaction-form':
                if (typeof handleTransactionSubmit === 'function') handleTransactionSubmit(e);
                break;
            case 'investment-form':
                if (typeof handleInvestmentSubmit === 'function') handleInvestmentSubmit(e);
                break;
            case 'debt-form':
                if (typeof handleDebtSubmit === 'function') handleDebtSubmit(e);
                break;
            case 'claim-form':
                if (typeof handleClaimSubmit === 'function') handleClaimSubmit(e);
                break;
            case 'goal-form':
                if (typeof handleGoalSubmit === 'function') handleGoalSubmit(e);
                break;
            default:
                console.log('Formulaire non géré:', formId);
        }
    });

    // Initialisation de l'application
    const init = () => {
        try {
            console.log('Initialisation de l\'application...');
            
            // Charger l'état
            if (typeof loadState === 'function') {
                loadState();
            }
            
            // Rendu initial
            render();
            
            // Récupérer les taux de change silencieusement
            if (typeof fetchExchangeRates === 'function') {
                fetchExchangeRates(true);
            }
            
            console.log('Application initialisée avec succès');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation:', error);
            if (typeof showToast === 'function') {
                showToast('Erreur d\'initialisation de l\'application', 'error');
            }
        }
    };

    // Exposer les fonctions globales nécessaires
    window.fullUpdate = fullUpdate;
    window.render = render;
    window.destroyAllCharts = destroyAllCharts;

    // Démarrer l'application
    init();
});
