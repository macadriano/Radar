import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    getDoc,
    query,
    where,
    onSnapshot,
    orderBy,
    writeBatch,
    arrayUnion,
    arrayRemove,
    serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Project, ProjectStatus, UserProfile, TeamMember, TeamMemberRole } from '../types/contractual';

const COLLECTION_NAME = 'projects';

export const projectService = {
    /**
     * Obtener todos los proyectos (Admin)
     */
    async getAllProjects(): Promise<Project[]> {
        const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
    },

    async getProjectsByLeader(leaderUid: string): Promise<Project[]> {
        const q = query(collection(db, COLLECTION_NAME), where('leaderUid', '==', leaderUid));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
    },

    /**
     * Suscripción en tiempo real con filtrado por rol y membresía de equipo
     */
    subscribeToProjects(callback: (projects: Project[]) => void, role?: string, uid?: string) {
        // Por defecto, consulta amplia (Admin ve todo)
        let q = query(collection(db, COLLECTION_NAME), orderBy('name'));

        // Si es LIDER_PROYECTO, debe ver donde es LIDER o MIEMBRO
        // Nota: Firestore no soporta OR complejo en queries simples fácilmente sobre arrays y campos
        // Usaremos assignedProjectIds del usuario como filtro alternativo si es necesario, 
        // pero aquí mantenemos la lógica de suscripción base.
        if (role === 'LIDER_PROYECTO' && uid) {
            // Un líder ve proyectos donde es el líder principal
            q = query(collection(db, COLLECTION_NAME), where('leaderUid', '==', uid));
            // Los proyectos donde es 'miembro' se manejan usualmente por assignedProjectIds en el Profile
        }

        return onSnapshot(q, (snapshot) => {
            const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
            callback(projects);
        }, (error) => {
            console.error("Error subscribiendo a proyectos:", error);
        });
    },

    /**
     * Crear un nuevo proyecto con equipo inicial
     */
    async createProject(project: Omit<Project, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...project,
            team: project.team || []
        });

        // Sincronizar con el líder
        if (project.leaderUid) {
            const { userService } = require('./userService');
            await userService.updateProjectAssignments(project.leaderUid, [docRef.id], []);
        }

        return docRef.id;
    },

    async updateProject(id: string, updates: Partial<Project>): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, updates);
    },

    async getProject(id: string): Promise<Project | null> {
        if (!id) return null;
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as Project;
            }
        } catch (e) {
            console.error("Error fetching project:", e);
        }
        return null;
    },

    /**
     * GESTIÓN DE EQUIPO: Agregar miembro
     */
    async addTeamMember(projectId: string, member: TeamMember): Promise<void> {
        const batch = writeBatch(db);
        const { userService } = require('./userService');

        // 1. Agregar al array del proyecto
        const projectRef = doc(db, COLLECTION_NAME, projectId);
        batch.update(projectRef, {
            team: arrayUnion(member)
        });

        // 2. Sincronizar con el usuario
        const userDoc = await userService.getUser(member.uid);
        if (userDoc) {
            const assigned = userDoc.assignedProjectIds || [];
            if (!assigned.includes(projectId)) {
                const userRef = doc(db, 'users', member.uid);
                batch.update(userRef, {
                    assignedProjectIds: arrayUnion(projectId),
                    updatedAt: new Date().toISOString()
                });
            }
        }

        await batch.commit();
    },

    /**
     * GESTIÓN DE EQUIPO: Quitar miembro
     */
    async removeTeamMember(projectId: string, memberUid: string): Promise<void> {
        const project = await this.getProject(projectId);
        if (!project) return;

        // No permitir quitar al líder principal desde este método
        if (project.leaderUid === memberUid) {
            throw new Error("No se puede eliminar al líder principal del equipo. Cambie el líder primero.");
        }

        const batch = writeBatch(db);
        const { userService } = require('./userService');

        // 1. Remover del array del proyecto
        const memberToRemove = project.team.find(m => m.uid === memberUid);
        if (memberToRemove) {
            const projectRef = doc(db, COLLECTION_NAME, projectId);
            batch.update(projectRef, {
                team: arrayRemove(memberToRemove)
            });
        }

        // 2. Sincronizar con el usuario (quitar assignedProjectId)
        // Solo si no es ADMIN (los admins ven todo igual)
        const userDoc = await userService.getUser(memberUid);
        if (userDoc && userDoc.role !== 'SUPERADMIN' && userDoc.role !== 'ADMIN') {
            const userRef = doc(db, 'users', memberUid);
            batch.update(userRef, {
                assignedProjectIds: arrayRemove(projectId),
                updatedAt: new Date().toISOString()
            });
        }

        await batch.commit();
    },

    /**
     * GESTIÓN DE EQUIPO: Actualizar rol
     */
    async updateMemberRole(projectId: string, memberUid: string, newRole: TeamMemberRole): Promise<void> {
        const project = await this.getProject(projectId);
        if (!project) return;

        const updatedTeam = project.team.map(m => {
            if (m.uid === memberUid) {
                return { ...m, roleInProject: newRole };
            }
            return m;
        });

        const projectRef = doc(db, COLLECTION_NAME, projectId);
        await updateDoc(projectRef, { team: updatedTeam });
    },

    /**
     * Asignar líder (fuente de verdad principal)
     */
    async assignLeader(projectId: string, leaderUid: string, previousLeaderUid?: string): Promise<void> {
        const batch = writeBatch(db);
        const { userService } = require('./userService');

        const leaderDoc = await userService.getUser(leaderUid);
        if (!leaderDoc) throw new Error("Usuario no encontrado");

        // 1. Actualizar proyecto
        const projectRef = doc(db, COLLECTION_NAME, projectId);
        batch.update(projectRef, {
            leaderUid: leaderUid,
            leaderName: leaderDoc.displayName || leaderDoc.email,
            leaderEmail: leaderDoc.email
        });

        // 2. Asegurar que esté en el equipo como LIDER
        const projectDoc = await this.getProject(projectId);
        if (projectDoc) {
            const isAlreadyInTeam = projectDoc.team.some(m => m.uid === leaderUid);
            if (!isAlreadyInTeam) {
                const newMember: TeamMember = {
                    uid: leaderUid,
                    roleInProject: 'LIDER',
                    addedAt: new Date().toISOString(),
                    addedByUid: 'SYSTEM',
                    displayName: leaderDoc.displayName,
                    email: leaderDoc.email
                };
                batch.update(projectRef, { team: arrayUnion(newMember) });
            } else {
                // Actualizar rol a LIDER si ya estaba
                const updatedTeam = projectDoc.team.map(m =>
                    m.uid === leaderUid ? { ...m, roleInProject: 'LIDER' as TeamMemberRole } : m
                );
                batch.update(projectRef, { team: updatedTeam });
            }
        }

        // 3. Sync User assignedProjectIds
        const userRef = doc(db, 'users', leaderUid);
        batch.update(userRef, {
            assignedProjectIds: arrayUnion(projectId)
        });

        await batch.commit();
    }
};

// --- Contract Assistant ---
export interface ExtractedData {
    amount?: number;
    currency?: string;
    startDate?: string;
    endDate?: string;
    clientName?: string;
    contractId?: string;
    name?: string;
}

export const simulateExtraction = async (fileName: string): Promise<ExtractedData> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    if (fileName.toLowerCase().includes('cusiana')) {
        return {
            amount: 45850000,
            currency: 'USD',
            startDate: '2026-02-01',
            endDate: '2027-02-01',
            clientName: 'Ecopetrol S.A.',
            contractId: 'CTR-CUS-2026-001',
            name: 'Sistema de Compresión Cusiana - Fase II'
        };
    }
    return {
        amount: 1500000,
        currency: 'USD',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 31536000000).toISOString().split('T')[0],
        clientName: 'TGI S.A. ESP',
        contractId: 'CTR-' + Math.random().toString(36).substring(7).toUpperCase(),
        name: fileName.split('.')[0].replace(/_/g, ' ')
    };
};
