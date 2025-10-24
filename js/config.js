/**
 * Aviator Analyzer - Configurações Globais
 */

export const CONFIG = {
    version: '17.0-modular',
    
    odds: {
        rangeMin: 1.0,
        rangeMax: 100.0,
        defaultRangeMenor: 1.3,
        defaultRangeMaior: 18.0,
        gigante: 10.0,
        muitoAlta: 5.0,
        alta: 3.0,
        media: 2.0,
        ranges: {
            baixo: { min: 1.0, max: 1.99 },
            medio: { min: 2.0, max: 4.99 },
            alto: { min: 5.0, max: 9.99 },
            gigante: { min: 10.0, max: 100.0 }
        }
    },
    
    statistics: {
        minDataPoints: 100,
        confidenceLevel: 0.95,
        sampleSize: 1000,
        windows: {
            short: 10,
            medium: 50,
            long: 100,
            veryLong: 500
        }
    },
    
    movingAverages: {
        periods: [10, 20, 30, 50, 100],
        alertThreshold: 2.0,
        baseProbabilities: {
            'odds_gte_10_in_3': 26.7,
            'odds_gte_1000_in_50': 4.3
        }
    },
    
    martingale: {
        multiplicador: 2.0,
        maxNiveis: 10,
        capitalMinimo: 100,
        percentualBanca: 0.01,
        multiplicadores: [2, 2.5, 3, 3.5, 4, 5]
    },
    
    realtime: {
        updateInterval: 1000,
        maxHistorySize: 20000,
        autoSaveInterval: 30000,
        channelName: 'aviator-sync',
        inactivityTimeout: 300000
    },
    
    storage: {
        dbName: 'AviatorAnalyzerDB',
        dbVersion: 1,
        storeName: 'odds_history',
        keys: {
            lastData: 'aviator_last_data',
            settings: 'aviator_settings',
            filters: 'aviator_filters'
        }
    },
    
    ui: {
        heatmap: {
            cold: '#2196F3',
            neutral: '#FFC107',
            hot: '#F44336',
            extreme: '#9C27B0'
        },
        status: {
            success: '#4CAF50',
            warning: '#FF9800',
            danger: '#F44336',
            info: '#2196F3'
        },
        animations: {
            duration: 300,
            easing: 'ease-in-out'
        },
        notifications: {
            duration: 5000,
            position: 'top-right'
        }
    },
    
    debug: {
        enabled: false,
        verbose: false,
        logLevel: 'info'
    }
};

export function getConfig(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], CONFIG);
}

export function setConfig(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, key) => obj[key], CONFIG);
    target[lastKey] = value;
}

if (typeof window !== 'undefined') {
    window.AVIATOR_CONFIG = CONFIG;
}

export default CONFIG;
