// =====================================================
// API CALLS - Appels externes (taux de change, crypto)
// =====================================================

// Initialisation de PDF.js
document.addEventListener('DOMContentLoaded', () => {
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;
    }
});

// ========== API FUNCTIONS MODULE ========== //

// Récupération des taux de change avec timeout et gestion d'erreur
const fetchExchangeRates = async (isSilent = false) => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(`https://api.frankfurter.app/latest?from=CHF`, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.rates) {
            throw new Error('Format de réponse invalide');
        }
        
        const convertedRates = {};
        for (const currency in data.rates) {
            convertedRates[currency] = 1 / data.rates[currency];
        }
        
        // Récupération du prix BTC
        try {
            const btcController = new AbortController();
            const btcTimeoutId = setTimeout(() => btcController.abort(), 10000);
            
            const btcResponse = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=chf`, {
                signal: btcController.signal,
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });
            
            clearTimeout(btcTimeoutId);
            
            if (btcResponse.ok) {
                const btcData = await btcResponse.json();
                if (btcData.bitcoin && btcData.bitcoin.chf) {
                    convertedRates['BTC'] = btcData.bitcoin.chf;
                }
            }
        } catch (btcError) {
            console.warn('Impossible de récupérer le prix BTC:', btcError);
        }
        
        if (typeof state !== 'undefined') {
            state.exchangeRates = { ...state.exchangeRates, ...convertedRates, CHF: 1 };
            if (typeof invalidateBalanceCache === 'function') invalidateBalanceCache();
        }
        
        if (!isSilent && typeof showToast === 'function') {
            showToast('Taux de change mis à jour (BTC inclus).');
        }
    } catch (error) {
        console.error('Erreur taux de change:', error);
        const errorMessage = error.name === 'AbortError' ? 'Timeout de la requête' : 'Impossible de mettre à jour les taux';
        if (!isSilent && typeof showToast === 'function') {
            showToast(errorMessage, 'error');
        }
    }
};

// Récupération des prix crypto
const fetchCryptoPrices = async () => {
    if (typeof state === 'undefined' || !state.investments) return;
    
    const cryptoInvestments = state.investments.filter(inv => inv.type === 'Crypto' && inv.ticker?.trim());
    if (cryptoInvestments.length === 0) {
        if (typeof showToast === 'function') showToast('Aucun investissement crypto valide.', 'info');
        return;
    }

    const ids = cryptoInvestments.map(inv => inv.ticker).join(',');

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=chf`, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`API CoinGecko HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        let updatedCount = 0;

        cryptoInvestments.forEach(inv => {
            if (data[inv.ticker]?.chf) {
                inv.currentValue = data[inv.ticker].chf;
                updatedCount++;
            }
        });

        if (updatedCount > 0) {
            if (typeof showToast === 'function') showToast(`${updatedCount} prix crypto mis à jour !`);
            if (typeof invalidateBalanceCache === 'function') invalidateBalanceCache();
            if (typeof fullUpdate === 'function') fullUpdate();
        } else {
            if (typeof showToast === 'function') showToast('Aucun prix mis à jour.', 'error');
        }
    } catch (error) {
        console.error('Erreur prix crypto:', error);
        const errorMessage = error.name === 'AbortError' ? 'Timeout de la requête crypto' : 'Erreur récupération prix crypto';
        if (typeof showToast === 'function') showToast(errorMessage, 'error');
    }
};

// =====================================================
// OCR - Reconnaissance de texte
// =====================================================

const handleImageUploadForOcr = async (imageSource) => {
    const statusEl = document.getElementById('ocr-status');
    const progressBarEl = document.getElementById('ocr-progress-bar');

    if (!statusEl || !progressBarEl) {
        console.error('Éléments OCR introuvables');
        return;
    }

    let worker = null;
    try {
        statusEl.textContent = 'Initialisation OCR...';
        progressBarEl.style.width = '0%';
        
        worker = await Tesseract.createWorker('fra', 1, {
            logger: m => {
                if (m.status === 'recognizing text') {
                    const progress = Math.round(m.progress * 100);
                    statusEl.textContent = `Analyse... (${progress}%)`;
                    progressBarEl.style.width = `${progress}%`;
                } else if (m.status) {
                    statusEl.textContent = `${m.status}...`;
                }
            },
        });

        const { data: { text, confidence } } = await worker.recognize(imageSource);
        
        statusEl.textContent = "Analyse terminée !";
        progressBarEl.style.width = '100%';

        if (confidence < 30) {
            showToast('Qualité d\'image faible, résultats peu fiables', 'warning');
        }

        const detectedItems = parseOcrText(text);
        if (detectedItems.length > 0) {
            showOcrValidationModal(detectedItems);
        } else {
            showToast("Aucune transaction détectée. Vérifiez la qualité de l'image.", 'error');
            closeModal();
        }
    } catch (error) {
        console.error("Erreur OCR:", error);
        showToast(`Erreur analyse OCR: ${error.message}`, 'error');
        closeModal();
    } finally {
        if (worker) {
            try {
                await worker.terminate();
            } catch (terminateError) {
                console.warn('Erreur fermeture worker OCR:', terminateError);
            }
        }
    }
};

const parseOcrText = (text) => {
    if (!text || typeof text !== 'string') {
        console.warn('Texte OCR invalide ou vide');
        return [];
    }
    
    const items = [];
    const patterns = [
        /(.+?)\s+([\d,]+[.,]\d{2})\s*€?/g,
        /(.+?)\s+([\d,]+[.,]\d{2})$/gm,
        /^(.+?)\s+([\d,]+[.,]\d{2})/gm
    ];
    
    const excludeKeywords = /total|tva|rendu|carte|solde|montant|sous-total|tva|tvac|ht|ttc|change|espèces|cb|visa|mastercard|ticket|facture|merci|au revoir/i;
    
    patterns.forEach(regex => {
        let match;
        while ((match = regex.exec(text)) !== null) {
            const description = match[1].trim();
            const amountStr = match[2].replace(',', '.');
            const amount = parseFloat(amountStr);

            if (!excludeKeywords.test(description) && 
                description.length > 2 && 
                description.length < 100 &&
                amount > 0 && 
                amount < 10000 &&
                !items.some(item => item.description === description)) {
                items.push({ description, amount });
            }
        }
    });

    return items.sort((a, b) => b.amount - a.amount).slice(0, 20);
};
