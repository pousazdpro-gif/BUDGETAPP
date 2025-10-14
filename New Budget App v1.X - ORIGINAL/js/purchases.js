// ========== PURCHASES MODULE ========== //

// Attendre que les autres modules soient chargés
document.addEventListener('DOMContentLoaded', () => {
    // Vérifier que les fonctions nécessaires sont disponibles
    if (typeof state === 'undefined' || typeof saveState === 'undefined' || typeof showToast === 'undefined') {
        console.error('Les fonctions nécessaires (state, saveState, showToast) ne sont pas disponibles. Purchases module non initialisé.');
        return;
    }

    // Structure des achats dans l'état global
    if (!state.purchases) {
        state.purchases = [];
    }

    console.log('Purchases module initialisé avec succès');

    // Générer un ID unique pour un nouvel achat
    const generatePurchaseId = () => {
        return 'purchase_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    };

    // Ajouter un nouvel achat
    const addPurchase = (purchaseData) => {
        const purchase = {
            id: generatePurchaseId(),
            nom: purchaseData.nom || '',
            prix: parseFloat(purchaseData.prix) || 0,
            prixPromotionnel: purchaseData.prixPromotionnel ? parseFloat(purchaseData.prixPromotionnel) : null,
            dateAchat: purchaseData.dateAchat || new Date().toISOString().split('T')[0],
            datePromotion: purchaseData.datePromotion || null,
            magasin: purchaseData.magasin || '',
            categorie: purchaseData.categorie || 'Non catégorisé',
            notes: purchaseData.notes || '',
            createdAt: new Date().toISOString()
        };

        state.purchases.push(purchase);
        saveState();

        showToast('Achat ajouté avec succès !');
        return purchase;
    };

    // Mettre à jour un achat existant
    const updatePurchase = (purchaseId, updates) => {
        const purchase = state.purchases.find(p => p.id === purchaseId);
        if (!purchase) {
            showToast('Achat non trouvé.', 'error');
            return null;
        }

        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined) {
                purchase[key] = updates[key];
            }
        });

        purchase.updatedAt = new Date().toISOString();
        saveState();

        showToast('Achat mis à jour.');
        return purchase;
    };

    // Supprimer un achat
    const deletePurchase = (purchaseId) => {
        const index = state.purchases.findIndex(p => p.id === purchaseId);
        if (index === -1) {
            showToast('Achat non trouvé.', 'error');
            return false;
        }

        state.purchases.splice(index, 1);
        saveState();

        showToast('Achat supprimé.');
        return true;
    };

    // Obtenir tous les achats
    const getAllPurchases = () => {
        return [...state.purchases];
    };

    // Obtenir les achats filtrés par catégorie
    const getPurchasesByCategory = (category) => {
        return state.purchases.filter(p => p.categorie === category);
    };

    // Obtenir les achats avec promotions
    const getPurchasesWithPromotions = () => {
        return state.purchases.filter(p => p.prixPromotionnel !== null && p.prixPromotionnel < p.prix);
    };

    // Obtenir les achats récents (par exemple, des 30 derniers jours)
    const getRecentPurchases = (days = 30) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        return state.purchases.filter(p => new Date(p.dateAchat) >= cutoffDate);
    };

    // Générer une liste de courses basée sur les achats récents
    const generateShoppingListFromPurchases = (includePromotionalItems = true, maxItems = 20) => {
        const recentPurchases = getRecentPurchases(60); // 60 derniers jours
        const shoppingList = [];

        // Compter la fréquence des achats par nom d'article
        const frequencyMap = {};

        recentPurchases.forEach(purchase => {
            const key = purchase.nom.toLowerCase().trim();
            if (!frequencyMap[key]) {
                frequencyMap[key] = {
                    nom: purchase.nom,
                    count: 0,
                    lastPrice: purchase.prix,
                    lastPromotionalPrice: purchase.prixPromotionnel,
                    magasin: purchase.magasin,
                    categorie: purchase.categorie
                };
            }
            frequencyMap[key].count++;
            frequencyMap[key].lastPrice = purchase.prix;
            if (purchase.prixPromotionnel) {
                frequencyMap[key].lastPromotionalPrice = purchase.prixPromotionnel;
            }
        });

        // Trier par fréquence et prendre les plus fréquents
        const sortedItems = Object.values(frequencyMap)
            .sort((a, b) => b.count - a.count)
            .slice(0, maxItems);

        sortedItems.forEach(item => {
            shoppingList.push({
                nom: item.nom,
                quantite: 1, // Par défaut 1, peut être ajusté
                prixEstime: item.lastPromotionalPrice || item.lastPrice,
                magasin: item.magasin,
                categorie: item.categorie,
                priorite: item.count > 3 ? 'haute' : item.count > 1 ? 'moyenne' : 'basse'
            });
        });

        return shoppingList;
    };

    // Fonction utilitaire pour obtenir la date d'aujourd'hui au format YYYY-MM-DD
    const today = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    };

    // Fonction utilitaire pour formater la date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR');
    };

    // Fonction utilitaire pour formater la monnaie
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'CHF'
        }).format(amount);
    };

    // Rendu de la liste des achats
    const renderPurchasesList = (purchases) => {
        if (purchases.length === 0) {
            return `
                <div class="text-center py-12">
                    <i data-lucide="shopping-cart" class="w-16 h-16 text-gray-300 mx-auto mb-4"></i>
                    <p class="text-gray-500 text-lg">Aucun achat enregistré</p>
                    <p class="text-gray-400 text-sm">Ajoutez votre premier achat pour commencer</p>
                </div>
            `;
        }

        return `
            <div class="space-y-3">
                ${purchases.map(purchase => `
                    <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <div class="flex items-center space-x-3 mb-2">
                                    <h3 class="font-medium text-gray-900">${purchase.nom}</h3>
                                    ${purchase.prixPromotionnel && purchase.prixPromotionnel < purchase.prix ?
                                        '<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Promotion</span>' :
                                        ''
                                    }
                                </div>
                                <div class="text-sm text-gray-600 space-y-1">
                                    <p><span class="font-medium">Prix:</span> ${formatCurrency(purchase.prix)}</p>
                                    ${purchase.prixPromotionnel ?
                                        `<p><span class="font-medium">Prix promo:</span> ${formatCurrency(purchase.prixPromotionnel)}</p>` :
                                        ''
                                    }
                                    <p><span class="font-medium">Date:</span> ${formatDate(purchase.dateAchat)}</p>
                                    ${purchase.datePromotion ?
                                        `<p><span class="font-medium">Date promo:</span> ${formatDate(purchase.datePromotion)}</p>` :
                                        ''
                                    }
                                    <p><span class="font-medium">Magasin:</span> ${purchase.magasin}</p>
                                    <p><span class="font-medium">Catégorie:</span> ${purchase.categorie}</p>
                                    ${purchase.notes ? `<p><span class="font-medium">Notes:</span> ${purchase.notes}</p>` : ''}
                                </div>
                            </div>
                            <div class="flex space-x-2">
                                <button class="edit-purchase-btn text-indigo-600 hover:text-indigo-800 p-1"
                                        data-purchase-id="${purchase.id}" title="Modifier">
                                    <i data-lucide="edit" class="w-4 h-4"></i>
                                </button>
                                <button class="delete-purchase-btn text-red-600 hover:text-red-800 p-1"
                                        data-purchase-id="${purchase.id}" title="Supprimer">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    };

    // Afficher la modale d'ajout d'achat
    const showAddPurchaseModal = () => {
        const categories = [
            'Alimentation', 'Hygiène', 'Maison', 'Vêtements', 'Électronique',
            'Loisirs', 'Santé', 'Transport', 'Animaux', 'Divers'
        ];

        const categoryOptions = categories.map(cat =>
            `<option value="${cat}">${cat}</option>`
        ).join('');

        const modalContent = `
            <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Nom de l'article *</label>
                        <input type="text" id="purchase-nom" class="w-full p-2 border rounded" placeholder="Ex: Lait, Pain, Shampooing" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Catégorie</label>
                        <select id="purchase-categorie" class="w-full p-2 border rounded">
                            ${categoryOptions}
                        </select>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Prix normal (CHF) *</label>
                        <input type="number" id="purchase-prix" class="w-full p-2 border rounded" step="0.01" min="0" placeholder="0.00" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Prix promotionnel (CHF)</label>
                        <input type="number" id="purchase-prix-promo" class="w-full p-2 border rounded" step="0.01" min="0" placeholder="0.00 (optionnel)">
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Date d'achat</label>
                        <input type="date" id="purchase-date" class="w-full p-2 border rounded" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Date de promotion</label>
                        <input type="date" id="purchase-date-promo" class="w-full p-2 border rounded" placeholder="Quand retourner?">
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Magasin</label>
                        <input type="text" id="purchase-magasin" class="w-full p-2 border rounded" placeholder="Ex: Migros, Coop, Lidl">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Notes</label>
                        <input type="text" id="purchase-notes" class="w-full p-2 border rounded" placeholder="Informations supplémentaires">
                    </div>
                </div>

                <div class="bg-blue-50 p-3 rounded-lg">
                    <p class="text-sm text-blue-800">
                        <strong>Conseil:</strong> Notez la date de promotion pour savoir quand retourner chercher cet article en promotion !
                    </p>
                </div>

                <div class="flex justify-end space-x-2 pt-4 border-t">
                    <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg">Annuler</button>
                    <button id="save-purchase-btn" class="bg-indigo-600 text-white py-2 px-4 rounded-lg">Enregistrer</button>
                </div>
            </div>
        `;

        // Utiliser la fonction openModal de l'application principale
        if (typeof openModal === 'function') {
            openModal('Ajouter un achat', modalContent, 'max-w-2xl');
        } else {
            console.error('openModal function not found');
            return;
        }

        setTimeout(() => {
            document.getElementById('save-purchase-btn')?.addEventListener('click', () => {
                saveNewPurchase();
            });
        }, 100);
    };

    // Sauvegarder un nouvel achat
    const saveNewPurchase = () => {
        const nom = document.getElementById('purchase-nom').value.trim();
        const prix = document.getElementById('purchase-prix').value;
        const prixPromo = document.getElementById('purchase-prix-promo').value;
        const dateAchat = document.getElementById('purchase-date').value;
        const datePromo = document.getElementById('purchase-date-promo').value;
        const magasin = document.getElementById('purchase-magasin').value.trim();
        const categorie = document.getElementById('purchase-categorie').value;
        const notes = document.getElementById('purchase-notes').value.trim();

        if (!nom || !prix) {
            showToast('Veuillez remplir au moins le nom et le prix.', 'error');
            return;
        }

        const purchaseData = {
            nom,
            prix: parseFloat(prix),
            prixPromotionnel: prixPromo ? parseFloat(prixPromo) : null,
            dateAchat,
            datePromotion: datePromo || null,
            magasin,
            categorie,
            notes
        };

        addPurchase(purchaseData);

        // Fermer la modale et rafraîchir la page
        if (typeof closeModal === 'function') {
            closeModal();
        }

        // Rafraîchir l'affichage des achats
        if (typeof window.renderPurchases === 'function') {
            window.renderPurchases();
        }
    };

    // Afficher la modale de modification d'achat
    const showEditPurchaseModal = (purchaseId) => {
        const purchase = state.purchases.find(p => p.id === purchaseId);
        if (!purchase) {
            showToast('Achat non trouvé.', 'error');
            return;
        }

        const categories = [
            'Alimentation', 'Hygiène', 'Maison', 'Vêtements', 'Électronique',
            'Loisirs', 'Santé', 'Transport', 'Animaux', 'Divers'
        ];

        const categoryOptions = categories.map(cat =>
            `<option value="${cat}" ${cat === purchase.categorie ? 'selected' : ''}>${cat}</option>`
        ).join('');

        const modalContent = `
            <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Nom de l'article *</label>
                        <input type="text" id="edit-purchase-nom" class="w-full p-2 border rounded" value="${purchase.nom}" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Catégorie</label>
                        <select id="edit-purchase-categorie" class="w-full p-2 border rounded">
                            ${categoryOptions}
                        </select>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Prix normal (CHF) *</label>
                        <input type="number" id="edit-purchase-prix" class="w-full p-2 border rounded" step="0.01" min="0" value="${purchase.prix}" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Prix promotionnel (CHF)</label>
                        <input type="number" id="edit-purchase-prix-promo" class="w-full p-2 border rounded" step="0.01" min="0" value="${purchase.prixPromotionnel || ''}" placeholder="0.00 (optionnel)">
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Date d'achat</label>
                        <input type="date" id="edit-purchase-date" class="w-full p-2 border rounded" value="${purchase.dateAchat}">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Date de promotion</label>
                        <input type="date" id="edit-purchase-date-promo" class="w-full p-2 border rounded" value="${purchase.datePromotion || ''}">
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Magasin</label>
                        <input type="text" id="edit-purchase-magasin" class="w-full p-2 border rounded" value="${purchase.magasin}">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Notes</label>
                        <input type="text" id="edit-purchase-notes" class="w-full p-2 border rounded" value="${purchase.notes}">
                    </div>
                </div>

                <div class="flex justify-end space-x-2 pt-4 border-t">
                    <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg">Annuler</button>
                    <button id="update-purchase-btn" class="bg-indigo-600 text-white py-2 px-4 rounded-lg">Mettre à jour</button>
                </div>
            </div>
        `;

        if (typeof openModal === 'function') {
            openModal('Modifier l\'achat', modalContent, 'max-w-2xl');
        } else {
            console.error('openModal function not found');
            return;
        }

        setTimeout(() => {
            document.getElementById('update-purchase-btn')?.addEventListener('click', () => {
                updateExistingPurchase(purchaseId);
            });
        }, 100);
    };

    // Mettre à jour un achat existant
    const updateExistingPurchase = (purchaseId) => {
        const nom = document.getElementById('edit-purchase-nom').value.trim();
        const prix = document.getElementById('edit-purchase-prix').value;
        const prixPromo = document.getElementById('edit-purchase-prix-promo').value;
        const dateAchat = document.getElementById('edit-purchase-date').value;
        const datePromo = document.getElementById('edit-purchase-date-promo').value;
        const magasin = document.getElementById('edit-purchase-magasin').value.trim();
        const categorie = document.getElementById('edit-purchase-categorie').value;
        const notes = document.getElementById('edit-purchase-notes').value.trim();

        if (!nom || !prix) {
            showToast('Veuillez remplir au moins le nom et le prix.', 'error');
            return;
        }

        const updates = {
            nom,
            prix: parseFloat(prix),
            prixPromotionnel: prixPromo ? parseFloat(prixPromo) : null,
            dateAchat,
            datePromotion: datePromo || null,
            magasin,
            categorie,
            notes
        };

        updatePurchase(purchaseId, updates);

        // Fermer la modale et rafraîchir la page
        if (typeof closeModal === 'function') {
            closeModal();
        }

        // Rafraîchir l'affichage des achats
        if (typeof window.renderPurchases === 'function') {
            window.renderPurchases();
        }
    };

    // Initialisation des événements pour la page des achats
    const initPurchasesEvents = () => {
        // Bouton ajouter achat
        document.getElementById('add-purchase-btn')?.addEventListener('click', () => {
            showAddPurchaseModal();
        });

        // Bouton générer liste de courses
        document.getElementById('generate-shopping-list-btn')?.addEventListener('click', () => {
            generateAndShowShoppingList();
        });

        // Onglets de filtrage
        document.getElementById('all-purchases-tab')?.addEventListener('click', () => {
            switchPurchasesTab('all');
        });

        document.getElementById('promotions-tab')?.addEventListener('click', () => {
            switchPurchasesTab('promotions');
        });

        document.getElementById('recent-tab')?.addEventListener('click', () => {
            switchPurchasesTab('recent');
        });

        // Boutons d'édition et suppression
        document.querySelectorAll('.edit-purchase-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const purchaseId = e.currentTarget.dataset.purchaseId;
                showEditPurchaseModal(purchaseId);
            });
        });

        document.querySelectorAll('.delete-purchase-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const purchaseId = e.currentTarget.dataset.purchaseId;
                if (confirm('Êtes-vous sûr de vouloir supprimer cet achat ?')) {
                    deletePurchase(purchaseId);
                    window.renderPurchases();
                }
            });
        });

        // Réinitialiser les icônes Lucide
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
    };

    // Basculer entre les onglets d'achats
    const switchPurchasesTab = (tab) => {
        // Mettre à jour l'apparence des onglets
        document.querySelectorAll('[id$="-tab"]').forEach(tabBtn => {
            tabBtn.className = 'py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm';
        });

        document.getElementById(`${tab}-purchases-tab`).className = 'py-4 px-1 border-b-2 border-indigo-500 text-indigo-600 font-medium text-sm';

        // Mettre à jour le contenu
        const contentDiv = document.getElementById('purchases-content');
        let purchases = [];

        switch (tab) {
            case 'all':
                purchases = getAllPurchases();
                break;
            case 'promotions':
                purchases = getPurchasesWithPromotions();
                break;
            case 'recent':
                purchases = getRecentPurchases(7);
                break;
        }

        contentDiv.innerHTML = renderPurchasesList(purchases);
        initPurchasesEvents(); // Réinitialiser les événements
    };

    // Générer et afficher la liste de courses
    const generateAndShowShoppingList = () => {
        const shoppingList = generateShoppingListFromPurchases();

        if (shoppingList.length === 0) {
            showToast('Aucun achat récent trouvé pour générer une liste.', 'info');
            return;
        }

        const listContent = shoppingList.map(item => `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div class="flex-1">
                    <h4 class="font-medium">${item.nom}</h4>
                    <p class="text-sm text-gray-600">${item.categorie} • ${item.magasin}</p>
                </div>
                <div class="flex items-center space-x-2">
                    <span class="text-sm font-medium">${formatCurrency(item.prixEstime)}</span>
                    <span class="px-2 py-1 bg-${item.priorite === 'haute' ? 'red' : item.priorite === 'moyenne' ? 'yellow' : 'green'}-100 text-${item.priorite === 'haute' ? 'red' : item.priorite === 'moyenne' ? 'yellow' : 'green'}-800 text-xs rounded">${item.priorite}</span>
                </div>
            </div>
        `).join('');

        const section = document.getElementById('shopping-list-section');
        const content = document.getElementById('shopping-list-content');

        content.innerHTML = `
            <div class="space-y-3 mb-4">
                ${listContent}
            </div>
            <div class="flex justify-between items-center pt-4 border-t">
                <p class="text-sm text-gray-600">${shoppingList.length} articles suggérés</p>
                <button id="export-shopping-list-btn" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
                    <i data-lucide="download" class="w-4 h-4"></i>
                    <span>Exporter</span>
                </button>
            </div>
        `;

        section.classList.remove('hidden');

        setTimeout(() => {
            document.getElementById('export-shopping-list-btn')?.addEventListener('click', () => {
                exportShoppingListToCSV(shoppingList);
            });

            // Réinitialiser les icônes Lucide
            if (typeof lucide !== 'undefined' && lucide.createIcons) {
                lucide.createIcons();
            }
        }, 100);
    };

    // Exporter la liste de courses en CSV
    const exportShoppingListToCSV = (shoppingList) => {
        const headers = ['Article', 'Catégorie', 'Magasin', 'Prix estimé', 'Priorité'];
        const csvRows = [headers.join(',')];

        shoppingList.forEach(item => {
            const row = [
                `"${item.nom.replace(/"/g, '""')}"`,
                item.categorie,
                item.magasin,
                item.prixEstime.toFixed(2),
                item.priorite
            ];
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `liste-courses-${today()}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        showToast('Liste de courses exportée !');
    };

    // Exposer les fonctions globalement pour qu'elles soient accessibles depuis render.js
    window.renderPurchases = function() {
        const content = document.getElementById('main-content');
        if (!content) return;

        const purchases = getAllPurchases();
        const purchasesWithPromotions = getPurchasesWithPromotions();
        const recentPurchases = getRecentPurchases(7);

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

                    <div id="purchases-content" class="p-6">
                        ${renderPurchasesList(purchases)}
                    </div>
                </div>

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

        setTimeout(() => {
            initPurchasesEvents();
        }, 100);
    };

    // Générer un ID unique pour un nouvel achat
    const generatePurchaseId = () => {
        return 'purchase_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
const addPurchase = (purchaseData) => {
    const purchase = {
        id: generatePurchaseId(),
        nom: purchaseData.nom || '',
        prix: parseFloat(purchaseData.prix) || 0,
        prixPromotionnel: purchaseData.prixPromotionnel ? parseFloat(purchaseData.prixPromotionnel) : null,
        dateAchat: purchaseData.dateAchat || new Date().toISOString().split('T')[0],
        datePromotion: purchaseData.datePromotion || null,
        magasin: purchaseData.magasin || '',
        categorie: purchaseData.categorie || 'Non catégorisé',
        notes: purchaseData.notes || '',
        createdAt: new Date().toISOString()
    };

    state.purchases.push(purchase);
    saveState();

    showToast('Achat ajouté avec succès !');
    return purchase;
};

// Mettre à jour un achat existant
const updatePurchase = (purchaseId, updates) => {
    const purchase = state.purchases.find(p => p.id === purchaseId);
    if (!purchase) {
        showToast('Achat non trouvé.', 'error');
        return null;
    }

    Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
            purchase[key] = updates[key];
        }
    });

    purchase.updatedAt = new Date().toISOString();
    saveState();

    showToast('Achat mis à jour.');
    return purchase;
};

// Supprimer un achat
const deletePurchase = (purchaseId) => {
    const index = state.purchases.findIndex(p => p.id === purchaseId);
    if (index === -1) {
        showToast('Achat non trouvé.', 'error');
        return false;
    }

    state.purchases.splice(index, 1);
    saveState();

    showToast('Achat supprimé.');
    return true;
};

// Obtenir tous les achats
const getAllPurchases = () => {
    return [...state.purchases];
};

// Obtenir les achats filtrés par catégorie
const getPurchasesByCategory = (category) => {
    return state.purchases.filter(p => p.categorie === category);
};

// Obtenir les achats avec promotions
const getPurchasesWithPromotions = () => {
    return state.purchases.filter(p => p.prixPromotionnel !== null && p.prixPromotionnel < p.prix);
};

// Obtenir les achats récents (par exemple, des 30 derniers jours)
const getRecentPurchases = (days = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return state.purchases.filter(p => new Date(p.dateAchat) >= cutoffDate);
};

// Générer une liste de courses basée sur les achats récents
const generateShoppingListFromPurchases = (includePromotionalItems = true, maxItems = 20) => {
    const recentPurchases = getRecentPurchases(60); // 60 derniers jours
    const shoppingList = [];

    // Compter la fréquence des achats par nom d'article
    const frequencyMap = {};

    recentPurchases.forEach(purchase => {
        const key = purchase.nom.toLowerCase().trim();
        if (!frequencyMap[key]) {
            frequencyMap[key] = {
                nom: purchase.nom,
                count: 0,
                lastPrice: purchase.prix,
                lastPromotionalPrice: purchase.prixPromotionnel,
                magasin: purchase.magasin,
                categorie: purchase.categorie
            };
        }
        frequencyMap[key].count++;
        frequencyMap[key].lastPrice = purchase.prix;
        if (purchase.prixPromotionnel) {
            frequencyMap[key].lastPromotionalPrice = purchase.prixPromotionnel;
        }
    });

    // Trier par fréquence et prendre les plus fréquents
    const sortedItems = Object.values(frequencyMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, maxItems);

    sortedItems.forEach(item => {
        shoppingList.push({
            nom: item.nom,
            quantite: 1, // Par défaut 1, peut être ajusté
            prixEstime: item.lastPromotionalPrice || item.lastPrice,
            magasin: item.magasin,
            categorie: item.categorie,
            priorite: item.count > 3 ? 'haute' : item.count > 1 ? 'moyenne' : 'basse'
        });
    });

    return shoppingList;
};

// Exporter les achats au format CSV
const exportPurchasesToCSV = () => {
    if (state.purchases.length === 0) {
        showToast('Aucun achat à exporter.', 'info');
        return;
    }

    const headers = ['Date d\'achat', 'Nom de l\'article', 'Prix normal', 'Prix promotionnel', 'Magasin', 'Catégorie', 'Notes'];
    const csvRows = [headers.join(',')];

    state.purchases.forEach(purchase => {
        const row = [
            purchase.dateAchat,
            `"${purchase.nom.replace(/"/g, '""')}"`,
            purchase.prix.toFixed(2),
            purchase.prixPromotionnel ? purchase.prixPromotionnel.toFixed(2) : '',
            `"${purchase.magasin.replace(/"/g, '""')}"`,
            `"${purchase.categorie.replace(/"/g, '""')}"`,
            `"${purchase.notes.replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `achats-${today()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('Export des achats démarré.');
};

// Importer des achats depuis un fichier CSV
const importPurchasesFromCSV = (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const csv = e.target.result;
            const lines = csv.split('\n');
            const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

            // Mapping des colonnes attendues
            const dateIndex = headers.indexOf('Date d\'achat');
            const nomIndex = headers.indexOf('Nom de l\'article');
            const prixIndex = headers.indexOf('Prix normal');
            const prixPromoIndex = headers.indexOf('Prix promotionnel');
            const magasinIndex = headers.indexOf('Magasin');
            const categorieIndex = headers.indexOf('Catégorie');
            const notesIndex = headers.indexOf('Notes');

            let importedCount = 0;

            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
                if (values.length < 3 || !values[nomIndex]) continue;

                const purchaseData = {
                    nom: values[nomIndex] || '',
                    prix: parseFloat(values[prixIndex]) || 0,
                    prixPromotionnel: values[prixPromoIndex] ? parseFloat(values[prixPromoIndex]) : null,
                    dateAchat: values[dateIndex] || new Date().toISOString().split('T')[0],
                    magasin: values[magasinIndex] || '',
                    categorie: values[categorieIndex] || 'Non catégorisé',
                    notes: values[notesIndex] || ''
                };

                addPurchase(purchaseData);
                importedCount++;
            }

            showToast(`${importedCount} achats importés avec succès !`);
        } catch (error) {
            showToast(`Erreur lors de l'import : ${error.message}`, 'error');
        }
    };
    reader.readAsText(file);
};

