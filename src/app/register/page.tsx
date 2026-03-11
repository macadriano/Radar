"use client"

import { useState } from 'react';
import {
    createUserWithEmailAndPassword,
    updateProfile
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { ShieldCheck, User, Mail, Lock, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { UserProfile } from '@/types/contractual';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;

            // 2. Update Auth Profile
            await updateProfile(firebaseUser, { displayName: name });

            // 3. Create Firestore Profile
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const isSuperAdmin = email === 'chbielich@tgi.pe' || email.endsWith('@tgi.com.co');

            const newProfile: UserProfile = {
                uid: firebaseUser.uid,
                email: email,
                displayName: name,
                role: isSuperAdmin ? 'SUPERADMIN' : 'LIDER_PROYECTO',
                status: isSuperAdmin ? 'ACTIVE' : 'PENDING',
                assignedProjectIds: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            await setDoc(userDocRef, {
                ...newProfile,
                createdAt: serverTimestamp()
            });

            setSuccess(true);
            setTimeout(() => {
                router.push('/login');
            }, 3000);

        } catch (err: any) {
            console.error('Registration error:', err);
            if (err.code === 'auth/email-already-in-use') {
                setError('El correo ya está registrado.');
            } else {
                setError('Ocurrió un error al crear la cuenta.');
            }
            setLoading(false);
        }
    };

    if (success) {
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
                <div className="card" style={{ maxWidth: '420px', padding: '3rem', textAlign: 'center', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ width: '64px', height: '64px', backgroundColor: 'var(--success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                        <ShieldCheck size={40} style={{ color: '#fff' }} />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '1rem' }}>Solicitud Enviada</h2>
                    <p style={{ color: 'var(--sidebar-text)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                        Tu cuenta ha sido creada como <strong>PENDIENTE DE APROBACIÓN</strong>.
                        Un administrador validará tus credenciales pronto.
                    </p>
                    <p style={{ marginTop: '1.5rem', color: 'var(--primary)', fontSize: '0.75rem' }}>Redirigiendo al login...</p>
                </div>
            </div>
        );
    }

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
                        Crear Cuenta
                    </h1>
                    <p style={{ color: 'var(--sidebar-text)', fontSize: '0.875rem' }}>
                        Registro para Radar Contractual
                    </p>
                </div>

                {error && (
                    <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: '8px', color: 'var(--danger)', fontSize: '0.875rem', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-group">
                        <label style={{ color: 'var(--sidebar-text)', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block', textTransform: 'uppercase' }}>Nombre Completo</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Juan Pérez"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                style={{ paddingLeft: '2.75rem', backgroundColor: 'rgba(2, 6, 23, 0.5)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label style={{ color: 'var(--sidebar-text)', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block', textTransform: 'uppercase' }}>Correo Corporativo</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                            <input
                                type="email"
                                className="form-control"
                                placeholder="nombre@tgi.com.co"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{ paddingLeft: '2.75rem', backgroundColor: 'rgba(2, 6, 23, 0.5)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label style={{ color: 'var(--sidebar-text)', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block', textTransform: 'uppercase' }}>Contraseña</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                            <input
                                type="password"
                                className="form-control"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={6}
                                required
                                style={{ paddingLeft: '2.75rem', backgroundColor: 'rgba(2, 6, 23, 0.5)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '0.875rem', width: '100%', marginTop: '0.5rem' }}>
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Registrar Solicitud'}
                    </button>
                </form>

                <Link href="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--primary)', fontSize: '0.875rem', textDecoration: 'none', fontWeight: 600 }}>
                    <ArrowLeft size={16} /> Volver al Login
                </Link>
            </div>
        </div>
    );
}
