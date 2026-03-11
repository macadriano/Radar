"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Save, X, Info, Sparkles, Loader2, ShieldCheck, Upload, AlertCircle, CheckCircle2, Plus, Trash2, Calendar, DollarSign, FileText } from 'lucide-react'
import { simulateExtraction, projectService } from '@/lib/projectService'
import { useProjects } from '@/components/ProjectContext'
import { Project, ContractClause, Milestone, CriticalActivity } from '@/types/contractual'

export default function NuevoProyecto() {
    const router = useRouter()
    const { createProject } = useProjects()
    const [files, setFiles] = useState<File[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const [currentStep, setCurrentStep] = useState(1) // 1: Carga, 2: Datos, 3: Estructura

    const [formData, setFormData] = useState({
        nombre: '',
        idContrato: '',
        cliente: '',
        monto: '',
        currency: 'USD',
        fechaInicio: '',
        fechaFin: '',
        alcance: '',
        tipo: 'Gas',
        liderId: ''
    })

    const [hitos, setHitos] = useState<Partial<Milestone>[]>([])
    const [obligaciones, setObligaciones] = useState<Partial<ContractClause>[]>([])
    const [actividades, setActividades] = useState<Partial<CriticalActivity>[]>([])
    const [users, setUsers] = useState<any[]>([])

    // Load available leaders
    useEffect(() => {
        const { userService } = require('@/lib/userService');
        const { useAuth } = require('@/components/AuthContext');

        userService.getAllUsers().then((allUsers: any[]) => {
            const potentialLeaders = allUsers.filter(u =>
                u.status === 'ACTIVE' &&
                (u.role === 'LIDER_PROYECTO' || u.role === 'ADMIN' || u.role === 'SUPERADMIN')
            );
            setUsers(potentialLeaders);

            // Default to current user if they are a leader
            try {
                // Safely access auth
                const { profile } = (require('@/components/AuthContext').useAuth());
                const currentIsLead = potentialLeaders.find(u => u.uid === profile?.uid);
                if (currentIsLead) {
                    setFormData(prev => ({ ...prev, liderId: currentIsLead.uid }));
                }
            } catch (e) {
                console.warn("Auth info not available for default leader assignment");
            }
        });
    }, []);

    const [isExtracting, setIsExtracting] = useState(false)

    // Helper para formatear números con coma de miles y punto decimal (Perú)
    const formatPEN = (val: string) => {
        const num = parseFloat(val.replace(/,/g, ''))
        if (isNaN(num)) return val
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const uploadedFiles = Array.from(e.target.files)
            setFiles(uploadedFiles)

            setIsExtracting(true)
            try {
                const extraction = await simulateExtraction(uploadedFiles[0].name)
                setFormData(prev => ({
                    ...prev,
                    nombre: extraction.name || prev.nombre,
                    cliente: extraction.clientName || prev.cliente,
                    monto: extraction.amount?.toString() || prev.monto,
                    currency: extraction.currency || prev.currency,
                    fechaInicio: extraction.startDate || prev.fechaInicio,
                    fechaFin: extraction.endDate || prev.fechaFin,
                    idContrato: extraction.contractId || prev.idContrato
                }))

                // Prellener hitos sugeridos
                setHitos([
                    { name: 'Entrega de Ingeniería Básica', dueDate: extraction.startDate, isCriticalPath: true },
                    { name: 'Hito de Facturación 1', dueDate: extraction.endDate, isCriticalPath: false }
                ])
            } catch (error) {
                console.error("Extraction failed", error)
            } finally {
                setIsExtracting(false)
                setCurrentStep(2) // Pasar a revisión de datos
            }
        }
    }

    const addHito = () => setHitos([...hitos, { name: '', dueDate: '', isCriticalPath: false }])
    const addObligacion = () => setObligaciones([...obligaciones, { title: '', type: 'Obligation', penaltyExposure: 0 }])
    const addActividad = () => setActividades([...actividades, { name: '', plannedStart: '', plannedEnd: '', percentComplete: 0 }])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsUploading(true)

        try {
            const projectData: Omit<Project, 'id'> = {
                name: formData.nombre,
                contractId: formData.idContrato,
                clientName: formData.cliente,
                amount: parseFloat(formData.monto.replace(/,/g, '')),
                currency: formData.currency,
                startDate: formData.fechaInicio,
                estimatedEndDate: formData.fechaFin,
                status: 'EN_PLANIFICACION',
                type: formData.tipo,
                scopeDescription: formData.alcance,
                leaderUid: formData.liderId,
                team: [],
                config: {
                    weightTimeline: 0.5,
                    weightCost: 0.5,
                    clauseTypeWeights: {
                        'Penalty': 1.5,
                        'Critical Milestone': 1.2,
                        'Obligation': 0.8,
                        'General': 1.0
                    }
                }
            }

            const projectId = await createProject(projectData)

            // 4. Assign Leader (Bidirectional Sync)
            const { projectService } = require('@/lib/projectService');
            if (formData.liderId) {
                await projectService.assignLeader(projectId, formData.liderId);
            }

            // 5. Upload base documents if any
            if (files.length > 0) {
                const { documentProcessingService } = require('@/lib/documentProcessingService');
                const { useAuth } = require('@/components/AuthContext');
                let author = 'System';
                try {
                    const auth = useAuth();
                    author = auth.profile?.displayName || auth.profile?.email || 'Admin';
                } catch (e) { }

                for (const file of files) {
                    await documentProcessingService.uploadAndProcessDocument(projectId, file, author, false);
                }
            }

            setIsUploading(false)
            router.push('/proyectos')
        } catch (error) {
            console.error("Save failed", error)
            setIsUploading(false)
        }
    }

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <header className="header">
                <div className="header-title">
                    <h1>Apertura de Proyecto Contractual</h1>
                    <p>Perfil: Líder de Proyecto | Inicie el monitoreo cargando la base documental técnica y legal.</p>
                </div>
            </header>

            <div className="dashboard-grid">
                <div className="card" style={{ gridColumn: 'span 7' }}>
                    <form id="project-form" onSubmit={handleSubmit}>
                        {currentStep === 2 && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        Nombre del Proyecto
                                        {formData.nombre && <Sparkles size={14} style={{ color: 'var(--primary)' }} />}
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Ej. Expansión Red Lima"
                                        required
                                        value={formData.nombre}
                                        onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>ID de Contrato / Referencia</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="TGI-2026-001"
                                        required
                                        value={formData.idContrato}
                                        onChange={e => setFormData({ ...formData, idContrato: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        Cliente
                                        {formData.cliente && <Sparkles size={14} style={{ color: 'var(--primary)' }} />}
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Nombre del cliente"
                                        required
                                        value={formData.cliente}
                                        onChange={e => setFormData({ ...formData, cliente: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        Monto del Contrato ({formData.currency})
                                        <Sparkles size={14} style={{ color: 'var(--primary)' }} />
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="0.00"
                                        required
                                        value={formData.monto}
                                        onChange={e => setFormData({ ...formData, monto: e.target.value })}
                                        onBlur={() => setFormData(prev => ({ ...prev, monto: formatPEN(prev.monto) }))}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Líder del Proyecto</label>
                                    <select
                                        className="form-control"
                                        required
                                        value={formData.liderId}
                                        onChange={e => setFormData({ ...formData, liderId: e.target.value })}
                                    >
                                        <option value="">Seleccione un líder...</option>
                                        {users.map(u => (
                                            <option key={u.uid} value={u.uid}>{u.displayName || u.email}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Fecha Inicio</label>
                                    <input type="date" className="form-control" required value={formData.fechaInicio} onChange={e => setFormData({ ...formData, fechaInicio: e.target.value })} />
                                </div>

                                <div className="form-group">
                                    <label>Fecha Fin (Estimada)</label>
                                    <input type="date" className="form-control" required value={formData.fechaFin} onChange={e => setFormData({ ...formData, fechaFin: e.target.value })} />
                                </div>

                                <div style={{ gridColumn: 'span 2', marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button type="button" className="btn btn-primary" onClick={() => setCurrentStep(3)}>
                                        Siguiente: Estructura Contractual
                                    </button>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Hitos Técnicos</h3>
                                        <button type="button" onClick={addHito} className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}><Plus size={14} /> Agregar Hito</button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {hitos.map((h, i) => (
                                            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px auto', gap: '0.5rem', alignItems: 'center' }}>
                                                <input type="text" className="form-control" placeholder="Nombre del hito" value={h.name} onChange={e => {
                                                    const nh = [...hitos]; nh[i].name = e.target.value; setHitos(nh);
                                                }} />
                                                <input type="date" className="form-control" value={h.dueDate} onChange={e => {
                                                    const nh = [...hitos]; nh[i].dueDate = e.target.value; setHitos(nh);
                                                }} />
                                                <label style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <input type="checkbox" checked={h.isCriticalPath} onChange={e => {
                                                        const nh = [...hitos]; nh[i].isCriticalPath = e.target.checked; setHitos(nh);
                                                    }} /> Ruta Crítica
                                                </label>
                                                <button type="button" onClick={() => setHitos(hitos.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: 'var(--danger)' }}><Trash2 size={16} /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Obligaciones y Penalidades</h3>
                                        <button type="button" onClick={addObligacion} className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}><Plus size={14} /> Agregar Cláusula</button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {obligaciones.map((o, i) => (
                                            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px auto', gap: '0.5rem', alignItems: 'center' }}>
                                                <input type="text" className="form-control" placeholder="Título de cláusula" value={o.title} onChange={e => {
                                                    const no = [...obligaciones]; no[i].title = e.target.value; setObligaciones(no);
                                                }} />
                                                <select className="form-control" value={o.type} onChange={e => {
                                                    const no = [...obligaciones]; no[i].type = e.target.value as any; setObligaciones(no);
                                                }}>
                                                    <option value="Obligation">Obligación</option>
                                                    <option value="Penalty">Penalidad</option>
                                                </select>
                                                <input type="number" className="form-control" placeholder="Exposición ($)" value={o.penaltyExposure} onChange={e => {
                                                    const no = [...obligaciones]; no[i].penaltyExposure = parseFloat(e.target.value); setObligaciones(no);
                                                }} />
                                                <button type="button" onClick={() => setObligaciones(obligaciones.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: 'var(--danger)' }}><Trash2 size={16} /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                    <button type="button" className="btn btn-secondary" onClick={() => setCurrentStep(2)}>Atrás</button>
                                    <button type="submit" className="btn btn-primary" disabled={isUploading}>
                                        {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Finalizar y Guardar
                                    </button>
                                </div>
                            </div>
                        )}

                        {currentStep === 1 && (
                            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                                <Upload size={48} style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }} />
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Inicie el Asistente de Contrato</h2>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Cargue el documento contractual para extraer datos automáticamente.</p>
                                <input
                                    type="file"
                                    id="main-upload"
                                    style={{ display: 'none' }}
                                    onChange={handleFileChange}
                                />
                                <label htmlFor="main-upload" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem', cursor: 'pointer' }}>
                                    {isExtracting ? <Loader2 className="animate-spin" /> : <FileText size={20} />}
                                    {isExtracting ? 'Analizando documento...' : 'Subir Contrato / Alcance'}
                                </label>
                            </div>
                        )}
                    </form>
                </div>

                <div className="card" style={{ gridColumn: 'span 5', border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="section-title">
                        <span>Carga de Documentación Base</span>
                        <Info size={16} className="text-primary" />
                    </div>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Cargue Contratos (PDF), Cronogramas (Excel), Alcances (Word), Actas o Informes Mensuales.
                    </p>

                    <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius)', border: '1px dashed var(--border)' }}>
                        <Upload size={32} style={{ marginBottom: '1rem', color: 'var(--text-muted)' }} />
                        <input
                            type="file"
                            multiple
                            accept=".pdf,.xlsx,.xls,.doc,.docx"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                            id="file-upload"
                        />
                        <label htmlFor="file-upload" className="btn btn-secondary" style={{ display: 'inline-block', cursor: 'pointer' }}>
                            Seleccionar Archivos
                        </label>
                        {files.length > 0 && (
                            <div style={{ marginTop: '1rem', textAlign: 'left' }}>
                                <p style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Archivos seleccionados:</p>
                                {files.map((file, i) => (
                                    <div key={i} style={{ fontSize: '0.75rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Save size={12} /> {file.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: 'auto' }}>
                        <button
                            form="project-form"
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            disabled={isUploading}
                        >
                            {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            {isUploading ? 'Analizando Documentos...' : 'Crear Proyecto e Iniciar IA'}
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '2.5rem', padding: '1.5rem', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow)' }}>
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldCheck size={28} style={{ color: 'var(--primary)' }} />
                    </div>
                    <div>
                        <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700 }}>Flujo de Auditoría TGI</h4>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            Como Líder de Proyecto, usted es responsable de la veracidad de los documentos. El sistema generará una memoria de cálculo defendible ante auditorías basándose en los hallazgos extraídos.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}


