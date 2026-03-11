"use client"

import { useState } from 'react'
import {
    ShieldAlert,
    CheckCircle2,
    Clock,
    User,
    ArrowUpRight,
    ChevronRight,
    Filter,
    Search,
    MessageSquare,
    AlertTriangle,
    Flag
} from 'lucide-react'
import { Risk, Priority } from '@/types/contractual'

import { useProjects } from '@/components/ProjectContext'
import { useEffect } from 'react'
import { userService } from '@/lib/userService'

export default function MitigacionRiesgos() {
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

    // Datos mock centrados en mitigación
    const risks: Risk[] = [
        {
            id: 'RSK-ACT-001',
            projectId: projects[0]?.id || 'P1',
            description: 'Retraso Crítico en Ingeniería Nodo Cusiana',
            originType: 'ACTIVITY',
            evidence: { documentId: 'D1', documentVersionId: '1', date: '2026-02-23', excerpt: '...' },
            probability: 4,
            impactTimeline: 5,
            impactCost: 3,
            penaltyExposure: 4,
            severityScore: 35.5,
            classification: 'Critical',
            status: 'Mitigating',
            responsible: getLeaderName(projects[0]?.leaderUid),
            dueDate: '2026-05-10',
            mitigationAction: 'Plan de contingencia logística marítima urgente y redistribución de carga de trabajo en taller.',
            history: []
        },
        {
            id: 'RSK-INC-004',
            projectId: 'P1',
            description: 'Interrupción en Cadena de Suministro (Válvulas)',
            originType: 'INCIDENT',
            evidence: { documentId: 'D2', documentVersionId: '1', date: '2026-02-20', excerpt: '...' },
            probability: 5,
            impactTimeline: 4,
            impactCost: 4,
            penaltyExposure: 0,
            severityScore: 28,
            classification: 'High',
            status: 'Open',
            responsible: 'Pedro Ruiz',
            dueDate: '2026-03-15',
            mitigationAction: 'Negociación directa con proveedores alternativos en Zona Franca.',
            history: []
        }
    ]

    const getPriorityIcon = (classification: Priority) => {
        switch (classification) {
            case 'Critical': return <Flag size={14} style={{ color: 'var(--danger)' }} />;
            case 'High': return <Flag size={14} style={{ color: 'var(--warning)' }} />;
            default: return <Flag size={14} style={{ color: 'var(--success)' }} />;
        }
    }

    return (
        <div className="mitigacion-riesgos">
            <header className="header" style={{ marginBottom: '2.5rem' }}>
                <div className="header-title">
                    <h1>Módulo de Mitigación y Control</h1>
                    <p>Seguimiento de acciones correctivas, responsables y vencimientos contractuales.</p>
                </div>
            </header>

            <div className="dashboard-grid">
                <div className="card" style={{ gridColumn: 'span 8', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Seguimiento de Acciones</h3>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                                <input type="text" className="form-control" placeholder="Buscar acción..." style={{ paddingLeft: '2.5rem', width: '220px', borderRadius: '8px' }} />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {risks.map(risk => (
                            <div
                                key={risk.id}
                                onClick={() => setSelectedRisk(risk)}
                                className={`card table-row-hover ${selectedRisk?.id === risk.id ? 'active-risk' : ''}`}
                                style={{
                                    padding: '1.5rem',
                                    backgroundColor: 'var(--card-bg)',
                                    cursor: 'pointer',
                                    border: selectedRisk?.id === risk.id ? '2px solid var(--primary)' : '1px solid var(--card-border)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                {selectedRisk?.id === risk.id && (
                                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: 'var(--primary)' }}></div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <div style={{
                                            padding: '0.6rem',
                                            borderRadius: '10px',
                                            backgroundColor: risk.status === 'Mitigating' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                                            color: risk.status === 'Mitigating' ? 'var(--primary)' : 'var(--text-secondary)',
                                            boxShadow: risk.status === 'Mitigating' ? '0 0 15px rgba(37, 99, 235, 0.1)' : 'none'
                                        }}>
                                            <ShieldAlert size={22} />
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{risk.id}</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.2rem 0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px' }}>
                                                    {getPriorityIcon(risk.classification)}
                                                    <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--danger)' }}>CRÍTICO</span>
                                                </div>
                                            </div>
                                            <h4 style={{ fontWeight: 800, fontSize: '1.1rem', marginTop: '0.25rem', letterSpacing: '-0.01em' }}>{risk.description}</h4>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                                            color: 'var(--danger)', fontWeight: 800, fontSize: '0.8rem',
                                            padding: '0.35rem 0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.05)',
                                            borderRadius: '6px'
                                        }}>
                                            <Clock size={14} />
                                            {risk.dueDate}
                                        </div>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem', fontWeight: 600 }}>Vence en 12 días</p>
                                    </div>
                                </div>

                                <div style={{
                                    padding: '1.25rem',
                                    backgroundColor: 'var(--background)',
                                    borderRadius: '10px',
                                    border: '1px dashed var(--card-border)',
                                    marginBottom: '1.25rem',
                                    transition: 'all 0.2s'
                                }}>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.5 }}>
                                        <span style={{ color: 'var(--primary)', fontWeight: 800 }}>ACCIÓN:</span> {risk.mitigationAction}
                                    </p>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '50%',
                                            backgroundColor: 'var(--primary)', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center',
                                            color: 'white', fontWeight: 800, fontSize: '0.7rem'
                                        }}>
                                            {risk.responsible.split(' ').pop()?.[0]}
                                        </div>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{risk.responsible}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <button className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); alert('Abriendo registro de avance...'); }} style={{ fontSize: '0.8rem' }}>Registrar Avance</button>
                                        <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); alert('Confirmar cierre de riesgo...'); }} style={{ fontSize: '0.8rem' }}>Cerrar</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card" style={{ gridColumn: 'span 4', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>Métricas de Mitigación</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ padding: '1.25rem', backgroundColor: 'var(--background)', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.5rem' }}>TASA DE CIERRE</p>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                                <h4 style={{ fontSize: '2rem', fontWeight: 800 }}>68%</h4>
                                <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.4rem' }}>+12% vs mes anterior</span>
                            </div>
                            <div style={{ height: '6px', backgroundColor: 'var(--card-border)', borderRadius: '3px', marginTop: '0.75rem', overflow: 'hidden' }}>
                                <div style={{ width: '68%', height: '100%', backgroundColor: 'var(--primary)' }}></div>
                            </div>
                        </div>

                        <div style={{ padding: '1.25rem', backgroundColor: 'var(--background)', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.5rem' }}>ACCIONES VENCIDAS</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <AlertTriangle size={24} style={{ color: 'var(--danger)' }} />
                                <h4 style={{ fontSize: '2rem', fontWeight: 800 }}>04</h4>
                            </div>
                            <p style={{ fontSize: '0.7rem', color: 'var(--danger)', fontWeight: 700, marginTop: '0.5rem' }}>Requieren escalamiento inmediato</p>
                        </div>
                    </div>

                    <div style={{ marginTop: 'auto', padding: '1.25rem', backgroundColor: 'rgba(37, 99, 235, 0.05)', borderRadius: '12px', border: '1px solid rgba(37, 99, 235, 0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <MessageSquare size={16} style={{ color: 'var(--primary)' }} />
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)' }}>Sugerencia IA Robot</span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            El riesgo <strong>RSK-ACT-001</strong> ha estado en estado "Mitigando" por más de 15 días sin actualizaciones de evidencia. Se recomienda solicitar reporte de avance al líder de proyecto.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
