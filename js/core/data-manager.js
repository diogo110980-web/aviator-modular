/**
 * Data Manager - Gerenciamento Central de Dados
 * Parser, validação, estado global e integração com storage/broadcast
 */

import { CONFIG } from '../config.js';
import storage from './storage.js';
import broadcast from './broadcast.js';

class DataManager {
    constructor() {
        this.state = {
            odds: [],
            filteredOdds: [],
            realtimeOdds: [],
            lastUpdate: null,
            isProcessing: false,
            filters: {},
            statistics: null,
        };

        this.listeners = new Map();
        this.setupBroadcastListeners();
    }

    setupBroadcastListeners() {
        broadcast.on('new_odd', (odd) => {
            this.addRealtimeOdd(odd);
        });

        broadcast.on('multiple_odds', ({ odds }) => {
            this.addMultipleRealtimeOdds(odds);
        });
    }

    parseRawData(rawText) {
        if (!rawText || typeof rawText !== 'string') {
            throw new Error('Dados inválidos');
        }

        const lines = rawText.split('\n').filter(line => line.trim());
        const odds = [];
        let errors = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (!line || line.startsWith('#') || line.startsWith('//')) {
                continue;
            }

            try {
                const parsed = this.parseLine(line, i);
                if (parsed) {
                    odds.push(parsed);
                }
            } catch (error) {
                errors++;
                if (CONFIG.debug.enabled) {
                    console.warn(`Erro na linha ${i + 1}: ${line}`, error);
                }
            }
        }

        console.log(`📊 Parsed: ${odds.length} odds | Erros: ${errors}`);
        return { odds, errors, total: lines.length };
    }

    parseLine(line, index = 0) {
        line = line.trim();

        const patterns = [
            /^([0-9]+\.?[0-9]*)x?\s*([0-9]{1,2}:[0-9]{2})?/,
            /^([0-9]+\.?[0-9]*)\s+([0-9]{1,2}:[0-9]{2})$/,
        ];

        for (const pattern of patterns) {
            const match = line.match(pattern);
            if (match) {
                const oddValue = parseFloat(match[1]);
                const horario = match[2] || null;

                if (isNaN(oddValue) || oddValue < CONFIG.odds.rangeMin) {
                    continue;
                }

                return {
                    odd: oddValue,
                    horario: horario,
                    timestamp: Date.now(),
                    fonte: 'manual',
                    index: index,
                    data: new Date().toLocaleDateString('pt-BR')
                };
            }
        }

        const num = parseFloat(line.replace('x', ''));
        if (!isNaN(num) && num >= CONFIG.odds.rangeMin) {
            return {
                odd: num,
                horario: null,
                timestamp: Date.now(),
                fonte: 'manual',
                index: index,
                data: new Date().toLocaleDateString('pt-BR')
            };
        }

        return null;
    }

    async loadFromTextarea(rawText) {
        this.state.isProcessing = true;
        this.notifyListeners('processing', true);

        try {
            const { odds, errors, total } = this.parseRawData(rawText);

            if (odds.length === 0) {
                throw new Error('Nenhuma odd válida encontrada');
            }

            await storage.saveOdds(odds);

            this.state.odds = odds;
            this.state.filteredOdds = odds;
            this.state.lastUpdate = Date.now();

            console.log(`✅ ${odds.length} odds carregadas e salvas`);

            this.notifyListeners('data_loaded', {
                count: odds.length,
                errors,
                total
            });

            return { success: true, count: odds.length, errors };

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.notifyListeners('error', error);
            throw error;

        } finally {
            this.state.isProcessing = false;
            this.notifyListeners('processing', false);
        }
    }

    async loadFromStorage(limit = null) {
        this.state.isProcessing = true;

        try {
            const odds = await storage.getAllOdds(limit);
            
            this.state.odds = odds;
            this.state.filteredOdds = odds;
            this.state.lastUpdate = Date.now();

            console.log(`✅ ${odds.length} odds carregadas do storage`);
            
            this.notifyListeners('data_loaded', { count: odds.length });
            
            return odds;

        } catch (error) {
            console.error('Erro ao carregar do storage:', error);
            throw error;

        } finally {
            this.state.isProcessing = false;
        }
    }

    async addRealtimeOdd(odd) {
        this.state.realtimeOdds.unshift(odd);

        const maxSize = CONFIG.realtime.maxHistorySize;
        if (this.state.realtimeOdds.length > maxSize) {
            this.state.realtimeOdds = this.state.realtimeOdds.slice(0, maxSize);
        }

        this.state.odds.unshift(odd);
        if (this.state.odds.length > maxSize) {
            this.state.odds = this.state.odds.slice(0, maxSize);
        }

        storage.saveOdds([odd]).catch(err => {
            console.error('Erro ao salvar odd em tempo real:', err);
        });

        this.notifyListeners('realtime_odd', odd);
        this.state.lastUpdate = Date.now();
    }

    async addMultipleRealtimeOdds(odds) {
        for (const odd of odds) {
            await this.addRealtimeOdd(odd);
        }
    }

    applyFilters(filters) {
        this.state.filters = filters;
        
        let filtered = [...this.state.odds];

        if (filters.oddMin !== undefined) {
            filtered = filtered.filter(item => item.odd >= filters.oddMin);
        }
        if (filters.oddMax !== undefined) {
            filtered = filtered.filter(item => item.odd <= filters.oddMax);
        }

        if (filters.timeStart) {
            filtered = filtered.filter(item => item.timestamp >= filters.timeStart);
        }
        if (filters.timeEnd) {
            filtered = filtered.filter(item => item.timestamp <= filters.timeEnd);
        }

        if (filters.fonte) {
            filtered = filtered.filter(item => item.fonte === filters.fonte);
        }

        this.state.filteredOdds = filtered;
        this.notifyListeners('filters_applied', { count: filtered.length });

        return filtered;
    }

    clearFilters() {
        this.state.filters = {};
        this.state.filteredOdds = [...this.state.odds];
        this.notifyListeners('filters_cleared', {});
    }

    getData(useFiltered = true) {
        return useFiltered ? this.state.filteredOdds : this.state.odds;
    }

    getOddValues(useFiltered = true) {
        const data = this.getData(useFiltered);
        return data.map(item => item.odd);
    }

    async clearAll() {
        await storage.clearAll();
        
        this.state.odds = [];
        this.state.filteredOdds = [];
        this.state.realtimeOdds = [];
        this.state.lastUpdate = null;
        this.state.statistics = null;

        this.notifyListeners('data_cleared', {});
        
        console.log('🗑️  Todos os dados limpos');
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    notifyListeners(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Erro no listener ${event}:`, error);
                }
            });
        }
    }

    getBasicStats() {
        const odds = this.getOddValues();
        
        if (odds.length === 0) {
            return null;
        }

        const sorted = [...odds].sort((a, b) => a - b);
        
        return {
            count: odds.length,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            mean: odds.reduce((a, b) => a + b, 0) / odds.length,
            median: sorted[Math.floor(sorted.length / 2)],
            lastUpdate: this.state.lastUpdate
        };
    }
}

const dataManager = new DataManager();
export default dataManager;
