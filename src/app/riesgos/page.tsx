"use client"

import { useState } from 'react'
import {
    ShieldAlert,
    Search,
    Filter,
    Plus,
    MoreVertical,
    FileText,
    Calendar,
    User,
    ExternalLink,
    ChevronRight,
    Info,
    History as LucideHistory,
    ShieldCheck,
    ArrowUpRight
} from 'lucide-react'
import { Risk, ContractClause, Priority } from '@/types/contractual'

import { useProjects } from '@/components/ProjectContext'
import { useEffect } from 'react'
import { userService } from '@/lib/userService'

export default function RiskAnalysis() {
    const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null)
    const { projects } = useProjects()
    const [users, setUsers] = useState<any[]>([])

    useEffect(() => {
        userService.getAllUsers().then(setUsers);
    }, []);

    const getLeaderName = (leaderId?: string) => {
        if (!leaderId) return 'Sin asignar';
        const user = users.find(u => u.uid === leaderId);
        return user ? user.displayName : 'Sin asignar';
    }

    // Datos mock alineados al modelo formal
    const mockClauses: ContractClause[] = [
        { id: 'C1', projectId: 'P1', clauseNumber: '4.2', title: 'Entrega Tardía', content: 'Si el contratista se retrasa...', type: 'Penalty', penaltyExposure: 50000 },
        { id: 'C4', projectId: 'P1', clauseNumber: '15.1', title: 'Derecho de Vía', content: 'Gestión de terrenos...', type: 'Obligation', penaltyExposure: 0 },
    ]

    const risks: Risk[] = [
        {
            id: 'RSK-ACT-001',
            projectId: projects[0]?.id || 'P1',
            description: 'Retraso Crítico en Ingeniería Nodo Cusiana',
            originType: 'ACTIVITY',
            activityId: 'ACT-001',
            clauseId: 'C1',
            evidence: {
                documentId: 'SCH-001',
                documentVersionId: '1.0',
                date: '2026-02-23',
                excerpt: 'Avance del 45% vs 65% planeado.'
            },
            probability: 4,
            impactTimeline: 5,
            impactCost: 3,
            penaltyExposure: 4,
            severityScore: 35.5,
            classification: 'Critical',
            status: 'Mitigating',
            responsible: getLeaderName(projects[0]?.leaderUid),
            dueDate: '2026-05-10',
            mitigationAction: 'Plan de contingencia logística marítima urgente.',
            history: []
        },
        {
            id: 'RSK-INC-004',
            projectId: 'P1',
            description: 'Interrupción en Cadena de Suministro (Válvulas)',
            originType: 'INCIDENT',
            clauseId: 'C4',
            evidence: {
                documentId: 'MIN-08',
                documentVersionId: '1.0',
                date: '2026-02-20',
                excerpt: 'Retraso en aduana detectado.'
            },
            probability: 5,
            impactTimeline: 4,
            impactCost: 4,
            penaltyExposure: 0,
            severityScore: 28,
            classification: 'High',
            status: 'Open',
            responsible: 'Pedro Ruiz',
            dueDate: '2026-03-15',
            mitigationAction: 'Negociación directa con proveedores alternativos.',
            history: []
        }
    ]

    const getSeverityColor = (classification: Priority) => {
        if (classification === 'Critical') return 'var(--danger)'
        if (classification === 'High') return 'var(--warning)'
        return 'var(--success)'
    }

    const translateStatus = (status: string) => {
        switch (status) {
            case 'Open': return 'ABIERTO';
            case 'Mitigating': return 'MITIGANDO';
            case 'Closed': return 'CERRADO';
            case 'Controlled': return 'CONTROLADO';
            default: return status.toUpperCase();
        }
    }

    return (
        <div className="analisis-riesgos">
            <header className="header" style={{ marginBottom: '2.5rem' }}>
                <div className="header-title">
                    <h1>Registro y Trazabilidad de Riesgos</h1>
                    <p>Inventario determinista de riesgos contractuales vinculados a evidencia documentada.</p>
                </div>
            </header>

            <div className="dashboard-grid">
                <div className="card" style={{ gridColumn: selectedRisk ? 'span 7' : 'span 12', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Inventario de Riesgos</h3>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                                <input type="text" className="form-control" placeholder="Buscar riesgos..." style={{ paddingLeft: '2.5rem', width: '240px', borderRadius: '8px' }} />
                            </div>
                            <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Filter size={16} /> Filtrar
                            </button>
                        </div>
                    </div>

                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Descripción</th>
                                    <th>Horizonte</th>
                                    <th>Severidad</th>
                                    <th>Ref. Cláusula</th>
                                    <th>Responsable</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {risks.map(risk => (
                                    <tr
                                        key={risk.id}
                                        onClick={() => setSelectedRisk(risk)}
                                        style={{
                                            cursor: 'pointer',
                                            backgroundColor: selectedRisk?.id === risk.id ? 'rgba(37, 99, 235, 0.05)' : 'transparent',
                                            transition: 'background-color 0.2s'
                                        }}
                                        className="table-row-hover"
                                    >
                                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{risk.id}</td>
                                        <td style={{ fontWeight: 500 }}>{risk.description}</td>
                                        <td>
                                            <span className={`badge ${risk.timeHorizon === '0-7' ? 'badge-critical' : risk.timeHorizon === '8-15' ? 'badge-high' : 'badge-low'}`} style={{ fontSize: '0.65rem' }}>
                                                {risk.timeHorizon || '90+'} D
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getSeverityColor(risk.classification) }}></div>
                                                <span style={{ fontWeight: 600 }}>{risk.severityScore}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                                <FileText size={14} />
                                                {mockClauses.find(c => c.id === risk.clauseId)?.clauseNumber || 'N/A'}
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '0.875rem' }}>{risk.responsible}</td>
                                        <td>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                backgroundColor: risk.status === 'Mitigating' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                                                color: risk.status === 'Mitigating' ? 'var(--primary)' : 'var(--text-secondary)'
                                            }}>
                                                {translateStatus(risk.status)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* traceability Panel */}
                {selectedRisk && (
                    <div className="card" style={{ gridColumn: 'span 5', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Detalles {selectedRisk.id}</h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Perfil de Trazabilidad de Riesgo</p>
                            </div>
                            <button onClick={() => setSelectedRisk(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <ChevronRight size={24} />
                            </button>
                        </div>

                        <section>
                            <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Evidencia Destacada</h4>
                            <div style={{ padding: '1rem', backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                "...retraso sustancial detectado en actividad de ruta crítica #24 debido a interrupción en cadena de suministro..."
                            </div>
                        </section>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ padding: '1rem', backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>FECHA LÍMITE</p>
                                <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{selectedRisk.dueDate}</p>
                            </div>
                            <div style={{ padding: '1rem', backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>RESPONSABLE</p>
                                <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{selectedRisk.responsible}</p>
                            </div>
                        </div>

                        <section>
                            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Estrategia de Mitigación</h4>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{selectedRisk.mitigationAction}</p>
                        </section>

                        <section style={{ padding: '1.25rem', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)', border: '1px solid rgba(37, 99, 235, 0.2)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ShieldAlert size={18} style={{ color: '#fff' }} />
                                </div>
                                <h4 style={{ fontWeight: 800, color: 'var(--primary)' }}>Severidad Determinista</h4>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>PROBABILIDAD</p>
                                    <p style={{ fontSize: '1.125rem', fontWeight: 800 }}>P{selectedRisk.probability}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>IMPACTO (P/C)</p>
                                    <p style={{ fontSize: '1.125rem', fontWeight: 800 }}>{selectedRisk.impactTimeline}/{selectedRisk.impactCost}</p>
                                </div>
                            </div>
                        </section>

                        <button className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', borderRadius: '8px', padding: '0.875rem' }}>
                            <ArrowUpRight size={18} />
                            <span>Abrir Documento de Contrato</span>
                        </button>
                    </div>
                )}
            </div>

            <div style={{ marginTop: '2.5rem', padding: '1.5rem', backgroundColor: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={28} style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                    <h4 style={{ fontWeight: 700 }}>Regla de Gobernanza Contractual</h4>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Los riesgos sin derivación contractual (ni hallazgo ni cláusula) se clasifican como "Informativos" y se excluyen de la puntuación de salud del proyecto para el cumplimiento de auditoría.
                    </p>
                </div>
            </div>
        </div>
    )
}
