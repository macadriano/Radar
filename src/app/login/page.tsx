"use client"

import { useState } from 'react';
import {
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, Chrome, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        if (!auth) {
            setError('Firebase no está configurado correctamente en este entorno.');
            setLoading(false);
            return;
        }
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/');
        } catch (err: any) {
            setError('Credenciales inválidas. Por favor intente de nuevo.');
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        const provider = new GoogleAuthProvider();
        if (!auth) {
            setError('Firebase no está configurado correctamente en este entorno.');
            setLoading(false);
            return;
        }
        try {
            await signInWithPopup(auth, provider);
            router.push('/');
        } catch (err: any) {
            setError('No se pudo iniciar sesión con Google.');
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            width: '100vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--sidebar-bg)',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 1000
        }}>
            <div className="card" style={{
                width: '100%',
                maxWidth: '420px',
                padding: '3rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                border: '1px solid var(--glass-border)',
                background: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(20px)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        backgroundColor: 'var(--primary)',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        boxShadow: '0 0 30px rgba(37, 99, 235, 0.5)'
                    }}>
                        <ShieldCheck size={40} style={{ color: '#fff' }} />
                    </div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
                        Radar Contractual
                    </h1>
                    <p style={{ color: 'var(--sidebar-text)', fontSize: '0.875rem' }}>
                        Acceso al Sistema de Alerta Temprana
                    </p>
                </div>

                {error && (
                    <div style={{
                        padding: '0.75rem',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid var(--danger)',
                        borderRadius: '8px',
                        color: 'var(--danger)',
                        fontSize: '0.875rem',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-group">
                        <label style={{ color: 'var(--sidebar-text)', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Correo Corporativo
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                            <input
                                type="email"
                                className="form-control"
                                placeholder="nombre@compania.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{ paddingLeft: '2.75rem', backgroundColor: 'rgba(2, 6, 23, 0.5)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label style={{ color: 'var(--sidebar-text)', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Clave Secreta
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                            <input
                                type="password"
                                className="form-control"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{ paddingLeft: '2.75rem', backgroundColor: 'rgba(2, 6, 23, 0.5)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ padding: '0.875rem', width: '100%', marginTop: '0.5rem' }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Autorizar Acceso'}
                    </button>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
                    O CONTINUAR CON
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    className="btn btn-secondary"
                    disabled={loading}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        backgroundColor: 'transparent',
                        color: '#fff',
                        borderColor: 'rgba(255,255,255,0.1)'
                    }}
                >
                    <Chrome size={20} />
                    Google Identity
                </button>

                <div style={{ textAlign: 'center', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>¿No tienes una cuenta? </span>
                    <Link href="/register" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
                        Crear cuenta
                    </Link>
                </div>

                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    El acceso no autorizado está estrictamente prohibido y monitoreado.
                </p>
            </div>
        </div>
    );
}
