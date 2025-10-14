// =====================================================
// MODALS - Gestion des fenêtres modales
// =====================================================

// Gestion des graphiques
let netWorthChart = null;
let cashFlowChart = null;
let forecastChart = null;
let expenseDonutChart = null;
let assetsPieChart = null;
let flowLineChart = null;

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

// Ouverture/fermeture de modal
const openModal = (title, content, maxWidthClass = 'max-w-md') => {
    const modalHtml = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" id="modal-backdrop">
            <div class="${maxWidthClass} w-full bg-white rounded-lg shadow-2xl modal-content overflow-y-auto">
                <div class="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
                    <h3 class="text-xl font-bold">${title}</h3>
                    <button data-action="close-modal" class="text-gray-500 hover:text-gray-700">
                        <i data-lucide="x" class="w-6 h-6"></i>
                    </button>
                </div>
                <div class="p-6">${content}</div>
            </div>
        </div>`;
    
    document.getElementById('app-modal').innerHTML = modalHtml;
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
};

const closeModal = () => {
    document.getElementById('app-modal').innerHTML = '';
};

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
                        ${Object.keys(state.exchangeRates).map(c => `<option value="${c}" ${isEditing && account.currency === c ? 'selected' : ''}>${c}</option>`).join('')}
                    </select>
                    ${isEditing ? '<p class="text-xs text-gray-500 mt-1">La devise ne peut pas être modifiée.</p>' : ''}
                </div>
            </div>
            <div class="mt-6 flex justify-end">
                <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg mr-2">Annuler</button>
                <button type="submit" class="bg-indigo-600 text-white py-2 px-4 rounded-lg">${isEditing ? 'Modifier' : 'Ajouter'}</button>
            </div>
        </form>`;

    openModal(title, content);
};

const handleAccountSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const accountId = e.target.dataset.id;

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

    fullUpdate();
};

// ========== TRANSACTION MODALS ========== //
const showTransactionModal = (type = 'expense', txId = null, prefillData = {}) => {
    const isEditing = !!txId;
    const tx = isEditing ? state.transactions.find(t => t.id === txId) : null;
    const title = isEditing ? 'Modifier la Transaction' : `Ajouter une ${type === 'income' ? 'Rentrée' : 'Dépense'}`;

    const accountsOptions = state.accounts.map(a => {
        const selected = (isEditing && tx.accountId === a.id) || (prefillData.accountId === a.id);
        return `<option value="${a.id}" ${selected ? 'selected' : ''}>${a.name}</option>`;
    }).join('');

    const currencyOptions = Object.keys(state.exchangeRates).map(c => {
        const selected = (isEditing && tx.originalCurrency === c) || (prefillData.originalCurrency === c) || (!isEditing && !prefillData.originalCurrency && c === state.baseCurrency);
        return `<option value="${c}" ${selected ? 'selected' : ''}>${c}</option>`;
    }).join('');

    const categoriesHtml = Object.keys(state.categories[type]).map(cat => 
        `<optgroup label="${cat}">
            ${state.categories[type][cat].map(sub => {
                const selected = (isEditing && tx.category === cat && tx.subCategory === sub) || (prefillData.category === cat && prefillData.subCategory === sub);
                return `<option value="${cat}|${sub}" ${selected ? 'selected' : ''}>${sub}</option>`;
            }).join('')}
        </optgroup>`
    ).join('');

    const content = `
        <form id="transaction-form" data-id="${isEditing ? txId : ''}" data-type="${type}">
            <div class="space-y-4">
                <div>
                    <label>Description</label>
                    <input type="text" name="description" required class="w-full p-2 border rounded" value="${isEditing ? tx.description : (prefillData.description || '')}">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label>Montant</label>
                        <input type="number" name="originalAmount" required step="0.01" min="0" class="w-full p-2 border rounded" value="${isEditing ? tx.originalAmount : (prefillData.originalAmount || '')}">
                    </div>
                    <div>
                        <label>Devise</label>
                        <select name="originalCurrency" class="w-full p-2 border rounded">${currencyOptions}</select>
                    </div>
                </div>
                <div>
                    <label>Date</label>
                    <input type="date" name="date" required class="w-full p-2 border rounded" value="${isEditing ? tx.date : (prefillData.date || today())}">
                </div>
                <div>
                    <label>Compte</label>
                    <select name="accountId" required class="w-full p-2 border rounded" ${state.accounts.length === 0 ? 'disabled' : ''}>${accountsOptions}</select>
                </div>
                <div>
                    <label>Catégorie</label>
                    <select name="category" required class="w-full p-2 border rounded">${categoriesHtml}</select>
                </div>
                <div>
                    <label>Tags (séparés par des virgules)</label>
                    <input type="text" name="tags" class="w-full p-2 border rounded" value="${isEditing && tx.tags ? tx.tags.join(', ') : ''}">
                </div>
                <div>
                    <label>Notes</label>
                    <textarea name="notes" class="w-full p-2 border rounded" rows="2">${isEditing && tx.notes ? tx.notes : ''}</textarea>
                </div>
                <div class="flex items-center">
                    <input type="checkbox" name="recurring" id="tx-recurring" ${(isEditing && tx.recurring) || prefillData.recurring ? 'checked' : ''} class="h-4 w-4 rounded">
                    <label for="tx-recurring" class="ml-2">Transaction récurrente</label>
                </div>
            </div>
            <div class="mt-6 flex justify-between">
                <button type="button" data-action="show-split-modal" class="bg-gray-500 text-white py-2 px-4 rounded-lg">Fractionner</button>
                <div class="flex gap-2">
                    <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg">Annuler</button>
                    <button type="submit" class="bg-indigo-600 text-white py-2 px-4 rounded-lg">${isEditing ? 'Modifier' : 'Ajouter'}</button>
                </div>
            </div>
        </form>`;

    openModal(title, content, 'max-w-lg');
};

const handleTransactionSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const txId = e.target.dataset.id;
    const type = e.target.dataset.type;

    const categoryValue = fd.get('category');
    const [category, subCategory] = categoryValue.split('|');

    const originalAmount = parseFloat(fd.get('originalAmount'));
    const originalCurrency = fd.get('originalCurrency');
    const rate = state.exchangeRates[originalCurrency] || 1;
    const amount = originalAmount / rate;

    const tags = fd.get('tags') ? fd.get('tags').split(',').map(t => t.trim()).filter(Boolean) : [];

    if (txId) {
        const tx = state.transactions.find(t => t.id === txId);
        if (tx) {
            tx.description = fd.get('description');
            tx.originalAmount = originalAmount;
            tx.originalCurrency = originalCurrency;
            tx.amount = amount;
            tx.date = fd.get('date');
            tx.accountId = fd.get('accountId');
            tx.category = category;
            tx.subCategory = subCategory;
            tx.tags = tags;
            tx.notes = fd.get('notes') || '';
            tx.recurring = fd.get('recurring') === 'on';
        }
    } else {
        state.transactions.push({
            id: generateId(),
            type,
            description: fd.get('description'),
            amount,
            originalAmount,
            originalCurrency,
            date: fd.get('date'),
            accountId: fd.get('accountId'),
            category,
            subCategory,
            tags,
            notes: fd.get('notes') || '',
            recurring: fd.get('recurring') === 'on',
            isSplit: false,
            parentTransactionId: null,
            linkedTo: null
        });
    }

    fullUpdate();
};

