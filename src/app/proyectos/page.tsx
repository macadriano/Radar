"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    FolderOpen,
    Search,
    Plus,
    Filter,
    MoreVertical,
    ChevronRight,
    User,
    Calendar,
} from 'lucide-react'
import { useProjects } from '@/components/ProjectContext'
import { useAuth } from '@/components/AuthContext'
import { Project } from '@/types/contractual'

export default function Proyectos() {
    const [searchTerm, setSearchTerm] = useState('')
    const { projects, isLoading } = useProjects()
    const { profile } = useAuth()
    const [users, setUsers] = useState<any[]>([])

    const canCreateProjects = profile?.role === 'SUPERADMIN' || profile?.role === 'ADMIN' || profile?.role === 'CONTROL_PROYECTOS'

    useEffect(() => {
        const { userService } = require('@/lib/userService');
        userService.getAllUsers().then(setUsers);
    }, []);

    const getLeaderName = (project: Project) => {
        if (project.leaderName) return project.leaderName;
        if (!project.leaderUid) return 'Sin asignar';
        const user = users.find(u => u.uid === project.leaderUid);
        return user ? user.displayName : 'Sin asignar';
    }

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (isLoading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando proyectos...</div>
    }

    return (
        <div className="proyectos-page">
            <header className="header">
                <div className="header-title">
                    <h1>Listado de Proyectos Estratégicos</h1>
                    <p>Gestión centralizada de contratos y líderes de proyecto asignados.</p>
                </div>
                {canCreateProjects && (
                    <Link href="/proyectos/nuevo" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={18} />
                        Nuevo Proyecto
                    </Link>
                )}
            </header>

            <div className="dashboard-grid">
                <div className="card" style={{ gridColumn: 'span 12' }}>
                    <div className="section-title">
                        <span>{profile?.role === 'LIDER_PROYECTO' ? 'Mis Proyectos Asignados' : 'Todos los Proyectos'}</span>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Buscar por nombre o cliente..."
                                    style={{ paddingLeft: '2.25rem', width: '300px' }}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Proyecto</th>
                                    <th>Líder de Proyecto</th>
                                    <th>Cliente</th>
                                    <th>Fecha Inicio</th>
                                    <th>Salud (Score)</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProjects.map(project => (
                                    <tr
                                        key={project.id}
                                        onClick={() => window.location.href = `/proyectos/${project.id}`}
                                        style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                                        className="table-row-hover"
                                    >
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '4px', backgroundColor: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                                    <FolderOpen size={18} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{project.name}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ID: {project.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>
                                                <User size={14} style={{ color: project.leaderUid ? 'var(--primary)' : 'var(--text-muted)' }} />
                                                {getLeaderName(project)}
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '0.85rem' }}>{project.clientName}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                <Calendar size={14} />
                                                {project.startDate}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--card-border)', borderRadius: '3px', overflow: 'hidden', minWidth: '60px' }}>
                                                    <div style={{ width: `85%`, height: '100%', backgroundColor: 'var(--success)' }}></div>
                                                </div>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>85</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge" style={{
                                                backgroundColor: project.status === 'EN_EJECUCION' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                color: project.status === 'EN_EJECUCION' ? 'var(--success)' : 'var(--warning)',
                                                fontWeight: 800,
                                                fontSize: '0.7rem'
                                            }}>
                                                {project.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <ChevronRight size={18} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredProjects.length === 0 && (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                            No se encontraron proyectos correspondientes a su búsqueda o rol.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
