/**
 * Broadcast Manager - Comunicação Entre Abas
 * Usa BroadcastChannel API para sincronizar dados
 * entre a aba do TipMiner e a aba do Analyzer
 */

import { CONFIG } from '../config.js';
import storage from './storage.js';

class BroadcastManager {
    constructor() {
        this.channel = null;
        this.listeners = new Map();
        this.connected = false;
    }

    init() {
        if (this.connected) return;

        try {
            this.channel = new BroadcastChannel(CONFIG.realtime.channelName);
            this.connected = true;
            
            this.channel.onmessage = (event) => {
                this.handleMessage(event.data);
            };

            this.channel.onmessageerror = (error) => {
                console.error('Erro no canal de broadcast:', error);
            };

            console.log('🔗 BroadcastChannel conectado:', CONFIG.realtime.channelName);
            this.send('ping', { timestamp: Date.now() });
            
        } catch (error) {
            console.error('Erro ao criar BroadcastChannel:', error);
            this.connected = false;
        }
    }

    handleMessage(data) {
        const { type, payload } = data;
        
        if (CONFIG.debug.enabled) {
            console.log('📨 Mensagem recebida:', type, payload);
        }

        if (this.listeners.has(type)) {
            this.listeners.get(type).forEach(callback => {
                try {
                    callback(payload);
                } catch (error) {
                    console.error(`Erro no listener ${type}:`, error);
                }
            });
        }

        switch (type) {
            case 'ping':
                this.send('pong', { timestamp: Date.now() });
                break;
                
            case 'pong':
                console.log('🏓 Pong recebido de outra aba');
                break;
                
            case 'new_odd':
                this.handleNewOdd(payload);
                break;
                
            case 'sync_request':
                this.handleSyncRequest(payload);
                break;
                
            case 'sync_response':
                this.handleSyncResponse(payload);
                break;
        }
    }

    send(type, payload = {}) {
        if (!this.connected || !this.channel) {
            console.warn('Canal não conectado. Tentando reconectar...');
            this.init();
            return false;
        }

        try {
            this.channel.postMessage({ type, payload });
            
            if (CONFIG.debug.enabled) {
                console.log('📤 Mensagem enviada:', type, payload);
            }
            
            return true;
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            return false;
        }
    }

    on(type, callback) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type).push(callback);
        
        if (CONFIG.debug.enabled) {
            console.log(`👂 Listener registrado para: ${type}`);
        }
    }

    off(type, callback) {
        if (this.listeners.has(type)) {
            const callbacks = this.listeners.get(type);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    async handleNewOdd(odd) {
        console.log('🎯 Nova odd recebida:', odd);
        
        try {
            await storage.saveOdds([odd]);
        } catch (error) {
            console.error('Erro ao salvar odd:', error);
        }
    }

    async handleSyncRequest(request) {
        console.log('🔄 Solicitação de sync recebida');
        
        const odds = await storage.getAllOdds(100);
        this.send('sync_response', { odds });
    }

    handleSyncResponse(response) {
        console.log('✅ Sync concluído:', response.odds.length, 'odds recebidas');
    }

    requestSync() {
        this.send('sync_request', { timestamp: Date.now() });
    }

    broadcastNewOdd(odd) {
        this.send('new_odd', odd);
    }

    broadcastMultipleOdds(odds) {
        this.send('multiple_odds', { odds, count: odds.length });
    }

    broadcastError(error) {
        this.send('error', { 
            message: error.message, 
            timestamp: Date.now() 
        });
    }

    broadcastStatus(status) {
        this.send('status', status);
    }

    close() {
        if (this.channel) {
            this.channel.close();
            this.connected = false;
            console.log('🔌 BroadcastChannel fechado');
        }
    }

    async checkOtherTabs() {
        return new Promise((resolve) => {
            let responded = false;
            
            const pongListener = () => {
                responded = true;
            };
            
            this.on('pong', pongListener);
            this.send('ping', { timestamp: Date.now() });
            
            setTimeout(() => {
                this.off('pong', pongListener);
                resolve(responded);
            }, 1000);
        });
    }
}

const broadcast = new BroadcastManager();

if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => broadcast.init());
    } else {
        broadcast.init();
    }
}

export default broadcast;
