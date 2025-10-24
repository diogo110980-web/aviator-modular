/**
 * Moving Averages Module - Médias Móveis e Alertas
 * 12 funções de análise de médias
 */

import { CONFIG } from '../config.js';

export class MovingAverages {
    
    static calcularSMA(dados, periodo) {
        if (!Array.isArray(dados) || dados.length < periodo) {
            return [];
        }

        const medias = [];

        for (let i = periodo - 1; i < dados.length; i++) {
            const janela = dados.slice(i - periodo + 1, i + 1);
            const media = janela.reduce((a, b) => a + b, 0) / periodo;
            medias.push({
                indice: i,
                valor: parseFloat(media.toFixed(2)),
                periodo
            });
        }

        return medias;
    }

    static calcularEMA(dados, periodo) {
        if (!Array.isArray(dados) || dados.length < periodo) {
            return [];
        }

        const multiplicador = 2 / (periodo + 1);
        const medias = [];

        let ema = dados.slice(0, periodo).reduce((a, b) => a + b) / periodo;
        medias.push({
            indice: periodo - 1,
            valor: parseFloat(ema.toFixed(2)),
            tipo: 'SMA_inicial'
        });

        for (let i = periodo; i < dados.length; i++) {
            ema = (dados[i] - ema) * multiplicador + ema;
            medias.push({
                indice: i,
                valor: parseFloat(ema.toFixed(2)),
                tipo: 'EMA'
            });
        }

        return medias;
    }

    static calcularMultiplasMedias(dados) {
        const periodos = CONFIG.movingAverages.periods;
        const resultado = {};

        periodos.forEach(periodo => {
            resultado[`SMA_${periodo}`] = this.calcularSMA(dados, periodo);
        });

        return resultado;
    }

    static detectarCrossover(ma1, ma2) {
        const crossovers = [];

        const minLen = Math.min(ma1.length, ma2.length);
        if (minLen < 2) return crossovers;

        for (let i = 1; i < minLen; i++) {
            const prev_ma1 = ma1[i - 1].valor;
            const curr_ma1 = ma1[i].valor;
            const prev_ma2 = ma2[i - 1].valor;
            const curr_ma2 = ma2[i].valor;

            if (prev_ma1 < prev_ma2 && curr_ma1 > curr_ma2) {
                crossovers.push({
                    indice: i,
                    tipo: 'BULLISH',
                    ma1_valor: curr_ma1,
                    ma2_valor: curr_ma2,
                    diferenca: parseFloat((curr_ma1 - curr_ma2).toFixed(2))
                });
            }

            if (prev_ma1 > prev_ma2 && curr_ma1 < curr_ma2) {
                crossovers.push({
                    indice: i,
                    tipo: 'BEARISH',
                    ma1_valor: curr_ma1,
                    ma2_valor: curr_ma2,
                    diferenca: parseFloat((curr_ma2 - curr_ma1).toFixed(2))
                });
            }
        }

        return crossovers;
    }

    static calcularMediasMoveis(dados) {
        if (!Array.isArray(dados) || dados.length < 10) {
            return { erro: 'Dados insuficientes' };
        }

        const periodos = CONFIG.movingAverages.periods;
        const medias = {};
        const ultimasMedias = {};

        periodos.forEach(periodo => {
            const sma = this.calcularSMA(dados, periodo);
            medias[`SMA_${periodo}`] = sma;
            
            if (sma.length > 0) {
                ultimasMedias[`SMA_${periodo}`] = sma[sma.length - 1].valor;
            }
        });

        const alertas = [];
        const preco_atual = dados[dados.length - 1];
        
        periodos.forEach(periodo => {
            const ma_key = `SMA_${periodo}`;
            const ma_valor = ultimasMedias[ma_key];
            
            if (ma_valor) {
                const diferenca = preco_atual - ma_valor;
                const percentual = (diferenca / ma_valor) * 100;

                if (Math.abs(percentual) > CONFIG.movingAverages.alertThreshold) {
                    alertas.push({
                        periodo,
                        ma_valor,
                        preco_atual,
                        diferenca: parseFloat(diferenca.toFixed(2)),
                        percentual: parseFloat(percentual.toFixed(2)),
                        tipo: diferenca > 0 ? 'acima' : 'abaixo',
                        intensidade: Math.abs(percentual) > 5 ? 'alta' : 'média'
                    });
                }
            }
        });

        alertas.sort((a, b) => Math.abs(b.percentual) - Math.abs(a.percentual));

        return {
            preco_atual: parseFloat(preco_atual.toFixed(2)),
            medias: ultimasMedias,
            alertas,
            total_alertas: alertas.length,
            sinal: alertas.length > 0 ? 'OPORTUNIDADE DETECTADA' : 'Sem oportunidades',
            vantagem_percentual: alertas.length > 0 ? alertas[0].percentual : 0
        };
    }

