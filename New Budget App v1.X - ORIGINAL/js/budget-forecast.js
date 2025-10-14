// ========== PROVISIONAL BUDGET MODULE ========== //

// Fonction pour générer un budget prévisionnel basé sur les 3 derniers mois
const generateProvisionalBudget = () => {
    const provisionalBudget = {};
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Récupérer les 3 derniers mois complets
    const monthsToAnalyze = [];
    for (let i = 1; i <= 3; i++) {
        const date = new Date(currentYear, currentMonth - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthsToAnalyze.push(monthKey);
    }

    // Analyser les transactions de chaque mois
    monthsToAnalyze.forEach(monthKey => {
        if (state.monthlyBudgets && state.monthlyBudgets[monthKey]) {
            const monthBudget = state.monthlyBudgets[monthKey];

            Object.keys(monthBudget).forEach(categoryId => {
                const categoryBudget = monthBudget[categoryId];

                if (!provisionalBudget[categoryId]) {
                    provisionalBudget[categoryId] = {
                        planned: 0,
                        count: 0,
                        transactions: []
                    };
                }

                provisionalBudget[categoryId].planned += categoryBudget.planned || 0;
                provisionalBudget[categoryId].count += 1;

                // Ajouter les transactions de cette catégorie
                if (categoryBudget.transactions) {
                    provisionalBudget[categoryId].transactions.push(...categoryBudget.transactions);
                }
            });
        }
    });

    // Calculer les moyennes et analyser les transactions récurrentes
    Object.keys(provisionalBudget).forEach(categoryId => {
        const categoryData = provisionalBudget[categoryId];

        if (categoryData.count > 0) {
            // Calculer la moyenne des montants prévus
            categoryData.averagePlanned = categoryData.planned / categoryData.count;

            // Analyser les transactions récurrentes
            const recurringTransactions = categoryData.transactions.filter(tx => tx.recurring);

            if (recurringTransactions.length > 0) {
                // Utiliser les montants récurrents plutôt que la moyenne
                const totalRecurring = recurringTransactions.reduce((sum, tx) => sum + tx.amount, 0);
                categoryData.suggestedAmount = totalRecurring;
                categoryData.isRecurring = true;
            } else {
                // Utiliser la moyenne des montants prévus
                categoryData.suggestedAmount = categoryData.averagePlanned;
                categoryData.isRecurring = false;
            }
        }
    });

    return provisionalBudget;
};

// Fonction pour afficher la modale de budget prévisionnel
const showProvisionalBudgetModal = (provisionalBudget) => {
    const categories = state.categories.expense;
    let modalContent = `
        <div class="provisional-budget-content">
            <div class="mb-4">
                <h3 class="text-lg font-semibold mb-2">Budget Prévisionnel - ${getCurrentMonthName()}</h3>
                <p class="text-gray-600 text-sm">Basé sur la moyenne des 3 derniers mois. Vous pouvez modifier les montants avant de valider.</p>
            </div>

            <div class="max-h-96 overflow-y-auto mb-4">
                <div class="space-y-3">
    `;

    // Grouper par catégories principales
    Object.keys(categories).forEach(mainCategory => {
        const subCategories = categories[mainCategory];
        const hasBudgetItems = subCategories.some(subCat => {
            const categoryId = `${mainCategory}:${subCat}`;
            return provisionalBudget[categoryId];
        });

        if (hasBudgetItems) {
            modalContent += `
                <div class="bg-gray-50 p-3 rounded-lg">
                    <h4 class="font-medium text-gray-800 mb-2">${mainCategory}</h4>
                    <div class="space-y-2">
            `;

            subCategories.forEach(subCategory => {
                const categoryId = `${mainCategory}:${subCategory}`;
                const budgetItem = provisionalBudget[categoryId];

                if (budgetItem && budgetItem.suggestedAmount > 0) {
                    modalContent += `
                        <div class="flex items-center justify-between bg-white p-2 rounded border">
                            <div class="flex-1">
                                <span class="font-medium text-sm">${subCategory}</span>
                                ${budgetItem.isRecurring ? '<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2">Récurrent</span>' : ''}
                            </div>
                            <div class="flex items-center space-x-2">
                                <input type="number"
                                       class="budget-amount-input w-24 p-1 border rounded text-sm"
                                       data-category-id="${categoryId}"
                                       value="${budgetItem.suggestedAmount.toFixed(2)}"
                                       step="0.01"
                                       min="0">
                                <button class="remove-budget-item text-red-500 hover:text-red-700"
                                        data-category-id="${categoryId}"
                                        title="Supprimer cette ligne">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>
                    `;
                }
            });

            modalContent += `
                    </div>
                </div>
            `;
        }
    });

    modalContent += `
                </div>
            </div>

            <div class="border-t pt-4">
                <div class="flex justify-between items-center mb-4">
                    <span class="font-semibold">Total Prévisionnel :</span>
                    <span id="provisional-total" class="font-bold text-lg">0.00 CHF</span>
                </div>

                <div class="flex justify-end space-x-2">
                    <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg">Annuler</button>
                    <button id="add-budget-line" class="bg-green-600 text-white py-2 px-4 rounded-lg mr-2">Ajouter une ligne</button>
                    <button id="validate-provisional-budget" class="bg-indigo-600 text-white py-2 px-4 rounded-lg">Valider le Budget</button>
                </div>
            </div>
        </div>
    `;

    openModal('Budget Prévisionnel', modalContent, 'max-w-2xl');

    // Ajouter les event listeners
    setTimeout(() => {
        initProvisionalBudgetModalEvents(provisionalBudget);
    }, 100);
};

// Initialiser les événements de la modale de budget prévisionnel
const initProvisionalBudgetModalEvents = (provisionalBudget) => {
    // Mettre à jour le total en temps réel
    const updateTotal = () => {
        const inputs = document.querySelectorAll('.budget-amount-input');
        let total = 0;
        inputs.forEach(input => {
            total += parseFloat(input.value) || 0;
        });
        document.getElementById('provisional-total').textContent = `${total.toFixed(2)} CHF`;
    };

    // Event listeners pour les inputs de montant
    document.querySelectorAll('.budget-amount-input').forEach(input => {
        input.addEventListener('input', updateTotal);
    });

    // Bouton pour supprimer une ligne
    document.querySelectorAll('.remove-budget-item').forEach(button => {
        button.addEventListener('click', (e) => {
            const categoryId = e.currentTarget.dataset.categoryId;
            e.currentTarget.closest('.flex').remove();
            updateTotal();
        });
    });

    // Bouton pour ajouter une ligne
    document.getElementById('add-budget-line').addEventListener('click', () => {
        showAddBudgetLineModal();
    });

    // Bouton pour valider le budget
    document.getElementById('validate-provisional-budget').addEventListener('click', () => {
        handleProvisionalBudgetSubmit(provisionalBudget);
    });

    // Calculer le total initial
    updateTotal();
};

// Afficher la modale pour ajouter une nouvelle ligne de budget
const showAddBudgetLineModal = () => {
    const categories = state.categories.expense;
    let options = '';

    Object.keys(categories).forEach(mainCategory => {
        options += `<optgroup label="${mainCategory}">`;
        categories[mainCategory].forEach(subCategory => {
            options += `<option value="${mainCategory}:${subCategory}">${subCategory}</option>`;
        });
        options += `</optgroup>`;
    });

    const content = `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium mb-2">Catégorie</label>
                <select id="new-budget-category" class="w-full p-2 border rounded">
                    ${options}
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium mb-2">Montant Prévu</label>
                <input type="number" id="new-budget-amount" class="w-full p-2 border rounded" step="0.01" min="0" placeholder="0.00">
            </div>
            <div class="flex justify-end space-x-2">
                <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg">Annuler</button>
                <button id="confirm-add-budget-line" class="bg-indigo-600 text-white py-2 px-4 rounded-lg">Ajouter</button>
            </div>
        </div>
    `;

    openModal('Ajouter une Ligne de Budget', content, 'max-w-md');

    setTimeout(() => {
        document.getElementById('confirm-add-budget-line').addEventListener('click', () => {
            const categoryId = document.getElementById('new-budget-category').value;
            const amount = parseFloat(document.getElementById('new-budget-amount').value) || 0;

            if (amount > 0) {
                addBudgetLineToModal(categoryId, amount);
                closeModal();
            }
        });
    }, 100);
};

// Ajouter une ligne de budget à la modale
const addBudgetLineToModal = (categoryId, amount) => {
    const [mainCategory, subCategory] = categoryId.split(':');
    const modalContent = document.querySelector('.provisional-budget-content .max-h-96');

    const newLine = document.createElement('div');
    newLine.className = 'flex items-center justify-between bg-white p-2 rounded border';
    newLine.innerHTML = `
        <div class="flex-1">
            <span class="font-medium text-sm">${subCategory}</span>
            <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded ml-2">Nouveau</span>
        </div>
        <div class="flex items-center space-x-2">
            <input type="number"
                   class="budget-amount-input w-24 p-1 border rounded text-sm"
                   data-category-id="${categoryId}"
                   value="${amount.toFixed(2)}"
                   step="0.01"
                   min="0">
            <button class="remove-budget-item text-red-500 hover:text-red-700"
                    data-category-id="${categoryId}"
                    title="Supprimer cette ligne">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        </div>
    `;

    modalContent.appendChild(newLine);

    // Réinitialiser les icônes et les events
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }

    // Mettre à jour le total
    const updateTotal = () => {
        const inputs = document.querySelectorAll('.budget-amount-input');
        let total = 0;
        inputs.forEach(input => {
            total += parseFloat(input.value) || 0;
        });
        document.getElementById('provisional-total').textContent = `${total.toFixed(2)} CHF`;
    };

    newLine.querySelector('.budget-amount-input').addEventListener('input', updateTotal);
    newLine.querySelector('.remove-budget-item').addEventListener('click', (e) => {
        e.currentTarget.closest('.flex').remove();
        updateTotal();
    });

    updateTotal();
};

