/**
 * AI Analysis Module - Análise com Algoritmos de IA
 * 6 funções de IA
 */

import { CONFIG } from '../config.js';
import Statistics from './statistics.js';
import Probability from './probability.js';

export class AIAnalysis {
    
    static executeAIConsistencyAnalysis(odds) {
        if (!Array.isArray(odds) || odds.length < 10) {
            return { erro: 'Dados insuficientes' };
        }

        const metade1 = odds.slice(0, Math.floor(odds.length / 2));
        const metade2 = odds.slice(Math.floor(odds.length / 2));

        const dist1 = Statistics.analisarDistribuicaoCorrigida_v3(metade1);
        const dist2 = Statistics.analisarDistribuicaoCorrigida_v3(metade2);

        const similaridade = this.calcularSimilaridade(dist1, dist2);
        const correlacao = Statistics.calcularCorrelacao(metade1, metade2);
        const statsGerais = Statistics.analisarDistribuicaoCorrigida_v3(odds);

        let nivelConsistencia = 'Baixa';
        let score = 0;

        if (similaridade > 0.8) {
            nivelConsistencia = 'Muito Alta';
            score = 95;
        } else if (similaridade > 0.6) {
            nivelConsistencia = 'Alta';
            score = 75;
        } else if (similaridade > 0.4) {
            nivelConsistencia = 'Média';
            score = 50;
        } else {
            nivelConsistencia = 'Baixa';
            score = 25;
        }

        return {
            nivel_consistencia: nivelConsistencia,
            score_consistencia: score,
            similaridade_metades: parseFloat(similaridade.toFixed(3)),
            correlacao: parseFloat(correlacao.toFixed(3)),
            padroes_detectados: similaridade > 0.6,
            recomendacao: similaridade > 0.6 ? 'Padrões detectados - Análise recomendada' : 'Baixo padrão - Dados aleatórios',
            detalhes: {
                metade_1: {
                    media: dist1.media,
                    variacao: dist1.maximo - dist1.minimo
                },
                metade_2: {
                    media: dist2.media,
                    variacao: dist2.maximo - dist2.minimo
                }
            }
        };
    }

    static calcularSimilaridade(dist1, dist2) {
        if (!dist1 || !dist2 || dist1.erro || dist2.erro) {
            return 0;
        }

        const diff_media = Math.abs(dist1.media - dist2.media) / Math.max(dist1.media, dist2.media);
        const diff_std = Math.abs(dist1.desvio_padrao - dist2.desvio_padrao) / 
                         Math.max(dist1.desvio_padrao, dist2.desvio_padrao, 0.1);

        return 1 - ((diff_media + diff_std) / 2);
    }

    static executeAIWindowAnalysisCorrigida_v3(odds, tamanhoJanela = 20) {
        if (!Array.isArray(odds) || odds.length < tamanhoJanela) {
            return { erro: 'Dados insuficientes' };
        }

        const janelas = Statistics.calcularJanelasCorrigidas_v3(odds, tamanhoJanela);
        const oportunidades = [];

        janelas.forEach((janela, idx) => {
            const media = parseFloat(janela.media);
            const variacao = parseFloat(janela.variacao);

            let score = 0;
            let tipo = '';

            if (media >= 5 && variacao < 2) {
                tipo = 'Oportunidade Premium';
                score = 90;
            } else if (media >= 3 && variacao < 3) {
                tipo = 'Oportunidade Alta';
                score = 75;
            } else if (media >= 2 && variacao < 4) {
                tipo = 'Oportunidade Média';
                score = 50;
            }

            if (score >= 50) {
                oportunidades.push({
                    indice_janela: idx,
                    inicio: janela.inicio,
                    fim: janela.fim,
                    tipo,
                    score,
                    media,
                    variacao,
                    odds_janela: janela.dados
                });
            }
        });

        return {
            total_janelas: janelas.length,
            oportunidades_detectadas: oportunidades.length,
            taxa_oportunidade: parseFloat(((oportunidades.length / janelas.length) * 100).toFixed(2)),
            oportunidades: oportunidades.sort((a, b) => b.score - a.score),
            recomendacao: oportunidades.length > 0 ? 'Oportunidades identificadas' : 'Nenhuma oportunidade'
        };
    }