// Fonction utilitaire pour formater la date
const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
};

// Fonction utilitaire pour formater la monnaie
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'CHF'
    }).format(amount);
};

// Rendu de la liste des achats
const renderPurchasesList = (purchases) => {
    if (purchases.length === 0) {
        return `
            <div class="text-center py-12">
                <i data-lucide="shopping-cart" class="w-16 h-16 text-gray-300 mx-auto mb-4"></i>
                <p class="text-gray-500 text-lg">Aucun achat enregistré</p>
                <p class="text-gray-400 text-sm">Ajoutez votre premier achat pour commencer</p>
            </div>
        `;
    }

    return `
        <div class="space-y-3">
            ${purchases.map(purchase => `
                <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <div class="flex items-center space-x-3 mb-2">
                                <h3 class="font-medium text-gray-900">${purchase.nom}</h3>
                                ${purchase.prixPromotionnel && purchase.prixPromotionnel < purchase.prix ?
                                    '<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Promotion</span>' :
                                    ''
                                }
                            </div>
                            <div class="text-sm text-gray-600 space-y-1">
                                <p><span class="font-medium">Prix:</span> ${formatCurrency(purchase.prix)}</p>
                                ${purchase.prixPromotionnel ?
                                    `<p><span class="font-medium">Prix promo:</span> ${formatCurrency(purchase.prixPromotionnel)}</p>` :
                                    ''
                                }
                                <p><span class="font-medium">Date:</span> ${formatDate(purchase.dateAchat)}</p>
                                ${purchase.datePromotion ?
                                    `<p><span class="font-medium">Date promo:</span> ${formatDate(purchase.datePromotion)}</p>` :
                                    ''
                                }
                                <p><span class="font-medium">Magasin:</span> ${purchase.magasin}</p>
                                <p><span class="font-medium">Catégorie:</span> ${purchase.categorie}</p>
                                ${purchase.notes ? `<p><span class="font-medium">Notes:</span> ${purchase.notes}</p>` : ''}
                            </div>
                        </div>
                        <div class="flex space-x-2">
                            <button class="edit-purchase-btn text-indigo-600 hover:text-indigo-800 p-1"
                                    data-purchase-id="${purchase.id}" title="Modifier">
                                <i data-lucide="edit" class="w-4 h-4"></i>
                            </button>
                            <button class="delete-purchase-btn text-red-600 hover:text-red-800 p-1"
                                    data-purchase-id="${purchase.id}" title="Supprimer">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
};

