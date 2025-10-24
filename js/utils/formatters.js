/**
 * Formatters - Funções de Formatação
 * Formatação de dados para exibição
 */

export function formatOdd(odd, includeX = true) {
    const num = typeof odd === 'string' ? parseFloat(odd) : odd;
    
    if (isNaN(num)) return '-';
    
    const formatted = num.toFixed(2);
    return includeX ? `${formatted}x` : formatted;
}

export function formatNumber(num, decimals = 0) {
    if (typeof num !== 'number' || isNaN(num)) return '-';
    
    return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatPercent(value, decimals = 2) {
    if (typeof value !== 'number' || isNaN(value)) return '-';
    
    return `${value.toFixed(decimals)}%`;
}

export function formatTimestamp(timestamp, includeTime = true) {
    const date = new Date(timestamp);
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    const dateStr = `${day}/${month}/${year}`;
    
    if (!includeTime) return dateStr;
    
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${dateStr} ${hours}:${minutes}`;
}

export function formatTime(hours, minutes) {
    const h = String(hours).padStart(2, '0');
    const m = String(minutes).padStart(2, '0');
    return `${h}:${m}`;
}

export function formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatCurrency(value, currency = 'BRL') {
    if (typeof value !== 'number' || isNaN(value)) return '-';
    
    const symbol = currency === 'BRL' ? 'R$' : currency === 'USD' ? '$' : currency;
    
    return `${symbol} ${formatNumber(value, 2)}`;
}

export function formatOddsArray(odds, separator = ', ') {
    return odds.map(odd => formatOdd(odd)).join(separator);
}

export function formatStat(label, value, unit = '') {
    return `${label}: ${value}${unit}`;
}

export function truncateText(text, maxLength = 50) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

export function formatTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'agora mesmo';
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `há ${minutes} min`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `há ${hours}h`;
    
    const days = Math.floor(hours / 24);
    return `há ${days}d`;
}

export function formatOddClass(odd) {
    if (odd >= 10) return 'Gigante';
    if (odd >= 5) return 'Muito Alta';
    if (odd >= 3) return 'Alta';
    if (odd >= 2) return 'Média';
    return 'Baixa';
}

export function getOddColor(odd) {
    if (odd >= 10) return '#9C27B0';
    if (odd >= 5) return '#F44336';
    if (odd >= 3) return '#FF9800';
    if (odd >= 2) return '#FFC107';
    return '#4CAF50';
}

export default {
    formatOdd,
    formatNumber,
    formatPercent,
    formatTimestamp,
    formatTime,
    formatDuration,
    formatCurrency,
    formatOddsArray,
    formatStat,
    truncateText,
    formatTimeAgo,
    formatOddClass,
    getOddColor
};
