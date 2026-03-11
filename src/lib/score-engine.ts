import { Risk, ProjectConfig, ContractClause, ScoreBreakdown } from '@/types/contractual';

/**
 * Algoritmo de Salud Contractual
 * Calcula el score (0-100) basado en riesgos activos y su impacto.
 */
export function calculateProjectScore(
    risks: Risk[],
    config: ProjectConfig,
    clauses: ContractClause[]
): ScoreBreakdown {
    const initialScore = 100;
    let totalPointsDeducted = 0;
    const deductions: ScoreBreakdown['deductions'] = [];

    // Filter only active risks
    const activeRisks = risks.filter(r => r.status !== 'Closed');

    let totalEconomicRisk = 0;
    let totalDaysDelay = 0;

    activeRisks.forEach(risk => {
        // 1. Obtener peso de cláusula asociada
        let clauseWeight = 1.0;
        let penaltyValue = 0;

        const clauseId = risk.clauseId || (risk as any).associatedClauseId; // Legacy support during migration
        if (clauseId) {
            const clause = clauses.find(c => c.id === clauseId);
            if (clause) {
                clauseWeight = config.clauseTypeWeights[clause.type] || 1.0;
                penaltyValue = clause.penaltyExposure;
            }
        }

        // 2. Cálculo de severidad básica (Usando escalas 1-5)
        // Normalizamos: 1-5 scale -> Factor 0.2 to 1.0
        const probFactor = risk.probability / 5;
        const timelineFactor = risk.impactTimeline / 5;
        const costFactor = risk.impactCost / 5;

        // El impacto ponderado es una combinación de plazo y costo según configuración del proyecto
        const weightedImpact = (timelineFactor * config.weightTimeline) + (costFactor * config.weightCost);
        
        // La severidad es Probabilidad * Impacto
        const severityFactor = probFactor * weightedImpact;

        // 3. Impacto de penalidad y exposición
        // Si hay una penalidad contractual (PE), esto suma puntos de deducción directos
        const penaltyPoints = (risk.penaltyExposure >= 3) ? (risk.penaltyExposure * 1.5) : 0;
        
        // Sumar a métricas corporativas
        totalEconomicRisk += penaltyValue;
        // Si el riesgo tiene un estimado cuantitativo (opcional), lo sumamos aquí
        // totalDaysDelay += ... 

        // 4. Cálculo final del riesgo individual
        // Un riesgo máximo (P5, I5, PE5) en una cláusula crítica (w1.8) restaría aprox:
        // (1 * 1) * 1.8 + (5 * 1.5) = 1.8 + 7.5 = 9.3 puntos.
        // Limitamos la deducción por riesgo individual para evitar que un solo riesgo destruya el score.
        const riskDeduction = (severityFactor * 5 * clauseWeight) + penaltyPoints;
        const totalDeductionForRisk = Math.min(riskDeduction, 25);

        totalPointsDeducted += totalDeductionForRisk;

        deductions.push({
            riskId: risk.id,
            description: risk.description,
            points: Number(totalDeductionForRisk.toFixed(2)),
            penaltyImpact: Number(penaltyPoints.toFixed(2))
        });
    });

    // Clamp final score between 0 and 100
    const finalScore = Math.max(0, initialScore - totalPointsDeducted);

    let globalTGIStatus: 'Stable' | 'Warning' | 'Critical' = 'Stable';
    if (finalScore < 60 || totalEconomicRisk > 100000) globalTGIStatus = 'Critical';
    else if (finalScore < 85) globalTGIStatus = 'Warning';

    return {
        initialScore,
        totalDeductions: Number(totalPointsDeducted.toFixed(2)),
        finalScore: Number(finalScore.toFixed(2)),
        deductions,
        corporateImpact: {
            totalEconomicRisk,
            totalDaysDelay,
            globalTGIStatus
        }
    };
}

/**
 * Default editable weight mapping table
 */
export const DEFAULT_CLAUSE_WEIGHTS: Record<string, number> = {
    'Critical Milestone': 1.5,
    'Penalty': 1.8,
    'Obligation': 1.2,
    'General': 1.0
};

export const DEFAULT_PROJECT_CONFIG: ProjectConfig = {
    weightTimeline: 0.5,
    weightCost: 0.5,
    clauseTypeWeights: DEFAULT_CLAUSE_WEIGHTS
};
