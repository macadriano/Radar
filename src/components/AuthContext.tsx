"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    User,
    signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { UserProfile, UserRole } from '@/types/contractual';

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    logout: () => Promise<void>;
    firebaseConfigured: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    logout: async () => { },
    firebaseConfigured: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();
    const firebaseConfigured = auth !== null && db !== null;

    useEffect(() => {
        if (!auth || !db) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setLoading(true);
            if (firebaseUser) {
                setUser(firebaseUser);

                const fetchOrCreateProfile = async (retryCount = 0): Promise<void> => {
                    const userDocRef = doc(db, 'users', firebaseUser.uid);
                    try {
                        const userDoc = await getDoc(userDocRef);

                        if (userDoc.exists()) {
                            let profileData = userDoc.data() as UserProfile;

                            // Force SuperAdmin status if email matches criteria (Emergency failsafe)
                            const isSuperAdminEmail = firebaseUser.email === 'chbielich@tgi.pe' || firebaseUser.email?.endsWith('@tgi.com.co');
                            if (isSuperAdminEmail && profileData.role !== 'SUPERADMIN') {
                                profileData = { ...profileData, role: 'SUPERADMIN', status: 'ACTIVE' };
                            }

                            setProfile(profileData);
                        } else {
                            // Registration fallback or first-time login
                            const isSuperAdmin = firebaseUser.email === 'chbielich@tgi.pe' || firebaseUser.email?.endsWith('@tgi.com.co');
                            const newProfile: UserProfile = {
                                uid: firebaseUser.uid,
                                email: firebaseUser.email!,
                                displayName: firebaseUser.displayName || '',
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
                            setProfile(newProfile);
                        }
                    } catch (error: unknown) {
                        const isOffline = error && typeof error === 'object' && 'message' in error &&
                            String((error as { message?: string }).message).toLowerCase().includes('offline');
                        if (isOffline && retryCount < 2) {
                            await new Promise(r => setTimeout(r, 800 + retryCount * 600));
                            return fetchOrCreateProfile(retryCount + 1);
                        }
                        console.error('Error fetching/creating user profile:', error);
                    } finally {
                        setLoading(false);
                    }
                };

                await fetchOrCreateProfile();
                return;
            } else {
                setUser(null);
                setProfile(null);
                if (pathname !== '/login' && pathname !== '/register') {
                    router.push('/login');
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [pathname, router]);

    const logout = async () => {
        if (!auth) return;
        try {
            await firebaseSignOut(auth);
            router.push('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, logout, firebaseConfigured }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
