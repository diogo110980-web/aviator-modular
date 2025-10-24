/**
 * Statistics Module - Análise Estatística de Odds
 * 10 funções de análise
 */

import { CONFIG } from '../config.js';

export class Statistics {
    
    static analisarDistribuicaoCorrigida_v3(odds, ranges = {}) {
        if (!Array.isArray(odds) || odds.length === 0) {
            return { erro: 'Array de odds vazio ou inválido' };
        }

        const rangeMenor = ranges.rangeMenor || CONFIG.odds.defaultRangeMenor;
        const rangeMaior = ranges.rangeMaior || CONFIG.odds.defaultRangeMaior;

        const filtrados = odds.filter(o => o >= rangeMenor && o <= rangeMaior);
        
        if (filtrados.length === 0) {
            return { erro: 'Nenhuma odd no range especificado' };
        }

        const ranges_analise = [
            { min: rangeMenor, max: 1.5, label: '1.0-1.5' },
            { min: 1.5, max: 2.0, label: '1.5-2.0' },
            { min: 2.0, max: 3.0, label: '2.0-3.0' },
            { min: 3.0, max: 5.0, label: '3.0-5.0' },
            { min: 5.0, max: 10.0, label: '5.0-10.0' },
            { min: 10.0, max: rangeMaior, label: '10.0+' }
        ];

        const distribuicao = {};
        ranges_analise.forEach(range => {
            const count = filtrados.filter(o => o >= range.min && o < range.max).length;
            const percent = (count / filtrados.length) * 100;
            distribuicao[range.label] = {
                count,
                percent: parseFloat(percent.toFixed(2)),
                visual: '█'.repeat(Math.round(percent / 2))
            };
        });

        const sorted = [...filtrados].sort((a, b) => a - b);
        const media = filtrados.reduce((a, b) => a + b, 0) / filtrados.length;
        const mediana = sorted[Math.floor(sorted.length / 2)];

        return {
            total: filtrados.length,
            range: { min: rangeMenor, max: rangeMaior },
            distribuicao,
            media: parseFloat(media.toFixed(2)),
            mediana: parseFloat(mediana.toFixed(2)),
            minimo: sorted[0],
            maximo: sorted[sorted.length - 1],
            desvio_padrao: this.calcularDesvioPadrao(filtrados, media)
        };
    }

    static calcularDesvioPadrao(dados, media) {
        const variancia = dados.reduce((sum, val) => sum + Math.pow(val - media, 2), 0) / dados.length;
        return parseFloat(Math.sqrt(variancia).toFixed(2));
    }

    static calcularJanelasCorrigidas_v3(odds, tamanhoJanela = 10) {
        if (!Array.isArray(odds) || odds.length < tamanhoJanela) {
            return [];
        }

        const janelas = [];
        
        for (let i = 0; i <= odds.length - tamanhoJanela; i++) {
            const janela = odds.slice(i, i + tamanhoJanela);
            
            const stats = {
                inicio: i,
                fim: i + tamanhoJanela,
                tamanho: tamanhoJanela,
                media: (janela.reduce((a, b) => a + b, 0) / tamanhoJanela).toFixed(2),
                minimo: Math.min(...janela),
                maximo: Math.max(...janela),
                variacao: (Math.max(...janela) - Math.min(...janela)).toFixed(2),
                dados: janela
            };
            
            janelas.push(stats);
        }

        return janelas;
    }

    static calcularGapsCorrigido(odds, limiarMinimo = 0.5) {
        if (!Array.isArray(odds) || odds.length < 2) {
            return [];
        }

        const gaps = [];
        
        for (let i = 1; i < odds.length; i++) {
            const diferenca = Math.abs(odds[i] - odds[i - 1]);
            
            if (diferenca >= limiarMinimo) {
                gaps.push({
                    indice: i,
                    de: odds[i - 1],
                    para: odds[i],
                    diferenca: parseFloat(diferenca.toFixed(2)),
                    percentual: parseFloat(((diferenca / odds[i - 1]) * 100).toFixed(2)),
                    tipo: diferenca > 2 ? 'grande' : 'médio'
                });
            }
        }

        return gaps;
    }

