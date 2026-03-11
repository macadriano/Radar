"use client"

import { useMemo, useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    ChevronLeft,
    Download,
    Calendar,
    User,
    ShieldCheck,
    FileText,
    Search,
    Clock,
    DollarSign,
    Briefcase,
    Activity,
    ExternalLink,
    Plus,
    Loader2,
    X,
    Trash2,
    UserPlus,
    UserCircle,
    Shield
} from 'lucide-react'
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { useAuth } from '@/components/AuthContext';
import { projectService } from '@/lib/projectService';
import { userService } from '@/lib/userService';
import { documentService } from '@/lib/documentService';
import { documentProcessingService } from '@/lib/documentProcessingService';
import {
    Project,
    TeamMember,
    Risk,
    Document,
    DocumentType,
    TeamMemberRole,
    UserProfile,
    Priority
} from '@/types/contractual';
import { requireDb } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function DetalleProyecto() {
    const { id } = useParams()
    const router = useRouter()
    const { profile } = useAuth()

    const [activeTab, setActiveTab] = useState('resumen')
    const [project, setProject] = useState<Project | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // DATA STATES
    const [realRisks, setRealRisks] = useState<Risk[]>([])
    const [realDocuments, setRealDocuments] = useState<Document[]>([])

    // MODALS / UI STATES
    const [isUploading, setIsUploading] = useState(false)
    const [uploadModalOpen, setUploadModalOpen] = useState(false)
    const [selectedFileType, setSelectedFileType] = useState<DocumentType>('Minute')

    const [teamModalOpen, setTeamModalOpen] = useState(false)
    const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([])
    const [selectedUserUid, setSelectedUserUid] = useState('')
    const [selectedMemberRole, setSelectedMemberRole] = useState<TeamMemberRole>('VISOR')
    const [isAddingMember, setIsAddingMember] = useState(false)

    const isAdmin = profile?.role === 'SUPERADMIN' || profile?.role === 'ADMIN' || profile?.role === 'CONTROL_PROYECTOS';
    const isProjectLeader = profile?.uid === project?.leaderUid;
    const canManageTeam = isAdmin || isProjectLeader;

    useEffect(() => {
        if (!id || typeof id !== 'string') return;
        const db = requireDb();

        // Subscribe to Project
        const unsubProject = onSnapshot(query(collection(db, 'projects'), where('__name__', '==', id)), (snapshot) => {
            if (!snapshot.empty) {
                const data = snapshot.docs[0].data();
                setProject({ id, ...data } as Project);
            }
            setIsLoading(false);
        });

        // Subscribe to Documents (Standardized)
        const unsubDocs = documentService.subscribeToProjectDocuments(id, (docs) => {
            setRealDocuments(docs);
        });

        // Subscribe to Risks
        const unsubRisks = onSnapshot(query(collection(db, 'risks'), where('projectId', '==', id)), (snapshot) => {
            const rks = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Risk));
            setRealRisks(rks);
        });

        return () => {
            unsubProject();
            unsubDocs();
            unsubRisks();
        };
    }, [id]);

    // Fetch users for team modal
    useEffect(() => {
        if (teamModalOpen) {
            userService.getAllUsers().then(users => {
                setAvailableUsers(users.filter(u => u.status === 'ACTIVE'));
            });
        }
    }, [teamModalOpen]);

    const handleUploadEvidence = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !id || !profile) return;

        setIsUploading(true);
        try {
            await documentProcessingService.uploadAndProcessDocument(
                id as string,
                file,
                profile.displayName || profile.email,
                false,
                selectedFileType,
                profile.uid,
                profile.role
            );
            setUploadModalOpen(false);
            // El documento aparecerá instantáneamente gracias al "register-first"
        } catch (error: any) {
            alert("Error al cargar: " + error.message);
        } finally {
            setIsUploading(false);
            if (e.target) e.target.value = '';
        }
    };

    const handleAddMember = async () => {
        if (!selectedUserUid || !id) return;
        setIsAddingMember(true);
        try {
            const user = availableUsers.find(u => u.uid === selectedUserUid);
            if (!user) return;

            const newMember: TeamMember = {
                uid: user.uid,
                roleInProject: selectedMemberRole,
                addedAt: new Date().toISOString(),
                addedByUid: profile?.uid || 'SYSTEM',
                displayName: user.displayName,
                email: user.email
            };

            await projectService.addTeamMember(id as string, newMember);
            setTeamModalOpen(false);
            setSelectedUserUid('');
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsAddingMember(false);
        }
    };

    const handleRemoveMember = async (memberUid: string) => {
        if (!window.confirm("¿Seguro que desea quitar este miembro del equipo?")) return;
        try {
            await projectService.removeTeamMember(id as string, memberUid);
        } catch (error: any) {
            alert(error.message);
        }
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
                <Loader2 className="animate-spin text-primary" size={48} />
                <p style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Sincronizando con Radar...</p>
            </div>
        );
    }

    return (
        <div className="proyecto-detalle" style={{ padding: '2rem' }}>
            {/* Header / Breadcrumbs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <button
                    onClick={() => router.push('/proyectos')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
                >
                    <ChevronLeft size={18} /> Volver a Proyectos
                </button>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        className="btn btn-primary"
                        onClick={() => setUploadModalOpen(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1.25rem', backgroundColor: 'var(--success)', border: 'none' }}
                    >
                        <Plus size={18} />
                        <strong>Cargar Evidencia</strong>
                    </button>
                    <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Download size={18} /> Reporte Ejecutivo
                    </button>
                </div>
            </div>

            {/* Title Section */}
            <div className="card" style={{ padding: '2.5rem', marginBottom: '2.5rem', borderLeft: '6px solid var(--primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <span className="badge badge-low">ID: {project?.id.slice(0, 8)}</span>
                            <span className={`badge ${project?.status === 'EN_EJECUCION' ? 'badge-high' : 'badge-low'}`}>{project?.status?.replace('_', ' ')}</span>
                        </div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>{project?.name}</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '800px' }}>{project?.scopeDescription}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Monto Contractual</p>
                        <p style={{ fontSize: '2rem', fontWeight: 900 }}>{project?.currency} {project?.amount.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div style={{ display: 'flex', gap: '2.5rem', marginBottom: '2.5rem', borderBottom: '1px solid var(--card-border)' }}>
                {['resumen', 'riesgos', 'documentos', 'equipo'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '1.25rem 0.5rem',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === tab ? '3px solid var(--primary)' : '3px solid transparent',
                            color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                            fontWeight: 800,
                            fontSize: '0.9rem',
                            textTransform: 'uppercase',
                            cursor: 'pointer'
                        }}
                    >
                        {tab === 'resumen' ? 'Dashboard' : tab}
                    </button>
                ))}
            </div>

            {/* Dashboard Content */}
            {activeTab === 'resumen' && (
                <div className="dashboard-grid animate-fade-in">
                    <div className="card kpi-card" style={{ gridColumn: 'span 4' }}>
                        <p className="kpi-label">Salud del Proyecto</p>
                        <p className="kpi-value" style={{ color: 'var(--success)' }}>Estable</p>
                    </div>
                    <div className="card kpi-card" style={{ gridColumn: 'span 4' }}>
                        <p className="kpi-label">Inventario de Riesgos</p>
                        <p className="kpi-value">{realRisks.length}</p>
                    </div>
                    <div className="card kpi-card" style={{ gridColumn: 'span 4' }}>
                        <p className="kpi-label">Evidencia Auditada</p>
                        <p className="kpi-value">{realDocuments.length}</p>
                    </div>

                    {/* Insights etc... */}
                    <div className="card" style={{ gridColumn: 'span 12', padding: '2rem', textAlign: 'center', border: '1px dashed var(--card-border)', color: 'var(--text-muted)' }}>
                        Se están analizando actividades críticas en tiempo real.
                    </div>
                </div>
            )}

            {/* Team Tab */}
            {activeTab === 'equipo' && (
                <div className="animate-fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Equipo del Proyecto</h2>
                            <p style={{ color: 'var(--text-muted)' }}>Miembros con acceso a la gestión contractual de este proyecto.</p>
                        </div>
                        {canManageTeam && (
                            <button className="btn btn-primary" onClick={() => setTeamModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <UserPlus size={18} /> Agregar Miembro
                            </button>
                        )}
                    </div>

                    <div className="dashboard-grid">
                        <div className="card" style={{ gridColumn: 'span 12', padding: '2rem' }}>
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Usuario</th>
                                            <th>Email</th>
                                            <th>Rol en Proyecto</th>
                                            <th>Fecha Adición</th>
                                            <th style={{ textAlign: 'right' }}>Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Miembro Virtual: Líder Principal */}
                                        <tr style={{ backgroundColor: 'rgba(37, 99, 235, 0.03)' }}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div className="avatar" style={{ backgroundColor: 'var(--primary)' }}><User size={20} /></div>
                                                    <div>
                                                        <p style={{ fontWeight: 800 }}>{project?.leaderName}</p>
                                                        <span className="badge badge-high" style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem' }}>LÍDER PROYECTO</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{project?.leaderEmail}</td>
                                            <td><span style={{ fontWeight: 900, color: 'var(--primary)' }}>LIDER</span></td>
                                            <td>Origen</td>
                                            <td style={{ textAlign: 'right' }}>
                                                <Shield size={16} className="text-primary" style={{ opacity: 0.5 }} />
                                            </td>
                                        </tr>
                                        {/* Otros miembros */}
                                        {project?.team?.filter(m => m.uid !== project.leaderUid).map((member) => (
                                            <tr key={member.uid} className="table-row-hover">
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                        <div className="avatar"><UserCircle size={20} /></div>
                                                        <p style={{ fontWeight: 700 }}>{member.displayName || 'Miembro'}</p>
                                                    </div>
                                                </td>
                                                <td>{member.email}</td>
                                                <td>
                                                    <span style={{ fontWeight: 700 }}>{member.roleInProject}</span>
                                                </td>
                                                <td style={{ fontSize: '0.8rem' }}>{new Date(member.addedAt).toLocaleDateString()}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    {canManageTeam && (
                                                        <button className="btn-icon text-danger" onClick={() => handleRemoveMember(member.uid)}>
                                                            <Trash2 size={18} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documentos' && (
                <div className="animate-fade-in">
                    <div className="card" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Repositorio Documental</h2>
                            <div style={{ position: 'relative' }}>
                                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input type="text" className="form-control" placeholder="Buscar evidencia..." style={{ paddingLeft: '2.5rem', width: '280px' }} />
                            </div>
                        </div>

                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Documento</th>
                                        <th>Tipo</th>
                                        <th>Fecha Registro</th>
                                        <th>Estado Análisis</th>
                                        <th>Hallazgos</th>
                                        <th style={{ textAlign: 'right' }}>Vínculo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {realDocuments.map(doc => (
                                        <tr key={doc.id} className="table-row-hover">
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <FileText size={20} className="text-primary" />
                                                    <p style={{ fontWeight: 700 }}>{doc.name}</p>
                                                </div>
                                            </td>
                                            <td><span className="badge badge-low">{doc.type}</span></td>
                                            <td style={{ fontSize: '0.85rem' }}>{new Date(doc.createdAt || doc.uploadDate).toLocaleString()}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 900, color: doc.status === 'READY' ? 'var(--success)' : 'var(--warning)' }}>
                                                    {doc.status !== 'READY' && <Loader2 size={12} className="animate-spin" />}
                                                    {doc.status}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.4rem', fontWeight: 800, fontSize: '0.7rem' }}>
                                                    <span className="text-primary">{doc.counts?.activities}A</span>
                                                    <span className="text-warning">{doc.counts?.incidents}I</span>
                                                    <span className="text-danger">{doc.counts?.risks}R</span>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                {doc.url ? (
                                                    <a href={doc.url} target="_blank" className="btn-icon"><ExternalLink size={18} /></a>
                                                ) : <Clock size={18} style={{ opacity: 0.3 }} />}
                                            </td>
                                        </tr>
                                    ))}
                                    {realDocuments.length === 0 && (
                                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No se ha cargado evidencia aún.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* MODALS */}
            {uploadModalOpen && (
                <div className="modal-overlay">
                    <div className="card modal-content" style={{ width: '450px', padding: '2.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 style={{ fontWeight: 900 }}>Cargar Evidencia</h3>
                            <button onClick={() => setUploadModalOpen(false)} className="btn-icon"><X size={20} /></button>
                        </div>
                        <div className="form-group">
                            <label>Clasificación Contractual</label>
                            <select className="form-control" value={selectedFileType} onChange={e => setSelectedFileType(e.target.value as DocumentType)}>
                                {isAdmin ? (
                                    <>
                                        <option value="Contract">Contrato Principal</option>
                                        <option value="Scope">Alcance de Trabajo</option>
                                        <option value="Schedule">Cronograma Baseline</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="Minute">Acta de Reunión</option>
                                        <option value="Weekly Report">Informe Semanal</option>
                                        <option value="Monthly Report">Informe Mensual</option>
                                    </>
                                )}
                            </select>
                        </div>
                        <div className="upload-dropzone" onClick={() => document.getElementById('file-input')?.click()} style={{ margin: '2rem 0', padding: '3rem', border: '2px dashed var(--card-border)', borderRadius: '16px', textAlign: 'center', cursor: 'pointer' }}>
                            <input type="file" id="file-input" hidden onChange={handleUploadEvidence} />
                            {isUploading ? <Loader2 size={40} className="animate-spin text-primary" style={{ margin: '0 auto' }} /> : <Plus size={40} className="text-primary" style={{ margin: '0 auto', opacity: 0.5 }} />}
                            <p style={{ fontWeight: 800, marginTop: '1rem' }}>{isUploading ? 'AUDITANDO ARCHIVO...' : 'SELECCIONAR ARCHIVO'}</p>
                        </div>
                        <button className="btn btn-secondary w-full" onClick={() => setUploadModalOpen(false)}>Cancelar</button>
                    </div>
                </div>
            )}

            {teamModalOpen && (
                <div className="modal-overlay">
                    <div className="card modal-content" style={{ width: '500px', padding: '2.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 style={{ fontWeight: 900 }}>Agregar Miembro al Equipo</h3>
                            <button onClick={() => setTeamModalOpen(false)} className="btn-icon"><X size={20} /></button>
                        </div>
                        <div className="form-group">
                            <label>Buscador de Usuarios (Activos)</label>
                            <select className="form-control" value={selectedUserUid} onChange={e => setSelectedUserUid(e.target.value)}>
                                <option value="">Seleccione usuario...</option>
                                {availableUsers.filter(u => !project?.team?.some(m => m.uid === u.uid) && u.uid !== project?.leaderUid).map(user => (
                                    <option key={user.uid} value={user.uid}>{user.displayName} ({user.email})</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group" style={{ marginTop: '1.5rem' }}>
                            <label>Rol en este Proyecto</label>
                            <select className="form-control" value={selectedMemberRole} onChange={e => setSelectedMemberRole(e.target.value as TeamMemberRole)}>
                                <option value="COORDINADOR">Coordinador</option>
                                <option value="ASISTENTE">Asistente</option>
                                <option value="VISOR">Visor (Solo lectura)</option>
                            </select>
                        </div>
                        <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setTeamModalOpen(false)}>Cancelar</button>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAddMember} disabled={!selectedUserUid || isAddingMember}>
                                {isAddingMember ? <Loader2 className="animate-spin" size={18} /> : 'Agregar al Equipo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