// Initialisation des événements pour la page des achats
const initPurchasesEvents = () => {
    // Bouton ajouter achat
    document.getElementById('add-purchase-btn')?.addEventListener('click', () => {
        showAddPurchaseModal();
    });

    // Bouton générer liste de courses
    document.getElementById('generate-shopping-list-btn')?.addEventListener('click', () => {
        generateAndShowShoppingList();
    });

    // Onglets de filtrage
    document.getElementById('all-purchases-tab')?.addEventListener('click', () => {
        switchPurchasesTab('all');
    });

    document.getElementById('promotions-tab')?.addEventListener('click', () => {
        switchPurchasesTab('promotions');
    });

    document.getElementById('recent-tab')?.addEventListener('click', () => {
        switchPurchasesTab('recent');
    });

    // Boutons d'édition et suppression
    document.querySelectorAll('.edit-purchase-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const purchaseId = e.currentTarget.dataset.purchaseId;
            showEditPurchaseModal(purchaseId);
        });
    });

    document.querySelectorAll('.delete-purchase-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const purchaseId = e.currentTarget.dataset.purchaseId;
            if (confirm('Êtes-vous sûr de vouloir supprimer cet achat ?')) {
                deletePurchase(purchaseId);
                renderPurchases();
            }
        });
    });

    // Réinitialiser les icônes Lucide
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
};

