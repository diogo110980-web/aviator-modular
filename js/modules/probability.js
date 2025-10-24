/**
 * Probability Module - Cálculos de Probabilidade
 * 12 funções de probabilidade e análise estatística
 */

import { CONFIG } from '../config.js';

export class Probability {
    
    static calcularProbabilidadeReal(odds, targetOdd) {
        if (!Array.isArray(odds) || odds.length === 0) {
            return { erro: 'Array de odds vazio' };
        }

        const ocorrencias = odds.filter(o => o >= targetOdd).length;
        const total = odds.length;
        
        const probabilidadeSimples = (ocorrencias / total) * 100;
        const probabilidadeSuavizada = ((ocorrencias + 1) / (total + 2)) * 100;

        const p = ocorrencias / total;
        const z = 1.96;
        const erro = z * Math.sqrt((p * (1 - p)) / total);
        const ic_inferior = Math.max(0, (p - erro) * 100);
        const ic_superior = Math.min(100, (p + erro) * 100);

        let nivelConfianca = 'Baixa';
        if (probabilidadeSuavizada >= 70) nivelConfianca = 'Muito Alta';
        else if (probabilidadeSuavizada >= 50) nivelConfianca = 'Alta';
        else if (probabilidadeSuavizada >= 30) nivelConfianca = 'Média';
        else if (probabilidadeSuavizada >= 10) nivelConfianca = 'Baixa';
        else nivelConfianca = 'Muito Baixa';

        return {
            targetOdd,
            ocorrencias,
            total,
            probabilidade_simples: parseFloat(probabilidadeSimples.toFixed(2)),
            probabilidade_suavizada: parseFloat(probabilidadeSuavizada.toFixed(2)),
            intervalo_confianca: {
                inferior: parseFloat(ic_inferior.toFixed(2)),
                superior: parseFloat(ic_superior.toFixed(2))
            },
            nivel_confianca: nivelConfianca,
            erro_padrao: parseFloat(erro.toFixed(4))
        };
    }

    static validarCalculosMatematicos(probabilidades) {
        const validacoes = {
            valid: true,
            erros: [],
            avisos: []
        };

        if (!Array.isArray(probabilidades)) {
            return { valid: false, erros: ['Input não é array'] };
        }

        for (const prob of probabilidades) {
            if (prob.probabilidade < 0 || prob.probabilidade > 100) {
                validacoes.erros.push(`Probabilidade inválida: ${prob.probabilidade}%`);
                validacoes.valid = false;
            }

            if (prob.intervalo_confianca) {
                const { inferior, superior } = prob.intervalo_confianca;
                if (inferior > superior) {
                    validacoes.erros.push(`IC inválido para ${prob.targetOdd}: ${inferior}% > ${superior}%`);
                    validacoes.valid = false;
                }
                
                if (superior - inferior > 50) {
                    validacoes.avisos.push(`IC grande para ${prob.targetOdd}: ${superior - inferior}%`);
                }
            }

            if (prob.total && prob.total < CONFIG.statistics.minDataPoints) {
                validacoes.avisos.push(`Amostra pequena para ${prob.targetOdd}: ${prob.total} pontos`);
            }
        }

        return validacoes;
    }

    static calcularProbabilidadesMultiplas(odds, targetsOdds) {
        return targetsOdds.map(target => 
            this.calcularProbabilidadeReal(odds, target)
        );
    }

    static calcularProbabilidadeSequencia(odds, sequencia) {
        let probabilidade = 1;
        
        for (let i = 0; i < sequencia.length; i++) {
            const target = sequencia[i];
            const resultado = this.calcularProbabilidadeReal(odds, target);
            
            if (resultado.erro) return resultado;
            
            probabilidade *= (resultado.probabilidade / 100);
        }

        return {
            sequencia,
            probabilidade_conjunta: parseFloat((probabilidade * 100).toFixed(4))
        };
    }

    static calcularProbabilidadeCondicional(odds, eventA, eventB) {
        const oddsDadoB = odds.filter(o => o >= eventB);
        
        if (oddsDadoB.length === 0) {
            return { erro: 'Nenhuma odd satisfaz condição B' };
        }

        const ocorrenciasAB = oddsDadoB.filter(o => o >= eventA).length;
        
        return {
            evento_A: eventA,
            evento_B: eventB,
            probabilidade_condicional: parseFloat(((ocorrenciasAB / oddsDadoB.length) * 100).toFixed(2))
        };
    }

    static distribuicaoBinomial(n, p, k) {
        const combinacao = this.combinacao(n, k);
        const probabilidade = combinacao * Math.pow(p, k) * Math.pow(1 - p, n - k);
        return parseFloat(probabilidade.toFixed(6));
    }

    static combinacao(n, k) {
        if (k > n) return 0;
        if (k === 0 || k === n) return 1;
        
        let resultado = 1;
        for (let i = 1; i <= k; i++) {
            resultado = resultado * (n - k + i) / i;
        }
        
        return Math.round(resultado);
    }

    static calcularExpectativa(odds, probabilidades) {
        if (odds.length !== probabilidades.length) {
            return { erro: 'Arrays de tamanho diferente' };
        }

        let expectativa = 0;
        
        for (let i = 0; i < odds.length; i++) {
            expectativa += odds[i] * (probabilidades[i] / 100);
        }

        return parseFloat(expectativa.toFixed(4));
    }

    static testeNormalidade(dados) {
        if (dados.length < 3 || dados.length > 5000) {
            return { erro: 'Tamanho de amostra inválido' };
        }

        const sorted = [...dados].sort((a, b) => a - b);
        const media = dados.reduce((a, b) => a + b) / dados.length;
        
        const somaQuadrados = dados.reduce((sum, x) => sum + Math.pow(x - media, 2), 0);
        
        let numerador = 0;
        for (let i = 0; i < Math.floor(dados.length / 2); i++) {
            const ai = sorted[dados.length - 1 - i] - sorted[i];
            numerador += ai * ai;
        }
        
        const W = numerador / somaQuadrados;
        
        return {
            estatistica_w: parseFloat(W.toFixed(4)),
            normal: W > 0.9
        };
    }

    static calcularZScore(valor, media, desvio_padrao) {
        if (desvio_padrao === 0) return 0;
        return parseFloat(((valor - media) / desvio_padrao).toFixed(4));
    }

    static calcularPercentil(dados, percentil) {
        if (percentil < 0 || percentil > 100) {
            return { erro: 'Percentil deve estar entre 0 e 100' };
        }

        const sorted = [...dados].sort((a, b) => a - b);
        const index = (percentil / 100) * (sorted.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index % 1;

        if (lower === upper) {
            return sorted[lower];
        }

        return parseFloat((sorted[lower] * (1 - weight) + sorted[upper] * weight).toFixed(2));
    }
}

export default Probability;
