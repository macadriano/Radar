"use client"

import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/components/AuthContext";
import { useSidebar } from "@/components/SidebarContext";
import { usePathname } from "next/navigation";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const { user, firebaseConfigured } = useAuth();
    const { isCollapsed } = useSidebar();
    const pathname = usePathname();

    if (!firebaseConfigured) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                backgroundColor: '#0f172a',
                color: '#e2e8f0',
                fontFamily: 'system-ui, sans-serif'
            }}>
                <div style={{
                    maxWidth: '520px',
                    padding: '2rem',
                    background: '#1e293b',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.3)'
                }}>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#f8fafc' }}>
                        Firebase no configurado
                    </h1>
                    <p style={{ marginBottom: '1.5rem', color: '#94a3b8', lineHeight: 1.6 }}>
                        El error <strong>auth/invalid-api-key</strong> indica que faltan las variables de entorno de Firebase.
                    </p>
                    <ol style={{ marginBottom: '1.5rem', paddingLeft: '1.5rem', color: '#cbd5e1', lineHeight: 2 }}>
                        <li>Crea un archivo <code style={{ background: '#334155', padding: '2px 6px', borderRadius: '4px' }}>.env.local</code> en la raíz del proyecto (carpeta <code style={{ background: '#334155', padding: '2px 6px', borderRadius: '4px' }}>Radar</code>).</li>
                        <li>Copia las variables desde <code style={{ background: '#334155', padding: '2px 6px', borderRadius: '4px' }}>.env.example</code> y rellena los valores de tu proyecto de Firebase.</li>
                        <li>Entra en <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa' }}>console.firebase.google.com</a> → tu proyecto → Configuración (engranaje) → Tus apps → SDK de web.</li>
                        <li>Guarda <code style={{ background: '#334155', padding: '2px 6px', borderRadius: '4px' }}>.env.local</code>, reinicia el servidor (<code style={{ background: '#334155', padding: '2px 6px', borderRadius: '4px' }}>Ctrl+C</code> y luego <code style={{ background: '#334155', padding: '2px 6px', borderRadius: '4px' }}>npm run dev</code>) y recarga el navegador.</li>
                    </ol>
                    <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                        Variables necesarias: <code style={{ background: '#334155', padding: '2px 6px', borderRadius: '4px' }}>NEXT_PUBLIC_FIREBASE_API_KEY</code>, <code style={{ background: '#334155', padding: '2px 6px', borderRadius: '4px' }}>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</code>, <code style={{ background: '#334155', padding: '2px 6px', borderRadius: '4px' }}>NEXT_PUBLIC_FIREBASE_PROJECT_ID</code>, etc.
                    </p>
                </div>
            </div>
        );
    }

    const isLoginPage = pathname === '/login';
    const showSidebar = user && !isLoginPage;

    const sidebarWidth = isCollapsed ? '80px' : '280px';

    return (
        <div className="layout">
            {showSidebar && <Sidebar />}
            <main
                className={showSidebar ? "main-content" : ""}
                style={{
                    flex: 1,
                    width: showSidebar ? `calc(100% - ${sidebarWidth})` : '100%',
                    marginLeft: showSidebar ? sidebarWidth : '0',
                    transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    minHeight: '100vh',
                    backgroundColor: 'var(--background)'
                }}
            >
                {children}
            </main>
        </div>
    );
}