// Afficher la modale d'ajout d'achat
const showAddPurchaseModal = () => {
    const categories = [
        'Alimentation', 'Hygiène', 'Maison', 'Vêtements', 'Électronique',
        'Loisirs', 'Santé', 'Transport', 'Animaux', 'Divers'
    ];

    const categoryOptions = categories.map(cat =>
        `<option value="${cat}">${cat}</option>`
    ).join('');

    const modalContent = `
        <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Nom de l'article *</label>
                    <input type="text" id="purchase-nom" class="w-full p-2 border rounded" placeholder="Ex: Lait, Pain, Shampooing" required>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Catégorie</label>
                    <select id="purchase-categorie" class="w-full p-2 border rounded">
                        ${categoryOptions}
                    </select>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Prix normal (CHF) *</label>
                    <input type="number" id="purchase-prix" class="w-full p-2 border rounded" step="0.01" min="0" placeholder="0.00" required>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Prix promotionnel (CHF)</label>
                    <input type="number" id="purchase-prix-promo" class="w-full p-2 border rounded" step="0.01" min="0" placeholder="0.00 (optionnel)">
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Date d'achat</label>
                    <input type="date" id="purchase-date" class="w-full p-2 border rounded" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Date de promotion</label>
                    <input type="date" id="purchase-date-promo" class="w-full p-2 border rounded" placeholder="Quand retourner?">
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Magasin</label>
                    <input type="text" id="purchase-magasin" class="w-full p-2 border rounded" placeholder="Ex: Migros, Coop, Lidl">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Notes</label>
                    <input type="text" id="purchase-notes" class="w-full p-2 border rounded" placeholder="Informations supplémentaires">
                </div>
            </div>

            <div class="bg-blue-50 p-3 rounded-lg">
                <p class="text-sm text-blue-800">
                    <strong>Conseil:</strong> Notez la date de promotion pour savoir quand retourner chercher cet article en promotion !
                </p>
            </div>

            <div class="flex justify-end space-x-2 pt-4 border-t">
                <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg">Annuler</button>
                <button id="save-purchase-btn" class="bg-indigo-600 text-white py-2 px-4 rounded-lg">Enregistrer</button>
            </div>
        </div>
    `;

    // Utiliser la fonction openModal de l'application principale
    if (typeof openModal === 'function') {
        openModal('Ajouter un achat', modalContent, 'max-w-2xl');
    } else {
        console.error('openModal function not found');
        return;
    }

    setTimeout(() => {
        document.getElementById('save-purchase-btn')?.addEventListener('click', () => {
            saveNewPurchase();
        });
    }, 100);
};