// ========== SPLIT TRANSACTION MODAL ========== //
const showSplitTransactionModal = (parentData) => {
    const content = `
        <form id="split-transaction-form">
            <div class="mb-4">
                <p><strong>Transaction parent :</strong> ${parentData.description}</p>
                <p><strong>Montant total :</strong> ${formatCurrency(parentData.originalAmount, parentData.originalCurrency)}</p>
            </div>
            <div id="split-items" class="space-y-3 mb-4"></div>
            <button type="button" id="add-split-item" class="bg-gray-500 text-white py-1 px-3 rounded text-sm mb-4">+ Ajouter une ligne</button>
            <div class="mt-6 flex justify-end">
                <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg mr-2">Annuler</button>
                <button type="submit" class="bg-indigo-600 text-white py-2 px-4 rounded-lg">Valider</button>
            </div>
        </form>`;

    openModal('Fractionner la Transaction', content, 'max-w-2xl');

    const addSplitItemButton = document.getElementById('add-split-item');
    const splitItemsContainer = document.getElementById('split-items');

    const addSplitItem = () => {
        const itemIndex = splitItemsContainer.children.length;
        const categoriesHtml = Object.keys(state.categories.expense).map(cat => 
            `<optgroup label="${cat}">
                ${state.categories.expense[cat].map(sub => `<option value="${cat}|${sub}">${sub}</option>`).join('')}
            </optgroup>`
        ).join('');

        const itemHtml = `
            <div class="grid grid-cols-12 gap-2 items-center border p-2 rounded">
                <input type="text" name="split_desc_${itemIndex}" placeholder="Description" class="col-span-4 p-2 border rounded text-sm" required>
                <input type="number" name="split_amount_${itemIndex}" placeholder="Montant" step="0.01" min="0" class="col-span-2 p-2 border rounded text-sm" required>
                <select name="split_category_${itemIndex}" class="col-span-5 p-2 border rounded text-sm" required>${categoriesHtml}</select>
                <button type="button" class="col-span-1 bg-red-500 text-white p-2 rounded text-sm" onclick="this.parentElement.remove()">×</button>
            </div>`;
        splitItemsContainer.insertAdjacentHTML('beforeend', itemHtml);
    };

    addSplitItemButton.addEventListener('click', addSplitItem);
    addSplitItem();
    addSplitItem();
};

const handleSplitTransactionSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
    
    // Récupération des données du formulaire de transaction parent
    const parentForm = document.getElementById('transaction-form');
    if (!parentForm) return;
    
    const parentFd = new FormData(parentForm);
    const parentId = generateId();
    
    const originalAmount = parseFloat(parentFd.get('originalAmount'));
    const originalCurrency = parentFd.get('originalCurrency');
    const rate = state.exchangeRates[originalCurrency] || 1;
    
    // Créer la transaction parent
    state.transactions.push({
        id: parentId,
        type: 'expense',
        description: parentFd.get('description'),
        amount: originalAmount / rate,
        originalAmount,
        originalCurrency,
        date: parentFd.get('date'),
        accountId: parentFd.get('accountId'),
        category: 'Fractionné',
        subCategory: null,
        tags: [],
        notes: parentFd.get('notes') || '',
        recurring: false,
        isSplit: true,
        parentTransactionId: null,
        linkedTo: null
    });
    
    // Créer les sous-transactions
    const splitItemsContainer = document.getElementById('split-items');
    const itemCount = splitItemsContainer.children.length;
    
    for (let i = 0; i < itemCount; i++) {
        const description = fd.get(`split_desc_${i}`);
        const amount = parseFloat(fd.get(`split_amount_${i}`));
        const categoryValue = fd.get(`split_category_${i}`);
        
        if (description && amount && categoryValue) {
            const [category, subCategory] = categoryValue.split('|');
            
            state.transactions.push({
                id: generateId(),
                type: 'expense',
                description,
                amount: amount / rate,
                originalAmount: amount,
                originalCurrency,
                date: parentFd.get('date'),
                accountId: parentFd.get('accountId'),
                category,
                subCategory,
                tags: ['fractionné'],
                notes: '',
                recurring: false,
                isSplit: false,
                parentTransactionId: parentId,
                linkedTo: null
            });
        }
    }
    
    closeModal();
    fullUpdate();
};

