import { requireDb } from './firebase';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    updateDoc,
    deleteDoc,
    query,
    onSnapshot,
    setDoc,
    writeBatch
} from 'firebase/firestore';
import { UserProfile, UserRole, UserStatus } from '@/types/contractual';

export const userService = {
    /**
     * Obtener todos los usuarios
     */
    async getAllUsers(): Promise<UserProfile[]> {
        const db = requireDb();
        const querySnapshot = await getDocs(collection(db, 'users'));
        return querySnapshot.docs.map(doc => doc.data() as UserProfile);
    },

    /**
     * Obtener un usuario específico
     */
    async getUser(uid: string): Promise<UserProfile | null> {
        const db = requireDb();
        if (!uid) return null;
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() as UserProfile : null;
    },

    /**
     * Suscripción en tiempo real a usuarios
     */
    subscribeToUsers(callback: (users: UserProfile[]) => void) {
        const db = requireDb();
        return onSnapshot(collection(db, 'users'), (snapshot) => {
            const users = snapshot.docs.map(doc => doc.data() as UserProfile);
            callback(users);
        });
    },

    /**
     * Actualizar perfil de usuario
     */
    async updateUser(uid: string, updates: Partial<UserProfile>): Promise<void> {
        const db = requireDb();
        const userDocRef = doc(db, 'users', uid);
        await updateDoc(userDocRef, {
            ...updates,
            updatedAt: new Date().toISOString()
        });
    },

    /**
     * Crear perfil de usuario manualmente
     */
    async createUserProfile(profile: UserProfile): Promise<void> {
        const db = requireDb();
        const userDocRef = doc(db, 'users', profile.uid);
        await setDoc(userDocRef, {
            ...profile,
            createdAt: profile.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    },

    /**
     * Eliminar usuario
     */
    async deleteUser(uid: string): Promise<void> {
        const db = requireDb();
        const userDocRef = doc(db, 'users', uid);
        await deleteDoc(userDocRef);
    },

    /**
     * Asignar múltiples proyectos a un usuario con sincronización bidireccional atómica
     */
    async updateProjectAssignments(uid: string, projectIds: string[]): Promise<void> {
        const db = requireDb();
        const user = await this.getUser(uid);
        if (!user) return;

        const oldProjects = user.assignedProjectIds || [];
        const toAdd = projectIds.filter(id => !oldProjects.includes(id));
        const toRemove = oldProjects.filter(id => !projectIds.includes(id));

        const batch = writeBatch(db);

        // 1. Actualizar Usuario
        const userRef = doc(db, 'users', uid);
        batch.update(userRef, {
            assignedProjectIds: projectIds,
            updatedAt: new Date().toISOString()
        });

        // 2. Proyectos a Añadir
        for (const pid of toAdd) {
            const projectRef = doc(db, 'projects', pid);
            batch.update(projectRef, {
                leaderUid: uid,
                leaderName: user.displayName || user.email,
                leaderEmail: user.email
            });
        }

        // 3. Proyectos a Quitar
        for (const pid of toRemove) {
            const projectRef = doc(db, 'projects', pid);
            // Solo quitar si sigue siendo el líder
            batch.update(projectRef, {
                leaderUid: '',
                leaderName: '',
                leaderEmail: ''
            });
        }

        await batch.commit();
    }
};