// Sauvegarder un nouvel achat
const saveNewPurchase = () => {
    const nom = document.getElementById('purchase-nom').value.trim();
    const prix = document.getElementById('purchase-prix').value;
    const prixPromo = document.getElementById('purchase-prix-promo').value;
    const dateAchat = document.getElementById('purchase-date').value;
    const datePromo = document.getElementById('purchase-date-promo').value;
    const magasin = document.getElementById('purchase-magasin').value.trim();
    const categorie = document.getElementById('purchase-categorie').value;
    const notes = document.getElementById('purchase-notes').value.trim();

    if (!nom || !prix) {
        showToast('Veuillez remplir au moins le nom et le prix.', 'error');
        return;
    }

    const purchaseData = {
        nom,
        prix: parseFloat(prix),
        prixPromotionnel: prixPromo ? parseFloat(prixPromo) : null,
        dateAchat,
        datePromotion: datePromo || null,
        magasin,
        categorie,
        notes
    };

    addPurchase(purchaseData);

    // Fermer la modale et rafraîchir la page
    if (typeof closeModal === 'function') {
        closeModal();
    }

    // Rafraîchir l'affichage des achats
    if (typeof renderPurchases === 'function') {
        renderPurchases();
    }
};

// Afficher la modale de modification d'achat
const showEditPurchaseModal = (purchaseId) => {
    const purchase = state.purchases.find(p => p.id === purchaseId);
    if (!purchase) {
        showToast('Achat non trouvé.', 'error');
        return;
    }

    const categories = [
        'Alimentation', 'Hygiène', 'Maison', 'Vêtements', 'Électronique',
        'Loisirs', 'Santé', 'Transport', 'Animaux', 'Divers'
    ];

    const categoryOptions = categories.map(cat =>
        `<option value="${cat}" ${cat === purchase.categorie ? 'selected' : ''}>${cat}</option>`
    ).join('');

    const modalContent = `
        <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Nom de l'article *</label>
                    <input type="text" id="edit-purchase-nom" class="w-full p-2 border rounded" value="${purchase.nom}" required>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Catégorie</label>
                    <select id="edit-purchase-categorie" class="w-full p-2 border rounded">
                        ${categoryOptions}
                    </select>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Prix normal (CHF) *</label>
                    <input type="number" id="edit-purchase-prix" class="w-full p-2 border rounded" step="0.01" min="0" value="${purchase.prix}" required>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Prix promotionnel (CHF)</label>
                    <input type="number" id="edit-purchase-prix-promo" class="w-full p-2 border rounded" step="0.01" min="0" value="${purchase.prixPromotionnel || ''}" placeholder="0.00 (optionnel)">
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Date d'achat</label>
                    <input type="date" id="edit-purchase-date" class="w-full p-2 border rounded" value="${purchase.dateAchat}">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Date de promotion</label>
                    <input type="date" id="edit-purchase-date-promo" class="w-full p-2 border rounded" value="${purchase.datePromotion || ''}">
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Magasin</label>
                    <input type="text" id="edit-purchase-magasin" class="w-full p-2 border rounded" value="${purchase.magasin}">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Notes</label>
                    <input type="text" id="edit-purchase-notes" class="w-full p-2 border rounded" value="${purchase.notes}">
                </div>
            </div>

            <div class="flex justify-end space-x-2 pt-4 border-t">
                <button type="button" data-action="close-modal" class="bg-gray-200 py-2 px-4 rounded-lg">Annuler</button>
                <button id="update-purchase-btn" class="bg-indigo-600 text-white py-2 px-4 rounded-lg">Mettre à jour</button>
            </div>
        </div>
    `;

    if (typeof openModal === 'function') {
        openModal('Modifier l\'achat', modalContent, 'max-w-2xl');
    } else {
        console.error('openModal function not found');
        return;
    }

    setTimeout(() => {
        document.getElementById('update-purchase-btn')?.addEventListener('click', () => {
            updateExistingPurchase(purchaseId);
        });
    }, 100);
};

