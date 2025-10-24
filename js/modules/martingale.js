/**
 * Martingale Module - Sistema de Progressão de Apostas
 * 11 funções de gestão de capital e martingale
 */

import { CONFIG } from '../config.js';

export class Martingale {
    
    static calcularMultiplicadorMartingale(nivel, multiplicador = 2) {
        if (nivel < 0) return 1;
        return Math.pow(multiplicador, nivel);
    }

    static calcularCapitalMartingale(apostaBase, niveis, multiplicador = 2) {
        if (apostaBase <= 0 || niveis <= 0) {
            return { erro: 'Parâmetros inválidos' };
        }

        const sequencia = [];
        let capitalTotal = 0;
        let maisorAposta = apostaBase;

        for (let i = 0; i < niveis; i++) {
            const mult = this.calcularMultiplicadorMartingale(i, multiplicador);
            const aposta = apostaBase * mult;
            
            sequencia.push({
                nivel: i + 1,
                multiplicador: mult,
                aposta: parseFloat(aposta.toFixed(2)),
                lucro_esperado: parseFloat(apostaBase.toFixed(2)),
                capital_acumulado: parseFloat((capitalTotal + aposta).toFixed(2))
            });

            capitalTotal += aposta;
            maisorAposta = Math.max(maisorAposta, aposta);
        }

        return {
            aposta_base: apostaBase,
            niveis,
            multiplicador,
            capital_total: parseFloat(capitalTotal.toFixed(2)),
            maior_aposta: parseFloat(maisorAposta.toFixed(2)),
            sequencia
        };
    }

    static simularMartingale(odds, apostaBase, nivelMaximo = 5) {
        if (!Array.isArray(odds) || odds.length === 0 || apostaBase <= 0) {
            return { erro: 'Parâmetros inválidos' };
        }

        const resultado = {
            sequencias_completas: 0,
            sequencias_falhadas: 0,
            apostas_totais: 0,
            lucro_total: 0,
            perda_maxima: 0,
            rodadas_processadas: 0,
            detalhe_sequencias: []
        };

        let nivelAtual = 0;
        let capitalEmRisco = 0;
        let sequenciaAtual = {
            inicio: 0,
            apostas: [],
            total_apostado: 0,
            resultado: null
        };

        for (let i = 0; i < odds.length; i++) {
            const odd = odds[i];
            const vitoria = odd >= 2.0;
            
            const mult = this.calcularMultiplicadorMartingale(nivelAtual);
            const aposta = apostaBase * mult;
            
            sequenciaAtual.apostas.push({
                nivel: nivelAtual,
                odd,
                aposta,
                vitoria
            });

            sequenciaAtual.total_apostado += aposta;
            capitalEmRisco = Math.max(capitalEmRisco, sequenciaAtual.total_apostado);

            if (vitoria) {
                const lucro = (aposta * (odd - 1)) - (sequenciaAtual.total_apostado - aposta);
                
                sequenciaAtual.resultado = 'vitória';
                sequenciaAtual.lucro = parseFloat(lucro.toFixed(2));
                
                resultado.sequencias_completas++;
                resultado.lucro_total += lucro;
                
                resultado.detalhe_sequencias.push(sequenciaAtual);
                
                nivelAtual = 0;
                sequenciaAtual = {
                    inicio: i + 1,
                    apostas: [],
                    total_apostado: 0,
                    resultado: null
                };
            } else if (nivelAtual >= nivelMaximo) {
                sequenciaAtual.resultado = 'falha';
                sequenciaAtual.perda = -sequenciaAtual.total_apostado;
                
                resultado.sequencias_falhadas++;
                resultado.lucro_total -= sequenciaAtual.total_apostado;
                resultado.perda_maxima = Math.max(resultado.perda_maxima, sequenciaAtual.total_apostado);
                
                resultado.detalhe_sequencias.push(sequenciaAtual);
                
                nivelAtual = 0;
                sequenciaAtual = {
                    inicio: i + 1,
                    apostas: [],
                    total_apostado: 0,
                    resultado: null
                };
            } else {
                nivelAtual++;
            }

            resultado.apostas_totais += aposta;
            resultado.rodadas_processadas = i + 1;
        }

        resultado.capital_em_risco = parseFloat(capitalEmRisco.toFixed(2));
        resultado.taxa_sucesso = parseFloat(
            ((resultado.sequencias_completas / (resultado.sequencias_completas + resultado.sequencias_falhadas)) * 100).toFixed(2)
        );

        return resultado;
    }

