"use client"

import { useState, useEffect, useMemo } from 'react'
import {
    FileText,
    Upload,
    Search,
    Download,
    Eye,
    Filter,
    CheckCircle2,
    AlertCircle,
    Loader2,
    X,
    Activity,
    ShieldCheck,
    FileSearch,
    ArrowUpRight,
    ChevronDown,
    Folder,
    ExternalLink,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useProjects } from '@/components/ProjectContext'
import { useAuth } from '@/components/AuthContext'
import { documentService } from '@/lib/documentService'
import { documentProcessingService } from '@/lib/documentProcessingService'
import { DocumentType } from '@/types/contractual'

export default function GestionDocumental() {
    const router = useRouter()
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [selectedDoc, setSelectedDoc] = useState<any>(null)
    const { projects } = useProjects()
    const { profile } = useAuth()
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedProjectId, setSelectedProjectId] = useState('')
    const [selectedType, setSelectedType] = useState<DocumentType | ''>('')
    const [realDocs, setRealDocs] = useState<any[]>([])

    const isAdmin = profile?.role === 'SUPERADMIN' || profile?.role === 'ADMIN' || profile?.role === 'CONTROL_PROYECTOS'

    const allowedTypes = isAdmin
        ? [
            { id: 'Contract', label: 'Contrato Principal' },
            { id: 'Scope', label: 'Alcance de Trabajo' },
            { id: 'Schedule', label: 'Cronograma Baseline' }
        ]
        : [
            { id: 'Minute', label: 'Acta de Reunión' },
            { id: 'Weekly Report', label: 'Informe Semanal' },
            { id: 'Monthly Report', label: 'Informe Mensual' }
        ]

    // Subscription to documents
    useEffect(() => {
        const unsub = documentService.subscribeToAllDocuments((docs: any[]) => {
            // Filter documents based on role if not admin
            if (!isAdmin && profile?.assignedProjectIds) {
                const filtered = docs.filter(d => profile.assignedProjectIds?.includes(d.projectId));
                setRealDocs(filtered);
            } else {
                setRealDocs(docs);
            }
        });
        return () => unsub();
    }, [isAdmin, profile]);

    const filteredDocs = useMemo(() => {
        return realDocs.filter(d => {
            const matchesSearch = d.name?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesProject = !selectedProjectId || d.projectId === selectedProjectId;
            return matchesSearch && matchesProject;
        });
    }, [realDocs, searchTerm, selectedProjectId]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !profile) return;

        if (!selectedProjectId || !selectedType) {
            alert('Por favor, seleccione un proyecto y el tipo de documento antes de cargar.');
            return;
        }

        setIsAnalyzing(true);
        try {
            await documentProcessingService.uploadAndProcessDocument(
                selectedProjectId,
                file,
                profile.displayName || profile.email,
                false, // explicit no AI on manual for deterministic audit
                selectedType as DocumentType
            );
            alert('Documento cargado correctamente. El análisis determinista ha sido programado.');
        } catch (error: any) {
            alert('Error en la carga: ' + error.message);
        } finally {
            setIsAnalyzing(false);
            if (e.target) e.target.value = '';
        }
    };

    return (
        <div className="gestion-documental">
            <header className="header" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div className="header-title">
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.04em' }}>Repositorio de Evidencia</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Trazabilidad centralizada para auditoría y gestión de riesgos contractuales.</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', backgroundColor: 'var(--card-bg)', padding: '1rem', borderRadius: '16px', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-md)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>1. Proyecto</label>
                        <select
                            className="form-control"
                            style={{ width: '200px', fontSize: '0.85rem', fontWeight: 600 }}
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                        >
                            <option value="">Seleccionar proyecto...</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>2. Clasificación</label>
                        <select
                            className="form-control"
                            style={{ width: '180px', fontSize: '0.85rem', fontWeight: 600 }}
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value as DocumentType)}
                        >
                            <option value="">Tipo de evidencia...</option>
                            {allowedTypes.map(t => (
                                <option key={t.id} value={t.id}>{t.label}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <input
                            type="file"
                            id="global-doc-upload"
                            style={{ display: 'none' }}
                            onChange={handleFileUpload}
                            accept=".pdf,.doc,.docx,.xlsx,.xls"
                        />
                        <button
                            className="btn btn-primary"
                            onClick={() => document.getElementById('global-doc-upload')?.click()}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', height: '42px', padding: '0 1.5rem', borderRadius: '10px' }}
                            disabled={isAnalyzing || !selectedProjectId || !selectedType}
                        >
                            {isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                            <strong>{isAnalyzing ? 'PROCESANDO...' : 'CARGAR ARCHIVO'}</strong>
                        </button>
                    </div>
                </div>
            </header>

            <div className="dashboard-grid">
                <div className="card" style={{ gridColumn: selectedDoc ? 'span 8' : 'span 12', padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ padding: '0.5rem', backgroundColor: 'rgba(37, 99, 235, 0.1)', borderRadius: '8px', color: 'var(--primary)' }}>
                                <Folder size={20} />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Biblioteca de Documentos</h3>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Buscar en biblioteca..."
                                style={{ paddingLeft: '2.75rem', width: '320px', borderRadius: '12px' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Documento / Nombre</th>
                                    <th>Proyecto Relacionado</th>
                                    <th>Categoría</th>
                                    <th>Hallazgos</th>
                                    <th>Estado IA</th>
                                    <th style={{ textAlign: 'right' }}>Vínculo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDocs.map(doc => {
                                    const proj = projects.find(p => p.id === doc.projectId);
                                    return (
                                        <tr
                                            key={doc.id}
                                            onClick={() => setSelectedDoc(doc)}
                                            style={{
                                                cursor: 'pointer',
                                                backgroundColor: selectedDoc?.id === doc.id ? 'rgba(37, 99, 235, 0.04)' : 'transparent'
                                            }}
                                            className="table-row-hover"
                                        >
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', border: '1px solid var(--card-border)' }}>
                                                        <FileText size={22} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{doc.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>ID: {doc.id.slice(0, 8)}...</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{proj?.name || 'ID: ' + doc.projectId}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{proj?.clientName || 'N/A'}</div>
                                            </td>
                                            <td>
                                                <span className={`badge ${doc.type === 'Contract' ? 'badge-high' : 'badge-low'}`} style={{ fontSize: '0.65rem', fontWeight: 900 }}>
                                                    {doc.type?.toUpperCase()}
                                                </span>
                                            </td>
                                            <td>
                                                {doc.findingsCount ? (
                                                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', fontWeight: 800 }}>
                                                        <span className="text-primary" title="Actividades">{doc.findingsCount.activities}A</span>
                                                        <span className="text-warning" title="Imprevistos">{doc.findingsCount.incidents}I</span>
                                                        <span className="text-danger" title="Riesgos">{doc.findingsCount.risks}R</span>
                                                    </div>
                                                ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontStyle: 'italic' }}>Analizando...</span>}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: doc.status === 'READY' ? 'var(--success)' : 'var(--warning)', fontWeight: 800, fontSize: '0.75rem' }}>
                                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: doc.status === 'READY' ? 'var(--success)' : 'var(--warning)' }}></div>
                                                    {doc.status}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn-icon" onClick={(e) => e.stopPropagation()}>
                                                    <Download size={18} />
                                                </a>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredDocs.length === 0 && (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                                            <FileSearch size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                                            <p style={{ fontWeight: 600 }}>No se encontraron documentos.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {selectedDoc && (
                    <div className="card animate-fade-in" style={{ gridColumn: 'span 4', padding: '2rem', borderLeft: '4px solid var(--primary)', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: 'var(--shadow-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: '0.25rem' }}>Hallazgos Radar</h3>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Resumen interactivo de la evidencia</p>
                            </div>
                            <button onClick={() => setSelectedDoc(null)} className="btn-icon"><X size={20} /></button>
                        </div>

                        <div style={{ padding: '1.25rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--card-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ textAlign: 'center', flex: 1 }}>
                                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--primary)' }}>{selectedDoc.findingsCount?.activities || 0}</div>
                                    <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Actividades</div>
                                </div>
                                <div style={{ width: '1px', backgroundColor: 'var(--card-border)' }}></div>
                                <div style={{ textAlign: 'center', flex: 1 }}>
                                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--warning)' }}>{selectedDoc.findingsCount?.incidents || 0}</div>
                                    <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Imprevistos</div>
                                </div>
                                <div style={{ width: '1px', backgroundColor: 'var(--card-border)' }}></div>
                                <div style={{ textAlign: 'center', flex: 1 }}>
                                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--danger)' }}>{selectedDoc.findingsCount?.risks || 0}</div>
                                    <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Riesgos</div>
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'block' }}>AUDITORÍA DE ORIGEN</label>
                            <div style={{ padding: '1rem', backgroundColor: 'var(--background)', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Cargado por:</p>
                                <p style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.5rem' }}>{selectedDoc.uploadedBy || 'Sistema Radar'}</p>
                                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Fecha / Hora:</p>
                                <p style={{ fontSize: '0.9rem', fontWeight: 800 }}>{new Date(selectedDoc.uploadDate).toLocaleString()}</p>
                            </div>
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{ marginTop: 'auto', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
                            onClick={() => router.push(`/proyectos/${selectedDoc.projectId}?tab=riesgos`)}
                        >
                            <ExternalLink size={18} />
                            <strong>EXPLORAR RIESGOS EN PROYECTO</strong>
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
