/**
 * Timing Module - Análise Temporal
 * 11 funções de análise de timing
 */

import { CONFIG } from '../config.js';

export class Timing {
    
    static extrairOcorrenciasTimingCorrigido(odds, horarios, targetOdd) {
        if (!Array.isArray(odds) || odds.length === 0) {
            return [];
        }

        const ocorrencias = [];

        for (let i = 0; i < odds.length; i++) {
            if (odds[i] >= targetOdd) {
                const horario = horarios && horarios[i] ? horarios[i] : null;
                
                ocorrencias.push({
                    indice: i,
                    odd: odds[i],
                    horario,
                    timestamp: Date.now() - (odds.length - i) * 1000
                });
            }
        }

        return ocorrencias;
    }

    static calcularProximaJanela(ocorrencias) {
        if (!Array.isArray(ocorrencias) || ocorrencias.length < 2) {
            return { erro: 'Dados insuficientes' };
        }

        const intervalos = [];
        for (let i = 1; i < ocorrencias.length; i++) {
            const intervalo = ocorrencias[i].indice - ocorrencias[i - 1].indice;
            intervalos.push(intervalo);
        }

        const media = intervalos.reduce((a, b) => a + b, 0) / intervalos.length;
        const sorted = [...intervalos].sort((a, b) => a - b);
        const mediana = sorted[Math.floor(sorted.length / 2)];
        const minimo = Math.min(...intervalos);
        const maximo = Math.max(...intervalos);

        const ultimaOcorrencia = ocorrencias[ocorrencias.length - 1];

        return {
            total_ocorrencias: ocorrencias.length,
            intervalo_medio: parseFloat(media.toFixed(2)),
            intervalo_mediano: mediana,
            intervalo_minimo: minimo,
            intervalo_maximo: maximo,
            ultima_ocorrencia_indice: ultimaOcorrencia.indice,
            proxima_janela_estimada: ultimaOcorrencia.indice + mediana,
            confianca: this.calcularConfiancaPrevisao(intervalos)
        };
    }

    static calcularConfiancaPrevisao(intervalos) {
        if (intervalos.length < 2) return 'Baixa';

        const media = intervalos.reduce((a, b) => a + b) / intervalos.length;
        const variancia = intervalos.reduce((sum, x) => sum + Math.pow(x - media, 2), 0) / intervalos.length;
        const coefVariacao = Math.sqrt(variancia) / media;

        if (coefVariacao < 0.5) return 'Muito Alta';
        if (coefVariacao < 0.8) return 'Alta';
        if (coefVariacao < 1.2) return 'Média';
        return 'Baixa';
    }

    static recalcularElapsed(ultimoTimestamp) {
        if (!ultimoTimestamp) return null;

        const agora = Date.now();
        const decorrido = agora - ultimoTimestamp;

        const segundos = Math.floor(decorrido / 1000);
        const minutos = Math.floor(segundos / 60);
        const horas = Math.floor(minutos / 60);
        const dias = Math.floor(horas / 24);

        return {
            timestamp_ultimo: ultimoTimestamp,
            timestamp_agora: agora,
            decorrido_ms: decorrido,
            decorrido_segundos: segundos,
            decorrido_minutos: minutos,
            decorrido_horas: horas,
            decorrido_dias: dias,
            formatado: this.formatarTempo(decorrido)
        };
    }

    static formatarTempo(ms) {
        const segundos = Math.floor(ms / 1000);
        const minutos = Math.floor(segundos / 60);
        const horas = Math.floor(minutos / 60);
        const dias = Math.floor(horas / 24);

        if (dias > 0) return `${dias}d ${horas % 24}h`;
        if (horas > 0) return `${horas}h ${minutos % 60}m`;
        if (minutos > 0) return `${minutos}m ${segundos % 60}s`;
        return `${segundos}s`;
    }

    static analisarPeriodicidade(odds, janela = 10) {
        if (!Array.isArray(odds) || odds.length < janela) {
            return { erro: 'Dados insuficientes' };
        }

        const periodos = [];
        const numPeriodos = Math.floor(odds.length / janela);

        for (let i = 0; i < numPeriodos; i++) {
            const inicio = i * janela;
            const fim = inicio + janela;
            const periodo = odds.slice(inicio, fim);

            const media = periodo.reduce((a, b) => a + b) / periodo.length;
            const sorted = [...periodo].sort((a, b) => a - b);
            const mediana = sorted[Math.floor(sorted.length / 2)];

            periodos.push({
                numero: i + 1,
                inicio,
                fim,
                media: parseFloat(media.toFixed(2)),
                mediana: parseFloat(mediana.toFixed(2)),
                minimo: sorted[0],
                maximo: sorted[sorted.length - 1]
            });
        }

        return {
            tamanho_janela: janela,
            total_periodos: periodos.length,
            periodos,
            tendencia: this.detectarTendencia(periodos)
        };
    }

    static detectarTendencia(periodos) {
        if (periodos.length < 2) return 'Insuficiente';

        const medias = periodos.map(p => p.media);
        let crescente = 0;
        let decrescente = 0;

        for (let i = 1; i < medias.length; i++) {
            if (medias[i] > medias[i - 1]) crescente++;
            else if (medias[i] < medias[i - 1]) decrescente++;
        }

        if (crescente > decrescente) return 'Crescente';
        if (decrescente > crescente) return 'Decrescente';
        return 'Estável';
    }

    static calcularDistribuicaoTemporal(odds, horarios) {
        if (!Array.isArray(odds) || !Array.isArray(horarios) || odds.length !== horarios.length) {
            return { erro: 'Arrays incompatíveis' };
        }

        const distribuicao = {};

        for (let i = 0; i < odds.length; i++) {
            const hora = horarios[i] ? horarios[i].substring(0, 2) : 'desconhecida';
            
            if (!distribuicao[hora]) {
                distribuicao[hora] = {
                    odds: [],
                    count: 0,
                    media: 0,
                    variacao: 0
                };
            }

            distribuicao[hora].odds.push(odds[i]);
            distribuicao[hora].count++;
        }

        Object.keys(distribuicao).forEach(hora => {
            const data = distribuicao[hora];
            const media = data.odds.reduce((a, b) => a + b) / data.odds.length;
            const sorted = [...data.odds].sort((a, b) => a - b);
            
            data.media = parseFloat(media.toFixed(2));
            data.variacao = sorted[sorted.length - 1] - sorted[0];
            data.minimo = sorted[0];
            data.maximo = sorted[sorted.length - 1];
        });

        return distribuicao;
    }

    static identificarPicosHorarios(distribuicaoTemporal) {
        const picos = [];

        Object.entries(distribuicaoTemporal).forEach(([hora, data]) => {
            picos.push({
                hora: `${hora}:00`,
                count: data.count,
                media_odds: data.media,
                score: data.count * (data.media / 10)
            });
        });

        picos.sort((a, b) => b.score - a.score);

        return {
            picos_totais: picos.length,
            melhor_hora: picos[0] || null,
            top_5: picos.slice(0, 5),
            picos_ordenados: picos
        };
    }

    static calcularJanelaIdeal(distribuicaoTemporal) {
        let melhorJanela = null;
        let melhorScore = 0;

        Object.entries(distribuicaoTemporal).forEach(([hora, data]) => {
            const score = data.count * data.media / 10;
            
            if (score > melhorScore) {
                melhorScore = score;
                melhorJanela = {
                    hora: `${hora}:00`,
                    ocorrencias: data.count,
                    media_odds: data.media,
                    score: parseFloat(score.toFixed(2))
                };
            }
        });

        return melhorJanela;
    }
}

export default Timing;