    static executeAIBettingTableCorrigida_v3(odds, capital = 1000) {
        if (!Array.isArray(odds) || odds.length === 0 || capital <= 0) {
            return { erro: 'Parâmetros inválidos' };
        }

        const ranges = [
            { min: 1.3, max: 1.99, label: 'Baixo Risco' },
            { min: 2.0, max: 2.99, label: 'Risco Médio' },
            { min: 3.0, max: 4.99, label: 'Alto Risco' },
            { min: 5.0, max: 100, label: 'Risco Muito Alto' }
        ];

        const tabelaApostas = [];

        ranges.forEach(range => {
            const prob = Probability.calcularProbabilidadeReal(odds, range.min);
            
            if (prob.erro) return;

            const probabilidade = prob.probabilidade_suavizada;
            const odds_media = 2;
            const f = (probabilidade / 100 * odds_media - (1 - probabilidade / 100)) / (odds_media - 1);
            const apostaPercentual = Math.max(0.01, Math.min(0.1, f));
            const apostaValor = capital * apostaPercentual;

            tabelaApostas.push({
                range: `${range.min}x - ${range.max}x`,
                label: range.label,
                probabilidade: parseFloat(probabilidade.toFixed(2)),
                nivel_confianca: probabilidade >= 70 ? 'Muito Alta' : 
                                 probabilidade >= 50 ? 'Alta' : 
                                 probabilidade >= 30 ? 'Média' : 'Baixa',
                aposta_percentual_banca: parseFloat((apostaPercentual * 100).toFixed(2)),
                aposta_valor: parseFloat(apostaValor.toFixed(2)),
                recomendacao: probabilidade >= 60 ? '✓ Recomendada' : 
                             probabilidade >= 40 ? '≈ Neutra' : '✗ Não recomendada'
            });
        });

        return {
            capital_disponivel: capital,
            tabela_apostas: tabelaApostas,
            aposta_maxima_recomendada: parseFloat((capital * 0.1).toFixed(2))
        };
    }

    static executeAIPairSelection(odds) {
        if (!Array.isArray(odds) || odds.length < 2) {
            return { erro: 'Dados insuficientes' };
        }

        const pares = [];
        
        for (let i = 0; i < odds.length - 1; i++) {
            for (let j = i + 1; j < Math.min(odds.length, i + 10); j++) {
                const odd1 = odds[i];
                const odd2 = odds[j];
                
                const diferenca = Math.abs(odd1 - odd2);
                const soma = odd1 + odd2;
                const media = (odd1 + odd2) / 2;

                if (diferenca > 1 && media >= 2 && media <= 8) {
                    pares.push({
                        indice_1: i,
                        indice_2: j,
                        odd_1: parseFloat(odd1.toFixed(2)),
                        odd_2: parseFloat(odd2.toFixed(2)),
                        diferenca: parseFloat(diferenca.toFixed(2)),
                        media: parseFloat(media.toFixed(2)),
                        soma: parseFloat(soma.toFixed(2)),
                        score: parseFloat((media * (10 - diferenca)).toFixed(2))
                    });
                }
            }
        }

        pares.sort((a, b) => b.score - a.score);

        return {
            pares_encontrados: pares.length,
            top_pares: pares.slice(0, 10),
            pares_totais: pares
        };
    }

    static executeAITimingAnalysis(odds, horarios = []) {
        if (!Array.isArray(odds) || odds.length === 0) {
            return { erro: 'Dados inválidos' };
        }

        let times = horarios;
        if (times.length === 0) {
            times = odds.map((_, i) => {
                const hours = Math.floor(i / 60) % 24;
                const mins = i % 60;
                return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
            });
        }

        const distribuicaoMinutos = Statistics.calcularDistribuicaoMinutos(odds, times);

        const periodos = [];
        Object.entries(distribuicaoMinutos).forEach(([minuto, data]) => {
            periodos.push({
                minuto,
                odds_count: data.count,
                media_odds: data.media,
                variacao: data.odds ? Math.max(...data.odds) - Math.min(...data.odds) : 0,
                score: data.count > 1 ? data.media * (data.count / 10) : 0
            });
        });

        periodos.sort((a, b) => b.score - a.score);

        return {
            periodos_analisados: periodos.length,
            melhor_periodo: periodos[0] || null,
            top_periodos: periodos.slice(0, 5),
            distribuicao_completa: periodos
        };
    }

    static gerarRelatorioCompleto(odds, capital = 1000) {
        const consistency = this.executeAIConsistencyAnalysis(odds);
        const windows = this.executeAIWindowAnalysisCorrigida_v3(odds);
        const betting = this.executeAIBettingTableCorrigida_v3(odds, capital);
        const pairs = this.executeAIPairSelection(odds);
        const timing = this.executeAITimingAnalysis(odds);

        return {
            timestamp: Date.now(),
            total_odds: odds.length,
            
            analise_consistencia: consistency,
            analise_janelas: windows,
            tabela_apostas: betting,
            analise_pares: pairs,
            analise_timing: timing,

            recomendacao_geral: consistency.nivel_consistencia === 'Muito Alta' ?
                               'Condições favoráveis para análise' :
                               'Dados com padrão fraco',

            score_geral: parseFloat(
                ((consistency.score_consistencia +
                  (windows.taxa_oportunidade / 100 * 100) +
                  (pairs.pares_encontrados / Math.max(odds.length, 1) * 100)) / 3).toFixed(2)
            )
        };
    }
}

export default AIAnalysis;
