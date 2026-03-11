import {
    collection,
    query,
    where,
    onSnapshot,
    orderBy,
    getDocs,
    doc,
    deleteDoc,
    setDoc,
    serverTimestamp,
    updateDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { Document, DocumentType, UserRole } from '../types/contractual';

const COLLECTION_NAME = 'documents';

export const documentService = {
    /**
     * Suscribirse a los documentos de un proyecto
     */
    subscribeToProjectDocuments(projectId: string, callback: (docs: Document[]) => void) {
        if (!projectId) return () => { };

        const q = query(
            collection(db, COLLECTION_NAME),
            where('projectId', '==', projectId),
            orderBy('createdAt', 'desc') // Usamos createdAt (server side) para confiabilidad
        );

        return onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Manejo de fallback para fechas si el serverTimestamp aún no llega
                createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
            } as Document));
            callback(docs);
        }, (error) => {
            console.error("Error subscribiendo a documentos del proyecto:", error);
        });
    },

    /**
     * Suscribirse a todos los documentos (Admin / Auditoría)
     */
    subscribeToAllDocuments(callback: (docs: Document[]) => void) {
        const q = query(
            collection(db, COLLECTION_NAME),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
            } as Document));
            callback(docs);
        }, (error) => {
            console.error("Error subscribiendo a todos los documentos:", error);
        });
    },

    /**
     * Crear el registro inicial del documento (Traceability Fix)
     * Se crea ANTES de subir a storage para asegurar que aparezca en la lista "procesando"
     */
    async createDocumentRecord(data: {
        projectId: string;
        name: string;
        type: DocumentType;
        uploadedByUid: string;
        uploadedByRole: UserRole;
        fileName: string;
        mimeType: string;
        author: string;
    }): Promise<string> {
        const docRef = doc(collection(db, COLLECTION_NAME));
        const newDoc: Partial<Document> = {
            id: docRef.id,
            projectId: data.projectId,
            name: data.name,
            type: data.type,
            uploadDate: new Date().toISOString(),
            createdAt: serverTimestamp(),
            author: data.author,
            version: '1.0',
            status: 'PENDING',
            analysisStatus: 'PROCESSING',
            uploadedByUid: data.uploadedByUid,
            uploadedByRole: data.uploadedByRole,
            fileName: data.fileName,
            mimeType: data.mimeType,
            counts: {
                activities: 0,
                incidents: 0,
                risks: 0
            }
        };

        await setDoc(docRef, newDoc);
        return docRef.id;
    },

    /**
     * Actualizar URL y Status después de subida existosa a Storage
     */
    async finalizeUpload(docId: string, url: string, storagePath: string): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, docId);
        await updateDoc(docRef, {
            url,
            storagePath,
            status: 'PROCESSING' // Pasa a procesamiento IA/Determinista
        });
    },

    async deleteDocument(docId: string): Promise<void> {
        await deleteDoc(doc(db, COLLECTION_NAME, docId));
    }
};
