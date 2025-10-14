// ========== EVENTS MODULE ========== //

// Gestionnaires d'événements spécifiques pour l'application

// Gestionnaire pour les actions de suppression
const handleDeleteActions = (e) => {
    const action = e.target.dataset.action;
    const id = e.target.dataset.id;
    
    if (!action || !id) return;
    
    let confirmed = false;
    let itemType = '';
    
    switch (action) {
        case 'delete-account':
            itemType = 'compte';
            confirmed = confirm(`Êtes-vous sûr de vouloir supprimer ce ${itemType} ?`);
            if (confirmed) {
                state.accounts = state.accounts.filter(a => a.id !== id);
                // Supprimer aussi les transactions liées
                state.transactions = state.transactions.filter(t => t.accountId !== id);
                showToast('Compte supprimé avec succès !');
            }
            break;
            
        case 'delete-transaction':
            itemType = 'transaction';
            confirmed = confirm(`Êtes-vous sûr de vouloir supprimer cette ${itemType} ?`);
            if (confirmed) {
                state.transactions = state.transactions.filter(t => t.id !== id);
                showToast('Transaction supprimée avec succès !');
            }
            break;
            
        case 'delete-investment':
            itemType = 'investissement';
            confirmed = confirm(`Êtes-vous sûr de vouloir supprimer cet ${itemType} ?`);
            if (confirmed) {
                state.investments = state.investments.filter(i => i.id !== id);
                showToast('Investissement supprimé avec succès !');
            }
            break;
            
        case 'delete-debt':
            itemType = 'dette';
            confirmed = confirm(`Êtes-vous sûr de vouloir supprimer cette ${itemType} ?`);
            if (confirmed) {
                state.debts = state.debts.filter(d => d.id !== id);
                showToast('Dette supprimée avec succès !');
            }
            break;
            
        case 'delete-claim':
            itemType = 'créance';
            confirmed = confirm(`Êtes-vous sûr de vouloir supprimer cette ${itemType} ?`);
            if (confirmed) {
                state.claims = state.claims.filter(c => c.id !== id);
                showToast('Créance supprimée avec succès !');
            }
            break;
            
        case 'delete-goal':
            itemType = 'objectif';
            confirmed = confirm(`Êtes-vous sûr de vouloir supprimer cet ${itemType} ?`);
            if (confirmed) {
                state.goals = state.goals.filter(g => g.id !== id);
                showToast('Objectif supprimé avec succès !');
            }
            break;
    }
    
    if (confirmed) {
        invalidateBalanceCache();
        fullUpdate();
    }
};

// Gestionnaire pour les actions d'édition
const handleEditActions = (e) => {
    const action = e.target.dataset.action;
    const id = e.target.dataset.id;
    
    if (!action || !id) return;
    
    switch (action) {
        case 'edit-account':
            showAccountModal(id);
            break;
            
        case 'edit-transaction':
            const transaction = state.transactions.find(t => t.id === id);
            if (transaction) {
                showTransactionModal(transaction.type, id);
            }
            break;
            
        case 'edit-investment':
            showInvestmentModal(id);
            break;
            
        case 'edit-debt':
            // Logique pour éditer une dette
            const debt = state.debts.find(d => d.id === id);
            if (debt) {
                showDebtModal(id);
            }
            break;
            
        case 'edit-claim':
            // Logique pour éditer une créance
            const claim = state.claims.find(c => c.id === id);
            if (claim) {
                showClaimModal(id);
            }
            break;
            
        case 'edit-goal':
            // Logique pour éditer un objectif
            const goal = state.goals.find(g => g.id === id);
            if (goal) {
                showGoalModal(id);
            }
            break;
    }
};

// Gestionnaire pour les filtres de transactions
const handleTransactionFilters = () => {
    const filterForm = document.getElementById('transaction-filters');
    if (!filterForm) return;
    
    filterForm.addEventListener('change', debounce(() => {
        const formData = new FormData(filterForm);
        
        state.transactionFilters = {
            accountId: formData.get('accountId') || '',
            categoryId: formData.get('categoryId') || '',
            startDate: formData.get('startDate') || '',
            endDate: formData.get('endDate') || '',
            tags: formData.get('tags') || ''
        };
        
        renderTransactions();
    }, 300));
};

// Gestionnaire pour la recherche globale
const handleGlobalSearch = () => {
    const searchInput = document.getElementById('global-search');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', debounce((e) => {
        const query = e.target.value.toLowerCase().trim();
        
        if (query.length < 2) {
            // Réinitialiser la vue si la recherche est trop courte
            renderContent();
            return;
        }
        
        // Rechercher dans les transactions
        const matchingTransactions = state.transactions.filter(tx => 
            tx.description.toLowerCase().includes(query) ||
            tx.category.toLowerCase().includes(query) ||
            (tx.tags && tx.tags.some(tag => tag.toLowerCase().includes(query))) ||
            (tx.notes && tx.notes.toLowerCase().includes(query))
        );
        
        // Afficher les résultats de recherche
        displaySearchResults(query, matchingTransactions);
    }, 300));
};