    static updateCapitalAndRecalculate(capital, lucro, apostaBase) {
        const novoCapital = capital + lucro;
        const novaApostaBase = novoCapital * CONFIG.martingale.percentualBanca;

        return {
            capital_anterior: parseFloat(capital.toFixed(2)),
            lucro: parseFloat(lucro.toFixed(2)),
            capital_novo: parseFloat(novoCapital.toFixed(2)),
            aposta_base_anterior: parseFloat(apostaBase.toFixed(2)),
            aposta_base_nova: parseFloat(novaApostaBase.toFixed(2)),
            variacao_percentual: parseFloat(((lucro / capital) * 100).toFixed(2))
        };
    }

    static calcularAlocacaoOtima(capitalTotal, estrategias) {
        if (capitalTotal <= 0 || !Array.isArray(estrategias) || estrategias.length === 0) {
            return { erro: 'Parâmetros inválidos' };
        }

        let totalScore = 0;
        const scores = estrategias.map(est => {
            const score = (est.taxa_sucesso || 50) * (est.winRate || 1);
            totalScore += score;
            return score;
        });

        const alocacoes = scores.map((score, i) => ({
            estrategia: estrategias[i].nome || `Estratégia ${i + 1}`,
            percentual: parseFloat(((score / totalScore) * 100).toFixed(2)),
            capital_alocado: parseFloat((capitalTotal * (score / totalScore)).toFixed(2))
        }));

        return {
            capital_total: capitalTotal,
            alocacoes,
            data_calculo: new Date().toISOString()
        };
    }

    static calcularRazaoRiscoRecompensa(stopLoss, takeProfit) {
        if (stopLoss <= 0 || takeProfit <= 0) {
            return { erro: 'Valores devem ser positivos' };
        }

        const razao = takeProfit / stopLoss;

        return {
            stop_loss: stopLoss,
            take_profit: takeProfit,
            razao_risco_recompensa: parseFloat(razao.toFixed(2)),
            classificacao: razao >= 1 ? 'Favorável' : 'Desfavorável'
        };
    }

    static validarSequencia(apostaBase, niveis, capitalDisponivel) {
        const { capital_total } = this.calcularCapitalMartingale(apostaBase, niveis);

        return {
            viavel: capital_total <= capitalDisponivel,
            capital_necessario: capital_total,
            capital_disponivel: capitalDisponivel,
            diferenca: capitalDisponivel - capital_total,
            niveis_possiveis: this.calcularNiveisMaximos(apostaBase, capitalDisponivel)
        };
    }

    static calcularNiveisMaximos(apostaBase, capitalDisponivel) {
        let nivel = 0;
        let capitalUsado = 0;

        while (capitalUsado <= capitalDisponivel) {
            const mult = this.calcularMultiplicadorMartingale(nivel);
            const proximaAposta = apostaBase * mult;
            
            if (capitalUsado + proximaAposta > capitalDisponivel) {
                break;
            }

            capitalUsado += proximaAposta;
            nivel++;
        }

        return nivel;
    }

    static gerarRelatorioGestao(capital, lucros, apostas, nivelMaximo = 5) {
        const capitalAtual = capital + lucros.reduce((a, b) => a + b, 0);
        
        return {
            capital_inicial: capital,
            capital_atual: parseFloat(capitalAtual.toFixed(2)),
            lucro_total: parseFloat(lucros.reduce((a, b) => a + b, 0).toFixed(2)),
            total_apostas: apostas.length,
            aposta_media: parseFloat((apostas.reduce((a, b) => a + b, 0) / apostas.length).toFixed(2)),
            roi: parseFloat(((lucros.reduce((a, b) => a + b, 0) / capital) * 100).toFixed(2)),
            martingale_config: {
                nivel_maximo_recomendado: nivelMaximo,
                aposta_base_1pct: parseFloat((capitalAtual * 0.01).toFixed(2)),
                capital_necessario_completo: this.calcularCapitalMartingale(
                    capitalAtual * 0.01, 
                    nivelMaximo
                ).capital_total
            }
        };
    }
}

export default Martingale;