    static detectarOportunidades(dados, baseMedia = 'SMA_20') {
        const medias = this.calcularMediasMoveis(dados);
        
        if (medias.erro) {
            return { erro: medias.erro };
        }

        const oportunidades = [];
        const preco_atual = medias.preco_atual;

        medias.alertas.forEach(alerta => {
            if (alerta.intensidade === 'alta' && alerta.percentual > CONFIG.movingAverages.alertThreshold) {
                oportunidades.push({
                    tipo: 'REVERSAO_ESPERADA',
                    descricao: `Preço ${alerta.tipo} da SMA${alerta.periodo} por ${Math.abs(alerta.percentual).toFixed(1)}%`,
                    confianca: 'Média',
                    score: Math.abs(alerta.percentual)
                });
            }
        });

        const shortMA = this.calcularSMA(dados, 10);
        const longMA = this.calcularSMA(dados, 20);
        const crossovers = this.detectarCrossover(shortMA, longMA);

        if (crossovers.length > 0) {
            const ultimoCrossover = crossovers[crossovers.length - 1];
            oportunidades.push({
                tipo: 'CROSSOVER',
                descricao: `Crossover ${ultimoCrossover.tipo} - SMA10 vs SMA20`,
                confianca: 'Alta',
                score: 80
            });
        }

        oportunidades.sort((a, b) => b.score - a.score);

        return {
            oportunidades_detectadas: oportunidades.length,
            oportunidades,
            recomendacao: oportunidades.length > 0 ? 'Analise as oportunidades' : 'Nenhuma oportunidade detectada'
        };
    }

    static gerarSinal(dados) {
        const medias = this.calcularMediasMoveis(dados);
        const oportunidades = this.detectarOportunidades(dados);

        if (medias.erro || oportunidades.erro) {
            return { erro: 'Erro ao processar dados' };
        }

        let sinal = 'NEUTRO';
        let confianca = 0;

        const alertas_acima = medias.alertas.filter(a => a.tipo === 'acima').length;
        const alertas_abaixo = medias.alertas.filter(a => a.tipo === 'abaixo').length;

        if (alertas_acima > alertas_abaixo) {
            sinal = 'COMPRA';
            confianca = Math.min(alertas_acima / (alertas_acima + alertas_abaixo) * 100, 95);
        } else if (alertas_abaixo > alertas_acima) {
            sinal = 'VENDA';
            confianca = Math.min(alertas_abaixo / (alertas_acima + alertas_abaixo) * 100, 95);
        }

        if (oportunidades.oportunidades_detectadas > 0) {
            confianca = Math.min(confianca + 10, 95);
        }

        return {
            sinal,
            confianca: parseFloat(confianca.toFixed(2)),
            medias: medias.medias,
            oportunidades: oportunidades.oportunidades,
            timestamp: Date.now()
        };
    }

    static calcularSuporteResistencia(dados, periodo = 20) {
        const medias = this.calcularSMA(dados, periodo);
        
        if (medias.length === 0) {
            return { erro: 'Dados insuficientes' };
        }

        const ultimaMedia = medias[medias.length - 1].valor;
        const volatilidade = this.calcularVolatilidade(dados.slice(-periodo));

        return {
            media_movel: ultimaMedia,
            volatilidade,
            suporte: parseFloat((ultimaMedia - volatilidade).toFixed(2)),
            resistencia: parseFloat((ultimaMedia + volatilidade).toFixed(2)),
            margem_seguranca: parseFloat(volatilidade.toFixed(2))
        };
    }

    static calcularVolatilidade(dados) {
        if (dados.length < 2) return 0;

        const media = dados.reduce((a, b) => a + b) / dados.length;
        const variancia = dados.reduce((sum, x) => sum + Math.pow(x - media, 2), 0) / dados.length;
        
        return Math.sqrt(variancia);
    }
}

export default MovingAverages;
