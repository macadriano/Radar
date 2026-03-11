import {
    CriticalActivity,
    Incident,
    Risk,
    Priority,
    RiskStatus,
    IncidentCategory
} from '../types/contractual';

/**
 * Motor de Riesgos Radar Contractual
 * Criterio determinista y trazable para conversión de Actividades e Imprevistos en Riesgos.
 */

// --- Utilidades de cálculo base ---

export function calculateSeverityScore(p: number, ip: number, ic: number, pe: number, criticalityBase: number): number {
    return p * (ip + ic) + (pe * 2) + criticalityBase;
}

export function classifyPriority(score: number, pe: number, affectsContractualEnd: boolean): Priority {
    if (score >= 40 || pe >= 4 || affectsContractualEnd) return 'Critical';
    if (score >= 25) return 'High';
    if (score >= 15) return 'Medium';
    return 'Low';
}

// --- Lógica para ACTIVIDADES CRÍTICAS ---

export function analyzeActivityRisk(
    activity: CriticalActivity,
    mentionsInDocs: number,
    today: string = new Date().toISOString().split('T')[0]
): Risk | null {
    // 1. Probabilidad (P1-P5)
    // P1: Al día, P2: <=5%, P3: 6-15%, P4: 16-30%, P5: >30% o incumplimiento de hito
    let p = 1;
    const plannedStart = new Date(activity.plannedStart);
    const plannedEnd = new Date(activity.plannedEnd);
    const duration = plannedEnd.getTime() - plannedStart.getTime();
    const todayDate = new Date(today);

    if (activity.percentComplete < 100) {
        if (todayDate > plannedEnd) {
            const delay = todayDate.getTime() - plannedEnd.getTime();
            const delayRatio = delay / duration;

            if (delayRatio > 0.3) p = 5;
            else if (delayRatio > 0.15) p = 4;
            else if (delayRatio > 0.05) p = 3;
            else p = 2;
        } else if (mentionsInDocs >= 2) {
            p = 3;
        } else if (mentionsInDocs === 1) {
            p = 2;
        }
    }

    // 2. Impacto en Plazo (Ip 1-5)
    // Usamos el hito contractual y la ruta crítica como drivers
    let ip = 1;
    if (activity.milestoneId) {
        ip = activity.percentComplete < 80 ? 5 : 4; // Si es hito contractual y falta mucho, impacto alto
    } else if (activity.criticalityBase >= 4) {
        ip = 4;
    } else {
        ip = activity.criticalityBase;
    }

    // 3. Impacto en Costo (Ic 1-5)
    // Basado en criticalityBase o proxy de re-trabajo
    let ic = Math.min(5, activity.criticalityBase);

    // 4. Penalty Exposure (PE 0-5)
    let pe = activity.hasPenalty ? Math.max(3, activity.penaltyWeight) : 0;
    if (activity.milestoneId && activity.percentComplete < 100 && todayDate > plannedEnd) {
        pe = 5; // Penalidad directa activable
    }

    const score = calculateSeverityScore(p, ip, ic, pe, activity.criticalityBase);

    // Regla de Oro: Solo si hay una desviación o alerta tangible
    if (p <= 1 && pe < 3) return null;

    return {
        id: `RSK-ACT-${activity.activityId}-${Date.now()}`,
        projectId: activity.projectId,
        description: `Desviación en actividad crítica: ${activity.name}`,
        originType: 'ACTIVITY',
        activityId: activity.activityId,
        evidence: {
            documentId: 'SCH-001', // Cronograma por defecto
            documentVersionId: '1.0',
            date: today,
            excerpt: `Avance del ${activity.percentComplete}% vs plan original. Retraso estimado impactando criticalityBase ${activity.criticalityBase}.`
        },
        probability: p,
        impactTimeline: ip,
        impactCost: ic,
        penaltyExposure: pe,
        severityScore: score,
        classification: classifyPriority(score, pe, ip === 5),
        status: 'Open',
        mitigationAction: 'Revisión técnica de cronograma y recursos.',
        dueDate: activity.plannedEnd,
        responsible: 'Líder de Proyecto',
        history: []
    };
}

// --- Lógica para IMPREVISTOS (INCIDENTS) ---

export function analyzeIncidentRisk(
    incident: Incident,
    projectTotalAmount: number
): Risk | null {
    // REGLA DE ORO: Debe tener vínculo contractual
    if (!incident.linkedActivityId && !incident.linkedClauseId) return null;

    // 1. Probabilidad (P1-P5)
    let p = 3; // Default para imprevisto con evidencia
    if (incident.category === 'HSE' || incident.category === 'legal') p = 4;

    // 2. Impactos Base por Categoría
    let ip = 3;
    let ic = 3;
    let pe = 0;

    switch (incident.category) {
        case 'cliente':
        case 'permisos':
            ip = 4; ic = 2; pe = 3;
            break;
        case 'técnico':
        case 'QAQC':
            ic = 4; ip = 3;
            break;
        case 'suministro':
            ip = 4; ic = 3;
            break;
        case 'HSE':
            pe = 5; ip = 2; ic = 4;
            break;
        case 'legal':
            pe = 5; ip = 4; ic = 4;
            break;
    }

    // Refinar Ip/Ic si hay estimaciones explícitas
    if (incident.daysImpactEstimate) {
        if (incident.daysImpactEstimate > 14) ip = 5;
        else if (incident.daysImpactEstimate > 7) ip = 4;
        else if (incident.daysImpactEstimate > 3) ip = 3;
        else ip = 2;
    }

    if (incident.costImpactEstimate && projectTotalAmount > 0) {
        const ratio = incident.costImpactEstimate / projectTotalAmount;
        if (ratio > 0.03) ic = 5;
        else if (ratio > 0.015) ic = 4;
        else if (ratio > 0.005) ic = 3;
        else ic = 2;
    }

    const score = calculateSeverityScore(p, ip, ic, pe, 3); // criticalityBase default 3 para imprevistos

    return {
        id: `RSK-INC-${incident.incidentId}`,
        projectId: incident.projectId,
        description: `Imprevisto detectado: ${incident.excerpt.substring(0, 50)}...`,
        originType: 'INCIDENT',
        activityId: incident.linkedActivityId,
        clauseId: incident.linkedClauseId,
        evidence: {
            documentId: incident.documentId,
            documentVersionId: incident.documentVersionId,
            date: incident.date,
            excerpt: incident.excerpt
        },
        probability: p,
        impactTimeline: ip,
        impactCost: ic,
        penaltyExposure: pe,
        severityScore: score,
        classification: classifyPriority(score, pe, ip === 5),
        status: 'Open',
        mitigationAction: `Plan de acción correctivo para categoría ${incident.category}.`,
        dueDate: incident.date,
        responsible: 'Asignado según categoría',
        history: []
    };
}