// Gestionnaire pour valider et sauvegarder le budget prévisionnel
const handleProvisionalBudgetSubmit = (provisionalBudget) => {
    const currentMonth = getCurrentMonthKey();
    const budgetInputs = document.querySelectorAll('.budget-amount-input');
    const newBudget = {};

    budgetInputs.forEach(input => {
        const categoryId = input.dataset.categoryId;
        const amount = parseFloat(input.value) || 0;

        if (amount > 0) {
            newBudget[categoryId] = {
                planned: amount,
                spent: 0,
                transactions: []
            };
        }
    });

    // Sauvegarder le budget
    if (!state.monthlyBudgets) {
        state.monthlyBudgets = {};
    }

    state.monthlyBudgets[currentMonth] = newBudget;

    saveState();
    closeModal();

    showToast('Budget prévisionnel validé et défini pour ce mois !');

    // Actualiser l'affichage si on est dans l'onglet Prévisions
    if (state.activeTab === 'forecast') {
        setTimeout(() => {
            switchToTab('forecast');
        }, 100);
    }
};

// Fonction utilitaire pour obtenir le mois actuel au format YYYY-MM
const getCurrentMonthKey = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

// Fonction utilitaire pour obtenir le nom du mois actuel
const getCurrentMonthName = () => {
    const now = new Date();
    return now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
};