// ========== TRANSFER MODAL ========== //
const showTransferModal = () => {
    const accountsOptions = state.accounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
    const currencyOptions = Object.keys(state.exchangeRates).map(c => `<option value="${c}" ${c === state.baseCurrency ? 'selected' : ''}>${c}</option>`).join('');

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

// ========== OCR MODAL ========== //
const showOcrUploadModal = () => {
    const content = `
        <div class="space-y-4">
            <p>Téléchargez une image de ticket de caisse pour extraire automatiquement les transactions.</p>
            <input type="file" id="ocr-image-input" accept="image/*" class="w-full p-2 border rounded">
            <div id="ocr-status" class="text-sm text-gray-600"></div>
            <div class="w-full bg-gray-200 rounded-full h-2.5">
                <div id="ocr-progress-bar" class="bg-indigo-600 h-2.5 rounded-full" style="width: 0%"></div>
            </div>
            <div class="mt-6 flex justify-end">
                <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg">Fermer</button>
            </div>
        </div>`;

    openModal('Scanner un Ticket (OCR)', content, 'max-w-md');

    document.getElementById('ocr-image-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                handleImageUploadForOcr(event.target.result);
            };
            reader.readAsDataURL(file);
        }
    });
};

const showOcrValidationModal = (detectedItems) => {
    const accountsOptions = state.accounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
    const expenseCategories = Object.keys(state.categories.expense).map(cat => `<option value="${cat}">${cat}</option>`).join('');

    const itemsHtml = detectedItems.map((item, index) => `
        <tr class="border-b" data-item-row>
            <td class="p-2 align-middle text-center"><input type="checkbox" name="include_${index}" checked class="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"></td>
            <td class="p-2 align-middle"><input type="text" name="description_${index}" value="${item.description}" class="w-full p-2 border rounded"></td>
            <td class="p-2 align-middle"><input type="number" name="amount_${index}" value="${item.amount.toFixed(2)}" step="0.01" min="0" class="w-24 p-2 border rounded"></td>
            <td class="p-2 align-middle"><select name="category_${index}" class="w-full p-2 border rounded"><option value="">-- Catégorie --</option>${expenseCategories}</select></td>
        </tr>
    `).join('');

    const content = `
        <p class="mb-4">Vérifiez les transactions détectées et validez-les.</p>
        <form id="ocr-validation-form">
            <div class="mb-4 grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium">Compte à débiter</label>
                    <select name="accountId" required class="w-full p-2 border rounded">${accountsOptions}</select>
                </div>
                <div>
                    <label class="block text-sm font-medium">Date</label>
                    <input type="date" name="date" value="${today()}" required class="w-full p-2 border rounded">
                </div>
            </div>
            <div class="overflow-x-auto max-h-64 border rounded">
                <table class="w-full text-left">
                    <thead class="bg-gray-50 sticky top-0">
                        <tr><th class="p-2">Incl.</th><th class="p-2">Description</th><th class="p-2">Montant</th><th class="p-2">Catégorie</th></tr>
                    </thead>
                    <tbody>${itemsHtml}</tbody>
                </table>
            </div>
            <div class="mt-6 flex justify-end">
                <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg mr-2">Annuler</button>
                <button type="submit" class="bg-indigo-600 text-white py-2 px-4 rounded-lg">Ajouter les Transactions</button>
            </div>
        </form>`;

    openModal('Valider les Transactions', content, 'max-w-4xl');
};

const handleOcrValidationSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
    const accountId = fd.get('accountId');
    const date = fd.get('date');
    const rows = form.querySelectorAll('[data-item-row]');

    let addedCount = 0;
    rows.forEach((row, index) => {
        if (fd.get(`include_${index}`)) {
            const description = fd.get(`description_${index}`);
            const amount = parseFloat(fd.get(`amount_${index}`));
            const category = fd.get(`category_${index}`);

            if (description && amount > 0 && category && accountId) {
                state.transactions.push({
                    id: generateId(),
                    type: 'expense',
                    description,
                    amount,
                    originalAmount: amount,
                    originalCurrency: state.baseCurrency,
                    date,
                    accountId,
                    category,
                    subCategory: null,
                    linkedTo: null
                });
                addedCount++;
            }
        }
    });

    if (addedCount > 0) {
        showToast(`${addedCount} transaction(s) ajoutée(s) !`);
    }

    fullUpdate();
};
