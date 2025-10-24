/**
 * Storage Manager - Sistema de Persistência de Dados
 * Gerencia IndexedDB para grandes volumes de dados
 * e LocalStorage para configurações e cache
 */

import { CONFIG } from '../config.js';

class StorageManager {
    constructor() {
        this.db = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(CONFIG.storage.dbName, CONFIG.storage.dbVersion);

            request.onerror = () => {
                console.error('Erro ao abrir IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.initialized = true;
                console.log('✅ IndexedDB inicializado');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(CONFIG.storage.storeName)) {
                    const objectStore = db.createObjectStore(CONFIG.storage.storeName, { keyPath: 'id', autoIncrement: true });
                    objectStore.createIndex('odd', 'odd', { unique: false });
                    objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                    objectStore.createIndex('horario', 'horario', { unique: false });
                    console.log('📦 Object Store criado');
                }
            };
        });
    }

    async saveOdds(oddsArray) {
        await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([CONFIG.storage.storeName], 'readwrite');
            const objectStore = transaction.objectStore(CONFIG.storage.storeName);

            let saved = 0;
            let errors = 0;

            oddsArray.forEach(odd => {
                const request = objectStore.add({
                    odd: odd.odd,
                    horario: odd.horario || new Date().toLocaleTimeString('pt-BR'),
                    timestamp: odd.timestamp || Date.now(),
                    fonte: odd.fonte || 'manual',
                    data: odd.data || new Date().toLocaleDateString('pt-BR')
                });

                request.onsuccess = () => saved++;
                request.onerror = () => errors++;
            });

            transaction.oncomplete = () => {
                console.log(`✅ Salvos: ${saved} | Erros: ${errors}`);
                resolve({ saved, errors });
            };

            transaction.onerror = () => {
                console.error('Erro na transação:', transaction.error);
                reject(transaction.error);
            };
        });
    }

    async getAllOdds(limit = null) {
        await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([CONFIG.storage.storeName], 'readonly');
            const objectStore = transaction.objectStore(CONFIG.storage.storeName);
            const request = objectStore.getAll();

            request.onsuccess = () => {
                let odds = request.result;
                if (limit && odds.length > limit) {
                    odds = odds.slice(-limit);
                }
                console.log(`📊 ${odds.length} odds recuperadas`);
                resolve(odds);
            };

            request.onerror = () => {
                console.error('Erro ao recuperar odds:', request.error);
                reject(request.error);
            };
        });
    }

    async countOdds() {
        await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([CONFIG.storage.storeName], 'readonly');
            const objectStore = transaction.objectStore(CONFIG.storage.storeName);
            const request = objectStore.count();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async clearAll() {
        await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([CONFIG.storage.storeName], 'readwrite');
            const objectStore = transaction.objectStore(CONFIG.storage.storeName);
            const request = objectStore.clear();

            request.onsuccess = () => {
                console.log('🗑️  Todos os dados foram limpos');
                resolve();
            };

            request.onerror = () => reject(request.error);
        });
    }

    setLocal(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Erro ao salvar no LocalStorage:', error);
            return false;
        }
    }

    getLocal(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Erro ao ler LocalStorage:', error);
            return defaultValue;
        }
    }

    removeLocal(key) {
        localStorage.removeItem(key);
    }

    saveSettings(settings) {
        return this.setLocal(CONFIG.storage.keys.settings, settings);
    }

    getSettings() {
        return this.getLocal(CONFIG.storage.keys.settings, {});
    }
}

const storage = new StorageManager();
export default storage;
