export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';
export type RiskStatus = 'Open' | 'Mitigating' | 'Closed' | 'Controlled';

// Requisito: mapping a labels específicos
export type DocumentType = 'Contract' | 'Scope' | 'Minute' | 'Weekly Report' | 'Monthly Report' | 'Schedule';

export type ProcessingStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'ERROR' | 'FAILED';
export type TimeHorizon = '0-7' | '8-15' | '16-30' | '31-60' | '61-90' | '90+';

export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'CONTROL_PROYECTOS' | 'LIDER_PROYECTO' | 'COLABORADOR' | 'CLIENTE_LECTOR';

export type ProjectStatus = 'BORRADOR' | 'EN_EJECUCION' | 'CERRADO';
export type UserStatus = 'ACTIVE' | 'PENDING' | 'DISABLED';

export interface UnidadNegocio {
    id: string;
    nombre: string;
    liderId: string;
    liderName?: string;
}

export interface Cliente {
    id: string;
    razonSocial: string;
    rucNit?: string;
    contactoNombre?: string;
    contactoEmail?: string;
}

export interface TeamMember {
    uid: string;
    roleInProject: string; // RESPONSABLE | COLABORADOR | LECTOR
    addedAt: string;
    addedByUid: string;
    displayName?: string;
    email?: string;
}

export interface UserProfile {
    uid: string;
    email: string;
    displayName?: string;
    role: UserRole;
    status: UserStatus;
    assignedProjectIds: string[];
    createdAt: string;
    updatedAt: string;
}

export interface Proyecto {
    id: string;
    codigo?: string;
    name: string;
    contractId: string;
    clientName: string; // Mantenido por compatibilidad legacy
    clienteId?: string; // Nuevo link al D.E.R.
    amount: number;
    currency: string;
    startDate: string;
    estimatedEndDate: string;
    status: ProjectStatus;
    type: string;
    scopeDescription: string;
    leaderUid: string;
    leaderName?: string;
    leaderEmail?: string;
    unidadId?: string;
    team: TeamMember[];
    config: ProjectConfig;
}

export interface ProjectConfig {
    weightTimeline: number;
    weightCost: number;
    clauseTypeWeights: Record<string, number>;
}

export interface Obligacion {
    id: string;
    proyectoId: string;
    origenDocumentoId: string;
    codigo: string;
    descripcion: string;
    categoria: 'PLAZO' | 'CALIDAD' | 'PAGO' | 'SEGURIDAD' | 'DOC';
    severidad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
    fechaCompromiso?: string;
    responsableId?: string;
    estado: 'PENDIENTE' | 'EN_PROGRESO' | 'CUMPLIDA' | 'INCUMPLIDA';
    createdAt: string;
}

export interface Risk {
    id: string;
    projectId: string;
    obligacionId?: string; // Link a Obligacion
    description: string;
    categoria: string; // TECNICO | SUMINISTRO | CLIENTE | HSE

    // Escalas 1-5
    probability: number;
    impactTimeline: number;
    impactCost: number;
    penaltyExposure: number;

    severityScore: number;
    classification: Priority;
    status: RiskStatus;

    mitigationAction: string; // Mantenido para compatibilidad
    dueDate: string;
    responsible: string;

    acciones?: AccionMitigacion[]; // Nueva relación detallada
    history: RiskEvent[];
}

export interface AccionMitigacion {
    id: string;
    riesgoId: string;
    descripcion: string;
    fechaCompromiso: string;
    responsableId: string;
    responsableName?: string;
    estado: 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADA';
    comentarioCierre?: string;
    createdAt: string;
}

export interface ComentarioHallazgo {
    id: string;
    entidadTipo: 'RIESGO' | 'DOCUMENTO' | 'OBLIGACION';
    entidadId: string;
    usuarioId: string;
    usuarioName?: string;
    texto: string;
    createdAt: string;
}

export interface RiskEvent {
    id: string;
    riskId: string;
    changedBy: string;
    changedAt: string;
    field: string;
    oldValue: string;
    newValue: string;
    notes: string;
}