// Mettre à jour un achat existant
const updateExistingPurchase = (purchaseId) => {
    const nom = document.getElementById('edit-purchase-nom').value.trim();
    const prix = document.getElementById('edit-purchase-prix').value;
    const prixPromo = document.getElementById('edit-purchase-prix-promo').value;
    const dateAchat = document.getElementById('edit-purchase-date').value;
    const datePromo = document.getElementById('edit-purchase-date-promo').value;
    const magasin = document.getElementById('edit-purchase-magasin').value.trim();
    const categorie = document.getElementById('edit-purchase-categorie').value;
    const notes = document.getElementById('edit-purchase-notes').value.trim();

    if (!nom || !prix) {
        showToast('Veuillez remplir au moins le nom et le prix.', 'error');
        return;
    }

    const updates = {
        nom,
        prix: parseFloat(prix),
        prixPromotionnel: prixPromo ? parseFloat(prixPromo) : null,
        dateAchat,
        datePromotion: datePromo || null,
        magasin,
        categorie,
        notes
    };

    updatePurchase(purchaseId, updates);

    // Fermer la modale et rafraîchir la page
    if (typeof closeModal === 'function') {
        closeModal();
    }

    // Rafraîchir l'affichage des achats
    if (typeof renderPurchases === 'function') {
        renderPurchases();
    }
};