// Affichage des résultats de recherche
const displaySearchResults = (query, transactions) => {
    const content = document.getElementById('main-content');
    if (!content) return;
    
    content.innerHTML = `
        <div class="p-6">
            <div class="mb-6">
                <h2 class="text-2xl font-bold text-gray-900">Résultats de recherche</h2>
                <p class="text-gray-600">Recherche pour: "${query}" (${transactions.length} résultat(s))</p>
            </div>
            
            ${transactions.length > 0 ? `
                <div class="bg-white rounded-lg shadow overflow-hidden">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compte</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${transactions.map(tx => {
                                const account = state.accounts.find(a => a.id === tx.accountId);
                                return `
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${tx.date}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${tx.description}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${tx.category}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}">
                                            ${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.originalAmount, tx.originalCurrency)}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${account ? account.name : 'N/A'}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            ` : `
                <div class="bg-white rounded-lg shadow p-6 text-center">
                    <i data-lucide="search" class="w-12 h-12 text-gray-400 mx-auto mb-4"></i>
                    <p class="text-gray-500">Aucun résultat trouvé pour cette recherche.</p>
                </div>
            `}
        </div>
    `;
    
    // Réinitialiser les icônes
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
};

// Gestionnaire pour l'ajout rapide de transactions
const handleQuickAdd = () => {
    const quickAddInput = document.getElementById('quick-add');
    if (!quickAddInput) return;
    
    quickAddInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const input = e.target.value.trim();
            
            if (input.length === 0) return;
            
            // Parser l'entrée rapide
            const parsedData = parseQuickAddInput(input);
            
            if (parsedData) {
                // Ouvrir la modal de transaction avec les données pré-remplies
                showTransactionModal(parsedData.type, null, parsedData);
                e.target.value = '';
            } else {
                showToast('Format non reconnu. Essayez: "Café 4.50" ou "+Salaire 3000"', 'error');
            }
        }
    });
};

// Parser pour l'ajout rapide
const parseQuickAddInput = (input) => {
    // Formats supportés:
    // "Café 4.50" -> dépense
    // "+Salaire 3000" -> revenu
    // "Café 4.50 CHF" -> avec devise
    // "Café 4.50 Migros" -> avec compte
    
    const patterns = [
        // Format: [+]description montant [devise] [compte]
        /^(\+?)(.+?)\s+(\d+(?:\.\d{1,2})?)\s*([A-Z]{3})?\s*(.+)?$/i,
        // Format simple: [+]description montant
        /^(\+?)(.+?)\s+(\d+(?:\.\d{1,2})?)$/i
    ];
    
    for (const pattern of patterns) {
        const match = input.match(pattern);
        if (match) {
            const [, typePrefix, description, amount, currency, accountName] = match;
            
            const type = typePrefix === '+' ? 'income' : 'expense';
            const originalAmount = parseFloat(amount);
            const originalCurrency = currency || state.baseCurrency;
            
            // Trouver le compte par nom si spécifié
            let accountId = '';
            if (accountName) {
                const account = state.accounts.find(a => 
                    a.name.toLowerCase().includes(accountName.toLowerCase())
                );
                if (account) {
                    accountId = account.id;
                }
            }
            
            // Essayer de deviner la catégorie
            const category = guessCategory(description.trim(), type);
            
            return {
                type,
                description: description.trim(),
                originalAmount,
                originalCurrency,
                accountId,
                category: category.category,
                subCategory: category.subCategory,
                date: today()
            };
        }
    }
    
    return null;
};

// Deviner la catégorie basée sur la description
const guessCategory = (description, type) => {
    const keywords = state.quickAddKeywords || {};
    const desc = description.toLowerCase();
    
    // Chercher dans les mots-clés configurés
    for (const [keyword, mapping] of Object.entries(keywords)) {
        if (desc.includes(keyword.toLowerCase())) {
            return {
                category: mapping.category,
                subCategory: mapping.subCategory
            };
        }
    }
    
    // Catégories par défaut
    if (type === 'income') {
        return {
            category: 'Salaire',
            subCategory: 'Salaire Principal'
        };
    } else {
        return {
            category: 'Vie Quotidienne',
            subCategory: 'Divers'
        };
    }
};

// Gestionnaire pour les raccourcis clavier
const handleKeyboardShortcuts = (e) => {
    // Ctrl/Cmd + N : Nouvelle transaction
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        showTransactionModal();
    }
    
    // Ctrl/Cmd + Shift + N : Nouveau compte
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        showAccountModal();
    }
    
    // Échap : Fermer la modal
    if (e.key === 'Escape') {
        closeModal();
    }
    
    // Ctrl/Cmd + F : Focus sur la recherche
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search');
        if (searchInput) {
            searchInput.focus();
        }
    }
};

// Gestionnaire pour le drag & drop de fichiers
const handleFileDrop = () => {
    const dropZone = document.body;
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });
    
    dropZone.addEventListener('dragleave', (e) => {
        if (!dropZone.contains(e.relatedTarget)) {
            dropZone.classList.remove('drag-over');
        }
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        
        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        const jsonFiles = files.filter(file => file.type === 'application/json');
        
        if (imageFiles.length > 0) {
            // OCR sur la première image
            const reader = new FileReader();
            reader.onload = (event) => {
                handleImageUploadForOcr(event.target.result);
            };
            reader.readAsDataURL(imageFiles[0]);
        } else if (jsonFiles.length > 0) {
            // Import de données
            importData(jsonFiles[0]);
        }
    });
};

// Initialisation des gestionnaires d'événements
const initializeEventHandlers = () => {
    // Gestionnaires de suppression et d'édition
    document.addEventListener('click', handleDeleteActions);
    document.addEventListener('click', handleEditActions);
    
    // Raccourcis clavier
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Drag & drop
    handleFileDrop();
    
    // Recherche globale et ajout rapide (initialisés après le rendu)
    setTimeout(() => {
        handleGlobalSearch();
        handleQuickAdd();
        handleTransactionFilters();
    }, 100);
};

// Initialiser les gestionnaires d'événements au chargement
document.addEventListener('DOMContentLoaded', initializeEventHandlers);
