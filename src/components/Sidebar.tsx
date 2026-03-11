"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'
import {
    LayoutDashboard,
    FolderOpen,
    Settings,
    PlusCircle,
    FileText,
    ShieldCheck,
    Moon,
    Sun,
    LifeBuoy,
    LogOut,
    ShieldAlert,
} from 'lucide-react'
import { useTheme } from './ThemeProvider'
import { useAuth } from './AuthContext'
import { useSidebar } from './SidebarContext'
import { UserRole } from '@/types/contractual'

interface NavItem {
    label: string;
    icon: React.ComponentType<any>;
    href: string;
    roles?: UserRole[];
}

const Sidebar = () => {
    const pathname = usePathname()
    const { theme, toggleTheme } = useTheme()
    const { user, profile, logout } = useAuth()
    const { isCollapsed, toggleSidebar } = useSidebar()
    const [pendingUsersCount, setPendingUsersCount] = React.useState(0)

    const canCreateProjects = profile?.role === 'SUPERADMIN' || profile?.role === 'ADMIN' || profile?.role === 'CONTROL_PROYECTOS'
    const isAdmin = profile?.role === 'SUPERADMIN' || profile?.role === 'ADMIN'

    React.useEffect(() => {
        if (!isAdmin) return;

        const { userService } = require('@/lib/userService');
        const unsubscribe = userService.subscribeToUsers((users: any[]) => {
            const pending = users.filter((u: any) => u.status === 'PENDING').length;
            setPendingUsersCount(pending);
        });

        return () => unsubscribe();
    }, [isAdmin]);

    const topNavItems: NavItem[] = [
        { label: 'Tablero Principal', icon: LayoutDashboard, href: '/' },
        { label: 'Proyectos', icon: FolderOpen, href: '/proyectos' },
        { label: 'Documentación', icon: FileText, href: '/documentacion' },
        { label: 'Riesgos', icon: ShieldCheck, href: '/riesgos' },
        { label: 'Mitigación', icon: ShieldAlert, href: '/mitigacion' },
    ]

    return (
        <aside className="sidebar" style={{
            width: isCollapsed ? '80px' : '280px',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden'
        }}>
            {/* Header como Toggle de Sidebar */}
            <div
                className="sidebar-header"
                onClick={toggleSidebar}
                title={isCollapsed ? "Expandir menú" : "Contraer menú"}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: isCollapsed ? '1.5rem 0' : '1.5rem',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    marginBottom: '1rem'
                }}
            >
                <div style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: 'var(--primary)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 15px rgba(37, 99, 235, 0.4)',
                    flexShrink: 0
                }}>
                    <ShieldCheck size={20} style={{ color: '#fff' }} />
                </div>
                {!isCollapsed && (
                    <span style={{
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        color: '#fff',
                        letterSpacing: '-0.02em',
                        whiteSpace: 'nowrap',
                        opacity: 1,
                        transition: 'opacity 0.2s'
                    }}>
                        Radar Contractual
                    </span>
                )}
            </div>

            <nav className="sidebar-nav" style={{ flex: 1, padding: isCollapsed ? '0 0.75rem' : '0 1rem' }}>
                {topNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`nav-item ${pathname === item.href ? 'active' : ''}`}
                            style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}
                            title={isCollapsed ? item.label : ''}
                        >
                            <Icon size={22} style={{ flexShrink: 0 }} />
                            {!isCollapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            <div style={{ padding: isCollapsed ? '1rem 0.75rem' : '0 0.75rem 1.75rem' }}>
                {user && !isCollapsed && (
                    <div style={{
                        margin: '0 0.25rem 1.5rem',
                        padding: '1rem',
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <p style={{ fontSize: '0.7rem', color: 'var(--sidebar-text)', fontWeight: 700, textTransform: 'uppercase' }}>Seguridad</p>
                            {profile?.role && (
                                <span style={{
                                    fontSize: '0.55rem',
                                    padding: '0.15rem 0.4rem',
                                    borderRadius: '4px',
                                    backgroundColor: profile.role === 'SUPERADMIN' ? 'rgba(37, 99, 235, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                    color: profile.role === 'SUPERADMIN' ? 'var(--primary)' : 'var(--sidebar-text)',
                                    fontWeight: 800
                                }}>
                                    {profile.role.replace('_', ' ')}
                                </span>
                            )}
                        </div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.displayName || user.email}</p>
                    </div>
                )}

                <button
                    onClick={toggleTheme}
                    className="nav-item"
                    style={{
                        marginBottom: '0.5rem',
                        justifyContent: isCollapsed ? 'center' : 'flex-start'
                    }}
                    title={isCollapsed ? (theme === 'light' ? 'Modo Oscuro' : 'Modo Claro') : ''}
                >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    {!isCollapsed && <span>{theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}</span>}
                </button>

                <Link
                    href="/configuracion"
                    className={`nav-item ${pathname === '/configuracion' ? 'active' : ''}`}
                    style={{
                        marginBottom: '0.5rem',
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        position: 'relative'
                    }}
                    title={isCollapsed ? 'Configuración' : ''}
                >
                    <Settings size={20} />
                    {!isCollapsed && <span>Configuración</span>}
                    {isAdmin && pendingUsersCount > 0 && (
                        <div style={{
                            position: 'absolute',
                            top: isCollapsed ? '8px' : '12px',
                            right: isCollapsed ? '12px' : '16px',
                            width: '8px',
                            height: '8px',
                            backgroundColor: 'var(--danger)',
                            borderRadius: '50%',
                            border: '1.5px solid var(--sidebar-bg)',
                        }} />
                    )}
                </Link>

                <button
                    onClick={logout}
                    className="nav-item"
                    style={{
                        color: 'var(--danger)',
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        marginBottom: '0.5rem'
                    }}
                    title={isCollapsed ? 'Finalizar Sesión' : ''}
                >
                    <LogOut size={20} />
                    {!isCollapsed && <span>Finalizar Sesión</span>}
                </button>

                {canCreateProjects && (
                    <div style={{
                        marginTop: '1rem',
                        padding: isCollapsed ? '0' : '0 0.25rem',
                        display: 'flex',
                        justifyContent: 'center'
                    }}>
                        <Link
                            href="/proyectos/nuevo"
                            className="btn btn-primary"
                            style={{
                                width: isCollapsed ? '40px' : '100%',
                                height: isCollapsed ? '40px' : 'auto',
                                borderRadius: isCollapsed ? '50%' : '8px',
                                padding: isCollapsed ? '0' : '0.875rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            title={isCollapsed ? 'Nuevo Proyecto' : ''}
                        >
                            <PlusCircle size={isCollapsed ? 22 : 18} />
                            {!isCollapsed && <span style={{ marginLeft: '0.5rem' }}>Nuevo Proyecto</span>}
                        </Link>
                    </div>
                )}
            </div>
        </aside>
    )
}

export default Sidebar
