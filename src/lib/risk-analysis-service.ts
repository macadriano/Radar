import { CriticalActivity, Incident, Risk, ProjectConfig, ContractClause, ScoreBreakdown } from '../types/contractual';
import { analyzeActivityRisk, analyzeIncidentRisk } from './riskEngine';
import { calculateProjectScore, DEFAULT_PROJECT_CONFIG } from './score-engine';

export interface AnalysisResult {
    risks: Risk[];
    score: ScoreBreakdown;
    timestamp: string;
}

/**
 * Servicio de Orquestación de Análisis de Riesgos
 */
export function runFullRiskAnalysis(
    activities: CriticalActivity[],
    incidents: Incident[],
    clauses: ContractClause[],
    config: ProjectConfig = DEFAULT_PROJECT_CONFIG,
    projectTotalAmount: number = 0
): AnalysisResult {
    const risks: Risk[] = [];

    // 1. Analizar Actividades Críticas
    activities.forEach(activity => {
        // En una implementación real, buscaríamos menciones en documentos
        // Por ahora simulamos 1 mención si el avance es bajo
        const mentions = activity.percentComplete < 50 ? 1 : 0;
        const risk = analyzeActivityRisk(activity, mentions);
        if (risk) risks.push(risk);
    });

    // 2. Analizar Imprevistos (Incidents)
    incidents.forEach(incident => {
        const risk = analyzeIncidentRisk(incident, projectTotalAmount);
        if (risk) risks.push(risk);
    });

    // 3. Calcular Score de Salud
    const score = calculateProjectScore(risks, config, clauses);

    return {
        risks: risks.sort((a, b) => b.severityScore - a.severityScore),
        score,
        timestamp: new Date().toISOString()
    };
}