    static calcularDistribuicaoMinutos(odds, horarios) {
        if (odds.length !== horarios.length) {
            return { erro: 'Arrays de tamanho diferente' };
        }

        const distribuicao = {};
        
        for (let i = 0; i < odds.length; i++) {
            const minuto = horarios[i] ? horarios[i].substring(0, 5) : 'desconhecido';
            
            if (!distribuicao[minuto]) {
                distribuicao[minuto] = {
                    odds: [],
                    count: 0,
                    media: 0
                };
            }
            
            distribuicao[minuto].odds.push(odds[i]);
            distribuicao[minuto].count++;
        }

        Object.keys(distribuicao).forEach(minuto => {
            const sum = distribuicao[minuto].odds.reduce((a, b) => a + b, 0);
            distribuicao[minuto].media = parseFloat((sum / distribuicao[minuto].count).toFixed(2));
        });

        return distribuicao;
    }

    static calcularCorrelacao(array1, array2) {
        if (array1.length !== array2.length || array1.length === 0) {
            return null;
        }

        const media1 = array1.reduce((a, b) => a + b) / array1.length;
        const media2 = array2.reduce((a, b) => a + b) / array2.length;

        let numerador = 0;
        let denominador1 = 0;
        let denominador2 = 0;

        for (let i = 0; i < array1.length; i++) {
            const diff1 = array1[i] - media1;
            const diff2 = array2[i] - media2;
            
            numerador += diff1 * diff2;
            denominador1 += diff1 * diff1;
            denominador2 += diff2 * diff2;
        }

        const denominador = Math.sqrt(denominador1 * denominador2);
        if (denominador === 0) return 0;

        return parseFloat((numerador / denominador).toFixed(3));
    }

    static identificarSequencias(odds, limiar) {
        const sequencias = [];
        let sequenciaAtual = null;

        for (let i = 0; i < odds.length; i++) {
            const isAlta = odds[i] >= limiar;
            
            if (!sequenciaAtual || sequenciaAtual.isAlta !== isAlta) {
                if (sequenciaAtual) {
                    sequencias.push(sequenciaAtual);
                }
                sequenciaAtual = {
                    inicio: i,
                    fim: i,
                    isAlta,
                    tamanho: 1,
                    valores: [odds[i]]
                };
            } else {
                sequenciaAtual.fim = i;
                sequenciaAtual.tamanho++;
                sequenciaAtual.valores.push(odds[i]);
            }
        }

        if (sequenciaAtual) {
            sequencias.push(sequenciaAtual);
        }

        return sequencias;
    }

    static calcularPeriodosFavoraveis(odds, limiarInferior, limiarSuperior) {
        const periodos = [];
        let periodoAtual = null;

        for (let i = 0; i < odds.length; i++) {
            const isFavoravel = odds[i] >= limiarInferior && odds[i] <= limiarSuperior;
            
            if (isFavoravel) {
                if (!periodoAtual) {
                    periodoAtual = {
                        inicio: i,
                        fim: i,
                        tamanho: 1,
                        odds: [odds[i]]
                    };
                } else {
                    periodoAtual.fim = i;
                    periodoAtual.tamanho++;
                    periodoAtual.odds.push(odds[i]);
                }
            } else if (periodoAtual) {
                periodos.push(periodoAtual);
                periodoAtual = null;
            }
        }

        if (periodoAtual) {
            periodos.push(periodoAtual);
        }

        return periodos;
    }

    static calcularVolatilidade(odds) {
        if (odds.length < 2) return 0;

        const retornos = [];
        for (let i = 1; i < odds.length; i++) {
            const retorno = (odds[i] - odds[i - 1]) / odds[i - 1];
            retornos.push(retorno);
        }

        const mediaRetornos = retornos.reduce((a, b) => a + b) / retornos.length;
        const variancia = retornos.reduce((sum, ret) => sum + Math.pow(ret - mediaRetornos, 2), 0) / retornos.length;
        
        return parseFloat(Math.sqrt(variancia).toFixed(4));
    }

    static gerarRelatorioCompleto(odds, ranges) {
        return {
            timestamp: Date.now(),
            distribuicao: this.analisarDistribuicaoCorrigida_v3(odds, ranges),
            janelas: this.calcularJanelasCorrigidas_v3(odds, 10),
            gaps: this.calcularGapsCorrigido(odds),
            volatilidade: this.calcularVolatilidade(odds),
            totalOdds: odds.length
        };
    }
}

export default Statistics;