// Générer et afficher la liste de courses
const generateAndShowShoppingList = () => {
    const shoppingList = generateShoppingListFromPurchases();

    if (shoppingList.length === 0) {
        showToast('Aucun achat récent trouvé pour générer une liste.', 'info');
        return;
    }

    const listContent = shoppingList.map(item => `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div class="flex-1">
                <h4 class="font-medium">${item.nom}</h4>
                <p class="text-sm text-gray-600">${item.categorie} • ${item.magasin}</p>
            </div>
            <div class="flex items-center space-x-2">
                <span class="text-sm font-medium">${formatCurrency(item.prixEstime)}</span>
                <span class="px-2 py-1 bg-${item.priorite === 'haute' ? 'red' : item.priorite === 'moyenne' ? 'yellow' : 'green'}-100 text-${item.priorite === 'haute' ? 'red' : item.priorite === 'moyenne' ? 'yellow' : 'green'}-800 text-xs rounded">${item.priorite}</span>
            </div>
        </div>
    `).join('');

    const section = document.getElementById('shopping-list-section');
    const content = document.getElementById('shopping-list-content');

    content.innerHTML = `
        <div class="space-y-3 mb-4">
            ${listContent}
        </div>
        <div class="flex justify-between items-center pt-4 border-t">
            <p class="text-sm text-gray-600">${shoppingList.length} articles suggérés</p>
            <button id="export-shopping-list-btn" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
                <i data-lucide="download" class="w-4 h-4"></i>
                <span>Exporter</span>
            </button>
        </div>
    `;

    section.classList.remove('hidden');

    setTimeout(() => {
        document.getElementById('export-shopping-list-btn')?.addEventListener('click', () => {
            exportShoppingListToCSV(shoppingList);
        });

        // Réinitialiser les icônes Lucide
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
    }, 100);
};

// Exporter la liste de courses en CSV
const exportShoppingListToCSV = (shoppingList) => {
    const headers = ['Article', 'Catégorie', 'Magasin', 'Prix estimé', 'Priorité'];
    const csvRows = [headers.join(',')];

    shoppingList.forEach(item => {
        const row = [
            `"${item.nom.replace(/"/g, '""')}"`,
            item.categorie,
            item.magasin,
            item.prixEstime.toFixed(2),
            item.priorite
        ];
        csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `liste-courses-${today()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('Liste de courses exportée !');
});
