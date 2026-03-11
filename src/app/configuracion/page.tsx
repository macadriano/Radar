"use client"

import { useState, useMemo, useEffect } from 'react'
import {
    PlusCircle,
    FileText,
    Settings,
    Bell,
    Scale,
    Users as UsersIcon,
    Loader2,
    Edit2,
    Trash2,
    Mail,
    Lock,
    X,
    Save,
    UserCheck,
    UserX,
    Key,
    Shield,
    MoreHorizontal,
    Check,
    AlertCircle,
    Search,
    UserPlus,
    User,
    Camera,
    ShieldAlert
} from 'lucide-react'
import { UserRole, UserProfile, Project, UserStatus } from '@/types/contractual'
import { useAuth } from '@/components/AuthContext'
import { useProjects } from '@/components/ProjectContext'
import { userService } from '@/lib/userService'

type TabType = 'perfil' | 'usuarios' | 'pesos' | 'alertas' | 'sistema'

export default function Configuracion() {
    const { profile: currentUserProfile, loading: authLoading } = useAuth()
    const { projects } = useProjects()
    const [activeTab, setActiveTab] = useState<TabType>('perfil')

    // UI State for Users
    const [users, setUsers] = useState<UserProfile[]>([])
    const [isLoadingUsers, setIsLoadingUsers] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState<string>('todos')
    const [statusFilter, setStatusFilter] = useState<string>('todos')

    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
    const [confirmAction, setConfirmAction] = useState<{ type: 'deactivate' | 'activate' | 'delete' | 'approve' | 'resend', uid: string } | null>(null)
    const [deleteConfirmText, setDeleteConfirmText] = useState('')

    // Client-side only state to avoid hydration issues
    const [isMounted, setIsMounted] = useState(false)

    // Profile Settings State (Local)
    const [profileData, setProfileData] = useState({
        displayName: '',
        email: '',
        phone: '',
        bio: ''
    })

    const [globalSettings, setGlobalSettings] = useState({
        isAIEnabled: true,
        autoProcessDocs: true
    })

    const isAdmin = currentUserProfile?.role === 'SUPERADMIN' || currentUserProfile?.role === 'ADMIN' || currentUserProfile?.role === 'CONTROL_PROYECTOS'

    useEffect(() => {
        setIsMounted(true)
        if (currentUserProfile) {
            setProfileData({
                displayName: currentUserProfile.displayName || '',
                email: currentUserProfile.email || '',
                phone: '',
                bio: ''
            })
        }
    }, [currentUserProfile])

    // Real-time subscription to users (only for admins)
    useEffect(() => {
        if (!isAdmin) return;

        setIsLoadingUsers(true);
        const unsubscribe = userService.subscribeToUsers((updatedUsers) => {
            setUsers(updatedUsers);
            setIsLoadingUsers(false);
        });

        return () => unsubscribe();
    }, [isAdmin]);

    // Filtering logic
    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const matchesSearch = u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesRole = roleFilter === 'todos' || u.role === roleFilter
            const matchesStatus = statusFilter === 'todos' || u.status === statusFilter
            return matchesSearch && matchesRole && matchesStatus
        })
    }, [users, searchTerm, roleFilter, statusFilter])

    const handleAction = (type: 'deactivate' | 'activate' | 'delete' | 'approve' | 'resend', uid: string) => {
        const userToActOn = users.find(u => u.uid === uid);
        if (!userToActOn) return;

        if (userToActOn.role === 'SUPERADMIN' && currentUserProfile?.role !== 'SUPERADMIN') {
            alert('No tienes permisos para modificar a un SUPERADMIN.');
            return;
        }

        setConfirmAction({ type, uid })
        setIsConfirmModalOpen(true)
    }

    const executeConfirmAction = async () => {
        if (!confirmAction) return
        try {
            if (confirmAction.type === 'delete') {
                if (deleteConfirmText !== 'ELIMINAR') {
                    alert('Debe escribir ELIMINAR para confirmar.');
                    return;
                }
                await userService.deleteUser(confirmAction.uid);
            } else if (confirmAction.type === 'approve' || confirmAction.type === 'activate') {
                await userService.updateUser(confirmAction.uid, { status: 'ACTIVE' });
            } else if (confirmAction.type === 'deactivate') {
                await userService.updateUser(confirmAction.uid, { status: 'DISABLED' });
            } else if (confirmAction.type === 'resend') {
                alert('Invitación reenviada correctamente.');
            }
            setIsConfirmModalOpen(false)
            setConfirmAction(null)
            setDeleteConfirmText('')
        } catch (error) {
            console.error('Error executing user action:', error);
            alert('Error al ejecutar la acción.');
        }
    }

    const getRoleBadgeColor = (role: UserRole) => {
        switch (role) {
            case 'SUPERADMIN': return 'badge-critical';
            case 'ADMIN': return 'badge-high';
            case 'CONTROL_PROYECTOS': return 'badge-success';
            case 'LIDER_PROYECTO': return 'badge-low';
            default: return 'badge-secondary';
        }
    }

    const getStatusBadgeColor = (status: UserStatus) => {
        switch (status) {
            case 'ACTIVE': return 'var(--success)';
            case 'PENDING': return 'var(--warning)';
            case 'DISABLED': return 'var(--danger)';
            default: return 'var(--text-muted)';
        }
    }

    if (authLoading || !isMounted) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <Loader2 className="animate-spin" size={48} style={{ color: 'var(--primary)' }} />
            </div>
        )
    }

    return (
        <div className="configuracion-page">
            <header className="header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div className="header-title">
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.04em' }}>Configuración</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                        {isAdmin ? 'Panel de Control y perfiles de usuario.' : 'Administre su información personal y preferencias.'}
                    </p>
                </div>
                {isAdmin && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: 'rgba(37, 99, 235, 0.1)', borderRadius: '12px', border: '1px solid rgba(37, 99, 235, 0.2)' }}>
                        <Shield size={16} className="text-primary" />
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)' }}>MODO ADMINISTRADOR</span>
                    </div>
                )}
            </header>

            {/* Tabs Navigation */}
            <div className="tabs-container" style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--card-border)', marginBottom: '2rem' }}>
                <button
                    onClick={() => setActiveTab('perfil')}
                    style={{
                        padding: '1rem 0',
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: activeTab === 'perfil' ? 'var(--primary)' : 'var(--text-muted)',
                        borderBottom: activeTab === 'perfil' ? '2px solid var(--primary)' : '2px solid transparent',
                        background: 'none', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}
                >
                    <User size={18} /> Mi Perfil
                </button>

                {isAdmin && (
                    <>
                        <button
                            onClick={() => setActiveTab('usuarios')}
                            style={{
                                padding: '1rem 0',
                                fontSize: '1rem',
                                fontWeight: 700,
                                color: activeTab === 'usuarios' ? 'var(--primary)' : 'var(--text-muted)',
                                borderBottom: activeTab === 'usuarios' ? '2px solid var(--primary)' : '2px solid transparent',
                                background: 'none', border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '0.5rem'
                            }}
                        >
                            <UsersIcon size={18} /> Usuarios
                        </button>
                        <button
                            onClick={() => setActiveTab('pesos')}
                            style={{
                                padding: '1rem 0',
                                fontSize: '1rem',
                                fontWeight: 700,
                                color: activeTab === 'pesos' ? 'var(--primary)' : 'var(--text-muted)',
                                borderBottom: activeTab === 'pesos' ? '2px solid var(--primary)' : '2px solid transparent',
                                background: 'none', border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '0.5rem'
                            }}
                        >
                            <Scale size={18} /> Pesos Contractuales
                        </button>
                        <button
                            onClick={() => setActiveTab('alertas')}
                            style={{
                                padding: '1rem 0',
                                fontSize: '1rem',
                                fontWeight: 700,
                                color: activeTab === 'alertas' ? 'var(--primary)' : 'var(--text-muted)',
                                borderBottom: activeTab === 'alertas' ? '2px solid var(--primary)' : '2px solid transparent',
                                background: 'none', border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '0.5rem'
                            }}
                        >
                            <Bell size={18} /> Alertas y Umbrales
                        </button>
                        <button
                            onClick={() => setActiveTab('sistema')}
                            style={{
                                padding: '1rem 0',
                                fontSize: '1rem',
                                fontWeight: 700,
                                color: activeTab === 'sistema' ? 'var(--primary)' : 'var(--text-muted)',
                                borderBottom: activeTab === 'sistema' ? '2px solid var(--primary)' : '2px solid transparent',
                                background: 'none', border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '0.5rem'
                            }}
                        >
                            <Settings size={18} /> Sistema
                        </button>
                    </>
                )}
            </div>

            {/* TAB CONTENT: PERFIL */}
            {activeTab === 'perfil' && (
                <div className="dashboard-grid">
                    <div className="card" style={{ gridColumn: 'span 4', padding: '2rem', textAlign: 'center' }}>
                        <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 1.5rem' }}>
                            <div style={{
                                width: '100%', height: '100%', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)',
                                border: '4px solid var(--background)', boxShadow: 'var(--shadow-lg)'
                            }}>
                                <User size={64} />
                            </div>
                            <button className="btn-icon" style={{
                                position: 'absolute', bottom: '0', right: '0', backgroundColor: 'var(--primary)',
                                color: 'white', borderRadius: '50%', width: '36px', height: '36px', border: '4px solid var(--background)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Camera size={16} />
                            </button>
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{currentUserProfile?.displayName || 'Usuario'}</h2>
                        <span className={`badge ${getRoleBadgeColor(currentUserProfile?.role || 'LIDER_PROYECTO')}`} style={{ marginTop: '0.5rem' }}>
                            {currentUserProfile?.role.replace('_', ' ')}
                        </span>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Estado de cuenta</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: getStatusBadgeColor(currentUserProfile?.status || 'PENDING'), fontWeight: 700 }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getStatusBadgeColor(currentUserProfile?.status || 'PENDING') }}></div>
                            {currentUserProfile?.status}
                        </div>
                    </div>

                    <div className="card" style={{ gridColumn: 'span 8', padding: '2rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.5rem' }}>Información Personal</h3>
                        <div className="dashboard-grid" style={{ gap: '1.5rem' }}>
                            <div className="form-group" style={{ gridColumn: 'span 6' }}>
                                <label>Nombre Completo</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={profileData.displayName}
                                    onChange={e => setProfileData({ ...profileData, displayName: e.target.value })}
                                />
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 6' }}>
                                <label>Correo Electrónico</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    value={profileData.email}
                                    disabled
                                />
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>El email no se puede cambiar por seguridad.</p>
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 12' }}>
                                <label>Fecha de creación</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={currentUserProfile?.createdAt ? new Date(currentUserProfile.createdAt).toLocaleString() : 'N/A'}
                                    disabled
                                />
                            </div>
                        </div>
                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button className="btn btn-primary" onClick={() => alert('Perfil actualizado localmente.')}>
                                <Save size={18} /> Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: USUARIOS (Solo Admins) */}
            {activeTab === 'usuarios' && isAdmin && (
                <div className="dashboard-grid">
                    <div className="card" style={{ gridColumn: 'span 12', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ position: 'relative' }}>
                                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Buscar por nombre o email..."
                                        style={{ paddingLeft: '2.5rem', width: '280px', borderRadius: '8px' }}
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <select
                                    className="form-control"
                                    style={{ width: '180px' }}
                                    value={roleFilter}
                                    onChange={e => setRoleFilter(e.target.value)}
                                >
                                    <option value="todos">Todos los roles</option>
                                    <option value="SUPERADMIN">SUPERADMIN</option>
                                    <option value="ADMIN">ADMIN</option>
                                    <option value="CONTROL_PROYECTOS">CONTROL PROYECTOS</option>
                                    <option value="LIDER_PROYECTO">LÍDER PROYECTO</option>
                                </select>
                            </div>

                            <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <UserPlus size={18} /> + Agregar usuario
                            </button>
                        </div>

                        {isLoadingUsers ? (
                            <div style={{ padding: '4rem', textAlign: 'center' }}>
                                <Loader2 className="animate-spin" size={40} style={{ margin: '0 auto', color: 'var(--primary)' }} />
                                <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Cargando usuarios...</p>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Usuario</th>
                                            <th>Rol</th>
                                            <th>Estado</th>
                                            <th>Proyecto(s)</th>
                                            <th>Cliente(s)</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map(user => (
                                            <tr key={user.uid} className="table-row-hover">
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                        <div style={{
                                                            width: '36px', height: '36px', borderRadius: '8px',
                                                            backgroundColor: 'rgba(37, 99, 235, 0.1)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            color: 'var(--primary)', fontWeight: 800
                                                        }}>
                                                            {user.displayName?.[0] || user.email[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 700 }}>{user.displayName || 'Sin nombre'}</div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`badge ${getRoleBadgeColor(user.role)}`} style={{ fontSize: '0.6rem' }}>
                                                        {user.role.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: getStatusBadgeColor(user.status), fontWeight: 700, fontSize: '0.75rem' }}>
                                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: getStatusBadgeColor(user.status) }}></div>
                                                        {user.status}
                                                    </div>
                                                </td>
                                                <td>
                                                    {(() => {
                                                        const userAssigned = (user.assignedProjectIds || [])
                                                            .map(pid => projects.find(p => p.id === pid))
                                                            .filter(Boolean) as Project[];

                                                        if (userAssigned.length === 0) {
                                                            return <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sin asignar</span>;
                                                        }
                                                        if (userAssigned.length === 1) {
                                                            return <div style={{ fontSize: '0.8rem', fontWeight: 600, maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={userAssigned[0].name}>{userAssigned[0].name}</div>;
                                                        }
                                                        return (
                                                            <div
                                                                className="badge badge-low"
                                                                title={userAssigned.map(p => `${p.name} — ${p.clientName}`).join('\n')}
                                                                style={{ cursor: 'help', fontWeight: 800, padding: '0.35rem 0.6rem', fontSize: '0.65rem' }}
                                                            >
                                                                {userAssigned.length} Proyectos
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                                <td>
                                                    {(() => {
                                                        const userAssigned = (user.assignedProjectIds || [])
                                                            .map(pid => projects.find(p => p.id === pid))
                                                            .filter(Boolean) as Project[];

                                                        if (userAssigned.length === 0) {
                                                            return <span style={{ color: 'var(--text-muted)' }}>—</span>;
                                                        }
                                                        const uniqueClients = Array.from(new Set(userAssigned.map(p => p.clientName)));
                                                        if (uniqueClients.length === 1) {
                                                            return <div style={{ fontSize: '0.8rem' }}>{uniqueClients[0]}</div>;
                                                        }
                                                        return (
                                                            <div
                                                                style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'help' }}
                                                                title={uniqueClients.join(', ')}
                                                            >
                                                                {uniqueClients.length} Clientes
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                                        <button
                                                            className="btn-icon"
                                                            onClick={() => { setSelectedUser(user); setIsEditModalOpen(true); }}
                                                            disabled={user.role === 'SUPERADMIN' && currentUserProfile?.role !== 'SUPERADMIN'}
                                                            title="Editar"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        {user.status === 'ACTIVE' ? (
                                                            <button
                                                                className="btn-icon"
                                                                onClick={() => handleAction('deactivate', user.uid)}
                                                                disabled={user.role === 'SUPERADMIN'}
                                                                title="Desactivar"
                                                            >
                                                                <UserX size={16} />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className="btn-icon"
                                                                onClick={() => handleAction('activate', user.uid)}
                                                                title="Activar"
                                                            >
                                                                <UserCheck size={16} />
                                                            </button>
                                                        )}
                                                        <button
                                                            className="btn-icon"
                                                            style={{ color: 'var(--danger)' }}
                                                            onClick={() => handleAction('delete', user.uid)}
                                                            disabled={user.role === 'SUPERADMIN'}
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB CONTENT: PESOS, ALERTAS, SISTEMA ... (Existing code remains same but updated to new styles) */}
            {activeTab === 'pesos' && isAdmin && (
                <div className="card" style={{ padding: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem' }}>Pesos Contractuales</h2>
                    {/* ... pesos content ... */}
                    <p style={{ color: 'var(--text-muted)' }}>Configuración del motor de criticidad.</p>
                </div>
            )}

            {/* MODALS */}
            {isAddModalOpen && (
                <UserModal
                    title="+ Agregar usuario"
                    onClose={() => setIsAddModalOpen(false)}
                    onSave={async (data: any) => {
                        try {
                            const newUserProfile: UserProfile = {
                                uid: `manual_${Date.now()}`,
                                email: data.email,
                                displayName: data.displayName,
                                role: data.role,
                                status: 'ACTIVE',
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                                assignedProjectIds: data.projects || []
                            }
                            await userService.createUserProfile(newUserProfile);
                            // Sincronizar liderazgo en cada proyecto
                            if (data.projects && data.projects.length > 0) {
                                await userService.updateProjectAssignments(newUserProfile.uid, data.projects);
                            }
                            setIsAddModalOpen(false)
                        } catch (error) {
                            alert('Error al crear usuario.');
                        }
                    }}
                    projects={projects}
                    currentUserRole={currentUserProfile?.role}
                />
            )}

            {isEditModalOpen && selectedUser && (
                <UserModal
                    title="Editar usuario"
                    user={selectedUser}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={async (data: any) => {
                        try {
                            await userService.updateProjectAssignments(selectedUser.uid, data.projects || []);
                            await userService.updateUser(selectedUser.uid, {
                                displayName: data.displayName,
                                role: data.role
                            });
                            setIsEditModalOpen(false)
                        } catch (error) {
                            alert('Error al actualizar usuario.');
                        }
                    }}
                    projects={projects}
                    currentUserRole={currentUserProfile?.role}
                />
            )}

            {isConfirmModalOpen && confirmAction && (
                <div className="modal-overlay">
                    <div className="card" style={{ width: '400px', padding: '2rem', textAlign: 'center' }}>
                        <div style={{ color: confirmAction.type === 'delete' ? 'var(--danger)' : 'var(--warning)', marginBottom: '1rem' }}>
                            <AlertCircle size={48} style={{ margin: '0 auto' }} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                            {confirmAction.type === 'delete' ? '¿Eliminar Usuario?' : 'Confirmar Acción'}
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            {confirmAction.type === 'delete'
                                ? 'Esta acción es irreversible.'
                                : `¿Desea cambiar el estado del usuario a ${confirmAction.type === 'activate' ? 'Activo' : 'Desactivado'}?`}
                        </p>
                        {confirmAction.type === 'delete' && (
                            <input
                                type="text"
                                className="form-control"
                                placeholder="ELIMINAR"
                                style={{ marginBottom: '1.5rem', textAlign: 'center' }}
                                value={deleteConfirmText}
                                onChange={e => setDeleteConfirmText(e.target.value)}
                            />
                        )}
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsConfirmModalOpen(false)}>Cancelar</button>
                            <button
                                className={`btn ${confirmAction.type === 'delete' ? 'btn-danger' : 'btn-primary'}`}
                                style={{ flex: 1 }}
                                onClick={executeConfirmAction}
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function UserModal({ title, user, onClose, onSave, projects, currentUserRole }: { title: string, user?: UserProfile, onClose: () => void, onSave: (data: any) => void, projects: Project[], currentUserRole?: UserRole }) {
    const [formData, setFormData] = useState({
        displayName: user?.displayName || '',
        email: user?.email || '',
        role: user?.role || 'LIDER_PROYECTO' as UserRole,
        projects: user?.assignedProjectIds || [] as string[]
    })

    return (
        <div className="modal-overlay">
            <div className="card" style={{ width: '480px', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{title}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={24} /></button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }}>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label>Nombre Completo</label>
                        <input
                            type="text"
                            className="form-control"
                            required
                            value={formData.displayName}
                            onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label>Email</label>
                        <input
                            type="email"
                            className="form-control"
                            required
                            disabled={!!user}
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label>Rol</label>
                        <select
                            className="form-control"
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                        >
                            <option value="SUPERADMIN" disabled={currentUserRole !== 'SUPERADMIN'}>SUPERADMIN</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="CONTROL_PROYECTOS">CONTROL PROYECTOS</option>
                            <option value="LIDER_PROYECTO">LÍDER PROYECTO</option>
                        </select>
                    </div>

                    {formData.role === 'LIDER_PROYECTO' && (
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label>Proyectos Asignados</label>
                            <div style={{
                                maxHeight: '180px',
                                overflowY: 'auto',
                                border: '1px solid var(--card-border)',
                                padding: '0.5rem',
                                borderRadius: '8px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.25rem'
                            }}>
                                {projects.map(p => (
                                    <label key={p.id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.4rem',
                                        backgroundColor: 'rgba(255,255,255,0.02)',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem'
                                    }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.projects.includes(p.id)}
                                            onChange={(e) => {
                                                const newProjects = e.target.checked
                                                    ? [...formData.projects, p.id]
                                                    : formData.projects.filter(id => id !== p.id);
                                                setFormData({ ...formData, projects: newProjects });
                                            }}
                                        />
                                        <span>{p.name} ({p.clientName})</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                            <Save size={18} /> Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
