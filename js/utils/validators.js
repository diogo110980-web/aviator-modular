/**
 * Validators - Funções de Validação
 * Validação de formatos e dados
 */

import { CONFIG } from '../config.js';

export function validateOdd(value) {
    const num = typeof value === 'string' ? parseFloat(value.replace('x', '')) : value;
    
    return {
        valid: !isNaN(num) && num >= CONFIG.odds.rangeMin && num <= CONFIG.odds.rangeMax,
        value: num,
        message: isNaN(num) ? 'Valor inválido' : 
                 num < CONFIG.odds.rangeMin ? 'Odd muito baixa' :
                 num > CONFIG.odds.rangeMax ? 'Odd muito alta' : ''
    };
}

export function validateTime(time) {
    if (!time) return { valid: false, message: 'Horário vazio' };
    
    const match = time.match(/^([0-9]{1,2}):([0-9]{2})$/);
    
    if (!match) {
        return { valid: false, message: 'Formato inválido (use HH:MM)' };
    }
    
    const hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return { valid: false, message: 'Horário inválido' };
    }
    
    return { valid: true, hours, minutes };
}

export function validateDate(date) {
    if (!date) return { valid: false, message: 'Data vazia' };
    
    const match = date.match(/^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/);
    
    if (!match) {
        return { valid: false, message: 'Formato inválido (use DD/MM/YYYY)' };
    }
    
    const day = parseInt(match[1]);
    const month = parseInt(match[2]);
    const year = parseInt(match[3]);
    
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 2000) {
        return { valid: false, message: 'Data inválida' };
    }
    
    return { valid: true, day, month, year };
}

export function validateOddRange(min, max) {
    const minValid = validateOdd(min);
    const maxValid = validateOdd(max);
    
    if (!minValid.valid || !maxValid.valid) {
        return { valid: false, message: 'Valores de range inválidos' };
    }
    
    if (minValid.value >= maxValid.value) {
        return { valid: false, message: 'Mínimo deve ser menor que máximo' };
    }
    
    return { valid: true, min: minValid.value, max: maxValid.value };
}

export function validateOddsArray(odds) {
    if (!Array.isArray(odds)) {
        return { valid: false, message: 'Não é um array' };
    }
    
    if (odds.length === 0) {
        return { valid: false, message: 'Array vazio' };
    }
    
    const invalid = odds.filter(odd => !validateOdd(odd).valid);
    
    return {
        valid: invalid.length === 0,
        total: odds.length,
        invalid: invalid.length,
        message: invalid.length > 0 ? `${invalid.length} odds inválidas` : ''
    };
}

export function validateMartingaleConfig(config) {
    const errors = [];
    
    if (!config.multiplicador || config.multiplicador < 1) {
        errors.push('Multiplicador inválido');
    }
    
    if (!config.capitalInicial || config.capitalInicial <= 0) {
        errors.push('Capital inicial inválido');
    }
    
    if (!config.apostaBase || config.apostaBase <= 0) {
        errors.push('Aposta base inválida');
    }
    
    if (config.apostaBase > config.capitalInicial) {
        errors.push('Aposta base maior que capital');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

export default {
    validateOdd,
    validateTime,
    validateDate,
    validateOddRange,
    validateOddsArray,
    validateMartingaleConfig
};
